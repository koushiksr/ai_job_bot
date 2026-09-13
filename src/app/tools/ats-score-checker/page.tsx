'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  Search,
  FileText,
  ShieldCheck,
  Zap
} from 'lucide-react'

import ToolsHeader from '@/components/ToolsHeader'
import ToolsFooter from '@/components/ToolsFooter'

const SAMPLE_RESUME = `Karthik Rao - Full Stack Software Engineer
Email: karthik.rao@example.com | Bengaluru, India
Summary: 4+ years of software engineering experience building scalable microservices and web applications using Python, JavaScript, and Docker.
Skills: Python, FastAPI, Django, JavaScript, React, Docker, PostgreSQL, Git, REST APIs
Experience:
Software Engineer at CloudTech Systems (2022 - Present)
- Developed RESTful APIs using FastAPI and PostgreSQL handling 5,000 requests per minute.
- Containerized backend services with Docker, reducing staging deployment time by 40%.
- Integrated React frontends with asynchronous Python backend services.`

const SAMPLE_JD = `Senior Backend Engineer (Python / Cloud)
Location: Bengaluru / Remote
Requirements:
- 3+ years experience with Python, FastAPI, and asynchronous programming.
- Experience with AWS (ECS, S3, RDS), Docker, and Kubernetes.
- Deep knowledge of PostgreSQL, Redis caching, and database indexing.
- Familiarity with CI/CD pipelines, Kafka message queues, and Microservices architecture.`

export default function AtsScoreCheckerPage() {
  const [resumeText, setResumeText] = useState(SAMPLE_RESUME)
  const [jdText, setJdText] = useState(SAMPLE_JD)
  const [analyzing, setAnalyzing] = useState(false)
  const [score, setScore] = useState<number | null>(72)
  const [matchedKeywords, setMatchedKeywords] = useState<string[]>([
    'Python',
    'FastAPI',
    'Docker',
    'PostgreSQL',
    'REST APIs',
    'Microservices'
  ])
  const [missingKeywords, setMissingKeywords] = useState<string[]>([
    'AWS',
    'Kubernetes',
    'Redis',
    'Kafka',
    'CI/CD'
  ])

  const handleAnalyze = () => {
    if (!resumeText.trim() || !jdText.trim()) return

    setAnalyzing(true)
    setTimeout(() => {
      // Client-side fast heuristic keyword extractor
      const cleanJd = jdText.toLowerCase()
      const cleanResume = resumeText.toLowerCase()

      const commonTechKeywords = [
        'python', 'fastapi', 'django', 'react', 'node.js', 'typescript', 'javascript',
        'aws', 'docker', 'kubernetes', 'postgresql', 'mongodb', 'mysql', 'redis',
        'kafka', 'ci/cd', 'microservices', 'graphql', 'rest', 'git', 'linux',
        'terraform', 'sql', 'spark', 'etl', 'pandas', 'java', 'spring', 'c++',
        'golang', 'azure', 'gcp', 'rabbitmq', 'elasticsearch'
      ]

      const jdKeywords = commonTechKeywords.filter(k => cleanJd.includes(k))
      const matched = jdKeywords.filter(k => cleanResume.includes(k))
      const missing = jdKeywords.filter(k => !cleanResume.includes(k))

      // Match score calculation
      let calculatedScore = 50
      if (jdKeywords.length > 0) {
        calculatedScore = Math.round((matched.length / jdKeywords.length) * 100)
      }

      setScore(Math.max(35, Math.min(98, calculatedScore)))
      setMatchedKeywords(matched.map(k => k.toUpperCase()))
      setMissingKeywords(missing.map(k => k.toUpperCase()))
      setAnalyzing(false)
    }, 600)
  }

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white relative">
      {/* Subtle Auth0 ambient radial light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-spotlight pointer-events-none" />

      {/* Static Canonical Navbar */}
      <ToolsHeader />

      {/* Breadcrumb Navigation */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 w-full flex items-center gap-1.5 text-xs text-zinc-400">
        <Link href="/tools" className="hover:text-white transition-colors">
          Free Tools
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-zinc-200 font-medium">ATS Resume & Keyword Gap Checker</span>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 relative z-10 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-zinc-950 border border-zinc-800 text-zinc-300">
            <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" /> Harvard ATS Parser Diagnostics
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">
            ATS Resume & Keyword Gap Checker
          </h1>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
            Compare your resume text against any target job description to discover match percentage and missing keywords.
          </p>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" /> Your Resume Content
              </label>
              <button
                onClick={() => setResumeText(SAMPLE_RESUME)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
              >
                Reset Sample
              </button>
            </div>
            <textarea
              rows={9}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-amber-400" /> Target Job Description (JD)
              </label>
              <button
                onClick={() => setJdText(SAMPLE_JD)}
                className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
              >
                Reset Sample
              </button>
            </div>
            <textarea
              rows={9}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste target job requirements / JD here..."
              className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 font-mono focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center mb-10">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs sm:text-sm px-8 py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Scanning Keyword Density...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Calculate ATS Match Score
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {score !== null && (
          <div className="bg-[#09090b] border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl mb-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Score Dial (4 cols) */}
              <div className="md:col-span-4 text-center md:border-r md:border-zinc-800 md:pr-6">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                  Estimated ATS Match
                </span>
                <div className="relative inline-flex items-center justify-center">
                  <div className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                    {score}%
                  </div>
                </div>
                <p className="text-xs text-zinc-400 mt-2">
                  {score >= 80 ? (
                    <span className="text-emerald-400 font-medium">Excellent match! Ready for submission.</span>
                  ) : score >= 60 ? (
                    <span className="text-amber-400 font-medium">Moderate match. Add missing keywords below.</span>
                  ) : (
                    <span className="text-rose-400 font-medium">High risk of automatic rejection by ATS.</span>
                  )}
                </p>
              </div>

              {/* Keywords Breakdown (8 cols) */}
              <div className="md:col-span-8 space-y-5">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 mb-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Matched Keywords Found in Resume
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedKeywords.length > 0 ? (
                      matchedKeywords.map((kw, i) => (
                        <span key={i} className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-medium">
                          ✓ {kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-500">No direct keywords matched yet.</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 mb-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" /> Missing High-Priority Keywords from JD
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {missingKeywords.length > 0 ? (
                      missingKeywords.map((kw, i) => (
                        <span key={i} className="text-[11px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-lg font-medium">
                          + {kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-emerald-400">All core technical keywords matched!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Link to Harvard Resume Builder */}
            <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-zinc-400 text-center sm:text-left">
                Want a guaranteed 95%+ ATS parse score on Workday, Greenhouse, and Naukri?
              </div>
              <Link
                href="/resume-builder"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
              >
                Auto-Fix in Harvard Resume Studio <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Static Canonical Footer */}
      <ToolsFooter />
    </div>
  )
}

