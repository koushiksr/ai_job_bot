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
  Sparkles
} from 'lucide-react'
import { AdminOverviewMetrics } from '../types'

interface AdminOverviewStatsProps {
  overviewMetrics: AdminOverviewMetrics
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
          <span className="text-zinc-400 font-mono text-[11px] hidden sm:inline">Scheduled Runs: Daily 06:00 &amp; 08:00 AM IST</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
          <span>Primary Admin: <strong className="text-sky-300">{adminEmail || 'technohmsit@gmail.com'}</strong></span>
          <span className="text-zinc-700">|</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live
          </span>
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
