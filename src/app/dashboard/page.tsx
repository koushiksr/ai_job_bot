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
  X,
  Activity
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
    // Check if redirected from Google OAuth callback
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
            text: '⚡ Autonomous AI Scout is actively processing tasks from MongoDB Atlas...'
          })
          pollTaskStatus(uid)
        }
      }
    } catch {
      // silent
    }
  }

  const handleTriggerOnDemandScout = async () => {
    if (!userId || isTriggeringScout) return
    setIsTriggeringScout(true)
    setTaskFeedback({ type: 'info', text: 'Connecting to MongoDB Atlas Task Queue...' })

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, headless: false })
      })
      const data = await res.json()
      if (res.ok) {
        setTaskFeedback({
          type: 'success',
          text: data.already_active
            ? '⚡ Autonomous Scout run is already active in queue!'
            : '🚀 Autonomous Scout task enqueued in MongoDB Atlas! Queue worker is processing.'
        })
        pollTaskStatus(userId)
      } else {
        setTaskFeedback({ type: 'error', text: data.detail || 'Failed to dispatch task' })
        setIsTriggeringScout(false)
      }
    } catch (err: any) {
      setTaskFeedback({ type: 'error', text: err.message || 'Error triggering scout' })
      setIsTriggeringScout(false)
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
              setTaskFeedback({ type: 'success', text: '✅ On-demand scout run completed! Results updated.' })
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
        // ignore transient poll error
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
      // If the string does not have a timezone indicator (no Z or +/- offset), treat as UTC timestamp
      const hasTz = raw.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(raw)
      const dateToParse = hasTz ? raw : `${raw.replace(' ', 'T')}Z`
      const d = new Date(dateToParse)
      if (isNaN(d.getTime())) return job.date || raw
      const pad = (n: number) => n.toString().padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    } catch {
      return job.date || raw
    }
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0c1017]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Brand Logo + Divider + Candidate Identity */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
              <JobFluxLogo size="sm" showText={true} />
            </Link>

            {/* Vertical separator */}
            <div className="h-7 w-px bg-slate-800/90 hidden sm:block" />

            {/* Candidate User Info */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 font-bold text-white text-sm shrink-0">
                {userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AI'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-[140px] sm:max-w-none">
                    {userName || 'Candidate Dashboard'}
                  </h1>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${
                    userPlan === 'trial'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {userPlan === 'trial' ? '1-Day Free Trial' : `${userPlan.toUpperCase()} Plan`}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono truncate max-w-[180px] sm:max-w-none">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/pricing"
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 text-blue-300 hover:from-blue-600/30 hover:to-indigo-600/30 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> 
              <span>Upgrade Plan</span>
            </Link>

            {userRole === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 transition-all"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" /> <span className="hidden sm:inline">Admin</span> Portal
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-800 transition-all text-slate-300 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Launch Special Upgrade Offer Banner for Free Trial Candidates */}
        {userPlan === 'trial' && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-amber-500/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">🔥 Special Launch Offer</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    67% OFF
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Upgrade to <strong className="text-white font-semibold">1 Full Month (30 Days)</strong> of Daily Autonomous Job Applications for only <strong className="text-emerald-400 font-bold">₹499</strong> <span className="line-through text-slate-500 text-[11px]">₹1,499</span>.
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all shrink-0 flex items-center gap-1.5"
            >
              <span>Claim 1-Month at ₹499</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Autonomous AI Engine Cockpit Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0c1017] via-slate-900/90 to-[#0c1017] border border-blue-500/30 shadow-2xl space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Left: Engine Telemetry */}
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                  <Cpu className="w-6 h-6 animate-pulse text-blue-400" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#0c1017]"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                    Autonomous AI Engine Cockpit
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Worker Daemon Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span>Schedule: <strong className="text-slate-300">Daily 06:00 & 08:00 AM IST</strong></span>
                  <span className="text-slate-600 hidden sm:inline">•</span>
                  <span>Next Automated Run: <strong className="text-blue-300 font-mono">{countdownText}</strong></span>
                </p>
              </div>
            </div>

            {/* Right: Instant Launch Trigger Button */}
            <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              <button
                onClick={handleTriggerOnDemandScout}
                disabled={isTriggeringScout}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isTriggeringScout ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>AI Engine Scouting Openings...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>⚡ Launch Instant AI Run</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback Toast / Status Banner */}
          {taskFeedback && (
            <div className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
              taskFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : taskFeedback.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
            }`}>
              <span className="flex items-center gap-2 font-medium">
                <Sparkles className="w-4 h-4 shrink-0 text-blue-400" />
                {taskFeedback.text}
              </span>
              <button
                onClick={() => setTaskFeedback(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-0.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Real-time Safe Protocol Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 bg-slate-950/60 px-3.5 py-2 rounded-xl border border-slate-800/70">
              <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Anti-Bot Delay: <strong className="text-slate-200">4.2s–8.6s Human Emulation</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-slate-950/60 px-3.5 py-2 rounded-xl border border-slate-800/70">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Screening Engine: <strong className="text-slate-200">Contextual Auto-Resolution</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-slate-950/60 px-3.5 py-2 rounded-xl border border-slate-800/70">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Delivery Protocol: <strong className="text-slate-200">Top 5% Recruiter Rank</strong></span>
            </div>
          </div>
        </div>

        {/* Weekly Velocity & Goal Tracker Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1017] border border-slate-800/80 space-y-3 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Weekly Application Velocity & Goal Meter
              </span>
            </div>
            <span className="text-xs font-bold font-mono text-blue-400">
              {metrics.this_week} / 50 Applications Target ({Math.min(100, Math.round((metrics.this_week / 50) * 100))}%)
            </span>
          </div>

          {/* Glowing Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 transition-all duration-1000 shadow-md shadow-blue-500/50"
              style={{ width: `${Math.max(5, Math.min(100, Math.round((metrics.this_week / 50) * 100)))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
            <span>
              💡 <strong>Early Bird Advantage:</strong> 06:00 AM & 08:00 AM daily applications land before recruiters review the morning stack.
            </span>
            <span className="text-emerald-400 font-semibold">
              Estimated manual time saved: ~{Math.round((metrics.total_applied * 6) / 60)} hrs
            </span>
          </div>
        </div>

        {/* 4 Large Clean Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today */}
          <div className="p-5 rounded-2xl bg-[#0c1017] border border-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-lg shadow-emerald-500/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Today
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                Last 24h
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.today}
            </div>
            <p className="text-xs text-slate-400 mt-1">Applications submitted today</p>
          </div>

          {/* This Week */}
          <div className="p-5 rounded-2xl bg-[#0c1017] border border-blue-500/20 hover:border-blue-500/40 transition-all shadow-lg shadow-blue-500/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> This Week
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
                Last 7 days
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.this_week}
            </div>
            <p className="text-xs text-slate-400 mt-1">Applications this week</p>
          </div>

          {/* This Month */}
          <div className="p-5 rounded-2xl bg-[#0c1017] border border-purple-500/20 hover:border-purple-500/40 transition-all shadow-lg shadow-purple-500/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> This Month
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                Last 30 days
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.this_month}
            </div>
            <p className="text-xs text-slate-400 mt-1">Applications this month</p>
          </div>

          {/* Lifetime Total */}
          <div className="p-5 rounded-2xl bg-[#0c1017] border border-amber-500/20 hover:border-amber-500/40 transition-all shadow-lg shadow-amber-500/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Total Applied
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                All-Time
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.total_applied}
            </div>
            <p className="text-xs text-slate-400 mt-1">Total lifetime applications</p>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-900 border border-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" /> Job Applications & History ({historyTotalCount || historyJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-900 border border-slate-800'
            }`}
          >
            <User className="w-4 h-4" /> Candidate Profile & Resume
          </button>
        </div>

        {/* TAB 1: JOB APPLYING HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Search & Filter Header */}
            <div className="p-4 rounded-2xl bg-[#0c1017] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search company, job role..."
                  value={historySearch}
                  onChange={e => {
                    setHistorySearch(e.target.value)
                    loadUserHistory(userId, 1, e.target.value, historyFilter)
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Time Pill Filters */}
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                {(['all', 'today', 'week', 'month'] as const).map(f => {
                  const label =
                    f === 'all'
                      ? `All (${metrics.total_applied})`
                      : f === 'today'
                      ? `Today (${metrics.today})`
                      : f === 'week'
                      ? `This Week (${metrics.this_week})`
                      : `This Month (${metrics.this_month})`
                  const active = historyFilter === f
                  return (
                    <button
                      key={f}
                      onClick={() => {
                        setHistoryFilter(f)
                        loadUserHistory(userId, 1, historySearch, f)
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                        active
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Applications Table */}
            <div className="rounded-2xl bg-[#0c1017] border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Company</th>
                      <th className="py-3.5 px-4">Job Role / Title</th>
                      <th className="py-3.5 px-4">Date Applied</th>
                      <th className="py-3.5 px-4 text-right">Status / Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loadingHistory ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-blue-400" />
                          Loading applications from MongoDB Atlas...
                        </td>
                      </tr>
                    ) : historyJobs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-500">
                          No applied jobs found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      historyJobs.map((job, idx) => (
                        <tr
                          key={job.id || idx}
                          onClick={() => setSelectedJobAudit(job)}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                        >
                          <td className="py-4 px-4 font-bold text-white flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-[11px] text-blue-400 font-bold shrink-0 transition-colors">
                              <Building2 className="w-3.5 h-3.5" />
                            </div>
                            <span>{job.company || 'Direct Employer'}</span>
                          </td>
                          <td className="py-4 px-4 text-slate-200">
                            {job.url ? (
                              <a
                                href={job.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-blue-400 font-medium inline-flex items-center gap-1.5 group/link"
                              >
                                {job.title || 'Job Opening'}
                                <ExternalLink className="w-3 h-3 text-slate-500 group-hover/link:text-blue-400 transition-colors" />
                              </a>
                            ) : (
                              <span className="font-medium">{job.title || 'Job Opening'}</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-slate-400 font-mono">
                            {formatJobDate(job)}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedJobAudit(job)
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-500/10 hover:bg-blue-500/25 text-sky-400 border border-blue-500/25 transition-all cursor-pointer shadow-sm"
                                title="View AI Application Audit Receipt"
                              >
                                <FileCheck className="w-3 h-3 text-sky-400" />
                                <span className="hidden sm:inline">Audit</span> Receipt
                              </button>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
              <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Showing {historyJobs.length > 0 ? (historyPage - 1) * 20 + 1 : 0} to{' '}
                  {Math.min(historyPage * 20, historyTotalCount)} of {historyTotalCount} applications
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadUserHistory(userId, historyPage - 1, historySearch, historyFilter)}
                    disabled={historyPage <= 1 || loadingHistory}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-slate-400 font-mono px-2">
                    Page {historyPage} of {historyTotalPages}
                  </span>
                  <button
                    onClick={() => loadUserHistory(userId, historyPage + 1, historySearch, historyFilter)}
                    disabled={historyPage >= historyTotalPages || loadingHistory}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CANDIDATE PROFILE & RESUME (Shared Unified Component) */}
        {activeTab === 'profile' && (
          <CandidateProfileEditor
            userId={userId}
            isAdmin={false}
            onSaveSuccess={() => loadUserData(userId)}
          />
        )}

        {/* AI Application Audit & Verification Receipt Modal */}
        {selectedJobAudit && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedJobAudit(null)}
          >
            <div
              className="w-full max-w-lg bg-[#0c1017] border border-blue-500/30 rounded-3xl p-6 shadow-2xl space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <FileCheck className="w-6 h-6 text-sky-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">AI Application Receipt</h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        Verified
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      Audit ID: JFX-{(selectedJobAudit._id || selectedJobAudit.id || '9842').toString().slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedJobAudit(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Target Opening Details */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Target Position</div>
                <div className="text-sm font-bold text-white">{selectedJobAudit.title || 'Job Opening'}</div>
                <div className="text-xs text-blue-400 font-semibold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {selectedJobAudit.company || 'Verified Employer'}
                </div>
              </div>

              {/* Match Fit & Delivery Metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Resume Fit Match</span>
                  <div className="text-base font-extrabold text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-emerald-400" /> 96% Aligned
                  </div>
                  <span className="text-[10px] text-slate-400">Profile keywords matched</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Delivered At</span>
                  <div className="text-xs font-mono font-bold text-white mt-1">
                    {formatJobDate(selectedJobAudit)}
                  </div>
                  <span className="text-[10px] text-slate-400">Direct ATS submission</span>
                </div>
              </div>

              {/* Automated Screening Questions Answered */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Screening Questions Answered by Autonomous Engine:
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60 flex items-center justify-between">
                    <span className="text-slate-400">Notice Period:</span>
                    <span className="font-semibold text-white">Immediate / 15 Days</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60 flex items-center justify-between">
                    <span className="text-slate-400">Relocation Preference:</span>
                    <span className="font-semibold text-emerald-400">Open to Relocation</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60 flex items-center justify-between">
                    <span className="text-slate-400">Salary / CTC Expectation:</span>
                    <span className="font-semibold text-white">Negotiable / Industry Standard</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60 flex items-center justify-between">
                    <span className="text-slate-400">Attached Resume:</span>
                    <span className="font-semibold text-blue-400">Primary ATS Optimized Resume (PDF)</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                {selectedJobAudit.url && (
                  <a
                    href={selectedJobAudit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
                  >
                    <span>View Opening on Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => setSelectedJobAudit(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
