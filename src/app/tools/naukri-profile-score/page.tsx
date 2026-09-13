'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Zap,
  Info,
  ShieldAlert,
  Flame
} from 'lucide-react'

import ToolsHeader from '@/components/ToolsHeader'
import ToolsFooter from '@/components/ToolsFooter'

export default function NaukriProfileScorePage() {
  const [lastUpdate, setLastUpdate] = useState<'today' | 'week' | 'month' | 'old'>('week')
  const [noticePeriod, setNoticePeriod] = useState<'immediate' | '15' | '30' | '90'>('15')
  const [skillCount, setSkillCount] = useState<'high' | 'medium' | 'low'>('medium')
  const [resumeType, setResumeType] = useState<'ats' | 'canva' | 'none'>('ats')
  const [headlineType, setHeadlineType] = useState<'optimal' | 'basic' | 'weak'>('optimal')

  // Calculate algorithmic score
  let score = 0

  // 1. Last Update (Freshness factor is 40% of Naukri Resdex)
  if (lastUpdate === 'today') score += 40
  else if (lastUpdate === 'week') score += 25
  else if (lastUpdate === 'month') score += 10
  else score += 2

  // 2. Notice period (Recruiters filter by < 30 days)
  if (noticePeriod === 'immediate') score += 25
  else if (noticePeriod === '15') score += 20
  else if (noticePeriod === '30') score += 12
  else score += 3

  // 3. Skill count
  if (skillCount === 'high') score += 15
  else if (skillCount === 'medium') score += 10
  else score += 3

  // 4. Headline quality
  if (headlineType === 'optimal') score += 15
  else if (headlineType === 'basic') score += 8
  else score += 2

  // 5. Resume format
  if (resumeType === 'ats') score += 5
  else if (resumeType === 'canva') score += 2
  else score += 0

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white relative">
      {/* Subtle Auth0 ambient radial light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-spotlight pointer-events-none" />

      {/* Static Canonical Navbar */}
      <ToolsHeader />

      {/* Breadcrumb Navigation */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 w-full flex items-center gap-1.5 text-xs text-zinc-400">
        <Link href="/tools" className="hover:text-white transition-colors">
          Free Tools
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-zinc-200 font-medium">Naukri Recruiter Visibility Calculator</span>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 relative z-10 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-zinc-950 border border-zinc-800 text-zinc-300">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" /> Naukri Resdex Algorithm Diagnostics
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">
            Naukri Recruiter Visibility Calculator
          </h1>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
            Understand where your profile appears when recruiters search candidates on Naukri.com.
          </p>
        </div>

        {/* Live Score Display */}
        <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Your Resdex Inbound Score
            </span>
            <div className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
              {score} <span className="text-2xl text-zinc-500 font-normal">/ 100</span>
            </div>
            <p className="text-xs text-zinc-300 mt-2">
              {score >= 80 ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Flame className="w-4 h-4" /> Top 5% (Page 1 in Recruiter Search Results)
                </span>
              ) : score >= 60 ? (
                <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Average (Page 3–4 in Search Results)
                </span>
              ) : (
                <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Buried (Page 6+ · Less than 1 call/week)
                </span>
              )}
            </p>
          </div>

          <div className="bg-black border border-zinc-800/80 rounded-2xl p-4 text-xs max-w-sm">
            <div className="flex items-center gap-1.5 text-purple-400 font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Recruiter Search Fact
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Over <strong className="text-zinc-200">78% of recruiter profile clicks</strong> go to candidates who updated their profile within the last 48 hours. Daily profile touches guarantee Page 1 placement.
            </p>
          </div>
        </div>

        {/* Questionnaire Form */}
        <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-6 space-y-6 mb-12">
          {/* Question 1 */}
          <div>
            <label className="block text-xs font-bold text-zinc-200 mb-2">
              1. When was the last time you edited or touched your Naukri profile?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { id: 'today', label: 'Within 24 Hours', desc: 'Page 1 Freshness' },
                { id: 'week', label: 'This Week', desc: 'Acceptable' },
                { id: 'month', label: 'Last Month', desc: 'Losing Rank' },
                { id: 'old', label: '> 1 Month Ago', desc: 'Buried' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setLastUpdate(opt.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    lastUpdate === opt.id
                      ? 'bg-purple-500/10 border-purple-500/50 text-white'
                      : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-[10px] text-zinc-500">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Question 2 */}
          <div>
            <label className="block text-xs font-bold text-zinc-200 mb-2">
              2. What is your stated Notice Period?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { id: 'immediate', label: 'Immediate / Serving', desc: 'Highest Inbound' },
                { id: '15', label: '15 Days', desc: 'High Priority' },
                { id: '30', label: '30 Days', desc: 'Standard' },
                { id: '90', label: '60 - 90 Days', desc: 'Often Filtered Out' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setNoticePeriod(opt.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    noticePeriod === opt.id
                      ? 'bg-purple-500/10 border-purple-500/50 text-white'
                      : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-[10px] text-zinc-500">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Question 3 */}
          <div>
            <label className="block text-xs font-bold text-zinc-200 mb-2">
              3. How is your Profile Headline formatted?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {[
                { id: 'optimal', label: 'Role + Core Tech + Notice', desc: 'e.g. Python Backend | FastAPI · AWS · Immediate' },
                { id: 'basic', label: 'Role + Experience', desc: 'e.g. Senior Software Engineer (4 Years)' },
                { id: 'weak', label: 'Generic / Empty', desc: 'e.g. Looking for opportunities' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setHeadlineType(opt.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    headlineType === opt.id
                      ? 'bg-purple-500/10 border-purple-500/50 text-white'
                      : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-[10px] text-zinc-500">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Conversion */}
        <div className="rounded-3xl border border-purple-500/30 bg-[#09090b] p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-white mb-1.5">
              Want a guaranteed 95+ score every single day?
            </h3>
            <p className="text-xs text-zinc-400 max-w-lg leading-relaxed">
              JobFlux AI runs automated daily 9 AM profile touch algorithms and submits up to 50 targeted applications each morning while you sleep.
            </p>
          </div>
          <Link
            href="/"
            className="relative z-10 whitespace-nowrap inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-zinc-950 font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-purple-500/20 transition-all"
          >
            Start Autonomous JobFlux <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* Static Canonical Footer */}
      <ToolsFooter />
    </div>
  )
}

