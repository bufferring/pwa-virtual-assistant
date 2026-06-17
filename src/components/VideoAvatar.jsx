import React, { useRef, useEffect } from 'react'

const STATE_STYLES = {
  IDLE:     'opacity-50 blur-[2px] grayscale-[20%] scale-95',
  THINKING: 'opacity-100 blur-0 grayscale-0 scale-100',
  SPEAKING: 'opacity-100 blur-0 grayscale-0 scale-100',
  ERROR:    'opacity-30 blur-[1px] grayscale-[60%] sepia-[30%] scale-90',
}

export default function VideoAvatar({ avatarState = 'IDLE', lastAssistantText = '', speakingId, onToggleSpeak }) {
  const videoRef = useRef(null)
  const prevStateRef = useRef('IDLE')
  const isTTSPlaying = speakingId === 'avatar'

  // Sync video play/pause to avatarState
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const isActive = avatarState === 'SPEAKING'
    const wasActive = prevStateRef.current === 'SPEAKING'

    if (isActive && !wasActive) {
      video.play().catch(() => {})
    } else if (!isActive && wasActive) {
      video.pause()
    }

    prevStateRef.current = avatarState
  }, [avatarState])

  // Preload video
  useEffect(() => {
    const video = videoRef.current
    if (video) video.load()
  }, [])

  const handleToggleTTS = () => {
    if (!lastAssistantText || !onToggleSpeak) return
    onToggleSpeak('avatar', lastAssistantText)
  }

  const canShowButton = lastAssistantText && avatarState !== 'THINKING' && avatarState !== 'ERROR'

  return (
    <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,rgba(0,229,200,0.07)_0%,transparent_70%)]" />

      <div className="relative flex items-center justify-center">
        {/* Pulse ring */}
        <div className="absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full border border-accent/10 animate-pulse-ring opacity-20" />

        {/* Avatar + TTS button wrapper */}
        <div className="relative w-44 h-44 sm:w-56 sm:h-56">
          {/* Video */}
          <div className="w-full h-full rounded-full overflow-hidden border border-white/[0.06] shadow-2xl shadow-black/40">
            <video
              ref={videoRef}
              src="/MarIA.mp4"
              poster="/MarIA-poster.jpg"
              muted
              loop
              playsInline
              preload="auto"
              className={`w-full h-full object-cover transition-all duration-500 ease-out ${STATE_STYLES[avatarState] || STATE_STYLES.IDLE}`}
            />
          </div>

          {/* TTS Play/Stop button */}
          {canShowButton && (
            <button
              onClick={handleToggleTTS}
              className={`absolute -bottom-1 -right-1 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg active:scale-90 z-10 border border-white/10
                ${isTTSPlaying
                  ? 'bg-red-500/90 hover:bg-red-500 text-white animate-pulse'
                  : 'bg-accent hover:bg-accent/80 text-surface-900 hover:scale-105'
                }`}
              aria-label={isTTSPlaying ? 'Detener audio' : 'Reproducir audio'}
              title={isTTSPlaying ? 'Detener' : 'Escuchar'}
            >
              {isTTSPlaying ? (
                /* Stop square */
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                /* Speaker icon */
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
