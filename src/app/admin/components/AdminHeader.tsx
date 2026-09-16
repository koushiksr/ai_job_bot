'use client'

import React from 'react'
import Link from 'next/link'
import {
  User,
  Send,
  Mail,
  RefreshCw,
  LogOut
} from 'lucide-react'
import JobFluxLogo from '@/components/JobFluxLogo'

interface AdminHeaderProps {
  isRefreshing: boolean
  onRefresh: () => void
  onOpenHelp: () => void
  onOpenDispatchReport: () => void
  onLogout: () => void
}

export default function AdminHeader({
  isRefreshing,
  onRefresh,
  onOpenHelp,
  onOpenDispatchReport,
  onLogout
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-zinc-900 px-4 sm:px-6 py-3 sm:py-4">
      {/* Mobile: flex-row-reverse puts buttons on LEFT, logo on RIGHT. sm+: normal flex-row (logo left, buttons right) */}
      <div className="max-w-7xl mx-auto flex flex-row-reverse sm:flex-row items-center justify-between gap-3">
        {/* Logo + badges — on mobile appears on RIGHT (end), on sm+ appears on LEFT (start) */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          <Link href="/" className="hover:opacity-90 transition-opacity shrink-0">
            <JobFluxLogo size="sm" showText={true} />
          </Link>

          <div className="h-5 w-px bg-zinc-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-sky-300 font-mono uppercase font-semibold hidden sm:inline">
              Super Admin
            </span>
            <span className="text-[11px] text-zinc-500 font-mono hidden md:inline">
              MongoDB Atlas Synchronized
            </span>
          </div>
        </div>

        {/* Action buttons — on mobile appears on LEFT (start), on sm+ appears on RIGHT (end) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Direct Switch to Candidate Cockpit */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 transition-colors cursor-pointer shrink-0"
            title="Switch to Candidate Cockpit"
          >
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Candidate Cockpit ↗</span>
            <span className="sm:hidden">Cockpit</span>
          </Link>

          {/* Quick Trigger: Send Today's Job Applied Notification (Email + Web Push) */}
          <button
            type="button"
            onClick={onOpenDispatchReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:to-indigo-400 text-white shadow-md shadow-sky-500/25 transition-all cursor-pointer shrink-0 border border-sky-400/40"
            title="Manual Trigger: Send Today's Job Applied Notification (Email + Web Push)"
          >
            <Send className="w-3.5 h-3.5 text-sky-200 animate-pulse" />
            <span className="hidden sm:inline">⚡ Send Today&apos;s Report</span>
          </button>

          <button
            type="button"
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors text-zinc-300 cursor-pointer shrink-0"
            title="Help Desk"
          >
            <Mail className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Help Desk</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors text-zinc-300 cursor-pointer shrink-0 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors text-zinc-400 hover:text-white cursor-pointer shrink-0"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  )
}
