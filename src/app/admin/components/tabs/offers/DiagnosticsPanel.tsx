'use client'

import React from 'react'
import {
  AlertTriangle,
  Bell,
  BellRing,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Lock,
  Mail,
  RefreshCw,
  Send,
  Sparkles
} from 'lucide-react'
import { CandidateUser } from '../../../types'

interface DiagnosticsPanelProps {
  offersCollapsedMailDiag: boolean
  toggleOffersMailDiag: () => void
  fetchMailDiagnostics: () => Promise<void> | void
  loadingMailLogs: boolean
  mailSender: string
  mailMaskedPass: string
  dispatchReportLoading: boolean
  setDispatchReportTarget: (target: string) => void
  handleDispatchCareerReport: (target: string, channel: 'email' | 'push' | 'both') => Promise<void> | void
  showConfigPass: boolean
  setShowConfigPass: (show: boolean) => void
  showCustomPushConfig: boolean
  setShowCustomPushConfig: (show: boolean) => void
  diagnosticRecipient: string
  setDiagnosticRecipient: (rec: string) => void
  usersList: CandidateUser[]
  customPushRecipient: string
  setCustomPushRecipient: (rec: string) => void
  mailDiagnosticLoading: boolean
  handleSendDiagnosticMail: () => Promise<void> | void
  pushDiagnosticLoading: boolean
  handleTriggerPushNotification: () => Promise<void> | void
  newAppPassInput: string
  setNewAppPassInput: (input: string) => void
  savingPass: boolean
  handleSaveAndTestCredentials: () => Promise<void> | void
  deviceWebPushActive: boolean
  handleRequestNotification: () => Promise<void> | void
  customPushTitle: string
  setCustomPushTitle: (title: string) => void
  customPushUrl: string
  setCustomPushUrl: (url: string) => void
  customPushMessage: string
  setCustomPushMessage: (msg: string) => void
  closedTabTestActive: boolean
  handleTestClosedTabPush: () => Promise<void> | void
  closedTabCountdown: number
  pushDiagnosticResult: any
  setPushDiagnosticResult: (res: any) => void
  mailDiagnosticResult: any
  offersCollapsedMailLogs: boolean
  toggleOffersMailLogs: () => void
  mailLogs: any[]
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  offersCollapsedMailDiag,
  toggleOffersMailDiag,
  fetchMailDiagnostics,
  loadingMailLogs,
  mailSender,
  mailMaskedPass,
  dispatchReportLoading,
  setDispatchReportTarget,
  handleDispatchCareerReport,
  showConfigPass,
  setShowConfigPass,
  showCustomPushConfig,
  setShowCustomPushConfig,
  diagnosticRecipient,
  setDiagnosticRecipient,
  usersList,
  customPushRecipient,
  setCustomPushRecipient,
  mailDiagnosticLoading,
  handleSendDiagnosticMail,
  pushDiagnosticLoading,
  handleTriggerPushNotification,
  newAppPassInput,
  setNewAppPassInput,
  savingPass,
  handleSaveAndTestCredentials,
  deviceWebPushActive,
  handleRequestNotification,
  customPushTitle,
  setCustomPushTitle,
  customPushUrl,
  setCustomPushUrl,
  customPushMessage,
  setCustomPushMessage,
  closedTabTestActive,
  handleTestClosedTabPush,
  closedTabCountdown,
  pushDiagnosticResult,
  setPushDiagnosticResult,
  mailDiagnosticResult,
  offersCollapsedMailLogs,
  toggleOffersMailLogs,
  mailLogs,
}) => {
  return (
    <div className="rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 overflow-hidden shadow-xl">
      <div 
        onClick={toggleOffersMailDiag}
        className="px-5 py-4 bg-zinc-950 light:bg-white hover:bg-zinc-900/60 light:hover:bg-zinc-50 border-b border-zinc-800 light:border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition-colors"
      >
        <div>
          <h4 className="text-sm font-bold text-white light:text-zinc-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-sky-400" />
            <span>Live Email Dispatch Diagnostic &amp; Mailbox Audit</span>
          </h4>
          <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
            Test live Google SMTP dispatch to verify delivery in real-time, view sender credentials, and inspect MongoDB dispatch logs.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={fetchMailDiagnostics}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingMailLogs ? 'animate-spin' : ''}`} />
            <span>Refresh Logs</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleOffersMailDiag()
            }}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            {offersCollapsedMailDiag ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Expand</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>

      {!offersCollapsedMailDiag && (
        <div className="p-5 space-y-5">
          {/* Official JobFlux AI Brand & Dispatch Identity */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 light:border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-black light:bg-white border border-sky-500/30 flex items-center justify-center p-2 shadow-inner shrink-0">
                <img
                  src="/icon.svg"
                  alt="JobFlux AI Logo"
                  className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(56,189,248,0.3)]"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-bold text-white light:text-zinc-900 tracking-tight">
                    JobFlux <span className="text-sky-400">AI</span> Official Brand Identity
                  </strong>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 light:text-zinc-600 mt-0.5">
                  Emails are dispatched with the official JobFlux rocket emblem from <span className="font-mono text-zinc-300 light:text-zinc-700">{mailSender}</span>.
                </p>
              </div>
            </div>

            <a
              href="/icon.svg"
              download="icon.svg"
              className="px-3 py-1.5 rounded-lg bg-zinc-800 light:bg-zinc-200 hover:bg-zinc-700 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download SVG Logo</span>
            </a>
          </div>

          {/* Hub Shortcut */}
          <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Send className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <strong className="text-white light:text-zinc-900 block font-medium">Multichannel Daily Report &amp; Offer Dispatcher</strong>
                <span className="text-zinc-400 light:text-zinc-600 text-[11px]">Send real DB applications &amp; upgrade offers to candidates via SMTP + Web Push in the dedicated Hub above.</span>
              </div>
            </div>
            <button
              type="button"
              disabled={dispatchReportLoading}
              onClick={() => {
                setDispatchReportTarget('koushiksr1999@gmail.com')
                handleDispatchCareerReport('koushiksr1999@gmail.com', 'both')
              }}
              className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black light:text-white font-bold text-xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
            >
              Test Send to Koushik (Both)
            </button>
          </div>

          {/* Diagnostic Dispatch Bar */}
          <div className="p-4 rounded-xl bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 space-y-3">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="text-zinc-500 light:text-zinc-600">Sender Account:</span>
                  <strong className="text-sky-300 font-mono">{mailSender}</strong>
                  <span className="text-zinc-700">|</span>
                  <span className="text-emerald-400 light:text-emerald-600 font-mono text-[11px]">
                    {mailMaskedPass ? `Active Key: ${mailMaskedPass}` : 'No Key Loaded'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 light:text-zinc-600">
                  Dispatches a live test email through Google SMTP (Port 465 SSL) and audits the delivery response.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowConfigPass(!showConfigPass)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3 h-3 text-amber-400 light:text-amber-600" />
                  <span>{showConfigPass ? 'Hide Key Config' : 'Update Gmail Key'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCustomPushConfig(!showCustomPushConfig)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    showCustomPushConfig
                      ? 'bg-amber-500/20 border-amber-500/40 light:border-amber-300 text-amber-300 light:text-amber-700'
                      : 'bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700'
                  }`}
                >
                  <Bell className="w-3 h-3 text-amber-400 light:text-amber-600" />
                  <span>{showCustomPushConfig ? 'Hide Push Settings' : 'Push Alert Settings'}</span>
                </button>

                <select
                  value={diagnosticRecipient}
                  onChange={(e) => setDiagnosticRecipient(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-200 light:text-zinc-800 text-xs font-mono focus:outline-none focus:border-sky-500 max-w-[220px]"
                >
                  <option value="koushiksrmedala@gmail.com">koushiksrmedala@gmail.com</option>
                  <option value="koushiksr1999@gmail.com">koushiksr1999@gmail.com</option>
                  {usersList
                    .filter(u => u.email && u.email !== 'koushiksrmedala@gmail.com' && u.email !== 'koushiksr1999@gmail.com')
                    .map(u => (
                      <option key={u.email} value={u.email}>{u.name ? `${u.name} (${u.email})` : u.email}</option>
                    ))}
                  <option value="custom">-- Custom Specific Email --</option>
                  <option value="all">-- Broadcast to All Candidates --</option>
                </select>

                {diagnosticRecipient === 'custom' && (
                  <input
                    type="email"
                    value={customPushRecipient}
                    onChange={(e) => setCustomPushRecipient(e.target.value)}
                    placeholder="Enter candidate email..."
                    className="px-3 py-1.5 rounded-lg bg-black light:bg-white border border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800 text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                )}

                <button
                  type="button"
                  disabled={mailDiagnosticLoading}
                  onClick={handleSendDiagnosticMail}
                  className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black light:text-white text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  title="Dispatch live test email via Google SMTP"
                >
                  {mailDiagnosticLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Testing SMTP...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Test Email</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={pushDiagnosticLoading}
                  onClick={() => handleTriggerPushNotification()}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black light:text-white text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  title="Trigger real-time browser push notification and in-app toast to recipient"
                >
                  {pushDiagnosticLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Triggering Push...</span>
                    </>
                  ) : (
                    <>
                      <BellRing className="w-3.5 h-3.5 fill-black/20" />
                      <span>Trigger Push Notification</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Inline App Password Updater */}
            {showConfigPass && (
              <div className="p-3.5 rounded-lg bg-zinc-900/90 light:bg-zinc-100 border border-amber-500/30 light:border-amber-300 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 light:text-amber-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Update Google 16-Character App Password (Instant Cloud Sync)
                  </span>
                  <span className="text-[10px] text-zinc-500 light:text-zinc-600">Saves directly to MongoDB; no Vercel redeployment required</span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={newAppPassInput}
                    onChange={(e) => setNewAppPassInput(e.target.value)}
                    placeholder="e.g. abcd efgh ijkl mnop"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-black light:bg-white border border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800 font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    disabled={savingPass || !newAppPassInput.trim()}
                    onClick={handleSaveAndTestCredentials}
                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {savingPass ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Verifying &amp; Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCheck className="w-3 h-3" />
                        <span>Verify &amp; Save Key</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-[11px] text-zinc-400 light:text-zinc-600 flex flex-wrap gap-x-4 gap-y-1">
                  <span>1. Sign in to <strong className="text-zinc-300 light:text-zinc-700">{mailSender}</strong></span>
                  <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
                    2. Generate App Password ↗
                  </a>
                  <a href="https://accounts.google.com/DisplayUnlockCaptcha" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
                    3. Unlock Captcha for Cloud IP ↗
                  </a>
                </div>
              </div>
            )}

            {/* Custom Push Notification Dispatcher Config Panel */}
            {showCustomPushConfig && (
              <div className="p-3.5 rounded-lg bg-zinc-900/90 light:bg-zinc-100 border border-amber-500/40 light:border-amber-300 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 light:text-amber-700 flex items-center gap-1.5">
                    <BellRing className="w-3.5 h-3.5" />
                    Custom Push Notification &amp; Background Web Push Dispatcher
                  </span>
                  <div className="flex items-center gap-2">
                    {deviceWebPushActive ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 light:bg-zinc-100 text-zinc-300 light:text-zinc-700 border border-zinc-750 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        Background Web Push Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestNotification}
                        className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 light:text-amber-700 border border-amber-700/60 light:border-amber-300 hover:bg-amber-900 cursor-pointer"
                      >
                        Enable Web Push on This Device
                      </button>
                    )}
                    <span className="text-[10px] text-zinc-400 light:text-zinc-600 font-mono hidden sm:inline">RFC 8291 VAPID</span>
                  </div>
                </div>

                {/* Engaging Preset Templates */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 light:text-zinc-600 block font-semibold">
                    Engaging 1-Click Push Notification Presets:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPushTitle('47 Jobs Applied Today by JobFlux AI')
                        setCustomPushMessage('Dispatched to Infosys, MedBuddy, UST & 44 top employers with tailored screening answers. Tap to view your delivery receipts!')
                        setCustomPushUrl('/dashboard')
                      }}
                      className="p-2 rounded-lg bg-black light:bg-white hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-left text-xs transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-white light:text-zinc-900 block text-[11px]">Daily Jobs Report</span>
                      <span className="text-[10px] text-zinc-400 light:text-zinc-600 leading-snug line-clamp-1">47 Jobs Applied Today</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCustomPushTitle('4 Recruiters Viewed Your Profile Today')
                        setCustomPushMessage('Your profile moved into the Top 5% in recruiter searches. Tap to see which companies accessed your resume.')
                        setCustomPushUrl('/dashboard')
                      }}
                      className="p-2 rounded-lg bg-black light:bg-white hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-left text-xs transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-white light:text-zinc-900 block text-[11px]">Recruiter Views</span>
                      <span className="text-[10px] text-zinc-400 light:text-zinc-600 leading-snug line-clamp-1">4 Hiring Managers Viewed</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCustomPushTitle('18 New Tech Openings Discovered')
                        setCustomPushMessage('New high-match roles detected in your domain. Autonomous cloud worker scheduled for morning dispatch.')
                        setCustomPushUrl('/dashboard')
                      }}
                      className="p-2 rounded-lg bg-black light:bg-white hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-left text-xs transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-white light:text-zinc-900 block text-[11px]">Match Discovery</span>
                      <span className="text-[10px] text-zinc-400 light:text-zinc-600 leading-snug line-clamp-1">18 Roles Found Today</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCustomPushTitle('Free Milestone Reached · Save with Pro')
                        setCustomPushMessage('47 jobs applied! Upgrade to Pro for ₹399 to unlock continuous applications & skip review queues.')
                        setCustomPushUrl('/pricing?promo=WELCOMEPRO')
                      }}
                      className="p-2 rounded-lg bg-black light:bg-white hover:bg-zinc-800 light:hover:bg-zinc-200 border border-amber-500/40 light:border-amber-300 text-left text-xs transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-amber-300 light:text-amber-700 block text-[11px]">Upgrade Pass (₹399)</span>
                      <span className="text-[10px] text-zinc-400 light:text-zinc-600 leading-snug line-clamp-1">Milestone + 90% Discount</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 light:text-zinc-700 mb-1">
                      Notification Title
                    </label>
                    <input
                      type="text"
                      value={customPushTitle}
                      onChange={(e) => setCustomPushTitle(e.target.value)}
                      placeholder="e.g. JobFlux AI Radar Alert"
                      className="w-full px-3 py-1.5 rounded-lg bg-black light:bg-white border border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 light:text-zinc-700 mb-1">
                      Action / Target URL
                    </label>
                    <input
                      type="text"
                      value={customPushUrl}
                      onChange={(e) => setCustomPushUrl(e.target.value)}
                      placeholder="e.g. /dashboard or /pricing"
                      className="w-full px-3 py-1.5 rounded-lg bg-black light:bg-white border border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800 text-xs font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 light:text-zinc-700 mb-1">
                    Notification Message / Body
                  </label>
                  <textarea
                    rows={2}
                    value={customPushMessage}
                    onChange={(e) => setCustomPushMessage(e.target.value)}
                    placeholder="e.g. 15 new high-match job opportunities applied on your behalf!"
                    className="w-full px-3 py-1.5 rounded-lg bg-black light:bg-white border border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-zinc-400 light:text-zinc-600">
                    Target: <strong className="text-white light:text-zinc-900 font-mono">{diagnosticRecipient === 'custom' ? customPushRecipient || 'None specified' : diagnosticRecipient === 'all' ? 'All Candidates (Broadcast)' : diagnosticRecipient}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={closedTabTestActive || pushDiagnosticLoading}
                      onClick={handleTestClosedTabPush}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                        closedTabTestActive
                          ? 'bg-amber-950 text-amber-300 light:text-amber-700 border-amber-500 animate-pulse'
                          : 'bg-zinc-800 light:bg-zinc-200 hover:bg-zinc-700 text-zinc-200 light:text-zinc-800 border-zinc-600'
                      }`}
                      title="Tests delivery with the browser tab closed: schedules push 5 seconds in future so you can close this tab"
                    >
                      <Bell className="w-3 h-3 text-amber-400 light:text-amber-600" />
                      <span>
                        {closedTabTestActive
                          ? `Close tab now! (${closedTabCountdown}s)`
                          : 'Test 5s Closed-Tab Push (YouTube-Style)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={pushDiagnosticLoading}
                      onClick={() => handleTriggerPushNotification()}
                      className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>Dispatch Push Alert</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Push Notification Result Banner */}
          {pushDiagnosticResult && (
            <div
              className={`p-3.5 rounded-xl text-xs border ${
                pushDiagnosticResult.success
                  ? 'bg-amber-950/30 border-amber-500/50 light:border-amber-300 text-amber-200 light:text-amber-800'
                  : 'bg-rose-950/30 border-rose-800/50 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {pushDiagnosticResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-amber-400 light:text-amber-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 light:text-rose-600 shrink-0" />
                  )}
                  <span className="font-semibold text-xs">
                    {pushDiagnosticResult.message || pushDiagnosticResult.error}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPushDiagnosticResult(null)}
                  className="text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 text-xs cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Diagnostic Result Banner */}
          {mailDiagnosticResult && (
            <div
              className={`p-4 rounded-xl text-xs border ${
                mailDiagnosticResult.success
                  ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200 light:text-emerald-800'
                  : 'bg-rose-950/30 border-rose-800/50 text-rose-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {mailDiagnosticResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 light:text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 light:text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-2 flex-1">
                  <div className="font-bold text-sm">
                    {mailDiagnosticResult.success
                      ? '✓ Live Email Dispatched & Delivered to Inbox!'
                      : '❌ SMTP Dispatch Failed: Google Rejected Authentication'}
                  </div>
                  <p className="text-xs text-zinc-300 light:text-zinc-700">
                    {mailDiagnosticResult.message || mailDiagnosticResult.detail || mailDiagnosticResult.error}
                  </p>
                  {mailDiagnosticResult.smtp_response && (
                    <div className="font-mono text-[11px] text-emerald-400 light:text-emerald-600 bg-black/40 light:bg-white/85 px-2 py-1 rounded inline-block">
                      Server Response: {mailDiagnosticResult.smtp_response}
                    </div>
                  )}
                  {mailDiagnosticResult.message_id && (
                    <div className="font-mono text-[10px] text-zinc-400 light:text-zinc-600 block">
                      Message ID: {mailDiagnosticResult.message_id}
                    </div>
                  )}

                  {!mailDiagnosticResult.success && (
                    <div className="mt-2 pt-2 border-t border-rose-900/60 text-xs space-y-1.5">
                      <strong className="text-rose-300 light:text-rose-600 block">How to resolve Google BadCredentials:</strong>
                      <ol className="list-decimal pl-4 space-y-1 text-zinc-300 light:text-zinc-700">
                        <li>
                          <a
                            href="https://myaccount.google.com/notifications"
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-400 font-semibold hover:underline"
                          >
                            Google Security Notifications ↗
                          </a>{' '}
                          — Look for recent blocked sign-in and click <strong>&quot;Yes, it was me&quot;</strong>.
                        </li>
                        <li>
                          <a
                            href="https://accounts.google.com/DisplayUnlockCaptcha"
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-400 font-semibold hover:underline"
                          >
                            Google DisplayUnlockCaptcha ↗
                          </a>{' '}
                          — Click <strong>Continue</strong> to authorize cloud connections.
                        </li>
                        <li>
                          <a
                            href="https://myaccount.google.com/apppasswords"
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-400 font-semibold hover:underline"
                          >
                            Generate Fresh App Password ↗
                          </a>{' '}
                          — Create a new 16-character key and paste it above in &quot;Update Gmail Key&quot;.
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recent Dispatched Emails Table from MongoDB */}
          <div className="space-y-2">
            <div 
              onClick={toggleOffersMailLogs}
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 light:bg-white border border-zinc-800/80 light:border-zinc-200 hover:border-zinc-700 light:hover:border-zinc-300 cursor-pointer select-none text-xs text-zinc-400 light:text-zinc-600 transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-200 light:text-zinc-800">Recent MongoDB Mail Dispatches (Real-Time Audit)</span>
                <span className="font-mono text-[11px] text-zinc-400 light:text-zinc-600 bg-zinc-900 light:bg-zinc-100 px-2 py-0.5 rounded border border-zinc-800 light:border-zinc-200">{mailLogs.length} audit records</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400 light:text-zinc-600 font-medium">
                  {offersCollapsedMailLogs ? 'Show Records' : 'Hide Records'}
                </span>
                {offersCollapsedMailLogs ? (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" />
                )}
              </div>
            </div>

            {!offersCollapsedMailLogs && (
              <div className="rounded-xl border border-zinc-800 light:border-zinc-200 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead onClick={toggleOffersMailLogs} className="cursor-pointer group select-none" title="Click table head to shrink / expand">
                    <tr className="border-b border-zinc-800 light:border-zinc-200 bg-zinc-950/80 light:bg-white text-[11px] font-mono text-zinc-400 light:text-zinc-600 uppercase tracking-wider hover:bg-zinc-900/60 light:hover:bg-zinc-100 transition-colors">
                      <th className="py-2.5 px-3 flex items-center gap-1">
                        <span>Date &amp; Time</span>
                        <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-sky-400" />
                      </th>
                      <th className="py-2.5 px-3">Recipient</th>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3">Response / Error (Click Head to Shrink ▲)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 light:divide-zinc-200/60 font-sans">
                    {mailLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-zinc-500 light:text-zinc-600 italic">
                          No recent email records found in MongoDB.
                        </td>
                      </tr>
                    ) : (
                      mailLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-zinc-900/40 light:hover:bg-zinc-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400 light:text-zinc-600 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}{' '}
                            · {new Date(log.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-zinc-200 light:text-zinc-800">
                            {log.to}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-300 light:text-zinc-700 max-w-xs truncate" title={log.subject}>
                            {log.subject}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            {log.status === 'sent' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 light:text-emerald-600 border border-emerald-500/30 light:border-emerald-300">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                DELIVERED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 light:text-rose-600 border border-rose-500/30">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {log.status === 'failed' ? 'FAILED' : 'QUEUED'}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[10px] text-zinc-400 light:text-zinc-600 max-w-xs truncate" title={log.smtp_response || log.smtp_error}>
                            {log.smtp_response || log.smtp_error || 'Dispatched'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
