'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Sparkles, X, CheckCircle2, ShieldCheck, Zap } from 'lucide-react'
import { subscribeDeviceToPush, sendBrowserNotification } from '@/lib/notifications'

export default function NotificationPermissionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [subscribedSuccess, setSubscribedSuccess] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Check browser feature support
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
    if (!isSupported) return

    // 2. If already granted, ensure background subscription is kept fresh
    if (Notification.permission === 'granted') {
      const storedEmail = localStorage.getItem('user_email') || null
      const storedUid = localStorage.getItem('user_id') || null
      const storedVid = localStorage.getItem('jobflux_visitor_id') || null
      subscribeDeviceToPush(storedEmail, storedUid, storedVid).catch(() => {})
      return
    }

    // 3. If blocked / denied, do not spam user
    if (Notification.permission === 'denied') return

    // 4. Check if prompt was dismissed recently (cooldown: 12 hours)
    try {
      const dismissedUntil = localStorage.getItem('jf_notif_prompt_dismissed_until')
      if (dismissedUntil && parseInt(dismissedUntil, 10) > Date.now()) {
        return
      }
    } catch {}

    // 5. Reveal prompt after 1.2s delay for seamless UX
    const timer = setTimeout(() => {
      setShowPrompt(true)
    }, 1200)

    return () => clearTimeout(timer)
  }, [])

  const handleEnableAlerts = async () => {
    setSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        const storedEmail = localStorage.getItem('user_email') || null
        const storedUid = localStorage.getItem('user_id') || null
        const storedVid = localStorage.getItem('jobflux_visitor_id') || null

        await subscribeDeviceToPush(storedEmail, storedUid, storedVid)

        // Native welcome notification
        sendBrowserNotification('JobFlux AI Alerts Activated! 🚀', {
          body: 'You are all set! You will receive real-time job application reports and exclusive offers even when tab is closed.',
          icon: '/images/icon.png'
        })

        setSubscribedSuccess(true)
        setTimeout(() => {
          setShowPrompt(false)
        }, 2200)
      } else {
        // User denied or dismissed native prompt
        handleDismiss(24) // 24 hours cooldown
      }
    } catch (err) {
      console.warn('Notification activation error:', err)
      setShowPrompt(false)
    } finally {
      setSubscribing(false)
    }
  }

  const handleDismiss = (hours = 12) => {
    setShowPrompt(false)
    try {
      const cooldownExpiry = Date.now() + hours * 60 * 60 * 1000
      localStorage.setItem('jf_notif_prompt_dismissed_until', cooldownExpiry.toString())
    } catch {}
  }

  if (!showPrompt) return null

  return (
    <div
      role="dialog"
      aria-label="Enable job alerts"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-sm w-[calc(100vw-32px)] rounded-2xl bg-[#09090b]/95 light:bg-white/95 border border-zinc-700/80 light:border-zinc-300 shadow-2xl backdrop-blur-xl p-4 sm:p-5 text-white light:text-zinc-900 animate-in fade-in slide-in-from-bottom-5 duration-300 font-sans"
    >
      {/* Top Bar with Icon & Dismiss */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 relative">
            <Bell className="w-4 h-4 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1 right-1" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold tracking-tight text-white light:text-zinc-900 flex items-center gap-1.5">
              <span>Enable Job &amp; Offer Alerts</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 light:text-emerald-700 font-bold">
                NEW
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400 light:text-zinc-600 mt-0.5">
              Stay in touch with verified job matches &amp; exclusive offers
            </p>
          </div>
        </div>

        <button
          onClick={() => handleDismiss(12)}
          className="text-zinc-500 hover:text-white light:hover:text-zinc-900 p-1 rounded-md transition-colors cursor-pointer"
          title="Dismiss for now"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Body Perks */}
      {!subscribedSuccess ? (
        <div className="mt-3 space-y-2.5">
          <p className="text-[11px] text-zinc-300 light:text-zinc-700 leading-relaxed">
            Get instant alerts when 55+ daily jobs match your criteria and claim ₹150 referral cash rewards — even after you close this browser.
          </p>

          <div className="space-y-1 text-[10px] text-zinc-400 light:text-zinc-600 font-medium">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Real-time recruiter match alerts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>₹150 referral cash bonuses &amp; candidate passes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>Zero spam · Works in background · 1-click turn off</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleEnableAlerts}
              disabled={subscribing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{subscribing ? 'Enabling...' : 'Allow Alerts'}</span>
            </button>
            <button
              onClick={() => handleDismiss(12)}
              className="py-2 px-3 rounded-xl bg-zinc-800/80 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-400 light:text-zinc-700 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 light:text-emerald-700 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Alerts active! You will receive real-time updates even when offline.</span>
        </div>
      )}
    </div>
  )
}
