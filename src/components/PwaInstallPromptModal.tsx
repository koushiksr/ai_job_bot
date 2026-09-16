'use client'

import React, { useState, useEffect } from 'react'
import { 
  Download, 
  Bell, 
  CheckCircle2, 
  X, 
  Share2, 
  PlusSquare, 
  Smartphone, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight,
  Zap
} from 'lucide-react'
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
  const [activeStep, setActiveStep] = useState<'install' | 'instructions'>('install')

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Standalone detection
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    setIsStandalone(checkStandalone)

    // 2. iOS Safari detection
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

    // 4. Capture native browser PWA install event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsStandalone(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Handle native install prompt
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setIsStandalone(true)
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-md rounded-3xl bg-[#0d1017] border border-zinc-800/90 shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-white p-6 sm:p-7 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle cyan ambient glow at top */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-cyan-500/15 blur-3xl pointer-events-none rounded-full" />

        {/* Big, Clear Close Button (Always clickable, high z-index) */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          type="button"
          className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors border border-zinc-700/60 cursor-pointer shadow-sm"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="relative z-10">
          {/* App Icon + Title */}
          <div className="flex items-center gap-3.5 mb-5 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              {/* Clean app icon emblem without overflowing text */}
              <img 
                src="/icon.svg" 
                alt="JobFlux" 
                className="w-7 h-7 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Install JobFlux AI</h3>
                <span className="text-[10px] font-semibold font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  APP
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Install as standalone app for instant alerts
              </p>
            </div>
          </div>

          {/* Standalone Installed View */}
          {isStandalone ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-300">App Already Installed</h4>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    You are running JobFlux AI in standalone app mode.
                  </p>
                </div>
              </div>

              {/* Push Alerts Option */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-cyan-400" />
                    Lock-Screen Push Notifications
                  </span>
                  {pushStatus === 'granted' ? (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Enabled
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEnablePush}
                      disabled={pushStatus === 'loading'}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-colors cursor-pointer"
                    >
                      {pushStatus === 'loading' ? 'Enabling...' : 'Enable'}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Receive instant alerts when recruiters view your profile or interview requests arrive.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                Close
              </button>
            </div>
          ) : isIOS && activeStep === 'instructions' ? (
            /* iOS Safari Step-by-Step Walkthrough */
            <div className="space-y-4">
              <div className="space-y-2.5 text-xs text-zinc-300">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    Tap <strong className="text-white">Share</strong> <Share2 className="w-3 h-3 inline text-cyan-400 mx-0.5" /> at the bottom of Safari
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    Select <strong className="text-white">&quot;Add to Home Screen&quot;</strong> <PlusSquare className="w-3 h-3 inline text-cyan-400 mx-0.5" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    Tap <strong className="text-white">&quot;Add&quot;</strong> in the top right to install
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveStep('install')}
                  className="w-1/3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer text-center"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-2/3 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors cursor-pointer text-center"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Clean, Simple 3-Point Benefits & Single CTA */
            <div className="space-y-4">
              <div className="space-y-2.5 py-1">
                <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Instant Recruiter Alerts:</strong> Real-time lock-screen notifications for applications & views.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Standalone App Experience:</strong> Fast 1-click launch from desktop or mobile home screen.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Dual Morning Runs:</strong> Automated 6 AM & 8 AM IST application status updates.</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                {isIOS ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep('instructions')}
                    className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>How to Install on iPhone / iPad</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.01]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install JobFlux App</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer text-center"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
