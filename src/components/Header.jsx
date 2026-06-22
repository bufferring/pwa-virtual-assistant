import React, { useState, useRef, useEffect } from 'react'
import unefaLogo from '../assets/unefa_logo.png'
import { getSessionId } from '../lib/db'

const ROLES = {
  E: { label: 'Estudiante', short: 'E' },
  O: { label: 'Otro Personal', short: 'O' },
}

const STATUS_COLORS = {
  online:  { bg: 'bg-accent', ping: 'bg-accent' },
  slow:    { bg: 'bg-yellow-400', ping: 'bg-yellow-400' },
  offline: { bg: 'bg-red-500', ping: 'bg-red-500' },
  unknown: { bg: 'bg-gray-500', ping: 'bg-gray-500' },
}

export default function Header({ selectedRole, onRoleChange, serverStatus, onClearChat }) {
  const [open, setOpen] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const ref = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [])

  const handleClearClick = () => {
    setShowConfirm(true)
    setTimeout(() => setShowConfirm(false), 3000)
  }

  const handleConfirm = () => {
    setShowConfirm(false)
    onClearChat?.()
  }

  const status = serverStatus || 'unknown'
  const colors = STATUS_COLORS[status]

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-surface-800/60 backdrop-blur-xl sticky top-0 z-30">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        {/* Server status dot */}
        <span className="relative flex items-center">
          {status === 'online' ? (
            <span className={`absolute inline-flex h-2 w-2 rounded-full ${colors.ping} opacity-75 animate-ping`} />
          ) : (
            null
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.bg}`} />
        </span>
        {/* UNEFA Logo */}
        <img src={unefaLogo} alt="UNEFA" className="w-7 h-7 object-contain" />
        <div className="leading-tight">
          <h1 className="text-white text-sm font-display tracking-wide">MarIA</h1>
          <p className="text-white/40 text-[10px] font-body tracking-wider">Asistente Académico</p>
        </div>
      </div>

      {/* Right side: session text above the buttons row */}
      <div className="flex flex-col items-end gap-1">
        {/* Session ID moved above the buttons */}
        <p className="text-white/30 text-[9px] font-body uppercase tracking-widest">
          Sesion: {getSessionId().slice(0, 8)}
        </p>

        {/* Buttons row: trash (left) + role selector (right) */}
        <div className="flex items-center gap-2">
          {/* Botón de papelera (ahora a la izquierda del selector) */}
          {showConfirm ? (
            <button
              onClick={handleConfirm}
              className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold px-3 py-1.5 rounded-md border border-red-500/30 transition-all animate-fade-in-up"
              title="Confirmar borrado"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              ¿Borrar todo?
            </button>
          ) : (
            <button
              onClick={handleClearClick}
              className="flex items-center justify-center w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-accent border border-white/10 transition-all active:scale-90"
              title="Nuevo chat"
              aria-label="Nuevo chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          {/* Selector de rol (sin el texto de sesión adentro) */}
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-600/60 border border-white/[0.06] hover:border-accent/30 transition-colors duration-200 cursor-pointer group"
              aria-haspopup="listbox"
              aria-expanded={open}
            >
              <span className="w-5 h-5 rounded bg-accent/10 flex items-center justify-center text-accent text-[10px] font-bold font-display">
                {selectedRole}
              </span>
              <span className="text-white/80 text-xs font-body">{ROLES[selectedRole].label}</span>
              <svg className={`w-3 h-3 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {open && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-surface-700/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/40 overflow-hidden z-50 animate-fade-in-up">
                {Object.entries(ROLES).map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => {
                      onRoleChange(key)
                      setOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-body transition-colors cursor-pointer
                      ${selectedRole === key
                        ? 'bg-accent/[0.08] text-accent'
                        : 'text-white/60 hover:bg-white/[0.04] hover:text-white/80'
                      }`}
                  >
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold font-display
                      ${selectedRole === key ? 'bg-accent/20 text-accent' : 'bg-white/10 text-white/50'}`}>
                      {key}
                    </span>
                    {label}
                    {selectedRole === key && (
                      <svg className="w-4 h-4 ml-auto text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
