'use client'

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import {
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Clock,
  Building2,
  MapPin,
  Laptop,
  Terminal,
  Copy,
  Check,
  Filter,
  X,
  Zap,
  AlertTriangle,
  Layers,
  ChevronDown,
  Info
} from 'lucide-react'
import { CandidateUser } from '../../../types'

interface CandidateApplicationLogsViewProps {
  usersList: CandidateUser[]
  selectedCandidateId: string | null
  onSelectCandidate: (userId: string) => void
  formatTimestamp: (ts: any) => string
}

interface JobRecord {
  id: string
  job_title: string
  company: string
  location: string
  job_url: string
  status: 'applied' | 'external' | 'failed' | 'naukri_daily_limit_reached' | string
  match_score: number
  applied_at: string
  raw_applied_at?: string
  task_id?: string | null
}

interface TaskMeta {
  task_id: string
  source: string
  status: string
  created_at: string | null
  started_at: string | null
  completed_at: string | null
  stats: Record<string, any>
  summary: string
  worker_host: string | null
  worker_device_brand: string | null
  worker_hardware_model: string | null
  worker_id: string | null
  worker_pid: number | null
  log_count: number
}

interface DiagnosticInfo {
  status: 'naukri_limit' | 'capped' | 'no_match' | 'circuit_breaker' | 'running' | 'paused' | 'ready'
  headline: string
  explanation: string
  remedy: string
  today_date_ist: string
  today_applied: number
  daily_limit: number
  is_naukri_limit_hit: boolean
  naukri_limit_reason: string
  is_capped: boolean
  is_circuit_breaker: boolean
}

interface CandidateProfileDetail {
  user_id: string
  name: string
  email: string
  plan: string
  plan_name: string
  daily_application_limit: number
  applied_today: number
  total_applied: number
  enabled_for_daily_run: boolean
  naukri_daily_limit_reached: boolean
  naukri_daily_limit_date: string | null
  naukri_daily_limit_reason: string | null
  naukri_login_fail_count: number
  last_automation_issue: any
  current_execution: any
}

export default function CandidateApplicationLogsView({
  usersList,
  selectedCandidateId,
  onSelectCandidate,
  formatTimestamp
}: CandidateApplicationLogsViewProps) {
  // Left Sidebar Filters
  const [candidateSearch, setCandidateSearch] = useState('')
  const [candidateFilter, setCandidateFilter] = useState<'all' | 'naukri_limit' | 'capped' | 'circuit_breaker' | 'applying'>('all')

  // Main Audit View State
  const [activeTab, setActiveTab] = useState<'jobs' | 'console'>('jobs')
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [resettingLimit, setResettingLimit] = useState(false)
  const [resettingBreaker, setResettingBreaker] = useState(false)

  // Data State
  const [candidateData, setCandidateData] = useState<CandidateProfileDetail | null>(null)
  const [diagnostic, setDiagnostic] = useState<DiagnosticInfo | null>(null)
  const [jobs, setJobs] = useState<JobRecord[]>([])
  const [jobsPagination, setJobsPagination] = useState({ page: 1, limit: 50, total: 0, has_more: false })
  const [tasks, setTasks] = useState<TaskMeta[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedTaskLogs, setSelectedTaskLogs] = useState<string[]>([])

  // Jobs Filter & Search
  const [jobStatusFilter, setJobStatusFilter] = useState<string>('all')
  const [jobSearchQuery, setJobSearchQuery] = useState<string>('')

  // Console Logs Filter & Search
  const [logFilter, setLogFilter] = useState<'all' | 'errors' | 'skipped' | 'applied' | 'search'>('all')
  const [logSearchQuery, setLogSearchQuery] = useState('')
  const [copiedLogs, setCopiedLogs] = useState(false)

  // Infinite Scroll Ref
  const jobsScrollRef = useRef<HTMLDivElement>(null)

  // Filtered Candidates on the Left Sidebar
  const filteredCandidates = useMemo(() => {
    return usersList.filter(u => {
      const q = candidateSearch.toLowerCase().trim()
      const matchesSearch = !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.user_id && u.user_id.toLowerCase().includes(q))

      if (!matchesSearch) return false

      if (candidateFilter === 'naukri_limit') {
        return Boolean(u.naukri_daily_limit_reached)
      }
      if (candidateFilter === 'capped') {
        const appliedToday = Number(u.applied_count || 0)
        const limit = Number(u.daily_application_limit || 50)
        return appliedToday >= limit && limit > 0
      }
      if (candidateFilter === 'circuit_breaker') {
        return Boolean(u.is_circuit_breaker || Number(u.naukri_login_fail_count || 0) >= 3)
      }
      if (candidateFilter === 'applying') {
        return u.current_execution?.status === 'running' || u.execution_summary?.status === 'applying'
      }

      return true
    })
  }, [usersList, candidateSearch, candidateFilter])

  // Count helper metrics for quick chips
  const metrics = useMemo(() => {
    let naukriLimit = 0
    let capped = 0
    let circuitBreaker = 0
    let applying = 0

    usersList.forEach(u => {
      if (u.naukri_daily_limit_reached) naukriLimit++
      const appliedToday = Number(u.applied_count || 0)
      const limit = Number(u.daily_application_limit || 50)
      if (appliedToday >= limit && limit > 0) capped++
      if (u.is_circuit_breaker || Number(u.naukri_login_fail_count || 0) >= 3) circuitBreaker++
      if (u.current_execution?.status === 'running' || u.execution_summary?.status === 'applying') applying++
    })

    return { naukriLimit, capped, circuitBreaker, applying }
  }, [usersList])

  // Fetch full candidate data (page 1)
  const fetchCandidateLogs = useCallback(async (userId: string, taskId?: string, page = 1, append = false) => {
    if (!userId) return
    if (page === 1) setLoading(true)
    else setLoadingMore(true)

    try {
      const params = new URLSearchParams()
      params.set('user_id', userId)
      params.set('page', String(page))
      params.set('limit', '50')
      if (jobStatusFilter !== 'all') params.set('status', jobStatusFilter)
      if (jobSearchQuery.trim()) params.set('search', jobSearchQuery.trim())
      if (taskId) params.set('task_id', taskId)

      const res = await fetch(`/api/admin/candidate-logs?${params.toString()}`, { credentials: 'same-origin' })
      if (!res.ok) throw new Error('Failed to load candidate logs')

      const data = await res.json()
      if (data.status === 'success') {
        setCandidateData(data.candidate)
        setDiagnostic(data.diagnostic)
        setTasks(data.tasks || [])
        setSelectedTaskId(data.selected_task_id)
        setSelectedTaskLogs(data.selected_task_logs || [])

        if (append) {
          setJobs(prev => [...prev, ...(data.jobs || [])])
        } else {
          setJobs(data.jobs || [])
        }

        setJobsPagination(data.pagination || { page: 1, limit: 50, total: 0, has_more: false })
      }
    } catch (err) {
      console.error('Error loading candidate logs:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [jobStatusFilter, jobSearchQuery])

  // Initial load when selectedCandidateId changes
  useEffect(() => {
    if (selectedCandidateId) {
      fetchCandidateLogs(selectedCandidateId, undefined, 1, false)
    } else if (usersList.length > 0 && !selectedCandidateId) {
      // Auto-select first candidate if none selected
      onSelectCandidate(usersList[0].user_id)
    }
  }, [selectedCandidateId, fetchCandidateLogs, usersList, onSelectCandidate])

  // Switch task run to inspect its specific console logs
  const handleSelectTask = (taskId: string) => {
    if (!selectedCandidateId) return
    setSelectedTaskId(taskId)
    fetchCandidateLogs(selectedCandidateId, taskId, 1, false)
  }

  // Infinite Scroll Trigger for Job Application Records
  const handleJobsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const reachedBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 100

    if (reachedBottom && jobsPagination.has_more && !loading && !loadingMore && selectedCandidateId) {
      fetchCandidateLogs(selectedCandidateId, selectedTaskId || undefined, jobsPagination.page + 1, true)
    }
  }

  // 1-Click Reset Naukri Daily Limit Flag
  const handleResetNaukriLimit = async () => {
    if (!selectedCandidateId) return
    setResettingLimit(true)
    try {
      const res = await fetch('/api/admin/candidate-logs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ user_id: selectedCandidateId, reset_naukri_limit: true })
      })
      if (res.ok) {
        await fetchCandidateLogs(selectedCandidateId, selectedTaskId || undefined, 1, false)
      }
    } catch (err) {
      console.error('Failed to reset Naukri limit flag:', err)
    } finally {
      setResettingLimit(false)
    }
  }

  // 1-Click Reset Circuit Breaker
  const handleResetCircuitBreaker = async () => {
    if (!selectedCandidateId) return
    setResettingBreaker(true)
    try {
      const res = await fetch('/api/admin/candidate-logs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ user_id: selectedCandidateId, reset_circuit_breaker: true })
      })
      if (res.ok) {
        await fetchCandidateLogs(selectedCandidateId, selectedTaskId || undefined, 1, false)
      }
    } catch (err) {
      console.error('Failed to reset circuit breaker:', err)
    } finally {
      setResettingBreaker(false)
    }
  }

  // Filter Console Logs
  const filteredConsoleLogs = useMemo(() => {
    return selectedTaskLogs.filter(line => {
      const text = line.toLowerCase()
      if (logSearchQuery && !text.includes(logSearchQuery.toLowerCase())) {
        return false
      }

      if (logFilter === 'errors') {
        return text.includes('🛑') || text.includes('💥') || text.includes('error') || text.includes('failed') || text.includes('limit')
      }
      if (logFilter === 'skipped') {
        return text.includes('⏭️') || text.includes('skip') || text.includes('mismatch') || text.includes('filtered out')
      }
      if (logFilter === 'applied') {
        return text.includes('🎉') || text.includes('applied') || text.includes('✅')
      }
      if (logFilter === 'search') {
        return text.includes('🔍') || text.includes('scan') || text.includes('page scan') || text.includes('match')
      }

      return true
    })
  }, [selectedTaskLogs, logFilter, logSearchQuery])

  // Copy Logs to Clipboard
  const handleCopyLogs = () => {
    if (selectedTaskLogs.length === 0) return
    navigator.clipboard.writeText(selectedTaskLogs.join('\n'))
    setCopiedLogs(true)
    setTimeout(() => setCopiedLogs(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* =========================================================================
          LEFT COLUMN: CANDIDATE SELECTOR WITH SEARCH & STATUS CHIPS (4 COLS)
      ========================================================================= */}
      <div className="lg:col-span-4 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 p-4 space-y-3.5 shadow-xl flex flex-col h-[740px]">
        {/* Header & Title */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 light:text-zinc-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Select Candidate</span>
            </h3>
            <p className="text-[11px] text-zinc-500 light:text-zinc-600">
              {filteredCandidates.length} candidate{filteredCandidates.length === 1 ? '' : 's'} found
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={candidateSearch}
            onChange={(e) => setCandidateSearch(e.target.value)}
            placeholder="Search name, email, or user id..."
            className="w-full pl-8.5 pr-8 py-2 rounded-xl bg-zinc-950 light:bg-zinc-50 border border-zinc-800 light:border-zinc-200 text-xs text-zinc-200 light:text-zinc-900 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/60"
          />
          {candidateSearch && (
            <button
              onClick={() => setCandidateSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap gap-1.5 pb-1">
          <button
            type="button"
            onClick={() => setCandidateFilter('all')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-colors cursor-pointer border ${
              candidateFilter === 'all'
                ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 border-zinc-700'
                : 'bg-black light:bg-white text-zinc-400 hover:text-zinc-200 border-zinc-800/80'
            }`}
          >
            All ({usersList.length})
          </button>
          <button
            type="button"
            onClick={() => setCandidateFilter('naukri_limit')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-colors cursor-pointer border flex items-center gap-1 ${
              candidateFilter === 'naukri_limit'
                ? 'bg-rose-950 text-rose-300 border-rose-700'
                : 'bg-black light:bg-white text-rose-400/80 hover:text-rose-300 border-rose-900/40'
            }`}
          >
            <ShieldAlert className="w-2.5 h-2.5" />
            <span>Naukri Limit ({metrics.naukriLimit})</span>
          </button>
          <button
            type="button"
            onClick={() => setCandidateFilter('capped')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-colors cursor-pointer border flex items-center gap-1 ${
              candidateFilter === 'capped'
                ? 'bg-amber-950 text-amber-300 border-amber-700'
                : 'bg-black light:bg-white text-amber-400/80 hover:text-amber-300 border-amber-900/40'
            }`}
          >
            <Clock className="w-2.5 h-2.5" />
            <span>Capped ({metrics.capped})</span>
          </button>
          <button
            type="button"
            onClick={() => setCandidateFilter('circuit_breaker')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-colors cursor-pointer border flex items-center gap-1 ${
              candidateFilter === 'circuit_breaker'
                ? 'bg-rose-950 text-rose-300 border-rose-700'
                : 'bg-black light:bg-white text-zinc-400 hover:text-zinc-200 border-zinc-800/80'
            }`}
          >
            <Zap className="w-2.5 h-2.5" />
            <span>Breaker ({metrics.circuitBreaker})</span>
          </button>
        </div>

        {/* Candidate Scroll List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filteredCandidates.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-zinc-500 text-xs">
              <AlertCircle className="w-6 h-6 mb-2 opacity-50" />
              <span>No candidates match filter.</span>
            </div>
          ) : (
            filteredCandidates.map((u) => {
              const isSelected = selectedCandidateId === u.user_id
              const isLimit = Boolean(u.naukri_daily_limit_reached)
              const appliedToday = Number(u.applied_count || 0)
              const limit = Number(u.daily_application_limit || 50)
              const isCapped = appliedToday >= limit && limit > 0
              const isBreaker = Boolean(u.is_circuit_breaker || Number(u.naukri_login_fail_count || 0) >= 3)
              const isRunning = u.current_execution?.status === 'running' || u.execution_summary?.status === 'applying'

              return (
                <button
                  key={u.user_id}
                  onClick={() => onSelectCandidate(u.user_id)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer border flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-zinc-800/95 light:bg-zinc-100 text-white light:text-zinc-900 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                      : 'bg-zinc-950/80 light:bg-white hover:bg-zinc-900 light:hover:bg-zinc-50 text-zinc-300 light:text-zinc-700 border-zinc-800/80 light:border-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs truncate text-white light:text-zinc-900">
                      {u.name || u.user_id}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                      {appliedToday}/{limit} today
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 text-[10px] text-zinc-500 light:text-zinc-600 font-mono">
                    <span className="truncate max-w-[170px]">{u.email}</span>
                    <span className="shrink-0">{u.total_applied || 0} total</span>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {isRunning && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-0.5">
                        <Sparkles className="w-2 h-2 animate-spin" />
                        <span>APPLYING NOW</span>
                      </span>
                    )}
                    {isLimit && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-950 text-rose-300 border border-rose-800 font-bold flex items-center gap-0.5" title={u.naukri_daily_limit_reason || 'Naukri limit hit'}>
                        <ShieldAlert className="w-2 h-2 text-rose-400" />
                        <span>NAUKRI LIMIT</span>
                      </span>
                    )}
                    {isCapped && !isLimit && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
                        CAPPED ({limit})
                      </span>
                    )}
                    {isBreaker && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-950/80 text-rose-300 border border-rose-800">
                        BREAKER ({u.naukri_login_fail_count || 3} fails)
                      </span>
                    )}
                    {u.enabled_for_daily_run === false && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800">
                        AUTO-APPLY OFF
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* =========================================================================
          RIGHT COLUMN: DIAGNOSTIC CARD, JOB RECORDS & EXECUTION LOGS (8 COLS)
      ========================================================================= */}
      <div className="lg:col-span-8 space-y-4">
        {/* TOP CANDIDATE AUDIT BAR */}
        <div className="rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white light:text-zinc-900">
                  {candidateData?.name || selectedCandidateId || 'Candidate Audit'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 light:bg-zinc-200 text-zinc-300 light:text-zinc-800 border border-zinc-700">
                  {candidateData?.plan_name || 'Standard'}
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  {candidateData?.user_id}
                </span>
              </div>
              <p className="text-xs text-zinc-400 light:text-zinc-600 font-mono mt-0.5">
                {candidateData?.email}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                  Today Applied / Cap
                </div>
                <div className="text-base font-bold text-emerald-400 font-mono">
                  {candidateData?.applied_today ?? 0} <span className="text-zinc-500 text-xs">/ {candidateData?.daily_application_limit ?? 50}</span>
                </div>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div className="text-right">
                <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                  Lifetime Total
                </div>
                <div className="text-base font-bold text-cyan-400 font-mono">
                  {candidateData?.total_applied ?? 0}
                </div>
              </div>
              <button
                type="button"
                onClick={() => selectedCandidateId && fetchCandidateLogs(selectedCandidateId, selectedTaskId || undefined, 1, false)}
                disabled={loading}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer ml-1"
                title="Refresh logs & telemetry"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* DIAGNOSTIC CARD: EXPLAINS WHY IT STOPPED (NO MATCH / CAP / NAUKRI LIMIT) */}
          {diagnostic && (
            <div className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
              diagnostic.status === 'naukri_limit'
                ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                : diagnostic.status === 'capped'
                ? 'bg-amber-950/30 border-amber-800/70 text-amber-200'
                : diagnostic.status === 'no_match'
                ? 'bg-orange-950/30 border-orange-800/70 text-orange-200'
                : diagnostic.status === 'circuit_breaker'
                ? 'bg-red-950/40 border-red-800/80 text-red-200'
                : diagnostic.status === 'running'
                ? 'bg-cyan-950/30 border-cyan-800/70 text-cyan-200'
                : 'bg-emerald-950/20 border-emerald-800/60 text-emerald-200'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  {diagnostic.status === 'naukri_limit' && <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                  {diagnostic.status === 'capped' && <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                  {diagnostic.status === 'no_match' && <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />}
                  {diagnostic.status === 'circuit_breaker' && <Zap className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                  {diagnostic.status === 'running' && <Sparkles className="w-4 h-4 text-cyan-400 animate-spin shrink-0 mt-0.5" />}
                  {diagnostic.status === 'ready' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                  <div>
                    <h4 className="font-bold text-white text-xs">
                      {diagnostic.headline}
                    </h4>
                    <p className="text-[11px] opacity-90 mt-1 leading-relaxed">
                      {diagnostic.explanation}
                    </p>
                    <p className="text-[10px] opacity-75 font-mono mt-1">
                      💡 {diagnostic.remedy}
                    </p>
                  </div>
                </div>

                {/* 1-Click Action Buttons */}
                <div className="shrink-0 flex items-center gap-2">
                  {diagnostic.is_naukri_limit_hit && (
                    <button
                      type="button"
                      disabled={resettingLimit}
                      onClick={handleResetNaukriLimit}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-[11px] font-bold shadow transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Clear Naukri limit flag from database to allow immediate manual re-trigger"
                    >
                      <Zap className="w-3 h-3" />
                      <span>{resettingLimit ? 'Resetting...' : 'Reset Limit Flag'}</span>
                    </button>
                  )}
                  {diagnostic.is_circuit_breaker && (
                    <button
                      type="button"
                      disabled={resettingBreaker}
                      onClick={handleResetCircuitBreaker}
                      className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-[11px] font-bold shadow transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Reset login failure count to 0 and re-enable sweeps"
                    >
                      <Zap className="w-3 h-3" />
                      <span>{resettingBreaker ? 'Resetting...' : 'Reset Breaker'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW SWITCHER TABS: JOB RECORDS vs ENGINE CONSOLE LOGS */}
          <div className="flex items-center gap-2 border-b border-zinc-800 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('jobs')}
              className={`px-4 py-2 font-mono text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'jobs'
                  ? 'border-cyan-400 text-white bg-zinc-900/60 rounded-t-lg'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Job Application Records ({jobsPagination.total})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('console')}
              className={`px-4 py-2 font-mono text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'console'
                  ? 'border-cyan-400 text-white bg-zinc-900/60 rounded-t-lg'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Engine Execution Console Logs ({selectedTaskLogs.length})</span>
            </button>
          </div>
        </div>

        {/* =====================================================================
            TAB 1: JOB APPLICATION RECORDS WITH INFINITE SCROLL
        ===================================================================== */}
        {activeTab === 'jobs' && (
          <div className="rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 p-4 shadow-xl space-y-3.5">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-zinc-500 font-mono mr-1">Status:</span>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'applied', label: 'Applied' },
                  { key: 'external', label: 'External Redirect' },
                  { key: 'naukri_daily_limit_reached', label: 'Naukri Limit Hit' },
                  { key: 'failed', label: 'Failed' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setJobStatusFilter(key)
                      if (selectedCandidateId) {
                        fetchCandidateLogs(selectedCandidateId, selectedTaskId || undefined, 1, false)
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-colors cursor-pointer border ${
                      jobStatusFilter === key
                        ? 'bg-zinc-800 text-white border-zinc-700 font-semibold'
                        : 'bg-black text-zinc-400 hover:text-zinc-200 border-zinc-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Job Search Input */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={jobSearchQuery}
                  onChange={(e) => setJobSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && selectedCandidateId) {
                      fetchCandidateLogs(selectedCandidateId, selectedTaskId || undefined, 1, false)
                    }
                  }}
                  placeholder="Filter by role or company..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/60"
                />
                {jobSearchQuery && (
                  <button
                    onClick={() => {
                      setJobSearchQuery('')
                      if (selectedCandidateId) fetchCandidateLogs(selectedCandidateId, selectedTaskId || undefined, 1, false)
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Infinite Scroll Container */}
            <div
              ref={jobsScrollRef}
              onScroll={handleJobsScroll}
              className="h-[520px] overflow-y-auto space-y-2 pr-1.5"
            >
              {loading && jobs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mb-2" />
                  <span>Loading job application history...</span>
                </div>
              ) : jobs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs text-center p-6">
                  <AlertCircle className="w-8 h-8 mb-2 opacity-40 text-zinc-400" />
                  <span className="font-semibold text-zinc-300">No job records found.</span>
                  <span className="text-[11px] text-zinc-500 mt-1">
                    Try clearing search or status filters.
                  </span>
                </div>
              ) : (
                <>
                  {jobs.map((job, idx) => {
                    const isLimitStatus = job.status === 'naukri_daily_limit_reached'
                    const isApplied = job.status === 'applied'
                    const isExternal = job.status === 'external'
                    const isFailed = job.status === 'failed'

                    return (
                      <div
                        key={job.id || idx}
                        className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isLimitStatus
                            ? 'bg-rose-950/20 border-rose-800/60'
                            : isApplied
                            ? 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700'
                            : isExternal
                            ? 'bg-sky-950/20 border-sky-800/60'
                            : 'bg-zinc-950 border-zinc-800'
                        }`}
                      >
                        {/* Role, Company, Location */}
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-xs truncate max-w-[320px]">
                              {job.job_title}
                            </span>
                            {job.job_url && (
                              <a
                                href={job.job_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-0.5 text-[10px] font-mono"
                                title="View live Naukri job posting"
                              >
                                <span>Posting</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
                            <span className="flex items-center gap-1 text-zinc-300">
                              <Building2 className="w-3 h-3 text-zinc-500 shrink-0" />
                              <span className="truncate max-w-[200px]">{job.company}</span>
                            </span>
                            {job.location && job.location !== 'Not Specified' && (
                              <span className="flex items-center gap-1 text-zinc-400">
                                <MapPin className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                                <span className="truncate max-w-[150px]">{job.location}</span>
                              </span>
                            )}
                            <span className="text-[10px] text-zinc-500">
                              {job.applied_at}
                            </span>
                          </div>
                        </div>

                        {/* Status, Score & Quick Task Log View */}
                        <div className="flex items-center gap-2.5 shrink-0 sm:self-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-emerald-400 font-bold" title="Normalized ATS Compatibility Match">
                            {job.match_score}% Match
                          </span>

                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                            isApplied
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              : isExternal
                              ? 'bg-sky-950/80 text-sky-300 border border-sky-800'
                              : isLimitStatus
                              ? 'bg-rose-950 text-rose-300 border border-rose-700'
                              : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                          }`}>
                            {isLimitStatus && <ShieldAlert className="w-3 h-3 text-rose-400" />}
                            {isApplied && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                            <span>
                              {isLimitStatus
                                ? 'NAUKRI LIMIT HIT'
                                : isApplied
                                ? 'APPLIED'
                                : isExternal
                                ? 'EXTERNAL'
                                : job.status}
                            </span>
                          </span>

                          {job.task_id && (
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectTask(job.task_id!)
                                setActiveTab('console')
                              }}
                              className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 border border-zinc-800 text-[10px] font-mono cursor-pointer"
                              title="Jump to engine execution logs for this specific sweep"
                            >
                              <Terminal className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Scroll End / Loader Indicator */}
                  {loadingMore && (
                    <div className="p-3 text-center text-xs font-mono text-cyan-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading more records as you scroll...</span>
                    </div>
                  )}

                  {!jobsPagination.has_more && jobs.length > 0 && (
                    <div className="p-3 text-center text-[11px] font-mono text-zinc-500">
                      ✓ Showing all {jobsPagination.total} application records
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: ENGINE EXECUTION CONSOLE LOGS (TASK BOT OUTPUT)
        ===================================================================== */}
        {activeTab === 'console' && (
          <div className="rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 p-4 shadow-xl space-y-3.5">
            {/* Task Sweep Selector Dropdown & Info Banner */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs text-zinc-400 font-mono shrink-0">Sweep Run:</span>
                <select
                  value={selectedTaskId || ''}
                  onChange={(e) => handleSelectTask(e.target.value)}
                  className="bg-black border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-cyan-500/60 max-w-sm truncate"
                >
                  {tasks.map((t) => (
                    <option key={t.task_id} value={t.task_id}>
                      {formatTimestamp(t.created_at)} · {t.source} ({t.status}) · {t.log_count} logs
                    </option>
                  ))}
                </select>
              </div>

              {/* Copy Logs Button */}
              <button
                type="button"
                onClick={handleCopyLogs}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copiedLogs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLogs ? 'Copied!' : 'Copy Console Logs'}</span>
              </button>
            </div>

            {/* Task Details Metadata Header */}
            {selectedTaskId && (() => {
              const taskObj = tasks.find(t => t.task_id === selectedTaskId)
              if (!taskObj) return null

              return (
                <div className="p-3 rounded-xl bg-black border border-zinc-800/80 text-[11px] font-mono space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap text-zinc-400">
                    <div>
                      <span className="text-zinc-500">Worker: </span>
                      <span className="text-zinc-200 font-bold">{taskObj.worker_id || taskObj.worker_host || 'Fleet worker'}</span>
                      {taskObj.worker_hardware_model && (
                        <span className="text-zinc-500"> ({taskObj.worker_hardware_model})</span>
                      )}
                    </div>
                    <div>
                      <span className="text-zinc-500">Status: </span>
                      <span className={`font-bold uppercase ${
                        taskObj.status === 'completed' ? 'text-emerald-400' : taskObj.status === 'failed' ? 'text-rose-400' : 'text-zinc-300'
                      }`}>
                        {taskObj.status}
                      </span>
                    </div>
                  </div>
                  {taskObj.summary && (
                    <div className="text-zinc-300 bg-zinc-950 p-2 rounded border border-zinc-850">
                      <span className="text-zinc-500">Summary: </span>
                      <span>{taskObj.summary}</span>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Log Category Filter Chips & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex flex-wrap gap-1">
                {[
                  { key: 'all', label: 'All Logs' },
                  { key: 'errors', label: '🛑 Limits & Errors' },
                  { key: 'skipped', label: '⏭️ Skipped Jobs' },
                  { key: 'applied', label: '🎉 Applied' },
                  { key: 'search', label: '🔍 Scans & Matches' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLogFilter(key as any)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-colors cursor-pointer border ${
                      logFilter === key
                        ? 'bg-zinc-800 text-white border-zinc-700 font-semibold'
                        : 'bg-black text-zinc-400 hover:text-zinc-200 border-zinc-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[180px]">
                <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder="Search in log text..."
                  className="w-full pl-7 pr-6 py-1 rounded bg-black border border-zinc-800 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/60 font-mono"
                />
                {logSearchQuery && (
                  <button
                    onClick={() => setLogSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Terminal View with Full Scroll */}
            <div className="h-[460px] overflow-y-auto rounded-xl bg-black border border-zinc-850 p-4 font-mono text-[11px] space-y-1 leading-relaxed text-zinc-300 shadow-inner">
              {loading ? (
                <div className="h-full flex items-center justify-center text-zinc-500">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 mr-2" />
                  <span>Loading console logs...</span>
                </div>
              ) : filteredConsoleLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center">
                  <Terminal className="w-6 h-6 mb-2 opacity-40 text-zinc-400" />
                  <span>No log entries matching filter.</span>
                </div>
              ) : (
                filteredConsoleLogs.map((line, idx) => {
                  const isErr = line.includes('🛑') || line.includes('💥') || line.toLowerCase().includes('limit reached') || line.toLowerCase().includes('error')
                  const isSuccess = line.includes('🎉') || line.includes('✅') || line.toLowerCase().includes('applied!')
                  const isSkip = line.includes('⏭️') || line.toLowerCase().includes('skipped')
                  const isSearch = line.includes('🔍') || line.includes('📋') || line.toLowerCase().includes('match:')

                  return (
                    <div
                      key={idx}
                      className={`whitespace-pre-wrap break-all px-1.5 py-0.5 rounded transition-colors ${
                        isErr
                          ? 'bg-rose-950/60 text-rose-300 border-l-2 border-rose-500 font-semibold'
                          : isSuccess
                          ? 'text-emerald-300 font-semibold'
                          : isSkip
                          ? 'text-amber-300/90'
                          : isSearch
                          ? 'text-cyan-300/90'
                          : 'text-zinc-300'
                      }`}
                    >
                      <span className="text-zinc-600 select-none mr-2 font-mono text-[10px]">
                        {(idx + 1).toString().padStart(3, '0')}
                      </span>
                      {line}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
