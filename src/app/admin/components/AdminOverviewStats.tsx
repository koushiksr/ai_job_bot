'use client'

import React from 'react'
import {
  Bell,
  BellOff,
  BellRing,
  CheckCircle2,
  Settings,
  X,
  Users,
  Crown,
  Clock,
  Calendar,
  Sparkles,
  Zap,
  AlertCircle,
  Cpu,
  Laptop,
  Server
} from 'lucide-react'
import { AdminOverviewMetrics, AdminExecutionCounts } from '../types'

interface AdminOverviewStatsProps {
  overviewMetrics: AdminOverviewMetrics
  executionCounts?: AdminExecutionCounts
  onFilterByExecutionStatus?: (status: string) => void
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
  notificationPermission,
  notificationBannerDismissed,
  onDismissBanner,
  onRequestNotification,
  onSendTestNotification,
  testNotificationSent,
  onOpenUnblockGuide,
  adminEmail
}: AdminOverviewStatsProps) {
  return (
    <div className="space-y-6">
      {/* Browser Push Notifications Assistant Banner for Admin */}
      {notificationPermission === 'denied' && (
        <div className="p-3 sm:p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <BellOff className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-2">
                <span>Browser Push Notifications Blocked</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">Action Required</span>
              </div>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Your browser is currently blocking notifications for JobFlux AI. Enable them to receive real-time admin dispatch confirmations &amp; queue updates.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenUnblockGuide}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5 shrink-0 self-end sm:self-auto"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>How to Unblock (1-Click Guide)</span>
          </button>
        </div>
      )}

      {notificationPermission === 'default' && !notificationBannerDismissed && (
        <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Enable Real-Time Admin Push Notifications</div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Receive immediate alerts when background worker sweeps complete, tickets are filed, or purchase offers are dispatched.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={onDismissBanner}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onRequestNotification}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Allow Notifications</span>
            </button>
          </div>
        </div>
      )}

      {notificationPermission === 'granted' && (
        <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-800/30 text-emerald-300 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Real-time push notifications active for admin alerts, worker sweeps, and queue dispatches.</span>
          </div>
          <button
            type="button"
            onClick={onSendTestNotification}
            className="px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0"
          >
            <Bell className="w-3 h-3" />
            <span>{testNotificationSent ? 'Alert Sent! ✓' : 'Send Test Alert'}</span>
          </button>
        </div>
      )}

      {/* Real-time Cluster Radar Telemetry Bar */}
      <div className="px-4 py-2.5 rounded-xl bg-[#09090b] border border-zinc-800/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs relative overflow-hidden card-featured-glow">
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-sky-400/80 to-transparent animate-laser-sweep pointer-events-none" />
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-zinc-200 font-medium">Cluster Active &amp; Synchronized</span>
          <span className="text-zinc-600 hidden sm:inline">·</span>
          <span className="text-zinc-400 font-mono text-[11px] hidden sm:inline">Scheduled Run: Daily 06:00 AM IST</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
          <span>Primary Admin: <strong className="text-sky-300">{adminEmail || 'technohmsit@gmail.com'}</strong></span>
          <span className="text-zinc-700">|</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live
          </span>
        </div>
      </div>

      {/* Today's Multi-Server Automated Execution Pipeline */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Today&apos;s Multi-Server Execution Pipeline
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
              IST Daily Cycle
            </span>
          </div>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            Click any status card to filter candidates table below
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Progressing Now */}
          <button
            type="button"
            onClick={() => onFilterByExecutionStatus && onFilterByExecutionStatus('applying')}
            className="p-3.5 rounded-xl bg-gradient-to-b from-sky-950/40 to-[#09090b] border border-sky-500/40 hover:border-sky-400 text-left transition-all group shadow-lg shadow-sky-950/20 cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs text-sky-300">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                </span>
                Progressing Now
              </span>
              <Zap className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1.5">
              {executionCounts?.applying ?? 0}
            </div>
            <p className="text-[10px] text-sky-300/70 font-mono mt-0.5">
              Active bot runners
            </p>
          </button>

          {/* 2. Done Today */}
          <button
            type="button"
            onClick={() => onFilterByExecutionStatus && onFilterByExecutionStatus('applied_today')}
            className="p-3.5 rounded-xl bg-gradient-to-b from-emerald-950/40 to-[#09090b] border border-emerald-500/40 hover:border-emerald-400 text-left transition-all group shadow-lg shadow-emerald-950/20 cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs text-emerald-300">
              <span className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Done Today
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">IST</span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1.5">
              {executionCounts?.applied_today ?? 0}
            </div>
            <p className="text-[10px] text-emerald-400/70 font-mono mt-0.5">
              Completed today
            </p>
          </button>

          {/* 3. In Queue */}
          <button
            type="button"
            onClick={() => onFilterByExecutionStatus && onFilterByExecutionStatus('in_queue')}
            className="p-3.5 rounded-xl bg-gradient-to-b from-amber-950/40 to-[#09090b] border border-amber-500/40 hover:border-amber-400 text-left transition-all group shadow-lg shadow-amber-950/20 cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs text-amber-300">
              <span className="flex items-center gap-1.5 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> In Queue
              </span>
              <span className="text-[10px] font-mono text-amber-400">Next</span>
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300 mt-1.5">
              {executionCounts?.in_queue ?? 0}
            </div>
            <p className="text-[10px] text-amber-300/70 font-mono mt-0.5">
              Awaiting worker claim
            </p>
          </button>

          {/* 4. Need to be Done Today */}
          <button
            type="button"
            onClick={() => onFilterByExecutionStatus && onFilterByExecutionStatus('not_applied_today')}
            className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 hover:border-zinc-700 text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 font-semibold">
                <Clock className="w-3.5 h-3.5 text-zinc-400" /> Need to be Done
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Scheduled</span>
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-200 mt-1.5">
              {executionCounts?.not_applied_today ?? 0}
            </div>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
              Pending scheduled run
            </p>
          </button>

          {/* 5. Payment Required / Paused */}
          <button
            type="button"
            onClick={() => onFilterByExecutionStatus && onFilterByExecutionStatus('payment_required')}
            className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 hover:border-rose-900/50 text-left transition-all group cursor-pointer col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between text-xs text-zinc-400 group-hover:text-rose-300 transition-colors">
              <span className="flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Plan Required
              </span>
              <span className="text-[10px] font-mono text-rose-400/80">Paused</span>
            </div>
            <div className="text-2xl font-bold font-mono text-rose-400/90 mt-1.5">
              {executionCounts?.payment_required ?? 0}
            </div>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
              Plan expired / inactive
            </p>
          </button>
        </div>
      </div>

      {/* 5 Clean Overview Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-zinc-400" /> Candidates
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              {overviewMetrics.scheduled_profiles_active} Active
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-white font-mono">
            {overviewMetrics.total_profiles}
          </div>
          <p className="text-[11px] text-zinc-500">Configured profiles</p>
        </div>

        <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-zinc-400" /> VIP Privilege
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              Free Pass
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-white font-mono">
            {overviewMetrics.vip_profiles_count}
          </div>
          <p className="text-[11px] text-zinc-500">Admin VIP bypass</p>
        </div>

        <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" /> Today Applied
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              24h
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-white font-mono">
            {overviewMetrics.applied_today}
          </div>
          <p className="text-[11px] text-zinc-500">Submitted today</p>
        </div>

        <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" /> This Week
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              7d
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-white font-mono">
            {overviewMetrics.applied_this_week}
          </div>
          <p className="text-[11px] text-zinc-500">Submitted this week</p>
        </div>

        <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" /> Total Applied
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              All-Time
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-semibold text-white font-mono">
            {overviewMetrics.total_applied}
          </div>
          <p className="text-[11px] text-zinc-500">All-time verified</p>
        </div>
      </section>
    </div>
  )
}
