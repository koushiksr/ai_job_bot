'use client'

import React, { useEffect } from 'react'
import { FileText, X } from 'lucide-react'

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
  useEffect(() => {
    if (!log) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [log, onClose])

  if (!log) return null

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-black flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Execution Stream: {log.candidate_name} ({log.user_id})</span>
            </h4>
            <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
              Task ID: {log.task_id} · Status: <span className="uppercase text-sky-300 font-bold">{log.status}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            aria-label="Close execution stream"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer z-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Logs Content Area */}
        <div className="p-4 bg-black overflow-y-auto flex-1 font-mono text-xs space-y-1 select-text">
          {log.logs_preview && log.logs_preview.length > 0 ? (
            log.logs_preview.map((line: string, i: number) => (
              <div
                key={i}
                className={`leading-relaxed ${
                  line.includes('❌') || line.includes('Error')
                    ? 'text-rose-400'
                    : line.includes('🛑')
                    ? 'text-amber-400'
                    : line.includes('🎉') || line.includes('COMPLETED')
                    ? 'text-emerald-400 font-semibold'
                    : line.includes('🎬') || line.includes('🚀')
                    ? 'text-sky-300'
                    : 'text-zinc-300'
                }`}
              >
                {line}
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-zinc-500 italic">
              No log lines captured yet for this task.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs">
          <div className="text-zinc-400">
            Total Captured Lines: <strong className="text-white">{log.logs_count}</strong>
          </div>

          <div className="flex items-center gap-2">
            {log.status === 'pending' && (
              <button
                type="button"
                onClick={() => {
                  onQueueAction('mark_not_to_execute', log.task_id)
                  onClose()
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-semibold cursor-pointer"
              >
                Mark Not to Execute
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold cursor-pointer"
            >
              Close Log
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
