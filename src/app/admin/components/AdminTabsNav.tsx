'use client'

import React from 'react'
import {
  Users,
  MessageSquare,
  Layers,
  CreditCard,
  Tag,
  Building2,
  History,
  Compass,
  Star
} from 'lucide-react'
import { AdminTabType, AdminQueueMetrics, AdminWorkerStatus, TicketStats } from '../types'

interface AdminTabsNavProps {
  activeTab: AdminTabType
  onTabChange: (tab: AdminTabType) => void
  candidatesCount: number
  ticketStats: TicketStats
  queueMetrics: AdminQueueMetrics
  workerStatus: AdminWorkerStatus
  paymentsCount: number
  enterpriseLeadsCount: number
  enterpriseOrgsCount?: number
  pendingReviewsCount?: number
}

export default function AdminTabsNav({
  activeTab,
  onTabChange,
  candidatesCount,
  ticketStats,
  queueMetrics,
  workerStatus,
  paymentsCount,
  enterpriseLeadsCount,
  enterpriseOrgsCount,
  pendingReviewsCount
}: AdminTabsNavProps) {
  return (
    <div className="flex items-center gap-2 border-b border-zinc-900 light:border-zinc-200 pb-3 flex-wrap">
      <button
        type="button"
        onClick={() => onTabChange('candidates')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
          activeTab === 'candidates'
            ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900'
            : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 bg-black light:bg-white border border-zinc-800 light:border-zinc-200'
        }`}
      >
        <Users className="w-3.5 h-3.5" /> Candidate Profiles ({candidatesCount})
      </button>

      <button
        type="button"
        onClick={() => onTabChange('requests')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
          activeTab === 'requests'
            ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 shadow-sm'
            : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 bg-black light:bg-white border border-zinc-800 light:border-zinc-200'
        }`}
      >
        <MessageSquare className="w-3.5 h-3.5 text-teal-400 light:text-cyan-600" />
        <span>User Requests &amp; Queries</span>
        {ticketStats.open > 0 ? (
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-500/20 text-rose-300 light:text-rose-600 border border-rose-500/30 font-mono font-bold">
            {ticketStats.open} open
          </span>
        ) : (
          <span className="text-[10px] font-mono text-zinc-500 light:text-zinc-600">
            ({ticketStats.total})
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onTabChange('queue')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
          activeTab === 'queue'
            ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 shadow-sm ring-1 ring-sky-500/30'
            : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 bg-black light:bg-white border border-zinc-800 light:border-zinc-200'
        }`}
      >
        <Layers className="w-3.5 h-3.5 text-sky-400" />
        <span>Execution Queue</span>
        {queueMetrics.pending > 0 && (
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 light:text-amber-700 font-mono font-bold animate-pulse">
            {queueMetrics.pending} in line
          </span>
        )}
        {workerStatus.is_busy && (
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" title="Worker active" />
        )}
      </button>

      <button
        type="button"
        onClick={() => onTabChange('payments')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
          activeTab === 'payments'
            ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900'
            : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 bg-black light:bg-white border border-zinc-800 light:border-zinc-200'
        }`}
      >
        <CreditCard className="w-3.5 h-3.5" /> Payments ({paymentsCount})
      </button>

      <button
        type="button"
        onClick={() => onTabChange('offers')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
          activeTab === 'offers'
            ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 shadow-sm'
            : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 bg-black light:bg-white border border-zinc-800 light:border-zinc-200'
        }`}
      >
        <Tag className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" />
        <span>Purchase Offers &amp; Campaigns</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('enterprise_leads')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
          activeTab === 'enterprise_leads'
            ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900'
            : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 bg-black light:bg-white border border-zinc-800 light:border-zinc-200'
        }`}
      >
        <Building2 className="w-3.5 h-3.5" /> Enterprise Leads ({enterpriseLeadsCount})
      </button>

      <button
        type="button"
        onClick={() => onTabChange('enterprise_orgs')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
          activeTab === 'enterprise_orgs'
            ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 shadow-sm ring-1 ring-indigo-500/40'
            : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 bg-black light:bg-white border border-zinc-800 light:border-zinc-200'
        }`}
      >
        <Building2 className="w-3.5 h-3.5 text-indigo-400" />
        <span>Enterprise Orgs</span>
        {typeof enterpriseOrgsCount === 'number' && enterpriseOrgsCount > 0 && (
          <span className="text-[10px] font-mono text-zinc-500 light:text-zinc-600">
            ({enterpriseOrgsCount})
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onTabChange('logs')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
          activeTab === 'logs'
            ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900'
            : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 bg-black light:bg-white border border-zinc-800 light:border-zinc-200'
        }`}
      >
        <History className="w-3.5 h-3.5" /> Activity Audit &amp; System Logs
      </button>

      <button
        type="button"
        onClick={() => onTabChange('visitors')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
          activeTab === 'visitors'
            ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 shadow-sm ring-1 ring-cyan-500/40'
            : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 bg-black light:bg-white border border-zinc-800 light:border-zinc-200'
        }`}
      >
        <Compass className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
        <span>Live Visitors &amp; Telemetry</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Live tracking active" />
      </button>

      <button
        type="button"
        onClick={() => onTabChange('reviews')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
          activeTab === 'reviews'
            ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 shadow-sm ring-1 ring-amber-500/40'
            : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 bg-black light:bg-white border border-zinc-800 light:border-zinc-200'
        }`}
      >
        <Star className="w-3.5 h-3.5 text-amber-400 light:text-amber-600 fill-amber-400/20" />
        <span>Reviews &amp; Feedback</span>
        {typeof pendingReviewsCount === 'number' && pendingReviewsCount > 0 ? (
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 light:text-amber-700 font-mono font-bold animate-pulse">
            {pendingReviewsCount} pending
          </span>
        ) : null}
      </button>
    </div>
  )
}
