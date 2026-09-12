'use client'

import React, { useEffect, useState } from 'react'
import {
  Shield,
  Users,
  Database,
  LogOut,
  Edit,
  ExternalLink,
  X,
  History,
  Clock,
  Calendar,
  TrendingUp,
  Sparkles,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  FileText,
  User,
  Briefcase,
  CreditCard,
  Star,
  Crown,
  Building2,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import CandidateProfileEditor from '@/components/CandidateProfileEditor'
import JobFluxHelpModal from '@/components/JobFluxHelpModal'
import JobFluxLogo from '@/components/JobFluxLogo'

export default function AdminDashboard() {
  const [usersList, setUsersList] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true)
  const [userSearch, setUserSearch] = useState<string>('')

  // Payments State
  const [paymentsList, setPaymentsList] = useState<any[]>([])
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false)

  // Overview metrics
  const [overviewMetrics, setOverviewMetrics] = useState({
    total_profiles: 0,
    scheduled_profiles_active: 0,
    vip_profiles_count: 0,
    applied_today: 0,
    applied_this_week: 0,
    applied_this_month: 0,
    total_applied: 0
  })

  // Admin Active Tab
  const [activeAdminTab, setActiveAdminTab] = useState<'candidates' | 'requests' | 'payments' | 'enterprise_leads' | 'logs'>('candidates')

  // Activity Audit & Telemetry State
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [loadingActivity, setLoadingActivity] = useState<boolean>(false)
  const [activityFilter, setActivityFilter] = useState<string>('all')
  const [activityStats, setActivityStats] = useState<any>({
    total_logins: 0,
    total_profile_updates: 0,
    total_resume_uploads: 0,
    total_task_runs: 0,
    total_logged_events: 0
  })

  // User Requests & Support Tickets State
  const [supportTickets, setSupportTickets] = useState<any[]>([])
  const [loadingTickets, setLoadingTickets] = useState<boolean>(false)
  const [ticketStats, setTicketStats] = useState<{ total: number; open: number; in_progress: number; resolved: number; closed: number }>({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0
  })
  const [requestSearch, setRequestSearch] = useState<string>('')
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('all')
  const [ticketNotes, setTicketNotes] = useState<{ [id: string]: string }>({})
  const [savingTicketId, setSavingTicketId] = useState<string | null>(null)
  const [logsSubTab, setLogsSubTab] = useState<'activity' | 'job_history' | 'tickets'>('activity')
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false)

  // Enterprise Leads State
  const [enterpriseLeads, setEnterpriseLeads] = useState<any[]>([])
  const [loadingLeads, setLoadingLeads] = useState<boolean>(false)

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<any | null>(null)

  // System Logs & Reports State
  const [selectedSystemLog, setSelectedSystemLog] = useState<string | null>(null)
  const [selectedLogContent, setSelectedLogContent] = useState<string[]>([])
  const [loadingLogContent, setLoadingLogContent] = useState<boolean>(false)
  const [authChecking, setAuthChecking] = useState<boolean>(true)
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false)

  const getAdminHeaders = () => {
    const uid = typeof window !== 'undefined' ? localStorage.getItem('user_id') || '' : ''
    return {
      'Content-Type': 'application/json',
      'x-user-id': uid
    }
  }

  const fetchOverviewAndUsers = async () => {
    setLoadingUsers(true)
    try {
      const uRes = await fetch('/api/admin/users', {
        headers: getAdminHeaders()
      })
      if (!uRes.ok) {
        if (uRes.status === 403) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_role', 'user')
            window.location.replace('/dashboard?notice=' + encodeURIComponent('Access denied: Administrator privileges required.'))
          }
          return
        }
        throw new Error('Failed to fetch admin users')
      }
      const uData = await uRes.json()
      const users = uData.users || []
      setUsersList(users)

      let total = 0
      let today = 0
      let week = 0
      let month = 0

      users.forEach((u: any) => {
        total += u.total_applied || 0
        today += u.applied_today || 0
        week += u.applied_this_week || 0
        month += u.applied_this_month || 0
      })

      setOverviewMetrics({
        total_profiles: users.length,
        scheduled_profiles_active: users.filter((u: any) => u.enabled_for_daily_run !== false).length,
        vip_profiles_count: users.filter((u: any) => u.is_vip).length,
        applied_today: today,
        applied_this_week: week,
        applied_this_month: month,
        total_applied: total
      })
      setIsAuthorized(true)
    } catch (e) {
      console.error('Failed to fetch admin users:', e)
    } finally {
      setLoadingUsers(false)
      setAuthChecking(false)
    }
  }

  const fetchPayments = async () => {
    setLoadingPayments(true)
    try {
      const res = await fetch('/api/admin/payments', {
        headers: getAdminHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setPaymentsList(data.payments || [])
      }
    } catch (e) {
      console.error('Failed to fetch payments:', e)
    } finally {
      setLoadingPayments(false)
    }
  }

  const fetchEnterpriseLeads = async () => {
    setLoadingLeads(true)
    try {
      const res = await fetch('/api/enterprise/inquiry', {
        headers: getAdminHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setEnterpriseLeads(data.inquiries || [])
      }
    } catch (e) {
      console.error('Failed to fetch enterprise leads:', e)
    } finally {
      setLoadingLeads(false)
    }
  }

  const handleUpdateLeadStatus = async (inquiryId: string, newStatus: string) => {
    setEnterpriseLeads(prev =>
      prev.map(l => (l.inquiry_id === inquiryId ? { ...l, status: newStatus } : l))
    )
    try {
      await fetch('/api/enterprise/inquiry', {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify({ inquiry_id: inquiryId, status: newStatus })
      })
    } catch {
      fetchEnterpriseLeads()
    }
  }

  const fetchActivityLogs = async (type = activityFilter) => {
    setLoadingActivity(true)
    try {
      const q = type && type !== 'all' ? `?event_type=${encodeURIComponent(type)}&limit=100` : '?limit=100'
      const res = await fetch(`/api/admin/activity${q}`, {
        headers: getAdminHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setActivityLogs(data.logs || [])
        if (data.stats) setActivityStats(data.stats)
      }
    } catch (e) {
      console.error('Failed to fetch activity logs:', e)
    } finally {
      setLoadingActivity(false)
    }
  }

  const fetchSupportTickets = async (status?: any, search?: any) => {
    setLoadingTickets(true)
    const effectiveStatus = typeof status === 'string' ? status : requestStatusFilter
    const effectiveSearch = typeof search === 'string' ? search : requestSearch
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (effectiveStatus && effectiveStatus !== 'all') params.set('status', effectiveStatus)
      if (effectiveSearch && effectiveSearch.trim()) params.set('search', effectiveSearch.trim())

      const res = await fetch(`/api/support?${params.toString()}`, {
        headers: getAdminHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setSupportTickets(data.tickets || [])
        if (data.stats) setTicketStats(data.stats)
      }
    } catch (e) {
      console.error('Failed to fetch support tickets:', e)
    } finally {
      setLoadingTickets(false)
    }
  }

  const handleUpdateTicket = async (ticketId: string, status: string, adminResponse?: string) => {
    setSavingTicketId(ticketId)
    try {
      const res = await fetch('/api/support', {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          ticket_id: ticketId,
          status,
          admin_response: adminResponse !== undefined ? adminResponse : ticketNotes[ticketId]
        })
      })
      if (res.ok) {
        fetchSupportTickets()
      }
    } catch (e) {
      console.error('Failed to update ticket:', e)
    } finally {
      setSavingTicketId(null)
    }
  }

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm(`Delete query #${ticketId}?`)) return
    try {
      await fetch(`/api/support?ticket_id=${encodeURIComponent(ticketId)}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      })
      fetchSupportTickets()
    } catch (e) {
      console.error('Failed to delete ticket:', e)
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

  // Initial Auth & Access Verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Ingest Google OAuth parameters if redirected from Google Single Sign-On
      const p = new URLSearchParams(window.location.search)
      if (p.get('auth') === 'google' && p.get('user_id')) {
        const gUid = p.get('user_id')!
        const gEmail = p.get('email') || ''
        const gRole = p.get('role') || 'admin'
        const gPlan = p.get('plan') || 'enterprise'
        localStorage.setItem('user_id', gUid)
        localStorage.setItem('user_email', gEmail)
        localStorage.setItem('user_role', gRole)
        localStorage.setItem('user_plan', gPlan)
        window.history.replaceState({}, document.title, '/admin')
      }

      const storedUid = localStorage.getItem('user_id')
      const storedRole = localStorage.getItem('user_role')
      const storedEmail = (localStorage.getItem('user_email') || '').toLowerCase()

      // 2. Check if logged in
      if (!storedUid) {
        window.location.replace('/?error=' + encodeURIComponent('Please sign in with administrator credentials.'))
        return
      }

      // 3. Check client-side admin role flag
      const isAdmin = (
        storedRole === 'admin' ||
        storedUid === 'technohmsit' ||
        storedUid === 'admin' ||
        storedEmail === 'technohmsit@gmail.com'
      )

      if (!isAdmin) {
        window.location.replace('/dashboard?notice=' + encodeURIComponent('Access denied: Administrator privileges required.'))
        return
      }

      // Ensure user_role is set to 'admin' in localStorage
      localStorage.setItem('user_role', 'admin')

      // 4. Verify server-side against MongoDB
      fetchOverviewAndUsers()
      fetchPayments()
      fetchEnterpriseLeads()
      fetchSupportTickets()
    }
  }, [])

  const handleToggleDaily = async (userId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    setUsersList(prev =>
      prev.map(u => (u.user_id === userId ? { ...u, enabled_for_daily_run: newStatus } : u))
    )
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ user_id: userId, enabled_for_daily_run: newStatus })
      })
    } catch {
      fetchOverviewAndUsers()
    }
  }

  const handleToggleVip = async (userId: string, currentVip: boolean) => {
    const newVip = !currentVip
    setUsersList(prev =>
      prev.map(u => (u.user_id === userId ? { ...u, is_vip: newVip } : u))
    )
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify({ user_id: userId, is_vip: newVip })
      })
      fetchOverviewAndUsers()
    } catch {
      fetchOverviewAndUsers()
    }
  }

  const loadSystemLogContent = async (filename: string) => {
    setSelectedSystemLog(filename)
    setLoadingLogContent(true)
    try {
      const res = await fetch(`/api/history?user_id=${filename}&limit=30`)
      if (res.ok) {
        const data = await res.json()
        if (data.jobs && Array.isArray(data.jobs)) {
          const lines = data.jobs.map((j: any) => `[${j.date}] ✅ Applied to: ${j.title} at ${j.company}`)
          setSelectedLogContent(lines.length ? lines : ['No application history found for this candidate yet.'])
        }
      }
    } catch {} finally {
      setLoadingLogContent(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(`Are you sure you want to delete profile: ${userId}?`)) return
    try {
      await fetch(`/api/profile?user_id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      })
      fetchOverviewAndUsers()
    } catch (e) {
      console.error('Error deleting profile:', e)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/'
  }

  const filteredUsers = usersList.filter(u =>
    (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.user_id || '').toLowerCase().includes(userSearch.toLowerCase())
  )

  if (authChecking) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-zinc-400 font-mono text-xs gap-4 relative overflow-hidden select-none">
        <div className="absolute w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl border border-violet-500/30 animate-radar-pulse absolute inset-0 -m-1" />
          <JobFluxLogo size="lg" showText={false} />
        </div>
        <div className="flex flex-col items-center gap-2 z-10">
          <span className="text-zinc-200 font-medium tracking-tight text-sm">Verifying Administrator Privileges</span>
          <div className="w-36 h-[2px] bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden relative">
            <div className="w-20 h-full bg-gradient-to-r from-transparent via-violet-400 to-transparent animate-laser-sweep" />
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">technohmsit@gmail.com</span>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      {/* Admin Top Navbar */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-zinc-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <JobFluxLogo size="sm" showText={true} />
            </Link>

            <div className="h-5 w-px bg-zinc-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-violet-300 font-mono uppercase font-semibold">
                Super Admin Hub
              </span>
              <span className="text-[11px] text-zinc-500 font-mono hidden md:inline">
                MongoDB Atlas Synchronized
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsHelpOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors text-zinc-300 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-violet-400" /> Help Desk
            </button>
            <button
              onClick={fetchOverviewAndUsers}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors text-zinc-300 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors text-zinc-400 hover:text-white cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Real-time Cluster Radar Telemetry Bar */}
        <div className="px-4 py-2.5 rounded-xl bg-[#09090b] border border-zinc-800/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs relative overflow-hidden card-featured-glow">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-violet-400/80 to-transparent animate-laser-sweep pointer-events-none" />
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-zinc-200 font-medium">Cluster Active & Synchronized</span>
            <span className="text-zinc-600 hidden sm:inline">·</span>
            <span className="text-zinc-400 font-mono text-[11px] hidden sm:inline">Scheduled Runs: Daily 06:00 & 08:00 AM IST</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
            <span>Primary Admin: <strong className="text-violet-300">technohmsit@gmail.com</strong></span>
            <span className="text-zinc-700">|</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live
            </span>
          </div>
        </div>
        {/* 5 Clean Overview Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-400" /> Candidates
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {overviewMetrics.scheduled_profiles_active} Active
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-white font-mono">
              {overviewMetrics.total_profiles}
            </div>
            <p className="text-[11px] text-zinc-500">Configured profiles</p>
          </div>

          <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-zinc-400" /> VIP Privilege
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                Free Pass
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-white font-mono">
              {overviewMetrics.vip_profiles_count}
            </div>
            <p className="text-[11px] text-zinc-500">Lifetime bypass</p>
          </div>

          <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" /> Today Applied
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                24h
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-white font-mono">
              {overviewMetrics.applied_today}
            </div>
            <p className="text-[11px] text-zinc-500">Submitted today</p>
          </div>

          <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" /> This Week
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                7d
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-white font-mono">
              {overviewMetrics.applied_this_week}
            </div>
            <p className="text-[11px] text-zinc-500">Submitted this week</p>
          </div>

          <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-400" /> Total Applied
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                All-Time
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-white font-mono">
              {overviewMetrics.total_applied}
            </div>
            <p className="text-[11px] text-zinc-500">Lifetime verified</p>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 flex-wrap">
          <button
            onClick={() => setActiveAdminTab('candidates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
              activeAdminTab === 'candidates'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Candidate Profiles ({filteredUsers.length})
          </button>
          <button
            onClick={() => {
              setActiveAdminTab('requests')
              fetchSupportTickets()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
              activeAdminTab === 'requests'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
            <span>User Requests & Queries</span>
            {ticketStats.open > 0 ? (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono font-bold">
                {ticketStats.open} open
              </span>
            ) : (
              <span className="text-[10px] font-mono text-zinc-500">
                ({ticketStats.total})
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveAdminTab('payments')
              fetchPayments()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
              activeAdminTab === 'payments'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Payments ({paymentsList.length})
          </button>
          <button
            onClick={() => {
              setActiveAdminTab('enterprise_leads')
              fetchEnterpriseLeads()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
              activeAdminTab === 'enterprise_leads'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Enterprise Leads ({enterpriseLeads.length})
          </button>
          <button
            onClick={() => {
              setActiveAdminTab('logs')
              fetchActivityLogs()
              fetchSupportTickets()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
              activeAdminTab === 'logs'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Activity Audit & System Logs
          </button>
        </div>

        {/* TAB 1: CANDIDATES LIST */}
        {activeAdminTab === 'candidates' && (
          <div className="space-y-4">
            {/* Search Header */}
            <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by name, email, or candidate ID..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="text-xs text-slate-400 hidden lg:block">
                  Auto-scheduled runs: <span className="text-emerald-400 font-semibold">Daily at 06:00 AM & 08:00 AM IST</span>
                </div>
                <button
                  onClick={() => setEditingUser({ isNew: true, user_id: '' })}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-500/25"
                >
                  <User className="w-4 h-4" /> Create Candidate
                </button>
              </div>
            </div>

            {/* Candidates Table */}
            <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Candidate</th>
                      <th className="py-3.5 px-4">Naukri Email</th>
                      <th className="py-3.5 px-4">Plan & Access</th>
                      <th className="py-3.5 px-4 text-center">Auto-Apply</th>
                      <th className="py-3.5 px-4">Last Login</th>
                      <th className="py-3.5 px-4">Profile & Resume</th>
                      <th className="py-3.5 px-4 text-center">Today / Total</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
                          Loading candidate profiles...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          No candidate profiles match your search query.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u, idx) => (
                        <tr key={u.user_id || idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 px-4 font-bold text-white flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                              {u.name ? u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'C'}
                            </div>
                            <div>
                              <div className="font-bold text-white">{u.name || u.user_id}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{u.user_id}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-300 font-mono">
                            {u.email}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col items-start gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  u.plan === 'elite' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                                  u.plan === 'pro' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' :
                                  u.plan === 'starter' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                                  'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                                }`}>
                                  {u.plan || 'trial'}
                                </span>
                                {u.is_vip && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    VIP PASS
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleToggleVip(u.user_id, !!u.is_vip)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  u.is_vip
                                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30'
                                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/40'
                                }`}
                                title={u.is_vip ? "Click to Revoke VIP Free Pass" : "Click to Grant Lifetime VIP Free Pass"}
                              >
                                <Crown className="w-3 h-3 text-amber-400" />
                                {u.is_vip ? 'Revoke VIP' : 'Grant VIP Pass'}
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => handleToggleDaily(u.user_id, u.enabled_for_daily_run !== false)}
                              className="text-xs transition-colors"
                              title="Toggle automated daily apply"
                            >
                              {u.enabled_for_daily_run !== false ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <ToggleRight className="w-4 h-4 text-emerald-400" /> ENABLED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                  <ToggleLeft className="w-4 h-4 text-slate-500" /> DISABLED
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="text-white font-mono text-[11px] flex items-center gap-1">
                                <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                                <span>{formatTimestamp(u.last_login_at)}</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
                                  {u.login_count || 0} logins
                                </span>
                                {u.last_login_ip && (
                                  <span className="text-[9px] font-mono text-zinc-500 truncate max-w-[80px]" title={u.last_login_ip}>
                                    {u.last_login_ip}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1 text-[11px]">
                              <div className="text-zinc-300 flex items-center gap-1">
                                <FileText className="w-3 h-3 text-violet-400 shrink-0" />
                                <span className="truncate max-w-[120px]" title={u.resume_filename || 'No resume PDF uploaded'}>
                                  {u.resume_filename || 'No PDF'}
                                </span>
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono">
                                {u.last_resume_updated_at ? `PDF: ${formatTimestamp(u.last_resume_updated_at)}` : (u.last_profile_updated_at ? `Profile: ${formatTimestamp(u.last_profile_updated_at)}` : 'Synced')}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="font-mono font-bold text-white text-xs">
                              {u.applied_today || 0} <span className="text-zinc-600 font-normal">/</span> <span className="text-indigo-400">{u.total_applied || 0}</span>
                            </div>
                            <div className="text-[9px] text-zinc-500 uppercase font-mono">Today / Total</div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  localStorage.setItem('user_id', u.user_id)
                                  localStorage.setItem('user_email', u.email)
                                  localStorage.setItem('user_role', 'admin')
                                  window.open('/dashboard', '_blank')
                                }}
                                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                                title="Open Candidate Dashboard"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingUser(u)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit Profile
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.user_id)}
                                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                                title="Delete Candidate"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER REQUESTS & QUERIES */}
        {activeAdminTab === 'requests' && (
          <div className="space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Queries</div>
                  <div className="text-2xl font-extrabold text-white mt-1">{ticketStats.total}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Open / Pending</div>
                  <div className="text-2xl font-extrabold text-rose-400 mt-1">{ticketStats.open}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">In Progress</div>
                  <div className="text-2xl font-extrabold text-amber-400 mt-1">{ticketStats.in_progress}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <RefreshCw className="w-5 h-5" />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Resolved / Closed</div>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-1">{ticketStats.resolved + ticketStats.closed}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Admin Routing Banner */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Central Admin Inquiries Desk</div>
                  <div className="text-[11px] text-zinc-400">
                    Primary Super-Admin Email: <span className="font-mono text-violet-300 font-semibold">technohmsit@gmail.com</span>. Candidate support questions, urgent issues, and profile inquiries arrive here for resolution.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsHelpOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <MessageSquare className="w-3 h-3 text-violet-400" />
                <span>Simulate / Log Query</span>
              </button>
            </div>

            {/* Search, Filter & Refresh Bar */}
            <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search ticket ID, candidate name, email, subject..."
                  value={requestSearch}
                  onChange={e => {
                    setRequestSearch(e.target.value)
                    fetchSupportTickets(requestStatusFilter, e.target.value)
                  }}
                  className="w-full bg-black border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map(status => {
                  const active = requestStatusFilter === status
                  return (
                    <button
                      key={status}
                      onClick={() => {
                        setRequestStatusFilter(status)
                        fetchSupportTickets(status, requestSearch)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                        active
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'bg-black text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  )
                })}
                <button
                  onClick={() => fetchSupportTickets(requestStatusFilter, requestSearch)}
                  className="p-2 rounded-lg bg-black hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors ml-1 cursor-pointer"
                  title="Refresh inquiries"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingTickets ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Inquiries Table */}
            <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-black text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="py-3.5 px-4">Ticket & Priority</th>
                      <th className="py-3.5 px-4">Candidate</th>
                      <th className="py-3.5 px-4">Category & Message</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Admin Response / Note</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {loadingTickets ? (
                      <tr>
                        <td colSpan={6} className="py-14 text-center text-zinc-400">
                          <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-violet-400" />
                          Loading candidate requests & queries...
                        </td>
                      </tr>
                    ) : supportTickets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-14 text-center text-zinc-500">
                          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-zinc-400" />
                          No candidate requests found matching the current filters.
                        </td>
                      </tr>
                    ) : (
                      supportTickets.map((t) => {
                        const noteValue = ticketNotes[t.ticket_id] !== undefined ? ticketNotes[t.ticket_id] : (t.admin_response || '')
                        const isSaving = savingTicketId === t.ticket_id
                        return (
                          <tr key={t.ticket_id || t.id} className="hover:bg-zinc-900/30 transition-colors align-top">
                            {/* Ticket & Priority */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-mono font-semibold text-white text-xs">{t.ticket_id}</div>
                              <div className="mt-1">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider ${
                                  t.priority === 'urgent'
                                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                    : t.priority === 'high'
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                                }`}>
                                  {t.priority || 'normal'}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-zinc-500 mt-1">
                                {formatTimestamp(t.created_at)}
                              </div>
                            </td>

                            {/* Candidate Details */}
                            <td className="py-3.5 px-4 min-w-[180px]">
                              <div className="font-bold text-white text-xs">{t.name || 'Candidate'}</div>
                              {t.user_id && (
                                <div className="text-[10px] font-mono text-zinc-500">ID: {t.user_id}</div>
                              )}
                              <a
                                href={`mailto:${t.email}?subject=Re:%20[${t.ticket_id}]%20${encodeURIComponent(t.subject || 'Support Query')}`}
                                className="text-[11px] text-violet-400 hover:underline inline-flex items-center gap-1 mt-1 font-mono"
                              >
                                <Mail className="w-3 h-3" /> {t.email}
                              </a>
                            </td>

                            {/* Category & Message */}
                            <td className="py-3.5 px-4 max-w-sm">
                              <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-300 mb-1">
                                {t.category?.replace('_', ' ') || 'General'}
                              </span>
                              <div className="font-semibold text-white text-xs">{t.subject}</div>
                              <div className="text-[11px] text-zinc-400 mt-1 leading-relaxed bg-black/60 p-2 rounded-lg border border-zinc-900">
                                {t.message}
                              </div>
                            </td>

                            {/* Status Selector */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <select
                                value={t.status || 'open'}
                                onChange={e => handleUpdateTicket(t.ticket_id, e.target.value)}
                                className={`text-xs rounded-lg px-2.5 py-1.5 font-medium border focus:outline-none cursor-pointer ${
                                  t.status === 'open'
                                    ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
                                    : t.status === 'in_progress'
                                    ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                                    : t.status === 'resolved'
                                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                                    : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                                }`}
                              >
                                <option value="open">Open / Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                              </select>
                              {t.resolved_at && (
                                <div className="text-[9px] font-mono text-emerald-400 mt-1">
                                  Resolved: {formatTimestamp(t.resolved_at)}
                                </div>
                              )}
                            </td>

                            {/* Admin Response / Note */}
                            <td className="py-3.5 px-4 min-w-[240px] max-w-md">
                              <div className="space-y-1.5">
                                <textarea
                                  rows={2}
                                  placeholder="Type resolution reply or note for candidate..."
                                  value={noteValue}
                                  onChange={e => setTicketNotes({ ...ticketNotes, [t.ticket_id]: e.target.value })}
                                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono transition-colors"
                                />
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() => handleUpdateTicket(t.ticket_id, t.status, noteValue)}
                                    disabled={isSaving}
                                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                                    <span>{isSaving ? 'Saving...' : 'Save Response'}</span>
                                  </button>
                                  {t.admin_response && (
                                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                                      Responded
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <a
                                  href={`mailto:${t.email}?subject=Re:%20[${t.ticket_id}]%20${encodeURIComponent(t.subject || 'Support Query')}&body=${encodeURIComponent(
                                    `Hi ${t.name || 'Candidate'},\n\nIn response to your query [${t.ticket_id}]:\n"${t.message}"\n\n${noteValue ? noteValue + '\n\n' : ''}Best regards,\nAdministrator (technohmsit@gmail.com)\nJobFlux AI Bot`
                                  )}`}
                                  className="p-1.5 rounded-lg bg-black hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors inline-flex items-center"
                                  title="Reply via Email"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  onClick={() => handleDeleteTicket(t.ticket_id)}
                                  className="p-1.5 rounded-lg bg-black hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-900/60 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Delete Ticket"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PAYMENTS & SUBSCRIPTIONS */}
        {activeAdminTab === 'payments' && (
          <div className="space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Transactions</div>
                  <div className="text-2xl font-extrabold text-white mt-1">{paymentsList.length}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Paid Subscribers</div>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                    {new Set(paymentsList.map(p => p.user_id || p.email)).size}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">VIP Free Passes</div>
                  <div className="text-2xl font-extrabold text-amber-400 mt-1">{overviewMetrics.vip_profiles_count}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Crown className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Payments Table */}
            <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
              <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-400" />
                    Verified Razorpay Transactions
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time payment verification records and active plan subscriptions.
                  </p>
                </div>
                <button
                  onClick={fetchPayments}
                  disabled={loadingPayments}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingPayments ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Candidate / User</th>
                      <th className="py-3.5 px-4">Plan Purchased</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Razorpay Payment ID</th>
                      <th className="py-3.5 px-4">Order ID</th>
                      <th className="py-3.5 px-4">Verified Date</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loadingPayments ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
                          Loading Razorpay transactions...
                        </td>
                      </tr>
                    ) : paymentsList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          <CreditCard className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                          No Razorpay payments recorded in the database yet.
                          <div className="text-[11px] text-slate-600 mt-1">
                            When users upgrade their plan via Razorpay checkout, their verified orders will appear here automatically.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paymentsList.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">{p.email || p.user_id}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{p.user_id}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              p.plan_id === 'elite' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' :
                              p.plan_id === 'pro' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' :
                              'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            }`}>
                              {p.plan_id || 'Starter'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-400 font-mono text-sm">
                            {p.amount || '₹499'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-cyan-400">
                            {p.payment_id}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                            {p.order_id}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                            {p.verified_at ? new Date(p.verified_at).toLocaleString() : 'N/A'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              SUCCESS
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ENTERPRISE & BULK LEADS */}
        {activeAdminTab === 'enterprise_leads' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Enterprise & Bulk Candidate Licensing Inquiries</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct inbound leads from staffing agencies, college placement cells, and enterprise cohorts.
                </p>
              </div>
              <button
                onClick={fetchEnterpriseLeads}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLeads ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Organization / Company</th>
                      <th className="py-3.5 px-4">Contact Person</th>
                      <th className="py-3.5 px-4">Seats / Volume</th>
                      <th className="py-3.5 px-4">Phone / WhatsApp</th>
                      <th className="py-3.5 px-4">Notes / Requirements</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loadingLeads ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
                          Loading enterprise inquiries...
                        </td>
                      </tr>
                    ) : enterpriseLeads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          No enterprise inquiries received yet. Inbound requests from /pricing will appear here.
                        </td>
                      </tr>
                    ) : (
                      enterpriseLeads.map((lead, idx) => (
                        <tr key={lead.id || idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 px-4 font-bold text-white">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                                <Building2 className="w-3.5 h-3.5" />
                              </div>
                              <span className="truncate max-w-[160px]">{lead.company}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-white">{lead.name}</div>
                            <a
                              href={`mailto:${lead.email}`}
                              className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <Mail className="w-3 h-3" /> {lead.email}
                            </a>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                              {lead.seats}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono text-slate-200">
                            {lead.phone ? (
                              <a
                                href={`tel:${lead.phone}`}
                                className="hover:text-cyan-400 flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3 text-slate-500" />
                                {lead.phone}
                              </a>
                            ) : (
                              <span className="text-slate-500">N/A</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-slate-400 max-w-xs truncate text-[11px]">
                            {lead.notes || 'No custom notes provided.'}
                          </td>
                          <td className="py-4 px-4 text-slate-400 text-[11px] font-mono">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <select
                              value={lead.status || 'new'}
                              onChange={(e) => handleUpdateLeadStatus(lead.inquiry_id, e.target.value)}
                              className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border bg-slate-950 cursor-pointer focus:outline-none ${
                                lead.status === 'contacted'
                                  ? 'border-blue-500/40 text-blue-400'
                                  : lead.status === 'closed'
                                  ? 'border-emerald-500/40 text-emerald-400'
                                  : 'border-amber-500/40 text-amber-400'
                              }`}
                            >
                              <option value="new">NEW LEAD</option>
                              <option value="contacted">CONTACTED</option>
                              <option value="closed">CLOSED / ONBOARDED</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ACTIVITY AUDIT & SYSTEM LOGS */}
        {activeAdminTab === 'logs' && (
          <div className="space-y-4">
            {/* Sub-Tabs Selector */}
            <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setLogsSubTab('activity')
                    fetchActivityLogs()
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    logsSubTab === 'activity'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
                  }`}
                >
                  Live Activity Audit Trail ({activityLogs.length})
                </button>
                <button
                  onClick={() => setLogsSubTab('job_history')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    logsSubTab === 'job_history'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
                  }`}
                >
                  Job Application Records
                </button>
                <button
                  onClick={() => {
                    setLogsSubTab('tickets')
                    fetchSupportTickets()
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    logsSubTab === 'tickets'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
                  }`}
                >
                  Support Inquiries ({supportTickets.length})
                </button>
              </div>

              {logsSubTab === 'activity' && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['all', 'login', 'profile_update', 'resume_upload', 'task_run'].map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setActivityFilter(type)
                        fetchActivityLogs(type)
                      }}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-colors ${
                        activityFilter === type
                          ? 'bg-violet-600 text-white font-bold'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                  <button
                    onClick={() => fetchActivityLogs(activityFilter)}
                    className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors ml-1"
                    title="Refresh Activity Logs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* VIEW 1: LIVE ACTIVITY AUDIT TRAIL */}
            {logsSubTab === 'activity' && (
              <div className="space-y-4">
                {/* 4 Stat Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-500">Total Logins</span>
                    <div className="text-xl font-semibold font-mono text-emerald-400">
                      {activityStats.total_logins || 0}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-500">Profile Updates</span>
                    <div className="text-xl font-semibold font-mono text-purple-400">
                      {activityStats.total_profile_updates || 0}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-500">Resume Uploads</span>
                    <div className="text-xl font-semibold font-mono text-cyan-400">
                      {activityStats.total_resume_uploads || 0}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-500">Scout Tasks</span>
                    <div className="text-xl font-semibold font-mono text-amber-400">
                      {activityStats.total_task_runs || 0}
                    </div>
                  </div>
                </div>

                {/* Activity Feed Table */}
                <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Timestamp</th>
                          <th className="py-3 px-4">Candidate / User</th>
                          <th className="py-3 px-4">Event</th>
                          <th className="py-3 px-4">Activity Description</th>
                          <th className="py-3 px-4">IP & Device</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {loadingActivity ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-400">
                              <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
                              Streaming live activity records...
                            </td>
                          </tr>
                        ) : activityLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-500">
                              No activity logs found for this filter.
                            </td>
                          </tr>
                        ) : (
                          activityLogs.map((log, idx) => (
                            <tr key={log.id || idx} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                                {formatTimestamp(log.created_at)}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-white font-mono text-xs truncate max-w-[140px]">
                                  {log.user_id}
                                </div>
                                {log.email && (
                                  <div className="text-[10px] text-zinc-500 truncate max-w-[140px]">
                                    {log.email}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider ${
                                  log.event_type === 'login' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                                  log.event_type === 'profile_update' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                                  log.event_type === 'resume_upload' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' :
                                  log.event_type === 'task_run' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                                  'bg-zinc-800 text-zinc-300'
                                }`}>
                                  {log.event_type}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-zinc-200">
                                <div className="text-xs">{log.description}</div>
                                {log.metadata?.filename && (
                                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                    File: {log.metadata.filename} ({log.metadata.size_kb || 0} KB)
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-[11px] font-mono text-zinc-400">
                                <div>{log.ip_address || '127.0.0.1'}</div>
                                <div className="text-[9px] text-zinc-600 truncate max-w-[160px]" title={log.user_agent}>
                                  {log.user_agent || 'Unknown device'}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: JOB APPLICATION RECORDS */}
            {logsSubTab === 'job_history' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl bg-[#09090b] border border-zinc-800 p-4 space-y-2 h-[600px] overflow-y-auto">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">
                    Select Candidate
                  </h3>
                  {usersList.map((u: any) => (
                    <button
                      key={u.user_id}
                      onClick={() => loadSystemLogContent(u.user_id)}
                      className={`w-full text-left p-3 rounded-xl text-xs font-mono transition-all flex items-center justify-between ${
                        selectedSystemLog === u.user_id
                          ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                          : 'bg-black hover:bg-zinc-900 text-slate-300 border border-zinc-800'
                      }`}
                    >
                      <span className="truncate">{u.name || u.user_id}</span>
                      <span className="text-[10px] opacity-75">{u.total_applied || 0} applied</span>
                    </button>
                  ))}
                </div>

                <div className="md:col-span-2 rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden flex flex-col h-[600px]">
                  <div className="bg-black px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                    <span className="text-xs font-mono text-white">
                      {selectedSystemLog ? `Application Log for ${selectedSystemLog}` : 'Select a candidate on the left'}
                    </span>
                    {selectedSystemLog && (
                      <button
                        onClick={() => loadSystemLogContent(selectedSystemLog)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
                    {loadingLogContent ? (
                      <div className="h-full flex items-center justify-center text-slate-500">Loading activity...</div>
                    ) : selectedLogContent.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-500">
                        Click a candidate on the left to view their applied job activity.
                      </div>
                    ) : (
                      selectedLogContent.map((line, i) => (
                        <div key={i} className="leading-relaxed whitespace-pre-wrap">
                          {line}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: INBOUND SUPPORT TICKETS */}
            {logsSubTab === 'tickets' && (
              <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-black">
                  <div>
                    <h3 className="text-xs font-semibold text-white">
                      Inbound Support Queue
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Dispatched directly to primary address <span className="text-violet-400 font-mono">technohmsit@gmail.com</span>
                    </p>
                  </div>
                  <button
                    onClick={() => fetchSupportTickets()}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Ticket ID</th>
                        <th className="py-3 px-4">Candidate</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Subject & Message</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Target Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {loadingTickets ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
                            Loading support tickets...
                          </td>
                        </tr>
                      ) : supportTickets.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500">
                            No support inquiries received yet. Inquiries from the Help Modal will appear here.
                          </td>
                        </tr>
                      ) : (
                        supportTickets.map((t, idx) => (
                          <tr key={t.id || idx} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4 font-mono font-semibold text-white">
                              {t.ticket_id}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-white">{t.name}</div>
                              <a
                                href={`mailto:${t.email}?subject=Re:%20${encodeURIComponent(t.subject)}`}
                                className="text-[11px] text-violet-400 hover:underline flex items-center gap-1 mt-0.5"
                              >
                                <Mail className="w-3 h-3" /> {t.email}
                              </a>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-300">
                                {t.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 max-w-sm">
                              <div className="font-semibold text-white text-xs">{t.subject}</div>
                              <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                                {t.message}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[11px] font-mono text-zinc-400 whitespace-nowrap">
                              {formatTimestamp(t.created_at)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-[11px] text-violet-300">
                              technohmsit@gmail.com
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* EDIT MODAL (Unified Reusable CandidateProfileEditor) */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">
                    {editingUser.isNew ? 'Create New Candidate Profile' : `Edit Candidate Profile — ${editingUser.name || editingUser.user_id}`}
                  </h3>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                <CandidateProfileEditor
                  userId={editingUser.user_id}
                  isNew={editingUser.isNew}
                  isAdmin={true}
                  onSaveSuccess={() => {
                    fetchOverviewAndUsers()
                    setEditingUser(null)
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Help & Support Modal */}
      <JobFluxHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        showFloatingTrigger={false}
        onTicketSubmitted={() => fetchSupportTickets()}
      />
    </div>
  )
}
