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
        fullscreen ? 'fixed inset-0 z-50' : 'min-h-[400px] w-full'
      } bg-[#000000] flex flex-col items-center justify-center text-zinc-400 font-mono text-xs gap-4 relative overflow-hidden select-none animate-in fade-in duration-200`}
    >
      {/* Ambient violet radial beam */}
      <div className="absolute w-[460px] h-[460px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />

      {/* Radar pulse beacon + Delta Jet JobFlux emblem */}
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl border border-violet-500/30 animate-radar-pulse absolute inset-0 -m-1 pointer-events-none" />
        <JobFluxLogo size="lg" showText={false} />
      </div>

      {/* Laser sweep scanner + typography */}
      <div className="flex flex-col items-center gap-2 z-10 text-center px-4">
        <span className="text-zinc-200 font-medium tracking-tight text-sm">
          {title}
        </span>
        <div className="w-40 h-[2px] bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden relative my-0.5">
          <div className="w-20 h-full bg-gradient-to-r from-transparent via-violet-400 to-transparent animate-laser-sweep" />
        </div>
        {subtitle && (
          <span className="text-[11px] text-zinc-400 font-sans max-w-sm">
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
  )
}
