import React, { useRef, useEffect } from 'react'

/**
 * ChatHistory — renders the scrollable list of messages.
 * Each message has a `role` ('user' | 'assistant') and `text`.
 */
export default function ChatHistory({ messages }) {
  const bottomRef = useRef(null)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-end justify-center pb-4 px-4">
        <p className="text-[11px] text-muted/40 font-body tracking-wide text-center">
          Hazme una pregunta sobre reglamentos, calendario académico o trámites.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto chat-scroll px-4 pt-3 pb-2 space-y-3">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          style={{ animationDelay: `${i * 30}ms` }}
        >
          <div
            className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm font-body leading-relaxed
              ${msg.role === 'user'
                ? 'bg-accent/[0.12] text-white/90 rounded-br-md border border-accent/10'
                : 'bg-surface-600/60 text-white/75 rounded-bl-md border border-white/[0.04]'
              }`}
          >
            {msg.role === 'assistant' && (
              <span className="block text-[10px] text-accent/50 font-medium mb-1 tracking-wide uppercase">
                Asistente
              </span>
            )}
            {msg.text}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
