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
  Compass
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
}

export default function AdminTabsNav({
  activeTab,
  onTabChange,
  candidatesCount,
  ticketStats,
  queueMetrics,
  workerStatus,
  paymentsCount,
  enterpriseLeadsCount
}: AdminTabsNavProps) {
  return (
    <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 flex-wrap">
      <button
        type="button"
        onClick={() => onTabChange('candidates')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
          activeTab === 'candidates'
            ? 'bg-zinc-800 text-white'
            : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
        }`}
      >
        <Users className="w-3.5 h-3.5" /> Candidate Profiles ({candidatesCount})
      </button>

      <button
        type="button"
        onClick={() => onTabChange('requests')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
          activeTab === 'requests'
            ? 'bg-zinc-800 text-white shadow-sm'
            : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
        }`}
      >
        <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
        <span>User Requests &amp; Queries</span>
        {ticketStats.open > 0 ? (
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono font-bold">
            {ticketStats.open} open
          </span>
        ) : (
          <span className="text-[10px] font-mono text-zinc-500">
            ({ticketStats.total})
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onTabChange('queue')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
          activeTab === 'queue'
            ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-sky-500/30'
            : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
        }`}
      >
        <Layers className="w-3.5 h-3.5 text-sky-400" />
        <span>Execution Queue</span>
        {queueMetrics.pending > 0 && (
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold animate-pulse">
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
            ? 'bg-zinc-800 text-white'
            : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
        }`}
      >
        <CreditCard className="w-3.5 h-3.5" /> Payments ({paymentsCount})
      </button>

      <button
        type="button"
        onClick={() => onTabChange('offers')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
          activeTab === 'offers'
            ? 'bg-zinc-800 text-white shadow-sm'
            : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
        }`}
      >
        <Tag className="w-3.5 h-3.5 text-amber-400" />
        <span>Purchase Offers &amp; Campaigns</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('enterprise_leads')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
          activeTab === 'enterprise_leads'
            ? 'bg-zinc-800 text-white'
            : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
        }`}
      >
        <Building2 className="w-3.5 h-3.5" /> Enterprise Leads ({enterpriseLeadsCount})
      </button>

      <button
        type="button"
        onClick={() => onTabChange('logs')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
          activeTab === 'logs'
            ? 'bg-zinc-800 text-white'
            : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
        }`}
      >
        <History className="w-3.5 h-3.5" /> Activity Audit &amp; System Logs
      </button>

      <button
        type="button"
        onClick={() => onTabChange('visitors')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
          activeTab === 'visitors'
            ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-cyan-500/40'
            : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
        }`}
      >
        <Compass className="w-3.5 h-3.5 text-cyan-400" />
        <span>Live Visitors &amp; Telemetry</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Live tracking active" />
      </button>
    </div>
  )
}
