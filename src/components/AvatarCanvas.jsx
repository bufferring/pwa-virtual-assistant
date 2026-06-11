import React, { useState, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import AvatarScene from './AvatarScene'

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')))
  } catch {
    return false
  }
}

function LoadingAvatar() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full border border-accent/20 opacity-30 animate-ping" />
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-surface-800/50 border border-white/[0.04] backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
          <p className="text-[11px] text-muted font-body tracking-wide">Cargando avatar...</p>
        </div>
      </div>
    </div>
  )
}

function FallbackAvatar() {
  return (
    <div className="relative flex-1 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,rgba(0,229,200,0.06)_0%,transparent_70%)]" />
      <div className="relative flex items-center justify-center">
        <div className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full avatar-ring opacity-20 animate-pulse-ring blur-[1px]" />
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-surface-800/50 border border-white/[0.04] backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-accent/[0.08] border border-accent/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
          </div>
          <div className="text-center px-4">
            <p className="text-[11px] text-muted font-body tracking-wide">Avatar 3D no disponible</p>
            <p className="text-[11px] text-white/30 font-body tracking-wide mt-0.5">WebGL no soportado</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AvatarCanvas({ avatarState = 'IDLE' }) {
  const [webglAvailable, setWebglAvailable] = useState(true)

  useEffect(() => {
    setWebglAvailable(hasWebGL())
  }, [])

  if (!webglAvailable) {
    return <FallbackAvatar />
  }

  return (
    <div id="avatar-canvas" className="relative flex-1 min-h-0 overflow-hidden touch-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,rgba(0,229,200,0.06)_0%,transparent_70%)]" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <Suspense fallback={<LoadingAvatar />}>
          <Canvas
            camera={{ position: [0, 0, 4.5], fov: 45 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
            style={{ background: 'transparent' }}
          >
            <ambientLight intensity={0.6} />
            <pointLight position={[2, 3, 2]} intensity={1.2} color="#ffffff" />
            <pointLight position={[-2, 1, 2]} intensity={0.6} color="#00e5c8" />
            <AvatarScene avatarState={avatarState} />
          </Canvas>
        </Suspense>
      </div>
    </div>
  )
}
