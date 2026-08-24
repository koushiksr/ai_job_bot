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
  MapPin
} from 'lucide-react'
import Link from 'next/link'
import CandidateProfileEditor from '@/components/CandidateProfileEditor'

export default function UserDashboard() {
  const [userId, setUserId] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('user')

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
  }, [])

  const loadUserData = async (uid: string) => {
    try {
      const pRes = await fetch(`/api/profile?user_id=${uid}`)
      if (pRes.ok) {
        const pData = await pRes.json()
        setUserName(pData.name || '')
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

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0c1017]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 font-bold text-white text-base">
              {userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AI'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white">
                  {userName || 'Candidate Dashboard'}
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold uppercase">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {userEmail}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {userRole === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 transition-all"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" /> Admin Portal
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-800 transition-all text-slate-300"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Next Scheduled Run & Status Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900/60 border border-blue-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-blue-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider block">
                Next Automated Application Run
              </span>
              <span className="text-sm font-bold text-white font-mono">
                {countdownText}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1.5 rounded-xl font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Automated Server Engine Ready
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
                  placeholder="Search company, job role, location..."
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
                      <th className="py-3.5 px-4">Location</th>
                      <th className="py-3.5 px-4">Date Applied</th>
                      <th className="py-3.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loadingHistory ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-blue-400" />
                          Loading applications from MongoDB Atlas...
                        </td>
                      </tr>
                    ) : historyJobs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500">
                          No applied jobs found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      historyJobs.map((job, idx) => (
                        <tr key={job.id || idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 px-4 font-bold text-white flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[11px] text-blue-400 font-bold shrink-0">
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
                                className="hover:text-blue-400 font-medium inline-flex items-center gap-1.5 group"
                              >
                                {job.title || 'Job Opening'}
                                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400 transition-colors" />
                              </a>
                            ) : (
                              <span className="font-medium">{job.title || 'Job Opening'}</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {job.location || 'India'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-400 font-mono">
                            {job.date || 'Recently'}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> APPLIED
                            </span>
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
      </main>
    </div>
  )
}
