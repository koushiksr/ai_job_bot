'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, CheckCircle2, ArrowRight } from 'lucide-react'

interface LiveToastItem {
  id: string
  avatar: string
  name: string
  city: string
  role: string
  action: string
  timeAgo: string
  companyBadge?: string
}

const TOAST_EVENTS: LiveToastItem[] = [
  {
    id: 't-1',
    avatar: '👨‍💻',
    name: 'Karthik V.',
    city: 'Bengaluru',
    role: 'Senior Backend Engineer',
    action: 'applied to 34 verified openings via 6:00 AM sweep',
    timeAgo: '2m ago',
    companyBadge: 'Razorpay / Swiggy'
  },
  {
    id: 't-2',
    avatar: '👩‍💻',
    name: 'Pooja R.',
    city: 'Hyderabad',
    role: 'Full Stack Engineer',
    action: 'received recruiter interview shortlist (₹32 LPA)',
    timeAgo: '5m ago',
    companyBadge: 'Zepto'
  },
  {
    id: 't-3',
    avatar: '⚡',
    name: 'Rohit M.',
    city: 'Pune',
    role: 'DevOps & Kubernetes',
    action: 'activated 3-Day Free AI Autopilot (100% Free)',
    timeAgo: '7m ago'
  },
  {
    id: 't-4',
    avatar: '🎯',
    name: 'Amit S.',
    city: 'Noida / Remote',
    role: 'Staff AI Engineer',
    action: 'Harvard ATS resume passed 99% Workday filter',
    timeAgo: '11m ago',
    companyBadge: 'Google / Amazon'
  }
]

interface LiveConversionToastProps {
  onActivateFree?: () => void
}

export default function LiveConversionToast({ onActivateFree }: LiveConversionToastProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Show first toast after 4 seconds
    const initialTimer = setTimeout(() => {
      if (!dismissed) setIsVisible(true)
    }, 4000)

    // Cycle every 9 seconds
    const cycleInterval = setInterval(() => {
      if (!dismissed) {
        setIsVisible(false)
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % TOAST_EVENTS.length)
          setIsVisible(true)
        }, 800)
      }
    }, 10000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(cycleInterval)
    }
  }, [dismissed])

  if (dismissed) return null

  const event = TOAST_EVENTS[currentIndex]

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-sm w-full pointer-events-none sm:max-w-md hidden md:block">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-auto p-3.5 rounded-2xl bg-zinc-950/90 border border-cyan-500/30 backdrop-blur-xl shadow-2xl shadow-cyan-950/40 flex items-start gap-3 relative overflow-hidden group cursor-pointer"
            onClick={onActivateFree}
          >
            {/* Ambient Top Glow Line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-950 to-zinc-900 border border-cyan-800/50 flex items-center justify-center text-lg shrink-0 shadow-inner">
              {event.avatar}
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-white">{event.name}</span>
                <span className="text-[10px] text-zinc-400 font-mono">({event.city})</span>
                {event.companyBadge && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                    {event.companyBadge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-300 mt-0.5 leading-snug">
                {event.action}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500 font-mono">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Verified
                </span>
                <span>&bull;</span>
                <span>{event.timeAgo}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setDismissed(true)
              }}
              className="text-zinc-500 hover:text-white p-1 rounded-md transition-colors"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
