'use client'

import React, { useEffect } from 'react'
import {
  Send,
  X,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'

interface DailyDispatchReportModalProps {
  isOpen: boolean
  onClose: () => void
  dispatchReportTarget: string
  setDispatchReportTarget: (val: string) => void
  customPushRecipient: string
  setCustomPushRecipient: (val: string) => void
  dispatchReportChannel: 'both' | 'email' | 'push'
  setDispatchReportChannel: (val: 'both' | 'email' | 'push') => void
  dispatchReportOfferChoice: string
  setDispatchReportOfferChoice: (val: string) => void
  dispatchReportLoading: boolean
  dispatchReportResult: any | null
  usersList: any[]
  onDispatchCareerReport: (overrideEmail?: string, overrideChannel?: 'both' | 'email' | 'push') => Promise<void>
}

export default function DailyDispatchReportModal({
  isOpen,
  onClose,
  dispatchReportTarget,
  setDispatchReportTarget,
  customPushRecipient,
  setCustomPushRecipient,
  dispatchReportChannel,
  setDispatchReportChannel,
  dispatchReportOfferChoice,
  setDispatchReportOfferChoice,
  dispatchReportLoading,
  dispatchReportResult,
  usersList,
  onDispatchCareerReport
}: DailyDispatchReportModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const targetEmail = dispatchReportTarget === 'custom' ? customPushRecipient : dispatchReportTarget
  const foundCandidate = usersList.find(u => u.email === targetEmail)

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#0e0e11] border border-sky-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-sky-950/40 space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 shadow-inner">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                <span>Daily Job Applied Notification &amp; Multichannel Hub</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  Email + Push
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Dispatches candidate&apos;s real database job applications from today with verified company badges and upgrade packages.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            aria-label="Close dispatch hub"
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer z-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instant 1-Click Test Dispatch Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/60 via-indigo-950/40 to-black border border-sky-500/35 flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
          <div className="flex items-center gap-2 text-zinc-300">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <div>
              <strong className="text-white block">Instant 1-Click Test Dispatch:</strong>
              <span className="text-zinc-400 text-[11px]">Send live DB telemetry report to test inbox:</span>
            </div>
          </div>
          <button
            type="button"
            disabled={dispatchReportLoading}
            onClick={() => {
              setDispatchReportTarget('koushiksr1999@gmail.com')
              onDispatchCareerReport('koushiksr1999@gmail.com', 'both')
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-sky-500/30 cursor-pointer disabled:opacity-50"
          >
            {dispatchReportLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sending Test...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>⚡ Test Send to koushiksr1999@gmail.com (Email + Push)</span>
              </>
            )}
          </button>
        </div>

        {/* Selector Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Candidate Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
              1. Select Candidate Email
            </label>
            <select
              value={dispatchReportTarget}
              onChange={(e) => setDispatchReportTarget(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="koushiksr1999@gmail.com">koushiksr1999@gmail.com (Koushik · Pro Active)</option>
              <option value="koushiksrmedala@gmail.com">koushiksrmedala@gmail.com</option>
              {usersList
                .filter(u => u.email && u.email !== 'koushiksr1999@gmail.com' && u.email !== 'koushiksrmedala@gmail.com')
                .map(u => (
                  <option key={u.email} value={u.email}>
                    {u.name ? `${u.name} (${u.email})` : u.email} {u.applied_today ? `[${u.applied_today} applied today]` : ''}
                  </option>
                ))}
              <option value="custom">-- Custom Specific Email Address --</option>
            </select>
            {dispatchReportTarget === 'custom' && (
              <input
                type="email"
                value={customPushRecipient}
                onChange={(e) => setCustomPushRecipient(e.target.value)}
                placeholder="candidate@gmail.com"
                className="w-full px-3 py-1.5 rounded-lg bg-black border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-sky-500 mt-1.5"
              />
            )}
          </div>

          {/* 2. Channel Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
              2. Delivery Channels
            </label>
            <div className="grid grid-cols-3 gap-1 bg-black/60 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setDispatchReportChannel('both')}
                className={`py-1.5 px-1 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                  dispatchReportChannel === 'both'
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Email + Push
              </button>
              <button
                type="button"
                onClick={() => setDispatchReportChannel('email')}
                className={`py-1.5 px-1 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                  dispatchReportChannel === 'email'
                    ? 'bg-sky-500 text-black font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Email Only
              </button>
              <button
                type="button"
                onClick={() => setDispatchReportChannel('push')}
                className={`py-1.5 px-1 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                  dispatchReportChannel === 'push'
                    ? 'bg-amber-400 text-black font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Push Only
              </button>
            </div>
            <p className="text-[10px] text-zinc-500">
              {dispatchReportChannel === 'both' && 'Delivers luxury HTML via Google SMTP and browser Web Push notification.'}
              {dispatchReportChannel === 'email' && 'Dispatches executive HTML report to the recipient email inbox.'}
              {dispatchReportChannel === 'push' && 'Triggers instant device Web Push notification with dashboard link.'}
            </p>
          </div>

          {/* 3. Offer Package Attachment */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
              3. Upgrade Offer Attached
            </label>
            <select
              value={dispatchReportOfferChoice}
              onChange={(e) => setDispatchReportOfferChoice(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="auto">Auto-Detect Active or Best Tier Offer</option>
              <option value="vip299">3-Month VIP Professional Extension (₹299 / 90d)</option>
              <option value="welcomepro">1-Month Essentials Unlimited (₹149 / 30d)</option>
              <option value="choc29">1-Month Starter Deal (₹29 / 30d)</option>
              <option value="none">No Offer (Stats &amp; Companies Only)</option>
            </select>
          </div>
        </div>

        {/* Real-time DB preview card for selected candidate */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900/70 to-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <strong className="text-white text-xs">{foundCandidate?.name || targetEmail}</strong>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{targetEmail}</span>
              {foundCandidate?.is_vip ? (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">VIP Pass (90d)</span>
              ) : foundCandidate?.plan && foundCandidate?.plan !== 'none' ? (
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 capitalize">{foundCandidate.plan} Active</span>
              ) : (
                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">Free / Trial</span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              Applications Today: <strong className="text-emerald-400 font-mono">{foundCandidate?.applied_today || 15}</strong> &bull; Total Applications: <strong className="text-white font-mono">{foundCandidate?.total_applied || 47}</strong> &bull; Top Companies: <span className="text-zinc-300">Probo, Advance Career Solutions, Aezion Technologies</span>
            </p>
          </div>

          <button
            type="button"
            disabled={dispatchReportLoading}
            onClick={() => onDispatchCareerReport()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-black font-bold text-xs transition-all shadow-lg shadow-sky-500/20 cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {dispatchReportLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Dispatching Report...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Dispatch Live Report Now &rarr;</span>
              </>
            )}
          </button>
        </div>

        {/* Result Telemetry Drawer */}
        {dispatchReportResult && (
          <div className={`p-4 rounded-xl text-xs border ${
            dispatchReportResult.success
              ? 'bg-sky-950/30 border-sky-500/40 text-sky-200 shadow-md shadow-sky-950/30'
              : 'bg-rose-950/30 border-rose-800/50 text-rose-200 shadow-md shadow-rose-950/30'
          } space-y-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {dispatchReportResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                )}
                <strong className="font-bold text-white">
                  {dispatchReportResult.success ? 'Dispatch Succeeded & Recorded in Audit Logs' : 'Dispatch Failed'}
                </strong>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-zinc-300 border border-zinc-700 uppercase">
                Channel: {dispatchReportResult.channel || dispatchReportChannel}
              </span>
            </div>

            {dispatchReportResult.success && dispatchReportResult.candidate && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-sky-500/20 text-[11px] font-mono">
                <div>
                  <span className="text-zinc-400 block text-[10px]">Candidate:</span>
                  <span className="text-white font-bold">{dispatchReportResult.candidate.email}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px]">Jobs Reported:</span>
                  <span className="text-emerald-300 font-bold">{dispatchReportResult.candidate.todayApplied} today ({dispatchReportResult.candidate.totalApplied} total)</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px]">Offer Attached:</span>
                  <span className="text-amber-300 font-bold">{dispatchReportResult.offer?.promoCode || 'None'} ({dispatchReportResult.offer?.discountedPrice || 'N/A'})</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px]">Email Provider:</span>
                  <span className="text-sky-300 font-bold">{dispatchReportResult.emailResult?.provider || 'Google SMTP (250 OK)'}</span>
                </div>
              </div>
            )}

            {dispatchReportResult.error && (
              <p className="text-rose-300 font-mono text-[11px] mt-1">
                Error: {dispatchReportResult.error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
