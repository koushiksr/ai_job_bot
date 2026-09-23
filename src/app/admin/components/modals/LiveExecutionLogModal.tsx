'use client'

import React, { useEffect, useState, useRef } from 'react'
import { FileText, X, StopCircle, RefreshCw, Radio } from 'lucide-react'

interface LiveExecutionLogModalProps {
  log: any | null
  onClose: () => void
  onQueueAction: (action: string, taskId: string) => Promise<void>
}

export default function LiveExecutionLogModal({
  log,
  onClose,
  onQueueAction
}: LiveExecutionLogModalProps) {
  const [currentLog, setCurrentLog] = useState<any | null>(log)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [stopping, setStopping] = useState(false)
  const logContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCurrentLog(log)
  }, [log])

  useEffect(() => {
    if (!currentLog) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentLog, onClose])

  // Auto-poll live execution logs every 2 seconds if task is running
  useEffect(() => {
    if (!currentLog || (currentLog.status !== 'running' && currentLog.status !== 'pending')) return

    const pollTaskLogs = async () => {
      try {
        setIsRefreshing(true)
        const res = await fetch(`/api/admin/queue?q=${encodeURIComponent(currentLog.task_id)}&limit=1`, {
          headers: {
            'x-user-id': 'admin'
          }
        })
        if (res.ok) {
          const data = await res.json()
          const matched = (data.tasks || []).find((t: any) => t.task_id === currentLog.task_id || t.id === currentLog.id)
          if (matched) {
            setCurrentLog((prev: any) => ({ ...prev, ...matched }))
          }
        }
      } catch (err) {
        console.warn('Failed to stream task logs:', err)
      } finally {
        setIsRefreshing(false)
      }
    }

    const timer = setInterval(pollTaskLogs, 2000)
    return () => clearInterval(timer)
  }, [currentLog?.task_id, currentLog?.status])

  // Auto-scroll to bottom on new log line
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [currentLog?.logs_preview?.length])

  if (!currentLog) return null

  const isRunning = currentLog.status === 'running'

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 light:bg-white/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 rounded-2xl overflow-hidden shadow-2xl shadow-black flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="p-4 bg-zinc-900 light:bg-zinc-100 border-b border-zinc-800 light:border-zinc-200 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white light:text-zinc-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Execution Stream: {currentLog.candidate_name} ({currentLog.user_id})</span>
              {isRunning && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 light:text-emerald-700 border border-emerald-500/40 light:border-emerald-300 animate-pulse">
                  <Radio className="w-2.5 h-2.5 text-emerald-400 light:text-emerald-600" />
                  LIVE STREAMING
                </span>
              )}
            </h4>
            <p className="text-[11px] text-zinc-400 light:text-zinc-600 font-mono mt-0.5">
              Task ID: {currentLog.task_id} · Status:{' '}
              <span className={`uppercase font-bold ${
                isRunning ? 'text-emerald-400 light:text-emerald-600' : currentLog.status === 'failed' ? 'text-rose-400 light:text-rose-600' : 'text-sky-300'
              }`}>
                {currentLog.status}
              </span>
              {currentLog.started_at && (
                <span className="ml-2 text-zinc-500 light:text-zinc-600">
                  Started: {new Date(currentLog.started_at).toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isRefreshing && (
              <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              aria-label="Close execution stream"
              className="p-1.5 rounded-lg text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 bg-zinc-800 light:bg-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer z-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Logs Content Area */}
        <div 
          ref={logContainerRef}
          className="p-4 bg-black light:bg-white overflow-y-auto flex-1 font-mono text-xs space-y-1 select-text scroll-smooth"
        >
          {currentLog.logs_preview && currentLog.logs_preview.length > 0 ? (
            currentLog.logs_preview.map((line: string, i: number) => (
              <div
                key={i}
                className={`leading-relaxed ${
                  line.includes('❌') || line.includes('Error') || line.includes('Failed')
                    ? 'text-rose-400 light:text-rose-600 font-medium'
                    : line.includes('🛑') || line.includes('⚠️')
                    ? 'text-amber-400 light:text-amber-600'
                    : line.includes('🎉') || line.includes('APPLIED!') || line.includes('COMPLETED')
                    ? 'text-emerald-400 light:text-emerald-600 font-semibold'
                    : line.includes('🎬') || line.includes('🚀') || line.includes('Company resolved')
                    ? 'text-sky-300'
                    : 'text-zinc-300 light:text-zinc-700'
                }`}
              >
                {line}
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-zinc-500 light:text-zinc-600 italic">
              No log lines captured yet for this task.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-zinc-900 light:bg-zinc-100 border-t border-zinc-800 light:border-zinc-200 flex items-center justify-between text-xs">
          <div className="text-zinc-400 light:text-zinc-600">
            Captured Lines: <strong className="text-white light:text-zinc-900">{currentLog.logs_count || currentLog.logs_preview?.length || 0}</strong>
            {isRunning && (
              <span className="ml-2 text-zinc-500 light:text-zinc-600 text-[11px]">(Auto-refreshing every 2s)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isRunning && (
              <button
                type="button"
                disabled={stopping}
                onClick={async () => {
                  setStopping(true)
                  try {
                    await onQueueAction('mark_not_to_execute', currentLog.task_id)
                    setCurrentLog((prev: any) => ({ ...prev, status: 'cancelled' }))
                  } finally {
                    setStopping(false)
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 light:border-rose-300 text-rose-300 light:text-rose-600 font-semibold cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>{stopping ? 'Stopping...' : 'Stop / Halt Task'}</span>
              </button>
            )}

            {currentLog.status === 'pending' && (
              <button
                type="button"
                onClick={() => {
                  onQueueAction('mark_not_to_execute', currentLog.task_id)
                  onClose()
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 light:border-rose-300 text-rose-300 light:text-rose-600 font-semibold cursor-pointer"
              >
                Mark Not to Execute
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-zinc-800 light:bg-zinc-200 hover:bg-zinc-700 text-white light:text-zinc-900 font-semibold cursor-pointer"
            >
              Close Log
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
