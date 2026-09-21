'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Copy,
  Check,
  Zap,
  ArrowRight,
  Info,
  RefreshCw,
  FileText,
  Star,
  ChevronRight
} from 'lucide-react'
import ToolsHeader from '@/components/ToolsHeader'
import ToolsFooter from '@/components/ToolsFooter'

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

export default function HeadlineGeneratorPage() {
  const [role, setRole] = useState('Full Stack Developer')
  const [experience, setExperience] = useState('3')
  const [skills, setSkills] = useState('React, Node.js, TypeScript, AWS, Docker, MongoDB')
  const [noticePeriod, setNoticePeriod] = useState('Immediate / 15 Days')
  const [domain, setDomain] = useState('SaaS / Scaled Web')

  const [loading, setLoading] = useState(false)
  const [headlines, setHeadlines] = useState<HeadlineOption[]>([
    {
      type: 'Recruiter Keyword Magnet (#1 Ranking)',
      text: 'Full Stack Developer | React · Node.js · TypeScript · AWS · Immediate'
    },
    {
      type: 'Experience & Notice Period Focused',
      text: 'Full Stack Developer (3+ Yrs) | React, Node.js, TypeScript | Notice: 15 Days'
    },
    {
      type: 'Senior & Architecture Driven',
      text: 'Senior Full Stack Developer · High-Scale Systems · React · Node.js'
    }
  ])
  const [summary, setSummary] = useState(
    'Experienced Full Stack Developer with 3+ years building and scaling enterprise web architectures. Proven background in React, Node.js, and cloud deployments with strong focus on performance and clean design.'
  )

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copiedSummary, setCopiedSummary] = useState(false)

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setRole(preset.role)
    setSkills(preset.skills)
    setExperience(preset.exp)
    setNoticePeriod(preset.notice)
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/tools/headline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          experience,
          skills,
          notice_period: noticePeriod,
          domain
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.headlines && data.headlines.length > 0) {
          setHeadlines(data.headlines)
        }
        if (data.summary) {
          setSummary(data.summary)
        }
      }
    } catch (err) {
      console.error('Failed to generate headlines:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyHeadline = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summary)
    setCopiedSummary(true)
    setTimeout(() => setCopiedSummary(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white relative">
      {/* Subtle ambient radial light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-spotlight pointer-events-none" />

      {/* Static Canonical Navbar */}
      <ToolsHeader />

      {/* Breadcrumbs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2 w-full flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <Link href="/tools" className="hover:text-white transition-colors">
          Free Tools
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-zinc-200 font-medium">Recruiter Headline & Summary Generator</span>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 relative z-10 w-full">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-zinc-950 border border-zinc-800 text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Recruiter Search Optimizer
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Recruiter Profile Headline & Summary Generator
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm">
            Generate click-through optimized headlines strictly under 100 characters that trigger recruiter search algorithms.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-zinc-500 mr-1 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Quick Presets:
          </span>
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => handleApplyPreset(p)}
              className="text-xs bg-[#09090b] hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form (5 cols) */}
          <div className="lg:col-span-5 bg-[#09090b] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Candidate Profile Inputs
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">
                  Target Job Role <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Python Developer, React Lead"
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1.5">Total Experience</label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 3.5 Years"
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1.5">Notice Period</label>
                  <input
                    type="text"
                    value={noticePeriod}
                    onChange={(e) => setNoticePeriod(e.target.value)}
                    placeholder="e.g. Immediate, 15 Days"
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">
                  Primary Skills (Comma separated)
                </label>
                <textarea
                  rows={3}
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. React, Node.js, TypeScript, AWS, Docker"
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">Domain / Specialization (Optional)</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. FinTech, Microservices, E-commerce"
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !role.trim()}
                className="w-full mt-2 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Optimized Headlines...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Recruiter Headlines
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-zinc-800/80 text-[11px] text-zinc-400 space-y-2">
              <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> Why does the headline matter so much?
              </div>
              <p className="leading-relaxed text-zinc-500">
                Recruiters use targeted keyword boolean search queries. If your exact role and top skills are not in your headline, your profile is hidden behind 500+ candidates.
              </p>
            </div>
          </div>

          {/* Right Output (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Generated Headlines List */}
            <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  Generated Profile Headlines
                </h2>
                <span className="text-[11px] text-zinc-500 font-mono">Strictly &lt; 100 characters</span>
              </div>

              <div className="space-y-3">
                {headlines.map((item, idx) => {
                  const len = item.text.length
                  const isCopied = copiedIndex === idx
                  return (
                    <div
                      key={idx}
                      className="border border-zinc-800/90 hover:border-zinc-700 rounded-xl p-3.5 bg-black transition-all"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-zinc-300">{item.type}</span>
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
                            className="inline-flex items-center gap-1 text-[11px] bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-2 py-1 rounded transition-colors cursor-pointer border border-zinc-800"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-zinc-400" />
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
            <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-300" />
                  Generated Profile Summary
                </h2>
                <button
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-1 text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border border-zinc-800"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied Summary!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Copy Summary</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-black border border-zinc-800/80 rounded-xl p-4 text-xs text-zinc-300 leading-relaxed font-normal select-all">
                {summary}
              </div>
            </div>

            {/* Conversion CTA Banner */}
            <div className="rounded-2xl border border-zinc-800 bg-[#09090b] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Ready to auto-apply with your updated profile?
                </h3>
                <p className="text-xs text-zinc-400">
                  JobFlux AI submits 50 applications daily and solves recruiter screening questions automatically.
                </p>
              </div>
              <Link
                href="/?mode=trial"
                className="whitespace-nowrap inline-flex items-center gap-1.5 bg-white hover:bg-zinc-200 text-black font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all"
              >
                Launch Bot Free <ArrowRight className="w-3.5 h-3.5" />
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
