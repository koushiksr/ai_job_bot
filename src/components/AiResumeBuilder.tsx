'use client'

import React, { useState } from 'react'
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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setSyncSuccess(false)

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
    window.print()
  }

  const activeSample = SAMPLE_RESUMES[selectedSampleIdx]

  return (
    <div className="p-6 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-6 relative overflow-hidden card-featured-glow text-zinc-100">
      {/* Top Laser Sweep */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-400/80 to-transparent animate-laser-sweep pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-violet-950/60 border border-violet-800/50 flex items-center justify-center text-violet-300 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                AI Neural ATS Resume Builder
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950/80 border border-violet-700/60 text-violet-300 font-semibold flex items-center gap-1">
                <Crown className="w-3 h-3 text-violet-400" />
                PROFESSIONAL TIER
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Engineered for high-paying senior brackets (₹25L - ₹75L+ CTC) · 100% Recruiter & ATS friendly format.
            </p>
          </div>
        </div>

        {/* Sub-Tabs: Samples vs Generator */}
        <div className="flex items-center bg-black p-1 rounded-xl border border-zinc-800 shrink-0">
          <button
            onClick={() => setActiveSubTab('samples')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'samples'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Browse ATS Samples</span>
          </button>
          <button
            onClick={() => setActiveSubTab('generator')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'generator'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Build with AI</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: High-Paying Sample Resumes */}
      {activeSubTab === 'samples' && (
        <div className="space-y-5">
          {/* Sample Switcher Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {SAMPLE_RESUMES.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setSelectedSampleIdx(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2 border ${
                  selectedSampleIdx === idx
                    ? 'bg-zinc-900 border-violet-500/50 text-white shadow-sm'
                    : 'bg-black border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <span>{s.title}</span>
                <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-800/40">
                  {s.bracket}
                </span>
              </button>
            ))}
          </div>

          {/* Clean ATS Resume Document Layout */}
          <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-2xl space-y-5 font-sans relative">
            {/* Top ATS Match Score Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800/90 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">{activeSample.name}</h3>
                <p className="text-xs text-violet-400 font-medium mt-0.5">{activeSample.title} · {activeSample.companyTier}</p>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {activeSample.score}% ATS PASS RATING
                </span>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-mono font-semibold">
                Professional Executive Summary
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                {activeSample.summary}
              </p>
            </div>

            {/* Core Competencies */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-mono font-semibold">
                Core Technical Skills (Parsed by Workday & Greenhouse)
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {activeSample.skills.map((sk) => (
                  <span key={sk} className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Work Experience */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-mono font-semibold">
                Quantified Experience (Google XYZ Formula)
              </h4>
              <div className="space-y-3.5">
                {activeSample.experience.map((exp, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{exp.role}</span>
                      <span className="text-zinc-500 font-mono text-[11px]">{exp.period}</span>
                    </div>
                    <p className="text-xs text-violet-400 font-medium">{exp.company}</p>
                    <ul className="space-y-1 pl-4 list-disc text-xs text-zinc-300">
                      {exp.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="leading-relaxed">{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Action to Build Their Own */}
            <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-zinc-400">
                Want an ATS resume formatted like this tailored specifically for your target jobs?
              </span>
              <button
                onClick={() => setActiveSubTab('generator')}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
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
          <form onSubmit={handleGenerate} className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">
                  Target High-Paying Job Questionnaire
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                5 Quick Answers · 1-Click Generation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">
                  1. Target Senior Role Title
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Full Stack Engineer / Staff AI Engineer"
                  className="w-full bg-black border border-zinc-800 focus:border-violet-500 rounded-lg px-3 py-2 text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">
                  2. Target Compensation Bracket (₹ LPA)
                </label>
                <input
                  type="text"
                  value={targetBracket}
                  onChange={(e) => setTargetBracket(e.target.value)}
                  placeholder="e.g. ₹35 - 50 LPA or ₹50 - 75 LPA"
                  className="w-full bg-black border border-zinc-800 focus:border-violet-500 rounded-lg px-3 py-2 text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">
                  3. Total Professional Experience (Years)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={expYears}
                  onChange={(e) => setExpYears(Number(e.target.value))}
                  className="w-full bg-black border border-zinc-800 focus:border-violet-500 rounded-lg px-3 py-2 text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">
                  4. Current / Most Recent Company or Tier
                </label>
                <input
                  type="text"
                  value={currentCompany}
                  onChange={(e) => setCurrentCompany(e.target.value)}
                  placeholder="e.g. Capgemini / Startup / Tech Co"
                  className="w-full bg-black border border-zinc-800 focus:border-violet-500 rounded-lg px-3 py-2 text-white outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-300 font-medium mb-1.5">
                  5. Core Skills & Technologies (Comma-separated)
                </label>
                <input
                  type="text"
                  value={coreSkills}
                  onChange={(e) => setCoreSkills(e.target.value)}
                  placeholder="e.g. React, Next.js, Node.js, Python, PostgreSQL, AWS, Docker"
                  className="w-full bg-black border border-zinc-800 focus:border-violet-500 rounded-lg px-3 py-2 text-white outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-300 font-medium mb-1.5">
                  6. Key Highlights, Proudest Projects & Metrics
                </label>
                <textarea
                  rows={2}
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  placeholder="e.g. Scaled API to 25k RPS, reduced load times by 40%, migrated database with zero downtime..."
                  className="w-full bg-black border border-zinc-800 focus:border-violet-500 rounded-lg p-3 text-white outline-none resize-none"
                  required
                />
              </div>
            </div>

            {/* Auto-Sync to Bot Option for Professionals */}
            {isProfessional && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-black border border-zinc-800 text-xs">
                <input
                  type="checkbox"
                  id="autoSyncBot"
                  checked={autoSyncToBot}
                  onChange={(e) => setAutoSyncToBot(e.target.checked)}
                  className="accent-violet-500 w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="autoSyncBot" className="text-zinc-300 cursor-pointer">
                  <strong className="text-white">Auto-attach generated ATS resume to Naukri Auto-Apply Bot</strong> (replaces older resume for daily runs)
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-white/5"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing ATS-Optimized Resume with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-violet-700" />
                  <span>Generate High-Paying ATS Resume</span>
                </>
              )}
            </button>
          </form>

          {/* Generated Result Display */}
          {generatedResult && (
            <div className="space-y-4">
              {/* If User is Professional -> Full Resume & Actions */}
              {!generatedResult.is_preview && generatedResult.resume && (
                <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">{generatedResult.resume.name}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 font-semibold">
                          {generatedResult.resume.ats_score}% ATS OPTIMIZED
                        </span>
                      </div>
                      <p className="text-xs text-violet-400 mt-0.5">{generatedResult.resume.role}</p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={handlePrintDownload}
                        className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Print / Save PDF</span>
                      </button>
                    </div>
                  </div>

                  {syncSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Successfully auto-attached to your candidate profile! Your Naukri Auto-Apply Bot will now dispatch this resume on morning runs.</span>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                      Executive Summary
                    </h4>
                    <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                      {generatedResult.resume.summary}
                    </p>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                      Parsed Technical Competencies
                    </h4>
                    <div className="space-y-1.5 text-xs text-zinc-300">
                      {Object.entries(generatedResult.resume.skills || {}).map(([cat, sks]: any) => (
                        <div key={cat} className="flex items-baseline gap-2">
                          <strong className="text-white min-w-[140px] font-medium">{cat}:</strong>
                          <span className="font-mono text-zinc-400">{Array.isArray(sks) ? sks.join(', ') : sks}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Work Experience */}
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                      Quantified Experience
                    </h4>
                    <div className="space-y-4">
                      {(generatedResult.resume.experience || []).map((exp: any, idx: number) => (
                        <div key={idx} className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">{exp.title} - {exp.company}</span>
                            <span className="text-zinc-500 font-mono text-[11px]">{exp.period}</span>
                          </div>
                          <ul className="space-y-1 pl-4 list-disc text-zinc-300">
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
                <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-violet-500/40 shadow-2xl space-y-5 relative overflow-hidden card-featured-glow">
                  {/* Top Score Banner */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{targetRole}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 font-semibold">
                          {generatedResult.ats_score}% ATS PASS RATING
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Target Senior Bracket: <strong className="text-white">{generatedResult.target_bracket}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-violet-400 bg-violet-950/60 px-2.5 py-1 rounded-lg border border-violet-800/50">
                      <Lock className="w-3 h-3" />
                      <span>PROFESSIONAL TIER REQUIRED</span>
                    </div>
                  </div>

                  {/* Executive Summary Unlocked Preview */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-semibold">
                      Executive Summary (AI Generated Preview)
                    </h4>
                    <p className="text-xs text-zinc-300 leading-relaxed font-normal p-3 rounded-xl bg-black border border-zinc-800">
                      {generatedResult.preview_summary}
                    </p>
                  </div>

                  {/* Blurred Experience & Bullets Overlay */}
                  <div className="relative rounded-xl p-5 bg-black border border-zinc-800/80 overflow-hidden select-none">
                    {/* Simulated background text that is blurred */}
                    <div className="filter blur-[5px] opacity-40 space-y-3 pointer-events-none text-xs text-zinc-300">
                      <div className="font-semibold text-white">Senior Software Engineer · Tier-1 Tech Company (2021 - Present)</div>
                      <div className="pl-4 list-disc space-y-1">
                        <div>• Spearheaded architectural migration to distributed microservices, improving throughput by 42%.</div>
                        <div>• Reduced cloud operating overhead by ₹18,00,000 annually using automated auto-scaling spot clusters.</div>
                        <div>• Automated end-to-end continuous delivery pipeline and managed team of 8 platform developers.</div>
                      </div>
                      <div className="font-semibold text-white">Full Stack Engineer · High Growth Fintech (2018 - 2021)</div>
                      <div className="pl-4 list-disc space-y-1">
                        <div>• Architected payment gateway integration processing 30K concurrent RPS with zero transaction drop rate.</div>
                      </div>
                    </div>

                    {/* Glowing Lock Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/70 backdrop-blur-sm text-center space-y-3">
                      <div className="w-11 h-11 rounded-2xl bg-violet-950/80 border border-violet-700/60 flex items-center justify-center text-violet-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Unlock Full ATS Resume & Auto-Sync to Naukri Bot
                        </h4>
                        <p className="text-xs text-zinc-400 mt-1 max-w-md">
                          The complete quantified work history, keyword injector, printable PDF export, and 1-click cloud sync to your daily application bot are reserved for Professional members.
                        </p>
                      </div>

                      <button
                        onClick={() => onUpgradeClick('AI ATS Resume Builder & Cloud Bot Sync')}
                        className="px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-white/10"
                      >
                        <span>Upgrade to Professional (₹1,199 / 3 Months)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
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
