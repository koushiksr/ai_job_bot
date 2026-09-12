'use client'

import React from 'react'
import JobFluxLogo from './JobFluxLogo'

interface AiLoadingScreenProps {
  title?: string
  subtitle?: string
  accountInfo?: string
  fullscreen?: boolean
}

export default function AiLoadingScreen({
  title = 'Synchronizing Autonomous Cloud Cockpit',
  subtitle = 'Connecting to Autonomous Engine · Daily Precision Sync Active',
  accountInfo = '',
  fullscreen = true
}: AiLoadingScreenProps) {
  return (
    <div
      className={`${
        fullscreen
          ? 'fixed inset-0 z-50 w-screen w-full h-screen h-[100dvh] min-h-screen'
          : 'min-h-[420px] h-full w-full'
      } bg-[#000000] flex flex-col items-center justify-center text-zinc-400 font-mono text-xs overflow-hidden select-none animate-in fade-in duration-200`}
      style={fullscreen ? { minHeight: '100vh', height: '100dvh' } : undefined}
    >
      {/* Ambient violet radial beam - centered directly behind the logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-violet-600/15 blur-[120px] pointer-events-none" />

      {/* Dead-center content container */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-4 text-center px-4 my-auto">
        {/* Radar pulse beacon + Delta Jet JobFlux emblem */}
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl border border-violet-500/40 animate-radar-pulse absolute inset-0 -m-1 pointer-events-none" />
          <JobFluxLogo size="lg" showText={false} />
        </div>

        {/* Laser sweep scanner + typography */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-zinc-200 font-medium tracking-tight text-sm sm:text-base">
            {title}
          </span>
          <div className="w-44 h-[2.5px] bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden relative my-0.5">
            <div className="w-24 h-full bg-gradient-to-r from-transparent via-violet-400 to-transparent animate-laser-sweep" />
          </div>
          {subtitle && (
            <span className="text-[11px] text-zinc-400 font-sans max-w-sm leading-relaxed">
              {subtitle}
            </span>
          )}
          {accountInfo && (
            <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
              {accountInfo}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
