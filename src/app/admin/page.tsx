'use client'

import React, { useEffect, useState, useRef } from 'react'
import {
  Shield,
  Users,
  Database,
  LogOut,
  PlayCircle,
  Edit,
  ExternalLink,
  Activity,
  Terminal,
  X,
  History,
  Clock,
  Calendar,
  TrendingUp,
  Sparkles,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  FileJson,
  Code,
  FileText,
  RefreshCw,
  Search,
  StopCircle,
  ToggleLeft,
  ToggleRight,
  Wifi,
  WifiOff,
  Upload,
  Download
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

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
  const [editTab, setEditTab] = useState<'form' | 'json'>('form')
  const [editFormData, setEditFormData] = useState<any>({})
  const [editRawJson, setEditRawJson] = useState<string>('{}')
  const [editJsonError, setEditJsonError] = useState<string>('')
  const [savingEdit, setSavingEdit] = useState<boolean>(false)
  const [editSuccess, setEditSuccess] = useState<string>('')
  const [adminUploadingResume, setAdminUploadingResume] = useState<boolean>(false)
  const [adminResumeSuccess, setAdminResumeSuccess] = useState<string>('')

  // System Logs & Reports State
  const [systemLogs, setSystemLogs] = useState<any[]>([])
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
          scheduled_profiles_active: users.length,
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

  // 1. Initial Load — fetch directly from cloud broker
  useEffect(() => {
    fetchOverviewAndUsers()
  }, [])



  const handleOpenEditModal = async (u: any) => {
    setEditingUser(u)
    setEditSuccess('')
    setEditJsonError('')

    try {
      const res = await fetch(`/api/profile?user_id=${u.user_id}`)
      if (res.ok) {
        const data = await res.json()
        setEditFormData({
          name: data.name || '',
          email: data.email || '',
          password: '',
          experience: data.experience || 0,
          current_ctc: data.current_ctc || 0,
          expected_ctc: data.expected_ctc || 0,
          search_url: data.search_url || '',
          resume_file: data.resume_file || ''
        })
        setEditRawJson(data.raw_json || '{}')
      }
    } catch {}
  }

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

  const handleAdminResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingUser) return
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file.')
      return
    }

    setAdminUploadingResume(true)
    setAdminResumeSuccess('')

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64Str = (reader.result as string).split(',')[1]
        let cleanName = file.name.replace(/^candidate\d*[\s_]*/i, '')
        if (!cleanName.endsWith('.pdf')) cleanName += '.pdf'

        const res = await fetch('/api/profile/resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: editingUser.user_id,
            filename: cleanName,
            file_base64: base64Str,
            file_size_bytes: file.size
          })
        })

        if (res.ok) {
          setAdminResumeSuccess(`Resume "${cleanName}" (${Math.round(file.size / 1024)} KB) uploaded & saved to MongoDB Atlas!`)
          setTimeout(() => setAdminResumeSuccess(''), 4500)
          fetchOverviewAndUsers()
        } else {
          const err = await res.json()
          alert(`Upload failed: ${err.detail || 'Server error'}`)
        }
        setAdminUploadingResume(false)
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      alert(`Error uploading file: ${err.message}`)
      setAdminUploadingResume(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return
    setSavingEdit(true)
    setEditSuccess('')
    setEditJsonError('')

    let payload: any = {}
    if (editTab === 'json') {
      try {
        JSON.parse(editRawJson)
        payload = { raw_json: editRawJson }
      } catch (err: any) {
        setEditJsonError(`Invalid JSON: ${err.message}`)
        setSavingEdit(false)
        return
      }
    } else {
      payload = editFormData
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: editingUser.user_id, ...payload })
      })
      if (res.ok) {
        setEditSuccess('Candidate profile saved successfully in cloud database!')
        fetchOverviewAndUsers()
        setTimeout(() => {
          setEditSuccess('')
          setEditingUser(null)
        }, 1200)
      } else {
        const d = await res.json()
        setEditJsonError(`Failed to save: ${d.detail || 'Server error'}`)
      }
    } catch (e: any) {
      setEditJsonError(`Error: ${e.message}`)
    } finally {
      setSavingEdit(false)
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
      alert('Error deleting user')
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
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Admin Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-[1px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-400 bg-clip-text text-transparent">
                  System Admin Controller
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold uppercase tracking-wider">
                  Full Superpowers
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Global Candidate Management, Multi-Bot Scheduler & Real-Time Diagnostics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Cloud Broker Active
            </div>

            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 transition-colors"
            >
              <Users className="w-3.5 h-3.5" /> Candidate View
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-300 border border-slate-700/60 transition-all text-slate-300"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Global Statistics Grid (Today, Week, Month, Total) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Candidates */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800">
            <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-400 uppercase">
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-blue-400" /> Candidates</span>
              <span className="text-[10px] text-emerald-400 font-mono">{overviewMetrics.scheduled_profiles_active} Active</span>
            </div>
            <div className="text-3xl font-extrabold text-white">{overviewMetrics.total_profiles}</div>
            <p className="text-xs text-slate-500 mt-1">Total registered profiles</p>
          </div>

          {/* Today Total */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-emerald-500/20">
            <div className="flex items-center justify-between mb-2 text-xs font-semibold text-emerald-400 uppercase">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Global Today</span>
              <span className="text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-300">24h</span>
            </div>
            <div className="text-3xl font-extrabold text-white">{overviewMetrics.applied_today}</div>
            <p className="text-xs text-slate-500 mt-1">Applied across all candidates</p>
          </div>

          {/* This Week Total */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-blue-500/20">
            <div className="flex items-center justify-between mb-2 text-xs font-semibold text-blue-400 uppercase">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> This Week</span>
              <span className="text-[10px] bg-blue-500/10 px-1.5 py-0.5 rounded text-blue-300">7 Days</span>
            </div>
            <div className="text-3xl font-extrabold text-white">{overviewMetrics.applied_this_week}</div>
            <p className="text-xs text-slate-500 mt-1">Applied this week</p>
          </div>

          {/* This Month Total */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-purple-500/20">
            <div className="flex items-center justify-between mb-2 text-xs font-semibold text-purple-400 uppercase">
              <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> This Month</span>
              <span className="text-[10px] bg-purple-500/10 px-1.5 py-0.5 rounded text-purple-300">30 Days</span>
            </div>
            <div className="text-3xl font-extrabold text-white">{overviewMetrics.applied_this_month}</div>
            <p className="text-xs text-slate-500 mt-1">Applied this month</p>
          </div>

          {/* All-Time Total */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-amber-500/20">
            <div className="flex items-center justify-between mb-2 text-xs font-semibold text-amber-400 uppercase">
              <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> All Time Total</span>
              <span className="text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded text-amber-300">Global</span>
            </div>
            <div className="text-3xl font-extrabold text-white">{overviewMetrics.total_applied}</div>
            <p className="text-xs text-slate-500 mt-1">Lifetime total submissions</p>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveAdminTab('candidates')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeAdminTab === 'candidates'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4" /> Candidate Profiles ({usersList.length})
            </button>
            <button
              onClick={() => setActiveAdminTab('logs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeAdminTab === 'logs'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" /> System & Candidate Logs
            </button>
          </div>

          <button
            onClick={() => fetchOverviewAndUsers()}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
          </button>
        </div>

        {/* TAB 1: CANDIDATES MANAGEMENT */}
        {activeAdminTab === 'candidates' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search candidates by name, email, or ID..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="text-xs text-slate-400">
                Daily Automatic Schedule: <span className="text-slate-200 font-mono">6:00 AM & 8:00 AM</span>
              </div>
            </div>

            {/* Candidates Table */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Candidate</th>
                      <th className="py-3 px-4">Experience & CTC</th>
                      <th className="py-3 px-4 text-center">Today</th>
                      <th className="py-3 px-4 text-center">This Week</th>
                      <th className="py-3 px-4 text-center">This Month</th>
                      <th className="py-3 px-4 text-center">Total</th>
                      <th className="py-3 px-4 text-center">Auto Schedule</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          No candidates found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(u => (
                        <tr key={u.user_id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-bold text-white text-sm">{u.name}</div>
                            <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                          </td>
                          <td className="py-4 px-4 text-slate-300">
                            <div>{u.experience} Yrs Experience</div>
                            <div className="text-slate-500 text-[11px]">Expected: ₹{u.expected_ctc?.toLocaleString()}</div>
                          </td>
                          <td className="py-4 px-4 text-center font-mono font-bold text-emerald-400">
                            {u.applied_today || 0}
                          </td>
                          <td className="py-4 px-4 text-center font-mono font-bold text-blue-400">
                            {u.applied_this_week || 0}
                          </td>
                          <td className="py-4 px-4 text-center font-mono font-bold text-purple-400">
                            {u.applied_this_month || 0}
                          </td>
                          <td className="py-4 px-4 text-center font-mono font-bold text-amber-400">
                            {u.total_applied || 0}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => handleToggleDaily(u.user_id, u.enabled_for_daily_run)}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                                u.enabled_for_daily_run
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-500 border border-slate-700'
                              }`}
                            >
                              {u.enabled_for_daily_run ? 'Active (6 & 8 AM)' : 'Paused'}
                            </button>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditModal(u)}
                                title="Edit Profile, Resume & JSON"
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white transition-all text-xs font-medium"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit Profile
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.user_id)}
                                title="Delete Candidate"
                                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-rose-600 hover:text-white transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
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

        {/* TAB 2: SYSTEM & CANDIDATE LOGS */}
        {activeAdminTab === 'logs' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-2 max-h-[600px] overflow-y-auto">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-3">
                Log & Report Files
              </h3>
              {systemLogs.map(log => (
                <button
                  key={log.filename}
                  onClick={() => loadSystemLogContent(log.filename)}
                  className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-center justify-between ${
                    selectedSystemLog === log.filename
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 border border-slate-800/50'
                  }`}
                >
                  <span className="truncate">{log.filename}</span>
                  <span className="text-[10px] opacity-60">{(log.size_bytes / 1024).toFixed(1)} KB</span>
                </button>
              ))}
            </div>

            <div className="md:col-span-2 rounded-2xl bg-[#050811] border border-slate-800 overflow-hidden flex flex-col h-[600px]">
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400">{selectedSystemLog || 'Select a log file'}</span>
                <button
                  onClick={() => selectedSystemLog && loadSystemLogContent(selectedSystemLog)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
                {loadingLogContent ? (
                  <div className="h-full flex items-center justify-center text-slate-500">Loading log content...</div>
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

      {/* EDIT MODAL (Form + JSON Editor) */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">Edit Candidate Profile — {editingUser.name}</h3>
                </div>
                <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800">
                <button
                  onClick={() => setEditTab('form')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    editTab === 'form' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Visual Form
                </button>
                <button
                  onClick={() => setEditTab('json')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    editTab === 'json' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Raw JSON Editor
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                {editJsonError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
                    {editJsonError}
                  </div>
                )}
                {editSuccess && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    {editSuccess}
                  </div>
                )}

                {editTab === 'form' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Name</label>
                      <input
                        type="text"
                        value={editFormData.name || ''}
                        onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Email</label>
                      <input
                        type="email"
                        value={editFormData.email || ''}
                        onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Password (Leave blank to keep)</label>
                      <input
                        type="password"
                        value={editFormData.password || ''}
                        onChange={e => setEditFormData({ ...editFormData, password: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Experience (Years)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editFormData.experience || 0}
                        onChange={e => setEditFormData({ ...editFormData, experience: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-slate-400 mb-1">Search URL</label>
                      <input
                        type="text"
                        value={editFormData.search_url || ''}
                        onChange={e => setEditFormData({ ...editFormData, search_url: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-slate-400 mb-1">Candidate Resume PDF (MongoDB Atlas Cloud)</label>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-mono text-slate-200">{editingUser.resume_filename || `${editingUser.user_id}_Resume.pdf`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`/api/profile/resume?user_id=${editingUser.user_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700"
                          >
                            <Download className="w-3 h-3" /> Preview
                          </a>
                          <label className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-md">
                            <Upload className="w-3 h-3" />
                            <span>{adminUploadingResume ? 'Uploading...' : 'Upload PDF'}</span>
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={handleAdminResumeUpload}
                              disabled={adminUploadingResume}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                      {adminResumeSuccess && (
                        <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {adminResumeSuccess}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <textarea
                    rows={16}
                    value={editRawJson}
                    onChange={e => {
                      setEditRawJson(e.target.value)
                      setEditJsonError('')
                    }}
                    className="w-full bg-[#050811] border border-slate-800 rounded-xl p-4 font-mono text-xs text-cyan-300 focus:outline-none focus:border-indigo-500"
                    spellCheck={false}
                  />
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                >
                  <Save className="w-3.5 h-3.5" /> {savingEdit ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
