'use client'

import React from 'react'
import {
  Activity,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Cpu,
  Database,
  Eye,
  Mail,
  RefreshCw,
  Search,
  X,
  Zap
} from 'lucide-react'
import {
  ActivityStats,
  CandidateUser,
  LlmStats,
  LogsSubTabType,
  SupportTicket
} from '../../types'

interface LogsTabProps {
  logsSubTab: LogsSubTabType
  handleLogsSubTabChange: (tab: LogsSubTabType) => void
  activityLogs: any[]
  activityStats: ActivityStats
  activityFilter: string
  setActivityFilter: (filter: string) => void
  fetchActivityLogs: (filter?: string) => Promise<void> | void
  loadingActivity: boolean
  activityTableCollapsed: boolean
  toggleActivityTable: () => void
  formatTimestamp: (ts: any) => string

  llmStats: LlmStats
  llmLogs: any[]
  loadingLlmLogs: boolean
  llmSearchQuery: string
  setLlmSearchQuery: (query: string) => void
  llmFilterUser: string
  setLlmFilterUser: (user: string) => void
  llmFilterProvider: string
  setLlmFilterProvider: (provider: string) => void
  llmFilterDate: string
  setLlmFilterDate: (date: string) => void
  fetchLlmLogs: (params?: any) => Promise<void> | void
  usersList: CandidateUser[]
  llmTableCollapsed: boolean
  toggleLlmTable: () => void
  selectedLlmLog: any
  setSelectedLlmLog: (log: any) => void
  llmCopiedId: string | null
  setLlmCopiedId: (id: string | null) => void

  selectedSystemLog: string | null
  loadSystemLogContent: (userId: string) => Promise<void> | void
  loadingLogContent: boolean
  selectedLogContent: string[]

  supportTickets: SupportTicket[]
  loadingTickets: boolean
  fetchSupportTickets: () => Promise<void> | void
  adminEmail: string
}

export const LogsTab: React.FC<LogsTabProps> = ({
  logsSubTab,
  handleLogsSubTabChange,
  activityLogs,
  activityStats,
  activityFilter,
  setActivityFilter,
  fetchActivityLogs,
  loadingActivity,
  activityTableCollapsed,
  toggleActivityTable,
  formatTimestamp,
  llmStats,
  llmLogs,
  loadingLlmLogs,
  llmSearchQuery,
  setLlmSearchQuery,
  llmFilterUser,
  setLlmFilterUser,
  llmFilterProvider,
  setLlmFilterProvider,
  llmFilterDate,
  setLlmFilterDate,
  fetchLlmLogs,
  usersList,
  llmTableCollapsed,
  toggleLlmTable,
  selectedLlmLog,
  setSelectedLlmLog,
  llmCopiedId,
  setLlmCopiedId,
  selectedSystemLog,
  loadSystemLogContent,
  loadingLogContent,
  selectedLogContent,
  supportTickets,
  loadingTickets,
  fetchSupportTickets,
  adminEmail,
}) => {
  return (
    <div className="space-y-4">
      {/* Sub-Tabs Selector */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-zinc-900">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-nowrap max-w-full pb-1">
          <button
            type="button"
            onClick={() => handleLogsSubTabChange('activity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              logsSubTab === 'activity'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            Live Activity Audit Trail ({activityLogs.length})
          </button>
          <button
            type="button"
            onClick={() => handleLogsSubTabChange('job_history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              logsSubTab === 'job_history'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            Job Application Records
          </button>
          <button
            type="button"
            onClick={() => handleLogsSubTabChange('llm_telemetry')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              logsSubTab === 'llm_telemetry'
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-indigo-500/20 font-semibold'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Q&amp;A &amp; Inference Telemetry ({llmStats.total_calls || llmLogs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => handleLogsSubTabChange('tickets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              logsSubTab === 'tickets'
                ? 'bg-zinc-800 text-white shadow-sm'
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
                    ? 'bg-sky-600 text-white font-bold'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
            <button
              onClick={() => fetchActivityLogs(activityFilter)}
              className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors ml-1 cursor-pointer"
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
              <div className="text-xl font-semibold font-mono text-sky-400">
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
            <div
              onClick={toggleActivityTable}
              className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between cursor-pointer select-none hover:bg-slate-900/60 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-sm text-white">Live Activity Audit Trail</span>
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                  {activityLogs.length} events
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleActivityTable() }}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title={activityTableCollapsed ? 'Expand table' : 'Collapse table'}
              >
                {activityTableCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {activityTableCollapsed && (
              <div
                onClick={toggleActivityTable}
                className="flex items-center justify-center gap-2 py-4 text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 hover:bg-zinc-900/30 transition-all select-none"
              >
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                <span>Table shrunk ({activityLogs.length} events hidden) · Click header to expand</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            )}

            {!activityTableCollapsed && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead
                  onClick={toggleActivityTable}
                  className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 cursor-pointer group select-none"
                  title="Click table head to shrink / expand"
                >
                  <tr className="hover:bg-zinc-900/60 transition-colors">
                    <th className="py-3 px-4 flex items-center gap-1">
                      <span>Timestamp</span>
                      <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-sky-400" />
                    </th>
                    <th className="py-3 px-4">Candidate / User</th>
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Activity Description</th>
                    <th className="py-3 px-4">IP &amp; Device (Click Head to Shrink ▲)</th>
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
                            log.event_type === 'profile_update' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' :
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
            )}
          </div>
        </div>
      )}

      {/* VIEW: AI Q&A & INFERENCE TELEMETRY */}
      {logsSubTab === 'llm_telemetry' && (
        <div className="space-y-5">
          {/* 5 KPI Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Card 1: Inferences */}
            <div className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-zinc-400">Total Inferences</span>
                <Brain className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {llmStats.total_calls.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-500 truncate">
                Job Screening &amp; ATS Tasks
              </div>
            </div>

            {/* Card 2: Average Latency (Speed) */}
            <div className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-zinc-400">Avg Speed / Latency</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-300 flex items-baseline gap-1">
                {llmStats.avg_duration_ms}
                <span className="text-xs font-normal text-zinc-400">ms</span>
              </div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {llmStats.avg_duration_ms < 500 ? '⚡ Ultra-Fast LPU Speed' : 'Standard Speed'}
              </div>
            </div>

            {/* Card 3: Success Rate */}
            <div className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-zinc-400">Success Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {llmStats.success_rate}%
              </div>
              <div className="text-[10px] text-zinc-500 truncate">
                Zero DOM modal timeouts
              </div>
            </div>

            {/* Card 4: Tokens Consumed */}
            <div className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-zinc-400">Total Tokens</span>
                <Database className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-sky-400">
                {llmStats.total_tokens.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-500 truncate">
                Est. spend &lt; ₹15 / 1k queries
              </div>
            </div>

            {/* Card 5: Providers Split */}
            <div className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1.5 shadow-sm col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-zinc-400">Provider Split</span>
                <Cpu className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {llmStats.providers.length === 0 ? (
                  <span className="text-xs text-zinc-500 font-mono">Groq LPU (100%)</span>
                ) : (
                  llmStats.providers.map(p => (
                    <span
                      key={p.provider}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-zinc-800 text-zinc-300 border border-zinc-700"
                    >
                      {p.provider}: {p.share_percent}%
                    </span>
                  ))
                )}
              </div>
              <div className="text-[10px] text-zinc-500">
                Auto-fallback enabled
              </div>
            </div>
          </div>

          {/* Filter Controls Bar */}
          <div className="p-4 rounded-xl bg-[#09090b] border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* Search Query */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search question, answer, candidate, or model..."
                  value={llmSearchQuery}
                  onChange={e => setLlmSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      fetchLlmLogs({ search: llmSearchQuery })
                    }
                  }}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-black border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Candidate User Filter */}
              <select
                value={llmFilterUser}
                onChange={e => {
                  setLlmFilterUser(e.target.value)
                  fetchLlmLogs({ user: e.target.value })
                }}
                className="px-3 py-1.5 rounded-lg bg-black border border-zinc-800 text-xs text-zinc-300 font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Candidates (Users)</option>
                {usersList.map((u: any) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.name || u.user_id} ({u.user_id})
                  </option>
                ))}
              </select>

              {/* Provider Filter */}
              <select
                value={llmFilterProvider}
                onChange={e => {
                  setLlmFilterProvider(e.target.value)
                  fetchLlmLogs({ provider: e.target.value })
                }}
                className="px-3 py-1.5 rounded-lg bg-black border border-zinc-800 text-xs text-zinc-300 font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Providers</option>
                <option value="groq">⚡ Groq (LPU)</option>
                <option value="openrouter">🌐 OpenRouter</option>
                <option value="openai">🤖 OpenAI (GPT)</option>
                <option value="gemini">✨ Google Gemini</option>
              </select>

              {/* Date Filter */}
              <div className="flex items-center gap-1 bg-black p-1 rounded-lg border border-zinc-800">
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'today', label: 'Today' },
                  { id: '7d', label: '7 Days' },
                  { id: '30d', label: '30 Days' }
                ].map(d => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setLlmFilterDate(d.id)
                      fetchLlmLogs({ date: d.id })
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                      llmFilterDate === d.id
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchLlmLogs()}
                disabled={loadingLlmLogs}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Refresh Telemetry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLlmLogs ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Top Screening Questions Quick Pills */}
            {llmStats.top_questions && llmStats.top_questions.length > 0 && (
              <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-[10px] uppercase font-mono text-zinc-500 shrink-0">
                  Frequent Questions:
                </span>
                {llmStats.top_questions.slice(0, 5).map((tq, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setLlmSearchQuery(tq.question)
                      fetchLlmLogs({ search: tq.question })
                    }}
                    className="px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-mono truncate max-w-[260px] shrink-0 transition-colors cursor-pointer"
                    title={`Asked ${tq.count} times. Sample answer: ${tq.sample_answer}`}
                  >
                    <span className="text-indigo-400 font-bold mr-1">#{tq.count}</span>
                    {tq.question}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Telemetry Table */}
          <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
            <div
              onClick={toggleLlmTable}
              className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between cursor-pointer select-none hover:bg-slate-900/60 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-sm text-white">AI Q&amp;A &amp; Inference Telemetry Log</span>
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                  {llmLogs.length} records
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleLlmTable() }}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title={llmTableCollapsed ? 'Expand table' : 'Collapse table'}
              >
                {llmTableCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {llmTableCollapsed && (
              <div
                onClick={toggleLlmTable}
                className="flex items-center justify-center gap-2 py-4 text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 hover:bg-zinc-900/30 transition-all select-none"
              >
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                <span>Table shrunk ({llmLogs.length} inferences hidden) · Click header to expand</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            )}

            {!llmTableCollapsed && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead
                  onClick={toggleLlmTable}
                  className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 cursor-pointer group select-none"
                  title="Click table head to shrink / expand"
                >
                  <tr className="hover:bg-zinc-900/60 transition-colors">
                    <th className="py-3 px-4 flex items-center gap-1">
                      <span>Time &amp; Candidate</span>
                      <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-purple-400" />
                    </th>
                    <th className="py-3 px-4 min-w-[240px]">Screening Question &amp; AI Answer</th>
                    <th className="py-3 px-4">Provider / Model</th>
                    <th className="py-3 px-4 text-center">Latency</th>
                    <th className="py-3 px-4 text-center">Tokens</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Details (Click Head to Shrink ▲)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {loadingLlmLogs ? (
                    <tr>
                      <td colSpan={7} className="py-14 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
                        Querying AI inference telemetry &amp; Q&amp;A records...
                      </td>
                    </tr>
                  ) : llmLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-14 text-center text-slate-500">
                        <Brain className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                        No LLM inference logs found matching your filters.
                        <div className="text-[11px] text-zinc-600 mt-1">
                          Questions answered by the bot will automatically appear here in real-time.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    llmLogs.map((log, idx) => (
                      <tr key={log.id || idx} className="hover:bg-slate-800/30 transition-colors">
                        {/* Time & Candidate */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono text-[11px] text-zinc-300 font-semibold">
                            {formatTimestamp(log.created_at)}
                          </div>
                          <div className="font-mono text-[10px] text-indigo-400 truncate max-w-[130px]" title={log.user_id}>
                            @{log.user_id}
                          </div>
                        </td>

                        {/* Question & Answer */}
                        <td className="py-3 px-4">
                          <div className="text-xs font-semibold text-white leading-snug">
                            {log.question || 'Application Screening Question'}
                          </div>
                          <div className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center gap-1.5">
                            <span className="text-zinc-500 font-bold">Ans:</span>
                            <span className="bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold">
                              {log.answer || '(Empty or fallback)'}
                            </span>
                          </div>
                        </td>

                        {/* Provider & Model */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider ${
                              (log.provider || '').includes('groq')
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : (log.provider || '').includes('openai')
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                            }`}>
                              {log.provider}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-zinc-400 mt-1 truncate max-w-[140px]" title={log.model}>
                            {log.model}
                          </div>
                        </td>

                        {/* Latency */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                            log.duration_ms < 450
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : log.duration_ms < 1500
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}>
                            ⚡ {log.duration_ms}ms
                          </span>
                        </td>

                        {/* Tokens */}
                        <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-[11px] text-zinc-400">
                          {log.total_tokens ? `${log.total_tokens} tok` : '—'}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                            log.status === 'success'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : log.status === 'fallback'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}>
                            {log.status}
                          </span>
                        </td>

                        {/* Action: View Full Context */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedLlmLog(log)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] font-mono inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-indigo-400" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            )}
          </div>

          {/* Inspect Context Modal */}
          {selectedLlmLog && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-sm text-white">
                      LLM Inference Inspection &amp; Candidate Context
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedLlmLog(null)}
                    className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Header Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-black border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase block">Candidate</span>
                    <span className="text-white font-semibold truncate block">@{selectedLlmLog.user_id}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase block">Provider &amp; Model</span>
                    <span className="text-amber-400 font-semibold truncate block">{selectedLlmLog.provider} / {selectedLlmLog.model}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase block">Latency</span>
                    <span className="text-emerald-400 font-semibold block">⚡ {selectedLlmLog.duration_ms}ms</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase block">Tokens</span>
                    <span className="text-sky-400 font-semibold block">{selectedLlmLog.total_tokens || 0} tokens</span>
                  </div>
                </div>

                {/* Question */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    Screening Question Asked:
                  </span>
                  <div className="p-3 rounded-xl bg-black border border-zinc-800 text-xs font-medium text-white">
                    {selectedLlmLog.question}
                  </div>
                </div>

                {/* Answer */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                      Answer Returned by LLM:
                    </span>
                    <button
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(selectedLlmLog.answer || '')
                          setLlmCopiedId(selectedLlmLog.id)
                          setTimeout(() => setLlmCopiedId(null), 2000)
                        }
                      }}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono cursor-pointer"
                    >
                      {llmCopiedId === selectedLlmLog.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Answer</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs font-mono text-emerald-300 font-semibold">
                    {selectedLlmLog.answer || '(No answer text)'}
                  </div>
                </div>

                {/* Candidate Context Fed to AI */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    Candidate Context Fed to AI:
                  </span>
                  <div className="p-3 rounded-xl bg-black border border-zinc-800 text-xs font-mono text-zinc-300 overflow-x-auto max-h-40">
                    {Object.keys(selectedLlmLog.candidate_context || {}).length > 0 ? (
                      <pre className="text-[11px] leading-relaxed whitespace-pre-wrap">
                        {JSON.stringify(selectedLlmLog.candidate_context, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-zinc-500 italic">
                        Default candidate profile parameters loaded from profile database.
                      </span>
                    )}
                  </div>
                </div>

                {/* Prompt Snippet if available */}
                {selectedLlmLog.prompt && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                      Prompt Snippet:
                    </span>
                    <div className="p-3 rounded-xl bg-black border border-zinc-800 text-[11px] font-mono text-zinc-400 overflow-x-auto max-h-32 whitespace-pre-wrap">
                      {selectedLlmLog.prompt}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setSelectedLlmLog(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    Close Inspection
                  </button>
                </div>
              </div>
            </div>
          )}
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
                className={`w-full text-left p-3 rounded-xl text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${
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
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
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
                Dispatched directly to primary address <span className="text-teal-400 font-mono">{adminEmail || 'technohmsit@gmail.com'}</span>
              </p>
            </div>
            <button
              onClick={() => fetchSupportTickets()}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
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
                  <th className="py-3 px-4">Subject &amp; Message</th>
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
                    <tr key={t._id || t.ticket_id || idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-white">
                        {t.ticket_id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{t.name}</div>
                        <a
                          href={`mailto:${t.email}?subject=Re:%20${encodeURIComponent(t.subject)}`}
                          className="text-[11px] text-teal-400 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Mail className="w-3.5 h-3.5" /> {t.email}
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
                      <td className="py-3 px-4 text-right font-mono text-[11px] text-teal-300">
                        {adminEmail || 'technohmsit@gmail.com'}
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
  )
}

export default LogsTab
