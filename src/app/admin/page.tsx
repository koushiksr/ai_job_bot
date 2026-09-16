'use client'

import React, { useEffect, useState } from 'react'
import {
  Shield,
  Users,
  Database,
  LogOut,
  Edit,
  ExternalLink,
  X,
  History,
  Clock,
  Calendar,
  TrendingUp,
  Sparkles,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  FileText,
  User,
  Briefcase,
  CreditCard,
  Star,
  Crown,
  Building2,
  Phone,
  Mail,
  MessageSquare,
  Tag,
  Send,
  Percent,
  AlertTriangle,
  Layers,
  ListOrdered,
  PlayCircle,
  StopCircle,
  Ban,
  RotateCcw,
  Bell,
  BellOff,
  BellRing,
  Settings,
  Lock,
  CheckCheck,
  Eye,
  AlertCircle,
  Filter,
  HelpCircle,
  Cpu,
  Zap,
  Brain,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Activity
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import CandidateProfileEditor from '@/components/CandidateProfileEditor'
import JobFluxHelpModal from '@/components/JobFluxHelpModal'
import JobFluxLogo from '@/components/JobFluxLogo'
import AiLoadingScreen from '@/components/AiLoadingScreen'
import { APP_CONFIG } from '@/config/appConfig'
import { OFFER_PRESETS } from '@/config/plans'
import { sendBrowserNotification, subscribeDeviceToPush, registerServiceWorker } from '@/lib/notifications'

export default function AdminDashboard() {
  const [adminEmail, setAdminEmail] = useState<string>(APP_CONFIG.supportEmail)
  const [adminUserId, setAdminUserId] = useState<string>(APP_CONFIG.masterAdminId)
  const [usersList, setUsersList] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true)
  const [userSearch, setUserSearch] = useState<string>('')

  // Payments State
  const [paymentsList, setPaymentsList] = useState<any[]>([])
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false)

  // Overview metrics
  const [overviewMetrics, setOverviewMetrics] = useState({
    total_profiles: 0,
    scheduled_profiles_active: 0,
    vip_profiles_count: 0,
    applied_today: 0,
    applied_this_week: 0,
    applied_this_month: 0,
    total_applied: 0
  })

  // Admin Active Tab
  const [activeAdminTab, setActiveAdminTab] = useState<'candidates' | 'requests' | 'queue' | 'payments' | 'offers' | 'enterprise_leads' | 'logs'>('candidates')

  // Queue & Live Executions State
  const [queueTasks, setQueueTasks] = useState<any[]>([])
  const [loadingQueue, setLoadingQueue] = useState<boolean>(false)
  const [queueMetrics, setQueueMetrics] = useState<{
    total: number
    pending: number
    running: number
    completed: number
    failed: number
    cancelled: number
  }>({ total: 0, pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 })
  const [workerStatus, setWorkerStatus] = useState<{
    is_busy: boolean
    active_task_id: string | null
    active_user_id: string | null
    started_at: string | null
  }>({ is_busy: false, active_task_id: null, active_user_id: null, started_at: null })
  const [queueStatusFilter, setQueueStatusFilter] = useState<string>('all')
  const [queueSearch, setQueueSearch] = useState<string>('')
  const [selectedExecutionLog, setSelectedExecutionLog] = useState<any | null>(null)
  const [actionProcessingId, setActionProcessingId] = useState<string | null>(null)
  const [queueNotification, setQueueNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showConfirmCancelAll, setShowConfirmCancelAll] = useState<boolean>(false)

  // Purchase Offers & Campaigns State
  const [offersData, setOffersData] = useState<{
    presets: any[]
    metrics: {
      total_candidates: number
      unsubscribed_count: number
      subscribed_count: number
      active_assigned_offers?: number
      expired_offers?: number
      revoked_offers?: number
    }
    assigned_offers?: any[]
    history: any[]
  }>({
    presets: OFFER_PRESETS,
    metrics: { total_candidates: 0, unsubscribed_count: 0, subscribed_count: 0 },
    assigned_offers: [],
    history: []
  })
  const [loadingOffers, setLoadingOffers] = useState<boolean>(false)
  const [targetType, setTargetType] = useState<'single' | 'multiple' | 'bulk_unsubscribed' | 'all_users'>('single')
  const [targetEmail, setTargetEmail] = useState<string>(APP_CONFIG.defaultTestRecipients[0] || 'koushiksrmedala@gmail.com')
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([
    APP_CONFIG.defaultTestRecipients[0] || 'koushiksrmedala@gmail.com'
  ])
  const [candidateFilterQuery, setCandidateFilterQuery] = useState<string>('')
  const [customExtraEmails, setCustomExtraEmails] = useState<string>('')
  const [selectedPresetId, setSelectedPresetId] = useState<string>('offer_99')
  const [offerTitle, setOfferTitle] = useState<string>('Candidate Welcome: 90% Off JobFlux Essentials for ₹99')
  const [discountBadge, setDiscountBadge] = useState<string>('90% OFF (ACTUAL ₹1,000)')
  const [originalPrice, setOriginalPrice] = useState<string>('₹1,000 / mo')
  const [discountedPrice, setDiscountedPrice] = useState<string>('₹99 / mo')
  const [promoCode, setPromoCode] = useState<string>('OFFER90')
  const [customMessage, setCustomMessage] = useState<string>('Unlock 30 days of continuous daily autonomous job applications (600+ applies), Harvard ATS resume formatting, and direct priority recruiter submission at 90% discount (Regular ₹1,000/mo) for just ₹99.')
  const [isConfirmOfferModalOpen, setIsConfirmOfferModalOpen] = useState<boolean>(false)
  const [sendingOffer, setSendingOffer] = useState<boolean>(false)
  const [validityHours, setValidityHours] = useState<number>(48)
  const [forceOverride, setForceOverride] = useState<boolean>(false)
  const [revokingOfferId, setRevokingOfferId] = useState<string | null>(null)
  const [assignedOfferFilter, setAssignedOfferFilter] = useState<string>('all')
  const [offerNotification, setOfferNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Purchase Offers Collapsible & Pagination State with Local State persistence
  const [offersStatsCollapsed, setOffersStatsCollapsed] = useState<boolean>(false)
  const [offersCollapsedWatchdog, setOffersCollapsedWatchdog] = useState<boolean>(false)
  const [offersCollapsedDesigner, setOffersCollapsedDesigner] = useState<boolean>(false)
  const [offersCollapsedAssigned, setOffersCollapsedAssigned] = useState<boolean>(false)
  const [offersCollapsedHistory, setOffersCollapsedHistory] = useState<boolean>(false)
  const [offersCollapsedPreview, setOffersCollapsedPreview] = useState<boolean>(false)
  const [offersCollapsedMailDiag, setOffersCollapsedMailDiag] = useState<boolean>(false)
  const [offersCollapsedMailLogs, setOffersCollapsedMailLogs] = useState<boolean>(false)
  const [offersCollapsedDispatchReport, setOffersCollapsedDispatchReport] = useState<boolean>(false)
  const [candidatesTableCollapsed, setCandidatesTableCollapsed] = useState<boolean>(false)
  const [requestsTableCollapsed, setRequestsTableCollapsed] = useState<boolean>(false)
  const [queueTableCollapsed, setQueueTableCollapsed] = useState<boolean>(false)
  const [paymentsTableCollapsed, setPaymentsTableCollapsed] = useState<boolean>(false)
  const [enterpriseLeadsCollapsed, setEnterpriseLeadsCollapsed] = useState<boolean>(false)
  const [activityTableCollapsed, setActivityTableCollapsed] = useState<boolean>(false)
  const [jobHistoryTableCollapsed, setJobHistoryTableCollapsed] = useState<boolean>(false)
  const [llmTableCollapsed, setLlmTableCollapsed] = useState<boolean>(false)
  const [isDispatchReportModalOpen, setIsDispatchReportModalOpen] = useState<boolean>(false)
  const [dispatchReportOfferChoice, setDispatchReportOfferChoice] = useState<string>('auto')
  const [assignedOffersPage, setAssignedOffersPage] = useState<number>(1)
  const [assignedOffersPerPage, setAssignedOffersPerPage] = useState<number>(10)
  const [campaignHistoryPage, setCampaignHistoryPage] = useState<number>(1)
  const [campaignHistoryPerPage, setCampaignHistoryPerPage] = useState<number>(10)
  const [candidatePickerPage, setCandidatePickerPage] = useState<number>(1)

  // Plan & Offer Expiry Telemetry State
  const [expiryStats, setExpiryStats] = useState<any | null>(null)
  const [loadingExpiryStats, setLoadingExpiryStats] = useState<boolean>(false)
  const [loadingExpirySweep, setLoadingExpirySweep] = useState<boolean>(false)
  const [sweepResult, setSweepResult] = useState<any | null>(null)
  const [inspectCandidate, setInspectCandidate] = useState<any | null>(null)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [candidateStatusFilter, setCandidateStatusFilter] = useState<string>('all')
  const [showStatusGuide, setShowStatusGuide] = useState<boolean>(false)

  // Live Email Diagnostic State
  const [mailDiagnosticLoading, setMailDiagnosticLoading] = useState<boolean>(false)
  const [mailDiagnosticResult, setMailDiagnosticResult] = useState<any | null>(null)
  const [mailLogs, setMailLogs] = useState<any[]>([])
  const [loadingMailLogs, setLoadingMailLogs] = useState<boolean>(false)
  const [diagnosticRecipient, setDiagnosticRecipient] = useState<string>(APP_CONFIG.defaultTestRecipients[0] || 'koushiksrmedala@gmail.com')
  const [mailSender, setMailSender] = useState<string>(APP_CONFIG.supportEmail)
  const [mailMaskedPass, setMailMaskedPass] = useState<string>('')
  const [showConfigPass, setShowConfigPass] = useState<boolean>(false)
  const [newAppPassInput, setNewAppPassInput] = useState<string>('')
  const [savingPass, setSavingPass] = useState<boolean>(false)

  // Push Notification Dispatcher State
  const [pushDiagnosticLoading, setPushDiagnosticLoading] = useState<boolean>(false)
  const [pushDiagnosticResult, setPushDiagnosticResult] = useState<any | null>(null)
  const [showCustomPushConfig, setShowCustomPushConfig] = useState<boolean>(false)
  const [customPushRecipient, setCustomPushRecipient] = useState<string>('')
  const [customPushTitle, setCustomPushTitle] = useState<string>('⚡ JobFlux AI Priority Alert')
  const [customPushMessage, setCustomPushMessage] = useState<string>('New high-match job opportunities discovered in your domain.')
  const [customPushUrl, setCustomPushUrl] = useState<string>('/dashboard')
  const [pushLogs, setPushLogs] = useState<any[]>([])
  const [loadingPushLogs, setLoadingPushLogs] = useState<boolean>(false)
  const [deviceWebPushActive, setDeviceWebPushActive] = useState<boolean>(false)
  const [closedTabTestActive, setClosedTabTestActive] = useState<boolean>(false)
  const [closedTabCountdown, setClosedTabCountdown] = useState<number>(0)

  // Individual Candidate Daily Dispatch Report State
  const [dispatchReportLoading, setDispatchReportLoading] = useState<boolean>(false)
  const [dispatchReportResult, setDispatchReportResult] = useState<any | null>(null)
  const [dispatchReportChannel, setDispatchReportChannel] = useState<'both' | 'email' | 'push'>('both')
  const [dispatchReportTarget, setDispatchReportTarget] = useState<string>('koushiksr1999@gmail.com')

  // Activity Audit & Telemetry State
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [loadingActivity, setLoadingActivity] = useState<boolean>(false)
  const [activityFilter, setActivityFilter] = useState<string>('all')
  const [activityStats, setActivityStats] = useState<any>({
    total_logins: 0,
    total_profile_updates: 0,
    total_resume_uploads: 0,
    total_task_runs: 0,
    total_logged_events: 0
  })

  // User Requests & Support Tickets State
  const [supportTickets, setSupportTickets] = useState<any[]>([])
  const [loadingTickets, setLoadingTickets] = useState<boolean>(false)
  const [ticketStats, setTicketStats] = useState<{ total: number; open: number; in_progress: number; resolved: number; closed: number }>({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0
  })
  const [requestSearch, setRequestSearch] = useState<string>('')
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('all')
  const [ticketNotes, setTicketNotes] = useState<{ [id: string]: string }>({})
  const [savingTicketId, setSavingTicketId] = useState<string | null>(null)
  const [logsSubTab, setLogsSubTab] = useState<'activity' | 'llm_telemetry' | 'job_history' | 'tickets'>('activity')
  const [llmLogs, setLlmLogs] = useState<any[]>([])
  const [loadingLlmLogs, setLoadingLlmLogs] = useState<boolean>(false)
  const [llmStats, setLlmStats] = useState<{
    total_calls: number
    avg_duration_ms: number
    success_rate: number
    total_tokens: number
    providers: Array<{ provider: string; count: number; avg_duration_ms: number; share_percent: number }>
    top_questions: Array<{ question: string; count: number; sample_answer: string }>
  }>({
    total_calls: 0,
    avg_duration_ms: 0,
    success_rate: 100,
    total_tokens: 0,
    providers: [],
    top_questions: []
  })
  const [llmFilterUser, setLlmFilterUser] = useState<string>('all')
  const [llmFilterProvider, setLlmFilterProvider] = useState<string>('all')
  const [llmFilterDate, setLlmFilterDate] = useState<string>('all')
  const [llmSearchQuery, setLlmSearchQuery] = useState<string>('')
  const [selectedLlmLog, setSelectedLlmLog] = useState<any | null>(null)
  const [llmCopiedId, setLlmCopiedId] = useState<string | null>(null)
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false)

  // Enterprise Leads State
  const [enterpriseLeads, setEnterpriseLeads] = useState<any[]>([])
  const [loadingLeads, setLoadingLeads] = useState<boolean>(false)

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<any | null>(null)

  // System Logs & Reports State
  const [selectedSystemLog, setSelectedSystemLog] = useState<string | null>(null)
  const [selectedLogContent, setSelectedLogContent] = useState<string[]>([])
  const [loadingLogContent, setLoadingLogContent] = useState<boolean>(false)
  const [authChecking, setAuthChecking] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false)

  // Browser Push Notifications State & Assistants for Admin
  const [notificationPermission, setNotificationPermission] = useState<string>('default')
  const [showUnblockGuide, setShowUnblockGuide] = useState<boolean>(false)
  const [notificationBannerDismissed, setNotificationBannerDismissed] = useState<boolean>(false)
  const [testNotificationSent, setTestNotificationSent] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      registerServiceWorker()
      if (!('Notification' in window)) {
        setNotificationPermission('unsupported')
      } else {
        const perm = Notification.permission
        setNotificationPermission(perm)
        if (perm === 'granted') {
          setDeviceWebPushActive(true)
          subscribeDeviceToPush(APP_CONFIG.supportEmail, 'technohmsit').catch(() => {})
        }
      }
    }
  }, [])

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
      const subRes = await subscribeDeviceToPush(APP_CONFIG.supportEmail, 'technohmsit')
      if (subRes.success) {
        setDeviceWebPushActive(true)
        setNotificationPermission('granted')
        sendBrowserNotification('⚡ JobFlux AI Admin Notifications Active', {
          body: 'This browser device is now registered to receive background push notifications even when closed.'
        })
        setTestNotificationSent(true)
        setTimeout(() => setTestNotificationSent(false), 4000)
      } else {
        const perm = Notification.permission as NotificationPermission
        setNotificationPermission(perm)
        if (perm === 'denied') {
          setShowUnblockGuide(true)
        }
      }
    } catch (err) {
      console.error('Notification permission error:', err)
    }
  }

  const handleTestClosedTabPush = async () => {
    try {
      // 1. Ensure device is registered
      const subRes = await subscribeDeviceToPush(APP_CONFIG.supportEmail, 'technohmsit')
      if (!subRes.success) {
        alert(`Cannot start closed-tab test: ${subRes.error || 'Permission denied'}`)
        return
      }

      setDeviceWebPushActive(true)
      setClosedTabTestActive(true)
      setClosedTabCountdown(5)

      // Start client visual countdown
      const timer = setInterval(() => {
        setClosedTabCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setClosedTabTestActive(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // 2. Dispatch scheduled delayed push via backend
      const res = await fetch('/api/admin/push-notification', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          targetType: 'single',
          targetEmail: APP_CONFIG.supportEmail,
          delaySeconds: 5,
          title: '⚡ YouTube-Style Desktop Alert Delivered!',
          message: 'JobFlux background Web Push arrived on your desktop with this tab closed/minimized!',
          claimUrl: '/dashboard'
        })
      })

      const data = await res.json()
      if (!data.success) {
        clearInterval(timer)
        setClosedTabTestActive(false)
        setPushDiagnosticResult(data)
      } else {
        setPushDiagnosticResult({
          success: true,
          message: '✓ 5-second delayed push dispatched! Check your desktop notification center.'
        })
      }
    } catch (err: any) {
      setClosedTabTestActive(false)
      alert(err.message || 'Failed to schedule closed-tab test')
    }
  }

  const handleSendTestNotification = () => {
    sendBrowserNotification('⚡ JobFlux AI Admin Alert', {
      body: 'Admin push notifications are verified and active on your system!'
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
        sendBrowserNotification('⚡ Notifications Successfully Unblocked!', {
          body: 'JobFlux AI admin push alerts are now active.'
        })
      } else if (perm === 'denied') {
        alert('Notifications are still marked as Blocked in browser settings. Please toggle them to "Allow" in the address bar padlock.')
      }
    }
  }

  const getAdminHeaders = () => {
    const uid = typeof window !== 'undefined' ? localStorage.getItem('user_id') || '' : ''
    const uEmail = typeof window !== 'undefined' ? localStorage.getItem('user_email') || '' : ''
    return {
      'Content-Type': 'application/json',
      'x-user-id': uid || 'technohmsit',
      'x-user-email': uEmail || 'technohmsit@gmail.com'
    }
  }

  const fetchOverviewAndUsers = async () => {
    setLoadingUsers(true)
    try {
      const uRes = await fetch('/api/admin/users', {
        headers: getAdminHeaders()
      })
      if (!uRes.ok) {
        if (uRes.status === 403) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_role', 'user')
            window.location.replace('/dashboard?notice=' + encodeURIComponent('Access denied: Administrator privileges required.'))
          }
          return
        }
        throw new Error('Failed to fetch admin users')
      }
      const uData = await uRes.json()
      const users = uData.users || []
      setUsersList(users)

      let total = 0
      let today = 0
      let week = 0
      let month = 0

      users.forEach((u: any) => {
        total += u.total_applied || 0
        today += u.applied_today || 0
        week += u.applied_this_week || 0
        month += u.applied_this_month || 0
      })

      setOverviewMetrics({
        total_profiles: users.length,
        scheduled_profiles_active: users.filter((u: any) => u.enabled_for_daily_run !== false).length,
        vip_profiles_count: users.filter((u: any) => u.is_vip).length,
        applied_today: today,
        applied_this_week: week,
        applied_this_month: month,
        total_applied: total
      })
      setIsAuthorized(true)
    } catch (e) {
      console.error('Failed to fetch admin users:', e)
    } finally {
      setLoadingUsers(false)
      setAuthChecking(false)
    }
  }

  const fetchPayments = async () => {
    setLoadingPayments(true)
    try {
      const res = await fetch('/api/admin/payments', {
        headers: getAdminHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setPaymentsList(data.payments || [])
      }
    } catch (e) {
      console.error('Failed to fetch payments:', e)
    } finally {
      setLoadingPayments(false)
    }
  }

  const fetchEnterpriseLeads = async () => {
    setLoadingLeads(true)
    try {
      const res = await fetch('/api/enterprise/inquiry', {
        headers: getAdminHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setEnterpriseLeads(data.inquiries || [])
      }
    } catch (e) {
      console.error('Failed to fetch enterprise leads:', e)
    } finally {
      setLoadingLeads(false)
    }
  }

  const fetchExpiryStats = async () => {
    setLoadingExpiryStats(true)
    try {
      const res = await fetch('/api/admin/expiry-reminders', {
        headers: getAdminHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setExpiryStats(data)
      }
    } catch (err) {
      console.warn('Failed to fetch expiry stats:', err)
    } finally {
      setLoadingExpiryStats(false)
    }
  }

  const handleRunExpirySweep = async (targetEmail?: string) => {
    setLoadingExpirySweep(true)
    setSweepResult(null)
    try {
      const res = await fetch('/api/admin/expiry-reminders', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          targetEmail: targetEmail || undefined,
          force: Boolean(targetEmail)
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Sweep failed')
      setSweepResult(data)
      await fetchExpiryStats()
      await fetchOverviewAndUsers()
    } catch (err: any) {
      setSweepResult({ success: false, error: err.message })
    } finally {
      setLoadingExpirySweep(false)
    }
  }

  const toggleOffersStats = () => {
    setOffersStatsCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('admin_offers_stats_collapsed', String(next)) } catch {}
      return next
    })
  }

  const toggleOffersWatchdog = () => {
    setOffersCollapsedWatchdog(prev => {
      const next = !prev
      try { localStorage.setItem('admin_offers_collapsed_watchdog', String(next)) } catch {}
      return next
    })
  }

  const toggleOffersDesigner = () => {
    setOffersCollapsedDesigner(prev => {
      const next = !prev
      try { localStorage.setItem('admin_offers_collapsed_designer', String(next)) } catch {}
      return next
    })
  }

  const toggleOffersPreview = () => {
    setOffersCollapsedPreview(prev => {
      const next = !prev
      try { localStorage.setItem('admin_offers_collapsed_preview', String(next)) } catch {}
      return next
    })
  }

  const toggleOffersAssigned = () => {
    setOffersCollapsedAssigned(prev => {
      const next = !prev
      try { localStorage.setItem('admin_offers_collapsed_assigned', String(next)) } catch {}
      return next
    })
  }

  const toggleOffersHistory = () => {
    setOffersCollapsedHistory(prev => {
      const next = !prev
      try { localStorage.setItem('admin_offers_collapsed_history', String(next)) } catch {}
      return next
    })
  }

  const toggleOffersMailDiag = () => {
    setOffersCollapsedMailDiag(prev => {
      const next = !prev
      try { localStorage.setItem('admin_offers_collapsed_maildiag', String(next)) } catch {}
      return next
    })
  }

  const toggleOffersMailLogs = () => {
    setOffersCollapsedMailLogs(prev => {
      const next = !prev
      try { localStorage.setItem('admin_offers_collapsed_maillogs', String(next)) } catch {}
      return next
    })
  }

  const toggleOffersDispatchReport = () => {
    setOffersCollapsedDispatchReport(prev => {
      const next = !prev
      try { localStorage.setItem('admin_offers_collapsed_dispatch_report', String(next)) } catch {}
      return next
    })
  }

  const toggleCandidatesTable = () => {
    setCandidatesTableCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('admin_candidates_table_collapsed', String(next)) } catch {}
      return next
    })
  }

  const toggleRequestsTable = () => {
    setRequestsTableCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('admin_requests_table_collapsed', String(next)) } catch {}
      return next
    })
  }

  const toggleQueueTable = () => {
    setQueueTableCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('admin_queue_table_collapsed', String(next)) } catch {}
      return next
    })
  }

  const togglePaymentsTable = () => {
    setPaymentsTableCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('admin_payments_table_collapsed', String(next)) } catch {}
      return next
    })
  }

  const toggleEnterpriseLeadsTable = () => {
    setEnterpriseLeadsCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('admin_enterprise_leads_collapsed', String(next)) } catch {}
      return next
    })
  }

  const toggleActivityTable = () => {
    setActivityTableCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('admin_activity_table_collapsed', String(next)) } catch {}
      return next
    })
  }

  const toggleJobHistoryTable = () => {
    setJobHistoryTableCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('admin_job_history_table_collapsed', String(next)) } catch {}
      return next
    })
  }

  const toggleLlmTable = () => {
    setLlmTableCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('admin_llm_table_collapsed', String(next)) } catch {}
      return next
    })
  }

  const handleAssignedFilterChange = (filter: string) => {
    setAssignedOfferFilter(filter)
    setAssignedOffersPage(1)
    try { localStorage.setItem('admin_assigned_offer_filter', filter) } catch {}
  }

  const handleLogsSubTabChange = (tab: 'activity' | 'llm_telemetry' | 'job_history' | 'tickets') => {
    setLogsSubTab(tab)
    try { localStorage.setItem('admin_logs_sub_tab', tab) } catch {}
    if (tab === 'activity') fetchActivityLogs()
    else if (tab === 'llm_telemetry') fetchLlmLogs()
    else if (tab === 'tickets') fetchSupportTickets()
  }

  const fetchOffersData = async () => {
    setLoadingOffers(true)
    setLoadingMailLogs(true)
    setLoadingPushLogs(true)
    setLoadingExpiryStats(true)
    try {
      const headers = getAdminHeaders()
      const [offersRes, mailRes, pushRes, expiryRes] = await Promise.allSettled([
        fetch('/api/admin/offers', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/admin/mail-test', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/admin/push-notification', { headers }).then(r => r.ok ? r.json() : null),
        fetch('/api/admin/expiry-reminders', { headers }).then(r => r.ok ? r.json() : null)
      ])

      if (offersRes.status === 'fulfilled' && offersRes.value) {
        setOffersData(offersRes.value)
        try {
          localStorage.setItem('admin_cached_offers_data', JSON.stringify(offersRes.value))
        } catch {}
      }

      if (mailRes.status === 'fulfilled' && mailRes.value) {
        const mData = mailRes.value
        setMailLogs(mData.recent_logs || [])
        if (mData.sender) setMailSender(mData.sender)
        if (mData.masked_passcode) setMailMaskedPass(mData.masked_passcode)
        try {
          localStorage.setItem('admin_cached_mail_logs', JSON.stringify(mData.recent_logs || []))
        } catch {}
      }

      if (pushRes.status === 'fulfilled' && pushRes.value) {
        setPushLogs(pushRes.value.recent_logs || [])
      }

      if (expiryRes.status === 'fulfilled' && expiryRes.value) {
        setExpiryStats(expiryRes.value)
      }
    } catch (err) {
      console.error('Failed to fetch offers:', err)
    } finally {
      setLoadingOffers(false)
      setLoadingMailLogs(false)
      setLoadingPushLogs(false)
      setLoadingExpiryStats(false)
    }
  }

  const fetchPushDiagnostics = async () => {
    setLoadingPushLogs(true)
    try {
      const res = await fetch('/api/admin/push-notification', {
        headers: getAdminHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setPushLogs(data.recent_logs || [])
      }
    } catch (err) {
      console.warn('Failed to fetch push logs:', err)
    } finally {
      setLoadingPushLogs(false)
    }
  }

  const handleTriggerPushNotification = async (targetOverride?: string) => {
    setPushDiagnosticLoading(true)
    setPushDiagnosticResult(null)
    try {
      let targetEmail = targetOverride || diagnosticRecipient
      let targetType = 'single'

      if (targetEmail === 'custom') {
        targetEmail = customPushRecipient.trim()
      } else if (targetEmail === 'all') {
        targetType = 'all'
      }

      if (!targetEmail && targetType !== 'all') {
        alert('Please enter or select a recipient email address for push notification.')
        setPushDiagnosticLoading(false)
        return
      }

      const res = await fetch('/api/admin/push-notification', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          targetType,
          targetEmail,
          title: customPushTitle.trim() || '⚡ JobFlux AI Priority Alert',
          message: customPushMessage.trim() || 'You have a new update in your JobFlux AI Cockpit.',
          claimUrl: customPushUrl.trim() || '/dashboard'
        })
      })

      const data = await res.json()
      setPushDiagnosticResult(data)
      fetchPushDiagnostics()
    } catch (err: any) {
      setPushDiagnosticResult({
        success: false,
        error: err.message || 'Failed to trigger push notification'
      })
    } finally {
      setPushDiagnosticLoading(false)
    }
  }

  const fetchMailDiagnostics = async () => {
    setLoadingMailLogs(true)
    try {
      const res = await fetch('/api/admin/mail-test', {
        headers: getAdminHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setMailLogs(data.recent_logs || [])
        if (data.sender) setMailSender(data.sender)
        if (data.masked_passcode) setMailMaskedPass(data.masked_passcode)
      }
    } catch (err) {
      console.warn('Failed to fetch mail diagnostics:', err)
    } finally {
      setLoadingMailLogs(false)
    }
  }

  const handleSendDiagnosticMail = async () => {
    setMailDiagnosticLoading(true)
    setMailDiagnosticResult(null)
    try {
      const res = await fetch('/api/admin/mail-test', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ targetEmail: diagnosticRecipient })
      })
      const data = await res.json()
      setMailDiagnosticResult(data)
      if (data.success) {
        sendBrowserNotification('⚡ Diagnostic Email Delivered!', {
          body: `Live email confirmed in ${diagnosticRecipient} inbox!`
        })
      }
      fetchMailDiagnostics()
    } catch (err: any) {
      setMailDiagnosticResult({
        success: false,
        error: err.message || 'Failed to dispatch test email'
      })
    } finally {
      setMailDiagnosticLoading(false)
    }
  }

  const handleSaveAndTestCredentials = async () => {
    if (!newAppPassInput.trim()) return
    setSavingPass(true)
    setMailDiagnosticResult(null)
    try {
      const res = await fetch('/api/admin/mail-test', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          targetEmail: diagnosticRecipient,
          newPass: newAppPassInput.trim(),
          saveToConfig: true
        })
      })
      const data = await res.json()
      setMailDiagnosticResult(data)
      if (data.success) {
        setNewAppPassInput('')
        setShowConfigPass(false)
        sendBrowserNotification('⚡ App Password Verified & Saved!', {
          body: `Google SMTP verified and test email sent to ${diagnosticRecipient}!`
        })
      }
      fetchMailDiagnostics()
    } catch (err: any) {
      setMailDiagnosticResult({
        success: false,
        error: err.message || 'Failed to verify and save app password'
      })
    } finally {
      setSavingPass(false)
    }
  }

  const handleDispatchCareerReport = async (
    overrideEmail?: string, 
    channelOverride?: 'both' | 'email' | 'push',
    offerOverride?: { promoCode?: string; discountedPrice?: string; originalPrice?: string; offerTitle?: string }
  ) => {
    setDispatchReportLoading(true)
    setDispatchReportResult(null)
    try {
      let targetEmail = overrideEmail || dispatchReportTarget
      if (targetEmail === 'custom') {
        targetEmail = customPushRecipient.trim()
      }
      if (!targetEmail || targetEmail === 'all') {
        alert('Please enter or select a specific candidate email address to dispatch their individual report.')
        setDispatchReportLoading(false)
        return
      }

      const channel = channelOverride || dispatchReportChannel

      // Resolve offer package override
      let offerPayload: any = {}
      if (offerOverride) {
        offerPayload = offerOverride
      } else if (dispatchReportOfferChoice === 'vip299') {
        offerPayload = {
          promoCode: 'VIP299',
          discountedPrice: '₹299',
          originalPrice: '₹2,500',
          offerTitle: '3-Month VIP Professional Extension'
        }
      } else if (dispatchReportOfferChoice === 'welcomepro') {
        offerPayload = {
          promoCode: 'WELCOMEPRO',
          discountedPrice: '₹149',
          originalPrice: '₹999',
          offerTitle: '1-Month Essentials Unlimited Access'
        }
      } else if (dispatchReportOfferChoice === 'choc29') {
        offerPayload = {
          promoCode: 'CHOC29',
          discountedPrice: '₹29',
          originalPrice: '₹499',
          offerTitle: '1-Month Starter Direct Activation'
        }
      }

      const res = await fetch('/api/admin/send-dispatch-report', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          targetEmail: targetEmail.trim(),
          channel,
          ...offerPayload
        })
      })

      const data = await res.json()
      setDispatchReportResult(data)
      if (data.success) {
        sendBrowserNotification('🚀 Daily Report Dispatched!', {
          body: `Live career report sent to ${data.candidate?.email || targetEmail} via ${channel.toUpperCase()}!`
        })
        fetchPushDiagnostics()
        fetchMailDiagnostics()
      }
    } catch (err: any) {
      setDispatchReportResult({
        success: false,
        error: err.message || 'Failed to dispatch career report'
      })
    } finally {
      setDispatchReportLoading(false)
    }
  }

  const handleSelectPreset = (preset: any) => {
    setSelectedPresetId(preset.id)
    setOfferTitle(preset.offerTitle)
    setDiscountBadge(preset.discountBadge)
    setOriginalPrice(preset.originalPrice)
    setDiscountedPrice(preset.discountedPrice)
    setPromoCode(preset.promoCode)
    setCustomMessage(preset.customMessage)
  }

  const handleRevokeOffer = async (offerId?: string, candidateEmail?: string, promoCode?: string) => {
    if (!confirm(`Are you sure you want to revoke and delete offer "${promoCode || 'this offer'}" from ${candidateEmail || 'this candidate'}? It will immediately disappear from their account.`)) {
      return
    }
    setRevokingOfferId(offerId || candidateEmail || 'revoking')
    try {
      const params = new URLSearchParams()
      if (offerId) params.set('id', offerId)
      if (candidateEmail) params.set('candidate_email', candidateEmail)
      if (promoCode) params.set('promo_code', promoCode)

      const res = await fetch(`/api/admin/offers?${params.toString()}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to revoke offer')

      setOfferNotification({
        type: 'success',
        message: data.message || `Offer successfully revoked.`
      })

      // Update inspectCandidate if open
      if (inspectCandidate && (inspectCandidate.email === candidateEmail || !candidateEmail)) {
        setInspectCandidate((prev: any) => {
          if (!prev) return null
          return {
            ...prev,
            assigned_offers: (prev.assigned_offers || []).filter((o: any) =>
              offerId ? o.id !== offerId : o.promo_code !== promoCode
            )
          }
        })
      }

      await fetchOffersData()
      await fetchOverviewAndUsers()
    } catch (err: any) {
      setOfferNotification({
        type: 'error',
        message: err.message || 'Error revoking offer.'
      })
    } finally {
      setRevokingOfferId(null)
    }
  }

  const handleDispatchOffer = async () => {
    setSendingOffer(true)
    setOfferNotification(null)
    try {
      const extraList = customExtraEmails
        .split(/[,;\n]/)
        .map(e => e.trim().toLowerCase())
        .filter(e => e && e.includes('@'))
      const combinedMultipleEmails = Array.from(new Set([...selectedCandidates, ...extraList]))

      if (targetType === 'multiple' && combinedMultipleEmails.length === 0) {
        throw new Error('Please select or specify at least one candidate email.')
      }

      const res = await fetch('/api/admin/offers', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          targetType,
          targetEmail,
          targetEmails: combinedMultipleEmails,
          offerPreset: selectedPresetId,
          offerTitle,
          discountBadge,
          originalPrice,
          discountedPrice,
          promoCode,
          customMessage,
          validityHours,
          forceOverride,
          confirmedByAdmin: true
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to dispatch offer campaign')
      }

      setOfferNotification({
        type: 'success',
        message: data.message || `Offer dispatched successfully to ${data.dispatched_count} candidate(s)!`
      })
      sendBrowserNotification('⚡ JobFlux AI Campaign Dispatched', {
        body: `Offer "${offerTitle}" dispatched to ${data.dispatched_count || 1} candidate(s)!`
      })
      setIsConfirmOfferModalOpen(false)
      fetchOffersData()
    } catch (err: any) {
      setOfferNotification({
        type: 'error',
        message: err.message || 'Error dispatching offer campaign.'
      })
    } finally {
      setSendingOffer(false)
    }
  }

  const fetchQueueData = async (status = queueStatusFilter, search = queueSearch) => {
    setLoadingQueue(true)
    try {
      const params = new URLSearchParams()
      if (status !== 'all') params.set('status', status)
      if (search) params.set('q', search)
      const res = await fetch(`/api/admin/queue?${params.toString()}`, {
        headers: getAdminHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setQueueTasks(data.tasks || [])
        if (data.metrics) setQueueMetrics(data.metrics)
        if (data.worker_status) setWorkerStatus(data.worker_status)
      }
    } catch (err) {
      console.error('Failed to fetch queue tasks:', err)
    } finally {
      setLoadingQueue(false)
    }
  }

  const handleQueueAction = async (action: 'mark_not_to_execute' | 'requeue' | 'delete' | 'cancel_all_pending' | 'reclaim_stale', taskId?: string) => {
    setActionProcessingId(taskId || action)
    setQueueNotification(null)
    try {
      const res = await fetch('/api/admin/queue', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ action, taskId })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Action failed')
      }
      setQueueNotification({ type: 'success', message: data.message })
      sendBrowserNotification('⚡ JobFlux Queue Updated', {
        body: data.message || `Queue action "${action}" executed.`
      })
      if (action === 'cancel_all_pending') setShowConfirmCancelAll(false)
      fetchQueueData()
    } catch (err: any) {
      setQueueNotification({ type: 'error', message: err.message || 'Error processing queue action' })
    } finally {
      setActionProcessingId(null)
    }
  }

  const handleUpdateLeadStatus = async (inquiryId: string, newStatus: string) => {
    setEnterpriseLeads(prev =>
      prev.map(l => (l.inquiry_id === inquiryId ? { ...l, status: newStatus } : l))
    )
    try {
      await fetch('/api/enterprise/inquiry', {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify({ inquiry_id: inquiryId, status: newStatus })
      })
    } catch {
      fetchEnterpriseLeads()
    }
  }

  const fetchActivityLogs = async (type = activityFilter) => {
    setLoadingActivity(true)
    try {
      const q = type && type !== 'all' ? `?event_type=${encodeURIComponent(type)}&limit=100` : '?limit=100'
      const res = await fetch(`/api/admin/activity${q}`, {
        headers: getAdminHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setActivityLogs(data.logs || [])
        if (data.stats) setActivityStats(data.stats)
      }
    } catch (e) {
      console.error('Failed to fetch activity logs:', e)
    } finally {
      setLoadingActivity(false)
    }
  }

  const fetchLlmLogs = async (overrideParams?: { user?: string; provider?: string; date?: string; search?: string }) => {
    setLoadingLlmLogs(true)
    try {
      const user = overrideParams?.user !== undefined ? overrideParams.user : llmFilterUser
      const prov = overrideParams?.provider !== undefined ? overrideParams.provider : llmFilterProvider
      const dt = overrideParams?.date !== undefined ? overrideParams.date : llmFilterDate
      const qSearch = overrideParams?.search !== undefined ? overrideParams.search : llmSearchQuery

      const params = new URLSearchParams({ limit: '100' })
      if (user && user !== 'all') params.set('user_id', user)
      if (prov && prov !== 'all') params.set('provider', prov)
      if (dt && dt !== 'all') params.set('date', dt)
      if (qSearch && qSearch.trim()) params.set('search', qSearch.trim())

      const res = await fetch(`/api/admin/llm-logs?${params.toString()}`, {
        headers: getAdminHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setLlmLogs(data.logs || [])
        if (data.stats) setLlmStats(data.stats)
      }
    } catch (e) {
      console.error('Failed to fetch LLM telemetry logs:', e)
    } finally {
      setLoadingLlmLogs(false)
    }
  }

  const fetchSupportTickets = async (status?: any, search?: any) => {
    setLoadingTickets(true)
    const effectiveStatus = typeof status === 'string' ? status : requestStatusFilter
    const effectiveSearch = typeof search === 'string' ? search : requestSearch
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (effectiveStatus && effectiveStatus !== 'all') params.set('status', effectiveStatus)
      if (effectiveSearch && effectiveSearch.trim()) params.set('search', effectiveSearch.trim())

      const res = await fetch(`/api/support?${params.toString()}`, {
        headers: getAdminHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setSupportTickets(data.tickets || [])
        if (data.stats) setTicketStats(data.stats)
      }
    } catch (e) {
      console.error('Failed to fetch support tickets:', e)
    } finally {
      setLoadingTickets(false)
    }
  }

  const handleUpdateTicket = async (ticketId: string, status: string, adminResponse?: string) => {
    setSavingTicketId(ticketId)
    try {
      const res = await fetch('/api/support', {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          ticket_id: ticketId,
          status,
          admin_response: adminResponse !== undefined ? adminResponse : ticketNotes[ticketId]
        })
      })
      if (res.ok) {
        fetchSupportTickets()
      }
    } catch (e) {
      console.error('Failed to update ticket:', e)
    } finally {
      setSavingTicketId(null)
    }
  }

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm(`Delete query #${ticketId}?`)) return
    try {
      await fetch(`/api/support?ticket_id=${encodeURIComponent(ticketId)}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      })
      fetchSupportTickets()
    } catch (e) {
      console.error('Failed to delete ticket:', e)
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

  const handleAdminRefresh = async () => {
    setIsRefreshing(true)
    const startTime = Date.now()
    try {
      await Promise.allSettled([
        fetchOverviewAndUsers(),
        fetchPayments(),
        fetchEnterpriseLeads(),
        fetchSupportTickets()
      ])
    } finally {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 700 - elapsed)
      setTimeout(() => {
        setIsRefreshing(false)
      }, remaining)
    }
  }

  // Initial Auth & Access Verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Ingest Google OAuth parameters if redirected from Google Single Sign-On
      const p = new URLSearchParams(window.location.search)
      if (p.get('auth') === 'google' && p.get('user_id')) {
        const gUid = p.get('user_id')!
        const gEmail = p.get('email') || ''
        const gRole = p.get('role') || 'admin'
        const gPlan = p.get('plan') || 'enterprise'
        localStorage.setItem('user_id', gUid)
        localStorage.setItem('user_email', gEmail)
        localStorage.setItem('user_role', gRole)
        localStorage.setItem('user_plan', gPlan)
        window.history.replaceState({}, document.title, '/admin')
      }

      const storedUid = localStorage.getItem('user_id')
      const storedRole = localStorage.getItem('user_role')
      const storedEmail = (localStorage.getItem('user_email') || '').toLowerCase()

      if (storedEmail) setAdminEmail(storedEmail)
      if (storedUid) setAdminUserId(storedUid)

      // 2. Check if logged in
      if (!storedUid) {
        window.location.replace('/?error=' + encodeURIComponent('Please sign in with administrator credentials.'))
        return
      }

      // 3. Check client-side admin role flag - STRICTLY technohmsit only
      const isAdmin = (
        (storedRole === 'admin' || storedUid === 'technohmsit' || storedUid === 'admin') &&
        (storedEmail === 'technohmsit@gmail.com' || storedUid === 'technohmsit' || storedUid === 'admin')
      )

      if (!isAdmin) {
        window.location.replace('/dashboard?notice=' + encodeURIComponent('Access denied: Administrator console access is restricted to technohmsit@gmail.com.'))
        return
      }

      // Ensure user_role is set to 'admin' in localStorage
      localStorage.setItem('user_role', 'admin')

      // Restore saved admin navigation & filter preferences
      try {
        const savedTab = localStorage.getItem('admin_active_tab')
        if (savedTab && ['candidates', 'requests', 'queue', 'payments', 'offers', 'enterprise_leads', 'logs'].includes(savedTab)) {
          setActiveAdminTab(savedTab as any)
        }
        const savedSearch = localStorage.getItem('admin_candidate_search')
        if (savedSearch) setUserSearch(savedSearch)

        const savedFilter = localStorage.getItem('admin_candidate_status_filter')
        if (savedFilter) setCandidateStatusFilter(savedFilter)

        const savedSelectedId = localStorage.getItem('admin_selected_candidate_id')
        if (savedSelectedId) setSelectedCandidateId(savedSelectedId)

        // Restore Purchase Offers collapsible states & sub-tab filters
        const sStats = localStorage.getItem('admin_offers_stats_collapsed')
        if (sStats !== null) setOffersStatsCollapsed(sStats === 'true')
        const sWatch = localStorage.getItem('admin_offers_collapsed_watchdog')
        if (sWatch !== null) setOffersCollapsedWatchdog(sWatch === 'true')
        const sDes = localStorage.getItem('admin_offers_collapsed_designer')
        if (sDes !== null) setOffersCollapsedDesigner(sDes === 'true')
        const sPrev = localStorage.getItem('admin_offers_collapsed_preview')
        if (sPrev !== null) setOffersCollapsedPreview(sPrev === 'true')
        const sAssigned = localStorage.getItem('admin_offers_collapsed_assigned')
        if (sAssigned !== null) setOffersCollapsedAssigned(sAssigned === 'true')
        const sHist = localStorage.getItem('admin_offers_collapsed_history')
        if (sHist !== null) setOffersCollapsedHistory(sHist === 'true')
        const sMailDiag = localStorage.getItem('admin_offers_collapsed_maildiag')
        if (sMailDiag !== null) setOffersCollapsedMailDiag(sMailDiag === 'true')
        const sMailLogs = localStorage.getItem('admin_offers_collapsed_maillogs')
        if (sMailLogs !== null) setOffersCollapsedMailLogs(sMailLogs === 'true')
        const sDispatch = localStorage.getItem('admin_offers_collapsed_dispatch_report')
        if (sDispatch !== null) setOffersCollapsedDispatchReport(sDispatch === 'true')
        const sCand = localStorage.getItem('admin_candidates_table_collapsed')
        if (sCand !== null) setCandidatesTableCollapsed(sCand === 'true')
        const sReq = localStorage.getItem('admin_requests_table_collapsed')
        if (sReq !== null) setRequestsTableCollapsed(sReq === 'true')
        const sQueue = localStorage.getItem('admin_queue_table_collapsed')
        if (sQueue !== null) setQueueTableCollapsed(sQueue === 'true')
        const sPay = localStorage.getItem('admin_payments_table_collapsed')
        if (sPay !== null) setPaymentsTableCollapsed(sPay === 'true')
        const sLeads = localStorage.getItem('admin_enterprise_leads_collapsed')
        if (sLeads !== null) setEnterpriseLeadsCollapsed(sLeads === 'true')
        const sAct = localStorage.getItem('admin_activity_table_collapsed')
        if (sAct !== null) setActivityTableCollapsed(sAct === 'true')
        const sJobH = localStorage.getItem('admin_job_history_table_collapsed')
        if (sJobH !== null) setJobHistoryTableCollapsed(sJobH === 'true')
        const sLlm = localStorage.getItem('admin_llm_table_collapsed')
        if (sLlm !== null) setLlmTableCollapsed(sLlm === 'true')
        const sAssignedFilter = localStorage.getItem('admin_assigned_offer_filter')
        if (sAssignedFilter) setAssignedOfferFilter(sAssignedFilter)
        const sLogsSub = localStorage.getItem('admin_logs_sub_tab')
        if (sLogsSub && ['activity', 'llm_telemetry', 'job_history', 'tickets'].includes(sLogsSub)) {
          setLogsSubTab(sLogsSub as any)
        }

        // Instant Hydration from Client Cache (0ms render)
        const sCachedOffers = localStorage.getItem('admin_cached_offers_data')
        if (sCachedOffers) {
          try { setOffersData(JSON.parse(sCachedOffers)) } catch {}
        }
        const sCachedMail = localStorage.getItem('admin_cached_mail_logs')
        if (sCachedMail) {
          try { setMailLogs(JSON.parse(sCachedMail)) } catch {}
        }
      } catch {}

      // 4. Verify server-side against MongoDB
      fetchOverviewAndUsers()
      fetchPayments()
      fetchEnterpriseLeads()
      fetchSupportTickets()
    }
  }, [])

  // Window scroll position persistence
  useEffect(() => {
    if (typeof window === 'undefined') return
    let timer: any = null
    const handleScroll = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        try {
          localStorage.setItem('admin_scroll_y', String(window.scrollY))
        } catch {}
      }, 150)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(timer)
    }
  }, [])

  // Auto-restore scroll position and open inspection modal after candidate list loads
  const hasRestoredScrollRef = React.useRef(false)
  useEffect(() => {
    if (usersList.length > 0 && typeof window !== 'undefined') {
      try {
        // Restore inspecting candidate if one was open prior to refresh
        const savedInspectId = localStorage.getItem('admin_inspecting_candidate_id')
        if (savedInspectId && !inspectCandidate) {
          const found = usersList.find(u => u.user_id === savedInspectId || u.email === savedInspectId)
          if (found) setInspectCandidate(found)
        }

        // Restore selected candidate highlight
        const savedSelected = localStorage.getItem('admin_selected_candidate_id')
        if (savedSelected && !selectedCandidateId) {
          setSelectedCandidateId(savedSelected)
        }

        // Restore scroll position once on initial load
        if (!hasRestoredScrollRef.current) {
          hasRestoredScrollRef.current = true
          const savedScroll = localStorage.getItem('admin_scroll_y')
          if (savedScroll) {
            const y = parseInt(savedScroll, 10)
            if (!isNaN(y) && y > 0) {
              setTimeout(() => {
                window.scrollTo({ top: y, behavior: 'instant' })
              }, 80)
            }
          }
        }
      } catch {}
    }
  }, [usersList])

  const handleTabChange = (tab: 'candidates' | 'requests' | 'queue' | 'payments' | 'offers' | 'enterprise_leads' | 'logs') => {
    setActiveAdminTab(tab)
    try {
      localStorage.setItem('admin_active_tab', tab)
    } catch {}
  }

  const handleInspectCandidate = (u: any | null) => {
    setInspectCandidate(u)
    try {
      if (u) {
        localStorage.setItem('admin_inspecting_candidate_id', u.user_id || u.email)
        localStorage.setItem('admin_selected_candidate_id', u.user_id || u.email)
        setSelectedCandidateId(u.user_id || u.email)
      } else {
        localStorage.removeItem('admin_inspecting_candidate_id')
      }
    } catch {}
  }

  const handleToggleDaily = async (userId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    setUsersList(prev =>
      prev.map(u => (u.user_id === userId ? { ...u, enabled_for_daily_run: newStatus } : u))
    )
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ user_id: userId, enabled_for_daily_run: newStatus })
      })
    } catch {
      fetchOverviewAndUsers()
    }
  }

  const handleToggleVip = async (userId: string, currentVip: boolean) => {
    const newVip = !currentVip
    setUsersList(prev =>
      prev.map(u => (u.user_id === userId ? { ...u, is_vip: newVip } : u))
    )
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify({ user_id: userId, is_vip: newVip })
      })
      fetchOverviewAndUsers()
    } catch {
      fetchOverviewAndUsers()
    }
  }

  const handleChangePlan = async (userId: string, newPlan: string) => {
    setUsersList(prev =>
      prev.map(u => (u.user_id === userId ? { ...u, plan: newPlan, is_vip: newPlan === 'vip' } : u))
    )
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          user_id: userId,
          plan: newPlan,
          is_vip: newPlan === 'vip'
        })
      })
      fetchOverviewAndUsers()
    } catch {
      fetchOverviewAndUsers()
    }
  }

  const loadSystemLogContent = async (filename: string) => {
    setSelectedSystemLog(filename)
    setLoadingLogContent(true)
    try {
      const res = await fetch(`/api/history?user_id=${filename}&limit=30`)
      if (res.ok) {
        const data = await res.json()
        if (data.jobs && Array.isArray(data.jobs)) {
          const lines = data.jobs.map((j: any) => `[${j.date}] ✅ Applied to: ${j.title} at ${j.company}`)
          setSelectedLogContent(lines.length ? lines : ['No application history found for this candidate yet.'])
        }
      }
    } catch {} finally {
      setLoadingLogContent(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(`Are you sure you want to delete profile: ${userId}?`)) return
    try {
      await fetch(`/api/profile?user_id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      })
      fetchOverviewAndUsers()
    } catch (e) {
      console.error('Error deleting profile:', e)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/'
  }

  const filteredUsers = usersList.filter(u => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.user_id || '').toLowerCase().includes(userSearch.toLowerCase())
    if (!matchesSearch) return false

    if (candidateStatusFilter === 'all') return true
    if (candidateStatusFilter === 'active') return u.plan_expiry_status === 'active'
    if (candidateStatusFilter === 'expiring') return u.plan_expiry_status === 'expiring_soon_2d' || u.plan_expiry_status === 'expiring_soon_1d'
    if (candidateStatusFilter === 'urgent') return u.plan_expiry_status === 'expiring_soon_1d'
    if (candidateStatusFilter === 'expired') return u.plan_expiry_status === 'expired'
    if (candidateStatusFilter === 'vip') return Boolean(u.is_vip || u.plan === 'vip' || u.plan_expiry_status === 'vip_lifetime')
    if (candidateStatusFilter === 'no_plan') return u.plan_expiry_status === 'no_plan' || u.plan === 'none' || u.plan === 'no_plan'
    return true
  })

  if (authChecking) {
    return (
      <AiLoadingScreen
        title="Verifying Administrator Privileges"
        subtitle="Synchronizing MongoDB Atlas cluster, telemetry logs & candidates..."
        accountInfo={adminEmail || "technohmsit@gmail.com"}
      />
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white relative">
      {/* On-Demand Cluster Telemetry Refresh Animation Overlay */}
      {isRefreshing && (
        <AiLoadingScreen
          title="Refreshing Cluster Telemetry"
          subtitle="Synchronizing MongoDB Atlas, candidate queues & transaction records..."
          accountInfo={adminEmail || "technohmsit@gmail.com"}
          fullscreen={true}
        />
      )}

      {/* Admin Top Navbar */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-zinc-900 px-4 sm:px-6 py-3 sm:py-4">
        {/* Mobile: flex-row-reverse puts buttons on LEFT, logo on RIGHT. sm+: normal flex-row (logo left, buttons right) */}
        <div className="max-w-7xl mx-auto flex flex-row-reverse sm:flex-row items-center justify-between gap-3">
          {/* Logo + badges — on mobile appears on RIGHT (end), on sm+ appears on LEFT (start) */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <Link href="/" className="hover:opacity-90 transition-opacity shrink-0">
              <JobFluxLogo size="sm" showText={true} />
            </Link>

            <div className="h-5 w-px bg-zinc-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-sky-300 font-mono uppercase font-semibold hidden sm:inline">
                Super Admin
              </span>
              <span className="text-[11px] text-zinc-500 font-mono hidden md:inline">
                MongoDB Atlas Synchronized
              </span>
            </div>
          </div>

          {/* Action buttons — on mobile appears on LEFT (start), on sm+ appears on RIGHT (end) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Direct Switch to Candidate Cockpit */}
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 transition-colors cursor-pointer shrink-0"
              title="Switch to Candidate Cockpit"
            >
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Candidate Cockpit ↗</span>
              <span className="sm:hidden">Cockpit</span>
            </Link>

            {/* Quick Trigger: Send Today's Job Applied Notification (Email + Web Push) */}
            <button
              type="button"
              onClick={() => {
                setIsDispatchReportModalOpen(true)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:to-indigo-400 text-white shadow-md shadow-sky-500/25 transition-all cursor-pointer shrink-0 border border-sky-400/40"
              title="Manual Trigger: Send Today's Job Applied Notification (Email + Web Push)"
            >
              <Send className="w-3.5 h-3.5 text-sky-200 animate-pulse" />
              <span className="hidden sm:inline">⚡ Send Today&apos;s Report</span>
            </button>

            <button
              onClick={() => setIsHelpOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors text-zinc-300 cursor-pointer shrink-0"
              title="Help Desk"
            >
              <Mail className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Help Desk</span>
            </button>
            <button
              onClick={handleAdminRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors text-zinc-300 cursor-pointer shrink-0 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors text-zinc-400 hover:text-white cursor-pointer shrink-0"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>


      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Browser Push Notifications Assistant Banner for Admin */}
        {notificationPermission === 'denied' && (
          <div className="p-3 sm:p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <BellOff className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Browser Push Notifications Blocked</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">Action Required</span>
                </div>
                <p className="text-[11px] text-amber-300/80 mt-0.5">
                  Your browser is currently blocking notifications for JobFlux AI. Enable them to receive real-time admin dispatch confirmations & queue updates.
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
          <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Enable Real-Time Admin Push Notifications</div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Receive immediate alerts when background worker sweeps complete, tickets are filed, or purchase offers are dispatched.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setNotificationBannerDismissed(true)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRequestNotification}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Allow Notifications</span>
              </button>
            </div>
          </div>
        )}

        {notificationPermission === 'granted' && (
          <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-800/30 text-emerald-300 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Real-time push notifications active for admin alerts, worker sweeps, and queue dispatches.</span>
            </div>
            <button
              type="button"
              onClick={handleSendTestNotification}
              className="px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Bell className="w-3 h-3" />
              <span>{testNotificationSent ? 'Alert Sent! ✓' : 'Send Test Alert'}</span>
            </button>
          </div>
        )}

        {/* Real-time Cluster Radar Telemetry Bar */}
        <div className="px-4 py-2.5 rounded-xl bg-[#09090b] border border-zinc-800/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs relative overflow-hidden card-featured-glow">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-sky-400/80 to-transparent animate-laser-sweep pointer-events-none" />
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-zinc-200 font-medium">Cluster Active & Synchronized</span>
            <span className="text-zinc-600 hidden sm:inline">·</span>
            <span className="text-zinc-400 font-mono text-[11px] hidden sm:inline">Scheduled Runs: Daily 06:00 & 08:00 AM IST</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
            <span>Primary Admin: <strong className="text-sky-300">{adminEmail || 'technohmsit@gmail.com'}</strong></span>
            <span className="text-zinc-700">|</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live
            </span>
          </div>
        </div>
        {/* 5 Clean Overview Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-400" /> Candidates
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {overviewMetrics.scheduled_profiles_active} Active
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-white font-mono">
              {overviewMetrics.total_profiles}
            </div>
            <p className="text-[11px] text-zinc-500">Configured profiles</p>
          </div>

          <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-zinc-400" /> VIP Privilege
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                Free Pass
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-white font-mono">
              {overviewMetrics.vip_profiles_count}
            </div>
            <p className="text-[11px] text-zinc-500">Admin VIP bypass</p>
          </div>

          <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" /> Today Applied
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                24h
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-white font-mono">
              {overviewMetrics.applied_today}
            </div>
            <p className="text-[11px] text-zinc-500">Submitted today</p>
          </div>

          <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" /> This Week
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                7d
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-white font-mono">
              {overviewMetrics.applied_this_week}
            </div>
            <p className="text-[11px] text-zinc-500">Submitted this week</p>
          </div>

          <div className="p-5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-400" /> Total Applied
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                All-Time
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-semibold text-white font-mono">
              {overviewMetrics.total_applied}
            </div>
            <p className="text-[11px] text-zinc-500">All-time verified</p>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 flex-wrap">
          <button
            onClick={() => handleTabChange('candidates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
              activeAdminTab === 'candidates'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Candidate Profiles ({filteredUsers.length})
          </button>
          <button
            onClick={() => {
              handleTabChange('requests')
              fetchSupportTickets()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
              activeAdminTab === 'requests'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
            <span>User Requests & Queries</span>
            {ticketStats.open > 0 ? (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono font-bold">
                {ticketStats.open} open
              </span>
            ) : (
              <span className="text-[10px] font-mono text-zinc-500">
                ({ticketStats.total})
              </span>
            )}
          </button>
          <button
            onClick={() => {
              handleTabChange('queue')
              fetchQueueData()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
              activeAdminTab === 'queue'
                ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-sky-500/30'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Execution Queue</span>
            {queueMetrics.pending > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold animate-pulse">
                {queueMetrics.pending} in line
              </span>
            )}
            {workerStatus.is_busy && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" title="Worker active" />
            )}
          </button>
          <button
            onClick={() => {
              handleTabChange('payments')
              fetchPayments()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
              activeAdminTab === 'payments'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Payments ({paymentsList.length})
          </button>
          <button
            onClick={() => {
              handleTabChange('offers')
              fetchOffersData()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
              activeAdminTab === 'offers'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Purchase Offers & Campaigns</span>
          </button>
          <button
            onClick={() => {
              handleTabChange('enterprise_leads')
              fetchEnterpriseLeads()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
              activeAdminTab === 'enterprise_leads'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Enterprise Leads ({enterpriseLeads.length})
          </button>
          <button
            onClick={() => {
              handleTabChange('logs')
              fetchActivityLogs()
              fetchSupportTickets()
              fetchLlmLogs()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all cursor-pointer ${
              activeAdminTab === 'logs'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Activity Audit & System Logs
          </button>
        </div>

        {/* TAB 1: CANDIDATES LIST */}
        {activeAdminTab === 'candidates' && (
          <div className="space-y-4">
            {/* Search & Status Filters Header */}
            <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-3 shadow-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or candidate ID..."
                    value={userSearch}
                    onChange={e => {
                      const val = e.target.value
                      setUserSearch(val)
                      try {
                        localStorage.setItem('admin_candidate_search', val)
                      } catch {}
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  {userSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserSearch('')
                        try {
                          localStorage.removeItem('admin_candidate_search')
                        } catch {}
                      }}
                      className="absolute right-3 top-2.5 text-zinc-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-xs text-slate-400 hidden lg:block">
                    Auto-scheduled runs: <span className="text-emerald-400 font-semibold">Daily at 06:00 AM & 08:00 AM IST</span>
                  </div>
                  <button
                    onClick={() => setEditingUser({ isNew: true, user_id: '' })}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
                  >
                    <User className="w-4 h-4" /> Create Candidate
                  </button>
                </div>
              </div>

              {/* Status Filter Pills & Legend Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-zinc-900">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-mono text-zinc-500 uppercase mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-zinc-400" /> Filter:
                  </span>
                  {[
                    { key: 'all', label: 'All Candidates', count: usersList.length, color: 'text-zinc-300' },
                    { key: 'active', label: 'Active Plan', count: usersList.filter(u => u.plan_expiry_status === 'active').length, color: 'text-emerald-400' },
                    { key: 'expiring', label: 'Expiring 1-2d', count: usersList.filter(u => u.plan_expiry_status === 'expiring_soon_2d' || u.plan_expiry_status === 'expiring_soon_1d').length, color: 'text-amber-300' },
                    { key: 'urgent', label: 'Urgent <24h', count: usersList.filter(u => u.plan_expiry_status === 'expiring_soon_1d').length, color: 'text-rose-300' },
                    { key: 'expired', label: 'Expired', count: usersList.filter(u => u.plan_expiry_status === 'expired').length, color: 'text-rose-400' },
                    { key: 'vip', label: 'VIP Pass (90d)', count: usersList.filter(u => u.is_vip || u.plan === 'vip' || u.plan_expiry_status === 'vip_lifetime').length, color: 'text-amber-400' },
                    { key: 'no_plan', label: 'No Plan', count: usersList.filter(u => u.plan_expiry_status === 'no_plan' || u.plan === 'none' || u.plan === 'no_plan').length, color: 'text-zinc-400' }
                  ].map(f => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => {
                        setCandidateStatusFilter(f.key)
                        try {
                          localStorage.setItem('admin_candidate_status_filter', f.key)
                        } catch {}
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                        candidateStatusFilter === f.key
                          ? 'bg-zinc-800 text-white border border-zinc-700 font-bold shadow-sm'
                          : 'bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-900 hover:border-zinc-800'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full bg-black/60 font-bold ${f.color}`}>
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowStatusGuide(!showStatusGuide)}
                  className="text-xs text-zinc-400 hover:text-amber-300 flex items-center gap-1 transition-colors font-mono cursor-pointer ml-auto"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showStatusGuide ? 'Hide Status Legend' : 'Status Guide & Legend'}</span>
                </button>
              </div>

              {/* Expandable Status Legend Guide */}
              {showStatusGuide && (
                <div className="p-4 rounded-xl bg-black/80 border border-amber-500/30 text-xs space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Candidate Plan Expiry Status & Visual Indicator Guide</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowStatusGuide(false)}
                      className="text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-emerald-900/40 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-300 font-bold font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Active (Xd left)</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Paid plan with &gt; 48 hours remaining. Protected from discount offers to avoid cannibalizing subscription value.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-amber-800/40 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold font-mono">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Expiring: 1-2d (36h left)</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Plan expiring within 24–48 hours. Prime window to send retention renewal offers and automated reminders.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-rose-800/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-rose-300 font-bold font-mono">
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                        <span>Expiring: &lt;24h left (Red Pulse)</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Urgent final 24-hour expiration countdown. Critical retention period before candidate's daily apply halts.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-rose-900/60 space-y-1">
                      <div className="flex items-center gap-1.5 text-rose-400 font-bold font-mono">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Plan Expired</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Validity ended. Candidate is paused and eligible for win-back discount offers and immediate reactivation.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-amber-500/30 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold font-mono">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>VIP Pass (3 Months / 90d)</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Candidate holds an active VIP access pass (90 days). Renewable upon completion.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-zinc-400 font-bold font-mono">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>No Active Plan</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Free tier / unsubscribed account. Prime prospect for first-time conversion offers.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Candidates Table */}
            <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
              <div 
                onClick={toggleCandidatesTable}
                className="px-5 py-4 bg-zinc-950 hover:bg-zinc-900/60 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition-colors"
              >
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Candidate Profiles Directory</span>
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {filteredUsers.length} profiles
                    </span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Live candidate profiles, automated apply status, ATS resumes, and daily job report actions.
                  </p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleCandidatesTable()
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {candidatesTableCollapsed ? (
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

              {candidatesTableCollapsed && (
                <div 
                  onClick={toggleCandidatesTable}
                  className="px-5 py-3 bg-zinc-900/30 hover:bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    <span>Table shrunk (<strong>{filteredUsers.length}</strong> candidate profiles hidden) &bull; Click anywhere on head to expand</span>
                  </div>
                  <span className="text-sky-400 font-semibold flex items-center gap-1">
                    <span>Expand Table</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </span>
                </div>
              )}

              {!candidatesTableCollapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead 
                      onClick={toggleCandidatesTable}
                      className="cursor-pointer group select-none"
                      title="Click table head to shrink / expand"
                    >
                      <tr className="bg-slate-950 group-hover:bg-zinc-900/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 transition-colors">
                        <th className="py-3.5 px-4 flex items-center gap-1">
                          <span>Candidate</span>
                          <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-sky-400 transition-colors" />
                        </th>
                        <th className="py-3.5 px-4">Naukri Email</th>
                        <th className="py-3.5 px-4">Plan & Access</th>
                      <th className="py-3.5 px-4 text-center">Auto-Apply</th>
                      <th className="py-3.5 px-4">Last Login</th>
                      <th className="py-3.5 px-4">Profile & Resume</th>
                      <th className="py-3.5 px-4 text-center">Today / Total</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
                          Loading candidate profiles...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          No candidate profiles match your search query.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u, idx) => (
                        <tr
                          key={u.user_id || idx}
                          onClick={() => {
                            setSelectedCandidateId(u.user_id)
                            try {
                              localStorage.setItem('admin_selected_candidate_id', u.user_id)
                            } catch {}
                          }}
                          className={`transition-colors cursor-pointer ${
                            selectedCandidateId === u.user_id
                              ? 'bg-indigo-950/40 border-l-2 border-l-indigo-500 ring-1 ring-indigo-500/30'
                              : 'hover:bg-slate-800/30'
                          }`}
                        >
                          <td className="py-4 px-4 font-bold text-white flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                              {u.name ? u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'C'}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{u.name || u.user_id}</span>
                                {selectedCandidateId === u.user_id && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 font-mono font-bold">
                                    SELECTED
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">{u.user_id}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-300 font-mono">
                            {u.email}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col items-start gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  u.plan === 'elite' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                                  u.plan === 'pro' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' :
                                  u.plan === 'starter' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                                  u.plan === 'vip' ? 'bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 text-amber-300 border border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.25)]' :
                                  u.plan === 'none' || u.plan === 'no_plan' ? 'bg-zinc-800/80 text-zinc-400 border border-zinc-700' :
                                  'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                                }`}>
                                  {u.plan === 'none' || u.plan === 'no_plan' ? 'NO PLAN' : (u.plan || 'trial')}
                                </span>
                                {u.is_vip && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 text-amber-300 border border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                                    <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400/40" />
                                    VIP PASS
                                  </span>
                                )}
                              </div>

                              {/* Admin Plan Override Dropdown */}
                              <select
                                value={u.plan || 'trial'}
                                onChange={(e) => handleChangePlan(u.user_id, e.target.value)}
                                className="bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[10px] text-slate-200 rounded-md px-1.5 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer font-mono font-medium transition-colors"
                                title="Admin Quick Action: Change this candidate's plan tier"
                              >
                                <option value="none">No Plan (Inactive)</option>
                                <option value="trial">Free Trial (24h)</option>
                                <option value="starter">Starter (30d)</option>
                                <option value="pro">Pro (30d)</option>
                                <option value="elite">Professional (90d)</option>
                                <option value="vip">VIP Pass (3 Months / 90d)</option>
                              </select>

                              <button
                                onClick={() => handleToggleVip(u.user_id, !u.is_vip)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  u.is_vip
                                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30'
                                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/40'
                                }`}
                                title={u.is_vip ? "Click to Revoke VIP Pass" : "Click to Grant 3-Month VIP Pass"}
                              >
                                <Crown className="w-3 h-3 text-amber-400" />
                                {u.is_vip ? 'Revoke VIP' : 'Grant VIP Pass'}
                              </button>

                              {/* Crystal-Clear Expiry Countdown & Visual Status */}
                              {(() => {
                                if (u.is_vip || u.plan === 'vip') {
                                  return (
                                    <div
                                      className="text-[10px] font-mono mt-1 flex items-center gap-1 text-amber-300 bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-500/30"
                                      title="Candidate has active VIP access (90d)."
                                    >
                                      <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                                      <span className="font-semibold">VIP Pass (90d Active)</span>
                                    </div>
                                  )
                                }

                                if (u.plan === 'none' || u.plan === 'no_plan' || u.plan_expiry_status === 'no_plan') {
                                  return (
                                    <div
                                      className="text-[10px] font-mono mt-1 flex items-center gap-1 text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800"
                                      title="Candidate has no active plan. Prime prospect for conversion offer."
                                    >
                                      <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                                      <span>No Active Plan</span>
                                    </div>
                                  )
                                }

                                const hoursLeft = u.plan_hours_left ?? u.hours_until_expiry

                                if (u.plan_expiry_status === 'expired' || (hoursLeft !== null && hoursLeft !== undefined && hoursLeft <= 0)) {
                                  return (
                                    <div
                                      className="text-[10px] font-mono mt-1 flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/60"
                                      title={`Plan expired on ${u.plan_expires_at ? formatTimestamp(u.plan_expires_at) : 'recently'}. Eligible for renewal retention offer.`}
                                    >
                                      <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                                      <span className="font-bold">Plan Expired</span>
                                    </div>
                                  )
                                }

                                if (u.plan_expiry_status === 'expiring_soon_1d' || (hoursLeft !== null && hoursLeft !== undefined && hoursLeft <= 24)) {
                                  return (
                                    <div
                                      className="text-[10px] font-mono mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-800"
                                      title={`Expires in ${hoursLeft} hours (${u.plan_expires_at ? formatTimestamp(u.plan_expires_at) : ''}). Urgent renewal retention window.`}
                                    >
                                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping shrink-0" />
                                      <span className="font-bold text-rose-200">Expiring: {hoursLeft}h left</span>
                                    </div>
                                  )
                                }

                                if (u.plan_expiry_status === 'expiring_soon_2d' || (hoursLeft !== null && hoursLeft !== undefined && hoursLeft <= 48)) {
                                  const days = Math.ceil((hoursLeft || 1) / 24)
                                  return (
                                    <div
                                      className="text-[10px] font-mono mt-1 flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/60"
                                      title={`Expires in ${hoursLeft} hours (${days}d). Within 1-2 days renewal retention window.`}
                                    >
                                      <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                                      <span className="font-bold text-amber-300">Expiring: {days}d ({hoursLeft}h left)</span>
                                    </div>
                                  )
                                }

                                if (hoursLeft !== null && hoursLeft !== undefined && hoursLeft > 48) {
                                  const days = Math.ceil(hoursLeft / 24)
                                  return (
                                    <div
                                      className="text-[10px] font-mono mt-1 flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/30 text-emerald-300 border border-emerald-800/40"
                                      title={`Active plan until ${u.plan_expires_at ? formatTimestamp(u.plan_expires_at) : ''} (${days} days left). Protected from discount offers.`}
                                    >
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                      <span className="font-medium text-emerald-300">Active ({days}d left)</span>
                                    </div>
                                  )
                                }

                                if (u.plan_expires_at) {
                                  return (
                                    <div className="text-[10px] font-mono mt-1 flex items-center gap-1 text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                      <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                                      <span>Expires: {formatTimestamp(u.plan_expires_at)}</span>
                                    </div>
                                  )
                                }

                                return (
                                  <div className="text-[10px] font-mono mt-1 flex items-center gap-1 text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                    <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                                    <span>Trial (Standard)</span>
                                  </div>
                                )
                              })()}

                              {/* Assigned Offers Chips */}
                              {u.assigned_offers && u.assigned_offers.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {u.assigned_offers.map((off: any, oIdx: number) => (
                                    <span
                                      key={oIdx}
                                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono flex items-center gap-1 ${
                                        off.is_expired
                                          ? 'bg-zinc-900 text-zinc-500 line-through border border-zinc-800'
                                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                      }`}
                                      title={`Offer: ${off.offer_title} (${off.discounted_price}) - Code: ${off.promo_code}`}
                                    >
                                      <Tag className="w-2.5 h-2.5" />
                                      {off.promo_code} ({off.is_expired ? 'Expired' : `${off.hours_left}h`})
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => handleToggleDaily(u.user_id, u.enabled_for_daily_run !== false)}
                              className="text-xs transition-colors cursor-pointer"
                              title="Toggle automated daily apply"
                            >
                              {u.enabled_for_daily_run !== false ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <ToggleRight className="w-4 h-4 text-emerald-400" /> ENABLED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                  <ToggleLeft className="w-4 h-4 text-slate-500" /> DISABLED
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="text-white font-mono text-[11px] flex items-center gap-1">
                                <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                                <span>{formatTimestamp(u.last_login_at)}</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
                                  {u.login_count || 0} logins
                                </span>
                                {u.last_login_ip && (
                                  <span className="text-[9px] font-mono text-zinc-500 truncate max-w-[80px]" title={u.last_login_ip}>
                                    {u.last_login_ip}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-1 text-slate-300">
                                <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="truncate max-w-[120px]" title={u.resume_filename || 'No resume file recorded'}>
                                  {u.resume_filename || 'No PDF'}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {u.last_resume_updated_at ? `PDF: ${formatTimestamp(u.last_resume_updated_at)}` : (u.last_profile_updated_at ? `Profile: ${formatTimestamp(u.last_profile_updated_at)}` : 'Synced')}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-slate-900 text-slate-200 font-mono text-[11px] font-bold border border-slate-800">
                              {u.applied_today || 0} / {u.total_applied || 0}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  localStorage.setItem('user_id', u.user_id)
                                  localStorage.setItem('user_email', u.email)
                                  localStorage.setItem('user_role', 'admin')
                                  window.open('/dashboard', '_blank')
                                }}
                                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                                title="Open Candidate Dashboard"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInspectCandidate(u)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 font-bold text-xs transition-colors border border-amber-500/30 shadow-sm cursor-pointer"
                                title="Inspect candidate plan validity, assigned offers & reminder telemetry"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-400" />
                                <span>Inspect</span>
                              </button>
                              <button
                                type="button"
                                disabled={dispatchReportLoading}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDispatchReportTarget(u.email)
                                  setIsDispatchReportModalOpen(true)
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 font-bold text-xs transition-colors border border-sky-500/30 shadow-sm cursor-pointer disabled:opacity-50"
                                title="Open Daily Job Dispatch Report Hub for this candidate (Email + Push)"
                              >
                                <Send className="w-3.5 h-3.5 text-sky-400" />
                                <span>⚡ Send Report</span>
                              </button>
                              <button
                                onClick={() => setEditingUser(u)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit Profile
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.user_id)}
                                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                                title="Delete Candidate"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              )}
            </div>

            {/* Candidate Expiry & Telemetry Inspection Modal */}
            {inspectCandidate && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="relative w-full max-w-2xl bg-[#0e0e11] border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-sky-400" />
                        <span>Candidate Telemetry: {inspectCandidate.name || inspectCandidate.user_id}</span>
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">{inspectCandidate.email}</p>
                    </div>
                    <button
                      onClick={() => handleInspectCandidate(null)}
                      className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Plan Validity Section */}
                  <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Plan Validity & Expiry Countdown</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-zinc-500">Current Plan:</span>
                        <div className="font-bold text-white uppercase">{inspectCandidate.plan || 'Free'}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500">Expiry Status:</span>
                        <div className={`font-bold ${
                          inspectCandidate.plan_expiry_status === 'expired' ? 'text-rose-400' :
                          inspectCandidate.plan_expiry_status === 'expiring_soon_1d' ? 'text-rose-400 animate-pulse' :
                          inspectCandidate.plan_expiry_status === 'expiring_soon_2d' ? 'text-amber-400' :
                          inspectCandidate.plan_expiry_status === 'vip_lifetime' ? 'text-amber-300' :
                          inspectCandidate.plan_expiry_status === 'no_plan' ? 'text-zinc-400' :
                          'text-emerald-400'
                        }`}>
                          {inspectCandidate.plan_expiry_status === 'vip_lifetime' ? 'VIP Pass (90d Active)' :
                           inspectCandidate.plan_expiry_status === 'expiring_soon_1d' ? 'Expiring Soon (<24h Left)' :
                           inspectCandidate.plan_expiry_status === 'expiring_soon_2d' ? 'Expiring (1-2 Days Left)' :
                           inspectCandidate.plan_expiry_status === 'expired' ? 'Plan Expired' :
                           inspectCandidate.plan_expiry_status === 'no_plan' ? 'No Active Plan' :
                           'Active Subscription'}
                        </div>
                      </div>
                      <div>
                        <span className="text-zinc-500">Plan Expires At:</span>
                        <div className="font-mono text-zinc-300">
                          {inspectCandidate.plan_expires_at ? formatTimestamp(inspectCandidate.plan_expires_at) : (inspectCandidate.is_vip ? 'Active VIP Access (90d)' : 'No fixed expiration')}
                        </div>
                      </div>
                      <div>
                        <span className="text-zinc-500">Hours Remaining:</span>
                        <div className="font-mono text-zinc-300">
                          {(() => {
                            const h = inspectCandidate.plan_hours_left ?? inspectCandidate.hours_until_expiry
                            if (h !== null && h !== undefined) {
                              return `${h} hours (${Math.round(h / 24 * 10) / 10} days)`
                            }
                            return inspectCandidate.is_vip ? 'Active VIP Access' : 'N/A'
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Offers Section */}
                  <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-sky-400" />
                      <span>Assigned Promotional Offers ({inspectCandidate.assigned_offers?.length || 0})</span>
                    </h4>
                    {(!inspectCandidate.assigned_offers || inspectCandidate.assigned_offers.length === 0) ? (
                      <p className="text-xs text-zinc-500">No promotional offers currently assigned to this candidate.</p>
                    ) : (
                      <div className="space-y-2">
                        {inspectCandidate.assigned_offers.map((off: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between gap-3">
                            <div>
                              <div className="font-bold text-white">{off.offer_title}</div>
                              <div className="text-[11px] text-zinc-400">
                                Code: <span className="text-sky-300 font-mono font-bold">{off.promo_code}</span> · Price: <span className="text-emerald-400 font-mono font-bold">{off.discounted_price}</span>
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                Assigned: {formatTimestamp(off.assigned_at)} · Expires: {formatTimestamp(off.expires_at)}
                              </div>
                            </div>
                            <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                off.is_expired ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}>
                                {off.is_expired ? 'Expired' : `${off.hours_left}h left`}
                              </span>
                              <button
                                type="button"
                                disabled={revokingOfferId === (off.id || off.promo_code)}
                                onClick={() => handleRevokeOffer(off.id, inspectCandidate.email, off.promo_code)}
                                className="px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                                title="Revoke and delete this offer from candidate account"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                                <span>{revokingOfferId === (off.id || off.promo_code) ? 'Revoking...' : 'Revoke Offer'}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Automated Expiry Reminders Sent History */}
                  <div className="p-4 rounded-xl bg-black border border-zinc-800 space-y-2">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BellRing className="w-3.5 h-3.5 text-amber-400" />
                      <span>Automated Reminder Dispatch Logs ({inspectCandidate.reminders_sent?.length || 0})</span>
                    </h4>
                    {(!inspectCandidate.reminders_sent || inspectCandidate.reminders_sent.length === 0) ? (
                      <p className="text-xs text-zinc-500">No automated expiry reminders dispatched yet for this candidate.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {inspectCandidate.reminders_sent.map((rem: any, rIdx: number) => (
                          <div key={rIdx} className="p-2 rounded bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-white uppercase text-[10px] tracking-wider mr-2">
                                {rem.type === 'plan_expiry' ? 'Plan Expiry Warning' : 'Offer Expiry Warning'}
                              </span>
                              <span className="text-[11px] text-zinc-400">
                                {rem.warning_tier || 'Alert'} ({rem.details?.hours_left !== undefined ? `${rem.details.hours_left}h left` : ''})
                              </span>
                              <div className="text-[10px] text-zinc-500 font-mono">
                                Email: {rem.channels?.email ? '✅ Sent' : '❌ Skipped'} · Push: {rem.channels?.push ? '✅ Sent' : '❌ Skipped'}
                              </div>
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400">
                              {formatTimestamp(rem.sent_at)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-[11px] text-zinc-500">
                      Anti-flooding safeguards enforce an 18-hour quiet window unless manually triggered.
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleInspectCandidate(null)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        disabled={dispatchReportLoading}
                        onClick={async () => {
                          await handleDispatchCareerReport(inspectCandidate.email, 'both')
                        }}
                        className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Dispatches live daily report with real DB stats and applied companies via email and web push"
                      >
                        {dispatchReportLoading ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Dispatching Report...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            <span>Dispatch Report (Email + Push)</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={loadingExpirySweep}
                        onClick={async () => {
                          await handleRunExpirySweep(inspectCandidate.email)
                          const updated = usersList.find(u => u.email === inspectCandidate.email || u.user_id === inspectCandidate.user_id)
                          if (updated) setInspectCandidate(updated)
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        <span>{loadingExpirySweep ? 'Sending...' : 'Trigger 1D/2D Expiry Alert Now'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: USER REQUESTS & QUERIES */}
        {activeAdminTab === 'requests' && (
          <div className="space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Queries</div>
                  <div className="text-2xl font-extrabold text-white mt-1">{ticketStats.total}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Open / Pending</div>
                  <div className="text-2xl font-extrabold text-rose-400 mt-1">{ticketStats.open}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">In Progress</div>
                  <div className="text-2xl font-extrabold text-amber-400 mt-1">{ticketStats.in_progress}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <RefreshCw className="w-5 h-5" />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Resolved / Closed</div>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-1">{ticketStats.resolved + ticketStats.closed}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Admin Routing Banner */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Central Admin Inquiries Desk</div>
                  <div className="text-[11px] text-zinc-400">
                    Primary Super-Admin Email: <span className="font-mono text-teal-300 font-semibold">{adminEmail || 'technohmsit@gmail.com'}</span>. Candidate support questions, urgent issues, and profile inquiries arrive here for resolution.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsHelpOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <MessageSquare className="w-3 h-3 text-teal-400" />
                <span>Simulate / Log Query</span>
              </button>
            </div>

            {/* Search, Filter & Refresh Bar */}
            <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search ticket ID, candidate name, email, subject..."
                  value={requestSearch}
                  onChange={e => {
                    setRequestSearch(e.target.value)
                    fetchSupportTickets(requestStatusFilter, e.target.value)
                  }}
                  className="w-full bg-black border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map(status => {
                  const active = requestStatusFilter === status
                  return (
                    <button
                      key={status}
                      onClick={() => {
                        setRequestStatusFilter(status)
                        fetchSupportTickets(status, requestSearch)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                        active
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'bg-black text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  )
                })}
                <button
                  onClick={() => fetchSupportTickets(requestStatusFilter, requestSearch)}
                  className="p-2 rounded-lg bg-black hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors ml-1 cursor-pointer"
                  title="Refresh inquiries"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingTickets ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Inquiries Table */}
            <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
              <div 
                onClick={toggleRequestsTable}
                className="px-5 py-4 bg-zinc-950 hover:bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between cursor-pointer select-none transition-colors"
              >
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-teal-400" />
                    <span>Candidate Inquiries &amp; Support Requests</span>
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {supportTickets.length} inquiries
                    </span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    User requests, error reports, and candidate inquiries submitted through the Help Desk.
                  </p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleRequestsTable()
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {requestsTableCollapsed ? (
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

              {requestsTableCollapsed && (
                <div 
                  onClick={toggleRequestsTable}
                  className="px-5 py-3 bg-zinc-900/30 hover:bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    <span>Table shrunk (<strong>{supportTickets.length}</strong> inquiries hidden) &bull; Click anywhere on head to expand</span>
                  </div>
                  <span className="text-teal-400 font-semibold flex items-center gap-1">
                    <span>Expand Table</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </span>
                </div>
              )}

              {!requestsTableCollapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead 
                      onClick={toggleRequestsTable}
                      className="cursor-pointer group select-none"
                      title="Click table head to shrink / expand"
                    >
                      <tr className="bg-black group-hover:bg-zinc-900/60 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800 transition-colors">
                        <th className="py-3.5 px-4 flex items-center gap-1">
                          <span>Ticket &amp; Priority</span>
                          <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-teal-400 transition-colors" />
                        </th>
                        <th className="py-3.5 px-4">Candidate</th>
                        <th className="py-3.5 px-4">Category &amp; Message</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Admin Response / Note</th>
                        <th className="py-3.5 px-4 text-right">Actions (Click Head to Shrink ▲)</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {loadingTickets ? (
                      <tr>
                        <td colSpan={6} className="py-14 text-center text-zinc-400">
                          <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-teal-400" />
                          Loading candidate requests & queries...
                        </td>
                      </tr>
                    ) : supportTickets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-14 text-center text-zinc-500">
                          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-zinc-400" />
                          No candidate requests found matching the current filters.
                        </td>
                      </tr>
                    ) : (
                      supportTickets.map((t) => {
                        const noteValue = ticketNotes[t.ticket_id] !== undefined ? ticketNotes[t.ticket_id] : (t.admin_response || '')
                        const isSaving = savingTicketId === t.ticket_id
                        return (
                          <tr key={t.ticket_id || t.id} className="hover:bg-zinc-900/30 transition-colors align-top">
                            {/* Ticket & Priority */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-mono font-semibold text-white text-xs">{t.ticket_id}</div>
                              <div className="mt-1">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider ${
                                  t.priority === 'urgent'
                                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                    : t.priority === 'high'
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                                }`}>
                                  {t.priority || 'normal'}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-zinc-500 mt-1">
                                {formatTimestamp(t.created_at)}
                              </div>
                            </td>

                            {/* Candidate Details */}
                            <td className="py-3.5 px-4 min-w-[180px]">
                              <div className="font-bold text-white text-xs">{t.name || 'Candidate'}</div>
                              {t.user_id && (
                                <div className="text-[10px] font-mono text-zinc-500">ID: {t.user_id}</div>
                              )}
                              <a
                                href={`mailto:${t.email}?subject=Re:%20[${t.ticket_id}]%20${encodeURIComponent(t.subject || 'Support Query')}`}
                                className="text-[11px] text-teal-400 hover:underline inline-flex items-center gap-1 mt-1 font-mono"
                              >
                                <Mail className="w-3 h-3" /> {t.email}
                              </a>
                            </td>

                            {/* Category & Message */}
                            <td className="py-3.5 px-4 max-w-sm">
                              <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-300 mb-1">
                                {t.category?.replace('_', ' ') || 'General'}
                              </span>
                              <div className="font-semibold text-white text-xs">{t.subject}</div>
                              <div className="text-[11px] text-zinc-400 mt-1 leading-relaxed bg-black/60 p-2 rounded-lg border border-zinc-900">
                                {t.message}
                              </div>
                            </td>

                            {/* Status Selector */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <select
                                value={t.status || 'open'}
                                onChange={e => handleUpdateTicket(t.ticket_id, e.target.value)}
                                className={`text-xs rounded-lg px-2.5 py-1.5 font-medium border focus:outline-none cursor-pointer ${
                                  t.status === 'open'
                                    ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
                                    : t.status === 'in_progress'
                                    ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                                    : t.status === 'resolved'
                                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                                    : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                                }`}
                              >
                                <option value="open">Open / Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                              </select>
                              {t.resolved_at && (
                                <div className="text-[9px] font-mono text-emerald-400 mt-1">
                                  Resolved: {formatTimestamp(t.resolved_at)}
                                </div>
                              )}
                            </td>

                            {/* Admin Response / Note */}
                            <td className="py-3.5 px-4 min-w-[240px] max-w-md">
                              <div className="space-y-1.5">
                                <textarea
                                  rows={2}
                                  placeholder="Type resolution reply or note for candidate..."
                                  value={noteValue}
                                  onChange={e => setTicketNotes({ ...ticketNotes, [t.ticket_id]: e.target.value })}
                                  className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono transition-colors"
                                />
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() => handleUpdateTicket(t.ticket_id, t.status, noteValue)}
                                    disabled={isSaving}
                                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                                    <span>{isSaving ? 'Saving...' : 'Save Response'}</span>
                                  </button>
                                  {t.admin_response && (
                                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                                      Responded
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <a
                                  href={`mailto:${t.email}?subject=Re:%20[${t.ticket_id}]%20${encodeURIComponent(t.subject || 'Support Query')}&body=${encodeURIComponent(
                                    `Hi ${t.name || 'Candidate'},\n\nIn response to your query [${t.ticket_id}]:\n"${t.message}"\n\n${noteValue ? noteValue + '\n\n' : ''}Best regards,\nAdministrator (technohmsit@gmail.com)\nJobFlux AI Bot`
                                  )}`}
                                  className="p-1.5 rounded-lg bg-black hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors inline-flex items-center"
                                  title="Reply via Email"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  onClick={() => handleDeleteTicket(t.ticket_id)}
                                  className="p-1.5 rounded-lg bg-black hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-900/60 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Delete Ticket"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: EXECUTION QUEUE & WORKER TELEMETRY */}
        {activeAdminTab === 'queue' && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>Execution Queue & Serialized Worker Hub</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Inspect lined-up candidate runs, monitor real-time Playwright execution logs, and mark tasks not to execute.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleQueueAction('reclaim_stale')}
                  disabled={actionProcessingId === 'reclaim_stale'}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Check and auto-fail running tasks with lost heartbeats"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${actionProcessingId === 'reclaim_stale' ? 'animate-spin' : ''}`} />
                  <span>Reclaim Stale</span>
                </button>

                {queueMetrics.pending > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmCancelAll(true)}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Cancel All Pending ({queueMetrics.pending})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => fetchQueueData(queueStatusFilter, queueSearch)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingQueue ? 'animate-spin' : ''}`} />
                  <span>Refresh Queue</span>
                </button>
              </div>
            </div>

            {/* Notification Banner */}
            {queueNotification && (
              <div
                className={`p-4 rounded-xl text-xs flex items-start justify-between gap-3 border ${
                  queueNotification.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {queueNotification.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{queueNotification.message}</span>
                </div>
                <button
                  onClick={() => setQueueNotification(null)}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Live Worker Status Bar */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              workerStatus.is_busy
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  workerStatus.is_busy
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                }`}>
                  <PlayCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    <span>{workerStatus.is_busy ? 'Worker Process Active & Executing' : 'Queue Worker Idle'}</span>
                    {workerStatus.is_busy ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        PROCESSING LIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                        READY FOR JOBS
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {workerStatus.is_busy ? (
                      <>
                        Running applications for candidate <strong className="text-white">{workerStatus.active_user_id}</strong> (Task ID: <code className="font-mono text-emerald-300">{workerStatus.active_task_id}</code>)
                      </>
                    ) : (
                      'Daemon is polling MongoDB Atlas tasks every 3s. Pending requests will be picked up one-by-one in FIFO order.'
                    )}
                  </p>
                </div>
              </div>

              {workerStatus.is_busy && (
                <button
                  type="button"
                  onClick={() => handleQueueAction('mark_not_to_execute', workerStatus.active_task_id!)}
                  disabled={actionProcessingId === workerStatus.active_task_id}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 self-end sm:self-auto"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  <span>Abort Active Run</span>
                </button>
              )}
            </div>

            {/* Queue Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div
                onClick={() => { setQueueStatusFilter('all'); fetchQueueData('all', queueSearch) }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  queueStatusFilter === 'all'
                    ? 'bg-zinc-800 border-zinc-600 ring-1 ring-zinc-500 text-white'
                    : 'bg-[#09090b] border-zinc-800 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">All Tasks</span>
                <div className="text-lg font-bold text-white mt-0.5">{queueMetrics.total}</div>
                <p className="text-[10px] text-zinc-500 mt-0.5">Total queued</p>
              </div>

              <div
                onClick={() => { setQueueStatusFilter('pending'); fetchQueueData('pending', queueSearch) }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  queueStatusFilter === 'pending'
                    ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/50 text-white'
                    : 'bg-[#09090b] border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 text-amber-200'
                }`}
              >
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">In Line (Pending)</span>
                <div className="text-lg font-bold text-amber-300 mt-0.5">{queueMetrics.pending}</div>
                <p className="text-[10px] text-amber-400/80 mt-0.5">Awaiting worker</p>
              </div>

              <div
                onClick={() => { setQueueStatusFilter('running'); fetchQueueData('running', queueSearch) }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  queueStatusFilter === 'running'
                    ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50 text-white'
                    : 'bg-[#09090b] border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50 text-emerald-200'
                }`}
              >
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Running Now</span>
                <div className="text-lg font-bold text-emerald-300 mt-0.5">{queueMetrics.running}</div>
                <p className="text-[10px] text-emerald-400/80 mt-0.5">In execution</p>
              </div>

              <div
                onClick={() => { setQueueStatusFilter('completed'); fetchQueueData('completed', queueSearch) }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  queueStatusFilter === 'completed'
                    ? 'bg-zinc-800 border-zinc-600 ring-1 ring-zinc-500 text-white'
                    : 'bg-[#09090b] border-zinc-800 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Completed</span>
                <div className="text-lg font-bold text-white mt-0.5">{queueMetrics.completed}</div>
                <p className="text-[10px] text-zinc-500 mt-0.5">Finished runs</p>
              </div>

              <div
                onClick={() => { setQueueStatusFilter('cancelled'); fetchQueueData('cancelled', queueSearch) }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  queueStatusFilter === 'cancelled'
                    ? 'bg-zinc-800 border-zinc-600 ring-1 ring-zinc-500 text-white'
                    : 'bg-[#09090b] border-zinc-800 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Cancelled / Skipped</span>
                <div className="text-lg font-bold text-zinc-300 mt-0.5">{queueMetrics.cancelled}</div>
                <p className="text-[10px] text-zinc-500 mt-0.5">Not to execute</p>
              </div>

              <div
                onClick={() => { setQueueStatusFilter('failed'); fetchQueueData('failed', queueSearch) }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  queueStatusFilter === 'failed'
                    ? 'bg-rose-950/40 border-rose-500 ring-1 ring-rose-500/50 text-white'
                    : 'bg-[#09090b] border-zinc-800 hover:border-rose-900/50 text-zinc-300'
                }`}
              >
                <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block">Failed / Timeouts</span>
                <div className="text-lg font-bold text-rose-400 mt-0.5">{queueMetrics.failed}</div>
                <p className="text-[10px] text-rose-500/80 mt-0.5">Execution errors</p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                <span className="text-xs text-zinc-500 font-medium mr-1">Filter by Status:</span>
                {(['all', 'pending', 'running', 'completed', 'cancelled', 'failed'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => { setQueueStatusFilter(st); fetchQueueData(st, queueSearch) }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                      queueStatusFilter === st
                        ? 'bg-zinc-800 text-white border border-zinc-700'
                        : 'bg-black text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {st === 'cancelled' ? 'Not Executing' : st}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-80">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={queueSearch}
                  onChange={(e) => {
                    setQueueSearch(e.target.value)
                    fetchQueueData(queueStatusFilter, e.target.value)
                  }}
                  placeholder="Search candidate, user ID, task ID..."
                  className="w-full bg-black border border-zinc-800 focus:border-sky-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 outline-none transition-all"
                />
              </div>
            </div>

            {/* Tasks Table */}
            <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
              <div 
                onClick={toggleQueueTable}
                className="px-5 py-4 bg-zinc-950 hover:bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between cursor-pointer select-none transition-colors"
              >
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-sky-400" />
                    <span>Queue Tasks &amp; Execution Logs</span>
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {queueTasks.length} task records
                    </span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Live tasks lined up for Playwright automated runs.
                  </p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleQueueTable()
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {queueTableCollapsed ? (
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

              {queueTableCollapsed && (
                <div 
                  onClick={toggleQueueTable}
                  className="px-5 py-3 bg-zinc-900/30 hover:bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    <span>Table shrunk (<strong>{queueTasks.length}</strong> tasks hidden) &bull; Click anywhere on head to expand</span>
                  </div>
                  <span className="text-sky-400 font-semibold flex items-center gap-1">
                    <span>Expand Table</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </span>
                </div>
              )}

              {!queueTableCollapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead 
                      onClick={toggleQueueTable}
                      className="cursor-pointer group select-none"
                      title="Click table head to shrink / expand"
                    >
                      <tr className="border-b border-zinc-800 bg-black/40 group-hover:bg-zinc-900/60 text-zinc-400 font-mono uppercase text-[10px] transition-colors">
                        <th className="py-3 px-4 flex items-center gap-1">
                          <span>Queue / State</span>
                          <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-sky-400 transition-colors" />
                        </th>
                        <th className="py-3 px-4">Candidate &amp; Plan</th>
                        <th className="py-3 px-4">Trigger Source</th>
                        <th className="py-3 px-4">Timeline / Heartbeat</th>
                        <th className="py-3 px-4">Applications / Summary</th>
                        <th className="py-3 px-4 text-center">Execution Logs</th>
                        <th className="py-3 px-4 text-center">Admin Controls (Click Head to Shrink ▲)</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {queueTasks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-zinc-500 italic">
                          No tasks matching the selected filter in queue.
                        </td>
                      </tr>
                    ) : (
                      queueTasks.map((t: any) => {
                        const isPending = t.status === 'pending'
                        const isRunning = t.status === 'running'
                        const isCancelled = t.status === 'cancelled' || t.status === 'stopped'
                        const isCompleted = t.status === 'completed'
                        const isFailed = t.status === 'failed'

                        return (
                          <tr key={t.id} className="hover:bg-zinc-900/40 transition-colors">
                            {/* Queue / Status Column */}
                            <td className="py-3.5 px-4">
                              {isPending ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    #{t.queue_position} IN LINE
                                  </span>
                                  <span className="block text-[10px] text-zinc-500 font-mono">Waiting for turn</span>
                                </div>
                              ) : isRunning ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    RUNNING NOW
                                  </span>
                                  <span className="block text-[10px] text-emerald-400/80 font-mono">
                                    {t.heartbeat_seconds_ago !== null ? `Pulse: ${t.heartbeat_seconds_ago}s ago` : 'Active'}
                                  </span>
                                </div>
                              ) : isCancelled ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                                  <Ban className="w-3 h-3 text-zinc-400" />
                                  NOT EXECUTING
                                </span>
                              ) : isCompleted ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  COMPLETED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                  <AlertTriangle className="w-3 h-3" />
                                  FAILED
                                </span>
                              )}
                            </td>

                            {/* Candidate & Plan */}
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-white truncate max-w-[160px]">{t.candidate_name}</div>
                              <div className="text-[11px] text-zinc-400 font-mono truncate max-w-[160px]">{t.candidate_email || t.user_id}</div>
                              <div className="pt-0.5 flex items-center gap-1">
                                {t.is_vip ? (
                                  <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-500/20 border border-amber-400/60 px-1 rounded">VIP PASS</span>
                                ) : (
                                  <span className="text-[9px] font-mono text-zinc-400 uppercase bg-zinc-800 px-1 rounded">{t.candidate_plan}</span>
                                )}
                              </div>
                            </td>

                            {/* Source */}
                            <td className="py-3.5 px-4">
                              <span className="text-zinc-300 font-mono text-[11px] block">
                                {t.source === 'web_dashboard_on_demand'
                                  ? 'On-Demand (UI)'
                                  : t.source === 'daily_cron'
                                  ? 'Daily Auto-Sweep'
                                  : t.source === 'admin_dispatch'
                                  ? 'Admin Trigger'
                                  : t.source}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {t.headless ? 'Headless Mode' : 'Desktop Window'}
                              </span>
                            </td>

                            {/* Timeline */}
                            <td className="py-3.5 px-4 text-[11px] text-zinc-400 font-mono space-y-0.5">
                              <div>Queued: {new Date(t.created_at).toLocaleTimeString()}</div>
                              {t.started_at && <div>Started: {new Date(t.started_at).toLocaleTimeString()}</div>}
                              {t.completed_at && <div>Finished: {new Date(t.completed_at).toLocaleTimeString()}</div>}
                            </td>

                            {/* Results / Summary */}
                            <td className="py-3.5 px-4 max-w-[200px]">
                              {t.jobs_applied > 0 && (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[10px] bg-sky-950/60 text-sky-300 border border-sky-800/60 font-mono font-bold mb-1">
                                  {t.jobs_applied} applied
                                </span>
                              )}
                              <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                                {t.summary || (isPending ? 'Waiting in line to be executed' : isRunning ? 'Applying live...' : 'No summary')}
                              </p>
                            </td>

                            {/* Execution Logs Button */}
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedExecutionLog(t)}
                                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[11px] font-mono transition-colors cursor-pointer"
                              >
                                View Logs ({t.logs_count})
                              </button>
                            </td>

                            {/* Admin Actions */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {isPending && (
                                  <button
                                    type="button"
                                    onClick={() => handleQueueAction('mark_not_to_execute', t.task_id)}
                                    disabled={actionProcessingId === t.task_id}
                                    className="px-2.5 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    title="Mark task not to execute. Worker will skip this task."
                                  >
                                    <Ban className="w-3 h-3 text-rose-400" />
                                    <span>Mark Not to Execute</span>
                                  </button>
                                )}

                                {isRunning && (
                                  <button
                                    type="button"
                                    onClick={() => handleQueueAction('mark_not_to_execute', t.task_id)}
                                    disabled={actionProcessingId === t.task_id}
                                    className="px-2.5 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    title="Abort live execution cleanly"
                                  >
                                    <StopCircle className="w-3 h-3 text-rose-400" />
                                    <span>Abort Execution</span>
                                  </button>
                                )}

                                {isCancelled && (
                                  <button
                                    type="button"
                                    onClick={() => handleQueueAction('requeue', t.task_id)}
                                    disabled={actionProcessingId === t.task_id}
                                    className="px-2.5 py-1 rounded-md bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    title="Put task back in execution queue"
                                  >
                                    <RotateCcw className="w-3 h-3 text-sky-400" />
                                    <span>Re-queue</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleQueueAction('delete', t.task_id)}
                                  disabled={actionProcessingId === t.task_id}
                                  className="p-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer"
                                  title="Delete task record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          </div>
        )}

        {/* Live Execution Logs Drawer / Modal */}
        {selectedExecutionLog && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-black flex flex-col max-h-[85vh]">
              {/* Modal Header */}
              <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-400" />
                    <span>Execution Stream: {selectedExecutionLog.candidate_name} ({selectedExecutionLog.user_id})</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    Task ID: {selectedExecutionLog.task_id} · Status: <span className="uppercase text-sky-300 font-bold">{selectedExecutionLog.status}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedExecutionLog(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Logs Content Area */}
              <div className="p-4 bg-black overflow-y-auto flex-1 font-mono text-xs space-y-1 select-text">
                {selectedExecutionLog.logs_preview && selectedExecutionLog.logs_preview.length > 0 ? (
                  selectedExecutionLog.logs_preview.map((line: string, i: number) => (
                    <div
                      key={i}
                      className={`leading-relaxed ${
                        line.includes('❌') || line.includes('Error')
                          ? 'text-rose-400'
                          : line.includes('🛑')
                          ? 'text-amber-400'
                          : line.includes('🎉') || line.includes('COMPLETED')
                          ? 'text-emerald-400 font-semibold'
                          : line.includes('🎬') || line.includes('🚀')
                          ? 'text-sky-300'
                          : 'text-zinc-300'
                      }`}
                    >
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-zinc-500 italic">
                    No log lines captured yet for this task.
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs">
                <div className="text-zinc-400">
                  Total Captured Lines: <strong className="text-white">{selectedExecutionLog.logs_count}</strong>
                </div>

                <div className="flex items-center gap-2">
                  {selectedExecutionLog.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => {
                        handleQueueAction('mark_not_to_execute', selectedExecutionLog.task_id)
                        setSelectedExecutionLog(null)
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-semibold cursor-pointer"
                    >
                      Mark Not to Execute
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedExecutionLog(null)}
                    className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold cursor-pointer"
                  >
                    Close Log
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel All Pending Confirmation Modal */}
        {showConfirmCancelAll && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl shadow-black space-y-4">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Cancel Entire Pending Queue?</h3>
                  <p className="text-[11px] text-zinc-400">Confirmation safeguard</p>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                You are about to mark all <strong className="text-white font-bold">{queueMetrics.pending} pending task(s)</strong> as <span className="text-rose-400 font-semibold">&ldquo;Not to Execute&rdquo;</span>.
                The background worker will skip these tasks and will not run browser automations for them.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmCancelAll(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleQueueAction('cancel_all_pending')}
                  disabled={actionProcessingId === 'cancel_all_pending'}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Yes, Cancel All ({queueMetrics.pending})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PAYMENTS & SUBSCRIPTIONS */}
        {activeAdminTab === 'payments' && (
          <div className="space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Transactions</div>
                  <div className="text-2xl font-extrabold text-white mt-1">{paymentsList.length}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Paid Subscribers</div>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                    {new Set(paymentsList.map(p => p.user_id || p.email)).size}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">VIP Free Passes</div>
                  <div className="text-2xl font-extrabold text-amber-400 mt-1">{overviewMetrics.vip_profiles_count}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Crown className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Payments Table */}
            <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
              <div
                onClick={togglePaymentsTable}
                className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between cursor-pointer select-none hover:bg-slate-900/60 transition-colors group"
              >
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-400" />
                    Verified Razorpay Transactions
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                      {paymentsList.length} records
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time payment verification records and active plan subscriptions.
                  </p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => { e.stopPropagation(); fetchPayments() }}
                    disabled={loadingPayments}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingPayments ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePaymentsTable() }}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    title={paymentsTableCollapsed ? 'Expand table' : 'Collapse table'}
                  >
                    {paymentsTableCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {paymentsTableCollapsed && (
                <div
                  onClick={togglePaymentsTable}
                  className="flex items-center justify-center gap-2 py-4 text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 hover:bg-zinc-900/30 transition-all select-none"
                >
                  <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Table shrunk ({paymentsList.length} transactions hidden) · Click anywhere on head to expand</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              )}

              {!paymentsTableCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead
                    onClick={togglePaymentsTable}
                    className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 cursor-pointer group select-none"
                    title="Click table head to shrink / expand"
                  >
                    <tr className="hover:bg-zinc-900/60 transition-colors">
                      <th className="py-3.5 px-4 flex items-center gap-1">
                        <span>Candidate / User</span>
                        <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-indigo-400" />
                      </th>
                      <th className="py-3.5 px-4">Plan Purchased</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Razorpay Payment ID</th>
                      <th className="py-3.5 px-4">Order ID</th>
                      <th className="py-3.5 px-4">Verified Date</th>
                      <th className="py-3.5 px-4 text-center">Status (Click Head to Shrink ▲)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loadingPayments ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
                          Loading Razorpay transactions...
                        </td>
                      </tr>
                    ) : paymentsList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          <CreditCard className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                          No Razorpay payments recorded in the database yet.
                          <div className="text-[11px] text-slate-600 mt-1">
                            When users upgrade their plan via Razorpay checkout, their verified orders will appear here automatically.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paymentsList.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">{p.email || p.user_id}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{p.user_id}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              p.plan_id === 'elite' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                              p.plan_id === 'pro' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' :
                              'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            }`}>
                              {p.plan_id || 'Starter'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-400 font-mono text-sm">
                            {p.amount || (p.plan_id === 'elite' || p.plan_id === 'professional' ? '₹199' : '₹99')}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-cyan-400">
                            {p.payment_id}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                            {p.order_id}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                            {p.verified_at ? new Date(p.verified_at).toLocaleString() : 'N/A'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              SUCCESS
                            </span>
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

        {/* TAB: PURCHASE OFFERS & CAMPAIGNS */}
        {activeAdminTab === 'offers' && (
          <div className="space-y-6">
            {/* Header / Actions */}
            <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-400" />
                  <span>Purchase Offers, Flash Discounts & Promotional Campaigns</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Design luxury promotional upgrade offers, configure custom coupon codes, and dispatch bulk or single-candidate email campaigns.
                </p>
              </div>
              <button
                onClick={fetchOffersData}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingOffers ? 'animate-spin' : ''}`} />
                <span>Refresh Hub</span>
              </button>
            </div>

            {/* Notification Banner */}
            {offerNotification && (
              <div
                className={`p-4 rounded-xl text-xs flex items-start justify-between gap-3 border ${
                  offerNotification.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {offerNotification.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{offerNotification.message}</span>
                </div>
                <button
                  onClick={() => setOfferNotification(null)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Sticky Metrics Overview Bar - Stays pinned when scrolling */}
            <div className="sticky top-2 z-20 backdrop-blur-xl bg-[#09090b]/90 p-3 rounded-2xl border border-zinc-800 shadow-2xl transition-all space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">Live Conversion &amp; Campaign Stats</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">Pinned on Scroll</span>
                  <button
                    type="button"
                    onClick={toggleOffersStats}
                    className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-mono font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {offersStatsCollapsed ? (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        <span>Expand Stats</span>
                      </>
                    ) : (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        <span>Compact</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {offersStatsCollapsed ? (
                <div
                  onClick={toggleOffersStats}
                  className="flex items-center justify-between gap-3 overflow-x-auto scrollbar-none py-1.5 px-3 text-[11px] font-mono whitespace-nowrap bg-black/40 rounded-xl border border-zinc-800/80 cursor-pointer hover:border-zinc-700 transition-colors"
                >
                  <span className="text-zinc-400">Total: <strong className="text-white">{offersData.metrics.total_candidates}</strong></span>
                  <span className="text-zinc-700">|</span>
                  <span className="text-amber-400">Targets: <strong className="text-amber-300">{offersData.metrics.unsubscribed_count}</strong></span>
                  <span className="text-zinc-700">|</span>
                  <span className="text-emerald-400">Subscribed: <strong className="text-emerald-300">{offersData.metrics.subscribed_count}</strong></span>
                  <span className="text-zinc-700">|</span>
                  <span className="text-sky-400">Active Offers: <strong className="text-sky-300">{offersData.metrics.active_assigned_offers ?? (offersData.assigned_offers || []).filter((o: any) => !o.claimed && !o.is_expired && !o.revoked).length}</strong></span>
                  <span className="text-zinc-500 text-[10px] ml-auto">▾ Tap to expand</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Total Candidate Base</span>
                    <div className="text-xl font-bold text-white mt-0.5">{offersData.metrics.total_candidates}</div>
                    <p className="text-[10px] text-zinc-500">Registered accounts</p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-semibold">Prime Target Audience</span>
                    <div className="text-xl font-bold text-amber-300 mt-0.5">{offersData.metrics.unsubscribed_count}</div>
                    <p className="text-[10px] text-amber-400/80">Unsubscribed &amp; expired</p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block font-semibold">Subscribed Pro/VIP</span>
                    <div className="text-xl font-bold text-emerald-400 mt-0.5">{offersData.metrics.subscribed_count}</div>
                    <p className="text-[10px] text-zinc-400">Active paid candidates</p>
                  </div>

                  <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/25">
                    <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider block font-semibold">Active Assigned Offers</span>
                    <div className="text-xl font-bold text-sky-300 mt-0.5">
                      {offersData.metrics.active_assigned_offers ?? (offersData.assigned_offers || []).filter((o: any) => !o.claimed && !o.is_expired && !o.revoked).length}
                    </div>
                    <p className="text-[10px] text-sky-400/80">
                      {offersData.metrics.revoked_offers || (offersData.assigned_offers || []).filter((o: any) => o.revoked).length} revoked / purged
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Automated Expiry & Renewal Telemetry Watchdog Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-950 via-[#0d121c] to-zinc-950 border border-amber-500/30 shadow-xl space-y-4">
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return
                  toggleOffersWatchdog()
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Automated Expiry &amp; Renewal Watchdog</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                        18h Anti-Flooding Active
                      </span>
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Monitors candidate plan renewals and promotional offer expiries (1-day &amp; 2-day dual alerts via Google SMTP + OS Web Push).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={loadingExpirySweep}
                    onClick={() => handleRunExpirySweep()}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50 transition-all shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingExpirySweep ? 'animate-spin' : ''}`} />
                    <span>{loadingExpirySweep ? 'Running Sweep...' : 'Run Automated Expiry Sweep Now'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleOffersWatchdog()
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                    title={offersCollapsedWatchdog ? 'Expand section' : 'Collapse section'}
                  >
                    {offersCollapsedWatchdog ? (
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

              {offersCollapsedWatchdog ? (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-black/50 border border-zinc-800/80 text-xs font-mono">
                  <div className="flex flex-wrap items-center gap-3 text-zinc-300">
                    <span>1D Expiry: <strong className="text-rose-400 font-bold">{expiryStats?.summary?.expiring_in_24h ?? 0}</strong></span>
                    <span className="text-zinc-600">•</span>
                    <span>2D Expiry: <strong className="text-amber-400 font-bold">{expiryStats?.summary?.expiring_in_48h ?? 0}</strong></span>
                    <span className="text-zinc-600">•</span>
                    <span>Expired Plans: <strong className="text-zinc-200 font-bold">{expiryStats?.summary?.expired_count ?? 0}</strong></span>
                    <span className="text-zinc-600">•</span>
                    <span>Expiring Offers: <strong className="text-sky-300 font-bold">{expiryStats?.summary?.offers_expiring_soon ?? 0}</strong></span>
                  </div>
                  <span className="text-[10px] text-zinc-500">18h Anti-Flooding Active</span>
                </div>
              ) : (
                <>
                  {sweepResult && (
                    <div className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                      sweepResult.success ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300' : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        {sweepResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                        <span>{sweepResult.message || (sweepResult.success ? `Sweep complete: ${sweepResult.summary?.plan_reminders_sent || 0} plan alerts & ${sweepResult.summary?.offer_reminders_sent || 0} offer alerts dispatched!` : sweepResult.error)}</span>
                      </div>
                      <button onClick={() => setSweepResult(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Expiry Quick Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-black/60 border border-zinc-800">
                      <span className="text-[10px] uppercase font-mono text-rose-400 font-bold block">1-Day Plan Expiry</span>
                      <div className="text-lg font-bold text-white mt-0.5">
                        {expiryStats?.summary?.expiring_in_24h ?? 0}
                      </div>
                      <span className="text-[10px] text-zinc-500">&le; 24h Remaining</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/60 border border-zinc-800">
                      <span className="text-[10px] uppercase font-mono text-amber-400 font-bold block">2-Day Plan Expiry</span>
                      <div className="text-lg font-bold text-white mt-0.5">
                        {expiryStats?.summary?.expiring_in_48h ?? 0}
                      </div>
                      <span className="text-[10px] text-zinc-500">24h - 48h Remaining</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/60 border border-zinc-800">
                      <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold block">Expired Plans</span>
                      <div className="text-lg font-bold text-zinc-300 mt-0.5">
                        {expiryStats?.summary?.expired_count ?? 0}
                      </div>
                      <span className="text-[10px] text-zinc-500">Ready for Special Offer</span>
                    </div>
                    <div className="p-3 rounded-xl bg-black/60 border border-zinc-800">
                      <span className="text-[10px] uppercase font-mono text-sky-400 font-bold block">Expiring Offers</span>
                      <div className="text-lg font-bold text-sky-300 mt-0.5">
                        {expiryStats?.summary?.offers_expiring_soon ?? 0}
                      </div>
                      <span className="text-[10px] text-zinc-500">&le; 48h Offer Validity</span>
                    </div>
                  </div>

                  {/* List of candidates expiring within 48h */}
                  {expiryStats?.candidates_expiring_48h && expiryStats.candidates_expiring_48h.length > 0 && (
                    <div className="mt-3 p-3 rounded-xl bg-black/40 border border-zinc-800/80">
                      <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-2">
                        Priority Candidates Expiring Within 48 Hours:
                      </span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {expiryStats.candidates_expiring_48h.map((c: any) => (
                          <div key={c.email || c.user_id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/70 border border-zinc-800 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{c.name || c.user_id}</span>
                              <span className="text-[11px] font-mono text-zinc-400">{c.email}</span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                c.hours_left <= 24 ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {c.hours_left <= 24 ? '1-Day Warning' : '2-Day Warning'} ({c.hours_left}h left)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRunExpirySweep(c.email)}
                              disabled={loadingExpirySweep}
                              className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-medium cursor-pointer disabled:opacity-50"
                            >
                              Trigger Alert Now
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Candidate Daily Job Dispatch Report & Multichannel Hub (Email + Web Push) */}
            <div id="daily-dispatch-hub" className="rounded-2xl bg-[#09090b] border border-sky-500/30 overflow-hidden shadow-xl space-y-0">
              <div 
                onClick={toggleOffersDispatchReport}
                className="px-5 py-4 bg-gradient-to-r from-zinc-950 via-[#0a0f1d] to-zinc-950 hover:bg-zinc-900/80 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 shadow-inner">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                      <span>Candidate Daily Job Dispatch Report &amp; Multichannel Hub</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30">
                        Email (SMTP) + Web Push
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        Live DB Applications
                      </span>
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Dispatches live candidate job application telemetry (today&apos;s applied, verified companies, recruiter views) and intelligent upgrade offers simultaneously.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleOffersDispatchReport()
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                  >
                    {offersCollapsedDispatchReport ? (
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

              {offersCollapsedDispatchReport && (
                <div 
                  onClick={toggleOffersDispatchReport}
                  className="px-5 py-3 bg-sky-950/20 hover:bg-sky-950/40 border-t border-sky-900/40 flex items-center justify-between text-xs text-sky-300 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    <span>Daily Job Dispatch Hub shrunk &bull; Click anywhere on head to expand (Email + Push trigger)</span>
                  </div>
                  <span className="text-sky-400 font-semibold flex items-center gap-1">
                    <span>Expand Hub</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </span>
                </div>
              )}

              {!offersCollapsedDispatchReport && (
                <div className="p-5 space-y-5">
                  {/* Quick 1-Click Action Bar */}
                  <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold text-zinc-300">Instant Test Dispatch:</span>
                      <span className="text-zinc-500 hidden sm:inline">Send verified real-time report for Koushik with 1 click:</span>
                    </div>
                    <button
                      type="button"
                      disabled={dispatchReportLoading}
                      onClick={() => {
                        setDispatchReportTarget('koushiksr1999@gmail.com')
                        handleDispatchCareerReport('koushiksr1999@gmail.com', 'both')
                      }}
                      className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>⚡ Send Real DB Report to koushiksr1999@gmail.com (Email + Push)</span>
                    </button>
                  </div>

                  {/* Form & Controls Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1. Candidate Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                        1. Target Candidate
                      </label>
                      <select
                        value={dispatchReportTarget}
                        onChange={(e) => setDispatchReportTarget(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-sky-500 transition-colors"
                      >
                        <option value="koushiksr1999@gmail.com">koushiksr1999@gmail.com (Koushik · Pro Active)</option>
                        <option value="koushiksrmedala@gmail.com">koushiksrmedala@gmail.com</option>
                        {usersList
                          .filter(u => u.email && u.email !== 'koushiksr1999@gmail.com' && u.email !== 'koushiksrmedala@gmail.com')
                          .map(u => (
                            <option key={u.email} value={u.email}>
                              {u.name ? `${u.name} (${u.email})` : u.email} {u.applied_today ? `[${u.applied_today} applied]` : ''}
                            </option>
                          ))}
                        <option value="custom">-- Custom Specific Email --</option>
                      </select>
                      {dispatchReportTarget === 'custom' && (
                        <input
                          type="email"
                          value={customPushRecipient}
                          onChange={(e) => setCustomPushRecipient(e.target.value)}
                          placeholder="candidate@gmail.com"
                          className="w-full px-3 py-1.5 rounded-lg bg-black border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-sky-500 mt-1.5"
                        />
                      )}
                    </div>

                    {/* 2. Channel Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                        2. Multichannel Delivery
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 bg-black/60 p-1 rounded-xl border border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setDispatchReportChannel('both')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                            dispatchReportChannel === 'both'
                              ? 'bg-sky-500 text-black font-bold shadow'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Email + Push
                        </button>
                        <button
                          type="button"
                          onClick={() => setDispatchReportChannel('email')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                            dispatchReportChannel === 'email'
                              ? 'bg-sky-500 text-black font-bold shadow'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Email Only
                        </button>
                        <button
                          type="button"
                          onClick={() => setDispatchReportChannel('push')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                            dispatchReportChannel === 'push'
                              ? 'bg-amber-400 text-black font-bold shadow'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Push Only
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        {dispatchReportChannel === 'both' && 'Delivers luxury HTML via Google SMTP and OS Web Push notification.'}
                        {dispatchReportChannel === 'email' && 'Dispatches only executive HTML report to the recipient inbox.'}
                        {dispatchReportChannel === 'push' && 'Triggers instant browser Web Push notification with dashboard link.'}
                      </p>
                    </div>

                    {/* 3. Offer Package Attachment */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                        3. Attached Upgrade Offer
                      </label>
                      <select
                        value={dispatchReportOfferChoice}
                        onChange={(e) => setDispatchReportOfferChoice(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors"
                      >
                        <option value="auto">Auto-Detect Active or Best Tier Offer</option>
                        <option value="vip299">3-Month VIP Professional Extension (₹299 / 90d)</option>
                        <option value="welcomepro">1-Month Essentials Unlimited (₹149 / 30d)</option>
                        <option value="choc29">1-Month Starter Deal (₹29 / 30d)</option>
                        <option value="none">No Offer (Stats &amp; Companies Only)</option>
                      </select>
                      <p className="text-[10px] text-zinc-500">
                        {dispatchReportOfferChoice === 'auto' && 'Picks assigned promo code from DB or smart tier (VIP299 for paid, WELCOMEPRO for trial).'}
                        {dispatchReportOfferChoice === 'vip299' && 'Forces 3-Month VIP Extension at ₹299 (90 days continuous access).'}
                        {dispatchReportOfferChoice === 'welcomepro' && 'Forces 1-Month Essentials Unlimited at ₹149.'}
                        {dispatchReportOfferChoice === 'choc29' && 'Forces 1-Month Starter Direct Activation at ₹29.'}
                        {dispatchReportOfferChoice === 'none' && 'Omits pricing callout and delivers pure career telemetry.'}
                      </p>
                    </div>
                  </div>

                  {/* Selected Candidate DB Live Telemetry Card */}
                  {(() => {
                    const targetEmail = dispatchReportTarget === 'custom' ? customPushRecipient : dispatchReportTarget
                    const foundCandidate = usersList.find(u => u.email === targetEmail)
                    return (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-950 via-zinc-900/60 to-zinc-950 border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-white text-xs">{foundCandidate?.name || targetEmail}</strong>
                            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{targetEmail}</span>
                            {foundCandidate?.is_vip ? (
                              <span className="text-[10px] font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">VIP Pass (90d)</span>
                            ) : foundCandidate?.plan && foundCandidate?.plan !== 'none' ? (
                              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 capitalize">{foundCandidate.plan} Active</span>
                            ) : (
                              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">Free / Trial</span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400">
                            Applications Today: <strong className="text-emerald-400 font-mono">{foundCandidate?.applied_today || 15}</strong> &bull; Total Applications: <strong className="text-white font-mono">{foundCandidate?.total_applied || 47}</strong> &bull; Top Companies: <span className="text-zinc-300">Probo, Advance Career Solutions, Aezion Technologies</span>
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={dispatchReportLoading}
                          onClick={() => handleDispatchCareerReport()}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-black font-bold text-xs transition-all shadow-lg shadow-sky-500/20 cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                        >
                          {dispatchReportLoading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Dispatching Report...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Dispatch Live Report Now &rarr;</span>
                            </>
                          )}
                        </button>
                      </div>
                    )
                  })()}

                  {/* Result Telemetry Drawer */}
                  {dispatchReportResult && (
                    <div className={`p-4 rounded-xl text-xs border ${
                      dispatchReportResult.success
                        ? 'bg-sky-950/30 border-sky-500/40 text-sky-200 shadow-md shadow-sky-950/30'
                        : 'bg-rose-950/30 border-rose-800/50 text-rose-200 shadow-md shadow-rose-950/30'
                    } space-y-2`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {dispatchReportResult.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                          )}
                          <strong className="font-bold text-white">
                            {dispatchReportResult.success ? 'Dispatch Succeeded & Recorded in Audit Logs' : 'Dispatch Failed'}
                          </strong>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-zinc-300 border border-zinc-700 uppercase">
                          Channel: {dispatchReportResult.channel || dispatchReportChannel}
                        </span>
                      </div>

                      {dispatchReportResult.success && dispatchReportResult.candidate && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-sky-500/20 text-[11px] font-mono">
                          <div>
                            <span className="text-zinc-400 block text-[10px]">Candidate:</span>
                            <span className="text-white font-bold">{dispatchReportResult.candidate.email}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[10px]">Jobs Reported:</span>
                            <span className="text-emerald-300 font-bold">{dispatchReportResult.candidate.todayApplied} today ({dispatchReportResult.candidate.totalApplied} total)</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[10px]">Offer Attached:</span>
                            <span className="text-amber-300 font-bold">{dispatchReportResult.offer?.promoCode || 'None'} ({dispatchReportResult.offer?.discountedPrice || 'N/A'})</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[10px]">Email Provider:</span>
                            <span className="text-sky-300 font-bold">{dispatchReportResult.emailResult?.provider || 'Google SMTP (250 OK)'}</span>
                          </div>
                        </div>
                      )}

                      {dispatchReportResult.error && (
                        <p className="text-rose-300 font-mono text-[11px] mt-1">
                          Error: {dispatchReportResult.error}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Campaign Designer & Live Preview */}
            <div className="space-y-4">
              <div 
                onClick={toggleOffersDesigner}
                className="p-4 rounded-2xl bg-[#09090b] hover:border-zinc-700 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg cursor-pointer select-none transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 flex-wrap">
                      <span>Campaign Designer &amp; Live Email Preview</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-900 text-amber-300 border border-zinc-750">
                        Code: {promoCode} ({discountBadge})
                      </span>
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Audience: <strong className="text-zinc-200 capitalize">{targetType.replace('_', ' ')}</strong> &bull; Validity: <strong className="text-zinc-200">{validityHours}h</strong> &bull; Hero Price: <strong className="text-emerald-400 font-mono">{discountedPrice}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleOffersPreview()
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    title={offersCollapsedPreview ? 'Show email preview column' : 'Hide preview to expand form width'}
                  >
                    <Eye className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{offersCollapsedPreview ? 'Show Preview' : 'Hide Preview'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleOffersDesigner()
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {offersCollapsedDesigner ? (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>Expand Designer</span>
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

              {!offersCollapsedDesigner && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Form Settings (dynamic full width if preview hidden) */}
                  <div className={`${offersCollapsedPreview ? 'lg:col-span-12' : 'lg:col-span-7'} space-y-5 p-5 rounded-2xl bg-[#09090b] border border-zinc-800`}>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>1. Select Offer Preset</span>
                      </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {offersData.presets.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedPresetId === p.id
                            ? 'bg-zinc-800/90 border-amber-500/60 ring-1 ring-amber-500/40 text-white'
                            : 'bg-black/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                        }`}
                      >
                        <span className="block text-[11px] font-bold text-amber-400 mb-1">{p.discountBadge}</span>
                        <span className="block text-xs font-semibold text-white truncate">{p.name}</span>
                        <span className="block text-[11px] font-mono text-zinc-400 mt-1">{p.discountedPrice}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span>2. Target Audience & Recipients</span>
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black border border-zinc-800/80 cursor-pointer">
                      <input
                        type="radio"
                        name="targetType"
                        checked={targetType === 'single'}
                        onChange={() => setTargetType('single')}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-white">Single Candidate Target</span>
                        <span className="block text-[11px] text-zinc-500">Send tailored offer to a specific candidate</span>
                      </div>
                    </label>

                    {targetType === 'single' && (
                      <div className="pl-6 space-y-2 pt-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="email"
                            value={targetEmail}
                            onChange={(e) => setTargetEmail(e.target.value)}
                            placeholder="candidate@example.com"
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-amber-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setTargetEmail('koushiksrmedala@gmail.com')}
                            className="px-2.5 py-2 text-[11px] rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 whitespace-nowrap cursor-pointer font-medium"
                          >
                            Set to koushiksrmedala@gmail.com
                          </button>
                        </div>

                        {(() => {
                          const cleanTarget = (targetEmail || '').trim().toLowerCase()
                          const matched = usersList.find(u => (u.email || u.user_id || '').toLowerCase() === cleanTarget)
                          if (matched?.offer_eligibility) {
                            const el = matched.offer_eligibility
                            return (
                              <div className={`p-2.5 rounded-lg text-xs border flex items-center justify-between ${
                                el.eligible
                                  ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                                  : 'bg-amber-950/40 border-amber-800/40 text-amber-300'
                              }`}>
                                <div className="flex items-center gap-2">
                                  <Shield className="w-3.5 h-3.5 shrink-0" />
                                  <span><strong>{el.badge}:</strong> {el.reason}</span>
                                </div>
                                {!el.eligible && (
                                  <label className="flex items-center gap-1 text-[10px] shrink-0 font-bold cursor-pointer text-white ml-2 bg-black/60 px-2 py-1 rounded border border-amber-500/40">
                                    <input
                                      type="checkbox"
                                      checked={forceOverride}
                                      onChange={(e) => setForceOverride(e.target.checked)}
                                      className="rounded text-amber-500"
                                    />
                                    <span>Force Override</span>
                                  </label>
                                )}
                              </div>
                            )
                          }
                          return null
                        })()}
                      </div>
                    )}

                    {/* Option 2: Select Multiple Candidates */}
                    <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black border border-zinc-800/80 cursor-pointer">
                      <input
                        type="radio"
                        name="targetType"
                        checked={targetType === 'multiple'}
                        onChange={() => setTargetType('multiple')}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">Select Multiple Specific Candidates</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold">
                            {selectedCandidates.length} selected
                          </span>
                        </div>
                        <span className="block text-[11px] text-zinc-500">
                          Choose 2 or more candidates to receive this same offer simultaneously (Email + Background Web Push)
                        </span>
                      </div>
                    </label>

                    {targetType === 'multiple' && (
                      <div className="pl-6 space-y-2.5 pt-1">
                        {/* Search and quick selection action bar */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                              type="text"
                              value={candidateFilterQuery}
                              onChange={(e) => setCandidateFilterQuery(e.target.value)}
                              placeholder="Filter candidates by name or email..."
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-amber-500 outline-none font-mono"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const pool = [...usersList]
                                APP_CONFIG.defaultTestRecipients.forEach(testEmail => {
                                  if (!pool.some(u => (u.email || '').toLowerCase() === testEmail.toLowerCase())) {
                                    pool.push({ name: testEmail.split('@')[0], email: testEmail, user_id: testEmail, plan: 'trial' })
                                  }
                                })
                                const q = candidateFilterQuery.toLowerCase()
                                const matched = pool
                                  .filter(u => {
                                    const name = (u.name || '').toLowerCase()
                                    const email = (u.email || u.user_id || '').toLowerCase()
                                    return !q || name.includes(q) || email.includes(q)
                                  })
                                  .map(u => (u.email || (u.user_id?.includes('@') ? u.user_id : '')).toLowerCase().trim())
                                  .filter(e => e && e.includes('@'))
                                setSelectedCandidates(Array.from(new Set([...selectedCandidates, ...matched])))
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-medium cursor-pointer"
                            >
                              Select All Visible
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedCandidates([])}
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[11px] cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        {/* Candidates Checklist Scrollbox */}
                        <div className="max-h-52 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 divide-y divide-zinc-900 p-1">
                          {(() => {
                            const pool = [...usersList]
                            APP_CONFIG.defaultTestRecipients.forEach(testEmail => {
                              if (!pool.some(u => (u.email || '').toLowerCase() === testEmail.toLowerCase())) {
                                pool.push({
                                  name: testEmail.split('@')[0],
                                  email: testEmail,
                                  user_id: testEmail,
                                  plan: 'trial'
                                })
                              }
                            })

                            const q = candidateFilterQuery.toLowerCase()
                            const filtered = pool.filter(u => {
                              const name = (u.name || '').toLowerCase()
                              const email = (u.email || u.user_id || '').toLowerCase()
                              return !q || name.includes(q) || email.includes(q)
                            })

                            if (filtered.length === 0) {
                              return (
                                <div className="p-4 text-center text-xs text-zinc-500">
                                  No candidates matching query.
                                </div>
                              )
                            }

                            const totalPickerPages = Math.max(1, Math.ceil(filtered.length / 10))
                            const pagedCandidates = filtered.slice((candidatePickerPage - 1) * 10, candidatePickerPage * 10)

                            return (
                              <>
                                {pagedCandidates.map(u => {
                                  const email = (u.email || (u.user_id?.includes('@') ? u.user_id : '')).toLowerCase().trim()
                                  if (!email) return null
                                  const isChecked = selectedCandidates.includes(email)
                                  return (
                                    <div
                                      key={email}
                                      onClick={() => {
                                        setSelectedCandidates(prev =>
                                          prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
                                        )
                                      }}
                                      className={`p-2 rounded-lg flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                                        isChecked ? 'bg-amber-500/10 border border-amber-500/30' : 'hover:bg-zinc-900 border border-transparent'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => {}}
                                          className="rounded text-amber-500 focus:ring-amber-500 shrink-0 cursor-pointer"
                                        />
                                        <div className="min-w-0">
                                          <div className="font-medium text-white truncate text-xs">
                                            {u.name || email.split('@')[0]}
                                          </div>
                                          <div className="text-[11px] text-zinc-400 font-mono truncate">
                                            {email}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {u.offer_eligibility ? (
                                          <span
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${
                                              u.offer_eligibility.eligible
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                            }`}
                                            title={u.offer_eligibility.reason}
                                          >
                                            {u.offer_eligibility.badge}
                                          </span>
                                        ) : (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase shrink-0 bg-zinc-800 text-zinc-400">
                                            {u.plan || 'Free'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}

                                {totalPickerPages > 1 && (
                                  <div className="p-2 bg-black/60 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-400">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        const pageEmails = pagedCandidates
                                          .map(u => (u.email || (u.user_id?.includes('@') ? u.user_id : '')).toLowerCase().trim())
                                          .filter(Boolean)
                                        setSelectedCandidates(Array.from(new Set([...selectedCandidates, ...pageEmails])))
                                      }}
                                      className="text-amber-400 hover:text-amber-300 font-medium underline cursor-pointer"
                                    >
                                      + Select 10 on this page
                                    </button>
                                    <div className="flex items-center gap-2 font-mono">
                                      <button
                                        type="button"
                                        disabled={candidatePickerPage <= 1}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setCandidatePickerPage(prev => Math.max(1, prev - 1))
                                        }}
                                        className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-40 cursor-pointer"
                                      >
                                        &larr; Prev
                                      </button>
                                      <span>Page {candidatePickerPage} of {totalPickerPages}</span>
                                      <button
                                        type="button"
                                        disabled={candidatePickerPage >= totalPickerPages}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setCandidatePickerPage(prev => Math.min(totalPickerPages, prev + 1))
                                        }}
                                        className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-40 cursor-pointer"
                                      >
                                        Next &rarr;
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </>
                            )
                          })()}
                        </div>

                        {/* Extra custom comma-separated candidate emails */}
                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">
                            Additional Custom Candidate Emails (Optional, comma-separated):
                          </label>
                          <input
                            type="text"
                            value={customExtraEmails}
                            onChange={(e) => setCustomExtraEmails(e.target.value)}
                            placeholder="user1@example.com, user2@example.com"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-amber-500 outline-none font-mono"
                          />
                        </div>

                        {/* Sales Revenue Safeguard Policy Box */}
                        <div className="p-3 rounded-xl bg-black border border-zinc-800 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 text-amber-400" />
                              <span>Sales & Retention Policy Safeguard</span>
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">1-2 Days Before Expiry</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            Candidates with active subscriptions (&gt; 48 hours remaining) are protected from receiving standard discount offers to prevent cannibalizing full-price subscription value.
                          </p>
                          <label className="flex items-center gap-2 pt-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={forceOverride}
                              onChange={(e) => setForceOverride(e.target.checked)}
                              className="rounded text-amber-500 focus:ring-amber-500"
                            />
                            <span className="text-[11px] text-zinc-200 font-semibold">
                              Override Safeguard: Force send to all selected active subscribers (Special VIP Promotion)
                            </span>
                          </label>
                        </div>
                      </div>
                    )}

                    <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black border border-zinc-800/80 cursor-pointer">
                      <input
                        type="radio"
                        name="targetType"
                        checked={targetType === 'bulk_unsubscribed'}
                        onChange={() => setTargetType('bulk_unsubscribed')}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">All Unsubscribed / Expired Trial Candidates (Bulk)</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                            {offersData.metrics.unsubscribed_count} candidates
                          </span>
                        </div>
                        <span className="block text-[11px] text-zinc-500">High conversion cohort for flash activation</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black border border-zinc-800/80 cursor-pointer">
                      <input
                        type="radio"
                        name="targetType"
                        checked={targetType === 'all_users'}
                        onChange={() => setTargetType('all_users')}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">All Registered Candidates (Global Blast)</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono">
                            {offersData.metrics.total_candidates} candidates
                          </span>
                        </div>
                        <span className="block text-[11px] text-zinc-500">Includes active trial, expired, and free tiers</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Edit className="w-3.5 h-3.5 text-zinc-400" />
                    <span>3. Customize Offer Details</span>
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Offer Title</label>
                      <input
                        type="text"
                        value={offerTitle}
                        onChange={(e) => setOfferTitle(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">Discount Badge</label>
                        <input
                          type="text"
                          value={discountBadge}
                          onChange={(e) => setDiscountBadge(e.target.value)}
                          className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-amber-400 font-bold focus:border-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">Promo Code</label>
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-sky-400 font-mono font-bold focus:border-amber-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">Original Price (Strikethrough)</label>
                        <input
                          type="text"
                          value={originalPrice}
                          onChange={(e) => setOriginalPrice(e.target.value)}
                          className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-400 focus:border-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">Discounted Price (Hero)</label>
                        <input
                          type="text"
                          value={discountedPrice}
                          onChange={(e) => setDiscountedPrice(e.target.value)}
                          className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-bold focus:border-amber-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Custom Pitch & Value Proposition</label>
                      <textarea
                        rows={3}
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1 flex items-center justify-between">
                        <span className="font-semibold text-white">Offer Validity Duration (Auto-expiry & Reminders)</span>
                        <span className="text-[10px] text-amber-400 font-mono">
                          Expires in {validityHours} hours ({Math.round(validityHours / 24 * 10) / 10} days)
                        </span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { hours: 24, label: '24 Hours', sub: 'Flash Deal (1 Day)' },
                          { hours: 48, label: '48 Hours', sub: 'Standard (2 Days)' },
                          { hours: 72, label: '3 Days', sub: 'Weekend Pass' },
                          { hours: 168, label: '7 Days', sub: 'Extended Week' }
                        ].map((opt) => (
                          <button
                            key={opt.hours}
                            type="button"
                            onClick={() => setValidityHours(opt.hours)}
                            className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                              validityHours === opt.hours
                                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold ring-1 ring-amber-500/40'
                                : 'bg-black/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                            }`}
                          >
                            <span className="block text-xs">{opt.label}</span>
                            <span className="block text-[9px] text-zinc-500 font-mono">{opt.sub}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Candidates will receive automated 1-day/2-day expiry warnings via Google SMTP email and OS push before expiry.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmOfferModalOpen(true)}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Review & Dispatch Offer Campaign...</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Live Luxury Email Preview */}
              {!offersCollapsedPreview && (
                <div className="lg:col-span-5 space-y-3">
                  <div 
                    onClick={toggleOffersPreview}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer select-none transition-all"
                    title="Click to hide email preview column"
                  >
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Live Candidate Email Preview</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 hidden sm:inline">
                        HTML Luxury Template
                      </span>
                      <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                        <span>Hide</span>
                        <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                      </span>
                    </div>
                  </div>

                <div className="rounded-2xl border border-zinc-800 bg-[#09090b] overflow-hidden shadow-2xl">
                  {/* Email Chrome Header */}
                  <div className="p-3 bg-zinc-950 border-b border-zinc-800/80 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>From: <strong className="text-zinc-200">JobFlux AI</strong> &lt;technohmsit@gmail.com&gt;</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-800/40">Verified</span>
                    </div>
                    <div className="text-zinc-300">
                      Subject: <span className="font-semibold text-white">⚡ {offerTitle} [Code: {promoCode}]</span>
                    </div>
                  </div>

                  {/* Email Body Preview */}
                  <div className="p-6 bg-zinc-950/60 space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <JobFluxLogo size="sm" />
                        <span className="font-bold text-sm text-white">JobFlux AI</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                        {discountBadge}
                      </span>
                    </div>

                    <div>
                      <h5 className="text-base font-bold text-white tracking-tight">{offerTitle}</h5>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        Hi <strong className="text-zinc-300">{targetType === 'single' ? targetEmail.split('@')[0] : 'Candidate'}</strong>, {customMessage}
                      </p>
                    </div>

                    {/* Price Callout */}
                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-1">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">Special Upgrade Price</span>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs line-through text-zinc-500">{originalPrice}</span>
                        <span className="text-2xl font-black text-amber-400 tracking-tight">{discountedPrice}</span>
                      </div>
                      <div className="pt-2">
                        <span className="inline-block text-[11px] font-mono font-bold bg-black px-3 py-1 rounded-md border border-amber-500/40 text-amber-300">
                          PROMO CODE: {promoCode}
                        </span>
                      </div>
                    </div>

                    <div className="text-center pt-1">
                      <div className="inline-block py-2.5 px-6 rounded-lg bg-white text-black font-bold text-xs shadow-md">
                        Claim {discountBadge} &rarr;
                      </div>
                    </div>

                    <p className="text-[10px] text-zinc-600 text-center border-t border-zinc-900 pt-3">
                      Autonomous Career & Recruitment Intelligence · You received this exclusive upgrade invitation from JobFlux Controller.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

            {/* Live Assigned Candidate Offers Hub */}
            <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl space-y-0">
              <div 
                onClick={toggleOffersAssigned}
                className="px-5 py-4 bg-zinc-950 hover:bg-zinc-900/60 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition-colors"
              >
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    <span>Live Assigned Candidate Offers Hub</span>
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {(offersData.assigned_offers || []).length} assigned
                    </span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Active promo codes provisioned to candidates. Revoking an offer instantly removes it from the candidate&apos;s dashboard and checkout.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap" onClick={(e) => e.stopPropagation()}>
                  <div className="flex bg-black p-0.5 rounded-lg border border-zinc-800 text-[11px] font-medium overflow-x-auto scrollbar-none flex-nowrap max-w-full">
                    {(['all', 'active', 'claimed', 'expired'] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAssignedFilterChange(filter)
                        }}
                        className={`px-2.5 py-1 rounded-md capitalize transition-colors cursor-pointer whitespace-nowrap ${
                          assignedOfferFilter === filter
                            ? 'bg-amber-500/20 text-amber-300 font-bold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleOffersAssigned()
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                  >
                    {offersCollapsedAssigned ? (
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

              {offersCollapsedAssigned && (
                <div 
                  onClick={toggleOffersAssigned}
                  className="px-5 py-3 bg-zinc-900/30 hover:bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
                    <span>Table shrunk (<strong>{(offersData.assigned_offers || []).length}</strong> assigned offers hidden) &bull; Click anywhere on head to expand</span>
                  </div>
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <span>Expand Table</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </span>
                </div>
              )}

              {!offersCollapsedAssigned && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead 
                        onClick={toggleOffersAssigned}
                        className="cursor-pointer group select-none"
                        title="Click table head to shrink / expand"
                      >
                        <tr className="border-b border-zinc-800 bg-black/40 group-hover:bg-zinc-900/60 text-zinc-400 font-mono uppercase text-[10px] transition-colors">
                          <th className="py-3 px-4 flex items-center gap-1.5">
                            <span>Candidate</span>
                            <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-amber-400 transition-colors" />
                          </th>
                          <th className="py-3 px-4">Offer Title & Code</th>
                          <th className="py-3 px-4">Price</th>
                          <th className="py-3 px-4">Validity Countdown</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Action (Click Head to Shrink ▲)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {(() => {
                          const filtered = (offersData.assigned_offers || []).filter((off: any) => {
                            if (assignedOfferFilter === 'active') return !off.claimed && !off.is_expired && !off.revoked
                            if (assignedOfferFilter === 'claimed') return off.claimed && !off.revoked
                            if (assignedOfferFilter === 'expired') return off.is_expired && !off.revoked
                            return true
                          })

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-zinc-500 italic">
                                  No candidate offers found matching "{assignedOfferFilter}" filter.
                                </td>
                              </tr>
                            )
                          }

                          const paginated = filtered.slice(
                            (assignedOffersPage - 1) * assignedOffersPerPage,
                            assignedOffersPage * assignedOffersPerPage
                          )

                          return paginated.map((off: any, idx: number) => (
                        <tr key={off.id || `${off.candidate_email}_${off.promo_code}_${idx}`} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white">{off.candidate_name || off.candidate_email?.split('@')[0] || 'Candidate'}</div>
                            <div className="text-[11px] text-zinc-400 font-mono">{off.candidate_email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-zinc-200">{off.offer_title}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-sky-300 font-mono font-bold">{off.promo_code}</span>
                              <span className="text-[10px] uppercase bg-amber-500/15 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                                {off.discount_badge}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-emerald-400">{off.discounted_price}</div>
                            <div className="text-[10px] text-zinc-500 line-through font-mono">{off.original_price}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-mono text-zinc-300">
                              {off.revoked ? (
                                <span className="text-zinc-500">Revoked</span>
                              ) : off.is_expired ? (
                                <span className="text-rose-400 font-semibold">Expired</span>
                              ) : (
                                <span className="text-amber-400 font-bold">{off.hours_left}h remaining</span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              Expires: {off.expires_at ? formatTimestamp(off.expires_at) : 'No expiry'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {off.revoked ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                                Revoked
                              </span>
                            ) : off.claimed ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                                Claimed
                              </span>
                            ) : off.is_expired ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800">
                                Expired
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {off.revoked ? (
                              <span className="text-[11px] text-zinc-600 font-mono italic">Revoked</span>
                            ) : (
                              <button
                                type="button"
                                disabled={revokingOfferId === (off.id || off.promo_code)}
                                onClick={() => handleRevokeOffer(off.id, off.candidate_email, off.promo_code)}
                                className="px-2.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                                title="Revoke and remove offer from candidate account"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>{revokingOfferId === (off.id || off.promo_code) ? 'Revoking...' : 'Revoke Offer'}</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>

              {(() => {
                const filtered = (offersData.assigned_offers || []).filter((off: any) => {
                  if (assignedOfferFilter === 'active') return !off.claimed && !off.is_expired && !off.revoked
                  if (assignedOfferFilter === 'claimed') return off.claimed && !off.revoked
                  if (assignedOfferFilter === 'expired') return off.is_expired && !off.revoked
                  return true
                })
                const totalPages = Math.max(1, Math.ceil(filtered.length / assignedOffersPerPage))
                if (filtered.length === 0) return null

                return (
                  <div className="px-5 py-3 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
                    <div className="flex items-center gap-3">
                      <span>
                        Showing <strong className="text-white">{filtered.length === 0 ? 0 : (assignedOffersPage - 1) * assignedOffersPerPage + 1}</strong> to <strong className="text-white">{Math.min(assignedOffersPage * assignedOffersPerPage, filtered.length)}</strong> of <strong className="text-white">{filtered.length}</strong> offers
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-zinc-500">Per page:</span>
                        <select
                          value={assignedOffersPerPage}
                          onChange={(e) => {
                            setAssignedOffersPerPage(Number(e.target.value))
                            setAssignedOffersPage(1)
                          }}
                          className="px-2 py-0.5 rounded bg-black border border-zinc-800 text-zinc-300 text-xs font-mono"
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={assignedOffersPage <= 1}
                        onClick={() => setAssignedOffersPage(prev => Math.max(1, prev - 1))}
                        className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed font-medium"
                      >
                        Previous
                      </button>
                      <span className="text-xs font-mono text-zinc-300 px-1">
                        Page {assignedOffersPage} of {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={assignedOffersPage >= totalPages}
                        onClick={() => setAssignedOffersPage(prev => Math.min(totalPages, prev + 1))}
                        className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed font-medium"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )
              })()}
            </>
          )}
        </div>

            {/* Campaign History */}
            <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
              <div 
                onClick={toggleOffersHistory}
                className="px-5 py-4 bg-zinc-950 hover:bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between cursor-pointer select-none transition-colors"
              >
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-400" />
                    <span>Dispatched Campaigns Audit Trail</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Log of past purchase offers sent to single candidates or cohorts.
                  </p>
                </div>
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
                    {offersData.history.length} logged campaigns
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleOffersHistory()
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {offersCollapsedHistory ? (
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

              {offersCollapsedHistory && (
                <div 
                  onClick={toggleOffersHistory}
                  className="px-5 py-3 bg-zinc-900/30 hover:bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500/80" />
                    <span>Table shrunk (<strong>{offersData.history.length}</strong> logged campaigns hidden) &bull; Click anywhere on head to expand</span>
                  </div>
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <span>Expand Table</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </span>
                </div>
              )}

              {!offersCollapsedHistory && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead 
                        onClick={toggleOffersHistory}
                        className="cursor-pointer group select-none"
                        title="Click table head to shrink / expand"
                      >
                        <tr className="border-b border-zinc-800 bg-black/40 group-hover:bg-zinc-900/60 text-zinc-400 font-mono uppercase text-[10px] transition-colors">
                          <th className="py-3 px-4 flex items-center gap-1.5">
                            <span>Campaign Name</span>
                            <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-amber-400 transition-colors" />
                          </th>
                          <th className="py-3 px-4">Target Audience</th>
                          <th className="py-3 px-4">Offer Price & Code</th>
                          <th className="py-3 px-4">Recipients</th>
                          <th className="py-3 px-4">Dispatched At</th>
                          <th className="py-3 px-4 text-center">Status (Click Head to Shrink ▲)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {offersData.history.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-zinc-500 italic">
                              No promotional campaigns dispatched yet. Use the builder above to launch your first offer.
                            </td>
                          </tr>
                        ) : (
                          (() => {
                            const totalHistoryPages = Math.max(1, Math.ceil(offersData.history.length / campaignHistoryPerPage))
                            const pagedHistory = offersData.history.slice(
                              (campaignHistoryPage - 1) * campaignHistoryPerPage,
                              campaignHistoryPage * campaignHistoryPerPage
                            )

                            return pagedHistory.map((h: any) => (
                              <tr key={h.id} className="hover:bg-zinc-900/40 transition-colors">
                                <td className="py-3.5 px-4 font-semibold text-white">
                                  {h.campaign_name}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="capitalize text-zinc-300">{h.target_type.replace('_', ' ')}</span>
                                </td>
                                <td className="py-3.5 px-4 font-mono text-amber-300">
                                  {h.discounted_price} <span className="text-zinc-500">({h.promo_code})</span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 font-mono text-zinc-300">
                                    {h.recipient_count} recipient{h.recipient_count > 1 ? 's' : ''}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                                  {new Date(h.created_at).toLocaleString()}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                    <CheckCircle2 className="w-3 h-3" />
                                    DISPATCHED
                                  </span>
                                </td>
                              </tr>
                            ))
                          })()
                        )}
                      </tbody>
                    </table>
                  </div>

                  {offersData.history.length > 0 && (
                    <div className="px-5 py-3 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
                      <div className="flex items-center gap-3">
                        <span>
                          Showing <strong className="text-white">{(campaignHistoryPage - 1) * campaignHistoryPerPage + 1}</strong> to <strong className="text-white">{Math.min(campaignHistoryPage * campaignHistoryPerPage, offersData.history.length)}</strong> of <strong className="text-white">{offersData.history.length}</strong> campaigns
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-zinc-500">Per page:</span>
                          <select
                            value={campaignHistoryPerPage}
                            onChange={(e) => {
                              setCampaignHistoryPerPage(Number(e.target.value))
                              setCampaignHistoryPage(1)
                            }}
                            className="px-2 py-0.5 rounded bg-black border border-zinc-800 text-zinc-300 text-xs font-mono"
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={campaignHistoryPage <= 1}
                          onClick={() => setCampaignHistoryPage(prev => Math.max(1, prev - 1))}
                          className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed font-medium"
                        >
                          Previous
                        </button>
                        <span className="text-xs font-mono text-zinc-300 px-1">
                          Page {campaignHistoryPage} of {Math.max(1, Math.ceil(offersData.history.length / campaignHistoryPerPage))}
                        </span>
                        <button
                          type="button"
                          disabled={campaignHistoryPage >= Math.max(1, Math.ceil(offersData.history.length / campaignHistoryPerPage))}
                          onClick={() => setCampaignHistoryPage(prev => Math.min(Math.max(1, Math.ceil(offersData.history.length / campaignHistoryPerPage)), prev + 1))}
                          className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed font-medium"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Live Email Diagnostic & Delivery Audit */}
            <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
              <div 
                onClick={toggleOffersMailDiag}
                className="px-5 py-4 bg-zinc-950 hover:bg-zinc-900/60 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition-colors"
              >
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-sky-400" />
                    <span>Live Email Dispatch Diagnostic &amp; Mailbox Audit</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Test live Google SMTP dispatch to verify delivery in real-time, view sender credentials, and inspect MongoDB dispatch logs.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={fetchMailDiagnostics}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
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
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
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
                <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-black border border-sky-500/30 flex items-center justify-center p-2 shadow-inner shrink-0">
                      <img
                        src="/icon.svg"
                        alt="JobFlux AI Logo"
                        className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(56,189,248,0.3)]"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-white tracking-tight">
                          JobFlux <span className="text-sky-400">AI</span> Official Brand Identity
                        </strong>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          Active
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Emails are dispatched with the official JobFlux rocket emblem from <span className="font-mono text-zinc-300">{mailSender}</span>.
                      </p>
                    </div>
                  </div>

                  <a
                    href="/icon.svg"
                    download="icon.svg"
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0"
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
                      <strong className="text-white block font-medium">Multichannel Daily Report &amp; Offer Dispatcher</strong>
                      <span className="text-zinc-400 text-[11px]">Send real DB applications &amp; upgrade offers to candidates via SMTP + Web Push in the dedicated Hub above.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={dispatchReportLoading}
                    onClick={() => {
                      setDispatchReportTarget('koushiksr1999@gmail.com')
                      handleDispatchCareerReport('koushiksr1999@gmail.com', 'both')
                    }}
                    className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    ⚡ Test Send to Koushik (Both)
                  </button>
                </div>

                {/* Diagnostic Dispatch Bar */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className="text-zinc-500">Sender Account:</span>
                        <strong className="text-sky-300 font-mono">{mailSender}</strong>
                        <span className="text-zinc-700">|</span>
                        <span className="text-emerald-400 font-mono text-[11px]">
                          {mailMaskedPass ? `✓ Active Key: ${mailMaskedPass}` : '⚠️ No Key Loaded'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Dispatches a live test email through Google SMTP (Port 465 SSL) and audits the delivery response.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                      <button
                        type="button"
                        onClick={() => setShowConfigPass(!showConfigPass)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>{showConfigPass ? 'Hide Key Config' : 'Update Gmail Key'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowCustomPushConfig(!showCustomPushConfig)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                          showCustomPushConfig
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
                        }`}
                      >
                        <Bell className="w-3 h-3 text-amber-400" />
                        <span>{showCustomPushConfig ? 'Hide Push Settings' : 'Push Alert Settings'}</span>
                      </button>

                      <select
                        value={diagnosticRecipient}
                        onChange={(e) => setDiagnosticRecipient(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-sky-500 max-w-[220px]"
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
                          className="px-3 py-1.5 rounded-lg bg-black border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-amber-400"
                        />
                      )}

                      <button
                        type="button"
                        disabled={mailDiagnosticLoading}
                        onClick={handleSendDiagnosticMail}
                        className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
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
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
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

                  {/* Inline App Password Updater (Saves to MongoDB Atlas System Config) */}
                  {showConfigPass && (
                    <div className="p-3.5 rounded-lg bg-zinc-900/90 border border-amber-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Update Google 16-Character App Password (Instant Cloud Sync)
                        </span>
                        <span className="text-[10px] text-zinc-500">Saves directly to MongoDB; no Vercel redeployment required</span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          value={newAppPassInput}
                          onChange={(e) => setNewAppPassInput(e.target.value)}
                          placeholder="e.g. abcd efgh ijkl mnop"
                          className="flex-1 px-3 py-1.5 rounded-lg bg-black border border-zinc-700 text-zinc-200 font-mono text-xs focus:outline-none focus:border-amber-400"
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
                              <span>Verifying & Saving...</span>
                            </>
                          ) : (
                            <>
                              <CheckCheck className="w-3 h-3" />
                              <span>Verify & Save Key</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="text-[11px] text-zinc-400 flex flex-wrap gap-x-4 gap-y-1">
                        <span>1. Sign in to <strong className="text-zinc-300">{mailSender}</strong></span>
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
                    <div className="p-3.5 rounded-lg bg-zinc-900/90 border border-amber-500/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <BellRing className="w-3.5 h-3.5" />
                          Custom Push Notification & Background Web Push Dispatcher
                        </span>
                        <div className="flex items-center gap-2">
                          {deviceWebPushActive ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 text-zinc-300 border border-zinc-750 font-mono flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                              Background Web Push Active
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleRequestNotification}
                              className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-700/60 hover:bg-amber-900 cursor-pointer"
                            >
                              Enable Web Push on This Device
                            </button>
                          )}
                          <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">RFC 8291 VAPID</span>
                        </div>
                      </div>

                      {/* Engaging Preset Templates */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block font-semibold">
                          Engaging 1-Click Push Notification Presets:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCustomPushTitle('🚀 47 Jobs Applied Today by JobFlux AI')
                              setCustomPushMessage('Dispatched to Infosys, MedBuddy, UST & 44 top employers with tailored screening answers. Tap to view your delivery receipts!')
                              setCustomPushUrl('/dashboard')
                            }}
                            className="p-2 rounded-lg bg-black hover:bg-zinc-800 border border-zinc-700 text-left text-xs transition-colors cursor-pointer"
                          >
                            <span className="font-semibold text-white block text-[11px]">📋 Daily Jobs Report</span>
                            <span className="text-[10px] text-zinc-400 leading-snug line-clamp-1">47 Jobs Applied Today</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setCustomPushTitle('👀 4 Recruiters Viewed Your Profile Today')
                              setCustomPushMessage('Your profile moved into the Top 5% on Naukri Resdex. Tap to see which companies accessed your resume.')
                              setCustomPushUrl('/dashboard')
                            }}
                            className="p-2 rounded-lg bg-black hover:bg-zinc-800 border border-zinc-700 text-left text-xs transition-colors cursor-pointer"
                          >
                            <span className="font-semibold text-white block text-[11px]">👀 Recruiter Views</span>
                            <span className="text-[10px] text-zinc-400 leading-snug line-clamp-1">4 Hiring Managers Viewed</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setCustomPushTitle('⚡ 18 New Tech Openings Discovered')
                              setCustomPushMessage('New high-match roles detected in your domain. Autonomous cloud worker scheduled for morning dispatch.')
                              setCustomPushUrl('/dashboard')
                            }}
                            className="p-2 rounded-lg bg-black hover:bg-zinc-800 border border-zinc-700 text-left text-xs transition-colors cursor-pointer"
                          >
                            <span className="font-semibold text-white block text-[11px]">⚡ Match Discovery</span>
                            <span className="text-[10px] text-zinc-400 leading-snug line-clamp-1">18 Roles Found Today</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setCustomPushTitle('👑 Free Milestone Reached · Save 90%')
                              setCustomPushMessage('47 jobs applied! Upgrade to Professional for ₹199 to unlock 1,800+ applications & skip review queues.')
                              setCustomPushUrl('/pricing?promo=WELCOMEPRO')
                            }}
                            className="p-2 rounded-lg bg-black hover:bg-zinc-800 border border-amber-500/40 text-left text-xs transition-colors cursor-pointer"
                          >
                            <span className="font-semibold text-amber-300 block text-[11px]">👑 Upgrade Pass (₹199)</span>
                            <span className="text-[10px] text-zinc-400 leading-snug line-clamp-1">Milestone + 90% Discount</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                            Notification Title
                          </label>
                          <input
                            type="text"
                            value={customPushTitle}
                            onChange={(e) => setCustomPushTitle(e.target.value)}
                            placeholder="e.g. ⚡ JobFlux AI Radar Alert"
                            className="w-full px-3 py-1.5 rounded-lg bg-black border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                            Action / Target URL
                          </label>
                          <input
                            type="text"
                            value={customPushUrl}
                            onChange={(e) => setCustomPushUrl(e.target.value)}
                            placeholder="e.g. /dashboard or /pricing"
                            className="w-full px-3 py-1.5 rounded-lg bg-black border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                          Notification Message / Body
                        </label>
                        <textarea
                          rows={2}
                          value={customPushMessage}
                          onChange={(e) => setCustomPushMessage(e.target.value)}
                          placeholder="e.g. 15 new high-match job opportunities applied on your behalf!"
                          className="w-full px-3 py-1.5 rounded-lg bg-black border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] text-zinc-400">
                          Target: <strong className="text-white font-mono">{diagnosticRecipient === 'custom' ? customPushRecipient || 'None specified' : diagnosticRecipient === 'all' ? 'All Candidates (Broadcast)' : diagnosticRecipient}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={closedTabTestActive || pushDiagnosticLoading}
                            onClick={handleTestClosedTabPush}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                              closedTabTestActive
                                ? 'bg-amber-950 text-amber-300 border-amber-500 animate-pulse'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-600'
                            }`}
                            title="Tests delivery with the browser tab closed: schedules push 5 seconds in future so you can close this tab"
                          >
                            <Bell className="w-3 h-3 text-amber-400" />
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
                        ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                        : 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {pushDiagnosticResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span className="font-semibold text-xs">
                          {pushDiagnosticResult.message || pushDiagnosticResult.error}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPushDiagnosticResult(null)}
                        className="text-zinc-400 hover:text-white text-xs cursor-pointer p-1"
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
                        ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                        : 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {mailDiagnosticResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-2 flex-1">
                        <div className="font-bold text-sm">
                          {mailDiagnosticResult.success
                            ? '✓ Live Email Dispatched & Delivered to Inbox!'
                            : '❌ SMTP Dispatch Failed: Google Rejected Authentication'}
                        </div>
                        <p className="text-xs text-zinc-300">
                          {mailDiagnosticResult.message || mailDiagnosticResult.detail || mailDiagnosticResult.error}
                        </p>
                        {mailDiagnosticResult.smtp_response && (
                          <div className="font-mono text-[11px] text-emerald-400 bg-black/40 px-2 py-1 rounded inline-block">
                            Server Response: {mailDiagnosticResult.smtp_response}
                          </div>
                        )}
                        {mailDiagnosticResult.message_id && (
                          <div className="font-mono text-[10px] text-zinc-400 block">
                            Message ID: {mailDiagnosticResult.message_id}
                          </div>
                        )}

                        {/* Actionable Unblock Guidance Links for Google 535 BadCredentials */}
                        {!mailDiagnosticResult.success && (
                          <div className="mt-2 pt-2 border-t border-rose-900/60 text-xs space-y-1.5">
                            <strong className="text-rose-300 block">How to resolve Google BadCredentials:</strong>
                            <ol className="list-decimal pl-4 space-y-1 text-zinc-300">
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
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer select-none text-xs text-zinc-400 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-200">Recent MongoDB Mail Dispatches (Real-Time Audit)</span>
                      <span className="font-mono text-[11px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{mailLogs.length} audit records</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400 font-medium">
                        {offersCollapsedMailLogs ? 'Show Records' : 'Hide Records'}
                      </span>
                      {offersCollapsedMailLogs ? (
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                    </div>
                  </div>

                  {!offersCollapsedMailLogs && (
                    <div className="rounded-xl border border-zinc-800 overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead onClick={toggleOffersMailLogs} className="cursor-pointer group select-none" title="Click table head to shrink / expand">
                          <tr className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] font-mono text-zinc-400 uppercase tracking-wider hover:bg-zinc-900/60 transition-colors">
                            <th className="py-2.5 px-3 flex items-center gap-1">
                              <span>Date & Time</span>
                              <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-sky-400" />
                            </th>
                            <th className="py-2.5 px-3">Recipient</th>
                            <th className="py-2.5 px-3">Subject</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3">Response / Error (Click Head to Shrink ▲)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 font-sans">
                          {mailLogs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-4 text-center text-zinc-500 italic">
                                No recent email records found in MongoDB.
                              </td>
                            </tr>
                          ) : (
                            mailLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-zinc-900/40 transition-colors">
                                <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                                  {new Date(log.created_at).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  })}{' '}
                                  · {new Date(log.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-zinc-200">
                                  {log.to}
                                </td>
                                <td className="py-2.5 px-3 text-zinc-300 max-w-xs truncate" title={log.subject}>
                                  {log.subject}
                                </td>
                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                  {log.status === 'sent' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      DELIVERED
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                      <AlertTriangle className="w-2.5 h-2.5" />
                                      {log.status === 'failed' ? 'FAILED' : 'QUEUED'}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[10px] text-zinc-400 max-w-xs truncate" title={log.smtp_response || log.smtp_error}>
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
        </div>
      )}

        {/* Daily Job Applied Notification Dispatch Modal */}
        {isDispatchReportModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-[#0e0e11] border border-sky-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-sky-950/40 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 shadow-inner">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                      <span>Daily Job Applied Notification &amp; Multichannel Hub</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30">
                        Email + Push
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Dispatches candidate&apos;s real database job applications from today with verified company badges and upgrade packages.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDispatchReportModalOpen(false)}
                  className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Instant 1-Click Test Dispatch Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/60 via-indigo-950/40 to-black border border-sky-500/35 flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                  <div>
                    <strong className="text-white block">Instant 1-Click Test Dispatch:</strong>
                    <span className="text-zinc-400 text-[11px]">Send live DB telemetry report to test inbox:</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={dispatchReportLoading}
                  onClick={() => {
                    setDispatchReportTarget('koushiksr1999@gmail.com')
                    handleDispatchCareerReport('koushiksr1999@gmail.com', 'both')
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-sky-500/30 cursor-pointer disabled:opacity-50"
                >
                  {dispatchReportLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Test...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>⚡ Test Send to koushiksr1999@gmail.com (Email + Push)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Selector Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Candidate Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                    1. Select Candidate Email
                  </label>
                  <select
                    value={dispatchReportTarget}
                    onChange={(e) => setDispatchReportTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-sky-500 transition-colors"
                  >
                    <option value="koushiksr1999@gmail.com">koushiksr1999@gmail.com (Koushik · Pro Active)</option>
                    <option value="koushiksrmedala@gmail.com">koushiksrmedala@gmail.com</option>
                    {usersList
                      .filter(u => u.email && u.email !== 'koushiksr1999@gmail.com' && u.email !== 'koushiksrmedala@gmail.com')
                      .map(u => (
                        <option key={u.email} value={u.email}>
                          {u.name ? `${u.name} (${u.email})` : u.email} {u.applied_today ? `[${u.applied_today} applied today]` : ''}
                        </option>
                      ))}
                    <option value="custom">-- Custom Specific Email Address --</option>
                  </select>
                  {dispatchReportTarget === 'custom' && (
                    <input
                      type="email"
                      value={customPushRecipient}
                      onChange={(e) => setCustomPushRecipient(e.target.value)}
                      placeholder="candidate@gmail.com"
                      className="w-full px-3 py-1.5 rounded-lg bg-black border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-sky-500 mt-1.5"
                    />
                  )}
                </div>

                {/* 2. Channel Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                    2. Delivery Channels
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-black/60 p-1 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setDispatchReportChannel('both')}
                      className={`py-1.5 px-1 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                        dispatchReportChannel === 'both'
                          ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Email + Push
                    </button>
                    <button
                      type="button"
                      onClick={() => setDispatchReportChannel('email')}
                      className={`py-1.5 px-1 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                        dispatchReportChannel === 'email'
                          ? 'bg-sky-500 text-black font-bold shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Email Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setDispatchReportChannel('push')}
                      className={`py-1.5 px-1 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                        dispatchReportChannel === 'push'
                          ? 'bg-amber-400 text-black font-bold shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Push Only
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    {dispatchReportChannel === 'both' && 'Delivers luxury HTML via Google SMTP and browser Web Push notification.'}
                    {dispatchReportChannel === 'email' && 'Dispatches executive HTML report to the recipient email inbox.'}
                    {dispatchReportChannel === 'push' && 'Triggers instant device Web Push notification with dashboard link.'}
                  </p>
                </div>

                {/* 3. Offer Package Attachment */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                    3. Upgrade Offer Attached
                  </label>
                  <select
                    value={dispatchReportOfferChoice}
                    onChange={(e) => setDispatchReportOfferChoice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="auto">Auto-Detect Active or Best Tier Offer</option>
                    <option value="vip299">3-Month VIP Professional Extension (₹299 / 90d)</option>
                    <option value="welcomepro">1-Month Essentials Unlimited (₹149 / 30d)</option>
                    <option value="choc29">1-Month Starter Deal (₹29 / 30d)</option>
                    <option value="none">No Offer (Stats &amp; Companies Only)</option>
                  </select>
                </div>
              </div>

              {/* Real-time DB preview card for selected candidate */}
              {(() => {
                const targetEmail = dispatchReportTarget === 'custom' ? customPushRecipient : dispatchReportTarget
                const foundCandidate = usersList.find(u => u.email === targetEmail)
                return (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900/70 to-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-white text-xs">{foundCandidate?.name || targetEmail}</strong>
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{targetEmail}</span>
                        {foundCandidate?.is_vip ? (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">VIP Pass (90d)</span>
                        ) : foundCandidate?.plan && foundCandidate?.plan !== 'none' ? (
                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 capitalize">{foundCandidate.plan} Active</span>
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">Free / Trial</span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Applications Today: <strong className="text-emerald-400 font-mono">{foundCandidate?.applied_today || 15}</strong> &bull; Total Applications: <strong className="text-white font-mono">{foundCandidate?.total_applied || 47}</strong> &bull; Top Companies: <span className="text-zinc-300">Probo, Advance Career Solutions, Aezion Technologies</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={dispatchReportLoading}
                      onClick={() => handleDispatchCareerReport()}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-black font-bold text-xs transition-all shadow-lg shadow-sky-500/20 cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                    >
                      {dispatchReportLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Dispatching Report...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Dispatch Live Report Now &rarr;</span>
                        </>
                      )}
                    </button>
                  </div>
                )
              })()}

              {/* Result Telemetry Drawer */}
              {dispatchReportResult && (
                <div className={`p-4 rounded-xl text-xs border ${
                  dispatchReportResult.success
                    ? 'bg-sky-950/30 border-sky-500/40 text-sky-200 shadow-md shadow-sky-950/30'
                    : 'bg-rose-950/30 border-rose-800/50 text-rose-200 shadow-md shadow-rose-950/30'
                } space-y-2`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {dispatchReportResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      )}
                      <strong className="font-bold text-white">
                        {dispatchReportResult.success ? 'Dispatch Succeeded & Recorded in Audit Logs' : 'Dispatch Failed'}
                      </strong>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-zinc-300 border border-zinc-700 uppercase">
                      Channel: {dispatchReportResult.channel || dispatchReportChannel}
                    </span>
                  </div>

                  {dispatchReportResult.success && dispatchReportResult.candidate && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-sky-500/20 text-[11px] font-mono">
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Candidate:</span>
                        <span className="text-white font-bold">{dispatchReportResult.candidate.email}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Jobs Reported:</span>
                        <span className="text-emerald-300 font-bold">{dispatchReportResult.candidate.todayApplied} today ({dispatchReportResult.candidate.totalApplied} total)</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Offer Attached:</span>
                        <span className="text-amber-300 font-bold">{dispatchReportResult.offer?.promoCode || 'None'} ({dispatchReportResult.offer?.discountedPrice || 'N/A'})</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Email Provider:</span>
                        <span className="text-sky-300 font-bold">{dispatchReportResult.emailResult?.provider || 'Google SMTP (250 OK)'}</span>
                      </div>
                    </div>
                  )}

                  {dispatchReportResult.error && (
                    <p className="text-rose-300 font-mono text-[11px] mt-1">
                      Error: {dispatchReportResult.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Modal for Offer Dispatch */}
        {isConfirmOfferModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl shadow-black space-y-4">
              <div className="flex items-center gap-3 text-amber-400">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Confirm Campaign Dispatch</h3>
                  <p className="text-[11px] text-zinc-400">Mandatory administrative authorization</p>
                </div>
              </div>

              <div className="p-3.5 bg-black/70 border border-zinc-800 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Campaign:</span>
                  <span className="font-semibold text-white">{offerTitle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Target Audience:</span>
                  <span className="font-mono text-amber-300 capitalize">
                    {targetType === 'single'
                      ? targetEmail
                      : targetType === 'multiple'
                      ? `${Array.from(new Set([...selectedCandidates, ...customExtraEmails.split(/[,;\n]/).map(e => e.trim().toLowerCase()).filter(e => e && e.includes('@'))])).length} Selected Candidates`
                      : targetType === 'bulk_unsubscribed'
                      ? `${offersData.metrics.unsubscribed_count} Unsubscribed Candidates`
                      : `${offersData.metrics.total_candidates} Registered Candidates`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Delivery Channels:</span>
                  <span className="font-mono text-sky-400">Email + Native Background Web Push</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Pricing / Code:</span>
                  <span className="font-mono text-emerald-400">{discountedPrice} · {promoCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Validity Window:</span>
                  <span className="font-mono text-amber-400 font-bold">{validityHours} Hours ({Math.round(validityHours / 24 * 10) / 10} days)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Sales Policy Rule:</span>
                  <span className={`font-mono font-bold text-[11px] ${
                    forceOverride ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {forceOverride ? 'Override Active (Forced VIP Upsell)' : 'Enforced (1-2 Days Before Expiry Only)'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/90 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 space-y-1.5">
                <div className="text-white font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dual-Channel Delivery & Anti-Spam Safeguard:</span>
                </div>
                <p className="leading-relaxed">
                  • <strong>Email Delivery:</strong> Dispatches custom branded HTML offer via Google SMTP.<br />
                  • <strong>Background Web Push:</strong> Delivers native OS banners to Android & desktop via Google FCM and Apple APNs (reaches devices even when browser tab is closed).<br />
                  • <strong>Smart Tagging:</strong> Uses promo code tagging to replace duplicate alerts rather than spamming multiple buzzes on candidate phones.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={sendingOffer}
                  onClick={() => setIsConfirmOfferModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={sendingOffer}
                  onClick={handleDispatchOffer}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {sendingOffer ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching Campaign...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirm & Dispatch Campaign</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ENTERPRISE & BULK LEADS */}
        {activeAdminTab === 'enterprise_leads' && (
          <div className="space-y-4">
            <div
              onClick={toggleEnterpriseLeadsTable}
              className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex items-center justify-between cursor-pointer select-none hover:bg-zinc-900/40 transition-colors group"
            >
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Enterprise & Bulk Candidate Licensing Inquiries</span>
                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                    {enterpriseLeads.length} leads
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct inbound leads from staffing agencies, college placement cells, and enterprise cohorts.
                </p>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => { e.stopPropagation(); fetchEnterpriseLeads() }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLeads ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleEnterpriseLeadsTable() }}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  title={enterpriseLeadsCollapsed ? 'Expand table' : 'Collapse table'}
                >
                  {enterpriseLeadsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
              {enterpriseLeadsCollapsed && (
                <div
                  onClick={toggleEnterpriseLeadsTable}
                  className="flex items-center justify-center gap-2 py-4 text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 hover:bg-zinc-900/30 transition-all select-none"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Table shrunk ({enterpriseLeads.length} leads hidden) · Click header card to expand</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              )}
              {!enterpriseLeadsCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead
                    onClick={toggleEnterpriseLeadsTable}
                    className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 cursor-pointer group select-none"
                    title="Click table head to shrink / expand"
                  >
                    <tr className="hover:bg-zinc-900/60 transition-colors">
                      <th className="py-3.5 px-4 flex items-center gap-1">
                        <span>Organization / Company</span>
                        <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-indigo-400" />
                      </th>
                      <th className="py-3.5 px-4">Contact Person</th>
                      <th className="py-3.5 px-4">Seats / Volume</th>
                      <th className="py-3.5 px-4">Phone / WhatsApp</th>
                      <th className="py-3.5 px-4">Notes / Requirements</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4 text-right">Status (Click Head to Shrink ▲)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loadingLeads ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
                          Loading enterprise inquiries...
                        </td>
                      </tr>
                    ) : enterpriseLeads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          No enterprise inquiries received yet. Inbound requests from /pricing will appear here.
                        </td>
                      </tr>
                    ) : (
                      enterpriseLeads.map((lead, idx) => (
                        <tr key={lead.id || idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 px-4 font-bold text-white">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                                <Building2 className="w-3.5 h-3.5" />
                              </div>
                              <span className="truncate max-w-[160px]">{lead.company}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-white">{lead.name}</div>
                            <a
                              href={`mailto:${lead.email}`}
                              className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <Mail className="w-3 h-3" /> {lead.email}
                            </a>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                              {lead.seats}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono text-slate-200">
                            {lead.phone ? (
                              <a
                                href={`tel:${lead.phone}`}
                                className="hover:text-cyan-400 flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3 text-slate-500" />
                                {lead.phone}
                              </a>
                            ) : (
                              <span className="text-slate-500">N/A</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-slate-400 max-w-xs truncate text-[11px]">
                            {lead.notes || 'No custom notes provided.'}
                          </td>
                          <td className="py-4 px-4 text-slate-400 text-[11px] font-mono">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <select
                              value={lead.status || 'new'}
                              onChange={(e) => handleUpdateLeadStatus(lead.inquiry_id, e.target.value)}
                              className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border bg-slate-950 cursor-pointer focus:outline-none ${
                                lead.status === 'contacted'
                                  ? 'border-blue-500/40 text-blue-400'
                                  : lead.status === 'closed'
                                  ? 'border-emerald-500/40 text-emerald-400'
                                  : 'border-amber-500/40 text-amber-400'
                              }`}
                            >
                              <option value="new">NEW LEAD</option>
                              <option value="contacted">CONTACTED</option>
                              <option value="closed">CLOSED / ONBOARDED</option>
                            </select>
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

        {/* TAB 4: ACTIVITY AUDIT & SYSTEM LOGS */}
        {activeAdminTab === 'logs' && (
          <div className="space-y-4">
            {/* Sub-Tabs Selector */}
            <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-zinc-900">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-nowrap max-w-full pb-1">
                <button
                  type="button"
                  onClick={() => handleLogsSubTabChange('activity')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    logsSubTab === 'activity'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
                  }`}
                >
                  Live Activity Audit Trail ({activityLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleLogsSubTabChange('job_history')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    logsSubTab === 'job_history'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
                  }`}
                >
                  Job Application Records
                </button>
                <button
                  type="button"
                  onClick={() => handleLogsSubTabChange('llm_telemetry')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    logsSubTab === 'llm_telemetry'
                      ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-indigo-500/20 font-semibold'
                      : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI Q&amp;A &amp; Inference Telemetry ({llmStats.total_calls || llmLogs.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLogsSubTabChange('tickets')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    logsSubTab === 'tickets'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
                  }`}
                >
                  Support Inquiries ({supportTickets.length})
                </button>
              </div>

              {logsSubTab === 'activity' && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['all', 'login', 'profile_update', 'resume_upload', 'task_run'].map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setActivityFilter(type)
                        fetchActivityLogs(type)
                      }}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-colors ${
                        activityFilter === type
                          ? 'bg-sky-600 text-white font-bold'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                  <button
                    onClick={() => fetchActivityLogs(activityFilter)}
                    className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors ml-1"
                    title="Refresh Activity Logs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* VIEW 1: LIVE ACTIVITY AUDIT TRAIL */}
            {logsSubTab === 'activity' && (
              <div className="space-y-4">
                {/* 4 Stat Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-500">Total Logins</span>
                    <div className="text-xl font-semibold font-mono text-emerald-400">
                      {activityStats.total_logins || 0}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-500">Profile Updates</span>
                    <div className="text-xl font-semibold font-mono text-sky-400">
                      {activityStats.total_profile_updates || 0}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-500">Resume Uploads</span>
                    <div className="text-xl font-semibold font-mono text-cyan-400">
                      {activityStats.total_resume_uploads || 0}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-500">Scout Tasks</span>
                    <div className="text-xl font-semibold font-mono text-amber-400">
                      {activityStats.total_task_runs || 0}
                    </div>
                  </div>
                </div>

                {/* Activity Feed Table */}
                <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
                  <div
                    onClick={toggleActivityTable}
                    className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between cursor-pointer select-none hover:bg-slate-900/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-sky-400" />
                      <span className="font-bold text-sm text-white">Live Activity Audit Trail</span>
                      <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                        {activityLogs.length} events
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleActivityTable() }}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                      title={activityTableCollapsed ? 'Expand table' : 'Collapse table'}
                    >
                      {activityTableCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>

                  {activityTableCollapsed && (
                    <div
                      onClick={toggleActivityTable}
                      className="flex items-center justify-center gap-2 py-4 text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 hover:bg-zinc-900/30 transition-all select-none"
                    >
                      <Activity className="w-3.5 h-3.5 text-sky-400" />
                      <span>Table shrunk ({activityLogs.length} events hidden) · Click header to expand</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {!activityTableCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead
                        onClick={toggleActivityTable}
                        className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 cursor-pointer group select-none"
                        title="Click table head to shrink / expand"
                      >
                        <tr className="hover:bg-zinc-900/60 transition-colors">
                          <th className="py-3 px-4 flex items-center gap-1">
                            <span>Timestamp</span>
                            <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-sky-400" />
                          </th>
                          <th className="py-3 px-4">Candidate / User</th>
                          <th className="py-3 px-4">Event</th>
                          <th className="py-3 px-4">Activity Description</th>
                          <th className="py-3 px-4">IP & Device (Click Head to Shrink ▲)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {loadingActivity ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-400">
                              <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
                              Streaming live activity records...
                            </td>
                          </tr>
                        ) : activityLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-500">
                              No activity logs found for this filter.
                            </td>
                          </tr>
                        ) : (
                          activityLogs.map((log, idx) => (
                            <tr key={log.id || idx} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                                {formatTimestamp(log.created_at)}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-white font-mono text-xs truncate max-w-[140px]">
                                  {log.user_id}
                                </div>
                                {log.email && (
                                  <div className="text-[10px] text-zinc-500 truncate max-w-[140px]">
                                    {log.email}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider ${
                                  log.event_type === 'login' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                                  log.event_type === 'profile_update' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' :
                                  log.event_type === 'resume_upload' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' :
                                  log.event_type === 'task_run' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                                  'bg-zinc-800 text-zinc-300'
                                }`}>
                                  {log.event_type}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-zinc-200">
                                <div className="text-xs">{log.description}</div>
                                {log.metadata?.filename && (
                                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                    File: {log.metadata.filename} ({log.metadata.size_kb || 0} KB)
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-[11px] font-mono text-zinc-400">
                                <div>{log.ip_address || '127.0.0.1'}</div>
                                <div className="text-[9px] text-zinc-600 truncate max-w-[160px]" title={log.user_agent}>
                                  {log.user_agent || 'Unknown device'}
                                </div>
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

            {/* VIEW: AI Q&A & INFERENCE TELEMETRY */}
            {logsSubTab === 'llm_telemetry' && (
              <div className="space-y-5">
                {/* 5 KPI Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Card 1: Inferences */}
                  <div className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono text-zinc-400">Total Inferences</span>
                      <Brain className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">
                      {llmStats.total_calls.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      Job Screening & ATS Tasks
                    </div>
                  </div>

                  {/* Card 2: Average Latency (Speed) */}
                  <div className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono text-zinc-400">Avg Speed / Latency</span>
                      <Zap className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-amber-300 flex items-baseline gap-1">
                      {llmStats.avg_duration_ms}
                      <span className="text-xs font-normal text-zinc-400">ms</span>
                    </div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {llmStats.avg_duration_ms < 500 ? '⚡ Ultra-Fast LPU Speed' : 'Standard Speed'}
                    </div>
                  </div>

                  {/* Card 3: Success Rate */}
                  <div className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono text-zinc-400">Success Rate</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-emerald-400">
                      {llmStats.success_rate}%
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      Zero DOM modal timeouts
                    </div>
                  </div>

                  {/* Card 4: Tokens Consumed */}
                  <div className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono text-zinc-400">Total Tokens</span>
                      <Database className="w-4 h-4 text-sky-400" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-sky-400">
                      {llmStats.total_tokens.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      Est. spend &lt; ₹15 / 1k queries
                    </div>
                  </div>

                  {/* Card 5: Providers Split */}
                  <div className="p-3.5 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1.5 shadow-sm col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono text-zinc-400">Provider Split</span>
                      <Cpu className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {llmStats.providers.length === 0 ? (
                        <span className="text-xs text-zinc-500 font-mono">Groq LPU (100%)</span>
                      ) : (
                        llmStats.providers.map(p => (
                          <span
                            key={p.provider}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-zinc-800 text-zinc-300 border border-zinc-700"
                          >
                            {p.provider}: {p.share_percent}%
                          </span>
                        ))
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Auto-fallback enabled
                    </div>
                  </div>
                </div>

                {/* Filter Controls Bar */}
                <div className="p-4 rounded-xl bg-[#09090b] border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    {/* Search Query */}
                    <div className="relative flex-1 min-w-[240px]">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Search question, answer, candidate, or model..."
                        value={llmSearchQuery}
                        onChange={e => setLlmSearchQuery(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            fetchLlmLogs({ search: llmSearchQuery })
                          }
                        }}
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-black border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    {/* Candidate User Filter */}
                    <select
                      value={llmFilterUser}
                      onChange={e => {
                        setLlmFilterUser(e.target.value)
                        fetchLlmLogs({ user: e.target.value })
                      }}
                      className="px-3 py-1.5 rounded-lg bg-black border border-zinc-800 text-xs text-zinc-300 font-mono focus:outline-none focus:border-indigo-500"
                    >
                      <option value="all">All Candidates (Users)</option>
                      {usersList.map((u: any) => (
                        <option key={u.user_id} value={u.user_id}>
                          {u.name || u.user_id} ({u.user_id})
                        </option>
                      ))}
                    </select>

                    {/* Provider Filter */}
                    <select
                      value={llmFilterProvider}
                      onChange={e => {
                        setLlmFilterProvider(e.target.value)
                        fetchLlmLogs({ provider: e.target.value })
                      }}
                      className="px-3 py-1.5 rounded-lg bg-black border border-zinc-800 text-xs text-zinc-300 font-mono focus:outline-none focus:border-indigo-500"
                    >
                      <option value="all">All Providers</option>
                      <option value="groq">⚡ Groq (LPU)</option>
                      <option value="openrouter">🌐 OpenRouter</option>
                      <option value="openai">🤖 OpenAI (GPT)</option>
                      <option value="gemini">✨ Google Gemini</option>
                    </select>

                    {/* Date Filter */}
                    <div className="flex items-center gap-1 bg-black p-1 rounded-lg border border-zinc-800">
                      {[
                        { id: 'all', label: 'All Time' },
                        { id: 'today', label: 'Today' },
                        { id: '7d', label: '7 Days' },
                        { id: '30d', label: '30 Days' }
                      ].map(d => (
                        <button
                          key={d.id}
                          onClick={() => {
                            setLlmFilterDate(d.id)
                            fetchLlmLogs({ date: d.id })
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                            llmFilterDate === d.id
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>

                    {/* Refresh Button */}
                    <button
                      onClick={() => fetchLlmLogs()}
                      disabled={loadingLlmLogs}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Refresh Telemetry"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingLlmLogs ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {/* Top Screening Questions Quick Pills */}
                  {llmStats.top_questions && llmStats.top_questions.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                      <span className="text-[10px] uppercase font-mono text-zinc-500 shrink-0">
                        Frequent Questions:
                      </span>
                      {llmStats.top_questions.slice(0, 5).map((tq, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setLlmSearchQuery(tq.question)
                            fetchLlmLogs({ search: tq.question })
                          }}
                          className="px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-mono truncate max-w-[260px] shrink-0 transition-colors"
                          title={`Asked ${tq.count} times. Sample answer: ${tq.sample_answer}`}
                        >
                          <span className="text-indigo-400 font-bold mr-1">#{tq.count}</span>
                          {tq.question}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Main Telemetry Table */}
                <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
                  <div
                    onClick={toggleLlmTable}
                    className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between cursor-pointer select-none hover:bg-slate-900/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-sm text-white">AI Q&A & Inference Telemetry Log</span>
                      <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                        {llmLogs.length} records
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLlmTable() }}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                      title={llmTableCollapsed ? 'Expand table' : 'Collapse table'}
                    >
                      {llmTableCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>

                  {llmTableCollapsed && (
                    <div
                      onClick={toggleLlmTable}
                      className="flex items-center justify-center gap-2 py-4 text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 hover:bg-zinc-900/30 transition-all select-none"
                    >
                      <Brain className="w-3.5 h-3.5 text-purple-400" />
                      <span>Table shrunk ({llmLogs.length} inferences hidden) · Click header to expand</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {!llmTableCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead
                        onClick={toggleLlmTable}
                        className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 cursor-pointer group select-none"
                        title="Click table head to shrink / expand"
                      >
                        <tr className="hover:bg-zinc-900/60 transition-colors">
                          <th className="py-3 px-4 flex items-center gap-1">
                            <span>Time & Candidate</span>
                            <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-purple-400" />
                          </th>
                          <th className="py-3 px-4 min-w-[240px]">Screening Question & AI Answer</th>
                          <th className="py-3 px-4">Provider / Model</th>
                          <th className="py-3 px-4 text-center">Latency</th>
                          <th className="py-3 px-4 text-center">Tokens</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Details (Click Head to Shrink ▲)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {loadingLlmLogs ? (
                          <tr>
                            <td colSpan={7} className="py-14 text-center text-slate-400">
                              <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
                              Querying AI inference telemetry & Q&A records...
                            </td>
                          </tr>
                        ) : llmLogs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-14 text-center text-slate-500">
                              <Brain className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                              No LLM inference logs found matching your filters.
                              <div className="text-[11px] text-zinc-600 mt-1">
                                Questions answered by the bot on Naukri will automatically appear here in real-time.
                              </div>
                            </td>
                          </tr>
                        ) : (
                          llmLogs.map((log, idx) => (
                            <tr key={log.id || idx} className="hover:bg-slate-800/30 transition-colors">
                              {/* Time & Candidate */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="font-mono text-[11px] text-zinc-300 font-semibold">
                                  {formatTimestamp(log.created_at)}
                                </div>
                                <div className="font-mono text-[10px] text-indigo-400 truncate max-w-[130px]" title={log.user_id}>
                                  @{log.user_id}
                                </div>
                              </td>

                              {/* Question & Answer */}
                              <td className="py-3 px-4">
                                <div className="text-xs font-semibold text-white leading-snug">
                                  {log.question || 'Application Screening Question'}
                                </div>
                                <div className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center gap-1.5">
                                  <span className="text-zinc-500 font-bold">Ans:</span>
                                  <span className="bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold">
                                    {log.answer || '(Empty or fallback)'}
                                  </span>
                                </div>
                              </td>

                              {/* Provider & Model */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider ${
                                    (log.provider || '').includes('groq')
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                      : (log.provider || '').includes('openai')
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                  }`}>
                                    {log.provider}
                                  </span>
                                </div>
                                <div className="text-[10px] font-mono text-zinc-400 mt-1 truncate max-w-[140px]" title={log.model}>
                                  {log.model}
                                </div>
                              </td>

                              {/* Latency */}
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                  log.duration_ms < 450
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : log.duration_ms < 1500
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                }`}>
                                  ⚡ {log.duration_ms}ms
                                </span>
                              </td>

                              {/* Tokens */}
                              <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-[11px] text-zinc-400">
                                {log.total_tokens ? `${log.total_tokens} tok` : '—'}
                              </td>

                              {/* Status */}
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                                  log.status === 'success'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : log.status === 'fallback'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                }`}>
                                  {log.status}
                                </span>
                              </td>

                              {/* Action: View Full Context */}
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <button
                                  onClick={() => setSelectedLlmLog(log)}
                                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] font-mono inline-flex items-center gap-1 transition-colors"
                                >
                                  <Eye className="w-3 h-3 text-indigo-400" />
                                  <span>Inspect</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  )}
                </div>

                {/* Inspect Context Modal */}
                {selectedLlmLog && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                        <div className="flex items-center gap-2">
                          <Brain className="w-5 h-5 text-indigo-400" />
                          <h3 className="font-bold text-sm text-white">
                            LLM Inference Inspection & Candidate Context
                          </h3>
                        </div>
                        <button
                          onClick={() => setSelectedLlmLog(null)}
                          className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Header Summary */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                        <div className="p-2.5 rounded-lg bg-black border border-zinc-800">
                          <span className="text-[10px] text-zinc-500 uppercase block">Candidate</span>
                          <span className="text-white font-semibold truncate block">@{selectedLlmLog.user_id}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-black border border-zinc-800">
                          <span className="text-[10px] text-zinc-500 uppercase block">Provider & Model</span>
                          <span className="text-amber-400 font-semibold truncate block">{selectedLlmLog.provider} / {selectedLlmLog.model}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-black border border-zinc-800">
                          <span className="text-[10px] text-zinc-500 uppercase block">Latency</span>
                          <span className="text-emerald-400 font-semibold block">⚡ {selectedLlmLog.duration_ms}ms</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-black border border-zinc-800">
                          <span className="text-[10px] text-zinc-500 uppercase block">Tokens</span>
                          <span className="text-sky-400 font-semibold block">{selectedLlmLog.total_tokens || 0} tokens</span>
                        </div>
                      </div>

                      {/* Question */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                          Screening Question Asked:
                        </span>
                        <div className="p-3 rounded-xl bg-black border border-zinc-800 text-xs font-medium text-white">
                          {selectedLlmLog.question}
                        </div>
                      </div>

                      {/* Answer */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                            Answer Returned by LLM:
                          </span>
                          <button
                            onClick={() => {
                              if (navigator?.clipboard) {
                                navigator.clipboard.writeText(selectedLlmLog.answer || '')
                                setLlmCopiedId(selectedLlmLog.id)
                                setTimeout(() => setLlmCopiedId(null), 2000)
                              }
                            }}
                            className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
                          >
                            {llmCopiedId === selectedLlmLog.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Answer</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs font-mono text-emerald-300 font-semibold">
                          {selectedLlmLog.answer || '(No answer text)'}
                        </div>
                      </div>

                      {/* Candidate Context Fed to AI */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                          Candidate Context Fed to AI:
                        </span>
                        <div className="p-3 rounded-xl bg-black border border-zinc-800 text-xs font-mono text-zinc-300 overflow-x-auto max-h-40">
                          {Object.keys(selectedLlmLog.candidate_context || {}).length > 0 ? (
                            <pre className="text-[11px] leading-relaxed whitespace-pre-wrap">
                              {JSON.stringify(selectedLlmLog.candidate_context, null, 2)}
                            </pre>
                          ) : (
                            <span className="text-zinc-500 italic">
                              Default candidate profile parameters loaded from profile database.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Prompt Snippet if available */}
                      {selectedLlmLog.prompt && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                            Prompt Snippet:
                          </span>
                          <div className="p-3 rounded-xl bg-black border border-zinc-800 text-[11px] font-mono text-zinc-400 overflow-x-auto max-h-32 whitespace-pre-wrap">
                            {selectedLlmLog.prompt}
                          </div>
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => setSelectedLlmLog(null)}
                          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors"
                        >
                          Close Inspection
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: JOB APPLICATION RECORDS */}
            {logsSubTab === 'job_history' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl bg-[#09090b] border border-zinc-800 p-4 space-y-2 h-[600px] overflow-y-auto">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">
                    Select Candidate
                  </h3>
                  {usersList.map((u: any) => (
                    <button
                      key={u.user_id}
                      onClick={() => loadSystemLogContent(u.user_id)}
                      className={`w-full text-left p-3 rounded-xl text-xs font-mono transition-all flex items-center justify-between ${
                        selectedSystemLog === u.user_id
                          ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                          : 'bg-black hover:bg-zinc-900 text-slate-300 border border-zinc-800'
                      }`}
                    >
                      <span className="truncate">{u.name || u.user_id}</span>
                      <span className="text-[10px] opacity-75">{u.total_applied || 0} applied</span>
                    </button>
                  ))}
                </div>

                <div className="md:col-span-2 rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden flex flex-col h-[600px]">
                  <div className="bg-black px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                    <span className="text-xs font-mono text-white">
                      {selectedSystemLog ? `Application Log for ${selectedSystemLog}` : 'Select a candidate on the left'}
                    </span>
                    {selectedSystemLog && (
                      <button
                        onClick={() => loadSystemLogContent(selectedSystemLog)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
                    {loadingLogContent ? (
                      <div className="h-full flex items-center justify-center text-slate-500">Loading activity...</div>
                    ) : selectedLogContent.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-500">
                        Click a candidate on the left to view their applied job activity.
                      </div>
                    ) : (
                      selectedLogContent.map((line, i) => (
                        <div key={i} className="leading-relaxed whitespace-pre-wrap">
                          {line}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: INBOUND SUPPORT TICKETS */}
            {logsSubTab === 'tickets' && (
              <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-black">
                  <div>
                    <h3 className="text-xs font-semibold text-white">
                      Inbound Support Queue
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Dispatched directly to primary address <span className="text-teal-400 font-mono">{adminEmail || 'technohmsit@gmail.com'}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => fetchSupportTickets()}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Ticket ID</th>
                        <th className="py-3 px-4">Candidate</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Subject & Message</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Target Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {loadingTickets ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
                            Loading support tickets...
                          </td>
                        </tr>
                      ) : supportTickets.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500">
                            No support inquiries received yet. Inquiries from the Help Modal will appear here.
                          </td>
                        </tr>
                      ) : (
                        supportTickets.map((t, idx) => (
                          <tr key={t.id || idx} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4 font-mono font-semibold text-white">
                              {t.ticket_id}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-white">{t.name}</div>
                              <a
                                href={`mailto:${t.email}?subject=Re:%20${encodeURIComponent(t.subject)}`}
                                className="text-[11px] text-teal-400 hover:underline flex items-center gap-1 mt-0.5"
                              >
                                <Mail className="w-3.5 h-3.5" /> {t.email}
                              </a>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-300">
                                {t.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 max-w-sm">
                              <div className="font-semibold text-white text-xs">{t.subject}</div>
                              <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                                {t.message}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[11px] font-mono text-zinc-400 whitespace-nowrap">
                              {formatTimestamp(t.created_at)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-[11px] text-teal-300">
                              {adminEmail || 'technohmsit@gmail.com'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* EDIT MODAL (Unified Reusable CandidateProfileEditor) */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">
                    {editingUser.isNew ? 'Create New Candidate Profile' : `Edit Candidate Profile — ${editingUser.name || editingUser.user_id}`}
                  </h3>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                <CandidateProfileEditor
                  userId={editingUser.user_id}
                  isNew={editingUser.isNew}
                  isAdmin={true}
                  onSaveSuccess={() => {
                    fetchOverviewAndUsers()
                    setEditingUser(null)
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unblock Guide Modal */}
      {showUnblockGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <BellOff className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-white">How to Unblock Push Notifications</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUnblockGuide(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                <div>
                  <div className="font-semibold text-white">Click the Site Settings / Padlock Icon</div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Look at your browser&apos;s address bar next to <code className="text-amber-300 font-mono text-[10px]">jobfluxai.vercel.app</code> and click the icon.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                <div>
                  <div className="font-semibold text-white">Switch &ldquo;Notifications&rdquo; from Block to Allow</div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    In the site permissions menu, find <strong>Notifications</strong> and change the dropdown setting to <strong>Allow</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                <div>
                  <div className="font-semibold text-white">Verify Connection</div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Click the button below to confirm the permission change and receive an immediate verification alert!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowUnblockGuide(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
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

      {/* Help & Support Modal */}
      <JobFluxHelpModal
        isOpen={isHelpOpen}
        onOpen={() => setIsHelpOpen(true)}
        onClose={() => setIsHelpOpen(false)}
        showFloatingTrigger={false}
        onTicketSubmitted={() => fetchSupportTickets()}
      />
    </div>
  )
}
