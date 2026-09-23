'use client'

import React, { useEffect } from 'react'
import { AlertTriangle, Ban } from 'lucide-react'

interface ConfirmCancelAllModalProps {
  isOpen: boolean
  pendingCount: number
  isProcessing: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export default function ConfirmCancelAllModal({
  isOpen,
  pendingCount,
  isProcessing,
  onClose,
  onConfirm
}: ConfirmCancelAllModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

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
        className="w-full max-w-md bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 rounded-2xl p-6 shadow-2xl shadow-black space-y-4"
      >
        <div className="flex items-center gap-3 text-rose-400 light:text-rose-600">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white light:text-zinc-900">Cancel Entire Pending Queue?</h3>
            <p className="text-[11px] text-zinc-400 light:text-zinc-600">Confirmation safeguard</p>
          </div>
        </div>

        <p className="text-xs text-zinc-300 light:text-zinc-700 leading-relaxed">
          You are about to mark all <strong className="text-white light:text-zinc-900 font-bold">{pendingCount} pending task(s)</strong> as <span className="text-rose-400 light:text-rose-600 font-semibold">&ldquo;Not to Execute&rdquo;</span>.
          The background worker will skip these tasks and will not run browser automations for them.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 light:bg-zinc-200 hover:bg-zinc-700 text-zinc-300 light:text-zinc-700 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white light:text-zinc-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Yes, Cancel All ({pendingCount})</span>
          </button>
        </div>
      </div>
    </div>
  )
}
