'use client'

import React, { useEffect, useState, useRef } from 'react'
import {
  Briefcase,
  PlayCircle,
  Clock,
  Calendar,
  Settings,
  Terminal,
  Activity,
  TrendingUp,
  FileText,
  RefreshCw,
  Search,
  ExternalLink,
  Shield,
  Sliders,
  CheckCircle2,
  XCircle,
  ChevronRight,
  LogOut,
  Save,
  X,
  AlertCircle,
  User,
  Sparkles,
  StopCircle,
  FileJson,
  Code,
  Wifi,
  WifiOff
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { bootstrapEngineUrl, discoverEngineUrl, saveActiveEngineUrl } from '@/lib/engineDiscovery'

const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'default-secret-key'

export default function UserDashboard() {
  const [engineUrl, setEngineUrl] = useState<string>('')
  const [engineUrlLabel, setEngineUrlLabel] = useState<string>('...')
  const [engineStatus, setEngineStatus] = useState<'online' | 'offline' | 'checking'>('checking')
  const [userId, setUserId] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('user')
  const [candidateProfile, setCandidateProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true)

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'runner' | 'history' | 'profile'>('runner')
  const [profileSubTab, setProfileSubTab] = useState<'form' | 'json'>('form')

  // Metrics State (Today, Week, Month, Total)
  const [metrics, setMetrics] = useState({
    today: 0,
    this_week: 0,
    this_month: 0,
    total_applied: 0
  })
  const [historyJobs, setHistoryJobs] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true)
  const [historySearch, setHistorySearch] = useState<string>('')
  const [historyFilter, setHistoryFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')

  // Bot Run State
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<'Idle' | 'Starting...' | 'Running' | 'Completed' | 'Stopped' | 'Error'>('Idle')
  const [liveLogs, setLiveLogs] = useState<string[]>([])
  const [headlessMode, setHeadlessMode] = useState<boolean>(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Profile Form & JSON Editor State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    experience: 0,
    current_ctc: 0,
    expected_ctc: 0,
    search_url: '',
    resume_file: ''
  })
  const [rawJsonStr, setRawJsonStr] = useState<string>('{\n}')
  const [jsonError, setJsonError] = useState<string>('')
  const [savingProfile, setSavingProfile] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<string>('')

  // 1. Authenticate & Initialize — discover best engine URL first
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

    // Discover best available engine URL (probes all candidates in parallel)
    setEngineStatus('checking')
    bootstrapEngineUrl().then(url => {
      if (url) {
        setEngineUrl(url)
        setEngineStatus('online')
        // Show a friendly label based on URL type
        if (url.includes('trycloudflare.com') || url.includes('ts.net') || url.startsWith('https://')) {
          setEngineUrlLabel('Tunnel')
        } else {
          setEngineUrlLabel('Local')
        }
        loadUserData(storedUid, url)
        loadUserHistory(storedUid, url)
        checkActiveJob(storedUid, url)
      } else {
        setEngineStatus('offline')
        setEngineUrlLabel('Offline')
        setLoadingProfile(false)
        setLoadingHistory(false)
      }
    })
  }, []) // runs once on mount — URL is discovered dynamically


  // Polling for active job status & logs
  useEffect(() => {
    if (!activeJobId || jobStatus !== 'Running') return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${engineUrl}/api/status/${activeJobId}`, {
          headers: { 'X-API-Key': API_KEY }
        })
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'completed') {
            setJobStatus('Completed')
            setActiveJobId(null)
            loadUserHistory(userId)
          } else if (data.status === 'stopped') {
            setJobStatus('Stopped')
            setActiveJobId(null)
            loadUserHistory(userId)
          } else if (data.status === 'failed') {
            setJobStatus('Error')
            setActiveJobId(null)
          }
          if (data.logs && Array.isArray(data.logs)) {
            setLiveLogs(data.logs)
          }
        }
      } catch {
        // Fallback
      }
    }, 1500)

    return () => clearInterval(interval)
  }, [activeJobId, jobStatus, engineUrl, userId])

  // Auto-scroll logs terminal
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [liveLogs])

  const checkEngineHealth = async (url?: string): Promise<'online' | 'offline'> => {
    const target = url || engineUrl
    if (!target) return 'offline'
    try {
      setEngineStatus('checking')
      const res = await fetch(`${target}/`, { cache: 'no-store' })
      if (res.ok) {
        setEngineStatus('online')
        return 'online'
      } else {
        setEngineStatus('offline')
        return 'offline'
      }
    } catch {
      setEngineStatus('offline')
      return 'offline'
    }
  }

  /** Re-run full multi-URL discovery and reload data if something comes online */
  const handleRetryDiscovery = async () => {
    setEngineStatus('checking')
    const url = await discoverEngineUrl()
    if (url) {
      saveActiveEngineUrl(url)
      setEngineUrl(url)
      setEngineStatus('online')
      if (url.includes('trycloudflare.com') || url.includes('ts.net') || url.startsWith('https://')) {
        setEngineUrlLabel('Tunnel')
      } else {
        setEngineUrlLabel('Local')
      }
      loadUserData(userId, url)
      loadUserHistory(userId, url)
      checkActiveJob(userId, url)
    } else {
      setEngineStatus('offline')
      setEngineUrlLabel('Offline')
    }
  }

  const loadUserData = async (uid: string, url?: string) => {
    const base = url || engineUrl
    setLoadingProfile(true)
    try {
      const res = await fetch(`${base}/api/user/${uid}/profile`, {
        headers: { 'X-API-Key': API_KEY }
      })
      if (res.ok) {
        const data = await res.json()
        setCandidateProfile(data)
        setFormData({
          name: data.name || '',
          email: data.email || '',
          password: '',
          experience: data.experience || 0,
          current_ctc: data.current_ctc || 0,
          expected_ctc: data.expected_ctc || 0,
          search_url: data.search_url || '',
          resume_file: data.resume_file || ''
        })
        setRawJsonStr(data.raw_json || '{}')
      }
    } catch (e) {
      console.error('Failed to load profile:', e)
    } finally {
      setLoadingProfile(false)
    }
  }

  const loadUserHistory = async (uid: string, url?: string) => {
    const base = url || engineUrl
    setLoadingHistory(true)
    try {
      const res = await fetch(`${base}/api/user/${uid}/history`, {
        headers: { 'X-API-Key': API_KEY }
      })
      if (res.ok) {
        const data = await res.json()
        setMetrics(data.stats || { today: 0, this_week: 0, this_month: 0, total_applied: 0 })
        setHistoryJobs(data.jobs || [])
      }
    } catch (e) {
      console.error('Failed to load history:', e)
    } finally {
      setLoadingHistory(false)
    }
  }

  const checkActiveJob = async (uid: string, url?: string) => {
    const base = url || engineUrl
    try {
      const res = await fetch(`${base}/api/active-job/${uid}`, {
        headers: { 'X-API-Key': API_KEY }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.active && data.job_id) {
          setActiveJobId(data.job_id)
          setJobStatus('Running')
          if (data.data?.logs) {
            setLiveLogs(data.data.logs)
          }
        } else {
          loadStaticLogs(uid, base)
        }
      }
    } catch {
      loadStaticLogs(uid, base)
    }
  }

  const loadStaticLogs = async (uid: string, url?: string) => {
    const base = url || engineUrl
    try {
      const res = await fetch(`${base}/api/user/${uid}/logs`, {
        headers: { 'X-API-Key': API_KEY }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.logs && data.logs.length > 0) {
          setLiveLogs(data.logs)
        }
      }
    } catch {}
  }

  const handleStartBot = async () => {
    setJobStatus('Starting...')
    setLiveLogs(['🚀 Initializing automated application session...'])

    try {
      const res = await fetch(`${engineUrl}/api/start-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({
          profile_path: userId,
          headless: headlessMode
        })
      })
      const data = await res.json()
      if (res.ok) {
        setActiveJobId(data.job_id)
        setJobStatus('Running')
      } else {
        setJobStatus('Error')
        setLiveLogs(prev => [...prev, `❌ Error starting bot: ${data.detail || 'Unknown error'}`])
      }
    } catch (err: any) {
      setJobStatus('Error')
      setLiveLogs(prev => [
        ...prev,
        '❌ Connection Failed: Engine backend is unreachable.',
        'Please ensure your bot engine is running.'
      ])
    }
  }

  const handleStopBot = async () => {
    if (!activeJobId) return
    try {
      await fetch(`${engineUrl}/api/stop-bot/${activeJobId}`, {
        method: 'POST',
        headers: { 'X-API-Key': API_KEY }
      })
      setJobStatus('Stopped')
      setActiveJobId(null)
      loadUserHistory(userId)
    } catch (e) {
      console.error('Failed to stop bot:', e)
    }
  }

  const handleSaveFormProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setSaveSuccess('')
    setJsonError('')

    try {
      const res = await fetch(`${engineUrl}/api/user/${userId}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        const data = await res.json()
        setCandidateProfile(data.profile)
        setRawJsonStr(JSON.stringify(data.profile, null, 2))
        setSaveSuccess('Profile saved successfully!')
        setTimeout(() => setSaveSuccess(''), 3500)
      } else {
        const errData = await res.json()
        alert(`Failed to save: ${errData.detail || 'Server error'}`)
      }
    } catch (err: any) {
      alert(`Error saving profile: ${err.message}`)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveJsonProfile = async () => {
    setSavingProfile(true)
    setSaveSuccess('')
    setJsonError('')

    // 1. Validate JSON syntax
    let parsed: any
    try {
      parsed = JSON.parse(rawJsonStr)
    } catch (err: any) {
      setJsonError(`Invalid JSON Syntax: ${err.message}`)
      setSavingProfile(false)
      return
    }

    try {
      const res = await fetch(`${engineUrl}/api/user/${userId}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({ raw_json: rawJsonStr })
      })
      if (res.ok) {
        const data = await res.json()
        setCandidateProfile(data.profile)
        setFormData({
          name: data.profile.CANDIDATE_NAME || '',
          email: data.profile.EMAIL || '',
          password: '',
          experience: data.profile.MY_EXPERIENCE || 0,
          current_ctc: data.profile.CURRENT_CTC_ANNUAL || 0,
          expected_ctc: data.profile.EXPECTED_CTC_ANNUAL || 0,
          search_url: data.profile.SEARCH_URL || '',
          resume_file: data.profile.RESUME_FILE || ''
        })
        setSaveSuccess('Profile JSON saved and synchronized!')
        setTimeout(() => setSaveSuccess(''), 3500)
      } else {
        const errData = await res.json()
        setJsonError(`Failed to save: ${errData.detail || 'Server error'}`)
      }
    } catch (err: any) {
      setJsonError(`Error: ${err.message}`)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(rawJsonStr)
      setRawJsonStr(JSON.stringify(parsed, null, 2))
      setJsonError('')
    } catch (e: any) {
      setJsonError(`Cannot format: ${e.message}`)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/'
  }

  // Filter history jobs
  const filteredJobs = historyJobs.filter(job => {
    const matchesSearch =
      (job.company || '').toLowerCase().includes(historySearch.toLowerCase()) ||
      (job.role || '').toLowerCase().includes(historySearch.toLowerCase()) ||
      (job.location || '').toLowerCase().includes(historySearch.toLowerCase())

    if (!matchesSearch) return false

    if (historyFilter === 'all') return true

    const now = new Date()
    const jobDate = new Date(job.date)
    const diffHours = (now.getTime() - jobDate.getTime()) / (1000 * 60 * 60)

    if (historyFilter === 'today') return diffHours <= 24
    if (historyFilter === 'week') return diffHours <= 24 * 7
    if (historyFilter === 'month') return diffHours <= 24 * 30
    return true
  })

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  AI Job Automation
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold uppercase tracking-wider">
                  Candidate Portal
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Logged in as <span className="text-slate-200 font-medium">{formData.name || userId}</span> ({userEmail})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Engine Status Badge */}
            <button
              onClick={engineStatus === 'offline' ? handleRetryDiscovery : undefined}
              title={engineUrl || 'Discovering engine...'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                engineStatus === 'online'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/10 cursor-default'
                  : engineStatus === 'checking'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 cursor-default'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 cursor-pointer'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  engineStatus === 'online'
                    ? 'bg-emerald-400 animate-pulse'
                    : engineStatus === 'checking'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-400'
                }`}
              />
              {engineStatus === 'online'
                ? `Engine · ${engineUrlLabel}`
                : engineStatus === 'checking'
                ? 'Engine · Scanning...'
                : 'Engine · Offline'}
            </button>

            {/* Admin Switch if Admin */}
            {userRole === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" /> Switch to Admin
              </Link>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-300 border border-slate-700/60 transition-all text-slate-300"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Engine Offline / Checking Banner */}
      <AnimatePresence>
        {engineStatus !== 'online' && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className={`w-full border-b backdrop-blur-sm px-6 py-3 ${
              engineStatus === 'checking'
                ? 'bg-amber-950/60 border-amber-500/30'
                : 'bg-rose-950/80 border-rose-500/40'
            }`}
          >
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                {engineStatus === 'checking'
                  ? <RefreshCw className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5 animate-spin" />
                  : <WifiOff className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                }
                <div>
                  {engineStatus === 'checking' ? (
                    <>
                      <p className="text-sm font-semibold text-amber-200">Scanning for engine...</p>
                      <p className="text-xs text-amber-300/80 mt-0.5">
                        Probing all known URLs: <code className="text-amber-100 font-mono text-[11px]">{process.env.NEXT_PUBLIC_ENGINE_URL || 'N/A'}</code>,{' '}
                        <code className="text-amber-100 font-mono text-[11px]">localhost:8000</code>, Cloudflare tunnel…
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-rose-200">Engine Offline — No data available</p>
                      <p className="text-xs text-rose-300/80 mt-0.5">
                        None of the known engine URLs responded. Start it with:{' '}
                        <code className="bg-rose-900/60 text-rose-100 px-1.5 py-0.5 rounded text-[11px]">Start_Background.bat</code>
                        {' '}or{' '}
                        <code className="bg-rose-900/60 text-rose-100 px-1.5 py-0.5 rounded text-[11px]">uv run run.py --all</code>
                      </p>
                    </>
                  )}
                </div>
              </div>
              {engineStatus === 'offline' && (
                <button
                  onClick={handleRetryDiscovery}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 transition-all whitespace-nowrap"
                >
                  <Wifi className="w-3.5 h-3.5" /> Scan All URLs
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* 4 Metric Cards (Today, This Week, This Month, Total) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-emerald-500/20 hover:border-emerald-500/40 transition-all relative overflow-hidden group shadow-lg shadow-emerald-500/5"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase flex items-center gap-1.5">
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
          </motion.div>

          {/* This Week */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-blue-500/20 hover:border-blue-500/40 transition-all relative overflow-hidden group shadow-lg shadow-blue-500/5"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-blue-400 tracking-wider uppercase flex items-center gap-1.5">
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
          </motion.div>

          {/* This Month */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-purple-500/20 hover:border-purple-500/40 transition-all relative overflow-hidden group shadow-lg shadow-purple-500/5"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-purple-400 tracking-wider uppercase flex items-center gap-1.5">
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
          </motion.div>

          {/* Till Now Total */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-amber-500/20 hover:border-amber-500/40 transition-all relative overflow-hidden group shadow-lg shadow-amber-500/5"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-amber-400 tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Till Now Total
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                All-Time
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.total_applied}
            </div>
            <p className="text-xs text-slate-400 mt-1">Total lifetime applications</p>
          </motion.div>
        </section>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('runner')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'runner'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <PlayCircle className="w-4 h-4" /> Bot Runner & Live Logs
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Briefcase className="w-4 h-4" /> Job Applying History ({historyJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Settings className="w-4 h-4" /> Edit Profile & JSON
          </button>
        </div>

        {/* TAB 1: BOT RUNNER & LIVE LOGS */}
        {activeTab === 'runner' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-white">Automated Job Application Engine</h2>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                      jobStatus === 'Running'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                        : jobStatus === 'Completed'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : jobStatus === 'Error'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    ● {jobStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Search URL: <span className="text-slate-300 font-mono text-[11px]">{formData.search_url || 'https://www.naukri.com/mnjuser/recommendedjobs'}</span>
                </p>

              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                {/* Headless toggle */}
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-700/60">
                  <input
                    type="checkbox"
                    checked={headlessMode}
                    onChange={e => setHeadlessMode(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>Run Headless (Hidden Browser)</span>
                </label>

                {jobStatus === 'Running' ? (
                  <button
                    onClick={handleStopBot}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 transition-all"
                  >
                    <StopCircle className="w-4 h-4" /> Stop Bot
                  </button>
                ) : (
                  <button
                    onClick={handleStartBot}
                    disabled={jobStatus === 'Starting...'}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white shadow-lg shadow-blue-500/25 transition-all"
                  >
                    <PlayCircle className="w-4 h-4" /> Start Automatic Job Apply
                  </button>
                )}
              </div>
            </div>

            {/* Live Terminal Log Stream */}
            <div className="rounded-2xl bg-[#0b0f19] border border-slate-800/90 overflow-hidden shadow-2xl">
              <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono text-slate-300">Live Bot Console Stream — {userId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadStaticLogs(userId)}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                  <button
                    onClick={() => setLiveLogs([])}
                    className="text-xs text-slate-400 hover:text-slate-200 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="p-4 h-96 overflow-y-auto font-mono text-xs space-y-1 bg-[#050811] text-slate-300">
                {liveLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-600">
                    Press &quot;Start Automatic Job Apply&quot; to begin scanning and applying to jobs.
                  </div>
                ) : (
                  liveLogs.map((log, idx) => {
                    let color = 'text-slate-300'
                    if (log.includes('✅') || log.includes('Applied') || log.includes('SUCCESS')) {
                      color = 'text-emerald-400 font-semibold'
                    } else if (log.includes('❌') || log.includes('Error') || log.includes('FAIL')) {
                      color = 'text-rose-400 font-semibold'
                    } else if (log.includes('⚠️') || log.includes('Skipping')) {
                      color = 'text-amber-300'
                    } else if (log.includes('🚀') || log.includes('STARTING') || log.includes('💡')) {
                      color = 'text-cyan-400'
                    }
                    return (
                      <div key={idx} className={`${color} leading-relaxed whitespace-pre-wrap`}>
                        {log}
                      </div>
                    )
                  })
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: JOB APPLYING HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Search & Filter Header */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search company, title, or location..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Time Pill Filters */}
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                <button
                  onClick={() => setHistoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    historyFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  All ({historyJobs.length})
                </button>
                <button
                  onClick={() => setHistoryFilter('today')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    historyFilter === 'today'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Today ({metrics.today})
                </button>
                <button
                  onClick={() => setHistoryFilter('week')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    historyFilter === 'week'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  This Week ({metrics.this_week})
                </button>
                <button
                  onClick={() => setHistoryFilter('month')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    historyFilter === 'month'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  This Month ({metrics.this_month})
                </button>
              </div>
            </div>

            {/* History Table */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Job Role / Title</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">QA Answered</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          No applied jobs found matching your filter.
                        </td>
                      </tr>
                    ) : (
                      filteredJobs.map((job, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-white">
                            {job.company || 'Direct Employer'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-200">
                            {job.role || 'Software Engineer'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {job.location || 'India'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono">
                            {job.date || 'Recently'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px]">
                              {job.questions_answered || '0'} questions
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> APPLIED
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

        {/* TAB 3: EDIT PROFILE & JSON */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Sub Tabs: Form vs JSON */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProfileSubTab('form')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    profileSubTab === 'form'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <User className="w-3.5 h-3.5" /> Visual Form View
                </button>
                <button
                  onClick={() => setProfileSubTab('json')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    profileSubTab === 'json'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <FileJson className="w-3.5 h-3.5" /> Raw JSON Editor
                </button>
              </div>

              {saveSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {saveSuccess}
                </div>
              )}
            </div>

            {/* FORM VIEW */}
            {profileSubTab === 'form' && (
              <form onSubmit={handleSaveFormProfile} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Candidate Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Naukri Login Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Naukri Login Password</label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep unchanged"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Total Experience (Years)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.experience}
                      onChange={e => setFormData({ ...formData, experience: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Current Annual CTC (₹ INR)</label>
                    <input
                      type="number"
                      value={formData.current_ctc}
                      onChange={e => setFormData({ ...formData, current_ctc: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Expected Annual CTC (₹ INR)</label>
                    <input
                      type="number"
                      value={formData.expected_ctc}
                      onChange={e => setFormData({ ...formData, expected_ctc: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Naukri Search / Recommended Jobs URL (Universal Default: https://www.naukri.com/mnjuser/recommendedjobs)</label>
                    <input
                      type="url"
                      value={formData.search_url}
                      onChange={e => setFormData({ ...formData, search_url: e.target.value })}
                      placeholder="https://www.naukri.com/mnjuser/recommendedjobs"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>


                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Resume PDF Path or Public URL</label>
                    <input
                      type="text"
                      value={formData.resume_file}
                      onChange={e => setFormData({ ...formData, resume_file: e.target.value })}
                      placeholder="data/resumes/my_resume.pdf"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all"
                  >
                    <Save className="w-4 h-4" /> {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* RAW JSON EDITOR VIEW */}
            {profileSubTab === 'json' && (
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Code className="w-4 h-4 text-cyan-400" /> Full Profile Configuration JSON
                    </h3>
                    <p className="text-xs text-slate-400">
                      Directly edit your bot filters, question cache, search URLs, and credentials in JSON format.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleFormatJson}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      Format JSON
                    </button>
                    <button
                      onClick={handleSaveJsonProfile}
                      disabled={savingProfile}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all"
                    >
                      <Save className="w-3.5 h-3.5" /> {savingProfile ? 'Saving...' : 'Save JSON'}
                    </button>
                  </div>
                </div>

                {jsonError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
                    {jsonError}
                  </div>
                )}

                <textarea
                  rows={20}
                  value={rawJsonStr}
                  onChange={e => {
                    setRawJsonStr(e.target.value)
                    setJsonError('')
                  }}
                  className="w-full bg-[#050811] border border-slate-800 rounded-xl p-4 font-mono text-xs text-cyan-300 focus:outline-none focus:border-blue-500 leading-relaxed shadow-inner"
                  spellCheck={false}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
