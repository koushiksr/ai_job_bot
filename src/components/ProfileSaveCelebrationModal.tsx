'use client'

import React, { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Sparkles,
  Clock,
  ArrowRight,
  X,
  ShieldCheck,
  Zap,
  Coffee,
  Crown
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface ProfileSaveCelebrationModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string
  isProfessional?: boolean
}

export default function ProfileSaveCelebrationModal({
  isOpen,
  onClose,
  userEmail = '',
  isProfessional = false
}: ProfileSaveCelebrationModalProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 23,
    minutes: 59,
    seconds: 45
  })

  // Simulated 24-hour welcome offer countdown
  useEffect(() => {
    if (!isOpen) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 }
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-gradient-to-b from-[#0e131f] via-[#090b10] to-[#050608] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(16,185,129,0.25)] space-y-6 overflow-hidden"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 right-1/2 transform translate-x-1/2 -translate-y-12 w-64 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Celebration Header */}
          <div className="text-center space-y-2 relative z-10 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.35)]">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Profile Calibrated & Bot Armed</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              You&apos;re All Set! <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">
                Sit Back & Relax.
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
              JobFlux AI will now search matching openings, formulate screening answers, and{' '}
              <strong className="text-white">apply on your behalf</strong> during peak morning recruiter windows.
            </p>
          </div>

          {/* Sit Back & Relax Affirmation Card */}
          <div className="p-4 rounded-2xl bg-black/60 border border-zinc-800/80 space-y-3 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/60">
                <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">Next Scheduled Run</div>
                  <div className="text-[11px] text-zinc-400 font-mono">Tomorrow · 06:00 AM IST</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/60">
                <Coffee className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">Zero Effort Required</div>
                  <div className="text-[11px] text-zinc-400">Laptop can be off · Runs in cloud</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-zinc-400 bg-zinc-900/60 p-2 rounded-lg font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Safety Guarantee: Human-like pacing & 0 account bans guaranteed.</span>
            </div>
          </div>

          {/* High-Converting Subscription Upsell Hook (Shown if not yet Professional) */}
          {!isProfessional && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#151208] to-amber-950/40 border-2 border-amber-500/60 space-y-3 relative z-10 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">
                    Exclusive New Candidate Pass
                  </span>
                </div>
                <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                  <span>Expires in:</span>
                  <span className="font-bold text-white">
                    {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>Upgrade to Professional for 10x More Interview Calls</span>
                  <span className="text-xs line-through text-zinc-500 font-mono">₹1,000</span>
                  <span className="text-sm font-extrabold text-emerald-400 font-mono">₹199 / mo</span>
                </h4>
                <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                  Free Trial stops after 15 applications. Professional unlocks <strong className="text-white">1,800+ continuous applications</strong>, zero-queue recruiter priority delivery, and the FAANG Harvard ATS Resume Studio.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                <Link
                  href="/pricing?promo=WELCOMEPRO"
                  onClick={onClose}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  <span>Claim Welcome Pass for ₹199 (Save 80%)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto py-2 px-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold cursor-pointer"
                >
                  Continue with Trial
                </button>
              </div>
            </div>
          )}

          {/* Simple Done / Dismiss for Pros */}
          {isProfessional && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <span>Back to Mission Control Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
