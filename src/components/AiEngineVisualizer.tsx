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
  Layers,
  ShieldCheck,
  Terminal,
  Bell,
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
    matchScore: 98.8,
    skills: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'Distributed APIs'],
    screeningQuestion: 'What is your notice period and current compensation expectation?',
    aiAnswer: 'Immediate / 15 Days · Expected CTC: ₹42 LPA based on current seniority.',
    appliedTime: '06:02 AM IST',
    recruiterMessage: 'Candidate resume downloaded & flagged for technical phone screen',
    logs: [
      '06:00:02 🛰️ Radar sweep: Found 42 verified openings for "Full Stack Engineer"',
      '06:00:05 🎯 Evaluated match: Stripe Senior Full Stack Engineer (98.8% Fit)',
      '06:00:08 🧠 AI Reasoning: Formulating tailored responses for screening questions...',
      '06:00:12 ⚡ Pre-filling fields: Notice Period, Relocation, Compensation expectations',
      '06:00:15 🚀 Verified application dispatched directly to Talent Acquisition'
    ]
  },
  {
    id: 'ai-ml',
    label: 'AI & Machine Learning',
    company: 'DeepMind',
    role: 'Staff AI Systems Engineer',
    location: 'Bengaluru · Hybrid',
    salary: '₹55 - 72 LPA',
    logoText: 'D',
    matchScore: 99.4,
    skills: ['Python', 'PyTorch', 'LLMs', 'High-Scale Infra', 'CUDA', 'C++'],
    screeningQuestion: 'Describe your hands-on experience scaling LLM agent workflows in production.',
    aiAnswer: '4+ years fine-tuning and deploying high-concurrency LLM inference pipelines with sub-50ms latency.',
    appliedTime: '06:04 AM IST',
    recruiterMessage: 'Talent Partner triggered Interview Shortlist candidate packet',
    logs: [
      '06:00:03 🛰️ Radar sweep: Found 18 fresh openings matching "AI Systems / LLMs"',
      '06:00:06 🎯 Evaluated match: DeepMind Staff AI Engineer (99.4% Fit)',
      '06:00:09 🧠 AI Reasoning: Highlighting candidate model scaling and PyTorch achievements...',
      '06:00:13 ⚡ Validated candidate credentials against employer screening criteria',
      '06:00:16 🚀 Verified application dispatched with custom executive summary'
    ]
  },
  {
    id: 'cloud',
    label: 'Cloud & Systems',
    company: 'Microsoft',
    role: 'Cloud Infrastructure Architect',
    location: 'Hyderabad / Remote',
    salary: '₹42 - 56 LPA',
    logoText: 'M',
    matchScore: 97.9,
    skills: ['Kubernetes', 'Cloud Architecture', 'Golang', 'Terraform', 'CI/CD'],
    screeningQuestion: 'Are you open to hybrid collaboration and leading architecture sprints?',
    aiAnswer: 'Yes, fully aligned with hybrid cadence and experienced mentoring platform teams.',
    appliedTime: '08:01 AM IST',
    recruiterMessage: 'Talent Acquisition team accessed verified application portfolio',
    logs: [
      '08:00:01 🛰️ Morning run initiated: Scanning Azure and enterprise cloud feeds',
      '08:00:04 🎯 Evaluated match: Microsoft Cloud Architect (97.9% Fit)',
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
    matchScore: 98.2,
    skills: ['Node.js', 'Golang', 'Kafka', 'Redis', 'High RPS Payments'],
    screeningQuestion: 'Experience designing fault-tolerant financial settlement services?',
    aiAnswer: 'Architected distributed payment ledger microservices handling 25K+ RPS with 99.99% uptime.',
    appliedTime: '08:03 AM IST',
    recruiterMessage: 'Recruiter requested technical chat and availability slots',
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
    <div className="w-full max-w-6xl mx-auto rounded-2xl bg-[#09090b] border border-zinc-800 shadow-2xl overflow-hidden relative text-zinc-100">
      {/* Autonomous Laser Beam Sweep */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-400/80 to-transparent animate-laser-sweep z-20 pointer-events-none" />
      
      {/* Subtle top ambient purple aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Cockpit Header */}
      <div className="p-4 sm:px-6 bg-[#050507] border-b border-zinc-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-white tracking-tight">
                Autonomous Engine Live Simulation
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-400">
                06:00 & 08:00 AM IST
              </span>
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-4 text-xs font-mono self-end sm:self-auto">
          <div className="text-zinc-400 text-[11px]">
            Scanned: <span className="text-white font-medium">{scanPulse.toLocaleString()}</span>
          </div>
          <div className="text-zinc-200 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800 flex items-center gap-1.5 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Applications: {applicationsCount}</span>
          </div>
        </div>
      </div>

      {/* Role Switcher Tabs */}
      <div className="px-4 sm:px-6 py-3 bg-[#09090b] border-b border-zinc-800/80 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          {DEMO_ROLES.map((role, idx) => (
            <button
              key={role.id}
              onClick={() => {
                setSelectedIdx(idx)
                setIsAutoCycling(false)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                selectedIdx === idx
                  ? 'bg-white text-black shadow-sm'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <span>{role.label}</span>
              <span className={`text-[10px] ${selectedIdx === idx ? 'text-zinc-600' : 'text-zinc-500'}`}>
                {role.company}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsAutoCycling(!isAutoCycling)}
          className={`text-[10px] px-2.5 py-1 rounded border font-mono transition-colors shrink-0 hidden sm:flex items-center gap-1 cursor-pointer ${
            isAutoCycling
              ? 'bg-zinc-900 text-zinc-300 border-zinc-800'
              : 'bg-zinc-950 text-zinc-500 border-zinc-900'
          }`}
        >
          {isAutoCycling ? 'Cycle: Auto' : 'Cycle: Paused'}
        </button>
      </div>

      {/* 4-Step Linear Pipeline Stages */}
      <div className="px-4 sm:px-6 py-2.5 bg-[#070709] border-b border-zinc-800/70 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div
          className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
            stage === 'scan'
              ? 'bg-zinc-900 text-white border-zinc-700 font-medium'
              : 'bg-black/40 text-zinc-500 border-zinc-900'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <span className="truncate">1. Opportunity Scan</span>
        </div>

        <div
          className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
            stage === 'score'
              ? 'bg-zinc-900 text-white border-zinc-700 font-medium'
              : 'bg-black/40 text-zinc-500 border-zinc-900'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-zinc-400" />
          <span className="truncate">2. Skill Fit Match</span>
        </div>

        <div
          className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
            stage === 'answer'
              ? 'bg-zinc-900 text-white border-zinc-700 font-medium'
              : 'bg-black/40 text-zinc-500 border-zinc-900'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-zinc-400" />
          <span className="truncate">3. Screening Q&A</span>
        </div>

        <div
          className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
            stage === 'applied'
              ? 'bg-zinc-900 text-emerald-400 border-emerald-500/40 font-medium'
              : 'bg-black/40 text-zinc-500 border-zinc-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="truncate">4. Verified Delivery</span>
        </div>
      </div>

      {/* Main Simulation Viewport */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Sub-Panel: Live Agent Terminal Output (5 Cols) */}
        <div className="lg:col-span-5 rounded-xl bg-black border border-zinc-800 p-4 flex flex-col justify-between space-y-4 font-mono text-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 text-[11px] text-zinc-400">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-200 font-sans font-medium">Engine Execution Telemetry</span>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                ACTIVE
              </span>
            </div>

            {/* Terminal Lines */}
            <div className="space-y-2 mt-3 text-[11px] text-zinc-400 min-h-[190px]">
              {activeRole.logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-zinc-600 shrink-0 select-none">›</span>
                  <span className={i === activeRole.logs.length - 1 ? 'text-zinc-200 font-medium' : 'text-zinc-400'}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recruiter Response Toast Alert */}
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] flex items-center gap-2.5 text-zinc-300 font-sans min-h-[46px]">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
            <span className="line-clamp-2">{activeRole.recruiterMessage}</span>
          </div>
        </div>

        {/* Right Sub-Panel: Rich Job & Application Execution Card (7 Cols) */}
        <div className="lg:col-span-7 space-y-3.5 flex flex-col justify-between">
          
          {/* Target Opportunity Header Card */}
          <div className="p-4 sm:p-5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4 min-h-[82px]">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-white text-base shrink-0">
                {activeRole.logoText}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-semibold text-white">{activeRole.role}</h3>
                  <span className="text-xs text-zinc-400">@{activeRole.company}</span>
                </div>
                <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>{activeRole.location}</span>
                  <span>•</span>
                  <span className="text-zinc-200 font-medium font-mono">{activeRole.salary}</span>
                </div>
              </div>
            </div>

            {/* Neural Fit Gauge */}
            <div className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 font-medium text-xs font-mono shrink-0">
              {activeRole.matchScore}% Match
            </div>
          </div>

          {/* AI Decision Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Matched Skill Matrix */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-2 min-h-[105px]">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-zinc-400" /> Matched Skills
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeRole.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Contextual Screening Q&A */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-1 min-h-[105px]">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-zinc-400" /> Tailored Screening Response
              </span>
              <div className="text-[11px] leading-relaxed">
                <span className="text-zinc-500 block text-[10px]">Q: {activeRole.screeningQuestion}</span>
                <span className="text-zinc-200 font-medium block mt-0.5 line-clamp-3">
                  A: {activeRole.aiAnswer}
                </span>
              </div>
            </div>
          </div>

          {/* Dispatch Confirmation Card */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-white font-medium block text-xs">Application Submitted</span>
                <span className="text-zinc-500 text-[11px]">
                  Dispatched at <span className="font-mono text-zinc-300">{activeRole.appliedTime}</span>
                </span>
              </div>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono hidden sm:flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              <span>Visible in Recruiter Portal</span>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Trust & Assurance Footer */}
      <div className="px-6 py-3 bg-[#050507] border-t border-zinc-800/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-400 font-medium">Safe Human Pacing Emulation & Dual Daily Windows</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          <span>Direct ATS Integrations</span>
          <span>•</span>
          <span>Zero Spam Policy</span>
        </div>
      </div>
    </div>
  )
}
