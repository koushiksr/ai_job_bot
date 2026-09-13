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
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col selection:bg-cyan-500/30">
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-purple-500/10 to-transparent blur-3xl opacity-60" />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-slate-800/80 bg-[#05070f]/80 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20">
                J
              </div>
              <span className="font-bold text-lg tracking-tight group-hover:text-cyan-400 transition-colors">
                JobFlux <span className="text-cyan-400">AI</span>
              </span>
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-600 hidden sm:inline" />
            <Link href="/tools" className="text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors hidden sm:inline">
              Tools Hub
            </Link>
          </div>

          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/tools" className="text-cyan-400 hover:underline text-xs sm:text-sm">
              All Tools
            </Link>
            <Link href="/tools/naukri-headline-generator" className="text-slate-400 hover:text-white transition-colors text-xs sm:text-sm">
              Headline Generator
            </Link>
            <Link
              href="/"
              className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm transition-all"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 relative z-10 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-3">
            <TrendingUp className="w-3.5 h-3.5" /> Naukri Resdex Algorithm Diagnostics
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
            Naukri Recruiter Visibility Calculator
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            Understand where your profile appears when recruiters search candidates on Naukri.com.
          </p>
        </div>

        {/* Live Score Display */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Your Resdex Inbound Score
            </span>
            <div className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
              {score} <span className="text-2xl text-slate-500 font-normal">/ 100</span>
            </div>
            <p className="text-xs text-slate-300 mt-2">
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

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-xs max-w-sm">
            <div className="flex items-center gap-1.5 text-purple-400 font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Recruiter Search Fact
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Over <strong>78% of recruiter profile clicks</strong> go to candidates who updated their profile within the last 48 hours. Daily profile updates guarantee Page 1 placement.
            </p>
          </div>
        </div>

        {/* Questionnaire Form */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6 mb-12">
          {/* Question 1 */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2">
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
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-[10px] text-slate-500">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Question 2 */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2">
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
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-[10px] text-slate-500">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Question 3 */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2">
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
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-[10px] text-slate-500">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Conversion */}
        <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/20 to-slate-900/60 p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-1.5">
              Want a guaranteed 95+ score every single day?
            </h3>
            <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
              JobFlux AI runs daily 9 AM profile touches and submits 50 applications each morning automatically.
            </p>
          </div>
          <Link
            href="/"
            className="whitespace-nowrap inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-slate-950 font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-purple-500/20 transition-all"
          >
            Start Autonomous JobFlux <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}

