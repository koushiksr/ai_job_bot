'use client'

import React, { useEffect } from 'react'
import { BellOff, CheckCircle2, X } from 'lucide-react'

interface AdminUnblockGuideModalProps {
  isOpen: boolean
  onClose: () => void
  onRecheck: () => void
}

export default function AdminUnblockGuideModal({
  isOpen,
  onClose,
  onRecheck
}: AdminUnblockGuideModalProps) {
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <BellOff className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">How to Unblock Push Notifications</h3>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            aria-label="Close unblock guide"
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer z-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-zinc-300">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs">1</span>
            <div>
              <div className="font-semibold text-white">Click the Site Settings / Padlock Icon</div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Look at your browser&apos;s address bar next to <code className="text-amber-300 font-mono text-[10px]">jobfluxai.vercel.app</code> and click the icon.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs">2</span>
            <div>
              <div className="font-semibold text-white">Switch &ldquo;Notifications&rdquo; from Block to Allow</div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                In the site permissions menu, find <strong>Notifications</strong> and change the dropdown setting to <strong>Allow</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs">3</span>
            <div>
              <div className="font-semibold text-white">Verify Connection</div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Click the button below to confirm the permission change and receive an immediate verification alert!
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onRecheck}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>I&apos;ve Allowed It · Check Permission</span>
          </button>
        </div>
      </div>
    </div>
  )
}
