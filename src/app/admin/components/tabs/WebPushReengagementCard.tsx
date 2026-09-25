'use client'

import React, { useState, useEffect } from 'react'
import {
  Bell,
  Send,
  Sparkles,
  ShieldCheck,
  Users,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Gift,
  ExternalLink,
  Smartphone
} from 'lucide-react'

interface DripCampaign {
  id: string
  title: string
  body: string
  url: string
  tag: string
  badgeText: string
  category: string
}

interface AudienceStats {
  total_subscriptions: number
  anonymous_devices: number
  unpaid_user_devices: number
  paid_devices_excluded: number
  eligible_devices: number
}

interface RecentDispatch {
  id: string
  campaign_id: string
  campaign_title: string
  recipient_count: number
  web_push_delivered: number
  web_push_failed: number
  dispatched_at: string
  dispatched_by: string
}

export default function WebPushReengagementCard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AudienceStats>({
    total_subscriptions: 0,
    anonymous_devices: 0,
    unpaid_user_devices: 0,
    paid_devices_excluded: 0,
    eligible_devices: 0
  })
  const [campaigns, setCampaigns] = useState<DripCampaign[]>([])
  const [recentDispatches, setRecentDispatches] = useState<RecentDispatch[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('camp_pro_499')
  const [forceAll, setForceAll] = useState(false)
  const [dispatching, setDispatching] = useState(false)
  const [dispatchResult, setDispatchResult] = useState<any>(null)
  const [dispatchError, setDispatchError] = useState<string>('')

  const fetchDripData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/push-notification/drip')
      if (!res.ok) throw new Error('Failed to load drip audience data')
      const data = await res.json()
      if (data.stats) setStats(data.stats)
      if (data.campaigns) {
        setCampaigns(data.campaigns)
        if (!selectedCampaignId && data.campaigns[0]) {
          setSelectedCampaignId(data.campaigns[0].id)
        }
      }
      if (data.recent_dispatches) setRecentDispatches(data.recent_dispatches)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDripData()
  }, [])

  const handleDispatch = async () => {
    setDispatching(true)
    setDispatchResult(null)
    setDispatchError('')
    try {
      const res = await fetch('/api/admin/push-notification/drip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: selectedCampaignId,
          force_all: forceAll
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch push')

      setDispatchResult(data.result)
      await fetchDripData()
    } catch (err: any) {
      setDispatchError(err.message || 'Error dispatching campaign')
    } finally {
      setDispatching(false)
    }
  }

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0]

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-black light:from-indigo-50 light:via-white light:to-zinc-50 border border-indigo-500/20 light:border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white light:text-zinc-900">
                Visitor &amp; Unpaid Device Re-engagement (Web Push)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 light:text-indigo-700 border border-indigo-500/40">
                Closed-Tab Push
              </span>
            </div>
            <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
              Target anonymous browsers and unpaid visitors with high-converting offers. Paid subscribers are automatically excluded to preserve user trust.
            </p>
          </div>
        </div>

        <button
          onClick={fetchDripData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 light:text-zinc-700 border border-zinc-800 light:border-zinc-300 transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audience</span>
        </button>
      </div>

      {/* Audience Segmentation Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200">
          <div className="text-[11px] font-medium text-zinc-400 light:text-zinc-600 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            <span>Total Push Devices</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white light:text-zinc-900 mt-1">
            {stats.total_subscriptions}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Active browser subscriptions</div>
        </div>

        <div className="p-4 rounded-xl bg-cyan-950/20 light:bg-cyan-50/60 border border-cyan-500/20 light:border-cyan-300">
          <div className="text-[11px] font-medium text-cyan-400 light:text-cyan-700 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Anonymous Browsers</span>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 light:text-cyan-700 mt-1">
            {stats.anonymous_devices}
          </div>
          <div className="text-[10px] text-cyan-400/70 light:text-cyan-600/80 mt-0.5">No account created yet</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-950/20 light:bg-amber-50/60 border border-amber-500/20 light:border-amber-300">
          <div className="text-[11px] font-medium text-amber-400 light:text-amber-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Unpaid Candidates</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 light:text-amber-700 mt-1">
            {stats.unpaid_user_devices}
          </div>
          <div className="text-[10px] text-amber-400/70 light:text-amber-600/80 mt-0.5">Free trial / no active plan</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/20 light:bg-emerald-50/60 border border-emerald-500/20 light:border-emerald-300">
          <div className="text-[11px] font-medium text-emerald-400 light:text-emerald-700 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Paid Subscriptions</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 light:text-emerald-700 mt-1">
            {stats.paid_devices_excluded}
          </div>
          <div className="text-[10px] text-emerald-400/70 light:text-emerald-600/80 mt-0.5">100% Excluded &amp; Shielded</div>
        </div>
      </div>

      {/* Campaign Launcher Card */}
      <div className="rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 p-5 sm:p-6 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-white light:text-zinc-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            Select Re-engagement Push Campaign
          </h3>
          <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
            Pick from curated campaigns optimized for conversion, referrals, and urgency.
          </p>
        </div>

        {/* Campaign Pills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {campaigns.map(camp => (
            <div
              key={camp.id}
              onClick={() => setSelectedCampaignId(camp.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedCampaignId === camp.id
                  ? 'bg-indigo-950/40 light:bg-indigo-50/80 border-indigo-500/70 light:border-indigo-400 shadow-sm'
                  : 'bg-zinc-950/60 light:bg-zinc-50 border-zinc-800 light:border-zinc-200 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 light:bg-zinc-200 text-zinc-300 light:text-zinc-700 font-bold uppercase">
                  {camp.badgeText}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">{camp.url}</span>
              </div>
              <h4 className="text-xs font-bold text-white light:text-zinc-900 mt-2">{camp.title}</h4>
              <p className="text-[11px] text-zinc-400 light:text-zinc-600 mt-1 line-clamp-2 leading-relaxed">
                {camp.body}
              </p>
            </div>
          ))}
        </div>

        {/* Selected Campaign Preview & Launch Bar */}
        {selectedCampaign && (
          <div className="p-4 rounded-xl bg-black/60 light:bg-zinc-100/70 border border-zinc-800 light:border-zinc-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="text-zinc-400 light:text-zinc-600 text-[11px]">Ready to push to:</div>
                <div className="font-bold text-white light:text-zinc-900 font-mono flex items-center gap-2">
                  <span className="text-emerald-400">
                    {forceAll ? stats.eligible_devices : Math.max(0, stats.eligible_devices)} eligible devices
                  </span>
                  <span className="text-zinc-500 text-[10px]">
                    ({stats.anonymous_devices} anonymous + {stats.unpaid_user_devices} unpaid candidates)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={forceAll}
                    onChange={e => setForceAll(e.target.checked)}
                    className="rounded bg-zinc-800 border-zinc-700 text-indigo-500 focus:ring-0"
                  />
                  <span>Bypass 18h cooldown</span>
                </label>

                <button
                  onClick={handleDispatch}
                  disabled={dispatching || stats.eligible_devices === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <Send className={`w-3.5 h-3.5 ${dispatching ? 'animate-spin' : ''}`} />
                  <span>{dispatching ? 'Dispatching...' : 'Dispatch Web Push Now'}</span>
                </button>
              </div>
            </div>

            {dispatchResult && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 light:text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Delivered to <strong>{dispatchResult.delivered}</strong> background device(s) successfully! ({dispatchResult.failed} failed/uninstalled endpoints removed).
                </span>
              </div>
            )}

            {dispatchError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 light:text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{dispatchError}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Dispatches Log */}
      {recentDispatches.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-zinc-300 light:text-zinc-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>Recent Web Push Re-engagement Logs ({recentDispatches.length})</span>
          </h4>
          <div className="rounded-xl border border-zinc-800 light:border-zinc-200 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 font-mono text-[11px] border-b border-zinc-800 light:border-zinc-200">
                <tr>
                  <th className="py-2.5 px-3">Campaign</th>
                  <th className="py-2.5 px-3">Delivered</th>
                  <th className="py-2.5 px-3">Dispatched Date</th>
                  <th className="py-2.5 px-3">Triggered By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 light:divide-zinc-200 text-zinc-300 light:text-zinc-700">
                {recentDispatches.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-900/30 light:hover:bg-zinc-50">
                    <td className="py-2.5 px-3 font-semibold text-white light:text-zinc-900">
                      {item.campaign_title}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400 light:text-emerald-700 font-bold">
                      {item.web_push_delivered} devices
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500 text-[11px]">
                      {new Date(item.dispatched_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-zinc-400">
                      {item.dispatched_by}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
