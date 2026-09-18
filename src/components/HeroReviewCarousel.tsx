'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Quote,
  Sparkles,
  MessageSquarePlus,
  ShieldCheck
} from 'lucide-react'
import { ReviewItem, INITIAL_SAMPLE_REVIEWS } from '@/config/reviews'

interface HeroReviewCarouselProps {
  onOpenReviewModal?: () => void
}

export default function HeroReviewCarousel({ onOpenReviewModal }: HeroReviewCarouselProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(() =>
    INITIAL_SAMPLE_REVIEWS.map((r, i) => ({ ...r, id: `init-${i}` }))
  )
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [avgRating, setAvgRating] = useState<number>(4.8)

  useEffect(() => {
    let isMounted = true
    async function fetchReviews() {
      try {
        const res = await fetch('/api/reviews')
        if (res.ok) {
          const data = await res.json()
          if (isMounted && Array.isArray(data.reviews) && data.reviews.length > 0) {
            setReviews(data.reviews)
            if (typeof data.avg_rating === 'number') {
              setAvgRating(data.avg_rating)
            }
          }
        }
      } catch (err) {
        console.warn('Review carousel fetch fallback:', err)
      }
    }
    fetchReviews()
    return () => {
      isMounted = false
    }
  }, [])

  // Auto-advance every 6 seconds when not hovered
  useEffect(() => {
    if (isPaused || reviews.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % reviews.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [isPaused, reviews.length])

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % reviews.length)
  }

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + reviews.length) % reviews.length)
  }

  const current = reviews[currentIndex] || reviews[0]

  if (!current) return null

  return (
    <div
      className="w-full max-w-xl text-left"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Top Telemetry & Overall Rating Header */}
      <div className="flex items-center justify-between gap-3 mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-xs font-bold text-white font-mono">{avgRating.toFixed(1)}/5.0</span>
          <span className="text-zinc-600 hidden sm:inline">·</span>
          <span className="text-[11px] text-zinc-400 hidden sm:inline flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified Candidate Satisfaction
          </span>
        </div>

        {onOpenReviewModal && (
          <button
            type="button"
            onClick={onOpenReviewModal}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <MessageSquarePlus className="w-3 h-3 text-zinc-400" />
            <span>Rate Experience</span>
          </button>
        )}
      </div>

      {/* Main Glassmorphic Animated Review Card */}
      <div className="relative rounded-2xl bg-zinc-950/90 border border-zinc-800/90 p-4 sm:p-5 shadow-2xl backdrop-blur-md overflow-hidden card-featured-glow">
        {/* Subtle top glow highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/25 to-transparent pointer-events-none" />

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id || currentIndex}
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-3.5"
          >
            {/* Header: Candidate Identity & Satisfaction Pill */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Photo / Avatar */}
                <div className="relative shrink-0">
                  {current.user_avatar ? (
                    <img
                      src={current.user_avatar}
                      alt={current.user_name}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-700 shadow-sm"
                      onError={e => {
                        // Fallback on load error
                        ;(e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                      {current.user_name
                        ? current.user_name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()
                        : 'JD'}
                    </div>
                  )}
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 border-2 border-black" />
                </div>

                {/* Name, Role & Verification */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-white truncate">{current.user_name}</span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-full font-medium">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Verified Candidate
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {current.role_title} {current.company ? `• ${current.company}` : ''}
                  </p>
                </div>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-0.5 text-amber-400 shrink-0 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                <Star className="w-3 h-3 fill-amber-400" />
                <span className="text-[11px] font-bold font-mono text-amber-300 ml-0.5">{Number(current.rating).toFixed(1)}</span>
              </div>
            </div>

            {/* Satisfaction Highlight Tag */}
            {current.satisfaction_level && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-300">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                <span>{current.satisfaction_level}</span>
              </div>
            )}

            {/* Quote Body */}
            <div className="relative pl-3 border-l-2 border-zinc-800 text-xs sm:text-[13px] text-zinc-300 leading-relaxed font-normal italic">
              <Quote className="w-3.5 h-3.5 text-zinc-700 absolute -top-1 -left-2 fill-zinc-800 opacity-60" />
              <span>&ldquo;{current.review_text}&rdquo;</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer Navigation Dots & Prev/Next Arrows */}
        <div className="flex items-center justify-between pt-3.5 border-t border-zinc-900 mt-3 text-xs">
          {/* Pagination Indicators */}
          <div className="flex items-center gap-1.5">
            {reviews.map((r, i) => (
              <button
                key={r.id || i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === currentIndex ? 'w-5 bg-amber-400' : 'w-1.5 bg-zinc-800 hover:bg-zinc-700'
                }`}
                aria-label={`Go to candidate review ${i + 1}`}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-zinc-500 mr-1.5">
              {currentIndex + 1} of {reviews.length}
            </span>
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
              aria-label="Previous review"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
              aria-label="Next review"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
