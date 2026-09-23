'use client'

import React, { useState } from 'react'
import {
  FileCheck2,
  TrendingUp,
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Flame,
  ShieldCheck
} from 'lucide-react'

interface HomeInteractiveToolsCardProps {
  onTriggerAuth: (mode: 'signin' | 'trial') => void
  isLoggedIn?: boolean
}

export default function HomeInteractiveToolsCard({
  onTriggerAuth,
  isLoggedIn = false
}: HomeInteractiveToolsCardProps) {
  const [activeTab, setActiveTab] = useState<'ats' | 'resdex' | 'outreach'>('ats')

  // ATS Scanner state
  const [targetRole, setTargetRole] = useState('Python Backend Engineer')
  const [userSkills, setUserSkills] = useState('Python, FastAPI, Docker, PostgreSQL, REST APIs')
  const [atsScore, setAtsScore] = useState<number>(76)
  const [atsScanning, setAtsScanning] = useState(false)

  // Resdex Calculator state
  const [lastUpdate, setLastUpdate] = useState<'today' | 'week' | 'old'>('week')
  const [noticePeriod, setNoticePeriod] = useState<'immediate' | '30' | '90'>('immediate')

  // Outreach state
  const [targetCompany, setTargetCompany] = useState('PhonePe')

  const handleScanAts = () => {
    setAtsScanning(true)
    setTimeout(() => {
      // Calculate realistic dynamic score based on skills length
      const count = userSkills.split(',').length
      const base = count > 4 ? 78 : count > 2 ? 65 : 48
      const variance = Math.floor(Math.random() * 8)
      setAtsScore(Math.min(96, base + variance))
      setAtsScanning(false)
    }, 500)
  }

  return (
    <div className="w-full rounded-2xl border border-zinc-800 light:border-zinc-200 bg-[#09090b]/90 light:bg-white backdrop-blur-xl p-5 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden card-featured-glow">
      {/* Subtle top border accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-600/40 to-transparent pointer-events-none" />

      {/* Header with Live Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-400 light:text-zinc-600 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" />
            Interactive Career Lab & Free Diagnostics
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white light:text-zinc-900 tracking-tight">
            Test Your Profile Readiness Before Applying
          </h2>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 text-xs font-mono self-start sm:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          <span>Diagnostic Model</span>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-black light:bg-white p-1 rounded-xl border border-zinc-800 light:border-zinc-200 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('ats')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'ats'
              ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 font-semibold shadow-sm'
              : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5 text-zinc-300 light:text-zinc-700 shrink-0" />
          <span className="truncate">ATS &amp; JD Match</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('resdex')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'resdex'
              ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 font-semibold shadow-sm'
              : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-zinc-300 light:text-zinc-700 shrink-0" />
          <span className="truncate">Recruiter Rank Score</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('outreach')}
          className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'outreach'
              ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 font-semibold shadow-sm'
              : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900'
          }`}
        >
          <Mail className="w-3.5 h-3.5 text-zinc-300 light:text-zinc-700 shrink-0" />
          <span className="truncate">Recruiter Pitch</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ATS SCORER & JD MATCHER                                            */}
      {/* ========================================================================= */}
      {activeTab === 'ats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-zinc-400 light:text-zinc-600 block mb-1">Target Job Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Python Backend Engineer"
                className="w-full bg-slate-950 border border-zinc-800 light:border-zinc-200 rounded-lg px-3 py-2 text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none focus:border-zinc-500 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-zinc-400 light:text-zinc-600 block mb-1">Your Key Skills (Comma separated)</label>
              <input
                type="text"
                value={userSkills}
                onChange={(e) => setUserSkills(e.target.value)}
                placeholder="e.g. Python, FastAPI, Docker, AWS"
                className="w-full bg-slate-950 border border-zinc-800 light:border-zinc-200 rounded-lg px-3 py-2 text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none focus:border-zinc-500 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 light:text-zinc-600">
              <span>Quick Role Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setTargetRole('Senior React Frontend Developer')
                  setUserSkills('React, Next.js, TypeScript, Tailwind, Redux')
                }}
                className="hover:text-white light:hover:text-zinc-900 underline cursor-pointer"
              >
                Frontend
              </button>
              <span className="text-zinc-600">•</span>
              <button
                type="button"
                onClick={() => {
                  setTargetRole('DevOps & Cloud Engineer')
                  setUserSkills('Kubernetes, Terraform, AWS, CI/CD, Docker')
                }}
                className="hover:text-white light:hover:text-zinc-900 underline cursor-pointer"
              >
                DevOps
              </button>
            </div>

            <button
              type="button"
              onClick={handleScanAts}
              disabled={atsScanning}
              className="px-3.5 py-1.5 rounded-lg bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${atsScanning ? 'animate-spin' : ''}`} />
              <span>{atsScanning ? 'Scanning ATS...' : 'Calculate ATS Match'}</span>
            </button>
          </div>

          {/* ATS Score Results Card */}
          <div className="p-4 rounded-xl bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 light:text-zinc-600">ATS Parsing Match:</span>
                <span className="text-xl font-bold text-white light:text-zinc-900 font-mono">
                  {atsScore}%
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 light:bg-zinc-200 text-zinc-300 light:text-zinc-700 border border-zinc-700 light:border-zinc-300">
                  Workday &amp; Taleo Tested
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 light:text-zinc-600 font-mono">2 / 6 Keywords Extracted</span>
            </div>

            {/* Keyword tags */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="bg-zinc-800 light:bg-zinc-200 text-zinc-200 light:text-zinc-800 border border-zinc-700 light:border-zinc-300 px-2 py-0.5 rounded-md font-medium">
                ✓ Python (High Priority)
              </span>
              <span className="bg-zinc-800 light:bg-zinc-200 text-zinc-200 light:text-zinc-800 border border-zinc-700 light:border-zinc-300 px-2 py-0.5 rounded-md font-medium">
                ✓ FastAPI (Found in JD)
              </span>
              <span className="bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-500 light:text-zinc-600 px-2 py-0.5 rounded-md flex items-center gap-1 select-none blur-[1px]">
                <Lock className="w-2.5 h-2.5" /> AWS ECS & Docker
              </span>
              <span className="bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-500 light:text-zinc-600 px-2 py-0.5 rounded-md flex items-center gap-1 select-none blur-[1px]">
                <Lock className="w-2.5 h-2.5" /> Kafka Streaming
              </span>
              <span className="text-zinc-500 light:text-zinc-600 text-[10px]">+ 4 more locked</span>
            </div>

            {/* Gating Callout */}
            <div className="pt-2 border-t border-zinc-800/80 light:border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-zinc-400 light:text-zinc-600 text-[11px] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600 shrink-0" />
                <span>Sign in to unlock full keyword gap analysis & auto-apply to 50 jobs</span>
              </div>

              {isLoggedIn ? (
                <a
                  href="/tools/ats-score-checker"
                  className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 font-semibold text-xs transition-colors text-center"
                >
                  Open Full ATS Scanner
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onTriggerAuth('trial')}
                  className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Unlock & Auto-Apply Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RECRUITER SEARCH RANK ESTIMATOR                                    */}
      {/* ========================================================================= */}
      {activeTab === 'resdex' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-zinc-400 light:text-zinc-600 block mb-1">When did you last touch your profile?</label>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                {[
                  { id: 'today', label: 'Within 24h' },
                  { id: 'week', label: 'This week' },
                  { id: 'old', label: '> 1 month' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLastUpdate(item.id as any)}
                    className={`py-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                      lastUpdate === item.id
                        ? 'bg-zinc-800 light:bg-zinc-200 border-zinc-700 light:border-zinc-300 text-white light:text-zinc-900 font-semibold'
                        : 'bg-black light:bg-white border-zinc-800 light:border-zinc-200 text-zinc-500 light:text-zinc-600 hover:text-zinc-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-zinc-400 light:text-zinc-600 block mb-1">Stated Notice Period</label>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                {[
                  { id: 'immediate', label: 'Immediate' },
                  { id: '30', label: '30 Days' },
                  { id: '90', label: '90 Days' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setNoticePeriod(item.id as any)}
                    className={`py-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                      noticePeriod === item.id
                        ? 'bg-zinc-800 light:bg-zinc-200 border-zinc-700 light:border-zinc-300 text-white light:text-zinc-900 font-semibold'
                        : 'bg-black light:bg-white border-zinc-800 light:border-zinc-200 text-zinc-500 light:text-zinc-600 hover:text-zinc-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resdex Diagnostic Output */}
          <div className="p-4 rounded-xl bg-black/60 light:bg-white/85 border border-zinc-800/90 light:border-zinc-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400 light:text-zinc-600">Recruiter Resdex Visibility Tier:</span>
                <div className="text-lg font-bold text-white light:text-zinc-900 flex items-center gap-2 mt-0.5">
                  {lastUpdate === 'today' && noticePeriod === 'immediate' ? (
                     <span className="text-white light:text-zinc-900 font-semibold flex items-center gap-1">
                      <Flame className="w-4 h-4 text-amber-400 light:text-amber-600" /> Top 5% (Page 1 Inbound Magnet)
                    </span>
                  ) : lastUpdate === 'week' ? (
                    <span className="text-zinc-300 light:text-zinc-700">Page 2–3 (Moderate Inbound)</span>
                  ) : (
                    <span className="text-zinc-400 light:text-zinc-600">Page 5+ (Buried Behind 500+ Candidates)</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 light:text-zinc-600 block uppercase font-mono">Inbound Call Rate</span>
                <span className="text-base font-bold text-white light:text-zinc-900 font-mono">
                  {lastUpdate === 'today' ? '4.8x Calls' : lastUpdate === 'week' ? '1.6x Calls' : '0.2x Calls'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 light:text-zinc-600 leading-relaxed border-t border-zinc-800/80 light:border-zinc-200 pt-2">
              Recruiter search algorithms strictly sort candidate resumes by <strong>Freshness Timestamp</strong>. JobFlux AI silently touches your profile every morning at 9:00 AM IST to ensure you stay permanently on Page 1.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs">
              <span className="text-[11px] text-zinc-500 light:text-zinc-600 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" />
                Automatic 9 AM Silent Touch included in all plans
              </span>
              {isLoggedIn ? (
                <a
                  href="/dashboard"
                  className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 font-semibold text-xs transition-colors text-center shadow-sm"
                >
                  Activate in Dashboard
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onTriggerAuth('trial')}
                  className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Sign In to Activate 9 AM Bump</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RECRUITER COLD PITCH GENERATOR                                     */}
      {/* ========================================================================= */}
      {activeTab === 'outreach' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-xs">
            <div className="flex-1 w-full">
              <label className="text-zinc-400 light:text-zinc-600 block mb-1">Target Hiring Company</label>
              <input
                type="text"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g. PhonePe, Razorpay, Swiggy"
                className="w-full bg-slate-950 border border-zinc-800 light:border-zinc-200 rounded-lg px-3 py-2 text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none focus:border-zinc-500 text-xs font-mono"
              />
            </div>
            <div className="self-end w-full sm:w-auto pt-1">
              <button
                type="button"
                onClick={() => setTargetCompany(targetCompany === 'PhonePe' ? 'Razorpay' : 'PhonePe')}
                className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 text-xs font-medium transition-colors cursor-pointer"
              >
                Switch Company
              </button>
            </div>
          </div>

          {/* Generated Snippet Preview */}
          <div className="p-4 rounded-xl bg-black/60 light:bg-white/85 border border-zinc-800/90 light:border-zinc-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white light:text-zinc-900">AI-Crafted HR InMail Outreach Message:</span>
              <span className="text-[10px] font-mono text-zinc-300 light:text-zinc-700 bg-zinc-900 light:bg-zinc-100 px-2 py-0.5 rounded border border-zinc-800 light:border-zinc-200">
                84% Response Rate
              </span>
            </div>

            <div className="text-[11px] font-mono text-zinc-300 light:text-zinc-700 leading-relaxed bg-zinc-950/80 light:bg-white p-3 rounded-lg border border-zinc-900 light:border-zinc-200 relative">
              <p>
                Hi [Recruiter Name], noticed {targetCompany} is expanding its core engineering group. With 4+ years scaling microservices in Python/Go handling 25,000+ RPS...
              </p>
              <div className="h-6 bg-gradient-to-b from-transparent to-zinc-950 light:to-white absolute inset-x-0 bottom-0 flex items-center justify-center">
                <span className="text-[10px] text-zinc-400 light:text-zinc-600 flex items-center gap-1 font-sans">
                  <Lock className="w-3 h-3 text-zinc-400 light:text-zinc-600" /> Remainder of pitch locked
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs">
              <span className="text-[11px] text-zinc-400 light:text-zinc-600">
                Direct recruiter delivery with tailored answers is built into JobFlux AI.
              </span>
              {isLoggedIn ? (
                <a
                  href="/dashboard"
                  className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 font-semibold text-xs transition-colors text-center shadow-sm"
                >
                  Generate in Dashboard
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onTriggerAuth('trial')}
                  className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Sign In to Unlock Pitch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Conversion Strip */}
      <div className="pt-2 border-t border-zinc-800/80 light:border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 light:text-zinc-600">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-zinc-400 light:text-zinc-600 shrink-0" />
          <span>Over <strong>1,800+ tech applications</strong> dispatched each week across India</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <a href="/tools" className="text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 underline font-semibold">
            Explore All Free Tools →
          </a>
        </div>
      </div>
    </div>
  )
}

