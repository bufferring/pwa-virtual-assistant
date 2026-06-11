import React, { useState, useCallback, useEffect, useRef } from 'react'
import Header from './components/Header'
import VideoAvatar from './components/VideoAvatar'
import ChatHistory from './components/ChatHistory'
import ChatInput from './components/ChatInput'
import InstallBanner from './components/InstallBanner'
import { streamChat } from './lib/api'
import { getSessionId, loadMessages, saveMessages } from './lib/db'

const SYSTEM_PROMPTS = {
  E: 'Eres LUMI, el asistente virtual academico de la UNEFA Nucleo Apure. El usuario es un estudiante. Responde de forma clara, breve y util sobre reglamentos, calendario academico, tramites y vida universitaria.',
  O: 'Eres LUMI, el asistente virtual academico de la UNEFA Nucleo Apure. El usuario es personal docente o administrativo. Responde de forma clara, breve y util.',
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
  const abortCtrlRef = useRef(null)
  const streamingRef = useRef(false)
  const assistantTextLengthRef = useRef(0)

  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

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

  const handleStop = useCallback(() => {
    if (abortCtrlRef.current) {
      abortCtrlRef.current.abort()
      abortCtrlRef.current = null
    }
    streamingRef.current = false
    assistantTextLengthRef.current = 0
    setAvatarState('IDLE')
  }, [])

  const handleSendMessage = useCallback(
    async (text) => {
      if (!isOnline) return

      // Abort any existing stream
      if (abortCtrlRef.current) {
        abortCtrlRef.current.abort()
      }

      const userMsg = { role: 'user', text, id: generateId() }
      setMessages((prev) => [...prev, userMsg])
      setAvatarState('THINKING')
      streamingRef.current = true
      assistantTextLengthRef.current = 0

      const abortCtrl = new AbortController()
      abortCtrlRef.current = abortCtrl

      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPTS[role] },
        ...messagesRef.current.map((m) => ({ role: m.role, content: m.text })),
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

          // Delay IDLE until typewriter finishes revealing all text
          const textLength = assistantTextLengthRef.current
          assistantTextLengthRef.current = 0

          if (textLength === 0) {
            // Empty response → error immediately
            setAvatarState('IDLE')
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
            const revealMs = Math.ceil(textLength / 4) * 12 + 200
            setTimeout(() => setAvatarState('IDLE'), revealMs)
          }
        },
        onError: (type, detail) => {
          streamingRef.current = false
          abortCtrlRef.current = null
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

  return (
    <div className="flex overflow-hidden relative flex-col w-full h-dvh bg-surface-900 noise-overlay font-body">
      <div className="flex relative z-10 flex-col h-full">
        <Header selectedRole={role} onRoleChange={setRole} isOnline={isOnline} />

        <VideoAvatar avatarState={avatarState} />

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
          />
          <ChatInput
            onSendMessage={handleSendMessage}
            onStop={handleStop}
            disabled={!isOnline || avatarState === 'THINKING' || avatarState === 'SPEAKING'}
            isStreaming={avatarState === 'THINKING' || avatarState === 'SPEAKING'}
            isOnline={isOnline}
          />
          <div className="pb-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </div>
  )
}
