'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Eye,
  Cpu,
  Target,
  Search,
  Flame,
  Layers,
  ShieldCheck,
  Terminal,
  Play,
  RotateCcw,
  Bell,
  Code2,
  Building2,
  ArrowRight
} from 'lucide-react'

interface RoleOption {
  id: string
  label: string
  company: string
  role: string
  location: string
  salary: string
  logoText: string
  logoBg: string
  matchScore: number
  skills: string[]
  screeningQuestion: string
  aiAnswer: string
  appliedTime: string
  recruiterMessage: string
  logs: string[]
}

const DEMO_ROLES: RoleOption[] = [
  {
    id: 'fullstack',
    label: 'Full Stack',
    company: 'Stripe',
    role: 'Senior Full Stack Engineer',
    location: 'Bengaluru · Hybrid / Remote',
    salary: '₹38 - 48 LPA',
    logoText: 'S',
    logoBg: 'from-violet-600 via-indigo-600 to-purple-700',
    matchScore: 98.8,
    skills: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'Distributed APIs'],
    screeningQuestion: 'What is your notice period and current compensation expectation?',
    aiAnswer: 'Immediate / 15 Days (Negotiable) · Expected CTC: ₹42 LPA based on current seniority.',
    appliedTime: '06:02 AM IST',
    recruiterMessage: '🎉 Recruiter downloaded resume & flagged for technical phone screen',
    logs: [
      '06:00:02 🛰️ Radar sweep: Found 42 fresh openings matching "Full Stack Engineer"',
      '06:00:05 🎯 Evaluated match: Stripe Senior Full Stack Engineer (98.8% Fit)',
      '06:00:08 🧠 AI Reasoning: Formulating tailored responses for recruiter questions...',
      '06:00:12 ⚡ Pre-filling fields: Notice Period, Relocation, Compensation expectations',
      '06:00:15 🚀 Verified application dispatched directly to Talent Lead'
    ]
  },
  {
    id: 'ai-ml',
    label: 'AI & Machine Learning',
    company: 'Google DeepMind',
    role: 'Staff AI Systems Engineer',
    location: 'Bengaluru · Hybrid',
    salary: '₹55 - 72 LPA',
    logoText: 'G',
    logoBg: 'from-blue-600 via-cyan-600 to-teal-700',
    matchScore: 99.4,
    skills: ['Python', 'PyTorch', 'LLMs', 'High-Scale Infra', 'CUDA', 'C++'],
    screeningQuestion: 'Describe your hands-on experience scaling LLM agent workflows in production.',
    aiAnswer: '4+ years fine-tuning and deploying high-concurrency LLM inference pipelines with sub-50ms latency.',
    appliedTime: '06:04 AM IST',
    recruiterMessage: '⚡ Talent Partner directly triggered Interview Shortlist',
    logs: [
      '06:00:03 🛰️ Radar sweep: Found 18 fresh openings matching "AI Systems / LLMs"',
      '06:00:06 🎯 Evaluated match: Google DeepMind Staff AI Engineer (99.4% Fit)',
      '06:00:09 🧠 AI Reasoning: Highlighting candidate model scaling and PyTorch achievements...',
      '06:00:13 ⚡ Validated candidate credentials against employer screening criteria',
      '06:00:16 🚀 Verified application dispatched with custom executive summary'
    ]
  },
  {
    id: 'cloud',
    label: 'Cloud & Systems',
    company: 'Microsoft Azure',
    role: 'Cloud Infrastructure Architect',
    location: 'Hyderabad / Remote',
    salary: '₹42 - 56 LPA',
    logoText: 'M',
    logoBg: 'from-sky-600 via-blue-700 to-indigo-800',
    matchScore: 97.9,
    skills: ['Kubernetes', 'Cloud Architecture', 'Golang', 'Terraform', 'CI/CD'],
    screeningQuestion: 'Are you open to hybrid collaboration and leading architecture sprints?',
    aiAnswer: 'Yes, fully aligned with hybrid cadence and experienced mentoring platform teams.',
    appliedTime: '08:01 AM IST',
    recruiterMessage: '📥 Talent Acquisition team accessed application portfolio',
    logs: [
      '08:00:01 🛰️ Morning run initiated: Scanning Azure and enterprise cloud feeds',
      '08:00:04 🎯 Evaluated match: Microsoft Azure Cloud Architect (97.9% Fit)',
      '08:00:08 🧠 AI Reasoning: Emphasizing Kubernetes & multi-region deployment track record...',
      '08:00:11 ⚡ Auto-populating recruiter screening questionnaires',
      '08:00:14 🚀 Verified application submitted directly to Talent Lead'
    ]
  },
  {
    id: 'backend',
    label: 'Backend & Fintech',
    company: 'Razorpay',
    role: 'Lead Backend Engineer',
    location: 'Bengaluru · In-Office',
    salary: '₹36 - 45 LPA',
    logoText: 'R',
    logoBg: 'from-blue-500 via-indigo-600 to-slate-800',
    matchScore: 98.2,
    skills: ['Node.js', 'Golang', 'Kafka', 'Redis', 'High RPS Payments'],
    screeningQuestion: 'Experience designing fault-tolerant financial settlement services?',
    aiAnswer: 'Architected distributed payment ledger microservices handling 25K+ RPS with 99.99% uptime.',
    appliedTime: '08:03 AM IST',
    recruiterMessage: '💬 Recruiter sent technical challenge and meeting availability invite',
    logs: [
      '08:00:02 🛰️ Radar sweep: Found 35 fintech backend opportunities',
      '08:00:05 🎯 Evaluated match: Razorpay Lead Backend Engineer (98.2% Fit)',
      '08:00:09 🧠 AI Reasoning: Aligning distributed ledger and fault-tolerance highlights...',
      '08:00:12 ⚡ Answers verified: Immediate availability & matching compensation tier',
      '08:00:15 🚀 Application verified & logged in candidate personal dashboard'
    ]
  }
]

export default function AiEngineVisualizer() {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [stage, setStage] = useState<'scan' | 'score' | 'answer' | 'applied'>('scan')
  const [isAutoCycling, setIsAutoCycling] = useState(true)
  const [applicationsCount, setApplicationsCount] = useState(24)
  const [scanPulse, setScanPulse] = useState(1482)

  const activeRole = DEMO_ROLES[selectedIdx]

  // Pipeline stage timeline
  useEffect(() => {
    let t1: NodeJS.Timeout
    let t2: NodeJS.Timeout
    let t3: NodeJS.Timeout
    let t4: NodeJS.Timeout

    setStage('scan')

    t1 = setTimeout(() => setStage('score'), 1200)
    t2 = setTimeout(() => setStage('answer'), 2500)
    t3 = setTimeout(() => {
      setStage('applied')
      setApplicationsCount(prev => prev + 1)
      setScanPulse(prev => prev + 3)
    }, 4000)

    if (isAutoCycling) {
      t4 = setTimeout(() => {
        setSelectedIdx(prev => (prev + 1) % DEMO_ROLES.length)
      }, 6500)
    }

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [selectedIdx, isAutoCycling])

  return (
    <div className="w-full max-w-6xl mx-auto rounded-3xl bg-gradient-to-b from-[#0e1422] to-[#080c14] border border-slate-800 shadow-2xl overflow-hidden relative">
      
      {/* Decorative Top Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Cockpit Header */}
      <div className="p-4 sm:px-6 bg-slate-950/90 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide font-mono">
                JobFlux Autonomous AI Engine
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-500/10 text-sky-400 border border-blue-500/30 font-mono">
                REAL-TIME SIMULATOR
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              Daily autonomous multi-candidate job hunting engine running at 06:00 AM & 08:00 AM IST
            </p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-3 text-xs font-mono self-end sm:self-auto">
          <div className="text-slate-400 text-[11px]">
            Scanned: <span className="text-white font-bold">{scanPulse.toLocaleString()}</span>
          </div>
          <div className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/25 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Applied: {applicationsCount}</span>
          </div>
        </div>
      </div>

      {/* Role Switcher Tabs */}
      <div className="px-4 sm:px-6 py-3 bg-slate-900/60 border-b border-slate-800/70 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider hidden md:inline-block mr-2">
            Target Domain:
          </span>
          {DEMO_ROLES.map((role, idx) => (
            <button
              key={role.id}
              onClick={() => {
                setSelectedIdx(idx)
                setIsAutoCycling(false)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                selectedIdx === idx
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{role.label}</span>
              <span className="text-[10px] opacity-70">({role.company})</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsAutoCycling(!isAutoCycling)}
          className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono transition-colors shrink-0 hidden sm:flex items-center gap-1 ${
            isAutoCycling
              ? 'bg-blue-500/10 text-sky-400 border-blue-500/30'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
          title="Toggle automated role cycle"
        >
          {isAutoCycling ? 'Auto-Cycle ON' : 'Paused'}
        </button>
      </div>

      {/* 4-Step Animated Pipeline Banner */}
      <div className="px-4 sm:px-6 py-3 bg-slate-950/50 border-b border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
        <div
          className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
            stage === 'scan'
              ? 'bg-blue-600/20 text-sky-300 border-blue-500/40 font-bold shadow-sm shadow-blue-500/10'
              : 'bg-slate-900/30 text-slate-400 border-slate-800/80'
          }`}
        >
          <Search className={`w-3.5 h-3.5 text-sky-400 ${stage === 'scan' ? 'animate-spin' : ''}`} />
          <span className="truncate">1. Deep Radar Scan</span>
        </div>

        <div
          className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
            stage === 'score'
              ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 font-bold shadow-sm shadow-purple-500/10'
              : stage === 'answer' || stage === 'applied'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-slate-900/30 text-slate-400 border-slate-800/80'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-purple-400" />
          <span className="truncate">2. Neural Fit Scoring</span>
        </div>

        <div
          className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
            stage === 'answer'
              ? 'bg-amber-600/20 text-amber-300 border-amber-500/40 font-bold shadow-sm shadow-amber-500/10'
              : stage === 'applied'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-slate-900/30 text-slate-400 border-slate-800/80'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-amber-400" />
          <span className="truncate">3. AI Screening Q&A</span>
        </div>

        <div
          className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
            stage === 'applied'
              ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 font-bold shadow-sm shadow-emerald-500/10'
              : 'bg-slate-900/30 text-slate-400 border-slate-800/80'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="truncate">4. Verified Delivery</span>
        </div>
      </div>

      {/* Main Interactive Stage Display (2 Columns: Left Terminal & Telemetry, Right Job & Action Panel) */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Sub-Panel: Live Agent Terminal Output (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-950 border border-slate-800/90 p-4 flex flex-col justify-between space-y-4 font-mono text-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-white font-bold">Autonomous Agent Telemetry</span>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                PULSE OK
              </span>
            </div>

            {/* Terminal Lines */}
            <div className="space-y-2 mt-3 text-[11px] text-slate-300">
              {activeRole.logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-sky-400 shrink-0 font-bold">›</span>
                  <span className={i === activeRole.logs.length - 1 ? 'text-emerald-300 font-semibold' : 'text-slate-300'}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recruiter Response Toast Alert */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-500/30 text-[11px] flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-sky-400 shrink-0 animate-bounce" />
            <span className="text-sky-200 font-sans font-medium">{activeRole.recruiterMessage}</span>
          </div>
        </div>

        {/* Right Sub-Panel: Rich Job & Application Execution Card (7 Cols) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          
          {/* Target Opportunity Header Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${activeRole.logoBg} flex items-center justify-center font-extrabold text-white text-lg shadow-lg shrink-0`}
              >
                {activeRole.logoText}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{activeRole.role}</h3>
                  <span className="text-xs font-semibold text-slate-400 font-mono">
                    @{activeRole.company}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span>{activeRole.location}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold font-mono text-sm">{activeRole.salary}</span>
                </div>
              </div>
            </div>

            {/* Neural Fit Gauge */}
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-sm font-mono flex items-center gap-1.5 shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{activeRole.matchScore}% FIT</span>
            </div>
          </div>

          {/* AI Decision Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Matched Skill Matrix */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" /> Verified Skill Fit
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeRole.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-900 border border-slate-800 text-slate-300 font-mono"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Contextual Screening Q&A */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-amber-400" /> Auto-Generated Screening Q&A
              </span>
              <div className="text-[11px] leading-relaxed">
                <span className="text-slate-400 block font-mono text-[10px]">Q: {activeRole.screeningQuestion}</span>
                <span className="text-sky-300 font-semibold font-mono block mt-1">
                  A: {activeRole.aiAnswer}
                </span>
              </div>
            </div>
          </div>

          {/* Dispatch Confirmation Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-950/70 to-blue-950/30 border border-emerald-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-white font-bold block">Application Verified & Delivered</span>
                <span className="text-slate-400 text-[11px]">
                  Submitted autonomously at <span className="font-mono text-emerald-300 font-bold">{activeRole.appliedTime}</span>
                </span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 font-mono hidden sm:flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Visible on Recruiter Dashboard</span>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Trust & Assurance Footer */}
      <div className="px-6 py-3.5 bg-slate-950/90 border-t border-slate-800/70 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300 font-semibold">Bank-Grade 256-Bit SSL & Safe Human Pacing Emulation</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span>Stripe ✓</span>
          <span>•</span>
          <span>Google DeepMind ✓</span>
          <span>•</span>
          <span>Microsoft ✓</span>
          <span>•</span>
          <span>Razorpay ✓</span>
        </div>
      </div>
    </div>
  )
}
