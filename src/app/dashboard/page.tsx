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
  ChevronDown
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

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'history' | 'profile' | 'queries' | 'resume_builder'>('history')

  // Candidate Queries & Support Inquiries State
  const [userTickets, setUserTickets] = useState<any[]>([])
  const [loadingUserTickets, setLoadingUserTickets] = useState<boolean>(false)

  // Help Modal State
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false)

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

  // AI Application Audit Modal
  const [selectedJobAudit, setSelectedJobAudit] = useState<any | null>(null)

  // Professional Tier Feature Gating & Perks Modal
  const [showProModal, setShowProModal] = useState<boolean>(false)
  const [proModalFeature, setProModalFeature] = useState<string>('On-Demand Turbo Scout')

  // Candidate account has Professional privileges ONLY if on an active, verified Professional tier.
  // Admin accounts manage system configurations via the Admin Portal (/admin).
  const isProfessional = (userPlan === 'elite' || userPlan === 'professional' || userPlan === 'enterprise') && isPlanActive

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

    if (!storedUid) {
      window.location.href = '/'
      return
    }

    setUserId(storedUid)
    setUserEmail(storedEmail || '')
    setUserRole(storedRole || 'user')

    refreshAllDashboardData(storedUid, true)
  }, [])

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
        if (data.task && (data.task.status === 'pending' || data.task.status === 'running')) {
          setActiveTask(data.task)
          // Only show the executing radar UI for Professional users.
          // Non-pro users should not see the scout execution animation.
          if (isProfessional) {
            setIsTriggeringScout(true)
            setTaskFeedback({
              type: 'info',
              text: 'Autonomous AI Scout is actively processing tasks...'
            })
            pollTaskStatus(uid)
          }
        }
      }
    } catch {
      // silent
    }
  }

  const handleTriggerOnDemandScout = async () => {
    if (!isProfessional) {
      setProModalFeature('Instant On-Demand Turbo Scout')
      setShowProModal(true)
      return
    }

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
        const verifiedPlan = (pData.plan || 'trial').toLowerCase()
        const active = pData.is_plan_active !== false
        setUserPlan(verifiedPlan)
        setUserPlanName(pData.plan_name || (verifiedPlan === 'trial' ? 'JobFlux 1-Day Free Trial' : `JobFlux ${verifiedPlan.toUpperCase()}`))
        setIsPlanActive(active)
        setPlanExpiresAt(pData.plan_expires_at || pData.trial_expires_at || null)

        // Sync verified plan from server to localStorage, replacing any manipulated state
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_plan', verifiedPlan)
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
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-zinc-900 px-3.5 sm:px-6 py-2.5 sm:py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Left: Brand Logo & Desktop Candidate Identity */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link href="/" className="flex items-center hover:opacity-90 transition-opacity shrink-0">
              <JobFluxLogo size="sm" showText={true} />
            </Link>

            {/* Desktop Only: Divider + Candidate Details */}
            <div className="hidden md:flex items-center gap-3 border-l border-zinc-800 pl-3.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-semibold text-white text-xs shrink-0">
                {userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AI'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xs font-semibold text-white truncate max-w-[140px]">
                    {userName || 'Candidate'}
                  </h1>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono uppercase ${
                    isProfessional
                      ? 'bg-violet-950/80 border-violet-700/60 text-violet-300'
                      : userPlan === 'pro' && isPlanActive
                      ? 'bg-blue-950/80 border-blue-700/60 text-blue-300'
                      : !isPlanActive
                      ? 'bg-red-950/80 border-red-700/60 text-red-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                  }`}>
                    {!isPlanActive ? 'EXPIRED' : userPlan === 'trial' ? 'Free Trial' : userPlan.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono truncate max-w-[180px]">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Right Desktop Actions (Clean & Spaced Out) */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => refreshAllDashboardData(userId)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-violet-400 ${isRefreshing ? 'animate-spin' : ''}`} /> 
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setIsHelpOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-violet-400" /> 
              <span>Help & Support</span>
            </button>

            <Link
              href="/pricing"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-colors shrink-0 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" /> 
              <span>Upgrade Plan</span>
            </Link>

            {userRole === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-zinc-400" /> <span>Admin</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors text-zinc-400 hover:text-white cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> <span>Sign Out</span>
            </button>
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
            {/* Candidate Identity Card */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-white text-xs shrink-0">
                  {userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AI'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white truncate max-w-[140px]">{userName || 'Candidate'}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono uppercase ${
                      isProfessional
                        ? 'bg-violet-950/80 border-violet-700/60 text-violet-300'
                        : userPlan === 'pro' && isPlanActive
                        ? 'bg-blue-950/80 border-blue-700/60 text-blue-300'
                        : !isPlanActive
                        ? 'bg-red-950/80 border-red-700/60 text-red-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                    }`}>
                      {!isPlanActive ? 'EXPIRED' : userPlan === 'trial' ? 'Free Trial' : userPlan.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-mono truncate mt-0.5">{userEmail}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Actions List */}
            <div className="space-y-1 text-xs">
              <button
                onClick={() => {
                  setIsMobileNavOpen(false)
                  refreshAllDashboardData(userId)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer text-left"
              >
                <RefreshCw className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Refresh Live Telemetry</span>
              </button>

              <button
                onClick={() => { setIsHelpOpen(true); setIsMobileNavOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer text-left"
              >
                <Mail className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Help & Support Center</span>
              </button>

              <Link
                href="/pricing"
                onClick={() => setIsMobileNavOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Compare Pricing & Plans</span>
              </Link>

              {userRole === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                >
                  <Shield className="w-4 h-4 text-violet-400 shrink-0" />
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
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">
                    {!isPlanActive
                      ? 'Subscription Expired · Renew to Resume Automated Applications'
                      : metrics.total_applied >= 15
                      ? 'Free Trial Quota Reached (15/15)'
                      : `Free Trial Active · ${metrics.total_applied}/15 Dispatched`}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${
                    !isPlanActive
                      ? 'bg-red-950/80 border-red-700/60 text-red-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}>
                    {!isPlanActive ? 'EXPIRED' : metrics.total_applied >= 15 ? 'EXHAUSTED' : '1-DAY TRIAL'}
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
              <span>{!isPlanActive ? 'Renew Plan' : 'Upgrade Plan'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Unified Mission Control Card (Cockpit + Live Metrics + Telemetry Strip) */}
        <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden card-featured-glow relative">
          {/* Subtle top laser scan accent */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-violet-400/80 to-transparent animate-laser-sweep pointer-events-none" />

          {/* Section 1: Cockpit Header & Trigger */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-950/50">
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <Cpu className="w-5 h-5 text-violet-400" />
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
                  {isProfessional ? (
                    <>
                      <span>Schedule: <strong className="text-zinc-300">Dual Precision · 06:00 &amp; 08:00 AM IST</strong></span>
                      <span className="text-zinc-600 hidden sm:inline">•</span>
                      <span className="text-violet-300 font-medium">+ Unlimited On-Demand</span>
                      <span className="text-zinc-600 hidden sm:inline">•</span>
                      <span>Next: <strong className="text-zinc-200 font-mono">{countdownText}</strong></span>
                    </>
                  ) : (
                    <>
                      <span>Schedule: <strong className="text-zinc-300">Daily Morning Scan</strong></span>
                      <span className="text-zinc-600 hidden sm:inline">•</span>
                      <span>Next Run: <strong className="text-zinc-200 font-mono">{countdownText}</strong></span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto">
              {isProfessional ? (
                <button
                  onClick={handleTriggerOnDemandScout}
                  disabled={isTriggeringScout}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer shadow-sm"
                >
                  {isTriggeringScout ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-900" />
                      <span>Scouting Openings...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-zinc-900" />
                      <span>Trigger On-Demand Run</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setProModalFeature('Instant On-Demand Turbo Scout')
                    setShowProModal(true)
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-violet-500/40 text-violet-200 text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.1)] group"
                >
                  <Lock className="w-3.5 h-3.5 text-violet-400 group-hover:scale-110 transition-transform" />
                  <span>Trigger On-Demand Run</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-violet-900/80 border border-violet-600/50 text-white font-semibold">
                    PRO
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Active Radar Telemetry Animation (Visible during Scouting — PRO only) */}
          {isTriggeringScout && isProfessional && (
            <div className="p-4 bg-zinc-950/95 border-t border-b border-violet-500/40 relative overflow-hidden space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                    <div className="absolute inset-0 rounded-full border border-violet-500/30 animate-radar-pulse" />
                    <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8 drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]">
                      <polygon points="42,5 17,21 28,24" fill="#c084fc" />
                      <polygon points="42,5 28,24 31,34" fill="#7c3aed" />
                      <line x1="42" y1="5" x2="28" y2="24" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />
                      <circle cx="42" cy="5" r="2" fill="#ffffff" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">Autonomous Scout Executing</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-violet-950/80 border border-violet-700/60 text-violet-300 animate-pulse">
                        RADAR SWEEP ACTIVE
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Targeting recruiter feeds, auto-formulating screening Q&As, and submitting verified applications...
                    </p>
                  </div>
                </div>
                <div className="w-full sm:w-44 h-2 bg-zinc-900 rounded-full border border-zinc-800 overflow-hidden relative shrink-0">
                  <div className="w-20 h-full bg-gradient-to-r from-violet-600 via-purple-400 to-violet-600 rounded-full animate-laser-sweep" />
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
                {!isProfessional && <span className="text-[9px] font-mono text-violet-400 ml-0.5">🔒 PRO</span>}
              </button>
              <span className="text-zinc-800 hidden sm:inline">|</span>
              <button
                onClick={() => { if (!isProfessional) { setProModalFeature('Zero-Queue Recruiter Fast-Path'); setShowProModal(true) } }}
                className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>Delivery: <strong className="text-zinc-300">Recruiter ATS</strong></span>
                {!isProfessional && <span className="text-[9px] font-mono text-violet-400 ml-0.5">🔒 PRO</span>}
              </button>
            </div>

            <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
              Dual Automated Morning Sync
            </span>
          </div>
        </div>

        {/* Tab Navigation with Mobile Horizontal Swipe */}
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
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>Profile & Resume</span>
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
            <MessageSquare className="w-3.5 h-3.5 text-violet-400 shrink-0" />
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
            <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span>AI ATS Resume</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-violet-950/80 border border-violet-700/50 text-violet-300 font-semibold">
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

            {/* New User Onboarding Checklist (Shown when 0 applications dispatched) */}
            {historyTotalCount === 0 && !historySearch && !loadingHistory && (
              <div className="p-5 rounded-xl bg-gradient-to-r from-zinc-950 via-[#0a0a0d] to-zinc-950 border border-zinc-800/90 space-y-4 shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
                      <Target className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-white">
                        Autonomous Agent Setup · 3 Steps to Go Live
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        Complete your calibration so the autonomous engine can submit verified applications at 06:00 AM IST.
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
                      <Sparkles className="w-3 h-3 text-violet-400" />
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
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="w-full py-1.5 px-2.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <User className="w-3 h-3 text-zinc-400" />
                      <span>Configure Filters</span>
                    </button>
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
                        Daily autonomous sweeps run at 06:00 AM IST. Dispatched applications will log below.
                      </p>
                    </div>
                    {isProfessional ? (
                      <button
                        onClick={handleTriggerOnDemandScout}
                        disabled={isTriggeringScout}
                        className="w-full py-1.5 px-2.5 rounded bg-white hover:bg-zinc-200 text-black text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Run On-Demand Now</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setProModalFeature('Instant On-Demand Turbo Trigger')
                          setShowProModal(true)
                        }}
                        className="w-full py-1.5 px-2.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-violet-500/40 text-violet-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Trigger Scout (PRO)</span>
                      </button>
                    )}
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
                              <Cpu className="w-6 h-6 text-violet-400" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-xs font-semibold text-white">
                                {historySearch ? 'No Matching Applications Found' : 'Autonomous Engine Calibrated & Standing By'}
                              </h4>
                              <p className="text-[11px] text-zinc-400 leading-relaxed">
                                {historySearch
                                  ? `No previous job applications match "${historySearch}". Try adjusting your search query.`
                                  : `Your agent is active and scheduled for the automated morning sweep at 06:00 AM IST. All matched employer submissions and answered screening questions will populate here in real-time.`}
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
                            {job.url && isProfessional ? (
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
                            ) : job.url && !isProfessional ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="text-zinc-400">{job.title || 'Job Opening'}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setProModalFeature('Job Redirect URL Access')
                                    setShowProModal(true)
                                  }}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-violet-950/80 border border-violet-700/50 text-violet-300 hover:bg-violet-900/60 transition-colors cursor-pointer"
                                  title="Upgrade to Professional to open job listing"
                                >
                                  <Lock className="w-2.5 h-2.5" />
                                  PRO
                                </button>
                              </span>
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

              {/* Mobile Card List View (md:hidden) */}
              <div className="md:hidden divide-y divide-zinc-800/60">
                {loadingHistory ? (
                  <div className="py-10 text-center text-zinc-500 text-xs">
                    <RefreshCw className="w-4 h-4 mx-auto animate-spin mb-2 text-zinc-400" />
                    Loading applications...
                  </div>
                ) : historyJobs.length === 0 ? (
                  <div className="py-12 px-4 text-center space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                      <Cpu className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-white">
                        {historySearch ? 'No Applications Match Search' : 'Autonomous Engine Standing By'}
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        {historySearch
                          ? `No previous job applications match "${historySearch}".`
                          : 'Morning sweeps run at 06:00 AM IST. Verified applications will appear here.'}
                      </p>
                    </div>
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
                        <span className="text-violet-400 flex items-center gap-0.5 font-medium">
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

        {/* TAB 2: CANDIDATE PROFILE & RESUME */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* AI Resume Builder Teaser Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-violet-950/40 via-zinc-950 to-violet-950/30 border border-violet-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-950/80 border border-violet-800/60 flex items-center justify-center text-violet-300 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">Need an ATS-Optimized Resume for High-Paying Senior Roles?</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-violet-900/80 border border-violet-600/50 text-white font-semibold">
                      PRO ONLY
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Let JobFlux AI construct a 99%+ ATS pass rate resume with quantified Google XYZ metrics, tailored for ₹25L - ₹75L+ CTC brackets.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('resume_builder')}
                className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Launch AI Resume Builder</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Neural ATS Recruiter Readiness Diagnostic Widget */}
            <NeuralAtsDiagnosticCard
              isProfessional={isProfessional}
              skillsCount={8}
              resumeUploaded={true}
              onUnlockClick={(feat) => {
                setProModalFeature(feat || 'Professional Suite')
                setShowProModal(true)
              }}
            />

            <CandidateProfileEditor
              userId={userId}
              isAdmin={false}
              onSaveSuccess={() => loadUserData(userId)}
            />
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
                <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-violet-400 shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">My Support Requests & Inquiries</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Direct communications with JobFlux Administrator (<span className="text-violet-300 font-mono">technohmsit@gmail.com</span>).
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
                <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-violet-400" />
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
                      <div className="p-3 rounded-lg bg-violet-950/20 border border-violet-800/40 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-violet-300 flex items-center gap-1.5">
                            <Shield className="w-3 h-3 text-violet-400" />
                            Administrator Response (technohmsit@gmail.com)
                          </span>
                          {t.resolved_at && (
                            <span className="text-[10px] font-mono text-violet-400">
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
                {selectedJobAudit.url && isProfessional && (
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
                {selectedJobAudit.url && !isProfessional && (
                  <button
                    onClick={() => {
                      setProModalFeature('Job Redirect URL Access')
                      setShowProModal(true)
                    }}
                    className="flex-1 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-violet-500/40 hover:border-violet-500/70 text-violet-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>View Portal Opening</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-950/80 border border-violet-700/50 text-violet-300">PRO</span>
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
