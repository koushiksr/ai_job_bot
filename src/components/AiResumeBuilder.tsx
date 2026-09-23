'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Lock,
  Download,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Send,
  RefreshCw,
  FileText,
  Briefcase,
  Target,
  Shield,
  Eye,
  Crown,
  Layers,
  ChevronRight
} from 'lucide-react'
import JobFluxLogo from './JobFluxLogo'

interface AiResumeBuilderProps {
  userId: string
  userEmail: string
  userName: string
  isProfessional: boolean
  onUpgradeClick: (featureTitle?: string) => void
}

const SAMPLE_RESUMES = [
  {
    id: 'sample-agentic-rag',
    title: 'Lead AI Engineer (GenAI & Agentic Workflows)',
    bracket: '₹38 - 55 LPA',
    score: 99.7,
    companyTier: 'Enterprise AI / Systems Lab',
    name: 'Karthik S. Rao',
    summary: 'Results-driven AI Engineer with 3+ years engineering enterprise GenAI and production RAG systems. Proven expertise architecting multi-agent autonomous pipelines, custom Model Context Protocol (MCP) tooling, and high-performance LLM-integrated microservices using LangGraph, LangChain, and FastAPI.',
    skills: ['LangGraph', 'LangChain', 'RAG', 'Agentic Workflows', 'Model Context Protocol (MCP)', 'Ollama', 'FastAPI', 'Python AsyncIO', 'LangSmith', 'Docker', 'Vector Search'],
    experience: [
      {
        company: 'Global Systems Consultancy (Client: Global AI PC OEM)',
        role: 'Senior AI Systems Analyst · GenAI Pipeline Development',
        period: 'Mar 2025 – Present',
        bullets: [
          'Engineered robust GenAI pipelines integrating GPT-4, Claude 3.5, and Llama-family models to automate reasoning and multi-class classification across the PC ecosystem.',
          'Designed and implemented end-to-end RAG architecture (semantic chunking, Nomic embeddings, vector indexing) slashing hallucinations by 62%.',
          'Architected multi-step agentic workflows with LangGraph and LangChain utilizing tool-calling capabilities; leveraged LangSmith for distributed tracing, cutting prompt iteration time by 70%.',
          'Developed scalable FastAPI microservices exposing GenAI endpoints with comprehensive telemetry logging to maintain strict SLA performance.'
        ]
      },
      {
        company: 'Cognitive Intelligent Systems Lab',
        role: 'Intelligent Systems Developer · Multi-Agent & RAG Core',
        period: 'Feb 2024 – Mar 2025',
        bullets: [
          'Built multi-agent orchestration architecture using LangGraph and Ollama-hosted local models (Llama 3.1, Mistral, Gemma) to transform unstructured documents into validated JSON schemas.',
          'Implemented confidence scoring, schema validation, and semantic fallback retrieval, lifting unattended extraction reliability to 99.2%.',
          'Developed production RAG pipeline grounding LLM outputs in verified source documentation, eliminating fabricated information.',
          'Automated recurring reporting workflows, saving 30+ hours of manual administrative effort weekly.'
        ]
      }
    ]
  },
  {
    id: 'sample-ai',
    title: 'Staff AI Systems Architect',
    bracket: '₹55 - 75 LPA',
    score: 99.4,
    companyTier: 'FAANG / AI Unicorns',
    name: 'Kavita Verma',
    summary: 'Senior AI Infrastructure Engineer with 7+ years pioneering low-latency LLM serving engines, GPU inference cluster optimization, and distributed PyTorch pipelines. Cut compute costs by 42% across multi-region clusters while serving 15M daily requests with sub-50ms p99 latency.',
    skills: ['PyTorch', 'vLLM', 'CUDA', 'Kubernetes', 'Triton', 'AWS SageMaker', 'Python AsyncIO', 'Ray', 'Qdrant Vector DB'],
    experience: [
      {
        company: 'NeuralCompute Labs (Series B Unicorn)',
        role: 'Staff AI Infrastructure Architect',
        period: '2022 - Present',
        bullets: [
          'Engineered distributed LLM inference cluster using vLLM & Triton, compressing p99 response time from 160ms to 38ms.',
          'Spearheaded GPU cluster auto-scaler across AWS spot instances, saving ₹38L monthly (44% cost reduction).',
          'Fine-tuned open-source 13B models with LoRA/QLoRA achieving 94.6% candidate screening accuracy.'
        ]
      },
      {
        company: 'Tier-1 High Scale Product Co',
        role: 'Senior Systems Engineer',
        period: '2019 - 2022',
        bullets: [
          'Designed streaming feature store on Apache Kafka and Redis processing 60K RPS with 99.99% uptime.',
          'Automated MLOps continuous delivery pipeline, eliminating model deployment downtime across 12 production clusters.'
        ]
      }
    ]
  },
  {
    id: 'sample-fullstack',
    title: 'Lead Full Stack Architect',
    bracket: '₹42 - 58 LPA',
    score: 98.8,
    companyTier: 'High-Growth Fintech / SaaS',
    name: 'Aditya Sen',
    summary: 'Full Stack Architect with 8+ years experience scaling high-concurrency web platforms, micro-frontends, and distributed backend microservices. Architected payments processing engine handling ₹180Cr monthly gross volume with zero dropped webhooks.',
    skills: ['React 19', 'Next.js 15', 'TypeScript', 'Node.js', 'Go (Golang)', 'PostgreSQL', 'Kafka', 'Docker', 'AWS'],
    experience: [
      {
        company: 'RazorPay / Fintech Core',
        role: 'Lead Full Stack Architect',
        period: '2021 - Present',
        bullets: [
          'Led end-to-end rewrite of checkout micro-frontends, cutting bundle size by 54% and lifting transaction conversion by 6.8%.',
          'Designed fault-tolerant payment webhook dispatcher in Go processing 25,000 concurrent RPS.',
          'Mentored platform engineering team of 9 developers and introduced strict automated CI/CD gating.'
        ]
      },
      {
        company: 'Enterprise Cloud SaaS',
        role: 'Senior Software Engineer',
        period: '2018 - 2021',
        bullets: [
          'Constructed real-time merchant analytics portal displaying telemetry for 80K+ active merchants.',
          'Optimized PostgreSQL query index strategies, dropping slow query spikes by 78%.'
        ]
      }
    ]
  }
]

export default function AiResumeBuilder({
  userId,
  userEmail,
  userName,
  isProfessional,
  onUpgradeClick
}: AiResumeBuilderProps) {
  const [activeSubTab, setActiveSubTab] = useState<'samples' | 'generator'>('samples')
  const [selectedSampleIdx, setSelectedSampleIdx] = useState<number>(0)

  // Questionnaire form fields
  const [targetRole, setTargetRole] = useState<string>('Senior Full Stack Engineer')
  const [targetBracket, setTargetBracket] = useState<string>('₹35 - 50 LPA')
  const [expYears, setExpYears] = useState<number>(5)
  const [coreSkills, setCoreSkills] = useState<string>('React, Next.js, TypeScript, Node.js, PostgreSQL, AWS, Docker')
  const [achievements, setAchievements] = useState<string>('Architected high-scale APIs handling 20K RPS, optimized database query latency, reduced AWS monthly bills by 30%')
  const [currentCompany, setCurrentCompany] = useState<string>('Leading Tech Enterprise')
  const [education, setEducation] = useState<string>('B.Tech in Computer Science / Engineering')

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [autoSyncToBot, setAutoSyncToBot] = useState<boolean>(true)
  const [generatedResult, setGeneratedResult] = useState<any | null>(null)
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false)

  // Smooth scroll refs
  const resultSectionRef = useRef<HTMLDivElement>(null)
  const downloadSectionRef = useRef<HTMLDivElement>(null)

  // When generatedResult arrives, scroll down to the preview & buy subscription section
  useEffect(() => {
    if (generatedResult) {
      const timer = setTimeout(() => {
        if (downloadSectionRef.current) {
          downloadSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else if (resultSectionRef.current) {
          resultSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [generatedResult])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setSyncSuccess(false)

    // Scroll down immediately so user sees the synthesizing progress and the download/subscription area
    setTimeout(() => {
      if (resultSectionRef.current) {
        resultSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        window.scrollBy({ top: 380, behavior: 'smooth' })
      }
    }, 100)

    try {
      const res = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          answers: {
            name: userName || userId,
            email: userEmail,
            target_role: targetRole,
            target_ctc: targetBracket,
            experience_years: expYears,
            core_skills: coreSkills,
            key_achievements: achievements,
            current_company: currentCompany,
            education: education
          },
          auto_sync_to_bot: isProfessional && autoSyncToBot
        })
      })

      const data = await res.json()
      if (res.ok) {
        setGeneratedResult(data)
        if (data.auto_synced) {
          setSyncSuccess(true)
        }
      }
    } catch (err) {
      console.error('Generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrintDownload = () => {
    if (!isProfessional) {
      onUpgradeClick('Download Print-Ready Harvard ATS PDF')
      return
    }
    window.print()
  }

  const activeSample = SAMPLE_RESUMES[selectedSampleIdx]

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-[#09090b] border border-zinc-800 light:border-zinc-200 space-y-4 sm:space-y-6 relative overflow-hidden card-featured-glow text-zinc-100 light:text-zinc-900">
      {/* Top Accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-600/40 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-zinc-800/80 light:border-zinc-200 pb-4 sm:pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex items-center justify-center text-zinc-300 light:text-zinc-700 shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300 light:text-zinc-700" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h2 className="text-sm sm:text-lg font-bold text-white light:text-zinc-900 tracking-tight">
                AI Neural ATS Resume Builder
              </h2>
              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 font-semibold flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400 light:text-amber-600" />
                PROFESSIONAL
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
              Engineered for high-paying senior brackets (₹25L - ₹75L+ CTC) · 100% Recruiter & ATS friendly.
            </p>
          </div>
        </div>

        {/* Sub-Tabs: Samples vs Generator - 50/50 on Mobile */}
        <div className="flex items-center bg-black light:bg-white p-1 rounded-xl border border-zinc-800 light:border-zinc-200 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setActiveSubTab('samples')}
            className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'samples'
                ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 shadow-sm'
                : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Browse ATS Samples</span>
          </button>
          <button
            onClick={() => setActiveSubTab('generator')}
            className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'generator'
                ? 'bg-white light:bg-white light:bg-white light:ring-1 light:ring-zinc-300 text-black light:text-zinc-900 light:text-zinc-900 shadow-sm'
                : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Build with AI</span>
          </button>
        </div>
      </div>

      {/* Subtle Minimal PII Privacy Shield & Dedicated Studio Link */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-[11px] text-zinc-400 light:text-zinc-600 bg-zinc-950/80 light:bg-white/85 px-3 py-1.5 rounded-xl border border-zinc-800/80 light:border-zinc-200 w-fit" title="Zero Data-Leak Guarantee: Automatically scrubs and anonymizes sensitive PII (Home address, Aadhaar/PAN, internal IDs, personal phone) before cloud processing">
          <Shield className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600 shrink-0" />
          <span className="font-medium text-zinc-300 light:text-zinc-700">Auto PII Sanitized</span>
          <span className="text-zinc-500 light:text-zinc-600 text-[10px] hidden sm:inline">· Sensitive PII scrubbed before ATS parsing</span>
        </div>

        <Link
          href="/resume-builder"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 light:text-amber-700 hover:text-white light:hover:text-zinc-900 bg-amber-950/60 light:bg-amber-50 hover:bg-amber-900/80 px-3 py-1.5 rounded-lg border border-amber-700/50 light:border-amber-300 transition-colors cursor-pointer"
        >
          <span>Open Fullscreen Resume Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* SUB-TAB 1: High-Paying Sample Resumes */}
      {activeSubTab === 'samples' && (
        <div className="space-y-4 sm:space-y-5">
          {/* Sample Switcher Pills with Mobile Horizontal Swipe */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-nowrap pb-1 -mx-1 px-1">
            {SAMPLE_RESUMES.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setSelectedSampleIdx(idx)}
                className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 border shrink-0 whitespace-nowrap ${
                  selectedSampleIdx === idx
                    ? 'bg-zinc-900 light:bg-zinc-100 border-amber-500/50 light:border-amber-300 text-white light:text-zinc-900 shadow-sm'
                    : 'bg-black light:bg-white border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900'
                }`}
              >
                <span>{s.title}</span>
                <span className="text-[9px] sm:text-[10px] font-mono text-zinc-300 light:text-zinc-700 px-1.5 py-0.2 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200">
                  {s.bracket}
                </span>
              </button>
            ))}
          </div>

          {/* Clean ATS Resume Document Layout */}
          <div className="p-4 sm:p-8 rounded-2xl bg-zinc-950 light:bg-white border border-zinc-800/90 light:border-zinc-200 shadow-2xl space-y-4 sm:space-y-5 font-sans relative">
            {/* Top ATS Match Score Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-zinc-800/90 light:border-zinc-200 pb-3 sm:pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white light:text-zinc-900 tracking-tight">{activeSample.name}</h3>
                <p className="text-xs text-amber-400 light:text-amber-600 font-medium mt-0.5">{activeSample.title} · {activeSample.companyTier}</p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-750 text-zinc-200 light:text-zinc-800 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" />
                  {activeSample.score}% ATS RATING
                </span>
                <button
                  onClick={() => onUpgradeClick('Download ' + activeSample.title + ' ATS Template')}
                  className="px-2.5 sm:px-3 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800 hover:text-white light:hover:text-zinc-900 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" />
                  <span>Buy Subscription to Download</span>
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <h4 className="text-xs uppercase tracking-wider text-zinc-400 light:text-zinc-600 font-mono font-semibold">
                Professional Executive Summary
              </h4>
              <p className="text-xs text-zinc-300 light:text-zinc-700 leading-relaxed font-normal">
                {activeSample.summary}
              </p>
            </div>

            {/* Core Competencies */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider text-zinc-400 light:text-zinc-600 font-mono font-semibold">
                Core Technical Skills (Parsed by Workday & Greenhouse)
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {activeSample.skills.map((sk) => (
                  <span key={sk} className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700">
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Work Experience */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-zinc-400 light:text-zinc-600 font-mono font-semibold">
                Quantified Experience (Google XYZ Formula)
              </h4>
              <div className="space-y-3.5">
                {activeSample.experience.map((exp, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white light:text-zinc-900">{exp.role}</span>
                      <span className="text-zinc-500 light:text-zinc-600 font-mono text-[11px]">{exp.period}</span>
                    </div>
                    <p className="text-xs text-amber-400 light:text-amber-600 font-medium">{exp.company}</p>
                    <ul className="space-y-1 pl-4 list-disc text-xs text-zinc-300 light:text-zinc-700">
                      {exp.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="leading-relaxed">{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Action to Build Their Own */}
            <div className="pt-4 border-t border-zinc-800/80 light:border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-zinc-400 light:text-zinc-600">
                Want an ATS resume formatted like this tailored specifically for your target jobs?
              </span>
              <button
                onClick={() => setActiveSubTab('generator')}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white light:bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 light:hover:bg-zinc-100 text-black light:text-zinc-900 light:text-zinc-900 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Build Mine with AI Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: AI Resume Generator Wizard */}
      {activeSubTab === 'generator' && (
        <div className="space-y-6">
          {/* Questionnaire Form */}
          <form onSubmit={handleGenerate} className="p-6 rounded-2xl bg-zinc-950 light:bg-white border border-zinc-800/90 light:border-zinc-200 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 light:border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400 light:text-amber-600" />
                <h3 className="text-sm font-semibold text-white light:text-zinc-900">
                  Target High-Paying Job Questionnaire
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 light:text-zinc-600 uppercase">
                5 Quick Answers · 1-Click Generation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-zinc-300 light:text-zinc-700 font-medium mb-1.5">
                  1. Target Senior Role Title
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Full Stack Engineer / Staff AI Engineer"
                  className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 focus:border-amber-500 rounded-lg px-3 py-2 text-white light:text-zinc-900 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-300 light:text-zinc-700 font-medium mb-1.5">
                  2. Target Compensation Bracket (₹ LPA)
                </label>
                <input
                  type="text"
                  value={targetBracket}
                  onChange={(e) => setTargetBracket(e.target.value)}
                  placeholder="e.g. ₹35 - 50 LPA or ₹50 - 75 LPA"
                  className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 focus:border-amber-500 rounded-lg px-3 py-2 text-white light:text-zinc-900 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-300 light:text-zinc-700 font-medium mb-1.5">
                  3. Total Professional Experience (Years)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={expYears}
                  onChange={(e) => setExpYears(Number(e.target.value))}
                  className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 focus:border-amber-500 rounded-lg px-3 py-2 text-white light:text-zinc-900 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-300 light:text-zinc-700 font-medium mb-1.5">
                  4. Current / Most Recent Company or Tier
                </label>
                <input
                  type="text"
                  value={currentCompany}
                  onChange={(e) => setCurrentCompany(e.target.value)}
                  placeholder="e.g. Capgemini / Startup / Tech Co"
                  className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 focus:border-amber-500 rounded-lg px-3 py-2 text-white light:text-zinc-900 outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-300 light:text-zinc-700 font-medium mb-1.5">
                  5. Core Skills & Technologies (Comma-separated)
                </label>
                <input
                  type="text"
                  value={coreSkills}
                  onChange={(e) => setCoreSkills(e.target.value)}
                  placeholder="e.g. React, Next.js, Node.js, Python, PostgreSQL, AWS, Docker"
                  className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 focus:border-amber-500 rounded-lg px-3 py-2 text-white light:text-zinc-900 outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-300 light:text-zinc-700 font-medium mb-1.5">
                  6. Key Highlights, Proudest Projects & Metrics
                </label>
                <textarea
                  rows={2}
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  placeholder="e.g. Scaled API to 25k RPS, reduced load times by 40%, migrated database with zero downtime..."
                  className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 focus:border-amber-500 rounded-lg p-3 text-white light:text-zinc-900 outline-none resize-none"
                  required
                />
              </div>
            </div>

            {/* Auto-Sync to Bot Option for Professionals */}
            {isProfessional && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-black light:bg-white border border-zinc-800 light:border-zinc-200 text-xs">
                <input
                  type="checkbox"
                  id="autoSyncBot"
                  checked={autoSyncToBot}
                  onChange={(e) => setAutoSyncToBot(e.target.checked)}
                  className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="autoSyncBot" className="text-zinc-300 light:text-zinc-700 cursor-pointer">
                  <strong className="text-white light:text-zinc-900">Auto-attach generated ATS resume to Auto-Apply Bot</strong> (replaces older resume for daily runs)
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-white light:bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 light:hover:bg-zinc-100 text-black light:text-zinc-900 light:text-zinc-900 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-white/5"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing ATS-Optimized Resume with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Generate High-Paying ATS Resume</span>
                </>
              )}
            </button>
          </form>

          {/* Intermediate Synthesizing Card with Ref for immediate scroll */}
          <div ref={resultSectionRef} id="ats-resume-synthesis-anchor">
            {isGenerating && (
              <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950 light:bg-white border border-amber-500/40 light:border-amber-300 text-center space-y-3.5 shadow-2xl card-featured-glow">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-950/80 light:bg-amber-50 border border-amber-600/60 flex items-center justify-center text-amber-300 light:text-amber-700 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-400 light:text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white light:text-zinc-900">
                    Synthesizing ATS-Optimized Resume with AI...
                  </h4>
                  <p className="text-xs text-zinc-400 light:text-zinc-600 mt-1 max-w-md mx-auto leading-relaxed">
                    Injecting high-density keywords for Workday, Greenhouse & Recruiter ATS algorithms. Formatting quantified Google XYZ bullet points.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono bg-black light:bg-white border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" />
                  <span>Preparing preview & subscription download options below...</span>
                </div>
              </div>
            )}
          </div>

          {/* Generated Result Display */}
          {generatedResult && (
            <div ref={downloadSectionRef} id="buy-subscription-download-section" className="space-y-4 pt-2">
              {/* If User is Professional -> Full Resume & Actions */}
              {!generatedResult.is_preview && generatedResult.resume && (
                <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 shadow-2xl space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 light:border-zinc-200 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white light:text-zinc-900">{generatedResult.resume.name}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-750 text-zinc-200 light:text-zinc-800 font-semibold">
                          {generatedResult.resume.ats_score}% ATS OPTIMIZED
                        </span>
                      </div>
                      <p className="text-xs text-amber-400 light:text-amber-600 mt-0.5">{generatedResult.resume.role}</p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={handlePrintDownload}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg ${
                          isProfessional
                            ? 'bg-white light:bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 light:hover:bg-zinc-100 text-black light:text-zinc-900 light:text-zinc-900 shadow-white/10'
                            : 'bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-200 light:text-zinc-800 border border-zinc-700 light:border-zinc-300'
                        }`}
                        title={isProfessional ? "Download or Print ATS PDF" : "Upgrade to Professional to export PDF"}
                      >
                        {isProfessional ? (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Download / Save PDF</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" />
                            <span>Unlock PDF Export</span>
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 light:text-amber-700 border border-amber-500/40 light:border-amber-300 ml-0.5 font-bold">
                              PRO
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {syncSuccess && (
                    <div className="p-3 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-zinc-300 light:text-zinc-700 shrink-0" />
                      <span>Successfully auto-attached to your candidate profile! Your Auto-Apply Bot will now dispatch this resume on morning runs.</span>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs uppercase font-mono tracking-wider text-zinc-400 light:text-zinc-600 font-semibold">
                      Executive Summary
                    </h4>
                    <p className="text-xs text-zinc-300 light:text-zinc-700 leading-relaxed font-normal">
                      {generatedResult.resume.summary}
                    </p>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase font-mono tracking-wider text-zinc-400 light:text-zinc-600 font-semibold">
                      Parsed Technical Competencies
                    </h4>
                    <div className="space-y-1.5 text-xs text-zinc-300 light:text-zinc-700">
                      {Object.entries(generatedResult.resume.skills || {}).map(([cat, sks]: any) => (
                        <div key={cat} className="flex items-baseline gap-2">
                          <strong className="text-white light:text-zinc-900 min-w-[140px] font-medium">{cat}:</strong>
                          <span className="font-mono text-zinc-400 light:text-zinc-600">{Array.isArray(sks) ? sks.join(', ') : sks}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Work Experience */}
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase font-mono tracking-wider text-zinc-400 light:text-zinc-600 font-semibold">
                      Quantified Experience
                    </h4>
                    <div className="space-y-4">
                      {(generatedResult.resume.experience || []).map((exp: any, idx: number) => (
                        <div key={idx} className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white light:text-zinc-900">{exp.title} - {exp.company}</span>
                            <span className="text-zinc-500 light:text-zinc-600 font-mono text-[11px]">{exp.period}</span>
                          </div>
                          <ul className="space-y-1 pl-4 list-disc text-zinc-300 light:text-zinc-700">
                            {(exp.metrics || []).map((m: string, mIdx: number) => (
                              <li key={mIdx} className="leading-relaxed">{m}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* If User is NOT Professional -> Tantalizing Blurred Preview with Upgrade Lock */}
              {generatedResult.is_preview && (
                <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950 light:bg-white border border-blue-500/40 shadow-2xl space-y-5 relative overflow-hidden card-featured-glow">
                  {/* Top Score Banner */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 light:border-zinc-200 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white light:text-zinc-900">{targetRole}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-750 text-zinc-200 light:text-zinc-800 font-semibold">
                          {generatedResult.ats_score}% ATS PASS RATING
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
                        Target Senior Bracket: <strong className="text-white light:text-zinc-900">{generatedResult.target_bracket}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onUpgradeClick('Download Full ATS Resume & Cloud Bot Sync')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-black light:text-zinc-900 light:text-zinc-900 bg-white light:bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 light:hover:bg-zinc-100 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Buy Subscription to Download</span>
                      </button>
                    </div>
                  </div>

                  {/* Executive Summary Unlocked Preview */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs uppercase font-mono tracking-wider text-zinc-400 light:text-zinc-600 font-semibold">
                      Executive Summary (AI Generated Preview)
                    </h4>
                    <p className="text-xs text-zinc-300 light:text-zinc-700 leading-relaxed font-normal p-3 rounded-xl bg-black light:bg-white border border-zinc-800 light:border-zinc-200">
                      {generatedResult.preview_summary}
                    </p>
                  </div>

                  {/* Blurred Experience & Bullets Overlay */}
                  <div className="relative rounded-xl p-5 bg-black light:bg-white border border-zinc-800/80 light:border-zinc-200 overflow-hidden select-none">
                    {/* Simulated background text that is blurred */}
                    <div className="filter blur-[5px] opacity-40 space-y-3 pointer-events-none text-xs text-zinc-300 light:text-zinc-700">
                      <div className="font-semibold text-white light:text-zinc-900">Senior Software Engineer · Tier-1 Tech Company (2021 - Present)</div>
                      <div className="pl-4 list-disc space-y-1">
                        <div>• Spearheaded architectural migration to distributed microservices, improving throughput by 42%.</div>
                        <div>• Reduced cloud operating overhead by ₹18,00,000 annually using automated auto-scaling spot clusters.</div>
                        <div>• Automated end-to-end continuous delivery pipeline and managed team of 8 platform developers.</div>
                      </div>
                      <div className="font-semibold text-white light:text-zinc-900">Full Stack Engineer · High Growth Fintech (2018 - 2021)</div>
                      <div className="pl-4 list-disc space-y-1">
                        <div>• Architected payment gateway integration processing 30K concurrent RPS with zero transaction drop rate.</div>
                      </div>
                    </div>

                    {/* Glowing Lock Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/85 light:bg-white/85 backdrop-blur-md text-center space-y-3.5">
                      <div className="w-12 h-12 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-700 light:border-zinc-300 flex items-center justify-center text-zinc-300 light:text-zinc-700">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 font-medium">
                          <Crown className="w-3 h-3 text-amber-400 light:text-amber-600" /> Subscription Required to Download
                        </span>
                        <h4 className="text-base font-bold text-white light:text-zinc-900 pt-1">
                          Buy Subscription to Download Full ATS Resume
                        </h4>
                        <p className="text-xs text-zinc-400 light:text-zinc-600 max-w-md leading-relaxed">
                          Download the complete 99%+ ATS-compliant PDF resume, unlock quantified Google XYZ bullets, and auto-sync to your daily 50-job application bot.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                        <button
                          onClick={() => onUpgradeClick('Download Full ATS Resume & Cloud Bot Sync')}
                          className="px-6 py-2.5 rounded-xl bg-white light:bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 light:hover:bg-zinc-100 text-black light:text-zinc-900 light:text-zinc-900 font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          <span>Buy Subscription to Download PDF</span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </button>

                        <Link
                          href="/pricing"
                          className="text-xs text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 px-3 py-2 transition-colors font-medium"
                        >
                          View Plans (From ₹99/mo) →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

