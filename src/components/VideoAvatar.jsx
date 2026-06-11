import React, { useRef, useEffect } from 'react'

const STATE_STYLES = {
  IDLE:     'opacity-50 blur-[2px] grayscale-[20%] scale-95',
  THINKING: 'opacity-100 blur-0 grayscale-0 scale-100',
  SPEAKING: 'opacity-100 blur-0 grayscale-0 scale-100',
  ERROR:    'opacity-30 blur-[1px] grayscale-[60%] sepia-[30%] scale-90',
}

export default function VideoAvatar({ avatarState = 'IDLE' }) {
  const videoRef = useRef(null)
  const prevStateRef = useRef('IDLE')

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const isActive = avatarState === 'THINKING' || avatarState === 'SPEAKING'
    const wasActive = prevStateRef.current === 'THINKING' || prevStateRef.current === 'SPEAKING'

    if (isActive && !wasActive) {
      video.play().catch(() => {})
    } else if (!isActive && wasActive) {
      video.pause()
    }

    prevStateRef.current = avatarState
  }, [avatarState])

  // Preload video so poster → play is instant
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.load()
    }
  }, [])

  return (
    <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden">
      {/* Ambient glow behind the avatar */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,rgba(0,229,200,0.07)_0%,transparent_70%)]" />

      <div className="relative flex items-center justify-center">
        {/* Outer ring — subtle accent glow */}
        <div className="absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full border border-accent/10 animate-pulse-ring opacity-20" />

        {/* Video container */}
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full overflow-hidden border border-white/[0.06] shadow-2xl shadow-black/40">
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
      </div>
    </div>
  )
}
