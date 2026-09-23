'use client'

import React from 'react'
import { Flame, Crown, Heart, ShieldCheck, ArrowRight, Zap, Target, Lock, CheckCircle2 } from 'lucide-react'

interface JobFluxFourPillarsProps {
  onStartFree: (mode: 'signin' | 'trial') => void
  onGoogleAuth: () => void
}

export default function JobFluxFourPillars({
  onStartFree,
  onGoogleAuth
}: JobFluxFourPillarsProps) {
  return (
    <section id="why-jobflux" className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t border-zinc-900 light:border-zinc-200 z-10 space-y-12 scroll-mt-20">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-semibold text-white light:text-zinc-900">THE CAREER REVOLUTION</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400 light:text-zinc-600">NEED • STATUS • PASSION • TRUST</span>
        </div>

        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white light:text-zinc-900 tracking-tight leading-tight">
          The Unfair Advantage Ambitious <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-sky-300">
            Tech Professionals Rely On.
          </span>
        </h2>

        <p className="text-xs sm:text-sm text-zinc-400 light:text-zinc-600 max-w-2xl mx-auto leading-relaxed">
          Why settle for applying to 3 jobs a week and waiting months for rejection emails? JobFlux delivers the speed, status, and peace of mind you deserve.
        </p>
      </div>

      {/* 4 Pillars Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Pillar 1: The Burning Need */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#09090b] border border-zinc-800/80 light:border-zinc-200 hover:border-amber-500/30 transition-all space-y-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
          
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 light:text-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Flame className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 light:text-amber-600 font-bold">
              PILLAR 1: THE BURNING NEED
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white light:text-zinc-900">
              Beat The Recruiter Black Hole (First 10 Rule)
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 light:text-zinc-600 leading-relaxed">
              Recruiters receive 400+ applications per job listing and only review the first 15–20 candidates before closing the tab. If you apply manually at 9 PM after work, your resume is buried on Page 14.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-800/60 light:border-zinc-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-amber-300 light:text-amber-700 font-mono text-[11px] font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>Applied at 6 AM IST = #1 on Recruiter Desk</span>
            </div>
          </div>
        </div>

        {/* Pillar 2: The Career Status */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#09090b] border border-zinc-800/80 light:border-zinc-200 hover:border-sky-500/30 transition-all space-y-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-sky-500/10 transition-colors" />
          
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
            <Crown className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">
              PILLAR 2: THE CAREER STATUS
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white light:text-zinc-900">
              Target High-Growth Product Companies (₹20L–₹75L CTC)
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 light:text-zinc-600 leading-relaxed">
              Stop competing in low-paying 3–6 LPA body shops. JobFlux includes 1-tap blacklist filters for mass IT consultancies (TCS, Infosys, Wipro, Cognizant, Accenture) and targets tier-1 product MNCs and venture-backed startups.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-800/60 light:border-zinc-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-sky-300 font-mono text-[11px] font-semibold">
              <Target className="w-3.5 h-3.5" />
              <span>Direct access to Tier-1 product tech hiring</span>
            </div>
          </div>
        </div>

        {/* Pillar 3: The Passion */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#09090b] border border-zinc-800/80 light:border-zinc-200 hover:border-rose-500/30 transition-all space-y-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-rose-500/10 transition-colors" />
          
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 light:text-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
            <Heart className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 light:text-rose-600 font-bold">
              PILLAR 3: THE PASSION
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white light:text-zinc-900">
              Reclaim 15 Hours Every Week for What Matters
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 light:text-zinc-600 leading-relaxed">
              Reclaim your evenings and weekends. Stop typing work history, notice periods, and CTC expectations into dozens of browser tabs. Spend your time mastering system design, DSA, coding projects, or relaxing with loved ones.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-800/60 light:border-zinc-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-rose-300 light:text-rose-600 font-mono text-[11px] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Full autopilot — zero manual portal grinding</span>
            </div>
          </div>
        </div>

        {/* Pillar 4: The Trusted Brand */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#09090b] border border-zinc-800/80 light:border-zinc-200 hover:border-emerald-500/30 transition-all space-y-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 light:text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 light:text-emerald-600 font-bold">
              PILLAR 4: THE TRUSTED BRAND
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white light:text-zinc-900">
              Bank-Grade Security &amp; Anti-Ban Guarantee
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 light:text-zinc-600 leading-relaxed">
              Zero portal password needed to create your account. Intelligent human-like browser pacing mimics natural mouse movements and typing delays. Automatic employer blocker guarantees your current company never knows you're looking.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-800/60 light:border-zinc-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-300 light:text-emerald-700 font-mono text-[11px] font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero data-leak sanitization · 100% Anti-Ban</span>
            </div>
          </div>
        </div>

      </div>

      {/* High-Impact Call to Action Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 light:border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-1.5">
          <h3 className="text-lg sm:text-xl font-bold text-white light:text-zinc-900">
            Ready to experience 100% hands-free job applications?
          </h3>
          <p className="text-xs text-zinc-400 light:text-zinc-600">
            Create your account in 30 seconds. Zero payment required. No credit card.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onGoogleAuth}
            className="px-6 py-3 rounded-xl bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 font-extrabold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-xl shadow-white/10 cursor-pointer"
          >
            <span>Start Free with Google (1-Click)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
