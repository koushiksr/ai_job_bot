'use client'

import React from 'react'
import { Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react'

interface Employer {
  name: string
  roles: string
  salary: string
  logoBg: string
  accentColor: string
}

const TOP_EMPLOYERS: Employer[] = [
  { name: 'Google', roles: 'Software Engineer, Cloud, AI', salary: '₹35L–₹65L', logoBg: 'from-blue-600 to-red-500', accentColor: '#4285F4' },
  { name: 'Microsoft', roles: 'Full Stack, Azure, SDE-2', salary: '₹32L–₹58L', logoBg: 'from-sky-500 to-emerald-500', accentColor: '#00A4EF' },
  { name: 'Amazon', roles: 'SDE-1/2, AWS, Distributed Systems', salary: '₹30L–₹55L', logoBg: 'from-amber-500 to-orange-600', accentColor: '#FF9900' },
  { name: 'Swiggy', roles: 'Backend, Platform, Mobile', salary: '₹26L–₹48L', logoBg: 'from-orange-500 to-amber-600', accentColor: '#FC8019' },
  { name: 'Razorpay', roles: 'Full Stack, Fintech, DevOps', salary: '₹28L–₹52L', logoBg: 'from-blue-500 to-indigo-600', accentColor: '#0C2340' },
  { name: 'Zomato', roles: 'Product Eng, Backend, ML', salary: '₹25L–₹45L', logoBg: 'from-red-600 to-rose-700', accentColor: '#CB202D' },
  { name: 'Flipkart', roles: 'SDE-2, Distributed Infra, Data', salary: '₹28L–₹50L', logoBg: 'from-amber-400 to-blue-600', accentColor: '#2874F0' },
  { name: 'Zepto', roles: 'Platform, Golang, React Native', salary: '₹30L–₹54L', logoBg: 'from-purple-600 to-pink-600', accentColor: '#7C3AED' },
  { name: 'Uber', roles: 'Systems, Mobile, Data Engineer', salary: '₹36L–₹68L', logoBg: 'from-zinc-800 to-black', accentColor: '#FFFFFF' },
  { name: 'Atlassian', roles: 'Fullstack, Cloud, Security', salary: '₹34L–₹60L', logoBg: 'from-blue-600 to-cyan-500', accentColor: '#0052CC' },
  { name: 'CRED', roles: 'Frontend, Backend Architecture', salary: '₹32L–₹56L', logoBg: 'from-zinc-900 to-neutral-800', accentColor: '#FFFFFF' },
  { name: 'PhonePe', roles: 'Java, Microservices, SRE', salary: '₹26L–₹48L', logoBg: 'from-purple-600 to-indigo-600', accentColor: '#5F259F' }
]

export default function EmployerProofMarquee() {
  return (
    <div className="w-full py-6 sm:py-8 border-y border-zinc-900/80 bg-gradient-to-b from-black via-zinc-950/60 to-black relative overflow-hidden select-none">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/15 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-4 sm:mb-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold flex items-center gap-1.5">
              <span>Where JobFlux Candidates Interview &amp; Get Hired</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500">
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>1,200+ Verified Hiring Teams</span>
            </span>
            <span className="text-zinc-700 hidden sm:inline">&bull;</span>
            <span className="text-zinc-400 hidden sm:inline">Harvard ATS Approved</span>
          </div>
        </div>
      </div>

      {/* Infinite Scrolling Track (Repeated 2x for seamless loop) */}
      <div className="relative w-full overflow-hidden mask-gradient">
        <div className="animate-marquee-scroll flex gap-4 sm:gap-6 py-1">
          {[...TOP_EMPLOYERS, ...TOP_EMPLOYERS].map((emp, idx) => (
            <div
              key={`${emp.name}-${idx}`}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-950/70 hover:bg-zinc-900/80 border border-zinc-800/80 hover:border-cyan-500/40 transition-all duration-300 group shrink-0 cursor-default shadow-md hover:shadow-cyan-500/10"
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${emp.logoBg} flex items-center justify-center text-white font-extrabold text-xs shadow-inner shrink-0 group-hover:scale-105 transition-transform`}>
                {emp.name.slice(0, 1)}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {emp.name}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
                    {emp.salary}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 font-medium truncate max-w-[150px]">
                  {emp.roles}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
