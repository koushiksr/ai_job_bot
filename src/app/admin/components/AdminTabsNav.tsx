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
    <div className="rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800/90 light:border-zinc-200 p-2 shadow-sm">
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* GROUP 1: OPERATIONS */}
        <div className="flex items-center gap-1">
          {/* Candidates */}
          <button
            type="button"
            onClick={() => onTabChange('candidates')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'candidates'
                ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 shadow-sm'
                : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900/60 light:hover:bg-zinc-100'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>Candidates</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-300 text-zinc-300 light:text-zinc-700">
              {candidatesCount}
            </span>
          </button>

          {/* Queue */}
          <button
            type="button"
            onClick={() => onTabChange('queue')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 shadow-sm ring-1 ring-sky-500/30'
                : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900/60 light:hover:bg-zinc-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Queue</span>
            {queueMetrics.pending > 0 ? (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 light:text-amber-700 border border-amber-500/30 animate-pulse">
                {queueMetrics.pending} wait
              </span>
            ) : workerStatus.is_busy ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" title="Worker busy" />
            ) : null}
          </button>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-zinc-800 light:bg-zinc-200 hidden sm:block mx-1" />

        {/* GROUP 2: REVENUE & OFFERS */}
        <div className="flex items-center gap-1">
          {/* Payments */}
          <button
            type="button"
            onClick={() => onTabChange('payments')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 shadow-sm'
                : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900/60 light:hover:bg-zinc-100'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" />
            <span>Payments</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-300 text-zinc-400 light:text-zinc-600">
              {paymentsCount}
            </span>
          </button>

          {/* Offers & Campaigns */}
          <button
            type="button"
            onClick={() => onTabChange('offers')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'offers'
                ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 shadow-sm ring-1 ring-amber-500/30'
                : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900/60 light:hover:bg-zinc-100'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" />
            <span>Offers</span>
          </button>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-zinc-800 light:bg-zinc-200 hidden sm:block mx-1" />

        {/* GROUP 3: ENTERPRISE */}
        <div className="flex items-center gap-1">
          {/* Enterprise Orgs */}
          <button
            type="button"
            onClick={() => onTabChange('enterprise_orgs')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'enterprise_orgs'
                ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 shadow-sm ring-1 ring-indigo-500/40'
                : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900/60 light:hover:bg-zinc-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Enterprise Orgs</span>
            {typeof enterpriseOrgsCount === 'number' && enterpriseOrgsCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-300 text-zinc-400 light:text-zinc-600">
                {enterpriseOrgsCount}
              </span>
            )}
          </button>

          {/* Enterprise Leads */}
          <button
            type="button"
            onClick={() => onTabChange('enterprise_leads')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'enterprise_leads'
                ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 shadow-sm ring-1 ring-indigo-500/40'
                : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900/60 light:hover:bg-zinc-100'
            }`}
          >
            <span>Leads</span>
            {enterpriseLeadsCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 light:text-indigo-700 font-bold">
                {enterpriseLeadsCount}
              </span>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-zinc-800 light:bg-zinc-200 hidden sm:block mx-1" />

        {/* GROUP 4: TELEMETRY & FEEDBACK */}
        <div className="flex items-center gap-1">
          {/* Logs */}
          <button
            type="button"
            onClick={() => onTabChange('logs')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 shadow-sm'
                : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900/60 light:hover:bg-zinc-100'
            }`}
          >
            <History className="w-3.5 h-3.5 text-zinc-400" />
            <span>Logs</span>
          </button>

          {/* Visitors */}
          <button
            type="button"
            onClick={() => onTabChange('visitors')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'visitors'
                ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 shadow-sm ring-1 ring-cyan-500/30'
                : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900/60 light:hover:bg-zinc-100'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
            <span>Visitors</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* Reviews */}
          <button
            type="button"
            onClick={() => onTabChange('reviews')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 shadow-sm ring-1 ring-amber-500/30'
                : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900/60 light:hover:bg-zinc-100'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400 light:text-amber-600 fill-amber-400/20" />
            <span>Reviews</span>
            {typeof pendingReviewsCount === 'number' && pendingReviewsCount > 0 ? (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 light:text-amber-700 animate-pulse">
                {pendingReviewsCount}
              </span>
            ) : null}
          </button>

          {/* Support — right-most, next to Reviews */}
          <button
            type="button"
            onClick={() => onTabChange('requests')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 shadow-sm ring-1 ring-teal-500/30'
                : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900/60 light:hover:bg-zinc-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-teal-400 light:text-cyan-600" />
            <span>Support</span>
            {ticketStats.open > 0 ? (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 light:text-rose-700 border border-rose-500/30">
                {ticketStats.open}
              </span>
            ) : (
              <span className="text-[10px] font-mono text-zinc-500 light:text-zinc-400">
                {ticketStats.total}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
