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

export default function Header({ selectedRole, onRoleChange, serverStatus }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [])

  const status = serverStatus || 'unknown'
  const colors = STATUS_COLORS[status]

  return (
    <header className="relative z-30 flex items-center justify-between px-5 py-3 bg-surface-800/70 backdrop-blur-xl border-b border-white/[0.04]">
      {/* Brand */}
      <div className="flex items-center gap-3">
        {/* Server status dot */}
        <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
          {status === 'online' ? (
            <>
              <span className={`absolute inline-flex h-full w-full rounded-full ${colors.ping} opacity-60 animate-ping`} />
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${colors.bg}`} />
            </>
          ) : (
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${colors.bg}`} />
          )}
        </span>
        {/* UNEFA Logo */}
        <img
          src={unefaLogo}
          alt="Logo UNEFA"
          className="w-7 h-7 object-contain filter drop-shadow-[0_0_4px_rgba(0,229,200,0.15)]"
        />
        <div className="flex flex-col leading-none">
          <span className="font-display font-bold text-sm tracking-wide text-white/90">
            MarIA
          </span>
          <span className="text-[10px] text-muted tracking-widest mt-0.5">
            Asistente Académico
          </span>
        </div>
      </div>

      {/* Role selector */}
      <div ref={ref} className="relative flex flex-col items-end">
        <span className="text-[9px] text-white/20 font-body tracking-wider mb-0.5 hidden sm:block">
          Sesion: {getSessionId().slice(0, 8)}
        </span>
        <button
          id="role-selector-toggle"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-600/60 border border-white/[0.06] hover:border-accent/30 transition-colors duration-200 cursor-pointer group"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="w-5 h-5 rounded-md bg-accent/10 text-accent text-[11px] font-bold flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            {selectedRole}
          </span>
          <span className="text-xs text-white/70 font-body font-medium hidden sm:inline">
            {ROLES[selectedRole].label}
          </span>
          <svg
            className={`w-3 h-3 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
          <ul
            role="listbox"
            className="absolute right-0 mt-2 w-48 rounded-xl bg-surface-700/95 backdrop-blur-2xl border border-white/[0.06] shadow-2xl shadow-black/40 overflow-hidden animate-fade-in-up"
          >
            {Object.entries(ROLES).map(([key, { label }]) => (
              <li key={key}>
                <button
                  id={`role-option-${key}`}
                  role="option"
                  aria-selected={selectedRole === key}
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
                  <span className={`w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center
                    ${selectedRole === key ? 'bg-accent/20 text-accent' : 'bg-white/[0.06] text-white/40'}`}>
                    {key}
                  </span>
                  {label}
                  {selectedRole === key && (
                    <svg className="w-4 h-4 ml-auto text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  )
}
