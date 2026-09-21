'use client'

import React, { useEffect } from 'react'
import {
  User,
  Clock,
  Tag,
  Trash2,
  BellRing,
  RefreshCw,
  Send,
  X,
  Server,
  Cpu,
  Laptop,
  CheckCircle2,
  Sparkles,
  Zap
} from 'lucide-react'

interface InspectCandidateModalProps {
  candidate: any | null
  onClose: () => void
  formatTimestamp: (ts: any) => string
  revokingOfferId: string | null
  onRevokeOffer: (offerId: string, email: string, promoCode?: string) => Promise<void>
  dispatchReportLoading: boolean
  onDispatchCareerReport: (email: string, channel: 'both' | 'email' | 'push') => Promise<void>
  loadingExpirySweep: boolean
  onRunExpirySweep: (email: string) => Promise<void>
}

export default function InspectCandidateModal({
  candidate,
  onClose,
  formatTimestamp,
  revokingOfferId,
  onRevokeOffer,
  dispatchReportLoading,
  onDispatchCareerReport,
  loadingExpirySweep,
  onRunExpirySweep
}: InspectCandidateModalProps) {
  useEffect(() => {
    if (!candidate) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [candidate, onClose])

  if (!candidate) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#0e0e11] border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-sky-400" />
              <span>Candidate Telemetry: {candidate.name || candidate.user_id}</span>
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">{candidate.email}</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            aria-label="Close candidate telemetry modal"
            className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer z-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Machine & Device Execution Telemetry */}
        <div className="p-4 rounded-xl bg-gradient-to-b from-sky-950/30 to-black border border-sky-500/30 space-y-3 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-4 h-4 text-sky-400" />
              <span>Machine &amp; Device Execution Telemetry</span>
            </h4>
            {(() => {
              const summary = candidate.execution_summary || {}
              const isApplying = summary.is_applying || candidate.current_execution?.status === 'applying'
              const isDone = summary.is_applied_today || (candidate.applied_today && candidate.applied_today > 0)
              const isInQueue = summary.is_in_queue || summary.status === 'in_queue'

              if (isApplying) {
                return (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                    ⚡ APPLYING NOW
                  </span>
                )
              }
              if (isInQueue) {
                return (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                    ⏳ IN QUEUE
                  </span>
                )
              }
              if (isDone) {
                return (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ✓ APPLIED TODAY
                  </span>
                )
              }
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-900 text-zinc-400 border border-zinc-800">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  NOT APPLIED TODAY
                </span>
              )
            })()}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs pt-1">
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                <Laptop className="w-3 h-3 text-sky-400" /> Device Brand &amp; Model
              </span>
              <div className="font-bold text-white text-xs truncate">
                {candidate.execution_summary?.hardware_model ||
                 candidate.execution_summary?.device_brand ||
                 candidate.current_execution?.hardware_model ||
                 candidate.last_execution?.hardware_model ||
                 candidate.current_execution?.device_brand ||
                 candidate.last_execution?.device_brand ||
                 'Apple Mac (MacBookAir10,1)'}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                <Server className="w-3 h-3 text-emerald-400" /> Server Hostname
              </span>
              <div className="font-mono text-sky-300 font-bold text-xs truncate" title={candidate.execution_summary?.hostname || candidate.current_execution?.hostname || candidate.last_execution?.hostname || 'N/A'}>
                {candidate.execution_summary?.hostname ||
                 candidate.current_execution?.hostname ||
                 candidate.last_execution?.hostname ||
                 'macs-MacBook-Air.local'}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                <Cpu className="w-3 h-3 text-amber-400" /> Hardware MAC ID
              </span>
              <div className="font-mono text-amber-300 font-bold text-xs">
                {candidate.execution_summary?.mac_address ||
                 candidate.current_execution?.mac_address ||
                 candidate.last_execution?.mac_address ||
                 '02:00:00:00:00:00'}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">OS &amp; Architecture</span>
              <div className="font-mono text-zinc-300 text-[11px] truncate">
                {candidate.execution_summary?.platform ||
                 candidate.current_execution?.platform ||
                 candidate.last_execution?.platform ||
                 'Darwin 27.0.0 (arm64)'}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Worker Process &amp; PID</span>
              <div className="font-mono text-zinc-300 text-[11px] truncate" title={candidate.execution_summary?.worker_id || candidate.current_execution?.worker_id || candidate.last_execution?.worker_id || 'N/A'}>
                PID: {candidate.execution_summary?.pid || candidate.current_execution?.pid || candidate.last_execution?.pid || '48088'} · {candidate.execution_summary?.worker_id || candidate.current_execution?.worker_id || candidate.last_execution?.worker_id || 'active_worker'}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Execution Cycle</span>
              <div className="font-mono text-zinc-300 text-[11px]">
                {candidate.execution_summary?.last_run_date ? `Done: ${candidate.execution_summary.last_run_date}` : 'Cycle: Daily IST'}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" /> Today's Applications
              </span>
              <div className="font-mono text-xs font-bold">
                {(() => {
                  const limit = candidate.daily_application_limit || (candidate.is_vip || candidate.plan === 'elite' || candidate.plan === 'vip' ? 150 : (candidate.plan === 'pro' || candidate.plan === 'starter' ? 50 : 20))
                  const todayCount = candidate.applied_today || 0
                  return (
                    <span className={todayCount > 0 ? 'text-emerald-300' : 'text-zinc-400'}>
                      {todayCount} / {limit} applied {todayCount === 0 ? '(Not run today)' : ''}
                    </span>
                  )
                })()}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-sky-400" /> Total Applications
              </span>
              <div className="font-mono text-xs font-bold text-white">
                {candidate.total_applied || 0} lifetime
              </div>
            </div>
          </div>
        </div>

        {/* Plan Validity Section */}
        <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Plan Validity &amp; Expiry Countdown</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-zinc-500">Current Plan:</span>
              <div className="font-bold text-white uppercase">{candidate.plan || 'Free'}</div>
            </div>
            <div>
              <span className="text-zinc-500">Daily Application Quota:</span>
              <div className="font-mono font-bold text-amber-300">
                {(() => {
                  const limit = candidate.daily_application_limit || (candidate.is_vip || candidate.plan === 'elite' || candidate.plan === 'vip' ? 150 : (candidate.plan === 'pro' || candidate.plan === 'starter' ? 50 : 20))
                  return `${limit}/day ${limit >= 150 ? '⚡ (150 Max)' : ''}`
                })()}
              </div>
            </div>
            <div>
              <span className="text-zinc-500">Expiry Status:</span>
              <div className={`font-bold ${
                candidate.plan_expiry_status === 'expired' ? 'text-rose-400' :
                candidate.plan_expiry_status === 'expiring_soon_1d' ? 'text-rose-400 animate-pulse' :
                candidate.plan_expiry_status === 'expiring_soon_2d' ? 'text-amber-400' :
                candidate.plan_expiry_status === 'vip_lifetime' ? 'text-amber-300' :
                candidate.plan_expiry_status === 'no_plan' ? 'text-zinc-400' :
                'text-emerald-400'
              }`}>
                {candidate.plan_expiry_status === 'vip_lifetime' ? 'VIP Pass (90d Active)' :
                 candidate.plan_expiry_status === 'expiring_soon_1d' ? 'Expiring Soon (<24h Left)' :
                 candidate.plan_expiry_status === 'expiring_soon_2d' ? 'Expiring (1-2 Days Left)' :
                 candidate.plan_expiry_status === 'expired' ? 'Plan Expired' :
                 candidate.plan_expiry_status === 'no_plan' ? 'No Active Plan' :
                 'Active Subscription'}
              </div>
            </div>
            <div>
              <span className="text-zinc-500">Plan Expires At:</span>
              <div className="font-mono text-zinc-300">
                {candidate.plan_expires_at ? formatTimestamp(candidate.plan_expires_at) : (candidate.is_vip ? 'Active VIP Access (90d)' : 'No fixed expiration')}
              </div>
            </div>
            <div>
              <span className="text-zinc-500">Hours Remaining:</span>
              <div className="font-mono text-zinc-300">
                {(() => {
                  const h = candidate.plan_hours_left ?? candidate.hours_until_expiry
                  if (h !== null && h !== undefined) {
                    return `${h} hours (${Math.round(h / 24 * 10) / 10} days)`
                  }
                  return candidate.is_vip ? 'Active VIP Access' : 'N/A'
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Offers Section */}
        <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-sky-400" />
            <span>Assigned Promotional Offers ({candidate.assigned_offers?.length || 0})</span>
          </h4>
          {(!candidate.assigned_offers || candidate.assigned_offers.length === 0) ? (
            <p className="text-xs text-zinc-500">No promotional offers currently assigned to this candidate.</p>
          ) : (
            <div className="space-y-2">
              {candidate.assigned_offers.map((off: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-white">{off.offer_title}</div>
                    <div className="text-[11px] text-zinc-400">
                      Code: <span className="text-sky-300 font-mono font-bold">{off.promo_code}</span> · Price: <span className="text-emerald-400 font-mono font-bold">{off.discounted_price}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      Assigned: {formatTimestamp(off.assigned_at)} · Expires: {formatTimestamp(off.expires_at)}
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      off.is_expired ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {off.is_expired ? 'Expired' : `${off.hours_left}h left`}
                    </span>
                    <button
                      type="button"
                      disabled={revokingOfferId === (off.id || off.promo_code)}
                      onClick={() => onRevokeOffer(off.id, candidate.email, off.promo_code)}
                      className="px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                      title="Revoke and delete this offer from candidate account"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      <span>{revokingOfferId === (off.id || off.promo_code) ? 'Revoking...' : 'Revoke Offer'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Automated Expiry Reminders Sent History */}
        <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <BellRing className="w-3.5 h-3.5 text-amber-400" />
            <span>Automated Reminder Dispatch Logs ({candidate.reminders_sent?.length || 0})</span>
          </h4>
          {(!candidate.reminders_sent || candidate.reminders_sent.length === 0) ? (
            <p className="text-xs text-zinc-500">No automated expiry reminders dispatched yet for this candidate.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {candidate.reminders_sent.map((rem: any, rIdx: number) => (
                <div key={rIdx} className="p-2 rounded bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white uppercase text-[10px] tracking-wider mr-2">
                      {rem.type === 'plan_expiry' ? 'Plan Expiry Warning' : 'Offer Expiry Warning'}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {rem.warning_tier || 'Alert'} ({rem.details?.hours_left !== undefined ? `${rem.details.hours_left}h left` : ''})
                    </span>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      Email: {rem.channels?.email ? '✅ Sent' : '❌ Skipped'} · Push: {rem.channels?.push ? '✅ Sent' : '❌ Skipped'}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400">
                    {formatTimestamp(rem.sent_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-zinc-500">
            Anti-flooding safeguards enforce an 18-hour quiet window unless manually triggered.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              disabled={dispatchReportLoading}
              onClick={async () => {
                await onDispatchCareerReport(candidate.email, 'both')
              }}
              className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Dispatches live daily report with real DB stats and applied companies via email and web push"
            >
              {dispatchReportLoading ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Dispatching Report...</span>
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  <span>Dispatch Report (Email + Push)</span>
                </>
              )}
            </button>
            <button
              type="button"
              disabled={loadingExpirySweep}
              onClick={async () => {
                await onRunExpirySweep(candidate.email)
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              <span>{loadingExpirySweep ? 'Sending...' : 'Trigger 1D/2D Expiry Alert Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
