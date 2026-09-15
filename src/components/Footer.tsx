import React from 'react'
import Link from 'next/link'
import JobFluxLogo from '@/components/JobFluxLogo'

export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-900 bg-black/60 py-10 px-6 z-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <JobFluxLogo size="sm" />
            <span>© {new Date().getFullYear()} JobFlux AI. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 text-zinc-400">
            <Link href="/tools" className="hover:text-cyan-400 transition-colors text-cyan-400/90 font-medium">Free Tools</Link>
            <Link href="/resume-builder" className="hover:text-white transition-colors">Resume Studio</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>

        {/* Legal Non-Affiliation & Safe Harbor Disclaimer */}
        <div className="p-4 rounded-lg bg-zinc-950/80 border border-zinc-900 text-[11px] text-zinc-500 leading-relaxed text-center sm:text-left space-y-1">
          <p className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
            Legal Disclaimer & Non-Affiliation Notice
          </p>
          <p>
            JobFlux AI is an independent software automation tool that executes repetitive browser interactions exclusively at the direction and voluntary instruction of registered candidates. JobFlux AI is not affiliated with, sponsored by, authorized by, or endorsed by Info Edge (India) Ltd., Naukri.com, or any other job board. All registered trademarks, company names, and logos are the property of their respective owners and are used solely for identification and contextual compatibility purposes.
          </p>
        </div>
      </div>
    </footer>
  )
}
