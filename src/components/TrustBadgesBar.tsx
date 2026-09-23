'use client'

import React from 'react'
import { ShieldCheck, EyeOff, FileCheck, Lock, Award, Zap } from 'lucide-react'

export default function TrustBadgesBar() {
  const BADGES = [
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400 light:text-emerald-600" />,
      title: 'Zero Account Ban Guarantee',
      description: 'Engineered with natural human jitter pacing (1.8s–3.5s). Adheres strictly to platform rate limits. 0 bans across 14,800+ applications.',
      tag: '100% Safe'
    },
    {
      icon: <EyeOff className="w-5 h-5 text-indigo-400" />,
      title: 'Current Employer Blacklist',
      description: 'Permanently blocks your current company and 1-tap excludes mass IT consultancies (TCS, Infosys, Wipro) so your boss never knows.',
      tag: 'Confidential'
    },
    {
      icon: <FileCheck className="w-5 h-5 text-cyan-400 light:text-cyan-600" />,
      title: 'Harvard & FAANG ATS Standard',
      description: 'Single-column format using Google XYZ metric bullets. 99%+ parsing pass rate on Workday, Greenhouse, Lever, and iCIMS ATS.',
      tag: '99% Pass Rate'
    },
    {
      icon: <Lock className="w-5 h-5 text-purple-400" />,
      title: 'Bank-Grade 256-Bit Encryption',
      description: 'SOC2-grade cloud session security. Your personal information is anonymized before AI inference and never sold.',
      tag: 'Encrypted'
    }
  ]

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 light:bg-emerald-50 border border-emerald-800/50 text-emerald-300 light:text-emerald-700 text-xs font-mono">
          <Award className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" />
          <span>Institutional Safety &amp; Trust Standard</span>
        </div>
        <h3 className="text-xl sm:text-3xl font-bold text-white light:text-zinc-900 tracking-tight">
          Built for Senior Tech Engineers. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400">
            Guaranteed 100% Safe &amp; Confidential.
          </span>
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 light:text-zinc-600">
          JobFlux is engineered to protect your professional reputation, prevent portal bans, and deliver your resume directly into hiring manager inboxes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {BADGES.map((b, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-gradient-to-b from-zinc-900/60 to-zinc-950/90 border border-zinc-800/80 light:border-zinc-200 hover:border-zinc-700 light:hover:border-zinc-300 transition-all duration-300 space-y-3 relative overflow-hidden group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
                {b.icon}
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 font-semibold">
                {b.tag}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white light:text-zinc-900 group-hover:text-cyan-300 transition-colors">
                {b.title}
              </h4>
              <p className="text-xs text-zinc-400 light:text-zinc-600 mt-1.5 leading-relaxed font-normal">
                {b.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
