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
  X
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

        {/* Plan Validity Section */}
        <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Plan Validity &amp; Expiry Countdown</span>
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-500">Current Plan:</span>
              <div className="font-bold text-white uppercase">{candidate.plan || 'Free'}</div>
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
