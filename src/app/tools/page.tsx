import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Sparkles,
  Search,
  FileCheck2,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Clock,
  Zap,
  CheckCircle2,
  Bot
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Free Career & Naukri Automation Tools | JobFlux AI',
  description:
    'Free AI career tools for Indian tech job seekers: Naukri Profile Headline Generator, Harvard ATS Resume Match Checker, and Resdex Profile Visibility Calculator.',
  keywords: [
    'naukri headline generator',
    'free ats resume checker',
    'naukri profile visibility calculator',
    'resdex algorithm ranking',
    'job apply automation tools',
    'naukri resume builder'
  ],
  alternates: {
    canonical: '/tools'
  }
}

const TOOLS = [
  {
    title: 'Naukri Headline & Summary AI Generator',
    slug: '/tools/naukri-headline-generator',
    icon: Sparkles,
    badge: 'Trending · 3x Inbound Calls',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    description:
      'Generate click-through optimized Naukri headlines under 100 characters strictly tuned to pass the Resdex recruiter search algorithm. Includes a keyword-rich 250-word profile summary.',
    features: ['Strictly < 100 Char Cutoff', 'Resdex Keyword Magnet', '1-Click Instant Copy', 'Experience & Notice Period Formats']
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
    title: 'Naukri Resdex Profile Visibility Calculator',
    slug: '/tools/naukri-profile-score',
    icon: TrendingUp,
    badge: 'Recruiter Search Ranking',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    description:
      'Find out which page of recruiter searches your profile lands on. Calculate your score based on active touch timestamps, notice period, and keyword density.',
    features: ['Page 1 vs Page 5+ Estimator', 'Freshness Factor Breakdown', 'Notice Period Impact', 'Daily Bump Optimization Tips']
  }
]

export default function ToolsHubPage() {
  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col selection:bg-cyan-500/30">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-cyan-500/10 to-transparent blur-3xl opacity-50" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-3xl rounded-full" />
      </div>

      {/* Navigation header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-slate-800/80 bg-[#05070f]/80 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20">
              J
            </div>
            <span className="font-bold text-lg tracking-tight group-hover:text-cyan-400 transition-colors">
              JobFlux <span className="text-cyan-400">AI</span>
            </span>
          </Link>

          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/resume-builder" className="text-slate-400 hover:text-white transition-colors">
              ATS Resume Studio
            </Link>
            <Link href="/pricing" className="text-slate-400 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link
              href="/"
              className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 px-3.5 py-1.5 rounded-lg transition-all"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Hero */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 relative z-10 w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4">
            <Zap className="w-3.5 h-3.5" /> 100% Free · No Sign-Up Required
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-5 leading-tight">
            Free AI Career & Naukri <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              Optimization Tools
            </span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            Engineered specifically for Indian software engineers and tech professionals. Optimize your Naukri.com visibility, beat ATS filters, and accelerate recruiter callbacks.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.slug}
                href={tool.slug}
                className="group relative rounded-2xl border border-slate-800/90 bg-slate-900/40 backdrop-blur-sm p-6 hover:border-cyan-500/50 hover:bg-slate-900/70 transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-cyan-500/5"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${tool.badgeColor}`}>
                      {tool.badge}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors mb-2.5">
                    {tool.title}
                  </h2>
                  <p className="text-slate-400 text-xs leading-relaxed mb-6">
                    {tool.description}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {tool.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                  <span>Open Tool</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Feature Highlight / Upsell to Main Bot */}
        <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-slate-900/60 backdrop-blur-xl p-8 md:p-12 relative overflow-hidden">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
              <Bot className="w-3.5 h-3.5" /> Next-Level Automation
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
              Why apply manually when JobFlux AI can do it 24/7?
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
              Our automated Playwright engine runs dual morning batches at 6 AM & 8 AM IST, submits to 50 targeted jobs every day, solves dynamic recruiter questionnaires with AI, and touches your profile daily for top Resdex recruiter ranking.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
              >
                Start Autonomous Job Apply
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/resume-builder"
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm px-6 py-3 rounded-xl transition-all"
              >
                Build Harvard ATS Resume
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#05070f] px-6 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} JobFlux AI. Built for high-growth tech talent across India.</p>
      </footer>
    </div>
  )
}

