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
  FileText,
  Mail,
  MessageSquare,
  X,
  Lock,
  Crown,
  ChevronDown,
  Download
} from 'lucide-react'
import Link from 'next/link'
import CandidateProfileEditor from '@/components/CandidateProfileEditor'
import JobFluxLogo from '@/components/JobFluxLogo'
import JobFluxHelpModal from '@/components/JobFluxHelpModal'
import ProfessionalUpgradeModal from '@/components/ProfessionalUpgradeModal'
import NeuralAtsDiagnosticCard from '@/components/NeuralAtsDiagnosticCard'
import AiResumeBuilder from '@/components/AiResumeBuilder'
import AiLoadingScreen from '@/components/AiLoadingScreen'

export default function UserDashboard() {
  const [userId, setUserId] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('user')
  const [userPlan, setUserPlan] = useState<string>('trial')
  const [userPlanName, setUserPlanName] = useState<string>('JobFlux 1-Day Free Trial')
  const [isPlanActive, setIsPlanActive] = useState<boolean>(true)
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null)
  const [isVip, setIsVip] = useState<boolean>(false)

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'history' | 'profile' | 'queries' | 'resume_builder'>('history')

  // Candidate Queries & Support Inquiries State
  const [userTickets, setUserTickets] = useState<any[]>([])
  const [loadingUserTickets, setLoadingUserTickets] = useState<boolean>(false)

  // Help Modal State
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false)

  // Initial Load & On-Demand Telemetry Refresh States
  const [pageLoading, setPageLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

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
  const [weeklyQuota, setWeeklyQuota] = useState<{ limit: number, used: number, remaining: number, is_unlimited: boolean } | null>(null)
  const [queueStatus, setQueueStatus] = useState<{ queue_position: number, is_global_sweep_active: boolean, active_user_id: string | null } | null>(null)

  // AI Application Audit Modal
  const [selectedJobAudit, setSelectedJobAudit] = useState<any | null>(null)

  // Professional Tier Feature Gating & Perks Modal
  const [showProModal, setShowProModal] = useState<boolean>(false)
  const [proModalFeature, setProModalFeature] = useState<string>('On-Demand Application Sweeps (Up to 5x / week)')

  // Candidate account has Professional privileges if on an active Professional tier OR VIP pass.
  // Admin accounts manage system configurations via the Admin Portal (/admin).
  const isProfessional = (userPlan === 'elite' || userPlan === 'professional' || userPlan === 'enterprise' || userPlan === 'vip' || isVip) && isPlanActive

  // Compute Daily Sweep Status
  useEffect(() => {
    const computeCountdown = () => {
      const now = new Date()
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000
      const istTime = new Date(utcMs + 5.5 * 3600000)

      const targetMidnight = new Date(istTime)
      targetMidnight.setHours(24, 0, 0, 0)

      const diffSecs = Math.max(0, Math.floor((targetMidnight.getTime() - istTime.getTime()) / 1000))
      const hours = Math.floor(diffSecs / 3600)
      const minutes = Math.floor((diffSecs % 3600) / 60)
      const seconds = diffSecs % 60

      setCountdownText(`${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`)
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

      const noticeParam = p.get('notice')
      if (noticeParam) {
        setTaskFeedback({
          type: 'error',
          text: decodeURIComponent(noticeParam)
        })
      }
    }

    const storedUid = localStorage.getItem('user_id')
    const storedEmail = localStorage.getItem('user_email')
    const storedRole = localStorage.getItem('user_role')
    const storedVip = localStorage.getItem('user_is_vip') === 'true'

    if (!storedUid) {
      window.location.href = '/'
      return
    }

    setUserId(storedUid)
    setUserEmail(storedEmail || '')
    setUserRole(storedRole || 'user')
    if (storedVip) setIsVip(true)

    refreshAllDashboardData(storedUid, true)
  }, [])

  // If activeTab is set to 'profile', redirect to dedicated /profile route
  useEffect(() => {
    if ((activeTab as string) === 'profile') {
      window.location.href = '/profile'
    }
  }, [activeTab])

  // ESC key dismiss handler for user menu and audit dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isUserMenuOpen) setIsUserMenuOpen(false)
        if (selectedJobAudit) setSelectedJobAudit(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isUserMenuOpen, selectedJobAudit])

  const refreshAllDashboardData = async (uid: string, isInitial = false) => {
    if (!uid) return
    if (isInitial) {
      setPageLoading(true)
    } else {
      setIsRefreshing(true)
    }
    const startTime = Date.now()

    try {
      await Promise.allSettled([
        loadUserData(uid),
        loadUserHistory(uid, 1, historySearch, historyFilter),
        loadUserTickets(uid),
        checkActiveTask(uid)
      ])
    } catch (e) {
      console.error('Error refreshing dashboard data:', e)
    } finally {
      const elapsed = Date.now() - startTime
      // Keep animation visible for at least 700ms for smooth cyber transition
      const remaining = Math.max(0, 700 - elapsed)
      setTimeout(() => {
        setPageLoading(false)
        setIsRefreshing(false)
      }, remaining)
    }
  }

  const checkActiveTask = async (uid: string) => {
    try {
      const res = await fetch(`/api/tasks?user_id=${uid}&t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        if (data.weekly_quota) {
          setWeeklyQuota(data.weekly_quota)
        }
        if (data.queue_status) {
          setQueueStatus(data.queue_status)
        }
        if (data.task && (data.task.status === 'pending' || data.task.status === 'running')) {
          setActiveTask(data.task)
          setIsTriggeringScout(true)
          if (data.task.status === 'running') {
            setTaskFeedback({
              type: 'info',
              text: 'Autonomous AI Scout is actively processing applications live...'
            })
          } else {
            setTaskFeedback({
              type: 'info',
              text: data.queue_status?.queue_position > 1
                ? `Queued at position #${data.queue_status.queue_position} in line (worker runs tasks sequentially).`
                : 'Enqueued in cloud task runner. Waiting for worker pickup...'
            })
          }
          pollTaskStatus(uid)
        }
      }
    } catch {
      // silent
    }
  }

  const handleTriggerOnDemandScout = async () => {
    if (!isProfessional) {
      setProModalFeature('On-Demand Application Sweeps (Up to 5x / week)')
      setShowProModal(true)
      return
    }

    if (weeklyQuota && !weeklyQuota.is_unlimited && weeklyQuota.remaining <= 0) {
      setTaskFeedback({
        type: 'error',
        text: 'Weekly on-demand sweep quota reached (5/5). Quota resets on a rolling 7-day basis. Daily automated sweeps continue running automatically.'
      })
      return
    }

    if (isTriggeringScout || (activeTask && (activeTask.status === 'pending' || activeTask.status === 'running'))) {
      return
    }

    setIsTriggeringScout(true)
    setTaskFeedback({
      type: 'info',
      text: 'Dispatching on-demand sweep to Cloud Queue Worker...'
    })

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          headless: true
        })
      })

      const data = await res.json()
      if (res.ok) {
        if (data.quota) setWeeklyQuota(data.quota)
        if (data.queue_position) {
          setQueueStatus(prev => ({
            queue_position: data.queue_position,
            is_global_sweep_active: prev?.is_global_sweep_active || false,
            active_user_id: prev?.active_user_id || null
          }))
        }
        setActiveTask(data.task || {
          task_id: data.task_id,
          status: data.status || 'pending',
          logs: [`[${new Date().toLocaleTimeString()}] 🚀 On-demand sweep enqueued.`]
        })
        setTaskFeedback({
          type: 'info',
          text: data.message || 'On-demand sweep enqueued successfully.'
        })
        pollTaskStatus(userId)
      } else {
        setIsTriggeringScout(false)
        if (data.code === 'UPGRADE_REQUIRED') {
          setProModalFeature('On-Demand Application Sweeps (Up to 5x / week)')
          setShowProModal(true)
        } else {
          setTaskFeedback({
            type: 'error',
            text: data.detail || 'Failed to dispatch on-demand task'
          })
        }
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
          if (data.weekly_quota) setWeeklyQuota(data.weekly_quota)
          if (data.queue_status) setQueueStatus(data.queue_status)
          if (data.task) {
            setActiveTask(data.task)
            if (data.task.status === 'completed') {
              clearInterval(interval)
              setIsTriggeringScout(false)
              setTaskFeedback({ type: 'success', text: data.task.summary || 'On-demand sweep completed! Results updated.' })
              loadUserData(uid)
              loadUserHistory(uid, 1, historySearch, historyFilter)
            } else if (data.task.status === 'failed') {
              clearInterval(interval)
              setIsTriggeringScout(false)
              setTaskFeedback({ type: 'error', text: data.task.summary || 'Task ended. Check logs for details.' })
            } else if (data.task.status === 'pending') {
              if (data.queue_status?.queue_position > 1) {
                setTaskFeedback({
                  type: 'info',
                  text: `Queued at position #${data.queue_status.queue_position} in line (worker runs tasks one by one)`
                })
              }
            } else if (data.task.status === 'running') {
              setTaskFeedback({
                type: 'info',
                text: 'Autonomous AI Scout is actively processing applications live...'
              })
            }
          }
        }
      } catch {
        // ignore
      }

      if (attempts >= 60) {
        clearInterval(interval)
        setIsTriggeringScout(false)
        loadUserData(uid)
        loadUserHistory(uid, 1, historySearch, historyFilter)
      }
    }, 3000)
  }

  const loadUserData = async (uid: string) => {
    try {
      const pRes = await fetch(`/api/profile?user_id=${uid}&t=${Date.now()}`)
      if (pRes.ok) {
        const pData = await pRes.json()
        setUserName(pData.name || '')
        const verifiedPlan = (pData.plan || 'trial').toLowerCase()
        const active = pData.is_plan_active !== false
        const vip = Boolean(pData.is_vip || verifiedPlan === 'vip')
        setIsVip(vip)
        setUserPlan(verifiedPlan)
        setUserPlanName(pData.plan_name || (verifiedPlan === 'trial' ? 'JobFlux 1-Day Free Trial' : `JobFlux ${verifiedPlan.toUpperCase()}`))
        setIsPlanActive(active)
        setPlanExpiresAt(pData.plan_expires_at || pData.trial_expires_at || null)

        // Sync verified plan and VIP status from server to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_plan', verifiedPlan)
          localStorage.setItem('user_is_vip', vip ? 'true' : 'false')
        }
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

  const loadUserTickets = async (uid: string) => {
    if (!uid) return
    setLoadingUserTickets(true)
    try {
      const res = await fetch(`/api/support?user_id=${encodeURIComponent(uid)}&limit=50`)
      if (res.ok) {
        const data = await res.json()
        setUserTickets(data.tickets || [])
      }
    } catch (e) {
      console.error('Failed to load user queries:', e)
    } finally {
      setLoadingUserTickets(false)
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

  const formatTimestamp = (ts: any) => {
    if (!ts) return 'Never'
    try {
      const d = new Date(ts)
      if (isNaN(d.getTime())) return 'Never'
      return d.toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Never'
    }
  }

  const handleExportHistoryCsv = () => {
    if (!isProfessional) {
      setProModalFeature('Export Applications to CSV Spreadsheet')
      setShowProModal(true)
      return
    }

    if (!historyJobs || historyJobs.length === 0) {
      alert('No application records available to export.')
      return
    }

    const headers = ['Job Title', 'Company', 'Dispatched At', 'Location', 'Status', 'Portal URL']
    const rows = historyJobs.map(job => [
      `"${(job.title || '').replace(/"/g, '""')}"`,
      `"${(job.company || '').replace(/"/g, '""')}"`,
      `"${formatJobDate(job)}"`,
      `"${(job.location || 'India').replace(/"/g, '""')}"`,
      `"${(job.status || 'Dispatched').replace(/"/g, '""')}"`,
      `"${(job.url && job.url !== '__locked__' ? job.url : '').replace(/"/g, '""')}"`
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `JobFlux_Applications_${userId || 'Candidate'}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (pageLoading) {
    return (
      <AiLoadingScreen
        title="Synchronizing Autonomous Engine"
        subtitle="Retrieving verified applications, recruiter telemetry & queue status..."
        accountInfo={userEmail || userId}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white relative">
      {/* On-Demand Telemetry Refresh Animation Overlay */}
      {isRefreshing && (
        <AiLoadingScreen
          title="Refreshing Live Telemetry"
          subtitle="Synchronizing application dispatch logs and verified recruiter feeds..."
          accountInfo={userEmail || userId}
          fullscreen={true}
        />
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-zinc-900 px-3.5 sm:px-6 py-2.5 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Brand Logo & Status */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/dashboard" className="flex items-center hover:opacity-90 transition-opacity">
              <JobFluxLogo size="sm" showText={true} />
            </Link>
            <div className="hidden sm:flex items-center gap-2 border-l border-zinc-800 pl-3">
              <span className="text-[11px] font-mono text-zinc-400">Autonomous Radar</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* Right Desktop Actions (Clean, Premium & Uncluttered) */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {/* Refresh Live Telemetry (Minimal Icon Button) */}
            <button
              onClick={() => refreshAllDashboardData(userId)}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh live application telemetry"
              aria-label="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-white' : ''}`} />
            </button>

            {/* Upgrade Plan (Shown only for non-VIP/Free users) */}
            {!isProfessional && !isVip && (
              <Link
                href="/pricing"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-colors shrink-0 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upgrade</span>
              </Link>
            )}

            {/* Candidate Identity & Account Menu Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  isUserMenuOpen
                    ? 'bg-zinc-800 border-zinc-700 text-white shadow-sm'
                    : 'bg-zinc-900 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300 hover:text-white'
                }`}
                title="Account settings and profile"
              >
                <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center font-bold text-white text-[11px] shrink-0 relative">
                  {userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AI'}
                  <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 border border-black" />
                </div>
                <span className="text-xs font-semibold text-white truncate max-w-[130px]">
                  {userName ? userName.split(' ')[0] : 'Account'}
                </span>
                {(isVip || userPlan === 'vip') ? (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 border border-amber-400/80 text-amber-300 font-bold">
                    VIP
                  </span>
                ) : isProfessional ? (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 border border-amber-400/80 text-amber-300 font-bold">
                    PRO
                  </span>
                ) : null}
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Luxury Dropdown Menu */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0c0c0e] border border-zinc-800 shadow-2xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                    {/* Header / Identity Info */}
                    <div className="px-3.5 py-2.5 border-b border-zinc-800/80 space-y-0.5">
                      <div className="font-semibold text-white truncate">{userName || 'Candidate'}</div>
                      <div className="text-[11px] text-zinc-400 font-mono truncate">{userEmail}</div>
                      <div className="pt-1 flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-zinc-500">Plan:</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">
                          {isVip ? 'VIP Lifetime Pass' : userPlan || 'Standard'}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">Profile & Credentials</div>
                          <div className="text-[10px] text-zinc-500">Naukri login, resume & filters</div>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-emerald-400 border border-zinc-700">1-Time</span>
                      </Link>

                      <Link
                        href="/resume-builder"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">AI ATS Resume Studio</div>
                          <div className="text-[10px] text-zinc-500">FAANG Harvard ATS generator</div>
                        </div>
                        <span className="text-[9px] font-mono px-1 rounded bg-amber-950 border border-amber-800/60 text-amber-400 font-semibold">PRO</span>
                      </Link>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          setIsHelpOpen(true)
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors text-left cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>Help & Support Center</span>
                      </button>

                      {userRole === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                        >
                          <Shield className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>Admin Console</span>
                        </Link>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-zinc-800/80 my-1" />

                    {/* Sign Out */}
                    <div className="px-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 shrink-0" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Mobile Actions: Clean, Smart & Uncluttered */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            <Link
              href="/pricing"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-black shrink-0 shadow-sm"
            >
              <Sparkles className="w-3 h-3" />
              <span>Upgrade</span>
            </Link>

            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all text-white cursor-pointer"
              aria-label="Toggle profile menu"
            >
              <span className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center font-bold text-[10px] text-white">
                {userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AI'}
              </span>
              {(isVip || userPlan === 'vip') ? (
                <span className="inline-flex items-center gap-0.5 text-[8px] font-mono font-bold text-amber-300 bg-amber-500/20 border border-amber-400/80 px-1.5 py-0.2 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                  <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400/40" /> VIP
                </span>
              ) : isPlanActive && userPlan !== 'none' && userPlan !== 'no_plan' ? (
                <span className="inline-flex items-center gap-0.5 text-[8px] font-mono font-bold text-amber-300 bg-amber-500/20 border border-amber-400/80 px-1.5 py-0.2 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                  <Sparkles className="w-2 h-2 text-amber-400" /> {userPlan === 'elite' ? 'PRO' : userPlan === 'trial' ? 'TRIAL' : userPlan.toUpperCase()}
                </span>
              ) : null}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isMobileNavOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Floating Mobile Popover Sheet with Backdrop (Zero Header Layout Shifts) */}
      {isMobileNavOpen && (
        <div className="md:hidden">
          {/* Dark Translucent Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-150"
            onClick={() => setIsMobileNavOpen(false)}
          />

          {/* Floating Action Sheet */}
          <div className="fixed top-14 right-3 left-3 max-w-sm ml-auto z-50 p-4 bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800/90 rounded-2xl shadow-2xl shadow-black/80 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
            {/* Candidate Identity Card (Clickable to open profile) */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
              <Link
                href="/profile"
                onClick={() => setIsMobileNavOpen(false)}
                className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity cursor-pointer"
                title="Click to manage Candidate Profile & Resume"
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-white text-xs shrink-0 relative">
                  {userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AI'}
                  <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 border-2 border-black" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-white truncate max-w-[140px]">{userName || 'Candidate'}</span>

                    {/* VIP Badge in Radiant Gold Color */}
                    {(isVip || userPlan === 'vip') && (
                      <span
                        className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border border-amber-400/80 bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 text-amber-300 font-mono font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.3)] shrink-0"
                        title="VIP Lifetime Access Pass Active"
                      >
                        <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400/40 shrink-0" />
                        <span>VIP</span>
                      </span>
                    )}

                    {/* Subscription Badge in Gold Color */}
                    {userPlan !== 'vip' && (
                      <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-semibold shrink-0 transition-all ${
                        isPlanActive && (userPlan === 'starter' || userPlan === 'pro' || userPlan === 'elite' || userPlan === 'professional' || userPlan === 'enterprise')
                          ? 'border border-amber-400/80 bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 text-amber-300 font-bold tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                          : userPlan === 'trial' && isPlanActive
                          ? 'border border-amber-500/60 bg-amber-950/60 text-amber-300 font-medium shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                          : userPlan === 'none' || userPlan === 'no_plan'
                          ? 'bg-zinc-900 border border-zinc-800 text-zinc-500'
                          : !isPlanActive
                          ? 'bg-red-950/80 border-red-700/60 text-red-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                      }`}>
                        {isPlanActive && userPlan !== 'none' && userPlan !== 'no_plan' && (
                          <Sparkles className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                        )}
                        <span>
                          {userPlan === 'none' || userPlan === 'no_plan'
                            ? 'NO PLAN'
                            : !isPlanActive
                            ? 'EXPIRED'
                            : userPlan === 'trial'
                            ? 'Free Trial'
                            : userPlan === 'elite'
                            ? 'PROFESSIONAL'
                            : userPlan.toUpperCase()}
                        </span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 font-mono truncate mt-0.5">{userEmail}</p>
                </div>
              </Link>
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Actions List */}
            <div className="space-y-1 text-xs">
              <Link
                href="/profile"
                onClick={() => setIsMobileNavOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                <User className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>Candidate Profile & Credentials</span>
                <span className="text-[10px] text-emerald-400 font-mono ml-auto">1-Time</span>
              </Link>

              <button
                onClick={() => {
                  setIsMobileNavOpen(false)
                  refreshAllDashboardData(userId)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer text-left"
              >
                <RefreshCw className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>Refresh Live Telemetry</span>
              </button>

              <Link
                href="/resume-builder"
                onClick={() => setIsMobileNavOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>AI ATS Resume Studio</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 ml-auto font-semibold">
                  HARVARD
                </span>
              </Link>

              <button
                onClick={() => { setIsHelpOpen(true); setIsMobileNavOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer text-left"
              >
                <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>Help & Support Center</span>
              </button>

              <Link
                href="/pricing"
                onClick={() => setIsMobileNavOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>Compare Pricing & Plans</span>
              </Link>

              {userRole === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                >
                  <Shield className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Admin Control Center</span>
                </Link>
              )}

              <button
                onClick={() => { setIsMobileNavOpen(false); handleLogout() }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors cursor-pointer text-left pt-2.5 border-t border-zinc-800/80"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out of Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
        
        {/* Launch Special Banner for Free Trial or Expired Users */}
        {(!isProfessional && (userPlan !== 'pro' || !isPlanActive)) && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-zinc-950 via-[#09090b] to-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-zinc-300">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">
                    {userPlan === 'none' || userPlan === 'no_plan'
                      ? 'No Active Subscription · Choose a Plan to Start Auto-Apply'
                      : !isPlanActive
                      ? 'Subscription Expired · Renew to Resume Automated Applications'
                      : metrics.total_applied >= 15
                      ? 'Free Trial Quota Reached (15/15)'
                      : `Free Trial Active · ${metrics.total_applied}/15 Dispatched`}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${
                    userPlan === 'none' || userPlan === 'no_plan'
                      ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      : !isPlanActive
                      ? 'bg-red-950/80 border-red-700/60 text-red-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}>
                    {userPlan === 'none' || userPlan === 'no_plan' ? 'NO PLAN' : !isPlanActive ? 'EXPIRED' : metrics.total_applied >= 15 ? 'EXHAUSTED' : '1-DAY TRIAL'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                  Unlock <strong className="text-white">1,800+ applications</strong>, dual morning scans & recruiter fast-path on Professional.
                </p>
              </div>
            </div>
            <Link
              href="/pricing?plan=elite"
              className="w-full sm:w-auto px-3.5 py-1.5 sm:py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>{userPlan === 'none' || userPlan === 'no_plan' ? 'Choose Plan' : !isPlanActive ? 'Renew Plan' : 'Upgrade Plan'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Unified Mission Control Card (Cockpit + Live Metrics + Telemetry Strip) */}
        <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden card-featured-glow relative">
          {/* Subtle top accent */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-600/40 to-transparent pointer-events-none" />

          {/* Section 1: Cockpit Header */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-950/50">
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <Cpu className="w-5 h-5 text-zinc-300" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-semibold text-white tracking-tight">
                    Autonomous Engine Cockpit
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-emerald-400 font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Daemon Active
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>Schedule: <strong className="text-zinc-300">Daily Autonomous Sweeps</strong></span>
                  <span className="text-zinc-600 hidden sm:inline">•</span>
                  <span className="text-emerald-400 font-medium">Applies Daily</span>
                  <span className="text-zinc-600 hidden sm:inline">•</span>
                  <span>Autonomous Radar: <strong className="text-zinc-200 font-mono">Active</strong></span>
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <div className="px-3 py-2 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs flex items-center justify-center gap-2 font-mono shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-zinc-300">Radar</span>
                <span className="text-zinc-600">•</span>
                <span className="text-emerald-400 font-semibold">Daily Sweeps Active</span>
              </div>

              <button
                type="button"
                onClick={handleTriggerOnDemandScout}
                disabled={isTriggeringScout || (activeTask && (activeTask.status === 'pending' || activeTask.status === 'running')) || (isProfessional && weeklyQuota && !weeklyQuota.is_unlimited && weeklyQuota.remaining <= 0)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer bg-white hover:bg-zinc-200 text-black disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0"
                title={!isProfessional ? "Upgrade to Professional to run on-demand sweeps" : (weeklyQuota && !weeklyQuota.is_unlimited && weeklyQuota.remaining <= 0) ? "Weekly on-demand sweep quota reached (5/5). Resets in rolling 7 days." : "Trigger instant real-time job application sweep"}
              >
                {activeTask?.status === 'running' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                    <span>Running Sweep...</span>
                  </>
                ) : activeTask?.status === 'pending' ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-zinc-700" />
                    <span>Queued {queueStatus?.queue_position && queueStatus.queue_position > 1 ? `(#${queueStatus.queue_position})` : ''}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>On-Demand Sweep</span>
                    {isProfessional ? (
                      weeklyQuota?.is_unlimited ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold">VIP</span>
                      ) : (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-800 font-bold">
                          {weeklyQuota ? `${weeklyQuota.remaining}/5` : '5/5'}
                        </span>
                      )
                    ) : (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-950/80 border border-blue-700/50 text-blue-300 font-semibold">
                        PRO
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Active Radar Telemetry Animation (Visible during Scouting — PRO only) */}
          {isTriggeringScout && isProfessional && (
            <div className="p-4 bg-zinc-950/95 border-t border-b border-sky-500/40 relative overflow-hidden space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                    <div className="absolute inset-0 rounded-full border border-sky-500/30 animate-radar-pulse" />
                    <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8 drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]">
                      <polygon points="42,5 17,21 28,24" fill="#38bdf8" />
                      <polygon points="42,5 28,24 31,34" fill="#0284c7" />
                      <line x1="42" y1="5" x2="28" y2="24" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />
                      <circle cx="42" cy="5" r="2" fill="#ffffff" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">
                        {activeTask?.status === 'pending'
                          ? (queueStatus && queueStatus.queue_position > 1
                              ? `Task Queued · Position #${queueStatus.queue_position} in line`
                              : 'Task Enqueued · Awaiting Cloud Worker')
                          : 'Autonomous Sweep Active'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        activeTask?.status === 'pending'
                          ? 'bg-amber-950/80 border border-amber-700/60 text-amber-300'
                          : 'bg-sky-950/80 border border-sky-700/60 text-sky-300 animate-pulse'
                      }`}>
                        {activeTask?.status === 'pending' ? 'FIFO QUEUE' : 'SWEEP ACTIVE'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {activeTask?.status === 'pending'
                        ? 'Worker daemon processes candidate tasks sequentially one by one to safeguard candidate accounts.'
                        : 'Targeting recruiter feeds, auto-formulating screening Q&As, and submitting verified applications...'}
                    </p>
                  </div>
                </div>
                <div className="w-full sm:w-44 h-2 bg-zinc-900 rounded-full border border-zinc-800 overflow-hidden relative shrink-0">
                  <div className="w-20 h-full bg-gradient-to-r from-sky-600 via-cyan-400 to-sky-600 rounded-full animate-laser-sweep" />
                </div>
              </div>
            </div>
          )}

          {/* Feedback Toast */}
          {taskFeedback && isProfessional && (
            <div className={`p-3 text-xs flex items-center justify-between border-t border-b ${
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

          {/* Section 2: Integrated 4 Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-zinc-800/80 border-t border-zinc-800/80 bg-black/30">
            <div className="p-3.5 sm:p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="text-[11px] flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-zinc-500" /> Today</span>
                <span className="text-[10px] font-mono text-zinc-500">24h</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">{metrics.today}</div>
              <p className="text-[10px] text-zinc-500">Delivered today</p>
            </div>

            <div className="p-3.5 sm:p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="text-[11px] flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-zinc-500" /> This Week</span>
                <span className="text-[10px] font-mono text-zinc-500">7d</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">{metrics.this_week}</div>
              <p className="text-[10px] text-zinc-500">7-day outreach</p>
            </div>

            <div className="p-3.5 sm:p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="text-[11px] flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-zinc-500" /> This Month</span>
                <span className="text-[10px] font-mono text-zinc-500">30d</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">{metrics.this_month}</div>
              <p className="text-[10px] text-zinc-500">Monthly volume</p>
            </div>

            <div className="p-3.5 sm:p-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="text-[11px] flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-zinc-500" /> Total Verified</span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">100%</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">{metrics.total_applied}</div>
              <p className="text-[10px] text-zinc-500">All-time submissions</p>
            </div>
          </div>

          {/* Section 3: Clean Telemetry Protocol Strip */}
          <div className="px-4 py-2.5 bg-black border-t border-zinc-800/80 flex items-center justify-between flex-wrap gap-2 text-[11px] text-zinc-400">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>Pacing: <strong className="text-zinc-300">Human (4s-8s)</strong></span>
              </span>
              <span className="text-zinc-800 hidden sm:inline">|</span>
              <button
                onClick={() => { if (!isProfessional) { setProModalFeature('Neural LLM Screening Tailor'); setShowProModal(true) } }}
                className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>Screening: <strong className="text-zinc-300">Contextual AI</strong></span>
                {!isProfessional && <span className="text-[9px] font-mono text-blue-400 ml-0.5">🔒 PRO</span>}
              </button>
              <span className="text-zinc-800 hidden sm:inline">|</span>
              <button
                onClick={() => { if (!isProfessional) { setProModalFeature('Zero-Queue Recruiter Fast-Path'); setShowProModal(true) } }}
                className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>Delivery: <strong className="text-zinc-300">Recruiter ATS</strong></span>
                {!isProfessional && <span className="text-[9px] font-mono text-blue-400 ml-0.5">🔒 PRO</span>}
              </button>
            </div>

            <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
              Dual Automated Morning Sync
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-zinc-950/90 border border-zinc-800/80 rounded-xl overflow-x-auto scrollbar-none flex-nowrap">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 shrink-0" />
            <span>Applications ({historyTotalCount || historyJobs.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('queries')
              loadUserTickets(userId)
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'queries'
                ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span>Inquiries</span>
            {userTickets.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300 font-mono">
                {userTickets.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('resume_builder')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'resume_builder'
                ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>AI ATS Resume</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold">
              PRO
            </span>
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

              {/* Actions & Export */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                {/* Time Pill Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
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

                <button
                  onClick={handleExportHistoryCsv}
                  disabled={historyJobs.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium transition-colors cursor-pointer shrink-0"
                  title={isProfessional ? "Export application records to CSV spreadsheet" : "Upgrade to Professional to export applications to CSV"}
                >
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline">Export CSV</span>
                  {!isProfessional && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-950/80 border border-blue-700/50 text-blue-300 font-semibold">
                      PRO
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* New User Onboarding Checklist (Shown when 0 applications dispatched) */}
            {historyTotalCount === 0 && !historySearch && !loadingHistory && (
              <div className="p-5 rounded-xl bg-gradient-to-r from-zinc-950 via-[#0a0a0d] to-zinc-950 border border-zinc-800/90 space-y-4 shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
                      <Target className="w-4 h-4 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-white">
                        Autonomous Agent Setup · 3 Steps to Go Live
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        Complete your calibration so the autonomous engine can submit verified applications during daily sweeps.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                    CALIBRATION
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Step 1 */}
                  <div className="p-3.5 rounded-lg bg-[#09090b] border border-zinc-800/90 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">Step 1</span>
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-zinc-200">ATS Resume & Profile</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Upload your PDF or construct an ATS-optimized resume using our Google XYZ AI builder.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('resume_builder')}
                      className="w-full py-1.5 px-2.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-zinc-400" />
                      <span>AI Resume Builder</span>
                    </button>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3.5 rounded-lg bg-[#09090b] border border-zinc-800/90 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">Step 2</span>
                        <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Shield Active
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-zinc-200">Preferences & Blacklist</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Configure target job keywords, salary brackets, and exclude current employers.
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      className="w-full py-1.5 px-2.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <User className="w-3 h-3 text-zinc-400" />
                      <span>Configure Filters & Credentials</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold">(One-Time)</span>
                    </Link>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3.5 rounded-lg bg-[#09090b] border border-zinc-800/90 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">Step 3</span>
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Scheduled
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-zinc-200">Autonomous Execution</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Daily autonomous sweeps run automatically. Dispatched applications will log below.
                      </p>
                    </div>
                    <div className="w-full flex flex-col gap-2">
                      <div className="w-full py-1.5 px-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-xs font-mono flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-zinc-400" /> Schedule</span>
                        <span className="text-emerald-400 font-semibold text-[11px]">Daily Sweeps</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleTriggerOnDemandScout}
                        disabled={isTriggeringScout || (activeTask && (activeTask.status === 'pending' || activeTask.status === 'running')) || (isProfessional && weeklyQuota && !weeklyQuota.is_unlimited && weeklyQuota.remaining <= 0)}
                        className="w-full py-1.5 px-2.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>Run On-Demand Sweep</span>
                        {isProfessional ? (
                          weeklyQuota && !weeklyQuota.is_unlimited ? (
                            <span className="text-[10px] font-mono text-zinc-400">({weeklyQuota.remaining}/5)</span>
                          ) : null
                        ) : (
                          <span className="text-[9px] font-mono px-1 rounded bg-blue-950/80 border border-blue-700/50 text-blue-300">PRO</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Applications Table (Desktop) & Cards (Mobile) */}
            <div className="rounded-xl bg-[#09090b] border border-zinc-800 overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
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
                        <td colSpan={4} className="py-16 text-center">
                          <div className="max-w-md mx-auto space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                              <Cpu className="w-6 h-6 text-sky-400" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-xs font-semibold text-white">
                                {historySearch ? 'No Matching Applications Found' : 'Autonomous Engine Calibrated & Standing By'}
                              </h4>
                              <p className="text-[11px] text-zinc-400 leading-relaxed">
                                {historySearch
                                  ? `No previous job applications match "${historySearch}". Try adjusting your search query.`
                                  : `Your agent is active and calibrated for daily autonomous sweeps. All matched employer submissions and answered screening questions will populate here in real-time.`}
                              </p>
                            </div>
                          </div>
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
                            {isProfessional && job.url && job.url !== '__locked__' && job.url.startsWith('http') ? (
                              <a
                                href={job.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-white transition-colors inline-flex items-center gap-1.5 group"
                                title="Open job listing on portal"
                              >
                                <span className="group-hover:underline">{job.title || 'Job Opening'}</span>
                                <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-white" />
                              </a>
                            ) : (job.is_url_locked || job.url === '__locked__' || (!isProfessional && job.url)) ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setProModalFeature('Job Redirect URL Access')
                                  setShowProModal(true)
                                }}
                                className="inline-flex items-center gap-1.5 text-left group cursor-pointer"
                                title="Upgrade to Professional to open direct portal job listing"
                              >
                                <span className="text-zinc-300 group-hover:text-white transition-colors">{job.title || 'Job Opening'}</span>
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-950/80 border border-blue-700/50 text-blue-300 group-hover:bg-blue-900/60 transition-colors">
                                  <Lock className="w-2.5 h-2.5" />
                                  PRO
                                </span>
                              </button>
                            ) : (
                              <span>{job.title || 'Job Opening'}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                            {formatJobDate(job)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                              <CheckCircle2 className="w-3 h-3" /> APPLIED
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-zinc-800/60">
                {loadingHistory ? (
                  <div className="py-12 text-center text-zinc-500 text-xs">
                    <RefreshCw className="w-4 h-4 mx-auto animate-spin mb-2 text-zinc-400" />
                    Loading applications...
                  </div>
                ) : historyJobs.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <Cpu className="w-5 h-5 text-sky-400 mx-auto" />
                    <h4 className="text-xs font-semibold text-white">
                      {historySearch ? 'No Results Found' : 'Engine Standing By'}
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      {historySearch
                        ? `No previous job applications match "${historySearch}".`
                        : 'Autonomous sweeps apply daily. Verified applications will appear here.'}
                    </p>
                  </div>
                ) : (
                  historyJobs.map((job, idx) => (
                    <div
                      key={job.id || idx}
                      onClick={() => setSelectedJobAudit(job)}
                      className="p-3.5 hover:bg-zinc-900/40 active:bg-zinc-900/70 transition-colors cursor-pointer space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-white truncate">
                              {job.company || 'Direct Employer'}
                            </h4>
                            <p className="text-[11px] text-zinc-400 truncate">
                              {job.title || 'Job Opening'}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5" /> APPLIED
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1">
                        <span>{formatJobDate(job)}</span>
                        <span className="text-sky-400 flex items-center gap-0.5 font-medium">
                          Audit Receipt &rarr;
                        </span>
                      </div>
                    </div>
                  ))
                )}
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

        {/* TAB 2 (FALLBACK): CANDIDATE PROFILE & CREDENTIALS */}
        {activeTab === 'profile' && (
          <div className="p-8 rounded-2xl bg-[#09090b] border border-zinc-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-emerald-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Candidate Profile & Credentials</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                Candidate Profile, Resume, and Naukri Credentials are now managed on the dedicated Profile Settings page.
              </p>
            </div>
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors"
            >
              <span>Open Profile Settings Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* TAB 4: AI NEURAL ATS RESUME BUILDER (EXCLUSIVE TO PROFESSIONAL) */}
        {activeTab === 'resume_builder' && (
          <AiResumeBuilder
            userId={userId}
            userEmail={userEmail}
            userName={userName}
            isProfessional={isProfessional}
            onUpgradeClick={(feat) => {
              setProModalFeature(feat || 'AI ATS Resume Builder & Cloud Bot Sync')
              setShowProModal(true)
            }}
          />
        )}

        {/* TAB 3: CANDIDATE REQUESTS & SUPPORT INQUIRIES */}
        {activeTab === 'queries' && (
          <div className="space-y-4">
            {/* Header / Summary Card */}
            <div className="p-4 rounded-xl bg-[#09090b] border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-teal-400 shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">My Support Requests & Inquiries</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Direct communications with JobFlux Administrator (<span className="text-teal-300 font-mono">technohmsit@gmail.com</span>).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadUserTickets(userId)}
                  className="px-3 py-1.5 rounded-lg bg-black hover:bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Refresh my requests"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingUserTickets ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setIsHelpOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Submit New Query</span>
                </button>
              </div>
            </div>

            {/* Queries List */}
            {loadingUserTickets ? (
              <div className="p-12 rounded-xl bg-[#09090b] border border-zinc-800 text-center text-zinc-400">
                <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-teal-400" />
                <span>Loading your inquiries...</span>
              </div>
            ) : userTickets.length === 0 ? (
              <div className="p-12 rounded-xl bg-[#09090b] border border-zinc-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-500">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">No Inquiries Submitted</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                    Have questions about your daily auto-runs, need profile optimization, or experiencing issues? Submit a request and our administrator will assist you directly.
                  </p>
                </div>
                <button
                  onClick={() => setIsHelpOpen(true)}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all cursor-pointer"
                >
                  Submit a Query
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {userTickets.map((t) => (
                  <div
                    key={t.ticket_id || t.id}
                    className="p-4 rounded-xl bg-[#09090b] border border-zinc-800 space-y-3 transition-colors hover:border-zinc-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-white">
                          #{t.ticket_id}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider ${
                          t.priority === 'urgent'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : t.priority === 'high'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}>
                          {t.priority || 'normal'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-black border border-zinc-800 text-zinc-400">
                          {t.category?.replace('_', ' ') || 'General'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          t.status === 'resolved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : t.status === 'in_progress'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : t.status === 'closed'
                            ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {t.status === 'resolved' && <CheckCircle2 className="w-3 h-3" />}
                          {t.status === 'in_progress' && <RefreshCw className="w-3 h-3 animate-spin" />}
                          {t.status?.replace('_', ' ') || 'Open'}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {formatTimestamp(t.created_at)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-white mb-1">{t.subject}</h4>
                      <p className="text-xs text-zinc-300 leading-relaxed bg-black/60 p-3 rounded-lg border border-zinc-800/80">
                        {t.message}
                      </p>
                    </div>

                    {/* Admin Response Box */}
                    {t.admin_response ? (
                      <div className="p-3 rounded-lg bg-teal-950/20 border border-teal-800/40 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-teal-300 flex items-center gap-1.5">
                            <Shield className="w-3 h-3 text-teal-400" />
                            Administrator Response (technohmsit@gmail.com)
                          </span>
                          {t.resolved_at && (
                            <span className="text-[10px] font-mono text-teal-400">
                              {formatTimestamp(t.resolved_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed">
                          {t.admin_response}
                        </p>
                      </div>
                    ) : (
                      <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>Awaiting Administrator review. Updates will appear here and in your inbox.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Application Audit Receipt Modal */}
        {selectedJobAudit && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedJobAudit(null)}
          >
            <div
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#09090b] border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5"
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
                {isProfessional && selectedJobAudit.url && selectedJobAudit.url !== '__locked__' && selectedJobAudit.url.startsWith('http') && (
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
                {(selectedJobAudit.is_url_locked || selectedJobAudit.url === '__locked__' || (!isProfessional && selectedJobAudit.url)) && (
                  <button
                    onClick={() => {
                      setProModalFeature('Job Redirect URL Access')
                      setShowProModal(true)
                    }}
                    className="flex-1 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-blue-500/40 hover:border-blue-500/70 text-blue-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>View Portal Opening</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-700/50 text-blue-300">PRO</span>
                  </button>
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



      {/* Professional Tier Perks & Upgrade Modal */}
      <ProfessionalUpgradeModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        featureTitle={proModalFeature}
      />

      {/* Universal JobFlux Help & Support Center */}
      <JobFluxHelpModal
        isOpen={isHelpOpen}
        onOpen={() => setIsHelpOpen(true)}
        onClose={() => setIsHelpOpen(false)}
        showFloatingTrigger={true}
        initialEmail={userEmail}
        initialName={userName}
        initialUserId={userId}
        onTicketSubmitted={() => loadUserTickets(userId)}
      />
    </div>
  )
}
