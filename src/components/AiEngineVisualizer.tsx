'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Building2,
  Send,
  Eye,
  Cpu,
  Target,
  Search,
  ShieldCheck,
  Flame,
  Layers
} from 'lucide-react'

interface JobSimulation {
  id: string
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
  recruiterStatus: string
}

const SIMULATED_JOBS: JobSimulation[] = [
  {
    id: 'stripe',
    company: 'Stripe',
    role: 'Senior Full Stack Engineer',
    location: 'Bengaluru · Hybrid / Remote',
    salary: '₹38 - 48 LPA',
    logoText: 'S',
    logoBg: 'from-violet-600 to-indigo-600',
    matchScore: 98.7,
    skills: ['React', 'Next.js', 'Node.js', 'Distributed Systems', 'PostgreSQL'],
    screeningQuestion: 'Notice period & expected compensation?',
    aiAnswer: 'Immediate (15 Days Negotiable) · Expected: ₹42 LPA',
    appliedTime: '06:02 AM IST',
    recruiterStatus: 'Recruiter viewed application at 06:14 AM'
  },
  {
    id: 'google',
    company: 'Google DeepMind',
    role: 'Staff AI Systems Engineer',
    location: 'Bengaluru · Hybrid',
    salary: '₹55 - 72 LPA',
    logoText: 'G',
    logoBg: 'from-blue-600 to-cyan-600',
    matchScore: 99.4,
    skills: ['Python', 'PyTorch', 'LLMs', 'High-Scale Infrastructure', 'C++'],
    screeningQuestion: 'Experience deploying production AI models?',
    aiAnswer: '4+ years fine-tuning & scaling LLM agents with high throughput',
    appliedTime: '06:04 AM IST',
    recruiterStatus: 'Direct interview shortlist triggered'
  },
  {
    id: 'microsoft',
    company: 'Microsoft Azure',
    role: 'Cloud Platform Architect',
    location: 'Hyderabad / Remote',
    salary: '₹42 - 56 LPA',
    logoText: 'M',
    logoBg: 'from-sky-600 to-blue-700',
    matchScore: 97.9,
    skills: ['Kubernetes', 'Cloud Architecture', 'Go', 'Microservices', 'CI/CD'],
    screeningQuestion: 'Are you open to hybrid/remote collaboration?',
    aiAnswer: 'Yes, fully aligned with hybrid and remote team cadence',
    appliedTime: '08:01 AM IST',
    recruiterStatus: 'Resume downloaded by Talent Acquisition'
  },
  {
    id: 'razorpay',
    company: 'Razorpay',
    role: 'Lead Backend Engineer',
    location: 'Bengaluru · In-Office',
    salary: '₹36 - 45 LPA',
    logoText: 'R',
    logoBg: 'from-blue-500 to-indigo-700',
    matchScore: 98.2,
    skills: ['Node.js', 'Golang', 'Fintech APIs', 'Kafka', 'Redis'],
    screeningQuestion: 'Experience handling high-concurrency payment streams?',
    aiAnswer: 'Architected payment services processing 20K+ RPS with 99.99% uptime',
    appliedTime: '08:03 AM IST',
    recruiterStatus: 'Recruiter sent initial assessment link'
  }
]

export default function AiEngineVisualizer() {
  const [currentJobIdx, setCurrentJobIdx] = useState(0)
  const [stage, setStage] = useState<'scan' | 'score' | 'answer' | 'applied'>('scan')
  const [applicationsCount, setApplicationsCount] = useState(18)
  const [scanPulse, setScanPulse] = useState(1482)

  const currentJob = SIMULATED_JOBS[currentJobIdx]

  // Automated pipeline cycle (Scan -> Match Score -> AI Answer -> Applied -> Next Job)
  useEffect(() => {
    const timer1 = setTimeout(() => setStage('score'), 1100)
    const timer2 = setTimeout(() => setStage('answer'), 2300)
    const timer3 = setTimeout(() => {
      setStage('applied')
      setApplicationsCount(prev => prev + 1)
      setScanPulse(prev => prev + 4)
    }, 3600)
    const timer4 = setTimeout(() => {
      setStage('scan')
      setCurrentJobIdx(prev => (prev + 1) % SIMULATED_JOBS.length)
    }, 5600)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [currentJobIdx])

  return (
    <div className="w-full rounded-2xl bg-[#0c1017]/90 border border-slate-800/90 overflow-hidden shadow-2xl backdrop-blur-xl relative">
      {/* Ambient glow highlight */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Cockpit Header */}
      <div className="px-5 py-3.5 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white tracking-wide uppercase font-mono">
              JobFlux Autonomous Engine
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-500/10 text-sky-400 border border-blue-500/30">
              LIVE SIMULATION
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div className="text-slate-400 hidden sm:block">
            Scanned: <span className="text-white font-bold">{scanPulse.toLocaleString()}</span>
          </div>
          <div className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/25">
            Applied: {applicationsCount}
          </div>
        </div>
      </div>

      {/* 4-Step Animated Pipeline Progress Bar */}
      <div className="px-5 py-3 bg-slate-900/40 border-b border-slate-800/60 grid grid-cols-4 gap-2 text-[10px] font-mono">
        <div
          className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-all ${
            stage === 'scan'
              ? 'bg-blue-600/20 text-sky-300 border border-blue-500/40 font-bold'
              : 'text-slate-400'
          }`}
        >
          <Search className={`w-3 h-3 ${stage === 'scan' ? 'animate-spin' : ''}`} />
          <span className="truncate">1. Deep Scan</span>
        </div>

        <div
          className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-all ${
            stage === 'score'
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 font-bold'
              : stage === 'answer' || stage === 'applied'
              ? 'text-emerald-400 font-medium'
              : 'text-slate-400'
          }`}
        >
          <Target className="w-3 h-3" />
          <span className="truncate">2. AI Fit Score</span>
        </div>

        <div
          className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-all ${
            stage === 'answer'
              ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 font-bold'
              : stage === 'applied'
              ? 'text-emerald-400 font-medium'
              : 'text-slate-400'
          }`}
        >
          <Cpu className="w-3 h-3" />
          <span className="truncate">3. Auto-Q&A</span>
        </div>

        <div
          className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-all ${
            stage === 'applied'
              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 font-bold'
              : 'text-slate-400'
          }`}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span className="truncate">4. Applied</span>
        </div>
      </div>

      {/* Main Dynamic Stage Showcase Card */}
      <div className="p-5 space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentJob.id}-${stage}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Target Job Card */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${currentJob.logoBg} flex items-center justify-center font-extrabold text-white text-base shadow-md shrink-0`}
                >
                  {currentJob.logoText}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{currentJob.role}</h4>
                    <span className="text-[10px] font-semibold text-slate-400 font-mono">
                      @{currentJob.company}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{currentJob.location}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold font-mono">{currentJob.salary}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Match Badge */}
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{currentJob.matchScore}% FIT</span>
                </div>
              </div>
            </div>

            {/* AI Automated Actions View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Left Box: Candidate Matching Skills */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
                  <Layers className="w-3 h-3 text-sky-400" /> Matched Skills & Keywords
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentJob.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900 text-slate-300 border border-slate-800 font-mono"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Box: Intelligent Screening Q&A Auto-Fill */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
                  <Cpu className="w-3 h-3 text-amber-400" /> AI Recruiter Screening Response
                </span>
                <div className="text-[11px] text-slate-300">
                  <span className="text-slate-500 block text-[10px] font-mono">Q: {currentJob.screeningQuestion}</span>
                  <span className="text-sky-300 font-semibold font-mono block mt-0.5">
                    A: {currentJob.aiAnswer}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Status Banner */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/30 via-emerald-950/20 to-slate-950/60 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">
                  Applied autonomously at <span className="font-mono text-white font-bold">{currentJob.appliedTime}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>{currentJob.recruiterStatus}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Mini Live Ticker of Recent Submissions */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono overflow-x-auto gap-4">
          <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Recent Pipeline:</span>
          </div>
          <div className="flex items-center gap-3 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="text-slate-300">Stripe (98%) <span className="text-emerald-400">✅</span></span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">Google (99%) <span className="text-emerald-400">✅</span></span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">Microsoft (97%) <span className="text-emerald-400">✅</span></span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">Razorpay (98%) <span className="text-emerald-400">✅</span></span>
          </div>
        </div>
      </div>
    </div>
  )
}
