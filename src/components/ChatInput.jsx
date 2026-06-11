import React, { useState, useRef } from 'react'

export default function ChatInput({ onSendMessage, onStop, disabled, isStreaming, isOnline }) {
  const [message, setMessage] = useState('')
  const inputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    const text = message.trim()
    if (!text || disabled) return
    onSendMessage(text)
    setMessage('')
    inputRef.current?.focus()
  }

  return (
    <form
      id="chat-input-form"
      onSubmit={handleSubmit}
      className="flex items-end gap-2 px-4 pb-2 pt-2"
    >
      <div className="relative flex-1">
        {!isOnline && (
          <div className="absolute -top-6 left-0 right-0 text-center">
            <span className="text-[10px] text-red-400 font-body tracking-wide">Sin conexion</span>
          </div>
        )}
        <input
          ref={inputRef}
          id="chat-text-input"
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isOnline ? 'Escribe tu consulta…' : 'Sin conexion'}
          autoComplete="off"
          disabled={disabled}
          className={`w-full px-4 py-3 pr-4 rounded-2xl bg-surface-700/60 border border-white/[0.06] text-sm font-body text-white/90 placeholder:text-muted/60 focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>

      {isStreaming ? (
        <button
          id="chat-stop-button"
          type="button"
          onClick={onStop}
          className="flex-shrink-0 w-11 h-11 rounded-2xl bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer"
          aria-label="Detener respuesta"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        </button>
      ) : (
        <button
          id="chat-send-button"
          type="submit"
          disabled={!message.trim() || disabled}
          className="flex-shrink-0 w-11 h-11 rounded-2xl bg-accent/90 hover:bg-accent text-surface-900 flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:hover:bg-accent/90 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
          aria-label="Enviar mensaje"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      )}
    </form>
  )
}
