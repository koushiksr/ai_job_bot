'use client'

import React, { useEffect, useState, useRef } from 'react'
import {
  Users,
  PlayCircle,
  Clock,
  Calendar,
  Settings,
  Plus,
  Trash2,
  Edit,
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
  ChevronDown,
  ChevronRight,
  Eye,
  LogOut,
  Save,
  X,
  AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const DEFAULT_ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL || 'http://localhost:8000'

export default function Dashboard() {
  const [engineUrl, setEngineUrl] = useState<string>(DEFAULT_ENGINE_URL)
  const [engineStatus, setEngineStatus] = useState<'online' | 'offline' | 'checking'>('checking')
  const [activeTab, setActiveTab] = useState<'profiles' | 'logs' | 'scheduler'>('profiles')

  // Profiles State
  const [profiles, setProfiles] = useState<any[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState<boolean>(true)
  const [searchFilter, setSearchFilter] = useState<string>('')

  // Profile Editor Modal State
  const [editingProfile, setEditingProfile] = useState<any | null>(null)
  const [isNewProfile, setIsNewProfile] = useState<boolean>(false)
  const [savingProfile, setSavingProfile] = useState<boolean>(false)

  // Bot Execution State
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [activeJobProfile, setActiveJobProfile] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<string>('Idle')
  const [logs, setLogs] = useState<string[]>([])
  const [showBrowser, setShowBrowser] = useState<boolean>(true)
  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState<boolean>(false)

  // Logs Viewer State
  const [logFiles, setLogFiles] = useState<any[]>([])
  const [selectedLogFile, setSelectedLogFile] = useState<string | null>(null)
  const [selectedLogContent, setSelectedLogContent] = useState<any>(null)
  const [loadingLogContent, setLoadingLogContent] = useState<boolean>(false)

  const logsEndRef = useRef<HTMLDivElement>(null)

  // 1. Initial Load
  useEffect(() => {
    checkEngineHealth()
    fetchProfiles()
    fetchLogsList()
  }, [engineUrl])

  const checkEngineHealth = async () => {
    try {
      setEngineStatus('checking')
      const res = await fetch(`${engineUrl}/`, { cache: 'no-store' })
      if (res.ok) {
        setEngineStatus('online')
      } else {
        setEngineStatus('offline')
      }
    } catch {
      setEngineStatus('offline')
    }
  }

  const fetchProfiles = async () => {
    setLoadingProfiles(true)
    try {
      const res = await fetch(`${engineUrl}/api/profiles`, {
        headers: { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'default-secret-key' }
      })
      if (res.ok) {
        const data = await res.json()
        setProfiles(data.profiles || [])
      }
    } catch (e) {
      console.error('Failed to load profiles:', e)
    } finally {
      setLoadingProfiles(false)
    }
  }

  const fetchLogsList = async () => {
    try {
      const res = await fetch(`${engineUrl}/api/logs`, {
        headers: { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'default-secret-key' }
      })
      if (res.ok) {
        const data = await res.json()
        setLogFiles(data.logs || [])
        if (!selectedLogFile && data.logs?.length > 0) {
          loadLogContent(data.logs[0].filename)
        }
      }
    } catch (e) {
      console.error('Failed to list logs:', e)
    }
  }

  const loadLogContent = async (filename: string) => {
    setSelectedLogFile(filename)
    setLoadingLogContent(true)
    try {
      const res = await fetch(`${engineUrl}/api/logs/content?filename=${encodeURIComponent(filename)}`, {
        headers: { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'default-secret-key' }
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedLogContent(data)
      }
    } catch (e) {
      console.error('Failed to load log content:', e)
    } finally {
      setLoadingLogContent(false)
    }
  }

  // Toggle Daily Scheduler for a candidate
  const handleToggleDaily = async (profileId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    // Optimistic UI update
    setProfiles(prev =>
      prev.map(p => (p.profile_id === profileId ? { ...p, enabled_for_daily_run: newStatus } : p))
    )

    try {
      const res = await fetch(`${engineUrl}/api/profiles/toggle-daily`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'default-secret-key'
        },
        body: JSON.stringify({ profile_id: profileId, enabled: newStatus })
      })
      if (!res.ok) {
        // Rollback
        fetchProfiles()
      }
    } catch (e) {
      fetchProfiles()
    }
  }

  // Start Bot for Single Profile
  const handleStartBot = async (profileId: string) => {
    setActiveJobProfile(profileId)
    setJobStatus('Starting...')
    setLogs([])
    setIsTerminalModalOpen(true)

    try {
      const res = await fetch(`${engineUrl}/api/start-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'default-secret-key'
        },
        body: JSON.stringify({
          profile_path: profileId,
          headless: !showBrowser
        })
      })
      const data = await res.json()
      if (res.ok) {
        setActiveJobId(data.job_id)
        setJobStatus('Running')
      } else {
        setJobStatus('Error: ' + data.detail)
      }
    } catch (err: any) {
      setJobStatus('Engine Offline')
      setLogs([
        '❌ Connection Failed: The Local Engine backend is not responding.',
        `Please ensure the engine is running with: uv run run.py`
      ])
    }
  }

  // Start Batch Run of all active scheduled profiles
  const handleRunAllActive = async () => {
    setActiveJobProfile('All Active Candidates')
    setJobStatus('Starting Batch...')
    setLogs([])
    setIsTerminalModalOpen(true)

    try {
      const res = await fetch(`${engineUrl}/api/start-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'default-secret-key'
        },
        body: JSON.stringify({
          profile_path: '0', // 0 triggers batch sequence of active profiles
          headless: !showBrowser
        })
      })
      const data = await res.json()
      if (res.ok) {
        setActiveJobId(data.job_id)
        setJobStatus('Running')
      } else {
        setJobStatus('Error: ' + data.detail)
      }
    } catch (err) {
      setJobStatus('Engine Offline')
      setLogs(['❌ Connection Failed. Start engine with: uv run run.py'])
    }
  }

  // Stop Running Job
  const handleStopBot = async () => {
    if (!activeJobId) return
    try {
      await fetch(`${engineUrl}/api/stop-bot/${activeJobId}`, {
        method: 'POST',
        headers: { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'default-secret-key' }
      })
      setJobStatus('Stopped')
    } catch (e) {
      console.error(e)
    }
  }

  // Poll Logs when a job is running
  useEffect(() => {
    if (!activeJobId || jobStatus !== 'Running') return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${engineUrl}/api/status/${activeJobId}`, {
          headers: { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'default-secret-key' }
        })
        const data = await res.json()
        if (data.logs && data.logs.length > 0) {
          setLogs(data.logs)
          logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
        if (data.status === 'completed' || data.status === 'failed' || data.status === 'stopped') {
          setJobStatus(
            data.status === 'completed' ? 'Finished ✅' : data.status === 'stopped' ? 'Stopped 🛑' : 'Failed ❌'
          )
          clearInterval(interval)
          fetchProfiles()
          fetchLogsList()
        }
      } catch (err) {
        // Ignore poll error
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [activeJobId, jobStatus, engineUrl])

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProfile) return
    setSavingProfile(true)

    try {
      const res = await fetch(`${engineUrl}/api/profiles/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'default-secret-key'
        },
        body: JSON.stringify(editingProfile)
      })
      if (res.ok) {
        setEditingProfile(null)
        fetchProfiles()
      } else {
        alert('Failed to save profile')
      }
    } catch (err) {
      alert('Error saving profile: Check backend connection')
    } finally {
      setSavingProfile(false)
    }
  }

  // Profile Delete
  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm(`Are you sure you want to delete profile "${profileId}"?`)) return
    try {
      const res = await fetch(`${engineUrl}/api/profiles/${profileId}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'default-secret-key' }
      })
      if (res.ok) {
        fetchProfiles()
      }
    } catch (err) {
      alert('Failed to delete profile')
    }
  }

  const activeScheduledCount = profiles.filter(p => p.enabled_for_daily_run).length
  const filteredProfiles = profiles.filter(
    p =>
      p.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.profile_id?.toLowerCase().includes(searchFilter.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#090a0f] text-white p-4 md:p-10 font-sans relative selection:bg-blue-600 selection:text-white">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-gray-800/60 relative z-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                AI Job Bot Control Center
              </h1>
              <p className="text-xs text-gray-400">Multi-Candidate Profile Management & Daily Scheduler</p>
            </div>
          </div>
        </div>

        {/* Engine status pill & Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900/80 border border-gray-800 text-xs">
            <div
              className={`w-2 h-2 rounded-full ${
                engineStatus === 'online'
                  ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse'
                  : engineStatus === 'checking'
                  ? 'bg-yellow-500 animate-spin'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-gray-300 font-medium">
              {engineStatus === 'online'
                ? 'Engine Connected'
                : engineStatus === 'checking'
                ? 'Connecting...'
                : 'Engine Offline'}
            </span>
            <button
              onClick={checkEngineHealth}
              title="Refresh connection"
              className="p-1 hover:text-white text-gray-400 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={handleRunAllActive}
            disabled={activeScheduledCount === 0 || engineStatus !== 'online'}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PlayCircle className="w-4 h-4" /> Run All Active ({activeScheduledCount})
          </button>
        </div>
      </header>

      {/* Top Metrics Cards */}
      <section className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-10">
        <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800/80 rounded-2xl p-5 hover:border-gray-700/80 transition-colors">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" /> Total Candidates
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{profiles.length}</div>
          <div className="text-[11px] text-gray-500 mt-1">Configured Profiles</div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800/80 rounded-2xl p-5 hover:border-gray-700/80 transition-colors">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" /> Daily Scheduled Active
          </div>
          <div className="text-3xl font-bold text-emerald-400 tracking-tight">
            {activeScheduledCount} <span className="text-lg text-gray-500">/ {profiles.length}</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Auto-run at 6:00 AM & 8:00 AM</div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800/80 rounded-2xl p-5 hover:border-gray-700/80 transition-colors">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" /> Daily Schedule
          </div>
          <div className="text-xl font-bold text-white tracking-tight mt-1">6:00 AM • 8:00 AM</div>
          <div className="text-[11px] text-purple-400/80 mt-1">Windows Task Scheduler Active</div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800/80 rounded-2xl p-5 hover:border-gray-700/80 transition-colors">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" /> Total Applications
          </div>
          <div className="text-3xl font-bold text-amber-400 tracking-tight">
            {profiles.reduce((sum, p) => sum + (p.total_applied || 0), 0)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Jobs Applied Across Candidates</div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto flex border-b border-gray-800 mb-6 gap-8 text-sm font-medium">
        <button
          onClick={() => setActiveTab('profiles')}
          className={`pb-4 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'profiles'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Users className="w-4 h-4" /> Candidate Profiles ({profiles.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-4 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'logs'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <FileText className="w-4 h-4" /> Application Logs & History ({logFiles.length})
        </button>

        <button
          onClick={() => setActiveTab('scheduler')}
          className={`pb-4 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'scheduler'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Sliders className="w-4 h-4" /> Schedule & Engine Settings
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto relative z-10">
        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 1: PROFILES MANAGEMENT & DAILY SCHEDULE TOGGLES */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === 'profiles' && (
          <div className="space-y-6">
            {/* Search & Actions toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-900/30 p-4 rounded-2xl border border-gray-800/60">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by candidate name, email..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="w-full bg-black/40 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    setIsNewProfile(true)
                    setEditingProfile({
                      profile_id: '',
                      name: '',
                      email: '',
                      password: '',
                      my_experience: 2,
                      current_ctc_annual: 500000,
                      expected_ctc_annual: 1200000,
                      search_url: 'https://www.naukri.com/machine-learning-jobs',
                      resume_file: '',
                      enabled_for_daily_run: true,
                      job_filters: {
                        location: ['Bangalore', 'Hyderabad'],
                        experience: [0, 1, 2, 3],
                        keywords: ['Python', 'Machine Learning', 'AI']
                      }
                    })
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-600/20"
                >
                  <Plus className="w-4 h-4" /> Add New Candidate Profile
                </button>
              </div>
            </div>

            {/* Profiles Grid */}
            {loadingProfiles ? (
              <div className="text-center py-16 text-gray-500">Loading candidate profiles...</div>
            ) : filteredProfiles.length === 0 ? (
              <div className="text-center py-16 bg-gray-900/20 rounded-2xl border border-gray-800/40">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-gray-300 font-semibold mb-1">No Candidate Profiles Found</h3>
                <p className="text-xs text-gray-500 mb-4">Add your first candidate profile to get started.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfiles.map(profile => (
                  <motion.div
                    key={profile.profile_id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                      profile.enabled_for_daily_run
                        ? 'border-blue-500/30 hover:border-blue-500/60 shadow-[0_4px_20px_rgba(59,130,246,0.05)]'
                        : 'border-gray-800/80 hover:border-gray-700 opacity-80'
                    }`}
                  >
                    <div>
                      {/* Top Header: Candidate Name & Daily Toggle */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            {profile.name}
                          </h3>
                          <p className="text-xs text-gray-400 truncate max-w-[200px]">{profile.email}</p>
                        </div>

                        {/* Daily 6AM & 8AM Toggle Switch */}
                        <button
                          onClick={() => handleToggleDaily(profile.profile_id, profile.enabled_for_daily_run)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                            profile.enabled_for_daily_run
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-gray-800/80 border-gray-700 text-gray-400 hover:bg-gray-700'
                          }`}
                          title={
                            profile.enabled_for_daily_run
                              ? 'Active in Daily 6AM & 8AM Schedule. Click to Pause.'
                              : 'Paused from Daily Schedule. Click to Enable.'
                          }
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              profile.enabled_for_daily_run ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                            }`}
                          />
                          {profile.enabled_for_daily_run ? 'Daily: Active' : 'Daily: Paused'}
                        </button>
                      </div>

                      {/* Candidate Quick Stats */}
                      <div className="grid grid-cols-2 gap-2 my-4 p-3 bg-black/40 rounded-xl border border-gray-800/50 text-xs">
                        <div>
                          <span className="text-gray-500 text-[10px] block uppercase">Experience</span>
                          <span className="font-semibold text-gray-200">{profile.experience} Years</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px] block uppercase">Expected CTC</span>
                          <span className="font-semibold text-gray-200">
                            ₹{(profile.expected_ctc / 100000).toFixed(1)} Lakhs
                          </span>
                        </div>
                      </div>

                      {/* Keywords Tags */}
                      {profile.job_filters?.keywords && profile.job_filters.keywords.length > 0 && (
                        <div className="mb-4">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1.5">
                            Target Skills
                          </span>
                          <div className="flex flex-wrap gap-1.5 max-h-16 overflow-hidden">
                            {profile.job_filters.keywords.slice(0, 5).map((kw: string, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-gray-800/60 border border-gray-700/60 rounded-md text-[10px] text-gray-300"
                              >
                                {kw}
                              </span>
                            ))}
                            {profile.job_filters.keywords.length > 5 && (
                              <span className="text-[10px] text-gray-500 py-0.5">
                                +{profile.job_filters.keywords.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-gray-800/60 flex items-center justify-between gap-2 mt-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setIsNewProfile(false)
                            setEditingProfile(profile)
                          }}
                          className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                          title="Edit Profile"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProfile(profile.profile_id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleStartBot(profile.file_path || profile.profile_id)}
                        disabled={engineStatus !== 'online'}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-600/20 disabled:opacity-40"
                      >
                        <PlayCircle className="w-4 h-4" /> Run Bot Now
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 2: LOGS & DETAILED RUN REPORTS */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === 'logs' && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Logs List Sidebar */}
            <div className="bg-gray-900/40 rounded-2xl border border-gray-800/80 p-4 h-[650px] flex flex-col">
              <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" /> Log & Report Files
                </h3>
                <button
                  onClick={fetchLogsList}
                  className="text-gray-400 hover:text-white text-xs flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {logFiles.length === 0 ? (
                  <div className="text-center py-10 text-xs text-gray-500">No log files found.</div>
                ) : (
                  logFiles.map(log => (
                    <button
                      key={log.filename}
                      onClick={() => loadLogContent(log.filename)}
                      className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-1 ${
                        selectedLogFile === log.filename
                          ? 'bg-blue-600/10 border-blue-500/40 text-white'
                          : 'bg-black/20 border-gray-800/60 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                      }`}
                    >
                      <div className="font-semibold text-gray-200 truncate flex items-center justify-between">
                        <span>{log.filename}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                            log.type === 'json_report'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {log.type === 'json_report' ? 'Report' : 'Log'}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {new Date(log.modified_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} •{' '}
                        {(log.size_bytes / 1024).toFixed(1)} KB
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Log Content Viewer */}
            <div className="md:col-span-2 bg-[#0c0d14] rounded-2xl border border-gray-800/80 p-6 h-[650px] flex flex-col">
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-800">
                <div>
                  <h3 className="font-mono text-sm font-semibold text-white">
                    {selectedLogFile || 'Select a log file to view'}
                  </h3>
                  <p className="text-[11px] text-gray-500">Real-time candidate execution details</p>
                </div>
                {selectedLogFile && (
                  <button
                    onClick={() => loadLogContent(selectedLogFile)}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Reload Log
                  </button>
                )}
              </div>

              <div className="flex-1 bg-black/60 rounded-xl p-4 overflow-y-auto font-mono text-xs text-gray-300 leading-relaxed border border-gray-800/40 custom-scrollbar">
                {loadingLogContent ? (
                  <div className="text-center py-20 text-gray-500">Loading log contents...</div>
                ) : !selectedLogContent ? (
                  <div className="text-center py-20 text-gray-600">Select a log from the list on the left.</div>
                ) : Array.isArray(selectedLogContent.content) ? (
                  selectedLogContent.content.map((line: string, idx: number) => (
                    <div key={idx} className="py-0.5 hover:bg-white/5 transition-colors">
                      <span className="text-gray-600 select-none mr-3">{idx + 1}</span>
                      <span
                        className={
                          line.includes('Applied') || line.includes('✅')
                            ? 'text-emerald-400 font-semibold'
                            : line.includes('❌') || line.includes('Error')
                            ? 'text-red-400'
                            : line.includes('🚀')
                            ? 'text-blue-400 font-semibold'
                            : 'text-gray-300'
                        }
                      >
                        {line}
                      </span>
                    </div>
                  ))
                ) : (
                  <pre className="text-xs text-purple-300 whitespace-pre-wrap">
                    {JSON.stringify(selectedLogContent, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 3: SCHEDULER & ENGINE SETTINGS */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === 'scheduler' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl p-8 border border-gray-800/80 space-y-6">
              <h2 className="text-lg font-bold text-white border-b border-gray-800 pb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" /> Windows & Remote Scheduler Configuration
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-black/40 rounded-xl border border-gray-800">
                  <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Morning Job Trigger 1</div>
                  <div className="text-xl font-bold text-emerald-400">6:00 AM Daily</div>
                  <p className="text-[11px] text-gray-500 mt-1">Runs all active toggled candidate profiles in sequence</p>
                </div>

                <div className="p-4 bg-black/40 rounded-xl border border-gray-800">
                  <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Morning Job Trigger 2</div>
                  <div className="text-xl font-bold text-emerald-400">8:00 AM Daily</div>
                  <p className="text-[11px] text-gray-500 mt-1">Runs all active toggled candidate profiles in sequence</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
                  Local Engine Backend URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={engineUrl}
                    onChange={e => setEngineUrl(e.target.value)}
                    placeholder="http://localhost:8000"
                    className="flex-1 bg-black/40 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={checkEngineHealth}
                    className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-medium transition-colors"
                  >
                    Test Connection
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  When deployed on Vercel, point this to your computer's public tunnel URL (or keep http://localhost:8000
                  for local browser access).
                </p>
              </div>

              <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20 text-xs text-gray-300 space-y-2">
                <div className="font-semibold text-blue-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Single Command Execution (Mac & Windows)
                </div>
                <p>To start the backend Engine anywhere with Python 3.13 and uv:</p>
                <pre className="p-2.5 bg-black/60 rounded-lg text-emerald-400 font-mono text-[11px]">
                  uv run run.py
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* LIVE BOT TERMINAL MODAL */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isTerminalModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b0d14] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[75vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#12141f]">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <Terminal className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-200">
                      Live Bot Output — {activeJobProfile || 'Candidate Run'}
                    </h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        jobStatus === 'Running'
                          ? 'bg-blue-500/20 text-blue-400 animate-pulse'
                          : jobStatus.includes('Finished')
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : jobStatus.includes('Error') || jobStatus.includes('Failed')
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {jobStatus}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {jobStatus === 'Running' && (
                    <button
                      onClick={handleStopBot}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Stop Bot
                    </button>
                  )}
                  <button
                    onClick={() => setIsTerminalModalOpen(false)}
                    className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Terminal Logs Window */}
              <div className="flex-1 bg-black/80 p-5 overflow-y-auto font-mono text-xs leading-relaxed custom-scrollbar space-y-1">
                {logs.length === 0 ? (
                  <div className="text-gray-500 italic py-20 text-center">
                    Initiating job application process in Chromium...
                  </div>
                ) : (
                  logs.map((line, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-gray-600 select-none">{idx + 1}</span>
                      <span
                        className={
                          line.includes('Applied') || line.includes('✅')
                            ? 'text-emerald-400 font-semibold'
                            : line.includes('❌') || line.includes('Error')
                            ? 'text-red-400'
                            : line.includes('🚀')
                            ? 'text-blue-400 font-semibold'
                            : 'text-gray-300'
                        }
                      >
                        {line}
                      </span>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* PROFILE EDIT / ADD MODAL */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {editingProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0e101a] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8"
            >
              <form onSubmit={handleSaveProfile}>
                <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-[#141624]">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Edit className="w-4 h-4 text-blue-400" />
                    {isNewProfile ? 'Add New Candidate Profile' : `Edit Profile: ${editingProfile.name}`}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingProfile(null)}
                    className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-300">Candidate Name</label>
                      <input
                        type="text"
                        value={editingProfile.name || ''}
                        onChange={e => setEditingProfile({ ...editingProfile, name: e.target.value })}
                        required
                        className="w-full bg-black/40 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        placeholder="e.g. Koushik S R"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-300">Naukri Login Email</label>
                      <input
                        type="email"
                        value={editingProfile.email || ''}
                        onChange={e => setEditingProfile({ ...editingProfile, email: e.target.value })}
                        required
                        className="w-full bg-black/40 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-300">Naukri Password</label>
                      <input
                        type="password"
                        value={editingProfile.password || ''}
                        onChange={e => setEditingProfile({ ...editingProfile, password: e.target.value })}
                        required
                        className="w-full bg-black/40 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-300">Experience (Years)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={editingProfile.my_experience ?? editingProfile.experience ?? 0}
                        onChange={e =>
                          setEditingProfile({
                            ...editingProfile,
                            my_experience: parseFloat(e.target.value) || 0
                          })
                        }
                        className="w-full bg-black/40 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-300">Current Annual CTC (₹)</label>
                      <input
                        type="number"
                        value={editingProfile.current_ctc_annual ?? editingProfile.current_ctc ?? 0}
                        onChange={e =>
                          setEditingProfile({
                            ...editingProfile,
                            current_ctc_annual: parseInt(e.target.value) || 0
                          })
                        }
                        className="w-full bg-black/40 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-300">Expected Annual CTC (₹)</label>
                      <input
                        type="number"
                        value={editingProfile.expected_ctc_annual ?? editingProfile.expected_ctc ?? 0}
                        onChange={e =>
                          setEditingProfile({
                            ...editingProfile,
                            expected_ctc_annual: parseInt(e.target.value) || 0
                          })
                        }
                        className="w-full bg-black/40 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-300">Naukri Target Search URL</label>
                    <input
                      type="url"
                      value={editingProfile.search_url || ''}
                      onChange={e => setEditingProfile({ ...editingProfile, search_url: e.target.value })}
                      required
                      className="w-full bg-black/40 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      placeholder="https://www.naukri.com/machine-learning-jobs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-300">Resume PDF Path or URL</label>
                    <input
                      type="text"
                      value={editingProfile.resume_file || ''}
                      onChange={e => setEditingProfile({ ...editingProfile, resume_file: e.target.value })}
                      className="w-full bg-black/40 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      placeholder="data/resumes/candidate.pdf"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-900/60 rounded-xl border border-gray-800">
                    <input
                      type="checkbox"
                      id="dailyToggle"
                      checked={editingProfile.enabled_for_daily_run || false}
                      onChange={e =>
                        setEditingProfile({ ...editingProfile, enabled_for_daily_run: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-blue-600 bg-gray-800 border-gray-700"
                    />
                    <label htmlFor="dailyToggle" className="text-xs text-gray-300 select-none cursor-pointer">
                      Enable for 6:00 AM & 8:00 AM Daily Automated Runs
                    </label>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-800 bg-[#141624] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingProfile(null)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 shadow-md shadow-blue-600/20"
                  >
                    <Save className="w-4 h-4" /> {savingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
