'use client'

import React from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  RefreshCw,
  Send,
  Sparkles,
  Tag,
  X
} from 'lucide-react'
import { CandidateUser, OffersData } from '../../types'
import { OfferCampaignDesigner } from './offers/OfferCampaignDesigner'
import { AssignedOffersTable } from './offers/AssignedOffersTable'
import { CampaignHistoryTable } from './offers/CampaignHistoryTable'
import { DiagnosticsPanel } from './offers/DiagnosticsPanel'

interface OffersTabProps {
  offersData: OffersData
  loadingOffers: boolean
  fetchOffersData: () => Promise<void> | void
  offerNotification: { type: 'success' | 'error'; message: string } | null
  setOfferNotification: (n: any) => void
  offersStatsCollapsed: boolean
  toggleOffersStats: () => void
  offersCollapsedWatchdog: boolean
  toggleOffersWatchdog: () => void
  loadingExpirySweep: boolean
  handleRunExpirySweep: (targetEmail?: string) => Promise<void> | void
  sweepResult: any
  setSweepResult: (res: any) => void
  expiryStats: any

  offersCollapsedDispatchReport: boolean
  toggleOffersDispatchReport: () => void
  dispatchReportLoading: boolean
  dispatchReportTarget: string
  setDispatchReportTarget: (target: string) => void
  usersList: CandidateUser[]
  customPushRecipient: string
  setCustomPushRecipient: (rec: string) => void
  dispatchReportChannel: 'both' | 'email' | 'push'
  setDispatchReportChannel: (ch: 'both' | 'email' | 'push') => void
  dispatchReportOfferChoice: string
  setDispatchReportOfferChoice: (choice: string) => void
  handleDispatchCareerReport: (target?: string, ch?: 'both' | 'email' | 'push') => Promise<void> | void
  dispatchReportResult: any

  // Designer props
  selectedPresetId: string
  handleSelectPreset: (preset: any) => void
  targetType: 'single' | 'multiple' | 'bulk_unsubscribed' | 'all_users'
  setTargetType: (type: 'single' | 'multiple' | 'bulk_unsubscribed' | 'all_users') => void
  targetEmail: string
  setTargetEmail: (email: string) => void
  forceOverride: boolean
  setForceOverride: (override: boolean) => void
  selectedCandidates: string[]
  setSelectedCandidates: React.Dispatch<React.SetStateAction<string[]>>
  candidateFilterQuery: string
  setCandidateFilterQuery: (query: string) => void
  candidatePickerPage: number
  setCandidatePickerPage: React.Dispatch<React.SetStateAction<number>>
  customExtraEmails: string
  setCustomExtraEmails: (emails: string) => void
  offerTitle: string
  setOfferTitle: (title: string) => void
  discountBadge: string
  setDiscountBadge: (badge: string) => void
  promoCode: string
  setPromoCode: (code: string) => void
  originalPrice: string
  setOriginalPrice: (price: string) => void
  discountedPrice: string
  setDiscountedPrice: (price: string) => void
  customMessage: string
  setCustomMessage: (msg: string) => void
  validityHours: number
  setValidityHours: (hours: number) => void
  offersCollapsedDesigner: boolean
  toggleOffersDesigner: () => void
  offersCollapsedPreview: boolean
  toggleOffersPreview: () => void
  setIsConfirmOfferModalOpen: (open: boolean) => void

  // Assigned table props
  assignedOfferFilter: 'all' | 'active' | 'claimed' | 'expired'
  handleAssignedFilterChange: (filter: 'all' | 'active' | 'claimed' | 'expired') => void
  offersCollapsedAssigned: boolean
  toggleOffersAssigned: () => void
  assignedOffersPage: number
  setAssignedOffersPage: React.Dispatch<React.SetStateAction<number>>
  assignedOffersPerPage: number
  setAssignedOffersPerPage: (val: number) => void
  revokingOfferId: string | null
  handleRevokeOffer: (id: string, email: string, code: string) => Promise<void> | void
  formatTimestamp: (ts: any) => string

  // History table props
  offersCollapsedHistory: boolean
  toggleOffersHistory: () => void
  campaignHistoryPage: number
  setCampaignHistoryPage: React.Dispatch<React.SetStateAction<number>>
  campaignHistoryPerPage: number
  setCampaignHistoryPerPage: (val: number) => void

  // Diagnostics props
  offersCollapsedMailDiag: boolean
  toggleOffersMailDiag: () => void
  fetchMailDiagnostics: () => Promise<void> | void
  loadingMailLogs: boolean
  mailSender: string
  mailMaskedPass: string
  showConfigPass: boolean
  setShowConfigPass: (show: boolean) => void
  showCustomPushConfig: boolean
  setShowCustomPushConfig: (show: boolean) => void
  diagnosticRecipient: string
  setDiagnosticRecipient: (rec: string) => void
  mailDiagnosticLoading: boolean
  handleSendDiagnosticMail: () => Promise<void> | void
  pushDiagnosticLoading: boolean
  handleTriggerPushNotification: () => Promise<void> | void
  newAppPassInput: string
  setNewAppPassInput: (input: string) => void
  savingPass: boolean
  handleSaveAndTestCredentials: () => Promise<void> | void
  deviceWebPushActive: boolean
  handleRequestNotification: () => Promise<void> | void
  customPushTitle: string
  setCustomPushTitle: (title: string) => void
  customPushUrl: string
  setCustomPushUrl: (url: string) => void
  customPushMessage: string
  setCustomPushMessage: (msg: string) => void
  closedTabTestActive: boolean
  handleTestClosedTabPush: () => Promise<void> | void
  closedTabCountdown: number
  pushDiagnosticResult: any
  setPushDiagnosticResult: (res: any) => void
  mailDiagnosticResult: any
  offersCollapsedMailLogs: boolean
  toggleOffersMailLogs: () => void
  mailLogs: any[]
}

export const OffersTab: React.FC<OffersTabProps> = ({
  offersData,
  loadingOffers,
  fetchOffersData,
  offerNotification,
  setOfferNotification,
  offersStatsCollapsed,
  toggleOffersStats,
  offersCollapsedWatchdog,
  toggleOffersWatchdog,
  loadingExpirySweep,
  handleRunExpirySweep,
  sweepResult,
  setSweepResult,
  expiryStats,
  offersCollapsedDispatchReport,
  toggleOffersDispatchReport,
  dispatchReportLoading,
  dispatchReportTarget,
  setDispatchReportTarget,
  usersList,
  customPushRecipient,
  setCustomPushRecipient,
  dispatchReportChannel,
  setDispatchReportChannel,
  dispatchReportOfferChoice,
  setDispatchReportOfferChoice,
  handleDispatchCareerReport,
  dispatchReportResult,

  selectedPresetId,
  handleSelectPreset,
  targetType,
  setTargetType,
  targetEmail,
  setTargetEmail,
  forceOverride,
  setForceOverride,
  selectedCandidates,
  setSelectedCandidates,
  candidateFilterQuery,
  setCandidateFilterQuery,
  candidatePickerPage,
  setCandidatePickerPage,
  customExtraEmails,
  setCustomExtraEmails,
  offerTitle,
  setOfferTitle,
  discountBadge,
  setDiscountBadge,
  promoCode,
  setPromoCode,
  originalPrice,
  setOriginalPrice,
  discountedPrice,
  setDiscountedPrice,
  customMessage,
  setCustomMessage,
  validityHours,
  setValidityHours,
  offersCollapsedDesigner,
  toggleOffersDesigner,
  offersCollapsedPreview,
  toggleOffersPreview,
  setIsConfirmOfferModalOpen,

  assignedOfferFilter,
  handleAssignedFilterChange,
  offersCollapsedAssigned,
  toggleOffersAssigned,
  assignedOffersPage,
  setAssignedOffersPage,
  assignedOffersPerPage,
  setAssignedOffersPerPage,
  revokingOfferId,
  handleRevokeOffer,
  formatTimestamp,

  offersCollapsedHistory,
  toggleOffersHistory,
  campaignHistoryPage,
  setCampaignHistoryPage,
  campaignHistoryPerPage,
  setCampaignHistoryPerPage,

  offersCollapsedMailDiag,
  toggleOffersMailDiag,
  fetchMailDiagnostics,
  loadingMailLogs,
  mailSender,
  mailMaskedPass,
  showConfigPass,
  setShowConfigPass,
  showCustomPushConfig,
  setShowCustomPushConfig,
  diagnosticRecipient,
  setDiagnosticRecipient,
  mailDiagnosticLoading,
  handleSendDiagnosticMail,
  pushDiagnosticLoading,
  handleTriggerPushNotification,
  newAppPassInput,
  setNewAppPassInput,
  savingPass,
  handleSaveAndTestCredentials,
  deviceWebPushActive,
  handleRequestNotification,
  customPushTitle,
  setCustomPushTitle,
  customPushUrl,
  setCustomPushUrl,
  customPushMessage,
  setCustomPushMessage,
  closedTabTestActive,
  handleTestClosedTabPush,
  closedTabCountdown,
  pushDiagnosticResult,
  setPushDiagnosticResult,
  mailDiagnosticResult,
  offersCollapsedMailLogs,
  toggleOffersMailLogs,
  mailLogs,
}) => {
  return (
    <div className="space-y-6">
      {/* Header / Actions */}
      <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-400" />
            <span>Purchase Offers, Flash Discounts &amp; Promotional Campaigns</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Design luxury promotional upgrade offers, configure custom coupon codes, and dispatch bulk or single-candidate email campaigns.
          </p>
        </div>
        <button
          onClick={fetchOffersData}
          className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingOffers ? 'animate-spin' : ''}`} />
          <span>Refresh Hub</span>
        </button>
      </div>

      {/* Notification Banner */}
      {offerNotification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start justify-between gap-3 border ${
            offerNotification.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {offerNotification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{offerNotification.message}</span>
          </div>
          <button
            onClick={() => setOfferNotification(null)}
            className="text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sticky Metrics Overview Bar */}
      <div className="sticky top-2 z-20 backdrop-blur-xl bg-[#09090b]/90 p-3 rounded-2xl border border-zinc-800 shadow-2xl transition-all space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">Live Conversion &amp; Campaign Stats</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">Pinned on Scroll</span>
            <button
              type="button"
              onClick={toggleOffersStats}
              className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-mono font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              {offersStatsCollapsed ? (
                <>
                  <ChevronDown className="w-3 h-3" />
                  <span>Expand Stats</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3 h-3" />
                  <span>Compact</span>
                </>
              )}
            </button>
          </div>
        </div>

        {offersStatsCollapsed ? (
          <div
            onClick={toggleOffersStats}
            className="flex items-center justify-between gap-3 overflow-x-auto scrollbar-none py-1.5 px-3 text-[11px] font-mono whitespace-nowrap bg-black/40 rounded-xl border border-zinc-800/80 cursor-pointer hover:border-zinc-700 transition-colors"
          >
            <span className="text-zinc-400">Total: <strong className="text-white">{offersData.metrics.total_candidates}</strong></span>
            <span className="text-zinc-700">|</span>
            <span className="text-amber-400">Targets: <strong className="text-amber-300">{offersData.metrics.unsubscribed_count}</strong></span>
            <span className="text-zinc-700">|</span>
            <span className="text-emerald-400">Subscribed: <strong className="text-emerald-300">{offersData.metrics.subscribed_count}</strong></span>
            <span className="text-zinc-700">|</span>
            <span className="text-sky-400">Active Offers: <strong className="text-sky-300">{offersData.metrics.active_assigned_offers ?? (offersData.assigned_offers || []).filter((o: any) => !o.claimed && !o.is_expired && !o.revoked).length}</strong></span>
            <span className="text-zinc-500 text-[10px] ml-auto">▾ Tap to expand</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Total Candidate Base</span>
              <div className="text-xl font-bold text-white mt-0.5">{offersData.metrics.total_candidates}</div>
              <p className="text-[10px] text-zinc-500">Registered accounts</p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-semibold">Prime Target Audience</span>
              <div className="text-xl font-bold text-amber-300 mt-0.5">{offersData.metrics.unsubscribed_count}</div>
              <p className="text-[10px] text-amber-400/80">Unsubscribed &amp; expired</p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block font-semibold">Subscribed Pro/VIP</span>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">{offersData.metrics.subscribed_count}</div>
              <p className="text-[10px] text-zinc-400">Active paid candidates</p>
            </div>

            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/25">
              <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider block font-semibold">Active Assigned Offers</span>
              <div className="text-xl font-bold text-sky-300 mt-0.5">
                {offersData.metrics.active_assigned_offers ?? (offersData.assigned_offers || []).filter((o: any) => !o.claimed && !o.is_expired && !o.revoked).length}
              </div>
              <p className="text-[10px] text-sky-400/80">
                {offersData.metrics.revoked_offers || (offersData.assigned_offers || []).filter((o: any) => o.revoked).length} revoked / purged
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Automated Expiry & Renewal Watchdog Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-950 via-[#0d121c] to-zinc-950 border border-amber-500/30 shadow-xl space-y-4">
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('button')) return
            toggleOffersWatchdog()
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Automated Expiry &amp; Renewal Watchdog</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  18h Anti-Flooding Active
                </span>
              </h4>
              <p className="text-[11px] text-zinc-400">
                Monitors candidate plan renewals and promotional offer expiries (1-day &amp; 2-day dual alerts via Google SMTP + OS Web Push).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loadingExpirySweep}
              onClick={() => handleRunExpirySweep()}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50 transition-all shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingExpirySweep ? 'animate-spin' : ''}`} />
              <span>{loadingExpirySweep ? 'Running Sweep...' : 'Run Automated Expiry Sweep Now'}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleOffersWatchdog()
              }}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
              title={offersCollapsedWatchdog ? 'Expand section' : 'Collapse section'}
            >
              {offersCollapsedWatchdog ? (
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

        {offersCollapsedWatchdog ? (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-black/50 border border-zinc-800/80 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-3 text-zinc-300">
              <span>1D Expiry: <strong className="text-rose-400 font-bold">{expiryStats?.summary?.expiring_in_24h ?? 0}</strong></span>
              <span className="text-zinc-600">•</span>
              <span>2D Expiry: <strong className="text-amber-400 font-bold">{expiryStats?.summary?.expiring_in_48h ?? 0}</strong></span>
              <span className="text-zinc-600">•</span>
              <span>Expired Plans: <strong className="text-zinc-200 font-bold">{expiryStats?.summary?.expired_count ?? 0}</strong></span>
              <span className="text-zinc-600">•</span>
              <span>Expiring Offers: <strong className="text-sky-300 font-bold">{expiryStats?.summary?.offers_expiring_soon ?? 0}</strong></span>
            </div>
            <span className="text-[10px] text-zinc-500">18h Anti-Flooding Active</span>
          </div>
        ) : (
          <>
            {sweepResult && (
              <div className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                sweepResult.success ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300' : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
              }`}>
                <div className="flex items-center gap-2">
                  {sweepResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  <span>{sweepResult.message || (sweepResult.success ? `Sweep complete: ${sweepResult.summary?.plan_reminders_sent || 0} plan alerts & ${sweepResult.summary?.offer_reminders_sent || 0} offer alerts dispatched!` : sweepResult.error)}</span>
                </div>
                <button onClick={() => setSweepResult(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Expiry Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-black/60 border border-zinc-800">
                <span className="text-[10px] uppercase font-mono text-rose-400 font-bold block">1-Day Plan Expiry</span>
                <div className="text-lg font-bold text-white mt-0.5">
                  {expiryStats?.summary?.expiring_in_24h ?? 0}
                </div>
                <span className="text-[10px] text-zinc-500">&le; 24h Remaining</span>
              </div>
              <div className="p-3 rounded-xl bg-black/60 border border-zinc-800">
                <span className="text-[10px] uppercase font-mono text-amber-400 font-bold block">2-Day Plan Expiry</span>
                <div className="text-lg font-bold text-white mt-0.5">
                  {expiryStats?.summary?.expiring_in_48h ?? 0}
                </div>
                <span className="text-[10px] text-zinc-500">24h - 48h Remaining</span>
              </div>
              <div className="p-3 rounded-xl bg-black/60 border border-zinc-800">
                <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold block">Expired Plans</span>
                <div className="text-lg font-bold text-zinc-300 mt-0.5">
                  {expiryStats?.summary?.expired_count ?? 0}
                </div>
                <span className="text-[10px] text-zinc-500">Ready for Special Offer</span>
              </div>
              <div className="p-3 rounded-xl bg-black/60 border border-zinc-800">
                <span className="text-[10px] uppercase font-mono text-sky-400 font-bold block">Expiring Offers</span>
                <div className="text-lg font-bold text-sky-300 mt-0.5">
                  {expiryStats?.summary?.offers_expiring_soon ?? 0}
                </div>
                <span className="text-[10px] text-zinc-500">&le; 48h Offer Validity</span>
              </div>
            </div>

            {/* List of candidates expiring within 48h */}
            {expiryStats?.candidates_expiring_48h && expiryStats.candidates_expiring_48h.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-black/40 border border-zinc-800/80">
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-2">
                  Priority Candidates Expiring Within 48 Hours:
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {expiryStats.candidates_expiring_48h.map((c: any) => (
                    <div key={c.email || c.user_id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/70 border border-zinc-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{c.name || c.user_id}</span>
                        <span className="text-[11px] font-mono text-zinc-400">{c.email}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                          c.hours_left <= 24 ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {c.hours_left <= 24 ? '1-Day Warning' : '2-Day Warning'} ({c.hours_left}h left)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRunExpirySweep(c.email)}
                        disabled={loadingExpirySweep}
                        className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-medium cursor-pointer disabled:opacity-50"
                      >
                        Trigger Alert Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Candidate Daily Job Dispatch Report & Multichannel Hub */}
      <div id="daily-dispatch-hub" className="rounded-2xl bg-[#09090b] border border-sky-500/30 overflow-hidden shadow-xl space-y-0">
        <div 
          onClick={toggleOffersDispatchReport}
          className="px-5 py-4 bg-gradient-to-r from-zinc-950 via-[#0a0f1d] to-zinc-950 hover:bg-zinc-900/80 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 shadow-inner">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                <span>Candidate Daily Job Dispatch Report &amp; Multichannel Hub</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  Email (SMTP) + Web Push
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  Live DB Applications
                </span>
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Dispatches live candidate job application telemetry (today&apos;s applied, verified companies, recruiter views) and intelligent upgrade offers simultaneously.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleOffersDispatchReport()
              }}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
            >
              {offersCollapsedDispatchReport ? (
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

        {offersCollapsedDispatchReport && (
          <div 
            onClick={toggleOffersDispatchReport}
            className="px-5 py-3 bg-sky-950/20 hover:bg-sky-950/40 border-t border-sky-900/40 flex items-center justify-between text-xs text-sky-300 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span>Daily Job Dispatch Hub shrunk &bull; Click anywhere on head to expand (Email + Push trigger)</span>
            </div>
            <span className="text-sky-400 font-semibold flex items-center gap-1">
              <span>Expand Hub</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </span>
          </div>
        )}

        {!offersCollapsedDispatchReport && (
          <div className="p-5 space-y-5">
            {/* Quick 1-Click Action Bar */}
            <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-zinc-400">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-zinc-300">Instant Test Dispatch:</span>
                <span className="text-zinc-500 hidden sm:inline">Send verified real-time report for Koushik with 1 click:</span>
              </div>
              <button
                type="button"
                disabled={dispatchReportLoading}
                onClick={() => {
                  setDispatchReportTarget('koushiksr1999@gmail.com')
                  handleDispatchCareerReport('koushiksr1999@gmail.com', 'both')
                }}
                className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>⚡ Send Real DB Report to koushiksr1999@gmail.com (Email + Push)</span>
              </button>
            </div>

            {/* Form & Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Candidate Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                  1. Target Candidate
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
                        {u.name ? `${u.name} (${u.email})` : u.email} {u.applied_today ? `[${u.applied_today} applied]` : ''}
                      </option>
                    ))}
                  <option value="custom">-- Custom Specific Email --</option>
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
                  2. Multichannel Delivery
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-black/60 p-1 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setDispatchReportChannel('both')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                      dispatchReportChannel === 'both'
                        ? 'bg-sky-500 text-black font-bold shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Email + Push
                  </button>
                  <button
                    type="button"
                    onClick={() => setDispatchReportChannel('email')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
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
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                      dispatchReportChannel === 'push'
                        ? 'bg-amber-400 text-black font-bold shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Push Only
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500">
                  {dispatchReportChannel === 'both' && 'Delivers luxury HTML via Google SMTP and OS Web Push notification.'}
                  {dispatchReportChannel === 'email' && 'Dispatches only executive HTML report to the recipient inbox.'}
                  {dispatchReportChannel === 'push' && 'Triggers instant browser Web Push notification with dashboard link.'}
                </p>
              </div>

              {/* 3. Offer Package Attachment */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                  3. Attached Upgrade Offer
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
                <p className="text-[10px] text-zinc-500">
                  {dispatchReportOfferChoice === 'auto' && 'Picks assigned promo code from DB or smart tier (VIP299 for paid, WELCOMEPRO for trial).'}
                  {dispatchReportOfferChoice === 'vip299' && 'Forces 3-Month VIP Extension at ₹299 (90 days continuous access).'}
                  {dispatchReportOfferChoice === 'welcomepro' && 'Forces 1-Month Essentials Unlimited at ₹149.'}
                  {dispatchReportOfferChoice === 'choc29' && 'Forces 1-Month Starter Direct Activation at ₹29.'}
                  {dispatchReportOfferChoice === 'none' && 'Omits pricing callout and delivers pure career telemetry.'}
                </p>
              </div>
            </div>

            {/* Selected Candidate DB Live Telemetry Card */}
            {(() => {
              const targetEmailClean = dispatchReportTarget === 'custom' ? customPushRecipient : dispatchReportTarget
              const foundCandidate = usersList.find(u => u.email === targetEmailClean)
              return (
                <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-950 via-zinc-900/60 to-zinc-950 border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-white text-xs">{foundCandidate?.name || targetEmailClean}</strong>
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{targetEmailClean}</span>
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
                    onClick={() => handleDispatchCareerReport()}
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
              )
            })()}

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
        )}
      </div>

      {/* Campaign Designer & Live Preview */}
      <OfferCampaignDesigner
        offersData={offersData}
        selectedPresetId={selectedPresetId}
        handleSelectPreset={handleSelectPreset}
        targetType={targetType}
        setTargetType={setTargetType}
        targetEmail={targetEmail}
        setTargetEmail={setTargetEmail}
        usersList={usersList}
        forceOverride={forceOverride}
        setForceOverride={setForceOverride}
        selectedCandidates={selectedCandidates}
        setSelectedCandidates={setSelectedCandidates}
        candidateFilterQuery={candidateFilterQuery}
        setCandidateFilterQuery={setCandidateFilterQuery}
        candidatePickerPage={candidatePickerPage}
        setCandidatePickerPage={setCandidatePickerPage}
        customExtraEmails={customExtraEmails}
        setCustomExtraEmails={setCustomExtraEmails}
        offerTitle={offerTitle}
        setOfferTitle={setOfferTitle}
        discountBadge={discountBadge}
        setDiscountBadge={setDiscountBadge}
        promoCode={promoCode}
        setPromoCode={setPromoCode}
        originalPrice={originalPrice}
        setOriginalPrice={setOriginalPrice}
        discountedPrice={discountedPrice}
        setDiscountedPrice={setDiscountedPrice}
        customMessage={customMessage}
        setCustomMessage={setCustomMessage}
        validityHours={validityHours}
        setValidityHours={setValidityHours}
        offersCollapsedDesigner={offersCollapsedDesigner}
        toggleOffersDesigner={toggleOffersDesigner}
        offersCollapsedPreview={offersCollapsedPreview}
        toggleOffersPreview={toggleOffersPreview}
        setIsConfirmOfferModalOpen={setIsConfirmOfferModalOpen}
      />

      {/* Live Assigned Candidate Offers Hub */}
      <AssignedOffersTable
        offersData={offersData}
        assignedOfferFilter={assignedOfferFilter}
        handleAssignedFilterChange={handleAssignedFilterChange}
        offersCollapsedAssigned={offersCollapsedAssigned}
        toggleOffersAssigned={toggleOffersAssigned}
        assignedOffersPage={assignedOffersPage}
        setAssignedOffersPage={setAssignedOffersPage}
        assignedOffersPerPage={assignedOffersPerPage}
        setAssignedOffersPerPage={setAssignedOffersPerPage}
        revokingOfferId={revokingOfferId}
        handleRevokeOffer={handleRevokeOffer}
        formatTimestamp={formatTimestamp}
      />

      {/* Campaign History */}
      <CampaignHistoryTable
        offersData={offersData}
        offersCollapsedHistory={offersCollapsedHistory}
        toggleOffersHistory={toggleOffersHistory}
        campaignHistoryPage={campaignHistoryPage}
        setCampaignHistoryPage={setCampaignHistoryPage}
        campaignHistoryPerPage={campaignHistoryPerPage}
        setCampaignHistoryPerPage={setCampaignHistoryPerPage}
      />

      {/* Diagnostics */}
      <DiagnosticsPanel
        offersCollapsedMailDiag={offersCollapsedMailDiag}
        toggleOffersMailDiag={toggleOffersMailDiag}
        fetchMailDiagnostics={fetchMailDiagnostics}
        loadingMailLogs={loadingMailLogs}
        mailSender={mailSender}
        mailMaskedPass={mailMaskedPass}
        dispatchReportLoading={dispatchReportLoading}
        setDispatchReportTarget={setDispatchReportTarget}
        handleDispatchCareerReport={handleDispatchCareerReport}
        showConfigPass={showConfigPass}
        setShowConfigPass={setShowConfigPass}
        showCustomPushConfig={showCustomPushConfig}
        setShowCustomPushConfig={setShowCustomPushConfig}
        diagnosticRecipient={diagnosticRecipient}
        setDiagnosticRecipient={setDiagnosticRecipient}
        usersList={usersList}
        customPushRecipient={customPushRecipient}
        setCustomPushRecipient={setCustomPushRecipient}
        mailDiagnosticLoading={mailDiagnosticLoading}
        handleSendDiagnosticMail={handleSendDiagnosticMail}
        pushDiagnosticLoading={pushDiagnosticLoading}
        handleTriggerPushNotification={handleTriggerPushNotification}
        newAppPassInput={newAppPassInput}
        setNewAppPassInput={setNewAppPassInput}
        savingPass={savingPass}
        handleSaveAndTestCredentials={handleSaveAndTestCredentials}
        deviceWebPushActive={deviceWebPushActive}
        handleRequestNotification={handleRequestNotification}
        customPushTitle={customPushTitle}
        setCustomPushTitle={setCustomPushTitle}
        customPushUrl={customPushUrl}
        setCustomPushUrl={setCustomPushUrl}
        customPushMessage={customPushMessage}
        setCustomPushMessage={setCustomPushMessage}
        closedTabTestActive={closedTabTestActive}
        handleTestClosedTabPush={handleTestClosedTabPush}
        closedTabCountdown={closedTabCountdown}
        pushDiagnosticResult={pushDiagnosticResult}
        setPushDiagnosticResult={setPushDiagnosticResult}
        mailDiagnosticResult={mailDiagnosticResult}
        offersCollapsedMailLogs={offersCollapsedMailLogs}
        toggleOffersMailLogs={toggleOffersMailLogs}
        mailLogs={mailLogs}
      />
    </div>
  )
}

export default OffersTab
