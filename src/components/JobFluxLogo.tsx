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
      {/* Story-driven Emblem: Briefcase (Career) + Supersonic Delta Jet (Flux Auto-Apply) + AI Beacon */}
      <div 
        className="relative flex items-center justify-center shrink-0 drop-shadow-[0_2px_10px_rgba(56,189,248,0.25)]"
        style={{ width: iconSizes.w, height: iconSizes.h }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="jfCaseGradLogo" x1="6" y1="15" x2="42" y2="43" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.98" />
            </linearGradient>

            <linearGradient id="jfJetTopLogo" x1="16" y1="6" x2="44" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="35%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>

            <linearGradient id="jfJetBtmLogo" x1="25" y1="10" x2="36" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>

            <linearGradient id="jfHandleLogo" x1="19" y1="8" x2="29" y2="14" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            <filter id="jfSparkGlowLogo" x="28" y="0" width="20" height="20" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Briefcase Handle */}
          <path d="M 18.5 15 C 18.5 10 29.5 10 29.5 15" stroke="url(#jfHandleLogo)" strokeWidth="2.8" strokeLinecap="round" fill="none" />

          {/* Briefcase Body (Floating with transparency) */}
          <rect x="5" y="16" width="38" height="26" rx="6" fill="url(#jfCaseGradLogo)" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.85" />

          {/* Briefcase Horizontal Seam & Latch */}
          <line x1="5" y1="24" x2="43" y2="24" stroke="#334155" strokeWidth="1.5" strokeDasharray="2.5 2" />
          <rect x="21.5" y="22" width="5" height="4" rx="1.2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />

          {/* Velocity Propulsion Streaks from Jet (Flux) */}
          <line x1="13" y1="32" x2="21" y2="27" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
          <line x1="10" y1="37" x2="17" y2="32.5" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

          {/* Supersonic Delta Jet (Autonomous Job Application Rocket Launch) */}
          <polygon points="42,5 17,21 28,24" fill="url(#jfJetTopLogo)" />
          <polygon points="42,5 28,24 31,34" fill="url(#jfJetBtmLogo)" />
          <line x1="42" y1="5" x2="28" y2="24" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" opacity="0.95" />

          {/* AI Autonomous Beacon Spark at Apex */}
          <g filter="url(#jfSparkGlowLogo)">
            <path d="M 43 1 Q 43 5 47 5 Q 43 5 43 9 Q 43 5 39 5 Q 43 5 43 1 Z" fill="#ffffff" />
            <circle cx="43" cy="5" r="1.2" fill="#38bdf8" />
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
