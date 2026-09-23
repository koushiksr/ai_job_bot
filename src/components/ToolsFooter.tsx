'use client'

import React from 'react'
import Link from 'next/link'
import JobFluxLogo from '@/components/JobFluxLogo'

export default function ToolsFooter() {
  return (
    <footer className="w-full border-t border-zinc-900 light:border-zinc-200 py-8 px-6 z-10 bg-black light:bg-white">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 light:text-zinc-600">
        <div className="flex items-center gap-2">
          <JobFluxLogo size="sm" />
          <span>© {new Date().getFullYear()} JobFlux AI. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-5 text-zinc-400 light:text-zinc-600">
          <Link href="/tools" className="text-white light:text-zinc-900 hover:text-cyan-400 transition-colors font-medium">
            Free Tools Hub
          </Link>
          <Link href="/resume-builder" className="hover:text-white light:hover:text-zinc-900 transition-colors">
            Resume Studio
          </Link>
          <Link href="/pricing" className="hover:text-white light:hover:text-zinc-900 transition-colors">
            Pricing
          </Link>
          <Link href="/dashboard" className="hover:text-white light:hover:text-zinc-900 transition-colors">
            Dashboard
          </Link>
          <Link href="/admin" className="hover:text-white light:hover:text-zinc-900 transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  )
}

