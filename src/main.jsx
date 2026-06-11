import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// ── Update banner ───────────────────────────────────────

function showUpdateBanner() {
  if (document.getElementById('sw-update-banner')) return

  const styleEl = document.createElement('style')
  styleEl.textContent = '@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}'
  document.head.appendChild(styleEl)

  const bar = document.createElement('div')
  bar.id = 'sw-update-banner'
  bar.style.cssText =
    'position:fixed;bottom:0;left:0;right:0;z-index:99999;' +
    'background:#0a0e1a;color:#e2e8f0;font-family:system-ui,sans-serif;' +
    'font-size:13px;display:flex;align-items:center;justify-content:center;' +
    'gap:12px;padding:14px 16px;' +
    'box-shadow:0 -2px 12px rgba(0,0,0,.3);' +
    'border-top:2px solid #00e5c8;' +
    'animation:slideUp .25s ease-out;'

  const msg = document.createElement('span')
  msg.textContent = '\u2728 Nueva versi\u00f3n disponible'
  msg.style.cssText = 'max-width:60vw;line-height:1.5;'

  const btn = document.createElement('button')
  btn.textContent = 'Actualizar ahora'
  btn.style.cssText =
    'background:#00e5c8;color:#0a0e1a;border:none;border-radius:6px;' +
    'padding:4px 12px;font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0;'
  btn.onclick = () => window.location.reload()

  const close = document.createElement('button')
  close.textContent = '\u2715'
  close.style.cssText =
    'background:transparent;border:none;color:#9ca3af;cursor:pointer;' +
    'font-size:14px;padding:2px 6px;flex-shrink:0;'
  close.onclick = () => bar.remove()

  bar.appendChild(msg)
  bar.appendChild(btn)
  bar.appendChild(close)
  document.body.appendChild(bar)
}

// ── Service Worker registration ─────────────────────────

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  let refreshing = false

  window.addEventListener('beforeunload', () => {
    refreshing = true
  })

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope)

        // Listen for new SW waiting
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New SW is waiting — show update banner
              showUpdateBanner()
            }
          })
        })

        // Check for updates every 60 minutes
        setInterval(() => {
          registration.update().catch(() => {})
        }, 60 * 60 * 1000)
      })
      .catch((error) => console.error('SW registration failed:', error))
  })

  // When a new SW takes control, reload the page once
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      window.location.reload()
    }
  })
} else if ('serviceWorker' in navigator) {
  // Dev mode: unregister all SWs to avoid stale caching
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister()
      console.log('Unregistered SW in dev mode')
    }
    if (registrations.length > 0) {
      window.location.reload()
    }
  })
}
