'use client'

import React, { useEffect, useState } from 'react'
import Script from 'next/script'
import {
  Briefcase,
  Clock,
  Calendar,
  TrendingUp,
  RefreshCw,
  Search,
  ExternalLink,
  Shield,
  CheckCircle2,
  LogOut,
  User,
  Sparkles,
  Building2,
  ArrowRight,
  Zap,
  Cpu,
  Target,
  FileCheck,
  FileText,
  Mail,
  MessageSquare,
  X,
  Lock,
  Crown,
  ChevronDown,
  Download,
  Bell,
  BellOff,
  BellRing,
  Settings,
  AlertTriangle,
  Check,
  Copy,
  Star,
  Terminal,
  Radio
} from 'lucide-react'
import Link from 'next/link'
import CandidateProfileEditor from '@/components/CandidateProfileEditor'
import JobFluxLogo from '@/components/JobFluxLogo'
import JobFluxHelpModal from '@/components/JobFluxHelpModal'
import { ThemeToggle } from '@/components/ThemeProvider'
import ProfessionalUpgradeModal from '@/components/ProfessionalUpgradeModal'
import CandidateReviewModal from '@/components/CandidateReviewModal'
import NeuralAtsDiagnosticCard from '@/components/NeuralAtsDiagnosticCard'
import AiResumeBuilder from '@/components/AiResumeBuilder'
import AiLoadingScreen from '@/components/AiLoadingScreen'
import BeginnerOnboardingGuide, { ProfileCompleteness } from '@/components/BeginnerOnboardingGuide'
import CandidateOfferModal from '@/components/CandidateOfferModal'
import PwaInstallPromptModal from '@/components/PwaInstallPromptModal'
import { sendBrowserNotification, subscribeDeviceToPush, registerServiceWorker } from '@/lib/notifications'
import { fetchCandidateOffers, markNotificationAsRead } from '@/lib/candidateOffers'
import { checkIsPwaInstalled, shouldShowPwaAutoPrompt, markPwaAsDismissed } from '@/lib/pwaHelper'
import { trackSignUp } from '@/lib/tracker'

export default function UserDashboard() {
  const [userId, setUserId] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [userPicture, setUserPicture] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('user')
  const [userPlan, setUserPlan] = useState<string>('trial')
  const [userPlanName, setUserPlanName] = useState<string>('JobFlux 3-Day Free Access')
  const [isPlanActive, setIsPlanActive] = useState<boolean>(true)
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null)
  const [isVip, setIsVip] = useState<boolean>(false)

  // Enterprise Org Membership & Invites State
  const [enterpriseOrgId, setEnterpriseOrgId] = useState<string | null>(null)
  const [enterpriseRole, setEnterpriseRole] = useState<string | null>(null)
  const [pendingEnterpriseInvites, setPendingEnterpriseInvites] = useState<any[]>([])
  const [isRespondingToInvite, setIsRespondingToInvite] = useState<boolean>(false)

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'history' | 'profile' | 'queries' | 'resume_builder'>('history')

  // Candidate Queries & Support Inquiries State
  const [userTickets, setUserTickets] = useState<any[]>([])
  const [loadingUserTickets, setLoadingUserTickets] = useState<boolean>(false)

  // Help Modal State
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false)

  // Initial Load & On-Demand Telemetry Refresh States
  const [pageLoading, setPageLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // Metrics State
  const [metrics, setMetrics] = useState({
    today: 0,
    this_week: 0,
    this_month: 0,
    total_applied: 0
  })

  // History State
  const [historyJobs, setHistoryJobs] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true)
  const [historySearch, setHistorySearch] = useState<string>('')
  const [historyFilter, setHistoryFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [historyPage, setHistoryPage] = useState<number>(1)
  const [historyTotalPages, setHistoryTotalPages] = useState<number>(1)
  const [historyTotalCount, setHistoryTotalCount] = useState<number>(0)

  // Automated Schedule Countdown
  const [countdownText, setCountdownText] = useState<string>('Calculating...')

  // On-Demand AI Scout State
  const [isTriggeringScout, setIsTriggeringScout] = useState<boolean>(false)
  const [activeTask, setActiveTask] = useState<any>(null)
  const [taskFeedback, setTaskFeedback] = useState<{ type: 'success' | 'info' | 'error', text: string } | null>(null)
  const [userAlerts, setUserAlerts] = useState<{ type: string; code: string; title: string; message: string; actionLabel?: string; actionHref?: string }[]>([])
  const [orgProLoading, setOrgProLoading] = useState<boolean>(false)
  const [orgProError, setOrgProError] = useState<string>('')
  const [weeklyQuota, setWeeklyQuota] = useState<{ limit: number, used: number, remaining: number, is_unlimited: boolean } | null>(null)
  const [queueStatus, setQueueStatus] = useState<{ queue_position: number, is_global_sweep_active: boolean, active_user_id: string | null } | null>(null)
  const [showLiveTerminal, setShowLiveTerminal] = useState<boolean>(true)

  // AI Application Audit Modal
  const [selectedJobAudit, setSelectedJobAudit] = useState<any | null>(null)
  const [copiedReport, setCopiedReport] = useState<boolean>(false)

  // Professional Tier Feature Gating & Perks Modal
  const [showProModal, setShowProModal] = useState<boolean>(false)
  const [proModalFeature, setProModalFeature] = useState<string>('On-Demand Application Sweeps (Up to 5x / week)')

  // Candidate account has Professional privileges if on an active Professional tier, Enterprise tier, OR VIP pass.
  const isEnterpriseMember = enterpriseRole === 'member' || userPlan === 'enterprise' || userPlan === 'org_pro'
  const isProfessional = (userPlan === 'elite' || userPlan === 'professional' || userPlan === 'enterprise' || userPlan === 'org_pro' || userPlan === 'vip' || isVip || isEnterpriseMember) && isPlanActive

  // Plan Expiry & Renewal Computations
  const planExpiryDate = planExpiresAt ? new Date(planExpiresAt) : null
  const hoursUntilPlanExpiry = planExpiryDate ? Math.round((planExpiryDate.getTime() - Date.now()) / (1000 * 60 * 60)) : null
  const isPlanExpiringSoon = !isVip && hoursUntilPlanExpiry !== null && hoursUntilPlanExpiry > 0 && hoursUntilPlanExpiry <= 48
  const isPlanExpired = !isVip && ((hoursUntilPlanExpiry !== null && hoursUntilPlanExpiry <= 0) || (!isPlanActive && userPlan !== 'none' && userPlan !== 'no_plan'))

  // Browser Push Notifications State & Assistants
  const [notificationPermission, setNotificationPermission] = useState<string>('default')
  const [showUnblockGuide, setShowUnblockGuide] = useState<boolean>(false)
  const [notificationBannerDismissed, setNotificationBannerDismissed] = useState<boolean>(false)
  const [testNotificationSent, setTestNotificationSent] = useState<boolean>(false)

  // Candidate Exclusive Assigned Offers & Real-Time Alert State
  const [assignedOffers, setAssignedOffers] = useState<any[]>([])
  const [activeOfferBanner, setActiveOfferBanner] = useState<any | null>(null)
  const [isOfferModalOpen, setIsOfferModalOpen] = useState<boolean>(false)
  const [isPwaModalOpen, setIsPwaModalOpen] = useState<boolean>(false)
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false)
  const [inAppToast, setInAppToast] = useState<{
    id?: string
    title: string
    message: string
    promo_code?: string
    claim_url?: string
  } | null>(null)

  // Candidate Profile Completeness & Beginner Onboarding State
  const [profileCompleteness, setProfileCompleteness] = useState<ProfileCompleteness>({
    hasResume: false,
    hasNaukriCredentials: false,
    hasTargetRoles: false,
    hasExperienceOrCtc: false,
    percent: 0,
    missingFields: [
      'Resume PDF (Upload to enable 1-Click AI auto-fill & applications)',
      'Naukri.com Login Credentials (Email & Password)',
      'Target Job Roles or Skills',
      'Total Experience or Expected CTC'
    ]
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      registerServiceWorker()
      if (!('Notification' in window)) {
        setNotificationPermission('unsupported')
      } else {
        setNotificationPermission(Notification.permission)
      }

      // Smart PWA verification: Only show popup if user has NOT installed the app
      let autoPromptTimer: NodeJS.Timeout | null = null
      checkIsPwaInstalled().then((installed) => {
        setIsAppInstalled(installed)
        if (!installed) {
          shouldShowPwaAutoPrompt().then((shouldShow) => {
            if (shouldShow) {
              autoPromptTimer = setTimeout(() => {
                setIsPwaModalOpen(true)
              }, 3500)
            }
          })
        }
      })

      const handleAppInstalled = () => {
        setIsAppInstalled(true)
        if (autoPromptTimer) clearTimeout(autoPromptTimer)
      }

      window.addEventListener('appinstalled', handleAppInstalled)

      return () => {
        if (autoPromptTimer) clearTimeout(autoPromptTimer)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }
  }, [])

  const loadUserOffers = async (email: string) => {
    if (!email) return
    try {
      const data = await fetchCandidateOffers(email)
      const offers = data.assigned_offers || []
      setAssignedOffers(offers)
      if (offers.length > 0) {
        const latest = offers[0]
        setActiveOfferBanner(latest)

        // Automatically show Offer Modal once per session
        if (typeof window !== 'undefined' && !sessionStorage.getItem('jobflux_offer_modal_shown')) {
          sessionStorage.setItem('jobflux_offer_modal_shown', 'true')
          setTimeout(() => {
            setIsOfferModalOpen(true)
          }, 1500)
        }

        // Dispatch native browser notification and in-app toast once per session per offer
        const alertKey = `jobflux_alerted_offer_${latest.id || latest.promo_code}`
        if (typeof window !== 'undefined' && !sessionStorage.getItem(alertKey)) {
          sessionStorage.setItem(alertKey, 'true')

          // 1. Browser Push Notification (only if user is not actively viewing this tab)
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
            sendBrowserNotification(`🎁 Special Offer Assigned: ${latest.discount_badge}!`, {
              body: `Exclusive deal: ${latest.offer_title} at ${latest.discounted_price}. 1-click claim locked to your account.`
            })
          }

          // 2. Real-time In-App Slide-over Toast
          setInAppToast({
            id: latest.id,
            title: `🎁 Exclusive Offer Assigned to You: ${latest.discount_badge}!`,
            message: `${latest.offer_title} (${latest.original_price} → ${latest.discounted_price}). Promo code: ${latest.promo_code}`,
            promo_code: latest.promo_code,
            claim_url: latest.claim_url || `/pricing?promo=${latest.promo_code}`
          })
        }
      } else {
        setActiveOfferBanner(null)
      }

      // 3. Process any real-time push notifications dispatched by administrator
      const notifs = data.notifications || []
      for (const notif of notifs) {
        const notifKey = `jobflux_seen_notif_${notif.id}`
        if (typeof window !== 'undefined' && !sessionStorage.getItem(notifKey)) {
          sessionStorage.setItem(notifKey, 'true')

          // Dispatch native OS browser push notification only if tab is hidden (avoid double alert with in-app toast)
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
            sendBrowserNotification(notif.title || '⚡ JobFlux AI Radar Alert', {
              body: notif.message
            })
          }

          // Dispatch floating slide-over in-app toast
          setInAppToast({
            id: notif.id,
            title: notif.title || '⚡ JobFlux Priority Alert',
            message: notif.message,
            promo_code: notif.promo_code,
            claim_url: notif.claim_url
          })
          break // Present one priority alert at a time
        }
      }
    } catch (e) {
      console.error('Failed to load candidate assigned offers:', e)
    }
  }

  const dismissToast = (notifId?: string) => {
    if (notifId) {
      markNotificationAsRead(notifId, userEmail)
    }
    setInAppToast(null)
  }

  const handleCloseOfferModal = () => {
    setIsOfferModalOpen(false)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('jobflux_offer_modal_shown', 'true')
    }
  }

  const handleClosePwaModal = () => {
    setIsPwaModalOpen(false)
    markPwaAsDismissed()
    checkIsPwaInstalled().then(setIsAppInstalled)
  }

  const handleRequestNotification = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Push notifications are not supported by your current browser.')
      return
    }

    if (Notification.permission === 'denied') {
      setShowUnblockGuide(true)
      return
    }

    try {
      const perm = await Notification.requestPermission()
      setNotificationPermission(perm)
      if (perm === 'granted') {
        if (userEmail) {
          subscribeDeviceToPush(userEmail, userId).catch(() => {})
        }
        sendBrowserNotification('⚡ JobFlux AI Notifications Active', {
          body: 'You will now receive background push notifications even when this tab is closed.'
        })
        setTestNotificationSent(true)
        setTimeout(() => setTestNotificationSent(false), 4000)
      } else if (perm === 'denied') {
        setShowUnblockGuide(true)
      }
    } catch (err) {
      console.error('Notification permission error:', err)
    }
  }

  const handleSendTestNotification = () => {
    sendBrowserNotification('⚡ JobFlux AI Radar Alert', {
      body: 'Push notifications are verified and active on your system!'
    })
    setTestNotificationSent(true)
    setTimeout(() => setTestNotificationSent(false), 3000)
  }

  const recheckNotificationPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = Notification.permission
      setNotificationPermission(perm)
      if (perm === 'granted') {
        setShowUnblockGuide(false)
        handleSendTestNotification()
      } else if (perm === 'default') {
        setShowUnblockGuide(false)
        handleRequestNotification()
      } else {
        alert('Notifications are still set to "Block" in your browser site settings. Click the tune/padlock icon next to the URL, change Notifications to "Allow", and retry.')
      }
    }
  }

  const loadUserAlerts = async (uid: string, email: string) => {
    if (!uid && !email) return
    try {
      const res = await fetch(`/api/user/alerts?user_id=${encodeURIComponent(uid)}&email=${encodeURIComponent(email)}`)
      if (res.ok) {
        const data = await res.json()
        setUserAlerts(data.alerts || [])
      }
    } catch {
      // silent
    }
  }

  const loadEnterpriseInvites = async (uid: string, email: string) => {
    if (!uid && !email) return
    try {
      const res = await fetch(`/api/user/invites?user_id=${encodeURIComponent(uid)}&email=${encodeURIComponent(email)}`)
      if (res.ok) {
        const data = await res.json()
        setPendingEnterpriseInvites(data.invites || [])
      }
    } catch {
      // silent
    }
  }

  const handleRespondToInvite = async (inviteId: string, action: 'accept' | 'decline') => {
    setIsRespondingToInvite(true)
    try {
      const res = await fetch('/api/user/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_id: inviteId,
          action,
          user_id: userId
        })
      })
      const data = await res.json()
      if (res.ok) {
        setPendingEnterpriseInvites(prev => prev.filter(inv => inv.invite_id !== inviteId))
        if (action === 'accept') {
          setTaskFeedback({
            type: 'success',
            text: `🎉 Welcome to ${data.org_name || 'Enterprise Workspace'}! Enterprise perks activated: 10 weekly on-demand sweeps and 55 daily job applications.`
          })
          refreshAllDashboardData(userId)
        }
      }
    } catch (e: any) {
      alert('Failed to respond to invite: ' + e.message)
    } finally {
      setIsRespondingToInvite(false)
    }
  }

  // Org Pro upgrade (members-only plan, ₹99/30 days, 15 on-demand/week)
  const handleOrgProUpgrade = async () => {
    setOrgProLoading(true)
    setOrgProError('')
    try {
      const orderRes = await fetch('/api/payment/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: 'org_pro', user_id: userId, email: userEmail })
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.detail || 'Failed to initiate payment')
      if (typeof window === 'undefined' || !(window as any).Razorpay) {
        throw new Error('Payment gateway is still loading. Please refresh and try again.')
      }
      const rzp = new (window as any).Razorpay({
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'JobFlux AI',
        description: 'Org Pro — Member Upgrade (30 Days)',
        image: '/images/icon.png',
        order_id: orderData.order_id,
        prefill: { email: userEmail },
        theme: { color: '#000000' },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_id: 'org_pro',
                user_id: userId,
                email: userEmail
              })
            })
            const verifyData = await verifyRes.json()
            if (verifyRes.ok && verifyData.verified) {
              localStorage.setItem('user_plan', 'org_pro')
              setUserPlan('org_pro')
              setTaskFeedback({ type: 'success', text: '🎉 Org Pro activated! 15 on-demand sweeps/week unlocked. Priority queue enabled.' })
              refreshAllDashboardData(userId)
            } else {
              throw new Error(verifyData.detail || 'Payment verification failed.')
            }
          } catch (vErr: any) {
            setOrgProError(vErr.message || 'Payment verification error')
          } finally {
            setOrgProLoading(false)
          }
        },
        modal: { ondismiss: () => setOrgProLoading(false) }
      })
      rzp.on('payment.failed', (response: any) => {
        setOrgProError(`Payment failed: ${response.error?.description || response.error?.reason || 'Unknown error'}`)
        setOrgProLoading(false)
      })
      rzp.open()
    } catch (e: any) {
      setOrgProError(e.message || 'Payment error')
      setOrgProLoading(false)
    }
  }

  // Compute Daily Sweep Status
  useEffect(() => {
    const computeCountdown = () => {
      const now = new Date()
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000
      const istTime = new Date(utcMs + 5.5 * 3600000)

      const targetMidnight = new Date(istTime)
      targetMidnight.setHours(24, 0, 0, 0)

      const diffSecs = Math.max(0, Math.floor((targetMidnight.getTime() - istTime.getTime()) / 1000))
      const hours = Math.floor(diffSecs / 3600)
      const minutes = Math.floor((diffSecs % 3600) / 60)
      const seconds = diffSecs % 60

      setCountdownText(`${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`)
    }

    computeCountdown()
    const timer = setInterval(computeCountdown, 1000)
    return () => clearInterval(timer)
  }, [])

  // Initial Load on Mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      if (p.get('auth') === 'google' && p.get('user_id')) {
        const gUid = p.get('user_id')!
        const gEmail = p.get('email') || ''
        const gRole = p.get('role') || 'user'
        const gPlan = p.get('plan') || 'trial'
        const gPicture = p.get('picture') || ''
        localStorage.setItem('user_id', gUid)
        localStorage.setItem('user_email', gEmail)
        localStorage.setItem('user_role', gRole)
        localStorage.setItem('user_plan', gPlan)
        if (gPicture) {
          localStorage.setItem('user_picture', gPicture)
          setUserPicture(gPicture)
        }
        trackSignUp('google_oauth_redirect', gPlan, { email: gEmail, user_id: gUid })
        window.history.replaceState({}, document.title, '/dashboard')
      }

      const directPic = p.get('picture')
      if (directPic) {
        localStorage.setItem('user_picture', directPic)
        setUserPicture(directPic)
      }

      const noticeParam = p.get('notice')
      if (noticeParam) {
        setTaskFeedback({
          type: 'error',
          text: decodeURIComponent(noticeParam)
        })
      }
    }

    const storedUid = localStorage.getItem('user_id')
    const storedEmail = localStorage.getItem('user_email')
    const storedRole = localStorage.getItem('user_role')
    const storedVip = localStorage.getItem('user_is_vip') === 'true'
    const storedPicture = localStorage.getItem('user_picture')
    const storedName = localStorage.getItem('user_name')

    if (!storedUid) {
      window.location.href = '/'
      return
    }

    // Enterprise Admins manage their org from the Enterprise Portal, not the candidate dashboard
    if (storedRole === 'enterprise_admin') {
      window.location.replace('/enterprise-admin')
      return
    }

    setUserId(storedUid)
    setUserEmail(storedEmail || '')
    setUserRole(storedRole || 'user')
    if (storedVip) setIsVip(true)
    if (storedPicture) setUserPicture(storedPicture)
    if (storedName) setUserName(storedName)

    if (storedEmail) {
      loadUserOffers(storedEmail)
      loadEnterpriseInvites(storedUid, storedEmail)
      loadUserAlerts(storedUid, storedEmail)
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        subscribeDeviceToPush(storedEmail, storedUid).catch(() => {})
      }
    }

    refreshAllDashboardData(storedUid, true)
  }, [])

  // Real-time polling for candidate-assigned promotional offers & push notifications
  useEffect(() => {
    const emailToPoll = userEmail || (typeof window !== 'undefined' ? localStorage.getItem('user_email') || '' : '')
    if (!emailToPoll) return
    const interval = setInterval(() => {
      loadUserOffers(emailToPoll)
    }, 30000)
    return () => clearInterval(interval)
  }, [userEmail])

  // If activeTab is set to 'profile', redirect to dedicated /profile route
  useEffect(() => {
    if ((activeTab as string) === 'profile') {
      window.location.href = '/profile'
    }
  }, [activeTab])

  // ESC key dismiss handler for user menu, mobile nav, audit dialog, and unblock guide
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isUserMenuOpen) setIsUserMenuOpen(false)
        if (isMobileNavOpen) setIsMobileNavOpen(false)
        if (selectedJobAudit) setSelectedJobAudit(null)
        if (showUnblockGuide) setShowUnblockGuide(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isUserMenuOpen, isMobileNavOpen, selectedJobAudit, showUnblockGuide])

  const refreshAllDashboardData = async (uid: string, isInitial = false) => {
    if (!uid) return
    if (isInitial) {
      setPageLoading(true)
    } else {
      setIsRefreshing(true)
    }
    const startTime = Date.now()

    try {
      const emailToQuery = userEmail || (typeof window !== 'undefined' ? localStorage.getItem('user_email') || '' : '')
      await Promise.allSettled([
        loadUserData(uid),
        loadUserHistory(uid, 1, historySearch, historyFilter),
        loadUserTickets(uid),
        checkActiveTask(uid),
        emailToQuery ? loadUserOffers(emailToQuery) : Promise.resolve(),
        emailToQuery ? loadEnterpriseInvites(uid, emailToQuery) : Promise.resolve(),
        emailToQuery ? loadUserAlerts(uid, emailToQuery) : Promise.resolve()
      ])
    } catch (e) {
      console.error('Error refreshing dashboard data:', e)
    } finally {
      const elapsed = Date.now() - startTime
      // Keep animation visible for at least 700ms for smooth cyber transition
      const remaining = Math.max(0, 700 - elapsed)
      setTimeout(() => {
        setPageLoading(false)
        setIsRefreshing(false)
      }, remaining)
    }
  }

  const checkActiveTask = async (uid: string) => {
    try {
      const res = await fetch(`/api/tasks?user_id=${uid}&t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        if (data.weekly_quota) {
          setWeeklyQuota(data.weekly_quota)
        }
        if (data.queue_status) {
          setQueueStatus(data.queue_status)
        }
        if (data.task && (data.task.status === 'pending' || data.task.status === 'running')) {
          setActiveTask(data.task)
          setIsTriggeringScout(true)
          if (data.task.status === 'running') {
            setTaskFeedback({
              type: 'info',
              text: 'Autonomous AI Scout is actively processing applications live...'
            })
          } else {
            setTaskFeedback({
              type: 'info',
              text: data.queue_status?.queue_position > 1
                ? `Queued at position #${data.queue_status.queue_position} in line (worker runs tasks sequentially).`
                : 'Enqueued in cloud task runner. Waiting for worker pickup...'
            })
          }
          pollTaskStatus(uid)
        }
      }
    } catch {
      // silent
    }
  }

  const handleTriggerOnDemandScout = async () => {
    if (!isProfessional) {
      setProModalFeature('On-Demand Application Sweeps (Up to 5x / week)')
      setShowProModal(true)
      return
    }

    if (weeklyQuota && !weeklyQuota.is_unlimited && weeklyQuota.remaining <= 0) {
      setTaskFeedback({
        type: 'error',
        text: 'Weekly on-demand sweep quota reached (5/5). Quota resets on a rolling 7-day basis. Daily automated sweeps continue running automatically.'
      })
      return
    }

    if (isTriggeringScout || (activeTask && (activeTask.status === 'pending' || activeTask.status === 'running'))) {
      return
    }

    setIsTriggeringScout(true)
    setTaskFeedback({
      type: 'info',
      text: 'Dispatching on-demand sweep to Cloud Queue Worker...'
    })

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          headless: true
        })
      })

      const data = await res.json()
      if (res.ok) {
        if (data.quota) setWeeklyQuota(data.quota)
        if (data.queue_position) {
          setQueueStatus(prev => ({
            queue_position: data.queue_position,
            is_global_sweep_active: prev?.is_global_sweep_active || false,
            active_user_id: prev?.active_user_id || null
          }))
        }
        setActiveTask(data.task || {
          task_id: data.task_id,
          status: data.status || 'pending',
          logs: [`[${new Date().toLocaleTimeString()}] 🚀 On-demand sweep enqueued.`]
        })
        setTaskFeedback({
          type: 'info',
          text: data.message || 'On-demand sweep enqueued successfully.'
        })
        pollTaskStatus(userId)
      } else {
        setIsTriggeringScout(false)
        if (data.code === 'UPGRADE_REQUIRED') {
          setProModalFeature('On-Demand Application Sweeps (Up to 5x / week)')
          setShowProModal(true)
        } else {
          setTaskFeedback({
            type: 'error',
            text: data.detail || 'Failed to dispatch on-demand task'
          })
        }
      }
    } catch (err: any) {
      setIsTriggeringScout(false)
      setTaskFeedback({
        type: 'error',
        text: err.message || 'Scout trigger failed'
      })
    }
  }

  const pollTaskStatus = (uid: string) => {
    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/api/tasks?user_id=${uid}&t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          if (data.weekly_quota) setWeeklyQuota(data.weekly_quota)
          if (data.queue_status) setQueueStatus(data.queue_status)
          if (data.task) {
            setActiveTask(data.task)
            if (data.task.status === 'completed') {
              clearInterval(interval)
              setIsTriggeringScout(false)
              setTaskFeedback({ type: 'success', text: data.task.summary || 'On-demand sweep completed! Results updated.' })
              sendBrowserNotification('🚀 JobFlux AI Sweep Completed!', {
                body: data.task.summary || 'Autonomous engine applied to matching jobs. Telemetry refreshed.'
              })
              loadUserData(uid)
              loadUserHistory(uid, 1, historySearch, historyFilter)
            } else if (data.task.status === 'failed') {
              clearInterval(interval)
              setIsTriggeringScout(false)
              setTaskFeedback({ type: 'error', text: data.task.summary || 'Task ended. Check logs for details.' })
              sendBrowserNotification('⚠️ JobFlux AI Sweep Notice', {
                body: data.task.summary || 'Task execution ended. Check application logs.'
              })
            } else if (data.task.status === 'pending') {
              if (data.queue_status?.queue_position > 1) {
                setTaskFeedback({
                  type: 'info',
                  text: `Queued at position #${data.queue_status.queue_position} in line (worker runs tasks one by one)`
                })
              }
            } else if (data.task.status === 'running') {
              setTaskFeedback({
                type: 'info',
                text: 'Autonomous AI Scout is actively processing applications live...'
              })
            }
          }
        }
      } catch {
        // ignore
      }

      if (attempts >= 60) {
        clearInterval(interval)
        setIsTriggeringScout(false)
        loadUserData(uid)
        loadUserHistory(uid, 1, historySearch, historyFilter)
      }
    }, 3000)
  }

  const loadUserData = async (uid: string) => {
    try {
      const pRes = await fetch(`/api/profile?user_id=${uid}&t=${Date.now()}`)
      if (pRes.ok) {
        const pData = await pRes.json()
        if (pData.name) {
          setUserName(pData.name)
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_name', pData.name)
          }
        }
        if (pData.picture) {
          setUserPicture(pData.picture)
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_picture', pData.picture)
          }
        }
        const verifiedPlan = (pData.plan || 'trial').toLowerCase()
        const active = pData.is_plan_active !== false
        const vip = Boolean(pData.is_vip || verifiedPlan === 'vip')
        setIsVip(vip)
        setUserPlan(verifiedPlan)
        setUserPlanName(pData.plan_name || (verifiedPlan === 'trial' ? 'JobFlux 3-Day Free Access' : `JobFlux ${verifiedPlan.toUpperCase()}`))
        setIsPlanActive(active)
        setPlanExpiresAt(pData.plan_expires_at || pData.trial_expires_at || null)

        // Sync verified plan and VIP status from server to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_plan', verifiedPlan)
          localStorage.setItem('user_is_vip', vip ? 'true' : 'false')
        }

        if (pData.enterprise_org_id) setEnterpriseOrgId(pData.enterprise_org_id)
        if (pData.enterprise_role) setEnterpriseRole(pData.enterprise_role)

        if (pData.email) {
          setUserEmail(pData.email)
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_email', pData.email)
          }
          loadUserOffers(pData.email)
        }

        // Calculate Profile Completeness for Beginner Onboarding & Automation Readiness
        const hasResume = Boolean(
          pData.has_resume ||
          pData.last_resume_updated_at ||
          (pData.resume_upload_count && pData.resume_upload_count > 0) ||
          (pData.resume_filename && !pData.resume_filename.includes('_Resume.pdf') && pData.resume_filename !== 'Candidate_Resume.pdf')
        )
        const hasNaukriCredentials = Boolean(pData.email && pData.password && pData.password.trim().length > 0)
        const hasTargetRoles = Boolean(
          (Array.isArray(pData.job_filters?.target_roles) && pData.job_filters.target_roles.length > 0) ||
          (Array.isArray(pData.skills) && pData.skills.length > 0)
        )
        const hasExperienceOrCtc = Boolean(
          (Number(pData.experience) > 0) || (Number(pData.expected_ctc) > 0)
        )

        const missing: string[] = []
        if (!hasResume) missing.push('Resume PDF (Upload to enable AI Auto-Fill & applications)')
        if (!hasNaukriCredentials) missing.push('Naukri.com Login Credentials (Email & Password)')
        if (!hasTargetRoles) missing.push('Target Job Roles or Skills')
        if (!hasExperienceOrCtc) missing.push('Total Experience or Expected CTC')

        let score = 0
        if (hasResume) score += 30
        if (hasNaukriCredentials) score += 30
        if (hasTargetRoles) score += 20
        if (hasExperienceOrCtc) score += 20

        setProfileCompleteness({
          hasResume,
          hasNaukriCredentials,
          hasTargetRoles,
          hasExperienceOrCtc,
          percent: score,
          missingFields: missing
        })
      }

      const sRes = await fetch(`/api/stats?user_id=${uid}`)
      if (sRes.ok) {
        const sData = await sRes.json()
        setMetrics({
          today: sData.today || 0,
          this_week: sData.this_week || 0,
          this_month: sData.this_month || 0,
          total_applied: sData.total_applied || 0
        })
      }
    } catch (e) {
      console.error('Failed to load user data:', e)
    }
  }

  const loadUserTickets = async (uid: string) => {
    if (!uid) return
    setLoadingUserTickets(true)
    try {
      const res = await fetch(`/api/support?user_id=${encodeURIComponent(uid)}&limit=50`)
      if (res.ok) {
        const data = await res.json()
        setUserTickets(data.tickets || [])
      }
    } catch (e) {
      console.error('Failed to load user queries:', e)
    } finally {
      setLoadingUserTickets(false)
    }
  }

  const loadUserHistory = async (uid: string, page = 1, search = '', date = 'all') => {
    setLoadingHistory(true)
    try {
      const q = new URLSearchParams({
        user_id: uid,
        page: page.toString(),
        limit: '20',
        search: search,
        date: date
      })
      const res = await fetch(`/api/history?${q.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setHistoryJobs(data.jobs || [])
        setHistoryPage(data.page || 1)
        setHistoryTotalPages(data.pages || 1)
        setHistoryTotalCount(data.total || 0)
      }
    } catch (e) {
      console.error('Failed to load history:', e)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleLogout = () => {
    try { navigator.sendBeacon('/api/auth/logout') } catch {}
    localStorage.clear()
    window.location.href = '/'
  }

  const formatJobDate = (job: any) => {
    const raw = job.raw_date || job.date
    if (!raw) return 'Recently'
    try {
      const hasTz = raw.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(raw)
      const dateToParse = hasTz ? raw : `${raw.replace(' ', 'T')}Z`
      const d = new Date(dateToParse)
      if (isNaN(d.getTime())) return job.date || raw
      const pad = (n: number) => n.toString().padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    } catch {
      return job.date || raw
    }
  }

  const formatTimestamp = (ts: any) => {
    if (!ts) return 'Never'
    try {
      const d = new Date(ts)
      if (isNaN(d.getTime())) return 'Never'
      return d.toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Never'
    }
  }

  const handleExportHistoryCsv = () => {
    if (!isProfessional) {
      setProModalFeature('Export Applications to CSV Spreadsheet')
      setShowProModal(true)
      return
    }

    if (!historyJobs || historyJobs.length === 0) {
      alert('No application records available to export.')
      return
    }

    const headers = ['Job Title', 'Company', 'Dispatched At', 'Location', 'Status', 'Portal URL']
    const rows = historyJobs.map(job => [
      `"${(job.title || '').replace(/"/g, '""')}"`,
      `"${(job.company || '').replace(/"/g, '""')}"`,
      `"${formatJobDate(job)}"`,
      `"${(job.location || 'India').replace(/"/g, '""')}"`,
      `"${(job.status || 'Dispatched').replace(/"/g, '""')}"`,
      `"${(job.url && job.url !== '__locked__' ? job.url : '').replace(/"/g, '""')}"`
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `JobFlux_Applications_${userId || 'Candidate'}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (pageLoading) {
    return (
      <AiLoadingScreen
        title="Synchronizing Autonomous Engine"
        subtitle="Retrieving verified applications, recruiter telemetry & queue status..."
        accountInfo={userEmail || userId}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#000000] light:bg-white text-zinc-100 light:text-zinc-900 flex flex-col font-sans selection:bg-zinc-800 selection:text-white relative">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      {/* On-Demand Telemetry Refresh Animation Overlay */}
      {isRefreshing && (
        <AiLoadingScreen
          title="Refreshing Live Telemetry"
          subtitle="Synchronizing application dispatch logs and verified recruiter feeds..."
          accountInfo={userEmail || userId}
          fullscreen={true}
        />
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-black/90 light:bg-white/90 backdrop-blur-xl border-b border-zinc-900 light:border-zinc-200 px-3.5 sm:px-6 py-2 sm:py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          
          {/* LEFT: Candidate Profile Section (Swapped to Left for Instant Trust & Easy Profile Access) */}
          <div className="relative flex items-center shrink-0">
            {/* Desktop Profile Trigger Button */}
            <div className="hidden md:block relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`group flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl border transition-all cursor-pointer text-left ${
                  isUserMenuOpen
                    ? 'bg-zinc-800 light:bg-zinc-200 border-zinc-700 light:border-zinc-300 text-white light:text-zinc-900 shadow-sm'
                    : 'bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-850 border-zinc-800 light:border-zinc-200 hover:border-zinc-700 light:hover:border-zinc-300 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900'
                }`}
                title="Candidate Profile & Settings - Click to update profile & credentials"
                aria-label="Candidate account menu"
              >
                {/* Profile Photo / Avatar */}
                <div className="relative shrink-0">
                  {userPicture ? (
                    <img
                      src={userPicture}
                      alt={userName || 'Candidate'}
                      className="w-8 h-8 rounded-lg object-cover border border-zinc-700 light:border-zinc-300 group-hover:border-zinc-600 transition-colors shadow-sm"
                      onError={() => setUserPicture('')}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 light:bg-zinc-200 border border-zinc-700 light:border-zinc-300 group-hover:border-zinc-600 flex items-center justify-center font-bold text-white light:text-zinc-900 text-xs shrink-0 transition-colors">
                      {userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AI'}
                    </div>
                  )}
                  <span className="w-2 h-2 rounded-full bg-zinc-400 absolute -bottom-0.5 -right-0.5 border border-black" />
                </div>

                {/* Candidate Name, Plan Badge, and 'Click to Edit Profile' Callout */}
                <div className="flex flex-col min-w-0 pr-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white light:text-zinc-900 truncate max-w-[130px] lg:max-w-[160px]">
                      {userName ? userName.split(' ')[0] : 'Candidate'}
                    </span>
                    {(isVip || userPlan === 'vip') ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 light:text-amber-700 font-semibold shrink-0">
                        VIP
                      </span>
                    ) : isEnterpriseMember ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/20 border border-cyan-500/40 light:border-cyan-300 text-cyan-300 light:text-cyan-700 font-semibold shrink-0">
                        ENTERPRISE
                      </span>
                    ) : isProfessional ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-800 light:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 font-semibold shrink-0">
                        PRO
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 shrink-0">
                        FREE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 light:text-zinc-600 group-hover:text-zinc-300 transition-colors">
                    <span className="text-zinc-400 light:text-zinc-600">● Active</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-400 light:text-zinc-600 group-hover:text-white transition-colors">
                      Edit Profile ↗
                    </span>
                  </div>
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 light:text-zinc-600 transition-transform duration-200 group-hover:text-white ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Luxury Left-Aligned Dropdown Menu */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-72 rounded-xl bg-[#0c0c0e] light:bg-white border border-zinc-800 light:border-zinc-200 shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                    {/* Header / Identity Info */}
                    <div className="px-3.5 py-2.5 border-b border-zinc-800/80 light:border-zinc-200 flex items-center gap-3">
                      {userPicture ? (
                        <img
                          src={userPicture}
                          alt={userName || 'Candidate'}
                          className="w-10 h-10 rounded-full object-cover border border-zinc-700 light:border-zinc-300 shrink-0 shadow-sm"
                          onError={() => setUserPicture('')}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-800 light:bg-zinc-200 border border-zinc-700 light:border-zinc-300 flex items-center justify-center font-bold text-white light:text-zinc-900 text-sm shrink-0">
                          {userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AI'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white light:text-zinc-900 truncate">{userName || 'Candidate'}</div>
                        <div className="text-[11px] text-zinc-400 light:text-zinc-600 font-mono truncate">{userEmail}</div>
                        <div className="pt-0.5 flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-zinc-500 light:text-zinc-600">Plan:</span>
                          <span className="text-[10px] font-mono text-zinc-300 light:text-zinc-700 font-semibold uppercase">
                            {isVip ? 'VIP Professional Pass' : userPlan || 'Standard'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Prominent Quick-Action Callout */}
                    <div className="p-2 border-b border-zinc-800/80 light:border-zinc-200">
                      <Link
                        href="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700/80 light:border-zinc-300 text-zinc-200 light:text-zinc-800 hover:text-white light:hover:text-zinc-900 font-medium transition-all text-xs"
                      >
                        <User className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" />
                        <span>Edit Profile, Photo & Credentials ↗</span>
                      </Link>
                    </div>

                    {/* Navigation Items */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900 light:hover:bg-zinc-100 transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">Naukri Login & Credentials</div>
                          <div className="text-[10px] text-zinc-500 light:text-zinc-600">Resume, password & targeting filters</div>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 light:bg-zinc-200 text-zinc-300 light:text-zinc-700 border border-zinc-700 light:border-zinc-300">1-Time</span>
                      </Link>

                      <Link
                        href="/resume-builder"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900 light:hover:bg-zinc-100 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">AI ATS Resume Studio</div>
                          <div className="text-[10px] text-zinc-500 light:text-zinc-600">FAANG Harvard ATS generator</div>
                        </div>
                        <span className="text-[9px] font-mono px-1 rounded bg-zinc-800 light:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 font-medium">PRO</span>
                      </Link>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          setIsPwaModalOpen(true)
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900 light:hover:bg-zinc-100 transition-colors text-left cursor-pointer"
                      >
                        {isAppInstalled ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600 shrink-0" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium ${isAppInstalled ? 'text-emerald-300 light:text-emerald-700' : 'text-cyan-300 light:text-cyan-700'}`}>
                            {isAppInstalled ? 'JobFlux App Installed' : 'Install JobFlux App'}
                          </div>
                          <div className="text-[10px] text-zinc-500 light:text-zinc-600">
                            {isAppInstalled ? 'Verified on device • Push alerts' : 'Standalone App & push alerts'}
                          </div>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          isAppInstalled 
                            ? 'bg-emerald-950 text-emerald-300 light:text-emerald-700 border border-emerald-800' 
                            : 'bg-cyan-950 text-cyan-300 light:text-cyan-700 border border-cyan-800'
                        }`}>
                          {isAppInstalled ? 'ACTIVE' : 'PWA'}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          setIsOfferModalOpen(true)
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900 light:hover:bg-zinc-100 transition-colors text-left cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 light:text-amber-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-amber-300 light:text-amber-700">Promotional Offers</div>
                          <div className="text-[10px] text-zinc-500 light:text-zinc-600">Exclusive discounts & coupon</div>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 light:text-amber-700 border border-amber-800">50% OFF</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          setIsHelpOpen(true)
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900 light:hover:bg-zinc-100 transition-colors text-left cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600 shrink-0" />
                        <span>Help & Support Center</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          setIsReviewModalOpen(true)
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900 light:hover:bg-zinc-100 transition-colors text-left cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-400 light:text-amber-600 shrink-0 fill-amber-400/30" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-amber-300 light:text-amber-700">Rate &amp; Review JobFlux</div>
                          <div className="text-[10px] text-zinc-500 light:text-zinc-600">Share your satisfaction score</div>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 light:text-amber-700 border border-amber-800">REVIEW</span>
                      </button>

                      {userRole === 'admin' && (userEmail === 'technohmsit@gmail.com' || userId === 'technohmsit') && (
                        <Link
                          href="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900 light:hover:bg-zinc-100 transition-colors"
                        >
                          <Shield className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600 shrink-0" />
                          <span>Admin Console</span>
                        </Link>
                      )}

                      {(userRole === 'enterprise_admin' || userEmail === 'koushiksrmedala@gmail.com' || userEmail === 'technohmsit@gmail.com' || userId === 'technohmsit') && (
                        <Link
                          href="/enterprise-admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-cyan-300 light:text-cyan-700 hover:text-white light:hover:text-zinc-900 hover:bg-cyan-950/40 transition-colors"
                        >
                          <Building2 className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600 shrink-0" />
                          <span>Enterprise Admin Portal</span>
                        </Link>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-zinc-800/80 light:border-zinc-200 my-1" />

                    {/* Sign Out */}
                    <div className="px-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 shrink-0" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Brand Logo (Anchored Cleanly on Left for Mobile) */}
            <Link href="/dashboard" className="flex md:hidden items-center hover:opacity-90 transition-opacity">
              <JobFluxLogo size="sm" showText={true} />
            </Link>
          </div>

          {/* RIGHT: Actions, Telemetry Refresh & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <ThemeToggle />
            {/* Install App / Installed Status Button (Desktop & Tablet) */}
            <button
              type="button"
              onClick={() => setIsPwaModalOpen(true)}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-sm ${
                isAppInstalled
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 light:text-emerald-700 border border-emerald-500/30'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 light:text-cyan-700 border border-cyan-500/30'
              }`}
              title={
                isAppInstalled
                  ? 'JobFlux AI is installed on this device • Click to view status or alerts'
                  : 'Install JobFlux as a native app and enable push alerts'
              }
            >
              {isAppInstalled ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" />
                  <span>App Installed</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
                  <span>Install App</span>
                </>
              )}
            </button>

            {/* Candidate Offer Button */}
            <button
              type="button"
              onClick={() => setIsOfferModalOpen(true)}
              className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 light:text-amber-700 border border-amber-400/40 transition-all shrink-0 cursor-pointer shadow-sm"
              title="View exclusive candidate offers and discounts"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 light:text-amber-600 animate-pulse shrink-0" />
              <span className="hidden sm:inline">{activeOfferBanner ? `Deal: ${activeOfferBanner.discount_badge}` : 'Special Offer'}</span>
              <span className="sm:hidden text-[11px] font-bold">Offer</span>
            </button>

            {/* Direct Admin Console Link strictly for technohmsit administrator */}
            {userRole === 'admin' && (userEmail === 'technohmsit@gmail.com' || userId === 'technohmsit') && (
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 light:text-cyan-700 border border-cyan-500/40 light:border-cyan-300 transition-all shrink-0 cursor-pointer shadow-sm"
                title="Open System Administrator Console"
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
                <span>Admin</span>
              </Link>
            )}

            {/* Telemetry Refresh (Desktop) */}
            <button
              onClick={() => refreshAllDashboardData(userId)}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 transition-colors cursor-pointer disabled:opacity-50 hidden md:inline-flex"
              title="Refresh live application telemetry"
              aria-label="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-white light:text-zinc-900' : ''}`} />
            </button>

            {/* Sales / Upgrade Action Button (Desktop & Tablet) */}
            <div className="hidden sm:flex items-center">
              {activeOfferBanner ? (
                <Link
                  href={activeOfferBanner.claim_url || `/pricing?promo=${encodeURIComponent(activeOfferBanner.promo_code)}`}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-black transition-colors shrink-0 shadow-sm"
                  title={`Claim offer: ${activeOfferBanner.offer_title}`}
                >
                  <Sparkles className="w-3.5 h-3.5 fill-black/20" />
                  <span>Claim Deal ({activeOfferBanner.discounted_price})</span>
                </Link>
              ) : (!isProfessional && (userPlan === 'none' || userPlan === 'no_plan' || userPlan === 'trial')) ? (
                <Link
                  href="/pricing"
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 transition-colors shrink-0 shadow-sm"
                  title="Upgrade to unlock automated applications"
                >
                  <Sparkles className="w-3.5 h-3.5 text-zinc-800" />
                  <span>Upgrade to Pro</span>
                </Link>
              ) : userPlan === 'pro' ? (
                <Link
                  href="/pricing?plan=elite"
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium bg-zinc-800 light:bg-zinc-200 hover:bg-zinc-750 border border-zinc-700 light:border-zinc-300 text-white light:text-zinc-900 transition-colors shrink-0"
                  title="Upgrade to Professional"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" />
                  <span>Upgrade to Professional (₹199)</span>
                </Link>
              ) : (
                <Link
                  href="/pricing"
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 transition-colors shrink-0"
                  title="View membership plans"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" />
                  <span>Plans & Upgrades</span>
                </Link>
              )}
            </div>

            {/* Desktop Brand Logo & Radar Status (Right on Desktop) */}
            <div className="hidden md:flex items-center gap-2.5 pl-2 border-l border-zinc-800 light:border-zinc-200 shrink-0">
              <Link href="/dashboard" className="flex items-center hover:opacity-90 transition-opacity">
                <JobFluxLogo size="sm" showText={true} />
              </Link>
              <div className="hidden lg:flex items-center gap-2 border-l border-zinc-800/80 light:border-zinc-200 pl-2.5">
                <span className="text-[11px] font-mono text-zinc-400 light:text-zinc-600">Autonomous Radar</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              </div>
            </div>

            {/* Mobile Profile Trigger Button (ALWAYS VISIBLE & UNCLIPPED ON MOBILE) */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="flex md:hidden items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-xl bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-850 border border-zinc-800 light:border-zinc-200 hover:border-zinc-700 light:hover:border-zinc-300 active:scale-95 transition-all text-white light:text-zinc-900 cursor-pointer shrink-0 shadow-sm"
              aria-label="Toggle profile menu"
              title="Candidate Profile & Settings"
            >
              <div className="w-7 h-7 rounded-lg bg-zinc-800 light:bg-zinc-200 border border-zinc-700/70 flex items-center justify-center font-bold text-[10px] text-white light:text-zinc-900 shrink-0 relative overflow-hidden">
                {userPicture ? (
                  <img src={userPicture} alt={userName || 'Candidate'} className="w-full h-full object-cover" onError={() => setUserPicture('')} />
                ) : (
                  userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AI'
                )}
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 border border-black" />
              </div>
              <span className="text-xs font-semibold text-zinc-200 light:text-zinc-800 max-w-[65px] truncate">
                {userName ? userName.split(' ')[0] : 'Profile'}
              </span>
              {(isVip || userPlan === 'vip') ? (
                <span className="inline-flex items-center text-[9px] font-mono font-bold text-amber-300 light:text-amber-700 bg-amber-500/10 border border-amber-500/30 px-1 py-0.2 rounded-md shrink-0">
                  VIP
                </span>
              ) : isEnterpriseMember ? (
                <span className="inline-flex items-center text-[9px] font-mono font-bold text-cyan-300 light:text-cyan-700 bg-cyan-500/20 border border-cyan-500/40 light:border-cyan-300 px-1 py-0.2 rounded-md shrink-0">
                  ENTERPRISE
                </span>
              ) : isPlanActive && userPlan !== 'none' && userPlan !== 'no_plan' ? (
                <span className="hidden min-[380px]:inline-flex items-center text-[9px] font-mono font-bold text-zinc-300 light:text-zinc-700 bg-zinc-800 light:bg-zinc-200 border border-zinc-700 light:border-zinc-300 px-1 py-0.2 rounded-md shrink-0">
                  {userPlan === 'elite' ? 'PRO' : userPlan === 'trial' ? 'TRIAL' : userPlan.toUpperCase()}
                </span>
              ) : null}
              <ChevronDown className={`w-3 h-3 text-zinc-400 light:text-zinc-600 transition-transform duration-200 ${isMobileNavOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

        </div>
      </header>

      {/* Floating Mobile Popover Sheet with Backdrop (Zero Header Layout Shifts) */}
      {isMobileNavOpen && (
        <div className="md:hidden">
          {/* Dark Translucent Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 light:bg-white/85 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-150"
            onClick={() => setIsMobileNavOpen(false)}
          />

          {/* Floating Action Sheet */}
          <div className="fixed top-14 right-3 left-3 max-w-sm ml-auto z-50 p-4 bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800/90 light:border-zinc-200 rounded-2xl shadow-2xl shadow-black/80 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
            {/* Candidate Identity Card (Clickable to open profile) */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800/80 light:border-zinc-200">
              <Link
                href="/profile"
                onClick={() => setIsMobileNavOpen(false)}
                className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity cursor-pointer"
                title="Click to manage Candidate Profile & Resume"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex items-center justify-center font-bold text-white light:text-zinc-900 text-xs shrink-0 relative overflow-hidden">
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
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 absolute -bottom-0.5 -right-0.5 border-2 border-black" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-white light:text-zinc-900 truncate max-w-[140px]">{userName || 'Candidate'}</span>

                    {/* VIP Badge in Standard Muted Amber */}
                    {(isVip || userPlan === 'vip') && (
                      <span
                        className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 light:text-amber-700 font-mono font-semibold uppercase tracking-wider shrink-0"
                        title="VIP Access Pass Active (90d)"
                      >
                        <Crown className="w-2.5 h-2.5 text-amber-400 light:text-amber-600 fill-amber-400/40 shrink-0" />
                        <span>VIP</span>
                      </span>
                    )}

                    {/* Subscription Badge */}
                    {userPlan !== 'vip' && (
                      <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-semibold shrink-0 transition-all ${
                        isPlanActive && (userPlan === 'starter' || userPlan === 'pro' || userPlan === 'elite' || userPlan === 'professional' || userPlan === 'enterprise' || userPlan === 'org_pro')
                          ? 'border border-amber-500/30 bg-amber-500/10 text-amber-300 light:text-amber-700 font-medium'
                          : userPlan === 'trial' && isPlanActive
                          ? 'border border-zinc-800 light:border-zinc-200 bg-zinc-900 light:bg-zinc-100 text-zinc-300 light:text-zinc-700 font-medium'
                          : userPlan === 'none' || userPlan === 'no_plan'
                          ? 'bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-500 light:text-zinc-600'
                          : !isPlanActive
                          ? 'bg-red-950/80 border-red-800 text-red-300 light:text-red-600'
                          : 'bg-zinc-900 light:bg-zinc-100 border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700'
                      }`}>
                        {isPlanActive && userPlan !== 'none' && userPlan !== 'no_plan' && (
                          <Sparkles className="w-2.5 h-2.5 text-amber-400 light:text-amber-600 shrink-0" />
                        )}
                        <span>
                          {userPlan === 'none' || userPlan === 'no_plan'
                            ? 'NO PLAN'
                            : !isPlanActive
                            ? 'EXPIRED'
                            : userPlan === 'trial'
                            ? 'Free Trial'
                            : userPlan === 'elite'
                            ? 'PROFESSIONAL'
                            : userPlan.toUpperCase()}
                        </span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 light:text-zinc-600 font-mono truncate mt-0.5">{userEmail}</p>
                </div>
              </Link>
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="w-7 h-7 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex items-center justify-center text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Direct Edit Profile Action Banner in Mobile */}
            <Link
              href="/profile"
              onClick={() => setIsMobileNavOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800 font-semibold transition-all text-xs"
            >
              <User className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" />
              <span>Edit Profile &amp; Credentials ↗</span>
            </Link>

            {/* Quick Actions List */}
            <div className="space-y-1 text-xs">
              <Link
                href="/profile"
                onClick={() => setIsMobileNavOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900 light:hover:bg-zinc-100 transition-colors"
              >
                <User className="w-4 h-4 text-zinc-400 light:text-zinc-600 shrink-0" />
                <span>Candidate Profile &amp; Credentials</span>
                <span className="text-[10px] text-zinc-400 light:text-zinc-600 font-mono ml-auto">1-Time</span>
              </Link>

              <button
                onClick={() => {
                  setIsMobileNavOpen(false)
                  refreshAllDashboardData(userId)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900 light:hover:bg-zinc-100 transition-colors cursor-pointer text-left"
              >
                <RefreshCw className="w-4 h-4 text-zinc-400 light:text-zinc-600 shrink-0" />
                <span>Refresh Live Telemetry</span>
              </button>

              <Link
                href="/resume-builder"
                onClick={() => setIsMobileNavOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900 light:hover:bg-zinc-100 transition-colors"
              >
                <FileText className="w-4 h-4 text-zinc-400 light:text-zinc-600 shrink-0" />
                <span>AI ATS Resume Studio</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 light:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 ml-auto font-semibold">
                  HARVARD
                </span>
              </Link>

              <button
                onClick={() => { setIsHelpOpen(true); setIsMobileNavOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900 light:hover:bg-zinc-100 transition-colors cursor-pointer text-left"
              >
                <Mail className="w-4 h-4 text-zinc-400 light:text-zinc-600 shrink-0" />
                <span>Help & Support Center</span>
              </button>

              <Link
                href="/pricing"
                onClick={() => setIsMobileNavOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900 light:hover:bg-zinc-100 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-zinc-400 light:text-zinc-600 shrink-0" />
                <span>Compare Pricing & Plans</span>
              </Link>

              <button
                onClick={() => { setIsMobileNavOpen(false); setIsPwaModalOpen(true) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer text-left ${
                  isAppInstalled
                    ? 'text-emerald-300 light:text-emerald-700 hover:text-white light:hover:text-zinc-900 hover:bg-emerald-950/30'
                    : 'text-cyan-300 light:text-cyan-700 hover:text-white light:hover:text-zinc-900 hover:bg-cyan-950/30'
                }`}
              >
                {isAppInstalled ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 light:text-emerald-600 shrink-0" />
                ) : (
                  <Download className="w-4 h-4 text-cyan-400 light:text-cyan-600 shrink-0" />
                )}
                <span>{isAppInstalled ? 'JobFlux App (Installed)' : 'Install JobFlux App (PWA)'}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ml-auto font-semibold ${
                  isAppInstalled
                    ? 'bg-emerald-950 text-emerald-300 light:text-emerald-700 border border-emerald-800'
                    : 'bg-cyan-950 text-cyan-300 light:text-cyan-700 border border-cyan-800'
                }`}>
                  {isAppInstalled ? 'INSTALLED' : 'APP'}
                </span>
              </button>

              <button
                onClick={() => { setIsMobileNavOpen(false); setIsOfferModalOpen(true) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-amber-300 light:text-amber-700 hover:text-white light:hover:text-zinc-900 hover:bg-amber-950/30 transition-colors cursor-pointer text-left"
              >
                <Sparkles className="w-4 h-4 text-amber-400 light:text-amber-600 shrink-0" />
                <span>Candidate Offers & Discounts</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 light:text-amber-700 border border-amber-800 ml-auto font-semibold">
                  OFFER
                </span>
              </button>

              <button
                onClick={() => { setIsMobileNavOpen(false); setIsReviewModalOpen(true) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-amber-300 light:text-amber-700 hover:text-white light:hover:text-zinc-900 hover:bg-amber-950/30 transition-colors cursor-pointer text-left"
              >
                <Star className="w-4 h-4 text-amber-400 light:text-amber-600 shrink-0 fill-amber-400/20" />
                <span>Rate &amp; Review JobFlux</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 light:text-amber-700 border border-amber-800 ml-auto font-semibold">
                  REVIEW
                </span>
              </button>

              {userRole === 'admin' && (userEmail === 'technohmsit@gmail.com' || userId === 'technohmsit') && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900 light:hover:bg-zinc-100 transition-colors"
                >
                  <Shield className="w-4 h-4 text-zinc-400 light:text-zinc-600 shrink-0" />
                  <span>Admin Control Center</span>
                </Link>
              )}

              {(userRole === 'enterprise_admin' || userEmail === 'koushiksrmedala@gmail.com' || userEmail === 'technohmsit@gmail.com' || userId === 'technohmsit') && (
                <Link
                  href="/enterprise-admin"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-cyan-300 light:text-cyan-700 hover:text-white light:hover:text-zinc-900 hover:bg-cyan-950/40 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-cyan-400 light:text-cyan-600 shrink-0" />
                  <span>Enterprise Admin Portal</span>
                </Link>
              )}

              <div className="pt-2 border-t border-zinc-800/80 light:border-zinc-200">
                <button
                  type="button"
                  onClick={() => { setIsMobileNavOpen(false); handleLogout() }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 light:text-red-600 hover:text-white light:hover:text-zinc-900 font-semibold text-xs transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>Sign Out of JobFlux</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
        
        {/* Candidate Action Alerts (credentials, quotas, plan) */}
        {userAlerts.map((a) => (
          <div
            key={a.code}
            className={`p-3.5 sm:p-4 rounded-2xl border flex items-start gap-3 text-xs sm:text-sm shadow-lg ${
              a.type === 'error'
                ? 'bg-red-950/40 light:bg-red-50 border-red-800/60 text-red-200'
                : a.type === 'warning'
                  ? 'bg-amber-950/40 border-amber-700/60 text-amber-200'
                  : 'bg-cyan-950/40 border-cyan-800/60 text-cyan-200'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${a.type === 'error' ? 'text-red-400' : a.type === 'warning' ? 'text-amber-400 light:text-amber-600' : 'text-cyan-400 light:text-cyan-600'}`} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white light:text-zinc-900 text-xs sm:text-sm">{a.title}</div>
              <p className="mt-0.5 leading-relaxed opacity-90">{a.message}</p>
            </div>
            {a.actionLabel && a.actionHref && (
              <Link
                href={a.actionHref}
                className="px-3 py-1.5 rounded-lg bg-white/10 light:bg-zinc-900/5 hover:bg-white/20 border border-white/20 light:border-zinc-300 text-white light:text-zinc-900 text-xs font-semibold shrink-0 transition-colors"
              >
                {a.actionLabel}
              </Link>
            )}
          </div>
        ))}

        {/* Enterprise Organization Invitation Banner */}
        {pendingEnterpriseInvites.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 light:bg-white border border-cyan-800/40 text-white light:text-zinc-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-cyan-950/60 pointer-events-none" />
            <div className="flex items-start sm:items-center gap-3.5 z-10">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 light:text-cyan-700 shrink-0">
                <Building2 className="w-5 h-5 text-cyan-400 light:text-cyan-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-900/80 text-cyan-300 light:text-cyan-700 border border-cyan-700">
                    ENTERPRISE INVITATION
                  </span>
                  <span className="text-xs font-bold text-white light:text-zinc-900">
                    {pendingEnterpriseInvites[0].org_name || 'Enterprise Workspace'}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 light:text-zinc-700 mt-1">
                  You have been invited by <strong className="text-white light:text-zinc-900">{pendingEnterpriseInvites[0].invited_by}</strong> to join as an Enterprise Member.
                  Enjoy <strong className="text-cyan-300 light:text-cyan-700">10 weekly on-demand sweeps</strong> and <strong className="text-cyan-300 light:text-cyan-700">55 daily job applications</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-end z-10">
              <button
                type="button"
                onClick={() => handleRespondToInvite(pendingEnterpriseInvites[0].invite_id, 'decline')}
                disabled={isRespondingToInvite}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 text-xs font-medium transition-colors cursor-pointer"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => handleRespondToInvite(pendingEnterpriseInvites[0].invite_id, 'accept')}
                disabled={isRespondingToInvite}
                className="px-4 py-2 rounded-xl bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300 light:text-emerald-700" />
                <span>{isRespondingToInvite ? 'Accepting...' : 'Accept Invitation'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Enterprise Member Workspace Active Callout */}
        {isEnterpriseMember && (
          <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-950/70 light:bg-white border border-zinc-800/80 light:border-zinc-200 text-cyan-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-900/50 border border-cyan-700/50 light:border-cyan-300 flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
              </div>
              <div>
                <span className="font-semibold text-white light:text-zinc-900">Enterprise Workspace Active</span>
                <span className="text-zinc-400 light:text-zinc-600 text-[11px] ml-2 font-mono">
                  • {userPlan === 'org_pro' ? '15' : '10'} Weekly On-Demand Sweeps • 55 Daily Application Limit • Priority Dispatch
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700/70 text-cyan-300 light:text-cyan-700 font-semibold uppercase shrink-0">
              {userPlan === 'org_pro' ? 'Org Pro' : 'Technohm SIT Org'}
            </span>
          </div>
        )}

        {/* Org Pro Upgrade Banner — members-only plan (base enterprise members) */}
        {isEnterpriseMember && userPlan === 'enterprise' && isPlanActive && (
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 light:bg-white light:bg-amber-50 border border-zinc-800/80 light:border-zinc-200 light:border-amber-300 text-white light:text-zinc-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none" />
            <div className="flex items-start gap-3 z-10">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-amber-400 light:text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 light:text-amber-700 border border-amber-500/40">
                    Org Member Exclusive
                  </span>
                  <span className="text-sm font-bold text-white light:text-zinc-900">Upgrade to Org Pro — ₹99 / 30 days</span>
                </div>
                <p className="text-xs text-zinc-300 light:text-zinc-700 mt-1">
                  <strong className="text-amber-300 light:text-amber-700">15 on-demand sweeps/week</strong> (vs 10) • Priority worker queue • Stays linked to your organization.
                </p>
                {orgProError && <p className="text-xs text-red-300 light:text-red-600 mt-1.5">{orgProError}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={handleOrgProUpgrade}
              disabled={orgProLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-60 shrink-0 z-10"
            >
              {orgProLoading ? 'Opening Checkout…' : 'Upgrade to Org Pro'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Daily 55-Job Limit Reached Banner */}
        {metrics.today >= 55 && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex items-center justify-between gap-3 text-xs shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 light:text-amber-600 shrink-0" />
              <span>
                <strong>Daily Limit Reached (55 max jobs):</strong> You have reached your daily limit of 55 applications for today. Limit is exceeded for today; automated sweeps will resume tomorrow at 06:00 AM IST.
              </span>
            </div>
          </div>
        )}

        {/* Browser Push Notifications Assistant Banner */}
        {notificationPermission === 'denied' && (
          <div className="p-3 sm:p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 light:text-amber-600 shrink-0">
                <BellOff className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white light:text-zinc-900 flex items-center gap-2">
                  <span>Browser Push Notifications Blocked</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 light:text-amber-700 font-mono">Action Required</span>
                </div>
                <p className="text-[11px] text-amber-300/80 mt-0.5">
                  Your browser is currently blocking notifications for JobFlux AI. Enable them to receive real-time job application receipts & daily sweeps.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowUnblockGuide(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5 shrink-0 self-end sm:self-auto"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>How to Unblock (1-Click Guide)</span>
            </button>
          </div>
        )}

        {notificationPermission === 'default' && !notificationBannerDismissed && (
          <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 light:text-cyan-600 shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white light:text-zinc-900">Enable Real-Time Dispatch Notifications</div>
                <p className="text-[11px] text-zinc-400 light:text-zinc-600 mt-0.5">
                  Get instant receipts when the autonomous engine submits applications and when exclusive flash offers drop.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setNotificationBannerDismissed(true)}
                className="p-1.5 rounded-lg text-zinc-500 light:text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRequestNotification}
                className="px-3 py-1.5 rounded-lg bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Allow Notifications</span>
              </button>
            </div>
          </div>
        )}


        {/* Unblock Instructions Modal */}
        {showUnblockGuide && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowUnblockGuide(false)
            }}
            className="fixed inset-0 z-50 bg-black/80 light:bg-white/85 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 rounded-2xl p-6 shadow-2xl shadow-black space-y-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 light:text-amber-600 shrink-0">
                    <BellRing className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white light:text-zinc-900">How to Unblock Notifications in Your Browser</h3>
                    <p className="text-[11px] text-zinc-400 light:text-zinc-600">Quick 3-step guide for Chrome / macOS</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowUnblockGuide(false)
                  }}
                  aria-label="Close unblock guide"
                  className="text-zinc-500 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 p-1 cursor-pointer z-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-black/60 light:bg-white/85 border border-zinc-800 light:border-zinc-200 text-xs text-zinc-300 light:text-zinc-700 space-y-1">
                <p className="font-semibold text-amber-300 light:text-amber-700">Why are notifications blocked?</p>
                <p className="text-zinc-400 light:text-zinc-600 text-[11px] leading-relaxed">
                  When notifications are blocked in browser settings, web standards prevent websites from triggering prompts automatically. You can re-enable them in 10 seconds:
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/80 light:bg-white/85 border border-zinc-800/80 light:border-zinc-200">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 light:text-amber-700 font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                  <div>
                    <div className="font-semibold text-white light:text-zinc-900">Click the Site Settings / Padlock Icon in Address Bar</div>
                    <p className="text-[11px] text-zinc-400 light:text-zinc-600 mt-0.5">
                      Look at the left of the URL in your browser address bar. Click the 🔒 or ⚙️ (tune/padlock) icon.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/80 light:bg-white/85 border border-zinc-800/80 light:border-zinc-200">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 light:text-amber-700 font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                  <div>
                    <div className="font-semibold text-white light:text-zinc-900">Switch &ldquo;Notifications&rdquo; from Block to Allow</div>
                    <p className="text-[11px] text-zinc-400 light:text-zinc-600 mt-0.5">
                      In the site permissions menu, find <strong>Notifications</strong> and change the dropdown setting to <strong>Allow</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/80 light:bg-white/85 border border-zinc-800/80 light:border-zinc-200">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 light:text-amber-700 font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                  <div>
                    <div className="font-semibold text-white light:text-zinc-900">Verify Connection</div>
                    <p className="text-[11px] text-zinc-400 light:text-zinc-600 mt-0.5">
                      Click the button below to confirm the permission change and receive an immediate verification alert!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800 light:border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowUnblockGuide(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 light:bg-zinc-200 hover:bg-zinc-700 text-zinc-300 light:text-zinc-700 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={recheckNotificationPermission}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>I&apos;ve Allowed It · Check Permission</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Candidate Plan Expiry Warning Banner (1-Day / 2-Day Pre-Expiry Alert) */}
        {(isPlanExpiringSoon || isPlanExpired) && (
          <div className={`p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border shadow-lg ${
            isPlanExpired
              ? 'bg-rose-950/40 border-rose-800/60 text-rose-200 shadow-rose-950/20'
              : hoursUntilPlanExpiry !== null && hoursUntilPlanExpiry <= 24
              ? 'bg-red-950/30 border-red-800/60 text-red-200 shadow-red-950/20'
              : 'bg-amber-950/30 border-amber-800/60 text-amber-200 shadow-amber-950/20'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isPlanExpired
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300 light:text-amber-700'
              }`}>
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                    isPlanExpired
                      ? 'bg-rose-500 text-white light:text-zinc-900'
                      : hoursUntilPlanExpiry !== null && hoursUntilPlanExpiry <= 24
                      ? 'bg-red-500 text-white light:text-zinc-900'
                      : 'bg-amber-500 text-black'
                  }`}>
                    {isPlanExpired ? 'PLAN EXPIRED' : hoursUntilPlanExpiry !== null && hoursUntilPlanExpiry <= 24 ? '1-DAY EXPIRY ALERT' : '2-DAY EXPIRY ALERT'}
                  </span>
                  <span className="text-xs font-bold text-white light:text-zinc-900">
                    {userPlanName}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 light:text-zinc-700 mt-0.5">
                  {isPlanExpired
                    ? 'Your subscription plan has expired. Automated application submissions are paused. Renew now to resume daily job applications.'
                    : `Your current plan expires in ${hoursUntilPlanExpiry !== null && hoursUntilPlanExpiry <= 24 ? `${hoursUntilPlanExpiry} hours` : `${Math.ceil((hoursUntilPlanExpiry || 48) / 24)} days`}. Renew today to prevent application pauses.`}
                </p>
              </div>
            </div>

            <div className="shrink-0 self-stretch sm:self-auto flex items-center justify-end">
              <Link
                href="/pricing"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                  isPlanExpired
                    ? 'bg-rose-600 hover:bg-rose-500 text-white light:text-zinc-900'
                    : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                }`}
              >
                <span>{isPlanExpired ? 'Renew Subscription' : 'Renew / Upgrade Plan'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Administrator Assigned Exclusive Promotional Offer Banner */}
        {activeOfferBanner ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
            <div className="flex items-start sm:items-center gap-3.5 z-10">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex items-center justify-center text-zinc-300 light:text-zinc-700 shrink-0">
                <Sparkles className="w-5 h-5 text-zinc-300 light:text-zinc-700" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-semibold uppercase px-2.5 py-0.5 rounded-md bg-zinc-900 light:bg-zinc-100 text-zinc-300 light:text-zinc-700 border border-zinc-800 light:border-zinc-200 tracking-wide">
                    {activeOfferBanner.discount_badge || 'SPECIAL OFFER'}
                  </span>
                  <span className="text-xs font-mono font-medium text-zinc-400 light:text-zinc-600">
                    Locked to Your Email ({userEmail || 'Account'})
                  </span>
                  <span className="text-[11px] font-mono text-zinc-300 light:text-zinc-700 bg-zinc-900 light:bg-zinc-100 px-2 py-0.5 rounded border border-zinc-800 light:border-zinc-200">
                    Code: <strong className="text-white light:text-zinc-900 font-semibold">{activeOfferBanner.promo_code}</strong>
                  </span>
                  {activeOfferBanner.expires_at && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${
                      activeOfferBanner.is_expired
                        ? 'bg-zinc-900 light:bg-zinc-100 border-zinc-800 light:border-zinc-200 text-zinc-500 light:text-zinc-600 font-medium'
                        : activeOfferBanner.hours_left !== undefined && activeOfferBanner.hours_left <= 24
                        ? 'bg-zinc-900 light:bg-zinc-100 border-zinc-800 light:border-zinc-200 text-amber-400 light:text-amber-600 font-medium'
                        : 'bg-zinc-900 light:bg-zinc-100 border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600'
                    }`}>
                      <Clock className="w-2.5 h-2.5" />
                      {activeOfferBanner.is_expired
                        ? 'Offer Expired'
                        : `Valid for: ${activeOfferBanner.hours_left !== undefined ? (activeOfferBanner.hours_left > 24 ? Math.ceil(activeOfferBanner.hours_left / 24) + ' days' : `${activeOfferBanner.hours_left}h remaining`) : 'limited time'}`}
                    </span>
                  )}
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white light:text-zinc-900 mt-1.5 flex items-center gap-2.5">
                  <span>{activeOfferBanner.offer_title}</span>
                  <span className="text-zinc-500 light:text-zinc-600 line-through text-xs sm:text-sm font-mono">{activeOfferBanner.original_price}</span>
                  <span className="text-white light:text-zinc-900 font-extrabold text-sm sm:text-base font-mono">{activeOfferBanner.discounted_price}</span>
                </h4>
                <p className="text-[11px] sm:text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
                  {activeOfferBanner.custom_message || 'Administrator assigned deal locked to your email address. 1-click instant unlock.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 z-10 shrink-0 self-stretch sm:self-auto justify-end">
              {activeOfferBanner.is_expired ? (
                <Link
                  href="/pricing"
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-850 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 text-xs font-semibold cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Offer Expired · View Pricing</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link
                  href={activeOfferBanner.claim_url || `/pricing?promo=${encodeURIComponent(activeOfferBanner.promo_code)}`}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Claim & Upgrade ({activeOfferBanner.discounted_price})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        ) : (!isProfessional) ? (
          <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex items-center justify-center shrink-0 text-zinc-300 light:text-zinc-700">
                <Sparkles className="w-4 h-4 text-zinc-400 light:text-zinc-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white light:text-zinc-900">
                    {userPlan === 'none' || userPlan === 'no_plan'
                      ? 'No Active Subscription · Choose a Plan to Start Auto-Apply'
                      : !isPlanActive
                      ? 'Subscription Expired · Renew to Resume Automated Applications'
                      : userPlan === 'pro'
                      ? 'Essentials Active · Upgrade to Professional for 1,800+ Applications'
                      : metrics.total_applied >= 150
                      ? 'Free Access Quota Reached (150/150)'
                      : `Free Access Active · ${metrics.total_applied}/150 Dispatched`}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${
                    userPlan === 'none' || userPlan === 'no_plan'
                      ? 'bg-zinc-900 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 border-zinc-800 light:border-zinc-200'
                      : !isPlanActive
                      ? 'bg-red-950/80 border-red-800 text-red-300 light:text-red-600'
                      : userPlan === 'pro'
                      ? 'bg-zinc-900 light:bg-zinc-100 border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700'
                      : metrics.total_applied >= 150
                      ? 'bg-zinc-900 light:bg-zinc-100 border-zinc-800 light:border-zinc-200 text-amber-400 light:text-amber-600'
                      : 'bg-zinc-900 light:bg-zinc-100 border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600'
                  }`}>
                    {userPlan === 'none' || userPlan === 'no_plan' ? 'NO PLAN' : !isPlanActive ? 'EXPIRED' : userPlan === 'pro' ? 'ESSENTIALS' : metrics.total_applied >= 150 ? 'EXHAUSTED' : '3-DAY FREE'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
                  Unlock <strong className="text-white light:text-zinc-900">1,800+ applications</strong>, morning scans & recruiter fast-path on Professional.
                </p>
              </div>
            </div>
            <Link
              href="/pricing?plan=elite"
              className="w-full sm:w-auto px-3.5 py-1.5 sm:py-2 rounded-lg bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 font-semibold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>{userPlan === 'none' || userPlan === 'no_plan' ? 'Choose Plan' : !isPlanActive ? 'Renew Plan' : userPlan === 'pro' ? 'Upgrade to Pro (₹199)' : 'Upgrade Plan'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : null}

        {/* Unified Mission Control Card (Cockpit + Live Metrics + Telemetry Strip) */}
        <div className="rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 overflow-hidden card-featured-glow relative">
          {/* Subtle top accent */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-600/40 to-transparent pointer-events-none" />

          {/* Section 1: Cockpit Header */}
          <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3.5 bg-zinc-950/50 light:bg-white">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex items-center justify-center text-zinc-300 light:text-zinc-700">
                  <Cpu className="w-5 h-5 text-zinc-300 light:text-zinc-700" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-semibold text-white light:text-zinc-900 tracking-tight">
                    Autonomous Engine Cockpit
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 font-mono flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                    Daemon Active
                  </span>
                </div>
                <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>Schedule: <strong className="text-zinc-300 light:text-zinc-700">Daily Autonomous Sweeps</strong></span>
                  <span className="text-zinc-600 hidden sm:inline">•</span>
                  <span className="text-zinc-400 light:text-zinc-600 font-medium">Applies Daily</span>
                  <span className="text-zinc-600 hidden sm:inline">•</span>
                  <span>Radar: <strong className="text-zinc-200 light:text-zinc-800 font-mono">06:00 AM IST</strong></span>
                </p>
              </div>
            </div>

            <div className="w-full lg:w-auto flex items-center justify-start lg:justify-end gap-2 pt-1 lg:pt-0">
              <button
                type="button"
                onClick={handleTriggerOnDemandScout}
                disabled={isTriggeringScout || (activeTask && (activeTask.status === 'pending' || activeTask.status === 'running')) || (isProfessional && weeklyQuota && !weeklyQuota.is_unlimited && weeklyQuota.remaining <= 0)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0"
                title={!isProfessional ? "Upgrade to Professional to run on-demand sweeps" : (weeklyQuota && !weeklyQuota.is_unlimited && weeklyQuota.remaining <= 0) ? "Weekly on-demand sweep quota reached (5/5). Resets in rolling 7 days." : "Trigger instant real-time job application sweep"}
              >
                {activeTask?.status === 'running' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-black light:text-white" />
                    <span>Running Sweep...</span>
                  </>
                ) : activeTask?.status === 'pending' ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-zinc-700" />
                    <span>Queued {queueStatus?.queue_position && queueStatus.queue_position > 1 ? `(#${queueStatus.queue_position})` : ''}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>On-Demand Sweep</span>
                    {isProfessional ? (
                      weeklyQuota?.is_unlimited ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold">VIP</span>
                      ) : (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-800 font-bold">
                          {weeklyQuota ? `${weeklyQuota.remaining}/${weeklyQuota.limit || (isEnterpriseMember ? 10 : 5)}` : (isEnterpriseMember ? '10/10' : '5/5')}
                        </span>
                      )
                    ) : (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 light:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 font-semibold">
                        PRO
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback Toast */}
          {taskFeedback && isProfessional && (
            <div className={`p-3 text-xs flex items-center justify-between border-t border-b ${
              taskFeedback.type === 'success'
                ? 'bg-zinc-950 light:bg-white border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800'
                : taskFeedback.type === 'error'
                ? 'bg-zinc-950 light:bg-white border-red-500/30 text-red-300 light:text-red-600'
                : 'bg-zinc-950 light:bg-white border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700'
            }`}>
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-zinc-400 light:text-zinc-600" />
                {taskFeedback.text}
              </span>
              <button
                onClick={() => setTaskFeedback(null)}
                className="text-zinc-500 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 text-xs px-2 py-0.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Real-time Live Log Stream Terminal */}
          {activeTask && (activeTask.status === 'running' || activeTask.status === 'pending' || (activeTask.logs && activeTask.logs.length > 0)) && (
            <div className="border-t border-b border-zinc-800 light:border-zinc-200 bg-black light:bg-white overflow-hidden animate-in fade-in duration-200">
              <div className="px-3.5 py-2 bg-zinc-950 light:bg-white flex items-center justify-between border-b border-zinc-900 light:border-zinc-200 text-xs">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
                  <span className="font-mono text-zinc-300 light:text-zinc-700 font-semibold text-[11px]">
                    Autonomous Bot Live Terminal {activeTask.task_id ? `(${activeTask.task_id})` : ''}
                  </span>
                  {activeTask.status === 'running' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 light:text-emerald-700 border border-emerald-500/40 animate-pulse">
                      <Radio className="w-2 h-2 text-emerald-400 light:text-emerald-600" />
                      LIVE
                    </span>
                  )}
                  {activeTask.status === 'pending' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 light:text-amber-700 border border-amber-500/40">
                      QUEUED
                    </span>
                  )}
                  {activeTask.status === 'completed' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 light:text-emerald-700 border border-emerald-500/40">
                      COMPLETED
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowLiveTerminal(prev => !prev)}
                  className="text-zinc-500 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 text-[11px] font-mono cursor-pointer"
                >
                  {showLiveTerminal ? 'Minimize ▲' : 'Expand Stream ▼'}
                </button>
              </div>

              {showLiveTerminal && (
                <div className="p-3 font-mono text-[11px] max-h-44 overflow-y-auto space-y-1 select-text scroll-smooth">
                  {activeTask.logs && activeTask.logs.length > 0 ? (
                    activeTask.logs.map((line: string, i: number) => (
                      <div
                        key={i}
                        className={`leading-relaxed ${
                          line.includes('❌') || line.includes('Error') || line.includes('Failed')
                            ? 'text-rose-400 font-medium'
                            : line.includes('🛑') || line.includes('⚠️')
                            ? 'text-amber-400 light:text-amber-600'
                            : line.includes('🎉') || line.includes('APPLIED!') || line.includes('COMPLETED')
                            ? 'text-emerald-400 light:text-emerald-600 font-semibold'
                            : line.includes('🎬') || line.includes('🚀') || line.includes('Company resolved')
                            ? 'text-cyan-300 light:text-cyan-700'
                            : 'text-zinc-300 light:text-zinc-700'
                        }`}
                      >
                        {line}
                      </div>
                    ))
                  ) : (
                    <div className="text-zinc-500 light:text-zinc-600 italic py-2">
                      Connecting to background worker... Task queued in dispatch pipeline.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section 2: Integrated 4 Metrics Bar - Clean Responsive Card Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3 sm:p-4 border-t border-zinc-800/80 light:border-zinc-200 bg-black/40 light:bg-white/85">
            <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-900/40 light:bg-zinc-100 border border-zinc-800/60 light:border-zinc-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400 light:text-zinc-600">
                <span className="text-[11px] flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-zinc-500 light:text-zinc-600" /> Today</span>
                <span className="text-[10px] font-mono text-zinc-500 light:text-zinc-600">24h</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-lg sm:text-2xl font-bold font-mono ${metrics.today >= 55 ? 'text-amber-400 light:text-amber-600' : 'text-white light:text-zinc-900'}`}>{metrics.today}</span>
                <span className="text-[11px] text-zinc-500 light:text-zinc-600 font-mono">/ 55 max</span>
              </div>
              <p className="text-[10px] text-zinc-500 light:text-zinc-600">
                {metrics.today >= 55 ? (
                  <span className="text-amber-400 light:text-amber-600 font-semibold font-mono">Limit exceeded today</span>
                ) : (
                  'Delivered today'
                )}
              </p>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-900/40 light:bg-zinc-100 border border-zinc-800/60 light:border-zinc-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400 light:text-zinc-600">
                <span className="text-[11px] flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-zinc-500 light:text-zinc-600" /> This Week</span>
                <span className="text-[10px] font-mono text-zinc-500 light:text-zinc-600">7d</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-white light:text-zinc-900 font-mono">{metrics.this_week}</div>
              <p className="text-[10px] text-zinc-500 light:text-zinc-600">7-day outreach</p>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-900/40 light:bg-zinc-100 border border-zinc-800/60 light:border-zinc-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400 light:text-zinc-600">
                <span className="text-[11px] flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-zinc-500 light:text-zinc-600" /> This Month</span>
                <span className="text-[10px] font-mono text-zinc-500 light:text-zinc-600">30d</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-white light:text-zinc-900 font-mono">{metrics.this_month}</div>
              <p className="text-[10px] text-zinc-500 light:text-zinc-600">Monthly volume</p>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-900/40 light:bg-zinc-100 border border-zinc-800/60 light:border-zinc-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400 light:text-zinc-600">
                <span className="text-[11px] flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-zinc-500 light:text-zinc-600" /> Total Verified</span>
                <span className="text-[9px] font-mono text-zinc-300 light:text-zinc-700 bg-zinc-800 light:bg-zinc-200 px-1.5 py-0.2 rounded border border-zinc-700 light:border-zinc-300 font-medium">100%</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-white light:text-zinc-900 font-mono">{metrics.total_applied}</div>
              <p className="text-[10px] text-zinc-500 light:text-zinc-600">All-time submissions</p>
            </div>
          </div>

          {/* Section 3: Clean Telemetry Protocol Strip */}
          <div className="px-4 py-2.5 bg-black light:bg-white border-t border-zinc-800/80 light:border-zinc-200 flex items-center justify-between flex-wrap gap-2 text-[11px] text-zinc-400 light:text-zinc-600">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
                <span>Pacing: <strong className="text-zinc-300 light:text-zinc-700">Human (4s-8s)</strong></span>
              </span>
              <span className="text-zinc-800 hidden sm:inline">|</span>
              <button
                onClick={() => { if (!isProfessional) { setProModalFeature('Neural LLM Screening Tailor'); setShowProModal(true) } }}
                className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
                <span>Screening: <strong className="text-zinc-300 light:text-zinc-700">Contextual AI</strong></span>
                {!isProfessional && <span className="text-[9px] font-mono text-zinc-400 light:text-zinc-600 ml-0.5">🔒 PRO</span>}
              </button>
              <span className="text-zinc-800 hidden sm:inline">|</span>
              <button
                onClick={() => { if (!isProfessional) { setProModalFeature('Zero-Queue Recruiter Fast-Path'); setShowProModal(true) } }}
                className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
                <span>Delivery: <strong className="text-zinc-300 light:text-zinc-700">Recruiter ATS</strong></span>
                {!isProfessional && <span className="text-[9px] font-mono text-zinc-400 light:text-zinc-600 ml-0.5">🔒 PRO</span>}
              </button>
            </div>

            <span className="text-[10px] font-mono text-zinc-500 light:text-zinc-600 hidden sm:inline">
              Automated Morning Sync
            </span>
          </div>
        </div>

        {/* Beginner Onboarding & Autonomous Workflow Guide */}
        <BeginnerOnboardingGuide
          completeness={profileCompleteness}
          userPlan={userPlan}
          isProfessional={isProfessional}
          totalApplied={metrics.total_applied}
        />

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-zinc-950/90 light:bg-white/90 border border-zinc-800/80 light:border-zinc-200 rounded-xl overflow-x-auto scrollbar-none flex-nowrap">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 font-semibold shadow-sm'
                : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900/50'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 shrink-0" />
            <span>Applications ({historyTotalCount || historyJobs.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('queries')
              loadUserTickets(userId)
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'queries'
                ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 font-semibold shadow-sm'
                : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900/50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span>Inquiries</span>
            {userTickets.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 light:bg-zinc-200 text-zinc-300 light:text-zinc-700 font-mono">
                {userTickets.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('resume_builder')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === 'resume_builder'
                ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 font-semibold shadow-sm'
                : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>AI ATS Resume</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-zinc-800 light:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 font-semibold">
              PRO
            </span>
          </button>
        </div>

        {/* TAB 1: JOB APPLYING HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Daily Autonomous Job Apply Dispatch Report & Engagement Summary */}
            {metrics.total_applied > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 space-y-3.5 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex items-center justify-center text-zinc-300 light:text-zinc-700 shrink-0">
                      <FileCheck className="w-4 h-4 text-zinc-300 light:text-zinc-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-white light:text-zinc-900 tracking-tight">
                          Autonomous Job Dispatch Report
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 font-semibold">
                          {metrics.today > 0 ? `${metrics.today} Applied Today` : `${metrics.total_applied} Applications Dispatched`}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
                        Verified recruiter delivery via cloud workers with human pacing &amp; tailored ATS screening answers.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const topCompanies = Array.from(new Set(historyJobs.slice(0, 6).map(j => j.company || 'Tech Employer'))).join(', ')
                        const text = `JobFlux AI Job Dispatch Report:\n✅ Dispatched: ${metrics.total_applied} applications (${metrics.today} today)\n🏢 Top Companies: ${topCompanies}\n⚡ Status: Verified Recruiter ATS Delivery\nTrack live: https://jobfluxai.vercel.app/dashboard`
                        navigator.clipboard.writeText(text)
                        setCopiedReport(true)
                        setTimeout(() => setCopiedReport(false), 2500)
                      }}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-750 text-zinc-300 light:text-zinc-700 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedReport ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-zinc-300 light:text-zinc-700" />
                          <span className="text-zinc-200 light:text-zinc-800">Report Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" />
                          <span>Copy Report</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Company Chips from latest run */}
                {historyJobs.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-zinc-800/80 light:border-zinc-200">
                    <span className="text-[11px] text-zinc-400 light:text-zinc-600 font-mono block">
                      Recently Dispatched Employers:
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-nowrap pb-1">
                      {Array.from(new Set(historyJobs.map(j => j.company || 'Tech Partner'))).slice(0, 7).map((comp, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-black light:bg-white border border-zinc-800 light:border-zinc-200 text-xs text-zinc-300 light:text-zinc-700 font-medium shrink-0 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3 h-3 text-zinc-400 light:text-zinc-600" />
                          <span>{comp}</span>
                        </span>
                      ))}
                      {historyJobs.length > 7 && (
                        <span className="text-[11px] text-zinc-500 light:text-zinc-600 font-mono self-center px-1">
                          +{historyJobs.length - 7} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* High-Converting Upgrade Pull for Free/Trial Users */}
                {!isProfessional ? (
                  <div className="p-3.5 rounded-xl bg-zinc-900/60 light:bg-zinc-100 border border-zinc-750 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Crown className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" />
                        <span className="text-xs font-semibold text-white light:text-zinc-900">Free Trial Capacity: {metrics.total_applied} / 50 Dispatched</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 light:text-amber-700 border border-amber-500/30 font-bold">
                          {Math.max(0, 50 - metrics.total_applied)} Remaining
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 light:text-zinc-600 leading-relaxed">
                        Free tier caps at 50 applications. Upgrade to <strong className="text-white light:text-zinc-900">Professional</strong> for 1,800+ continuous applications, daily automated morning sweeps &amp; zero-queue recruiter delivery.
                      </p>
                    </div>

                    <Link
                      href="/pricing?promo=WELCOMEPRO"
                      className="px-3.5 py-1.5 rounded-lg bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Upgrade for ₹199 (Save 90%)</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-black light:bg-white border border-zinc-800/80 light:border-zinc-200 flex items-center justify-between text-xs text-zinc-400 light:text-zinc-600 font-mono">
                    <span className="flex items-center gap-2">
                      <Crown className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" />
                      <span className="text-zinc-300 light:text-zinc-700 font-medium">Professional Plan Active:</span> Unlimited 1,800+ Applications Pool · Fast-Path Priority Queue
                    </span>
                    <span className="text-zinc-500 light:text-zinc-600 hidden sm:inline">Active Recruiter Sync</span>
                  </div>
                )}
              </div>
            )}

            {/* Search & Filter Header */}
            <div className="p-3.5 rounded-xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-3.5 h-3.5 text-zinc-500 light:text-zinc-600 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search company, job role..."
                  value={historySearch}
                  onChange={e => {
                    setHistorySearch(e.target.value)
                    loadUserHistory(userId, 1, e.target.value, historyFilter)
                  }}
                  className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none focus:border-zinc-500 transition-colors"
                />
              </div>

              {/* Actions & Export */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                {/* Time Pill Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  {(['all', 'today', 'week', 'month'] as const).map(f => {
                    const label =
                      f === 'all'
                        ? `All (${metrics.total_applied})`
                        : f === 'today'
                        ? `Today (${metrics.today})`
                        : f === 'week'
                        ? `Week (${metrics.this_week})`
                        : `Month (${metrics.this_month})`
                    const active = historyFilter === f
                    return (
                      <button
                        key={f}
                        onClick={() => {
                          setHistoryFilter(f)
                          loadUserHistory(userId, 1, historySearch, f)
                        }}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                          active
                            ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900'
                            : 'bg-black light:bg-white text-zinc-500 light:text-zinc-600 hover:text-zinc-300 border border-zinc-800 light:border-zinc-200'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={handleExportHistoryCsv}
                  disabled={historyJobs.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 disabled:opacity-40 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 border border-zinc-800 light:border-zinc-200 text-xs font-medium transition-colors cursor-pointer shrink-0"
                  title={isProfessional ? "Export application records to CSV spreadsheet" : "Upgrade to Professional to export applications to CSV"}
                >
                  <Download className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" />
                  <span className="hidden sm:inline">Export CSV</span>
                  {!isProfessional && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 light:bg-cyan-50 border border-cyan-700/50 light:border-cyan-300 text-cyan-300 light:text-cyan-700 font-semibold">
                      PRO
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Applications Table (Desktop) & Cards (Mobile) */}
            <div className="rounded-xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300 light:text-zinc-700">
                  <thead className="bg-black light:bg-white text-zinc-500 light:text-zinc-600 uppercase text-[10px] tracking-wider border-b border-zinc-800 light:border-zinc-200">
                    <tr>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Job Role</th>
                      <th className="py-3 px-4">Date Applied</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 light:divide-zinc-200/60">
                    {loadingHistory ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-zinc-500 light:text-zinc-600">
                          <RefreshCw className="w-4 h-4 mx-auto animate-spin mb-2 text-zinc-400 light:text-zinc-600" />
                          Loading applications...
                        </td>
                      </tr>
                    ) : historyJobs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-16 text-center">
                          <div className="max-w-md mx-auto space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex items-center justify-center mx-auto text-zinc-400 light:text-zinc-600">
                              <Cpu className="w-6 h-6 text-zinc-400 light:text-zinc-600" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-xs font-semibold text-white light:text-zinc-900">
                                {historySearch ? 'No Matching Applications Found' : 'Autonomous Engine Calibrated & Standing By'}
                              </h4>
                              <p className="text-[11px] text-zinc-400 light:text-zinc-600 leading-relaxed">
                                {historySearch
                                  ? `No previous job applications match "${historySearch}". Try adjusting your search query.`
                                  : `Your agent is active and calibrated for daily autonomous sweeps. All matched employer submissions and answered screening questions will populate here in real-time.`}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      historyJobs.map((job, idx) => (
                        <tr
                          key={job.id || idx}
                          onClick={() => setSelectedJobAudit(job)}
                          className="hover:bg-zinc-900/50 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 font-medium text-white light:text-zinc-900 flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex items-center justify-center text-[10px] text-zinc-400 light:text-zinc-600 font-bold shrink-0">
                              <Building2 className="w-3 h-3" />
                            </div>
                            <span>{job.company || 'Direct Employer'}</span>
                          </td>
                          <td className="py-3 px-4 text-zinc-300 light:text-zinc-700">
                            {isProfessional && job.url && job.url !== '__locked__' && job.url.startsWith('http') ? (
                              <a
                                href={job.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-white light:hover:text-zinc-900 transition-colors inline-flex items-center gap-1.5 group"
                                title="Open job listing on portal"
                              >
                                <span className="group-hover:underline">{job.title || 'Job Opening'}</span>
                                <ExternalLink className="w-3 h-3 text-zinc-500 light:text-zinc-600 group-hover:text-white" />
                              </a>
                            ) : (job.is_url_locked || job.url === '__locked__' || (!isProfessional && job.url)) ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setProModalFeature('Job Redirect URL Access')
                                  setShowProModal(true)
                                }}
                                className="inline-flex items-center gap-1.5 text-left group cursor-pointer"
                                title="Upgrade to Professional to open direct portal job listing"
                              >
                                <span className="text-zinc-300 light:text-zinc-700 group-hover:text-white transition-colors">{job.title || 'Job Opening'}</span>
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-800 light:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 group-hover:bg-zinc-700 transition-colors">
                                  <Lock className="w-2.5 h-2.5" />
                                  PRO
                                </span>
                              </button>
                            ) : (
                              <span>{job.title || 'Job Opening'}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-zinc-400 light:text-zinc-600 font-mono text-[11px]">
                            {formatJobDate(job)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-900 light:bg-zinc-100 text-zinc-300 light:text-zinc-700 border border-zinc-800 light:border-zinc-200">
                              <CheckCircle2 className="w-3 h-3 text-zinc-400 light:text-zinc-600" /> APPLIED
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-zinc-800 light:divide-zinc-200/60">
                {loadingHistory ? (
                  <div className="py-12 text-center text-zinc-500 light:text-zinc-600 text-xs">
                    <RefreshCw className="w-4 h-4 mx-auto animate-spin mb-2 text-zinc-400 light:text-zinc-600" />
                    Loading applications...
                  </div>
                ) : historyJobs.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <Cpu className="w-5 h-5 text-zinc-400 light:text-zinc-600 mx-auto" />
                    <h4 className="text-xs font-semibold text-white light:text-zinc-900">
                      {historySearch ? 'No Results Found' : 'Engine Standing By'}
                    </h4>
                    <p className="text-[11px] text-zinc-400 light:text-zinc-600">
                      {historySearch
                        ? `No previous job applications match "${historySearch}".`
                        : 'Autonomous sweeps apply daily. Verified applications will appear here.'}
                    </p>
                  </div>
                ) : (
                  historyJobs.map((job, idx) => (
                    <div
                      key={job.id || idx}
                      onClick={() => setSelectedJobAudit(job)}
                      className="p-3.5 hover:bg-zinc-900/40 active:bg-zinc-900/70 transition-colors cursor-pointer space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex items-center justify-center text-zinc-400 light:text-zinc-600 shrink-0">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-white light:text-zinc-900 truncate">
                              {job.company || 'Direct Employer'}
                            </h4>
                            <p className="text-[11px] text-zinc-400 light:text-zinc-600 truncate">
                              {job.title || 'Job Opening'}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-zinc-900 light:bg-zinc-100 text-zinc-300 light:text-zinc-700 border border-zinc-800 light:border-zinc-200 shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5 text-zinc-400 light:text-zinc-600" /> APPLIED
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 light:text-zinc-600 font-mono pt-1">
                        <span>{formatJobDate(job)}</span>
                        <span className="text-cyan-400 light:text-cyan-600 flex items-center gap-0.5 font-medium">
                          Audit Receipt &rarr;
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              <div className="bg-black light:bg-white px-4 py-2.5 border-t border-zinc-800 light:border-zinc-200 flex items-center justify-between">
                <span className="text-xs text-zinc-500 light:text-zinc-600">
                  Showing {historyJobs.length > 0 ? (historyPage - 1) * 20 + 1 : 0} to{' '}
                  {Math.min(historyPage * 20, historyTotalCount)} of {historyTotalCount}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadUserHistory(userId, historyPage - 1, historySearch, historyFilter)}
                    disabled={historyPage <= 1 || loadingHistory}
                    className="px-3 py-1 rounded text-xs font-medium bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-zinc-500 light:text-zinc-600 font-mono px-1">
                    {historyPage} / {historyTotalPages}
                  </span>
                  <button
                    onClick={() => loadUserHistory(userId, historyPage + 1, historySearch, historyFilter)}
                    disabled={historyPage >= historyTotalPages || loadingHistory}
                    className="px-3 py-1 rounded text-xs font-medium bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2 (FALLBACK): CANDIDATE PROFILE & CREDENTIALS */}
        {activeTab === 'profile' && (
          <div className="p-8 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex items-center justify-center mx-auto text-zinc-300 light:text-zinc-700">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white light:text-zinc-900">Candidate Profile & Credentials</h3>
              <p className="text-xs text-zinc-400 light:text-zinc-600 mt-1 max-w-md mx-auto">
                Candidate Profile, Resume, and Portal Credentials are now managed on the dedicated Profile Settings page.
              </p>
            </div>
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 font-semibold text-xs transition-colors"
            >
              <span>Open Profile Settings Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* TAB 4: AI NEURAL ATS RESUME BUILDER (EXCLUSIVE TO PROFESSIONAL) */}
        {activeTab === 'resume_builder' && (
          <AiResumeBuilder
            userId={userId}
            userEmail={userEmail}
            userName={userName}
            isProfessional={isProfessional}
            onUpgradeClick={(feat) => {
              setProModalFeature(feat || 'AI ATS Resume Builder & Cloud Bot Sync')
              setShowProModal(true)
            }}
          />
        )}

        {/* TAB 3: CANDIDATE REQUESTS & SUPPORT INQUIRIES */}
        {activeTab === 'queries' && (
          <div className="space-y-4">
            {/* Header / Summary Card */}
            <div className="p-4 rounded-xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex items-center justify-center text-teal-400 light:text-cyan-600 shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white light:text-zinc-900">My Support Requests & Inquiries</h3>
                  <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
                    Direct communications with JobFlux Administrator (<span className="text-teal-300 light:text-cyan-700 font-mono">technohmsit@gmail.com</span>).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadUserTickets(userId)}
                  className="px-3 py-1.5 rounded-lg bg-black light:bg-white hover:bg-zinc-900 light:hover:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Refresh my requests"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingUserTickets ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setIsHelpOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Submit New Query</span>
                </button>
              </div>
            </div>

            {/* Queries List */}
            {loadingUserTickets ? (
              <div className="p-12 rounded-xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 text-center text-zinc-400 light:text-zinc-600">
                <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-teal-400 light:text-cyan-600" />
                <span>Loading your inquiries...</span>
              </div>
            ) : userTickets.length === 0 ? (
              <div className="p-12 rounded-xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 mx-auto flex items-center justify-center text-zinc-500 light:text-zinc-600">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white light:text-zinc-900">No Inquiries Submitted</h4>
                  <p className="text-xs text-zinc-500 light:text-zinc-600 max-w-sm mx-auto mt-1">
                    Have questions about your daily auto-runs, need profile optimization, or experiencing issues? Submit a request and our administrator will assist you directly.
                  </p>
                </div>
                <button
                  onClick={() => setIsHelpOpen(true)}
                  className="px-4 py-2 rounded-lg bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 font-semibold text-xs transition-all cursor-pointer"
                >
                  Submit a Query
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {userTickets.map((t) => (
                  <div
                    key={t.ticket_id || t.id}
                    className="p-4 rounded-xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 space-y-3 transition-colors hover:border-zinc-700 light:hover:border-zinc-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/80 light:border-zinc-200">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-white light:text-zinc-900">
                          #{t.ticket_id}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider ${
                          t.priority === 'urgent'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : t.priority === 'high'
                            ? 'bg-amber-500/15 text-amber-400 light:text-amber-600 border border-amber-500/30'
                            : 'bg-zinc-800 light:bg-zinc-200 text-zinc-300 light:text-zinc-700 border border-zinc-700 light:border-zinc-300'
                        }`}>
                          {t.priority || 'normal'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-black light:bg-white border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600">
                          {t.category?.replace('_', ' ') || 'General'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          t.status === 'resolved'
                            ? 'bg-zinc-800 light:bg-zinc-200 text-zinc-200 light:text-zinc-800 border border-zinc-700 light:border-zinc-300'
                            : t.status === 'in_progress'
                            ? 'bg-amber-500/10 text-amber-400 light:text-amber-600 border border-amber-500/30'
                            : t.status === 'closed'
                            ? 'bg-zinc-800 light:bg-zinc-200 text-zinc-400 light:text-zinc-600 border border-zinc-700 light:border-zinc-300'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {t.status === 'resolved' && <CheckCircle2 className="w-3 h-3" />}
                          {t.status === 'in_progress' && <RefreshCw className="w-3 h-3 animate-spin" />}
                          {t.status?.replace('_', ' ') || 'Open'}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 light:text-zinc-600">
                          {formatTimestamp(t.created_at)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-white light:text-zinc-900 mb-1">{t.subject}</h4>
                      <p className="text-xs text-zinc-300 light:text-zinc-700 leading-relaxed bg-black/60 light:bg-white/85 p-3 rounded-lg border border-zinc-800/80 light:border-zinc-200">
                        {t.message}
                      </p>
                    </div>

                    {/* Admin Response Box */}
                    {t.admin_response ? (
                      <div className="p-3 rounded-lg bg-teal-950/20 border border-teal-800/40 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-teal-300 light:text-cyan-700 flex items-center gap-1.5">
                            <Shield className="w-3 h-3 text-teal-400 light:text-cyan-600" />
                            Administrator Response (technohmsit@gmail.com)
                          </span>
                          {t.resolved_at && (
                            <span className="text-[10px] font-mono text-teal-400 light:text-cyan-600">
                              {formatTimestamp(t.resolved_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-200 light:text-zinc-800 whitespace-pre-wrap font-sans leading-relaxed">
                          {t.admin_response}
                        </p>
                      </div>
                    ) : (
                      <div className="text-[11px] text-zinc-500 light:text-zinc-600 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-zinc-500 light:text-zinc-600" />
                        <span>Awaiting Administrator review. Updates will appear here and in your inbox.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mobile Dedicated Candidate Account & Quick Actions Footer Card */}
        <div className="block md:hidden p-4 rounded-2xl bg-[#0a0a0c] light:bg-white border border-zinc-800/90 light:border-zinc-200 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex items-center justify-center font-bold text-white light:text-zinc-900 text-xs shrink-0 relative overflow-hidden">
                {userPicture ? (
                  <img src={userPicture} alt={userName || 'Candidate'} className="w-full h-full object-cover" onError={() => setUserPicture('')} />
                ) : (
                  userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AI'
                )}
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 border-2 border-black" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-white light:text-zinc-900 truncate max-w-[140px]">{userName || 'Candidate'}</span>
                  {(isVip || userPlan === 'vip') ? (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 light:text-amber-700 font-bold">VIP</span>
                  ) : isProfessional ? (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-800 light:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 font-bold">PRO</span>
                  ) : (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 font-semibold">{userPlan ? userPlan.toUpperCase() : 'FREE'}</span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 light:text-zinc-600 font-mono truncate">{userEmail}</p>
              </div>
            </div>
          </div>

          <div className="pt-1 border-t border-zinc-800/60 light:border-zinc-200 space-y-2">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 light:text-amber-700 font-medium text-xs transition-colors cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>Rate &amp; Review Your Experience</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/profile"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-850 border border-zinc-800 light:border-zinc-200 text-zinc-200 light:text-zinc-800 font-medium text-xs transition-colors"
              >
                <User className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" />
                <span>Profile Settings</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 light:text-red-600 font-medium text-xs transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* AI Application Audit Receipt Modal */}
        {selectedJobAudit && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/80 light:bg-white/85 backdrop-blur-sm"
            onClick={() => setSelectedJobAudit(null)}
          >
            <div
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-zinc-800 light:border-zinc-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 flex items-center justify-center text-zinc-300 light:text-zinc-700 shrink-0">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white light:text-zinc-900">Application Delivery Receipt</h3>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 font-medium">
                        Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 light:text-zinc-600 font-mono">
                      JFX-{(selectedJobAudit._id || selectedJobAudit.id || '9842').toString().slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedJobAudit(null)}
                  className="p-1 rounded-lg text-zinc-500 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Target Opening Details */}
              <div className="p-3.5 rounded-xl bg-black light:bg-white border border-zinc-800 light:border-zinc-200 space-y-1">
                <div className="text-[10px] uppercase font-mono text-zinc-500 light:text-zinc-600">Target Position</div>
                <div className="text-sm font-medium text-white light:text-zinc-900">{selectedJobAudit.title || 'Job Opening'}</div>
                <div className="text-xs text-zinc-400 light:text-zinc-600 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-zinc-500 light:text-zinc-600" />
                  {selectedJobAudit.company || 'Verified Employer'}
                </div>
              </div>

              {/* Delivery Metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-black light:bg-white border border-zinc-800 light:border-zinc-200">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 light:text-zinc-600 block mb-1">Resume Fit</span>
                  <div className="text-sm font-semibold text-white light:text-zinc-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" /> 96% Match
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-black light:bg-white border border-zinc-800 light:border-zinc-200">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 light:text-zinc-600 block mb-1">Dispatched</span>
                  <div className="text-xs font-mono font-medium text-white light:text-zinc-900 mt-0.5">
                    {formatJobDate(selectedJobAudit)}
                  </div>
                </div>
              </div>

              {/* Screening Answers */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono text-zinc-500 light:text-zinc-600 block">
                  Screening Responses Submitted by AI Engine
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-black light:bg-white border border-zinc-800/80 light:border-zinc-200 flex items-center justify-between">
                    <span className="text-zinc-500 light:text-zinc-600">Notice Period:</span>
                    <span className="font-medium text-zinc-200 light:text-zinc-800">Immediate / 15 Days</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black light:bg-white border border-zinc-800/80 light:border-zinc-200 flex items-center justify-between">
                    <span className="text-zinc-500 light:text-zinc-600">Relocation:</span>
                    <span className="font-medium text-zinc-200 light:text-zinc-800">Open to Relocation</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black light:bg-white border border-zinc-800/80 light:border-zinc-200 flex items-center justify-between">
                    <span className="text-zinc-500 light:text-zinc-600">Compensation:</span>
                    <span className="font-medium text-zinc-200 light:text-zinc-800">Negotiable / Standard</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                {isProfessional && selectedJobAudit.url && selectedJobAudit.url !== '__locked__' && selectedJobAudit.url.startsWith('http') && (
                  <a
                    href={selectedJobAudit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 rounded-lg bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View Portal Opening</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {(selectedJobAudit.is_url_locked || selectedJobAudit.url === '__locked__' || (!isProfessional && selectedJobAudit.url)) && (
                  <button
                    onClick={() => {
                      setProModalFeature('Job Redirect URL Access')
                      setShowProModal(true)
                    }}
                    className="flex-1 py-2 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-cyan-500/40 light:border-cyan-300 hover:border-cyan-500/70 text-cyan-300 light:text-cyan-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>View Portal Opening</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 light:bg-cyan-50 border border-cyan-700/50 light:border-cyan-300 text-cyan-300 light:text-cyan-700">PRO</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedJobAudit(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-300 light:text-zinc-700 border border-zinc-800 light:border-zinc-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>



      {/* Real-time In-App Candidate Promotional Offer Alert Toast */}
      {inAppToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 rounded-2xl bg-[#0d0f17]/95 light:bg-white border-2 border-amber-400 shadow-[0_15px_40px_rgba(0,0,0,0.85)] backdrop-blur-md animate-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 light:text-amber-600 shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                <Sparkles className="w-4 h-4 text-amber-300 light:text-amber-700" />
              </div>
              <div>
                <div className="text-xs font-bold text-white light:text-zinc-900 flex items-center gap-1.5">
                  <span>{inAppToast.title}</span>
                </div>
                <p className="text-[11px] text-zinc-300 light:text-zinc-700 mt-1 leading-relaxed">
                  {inAppToast.message}
                </p>
                {inAppToast.claim_url && (
                  <Link
                    href={inAppToast.claim_url}
                    onClick={() => dismissToast(inAppToast.id)}
                    className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition-all shadow-md"
                  >
                    <span>Claim Offer Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(inAppToast.id)}
              className="p-1 rounded-md text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 transition-colors cursor-pointer"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
        onTicketSubmitted={() => loadUserTickets(userId)}
      />

      {/* Exclusive Candidate Promotional Offer Popup Modal */}
      <CandidateOfferModal
        isOpen={isOfferModalOpen}
        onClose={handleCloseOfferModal}
        offer={assignedOffers.length > 0 ? assignedOffers[0] : null}
        userEmail={userEmail}
      />

      {/* Official Standalone PWA Installation & Push Notification Activation Modal */}
      <PwaInstallPromptModal
        isOpen={isPwaModalOpen}
        onClose={handleClosePwaModal}
        userEmail={userEmail}
        userId={userId}
      />

      {/* Candidate Satisfaction & Review Modal */}
      <CandidateReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        initialName={userName}
        initialEmail={userEmail}
        initialUserId={userId}
        initialAvatar={userPicture}
      />
    </div>
  )
}
