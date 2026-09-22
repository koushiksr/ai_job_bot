'use client'

import React, { useState } from 'react'
import { Sparkles, TrendingUp, Zap, ArrowRight, Building, CheckCircle2, ShieldCheck } from 'lucide-react'

interface HeroCareerLeapWidgetProps {
  onStartFree: (mode: 'signin' | 'trial') => void
  onGoogleAuth: () => void
}

const ROLES_DATA: Record<string, { baseOpenings: number; minCtc: number; maxCtc: number; topCompanies: string[] }> = {
  'Backend Engineer (Python / Java / Go / Node)': {
    baseOpenings: 320,
    minCtc: 16,
    maxCtc: 48,
    topCompanies: ['Razorpay', 'Swiggy', 'PhonePe', 'Amazon', 'Zepto']
  },
  'Frontend Engineer (React / Next.js / Vue)': {
    baseOpenings: 240,
    minCtc: 14,
    maxCtc: 38,
    topCompanies: ['CRED', 'Flipkart', 'Zomato', 'Meesho', 'Paytm']
  },
  'Full Stack Engineer (MERN / Spring)': {
    baseOpenings: 380,
    minCtc: 15,
    maxCtc: 42,
    topCompanies: ['Groww', 'Postman', 'InMobi', 'Jio', 'Urban Company']
  },
  'DevOps, SRE & Cloud Architect (AWS / K8s)': {
    baseOpenings: 210,
    minCtc: 18,
    maxCtc: 55,
    topCompanies: ['Microsoft', 'Cisco', 'Salesforce', 'Nutanix', 'Atlassian']
  },
  'Data Scientist & Machine Learning / AI': {
    baseOpenings: 195,
    minCtc: 20,
    maxCtc: 65,
    topCompanies: ['Google', 'Adobe', 'Fractal', 'Tiger Analytics', 'Walmart']
  },
  'QA Automation & SDET (Selenium / Playwright)': {
    baseOpenings: 175,
    minCtc: 12,
    maxCtc: 32,
    topCompanies: ['Oracle', 'Dell', 'SAP', 'Licious', 'MakeMyTrip']
  }
}

const EXPERIENCE_MULTIPLIER: Record<string, { multiplier: number; openingsBonus: number }> = {
  '1-3 Years': { multiplier: 0.8, openingsBonus: 45 },
  '3-6 Years (Mid-Senior)': { multiplier: 1.0, openingsBonus: 70 },
  '6-10 Years (Lead)': { multiplier: 1.4, openingsBonus: 30 },
  '10+ Years (Principal / Architect)': { multiplier: 1.9, openingsBonus: 15 }
}

export default function HeroCareerLeapWidget({
  onStartFree,
  onGoogleAuth
}: HeroCareerLeapWidgetProps) {
  const [selectedRole, setSelectedRole] = useState('Backend Engineer (Python / Java / Go / Node)')
  const [selectedExp, setSelectedExp] = useState('3-6 Years (Mid-Senior)')

  const roleInfo = ROLES_DATA[selectedRole] || ROLES_DATA['Backend Engineer (Python / Java / Go / Node)']
  const expInfo = EXPERIENCE_MULTIPLIER[selectedExp] || EXPERIENCE_MULTIPLIER['3-6 Years (Mid-Senior)']

  const calculatedMinCtc = Math.round(roleInfo.minCtc * expInfo.multiplier)
  const calculatedMaxCtc = Math.round(roleInfo.maxCtc * expInfo.multiplier)
  const calculatedOpenings = roleInfo.baseOpenings + expInfo.openingsBonus

  return (
    <div className="w-full rounded-2xl border border-zinc-800 bg-[#09090b]/90 backdrop-blur-xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
      {/* Top subtle glow accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-500/50 to-transparent pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              ⚡ LIVE OPPORTUNITY SCANNER
            </span>
            <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">Updated 10m ago</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mt-1">
            See How Many Jobs Match You Right Now
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Select your domain &amp; experience to calculate live matching openings &amp; salary potential.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onGoogleAuth}
            className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-white/10 cursor-pointer"
          >
            <span>Claim Free Applications</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 text-xs">
        <div>
          <label className="block text-zinc-300 font-medium mb-1.5 flex items-center justify-between">
            <span>Target Tech Domain</span>
            <span className="text-[10px] text-zinc-500 font-mono">6 Domains Available</span>
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full bg-black border border-zinc-800 focus:border-zinc-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer font-medium"
          >
            {Object.keys(ROLES_DATA).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-zinc-300 font-medium mb-1.5 flex items-center justify-between">
            <span>Years of Experience</span>
            <span className="text-[10px] text-zinc-500 font-mono">CTC Scaling</span>
          </label>
          <select
            value={selectedExp}
            onChange={(e) => setSelectedExp(e.target.value)}
            className="w-full bg-black border border-zinc-800 focus:border-zinc-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer font-medium"
          >
            {Object.keys(EXPERIENCE_MULTIPLIER).map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Real-Time Results Cockpit */}
      <div className="mt-5 p-4 rounded-xl bg-black border border-zinc-800/90 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
        <div className="space-y-1 sm:border-r border-zinc-800/80 sm:pr-4">
          <div className="text-[11px] text-zinc-400 font-medium">Matching Openings Today</div>
          <div className="text-xl sm:text-2xl font-extrabold text-white font-mono flex items-center justify-center sm:justify-start gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{calculatedOpenings}+</span>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">Bangalore, NCR, Hyderabad &amp; Remote</div>
        </div>

        <div className="space-y-1 sm:border-r border-zinc-800/80 sm:pr-4 sm:pl-2">
          <div className="text-[11px] text-zinc-400 font-medium">Target Compensation Range</div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">
            ₹{calculatedMinCtc}L – ₹{calculatedMaxCtc}L CTC
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">Tier-1 Product &amp; High-Growth Startups</div>
        </div>

        <div className="space-y-1 sm:pl-2">
          <div className="text-[11px] text-zinc-400 font-medium">Daily Autopilot Max Cap</div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-300 font-mono flex items-center justify-center sm:justify-start gap-1">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>150 / day</span>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">Dispatched at 6 AM IST (First 10 Rule)</div>
        </div>
      </div>

      {/* Bottom Hiring Logos & Action */}
      <div className="mt-4 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap text-zinc-400 text-[11px]">
          <span className="font-semibold text-zinc-300">Actively Hiring Now:</span>
          {roleInfo.topCompanies.map((c, i) => (
            <span key={i} className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-medium text-[10px]">
              {c}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onStartFree('trial')}
          className="inline-flex items-center justify-center gap-1.5 text-xs text-white font-bold hover:underline cursor-pointer py-1"
        >
          <span>Set Up Target Roles in 30 Seconds</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
