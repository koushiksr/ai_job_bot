'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface JobFluxSplashProps {
  onComplete: () => void
}

export default function JobFluxSplash({ onComplete }: JobFluxSplashProps) {
  const [stage, setStage] = useState<'entering' | 'igniting' | 'launching' | 'complete'>('entering')

  useEffect(() => {
    // Stage 1: Briefcase & Icon appearance
    const timer1 = setTimeout(() => {
      setStage('igniting')
    }, 450)

    // Stage 2: Jet ignition & AI Beacon sparkle
    const timer2 = setTimeout(() => {
      setStage('launching')
    }, 1050)

    // Stage 3: Smooth dissolve to main page
    const timer3 = setTimeout(() => {
      setStage('complete')
      onComplete()
    }, 1600)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [onComplete])

  // Instant skip on click
  const handleQuickSkip = () => {
    setStage('complete')
    onComplete()
  }

  return (
    <AnimatePresence>
      {stage !== 'complete' && (
        <motion.div
          onClick={handleQuickSkip}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden cursor-pointer select-none"
        >
          {/* Subtle Ambient Radial Glow */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.8, 1.2, 1], opacity: [0.15, 0.3, 0.2] }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-violet-600/15 via-purple-500/10 to-transparent blur-[120px] pointer-events-none"
          />

          {/* Central Animated Emblem */}
          <div className="relative flex flex-col items-center justify-center z-10">
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-28 h-28 flex items-center justify-center"
            >
              {/* Outer Pulse Ring */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [0.9, 1.35, 1.1], opacity: [0.4, 0, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                className="absolute inset-0 rounded-2xl border border-violet-500/30"
              />

              {/* Story-driven Emblem SVG with animated elements */}
              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full drop-shadow-[0_0_30px_rgba(168,85,247,0.25)]"
              >
                <defs>
                  <linearGradient id="splashCaseGrad" x1="6" y1="15" x2="42" y2="43" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#18181b" />
                    <stop offset="100%" stopColor="#09090b" />
                  </linearGradient>

                  <linearGradient id="splashJetTop" x1="16" y1="6" x2="44" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="40%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>

                  <linearGradient id="splashJetBtm" x1="25" y1="10" x2="36" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#6d28d9" />
                    <stop offset="100%" stopColor="#4c1d95" />
                  </linearGradient>

                  <linearGradient id="splashHandle" x1="19" y1="8" x2="29" y2="14" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#71717a" />
                    <stop offset="100%" stopColor="#3f3f46" />
                  </linearGradient>

                  <filter id="splashGlow" x="25" y="0" width="23" height="23" filterUnits="userSpaceOnUse">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Briefcase Handle */}
                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  d="M 18.5 15 C 18.5 10 29.5 10 29.5 15"
                  stroke="url(#splashHandle)"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Briefcase Body (Career Foundation) */}
                <motion.rect
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  x="5"
                  y="16"
                  width="38"
                  height="26"
                  rx="6"
                  fill="url(#splashCaseGrad)"
                  stroke="#27272a"
                  strokeWidth="1.6"
                />

                {/* Seam & Latch */}
                <line x1="5" y1="24" x2="43" y2="24" stroke="#27272a" strokeWidth="1.2" strokeDasharray="2.5 2" />
                <rect x="21.5" y="22" width="5" height="4" rx="1.2" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />

                {/* Propulsion Velocity Trails */}
                <motion.line
                  initial={{ x1: 17, y1: 29, opacity: 0 }}
                  animate={{ x1: [17, 13], y1: [29, 32], opacity: [0, 1, 0.7] }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  x1="13"
                  y1="32"
                  x2="21"
                  y2="27"
                  stroke="#a855f7"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <motion.line
                  initial={{ x1: 14, y1: 34, opacity: 0 }}
                  animate={{ x1: [14, 10], y1: [34, 37], opacity: [0, 1, 0.5] }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  x1="10"
                  y1="37"
                  x2="17"
                  y2="32.5"
                  stroke="#c084fc"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />

                {/* Supersonic Delta Jet (Autonomous Application Rocket Launch) */}
                <motion.g
                  initial={{ x: -12, y: 12, opacity: 0, scale: 0.7 }}
                  animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.65, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <polygon points="42,5 17,21 28,24" fill="url(#splashJetTop)" />
                  <polygon points="42,5 28,24 31,34" fill="url(#splashJetBtm)" />
                  <line x1="42" y1="5" x2="28" y2="24" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
                </motion.g>

                {/* AI Autonomous Beacon Star Burst */}
                <motion.g
                  filter="url(#splashGlow)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.6, 1], opacity: [0, 1, 0.95] }}
                  transition={{ duration: 0.5, delay: 0.5, ease: 'backOut' }}
                >
                  <path d="M 43 1 Q 43 5 47 5 Q 43 5 43 9 Q 43 5 39 5 Q 43 5 43 1 Z" fill="#ffffff" />
                  <circle cx="43" cy="5" r="1.5" fill="#c084fc" />
                </motion.g>
              </svg>
            </motion.div>

            {/* Typography Entrance */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 flex flex-col items-center text-center"
            >
              <div className="flex items-center gap-2">
                <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-sans">
                  JobFlux
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md font-mono font-medium uppercase bg-zinc-900 border border-zinc-800 text-zinc-400 shadow-sm">
                  AI
                </span>
              </div>

              {/* Status Laser Beam */}
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="w-36 h-[2px] bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-20 h-full bg-gradient-to-r from-transparent via-violet-400 to-transparent"
                  />
                </div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  className="text-[10px] font-mono tracking-widest uppercase text-zinc-500"
                >
                  Autonomous Engine Initialized
                </motion.span>
              </div>
            </motion.div>
          </div>

          {/* Click to enter hint */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="absolute bottom-8 text-[11px] text-zinc-600 font-mono tracking-wider"
          >
            Click anywhere to enter
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

