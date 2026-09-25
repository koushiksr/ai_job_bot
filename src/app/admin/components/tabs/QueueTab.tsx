'use client'

import React from 'react'
import {
  RotateCcw,
  Ban,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  StopCircle,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Trash2,
  Zap,
  FileText,
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

const PAGE_SIZES = [10, 15, 25, 50]

const STATUS_PILLS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'running', label: 'Running' },
  { key: 'completed', label: 'Done' },
  { key: 'cancelled', label: 'Skipped' },
  { key: 'failed', label: 'Failed' },
]

function countFor(m: AdminQueueMetrics, key: string): number {
  if (key === 'all') return m.total
  return (m as any)[key] ?? 0
}

function shortSource(src: string): string {
  if (!src) return '—'
  if (src === 'web_dashboard_on_demand') return 'On-demand'
  if (src === 'daily_cron') return 'Auto-sweep'
  if (src === 'admin_dispatch') return 'Admin'
  return src.replace(/_/g, ' ')
}

function fmtTime(ts: any): string {
  if (!ts) return '—'
  try {
    const d = new Date(ts)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
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
  const [showTrigger, setShowTrigger] = React.useState<boolean>(false)
  const [page, setPage] = React.useState<number>(1)
  const [perPage, setPerPage] = React.useState<number>(15)

  const [fleet, setFleet] = React.useState<{ online_count: number; total_seen: number; pending_tasks: number; workers: any[] } | null>(null)
  React.useEffect(() => {
    let alive = true
    const load = () => {
      fetch('/api/admin/workers')
        .then(r => (r.ok ? r.json() : null))
        .then(data => { if (alive && data) setFleet(data) })
        .catch(() => {})
    }
    load()
    const t = setInterval(load, 15000)
    return () => { alive = false; clearInterval(t) }
  }, [])

  const candidateOptions = React.useMemo(() => {
    const list = [...(usersList || [])]
    const seen = new Set(list.map((u: any) => u.user_id).filter(Boolean))
    queueTasks.forEach((t) => {
      if (t.user_id && t.user_id !== 'admin' && !seen.has(t.user_id)) {
        seen.add(t.user_id)
        list.push({ user_id: t.user_id, name: t.candidate_name || t.user_id, email: t.user_email || '', plan: 'trial' })
      }
    })
    return list.sort((a, b) => (a.name || a.user_id || '').localeCompare(b.name || b.user_id || ''))
  }, [usersList, queueTasks])

  // Reset to first page when filter / search / data size changes
  React.useEffect(() => { setPage(1) }, [queueStatusFilter, queueSearch, queueTasks.length, perPage])

  const totalPages = Math.max(1, Math.ceil(queueTasks.length / perPage))
  const safePage = Math.min(page, totalPages)
  const pagedTasks = React.useMemo(() => {
    const start = (safePage - 1) * perPage
    return queueTasks.slice(start, start + perPage)
  }, [queueTasks, safePage, perPage])
  const rangeFrom = queueTasks.length === 0 ? 0 : (safePage - 1) * perPage + 1
  const rangeTo = Math.min(safePage * perPage, queueTasks.length)

  const pageNumbers = React.useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const nums = new Set<number>([1, 2, safePage - 1, safePage, safePage + 1, totalPages - 1, totalPages])
    return [...nums].filter(n => n >= 1 && n <= totalPages).sort((a, b) => a - b)
  }, [totalPages, safePage])

  const pickFilter = (st: string) => {
    setQueueStatusFilter(st)
    fetchQueueData(st, queueSearch)
  }

  const handleTriggerCandidate = async () => {
    if (!selectedCandidate) return
    const active = queueTasks.find((t) => t.user_id === selectedCandidate && (t.status === 'pending' || t.status === 'running'))
    await handleQueueAction('trigger_on_demand', undefined, {
      userId: selectedCandidate,
      force: forceTrigger || Boolean(active)
    })
  }

  const dotFor = (t: any) => {
    if (t.status === 'pending') return 'bg-amber-400'
    if (t.status === 'running') return 'bg-emerald-400 animate-pulse'
    if (t.status === 'completed') return 'bg-emerald-500'
    if (t.status === 'cancelled' || t.status === 'stopped') return 'bg-zinc-500'
    return 'bg-rose-400'
  }
  const labelFor = (t: any) => {
    if (t.status === 'pending') return t.queue_position ? `#${t.queue_position} · Pending` : 'Pending'
    if (t.status === 'running') return 'Running'
    if (t.status === 'completed') return 'Done'
    if (t.status === 'cancelled' || t.status === 'stopped') return 'Skipped'
    return 'Failed'
  }

  return (
    <div className="space-y-3">
      {/* ── Compact toolbar ── */}
      <div className="rounded-xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 px-3 py-2.5 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 min-w-0 mr-auto">
          <span className={`w-2 h-2 rounded-full shrink-0 ${workerStatus.is_busy ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white light:text-zinc-900 truncate">
              Queue
              <span className="ml-1.5 font-mono font-normal text-[11px] text-zinc-500">
                {queueMetrics.pending + queueMetrics.running} active · {queueMetrics.total} total
              </span>
              {fleet && (
                <span className="ml-1.5 font-mono font-normal text-[11px] text-zinc-500" title={(fleet.workers || []).map((w: any) => `${w.hostname || w.worker_id}: ${w.online ? (w.current_task_user ? `running ${w.current_task_user}` : 'idle') : 'offline'}`).join('\n')}>
                  · {fleet.online_count} worker{fleet.online_count === 1 ? '' : 's'}
                </span>
              )}
            </p>
            {workerStatus.is_busy ? (
              <p className="text-[11px] text-zinc-500 truncate">
                Running <span className="text-zinc-300 light:text-zinc-700 font-mono">{workerStatus.active_user_id}</span>
              </p>
            ) : (
              <p className="text-[11px] text-zinc-600 light:text-zinc-500">Worker idle · FIFO pickup every 3s</p>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={queueSearch}
            onChange={(e) => { setQueueSearch(e.target.value); fetchQueueData(queueStatusFilter, e.target.value) }}
            placeholder="Search…"
            className="w-40 focus:w-52 transition-all bg-black light:bg-zinc-50 border border-zinc-800 light:border-zinc-200 focus:border-zinc-600 rounded-lg pl-8 pr-2 py-1.5 text-xs text-white light:text-zinc-900 placeholder-zinc-600 outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowTrigger(v => !v)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border cursor-pointer transition-colors ${showTrigger || selectedCandidate ? 'bg-sky-500/10 border-sky-500/40 text-sky-300 light:text-sky-700' : 'bg-zinc-900 light:bg-zinc-100 border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 hover:border-zinc-700'}`}
        >
          <Zap className="w-3.5 h-3.5" />
          Run
          <ChevronDown className={`w-3 h-3 transition-transform ${showTrigger ? 'rotate-180' : ''}`} />
        </button>
        <button
          type="button"
          onClick={() => fetchQueueData(queueStatusFilter, queueSearch)}
          className="p-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 border border-zinc-800 light:border-zinc-200 text-zinc-400 cursor-pointer"
          title="Refresh queue"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingQueue ? 'animate-spin' : ''}`} />
        </button>
        <button
          type="button"
          onClick={() => handleQueueAction('reclaim_stale')}
          disabled={actionProcessingId === 'reclaim_stale'}
          className="p-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 border border-zinc-800 light:border-zinc-200 text-zinc-400 cursor-pointer disabled:opacity-50"
          title="Reclaim stale running tasks"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${actionProcessingId === 'reclaim_stale' ? 'animate-spin' : ''}`} />
        </button>
        {queueMetrics.pending > 0 && (
          <button
            type="button"
            onClick={onOpenConfirmCancelAll}
            className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 light:text-rose-600 text-xs font-medium cursor-pointer"
          >
            Clear {queueMetrics.pending}
          </button>
        )}
        {workerStatus.is_busy && workerStatus.active_task_id && (
          <button
            type="button"
            onClick={() => handleQueueAction('mark_not_to_execute', workerStatus.active_task_id!)}
            disabled={actionProcessingId === workerStatus.active_task_id}
            className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 light:text-rose-600 text-xs font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <StopCircle className="w-3.5 h-3.5" /> Abort
          </button>
        )}
      </div>

      {/* ── Inline trigger strip (collapsible) ── */}
      {showTrigger && (
        <div className="rounded-xl bg-[#09090b] light:bg-white border border-sky-500/25 px-3 py-2.5 flex flex-wrap items-center gap-2">
          <select
            value={selectedCandidate}
            onChange={(e) => setSelectedCandidate(e.target.value)}
            className="flex-1 min-w-[200px] px-2.5 py-1.5 rounded-lg bg-black light:bg-zinc-50 border border-zinc-700 light:border-zinc-300 text-white light:text-zinc-900 text-xs font-mono focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="">Select candidate… ({candidateOptions.length})</option>
            <option value="admin">All candidates (sequential sweep)</option>
            {candidateOptions.map((u: any) => {
              const active = queueTasks.some((t) => t.user_id === u.user_id && (t.status === 'pending' || t.status === 'running'))
              return (
                <option key={u.user_id} value={u.user_id}>
                  {u.name || u.email || u.user_id}{active ? '  [queued]' : ''}
                </option>
              )
            })}
          </select>
          <label className="flex items-center gap-1.5 text-[11px] text-zinc-500 cursor-pointer select-none">
            <input type="checkbox" checked={forceTrigger} onChange={(e) => setForceTrigger(e.target.checked)} className="accent-sky-500 w-3.5 h-3.5" />
            Force
          </label>
          <button
            type="button"
            onClick={handleTriggerCandidate}
            disabled={!selectedCandidate || actionProcessingId === 'trigger_on_demand'}
            className="px-3 py-1.5 rounded-lg bg-white light:bg-zinc-900 text-black light:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            {actionProcessingId === 'trigger_on_demand' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Enqueue
          </button>
        </div>
      )}

      {/* ── Notification (one line) ── */}
      {queueNotification && (
        <div className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 border ${queueNotification.type === 'success' ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300 light:text-emerald-700 light:bg-emerald-50' : 'bg-rose-950/30 border-rose-800/40 text-rose-300 light:text-rose-600 light:bg-rose-50'}`}>
          {queueNotification.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
          <span className="truncate flex-1">{queueNotification.message}</span>
          <button type="button" onClick={() => setQueueNotification(null)} className="opacity-60 hover:opacity-100 cursor-pointer shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Status pills + pagination summary ── */}
      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_PILLS.map(p => {
          const active = queueStatusFilter === p.key
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => pickFilter(p.key)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer transition-colors ${active ? 'bg-white light:bg-zinc-900 text-black light:text-white border-white light:border-zinc-900' : 'bg-transparent text-zinc-500 hover:text-zinc-200 light:hover:text-zinc-800 border-zinc-800 light:border-zinc-200'}`}
            >
              {p.label} <span className={`font-mono ${active ? 'opacity-70' : 'text-zinc-600'}`}>{countFor(queueMetrics, p.key)}</span>
            </button>
          )
        })}
        <span className="ml-auto text-[11px] font-mono text-zinc-600">
          {queueTasks.length === 0 ? '0 results' : `${rangeFrom}–${rangeTo} of ${queueTasks.length}`}
        </span>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 light:border-zinc-200 text-zinc-500 font-medium text-[11px]">
                <th className="py-2 px-3 font-medium">Status</th>
                <th className="py-2 px-3 font-medium">Candidate</th>
                <th className="py-2 px-3 font-medium hidden lg:table-cell">Timeline</th>
                <th className="py-2 px-3 font-medium">Result</th>
                <th className="py-2 px-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70 light:divide-zinc-100">
              {loadingQueue && queueTasks.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-zinc-600 text-xs">Loading queue…</td></tr>
              ) : pagedTasks.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-zinc-600 text-xs">No tasks match this filter.</td></tr>
              ) : (
                pagedTasks.map((t: any) => {
                  const isPending = t.status === 'pending'
                  const isRunning = t.status === 'running'
                  const isSkipped = t.status === 'cancelled' || t.status === 'stopped'
                  const busy = actionProcessingId === t.task_id
                  return (
                    <tr key={t.id || t._id || t.task_id} className="hover:bg-zinc-900/40 light:hover:bg-zinc-50 transition-colors">
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-300 light:text-zinc-700">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotFor(t)}`} />
                          {labelFor(t)}
                        </span>
                        {t.jobs_applied > 0 && (
                          <span className="ml-1.5 font-mono text-[10px] text-sky-400">· {t.jobs_applied} applied</span>
                        )}
                      </td>
                      <td className="py-2 px-3 min-w-0">
                        <div className="font-medium text-white light:text-zinc-900 truncate max-w-[220px]">{t.candidate_name || t.user_id}</div>
                        <div className="text-[11px] text-zinc-500 font-mono truncate max-w-[220px]">
                          {t.candidate_email || t.user_id}
                          {t.is_vip ? <span className="ml-1 text-amber-400 font-sans font-semibold">VIP</span> : t.candidate_plan ? ` · ${t.candidate_plan}` : ''}
                          {' · '}{shortSource(t.source)}{t.headless ? '' : ' · headed'}
                        </div>
                      </td>
                      <td className="py-2 px-3 hidden lg:table-cell whitespace-nowrap text-[11px] font-mono text-zinc-500">
                        {fmtTime(t.created_at)}
                        {t.started_at && <span className="text-zinc-600"> → {fmtTime(t.started_at)}</span>}
                      </td>
                      <td className="py-2 px-3 min-w-0 max-w-[260px]">
                        <p className="text-[11px] text-zinc-500 truncate">
                          {t.summary || t.error_message || (isPending ? 'Waiting for turn' : isRunning ? 'Applying live…' : isSkipped ? 'Skipped' : '—')}
                        </p>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectExecutionLog(t)}
                            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 light:hover:bg-zinc-100 cursor-pointer"
                            title={`View logs (${t.logs_count || t.logs_preview?.length || 0})`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          {(isPending || isRunning) && (
                            <button
                              type="button"
                              onClick={() => handleQueueAction('mark_not_to_execute', t.task_id)}
                              disabled={busy}
                              className="px-2 py-1 rounded-md text-[11px] text-zinc-500 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer disabled:opacity-50"
                              title={isRunning ? 'Abort execution' : 'Skip task'}
                            >
                              {busy ? '…' : isRunning ? 'Abort' : 'Skip'}
                            </button>
                          )}
                          {isSkipped && (
                            <button
                              type="button"
                              onClick={() => handleQueueAction('requeue', t.task_id)}
                              disabled={busy}
                              className="px-2 py-1 rounded-md text-[11px] text-zinc-500 hover:text-sky-300 hover:bg-sky-500/10 cursor-pointer disabled:opacity-50"
                              title="Re-queue"
                            >
                              {busy ? '…' : 'Retry'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => { if (confirm('Delete this task record?')) handleQueueAction('delete', t.task_id) }}
                            disabled={busy}
                            className="p-1.5 rounded-md text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {!isPending && !isRunning && !isSkipped && (
                            <span className="w-[52px]" />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination footer ── */}
        {queueTasks.length > 0 && (
          <div className="px-3 py-2 border-t border-zinc-800 light:border-zinc-200 flex flex-wrap items-center gap-2">
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="px-1.5 py-1 rounded-md bg-black light:bg-zinc-50 border border-zinc-800 light:border-zinc-200 text-[11px] font-mono text-zinc-400 cursor-pointer focus:outline-none"
              title="Rows per page"
            >
              {PAGE_SIZES.map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
            <span className="text-[11px] font-mono text-zinc-600">
              {rangeFrom}–{rangeTo} of {queueTasks.length}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-1.5 rounded-md border border-zinc-800 light:border-zinc-200 text-zinc-400 hover:text-white light:hover:text-zinc-900 disabled:opacity-30 cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {pageNumbers.map((n, i, arr) => (
                <React.Fragment key={n}>
                  {i > 0 && n - arr[i - 1] > 1 && <span className="text-zinc-700 text-[11px] px-0.5">…</span>}
                  <button
                    type="button"
                    onClick={() => setPage(n)}
                    className={`min-w-[28px] px-1.5 py-1 rounded-md text-[11px] font-mono border cursor-pointer ${n === safePage ? 'bg-white light:bg-zinc-900 text-black light:text-white border-white light:border-zinc-900' : 'text-zinc-500 border-transparent hover:border-zinc-700'}`}
                  >
                    {n}
                  </button>
                </React.Fragment>
              ))}
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-1.5 rounded-md border border-zinc-800 light:border-zinc-200 text-zinc-400 hover:text-white light:hover:text-zinc-900 disabled:opacity-30 cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* collapsed-state affordance (kept for parent toggle compat) */}
      {queueTableCollapsed && (
        <button
          type="button"
          onClick={toggleQueueTable}
          className="w-full text-center text-[11px] text-zinc-600 hover:text-zinc-300 py-1 cursor-pointer"
        >
          Table collapsed by preference — click to expand
        </button>
      )}
    </div>
  )
}
