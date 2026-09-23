'use client'

import React from 'react'
import {
  Bell,
  BellOff,
  BellRing,
  CheckCircle2,
  Settings,
  Users,
  Clock,
  Calendar,
  Sparkles,
  Zap,
  AlertCircle,
  Cpu,
  Layers
} from 'lucide-react'
import { AdminOverviewMetrics, AdminExecutionCounts } from '../types'

interface AdminOverviewStatsProps {
  overviewMetrics: AdminOverviewMetrics
  executionCounts?: AdminExecutionCounts
  onFilterByExecutionStatus?: (status: string) => void
  currentExecutionStatusFilter?: string
  notificationPermission: string
  notificationBannerDismissed: boolean
  onDismissBanner: () => void
  onRequestNotification: () => void
  onSendTestNotification: () => void
  testNotificationSent: boolean
  onOpenUnblockGuide: () => void
  adminEmail: string
}

export default function AdminOverviewStats({
  overviewMetrics,
  executionCounts,
  onFilterByExecutionStatus,
  currentExecutionStatusFilter = 'all',
  notificationPermission,
  notificationBannerDismissed,
  onDismissBanner,
  onRequestNotification,
  onSendTestNotification,
  testNotificationSent,
  onOpenUnblockGuide,
  adminEmail
}: AdminOverviewStatsProps) {
  const activeFilter = currentExecutionStatusFilter || 'all'

  return (
    <div className="space-y-4">
      {/* 1. Unified Telemetry & Notification Control Bar */}
      <div className="px-4 py-2.5 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800/90 light:border-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs relative overflow-hidden shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-sky-400/80 to-transparent animate-laser-sweep pointer-events-none" />
        
        {/* Left: Cluster Telemetry Status */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-zinc-200 light:text-zinc-900 font-semibold tracking-wide">
            Cluster Active &amp; Synchronized
          </span>
          <span className="text-zinc-600 hidden sm:inline">·</span>
          <span className="text-zinc-400 light:text-zinc-600 font-mono text-[11px] hidden sm:inline">
            Daily Auto-Run: 06:00 AM IST
          </span>
        </div>

        {/* Right: Quick Notification Pill & Admin Tag */}
        <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto text-[11px]">
          {notificationPermission === 'denied' && (
            <button
              type="button"
              onClick={onOpenUnblockGuide}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 light:text-amber-700 hover:bg-amber-500/25 transition-colors cursor-pointer font-medium"
              title="Browser notifications are blocked. Tap to view unblock guide."
            >
              <BellOff className="w-3 h-3 text-amber-400" />
              <span>Notifications Blocked</span>
              <Settings className="w-2.5 h-2.5 opacity-70" />
            </button>
          )}

          {notificationPermission === 'default' && !notificationBannerDismissed && (
            <button
              type="button"
              onClick={onRequestNotification}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 light:text-sky-700 hover:bg-sky-500/25 transition-colors cursor-pointer font-medium"
              title="Enable push alerts for automated run completions"
            >
              <BellRing className="w-3 h-3 text-sky-400" />
              <span>Enable Push Alerts</span>
            </button>
          )}

          {notificationPermission === 'granted' && (
            <button
              type="button"
              onClick={onSendTestNotification}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 light:text-emerald-700 hover:bg-emerald-500/20 transition-colors cursor-pointer font-medium"
              title="Click to dispatch a test notification"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>{testNotificationSent ? 'Alert Dispatched' : 'Push Active (Test)'}</span>
            </button>
          )}

          <div className="h-3.5 w-px bg-zinc-800 light:bg-zinc-200 hidden sm:block" />

          <span className="text-zinc-400 light:text-zinc-600 font-mono">
            Admin: <strong className="text-zinc-200 light:text-zinc-800">{adminEmail || 'technohmsit@gmail.com'}</strong>
          </span>
        </div>
      </div>

      {/* 2. Unified Command Deck: Core KPIs + Integrated Pipeline Filters */}
      <div className="rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800/90 light:border-zinc-200 p-4 sm:p-5 space-y-4 shadow-sm">
        {/* Top: 4 Core Platform Metrics in One Clean Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Metric 1: Total Candidates */}
          <div className="p-3.5 rounded-xl bg-zinc-950/70 light:bg-zinc-50 border border-zinc-800/60 light:border-zinc-200 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400 light:text-zinc-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-sky-400" /> Candidates
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 light:bg-zinc-200 text-zinc-300 light:text-zinc-700">
                {overviewMetrics.scheduled_profiles_active} Active
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-white light:text-zinc-900 tracking-tight">
              {overviewMetrics.total_profiles}
            </div>
            <p className="text-[11px] text-zinc-500 light:text-zinc-500 flex items-center gap-1.5">
              <span>{overviewMetrics.vip_profiles_count} VIP pass</span>
              <span className="text-zinc-700">·</span>
              <span>Configured</span>
            </p>
          </div>

          {/* Metric 2: Today Applied */}
          <div className="p-3.5 rounded-xl bg-zinc-950/70 light:bg-zinc-50 border border-zinc-800/60 light:border-zinc-200 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400 light:text-zinc-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Today Applied
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 light:text-emerald-700">
                24h IST
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 light:text-emerald-600 tracking-tight">
              {overviewMetrics.applied_today}
            </div>
            <p className="text-[11px] text-zinc-500 light:text-zinc-500">
              Submitted in current cycle
            </p>
          </div>

          {/* Metric 3: This Week */}
          <div className="p-3.5 rounded-xl bg-zinc-950/70 light:bg-zinc-50 border border-zinc-800/60 light:border-zinc-200 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400 light:text-zinc-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> This Week
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 light:text-amber-700">
                7d
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-white light:text-zinc-900 tracking-tight">
              {overviewMetrics.applied_this_week}
            </div>
            <p className="text-[11px] text-zinc-500 light:text-zinc-500">
              Submitted past 7 days
            </p>
          </div>

          {/* Metric 4: All-Time Verified */}
          <div className="p-3.5 rounded-xl bg-zinc-950/70 light:bg-zinc-50 border border-zinc-800/60 light:border-zinc-200 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400 light:text-zinc-600">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Total Verified
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-400 light:text-indigo-700">
                All-Time
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-white light:text-zinc-900 tracking-tight">
              {overviewMetrics.total_applied}
            </div>
            <p className="text-[11px] text-zinc-500 light:text-zinc-500">
              Verified job applications
            </p>
          </div>
        </div>

        {/* Bottom: Integrated Real-Time Execution Pipeline Filters */}
        <div className="pt-3 border-t border-zinc-800/80 light:border-zinc-200 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold text-zinc-300 light:text-zinc-700 uppercase tracking-wider text-[11px]">
                Today&apos;s Execution Pipeline Filter
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 light:text-zinc-500">
              Click any status below to filter candidates table
            </span>
          </div>

          {/* Interactive Filter Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {/* All */}
            <button
              type="button"
              onClick={() => onFilterByExecutionStatus && onFilterByExecutionStatus('all')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                activeFilter === 'all'
                  ? 'bg-zinc-800 light:bg-zinc-200 border-zinc-600 light:border-zinc-400 shadow-sm text-white light:text-zinc-900'
                  : 'bg-zinc-950/60 light:bg-zinc-50/80 hover:bg-zinc-900 light:hover:bg-zinc-100 border-zinc-800/70 light:border-zinc-200 text-zinc-400 light:text-zinc-600'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-medium truncate">All Profiles</span>
              </div>
              <span className="font-mono text-xs font-bold shrink-0">
                {executionCounts?.all ?? overviewMetrics.total_profiles}
              </span>
            </button>

            {/* Progressing Now */}
            <button
              type="button"
              onClick={() => onFilterByExecutionStatus && onFilterByExecutionStatus('applying')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                activeFilter === 'applying'
                  ? 'bg-sky-950/60 light:bg-sky-100 border-sky-500 text-sky-200 light:text-sky-900 shadow-sm ring-1 ring-sky-500/40'
                  : 'bg-zinc-950/60 light:bg-zinc-50/80 hover:bg-sky-950/30 light:hover:bg-sky-50 border-zinc-800/70 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-sky-300'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                </span>
                <span className="text-xs font-medium truncate">Applying Now</span>
              </div>
              <span className="font-mono text-xs font-bold text-sky-400 light:text-sky-600 shrink-0">
                {executionCounts?.applying ?? 0}
              </span>
            </button>

            {/* Done Today */}
            <button
              type="button"
              onClick={() => onFilterByExecutionStatus && onFilterByExecutionStatus('applied_today')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                activeFilter === 'applied_today'
                  ? 'bg-emerald-950/60 light:bg-emerald-100 border-emerald-500 text-emerald-200 light:text-emerald-900 shadow-sm ring-1 ring-emerald-500/40'
                  : 'bg-zinc-950/60 light:bg-zinc-50/80 hover:bg-emerald-950/30 light:hover:bg-emerald-50 border-zinc-800/70 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-xs font-medium truncate">Done Today</span>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-400 light:text-emerald-600 shrink-0">
                {executionCounts?.applied_today ?? 0}
              </span>
            </button>

            {/* In Queue */}
            <button
              type="button"
              onClick={() => onFilterByExecutionStatus && onFilterByExecutionStatus('in_queue')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                activeFilter === 'in_queue'
                  ? 'bg-amber-950/60 light:bg-amber-100 border-amber-500 text-amber-200 light:text-amber-900 shadow-sm ring-1 ring-amber-500/40'
                  : 'bg-zinc-950/60 light:bg-zinc-50/80 hover:bg-amber-950/30 light:hover:bg-amber-50 border-zinc-800/70 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-amber-300'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-xs font-medium truncate">In Queue</span>
              </div>
              <span className="font-mono text-xs font-bold text-amber-400 light:text-amber-600 shrink-0">
                {executionCounts?.in_queue ?? 0}
              </span>
            </button>

            {/* Need to be Done / Scheduled */}
            <button
              type="button"
              onClick={() => onFilterByExecutionStatus && onFilterByExecutionStatus('not_applied_today')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                activeFilter === 'not_applied_today'
                  ? 'bg-zinc-800 light:bg-zinc-200 border-zinc-600 text-white light:text-zinc-900 shadow-sm ring-1 ring-zinc-500/40'
                  : 'bg-zinc-950/60 light:bg-zinc-50/80 hover:bg-zinc-900 light:hover:bg-zinc-100 border-zinc-800/70 light:border-zinc-200 text-zinc-400 light:text-zinc-600'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="text-xs font-medium truncate">Scheduled</span>
              </div>
              <span className="font-mono text-xs font-bold text-zinc-200 light:text-zinc-800 shrink-0">
                {executionCounts?.not_applied_today ?? 0}
              </span>
            </button>

            {/* Plan Required */}
            <button
              type="button"
              onClick={() => onFilterByExecutionStatus && onFilterByExecutionStatus('payment_required')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                activeFilter === 'payment_required'
                  ? 'bg-rose-950/60 light:bg-rose-100 border-rose-500 text-rose-200 light:text-rose-900 shadow-sm ring-1 ring-rose-500/40'
                  : 'bg-zinc-950/60 light:bg-zinc-50/80 hover:bg-rose-950/30 light:hover:bg-rose-50 border-zinc-800/70 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-rose-300'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="text-xs font-medium truncate">Plan Paused</span>
              </div>
              <span className="font-mono text-xs font-bold text-rose-400 light:text-rose-600 shrink-0">
                {executionCounts?.payment_required ?? 0}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
