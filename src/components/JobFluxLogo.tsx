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
    md: { w: 34, h: 34, text: 'text-xl', badge: 'text-[10px] px-2 py-0.5' },
    lg: { w: 44, h: 44, text: 'text-2xl', badge: 'text-xs px-2 py-0.5' },
    xl: { w: 56, h: 56, text: 'text-4xl', badge: 'text-sm px-2.5 py-1' },
  }[size]

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Modern Flux Emblem */}
      <div 
        className="relative flex items-center justify-center shrink-0"
        style={{ width: iconSizes.w, height: iconSizes.h }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <defs>
            <linearGradient id="jfGradient1" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="jfGradient2" x1="16" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Rounded Squircle Container */}
          <rect
            x="3"
            y="3"
            width="42"
            height="42"
            rx="12"
            fill="#0f172a"
            stroke="url(#jfGradient1)"
            strokeWidth="2"
          />

          {/* Dynamic Intersecting Flux Waves / Arrows */}
          <path
            d="M13 18C13 18 19 14 26 18C33 22 35 15 35 15"
            stroke="url(#jfGradient1)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M13 24C13 24 20 20 27 24C34 28 35 21 35 21"
            stroke="url(#jfGradient2)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M13 30C13 30 20 26 27 30C34 34 35 28 35 28"
            stroke="url(#jfGradient1)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Central AI Pulse Dot */}
          <circle cx="35" cy="21" r="2.5" fill="#38bdf8" />
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

