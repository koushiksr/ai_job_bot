'use client'

import React from 'react'
import {
  BellOff,
  BellRing,
  Settings,
  Users,
  Clock,
  Calendar,
  Sparkles
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
  // Note: pipeline filter pills were merged into the Candidates toolbar —
  // filter props stay accepted so the parent call site is untouched.
  void onFilterByExecutionStatus
  void currentExecutionStatusFilter
  void executionCounts
  void onSendTestNotification
  void testNotificationSent
  return (
    <div className="space-y-3">
      {/* 1. Slim status bar (test-push block removed) */}
      <div className="px-4 py-2 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800/90 light:border-zinc-200 flex items-center justify-between gap-3 text-xs shadow-sm">
        
        {/* Left: Cluster Telemetry Status */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-zinc-200 light:text-zinc-900 font-semibold tracking-wide truncate">
            Cluster Active &amp; Synchronized
          </span>
          <span className="text-zinc-600 hidden sm:inline">·</span>
          <span className="text-zinc-400 light:text-zinc-600 font-mono text-[11px] hidden sm:inline whitespace-nowrap">
            Daily Auto-Run: 06:00 AM IST
          </span>
        </div>

        {/* Right: actionable prompts only + admin tag */}
        <div className="flex items-center gap-2 shrink-0 text-[11px]">
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

          <div className="h-3.5 w-px bg-zinc-800 light:bg-zinc-200 hidden sm:block" />

          <span className="text-zinc-400 light:text-zinc-600 font-mono whitespace-nowrap">
            Admin: <strong className="text-zinc-200 light:text-zinc-800">{adminEmail || 'technohmsit@gmail.com'}</strong>
          </span>
        </div>
      </div>

      {/* 2. Compact KPI strip: 4 stats, one row */}
      <div className="px-4 py-2.5 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800/90 light:border-zinc-200 shadow-sm flex items-center gap-x-5 gap-y-1 flex-wrap text-xs">
        <span className="flex items-center gap-1.5" title="Total candidate profiles · active in sweep">
          <Users className="w-3.5 h-3.5 text-sky-400" />
          <strong className="font-mono text-sm text-white light:text-zinc-900">{overviewMetrics.total_profiles}</strong>
          <span className="text-zinc-400 light:text-zinc-600">candidates · {overviewMetrics.scheduled_profiles_active} active</span>
        </span>
        <span className="h-4 w-px bg-zinc-800 light:bg-zinc-200 hidden sm:block" />
        <span className="flex items-center gap-1.5" title="Submitted in the current 24h IST cycle">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <strong className="font-mono text-sm text-emerald-400 light:text-emerald-600">{overviewMetrics.applied_today}</strong>
          <span className="text-zinc-400 light:text-zinc-600">today</span>
        </span>
        <span className="h-4 w-px bg-zinc-800 light:bg-zinc-200 hidden sm:block" />
        <span className="flex items-center gap-1.5" title="Submitted in the past 7 days">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <strong className="font-mono text-sm text-white light:text-zinc-900">{overviewMetrics.applied_this_week}</strong>
          <span className="text-zinc-400 light:text-zinc-600">7d</span>
        </span>
        <span className="h-4 w-px bg-zinc-800 light:bg-zinc-200 hidden sm:block" />
        <span className="flex items-center gap-1.5" title="All-time verified job applications">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <strong className="font-mono text-sm text-white light:text-zinc-900">{overviewMetrics.total_applied}</strong>
          <span className="text-zinc-400 light:text-zinc-600">total</span>
        </span>
      </div>
    </div>
  )
}
