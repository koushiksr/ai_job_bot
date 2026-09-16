'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  Laptop,
  Monitor,
  Check,
  RotateCcw,
  Compass,
  ArrowRight
} from 'lucide-react'
import { subscribeDeviceToPush, getNotificationPermission, sendBrowserNotification } from '@/lib/notifications'
import { 
  getDeviceEnvironment, 
  checkIsPwaInstalled, 
  markPwaAsInstalled, 
  unmarkPwaAsInstalled, 
  markPwaAsDismissed,
  DeviceEnvironment 
} from '@/lib/pwaHelper'

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
  const [deviceEnv, setDeviceEnv] = useState<DeviceEnvironment>(() => getDeviceEnvironment())
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied' | 'loading'>('default')
  const [activeStep, setActiveStep] = useState<'prompt' | 'ios_instructions' | 'desktop_instructions'>('prompt')
  const [testAlertSent, setTestAlertSent] = useState(false)

  // Verify device environment and installation status
  const refreshInstallStatus = useCallback(async () => {
    if (typeof window === 'undefined') return
    const env = getDeviceEnvironment()
    setDeviceEnv(env)

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    setIsStandalone(standalone)

    const installed = await checkIsPwaInstalled()
    setIsInstalled(installed)

    // Check notification permission
    const perm = getNotificationPermission()
    if (perm === 'granted') {
      setPushStatus('granted')
    } else if (perm === 'denied') {
      setPushStatus('denied')
    } else {
      setPushStatus('default')
    }
  }, [])

  useEffect(() => {
    refreshInstallStatus()

    // 4. Capture native browser PWA install event (Chrome, Edge, Brave, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsInstalled(true)
      markPwaAsInstalled()
      // Automatically attempt to activate push notifications when user completes installation
      handleEnablePush()
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [refreshInstallStatus])

  // Refresh status whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      refreshInstallStatus()
      setActiveStep('prompt')
      setTestAlertSent(false)
    }
  }, [isOpen, refreshInstallStatus])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleDismiss()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleDismiss = () => {
    markPwaAsDismissed()
    onClose()
  }

  // Handle native install prompt or route to platform guide
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          markPwaAsInstalled()
          setDeferredPrompt(null)
          setIsInstalled(true)
          await handleEnablePush()
        }
      } catch (err) {
        console.warn('Deferred prompt error:', err)
        // If native prompt fails, show visual guide
        if (deviceEnv.isDesktop) {
          setActiveStep('desktop_instructions')
        } else if (deviceEnv.isIOS) {
          setActiveStep('ios_instructions')
        }
      }
    } else if (deviceEnv.isIOS) {
      setActiveStep('ios_instructions')
    } else if (deviceEnv.isDesktop) {
      setActiveStep('desktop_instructions')
    } else {
      // Android / mobile without prompt
      setActiveStep('desktop_instructions')
    }
  }

  // Handle manual "I've Installed It" confirmation
  const handleConfirmInstalled = async () => {
    markPwaAsInstalled()
    setIsInstalled(true)
    setActiveStep('prompt')
    if (pushStatus !== 'granted') {
      await handleEnablePush()
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
        sendBrowserNotification('⚡ JobFlux AI Notifications Active', {
          body: 'You will receive real-time recruiter alerts and daily morning dispatch updates.',
          icon: '/icon.svg'
        })
      } else {
        setPushStatus('denied')
      }
    } catch (e) {
      console.warn('Push activation error:', e)
      setPushStatus('denied')
    }
  }

  // Handle sending a quick test alert
  const handleSendTestAlert = () => {
    sendBrowserNotification('🚀 JobFlux AI Alert System', {
      body: 'Verified! Push alerts are functioning seamlessly on your device.',
      icon: '/icon.svg'
    })
    setTestAlertSent(true)
    setTimeout(() => setTestAlertSent(false), 4000)
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleDismiss()
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-[#0d1017] border border-zinc-800/90 shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-white p-6 sm:p-7 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle cyan ambient glow at top */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-56 h-28 bg-cyan-500/15 blur-3xl pointer-events-none rounded-full" />

        {/* Big, Clear Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDismiss()
          }}
          type="button"
          className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors border border-zinc-700/60 cursor-pointer shadow-sm"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header: App Emblem + Title + Platform Tag */}
        <div className="relative z-10">
          <div className="flex items-center gap-3.5 mb-5 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <img 
                src="/icon.svg" 
                alt="JobFlux" 
                className="w-7 h-7 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {isInstalled || isStandalone ? 'JobFlux AI App' : 'Install JobFlux AI'}
                </h3>
                <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                  {deviceEnv.isDesktop ? <Laptop className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                  {deviceEnv.osName}
                </span>
                {isInstalled && (
                  <span className="text-[10px] font-semibold font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> INSTALLED
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isInstalled 
                  ? 'Application is verified & installed on this device' 
                  : deviceEnv.isDesktop 
                    ? 'Install as a standalone desktop app on your laptop' 
                    : 'Install as a native home-screen app'}
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* VIEW 1: VERIFIED APP INSTALLED (Standalone or Persistent Verification) */}
          {/* ========================================================================= */}
          {isInstalled || isStandalone ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-emerald-300">Application Verified on this Device</h4>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-200">
                      {isStandalone ? 'Active Window' : 'Dock / App Library'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    JobFlux AI is installed. You can launch it directly from your {deviceEnv.os === 'mac' ? 'Mac Dock, Spotlight, or Launchpad' : deviceEnv.os === 'windows' ? 'Windows Taskbar or Start Menu' : 'desktop or home screen'} without opening browser tabs.
                  </p>
                </div>
              </div>

              {/* Push Alerts & Notification Center Option */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    Real-Time Push Alerts & Recruiter Updates
                  </span>
                  {pushStatus === 'granted' ? (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Enabled
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEnablePush}
                      disabled={pushStatus === 'loading'}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {pushStatus === 'loading' ? 'Enabling...' : 'Enable Alerts'}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Receive instant desktop & lock-screen notifications when recruiters view your resume, shortlists occur, or the daily 6 AM & 8 AM IST dispatch runs complete.
                </p>

                {pushStatus === 'granted' && (
                  <div className="pt-1 flex items-center justify-between border-t border-zinc-800/80">
                    <span className="text-[11px] text-zinc-400">Verify push delivery:</span>
                    <button
                      type="button"
                      onClick={handleSendTestAlert}
                      disabled={testAlertSent}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer transition-colors"
                    >
                      {testAlertSent ? '✓ Sent to Desktop!' : 'Send Test Notification'}
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Buttons */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors cursor-pointer text-center shadow-md"
                >
                  Done
                </button>
              </div>

              {/* Reset/Troubleshoot link */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    unmarkPwaAsInstalled()
                    setIsInstalled(false)
                    setIsStandalone(false)
                    setActiveStep('prompt')
                  }}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Not installed or uninstalled? Reset install state
                </button>
              </div>
            </div>
          ) : activeStep === 'desktop_instructions' ? (
            /* ========================================================================= */
            /* VIEW 2: LAPTOP / DESKTOP STEP-BY-STEP INSTALLATION GUIDE                  */
            /* ========================================================================= */
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-200 flex items-center gap-2.5">
                <Laptop className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Installing on <strong>{deviceEnv.osName}</strong> via <strong>{deviceEnv.browserName}</strong>
                </span>
              </div>

              {deviceEnv.isMacSafari ? (
                /* macOS Safari "Add to Dock" instructions (macOS Sonoma 14+) */
                <div className="space-y-2.5 text-xs text-zinc-300">
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      In the top Mac menu bar, click <strong className="text-white">File</strong> (or click the <strong className="text-white">Share</strong> <Share2 className="w-3.5 h-3.5 inline text-cyan-400 mx-0.5" /> button in Safari).
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      Click <strong className="text-white">&quot;Add to Dock...&quot;</strong> from the dropdown menu.
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      Click <strong className="text-white">&quot;Add&quot;</strong> in the dialog. JobFlux AI will now launch directly from your Mac Dock as a standalone native app!
                    </div>
                  </div>
                </div>
              ) : (
                /* Chrome, Edge, Brave on Mac/Windows/Linux */
                <div className="space-y-2.5 text-xs text-zinc-300">
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      Look at the right side of your browser <strong>Address bar (URL bar)</strong>. Click the <strong className="text-white">Install JobFlux AI</strong> icon (<Download className="w-3 h-3 inline text-cyan-400 mx-0.5" /> computer/monitor with down arrow).
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <em>Alternatively:</em> Click the browser menu (<strong className="text-white">⋮</strong> or <strong className="text-white">⋯</strong> in top right) &rarr; select <strong className="text-white">&quot;Save and share&quot;</strong> or <strong className="text-white">&quot;Apps&quot;</strong> &rarr; <strong className="text-white">&quot;Install JobFlux AI...&quot;</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      Click <strong className="text-white">&quot;Install&quot;</strong> in the popup. JobFlux AI will open in its own clean window, free from browser tabs!
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep('prompt')}
                  className="w-1/3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer text-center"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmInstalled}
                  className="w-2/3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>I&apos;ve Installed It ✓</span>
                </button>
              </div>
            </div>
          ) : activeStep === 'ios_instructions' ? (
            /* ========================================================================= */
            /* VIEW 3: iOS SAFARI STEP-BY-STEP GUIDE                                     */
            /* ========================================================================= */
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
                  onClick={() => setActiveStep('prompt')}
                  className="w-1/3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer text-center"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmInstalled}
                  className="w-2/3 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors cursor-pointer text-center"
                >
                  I&apos;ve Installed It ✓
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* VIEW 4: DEFAULT BENEFIT OVERVIEW & INSTALL TRIGGER                        */
            /* ========================================================================= */
            <div className="space-y-4">
              <div className="space-y-2.5 py-1">
                <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Instant Recruiter Alerts:</strong> Real-time lock-screen & desktop push notifications for profile views.</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>{deviceEnv.isDesktop ? 'Standalone Desktop App:' : 'Home Screen App:'}</strong> Launch in 1 click from your {deviceEnv.os === 'mac' ? 'Mac Dock' : deviceEnv.os === 'windows' ? 'Windows Taskbar' : 'home screen'} with dedicated window.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Dual Morning Runs:</strong> Automated 6 AM & 8 AM IST application status updates.</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                {deviceEnv.isIOS ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep('ios_instructions')}
                    className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>How to Install on iPhone / iPad</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : deferredPrompt ? (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.01]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install JobFlux App Now</span>
                  </button>
                ) : deviceEnv.isDesktop ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setActiveStep('desktop_instructions')}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.01]"
                    >
                      <Laptop className="w-4 h-4" />
                      <span>How to Install on {deviceEnv.osName} ({deviceEnv.browserName})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmInstalled}
                      className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[11px] font-medium transition-colors cursor-pointer text-center flex items-center justify-center gap-1 border border-zinc-800/80"
                    >
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Already installed on this laptop? Click here</span>
                    </button>
                  </div>
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
                  onClick={handleDismiss}
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
