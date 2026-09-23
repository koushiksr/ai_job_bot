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
  const [isExpanded, setIsExpanded] = useState(!isFullyConfigured && totalApplied === 0)

  return (
    <div className="rounded-2xl bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 p-4 sm:p-5 space-y-4 relative">
      {/* Top Header: Welcome & Mission Statement with Collapse Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-900 light:bg-zinc-100 text-zinc-300 light:text-zinc-700 border border-zinc-800 light:border-zinc-200">
              <Sparkles className="w-3 h-3 text-zinc-400 light:text-zinc-600" />
              <span>Onboarding Guide</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-900 light:bg-zinc-100 text-zinc-300 light:text-zinc-700 border border-zinc-800 light:border-zinc-200">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              <span>Daily Sweep (6 AM IST)</span>
            </span>
          </div>

          <h2 className="text-sm sm:text-base font-semibold text-white light:text-zinc-900 tracking-tight mt-1.5 flex items-center gap-2">
            <span>How JobFlux Works: 4 Simple Steps to Getting Hired</span>
          </h2>
          <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5 max-w-2xl leading-relaxed">
            Configure your profile once, let AI extract your credentials, and{' '}
            <strong className="text-zinc-200 light:text-zinc-800">sit back and relax</strong> while our cloud bot searches and applies on your behalf every morning.
          </p>
        </div>

        {/* Profile Completeness & Toggle */}
        <div className="flex items-center sm:flex-col items-end justify-between gap-2 shrink-0 bg-zinc-900/60 light:bg-zinc-100 sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-zinc-800 light:border-zinc-200">
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono text-zinc-400 light:text-zinc-600">Setup Status</div>
            <div className="text-xs font-bold font-mono flex items-center gap-1.5 text-zinc-200 light:text-zinc-800">
              {isFullyConfigured ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300 light:text-zinc-700 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600 shrink-0" />
              )}
              <span>{completeness.percent}% Configured</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mini Progress Bar */}
            <div className="w-20 sm:w-24 h-1.5 bg-zinc-900 light:bg-zinc-100 rounded-full overflow-hidden border border-zinc-800 light:border-zinc-200">
              <div
                className="h-full transition-all duration-500 rounded-full bg-zinc-300"
                style={{ width: `${completeness.percent}%` }}
              />
            </div>

            {/* Toggle Button */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2 py-1 rounded-md text-[11px] bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-850 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title={isExpanded ? "Collapse guide" : "Expand guide"}
            >
              <span>{isExpanded ? 'Hide' : 'View'}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* 4-Step Interactive Visual Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10 pt-1">
            {/* Step 1: Upload Resume PDF */}
            <div className="p-3.5 sm:p-4 rounded-xl border bg-zinc-900/40 light:bg-zinc-100 border-zinc-800/80 light:border-zinc-200 flex flex-col justify-between space-y-3 transition-colors hover:border-zinc-700 light:hover:border-zinc-300">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 light:text-zinc-600 font-semibold">Step 1</span>
                  {completeness.hasResume ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 light:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-zinc-400 light:text-zinc-600" /> Completed
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Incomplete
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 font-semibold text-xs text-white light:text-zinc-900">
                  <FileText className="w-4 h-4 text-zinc-300 light:text-zinc-700 shrink-0" />
                  <span>Upload Resume PDF</span>
                </div>
                <p className="text-[11px] text-zinc-400 light:text-zinc-600 leading-relaxed">
                  {completeness.hasResume
                    ? 'Resume PDF uploaded and synced to cloud. Attached to all recruiter applications.'
                    : 'Upload your resume PDF. The AI extracts your credentials and attaches it to recruiter applications.'}
                </p>
              </div>

              <Link
                href="/profile#resume"
                className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  completeness.hasResume
                    ? 'bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700'
                    : 'bg-white light:bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 light:hover:bg-zinc-100 text-black light:text-zinc-900 light:text-zinc-900 font-semibold'
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
                <div className="p-3.5 sm:p-4 rounded-xl border bg-zinc-900/40 light:bg-zinc-100 border-zinc-800/80 light:border-zinc-200 flex flex-col justify-between space-y-3 transition-colors hover:border-zinc-700 light:hover:border-zinc-300">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 light:text-zinc-600 font-semibold">Step 2</span>
                      {step2Completed ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 light:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-zinc-400 light:text-zinc-600" /> Completed
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 font-medium flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Incomplete
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-xs text-white light:text-zinc-900">
                      <Sparkles className="w-4 h-4 text-zinc-300 light:text-zinc-700 shrink-0" />
                      <span>1-Tap AI Auto-Fill</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 light:text-zinc-600 leading-relaxed">
                      {step2Completed
                        ? 'AI extraction complete: Skills, CTC & experience parameters are extracted and populated.'
                        : 'Click "Auto-Fill with AI". The neural parser extracts your roles, skills, & experience in 5 seconds.'}
                    </p>
                  </div>

                  <Link
                    href="/profile#resume"
                    className="w-full py-1.5 px-2.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                <div className="p-3.5 sm:p-4 rounded-xl border bg-zinc-900/40 light:bg-zinc-100 border-zinc-800/80 light:border-zinc-200 flex flex-col justify-between space-y-3 transition-colors hover:border-zinc-700 light:hover:border-zinc-300">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 light:text-zinc-600 font-semibold">Step 3</span>
                      {step3Completed ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 light:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-zinc-400 light:text-zinc-600" /> Completed
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Incomplete
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-xs text-white light:text-zinc-900">
                      <User className="w-4 h-4 text-zinc-300 light:text-zinc-700 shrink-0" />
                      <span>Review &amp; Save Profile</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 light:text-zinc-600 leading-relaxed">
                      {step3Completed
                        ? 'Profile parameters saved. Login credentials, target roles, and automation preferences are locked in.'
                        : 'Review credentials, target roles & blacklist, then click "Save Profile" to synchronize your bot.'}
                    </p>
                  </div>

                  <Link
                    href="/profile"
                    className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      step3Completed
                        ? 'bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700'
                        : 'bg-white light:bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 light:hover:bg-zinc-100 text-black light:text-zinc-900 light:text-zinc-900 font-semibold'
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
                <div className="p-3.5 sm:p-4 rounded-xl border bg-zinc-900/40 light:bg-zinc-100 border-zinc-800/80 light:border-zinc-200 flex flex-col justify-between space-y-3 transition-colors hover:border-zinc-700 light:hover:border-zinc-300">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 light:text-zinc-600 font-semibold">Step 4</span>
                      {step4Active ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 light:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" /> Active &amp; Ready
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-500 light:text-zinc-600 font-medium flex items-center gap-1">
                          Waiting 1-3
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-xs text-white light:text-zinc-900">
                      <Coffee className="w-4 h-4 text-zinc-300 light:text-zinc-700 shrink-0" />
                      <span>Sit Back &amp; Relax</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 light:text-zinc-600 leading-relaxed">
                      {step4Active
                        ? '100% Autonomous. The cloud bot searches jobs, tailors answers, and applies on your behalf every morning.'
                        : 'Finish Steps 1–3 above to activate autonomous daily applications on your behalf.'}
                    </p>
                  </div>

                  <div className="w-full py-1.5 px-2.5 rounded-lg border border-zinc-800 light:border-zinc-200 bg-zinc-900/70 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 text-xs font-mono flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" />
                    <span>Run: 6 AM IST</span>
                  </div>
                </div>
              )
            })()}
          </div>
        </>
      )}

      {/* Smart Missing Data Callout (If Anything is Incomplete) */}
      {!isFullyConfigured && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/60 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 space-y-2.5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-zinc-400 light:text-zinc-600 shrink-0" />
            <span className="text-xs font-semibold text-white light:text-zinc-900 uppercase tracking-wider font-mono">
              Action Required Before First Automated Sweep:
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {!completeness.hasResume && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/50 light:bg-white/85 border border-zinc-800 light:border-zinc-200">
                <span className="text-zinc-300 light:text-zinc-700">• Resume PDF missing</span>
                <Link href="/profile#resume" className="text-[11px] font-medium text-white light:text-zinc-900 hover:underline">
                  Upload PDF →
                </Link>
              </div>
            )}

            {!completeness.hasNaukriCredentials && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/50 light:bg-white/85 border border-zinc-800 light:border-zinc-200">
                <span className="text-zinc-300 light:text-zinc-700">• Naukri email & password required</span>
                <Link href="/profile#credentials" className="text-[11px] font-medium text-white light:text-zinc-900 hover:underline">
                  Enter Login →
                </Link>
              </div>
            )}

            {!completeness.hasTargetRoles && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/50 light:bg-white/85 border border-zinc-800 light:border-zinc-200">
                <span className="text-zinc-300 light:text-zinc-700">• Target job roles or skills missing</span>
                <Link href="/profile#roles" className="text-[11px] font-medium text-white light:text-zinc-900 hover:underline">
                  Add Roles →
                </Link>
              </div>
            )}

            {!completeness.hasExperienceOrCtc && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/50 light:bg-white/85 border border-zinc-800 light:border-zinc-200">
                <span className="text-zinc-400 light:text-zinc-600">• Target CTC / Experience not specified</span>
                <Link href="/profile#ctc" className="text-[11px] font-medium text-white light:text-zinc-900 hover:underline">
                  Set CTC →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmed Ready Banner (When 100% Configured) */}
      {isFullyConfigured && (
        <div className="p-3.5 rounded-xl bg-zinc-900/60 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 light:bg-zinc-200 border border-zinc-700 light:border-zinc-300 flex items-center justify-center text-zinc-300 light:text-zinc-700 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white light:text-zinc-900 flex items-center gap-2">
                <span>Autonomous Cloud Bot is Configured &amp; Ready</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 light:bg-zinc-200 text-zinc-200 light:text-zinc-800 border border-zinc-700 light:border-zinc-300 font-mono font-medium">100% READY</span>
              </div>
              <p className="text-[11px] text-zinc-400 light:text-zinc-600 mt-0.5">
                Next sweep executes tomorrow morning at <strong>06:00 AM IST</strong>. You can close your browser and relax.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <span className="text-[11px] font-mono text-zinc-400 light:text-zinc-600">
              {totalApplied > 0 ? `${totalApplied} applications submitted` : 'First sweep scheduled'}
            </span>
          </div>
        </div>
      )}

      {/* Expandable ROI Comparison: Manual Job Hunt vs JobFlux AI */}
      <div className="pt-2 border-t border-zinc-900 light:border-zinc-200">
        <button
          type="button"
          onClick={() => setShowRoiComparison(!showRoiComparison)}
          className="text-xs text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 flex items-center justify-between w-full transition-colors cursor-pointer py-1 font-mono"
        >
          <span className="flex items-center gap-1.5 text-zinc-300 light:text-zinc-700 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" />
            <span>Why JobFlux AI Gets 10x More Interview Shortlists (ROI Comparison)</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900">
            <span>{showRoiComparison ? 'Hide Comparison' : 'View Comparison & Numbers'}</span>
            {showRoiComparison ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </button>

        {showRoiComparison && (
          <div className="mt-3 p-4 rounded-xl bg-zinc-900/40 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Manual Applying */}
              <div className="p-3.5 rounded-xl bg-black/40 light:bg-white/85 border border-zinc-800 light:border-zinc-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-300 light:text-zinc-700 flex items-center gap-1.5">
                    <span>Manual Applying by Hand</span>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 light:text-zinc-600">Exhausting</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-zinc-400 light:text-zinc-600">
                  <li>• <strong>2 hours wasted</strong> every evening searching job boards</li>
                  <li>• Only <strong>60–80 jobs/month</strong> applied before burnout</li>
                  <li>• Submissions buried under 500+ competing applicants</li>
                  <li>• Repetitive screening forms typed manually again &amp; again</li>
                  <li>• <strong>Average result:</strong> 1–2 recruiter callbacks per month</li>
                </ul>
              </div>

              {/* JobFlux AI */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 light:bg-zinc-100 border border-zinc-700/80 light:border-zinc-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white light:text-zinc-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-300 light:text-zinc-700" />
                    <span>JobFlux AI Autonomous Bot</span>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-200 light:text-zinc-800 bg-zinc-800 light:bg-zinc-200 border border-zinc-700 light:border-zinc-300 px-1.5 py-0.2 rounded font-medium">10x Advantage</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-zinc-300 light:text-zinc-700">
                  <li>• <strong className="text-white light:text-zinc-900">0 minutes wasted</strong> — runs 100% in secure cloud background</li>
                  <li>• <strong className="text-white light:text-zinc-900 font-medium">600–1,800 verified applications/month</strong> submitted automatically</li>
                  <li>• <strong className="text-white light:text-zinc-900">6 AM IST delivery</strong> — your resume lands at the top of recruiter inboxes</li>
                  <li>• AI formulates context-aware answers for notice period &amp; salary Q&amp;As</li>
                  <li>• <strong className="text-white light:text-zinc-900 font-medium">Average result:</strong> 6–12 interview calls in first 14 days</li>
                </ul>
              </div>
            </div>

            {/* Upgrade Banner inside Comparison */}
            {!isProfessional && (
              <div className="p-3.5 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-white light:text-zinc-900 flex items-center gap-2">
                    <Crown className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" />
                    <span>Unlock Full 1,800 Applications & Priority Recruiter Delivery</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 light:text-zinc-600 mt-0.5">
                    Free trial stops after 15 applies. Professional tier applies 60 jobs/day with zero queue.
                  </p>
                </div>
                <Link
                  href="/pricing?promo=WELCOMEPRO"
                  className="px-3.5 py-1.5 rounded-lg bg-white light:bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 light:hover:bg-zinc-100 text-black light:text-zinc-900 light:text-zinc-900 font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0"
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
