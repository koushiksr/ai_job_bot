'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  User,
  Send,
  Mail,
  RefreshCw,
  LogOut,
  MoreVertical
} from 'lucide-react'
import JobFluxLogo from '@/components/JobFluxLogo'
import { ThemeToggle } from '@/components/ThemeProvider'

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mobileMenuOpen])

  return (
    <header className="sticky top-0 z-40 bg-black/90 light:bg-white/85 backdrop-blur-xl border-b border-zinc-900 light:border-zinc-200 px-3 sm:px-6 py-2.5 sm:py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Logo & Admin Badge (Always on left) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <Link href="/" className="hover:opacity-90 transition-opacity flex items-center shrink-0">
            <JobFluxLogo size="sm" showText={true} />
          </Link>

          <div className="h-4 w-px bg-zinc-800 light:bg-zinc-200 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-sky-300 light:text-sky-700 font-mono uppercase font-semibold">
              Super Admin
            </span>
            <span className="text-[11px] text-zinc-500 light:text-zinc-600 font-mono hidden md:inline">
              Cluster Synchronized
            </span>
          </div>
        </div>

        {/* Right: Actions toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <ThemeToggle />

          {/* Candidate Cockpit Link */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 light:border-cyan-300 text-cyan-300 light:text-cyan-700 transition-colors cursor-pointer shrink-0"
            title="Switch to Candidate Cockpit"
          >
            <User className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600 shrink-0" />
            <span className="text-[11px] sm:text-xs">Cockpit <span className="hidden sm:inline">↗</span></span>
          </Link>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 transition-colors text-zinc-300 light:text-zinc-700 cursor-pointer shrink-0 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 light:text-cyan-600 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline ml-1.5">Refresh</span>
          </button>

          {/* Desktop-only: Dispatch Report, Help Desk, Logout */}
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onOpenDispatchReport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 light:bg-zinc-900 light:hover:bg-zinc-800 text-white transition-all cursor-pointer shrink-0 border border-zinc-700 light:border-zinc-800"
              title="Manual Trigger: Send Today's Dispatch Report"
            >
              <Send className="w-3.5 h-3.5 text-zinc-300" />
              <span className="hidden lg:inline">Send Today&apos;s Report</span>
            </button>

            <button
              type="button"
              onClick={onOpenHelp}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 transition-colors text-zinc-300 light:text-zinc-700 cursor-pointer shrink-0"
              title="Help Desk"
            >
              <Mail className="w-3.5 h-3.5 text-teal-400 light:text-cyan-600" />
              <span className="hidden lg:inline">Help</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 transition-colors text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 cursor-pointer shrink-0"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Log Out</span>
            </button>
          </div>

          {/* Mobile-only overflow dropdown menu */}
          <div className="relative sm:hidden" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 transition-colors cursor-pointer"
              title="More admin actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {mobileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 p-2 rounded-xl bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 shadow-2xl z-50 space-y-1 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onOpenDispatchReport()
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-zinc-200 light:text-zinc-800 hover:bg-zinc-900 light:hover:bg-zinc-100 transition-colors text-left"
                >
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                  <span>Send Today&apos;s Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onOpenHelp()
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-zinc-200 light:text-zinc-800 hover:bg-zinc-900 light:hover:bg-zinc-100 transition-colors text-left"
                >
                  <Mail className="w-3.5 h-3.5 text-teal-400" />
                  <span>Help Desk</span>
                </button>

                <div className="h-px bg-zinc-800 light:bg-zinc-200 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onLogout()
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-950/30 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

