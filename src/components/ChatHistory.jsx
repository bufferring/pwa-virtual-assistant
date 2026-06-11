import React, { useRef, useEffect, useState } from 'react'

function renderMarkdown(text) {
  if (!text) return null
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white/90">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

function TypewriterText({ text, isActive }) {
  const [displayed, setDisplayed] = useState('')
  const textRef = useRef(text)
  textRef.current = text

  useEffect(() => {
    if (!isActive) {
      setDisplayed(textRef.current)
      return
    }
    // Fast reveal: 4 chars every ~12ms (~330 chars/sec)
    // feels fluid without being sluggish
    const interval = setInterval(() => {
      setDisplayed((prev) => {
        const full = textRef.current
        if (prev.length >= full.length) return prev
        return full.slice(0, Math.min(prev.length + 4, full.length))
      })
    }, 12)
    return () => clearInterval(interval)
  }, [isActive])

  return <>{renderMarkdown(displayed)}</>
}

export default function ChatHistory({ messages, isThinking, onRetry }) {
  const containerRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }, [messages, isThinking])

  const handleRetryClick = (index) => {
    if (onRetry) onRetry(index)
  }

  const lastAssistantIndex = messages.length - 1
  const isLastAssistantStreaming =
    messages.length > 0 &&
    messages[lastAssistantIndex].role === 'assistant' &&
    !messages[lastAssistantIndex].isError &&
    !isThinking

  if (messages.length === 0 && !isThinking) {
    return (
      <div className="flex-1 flex items-end justify-center pb-4 px-4">
        <p className="text-[11px] text-muted/40 font-body tracking-wide text-center">
          Hazme una pregunta sobre reglamentos, calendario académico o trámites.
        </p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto chat-scroll px-4 pt-3 pb-2 space-y-3">
      {messages.map((msg, i) => {
        const isActiveStreaming = i === lastAssistantIndex && isLastAssistantStreaming
        return (
          <div
            key={msg.id || i}
            className={`flex animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div
              className={`max-w-[85%] sm:max-w-[70%] lg:max-w-[55%] px-4 py-2.5 rounded-2xl text-sm font-body leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-accent/[0.12] text-white/90 rounded-br-md border border-accent/10'
                  : msg.isError
                    ? 'bg-red-500/10 text-red-200/80 rounded-bl-md border border-red-500/20'
                    : 'bg-surface-600/60 text-white/75 rounded-bl-md border border-white/[0.04]'
                }`}
            >
              {msg.role === 'assistant' && !msg.isError && (
                <span className="block text-[10px] text-accent/50 font-medium mb-1 tracking-wide uppercase">
                  Asistente
                </span>
              )}
              {msg.isError ? (
                <span>
                  {msg.text.replace(' [Reintentar]', '')}{' '}
                  <button
                    onClick={() => handleRetryClick(i)}
                    className="underline text-accent hover:text-accent-glow transition-colors cursor-pointer"
                  >
                    Reintentar
                  </button>
                </span>
              ) : msg.role === 'assistant' ? (
                <TypewriterText text={msg.text} isActive={isActiveStreaming} />
              ) : (
                msg.text
              )}
            </div>
          </div>
        )
      })}

      {isThinking && (
        <div className="flex justify-start animate-fade-in-up">
          <div className="max-w-[85%] sm:max-w-[70%] lg:max-w-[55%] px-4 py-2.5 rounded-2xl bg-surface-600/60 text-white/75 rounded-bl-md border border-white/[0.04]">
            <span className="block text-[10px] text-accent/50 font-medium mb-1 tracking-wide uppercase">
              Asistente
            </span>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
