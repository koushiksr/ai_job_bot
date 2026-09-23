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
import { trackPaymentClick } from '@/lib/tracker'

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
  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#09090b] border border-zinc-800 light:border-zinc-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl card-featured-glow text-zinc-100 light:text-zinc-900"
        >
          {/* Subtle top accent */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-600/40 to-transparent pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            aria-label="Close modal"
            className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-800/80 light:hover:bg-zinc-200 transition-colors cursor-pointer z-50"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-2">
            <JobFluxLogo size="sm" showText={false} />
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 font-medium flex items-center gap-1.5">
              <Crown className="w-3 h-3 text-amber-400 light:text-amber-600" />
              Professional Tier Exclusive
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white light:text-zinc-900 mt-2">
            Unlock {featureTitle} with Professional
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 light:text-zinc-600 mt-1 max-w-lg">
            This advanced capability is reserved exclusively for candidates on the <strong className="text-zinc-200 light:text-zinc-800">Professional Plan</strong>. Upgrade today to unlock instant sweeps, neural ATS scoring, and priority recruiter dispatch.
          </p>

          {/* 4 Professional Power Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
            <div className="p-3.5 rounded-xl bg-zinc-950 light:bg-white border border-zinc-800/90 light:border-zinc-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex items-center justify-center text-zinc-300 light:text-zinc-700">
                    <Zap className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" />
                  </div>
                  <h4 className="text-xs font-semibold text-white light:text-zinc-900">On-Demand Real-Time Sweeps</h4>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 uppercase tracking-wider font-semibold">
                  5x / Week
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 light:text-zinc-600 leading-relaxed">
                Trigger on-demand application sweeps up to 5 times per week whenever you want new openings scanned, processed sequentially on cloud workers.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 light:bg-white border border-zinc-800/90 light:border-zinc-200 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex items-center justify-center text-zinc-300 light:text-zinc-700">
                  <Cpu className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" />
                </div>
                <h4 className="text-xs font-semibold text-white light:text-zinc-900">Neural ATS Keyword Injector</h4>
              </div>
              <p className="text-[11px] text-zinc-400 light:text-zinc-600 leading-relaxed">
                Dynamically tailors screening Q&As to match recruiter keywords, boosting ATS pass rates on Greenhouse, Workday & Lever.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 light:bg-white border border-zinc-800/90 light:border-zinc-200 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex items-center justify-center text-zinc-300 light:text-zinc-700">
                  <Send className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" />
                </div>
                <h4 className="text-xs font-semibold text-white light:text-zinc-900">Zero-Queue Recruiter Fast-Path</h4>
              </div>
              <p className="text-[11px] text-zinc-400 light:text-zinc-600 leading-relaxed">
                Dedicated priority cloud worker queues push your verified applications to the very top of hiring manager review folders.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 light:bg-white border border-zinc-800/90 light:border-zinc-200 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex items-center justify-center text-zinc-300 light:text-zinc-700">
                  <Shield className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" />
                </div>
                <h4 className="text-xs font-semibold text-white light:text-zinc-900">Stealth Employer Blacklist</h4>
              </div>
              <p className="text-[11px] text-zinc-400 light:text-zinc-600 leading-relaxed">
                Automated anonymity shield prevents current employers, subsidiaries, and unwanted staffing agencies from detecting your applications.
              </p>
            </div>
          </div>

          {/* Pricing Highlight Card */}
          <div className="p-4 rounded-xl bg-zinc-900/50 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white light:text-zinc-900 uppercase tracking-wider">Professional Plan</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 light:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800 font-semibold">
                  SAVE 92% · BEST VALUE
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-white light:text-zinc-900 font-mono">₹199</span>
                <span className="text-xs text-zinc-500 light:text-zinc-600 line-through">₹2,500</span>
                <span className="text-xs text-zinc-400 light:text-zinc-600 font-mono">/ 3 Full Months (1,800+ Applications)</span>
              </div>
            </div>

            <Link
              href="/pricing?plan=elite"
              onClick={() => {
                trackPaymentClick('elite', 'JobFlux Professional', 199, {
                  step: 'professional_upgrade_modal_click',
                  feature_trigger: featureTitle
                })
                onClose()
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm"
            >
              <span>{featureTitle.toLowerCase().includes('download') ? 'Buy Subscription to Download' : 'Upgrade to Professional'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Footer Note */}
          <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-500 light:text-zinc-600">
            <span>Or start with 1-Month Essentials for ₹99 (was ₹1,000)</span>
            <Link href="/pricing" onClick={onClose} className="text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 underline transition-colors font-medium">
              View All Tiers →
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

