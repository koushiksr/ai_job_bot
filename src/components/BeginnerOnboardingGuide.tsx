'use client'

import React, { useState } from 'react'
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Coffee,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Clock,
  User,
  Crown,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react'
import Link from 'next/link'

export interface ProfileCompleteness {
  hasResume: boolean
  hasNaukriCredentials: boolean
  hasTargetRoles: boolean
  hasExperienceOrCtc: boolean
  percent: number
  missingFields: string[]
}

interface BeginnerOnboardingGuideProps {
  completeness: ProfileCompleteness
  userPlan?: string
  isProfessional?: boolean
  totalApplied?: number
}

export default function BeginnerOnboardingGuide({
  completeness,
  userPlan = 'trial',
  isProfessional = false,
  totalApplied = 0
}: BeginnerOnboardingGuideProps) {
  const [showRoiComparison, setShowRoiComparison] = useState(false)
  const isFullyConfigured = completeness.percent >= 100

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#0c0f17] via-[#08090d] to-[#050608] border border-zinc-800/90 shadow-2xl p-4 sm:p-6 space-y-5 relative overflow-hidden">
      {/* Subtle Glow Accent */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header: Welcome & Mission Statement */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>Autonomous Job Hunting Guide</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sit Back & Relax Engine</span>
            </span>
          </div>

          <h2 className="text-base sm:text-xl font-bold text-white tracking-tight mt-1.5 flex items-center gap-2">
            <span>How JobFlux Works: 4 Simple Steps to Getting Hired</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 max-w-2xl leading-relaxed">
            Fill your profile once, let AI auto-extract your credentials, and{' '}
            <strong className="text-white">sit back and relax</strong> while our cloud bot searches and applies on your behalf twice daily at 6 AM & 8 AM IST.
          </p>
        </div>

        {/* Profile Completeness Pill */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 bg-black/40 sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-zinc-800">
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono text-zinc-400">Setup Status</div>
            <div className={`text-sm font-extrabold font-mono flex items-center gap-1.5 ${
              isFullyConfigured ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {isFullyConfigured ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{completeness.percent}% Calibrated</span>
            </div>
          </div>

          {/* Mini Progress Bar */}
          <div className="w-24 sm:w-28 h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div
              className={`h-full transition-all duration-500 ${
                isFullyConfigured
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-400'
              }`}
              style={{ width: `${completeness.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4-Step Interactive Visual Flow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
        {/* Step 1: Upload Resume PDF */}
        <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
          completeness.hasResume
            ? 'bg-zinc-950/90 border-emerald-500/40 ring-1 ring-emerald-500/20'
            : 'bg-zinc-950/90 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
        }`}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Step 1</span>
              {completeness.hasResume ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ✓ Completed
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold animate-pulse flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> ● Incomplete
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 font-semibold text-xs text-white">
              <FileText className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Upload Resume PDF</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {completeness.hasResume
                ? 'Resume PDF successfully uploaded & synced to cloud. Recruiters receive this exact document.'
                : 'Upload your resume PDF. The AI reads this to extract details and attaches it to recruiter applications.'}
            </p>
          </div>

          <Link
            href="/profile#resume"
            className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              completeness.hasResume
                ? 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200'
                : 'bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-md'
            }`}
          >
            <span>{completeness.hasResume ? 'View / Change PDF' : 'Upload Resume PDF →'}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Step 2: 1-Tap AI Auto-Fill */}
        {(() => {
          const step2Completed = completeness.hasTargetRoles && completeness.hasExperienceOrCtc
          return (
            <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
              step2Completed
                ? 'bg-zinc-950/90 border-emerald-500/40 ring-1 ring-emerald-500/20'
                : 'bg-zinc-950/80 border-zinc-800/80'
            }`}>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Step 2</span>
                  {step2Completed ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> ✓ Completed
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 font-semibold flex items-center gap-1">
                      <Zap className="w-3 h-3" /> ● Incomplete
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 font-semibold text-xs text-white">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>1-Tap AI Auto-Fill</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {step2Completed
                    ? 'AI extraction completed: Skills, CTC & experience parameters are extracted and populated.'
                    : 'Click "Auto-Fill with AI". Our neural parser extracts your roles, skills, & experience in 5 seconds.'}
                </p>
              </div>

              <Link
                href="/profile#resume"
                className="w-full py-1.5 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{step2Completed ? 'Re-run AI Extraction' : 'Run Auto-Fill with AI'}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )
        })()}

        {/* Step 3: Review & Save Profile */}
        {(() => {
          const step3Completed = completeness.hasNaukriCredentials && completeness.hasTargetRoles
          return (
            <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
              step3Completed
                ? 'bg-zinc-950/90 border-emerald-500/40 ring-1 ring-emerald-500/20'
                : 'bg-zinc-950/90 border-amber-500/40'
            }`}>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Step 3</span>
                  {step3Completed ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> ✓ Completed
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> ● Incomplete
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 font-semibold text-xs text-white">
                  <User className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Review & Click Save</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {step3Completed
                    ? 'Profile criteria saved! Naukri login, target roles, and automation preferences are locked in.'
                    : 'Review credentials, target roles & blacklist, then click "Save Profile" to synchronize your bot.'}
                </p>
              </div>

              <Link
                href="/profile"
                className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  step3Completed
                    ? 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200'
                    : 'bg-white hover:bg-zinc-200 text-black font-bold'
                }`}
              >
                <span>{step3Completed ? 'Modify Settings' : 'Review & Save Profile →'}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )
        })()}

        {/* Step 4: The Golden Promise - Sit Back & Relax */}
        {(() => {
          const step4Active = completeness.hasResume && completeness.hasNaukriCredentials && completeness.hasTargetRoles
          return (
            <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
              step4Active
                ? 'bg-gradient-to-b from-emerald-950/50 via-zinc-950 to-emerald-950/30 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                : 'bg-zinc-950/60 border-zinc-800/80 opacity-80'
            }`}>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Step 4</span>
                  {step4Active ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ✓ Active & Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 font-medium flex items-center gap-1">
                      ● Incomplete (Waiting on 1-3)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 font-bold text-xs text-white">
                  <Coffee className={`w-4 h-4 text-emerald-400 shrink-0 ${step4Active ? 'animate-bounce' : ''}`} />
                  <span>Sit Back & Relax!</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  {step4Active
                    ? '100% Autonomous. Our cloud bot searches jobs, tailors responses, and applies on your behalf twice daily.'
                    : 'Finish Steps 1-3 above to activate autonomous daily applications on your behalf.'}
                </p>
              </div>

              <div className={`w-full py-1.5 px-2.5 rounded-lg border text-xs font-mono font-bold flex items-center justify-center gap-1.5 ${
                step4Active
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
              }`}>
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>Dual Morning Runs: 6 & 8 AM IST</span>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Smart Missing Data Callout (If Anything is Incomplete) */}
      {!isFullyConfigured && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-2.5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Action Required Before First Automated Sweep:
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {!completeness.hasResume && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-amber-500/30">
                <span className="text-amber-200">❌ Resume PDF missing</span>
                <Link href="/profile#resume" className="text-[11px] font-bold text-amber-400 hover:underline">
                  Upload PDF →
                </Link>
              </div>
            )}

            {!completeness.hasNaukriCredentials && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-amber-500/30">
                <span className="text-amber-200">❌ Naukri email & password required</span>
                <Link href="/profile#credentials" className="text-[11px] font-bold text-amber-400 hover:underline">
                  Enter Login →
                </Link>
              </div>
            )}

            {!completeness.hasTargetRoles && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-amber-500/30">
                <span className="text-amber-200">❌ Target job roles / skills missing</span>
                <Link href="/profile#roles" className="text-[11px] font-bold text-amber-400 hover:underline">
                  Add Roles →
                </Link>
              </div>
            )}

            {!completeness.hasExperienceOrCtc && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-amber-500/30">
                <span className="text-amber-200">⚠️ Target CTC / Experience not set</span>
                <Link href="/profile#ctc" className="text-[11px] font-bold text-amber-400 hover:underline">
                  Set CTC →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmed Ready Banner (When 100% Configured) */}
      {isFullyConfigured && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Autonomous Cloud Bot is Fully Armed & Ready!</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/30 text-emerald-300 font-mono font-bold">100% READY</span>
              </div>
              <p className="text-[11px] text-emerald-300/80 mt-0.5">
                Next sweep will execute tomorrow morning at <strong>06:00 AM IST</strong>. You can close your laptop and relax.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <span className="text-[11px] font-mono text-zinc-400">
              {totalApplied > 0 ? `${totalApplied} applications submitted` : 'First sweep scheduled'}
            </span>
          </div>
        </div>
      )}

      {/* Expandable ROI Comparison: Manual Job Hunt vs JobFlux AI (High Sales Conversion) */}
      <div className="pt-2 border-t border-zinc-900">
        <button
          type="button"
          onClick={() => setShowRoiComparison(!showRoiComparison)}
          className="text-xs text-zinc-400 hover:text-white flex items-center justify-between w-full transition-colors cursor-pointer py-1 font-mono"
        >
          <span className="flex items-center gap-1.5 text-zinc-300 font-bold">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <span>Why JobFlux AI Gets 10x More Interview Shortlists (ROI Comparison)</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-sky-400 hover:underline">
            <span>{showRoiComparison ? 'Hide Comparison' : 'View Comparison & Numbers'}</span>
            {showRoiComparison ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </button>

        {showRoiComparison && (
          <div className="mt-3 p-4 rounded-xl bg-black/60 border border-zinc-800 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Manual Applying */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-rose-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-400 flex items-center gap-1.5">
                    <span>❌ Manual Applying by Hand</span>
                  </span>
                  <span className="text-[10px] font-mono text-rose-500 font-bold">Exhausting</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-zinc-400">
                  <li>• <strong>2 hours wasted</strong> every evening searching job boards</li>
                  <li>• Only <strong>60–80 jobs/month</strong> applied before burnout</li>
                  <li>• Submissions buried under 500+ competing applicants</li>
                  <li>• Repetitive screening forms typed manually again & again</li>
                  <li>• <strong>Average result:</strong> 1–2 recruiter callbacks per month</li>
                </ul>
              </div>

              {/* JobFlux AI */}
              <div className="p-3.5 rounded-xl bg-gradient-to-b from-emerald-950/30 to-zinc-950 border border-emerald-500/40 space-y-2 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>⚡ JobFlux AI Autonomous Bot</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">10x Advantage</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-zinc-300">
                  <li>• <strong className="text-white">0 minutes wasted</strong> — runs 100% in secure cloud background</li>
                  <li>• <strong className="text-emerald-400 font-bold">600–1,800 verified applications/month</strong> submitted automatically</li>
                  <li>• <strong className="text-white">6 AM & 8 AM IST delivery</strong> — your resume lands at the top of recruiter inboxes</li>
                  <li>• AI formulates context-aware answers for notice period & salary Q&As</li>
                  <li>• <strong className="text-emerald-300 font-bold">Average result:</strong> 6–12 interview calls in first 14 days</li>
                </ul>
              </div>
            </div>

            {/* High-Converting Upgrade Banner inside Comparison */}
            {!isProfessional && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-amber-950/40 border border-amber-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Unlock Full 1,800 Applications & Recruiter Direct Delivery</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-0.5">
                    Free trial stops after 15 applies. Professional tier applies 60 jobs/day with zero queue.
                  </p>
                </div>
                <Link
                  href="/pricing?promo=WELCOMEPRO"
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 text-black font-extrabold text-xs transition-all shadow hover:scale-102 flex items-center gap-1.5 shrink-0"
                >
                  <Zap className="w-3 h-3 fill-black" />
                  <span>Upgrade to Pro (₹199 / mo)</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
