'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Mail,
  ArrowRight,
  LogOut,
  Sparkles,
  ExternalLink
} from 'lucide-react'
import JobFluxLogo from '@/components/JobFluxLogo'
import JobFluxHelpModal from '@/components/JobFluxHelpModal'

export default function ToolsHeader() {
  const pathname = usePathname()
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ email: string; id: string; role: string } | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('user_email') || ''
      const uid = localStorage.getItem('user_id') || ''
      const role = localStorage.getItem('user_role') || 'user'
      if (email || uid) {
        setCurrentUser({ email, id: uid, role })
      }
    }
  }, [])

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear()
      window.location.href = '/'
    }
  }

  const isToolsActive = pathname?.startsWith('/tools')

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-black/85 backdrop-blur-xl border-b border-zinc-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <JobFluxLogo size="sm" />
          </Link>

          {/* Canonical Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-medium">
            <Link
              href="/"
              className="hover:text-white transition-colors"
            >
              Home
            </Link>

            <Link
              href="/resume-builder"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <span>Resume Studio</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-950/80 border border-amber-700/50 text-amber-300">
                ATS
              </span>
            </Link>

            <Link
              href="/tools"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                isToolsActive
                  ? 'text-white bg-zinc-900/90 border border-zinc-800 font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Free Tools</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-950/80 border border-cyan-700/50 text-cyan-300">
                3 TOOLS
              </span>
            </Link>

            <Link
              href="/pricing"
              className="hover:text-white transition-colors"
            >
              Pricing
            </Link>

            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Help & Support</span>
            </button>
          </nav>

          {/* Right Action / Auth Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Help Trigger */}
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="text-xs text-zinc-400 hover:text-white transition-colors font-medium cursor-pointer flex md:hidden items-center gap-1 shrink-0 px-2 py-1"
            >
              <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="hidden sm:inline">Help</span>
            </button>

            <Link
              href="/resume-builder"
              className="text-xs text-zinc-400 hover:text-white transition-colors font-medium md:hidden hidden sm:inline-block px-2 py-1"
            >
              ATS Studio
            </Link>

            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                  <div className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-300 font-medium flex items-center justify-center text-[10px]">
                    {(currentUser.email || currentUser.id || 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-zinc-400 font-mono text-[11px] max-w-[140px] truncate">
                    {currentUser.email || currentUser.id}
                  </span>
                </div>
                <Link
                  href={currentUser.role === 'admin' ? '/admin' : '/dashboard'}
                  className="px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-colors flex items-center gap-1 shrink-0"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-zinc-400 hover:text-white transition-colors font-medium px-2 py-1 cursor-pointer flex items-center gap-1 shrink-0"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/?mode=signin"
                  className="text-xs text-zinc-400 hover:text-white transition-colors font-medium px-2.5 py-1.5 rounded-lg hover:bg-zinc-900/80"
                >
                  Sign In
                </Link>
                <Link
                  href="/?mode=trial"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-all shadow-sm shrink-0 flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Start Free Trial</span>
                  <span className="sm:hidden">Try Free</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Universal Support Center Modal */}
      <JobFluxHelpModal
        isOpen={isHelpOpen}
        onOpen={() => setIsHelpOpen(true)}
        onClose={() => setIsHelpOpen(false)}
        showFloatingTrigger={false}
      />
    </>
  )
}

