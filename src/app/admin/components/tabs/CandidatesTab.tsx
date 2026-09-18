'use client'

import React from 'react'
import {
  Search,
  X,
  User,
  Filter,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Crown,
  Users,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Tag,
  ToggleRight,
  ToggleLeft,
  FileText,
  ExternalLink,
  Eye,
  Send,
  Edit,
  Trash2,
  Server,
  Zap,
  Cpu,
  Laptop
} from 'lucide-react'
import { CandidateUser } from '../../types'

interface CandidatesTabProps {
  userSearch: string
  setUserSearch: (val: string) => void
  usersList: CandidateUser[]
  loadingUsers: boolean
  candidateStatusFilter: string
  setCandidateStatusFilter: (val: string) => void
  executionStatusFilter?: string
  setExecutionStatusFilter?: (val: string) => void
  showStatusGuide: boolean
  setShowStatusGuide: (val: boolean) => void
  candidatesTableCollapsed: boolean
  toggleCandidatesTable: () => void
  selectedCandidateId: string | null
  setSelectedCandidateId: (id: string | null) => void
  formatTimestamp: (ts: any) => string
  handleChangePlan: (userId: string, plan: string) => Promise<void>
  handleToggleVip: (userId: string, isVip: boolean) => Promise<void>
  handleToggleDaily: (userId: string, currentState: boolean) => Promise<void>
  handleInspectCandidate: (candidate: any) => void
  handleDeleteUser: (userId: string) => Promise<void>
  setEditingUser: (u: any) => void
  dispatchReportLoading: boolean
  onOpenDispatchReportForUser: (email: string) => void
  onTriggerOnDemand?: (userId: string, force: boolean) => Promise<void>
  actionProcessingId?: string | null
}

export default function CandidatesTab({
  userSearch,
  setUserSearch,
  usersList,
  loadingUsers,
  candidateStatusFilter,
  setCandidateStatusFilter,
  executionStatusFilter,
  setExecutionStatusFilter,
  showStatusGuide,
  setShowStatusGuide,
  candidatesTableCollapsed,
  toggleCandidatesTable,
  selectedCandidateId,
  setSelectedCandidateId,
  formatTimestamp,
  handleChangePlan,
  handleToggleVip,
  handleToggleDaily,
  handleInspectCandidate,
  handleDeleteUser,
  setEditingUser,
  dispatchReportLoading,
  onOpenDispatchReportForUser,
  onTriggerOnDemand,
  actionProcessingId
}: CandidatesTabProps) {
  // Execution status filter state
  const [internalExecFilter, setInternalExecFilter] = React.useState<string>(() => {
    try {
      return localStorage.getItem('admin_candidate_exec_filter') || 'all'
    } catch {
      return 'all'
    }
  })
  const activeExecFilter = executionStatusFilter ?? internalExecFilter
  const handleSetExecFilter = (val: string) => {
    if (setExecutionStatusFilter) {
      setExecutionStatusFilter(val)
    } else {
      setInternalExecFilter(val)
    }
    try {
      localStorage.setItem('admin_candidate_exec_filter', val)
    } catch {}
  }

  // Pre-calculate real-time execution counts for filters
  const countApplying = usersList.filter(u => u.execution_summary?.status === 'applying' || u.current_execution?.status === 'applying').length
  const countAppliedToday = usersList.filter(u => u.execution_summary?.status === 'applied_today' || u.execution_summary?.is_applied_today || (u.applied_today && u.applied_today > 0)).length
  const countInQueue = usersList.filter(u => u.execution_summary?.status === 'in_queue' || u.execution_summary?.is_in_queue).length
  const countDisabled = usersList.filter(u => u.enabled_for_daily_run === false).length
  const countPaymentRequired = usersList.filter(u => u.execution_summary?.status === 'payment_required' || u.plan_expiry_status === 'expired' || u.plan_expiry_status === 'no_plan').length
  const countNotAppliedToday = usersList.filter(u => {
    const st = u.execution_summary?.status
    if (st) return st === 'not_applied_today'
    return u.current_execution?.status !== 'applying' && (!u.applied_today || u.applied_today === 0) && u.enabled_for_daily_run !== false && u.plan_expiry_status !== 'expired' && u.plan_expiry_status !== 'no_plan'
  }).length

  // Filter users by search, execution status, and plan status
  const filteredUsers = usersList.filter(u => {
    // 1. Search Query Match
    const q = userSearch.toLowerCase().trim()
    const matchesSearch = !q || (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.user_id && u.user_id.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.execution_summary?.device && u.execution_summary.device.toLowerCase().includes(q)) ||
      (u.execution_summary?.hostname && u.execution_summary.hostname.toLowerCase().includes(q)) ||
      (u.execution_summary?.device_brand && u.execution_summary.device_brand.toLowerCase().includes(q)) ||
      (u.execution_summary?.hardware_model && u.execution_summary.hardware_model.toLowerCase().includes(q)) ||
      (u.execution_summary?.mac_address && u.execution_summary.mac_address.toLowerCase().includes(q)) ||
      (u.current_execution?.hostname && u.current_execution.hostname.toLowerCase().includes(q)) ||
      (u.last_execution?.hostname && u.last_execution.hostname.toLowerCase().includes(q)) ||
      (u.last_execution?.device_brand && u.last_execution.device_brand.toLowerCase().includes(q)) ||
      (u.last_execution?.mac_address && u.last_execution.mac_address.toLowerCase().includes(q))
    )
    if (!matchesSearch) return false

    // 2. Execution Status Filter
    if (activeExecFilter !== 'all') {
      const summary = u.execution_summary
      const isApp = summary?.is_applying || u.current_execution?.status === 'applying'
      const isDone = summary?.is_applied_today || (u.applied_today && u.applied_today > 0)
      const isQueued = summary?.is_in_queue || summary?.status === 'in_queue'

      if (activeExecFilter === 'applying' && !isApp) return false
      if (activeExecFilter === 'applied_today' && (!isDone || isApp)) return false
      if (activeExecFilter === 'in_queue' && !isQueued) return false
      if (activeExecFilter === 'disabled' && u.enabled_for_daily_run !== false) return false
      if (activeExecFilter === 'payment_required' && u.plan_expiry_status !== 'expired' && u.plan_expiry_status !== 'no_plan' && summary?.status !== 'payment_required') return false
      if (activeExecFilter === 'not_applied_today') {
        if (isApp || isDone || isQueued || u.enabled_for_daily_run === false || u.plan_expiry_status === 'expired' || u.plan_expiry_status === 'no_plan') {
          return false
        }
      }
    }

    // 3. Plan & Expiry Status Filter
    if (candidateStatusFilter === 'all') return true
    if (candidateStatusFilter === 'active') return u.plan_expiry_status === 'active'
    if (candidateStatusFilter === 'expiring') return u.plan_expiry_status === 'expiring_soon_2d' || u.plan_expiry_status === 'expiring_soon_1d'
    if (candidateStatusFilter === 'urgent') return u.plan_expiry_status === 'expiring_soon_1d'
    if (candidateStatusFilter === 'expired') return u.plan_expiry_status === 'expired'
    if (candidateStatusFilter === 'vip') return u.is_vip || u.plan === 'vip' || u.plan_expiry_status === 'vip_lifetime'
    if (candidateStatusFilter === 'no_plan') return u.plan_expiry_status === 'no_plan' || u.plan === 'none' || u.plan === 'no_plan'

    return true
  })

  return (
    <div className="space-y-4">
      {/* Search & Status Filters Header */}
      <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-3 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, user ID, or server hostname..."
              value={userSearch}
              onChange={e => {
                const val = e.target.value
                setUserSearch(val)
                try {
                  localStorage.setItem('admin_candidate_search', val)
                } catch {}
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {userSearch && (
              <button
                type="button"
                onClick={() => {
                  setUserSearch('')
                  try {
                    localStorage.removeItem('admin_candidate_search')
                  } catch {}
                }}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-400 hidden lg:block">
              Auto-scheduled runs: <span className="text-emerald-400 font-semibold">Daily at 06:00 AM &amp; 08:00 AM IST</span>
            </div>
            <button
              type="button"
              onClick={() => setEditingUser({ isNew: true, user_id: '' })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              <User className="w-4 h-4" /> Create Candidate
            </button>
          </div>
        </div>

        {/* Bot Execution & Multi-Server Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-zinc-900">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-sky-400 uppercase mr-1 flex items-center gap-1 font-bold">
              <Cpu className="w-3 h-3 text-sky-400" /> Bot Execution:
            </span>
            {[
              { key: 'all', label: 'All Candidates', count: usersList.length, color: 'text-zinc-300' },
              { key: 'applying', label: '⚡ Applying Live', count: countApplying, color: 'text-sky-400 font-bold', pulse: true },
              { key: 'applied_today', label: '✓ Applied Today', count: countAppliedToday, color: 'text-emerald-400 font-bold' },
              { key: 'in_queue', label: '⏳ In Queue', count: countInQueue, color: 'text-amber-400 font-bold' },
              { key: 'not_applied_today', label: '⚠️ Not Applied Today', count: countNotAppliedToday, color: 'text-amber-200' },
              { key: 'payment_required', label: '💳 Payment Required', count: countPaymentRequired, color: 'text-rose-400' },
              { key: 'disabled', label: '⏸️ Bot Off', count: countDisabled, color: 'text-zinc-400' }
            ].map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => handleSetExecFilter(f.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeExecFilter === f.key
                    ? 'bg-sky-950/80 text-white border border-sky-500 font-bold shadow-md shadow-sky-500/20'
                    : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-900 hover:border-zinc-800'
                }`}
              >
                {f.pulse && f.count > 0 && <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping mr-0.5" />}
                <span>{f.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full bg-black/60 font-bold ${f.color}`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowStatusGuide(!showStatusGuide)}
            className="text-xs text-zinc-400 hover:text-amber-300 flex items-center gap-1 transition-colors font-mono cursor-pointer ml-auto"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>{showStatusGuide ? 'Hide Status Legend' : 'Status & Server Guide'}</span>
          </button>
        </div>

        {/* Plan / Subscription Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-zinc-900/60">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-zinc-500 uppercase mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-zinc-400" /> Plan Filter:
            </span>
            {[
              { key: 'all', label: 'All Plans', count: usersList.length, color: 'text-zinc-300' },
              { key: 'active', label: 'Active Plan', count: usersList.filter(u => u.plan_expiry_status === 'active').length, color: 'text-emerald-400' },
              { key: 'expiring', label: 'Expiring 1-2d', count: usersList.filter(u => u.plan_expiry_status === 'expiring_soon_2d' || u.plan_expiry_status === 'expiring_soon_1d').length, color: 'text-amber-300' },
              { key: 'urgent', label: 'Urgent <24h', count: usersList.filter(u => u.plan_expiry_status === 'expiring_soon_1d').length, color: 'text-rose-300' },
              { key: 'expired', label: 'Expired', count: usersList.filter(u => u.plan_expiry_status === 'expired').length, color: 'text-rose-400' },
              { key: 'vip', label: 'VIP Pass (90d)', count: usersList.filter(u => u.is_vip || u.plan === 'vip' || u.plan_expiry_status === 'vip_lifetime').length, color: 'text-amber-400' },
              { key: 'no_plan', label: 'No Plan', count: usersList.filter(u => u.plan_expiry_status === 'no_plan' || u.plan === 'none' || u.plan === 'no_plan').length, color: 'text-zinc-400' }
            ].map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  setCandidateStatusFilter(f.key)
                  try {
                    localStorage.setItem('admin_candidate_status_filter', f.key)
                  } catch {}
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  candidateStatusFilter === f.key
                    ? 'bg-zinc-800 text-white border border-zinc-700 font-bold shadow-sm'
                    : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-900 hover:border-zinc-800'
                }`}
              >
                <span>{f.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full bg-black/60 font-bold ${f.color}`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Expandable Status Legend Guide */}
        {showStatusGuide && (
          <div className="p-4 rounded-xl bg-black/80 border border-amber-500/30 text-xs space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Candidate Plan Expiry Status &amp; Visual Indicator Guide</span>
              </span>
              <button
                type="button"
                onClick={() => setShowStatusGuide(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-sky-900/40 space-y-1">
                <div className="flex items-center gap-1.5 text-sky-300 font-bold font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>⚡ Applying Live (Server Identity)</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Candidate actively claimed by a server machine (e.g. <span className="text-zinc-200 font-mono">macs-MacBook-Air.local</span>). Protected from duplicate execution across servers via atomic lock.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 border border-emerald-900/40 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>✓ Applied Today (Completed)</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Daily run successfully executed for today&apos;s IST cycle. Machine identity, PID, and completion timestamp are permanently saved.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 border border-amber-800/40 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>⏳ In Queue / Scheduled</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Pending in the automated queue, or waiting for scheduled morning run (06:00 AM / 08:00 AM IST).
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 border border-emerald-900/40 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Active Plan (Xd left)</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Paid plan with &gt; 48 hours remaining. Protected from discount offers to avoid cannibalizing subscription value.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 border border-amber-800/40 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Expiring: 1-2d (36h left)</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Plan expiring within 24–48 hours. Prime window to send retention renewal offers and automated reminders.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 border border-rose-800/50 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-300 font-bold font-mono">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                  <span>Expiring: &lt;24h left (Red Pulse)</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Urgent final 24-hour expiration countdown. Critical retention period before candidate&apos;s daily apply halts.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 border border-rose-900/60 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold font-mono">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Plan Expired</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Validity ended. Candidate is paused and eligible for win-back discount offers and immediate reactivation.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 border border-amber-500/30 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold font-mono">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>VIP Pass (3 Months / 90d)</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Candidate holds an active VIP access pass (90 days). Renewable upon completion.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-400 font-bold font-mono">
                  <Server className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Multi-Server Distributed Execution</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Any server or device running backend workers records its unique machine name, worker ID, and OS platform.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Candidates Table */}
      <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
        <div 
          onClick={toggleCandidatesTable}
          className="px-5 py-4 bg-zinc-950 hover:bg-zinc-900/60 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition-colors"
        >
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Candidate Profiles Directory</span>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                {filteredUsers.length} profiles
              </span>
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live candidate profiles, automated apply status, ATS resumes, and daily job report actions.
            </p>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleCandidatesTable()
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              {candidatesTableCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Expand</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        </div>

        {candidatesTableCollapsed && (
          <div 
            onClick={toggleCandidatesTable}
            className="px-5 py-3 bg-zinc-900/30 hover:bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span>Table shrunk (<strong>{filteredUsers.length}</strong> candidate profiles hidden) &bull; Click anywhere on head to expand</span>
            </div>
            <span className="text-sky-400 font-semibold flex items-center gap-1">
              <span>Expand Table</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </span>
          </div>
        )}

        {!candidatesTableCollapsed && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead 
                onClick={toggleCandidatesTable}
                className="cursor-pointer group select-none"
                title="Click table head to shrink / expand"
              >
                <tr className="bg-slate-950 group-hover:bg-zinc-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 transition-colors">
                  <th className="py-3.5 px-4 flex items-center gap-1">
                    <span>Candidate</span>
                    <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-sky-400 transition-colors" />
                  </th>
                  <th className="py-3.5 px-4">Portal Email</th>
                  <th className="py-3.5 px-4">Bot &amp; Server</th>
                  <th className="py-3.5 px-4">Plan &amp; Access</th>
                  <th className="py-3.5 px-4 text-center">Auto-Apply</th>
                  <th className="py-3.5 px-4">Last Login</th>
                  <th className="py-3.5 px-4">Profile &amp; Resume</th>
                  <th className="py-3.5 px-4 text-center">Today / Total</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
                      Loading candidate profiles...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No candidate profiles match your search query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => (
                    <tr
                      key={u.user_id || idx}
                      onClick={() => {
                        setSelectedCandidateId(u.user_id)
                        try {
                          localStorage.setItem('admin_selected_candidate_id', u.user_id)
                        } catch {}
                      }}
                      className={`transition-colors cursor-pointer ${
                        selectedCandidateId === u.user_id
                          ? 'bg-indigo-950/40 border-l-2 border-l-indigo-500 ring-1 ring-indigo-500/30'
                          : 'hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="py-4 px-4 font-bold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {u.name ? u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{u.name || u.user_id}</span>
                            {selectedCandidateId === u.user_id && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 font-mono font-bold">
                                SELECTED
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">{u.user_id}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-300 font-mono">
                        {u.email}
                      </td>
                      {/* Bot Execution & Server Identity Status */}
                      <td className="py-4 px-4">
                        {(() => {
                          const summary = u.execution_summary || {}
                          const isApplying = summary.is_applying || u.current_execution?.status === 'applying'
                          const isAppliedToday = summary.is_applied_today || (u.applied_today && u.applied_today > 0)
                          const isInQueue = summary.is_in_queue || summary.status === 'in_queue'
                          const device = summary.device || summary.hostname || u.current_execution?.hostname || u.last_execution?.hostname || u.current_execution?.last_hostname
                          const workerId = summary.worker_id || u.current_execution?.worker_id || u.last_execution?.worker_id || u.current_execution?.last_worker_id
                          const platform = summary.platform || u.current_execution?.platform || u.last_execution?.platform
                          const completedAt = summary.last_completed_at || u.last_automated_run_at || u.last_execution?.completed_at

                          const deviceBrand = summary.device_brand || u.last_execution?.device_brand || u.current_execution?.device_brand || (platform?.includes('Darwin') ? 'Apple Mac' : (platform?.includes('Windows') ? 'Windows PC' : (platform ? 'Linux Server' : null)))
                          const hardwareModel = summary.hardware_model || summary.device_brand || u.last_execution?.hardware_model || u.current_execution?.hardware_model || deviceBrand
                          const macAddress = summary.mac_address || u.last_execution?.mac_address || u.current_execution?.mac_address
                          const pidVal = summary.pid || u.last_execution?.pid || u.current_execution?.pid

                          if (isApplying) {
                            return (
                              <div className="space-y-1.5 cursor-pointer group" onClick={() => handleInspectCandidate(u)} title="Click to inspect live device telemetry">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-[0_0_8px_rgba(56,189,248,0.3)] animate-pulse">
                                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                                  <Sparkles className="w-3 h-3 text-sky-400" />
                                  <span>APPLYING NOW</span>
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1 text-[11px] font-bold text-white group-hover:text-sky-300 transition-colors">
                                    <Laptop className="w-3 h-3 text-sky-400 shrink-0" />
                                    <span className="truncate max-w-[145px]">{hardwareModel || 'Apple Mac'}</span>
                                  </div>
                                  {device && (
                                    <div
                                      className="flex items-center gap-1 text-[10px] font-mono text-sky-200/90"
                                      title={`Server: ${device}\nPID: ${pidVal || 'N/A'}\nWorker: ${workerId || 'N/A'}`}
                                    >
                                      <Server className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                                      <span className="truncate max-w-[145px]">{device}</span>
                                    </div>
                                  )}
                                  {macAddress && (
                                    <div className="flex items-center gap-1 text-[9px] font-mono text-amber-300/90">
                                      <Cpu className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                      <span>MAC: {macAddress}</span>
                                    </div>
                                  )}
                                </div>
                                {summary.locked_at && (
                                  <div className="text-[9px] font-mono text-zinc-500">
                                    Started {formatTimestamp(summary.locked_at)}
                                  </div>
                                )}
                              </div>
                            )
                          }

                          if (isInQueue) {
                            return (
                              <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                                  <span>IN QUEUE</span>
                                </div>
                                <div className="text-[10px] font-mono text-zinc-400">
                                  Awaiting worker slot
                                </div>
                              </div>
                            )
                          }

                          if (isAppliedToday) {
                            return (
                              <div className="space-y-1.5 cursor-pointer group" onClick={() => handleInspectCandidate(u)} title="Click to inspect execution device details">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>APPLIED TODAY</span>
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1 text-[11px] font-bold text-white group-hover:text-emerald-300 transition-colors">
                                    <Laptop className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span className="truncate max-w-[145px]">{hardwareModel || 'Apple Mac'}</span>
                                  </div>
                                  {device && (
                                    <div
                                      className="flex items-center gap-1 text-[10px] font-mono text-zinc-300"
                                      title={`Server: ${device}\nWorker: ${workerId || 'N/A'}${platform ? `\nPlatform: ${platform}` : ''}`}
                                    >
                                      <Server className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                                      <span className="truncate max-w-[145px]">{device}</span>
                                    </div>
                                  )}
                                  {macAddress && (
                                    <div className="flex items-center gap-1 text-[9px] font-mono text-amber-300/80">
                                      <Cpu className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                      <span>MAC: {macAddress}</span>
                                    </div>
                                  )}
                                </div>
                                {completedAt && (
                                  <div className="text-[9px] font-mono text-zinc-500">
                                    {formatTimestamp(completedAt)}
                                  </div>
                                )}
                              </div>
                            )
                          }

                          if (u.enabled_for_daily_run === false) {
                            return (
                              <div className="space-y-1">
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800">
                                  <AlertCircle className="w-3 h-3 text-zinc-500" />
                                  <span>AUTO-APPLY OFF</span>
                                </div>
                                <div className="text-[10px] font-mono text-zinc-600">Daily bot disabled</div>
                              </div>
                            )
                          }

                          if (u.plan_expiry_status === 'expired' || u.plan_expiry_status === 'no_plan') {
                            return (
                              <div className="space-y-1">
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-rose-400 bg-rose-950/30 border border-rose-800/40">
                                  <AlertCircle className="w-3 h-3 text-rose-400" />
                                  <span>PLAN REQUIRED</span>
                                </div>
                                <div className="text-[10px] font-mono text-zinc-500">Auto-apply paused</div>
                              </div>
                            )
                          }

                          return (
                            <div className="space-y-1 cursor-pointer group" onClick={() => handleInspectCandidate(u)} title="Click to view candidate details">
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-amber-300 bg-amber-950/20 border border-amber-800/40">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>NOT APPLIED TODAY</span>
                              </div>
                              <div className="text-[10px] font-mono text-zinc-500">Next cycle: 06:00 AM</div>
                              {(hardwareModel || device) && (
                                <div className="text-[9px] font-mono text-zinc-500 truncate max-w-[140px]">
                                  Last: {hardwareModel || device}
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col items-start gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              u.plan === 'elite' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                              u.plan === 'pro' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' :
                              u.plan === 'starter' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                              u.plan === 'vip' ? 'bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 text-amber-300 border border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.25)]' :
                              u.plan === 'none' || u.plan === 'no_plan' ? 'bg-zinc-800/80 text-zinc-400 border border-zinc-700' :
                              'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            }`}>
                              {u.plan === 'none' || u.plan === 'no_plan' ? 'NO PLAN' : (u.plan || 'trial')}
                            </span>
                            {u.is_vip && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 text-amber-300 border border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                                <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400/40" />
                                VIP PASS
                              </span>
                            )}
                          </div>

                          {/* Admin Plan Override Dropdown */}
                          <select
                            value={u.plan || 'trial'}
                            onChange={(e) => handleChangePlan(u.user_id, e.target.value)}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[10px] text-slate-200 rounded-md px-1.5 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer font-mono font-medium transition-colors"
                            title="Admin Quick Action: Change this candidate's plan tier"
                          >
                            <option value="none">No Plan (Inactive)</option>
                            <option value="trial">Free Trial (24h)</option>
                            <option value="starter">Starter (30d)</option>
                            <option value="pro">Pro (30d)</option>
                            <option value="elite">Professional (90d)</option>
                            <option value="vip">VIP Pass (3 Months / 90d)</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleToggleVip(u.user_id, !u.is_vip)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              u.is_vip
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/40'
                            }`}
                            title={u.is_vip ? "Click to Revoke VIP Pass" : "Click to Grant 3-Month VIP Pass"}
                          >
                            <Crown className="w-3 h-3 text-amber-400" />
                            {u.is_vip ? 'Revoke VIP' : 'Grant VIP Pass'}
                          </button>

                          {/* Expiry Countdown & Visual Status */}
                          {(() => {
                            if (u.is_vip || u.plan === 'vip') {
                              return (
                                <div
                                  className="text-[10px] font-mono mt-1 flex items-center gap-1 text-amber-300 bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-500/30"
                                  title="Candidate has active VIP access (90d)."
                                >
                                  <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="font-semibold">VIP Pass (90d Active)</span>
                                </div>
                              )
                            }

                            if (u.plan === 'none' || u.plan === 'no_plan' || u.plan_expiry_status === 'no_plan') {
                              return (
                                <div
                                  className="text-[10px] font-mono mt-1 flex items-center gap-1 text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800"
                                  title="Candidate has no active plan. Prime prospect for conversion offer."
                                >
                                  <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                                  <span>No Active Plan</span>
                                </div>
                              )
                            }

                            const hoursLeft = u.plan_hours_left ?? u.hours_until_expiry

                            if (u.plan_expiry_status === 'expired' || (hoursLeft !== null && hoursLeft !== undefined && hoursLeft <= 0)) {
                              return (
                                <div
                                  className="text-[10px] font-mono mt-1 flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/60"
                                  title={`Plan expired on ${u.plan_expires_at ? formatTimestamp(u.plan_expires_at) : 'recently'}. Eligible for renewal retention offer.`}
                                >
                                  <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                                  <span className="font-bold">Plan Expired</span>
                                </div>
                              )
                            }

                            if (u.plan_expiry_status === 'expiring_soon_1d' || (hoursLeft !== null && hoursLeft !== undefined && hoursLeft <= 24)) {
                              return (
                                <div
                                  className="text-[10px] font-mono mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-800"
                                  title={`Expires in ${hoursLeft} hours (${u.plan_expires_at ? formatTimestamp(u.plan_expires_at) : ''}). Urgent renewal retention window.`}
                                >
                                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping shrink-0" />
                                  <span className="font-bold text-rose-200">Expiring: {hoursLeft}h left</span>
                                </div>
                              )
                            }

                            if (u.plan_expiry_status === 'expiring_soon_2d' || (hoursLeft !== null && hoursLeft !== undefined && hoursLeft <= 48)) {
                              const days = Math.ceil((hoursLeft || 1) / 24)
                              return (
                                <div
                                  className="text-[10px] font-mono mt-1 flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/60"
                                  title={`Expires in ${hoursLeft} hours (${days}d). Within 1-2 days renewal retention window.`}
                                >
                                  <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="font-bold text-amber-300">Expiring: {days}d ({hoursLeft}h left)</span>
                                </div>
                              )
                            }

                            if (hoursLeft !== null && hoursLeft !== undefined && hoursLeft > 48) {
                              const days = Math.ceil(hoursLeft / 24)
                              return (
                                <div
                                  className="text-[10px] font-mono mt-1 flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/30 text-emerald-300 border border-emerald-800/40"
                                  title={`Active plan until ${u.plan_expires_at ? formatTimestamp(u.plan_expires_at) : ''} (${days} days left). Protected from discount offers.`}
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span className="font-medium text-emerald-300">Active ({days}d left)</span>
                                </div>
                              )
                            }

                            if (u.plan_expires_at) {
                              return (
                                <div className="text-[10px] font-mono mt-1 flex items-center gap-1 text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                  <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                                  <span>Expires: {formatTimestamp(u.plan_expires_at)}</span>
                                </div>
                              )
                            }

                            return (
                              <div className="text-[10px] font-mono mt-1 flex items-center gap-1 text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                                <span>Trial (Standard)</span>
                              </div>
                            )
                          })()}

                          {/* Assigned Offers Chips */}
                          {u.assigned_offers && u.assigned_offers.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {u.assigned_offers.map((off: any, oIdx: number) => (
                                <span
                                  key={oIdx}
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono flex items-center gap-1 ${
                                    off.is_expired
                                      ? 'bg-zinc-900 text-zinc-500 line-through border border-zinc-800'
                                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  }`}
                                  title={`Offer: ${off.offer_title} (${off.discounted_price}) - Code: ${off.promo_code}`}
                                >
                                  <Tag className="w-2.5 h-2.5" />
                                  {off.promo_code} ({off.is_expired ? 'Expired' : `${off.hours_left}h`})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleDaily(u.user_id, u.enabled_for_daily_run !== false)}
                          className="text-xs transition-colors cursor-pointer"
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
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1 text-slate-300">
                            <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate max-w-[120px]" title={u.resume_filename || 'No resume file recorded'}>
                              {u.resume_filename || 'No PDF'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {u.last_resume_updated_at ? `PDF: ${formatTimestamp(u.last_resume_updated_at)}` : (u.last_profile_updated_at ? `Profile: ${formatTimestamp(u.last_profile_updated_at)}` : 'Synced')}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-slate-900 text-slate-200 font-mono text-[11px] font-bold border border-slate-800">
                          {u.applied_today || 0} / {u.total_applied || 0}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              localStorage.setItem('user_id', u.user_id)
                              localStorage.setItem('user_email', u.email)
                              localStorage.setItem('user_role', 'admin')
                              window.open('/dashboard', '_blank')
                            }}
                            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                            title="Open Candidate Dashboard"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          {onTriggerOnDemand && (
                            <button
                              type="button"
                              disabled={Boolean(
                                u.execution_summary?.is_applying ||
                                u.current_execution?.status === 'applying' ||
                                actionProcessingId === u.user_id
                              )}
                              onClick={async (e) => {
                                e.stopPropagation()
                                if (confirm(`Trigger immediate on-demand application for "${u.name || u.user_id}"?\n(Bypasses daily lock to run on next available server)`)) {
                                  await onTriggerOnDemand(u.user_id, true)
                                }
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-bold text-xs transition-colors border border-indigo-500/30 shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Trigger immediate on-demand bot run for this candidate"
                            >
                              {actionProcessingId === u.user_id ? (
                                <RefreshCw className="w-3.5 h-3.5 text-indigo-300 animate-spin" />
                              ) : (
                                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                              )}
                              <span>{actionProcessingId === u.user_id ? 'Queuing...' : 'Run Now'}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleInspectCandidate(u)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 font-bold text-xs transition-colors border border-amber-500/30 shadow-sm cursor-pointer"
                            title="Inspect candidate plan validity, assigned offers & reminder telemetry"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            <span>Inspect</span>
                          </button>
                          <button
                            type="button"
                            disabled={dispatchReportLoading}
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenDispatchReportForUser(u.email)
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 font-bold text-xs transition-colors border border-sky-500/30 shadow-sm cursor-pointer disabled:opacity-50"
                            title="Open Daily Job Dispatch Report Hub for this candidate (Email + Push)"
                          >
                            <Send className="w-3.5 h-3.5 text-sky-400" />
                            <span>⚡ Send Report</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUser(u)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit Profile
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.user_id)}
                            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
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
        )}
      </div>
    </div>
  )
}
