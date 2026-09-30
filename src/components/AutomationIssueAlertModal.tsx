'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  AlertTriangle,
  KeyRound,
  FileText,
  CheckCircle2,
  Play,
  X,
  Eye,
  EyeOff,
  UploadCloud,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Lock,
  ExternalLink
} from 'lucide-react'

export interface AutomationIssue {
  code: 'CREDS_MISSING' | 'CREDS_INVALID' | 'RESUME_MISSING' | 'CIRCUIT_BREAKER_PAUSED' | 'DAILY_RUN_DISABLED' | 'NAUKRI_LIMIT_REACHED'
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
  description: string
  quick_fix_type: 'credentials' | 'resume' | 'enable_daily_run' | 'credentials_and_re_enable' | 'info'
  occurred_at?: string | null
}

export interface AutomationHealthData {
  needs_attention: boolean
  has_critical_blocker: boolean
  severity: 'critical' | 'warning' | 'info' | 'healthy'
  primary_issue: AutomationIssue | null
  issues: AutomationIssue[]
  profile_status: {
    user_id: string
    has_credentials: boolean
    naukri_email: string
    has_resume: boolean
    resume_filename: string
    enabled_for_daily_run: boolean
    naukri_login_fail_count: number
    automation_status: string
    naukri_daily_limit_reached: boolean
    naukri_daily_limit_date: string | null
  }
}

interface AutomationIssueAlertModalProps {
  isOpen: boolean
  onClose: () => void
  healthData: AutomationHealthData | null
  onResolved?: () => void
  onTriggerOnDemand?: () => void
}

export default function AutomationIssueAlertModal({
  isOpen,
  onClose,
  healthData,
  onResolved,
  onTriggerOnDemand
}: AutomationIssueAlertModalProps) {
  // State for Credentials Form
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSavingCreds, setIsSavingCreds] = useState(false)
  const [credsSuccess, setCredsSuccess] = useState(false)
  const [credsError, setCredsError] = useState<string | null>(null)

  // State for Resume Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [resumeSuccess, setResumeSuccess] = useState(false)
  const [resumeError, setResumeError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State for Re-enabling Daily Runs
  const [isEnablingDaily, setIsEnablingDaily] = useState(false)
  const [dailySuccess, setDailySuccess] = useState(false)
  const [dailyError, setDailyError] = useState<string | null>(null)

  // Pre-fill initial email when modal opens or healthData changes
  useEffect(() => {
    if (healthData?.profile_status?.naukri_email) {
      setEmailInput(healthData.profile_status.naukri_email)
    }
  }, [healthData])

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleDismiss()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (!isOpen || !healthData) return null

  const userId = healthData.profile_status.user_id
  const issues = healthData.issues || []

  // Check specific issue conditions
  const hasCredsIssue = issues.some(i => i.code === 'CREDS_MISSING' || i.code === 'CREDS_INVALID' || i.code === 'CIRCUIT_BREAKER_PAUSED') && !credsSuccess
  const hasResumeIssue = issues.some(i => i.code === 'RESUME_MISSING') && !resumeSuccess
  const hasCircuitBreaker = issues.some(i => i.code === 'CIRCUIT_BREAKER_PAUSED') && !dailySuccess && !credsSuccess
  const hasDailyDisabled = issues.some(i => i.code === 'DAILY_RUN_DISABLED') && !dailySuccess
  const hasLimitReached = issues.some(i => i.code === 'NAUKRI_LIMIT_REACHED')

  // Check if everything is now resolved
  const allResolved = !hasCredsIssue && !hasResumeIssue && !hasCircuitBreaker && (!hasDailyDisabled || dailySuccess)

  const handleDismiss = () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('jobflux_automation_alert_dismissed', 'true')
      }
    } catch {}
    onClose()
  }

  // Quick Action 1: Save Credentials
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordInput.trim()) {
      setCredsError('Please enter your Naukri password.')
      return
    }
    setIsSavingCreds(true)
    setCredsError(null)

    try {
      const res = await fetch('/api/user/automation-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_credentials',
          user_id: userId,
          email: emailInput.trim(),
          password: passwordInput.trim()
        })
      })

      const data = await res.json()
      if (res.ok) {
        setCredsSuccess(true)
        if (onResolved) onResolved()
      } else {
        setCredsError(data.detail || 'Failed to save credentials. Please check and try again.')
      }
    } catch (err: any) {
      setCredsError(err.message || 'Network error while saving credentials.')
    } finally {
      setIsSavingCreds(false)
    }
  }

  // Quick Action 2: Upload Resume
  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setResumeError('Please upload an ATS resume in PDF format only (.pdf).')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setResumeError('Resume file size must be less than 3 MB.')
      return
    }
    setSelectedFile(file)
    setResumeError(null)
  }

  const handleUploadResume = async () => {
    if (!selectedFile) {
      setResumeError('Please choose a PDF file first.')
      return
    }
    setIsUploadingResume(true)
    setResumeError(null)

    try {
      const formData = new FormData()
      formData.append('user_id', userId)
      formData.append('file', selectedFile)

      const res = await fetch('/api/profile/resume', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      if (res.ok) {
        setResumeSuccess(true)
        if (onResolved) onResolved()
      } else {
        setResumeError(data.detail || 'Failed to upload resume. Please try again.')
      }
    } catch (err: any) {
      setResumeError(err.message || 'Network error while uploading resume.')
    } finally {
      setIsUploadingResume(false)
    }
  }

  // Quick Action 3: Re-enable Daily Applications
  const handleReEnableDaily = async () => {
    setIsEnablingDaily(true)
    setDailyError(null)

    try {
      const res = await fetch('/api/user/automation-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 're_enable_daily_run',
          user_id: userId
        })
      })

      const data = await res.json()
      if (res.ok) {
        setDailySuccess(true)
        if (onResolved) onResolved()
      } else {
        setDailyError(data.detail || 'Failed to re-enable daily runs.')
      }
    } catch (err: any) {
      setDailyError(err.message || 'Network error while re-enabling.')
    } finally {
      setIsEnablingDaily(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#161a29] via-[#0d101a] to-[#08090e] border border-amber-500/40 shadow-[0_25px_80px_rgba(245,158,11,0.22)] text-white p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-gradient-to-b from-amber-500/20 via-rose-500/10 to-transparent blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          title="Dismiss for this session"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Action Required
              </span>
              {healthData.has_critical_blocker && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Applications Paused
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1.5">
              {allResolved
                ? 'All Automation Blockers Resolved!'
                : healthData.primary_issue?.title || 'Automation Attention Needed'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              {allResolved
                ? 'Your credentials and resume are synchronized. JobFlux AI is ready to apply.'
                : 'JobFlux autonomous applications cannot proceed until the items below are addressed.'}
            </p>
          </div>
        </div>

        {/* Success State when everything is resolved */}
        {allResolved ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-3.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white text-sm">System Ready for Daily Sweeps</h4>
                <p className="text-xs text-emerald-300/90 mt-1 leading-relaxed">
                  Your profile is fully configured. Our autonomous worker will search matching jobs, filter recruiter requirements, and submit applications every morning.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {onTriggerOnDemand && (
                <button
                  type="button"
                  onClick={() => {
                    handleDismiss()
                    onTriggerOnDemand()
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  Run Application Sweep Now
                </button>
              )}
              <button
                type="button"
                onClick={handleDismiss}
                className="py-3 px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-sm transition-colors text-center"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Interactive Fix Cards */
          <div className="space-y-5">
            {/* Blocker 1: Credentials (Missing or Wrong) */}
            {hasCredsIssue && (
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-rose-500/30 shadow-inner">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        Naukri Credentials
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                          {healthData.issues.find(i => i.code === 'CREDS_MISSING') ? 'Missing' : 'Rejected'}
                        </span>
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {healthData.issues.find(i => i.code === 'CREDS_MISSING')
                          ? 'Enter your Naukri login password to enable autonomous job applications.'
                          : 'Your saved password was rejected by Naukri. Please update it below.'}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveCredentials} className="space-y-3 mt-3 pt-3 border-t border-zinc-800/80">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Naukri Email ID
                    </label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="e.g. your.naukri@gmail.com"
                      required
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-zinc-700 focus:border-cyan-400 focus:outline-none text-sm text-white placeholder-zinc-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Naukri Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Enter your accurate Naukri account password"
                        required
                        className="w-full px-3.5 py-2 pr-10 rounded-xl bg-black/60 border border-zinc-700 focus:border-cyan-400 focus:outline-none text-sm text-white placeholder-zinc-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-cyan-400 shrink-0" />
                      Encrypted and isolated in JobFlux bot worker. Never shared or modified.
                    </p>
                  </div>

                  {credsError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{credsError}</span>
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between gap-3">
                    <a
                      href="https://www.naukri.com/nlogin/login"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      Test login on Naukri.com
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      type="submit"
                      disabled={isSavingCreds}
                      className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all"
                    >
                      {isSavingCreds ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Save & Unblock
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Blocker 2: Missing Resume PDF */}
            {hasResumeIssue && (
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-rose-500/30 shadow-inner">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        ATS Resume PDF
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                          Not Found
                        </span>
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Autonomous applications require an ATS-formatted resume PDF to attach to job applications.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-3 pt-3 border-t border-zinc-800/80">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeSelect}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-700 hover:border-cyan-400/60 rounded-xl p-4 text-center cursor-pointer bg-black/40 hover:bg-black/60 transition-all group"
                  >
                    <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-cyan-400 mx-auto mb-1.5 transition-colors" />
                    {selectedFile ? (
                      <div className="text-xs text-emerald-300 font-medium">
                        Selected: <span className="underline">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(0)} KB)
                        <div className="text-[11px] text-zinc-400 mt-0.5">Click to choose another PDF</div>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-300">
                        <span className="font-semibold text-cyan-400">Click to select ATS Resume PDF</span> (Max 3MB)
                        <div className="text-[11px] text-zinc-500 mt-0.5">Must be a text-selectable PDF</div>
                      </div>
                    )}
                  </div>

                  {resumeError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{resumeError}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={!selectedFile || isUploadingResume}
                      onClick={handleUploadResume}
                      className="py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-40 transition-all"
                    >
                      {isUploadingResume ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Uploading PDF...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5" />
                          Upload & Activate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Blocker 3: Circuit Breaker / Daily Runs Paused */}
            {(hasCircuitBreaker || hasDailyDisabled) && (
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-amber-500/30 shadow-inner">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        Daily Applications Switch
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                          Paused
                        </span>
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        {hasCircuitBreaker
                          ? 'Automatic morning runs were paused after consecutive login failures to protect your account. Re-enable daily runs below.'
                          : 'Daily automated morning sweeps are currently switched off in profile settings.'}
                      </p>
                      {dailyError && (
                        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs mt-2">
                          {dailyError}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isEnablingDaily}
                    onClick={handleReEnableDaily}
                    className="py-2 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs flex items-center gap-1.5 shrink-0 border border-zinc-700 transition-colors"
                  >
                    {isEnablingDaily ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    Re-enable Runs
                  </button>
                </div>
              </div>
            )}

            {/* Informational: Naukri 50-limit reached */}
            {hasLimitReached && (
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs">
                <div className="font-semibold text-white flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  Naukri 50/50 Daily Platform Limit
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  Naukri has reached its strict 50-application limit for today. Your credentials and resume are valid. Scheduled applications will automatically resume tomorrow morning.
                </p>
              </div>
            )}

            {/* Footer / Session Dismissal Note */}
            <div className="pt-2 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-800/80">
              <span className="text-[11px]">
                Dismissing will hide this popup for this session.
              </span>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium"
              >
                Dismiss for now →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
