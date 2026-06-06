import React from 'react'

/**
 * AvatarCanvas — placeholder container reserved for the future Three.js
 * 3D avatar render. Currently displays a cinematic empty state with an
 * animated ring and subtle breathing glow to indicate the AI presence.
 */
export default function AvatarCanvas() {
  return (
    <div
      id="avatar-canvas"
      className="relative flex-1 flex items-center justify-center overflow-hidden"
    >
      {/* Radial gradient backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,rgba(0,229,200,0.06)_0%,transparent_70%)]" />

      {/* Animated ring — future Three.js canvas mount point */}
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing ring */}
        <div className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full avatar-ring opacity-20 animate-pulse-ring blur-[1px]" />

        {/* Inner container */}
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-surface-800/50 border border-white/[0.04] backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          {/* AI presence indicator */}
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-accent/[0.08] border border-accent/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-accent/70"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                />
              </svg>
            </div>
          </div>
          <div className="text-center px-4">
            <p className="text-[11px] text-muted font-body tracking-wide">
              Espacio reservado para
            </p>
            <p className="text-[11px] text-white/30 font-body tracking-wide mt-0.5">
              Avatar 3D · Three.js
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
