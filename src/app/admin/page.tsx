'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import JobFluxHelpModal from '@/components/JobFluxHelpModal'
import AiLoadingScreen from '@/components/AiLoadingScreen'
import { APP_CONFIG } from '@/config/appConfig'
import { OFFER_PRESETS } from '@/config/plans'
import { loadAdminPrefs, saveAdminPrefs, cachePref } from '@/lib/adminPrefs'
import { sendBrowserNotification, subscribeDeviceToPush, registerServiceWorker } from '@/lib/notifications'

// Modular Header, Overview Stats & Tabs Navigation
import AdminHeader from './components/AdminHeader'
import AdminOverviewStats from './components/AdminOverviewStats'
import AdminTabsNav from './components/AdminTabsNav'

import dynamic from 'next/dynamic'
import TabLoadingSkeleton from './components/TabLoadingSkeleton'
import { AdminTabType, AdminExecutionCounts } from './types'
import { usePersistedToggle } from './hooks/usePersistedToggle'

// Lazy-Loaded Tab Views with Skeleton Fallback
const CandidatesTab = dynamic(() => import('./components/tabs/CandidatesTab'), {
  loading: () => <TabLoadingSkeleton title="Candidates" />
})
const RequestsTab = dynamic(() => import('./components/tabs/RequestsTab'), {
  loading: () => <TabLoadingSkeleton title="Support Requests" />
})
const QueueTab = dynamic(() => import('./components/tabs/QueueTab'), {
  loading: () => <TabLoadingSkeleton title="Execution Queue" />
})
const PaymentsTab = dynamic(() => import('./components/tabs/PaymentsTab'), {
  loading: () => <TabLoadingSkeleton title="Payments" />
})
const OffersTab = dynamic(() => import('./components/tabs/OffersTab'), {
  loading: () => <TabLoadingSkeleton title="Offers & Campaigns" />
})
const EnterpriseLeadsTab = dynamic(() => import('./components/tabs/EnterpriseLeadsTab'), {
  loading: () => <TabLoadingSkeleton title="Enterprise Leads" />
})
const EnterpriseOrgsTab = dynamic(() => import('./components/tabs/EnterpriseOrgsTab'), {
  loading: () => <TabLoadingSkeleton title="Enterprise Organizations" />
})
const LogsTab = dynamic(() => import('./components/tabs/LogsTab'), {
  loading: () => <TabLoadingSkeleton title="System Logs" />
})
const VisitorsTab = dynamic(() => import('./components/tabs/VisitorsTab'), {
  loading: () => <TabLoadingSkeleton title="Live Visitors & Telemetry" />
})
const ReviewsTab = dynamic(() => import('./components/ReviewsTab'), {
  loading: () => <TabLoadingSkeleton title="Reviews & Feedback" />
})

// Lazy-Loaded Heavy Modals
const InspectCandidateModal = dynamic(() => import('./components/modals/InspectCandidateModal'))
const CandidateProfileEditModal = dynamic(() => import('./components/modals/CandidateProfileEditModal'))
const LiveExecutionLogModal = dynamic(() => import('./components/modals/LiveExecutionLogModal'))
const ConfirmCancelAllModal = dynamic(() => import('./components/modals/ConfirmCancelAllModal'))
const DailyDispatchReportModal = dynamic(() => import('./components/modals/DailyDispatchReportModal'))
const ConfirmCampaignDispatchModal = dynamic(() => import('./components/modals/ConfirmCampaignDispatchModal'))
const AdminUnblockGuideModal = dynamic(() => import('./components/modals/AdminUnblockGuideModal'))

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
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTabType>('candidates')
  const [executionStatusFilter, setExecutionStatusFilter] = useState<string>('all')
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0)

  // Real-time Automated Execution Telemetry Pipeline Counts across distributed server nodes
  const executionCounts: AdminExecutionCounts = useMemo(() => {
    const applying = usersList.filter(u => u.execution_summary?.status === 'applying' || u.current_execution?.status === 'applying').length
    const applied_today = usersList.filter(u => u.execution_summary?.status === 'applied_today' || u.execution_summary?.is_applied_today || (u.applied_today && u.applied_today > 0)).length
    const in_queue = usersList.filter(u => u.execution_summary?.status === 'in_queue' || u.execution_summary?.is_in_queue).length
    const disabled = usersList.filter(u => u.enabled_for_daily_run === false).length
    const payment_required = usersList.filter(u => {
      if (u.is_admin || u.role === 'admin' || u.user_id === 'technohmsit' || u.email?.toLowerCase() === 'technohmsit@gmail.com') return false
      return u.execution_summary?.status === 'payment_required' || u.plan_expiry_status === 'expired' || u.plan_expiry_status === 'no_plan'
    }).length
    const not_applied_today = usersList.filter(u => {
      if (u.is_admin || u.role === 'admin' || u.user_id === 'technohmsit' || u.email?.toLowerCase() === 'technohmsit@gmail.com') return false
      const st = u.execution_summary?.status
      if (st) return st === 'not_applied_today'
      return u.current_execution?.status !== 'applying' && (!u.applied_today || u.applied_today === 0) && u.enabled_for_daily_run !== false && u.plan_expiry_status !== 'expired' && u.plan_expiry_status !== 'no_plan'
    }).length

    return {
      all: usersList.length,
      applying,
      applied_today,
      in_queue,
      not_applied_today,
      disabled,
      payment_required
    }
  }, [usersList])

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
  const [assignedOfferFilter, setAssignedOfferFilter] = useState<'all' | 'active' | 'claimed' | 'expired'>('all')
  const [offerNotification, setOfferNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Purchase Offers Collapsible & Pagination State with Local State persistence
  const [offersStatsCollapsed, toggleOffersStats] = usePersistedToggle('admin_offers_stats_collapsed')
  const [offersCollapsedWatchdog, toggleOffersWatchdog] = usePersistedToggle('admin_offers_collapsed_watchdog')
  const [offersCollapsedDesigner, toggleOffersDesigner] = usePersistedToggle('admin_offers_collapsed_designer')
  const [offersCollapsedAssigned, toggleOffersAssigned] = usePersistedToggle('admin_offers_collapsed_assigned')
  const [offersCollapsedHistory, toggleOffersHistory] = usePersistedToggle('admin_offers_collapsed_history')
  const [offersCollapsedPreview, toggleOffersPreview] = usePersistedToggle('admin_offers_collapsed_preview')
  const [offersCollapsedMailDiag, toggleOffersMailDiag] = usePersistedToggle('admin_offers_collapsed_maildiag')
  const [offersCollapsedMailLogs, toggleOffersMailLogs] = usePersistedToggle('admin_offers_collapsed_maillogs')
  const [offersCollapsedDispatchReport, toggleOffersDispatchReport] = usePersistedToggle('admin_offers_collapsed_dispatch_report')
  const [candidatesTableCollapsed, toggleCandidatesTable] = usePersistedToggle('admin_candidates_table_collapsed')
  const [requestsTableCollapsed, toggleRequestsTable] = usePersistedToggle('admin_requests_table_collapsed')
  const [queueTableCollapsed, toggleQueueTable] = usePersistedToggle('admin_queue_table_collapsed')
  const [paymentsTableCollapsed, togglePaymentsTable] = usePersistedToggle('admin_payments_table_collapsed')
  const [enterpriseLeadsCollapsed, toggleEnterpriseLeadsTable] = usePersistedToggle('admin_enterprise_leads_collapsed')
  const [activityTableCollapsed, toggleActivityTable] = usePersistedToggle('admin_activity_table_collapsed')
  const [jobHistoryTableCollapsed, toggleJobHistoryTable] = usePersistedToggle('admin_job_history_table_collapsed')
  const [llmTableCollapsed, toggleLlmTable] = usePersistedToggle('admin_llm_table_collapsed')
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

  // Server-persisted UI prefs (MongoDB `admin_preferences`, tagged by admin user).
  // localStorage stays as instant cache; server is the cross-device source of truth.
  const serverPrefsReadyRef = React.useRef(false)
  const applyServerPrefs = (prefs: Record<string, string>) => {
    try {
      if (prefs.active_tab && ['candidates', 'requests', 'queue', 'payments', 'offers', 'enterprise_leads', 'enterprise_orgs', 'logs', 'visitors', 'reviews'].includes(prefs.active_tab)) {
        setActiveAdminTab(prefs.active_tab as any)
        cachePref('admin_active_tab', prefs.active_tab)
      }
      if (typeof prefs.candidate_search === 'string') {
        setUserSearch(prefs.candidate_search)
        cachePref('admin_candidate_search', prefs.candidate_search)
      }
      if (typeof prefs.candidate_status_filter === 'string' && prefs.candidate_status_filter) {
        setCandidateStatusFilter(prefs.candidate_status_filter)
        cachePref('admin_candidate_status_filter', prefs.candidate_status_filter)
      }
      if (typeof prefs.selected_candidate_id === 'string' && prefs.selected_candidate_id) {
        setSelectedCandidateId(prefs.selected_candidate_id)
        cachePref('admin_selected_candidate_id', prefs.selected_candidate_id)
      }
      if (prefs.assigned_offer_filter && ['all', 'active', 'claimed', 'expired'].includes(prefs.assigned_offer_filter)) {
        setAssignedOfferFilter(prefs.assigned_offer_filter as any)
        cachePref('admin_assigned_offer_filter', prefs.assigned_offer_filter)
      }
      if (prefs.logs_sub_tab && ['activity', 'llm_telemetry', 'job_history', 'tickets', 'notifications'].includes(prefs.logs_sub_tab)) {
        setLogsSubTab(prefs.logs_sub_tab as any)
        cachePref('admin_logs_sub_tab', prefs.logs_sub_tab)
      }
    } catch {}
  }
  const loadServerPrefs = async () => {
    try {
      applyServerPrefs(await loadAdminPrefs())
    } catch {}
    finally {
      serverPrefsReadyRef.current = true
    }
  }

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
  const [customPushTitle, setCustomPushTitle] = useState<string>('JobFlux AI Priority Alert')
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

  // Activity Audit & Telemetry State (paginated + lazy — first page only, manual refresh after)
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [loadingActivity, setLoadingActivity] = useState<boolean>(false)
  const [activityFilter, setActivityFilter] = useState<string>('all')
  const [activityPage, setActivityPage] = useState<number>(1)
  const [activityLimit, setActivityLimit] = useState<number>(25)
  const [activityTotal, setActivityTotal] = useState<number>(0)
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
  const [logsSubTab, setLogsSubTab] = useState<'activity' | 'llm_telemetry' | 'job_history' | 'tickets' | 'notifications'>('activity')
  const [llmLogs, setLlmLogs] = useState<any[]>([])
  const [loadingLlmLogs, setLoadingLlmLogs] = useState<boolean>(false)
  const [llmPage, setLlmPage] = useState<number>(1)
  const [llmLimit, setLlmLimit] = useState<number>(25)
  const [llmTotal, setLlmTotal] = useState<number>(0)
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

  // Enterprise Organizations Management State
  const [enterpriseOrgs, setEnterpriseOrgs] = useState<any[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState<boolean>(false)

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
        sendBrowserNotification('JobFlux AI Admin Notifications Active', {
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
          title: 'Desktop Alert Delivered',
          message: 'JobFlux background Web Push arrived on your desktop with this tab closed/minimized!',
          claimUrl: '/dashboard',
          validityHours: 1
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
          message: 'Delayed push dispatched. Check your desktop notification center.'
        })
      }
    } catch (err: any) {
      setClosedTabTestActive(false)
      alert(err.message || 'Failed to schedule closed-tab test')
    }
  }

  const handleSendTestNotification = () => {
    sendBrowserNotification('JobFlux AI Admin Alert', {
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
        sendBrowserNotification('Notifications Successfully Unblocked', {
          body: 'JobFlux AI admin push alerts are now active.'
        })
      } else if (perm === 'denied') {
        alert('Notifications are still marked as Blocked in browser settings. Please toggle them to "Allow" in the address bar padlock.')
      }
    }
  }

  // Auth is the httpOnly session cookie (same-origin fetch sends it automatically).
  // Never send identity headers — the server ignores them.
  const getAdminHeaders = () => {
    return {
      'Content-Type': 'application/json'
    }
  }

  const applyUsersList = (users: any[]) => {
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
  }

  const fetchOverviewAndUsers = async () => {
    // Instant paint: render last-known list from cache while fresh data loads.
    // Cache carries a timestamp + IST date — anything older than 2 minutes or
    // from a previous day is ignored so rows never show stale zeros.
    try {
      const raw = localStorage.getItem('admin_cached_users')
      if (raw) {
        const parsed = JSON.parse(raw)
        const users = Array.isArray(parsed) ? parsed : parsed.users
        const at = Array.isArray(parsed) ? 0 : (parsed.at || 0)
        const day = Array.isArray(parsed) ? '' : (parsed.date || '')
        const istToday = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10)
        if (Array.isArray(users) && users.length > 0 && day === istToday && Date.now() - at < 2 * 60 * 1000) {
          applyUsersList(users)
        }
      }
    } catch {}
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
      applyUsersList(users)
      try {
        const istToday = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10)
        localStorage.setItem('admin_cached_users', JSON.stringify({ at: Date.now(), date: istToday, users }))
      } catch {}

      // Fetch reviews metrics for tab badge
      try {
        const revRes = await fetch('/api/admin/reviews', { headers: getAdminHeaders() })
        if (revRes.ok) {
          const revData = await revRes.json()
          if (revData.metrics && typeof revData.metrics.pending === 'number') {
            setPendingReviewsCount(revData.metrics.pending)
          }
        }
      } catch (revErr) {
        // Non-critical telemetry
      }
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

  const fetchEnterpriseOrgs = async () => {
    setLoadingOrgs(true)
    try {
      const res = await fetch('/api/admin/enterprise-orgs', {
        headers: getAdminHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setEnterpriseOrgs(data.orgs || [])
      }
    } catch (e) {
      console.error('Failed to fetch enterprise orgs:', e)
    } finally {
      setLoadingOrgs(false)
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

  const handleAssignedFilterChange = (filter: 'all' | 'active' | 'claimed' | 'expired') => {
    setAssignedOfferFilter(filter)
    setAssignedOffersPage(1)
    try { localStorage.setItem('admin_assigned_offer_filter', filter) } catch {}
  }

  // Lazy flags: Logs sub-tabs fetch only the first page on first open.
  // Tab switches after that reuse cached rows — user hits Refresh for fresh data.
  const hasLoadedActivityRef = React.useRef(false)
  const hasLoadedLlmRef = React.useRef(false)

  const handleLogsSubTabChange = (tab: 'activity' | 'llm_telemetry' | 'job_history' | 'tickets' | 'notifications') => {
    setLogsSubTab(tab)
    try { localStorage.setItem('admin_logs_sub_tab', tab) } catch {}
    // Lazy: fetch only if this sub-tab has never loaded data in this session.
    if (tab === 'activity' && !hasLoadedActivityRef.current) fetchActivityLogs()
    else if (tab === 'llm_telemetry' && !hasLoadedLlmRef.current) fetchLlmLogs()
    else if (tab === 'tickets' && supportTickets.length === 0) fetchSupportTickets()
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
          title: customPushTitle.trim() || 'JobFlux AI Priority Alert',
          message: customPushMessage.trim() || 'You have a new update in your JobFlux AI Cockpit.',
          claimUrl: customPushUrl.trim() || '/dashboard',
          validityHours: 4
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
        sendBrowserNotification('Diagnostic Email Delivered', {
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
        sendBrowserNotification('App Password Verified & Saved', {
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
      } else if (dispatchReportOfferChoice === 'vip299' || dispatchReportOfferChoice === 'pro999') {
        offerPayload = {
          promoCode: 'PRO999',
          discountedPrice: '₹999',
          originalPrice: '₹1,299',
          offerTitle: '3-Month Pro Comprehensive Saver'
        }
      } else if (dispatchReportOfferChoice === 'welcomepro' || dispatchReportOfferChoice === 'pro399') {
        offerPayload = {
          promoCode: 'WELCOMEPRO',
          discountedPrice: '₹399',
          originalPrice: '₹499',
          offerTitle: '1-Month Pro Special Pass'
        }
      }

      const res = await fetch('/api/admin/send-dispatch-report', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          targetEmail: targetEmail.trim(),
          channel,
          source: 'admin_on_demand',
          force: true,
          ...offerPayload
        })
      })

      const data = await res.json()
      setDispatchReportResult(data)
      if (data.success) {
        sendBrowserNotification('Daily Report Dispatched', {
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
      sendBrowserNotification('JobFlux AI Campaign Dispatched', {
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

  const handleQueueAction = async (action: string, taskId?: string, extra?: any) => {
    setActionProcessingId(taskId || extra?.userId || action)
    setQueueNotification(null)
    try {
      const res = await fetch('/api/admin/queue', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ action, taskId, ...extra })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Action failed')
      }
      setQueueNotification({ type: 'success', message: data.message })
      sendBrowserNotification('JobFlux Queue Updated', {
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

  const fetchActivityLogs = async (type = activityFilter, page = activityPage, limit = activityLimit) => {
    setLoadingActivity(true)
    try {
      const params = new URLSearchParams()
      if (type && type !== 'all') params.set('event_type', type)
      params.set('page', String(page))
      params.set('limit', String(limit))
      const res = await fetch(`/api/admin/activity?${params.toString()}`, {
        headers: getAdminHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setActivityLogs(data.logs || [])
        if (data.pagination) {
          setActivityTotal(data.pagination.total || 0)
          if (typeof data.pagination.page === 'number') setActivityPage(data.pagination.page)
        }
        if (data.stats) setActivityStats(data.stats)
        hasLoadedActivityRef.current = true
      }
    } catch (e) {
      console.error('Failed to fetch activity logs:', e)
    } finally {
      setLoadingActivity(false)
    }
  }

  const fetchLlmLogs = async (overrideParams?: { user?: string; provider?: string; date?: string; search?: string; page?: number; limit?: number }) => {
    setLoadingLlmLogs(true)
    try {
      const user = overrideParams?.user !== undefined ? overrideParams.user : llmFilterUser
      const prov = overrideParams?.provider !== undefined ? overrideParams.provider : llmFilterProvider
      const dt = overrideParams?.date !== undefined ? overrideParams.date : llmFilterDate
      const qSearch = overrideParams?.search !== undefined ? overrideParams.search : llmSearchQuery
      const page = overrideParams?.page !== undefined ? overrideParams.page : llmPage
      const limit = overrideParams?.limit !== undefined ? overrideParams.limit : llmLimit

      const params = new URLSearchParams({ limit: String(limit), skip: String((page - 1) * limit) })
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
        if (data.pagination) {
          setLlmTotal(data.pagination.total || 0)
          const inferredPage = Math.floor((data.pagination.skip || 0) / (data.pagination.limit || limit)) + 1
          setLlmPage(inferredPage)
        }
        if (data.stats) setLlmStats(data.stats)
        hasLoadedLlmRef.current = true
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

  const handleUpdateTicket = async (ticketId: string, status?: string, adminResponse?: string) => {
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
        if (storedRole === 'enterprise_admin' || storedEmail === 'koushiksrmedala@gmail.com') {
          window.location.replace('/enterprise-admin')
          return
        }
        window.location.replace('/dashboard?notice=' + encodeURIComponent('Access denied: Administrator console access is restricted to technohmsit@gmail.com.'))
        return
      }

      // Ensure user_role is set to 'admin' in localStorage
      localStorage.setItem('user_role', 'admin')

      // Restore saved admin navigation & filter preferences
      try {
        const savedTab = localStorage.getItem('admin_active_tab')
        if (savedTab && ['candidates', 'requests', 'queue', 'payments', 'offers', 'enterprise_leads', 'enterprise_orgs', 'logs', 'visitors', 'reviews'].includes(savedTab)) {
          setActiveAdminTab(savedTab as any)
        }
        const savedSearch = localStorage.getItem('admin_candidate_search')
        if (savedSearch) setUserSearch(savedSearch)

        const savedFilter = localStorage.getItem('admin_candidate_status_filter')
        if (savedFilter) setCandidateStatusFilter(savedFilter)

        const savedSelectedId = localStorage.getItem('admin_selected_candidate_id')
        if (savedSelectedId) setSelectedCandidateId(savedSelectedId)

        // Restore Purchase Offers collapsible states & sub-tab filters
        const sAssignedFilter = localStorage.getItem('admin_assigned_offer_filter')
        if (sAssignedFilter && ['all', 'active', 'claimed', 'expired'].includes(sAssignedFilter)) setAssignedOfferFilter(sAssignedFilter as any)
        const sLogsSub = localStorage.getItem('admin_logs_sub_tab')
        if (sLogsSub && ['activity', 'llm_telemetry', 'job_history', 'tickets', 'notifications'].includes(sLogsSub)) {
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
      loadServerPrefs()
      fetchOverviewAndUsers()
      fetchPayments()
      fetchEnterpriseLeads()
      fetchEnterpriseOrgs()
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

  const handleTabChange = (tab: AdminTabType) => {
    setActiveAdminTab(tab)
    try {
      localStorage.setItem('admin_active_tab', tab)
    } catch {}
    if (tab === 'enterprise_orgs') {
      fetchEnterpriseOrgs()
    }
    // Lazy first-page load for Logs: switching tabs reuses cached rows,
    // manual Refresh buttons fetch fresh data. No auto-refetch on every switch.
    if (tab === 'logs') {
      if (logsSubTab === 'activity' && !hasLoadedActivityRef.current) fetchActivityLogs()
      else if (logsSubTab === 'llm_telemetry' && !hasLoadedLlmRef.current) fetchLlmLogs()
      else if (logsSubTab === 'tickets' && supportTickets.length === 0) fetchSupportTickets()
    }
    // Visitors tab is self-contained (own fetch + pagination inside
    // VisitorsTab): it lazy-loads its first page on mount with auto-refresh
    // OFF by default, so tab switches stay cheap.
  }

  // Live progress: while any candidate is applying, silently re-fetch the
  // list every 15s so quota bars climb in real time. Skeleton only renders
  // on an empty list, so in-place updates never flash or lose scroll.
  const anyApplying = usersList.some(
    (u: any) => u.execution_summary?.is_applying || u.current_execution?.status === 'applying'
  )
  useEffect(() => {
    if (!anyApplying) return
    const t = setInterval(() => {
      fetchOverviewAndUsers()
    }, 10000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyApplying])

  // Persist UI prefs to MongoDB (debounced, merge-safe) — survives logins & devices.
  // Skipped until the server copy has loaded, so first paint never overwrites it.
  useEffect(() => {
    if (typeof window === 'undefined' || !serverPrefsReadyRef.current) return
    try {
      cachePref('admin_candidate_search', userSearch || '')
      cachePref('admin_candidate_status_filter', candidateStatusFilter || 'all')
      if (selectedCandidateId) cachePref('admin_selected_candidate_id', selectedCandidateId)
      saveAdminPrefs({
        active_tab: activeAdminTab,
        candidate_search: userSearch || '',
        candidate_status_filter: candidateStatusFilter || 'all',
        selected_candidate_id: selectedCandidateId || '',
        assigned_offer_filter: assignedOfferFilter || 'all',
        logs_sub_tab: logsSubTab || 'activity'
      })
    } catch {}
  }, [activeAdminTab, userSearch, candidateStatusFilter, selectedCandidateId, assignedOfferFilter, logsSubTab])

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
          const lines = data.jobs.map((j: any) => `[${j.date}] Applied to: ${j.title} at ${j.company}`)
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
    try { navigator.sendBeacon('/api/auth/logout') } catch {}
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
    <div className="min-h-screen bg-[#000000] light:bg-white text-zinc-100 light:text-zinc-900 flex flex-col font-sans selection:bg-zinc-800 selection:text-white relative">
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
      <AdminHeader
        isRefreshing={isRefreshing}
        onRefresh={handleAdminRefresh}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenDispatchReport={() => setIsDispatchReportModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Overview Stats & Telemetry */}
        <AdminOverviewStats
          overviewMetrics={overviewMetrics}
          executionCounts={executionCounts}
          currentExecutionStatusFilter={executionStatusFilter}
          onFilterByExecutionStatus={(status: string) => {
            setActiveAdminTab('candidates')
            setExecutionStatusFilter(status)
          }}
          notificationPermission={notificationPermission}
          notificationBannerDismissed={notificationBannerDismissed}
          onDismissBanner={() => setNotificationBannerDismissed(true)}
          onRequestNotification={handleRequestNotification}
          onSendTestNotification={handleSendTestNotification}
          testNotificationSent={testNotificationSent}
          onOpenUnblockGuide={() => setShowUnblockGuide(true)}
          adminEmail={adminEmail}
        />

        {/* Tab Navigation */}
        <AdminTabsNav
          activeTab={activeAdminTab}
          onTabChange={handleTabChange}
          candidatesCount={usersList.length}
          ticketStats={ticketStats}
          queueMetrics={queueMetrics}
          workerStatus={workerStatus}
          paymentsCount={paymentsList.length}
          enterpriseLeadsCount={enterpriseLeads.length}
          enterpriseOrgsCount={enterpriseOrgs.length}
          pendingReviewsCount={pendingReviewsCount}
        />

        {/* TAB 1: CANDIDATES */}
        {activeAdminTab === 'candidates' && (
          <CandidatesTab
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            usersList={usersList}
            loadingUsers={loadingUsers}
            candidateStatusFilter={candidateStatusFilter}
            setCandidateStatusFilter={setCandidateStatusFilter}
            executionStatusFilter={executionStatusFilter}
            setExecutionStatusFilter={setExecutionStatusFilter}
            showStatusGuide={showStatusGuide}
            setShowStatusGuide={setShowStatusGuide}
            candidatesTableCollapsed={candidatesTableCollapsed}
            toggleCandidatesTable={toggleCandidatesTable}
            selectedCandidateId={selectedCandidateId}
            setSelectedCandidateId={setSelectedCandidateId}
            formatTimestamp={formatTimestamp}
            handleChangePlan={handleChangePlan}
            handleToggleVip={handleToggleVip}
            handleToggleDaily={handleToggleDaily}
            handleInspectCandidate={handleInspectCandidate}
            handleDeleteUser={handleDeleteUser}
            setEditingUser={setEditingUser}
            dispatchReportLoading={dispatchReportLoading}
            onOpenDispatchReportForUser={(email) => {
              setDispatchReportTarget(email)
              setIsDispatchReportModalOpen(true)
            }}
            onTriggerOnDemand={async (userId: string, force: boolean) => {
              await handleQueueAction('trigger_on_demand', undefined, { user_id: userId, force })
            }}
            actionProcessingId={actionProcessingId}
          />
        )}

        {/* TAB 2: REQUESTS & TICKETS */}
        {activeAdminTab === 'requests' && (
          <RequestsTab
            ticketStats={ticketStats}
            adminEmail={adminEmail}
            onOpenHelp={() => setIsHelpOpen(true)}
            requestSearch={requestSearch}
            setRequestSearch={setRequestSearch}
            requestStatusFilter={requestStatusFilter}
            setRequestStatusFilter={setRequestStatusFilter}
            fetchSupportTickets={fetchSupportTickets}
            loadingTickets={loadingTickets}
            supportTickets={supportTickets}
            requestsTableCollapsed={requestsTableCollapsed}
            toggleRequestsTable={toggleRequestsTable}
            ticketNotes={ticketNotes}
            setTicketNotes={setTicketNotes}
            savingTicketId={savingTicketId}
            handleUpdateTicket={handleUpdateTicket}
            handleDeleteTicket={handleDeleteTicket}
            formatTimestamp={formatTimestamp}
          />
        )}

        {/* TAB 3: QUEUE & WORKERS */}
        {activeAdminTab === 'queue' && (
          <QueueTab
            queueTasks={queueTasks}
            loadingQueue={loadingQueue}
            queueMetrics={queueMetrics}
            workerStatus={workerStatus}
            queueStatusFilter={queueStatusFilter}
            setQueueStatusFilter={setQueueStatusFilter}
            queueSearch={queueSearch}
            setQueueSearch={setQueueSearch}
            queueTableCollapsed={queueTableCollapsed}
            toggleQueueTable={toggleQueueTable}
            queueNotification={queueNotification}
            setQueueNotification={setQueueNotification}
            actionProcessingId={actionProcessingId}
            fetchQueueData={fetchQueueData}
            handleQueueAction={handleQueueAction}
            onOpenConfirmCancelAll={() => setShowConfirmCancelAll(true)}
            onSelectExecutionLog={(task) => setSelectedExecutionLog(task)}
            usersList={usersList}
          />
        )}

        {/* TAB 4: PAYMENTS */}
        {activeAdminTab === 'payments' && (
          <PaymentsTab
            paymentsList={paymentsList}
            loadingPayments={loadingPayments}
            vipProfilesCount={overviewMetrics.vip_profiles_count}
            paymentsTableCollapsed={paymentsTableCollapsed}
            togglePaymentsTable={togglePaymentsTable}
            fetchPayments={fetchPayments}
          />
        )}

        {/* TAB 5: PURCHASE OFFERS & CAMPAIGNS */}
        {activeAdminTab === 'offers' && (
          <OffersTab
            offersData={offersData}
            loadingOffers={loadingOffers}
            fetchOffersData={fetchOffersData}
            offerNotification={offerNotification}
            setOfferNotification={setOfferNotification}
            offersStatsCollapsed={offersStatsCollapsed}
            toggleOffersStats={toggleOffersStats}
            offersCollapsedWatchdog={offersCollapsedWatchdog}
            toggleOffersWatchdog={toggleOffersWatchdog}
            loadingExpirySweep={loadingExpirySweep}
            handleRunExpirySweep={handleRunExpirySweep}
            sweepResult={sweepResult}
            setSweepResult={setSweepResult}
            expiryStats={expiryStats}
            offersCollapsedDispatchReport={offersCollapsedDispatchReport}
            toggleOffersDispatchReport={toggleOffersDispatchReport}
            dispatchReportLoading={dispatchReportLoading}
            dispatchReportTarget={dispatchReportTarget}
            setDispatchReportTarget={setDispatchReportTarget}
            usersList={usersList}
            customPushRecipient={customPushRecipient}
            setCustomPushRecipient={setCustomPushRecipient}
            dispatchReportChannel={dispatchReportChannel}
            setDispatchReportChannel={setDispatchReportChannel}
            dispatchReportOfferChoice={dispatchReportOfferChoice}
            setDispatchReportOfferChoice={setDispatchReportOfferChoice}
            handleDispatchCareerReport={handleDispatchCareerReport}
            dispatchReportResult={dispatchReportResult}
            selectedPresetId={selectedPresetId}
            handleSelectPreset={handleSelectPreset}
            targetType={targetType}
            setTargetType={setTargetType}
            targetEmail={targetEmail}
            setTargetEmail={setTargetEmail}
            forceOverride={forceOverride}
            setForceOverride={setForceOverride}
            selectedCandidates={selectedCandidates}
            setSelectedCandidates={setSelectedCandidates}
            candidateFilterQuery={candidateFilterQuery}
            setCandidateFilterQuery={setCandidateFilterQuery}
            candidatePickerPage={candidatePickerPage}
            setCandidatePickerPage={setCandidatePickerPage}
            customExtraEmails={customExtraEmails}
            setCustomExtraEmails={setCustomExtraEmails}
            offerTitle={offerTitle}
            setOfferTitle={setOfferTitle}
            discountBadge={discountBadge}
            setDiscountBadge={setDiscountBadge}
            promoCode={promoCode}
            setPromoCode={setPromoCode}
            originalPrice={originalPrice}
            setOriginalPrice={setOriginalPrice}
            discountedPrice={discountedPrice}
            setDiscountedPrice={setDiscountedPrice}
            customMessage={customMessage}
            setCustomMessage={setCustomMessage}
            validityHours={validityHours}
            setValidityHours={setValidityHours}
            offersCollapsedDesigner={offersCollapsedDesigner}
            toggleOffersDesigner={toggleOffersDesigner}
            offersCollapsedPreview={offersCollapsedPreview}
            toggleOffersPreview={toggleOffersPreview}
            setIsConfirmOfferModalOpen={setIsConfirmOfferModalOpen}
            assignedOfferFilter={assignedOfferFilter}
            handleAssignedFilterChange={handleAssignedFilterChange}
            offersCollapsedAssigned={offersCollapsedAssigned}
            toggleOffersAssigned={toggleOffersAssigned}
            assignedOffersPage={assignedOffersPage}
            setAssignedOffersPage={setAssignedOffersPage}
            assignedOffersPerPage={assignedOffersPerPage}
            setAssignedOffersPerPage={setAssignedOffersPerPage}
            revokingOfferId={revokingOfferId}
            handleRevokeOffer={handleRevokeOffer}
            formatTimestamp={formatTimestamp}
            offersCollapsedHistory={offersCollapsedHistory}
            toggleOffersHistory={toggleOffersHistory}
            campaignHistoryPage={campaignHistoryPage}
            setCampaignHistoryPage={setCampaignHistoryPage}
            campaignHistoryPerPage={campaignHistoryPerPage}
            setCampaignHistoryPerPage={setCampaignHistoryPerPage}
            offersCollapsedMailDiag={offersCollapsedMailDiag}
            toggleOffersMailDiag={toggleOffersMailDiag}
            fetchMailDiagnostics={fetchMailDiagnostics}
            loadingMailLogs={loadingMailLogs}
            mailSender={mailSender}
            mailMaskedPass={mailMaskedPass}
            showConfigPass={showConfigPass}
            setShowConfigPass={setShowConfigPass}
            showCustomPushConfig={showCustomPushConfig}
            setShowCustomPushConfig={setShowCustomPushConfig}
            diagnosticRecipient={diagnosticRecipient}
            setDiagnosticRecipient={setDiagnosticRecipient}
            mailDiagnosticLoading={mailDiagnosticLoading}
            handleSendDiagnosticMail={handleSendDiagnosticMail}
            pushDiagnosticLoading={pushDiagnosticLoading}
            handleTriggerPushNotification={handleTriggerPushNotification}
            newAppPassInput={newAppPassInput}
            setNewAppPassInput={setNewAppPassInput}
            savingPass={savingPass}
            handleSaveAndTestCredentials={handleSaveAndTestCredentials}
            deviceWebPushActive={deviceWebPushActive}
            handleRequestNotification={handleRequestNotification}
            customPushTitle={customPushTitle}
            setCustomPushTitle={setCustomPushTitle}
            customPushUrl={customPushUrl}
            setCustomPushUrl={setCustomPushUrl}
            customPushMessage={customPushMessage}
            setCustomPushMessage={setCustomPushMessage}
            closedTabTestActive={closedTabTestActive}
            handleTestClosedTabPush={handleTestClosedTabPush}
            closedTabCountdown={closedTabCountdown}
            pushDiagnosticResult={pushDiagnosticResult}
            setPushDiagnosticResult={setPushDiagnosticResult}
            mailDiagnosticResult={mailDiagnosticResult}
            offersCollapsedMailLogs={offersCollapsedMailLogs}
            toggleOffersMailLogs={toggleOffersMailLogs}
            mailLogs={mailLogs}
          />
        )}

        {/* TAB 6: ENTERPRISE LEADS */}
        {activeAdminTab === 'enterprise_leads' && (
          <EnterpriseLeadsTab
            enterpriseLeads={enterpriseLeads}
            loadingLeads={loadingLeads}
            enterpriseLeadsCollapsed={enterpriseLeadsCollapsed}
            toggleEnterpriseLeadsTable={toggleEnterpriseLeadsTable}
            fetchEnterpriseLeads={fetchEnterpriseLeads}
            handleUpdateLeadStatus={handleUpdateLeadStatus}
          />
        )}

        {/* TAB 6.5: ENTERPRISE ORGANIZATIONS */}
        {activeAdminTab === 'enterprise_orgs' && (
          <EnterpriseOrgsTab
            enterpriseOrgs={enterpriseOrgs}
            loadingOrgs={loadingOrgs}
            fetchEnterpriseOrgs={fetchEnterpriseOrgs}
            getAdminHeaders={getAdminHeaders}
          />
        )}

        {/* TAB 7: LOGS & TELEMETRY */}
        {activeAdminTab === 'logs' && (
          <LogsTab
            logsSubTab={logsSubTab}
            handleLogsSubTabChange={handleLogsSubTabChange}
            activityLogs={activityLogs}
            activityStats={activityStats}
            activityFilter={activityFilter}
            setActivityFilter={setActivityFilter}
            fetchActivityLogs={fetchActivityLogs}
            loadingActivity={loadingActivity}
            activityPage={activityPage}
            setActivityPage={setActivityPage}
            activityLimit={activityLimit}
            setActivityLimit={setActivityLimit}
            activityTotal={activityTotal}
            activityTableCollapsed={activityTableCollapsed}
            toggleActivityTable={toggleActivityTable}
            formatTimestamp={formatTimestamp}
            llmStats={llmStats}
            llmLogs={llmLogs}
            loadingLlmLogs={loadingLlmLogs}
            llmSearchQuery={llmSearchQuery}
            setLlmSearchQuery={setLlmSearchQuery}
            llmFilterUser={llmFilterUser}
            setLlmFilterUser={setLlmFilterUser}
            llmFilterProvider={llmFilterProvider}
            setLlmFilterProvider={setLlmFilterProvider}
            llmFilterDate={llmFilterDate}
            setLlmFilterDate={setLlmFilterDate}
            fetchLlmLogs={fetchLlmLogs}
            llmPage={llmPage}
            setLlmPage={setLlmPage}
            llmLimit={llmLimit}
            setLlmLimit={setLlmLimit}
            llmTotal={llmTotal}
            usersList={usersList}
            llmTableCollapsed={llmTableCollapsed}
            toggleLlmTable={toggleLlmTable}
            selectedLlmLog={selectedLlmLog}
            setSelectedLlmLog={setSelectedLlmLog}
            llmCopiedId={llmCopiedId}
            setLlmCopiedId={setLlmCopiedId}
            selectedSystemLog={selectedSystemLog}
            loadSystemLogContent={loadSystemLogContent}
            loadingLogContent={loadingLogContent}
            selectedLogContent={selectedLogContent}
            supportTickets={supportTickets}
            loadingTickets={loadingTickets}
            fetchSupportTickets={fetchSupportTickets}
            adminEmail={adminEmail}
          />
        )}

        {/* TAB 8: LIVE VISITORS & INTERACTION TELEMETRY */}
        {activeAdminTab === 'visitors' && (
          <VisitorsTab />
        )}

        {/* TAB 9: CANDIDATE REVIEWS & TESTIMONIALS MODERATION */}
        {activeAdminTab === 'reviews' && (
          <ReviewsTab getAdminHeaders={getAdminHeaders} />
        )}
      </main>

      {/* MODALS */}
      <InspectCandidateModal
        candidate={inspectCandidate}
        onClose={() => handleInspectCandidate(null)}
        formatTimestamp={formatTimestamp}
        revokingOfferId={revokingOfferId}
        onRevokeOffer={handleRevokeOffer}
        dispatchReportLoading={dispatchReportLoading}
        onDispatchCareerReport={handleDispatchCareerReport}
        loadingExpirySweep={loadingExpirySweep}
        onRunExpirySweep={handleRunExpirySweep}
      />

      <CandidateProfileEditModal
        editingUser={editingUser}
        onClose={() => setEditingUser(null)}
        onSaveSuccess={() => {
          setEditingUser(null)
          fetchOverviewAndUsers()
        }}
      />

      <LiveExecutionLogModal
        log={selectedExecutionLog}
        onClose={() => setSelectedExecutionLog(null)}
        onQueueAction={handleQueueAction}
      />

      <ConfirmCancelAllModal
        isOpen={showConfirmCancelAll}
        pendingCount={queueMetrics.pending}
        isProcessing={actionProcessingId === 'cancel_all'}
        onClose={() => setShowConfirmCancelAll(false)}
        onConfirm={async () => {
          await handleQueueAction('cancel_all_pending')
          setShowConfirmCancelAll(false)
        }}
      />

      <DailyDispatchReportModal
        isOpen={isDispatchReportModalOpen}
        onClose={() => setIsDispatchReportModalOpen(false)}
        dispatchReportTarget={dispatchReportTarget}
        setDispatchReportTarget={setDispatchReportTarget}
        customPushRecipient={customPushRecipient}
        setCustomPushRecipient={setCustomPushRecipient}
        dispatchReportChannel={dispatchReportChannel}
        setDispatchReportChannel={setDispatchReportChannel}
        dispatchReportOfferChoice={dispatchReportOfferChoice}
        setDispatchReportOfferChoice={setDispatchReportOfferChoice}
        dispatchReportLoading={dispatchReportLoading}
        dispatchReportResult={dispatchReportResult}
        usersList={usersList}
        onDispatchCareerReport={handleDispatchCareerReport}
      />

      <ConfirmCampaignDispatchModal
        isOpen={isConfirmOfferModalOpen}
        onClose={() => setIsConfirmOfferModalOpen(false)}
        onConfirm={handleDispatchOffer}
        sendingOffer={sendingOffer}
        offerTitle={offerTitle}
        targetType={targetType}
        targetEmail={targetEmail}
        selectedCandidates={selectedCandidates}
        customExtraEmails={customExtraEmails}
        unsubscribedCount={offersData.metrics.unsubscribed_count}
        totalCandidatesCount={offersData.metrics.total_candidates}
        discountedPrice={discountedPrice}
        promoCode={promoCode}
        validityHours={validityHours}
        forceOverride={forceOverride}
      />

      <AdminUnblockGuideModal
        isOpen={showUnblockGuide}
        onClose={() => setShowUnblockGuide(false)}
        onRecheck={handleRequestNotification}
      />

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
