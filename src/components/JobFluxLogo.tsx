'use client'

import React from 'react'

interface JobFluxLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

export default function JobFluxLogo({
  size = 'md',
  showText = true,
  className = ''
}: JobFluxLogoProps) {
  // Dimensions map
  const iconSizes = {
    sm: { w: 28, h: 28, text: 'text-base', badge: 'text-[9px] px-1.5 py-0.5' },
    md: { w: 36, h: 36, text: 'text-xl', badge: 'text-[10px] px-2 py-0.5' },
    lg: { w: 46, h: 46, text: 'text-2xl', badge: 'text-xs px-2 py-0.5' },
    xl: { w: 58, h: 58, text: 'text-4xl', badge: 'text-sm px-2.5 py-1' },
  }[size]

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Story-driven Emblem: Briefcase (Career) + Supersonic Jet (Flux Auto-Apply) + AI Beacon */}
      <div 
        className="relative flex items-center justify-center shrink-0 drop-shadow-md"
        style={{ width: iconSizes.w, height: iconSizes.h }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="jfBgGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0c1424" />
              <stop offset="100%" stopColor="#04070e" />
            </linearGradient>

            <linearGradient id="jfRimGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#2563eb" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.2" />
            </linearGradient>

            <linearGradient id="jfCaseGrad" x1="8" y1="17" x2="40" y2="39" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#131e33" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0a1120" stopOpacity="0.98" />
            </linearGradient>

            <linearGradient id="jfJetTopGrad" x1="15" y1="10" x2="37" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>

            <linearGradient id="jfJetBtmGrad" x1="22" y1="14" x2="32" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#172554" />
            </linearGradient>

            <filter id="sparkGlowLogo" x="28" y="2" width="20" height="20" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Squircle Base */}
          <rect x="1.5" y="1.5" width="45" height="45" rx="11" fill="url(#jfBgGrad)" stroke="url(#jfRimGrad)" strokeWidth="1.5" />

          {/* Briefcase Handle */}
          <path d="M 19.5 15 C 19.5 12 28.5 12 28.5 15" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" fill="none" />

          {/* Briefcase Body (Career / Opportunities) */}
          <rect x="7" y="18" width="34" height="21" rx="4.5" fill="url(#jfCaseGrad)" stroke="#38bdf8" strokeWidth="1.3" strokeOpacity="0.55" />

          {/* Briefcase Horizontal Seam & Metallic Latch */}
          <line x1="7" y1="24" x2="41" y2="24" stroke="#1e293b" strokeWidth="1" />
          <rect x="22" y="22.5" width="4" height="3" rx="1" fill="#0284c7" stroke="#38bdf8" strokeWidth="0.8" />

          {/* Velocity Propulsion Streaks from Jet (Flux) */}
          <line x1="14" y1="30" x2="20" y2="26" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
          <line x1="12" y1="34" x2="17" y2="30.5" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />

          {/* Supersonic Delta Jet (Autonomous Application Dispatch) */}
          <polygon points="37,10 18,22 26,24" fill="url(#jfJetTopGrad)" />
          <polygon points="37,10 26,24 28,31" fill="url(#jfJetBtmGrad)" />
          <line x1="37" y1="10" x2="26" y2="24" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.95" />

          {/* AI Autonomous Beacon Spark */}
          <g filter="url(#sparkGlowLogo)">
            <path d="M 38 5 Q 38 8.5 41.5 8.5 Q 38 8.5 38 12 Q 38 8.5 34.5 8.5 Q 38 8.5 38 5 Z" fill="#ffffff" />
            <circle cx="38" cy="8.5" r="1" fill="#38bdf8" />
          </g>
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-extrabold tracking-tight text-white ${iconSizes.text}`}>
            Job<span className="text-sky-400">Flux</span>
          </span>
          <span className={`font-mono font-bold uppercase rounded-md bg-blue-500/15 border border-blue-500/30 text-sky-400 ${iconSizes.badge}`}>
            AI
          </span>
        </div>
      )}
    </div>
  )
}
