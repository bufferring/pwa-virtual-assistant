import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const TEAL = new THREE.Color(0x00e5c8)
const TEAL_DIM = new THREE.Color(0x00b89e)
const MUTED = new THREE.Color(0x6b7a99)
const RED = new THREE.Color(0xff4444)

const TARGETS = {
  IDLE: { scale: 1, emissive: 0.25, ringSpeed: 0.3, ringOpacity: 0.25, pulseSpeed: 0.8 },
  THINKING: { scale: 1.08, emissive: 0.9, ringSpeed: 3.5, ringOpacity: 0.8, pulseSpeed: 5.0 },
  SPEAKING: { scale: 1.12, emissive: 0.65, ringSpeed: 1.2, ringOpacity: 0.6, pulseSpeed: 3.0 },
  ERROR: { scale: 0.88, emissive: 0.08, ringSpeed: 0.2, ringOpacity: 0.1, pulseSpeed: 0.4 },
}

export default function AvatarScene({ avatarState = 'IDLE' }) {
  const orbRef = useRef()
  const ringARef = useRef()
  const ringBRef = useRef()
  const ringCRef = useRef()
  const glowRef = useRef()

  const current = useRef({ ...TARGETS.IDLE })

  const orbMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: TEAL, emissive: TEAL_DIM, emissiveIntensity: 0.25,
    transparent: true, opacity: 0.85, roughness: 0.15, metalness: 0.9,
  }), [])

  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: TEAL, transparent: true, opacity: 0.25,
  }), [])

  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: TEAL, transparent: true, opacity: 0.06, side: THREE.BackSide,
  }), [])

  useFrame((state, delta) => {
    const target = TARGETS[avatarState] || TARGETS.IDLE
    const lerp = 1 - Math.exp(-8 * delta)
    const c = current.current

    c.scale += (target.scale - c.scale) * lerp
    c.emissive += (target.emissive - c.emissive) * lerp
    c.ringSpeed += (target.ringSpeed - c.ringSpeed) * lerp
    c.ringOpacity += (target.ringOpacity - c.ringOpacity) * lerp
    c.pulseSpeed += (target.pulseSpeed - c.pulseSpeed) * lerp

    const t = state.clock.elapsedTime
    const breathe = 1 + Math.sin(t * c.pulseSpeed) * 0.06

    // Core orb
    if (orbRef.current) {
      orbRef.current.scale.setScalar(c.scale * breathe)
      orbMat.emissiveIntensity = c.emissive + Math.sin(t * c.pulseSpeed * 1.5) * 0.1
    }

    // Color: teal normally, muted on error
    const mixed = avatarState === 'ERROR'
      ? TEAL.clone().lerp(MUTED, 0.8)
      : TEAL
    orbMat.color.copy(mixed)
    orbMat.emissive.copy(mixed)
    ringMat.color.copy(mixed)
    glowMat.color.copy(mixed)

    // Ring A — horizontal, fast spin when thinking
    if (ringARef.current) {
      ringARef.current.rotation.z += c.ringSpeed * delta
      ringARef.current.rotation.x = Math.sin(t * 0.3) * 0.15
      ringMat.opacity = c.ringOpacity
    }

    // Ring B — diagonal, opposite direction
    if (ringBRef.current) {
      ringBRef.current.rotation.x -= c.ringSpeed * 0.6 * delta
      ringBRef.current.rotation.y += c.ringSpeed * 0.4 * delta
      ringBRef.current.rotation.z = Math.sin(t * 0.5) * 0.2
    }

    // Ring C — vertical tilt
    if (ringCRef.current) {
      ringCRef.current.rotation.y += c.ringSpeed * 0.3 * delta
      ringCRef.current.rotation.x = Math.cos(t * 0.4) * 0.3
    }

    // Backdrop glow pulse
    if (glowRef.current) {
      const glowPulse = 0.04 + Math.sin(t * c.pulseSpeed * 0.5) * 0.015
      glowMat.opacity = glowPulse
      glowRef.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.05)
    }
  })

  return (
    <group>
      {/* Ambient glow shell */}
      <mesh ref={glowRef} material={glowMat}>
        <sphereGeometry args={[2.5, 24, 24]} />
      </mesh>

      {/* Core orb */}
      <mesh ref={orbRef} material={orbMat}>
        <sphereGeometry args={[1, 32, 32]} />
      </mesh>

      {/* Inner highlight */}
      <mesh position={[0, 0.35, 0.55]} scale={[0.35, 0.2, 0.08]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={TEAL} transparent opacity={0.25} />
      </mesh>

      {/* Ring A — main horizontal */}
      <mesh ref={ringARef} position={[0, 0, 0]} material={ringMat}>
        <torusGeometry args={[1.35, 0.018, 12, 64]} />
      </mesh>

      {/* Ring B — diagonal */}
      <mesh ref={ringBRef} position={[0, 0, 0]} material={ringMat} rotation={[0.6, 0.4, 0]}>
        <torusGeometry args={[1.15, 0.012, 12, 48]} />
      </mesh>

      {/* Ring C — smaller tilted */}
      <mesh ref={ringCRef} position={[0, 0, 0]} material={ringMat} rotation={[0.3, 0.8, 0.2]}>
        <torusGeometry args={[0.95, 0.008, 12, 48]} />
      </mesh>

      {/* Ground disc */}
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.8, 32]} />
        <meshBasicMaterial color={TEAL} transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
