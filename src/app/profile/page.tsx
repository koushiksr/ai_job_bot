'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Shield,
  CheckCircle2,
  Sparkles,
  LogOut,
  Crown,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import JobFluxLogo from '@/components/JobFluxLogo'
import { ThemeToggle } from '@/components/ThemeProvider'
import CandidateProfileEditor from '@/components/CandidateProfileEditor'
import ProfessionalUpgradeModal from '@/components/ProfessionalUpgradeModal'
import JobFluxHelpModal from '@/components/JobFluxHelpModal'
import AiLoadingScreen from '@/components/AiLoadingScreen'
import ReferralPayoutSection from '@/components/ReferralPayoutSection'

export default function CandidateProfilePage() {
  const [userId, setUserId] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [userPicture, setUserPicture] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('user')
  const [userPlan, setUserPlan] = useState<string>('free')
  const [isVip, setIsVip] = useState<boolean>(false)
  const [pageLoading, setPageLoading] = useState<boolean>(true)
  // Super-admin inspecting another account (?view_as=uid): editor loads the
  // TARGET profile; localStorage identity is never touched.
  const [viewAsId, setViewAsId] = useState<string | null>(null)

  // Upgrade & Help Modals
  const [showProModal, setShowProModal] = useState<boolean>(false)
  const [proModalFeature, setProModalFeature] = useState<string>('Professional Suite')
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false)

  // Save Notification
  const [showSaveBanner, setShowSaveBanner] = useState<boolean>(false)

  useEffect(() => {
    const storedUid = localStorage.getItem('user_id')
    const storedEmail = localStorage.getItem('user_email')
    const storedRole = localStorage.getItem('user_role')
    const storedPlan = localStorage.getItem('user_plan')
    const storedVip = localStorage.getItem('user_is_vip') === 'true'
    const storedPicture = localStorage.getItem('user_picture')

    if (!storedUid) {
      window.location.href = '/'
      return
    }

    // Super-admin view-as (?view_as=uid): show the target's profile in the
    // candidate interface. Server enforces admin session; nothing here
    // overwrites the viewer's own localStorage identity.
    const viewAsParam = new URLSearchParams(window.location.search).get('view_as')
    const isSuperAdminViewer = storedRole === 'admin' || storedUid === 'technohmsit'
    const viewTarget = viewAsParam && isSuperAdminViewer && viewAsParam !== storedUid ? viewAsParam : null
    if (viewTarget) setViewAsId(viewTarget)

    setUserId(viewTarget || storedUid)
    setUserEmail(storedEmail || '')
    setUserRole(storedRole || 'user')
    setUserPlan(storedPlan || 'free')
    setIsVip(storedVip)
    if (storedPicture) setUserPicture(storedPicture)

    // Load candidate info & picture (target account when viewing-as)
    const effectiveUid = viewTarget || storedUid
    Promise.allSettled([
      fetch(`/api/stats?user_id=${encodeURIComponent(effectiveUid)}`).then(res => res.json()),
      fetch(`/api/profile?user_id=${encodeURIComponent(effectiveUid)}`).then(res => res.json())
    ])
      .then(([statsRes, profileRes]) => {
        if (statsRes.status === 'fulfilled' && statsRes.value.candidate_name) {
          setUserName(statsRes.value.candidate_name)
        }
        if (profileRes.status === 'fulfilled' && profileRes.value) {
          if (profileRes.value.name) setUserName(profileRes.value.name)
          if (profileRes.value.picture) {
            setUserPicture(profileRes.value.picture)
            if (!viewTarget) localStorage.setItem('user_picture', profileRes.value.picture)
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        setTimeout(() => setPageLoading(false), 400)
      })
  }, [])

  const handleLogout = () => {
    try { navigator.sendBeacon('/api/auth/logout') } catch {}
    localStorage.clear()
    window.location.href = '/'
  }

  const isProfessional = isVip || userPlan === 'elite' || userPlan === 'pro' || userPlan === 'professional'

  if (pageLoading) {
    return (
      <AiLoadingScreen
        title="Loading Candidate Profile"
        subtitle="Retrieving Naukri credentials, resume data & targeting parameters..."
        accountInfo={userEmail || userId}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#000000] light:bg-white text-zinc-100 light:text-zinc-900 flex flex-col font-sans selection:bg-zinc-800 selection:text-white relative">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-black/90 light:bg-white/85 backdrop-blur-xl border-b border-zinc-900 light:border-zinc-200 px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Back to Dashboard & Candidate Identity with Photo */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 transition-colors cursor-pointer"
              title="Return to applications dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <div className="h-4 w-px bg-zinc-800 light:bg-zinc-200" />

            {/* Candidate Identity with Photo & Status */}
            <div className="flex items-center gap-2.5 text-xs">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex items-center justify-center font-bold text-white light:text-zinc-900 text-[11px] shrink-0 relative overflow-hidden">
                {userPicture ? (
                  <img
                    src={userPicture}
                    alt={userName || 'Candidate'}
                    className="w-full h-full object-cover"
                    onError={() => setUserPicture('')}
                  />
                ) : (
                  userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AI'
                )}
                <span className="w-2 h-2 rounded-full bg-zinc-400 absolute -bottom-0.5 -right-0.5 border border-black" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-white light:text-zinc-900 truncate max-w-[120px] sm:max-w-[160px]">
                    {userName || 'Candidate'}
                  </span>
                  {isVip ? (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 border border-amber-400/80 text-amber-300 light:text-amber-700 font-bold">
                      VIP
                    </span>
                  ) : isProfessional ? (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 border border-amber-400/80 text-amber-300 light:text-amber-700 font-bold">
                      PRO
                    </span>
                  ) : null}
                </div>
                <div className="text-[10px] text-zinc-400 light:text-zinc-600 font-mono">Profile Settings</div>
              </div>
            </div>
          </div>

          {/* Right: Brand Logo & Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            <Link href="/dashboard" className="hidden sm:flex items-center hover:opacity-90 transition-opacity">
              <JobFluxLogo size="sm" showText={true} />
            </Link>

            <div className="h-4 w-px bg-zinc-800 light:bg-zinc-200 hidden sm:block" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 light:text-red-600 hover:text-red-200 transition-colors cursor-pointer shrink-0 shadow-sm"
              title="Sign out of JobFlux"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400 light:text-red-600" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8">
        {viewAsId && (
          <div className="p-3 rounded-xl bg-cyan-950/40 light:bg-cyan-50 border border-cyan-800/50 light:border-cyan-300 text-xs text-cyan-200 light:text-cyan-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400 light:text-cyan-600 shrink-0" />
            <span>
              Viewing <strong className="font-mono">{viewAsId}</strong>&rsquo;s profile as super-admin — saves apply to their account. Your own session is untouched.
            </span>
          </div>
        )}
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 light:text-zinc-600">
          <Link href="/dashboard" className="hover:text-zinc-200 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-zinc-200 light:text-zinc-800 font-semibold">Candidate Profile & Settings</span>
        </div>

        {/* Merged Sleek Candidate Profile & ATS Readiness Header */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-white light:text-zinc-900 tracking-tight">
                Candidate Profile & Automation Settings
              </h1>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 light:border-emerald-300 text-emerald-300 light:text-emerald-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Bot Synced
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 light:text-zinc-600 font-mono">
              {userId} · {userEmail} · 06:00 AM IST sweeps
            </p>
          </div>

          {/* Sleek ATS Diagnostic Indicator */}
          <div className="flex items-center gap-3 self-start md:self-auto bg-black/60 light:bg-zinc-100/80 px-3.5 py-2 rounded-xl border border-zinc-800/80 light:border-zinc-200 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white light:text-zinc-900 font-mono">94.8% ATS Score</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 light:text-emerald-700 border border-emerald-500/30 font-bold">
                  Senior Tier
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 light:text-zinc-600">
                <span>ATS Pass: 98.4%</span>
                <span>•</span>
                <span>Keywords: Optimized</span>
                <span>•</span>
                <span>Stealth Shield: Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Confirmation Banner */}
        {showSaveBanner && (
          <div className="p-4 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800 text-xs flex items-center justify-between gap-3 font-medium animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-zinc-300 light:text-zinc-700 shrink-0" />
              <span>Candidate profile and Naukri credentials successfully synchronized with the autonomous bot!</span>
            </div>
            <Link
              href="/dashboard"
              className="px-3 py-1 rounded bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 text-xs font-semibold transition-colors shrink-0"
            >
              Go to Dashboard →
            </Link>
          </div>
        )}

        {/* Quick Section Anchor Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <a
            href="#editor"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 font-medium hover:border-zinc-700 transition-all shrink-0"
          >
            <User className="w-3.5 h-3.5 text-zinc-400" />
            <span>Candidate Resume & Credentials</span>
          </a>
        </div>

        {/* Viral Referral Program & Cash Payout Settings (Top Prominence) */}
        <div id="referrals" className="scroll-mt-6">
          <ReferralPayoutSection userId={userId} />
        </div>

        {/* Full Visual Candidate Profile & Credentials Builder */}
        <div id="editor" className="scroll-mt-6">
          <CandidateProfileEditor
            userId={userId}
            isAdmin={false}
            onSaveSuccess={() => {
              setShowSaveBanner(true)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </div>

        {/* Bottom Navigation Helper */}
        <div className="p-4 rounded-xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-zinc-500 light:text-zinc-600">
            Changes apply on the next scheduled run.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/dashboard"
              className="flex-1 sm:flex-none text-center px-4 py-2 rounded-lg bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 font-semibold text-xs transition-colors shrink-0"
            >
              Back to Application Cockpit
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 light:text-red-600 font-semibold text-xs transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </main>

      {/* Professional Tier Perks & Upgrade Modal */}
      <ProfessionalUpgradeModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        featureTitle={proModalFeature}
      />

      {/* Universal JobFlux Help & Support Center */}
      <JobFluxHelpModal
        isOpen={isHelpOpen}
        onOpen={() => setIsHelpOpen(true)}
        onClose={() => setIsHelpOpen(false)}
        showFloatingTrigger={false}
        initialEmail={userEmail}
        initialName={userName}
        initialUserId={userId}
      />
    </div>
  )
}
