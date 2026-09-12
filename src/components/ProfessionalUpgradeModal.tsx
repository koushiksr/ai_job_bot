'use client'

import React from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Zap,
  Cpu,
  Shield,
  Send,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Crown
} from 'lucide-react'
import JobFluxLogo from './JobFluxLogo'

interface ProfessionalUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  featureTitle?: string
}

export default function ProfessionalUpgradeModal({
  isOpen,
  onClose,
  featureTitle = 'On-Demand Turbo Scout'
}: ProfessionalUpgradeModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-[#09090b] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden card-featured-glow text-zinc-100"
        >
          {/* Laser beam sweep accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-400 to-transparent animate-laser-sweep pointer-events-none" />

          {/* Background Ambient Violet Spotlight */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-2">
            <JobFluxLogo size="sm" showText={false} />
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-violet-950/80 border border-violet-700/60 text-violet-300 font-semibold flex items-center gap-1.5">
              <Crown className="w-3 h-3 text-violet-400" />
              Professional Tier Exclusive
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-2">
            Unlock {featureTitle} with Professional
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-lg">
            This advanced capability is reserved exclusively for candidates on the <strong className="text-zinc-200">Professional Plan</strong>. Upgrade today to unlock instant sweeps, neural ATS scoring, and priority recruiter dispatch.
          </p>

          {/* 4 Professional Power Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-violet-950/60 border border-violet-800/50 flex items-center justify-center text-violet-300">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-semibold text-white">Instant On-Demand Scout</h4>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Run unlimited real-time application sweeps on demand whenever you find fresh jobs, without waiting for the 6 AM & 8 AM runs.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-violet-950/60 border border-violet-800/50 flex items-center justify-center text-violet-300">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-semibold text-white">Neural ATS Keyword Injector</h4>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Dynamically tailors screening Q&As to match recruiter keywords, boosting ATS pass rates on Greenhouse, Workday & Lever.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-violet-950/60 border border-violet-800/50 flex items-center justify-center text-violet-300">
                  <Send className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-semibold text-white">Zero-Queue Recruiter Fast-Path</h4>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Dedicated priority cloud worker queues push your verified applications to the very top of hiring manager review folders.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-violet-950/60 border border-violet-800/50 flex items-center justify-center text-violet-300">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-semibold text-white">Stealth Employer Blacklist</h4>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Automated anonymity shield prevents current employers, subsidiaries, and unwanted staffing agencies from detecting your applications.
              </p>
            </div>
          </div>

          {/* Pricing Highlight Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/30 via-zinc-950 to-violet-950/20 border border-violet-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Professional Plan</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/50 text-emerald-300">
                  SAVE 66% · BEST VALUE
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-white font-mono">₹1,199</span>
                <span className="text-xs text-zinc-500 line-through">₹3,499</span>
                <span className="text-xs text-zinc-400 font-mono">/ 3 Full Months (1,800+ Applications)</span>
              </div>
            </div>

            <Link
              href="/pricing?plan=elite"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-white/10"
            >
              <span>Upgrade to Professional</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Footer Note */}
          <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Or start with 1-Month Essentials for ₹499</span>
            <Link href="/pricing" onClick={onClose} className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
              View All Tiers →
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
