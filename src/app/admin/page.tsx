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
  CheckCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import CandidateProfileEditor from '@/components/CandidateProfileEditor'
import JobFluxHelpModal from '@/components/JobFluxHelpModal'
import JobFluxLogo from '@/components/JobFluxLogo'
import AiLoadingScreen from '@/components/AiLoadingScreen'

export default function AdminDashboard() {
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
    metrics: { total_candidates: number; unsubscribed_count: number; subscribed_count: number }
    history: any[]
  }>({
    presets: [],
    metrics: { total_candidates: 0, unsubscribed_count: 0, subscribed_count: 0 },
    history: []
  })
  const [loadingOffers, setLoadingOffers] = useState<boolean>(false)
  const [targetType, setTargetType] = useState<'single' | 'bulk_unsubscribed' | 'all_users'>('single')
  const [targetEmail, setTargetEmail] = useState<string>('koushiksrmedala@gmail.com')
  const [selectedPresetId, setSelectedPresetId] = useState<string>('offer_99')
  const [offerTitle, setOfferTitle] = useState<string>('Candidate Welcome: 90% Off JobFlux Essentials for ₹99')
  const [discountBadge, setDiscountBadge] = useState<string>('90% OFF (ACTUAL ₹1,000)')
  const [originalPrice, setOriginalPrice] = useState<string>('₹1,000 / mo')
  const [discountedPrice, setDiscountedPrice] = useState<string>('₹99 / mo')
  const [promoCode, setPromoCode] = useState<string>('OFFER90')
  const [customMessage, setCustomMessage] = useState<string>('Unlock 30 days of continuous daily autonomous job applications (600+ applies), Harvard ATS resume formatting, and direct priority recruiter submission at 90% discount (Regular ₹1,000/mo) for just ₹99.')
  const [isConfirmOfferModalOpen, setIsConfirmOfferModalOpen] = useState<boolean>(false)
  const [sendingOffer, setSendingOffer] = useState<boolean>(false)
  const [offerNotification, setOfferNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Live Email Diagnostic State
  const [mailDiagnosticLoading, setMailDiagnosticLoading] = useState<boolean>(false)
  const [mailDiagnosticResult, setMailDiagnosticResult] = useState<any | null>(null)
  const [mailLogs, setMailLogs] = useState<any[]>([])
  const [loadingMailLogs, setLoadingMailLogs] = useState<boolean>(false)
  const [diagnosticRecipient, setDiagnosticRecipient] = useState<string>('koushiksrmedala@gmail.com')
  const [mailSender, setMailSender] = useState<string>('technohmsit@gmail.com')
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
  const [logsSubTab, setLogsSubTab] = useState<'activity' | 'job_history' | 'tickets'>('activity')
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
      if (!('Notification' in window)) {
        setNotificationPermission('unsupported')
      } else {
        setNotificationPermission(Notification.permission)
      }
    }
  }, [])

  const sendBrowserNotification = (title: string, options?: NotificationOptions) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification(title, {
          icon: '/images/icon.png',
          badge: '/images/icon.png',
          ...options
        })
        n.onclick = () => {
          window.focus()
          n.close()
        }
      } catch (e) {
        console.warn('Could not dispatch browser notification:', e)
      }
    }
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
        sendBrowserNotification('⚡ JobFlux AI Admin Notifications Active', {
          body: 'You will now receive real-time admin alerts for candidate dispatches and queue actions.'
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
    return {
      'Content-Type': 'application/json',
      'x-user-id': uid
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

  const fetchOffersData = async () => {
    setLoadingOffers(true)
    try {
      const res = await fetch('/api/admin/offers', {
        headers: getAdminHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setOffersData(data)
      }
      fetchMailDiagnostics()
      fetchPushDiagnostics()
    } catch (err) {
      console.error('Failed to fetch offers:', err)
    } finally {
      setLoadingOffers(false)
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
      if (data.success) {
        sendBrowserNotification(customPushTitle.trim() || '⚡ Push Dispatched!', {
          body: `Push notification sent to ${targetType === 'all' ? 'all candidates' : targetEmail}!`
        })
      }
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

  const handleSelectPreset = (preset: any) => {
    setSelectedPresetId(preset.id)
    setOfferTitle(preset.offerTitle)
    setDiscountBadge(preset.discountBadge)
    setOriginalPrice(preset.originalPrice)
    setDiscountedPrice(preset.discountedPrice)
    setPromoCode(preset.promoCode)
    setCustomMessage(preset.customMessage)
  }

  const handleDispatchOffer = async () => {
    setSendingOffer(true)
    setOfferNotification(null)
    try {
      const res = await fetch('/api/admin/offers', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          targetType,
          targetEmail,
          offerPreset: selectedPresetId,
          offerTitle,
          discountBadge,
          originalPrice,
          discountedPrice,
          promoCode,
          customMessage,
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

      // 2. Check if logged in
      if (!storedUid) {
        window.location.replace('/?error=' + encodeURIComponent('Please sign in with administrator credentials.'))
        return
      }

      // 3. Check client-side admin role flag
      const isAdmin = (
        storedRole === 'admin' ||
        storedUid === 'technohmsit' ||
        storedUid === 'admin' ||
        storedEmail === 'technohmsit@gmail.com'
      )

      if (!isAdmin) {
        window.location.replace('/dashboard?notice=' + encodeURIComponent('Access denied: Administrator privileges required.'))
        return
      }

      // Ensure user_role is set to 'admin' in localStorage
      localStorage.setItem('user_role', 'admin')

      // 4. Verify server-side against MongoDB
      fetchOverviewAndUsers()
      fetchPayments()
      fetchEnterpriseLeads()
      fetchSupportTickets()
    }
  }, [])

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

  const filteredUsers = usersList.filter(u =>
    (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.user_id || '').toLowerCase().includes(userSearch.toLowerCase())
  )

  if (authChecking) {
    return (
      <AiLoadingScreen
        title="Verifying Administrator Privileges"
        subtitle="Synchronizing MongoDB Atlas cluster, telemetry logs & candidates..."
        accountInfo="technohmsit@gmail.com"
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
          accountInfo="technohmsit@gmail.com"
          fullscreen={true}
        />
      )}

      {/* Admin Top Navbar */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-zinc-900 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <Link href="/" className="hover:opacity-90 transition-opacity shrink-0">
              <JobFluxLogo size="sm" showText={true} />
            </Link>

            <div className="h-5 w-px bg-zinc-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-sky-300 font-mono uppercase font-semibold hidden xs:inline">
                Super Admin
              </span>
              <span className="text-[11px] text-zinc-500 font-mono hidden md:inline">
                MongoDB Atlas Synchronized
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
            <span>Primary Admin: <strong className="text-sky-300">technohmsit@gmail.com</strong></span>
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
            <p className="text-[11px] text-zinc-500">Lifetime bypass</p>
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
            <p className="text-[11px] text-zinc-500">Lifetime verified</p>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 flex-wrap">
          <button
            onClick={() => setActiveAdminTab('candidates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
              activeAdminTab === 'candidates'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Candidate Profiles ({filteredUsers.length})
          </button>
          <button
            onClick={() => {
              setActiveAdminTab('requests')
              fetchSupportTickets()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
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
              setActiveAdminTab('queue')
              fetchQueueData()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
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
              setActiveAdminTab('payments')
              fetchPayments()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
              activeAdminTab === 'payments'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Payments ({paymentsList.length})
          </button>
          <button
            onClick={() => {
              setActiveAdminTab('offers')
              fetchOffersData()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
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
              setActiveAdminTab('enterprise_leads')
              fetchEnterpriseLeads()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
              activeAdminTab === 'enterprise_leads'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Enterprise Leads ({enterpriseLeads.length})
          </button>
          <button
            onClick={() => {
              setActiveAdminTab('logs')
              fetchActivityLogs()
              fetchSupportTickets()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
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
            {/* Search Header */}
            <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by name, email, or candidate ID..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="text-xs text-slate-400 hidden lg:block">
                  Auto-scheduled runs: <span className="text-emerald-400 font-semibold">Daily at 06:00 AM & 08:00 AM IST</span>
                </div>
                <button
                  onClick={() => setEditingUser({ isNew: true, user_id: '' })}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-500/25"
                >
                  <User className="w-4 h-4" /> Create Candidate
                </button>
              </div>
            </div>

            {/* Candidates Table */}
            <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Candidate</th>
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
                        <tr key={u.user_id || idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 px-4 font-bold text-white flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                              {u.name ? u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'C'}
                            </div>
                            <div>
                              <div className="font-bold text-white">{u.name || u.user_id}</div>
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
                                <option value="vip">VIP Pass (Lifetime)</option>
                              </select>

                              <button
                                onClick={() => handleToggleVip(u.user_id, !u.is_vip)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  u.is_vip
                                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30'
                                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/40'
                                }`}
                                title={u.is_vip ? "Click to Revoke VIP Free Pass" : "Click to Grant Lifetime VIP Free Pass"}
                              >
                                <Crown className="w-3 h-3 text-amber-400" />
                                {u.is_vip ? 'Revoke VIP' : 'Grant VIP Pass'}
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => handleToggleDaily(u.user_id, u.enabled_for_daily_run !== false)}
                              className="text-xs transition-colors"
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
                            <div className="space-y-1 text-[11px]">
                              <div className="text-zinc-300 flex items-center gap-1">
                                <FileText className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="truncate max-w-[120px]" title={u.resume_filename || 'No resume PDF uploaded'}>
                                  {u.resume_filename || 'No PDF'}
                                </span>
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono">
                                {u.last_resume_updated_at ? `PDF: ${formatTimestamp(u.last_resume_updated_at)}` : (u.last_profile_updated_at ? `Profile: ${formatTimestamp(u.last_profile_updated_at)}` : 'Synced')}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="font-mono font-bold text-white text-xs">
                              {u.applied_today || 0} <span className="text-zinc-600 font-normal">/</span> <span className="text-indigo-400">{u.total_applied || 0}</span>
                            </div>
                            <div className="text-[9px] text-zinc-500 uppercase font-mono">Today / Total</div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  localStorage.setItem('user_id', u.user_id)
                                  localStorage.setItem('user_email', u.email)
                                  localStorage.setItem('user_role', 'admin')
                                  window.open('/dashboard', '_blank')
                                }}
                                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                                title="Open Candidate Dashboard"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingUser(u)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit Profile
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.user_id)}
                                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
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
            </div>
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
                    Primary Super-Admin Email: <span className="font-mono text-teal-300 font-semibold">technohmsit@gmail.com</span>. Candidate support questions, urgent issues, and profile inquiries arrive here for resolution.
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
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-black text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="py-3.5 px-4">Ticket & Priority</th>
                      <th className="py-3.5 px-4">Candidate</th>
                      <th className="py-3.5 px-4">Category & Message</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Admin Response / Note</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
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
              <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-sky-400" />
                    <span>Queue Tasks & Execution Logs</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Live tasks lined up for Playwright automated runs.
                  </p>
                </div>
                <span className="text-xs font-mono text-zinc-500">
                  {queueTasks.length} task records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-black/40 text-zinc-400 font-mono uppercase text-[10px]">
                      <th className="py-3 px-4">Queue / State</th>
                      <th className="py-3 px-4">Candidate & Plan</th>
                      <th className="py-3 px-4">Trigger Source</th>
                      <th className="py-3 px-4">Timeline / Heartbeat</th>
                      <th className="py-3 px-4">Applications / Summary</th>
                      <th className="py-3 px-4 text-center">Execution Logs</th>
                      <th className="py-3 px-4 text-center">Admin Controls</th>
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
              <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-400" />
                    Verified Razorpay Transactions
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time payment verification records and active plan subscriptions.
                  </p>
                </div>
                <button
                  onClick={fetchPayments}
                  disabled={loadingPayments}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingPayments ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Candidate / User</th>
                      <th className="py-3.5 px-4">Plan Purchased</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Razorpay Payment ID</th>
                      <th className="py-3.5 px-4">Order ID</th>
                      <th className="py-3.5 px-4">Verified Date</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
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

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#09090b] border border-zinc-800">
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Total Candidate Base</span>
                <div className="text-xl font-bold text-white mt-1">{offersData.metrics.total_candidates}</div>
                <p className="text-[11px] text-zinc-500 mt-0.5">Registered accounts</p>
              </div>

              <div className="p-4 rounded-xl bg-[#09090b] border border-amber-500/20 bg-amber-500/5">
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">Prime Target Audience</span>
                <div className="text-xl font-bold text-amber-300 mt-1">{offersData.metrics.unsubscribed_count}</div>
                <p className="text-[11px] text-amber-400/80 mt-0.5">Unsubscribed & expired free trial candidates</p>
              </div>

              <div className="p-4 rounded-xl bg-[#09090b] border border-zinc-800">
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Subscribed Pro/VIP</span>
                <div className="text-xl font-bold text-emerald-400 mt-1">{offersData.metrics.subscribed_count}</div>
                <p className="text-[11px] text-zinc-500 mt-0.5">Active paid candidates</p>
              </div>
            </div>

            {/* Campaign Designer & Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form Settings */}
              <div className="lg:col-span-7 space-y-5 p-5 rounded-2xl bg-[#09090b] border border-zinc-800">
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
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Live Candidate Email Preview</span>
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    HTML Luxury Template
                  </span>
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
            </div>

            {/* Campaign History */}
            <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
              <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-400" />
                    <span>Dispatched Campaigns Audit Trail</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Log of past purchase offers sent to single candidates or cohorts.
                  </p>
                </div>
                <span className="text-xs font-mono text-zinc-500">
                  {offersData.history.length} logged campaigns
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-black/40 text-zinc-400 font-mono uppercase text-[10px]">
                      <th className="py-3 px-4">Campaign Name</th>
                      <th className="py-3 px-4">Target Audience</th>
                      <th className="py-3 px-4">Offer Price & Code</th>
                      <th className="py-3 px-4">Recipients</th>
                      <th className="py-3 px-4">Dispatched At</th>
                      <th className="py-3 px-4 text-center">Status</th>
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
                      offersData.history.map((h: any) => (
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
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Email Diagnostic & Delivery Audit */}
            <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
              <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-sky-400" />
                    <span>Live Email Dispatch Diagnostic & Mailbox Audit</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Test live Google SMTP dispatch to verify delivery in real-time, view sender credentials, and inspect MongoDB dispatch logs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchMailDiagnostics}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingMailLogs ? 'animate-spin' : ''}`} />
                  <span>Refresh Delivery Logs</span>
                </button>
              </div>

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
                          Custom Push Notification & In-App Toast Dispatcher
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">Real-Time MongoDB + Web Push Sync</span>
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
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-zinc-400">
                          Target: <strong className="text-white font-mono">{diagnosticRecipient === 'custom' ? customPushRecipient || 'None specified' : diagnosticRecipient === 'all' ? 'All Candidates (Broadcast)' : diagnosticRecipient}</strong>
                        </span>
                        <button
                          type="button"
                          disabled={pushDiagnosticLoading}
                          onClick={() => handleTriggerPushNotification()}
                          className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" />
                          <span>Dispatch Custom Push Alert</span>
                        </button>
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
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-300">Recent MongoDB Mail Dispatches (Real-Time Audit)</span>
                    <span className="font-mono text-[11px] text-zinc-500">{mailLogs.length} audit records</span>
                  </div>

                  <div className="rounded-xl border border-zinc-800 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                          <th className="py-2.5 px-3">Date & Time</th>
                          <th className="py-2.5 px-3">Recipient</th>
                          <th className="py-2.5 px-3">Subject</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3">Response / Error</th>
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
                </div>
              </div>
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
                      : targetType === 'bulk_unsubscribed'
                      ? `${offersData.metrics.unsubscribed_count} Unsubscribed Candidates`
                      : `${offersData.metrics.total_candidates} Registered Candidates`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Pricing / Code:</span>
                  <span className="font-mono text-emerald-400">{discountedPrice} · {promoCode}</span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                You are about to dispatch branded promotional emails to the specified candidate audience.
                Please verify that the discounts and terms are intentional before approving.
              </p>

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
            <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Enterprise & Bulk Candidate Licensing Inquiries</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct inbound leads from staffing agencies, college placement cells, and enterprise cohorts.
                </p>
              </div>
              <button
                onClick={fetchEnterpriseLeads}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLeads ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Organization / Company</th>
                      <th className="py-3.5 px-4">Contact Person</th>
                      <th className="py-3.5 px-4">Seats / Volume</th>
                      <th className="py-3.5 px-4">Phone / WhatsApp</th>
                      <th className="py-3.5 px-4">Notes / Requirements</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4 text-right">Status</th>
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
            </div>
          </div>
        )}

        {/* TAB 4: ACTIVITY AUDIT & SYSTEM LOGS */}
        {activeAdminTab === 'logs' && (
          <div className="space-y-4">
            {/* Sub-Tabs Selector */}
            <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setLogsSubTab('activity')
                    fetchActivityLogs()
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    logsSubTab === 'activity'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
                  }`}
                >
                  Live Activity Audit Trail ({activityLogs.length})
                </button>
                <button
                  onClick={() => setLogsSubTab('job_history')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    logsSubTab === 'job_history'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white bg-black border border-zinc-800'
                  }`}
                >
                  Job Application Records
                </button>
                <button
                  onClick={() => {
                    setLogsSubTab('tickets')
                    fetchSupportTickets()
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    logsSubTab === 'tickets'
                      ? 'bg-zinc-800 text-white'
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
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Timestamp</th>
                          <th className="py-3 px-4">Candidate / User</th>
                          <th className="py-3 px-4">Event</th>
                          <th className="py-3 px-4">Activity Description</th>
                          <th className="py-3 px-4">IP & Device</th>
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
                </div>
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
                      Dispatched directly to primary address <span className="text-teal-400 font-mono">technohmsit@gmail.com</span>
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
                                <Mail className="w-3 h-3" /> {t.email}
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
                              technohmsit@gmail.com
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
