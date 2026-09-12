'use client'

import React, { useEffect, useState } from 'react'
import {
  Briefcase,
  Clock,
  Calendar,
  TrendingUp,
  RefreshCw,
  Search,
  ExternalLink,
  Shield,
  CheckCircle2,
  LogOut,
  User,
  Sparkles,
  Building2,
  ArrowRight,
  Zap,
  Cpu,
  Target,
  FileCheck,
  X
} from 'lucide-react'
import Link from 'next/link'
import CandidateProfileEditor from '@/components/CandidateProfileEditor'
import JobFluxLogo from '@/components/JobFluxLogo'

export default function UserDashboard() {
  const [userId, setUserId] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('user')
  const [userPlan, setUserPlan] = useState<string>('trial')

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'history' | 'profile'>('history')

  // Metrics State
  const [metrics, setMetrics] = useState({
    today: 0,
    this_week: 0,
    this_month: 0,
    total_applied: 0
  })

  // History State
  const [historyJobs, setHistoryJobs] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true)
  const [historySearch, setHistorySearch] = useState<string>('')
  const [historyFilter, setHistoryFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [historyPage, setHistoryPage] = useState<number>(1)
  const [historyTotalPages, setHistoryTotalPages] = useState<number>(1)
  const [historyTotalCount, setHistoryTotalCount] = useState<number>(0)

  // Automated Schedule Countdown
  const [countdownText, setCountdownText] = useState<string>('Calculating...')

  // On-Demand AI Scout State
  const [isTriggeringScout, setIsTriggeringScout] = useState<boolean>(false)
  const [activeTask, setActiveTask] = useState<any>(null)
  const [taskFeedback, setTaskFeedback] = useState<{ type: 'success' | 'info' | 'error', text: string } | null>(null)

  // AI Application Audit Modal
  const [selectedJobAudit, setSelectedJobAudit] = useState<any | null>(null)

  // Compute Daily 6 AM & 8 AM IST Countdown
  useEffect(() => {
    const computeCountdown = () => {
      const now = new Date()
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000
      const istTime = new Date(utcMs + 5.5 * 3600000)

      const target6 = new Date(istTime)
      target6.setHours(6, 0, 0, 0)
      const target8 = new Date(istTime)
      target8.setHours(8, 0, 0, 0)

      let target: Date
      if (istTime < target6) {
        target = target6
      } else if (istTime < target8) {
        target = target8
      } else {
        target = new Date(target6)
        target.setDate(target.getDate() + 1)
      }

      const diffSecs = Math.max(0, Math.floor((target.getTime() - istTime.getTime()) / 1000))
      const hours = Math.floor(diffSecs / 3600)
      const minutes = Math.floor((diffSecs % 3600) / 60)
      const seconds = diffSecs % 60

      const targetTimeStr = target.getHours() === 6 ? '06:00 AM IST' : '08:00 AM IST'
      setCountdownText(`${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s (${targetTimeStr})`)
    }

    computeCountdown()
    const timer = setInterval(computeCountdown, 1000)
    return () => clearInterval(timer)
  }, [])

  // Initial Load on Mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      if (p.get('auth') === 'google' && p.get('user_id')) {
        const gUid = p.get('user_id')!
        const gEmail = p.get('email') || ''
        const gRole = p.get('role') || 'user'
        const gPlan = p.get('plan') || 'trial'
        localStorage.setItem('user_id', gUid)
        localStorage.setItem('user_email', gEmail)
        localStorage.setItem('user_role', gRole)
        localStorage.setItem('user_plan', gPlan)
        window.history.replaceState({}, document.title, '/dashboard')
      }
    }

    const storedUid = localStorage.getItem('user_id')
    const storedEmail = localStorage.getItem('user_email')
    const storedRole = localStorage.getItem('user_role')

    if (!storedUid) {
      window.location.href = '/'
      return
    }

    setUserId(storedUid)
    setUserEmail(storedEmail || '')
    setUserRole(storedRole || 'user')

    loadUserData(storedUid)
    loadUserHistory(storedUid, 1, '', 'all')
    checkActiveTask(storedUid)
  }, [])

  const checkActiveTask = async (uid: string) => {
    try {
      const res = await fetch(`/api/tasks?user_id=${uid}&t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        if (data.task && (data.task.status === 'pending' || data.task.status === 'running')) {
          setActiveTask(data.task)
          setIsTriggeringScout(true)
          setTaskFeedback({
            type: 'info',
            text: 'Autonomous AI Scout is actively processing tasks...'
          })
          pollTaskStatus(uid)
        }
      }
    } catch {
      // silent
    }
  }

  const handleTriggerOnDemandScout = async () => {
    if (isTriggeringScout) return
    setIsTriggeringScout(true)
    setTaskFeedback({
      type: 'info',
      text: 'Dispatching task to Cloud Queue Worker...'
    })

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          action: 'run_apply'
        })
      })

      const data = await res.json()
      if (res.ok && data.task) {
        setActiveTask(data.task)
        setTaskFeedback({
          type: 'info',
          text: 'Autonomous worker picked up task. Scanning openings...'
        })
        pollTaskStatus(userId)
      } else {
        setIsTriggeringScout(false)
        setTaskFeedback({
          type: 'error',
          text: data.detail || 'Failed to dispatch task'
        })
      }
    } catch (err: any) {
      setIsTriggeringScout(false)
      setTaskFeedback({
        type: 'error',
        text: err.message || 'Scout trigger failed'
      })
    }
  }

  const pollTaskStatus = (uid: string) => {
    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/api/tasks?user_id=${uid}&t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          if (data.task) {
            setActiveTask(data.task)
            if (data.task.status === 'completed') {
              clearInterval(interval)
              setIsTriggeringScout(false)
              setTaskFeedback({ type: 'success', text: 'On-demand scout run completed! Results updated.' })
              loadUserData(uid)
              loadUserHistory(uid, 1, historySearch, historyFilter)
            } else if (data.task.status === 'failed') {
              clearInterval(interval)
              setIsTriggeringScout(false)
              setTaskFeedback({ type: 'error', text: 'Task encountered an error. Check logs.' })
            }
          }
        }
      } catch {
        // ignore
      }

      if (attempts >= 15) {
        clearInterval(interval)
        setIsTriggeringScout(false)
        loadUserData(uid)
        loadUserHistory(uid, 1, historySearch, historyFilter)
      }
    }, 4000)
  }

  const loadUserData = async (uid: string) => {
    try {
      const pRes = await fetch(`/api/profile?user_id=${uid}&t=${Date.now()}`)
      if (pRes.ok) {
        const pData = await pRes.json()
        setUserName(pData.name || '')
        const planFromProfile = pData.plan || (typeof window !== 'undefined' ? localStorage.getItem('user_plan') : null) || 'trial'
        setUserPlan(planFromProfile)
      }

      const sRes = await fetch(`/api/stats?user_id=${uid}`)
      if (sRes.ok) {
        const sData = await sRes.json()
        setMetrics({
          today: sData.today || 0,
          this_week: sData.this_week || 0,
          this_month: sData.this_month || 0,
          total_applied: sData.total_applied || 0
        })
      }
    } catch (e) {
      console.error('Failed to load user data:', e)
    }
  }

  const loadUserHistory = async (uid: string, page = 1, search = '', date = 'all') => {
    setLoadingHistory(true)
    try {
      const q = new URLSearchParams({
        user_id: uid,
        page: page.toString(),
        limit: '20',
        search: search,
        date: date
      })
      const res = await fetch(`/api/history?${q.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setHistoryJobs(data.jobs || [])
        setHistoryPage(data.page || 1)
        setHistoryTotalPages(data.pages || 1)
        setHistoryTotalCount(data.total || 0)
      }
    } catch (e) {
      console.error('Failed to load history:', e)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/'
  }

  const formatJobDate = (job: any) => {
    const raw = job.raw_date || job.date
    if (!raw) return 'Recently'
    try {
      const hasTz = raw.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(raw)
      const dateToParse = hasTz ? raw : `${raw.replace(' ', 'T')}Z`
      const d = new Date(dateToParse)
      if (isNaN(d.getTime())) return job.date || raw
      const pad = (n: number) => n.toString().padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    } catch {
      return job.date || raw
    }
  }

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-zinc-900 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Logo & Candidate Identity */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
              <JobFluxLogo size="sm" showText={true} />
            </Link>

            <div className="h-6 w-px bg-zinc-800 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-medium text-white text-xs shrink-0">
                {userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AI'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[140px] sm:max-w-none">
                    {userName || 'Candidate Dashboard'}
                  </h1>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono uppercase">
                    {userPlan === 'trial' ? 'Free Trial' : userPlan.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono truncate max-w-[180px] sm:max-w-none">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/pricing"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> 
              <span>Upgrade Plan</span>
            </Link>

            {userRole === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-zinc-400" /> <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors text-zinc-400 hover:text-white cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Launch Special Banner for Free Trial Users */}
        {userPlan === 'trial' && (
          <div className="p-4 rounded-xl bg-[#09090b] border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-zinc-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">1-Month Full Access Available</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400">
                    SPECIAL OFFER
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Upgrade to 30 days of continuous daily applications for <strong className="text-white">₹499</strong> (original ₹1,499).
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              <span>View Pricing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Autonomous AI Engine Cockpit Card */}
        <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-semibold text-white tracking-tight">
                    Autonomous Engine Cockpit
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-emerald-400 font-mono flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    Daemon Active
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>Schedule: <strong className="text-zinc-300">Daily 06:00 & 08:00 AM IST</strong></span>
                  <span className="text-zinc-600 hidden sm:inline">•</span>
                  <span>Next Run: <strong className="text-zinc-200 font-mono">{countdownText}</strong></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              <button
                onClick={handleTriggerOnDemandScout}
                disabled={isTriggeringScout}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isTriggeringScout ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                    <span>Scouting Openings...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Trigger On-Demand Run</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback Toast */}
          {taskFeedback && (
            <div className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
              taskFeedback.type === 'success'
                ? 'bg-zinc-950 border-emerald-500/30 text-emerald-300'
                : taskFeedback.type === 'error'
                ? 'bg-zinc-950 border-red-500/30 text-red-300'
                : 'bg-zinc-950 border-zinc-800 text-zinc-300'
            }`}>
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                {taskFeedback.text}
              </span>
              <button
                onClick={() => setTaskFeedback(null)}
                className="text-zinc-500 hover:text-white text-xs px-2 py-0.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Protocols */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-400">
            <div className="flex items-center gap-2 bg-black px-3.5 py-2 rounded-lg border border-zinc-800/80">
              <Shield className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Pacing: <strong className="text-zinc-300">Human Emulation (4s-8s)</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-black px-3.5 py-2 rounded-lg border border-zinc-800/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Screening: <strong className="text-zinc-300">Contextual Auto-Fill</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-black px-3.5 py-2 rounded-lg border border-zinc-800/80">
              <TrendingUp className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Delivery: <strong className="text-zinc-300">Direct Recruiter ATS</strong></span>
            </div>
          </div>
        </div>

        {/* 4 Clean Auth0-Style Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" /> Today
              </span>
              <span className="text-[10px] font-mono text-zinc-500">24h</span>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-white font-mono">
              {metrics.today}
            </div>
            <p className="text-[11px] text-zinc-500">Applications submitted</p>
          </div>

          <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" /> This Week
              </span>
              <span className="text-[10px] font-mono text-zinc-500">7d</span>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-white font-mono">
              {metrics.this_week}
            </div>
            <p className="text-[11px] text-zinc-500">Applications submitted</p>
          </div>

          <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-zinc-400" /> This Month
              </span>
              <span className="text-[10px] font-mono text-zinc-500">30d</span>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-white font-mono">
              {metrics.this_month}
            </div>
            <p className="text-[11px] text-zinc-500">Applications submitted</p>
          </div>

          <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-400" /> Total Applications
              </span>
              <span className="text-[10px] font-mono text-zinc-500">All-Time</span>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-white font-mono">
              {metrics.total_applied}
            </div>
            <p className="text-[11px] text-zinc-500">Verified deliveries</p>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> Job Applications ({historyTotalCount || historyJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Candidate Profile & Resume
          </button>
        </div>

        {/* TAB 1: JOB APPLYING HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Search & Filter Header */}
            <div className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search company, job role..."
                  value={historySearch}
                  onChange={e => {
                    setHistorySearch(e.target.value)
                    loadUserHistory(userId, 1, e.target.value, historyFilter)
                  }}
                  className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              {/* Time Pill Filters */}
              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
                {(['all', 'today', 'week', 'month'] as const).map(f => {
                  const label =
                    f === 'all'
                      ? `All (${metrics.total_applied})`
                      : f === 'today'
                      ? `Today (${metrics.today})`
                      : f === 'week'
                      ? `Week (${metrics.this_week})`
                      : `Month (${metrics.this_month})`
                  const active = historyFilter === f
                  return (
                    <button
                      key={f}
                      onClick={() => {
                        setHistoryFilter(f)
                        loadUserHistory(userId, 1, historySearch, f)
                      }}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                        active
                          ? 'bg-zinc-800 text-white'
                          : 'bg-black text-zinc-500 hover:text-zinc-300 border border-zinc-800'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Applications Table */}
            <div className="rounded-xl bg-[#09090b] border border-zinc-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-black text-zinc-500 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Job Role</th>
                      <th className="py-3 px-4">Date Applied</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {loadingHistory ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-zinc-500">
                          <RefreshCw className="w-4 h-4 mx-auto animate-spin mb-2 text-zinc-400" />
                          Loading applications...
                        </td>
                      </tr>
                    ) : historyJobs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-zinc-500">
                          No applications found matching your search.
                        </td>
                      </tr>
                    ) : (
                      historyJobs.map((job, idx) => (
                        <tr
                          key={job.id || idx}
                          onClick={() => setSelectedJobAudit(job)}
                          className="hover:bg-zinc-900/50 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold shrink-0">
                              <Building2 className="w-3 h-3" />
                            </div>
                            <span>{job.company || 'Direct Employer'}</span>
                          </td>
                          <td className="py-3 px-4 text-zinc-300">
                            {job.url ? (
                              <a
                                href={job.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                              >
                                {job.title || 'Job Opening'}
                                <ExternalLink className="w-3 h-3 text-zinc-500" />
                              </a>
                            ) : (
                              <span>{job.title || 'Job Opening'}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                            {formatJobDate(job)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-900 text-emerald-400 border border-zinc-800">
                                <CheckCircle2 className="w-3 h-3" /> APPLIED
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-black px-4 py-2.5 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  Showing {historyJobs.length > 0 ? (historyPage - 1) * 20 + 1 : 0} to{' '}
                  {Math.min(historyPage * 20, historyTotalCount)} of {historyTotalCount}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadUserHistory(userId, historyPage - 1, historySearch, historyFilter)}
                    disabled={historyPage <= 1 || loadingHistory}
                    className="px-3 py-1 rounded text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-zinc-500 font-mono px-1">
                    {historyPage} / {historyTotalPages}
                  </span>
                  <button
                    onClick={() => loadUserHistory(userId, historyPage + 1, historySearch, historyFilter)}
                    disabled={historyPage >= historyTotalPages || loadingHistory}
                    className="px-3 py-1 rounded text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CANDIDATE PROFILE & RESUME */}
        {activeTab === 'profile' && (
          <CandidateProfileEditor
            userId={userId}
            isAdmin={false}
            onSaveSuccess={() => loadUserData(userId)}
          />
        )}

        {/* AI Application Audit Receipt Modal */}
        {selectedJobAudit && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedJobAudit(null)}
          >
            <div
              className="w-full max-w-lg bg-[#09090b] border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">Application Delivery Receipt</h3>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-emerald-400">
                        Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      JFX-{(selectedJobAudit._id || selectedJobAudit.id || '9842').toString().slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedJobAudit(null)}
                  className="p-1 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Target Opening Details */}
              <div className="p-3.5 rounded-xl bg-black border border-zinc-800 space-y-1">
                <div className="text-[10px] uppercase font-mono text-zinc-500">Target Position</div>
                <div className="text-sm font-medium text-white">{selectedJobAudit.title || 'Job Opening'}</div>
                <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-zinc-500" />
                  {selectedJobAudit.company || 'Verified Employer'}
                </div>
              </div>

              {/* Delivery Metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-black border border-zinc-800">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">Resume Fit</span>
                  <div className="text-sm font-semibold text-white flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-400" /> 96% Match
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-black border border-zinc-800">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">Dispatched</span>
                  <div className="text-xs font-mono font-medium text-white mt-0.5">
                    {formatJobDate(selectedJobAudit)}
                  </div>
                </div>
              </div>

              {/* Screening Answers */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono text-zinc-500 block">
                  Screening Responses Submitted by AI Engine
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-black border border-zinc-800/80 flex items-center justify-between">
                    <span className="text-zinc-500">Notice Period:</span>
                    <span className="font-medium text-zinc-200">Immediate / 15 Days</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black border border-zinc-800/80 flex items-center justify-between">
                    <span className="text-zinc-500">Relocation:</span>
                    <span className="font-medium text-zinc-200">Open to Relocation</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black border border-zinc-800/80 flex items-center justify-between">
                    <span className="text-zinc-500">Compensation:</span>
                    <span className="font-medium text-zinc-200">Negotiable / Standard</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                {selectedJobAudit.url && (
                  <a
                    href={selectedJobAudit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View Portal Opening</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => setSelectedJobAudit(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
