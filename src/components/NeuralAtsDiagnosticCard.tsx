'use client'

import React from 'react'
import {
  Cpu,
  Lock,
  Sparkles,
  CheckCircle2,
  Shield,
  ArrowRight,
  TrendingUp,
  Eye,
  Zap,
  Target
} from 'lucide-react'

interface NeuralAtsDiagnosticCardProps {
  isProfessional: boolean
  skillsCount: number
  resumeUploaded: boolean
  onUnlockClick: (featureTitle?: string) => void
}

export default function NeuralAtsDiagnosticCard({
  isProfessional,
  skillsCount,
  resumeUploaded,
  onUnlockClick
}: NeuralAtsDiagnosticCardProps) {
  return (
    <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-4 relative overflow-hidden card-featured-glow text-zinc-100">
      {/* Top subtle laser beam sweep */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent animate-laser-sweep pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-semibold text-white tracking-tight">
                Neural ATS Recruiter Readiness Diagnostic
              </h3>
              {isProfessional ? (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700/60 text-amber-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> NEURAL ACTIVE
                </span>
              ) : (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-medium">
                  STANDARD ENGINE
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Continuous parsing calibration for Workday, Greenhouse, Taleo & Lever ATS systems.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="text-right">
            <div className="text-sm font-bold font-mono text-white flex items-center gap-1">
              <span className="text-emerald-400">94.8%</span>
              <span className="text-[10px] text-zinc-500 font-normal">ATS Score</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Senior Candidate Tier</span>
          </div>
        </div>
      </div>

      {/* 3 Telemetry Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {/* Metric 1: ATS Parser Pass Rate */}
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ATS Parser Pass Rate
            </span>
            <span className="font-mono text-emerald-400 font-semibold">98.4%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
            <div className="w-[98.4%] h-full bg-emerald-500 rounded-full" />
          </div>
          <p className="text-[10px] text-zinc-500">
            Resume formatted cleanly for ATS table & column parsing.
          </p>
        </div>

        {/* Metric 2: Recruiter Semantic Keyword Injector */}
        <div
          onClick={() => !isProfessional && onUnlockClick('Neural ATS Keyword Injector')}
          className={`p-3.5 rounded-xl bg-zinc-950 border transition-all space-y-2 ${
            isProfessional
              ? 'border-zinc-800/90'
              : 'border-amber-500/30 hover:border-amber-500/60 cursor-pointer group'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
              <Target className="w-3.5 h-3.5 text-amber-400" /> Recruiter Keyword Alignment
            </span>
            {isProfessional ? (
              <span className="font-mono text-amber-300 font-semibold text-[11px]">OPTIMIZED</span>
            ) : (
              <span className="font-mono text-amber-400 text-[10px] flex items-center gap-1 group-hover:underline">
                <Lock className="w-2.5 h-2.5" /> PRO ONLY
              </span>
            )}
          </div>
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
            <div className="w-[82%] h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full" />
          </div>
          <p className="text-[10px] text-zinc-400">
            {isProfessional ? (
              '16 high-impact keywords actively injected into custom screening answers.'
            ) : (
              <span className="flex items-center gap-1 text-amber-300">
                <span>🔒 14 High-Impact Keywords Locked. Click to unlock →</span>
              </span>
            )}
          </p>
        </div>

        {/* Metric 3: Stealth Employer Blacklist */}
        <div
          onClick={() => !isProfessional && onUnlockClick('Stealth Employer Shield')}
          className={`p-3.5 rounded-xl bg-zinc-950 border transition-all space-y-2 ${
            isProfessional
              ? 'border-zinc-800/90'
              : 'border-blue-500/30 hover:border-blue-500/60 cursor-pointer group'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
              <Shield className="w-3.5 h-3.5 text-zinc-300" /> Stealth Employer Shield
            </span>
            {isProfessional ? (
              <span className="font-mono text-emerald-400 text-[11px]">UNLIMITED</span>
            ) : (
              <span className="font-mono text-blue-400 text-[10px] flex items-center gap-1 group-hover:underline">
                <Lock className="w-2.5 h-2.5" /> PRO ONLY
              </span>
            )}
          </div>
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
            <div className="w-[65%] h-full bg-zinc-600 rounded-full" />
          </div>
          <p className="text-[10px] text-zinc-400">
            {isProfessional ? (
              'Current employer & agency blacklists actively masking applications.'
            ) : (
              <span className="flex items-center gap-1 text-blue-300">
                <span>🔒 Basic protection. Unlock full competitor matrix →</span>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Up-Sell Teaser Banner if Not Professional */}
      {!isProfessional && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/40 via-black to-blue-950/30 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <Zap className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong className="text-white">Professional Plan</strong> unlocks neural ATS scoring, Harvard ATS resume PDF downloads, daily autonomous sweeps, and 5x/week On-Demand sweeps.
            </span>
          </div>
          <button
            onClick={() => onUnlockClick('Full Professional Suite')}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Upgrade to Professional</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

