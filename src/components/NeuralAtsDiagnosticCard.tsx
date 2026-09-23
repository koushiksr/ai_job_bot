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
    <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800 light:border-zinc-200 space-y-4 relative overflow-hidden card-featured-glow text-zinc-100 light:text-zinc-900">
      {/* Subtle top accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-600/40 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex items-center justify-center text-zinc-300 light:text-zinc-700 shrink-0">
            <Cpu className="w-4 h-4 text-zinc-300 light:text-zinc-700" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-semibold text-white light:text-zinc-900 tracking-tight">
                Neural ATS Recruiter Readiness Diagnostic
              </h3>
              {isProfessional ? (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 font-semibold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-zinc-400 light:text-zinc-600" /> NEURAL ACTIVE
                </span>
              ) : (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 font-medium">
                  STANDARD ENGINE
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 light:text-zinc-600 mt-0.5">
              Continuous parsing calibration for Workday, Greenhouse, Taleo & Lever ATS systems.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="text-right">
            <div className="text-sm font-bold font-mono text-white light:text-zinc-900 flex items-center gap-1">
              <span className="text-zinc-200 light:text-zinc-800">94.8%</span>
              <span className="text-[10px] text-zinc-500 light:text-zinc-600 font-normal">ATS Score</span>
            </div>
            <span className="text-[10px] text-zinc-500 light:text-zinc-600 font-mono">Senior Candidate Tier</span>
          </div>
        </div>
      </div>

      {/* 3 Telemetry Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {/* Metric 1: ATS Parser Pass Rate */}
        <div className="p-3.5 rounded-xl bg-zinc-950 light:bg-white border border-zinc-800/90 light:border-zinc-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 light:text-zinc-600 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" /> ATS Parser Pass Rate
            </span>
            <span className="font-mono text-zinc-200 light:text-zinc-800 font-semibold">98.4%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-900 light:bg-zinc-100 rounded-full overflow-hidden">
            <div className="w-[98.4%] h-full bg-zinc-300 rounded-full" />
          </div>
          <p className="text-[10px] text-zinc-500 light:text-zinc-600">
            Resume formatted cleanly for ATS table & column parsing.
          </p>
        </div>

        {/* Metric 2: Recruiter Semantic Keyword Injector */}
        <div
          onClick={() => !isProfessional && onUnlockClick('Neural ATS Keyword Injector')}
          className={`p-3.5 rounded-xl bg-zinc-950 light:bg-white border transition-all space-y-2 ${
            isProfessional
              ? 'border-zinc-800/90 light:border-zinc-200'
              : 'border-zinc-800 light:border-zinc-200 hover:border-zinc-700 light:hover:border-zinc-300 cursor-pointer group'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 light:text-zinc-600 flex items-center gap-1.5 font-medium">
              <Target className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" /> Recruiter Keyword Alignment
            </span>
            {isProfessional ? (
              <span className="font-mono text-zinc-200 light:text-zinc-800 font-semibold text-[11px]">OPTIMIZED</span>
            ) : (
              <span className="font-mono text-zinc-400 light:text-zinc-600 text-[10px] flex items-center gap-1 group-hover:underline">
                <Lock className="w-2.5 h-2.5" /> PRO ONLY
              </span>
            )}
          </div>
          <div className="w-full h-1.5 bg-zinc-900 light:bg-zinc-100 rounded-full overflow-hidden">
            <div className="w-[82%] h-full bg-zinc-400 rounded-full" />
          </div>
          <p className="text-[10px] text-zinc-400 light:text-zinc-600">
            {isProfessional ? (
              '16 high-impact keywords actively injected into custom screening answers.'
            ) : (
              <span className="flex items-center gap-1 text-zinc-400 light:text-zinc-600">
                <span>🔒 14 High-Impact Keywords Locked. Click to unlock →</span>
              </span>
            )}
          </p>
        </div>

        {/* Metric 3: Stealth Employer Blacklist */}
        <div
          onClick={() => !isProfessional && onUnlockClick('Stealth Employer Shield')}
          className={`p-3.5 rounded-xl bg-zinc-950 light:bg-white border transition-all space-y-2 ${
            isProfessional
              ? 'border-zinc-800/90 light:border-zinc-200'
              : 'border-zinc-800 light:border-zinc-200 hover:border-zinc-700 light:hover:border-zinc-300 cursor-pointer group'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 light:text-zinc-600 flex items-center gap-1.5 font-medium">
              <Shield className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" /> Stealth Employer Shield
            </span>
            {isProfessional ? (
              <span className="font-mono text-zinc-200 light:text-zinc-800 text-[11px]">UNLIMITED</span>
            ) : (
              <span className="font-mono text-zinc-400 light:text-zinc-600 text-[10px] flex items-center gap-1 group-hover:underline">
                <Lock className="w-2.5 h-2.5" /> PRO ONLY
              </span>
            )}
          </div>
          <div className="w-full h-1.5 bg-zinc-900 light:bg-zinc-100 rounded-full overflow-hidden">
            <div className="w-[65%] h-full bg-zinc-600 rounded-full" />
          </div>
          <p className="text-[10px] text-zinc-400 light:text-zinc-600">
            {isProfessional ? (
              'Current employer & agency blacklists actively masking applications.'
            ) : (
              <span className="flex items-center gap-1 text-zinc-400 light:text-zinc-600">
                <span>🔒 Basic protection. Unlock full competitor matrix →</span>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Up-Sell Teaser Banner if Not Professional */}
      {!isProfessional && (
        <div className="p-3.5 rounded-xl bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-300 light:text-zinc-700">
            <Zap className="w-4 h-4 text-zinc-400 light:text-zinc-600 shrink-0" />
            <span>
              <strong className="text-white light:text-zinc-900">Professional Plan</strong> unlocks neural ATS scoring, Harvard ATS resume PDF downloads, daily autonomous sweeps, and 5x/week On-Demand sweeps.
            </span>
          </div>
          <button
            onClick={() => onUnlockClick('Full Professional Suite')}
            className="px-3.5 py-1.5 rounded-lg bg-white light:bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 light:hover:bg-zinc-100 text-black light:text-zinc-900 light:text-zinc-900 font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Upgrade to Professional</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

