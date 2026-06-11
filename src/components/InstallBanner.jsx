import React, { useState, useEffect, useCallback, useRef } from 'react'

const DISMISS_KEY = 'pwa-install-dismissed'
const ENGAGEMENT_DELAY = 30_000 // 30 seconds

function getDismissState() {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}')
  } catch {
    return {}
  }
}

function setDismissState(state) {
  localStorage.setItem(DISMISS_KEY, JSON.stringify(state))
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function isIOSSafari() {
  const ua = navigator.userAgent
  const isIOS = /iphone|ipad|ipod/i.test(ua) && !window.MSStream
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua)
  return isIOS && isSafari
}

export default function InstallBanner() {
  const [visible, setVisible] = useState(false)
  const [iosModal, setIosModal] = useState(false)
  const deferredRef = useRef(null)

  useEffect(() => {
    if (isStandalone()) return

    const dismissed = getDismissState()
    if (dismissed.permanent) return
    if (dismissed.until && Date.now() < dismissed.until) return

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      deferredRef.current = e
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Engagement delay timer
    const timer = setTimeout(() => {
      if (isStandalone()) return
      if (deferredRef.current) {
        setVisible(true)
      } else if (isIOSSafari()) {
        setVisible(true)
      }
    }, ENGAGEMENT_DELAY)

    const handleAppInstalled = () => {
      setDismissState({ permanent: true })
      setVisible(false)
      deferredRef.current = null
    }
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      clearTimeout(timer)
    }
  }, [])

  const handleInstall = useCallback(async () => {
    const prompt = deferredRef.current
    if (!prompt) {
      // iOS case
      if (isIOSSafari()) {
        setIosModal(true)
      }
      return
    }
    const result = await prompt.prompt()
    if (result?.outcome === 'accepted') {
      setDismissState({ permanent: true })
    }
    deferredRef.current = null
    setVisible(false)
  }, [])

  const handleSnooze = useCallback(() => {
    setDismissState({ until: Date.now() + 7 * 24 * 60 * 60 * 1000 })
    setVisible(false)
  }, [])

  const handleNeverAgain = useCallback(() => {
    setDismissState({ permanent: true })
    setVisible(false)
  }, [])

  if (!visible) return null

  return (
    <>
      {/* Spacer reserves layout space so the fixed banner doesn't overlay content */}
      <div className="h-20 flex-shrink-0" />

      {/* Install banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-slide-up">
        <div className="mx-3 mb-3 rounded-2xl border border-accent/15 bg-surface-800/95 backdrop-blur-xl shadow-2xl shadow-black/40 px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-surface-700/80 flex items-center justify-center overflow-hidden border border-white/[0.04]">
              <img
                src="/icons/icon-192x192.png"
                alt="MarIA"
                className="w-8 h-8 object-contain"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-medium text-white/90 truncate">
                Instalar MarIA
              </p>
              <p className="text-[11px] text-muted leading-snug">
                Agrega el asistente a tu pantalla de inicio para acceder más rápido.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 rounded-lg bg-accent/90 hover:bg-accent text-surface-900 text-xs font-bold transition-colors cursor-pointer"
              >
                Instalar
              </button>
              <button
                onClick={handleSnooze}
                className="px-2 py-1.5 rounded-lg text-xs text-muted hover:text-white/70 transition-colors cursor-pointer"
                title="Recordar en 7 días"
              >
                Ahora no
              </button>
              <button
                onClick={handleNeverAgain}
                className="px-2 py-1.5 rounded-lg text-[11px] text-white/25 hover:text-white/50 transition-colors cursor-pointer"
                title="No volver a preguntar"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* iOS instructions modal */}
      {iosModal && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm mx-3 mb-6 sm:mb-0 rounded-2xl border border-white/[0.06] bg-surface-800/95 backdrop-blur-xl shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-display font-bold text-white/90">
                Agregar a pantalla de inicio
              </h3>
              <button
                onClick={() => setIosModal(false)}
                className="text-white/30 hover:text-white/60 text-lg leading-none cursor-pointer"
              >
                ×
              </button>
            </div>
            <ol className="space-y-3 text-sm text-white/70 font-body">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center">1</span>
                <span>Presiona el botón <strong className="text-white/90">Compartir</strong> en la barra de Safari.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center">2</span>
                <span>Desplázate y selecciona <strong className="text-white/90">Agregar a pantalla de inicio</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center">3</span>
                <span>Presiona <strong className="text-white/90">Agregar</strong> en la parte superior.</span>
              </li>
            </ol>
            <button
              onClick={() => {
                setIosModal(false)
                handleSnooze()
              }}
              className="mt-5 w-full py-2.5 rounded-xl bg-accent/90 hover:bg-accent text-surface-900 text-sm font-bold transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUpBanner {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slideUpBanner 0.35s ease-out forwards;
        }
      `}</style>
    </>
  )
}
