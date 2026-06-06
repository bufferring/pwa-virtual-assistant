import React, { useState, useRef, useEffect } from 'react'

export default function ChatInput({ onSendMessage }) {
  const [message, setMessage] = useState('')
  const inputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    const text = message.trim()
    if (!text) return
    onSendMessage(text)
    setMessage('')
    // Re-focus input after send
    inputRef.current?.focus()
  }

  return (
    <form
      id="chat-input-form"
      onSubmit={handleSubmit}
      className="flex items-end gap-2 px-4 pb-2 pt-2"
    >
      {/* Text input */}
      <div className="relative flex-1">
        <input
          ref={inputRef}
          id="chat-text-input"
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe tu consulta…"
          autoComplete="off"
          className="w-full px-4 py-3 pr-4 rounded-2xl bg-surface-700/60 border border-white/[0.06] text-sm font-body text-white/90 placeholder:text-muted/60 focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 transition-all duration-200"
        />
      </div>

      {/* Send button */}
      <button
        id="chat-send-button"
        type="submit"
        disabled={!message.trim()}
        className="flex-shrink-0 w-11 h-11 rounded-2xl bg-accent/90 hover:bg-accent text-surface-900 flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:hover:bg-accent/90 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
        aria-label="Enviar mensaje"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
        </svg>
      </button>
    </form>
  )
}
