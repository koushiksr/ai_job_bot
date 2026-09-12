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
  const [activeAdminTab, setActiveAdminTab] = useState<'candidates' | 'payments' | 'enterprise_leads' | 'logs'>('candidates')

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

  // Initial Auth & Access Verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUid = localStorage.getItem('user_id')
      const storedRole = localStorage.getItem('user_role')

      // 1. Check if logged in
      if (!storedUid) {
        window.location.replace('/?error=' + encodeURIComponent('Please sign in with administrator credentials.'))
        return
      }

      // 2. Check client-side admin role flag
      if (storedRole !== 'admin') {
        window.location.replace('/dashboard?notice=' + encodeURIComponent('Access denied: Administrator privileges required.'))
        return
      }

      // 3. Verify server-side against MongoDB
      fetchOverviewAndUsers()
      fetchPayments()
      fetchEnterpriseLeads()
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
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-zinc-400 font-mono text-xs gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-zinc-300" />
        <span>Verifying administrator privileges...</span>
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
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-medium text-white text-sm">
              <Shield className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-white">
                  Multi-Candidate Administration
                </h1>
                <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono uppercase">
                  Central Hub
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono">
                MongoDB Atlas Cloud Synchronized
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOverviewAndUsers}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors text-zinc-300"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors text-zinc-400 hover:text-white"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
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
            onClick={() => setActiveAdminTab('logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
              activeAdminTab === 'logs'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            <History className="w-3.5 h-3.5" /> System Logs & Activity
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
                      <th className="py-3.5 px-4 text-center">Today</th>
                      <th className="py-3.5 px-4 text-center">Total Applied</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
                          Loading candidate profiles...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
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
                          <td className="py-4 px-4 text-center font-bold text-white font-mono">
                            {u.applied_today || 0}
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-indigo-400 font-mono">
                            {u.total_applied || 0}
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

        {/* TAB 2: PAYMENTS & SUBSCRIPTIONS */}
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

        {/* TAB 3: SYSTEM LOGS & ACTIVITY */}
        {activeAdminTab === 'logs' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-[#09090b] border border-zinc-800 p-4 space-y-2 h-[600px] overflow-y-auto">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">
                Select Candidate Activity
              </h3>
              {usersList.map((u: any) => (
                <button
                  key={u.user_id}
                  onClick={() => loadSystemLogContent(u.user_id)}
                  className={`w-full text-left p-3 rounded-xl text-xs font-mono transition-all flex items-center justify-between ${
                    selectedSystemLog === u.user_id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800/80'
                  }`}
                >
                  <span className="truncate">{u.name || u.user_id}</span>
                  <span className="text-[10px] opacity-75">{u.total_applied || 0} applied</span>
                </button>
              ))}
            </div>

            <div className="md:col-span-2 rounded-2xl bg-[#050811] border border-slate-800 overflow-hidden flex flex-col h-[600px]">
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400">
                  {selectedSystemLog ? `Activity for ${selectedSystemLog}` : 'Select a candidate on the left'}
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
    </div>
  )
}
