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
  Briefcase
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import CandidateProfileEditor from '@/components/CandidateProfileEditor'

export default function AdminDashboard() {
  const [usersList, setUsersList] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true)
  const [userSearch, setUserSearch] = useState<string>('')

  // Overview metrics
  const [overviewMetrics, setOverviewMetrics] = useState({
    total_profiles: 0,
    scheduled_profiles_active: 0,
    applied_today: 0,
    applied_this_week: 0,
    applied_this_month: 0,
    total_applied: 0
  })

  // Admin Active Tab
  const [activeAdminTab, setActiveAdminTab] = useState<'candidates' | 'logs'>('candidates')

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<any | null>(null)

  // System Logs & Reports State
  const [selectedSystemLog, setSelectedSystemLog] = useState<string | null>(null)
  const [selectedLogContent, setSelectedLogContent] = useState<string[]>([])
  const [loadingLogContent, setLoadingLogContent] = useState<boolean>(false)

  const fetchOverviewAndUsers = async () => {
    setLoadingUsers(true)
    try {
      const uRes = await fetch('/api/admin/users')
      if (uRes.ok) {
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
          applied_today: today,
          applied_this_week: week,
          applied_this_month: month,
          total_applied: total
        })
      }
    } catch (e) {
      console.error('Failed to fetch admin users:', e)
    } finally {
      setLoadingUsers(false)
    }
  }

  // Initial Load
  useEffect(() => {
    fetchOverviewAndUsers()
  }, [])

  const handleToggleDaily = async (userId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    setUsersList(prev =>
      prev.map(u => (u.user_id === userId ? { ...u, enabled_for_daily_run: newStatus } : u))
    )
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, enabled_for_daily_run: newStatus })
      })
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
          const lines = data.jobs.map((j: any) => `[${j.date}] ✅ Applied to: ${j.title} at ${j.company} (${j.location || 'India'})`)
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
        method: 'DELETE'
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

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Admin Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0c1017]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-bold text-white text-base">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white">
                  Multi-Candidate Administration
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-semibold uppercase">
                  Central Hub
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                MongoDB Atlas Cloud Synchronized
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOverviewAndUsers}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all text-slate-300"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-800 transition-all text-slate-300"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* 4 Large Clean Overview Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0c1017] border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Total Candidates
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                {overviewMetrics.scheduled_profiles_active} Active
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {overviewMetrics.total_profiles}
            </div>
            <p className="text-xs text-slate-400 mt-1">Configured candidate profiles</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0c1017] border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Today Applied
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                Last 24h
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {overviewMetrics.applied_today}
            </div>
            <p className="text-xs text-slate-400 mt-1">Total applications submitted today</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0c1017] border border-blue-500/20 shadow-lg shadow-blue-500/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> This Week
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
                Last 7 Days
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {overviewMetrics.applied_this_week}
            </div>
            <p className="text-xs text-slate-400 mt-1">Total applications this week</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0c1017] border border-amber-500/20 shadow-lg shadow-amber-500/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Total Applied
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                All-Time
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {overviewMetrics.total_applied}
            </div>
            <p className="text-xs text-slate-400 mt-1">Total lifetime applications across all candidates</p>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveAdminTab('candidates')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeAdminTab === 'candidates'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-900 border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Candidate Profiles ({filteredUsers.length})
          </button>
          <button
            onClick={() => setActiveAdminTab('logs')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeAdminTab === 'logs'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-900 border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" /> Application Activity Logs
          </button>
        </div>

        {/* TAB 1: CANDIDATES LIST */}
        {activeAdminTab === 'candidates' && (
          <div className="space-y-4">
            {/* Search Header */}
            <div className="p-4 rounded-2xl bg-[#0c1017] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
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
            <div className="rounded-2xl bg-[#0c1017] border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Candidate</th>
                      <th className="py-3.5 px-4">Naukri Email</th>
                      <th className="py-3.5 px-4 text-center">Auto-Apply</th>
                      <th className="py-3.5 px-4 text-center">Today</th>
                      <th className="py-3.5 px-4 text-center">Total Applied</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
                          Loading candidate profiles...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
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

        {/* TAB 2: SYSTEM LOGS & ACTIVITY */}
        {activeAdminTab === 'logs' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-[#0c1017] border border-slate-800 p-4 space-y-2 h-[600px] overflow-y-auto">
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
