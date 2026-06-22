import React, { useState, useCallback, useEffect, useRef } from 'react'
import Header from './components/Header'
import VideoAvatar from './components/VideoAvatar'
import ChatHistory from './components/ChatHistory'
import ChatInput from './components/ChatInput'
import InstallBanner from './components/InstallBanner'
import { streamChat, estimateHistoryTokens, pruneHistory, API_URL, API_HEALTH_URL } from './lib/api'
import { getSessionId, loadMessages, saveMessages } from './lib/db'
import { speak, cancel as cancelTTS, resetProgress, getOffset, isSupported } from './lib/tts'

const SYSTEM_PROMPTS = {
  E: 'Eres MarIA, el asistente virtual academico de la UNEFA Nucleo Apure. El usuario es un estudiante. Responde de forma clara, breve y util sobre reglamentos, calendario academico, tramites y vida universitaria.',
  O: 'Eres MarIA, el asistente virtual academico de la UNEFA Nucleo Apure. El usuario es personal docente o administrativo. Responde de forma clara, breve y util.',
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function App() {
  const [role, setRole] = useState('E')
  const [messages, setMessages] = useState([])
  const messagesRef = useRef(messages)
  const [avatarState, setAvatarState] = useState('IDLE')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [serverStatus, setServerStatus] = useState('unknown')
  const [lastAssistantText, setLastAssistantText] = useState('')
  const lastAssistantTextRef = useRef('')
  const abortCtrlRef = useRef(null)
  const streamingRef = useRef(false)
  const assistantTextLengthRef = useRef(0)
  const [speakingId, setSpeakingId] = useState(null)
  const speakingIdRef = useRef(null)

  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    speakingIdRef.current = speakingId
  }, [speakingId])

  // Avatar state driven by TTS: SPEAKING while any audio plays, IDLE when done
  useEffect(() => {
    if (speakingId) {
      setAvatarState('SPEAKING')
    } else if (!streamingRef.current) {
      setAvatarState('IDLE')
    }
  }, [speakingId])

  // Restore messages on mount
  useEffect(() => {
    loadMessages(getSessionId()).then((msgs) => {
      if (msgs.length > 0) setMessages(msgs)
    })
  }, [])

  // Persist messages on change
  useEffect(() => {
    saveMessages(getSessionId(), messages)
  }, [messages])

  // Online/offline events
  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  // Server health polling
  useEffect(() => {
    const checkServer = async () => {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 8000)
      const start = performance.now()
      try {
        await fetch(API_HEALTH_URL, { method: 'GET', signal: ctrl.signal })
        clearTimeout(t)
        const elapsed = performance.now() - start
        if (elapsed < 3000) setServerStatus('online')
        else setServerStatus('slow')
      } catch {
        clearTimeout(t)
        setServerStatus('offline')
      }
    }
    checkServer()
    const id = setInterval(checkServer, 15000)
    return () => clearInterval(id)
  }, [])

  const handleStop = useCallback(() => {
    if (abortCtrlRef.current) {
      abortCtrlRef.current.abort()
      abortCtrlRef.current = null
    }
    streamingRef.current = false
    assistantTextLengthRef.current = 0
    if (speakingIdRef.current) {
      cancelTTS()
      resetProgress(speakingIdRef.current)
      speakingIdRef.current = null
      setSpeakingId(null)
    }
    setAvatarState('IDLE')
  }, [])

  const speakById = useCallback((id, text, offset = 0) => {
    if (!text || !isSupported()) return
    speak(id, text, {
      offset,
      onStart: () => {
        speakingIdRef.current = id
        setSpeakingId(id)
      },
      onEnd: () => {
        speakingIdRef.current = null
        setSpeakingId(null)
      },
      onError: () => {
        speakingIdRef.current = null
        setSpeakingId(null)
      },
    })
  }, [])

  const toggleSpeak = useCallback((id, text) => {
    const current = speakingIdRef.current
    if (current === id) {
      cancelTTS()
      return
    }
    if (current) {
      cancelTTS()
      resetProgress(current)
      speakingIdRef.current = null
      setSpeakingId(null)
      setTimeout(() => speakById(id, text, getOffset(id)), 0)
      return
    }
    speakById(id, text, getOffset(id))
  }, [speakById])

  const handleSendMessage = useCallback(
    async (text) => {
      if (!isOnline || serverStatus === 'offline') return

      // Abort any existing stream
      if (abortCtrlRef.current) {
        abortCtrlRef.current.abort()
      }

      const userMsg = { role: 'user', text, id: generateId() }
      setMessages((prev) => [...prev, userMsg])
      setLastAssistantText('')
      lastAssistantTextRef.current = ''

      // Cancel any active TTS before starting new stream
      if (speakingIdRef.current) {
        cancelTTS()
        resetProgress(speakingIdRef.current)
        speakingIdRef.current = null
        setSpeakingId(null)
      }

      setAvatarState('THINKING')
      streamingRef.current = true
      assistantTextLengthRef.current = 0

      const abortCtrl = new AbortController()
      abortCtrlRef.current = abortCtrl

      // Context guard: prune old history if prompt would exceed limit
      const prunedHistory = pruneHistory(messagesRef.current, text)

      const apiMessages = [
        ...prunedHistory.map((m) => ({ role: m.role, content: m.text })),
        { role: 'user', content: text },
      ]

      let assistantMsgId = null

      await streamChat({
        messages: apiMessages,
        onFirstToken: () => {
          assistantMsgId = generateId()
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', text: '', id: assistantMsgId },
          ])
          setAvatarState('SPEAKING')
        },
        onToken: (content) => {
          assistantTextLengthRef.current += content.length
          lastAssistantTextRef.current += content
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last && last.role === 'assistant' && last.id === assistantMsgId) {
              const updated = [...prev]
              updated[updated.length - 1] = {
                ...last,
                text: last.text + content,
              }
              return updated
            }
            return prev
          })
        },
        onDone: () => {
          streamingRef.current = false
          abortCtrlRef.current = null

          const textLength = assistantTextLengthRef.current
          assistantTextLengthRef.current = 0

          if (textLength === 0) {
            // Empty response → error immediately
            setAvatarState('IDLE')
            setLastAssistantText('')
            setMessages((prev) => {
              const last = prev[prev.length - 1]
              if (last && last.role === 'assistant' && !last.text) {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  ...last,
                  text: 'El servidor no respondio. Intenta de nuevo.',
                  isError: true,
                }
                return updated
              }
              return prev
            })
          } else {
            const finalText = lastAssistantTextRef.current
            if (finalText) {
              setLastAssistantText(finalText)
              speakById(assistantMsgId, finalText, 0)
            }
            lastAssistantTextRef.current = ''
            // Fallback for browsers without TTS: transition to IDLE after typewriter
            if (!isSupported()) {
              const revealMs = Math.ceil(textLength / 4) * 12 + 200
              setTimeout(() => {
                if (!streamingRef.current && !speakingIdRef.current) {
                  setAvatarState('IDLE')
                }
              }, revealMs)
            }
          }
        },
        onError: (type, detail) => {
          streamingRef.current = false
          abortCtrlRef.current = null
          setLastAssistantText('')
          setServerStatus('offline')
          setAvatarState('ERROR')
          const errorText = type === 'server'
            ? `Error del servidor: ${detail || 'desconocido'}. [Reintentar]`
            : 'No se pudo conectar. Verifica tu conexion. [Reintentar]'
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', text: errorText, id: generateId(), isError: true },
          ])
        },
        signal: abortCtrl.signal,
      })
    },
    [role, isOnline]
  )

  const handleRetry = useCallback(
    (msgIndex) => {
      const msgs = messagesRef.current
      const errorMsg = msgs[msgIndex]
      if (!errorMsg?.isError) return
      let userIndex = msgIndex - 1
      while (userIndex >= 0 && msgs[userIndex].role !== 'user') {
        userIndex--
      }
      if (userIndex < 0) return
      const userText = msgs[userIndex].text
      const sliced = msgs.slice(0, msgIndex)
      setMessages(sliced)
      messagesRef.current = sliced
      handleSendMessage(userText)
    },
    [handleSendMessage]
  )

  const handleClearChat = useCallback(async () => {
    // Cancelar cualquier streaming en curso
    if (abortCtrlRef.current) {
      abortCtrlRef.current.abort()
      abortCtrlRef.current = null
    }
    streamingRef.current = false

    // Cancelar TTS si está hablando
    if (speakingIdRef.current) {
      cancelTTS()
      resetProgress(speakingIdRef.current)
      speakingIdRef.current = null
      setSpeakingId(null)
    }

    // Limpiar estado local
    setMessages([])
    messagesRef.current = []
    lastAssistantTextRef.current = ''
    assistantTextLengthRef.current = 0
    setLastAssistantText('')
    setAvatarState('IDLE')

    // Limpiar IndexedDB
    try {
      const sessionId = getSessionId()
      const { clearSession } = await import('./lib/db')
      await clearSession(sessionId)
      console.log('[App] Chat cleared')
    } catch (err) {
      console.error('[App] Error clearing session:', err)
    }
  }, [])

  return (
    <div className="flex overflow-hidden relative flex-col w-full h-dvh bg-surface-900 noise-overlay font-body">
      <div className="flex relative z-10 flex-col h-full">
        <Header
          selectedRole={role}
          onRoleChange={setRole}
          serverStatus={serverStatus}
          onClearChat={handleClearChat}
        />

        <VideoAvatar
          avatarState={avatarState}
          lastAssistantText={lastAssistantText}
          speakingId={speakingId}
          onToggleSpeak={toggleSpeak}
        />

        <InstallBanner />

        <div className="flex flex-col max-h-[45vh] sm:max-h-[40vh] border-t border-white/[0.04] bg-surface-800/40 backdrop-blur-xl">
          {isOnline === false && (
            <div className="px-4 py-1.5 bg-red-500/10 border-b border-red-500/20 text-center">
              <p className="text-[11px] text-red-400 font-body tracking-wide">
                Modo sin conexion — historial disponible
              </p>
            </div>
          )}
          <ChatHistory
            messages={messages}
            isThinking={avatarState === 'THINKING'}
            onRetry={handleRetry}
            speakingId={speakingId}
            onToggleSpeak={toggleSpeak}
          />
          <ChatInput
            onSendMessage={handleSendMessage}
            onStop={handleStop}
            disabled={!isOnline || avatarState === 'THINKING'}
            isStreaming={avatarState === 'THINKING' || avatarState === 'SPEAKING'}
            isOnline={isOnline}
            historyTokens={(() => {
              const total = estimateHistoryTokens(messages)
              return total
            })()}
          />
          <div className="pb-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </div>
  )
}
