'use client'

import React, { useState, useEffect } from 'react'
import { 
  Download, 
  Bell, 
  BellRing, 
  CheckCircle2, 
  X, 
  Share2, 
  PlusSquare, 
  Smartphone, 
  Laptop, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import JobFluxLogo from './JobFluxLogo'
import { subscribeDeviceToPush, getNotificationPermission } from '@/lib/notifications'

interface PwaInstallPromptModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string
  userId?: string
}

export default function PwaInstallPromptModal({
  isOpen,
  onClose,
  userEmail,
  userId
}: PwaInstallPromptModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied' | 'loading'>('default')
  const [installSuccess, setInstallSuccess] = useState(false)
  const [pushSuccess, setPushSuccess] = useState(false)
  const [activeStep, setActiveStep] = useState<'install' | 'push' | 'instructions'>('install')

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Detect if already installed and running as standalone native app
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    setIsStandalone(checkStandalone)

    // 2. Detect iOS Safari
    const ua = window.navigator.userAgent
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
    setIsIOS(isIosDevice)

    // 3. Notification permission check
    const perm = getNotificationPermission()
    if (perm === 'granted') {
      setPushStatus('granted')
    } else if (perm === 'denied') {
      setPushStatus('denied')
    } else {
      setPushStatus('default')
    }

    // 4. Capture native browser PWA install event (Chrome, Edge, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const handleAppInstalled = () => {
      setInstallSuccess(true)
      setDeferredPrompt(null)
      setIsStandalone(true)
      setActiveStep('push')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Handle genuine native browser installation
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setInstallSuccess(true)
        setDeferredPrompt(null)
        setActiveStep('push')
        // Automatically ask for push notifications right after install
        handleEnablePush()
      }
    } else if (isIOS) {
      setActiveStep('instructions')
    }
  }

  // Handle 1-click Push Notification activation
  const handleEnablePush = async () => {
    setPushStatus('loading')
    try {
      const email = userEmail || localStorage.getItem('user_email') || 'candidate@jobflux.ai'
      const uid = userId || localStorage.getItem('user_id') || undefined
      const result = await subscribeDeviceToPush(email, uid)
      if (result.success) {
        setPushStatus('granted')
        setPushSuccess(true)
      } else {
        setPushStatus('denied')
      }
    } catch (e) {
      console.warn('Push activation error:', e)
      setPushStatus('denied')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-gradient-to-b from-[#131722] via-[#0d1017] to-[#08090d] border border-cyan-500/30 shadow-[0_20px_70px_rgba(6,182,212,0.25)] text-white"
        role="dialog"
        aria-modal="true"
      >
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-28 bg-gradient-to-b from-cyan-500/20 to-transparent blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-zinc-700/50 cursor-pointer"
          aria-label="Close install modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 relative z-10">
          {/* Header Icon + App Badge */}
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-400/40 p-2.5 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <JobFluxLogo size="lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">JobFlux AI App</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  OFFICIAL APP
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Install as a real native app for instant lock-screen job alerts
              </p>
            </div>
          </div>

          {/* If already running in standalone mode */}
          {isStandalone ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">JobFlux AI is Installed as Native App</h4>
                  <p className="text-xs text-zinc-300 mt-1">
                    You are already running the full standalone application on this device.
                  </p>
                </div>
              </div>

              {/* Push notification toggle */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-semibold text-zinc-200">Push Job Notifications</span>
                  </div>
                  {pushStatus === 'granted' ? (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Active & Enabled
                    </span>
                  ) : (
                    <button
                      onClick={handleEnablePush}
                      disabled={pushStatus === 'loading'}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all cursor-pointer shadow-md"
                    >
                      {pushStatus === 'loading' ? 'Activating...' : 'Enable Alerts'}
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  Receive live recruiter notifications, screening test alerts, and dual-run application reports even when the app is closed.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-sm transition-colors cursor-pointer text-center"
                >
                  Close
                </button>
              </div>
            </div>
          ) : isIOS && activeStep === 'instructions' ? (
            /* iOS Safari Step-by-Step Instructions */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200">
                Apple iOS installs native Web Apps directly through Safari in 3 easy taps:
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm shrink-0">
                    1
                  </div>
                  <div className="text-xs text-zinc-300">
                    Tap the <strong className="text-white">Share</strong> button <Share2 className="w-3.5 h-3.5 inline mx-1 text-cyan-400" /> at the bottom of your Safari screen.
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm shrink-0">
                    2
                  </div>
                  <div className="text-xs text-zinc-300">
                    Scroll down and tap <strong className="text-white">&quot;Add to Home Screen&quot;</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-cyan-400" />.
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm shrink-0">
                    3
                  </div>
                  <div className="text-xs text-zinc-300">
                    Tap <strong className="text-white">&quot;Add&quot;</strong> in the top right corner. The app will install with its native icon on your home screen!
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  Once added to your home screen, opening the app automatically activates native lock-screen push notifications on iOS 16.4+!
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep('install')}
                  className="w-1/3 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition-colors cursor-pointer text-center"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-2/3 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors cursor-pointer text-center"
                >
                  Got It, Thanks!
                </button>
              </div>
            </div>
          ) : (
            /* Standard Install Prompt (Chromium, Edge, Android, Desktop) */
            <div className="space-y-4">
              {/* Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800/70 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                    <BellRing className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Instant Lock-Screen Push</h5>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Alerts when recruiters view or interview you</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800/70 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Real Standalone App</h5>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Not a bookmark — runs full-screen with zero lag</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800/70 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Morning Sweep Reports</h5>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Daily 6 AM & 8 AM IST application status</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800/70 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">One-Click Setup</h5>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Fast 2-second install with auto-updates</p>
                  </div>
                </div>
              </div>

              {/* Install and Push Notification CTA */}
              <div className="pt-2 space-y-2.5">
                {isIOS ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep('instructions')}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-extrabold text-sm shadow-[0_8px_25px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>How to Install on iPhone / iPad</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-extrabold text-sm shadow-[0_8px_25px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install JobFlux AI App</span>
                  </button>
                )}

                {/* Direct Push Notification Enable Option */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs text-zinc-300">Also enable lock-screen job push alerts</span>
                  </div>
                  {pushStatus === 'granted' ? (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Enabled
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEnablePush}
                      disabled={pushStatus === 'loading'}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                    >
                      {pushStatus === 'loading' ? 'Enabling...' : 'Enable Now'}
                    </button>
                  )}
                </div>

                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors cursor-pointer py-1"
                  >
                    Remind me later
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
