'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, X, Check, Copy, ArrowRight, Tag, Clock, Flame, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { CandidateOffer } from '@/lib/candidateOffers'
import { trackPaymentClick } from '@/lib/tracker'

interface CandidateOfferModalProps {
  isOpen: boolean
  onClose: () => void
  offer?: CandidateOffer | null
  userEmail?: string
}

export default function CandidateOfferModal({
  isOpen,
  onClose,
  offer,
  userEmail
}: CandidateOfferModalProps) {
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 23,
    minutes: 59,
    seconds: 59
  })

  // Fallback default offer if no specific assigned offer was provided
  const activeOffer = offer || {
    id: 'flash-pro-50',
    promo_code: 'FAST50',
    preset_id: 'flash_50',
    offer_title: 'JobFlux Autonomous Elite Dispatcher',
    discount_badge: '⚡ 50% OFF VIP ACCESS',
    original_price: '₹199',
    discounted_price: '₹99',
    claim_url: '/pricing?promo=FAST50',
    custom_message: 'Exclusive candidate promotional discount for unlimited daily autonomous job applications and ATS optimization.',
    created_at: new Date().toISOString()
  }

  // Real-time countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleCopyCode = () => {
    if (activeOffer.promo_code) {
      navigator.clipboard.writeText(activeOffer.promo_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const claimHref = activeOffer.claim_url || `/pricing?promo=${activeOffer.promo_code}`

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 light:bg-white/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-gradient-to-b from-[#161a29] via-[#0d101a] to-[#08090e] border-2 border-amber-400/40 shadow-[0_20px_70px_rgba(245,158,11,0.25)] text-white light:text-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-b from-amber-500/25 to-transparent blur-2xl pointer-events-none" />

        {/* Close Button with high z-index */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          type="button"
          className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-zinc-900/80 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 flex items-center justify-center transition-colors border border-zinc-700/50 cursor-pointer shadow-sm"
          aria-label="Close offer popup"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8 relative z-10">
          {/* Tag / Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 light:text-amber-700 border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              <Flame className="w-3.5 h-3.5 text-amber-400 light:text-amber-600 animate-pulse" />
              <span>{activeOffer.discount_badge || 'Exclusive Candidate Offer'}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-500/15 text-red-400 light:text-red-600 border border-red-500/30">
              <Clock className="w-3 h-3" />
              <span>
                {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
              </span>
            </span>
          </div>

          {/* Heading */}
          <h3 className="text-xl sm:text-2xl font-extrabold text-white light:text-zinc-900 tracking-tight leading-snug">
            {activeOffer.offer_title || 'Unlock Autonomous AI Job Applications'}
          </h3>

          {/* Subtext description */}
          <p className="mt-2 text-sm text-zinc-300 light:text-zinc-700 leading-relaxed">
            {activeOffer.custom_message || 'Activate daily 6 AM IST automated recruiter applications, Harvard single-column ATS resumes, and real-time alerts.'}
          </p>

          {/* Price Showcase Card */}
          <div className="mt-6 p-4 rounded-2xl bg-zinc-900/90 light:bg-zinc-100 border border-zinc-800/80 light:border-zinc-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-400 light:text-zinc-600 block font-medium">Exclusive Unlocked Price</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black text-amber-300 light:text-amber-700 tracking-tight">
                  {activeOffer.discounted_price}
                </span>
                {activeOffer.original_price && (
                  <span className="text-sm font-semibold text-zinc-500 light:text-zinc-600 line-through">
                    {activeOffer.original_price}
                  </span>
                )}
                <span className="text-[11px] font-bold text-emerald-400 light:text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Save 50%+
                </span>
              </div>
            </div>

            {/* Promo Code Box */}
            <div className="flex flex-col items-end">
              <span className="text-[11px] text-zinc-400 light:text-zinc-600 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-400 light:text-amber-600" />
                Promo Code
              </span>
              <button
                onClick={handleCopyCode}
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 light:bg-white/85 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-dashed border-amber-400/60 text-amber-300 light:text-amber-700 text-xs font-mono font-bold transition-all cursor-pointer group"
                title="Click to copy coupon code"
              >
                <span>{activeOffer.promo_code}</span>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600 group-hover:text-amber-300 transition-colors" />
                )}
              </button>
              {copied && (
                <span className="text-[10px] text-emerald-400 light:text-emerald-600 font-semibold mt-1">Copied to clipboard!</span>
              )}
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-zinc-400 light:text-zinc-600">
            <span className="flex items-center gap-1.5 text-zinc-300 light:text-zinc-700">
              <ShieldCheck className="w-4 h-4 text-emerald-400 light:text-emerald-600" />
              Instant 1-Click Activation
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300 light:text-zinc-700">
              <Sparkles className="w-4 h-4 text-amber-400 light:text-amber-600" />
              Verified Harvard ATS Compliance
            </span>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href={claimHref}
              onClick={() => {
                trackPaymentClick(
                  activeOffer.preset_id || 'offer',
                  activeOffer.offer_title || 'Candidate Offer',
                  Number(activeOffer.discounted_price?.replace(/\D/g, '')) || 99,
                  {
                    step: 'candidate_offer_modal_claim',
                    promo_code: activeOffer.promo_code,
                    email: userEmail
                  }
                )
                onClose()
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black light:text-white font-extrabold text-sm shadow-[0_8px_25px_rgba(245,158,11,0.4)] transition-all hover:scale-[1.02] active:scale-[0.99] cursor-pointer text-center"
            >
              <span>Claim Offer ({activeOffer.discounted_price})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3.5 rounded-2xl bg-zinc-900/90 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 text-sm font-semibold border border-zinc-800 light:border-zinc-200 transition-colors cursor-pointer text-center"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
