'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Copy,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
  Info,
  RefreshCw,
  FileText,
  Star,
  ChevronRight
} from 'lucide-react'

interface HeadlineOption {
  type: string
  text: string
}

const PRESETS = [
  {
    label: 'Python Backend',
    role: 'Python Backend Engineer',
    skills: 'Python, FastAPI, Django, PostgreSQL, Docker, AWS',
    exp: '3',
    notice: '15 Days'
  },
  {
    label: 'Full Stack MERN',
    role: 'Full Stack Developer',
    skills: 'React, Node.js, TypeScript, Next.js, MongoDB, Tailwind',
    exp: '4',
    notice: 'Immediate'
  },
  {
    label: 'Data Engineer',
    role: 'Data Engineer',
    skills: 'PySpark, SQL, Airflow, Snowflake, AWS, Python, ETL',
    exp: '3.5',
    notice: '30 Days'
  },
  {
    label: 'DevOps / Cloud',
    role: 'DevOps Engineer',
    skills: 'Kubernetes, Terraform, AWS, Docker, CI/CD, Linux, Python',
    exp: '5',
    notice: 'Serving Notice'
  }
]

export default function NaukriHeadlineGeneratorPage() {
  const [role, setRole] = useState('Full Stack Developer')
  const [experience, setExperience] = useState('3')
  const [skills, setSkills] = useState('React, Node.js, TypeScript, AWS, Docker, MongoDB')
  const [noticePeriod, setNoticePeriod] = useState('Immediate / 15 Days')
  const [domain, setDomain] = useState('SaaS / Scaled Web')

  const [loading, setLoading] = useState(false)
  const [headlines, setHeadlines] = useState<HeadlineOption[]>([
    {
      type: 'Recruiter Keyword Magnet (Resdex #1)',
      text: 'Full Stack Developer | React · Node.js · TypeScript · AWS · Immediate'
    },
    {
      type: 'Experience & Notice Period Focused',
      text: 'Full Stack Developer (3+ Yrs) | React, Node.js, TypeScript | Notice: 15 Days'
    },
    {
      type: 'Senior & Architecture Driven',
      text: 'Senior Full Stack Developer · High-Scale Systems · React · Node.js'
    },
    {
      type: 'Skill Depth & Availability',
      text: 'Full Stack Developer specializing in React & Node.js | Available to Join'
    },
    {
      type: 'High-Impact Metrics Style',
      text: 'Results-Driven Full Stack Developer | React | Node.js | TypeScript | 3+ Yrs Exp'
    }
  ])
  const [summary, setSummary] = useState(
    'Dedicated Full Stack Developer with 3+ years of experience architecting and delivering high-performance scalable web applications. Proficient in React, Node.js, TypeScript, and AWS cloud environments. Demonstrated track record building responsive interfaces, designing resilient microservices, and collaborating across agile cross-functional engineering teams. Actively seeking opportunities with immediate/quick availability.'
  )

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copiedSummary, setCopiedSummary] = useState(false)

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!role.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/tools/headline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          experience,
          skills,
          noticePeriod,
          domain
        })
      })

      if (!res.ok) throw new Error('Generation failed')
      const data = await res.json()
      if (Array.isArray(data.headlines)) {
        setHeadlines(data.headlines)
      }
      if (data.summary) {
        setSummary(data.summary)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyHeadline = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2500)
  }

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summary)
    setCopiedSummary(true)
    setTimeout(() => setCopiedSummary(false), 2500)
  }

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setRole(preset.role)
    setSkills(preset.skills)
    setExperience(preset.exp)
    setNoticePeriod(preset.notice)
  }

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 flex flex-col selection:bg-cyan-500/30">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-cyan-500/10 to-transparent blur-3xl opacity-60" />
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
            <Link href="/resume-builder" className="text-slate-400 hover:text-white transition-colors text-xs sm:text-sm">
              ATS Studio
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
      <main className="flex-1 max-w-5xl mx-auto px-6 py-10 relative z-10 w-full">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Naukri Resdex Optimizer
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
            Naukri Profile Headline & Summary Generator
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            Generate high-converting headlines strictly under 100 characters that trigger Naukri’s recruiter search algorithms.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Quick Presets:
          </span>
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => applyPreset(p)}
              className="text-xs bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Candidate Profile Inputs
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Target Job Role <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Python Developer, React Lead"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Total Experience</label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 3.5 Years"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Notice Period</label>
                  <input
                    type="text"
                    value={noticePeriod}
                    onChange={(e) => setNoticePeriod(e.target.value)}
                    placeholder="e.g. Immediate, 15 Days"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Primary Skills (Comma separated)
                </label>
                <textarea
                  rows={3}
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. React, Node.js, TypeScript, AWS, Docker"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Domain / Specialization (Optional)</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. FinTech, Microservices, E-commerce"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !role.trim()}
                className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Optimized Headlines...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Resdex Headlines
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
              <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
                <Info className="w-3.5 h-3.5 shrink-0" /> Why does the headline matter so much?
              </div>
              <p className="leading-relaxed">
                Naukri recruiters use <strong>Resdex</strong> boolean search queries. If your exact role and top skills are not in your headline, your profile is hidden behind 500+ candidates.
              </p>
            </div>
          </div>

          {/* Right Output (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Generated Headlines List */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  Generated Naukri Headlines
                </h2>
                <span className="text-[11px] text-slate-400">Strictly &lt; 100 characters</span>
              </div>

              <div className="space-y-3">
                {headlines.map((item, idx) => {
                  const len = item.text.length
                  const isCopied = copiedIndex === idx
                  return (
                    <div
                      key={idx}
                      className="group border border-slate-800 hover:border-cyan-500/40 rounded-xl p-3.5 bg-slate-950/60 transition-all"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-cyan-400">{item.type}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                              len <= 95
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {len} / 100 chars
                          </span>
                          <button
                            onClick={() => handleCopyHeadline(item.text, idx)}
                            className="inline-flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded transition-colors cursor-pointer"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-400" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-white font-medium leading-relaxed select-all">
                        {item.text}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Generated Profile Summary */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Naukri Profile Summary
                </h2>
                <button
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied Summary!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Summary</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-300 leading-relaxed font-normal select-all">
                {summary}
              </div>
            </div>

            {/* Conversion CTA Banner */}
            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 to-blue-950/30 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Ready to auto-apply with your updated profile?
                </h3>
                <p className="text-xs text-slate-400">
                  JobFlux AI submits 50 applications daily and solves recruiter screening questions automatically.
                </p>
              </div>
              <Link
                href="/"
                className="whitespace-nowrap inline-flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
              >
                Launch Bot Free <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

