'use client'

import React from 'react'
import {
  Layers,
  RotateCcw,
  Ban,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  PlayCircle,
  StopCircle,
  Search,
  ListOrdered,
  ChevronDown,
  ChevronUp,
  Clock,
  Trash2,
  Zap,
  Sparkles
} from 'lucide-react'
import { AdminQueueMetrics, AdminWorkerStatus } from '../../types'

interface QueueTabProps {
  queueTasks: any[]
  loadingQueue: boolean
  queueMetrics: AdminQueueMetrics
  workerStatus: AdminWorkerStatus
  queueStatusFilter: string
  setQueueStatusFilter: (val: string) => void
  queueSearch: string
  setQueueSearch: (val: string) => void
  queueTableCollapsed: boolean
  toggleQueueTable: () => void
  queueNotification: { type: 'success' | 'error'; message: string } | null
  setQueueNotification: (val: { type: 'success' | 'error'; message: string } | null) => void
  actionProcessingId: string | null
  fetchQueueData: (filter?: string, search?: string) => Promise<void>
  handleQueueAction: (action: string, taskId?: string, extra?: any) => Promise<void>
  onOpenConfirmCancelAll: () => void
  onSelectExecutionLog: (task: any) => void
  usersList?: any[]
}

export default function QueueTab({
  queueTasks,
  loadingQueue,
  queueMetrics,
  workerStatus,
  queueStatusFilter,
  setQueueStatusFilter,
  queueSearch,
  setQueueSearch,
  queueTableCollapsed,
  toggleQueueTable,
  queueNotification,
  setQueueNotification,
  actionProcessingId,
  fetchQueueData,
  handleQueueAction,
  onOpenConfirmCancelAll,
  onSelectExecutionLog,
  usersList = []
}: QueueTabProps) {
  const [selectedCandidate, setSelectedCandidate] = React.useState<string>('')
  const [forceTrigger, setForceTrigger] = React.useState<boolean>(false)

  // Deduplicated and sorted list of available candidates
  const candidateOptions = React.useMemo(() => {
    const list = [...(usersList || [])]
    const seen = new Set(list.map((u: any) => u.user_id).filter(Boolean))
    queueTasks.forEach((t) => {
      if (t.user_id && t.user_id !== 'admin' && !seen.has(t.user_id)) {
        seen.add(t.user_id)
        list.push({
          user_id: t.user_id,
          name: t.candidate_name || t.user_id,
          email: t.user_email || '',
          plan: 'trial'
        })
      }
    })
    return list.sort((a, b) => (a.name || a.user_id || '').localeCompare(b.name || b.user_id || ''))
  }, [usersList, queueTasks])

  const selectedUserObj = React.useMemo(() => {
    if (!selectedCandidate || selectedCandidate === 'admin') return null
    return candidateOptions.find((u: any) => u.user_id === selectedCandidate)
  }, [selectedCandidate, candidateOptions])

  const selectedCandidateActive = React.useMemo(() => {
    if (!selectedCandidate) return null
    return queueTasks.find((t) => t.user_id === selectedCandidate && (t.status === 'pending' || t.status === 'running'))
  }, [selectedCandidate, queueTasks])

  const handleTriggerCandidate = async () => {
    if (!selectedCandidate) return
    await handleQueueAction('trigger_on_demand', undefined, {
      userId: selectedCandidate,
      force: forceTrigger || Boolean(selectedCandidateActive)
    })
  }
  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="p-4 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white light:text-zinc-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Execution Queue &amp; Serialized Worker Hub</span>
          </h3>
          <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
            Inspect lined-up candidate runs, monitor real-time Playwright execution logs, and mark tasks not to execute.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleQueueAction('reclaim_stale')}
            disabled={actionProcessingId === 'reclaim_stale'}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Check and auto-fail running tasks with lost heartbeats"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${actionProcessingId === 'reclaim_stale' ? 'animate-spin' : ''}`} />
            <span>Reclaim Stale</span>
          </button>

          {queueMetrics.pending > 0 && (
            <button
              type="button"
              onClick={onOpenConfirmCancelAll}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 light:text-rose-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel All Pending ({queueMetrics.pending})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchQueueData(queueStatusFilter, queueSearch)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingQueue ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {queueNotification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start justify-between gap-3 border ${
            queueNotification.type === 'success'
              ? 'bg-emerald-950/40 light:bg-emerald-50 border-emerald-800/50 text-emerald-300 light:text-emerald-700'
              : 'bg-rose-950/40 light:bg-rose-50 border-rose-800/50 text-rose-300 light:text-rose-600'
          }`}
        >
          <div className="flex items-center gap-2">
            {queueNotification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 light:text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 light:text-rose-600 shrink-0" />
            )}
            <span>{queueNotification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setQueueNotification(null)}
            className="text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* On-Demand Candidate Trigger Controller */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-zinc-950 via-[#0b1017] to-zinc-950 light:from-white light:via-zinc-50 light:to-white border border-sky-500/30 shadow-lg shadow-sky-950/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white light:text-zinc-900 flex items-center gap-2">
                <span>Trigger Candidate Run On-Demand</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  INSTANT ENQUEUE
                </span>
              </div>
              <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
                Select any candidate to immediately dispatch a live application sweep. Bypasses daily deduplication and delivers post-run dispatch reports upon completion.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-400 light:text-zinc-600 font-mono self-start sm:self-auto bg-zinc-900/90 light:bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-800 light:border-zinc-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Visible Headed Desktop Browser</span>
          </div>
        </div>

        {/* Candidate Selector & Trigger Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Candidate Dropdown */}
          <div className="md:col-span-8 space-y-1.5">
            <label className="text-[11px] font-mono text-zinc-400 light:text-zinc-600 flex items-center justify-between">
              <span>SELECT CANDIDATE TO EXECUTE:</span>
              {selectedCandidate && (
                <span className="text-sky-400 font-sans text-[11px]">
                  {selectedCandidate === 'admin'
                    ? '👑 All Configured Profiles'
                    : selectedUserObj?.plan ? `${selectedUserObj.plan.toUpperCase()} Plan` : 'Candidate Profile'}
                </span>
              )}
            </label>
            <div className="relative">
              <select
                value={selectedCandidate}
                onChange={(e) => setSelectedCandidate(e.target.value)}
                disabled={actionProcessingId === 'trigger_on_demand' || actionProcessingId === selectedCandidate}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/90 light:bg-white/85 border border-zinc-700 light:border-zinc-300 text-white light:text-zinc-900 text-xs font-mono focus:outline-none focus:border-sky-500 transition-colors appearance-none cursor-pointer pr-10"
              >
                <option value="">-- Choose Candidate to Run On-Demand ({candidateOptions.length} profiles available) --</option>
                <option value="admin" className="font-bold text-amber-300 light:text-amber-700">
                  👑 All Candidates (Sequential Sweep Across Entire Database)
                </option>
                <optgroup label="Individual Candidate Profiles">
                  {candidateOptions.map((u: any) => {
                    const active = queueTasks.some(
                      (t) => t.user_id === u.user_id && (t.status === 'pending' || t.status === 'running')
                    )
                    return (
                      <option key={u.user_id} value={u.user_id}>
                        {u.name || u.email || u.user_id} ({u.user_id}) {u.plan ? `• ${u.plan.toUpperCase()}` : ''} {active ? '⚠️ [IN QUEUE]' : ''}
                      </option>
                    )
                  })}
                </optgroup>
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-400 light:text-zinc-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="md:col-span-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerCandidate}
              disabled={!selectedCandidate || actionProcessingId === 'trigger_on_demand' || actionProcessingId === selectedCandidate}
              className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-black light:text-white text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {actionProcessingId === 'trigger_on_demand' || actionProcessingId === selectedCandidate ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black light:text-white" />
                  <span>Enqueuing...</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 text-black light:text-white" />
                  <span>Run On-Demand</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Selected Candidate Metadata Card */}
        {selectedCandidate && (
          <div className="pt-2 border-t border-zinc-800/80 light:border-zinc-200 flex items-center justify-between gap-3 text-xs flex-wrap">
            {selectedCandidate === 'admin' ? (
              <div className="flex items-center gap-2 text-amber-300 light:text-amber-700">
                <Sparkles className="w-4 h-4 text-amber-400 light:text-amber-600 shrink-0" />
                <span>Enqueues an administrator run that sequentially automates applications for <strong>all enabled candidate profiles</strong>.</span>
              </div>
            ) : selectedUserObj ? (
              <div className="flex items-center gap-2 text-zinc-300 light:text-zinc-700">
                <span className="text-zinc-500 light:text-zinc-600 font-mono">Selected:</span>
                <strong className="text-white light:text-zinc-900">{selectedUserObj.name || selectedUserObj.user_id}</strong>
                <span className="text-zinc-500 light:text-zinc-600 font-mono">({selectedUserObj.email})</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-zinc-400 light:text-zinc-600">
                <span className="font-mono">User ID:</span>
                <strong className="text-white light:text-zinc-900 font-mono">{selectedCandidate}</strong>
              </div>
            )}

            <div className="flex items-center gap-2 font-mono text-[11px] flex-wrap">
              {selectedUserObj?.current_execution?.status === 'applying' ? (
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                  Applying on {selectedUserObj.current_execution.hostname || 'Remote Server'}
                </span>
              ) : selectedCandidateActive ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 light:border-amber-300 text-amber-300 light:text-amber-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  In Queue ({selectedCandidateActive.status})
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 light:border-emerald-300 text-emerald-300 light:text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready to Enqueue
                </span>
              )}

              {selectedUserObj?.last_automated_run_date && (
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 light:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700">
                  Done: {selectedUserObj.last_automated_run_date}
                </span>
              )}

              {selectedUserObj?.is_vip && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 light:border-amber-300 text-amber-300 light:text-amber-700 font-bold">
                  VIP ACCESS
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Live Worker Status Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        workerStatus.is_busy
          ? 'bg-emerald-950/20 border-emerald-500/30 light:border-emerald-300 text-emerald-200 light:text-emerald-800'
          : 'bg-zinc-900/50 light:bg-zinc-100 border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
            workerStatus.is_busy
              ? 'bg-emerald-500/20 border-emerald-500/40 light:border-emerald-300 text-emerald-400 light:text-emerald-600'
              : 'bg-zinc-800 light:bg-zinc-200 border-zinc-700 light:border-zinc-300 text-zinc-500 light:text-zinc-600'
          }`}>
            <PlayCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white light:text-zinc-900 flex items-center gap-2">
              <span>{workerStatus.is_busy ? 'Worker Process Active & Executing' : 'Queue Worker Idle'}</span>
              {workerStatus.is_busy ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 light:text-emerald-700 border border-emerald-500/40 light:border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  PROCESSING LIVE
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 light:bg-zinc-200 text-zinc-400 light:text-zinc-600 border border-zinc-700 light:border-zinc-300">
                  READY FOR JOBS
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 light:text-zinc-600 mt-0.5">
              {workerStatus.is_busy ? (
                <>
                  Running applications for candidate <strong className="text-white light:text-zinc-900">{workerStatus.active_user_id}</strong> (Task ID: <code className="font-mono text-emerald-300 light:text-emerald-700">{workerStatus.active_task_id}</code>)
                </>
              ) : (
                'Daemon is polling MongoDB Atlas tasks every 3s. Pending requests will be picked up one-by-one in FIFO order.'
              )}
            </p>
          </div>
        </div>

        {workerStatus.is_busy && workerStatus.active_task_id && (
          <button
            type="button"
            onClick={() => handleQueueAction('mark_not_to_execute', workerStatus.active_task_id!)}
            disabled={actionProcessingId === workerStatus.active_task_id}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 light:border-rose-300 text-rose-300 light:text-rose-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 self-end sm:self-auto"
          >
            <StopCircle className="w-3.5 h-3.5" />
            <span>Abort Active Run</span>
          </button>
        )}
      </div>

      {/* Queue Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div
          onClick={() => { setQueueStatusFilter('all'); fetchQueueData('all', queueSearch) }}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            queueStatusFilter === 'all'
              ? 'bg-zinc-800 light:bg-zinc-200 border-zinc-600 ring-1 ring-zinc-500 text-white light:text-zinc-900'
              : 'bg-[#09090b] light:bg-white border-zinc-800 light:border-zinc-200 hover:border-zinc-700 light:hover:border-zinc-300 text-zinc-300 light:text-zinc-700'
          }`}
        >
          <span className="text-[10px] font-mono text-zinc-500 light:text-zinc-600 uppercase tracking-wider block">All Tasks</span>
          <div className="text-lg font-bold text-white light:text-zinc-900 mt-0.5">{queueMetrics.total}</div>
          <p className="text-[10px] text-zinc-500 light:text-zinc-600 mt-0.5">Total queued</p>
        </div>

        <div
          onClick={() => { setQueueStatusFilter('pending'); fetchQueueData('pending', queueSearch) }}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            queueStatusFilter === 'pending'
              ? 'bg-amber-950/40 light:bg-amber-50 border-amber-500 ring-1 ring-amber-500/50 text-white light:text-zinc-900'
              : 'bg-[#09090b] light:bg-white border-amber-500/30 light:border-amber-300 bg-amber-500/5 hover:border-amber-500/50 text-amber-200 light:text-amber-800'
          }`}
        >
          <span className="text-[10px] font-mono text-amber-400 light:text-amber-600 uppercase tracking-wider block">In Line (Pending)</span>
          <div className="text-lg font-bold text-amber-300 light:text-amber-700 mt-0.5">{queueMetrics.pending}</div>
          <p className="text-[10px] text-amber-400/80 mt-0.5">Awaiting worker</p>
        </div>

        <div
          onClick={() => { setQueueStatusFilter('running'); fetchQueueData('running', queueSearch) }}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            queueStatusFilter === 'running'
              ? 'bg-emerald-950/40 light:bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500/50 text-white light:text-zinc-900'
              : 'bg-[#09090b] light:bg-white border-emerald-500/30 light:border-emerald-300 bg-emerald-500/5 hover:border-emerald-500/50 text-emerald-200 light:text-emerald-800'
          }`}
        >
          <span className="text-[10px] font-mono text-emerald-400 light:text-emerald-600 uppercase tracking-wider block">Running Now</span>
          <div className="text-lg font-bold text-emerald-300 light:text-emerald-700 mt-0.5">{queueMetrics.running}</div>
          <p className="text-[10px] text-emerald-400/80 mt-0.5">In execution</p>
        </div>

        <div
          onClick={() => { setQueueStatusFilter('completed'); fetchQueueData('completed', queueSearch) }}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            queueStatusFilter === 'completed'
              ? 'bg-zinc-800 light:bg-zinc-200 border-zinc-600 ring-1 ring-zinc-500 text-white light:text-zinc-900'
              : 'bg-[#09090b] light:bg-white border-zinc-800 light:border-zinc-200 hover:border-zinc-700 light:hover:border-zinc-300 text-zinc-300 light:text-zinc-700'
          }`}
        >
          <span className="text-[10px] font-mono text-zinc-500 light:text-zinc-600 uppercase tracking-wider block">Completed</span>
          <div className="text-lg font-bold text-white light:text-zinc-900 mt-0.5">{queueMetrics.completed}</div>
          <p className="text-[10px] text-zinc-500 light:text-zinc-600 mt-0.5">Finished runs</p>
        </div>

        <div
          onClick={() => { setQueueStatusFilter('cancelled'); fetchQueueData('cancelled', queueSearch) }}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            queueStatusFilter === 'cancelled'
              ? 'bg-zinc-800 light:bg-zinc-200 border-zinc-600 ring-1 ring-zinc-500 text-white light:text-zinc-900'
              : 'bg-[#09090b] light:bg-white border-zinc-800 light:border-zinc-200 hover:border-zinc-700 light:hover:border-zinc-300 text-zinc-300 light:text-zinc-700'
          }`}
        >
          <span className="text-[10px] font-mono text-zinc-400 light:text-zinc-600 uppercase tracking-wider block">Cancelled / Skipped</span>
          <div className="text-lg font-bold text-zinc-300 light:text-zinc-700 mt-0.5">{queueMetrics.cancelled}</div>
          <p className="text-[10px] text-zinc-500 light:text-zinc-600 mt-0.5">Not to execute</p>
        </div>

        <div
          onClick={() => { setQueueStatusFilter('failed'); fetchQueueData('failed', queueSearch) }}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            queueStatusFilter === 'failed'
              ? 'bg-rose-950/40 light:bg-rose-50 border-rose-500 ring-1 ring-rose-500/50 text-white light:text-zinc-900'
              : 'bg-[#09090b] light:bg-white border-zinc-800 light:border-zinc-200 hover:border-rose-900/50 text-zinc-300 light:text-zinc-700'
          }`}
        >
          <span className="text-[10px] font-mono text-rose-400 light:text-rose-600 uppercase tracking-wider block">Failed / Timeouts</span>
          <div className="text-lg font-bold text-rose-400 light:text-rose-600 mt-0.5">{queueMetrics.failed}</div>
          <p className="text-[10px] text-rose-500/80 mt-0.5">Execution errors</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <span className="text-xs text-zinc-500 light:text-zinc-600 font-medium mr-1">Filter by Status:</span>
          {(['all', 'pending', 'running', 'completed', 'cancelled', 'failed'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => { setQueueStatusFilter(st); fetchQueueData(st, queueSearch) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                queueStatusFilter === st
                  ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 border border-zinc-700 light:border-zinc-300'
                  : 'bg-black light:bg-white text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 border border-zinc-800 light:border-zinc-200'
              }`}
            >
              {st === 'cancelled' ? 'Not Executing' : st}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-zinc-500 light:text-zinc-600 absolute left-3 top-3" />
          <input
            type="text"
            value={queueSearch}
            onChange={(e) => {
              setQueueSearch(e.target.value)
              fetchQueueData(queueStatusFilter, e.target.value)
            }}
            placeholder="Search candidate, user ID, task ID..."
            className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 focus:border-sky-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 outline-none transition-all"
          />
        </div>
      </div>

      {/* Tasks Table */}
      <div className="rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 overflow-hidden shadow-xl">
        <div 
          onClick={toggleQueueTable}
          className="px-5 py-4 bg-zinc-950 light:bg-white hover:bg-zinc-900/60 border-b border-zinc-800 light:border-zinc-200 flex items-center justify-between cursor-pointer select-none transition-colors"
        >
          <div>
            <h4 className="text-sm font-bold text-white light:text-zinc-900 flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-sky-400" />
              <span>Queue Tasks &amp; Execution Logs</span>
              <span className="text-[10px] font-mono text-zinc-400 light:text-zinc-600 bg-zinc-900 light:bg-zinc-100 px-2 py-0.5 rounded border border-zinc-800 light:border-zinc-200">
                {queueTasks.length} task records
              </span>
            </h4>
            <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
              Live tasks lined up for Playwright automated runs.
            </p>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleQueueTable()
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              {queueTableCollapsed ? (
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

        {queueTableCollapsed && (
          <div 
            onClick={toggleQueueTable}
            className="px-5 py-3 bg-zinc-900/30 light:bg-zinc-100 hover:bg-zinc-900/60 border-t border-zinc-800 light:border-zinc-200 flex items-center justify-between text-xs text-zinc-400 light:text-zinc-600 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span>Table shrunk (<strong>{queueTasks.length}</strong> tasks hidden) &bull; Click anywhere on head to expand</span>
            </div>
            <span className="text-sky-400 font-semibold flex items-center gap-1">
              <span>Expand Table</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </span>
          </div>
        )}

        {!queueTableCollapsed && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead 
                onClick={toggleQueueTable}
                className="cursor-pointer group select-none"
                title="Click table head to shrink / expand"
              >
                <tr className="border-b border-zinc-800 light:border-zinc-200 bg-black/40 light:bg-white/85 group-hover:bg-zinc-900/60 text-zinc-400 light:text-zinc-600 font-mono uppercase text-[10px] transition-colors">
                  <th className="py-3 px-4 flex items-center gap-1">
                    <span>Queue / State</span>
                    <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-sky-400 transition-colors" />
                  </th>
                  <th className="py-3 px-4">Candidate &amp; Plan</th>
                  <th className="py-3 px-4">Trigger Source</th>
                  <th className="py-3 px-4">Timeline / Heartbeat</th>
                  <th className="py-3 px-4">Applications / Summary</th>
                  <th className="py-3 px-4 text-center">Execution Logs</th>
                  <th className="py-3 px-4 text-center">Admin Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 light:divide-zinc-200/60">
                {queueTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500 light:text-zinc-600 italic">
                      No tasks matching the selected filter in queue.
                    </td>
                  </tr>
                ) : (
                  queueTasks.map((t: any) => {
                    const isPending = t.status === 'pending'
                    const isRunning = t.status === 'running'
                    const isCancelled = t.status === 'cancelled' || t.status === 'stopped'
                    const isCompleted = t.status === 'completed'

                    return (
                      <tr key={t.id || t._id} className="hover:bg-zinc-900/40 transition-colors">
                        {/* Queue / Status Column */}
                        <td className="py-3.5 px-4">
                          {isPending ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-amber-500/10 text-amber-300 light:text-amber-700 border border-amber-500/30 light:border-amber-300">
                                <Clock className="w-3 h-3 text-amber-400 light:text-amber-600" />
                                #{t.queue_position} IN LINE
                              </span>
                              <span className="block text-[10px] text-zinc-500 light:text-zinc-600 font-mono">Waiting for turn</span>
                            </div>
                          ) : isRunning ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 light:text-emerald-700 border border-emerald-500/40 light:border-emerald-300 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                RUNNING NOW
                              </span>
                              <span className="block text-[10px] text-emerald-400/80 font-mono">
                                {t.heartbeat_seconds_ago !== null ? `Pulse: ${t.heartbeat_seconds_ago}s ago` : 'Active'}
                              </span>
                            </div>
                          ) : isCancelled ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-zinc-800 light:bg-zinc-200 text-zinc-400 light:text-zinc-600 border border-zinc-700 light:border-zinc-300">
                              <Ban className="w-3 h-3 text-zinc-400 light:text-zinc-600" />
                              NOT EXECUTING
                            </span>
                          ) : isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 light:text-emerald-600 border border-emerald-500/30 light:border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              COMPLETED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-rose-500/10 text-rose-400 light:text-rose-600 border border-rose-500/30">
                              <AlertTriangle className="w-3 h-3" />
                              FAILED
                            </span>
                          )}
                        </td>

                        {/* Candidate & Plan */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white light:text-zinc-900 truncate max-w-[160px]">{t.candidate_name}</div>
                          <div className="text-[11px] text-zinc-400 light:text-zinc-600 font-mono truncate max-w-[160px]">{t.candidate_email || t.user_id}</div>
                          <div className="pt-0.5 flex items-center gap-1">
                            {t.is_vip ? (
                              <span className="text-[9px] font-mono font-bold text-amber-300 light:text-amber-700 bg-amber-500/20 border border-amber-400/60 px-1 rounded">VIP PASS</span>
                            ) : (
                              <span className="text-[9px] font-mono text-zinc-400 light:text-zinc-600 uppercase bg-zinc-800 light:bg-zinc-200 px-1 rounded">{t.candidate_plan}</span>
                            )}
                          </div>
                        </td>

                        {/* Source */}
                        <td className="py-3.5 px-4">
                          <span className="text-zinc-300 light:text-zinc-700 font-mono text-[11px] block">
                            {t.source === 'web_dashboard_on_demand'
                              ? 'On-Demand (UI)'
                              : t.source === 'daily_cron'
                              ? 'Daily Auto-Sweep'
                              : t.source === 'admin_dispatch'
                              ? 'Admin Trigger'
                              : t.source}
                          </span>
                          <span className="text-[10px] text-zinc-500 light:text-zinc-600 font-mono">
                            {t.headless ? 'Headless Mode' : 'Desktop Window'}
                          </span>
                        </td>

                        {/* Timeline */}
                        <td className="py-3.5 px-4 text-[11px] text-zinc-400 light:text-zinc-600 font-mono space-y-0.5">
                          <div>Queued: {new Date(t.created_at).toLocaleTimeString()}</div>
                          {t.started_at && <div>Started: {new Date(t.started_at).toLocaleTimeString()}</div>}
                          {t.completed_at && <div>Finished: {new Date(t.completed_at).toLocaleTimeString()}</div>}
                        </td>

                        {/* Results / Summary */}
                        <td className="py-3.5 px-4 max-w-[200px]">
                          {t.jobs_applied > 0 && (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] bg-sky-950/60 text-sky-300 border border-sky-800/60 font-mono font-bold mb-1">
                              {t.jobs_applied} applied
                            </span>
                          )}
                          <p className="text-[11px] text-zinc-400 light:text-zinc-600 line-clamp-2 leading-relaxed">
                            {t.summary || (isPending ? 'Waiting in line to be executed' : isRunning ? 'Applying live...' : 'No summary')}
                          </p>
                        </td>

                        {/* Execution Logs Button */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => onSelectExecutionLog(t)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 light:bg-zinc-200 hover:bg-zinc-700 border border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800 text-[11px] font-mono transition-colors cursor-pointer"
                          >
                            View Logs ({t.logs_count || (t.logs_preview?.length || 0)})
                          </button>
                        </td>

                        {/* Admin Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => handleQueueAction('mark_not_to_execute', t.task_id)}
                                disabled={actionProcessingId === t.task_id}
                                className="px-2.5 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 light:text-rose-600 text-[11px] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Mark task not to execute. Worker will skip this task."
                              >
                                <Ban className="w-3 h-3 text-rose-400 light:text-rose-600" />
                                <span>Mark Not to Execute</span>
                              </button>
                            )}

                            {isRunning && (
                              <button
                                type="button"
                                onClick={() => handleQueueAction('mark_not_to_execute', t.task_id)}
                                disabled={actionProcessingId === t.task_id}
                                className="px-2.5 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 light:border-rose-300 text-rose-300 light:text-rose-600 text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Abort live execution cleanly"
                              >
                                <StopCircle className="w-3 h-3 text-rose-400 light:text-rose-600" />
                                <span>Abort Execution</span>
                              </button>
                            )}

                            {isCancelled && (
                              <button
                                type="button"
                                onClick={() => handleQueueAction('requeue', t.task_id)}
                                disabled={actionProcessingId === t.task_id}
                                className="px-2.5 py-1 rounded-md bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Put task back in execution queue"
                              >
                                <RotateCcw className="w-3 h-3 text-sky-400" />
                                <span>Re-queue</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleQueueAction('delete', t.task_id)}
                              disabled={actionProcessingId === t.task_id}
                              className="p-1 rounded-md text-zinc-500 light:text-zinc-600 hover:text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer"
                              title="Delete task record"
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
        )}
      </div>
    </div>
  )
}
