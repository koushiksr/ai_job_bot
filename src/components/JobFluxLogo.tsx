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
    sm: { w: 26, h: 26, text: 'text-base', badge: 'text-[9px] px-1.5 py-0.5' },
    md: { w: 34, h: 34, text: 'text-lg', badge: 'text-[10px] px-1.5 py-0.5' },
    lg: { w: 44, h: 44, text: 'text-2xl', badge: 'text-xs px-2 py-0.5' },
    xl: { w: 56, h: 56, text: 'text-3xl', badge: 'text-sm px-2.5 py-1' },
  }[size]

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Sleek Minimalist Emblem: Obsidian Briefcase + Electric Sky Delta Jet + Apex Beacon */}
      <div 
        className="relative flex items-center justify-center shrink-0 drop-shadow-[0_2px_12px_rgba(56,189,248,0.25)]"
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
              <stop offset="0%" stopColor="#18181b" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>

            <linearGradient id="jfJetTopLogo" x1="16" y1="6" x2="44" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            <linearGradient id="jfJetBtmLogo" x1="25" y1="10" x2="36" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>

            <linearGradient id="jfHandleLogo" x1="19" y1="8" x2="29" y2="14" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#71717a" />
              <stop offset="100%" stopColor="#3f3f46" />
            </linearGradient>
          </defs>

          {/* Briefcase Handle */}
          <path d="M 18.5 15 C 18.5 10 29.5 10 29.5 15" stroke="url(#jfHandleLogo)" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* Briefcase Body */}
          <rect x="5" y="16" width="38" height="26" rx="6" fill="url(#jfCaseGradLogo)" stroke="#27272a" strokeWidth="1.5" />

          {/* Briefcase Horizontal Seam */}
          <line x1="5" y1="24" x2="43" y2="24" stroke="#27272a" strokeWidth="1" strokeDasharray="2.5 2" />
          <rect x="21.5" y="22" width="5" height="4" rx="1.2" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />

          {/* Velocity Streaks */}
          <line x1="13" y1="32" x2="21" y2="27" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <line x1="10" y1="37" x2="17" y2="32.5" stroke="#7dd3fc" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />

          {/* Delta Jet */}
          <polygon points="42,5 17,21 28,24" fill="url(#jfJetTopLogo)" />
          <polygon points="42,5 28,24 31,34" fill="url(#jfJetBtmLogo)" />
          <line x1="42" y1="5" x2="28" y2="24" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />

          {/* AI Beacon Apex */}
          <circle cx="42" cy="5" r="2.2" fill="#ffffff" />
          <circle cx="42" cy="5" r="4" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex items-center gap-2 leading-none">
          <span className={`font-bold tracking-tight text-white light:text-zinc-900 ${iconSizes.text}`}>
            JobFlux
          </span>
          <span className={`font-mono font-medium uppercase rounded-md bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 light:border-zinc-300 text-zinc-400 light:text-zinc-600 ${iconSizes.badge}`}>
            AI
          </span>
        </div>
      )}
    </div>
  )
}
