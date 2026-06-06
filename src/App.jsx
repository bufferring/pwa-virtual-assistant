import React, { useState, useCallback } from 'react'
import Header from './components/Header'
import AvatarCanvas from './components/AvatarCanvas'
import ChatHistory from './components/ChatHistory'
import ChatInput from './components/ChatInput'

/**
 * App — Root layout for the UNEFA Virtual Assistant PWA.
 *
 * Layout structure (top → bottom, no page scroll):
 *   ┌──────────────────────────┐
 *   │  Header / Role Selector  │  fixed height
 *   ├──────────────────────────┤
 *   │                          │
 *   │     AvatarCanvas (3D)    │  flex-1 (fills remaining)
 *   │                          │
 *   ├──────────────────────────┤
 *   │  ChatHistory (scroll)    │  constrained max-height
 *   ├──────────────────────────┤
 *   │  ChatInput               │  fixed height
 *   └──────────────────────────┘
 */
export default function App() {
  // ── State ─────────────────────────────────────────────
  const [role, setRole] = useState('E') // 'E' = Estudiante | 'O' = Otro Personal
  const [messages, setMessages] = useState([])

  // ── Handlers ──────────────────────────────────────────
  const handleSendMessage = useCallback(
    (text) => {
      // Build payload that will be sent to the backend in the future
      const payload = {
        mensaje: text,
        rol: role,
        timestamp: new Date().toISOString(),
      }

      // Log the exact JSON payload to the console
      console.log('📤 Payload para backend:', JSON.stringify(payload, null, 2))

      // Append user message to local history
      setMessages((prev) => [...prev, { role: 'user', text }])

      // Simulate an assistant response (placeholder until backend integration)
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `He recibido tu consulta como ${role === 'E' ? 'Estudiante' : 'Personal'}. La integración con el backend aún no está conectada.`,
          },
        ])
      }, 600)
    },
    [role]
  )

  // ── Render ────────────────────────────────────────────
  return (
    <div className="relative h-dvh w-full overflow-hidden flex flex-col bg-surface-900 noise-overlay font-body">
      {/* Safe-area aware layout container */}
      <div className="relative z-10 flex flex-col h-full">
        {/* ── Top: Header ── */}
        <Header selectedRole={role} onRoleChange={setRole} />

        {/* ── Center: 3D Avatar Canvas ── */}
        <AvatarCanvas />

        {/* ── Bottom: Chat area ── */}
        <div className="flex flex-col max-h-[45vh] sm:max-h-[40vh] border-t border-white/[0.04] bg-surface-800/40 backdrop-blur-xl">
          <ChatHistory messages={messages} />
          <ChatInput onSendMessage={handleSendMessage} />
          {/* Bottom safe-area spacer for iOS */}
          <div className="pb-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </div>
  )
}
