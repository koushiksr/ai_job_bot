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
  Briefcase,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import JobFluxLogo from '@/components/JobFluxLogo'
import CandidateProfileEditor from '@/components/CandidateProfileEditor'
import NeuralAtsDiagnosticCard from '@/components/NeuralAtsDiagnosticCard'
import ProfessionalUpgradeModal from '@/components/ProfessionalUpgradeModal'
import JobFluxHelpModal from '@/components/JobFluxHelpModal'
import AiLoadingScreen from '@/components/AiLoadingScreen'

export default function CandidateProfilePage() {
  const [userId, setUserId] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [userPicture, setUserPicture] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('user')
  const [userPlan, setUserPlan] = useState<string>('free')
  const [isVip, setIsVip] = useState<boolean>(false)
  const [pageLoading, setPageLoading] = useState<boolean>(true)

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

    setUserId(storedUid)
    setUserEmail(storedEmail || '')
    setUserRole(storedRole || 'user')
    setUserPlan(storedPlan || 'free')
    setIsVip(storedVip)
    if (storedPicture) setUserPicture(storedPicture)

    // Load candidate info & picture
    Promise.allSettled([
      fetch(`/api/stats?user_id=${encodeURIComponent(storedUid)}`).then(res => res.json()),
      fetch(`/api/profile?user_id=${encodeURIComponent(storedUid)}`).then(res => res.json())
    ])
      .then(([statsRes, profileRes]) => {
        if (statsRes.status === 'fulfilled' && statsRes.value.candidate_name) {
          setUserName(statsRes.value.candidate_name)
        }
        if (profileRes.status === 'fulfilled' && profileRes.value) {
          if (profileRes.value.name) setUserName(profileRes.value.name)
          if (profileRes.value.picture) {
            setUserPicture(profileRes.value.picture)
            localStorage.setItem('user_picture', profileRes.value.picture)
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        setTimeout(() => setPageLoading(false), 400)
      })
  }, [])

  const handleLogout = () => {
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
    <div className="min-h-screen bg-[#000000] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white relative">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-zinc-900 px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Back to Dashboard & Candidate Identity with Photo */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
              title="Return to applications dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <div className="h-4 w-px bg-zinc-800" />

            {/* Candidate Identity with Photo & Status */}
            <div className="flex items-center gap-2.5 text-xs">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-white text-[11px] shrink-0 relative overflow-hidden">
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
                <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 border border-black animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-white truncate max-w-[120px] sm:max-w-[160px]">
                    {userName || 'Candidate'}
                  </span>
                  {isVip ? (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 border border-amber-400/80 text-amber-300 font-bold">
                      VIP
                    </span>
                  ) : isProfessional ? (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 border border-amber-400/80 text-amber-300 font-bold">
                      PRO
                    </span>
                  ) : null}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono">● Profile Setup</div>
              </div>
            </div>
          </div>

          {/* Right: Brand Logo & Sign Out */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/dashboard" className="flex items-center hover:opacity-90 transition-opacity">
              <JobFluxLogo size="sm" showText={true} />
            </Link>

            <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Sign out of JobFlux"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Link href="/dashboard" className="hover:text-zinc-200 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-zinc-200 font-semibold">Candidate Profile & Settings</span>
        </div>

        {/* Page Hero Header */}
        <div className="p-6 sm:p-7 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-4 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Candidate Profile & Naukri Credentials
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 font-semibold">
                  ONE-TIME SETUP
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                  Bot Synchronized
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed pt-1">
                Configure your Naukri login credentials, upload your resume PDF, set your single current employer, and target roles. The autonomous worker uses these exact parameters during daily morning application sweeps.
              </p>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                <span>View Dispatched Jobs</span>
              </Link>
            </div>
          </div>

          {/* Quick Context Chips */}
          <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-black/60 border border-zinc-800/60 flex items-center justify-between">
              <span className="text-zinc-500 font-mono">Account ID:</span>
              <span className="font-mono text-white font-medium truncate max-w-[150px]">{userId}</span>
            </div>
            <div className="p-3 rounded-lg bg-black/60 border border-zinc-800/60 flex items-center justify-between">
              <span className="text-zinc-500 font-mono">Primary Email:</span>
              <span className="font-mono text-white font-medium truncate max-w-[150px]">{userEmail}</span>
            </div>
            <div className="p-3 rounded-lg bg-black/60 border border-zinc-800/60 flex items-center justify-between">
              <span className="text-zinc-500 font-mono">Schedule:</span>
              <span className="font-mono text-emerald-400 font-medium">06:00 AM IST Sweeps</span>
            </div>
          </div>
        </div>

        {/* Save Confirmation Banner */}
        {showSaveBanner && (
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-3 font-medium animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Candidate profile and Naukri credentials successfully synchronized with the autonomous bot!</span>
            </div>
            <Link
              href="/dashboard"
              className="px-3 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors shrink-0"
            >
              Go to Dashboard →
            </Link>
          </div>
        )}

        {/* Neural ATS Recruiter Readiness Diagnostic Widget */}
        <NeuralAtsDiagnosticCard
          isProfessional={isProfessional}
          skillsCount={8}
          resumeUploaded={true}
          onUnlockClick={(feat) => {
            setProModalFeature(feat || 'Professional Suite')
            setShowProModal(true)
          }}
        />

        {/* Full Visual Candidate Profile & Credentials Builder */}
        <CandidateProfileEditor
          userId={userId}
          isAdmin={false}
          onSaveSuccess={() => {
            setShowSaveBanner(true)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />

        {/* Bottom Navigation Helper */}
        <div className="p-4 rounded-xl bg-[#09090b] border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-zinc-400">
            Finished calibrating your profile? All changes take effect on the next scheduled application run.
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors shrink-0"
          >
            Back to Application Cockpit
          </Link>
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
        showFloatingTrigger={true}
        initialEmail={userEmail}
        initialName={userName}
        initialUserId={userId}
      />
    </div>
  )
}
