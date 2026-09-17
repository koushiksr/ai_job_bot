import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Sparkles,
  FileCheck2,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Bot,
  Zap,
  ShieldCheck
} from 'lucide-react'
import ToolsHeader from '@/components/ToolsHeader'
import ToolsFooter from '@/components/ToolsFooter'

export const metadata: Metadata = {
  title: 'Free AI Career & Profile Optimization Tools | JobFlux AI',
  description:
    'Free AI career tools for Indian tech job seekers: Recruiter Profile Headline Generator, Harvard ATS Resume Match Checker, and Recruiter Search Visibility Calculator.',
  keywords: [
    'recruiter headline generator',
    'free ats resume checker',
    'profile visibility calculator',
    'recruiter algorithm ranking',
    'job apply automation tools',
    'ai resume builder'
  ],
  alternates: {
    canonical: '/tools'
  }
}

const TOOLS = [
  {
    title: 'Recruiter Headline & Summary AI Generator',
    slug: '/tools/headline-generator',
    icon: Sparkles,
    badge: 'Trending · 3x Inbound Calls',
    badgeColor: 'bg-zinc-800 text-zinc-200 border-zinc-700',
    description:
      'Generate click-through optimized headlines under 100 characters strictly tuned to pass recruiter search algorithms. Includes a keyword-rich 250-word profile summary.',
    features: ['Strictly < 100 Char Cutoff', 'Recruiter Keyword Magnet', '1-Click Instant Copy', 'Experience & Notice Period Formats']
  },
  {
    title: 'Harvard ATS Resume & Keyword Gap Scanner',
    slug: '/tools/ats-score-checker',
    icon: FileCheck2,
    badge: 'Free ATS Diagnostic',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    description:
      'Paste your resume alongside any target Job Description to instantly calculate match score %, identify missing high-priority keywords, and get instant formatting fixes.',
    features: ['Percentage Match Score', 'Missing Keyword Extraction', 'Workday & Lever Compliant', 'Auto-fix in Harvard Studio']
  },
  {
    title: 'Recruiter Search Visibility Calculator',
    slug: '/tools/profile-score',
    icon: TrendingUp,
    badge: 'Recruiter Search Ranking',
    badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    description:
      'Find out which page of recruiter searches your profile lands on. Calculate your score based on active touch timestamps, notice period, and keyword density.',
    features: ['Page 1 vs Page 5+ Estimator', 'Freshness Factor Breakdown', 'Notice Period Impact', 'Daily Bump Optimization Tips']
  }
]

export default function ToolsHubPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white relative">
      {/* Subtle Auth0 ambient radial light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-spotlight pointer-events-none" />

      {/* Static Canonical Navbar */}
      <ToolsHeader />

      {/* Main Content Hero */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 relative z-10 w-full space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-zinc-950 border border-zinc-800 text-zinc-300">
            <Zap className="w-3.5 h-3.5 text-cyan-400" /> 100% Free · No Sign-Up Barrier
          </div>
          <h1 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight leading-tight">
            Free AI Career &amp; Profile <br className="hidden sm:inline" />
            <span className="text-zinc-400">Optimization Suite</span>
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Engineered specifically for Indian software engineers and tech professionals. Optimize your recruiter visibility, beat ATS filters, and accelerate recruiter callbacks.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.slug}
                href={tool.slug}
                className="group relative rounded-2xl border border-zinc-800 bg-[#09090b] p-6 sm:p-7 hover:border-zinc-700 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-black card-featured-glow"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6 text-zinc-200" />
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${tool.badgeColor}`}>
                      {tool.badge}
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors mb-2.5">
                    {tool.title}
                  </h2>
                  <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                    {tool.description}
                  </p>

                  <ul className="space-y-2.5 mb-6">
                    {tool.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors">
                  <span>Open Tool Free</span>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Feature Highlight / Upsell to Main Bot */}
        <div className="rounded-3xl border border-zinc-800 bg-[#09090b] p-8 md:p-12 relative overflow-hidden space-y-6">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Bot className="w-3.5 h-3.5" /> Next-Level Automation
            </div>
            <h2 className="text-2xl sm:text-4xl font-semibold text-white tracking-tight">
              Why apply manually when JobFlux AI can do it 24/7?
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-2xl">
              Our automated Playwright engine runs dual morning batches at 6 AM & 8 AM IST, submits to 50 targeted jobs every day, solves dynamic recruiter questionnaires with AI, and touches your profile daily for top recruiter search ranking.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/?mode=trial"
                className="inline-flex items-center gap-2 bg-white hover:bg-zinc-200 text-black font-semibold text-xs sm:text-sm px-6 py-3 rounded-lg shadow-lg shadow-white/5 transition-all"
              >
                <span>Start Autonomous Job Apply Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/resume-builder"
                className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold text-xs sm:text-sm px-6 py-3 rounded-lg transition-all"
              >
                <span>Build Harvard ATS Resume</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Static Canonical Footer */}
      <ToolsFooter />
    </div>
  )
}
