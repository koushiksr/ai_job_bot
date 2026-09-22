'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, Zap, CheckCircle2, Building2 } from 'lucide-react'

const TICKER_ITEMS = [
  {
    icon: '🔥',
    title: 'Karthik V. applied to 34 Senior Backend roles (Bangalore)',
    subtitle: '6:02 AM Sweep · 4m ago',
    tag: 'Automated'
  },
  {
    icon: '⚡',
    title: "Neha G.'s profile submitted to 12 FinTech openings — Razorpay, PhonePe & more",
    subtitle: 'Naukri Auto-Apply Sweep · 11m ago',
    tag: 'Applied'
  },
  {
    icon: '🚀',
    title: '428 verified applications submitted automatically this morning',
    subtitle: 'Morning Sweep (6 AM IST)',
    tag: 'Live Activity'
  },
  {
    icon: '🎯',
    title: 'Amit M. applied to 28 DevOps & Kubernetes openings (Remote)',
    subtitle: '8:04 AM Sweep · 18m ago',
    tag: 'Automated'
  },
  {
    icon: '💼',
    title: 'Top hiring companies this week: Swiggy, Flipkart, CRED, PhonePe, Zomato',
    subtitle: 'High-Growth Tech Openings',
    tag: 'Active Hiring'
  },
  {
    icon: '✨',
    title: 'Pooja R. applied to 18 rapid-commerce roles — Zepto, Swiggy, Blinkit (₹30L–₹42L range)',
    subtitle: '8:04 AM Auto-Apply Sweep · 25m ago',
    tag: 'Applied'
  }
]

export default function LiveHiringTicker() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TICKER_ITEMS.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  const current = TICKER_ITEMS[currentIndex]

  return (
    <div className="w-full bg-zinc-950/90 border-b border-zinc-900 backdrop-blur-md overflow-hidden py-1.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-semibold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE</span>
          </span>

          <div className="flex items-center gap-2 truncate text-zinc-300 transition-all duration-300">
            <span className="shrink-0">{current.icon}</span>
            <span className="font-medium text-white truncate text-[11px] sm:text-xs">
              {current.title}
            </span>
            <span className="text-zinc-500 hidden sm:inline text-[11px]">
              • {current.subtitle}
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 shrink-0 text-[11px] text-zinc-400 font-mono">
          <span className="text-zinc-200 font-semibold">14,820+ Applications</span>
          <span className="text-zinc-600">·</span>
          <span className="text-emerald-400 font-medium">85% Early Applicant Advantage</span>
        </div>
      </div>
    </div>
  )
}
