'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { ThemeToggle } from '@/components/ThemeProvider'
import {
  Building2,
  Users,
  Play,
  Pause,
  Plus,
  Send,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  LogOut,
  Shield,
  Layers,
  Activity,
  RefreshCw,
  Search,
  ExternalLink,
  X,
  Radio,
  StopCircle,
  FileText,
  MoreVertical,
  CreditCard,
  Crown,
  RotateCcw,
  UserPlus
} from 'lucide-react'
import { APP_CONFIG, isAdminUser } from '@/config/appConfig'

interface Member {
  user_id: string
  email: string
  name: string
  role: string
  enterprise_role: string
  enterprise_status: string
  enabled_for_daily_run: boolean
  plan: string
  plan_name: string
  plan_active?: boolean
  plan_expires_at?: string | null
  applied_today: number
  applied_this_week: number
  applied_this_month: number
  total_applied: number
  on_demand_runs_used: number
  on_demand_quota: number
  daily_application_limit: number
  last_applied_at: string | null
  created_at: string | null
  active_task?: { task_id: string; status: string; queue_position: number | null } | null
  sweep_eligible?: boolean
  sweep_blockers?: string[]
}

interface OrgInfo {
  org_id: string
  name: string
  admin_email: string
  admin_name: string
  status: string
  daily_limit_per_user: number
  weekly_on_demand_quota: number
  daily_sweep_time?: string
}

interface OrgMetrics {
  total_members: number
  active_scheduled_members: number
  applied_today: number
  applied_this_week: number
  applied_this_month: number
  total_applied: number
  on_demand_runs_used_this_week: number
  weekly_quota_per_member: number
}

interface InviteItem {
  invite_id: string
  org_id: string
  org_name: string
  invited_email: string
  invited_by: string
  status: string
  created_at: string
}

export default function EnterpriseAdminPortal() {
  const [loading, setLoading] = useState(true)
  const [currentUserEmail, setCurrentUserEmail] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  
  // Org data
  const [org, setOrg] = useState<OrgInfo | null>(null)
  const [currentOrgId, setCurrentOrgId] = useState<string>('')
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string>('')
  const [metrics, setMetrics] = useState<OrgMetrics | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<InviteItem[]>([])
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSubmitting, setInviteSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [openActionMenuUserId, setOpenActionMenuUserId] = useState<string | null>(null)
  const [paymentProcessingUserId, setPaymentProcessingUserId] = useState<string | null>(null)

  // Close 3-dots dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenActionMenuUserId(null)
    if (typeof window !== 'undefined') {
      window.addEventListener('click', handleClickOutside)
      return () => window.removeEventListener('click', handleClickOutside)
    }
  }, [])

  // Live Execution Log Stream State
  const [selectedLiveLog, setSelectedLiveLog] = useState<{
    task_id: string
    user_id: string
    member_name: string
    status: string
    summary?: string
    logs: string[]
  } | null>(null)
  const [liveLogLoading, setLiveLogLoading] = useState(false)
  const [haltingTask, setHaltingTask] = useState(false)

  // Org Settings State
  const [editingOrgName, setEditingOrgName] = useState(false)
  const [orgNameInput, setOrgNameInput] = useState('')
  const [orgNameSaving, setOrgNameSaving] = useState(false)
  const [sweepTimeInput, setSweepTimeInput] = useState('')
  const [sweepTimeSaving, setSweepTimeSaving] = useState(false)

  // Auth & Initial Load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      const urlOrgId = p.get('org_id') || ''
      const urlAdminEmail = p.get('admin_email') || ''
      if (urlOrgId) setCurrentOrgId(urlOrgId)
      if (urlAdminEmail) setCurrentAdminEmail(urlAdminEmail)

      // Step 1: Ingest Google OAuth params if this is a redirect from Google SSO
      if (p.get('auth') === 'google' && p.get('user_id')) {
        const gUid = p.get('user_id')!
        const gEmail = p.get('email') || ''
        const gRole = p.get('role') || 'enterprise_admin'
        const gPlan = p.get('plan') || 'enterprise'
        const gName = p.get('name') || ''
        const gPicture = p.get('picture') || ''
        localStorage.setItem('user_id', gUid)
        localStorage.setItem('user_email', gEmail)
        localStorage.setItem('user_role', gRole)
        localStorage.setItem('user_plan', gPlan)
        if (gName) localStorage.setItem('user_name', gName)
        if (gPicture) localStorage.setItem('user_picture', gPicture)
        window.history.replaceState({}, document.title, '/enterprise-admin')
      }

      // Step 2: Read from localStorage (now populated if Google redirect)
      const storedUid = localStorage.getItem('user_id')
      const storedEmail = localStorage.getItem('user_email') || ''
      const storedRole = localStorage.getItem('user_role') || 'user'

      if (!storedUid) {
        window.location.replace('/login?error=' + encodeURIComponent('Please sign in to access Enterprise Portal.'))
        return
      }

      const superAdminCheck = isAdminUser(storedEmail) || isAdminUser(storedUid)
      setIsSuperAdmin(superAdminCheck)
      setCurrentUserEmail(storedEmail)
      setCurrentUserId(storedUid)

      const isEntAdmin = superAdminCheck || storedRole === 'enterprise_admin' || storedEmail === 'koushiksrmedala@gmail.com'

      if (!isEntAdmin) {
        window.location.replace('/dashboard?notice=' + encodeURIComponent('Access denied: Enterprise Administrator access required.'))
        return
      }

      loadAllPortalData(storedUid, storedEmail, false, urlOrgId, urlAdminEmail)
    }
  }, [])

  // Auth headers including specific org target when navigating from super admin
  const getAuthHeaders = () => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    const oId = org?.org_id || currentOrgId
    if (oId) h['x-org-id'] = oId
    const aEmail = org?.admin_email || currentAdminEmail
    if (aEmail) h['x-admin-email'] = aEmail
    return h
  }

  const loadAllPortalData = async (
    uid = currentUserId,
    email = currentUserEmail,
    silent = false,
    targetOrgId?: string,
    targetAdminEmail?: string
  ) => {
    if (!silent) setLoading(true)
    try {
      const activeOrgId = targetOrgId !== undefined ? targetOrgId : (currentOrgId || '')
      const activeAdminEmail = targetAdminEmail !== undefined ? targetAdminEmail : (currentAdminEmail || '')

      const queryParams = new URLSearchParams()
      if (activeOrgId) queryParams.set('org_id', activeOrgId)
      if (activeAdminEmail) queryParams.set('admin_email', activeAdminEmail)
      const qStr = queryParams.toString() ? `?${queryParams.toString()}` : ''

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': uid || 'technohmsit',
        'x-user-email': email || 'technohmsit@gmail.com'
      }
      if (activeOrgId) headers['x-org-id'] = activeOrgId
      if (activeAdminEmail) headers['x-admin-email'] = activeAdminEmail

      const [orgRes, membersRes, invitesRes] = await Promise.all([
        fetch(`/api/enterprise-admin/org${qStr}`, { headers }),
        fetch(`/api/enterprise-admin/members${qStr}`, { headers }),
        fetch(`/api/enterprise-admin/invite${qStr}`, { headers })
      ])

      if (orgRes.ok) {
        const orgData = await orgRes.json()
        setOrg(orgData.org)
        if (orgData.org?.org_id) setCurrentOrgId(orgData.org.org_id)
        if (orgData.org?.admin_email) setCurrentAdminEmail(orgData.org.admin_email)
        setMetrics(orgData.metrics)
        if (orgData.org?.daily_sweep_time) setSweepTimeInput(orgData.org.daily_sweep_time)
      }

      if (membersRes.ok) {
        const memData = await membersRes.json()
        setMembers(memData.members || [])
      }

      if (invitesRes.ok) {
        const invData = await invitesRes.json()
        setInvites(invData.invites || [])
      }
    } catch (e: any) {
      console.error('Error loading enterprise admin data:', e)
      setFeedback({ type: 'error', text: 'Failed to load enterprise data: ' + e.message })
    } finally {
      setLoading(false)
    }
  }

  // Toggle Member Enabled / Disabled
  const handleToggleMember = async (member: Member) => {
    const newStatus = !member.enabled_for_daily_run
    const targetKey = member.user_id || member.email
    setActionLoadingId(targetKey)
    setFeedback(null)

    try {
      const res = await fetch('/api/enterprise-admin/members', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: member.user_id || member.email,
          email: member.email || member.user_id,
          target_user_id: member.user_id || member.email,
          target_email: member.email || member.user_id,
          enabled: newStatus
        })
      })

      const data = await res.json()
      if (res.ok) {
        setMembers(prev =>
          prev.map(m =>
            (m.user_id === member.user_id || (m.email && m.email === member.email))
              ? { ...m, enabled_for_daily_run: newStatus, enterprise_status: newStatus ? 'active' : 'disabled' }
              : m
          )
        )
        setFeedback({
          type: 'success',
          text: newStatus
            ? `Member ${member.name || member.email} is ENABLED. Automated daily sweeps will run for them.`
            : `Member ${member.name || member.email} is PAUSED. Future automated runs will skip them.`
        })
      } else {
        setFeedback({ type: 'error', text: data.detail || 'Failed to update member status' })
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message || 'Network error updating member' })
    } finally {
      setActionLoadingId(null)
    }
  }

  // Trigger On-Demand Sweep for Member
  const handleTriggerOnDemand = async (member: Member) => {
    setActionLoadingId(member.user_id)
    setFeedback(null)

    try {
      const res = await fetch('/api/enterprise-admin/on-demand', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ user_id: member.user_id })
      })

      const data = await res.json()
      if (data.status === 'active') {
        // Member already has a live/queued sweep — show its status, don't duplicate
        setMembers(prev =>
          prev.map(m =>
            m.user_id === member.user_id
              ? { ...m, active_task: { task_id: data.task_id, status: data.task_status || 'pending', queue_position: data.queue_position ?? null } }
              : m
          )
        )
        setFeedback({
          type: 'info',
          text: data.task_status === 'running'
            ? `⏳ ${member.name || member.email} is RUNNING live right now. Open Live Log to watch — no new run needed.`
            : `⏳ ${member.name || member.email} is already queued at position #${data.queue_position ?? '?'}. It will start automatically in order.`
        })
        return
      }
      if (res.ok) {
        const usageNote = (data.applied_today !== undefined && data.daily_limit)
          ? ` (${data.applied_today}/${data.daily_limit} applications used today`
            + (data.on_demand_used_today !== undefined ? ` · on-demand ${data.on_demand_used_today}/3 today` : '')
            + `).`
          : '.'
        setFeedback({
          type: 'success',
          text: `Live on-demand sweep dispatched for ${member.name || member.email}! Position #${data.queue_position} in line${usageNote} Follow Live Log — its final summary states exactly what happened.`
        })
        loadAllPortalData()
      } else {
        setFeedback({ type: 'error', text: data.detail || 'Failed to dispatch on-demand task' })
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message || 'Failed to trigger task' })
    } finally {
      setActionLoadingId(null)
    }
  }

  // Trigger Razorpay Payment for an Individual Candidate
  const handlePayForMember = async (member: Member, planId: 'org_starter' | 'org_pro' | 'org_pro_3m') => {
    setOpenActionMenuUserId(null)
    setPaymentProcessingUserId(member.user_id)
    setFeedback({ type: 'info', text: `Initiating payment checkout for ${member.name || member.email}...` })

    try {
      if (typeof window === 'undefined' || !(window as any).Razorpay) {
        throw new Error('Razorpay gateway is still loading. Please refresh and try again.')
      }

      const planDisplayNames: Record<string, string> = {
        org_starter: 'Org Starter (₹79/mo)',
        org_pro: 'Org Pro (₹99/mo)',
        org_pro_3m: 'Org Pro 3-Month (₹289/3 mos)'
      }

      // 1. Create Razorpay order on backend
      const orderRes = await fetch('/api/payment/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: planId,
          user_id: member.user_id || member.email,
          email: member.email || member.user_id
        })
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok) {
        throw new Error(orderData.detail || 'Failed to create payment order')
      }

      // 2. Launch Razorpay Checkout Modal
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'JobFlux AI',
        description: `${planDisplayNames[planId]} for ${member.name || member.email}`,
        image: '/images/icon.png',
        order_id: orderData.order_id,
        prefill: {
          email: member.email,
          name: member.name || member.user_id
        },
        theme: {
          color: '#06b6d4'
        },
        handler: async (response: any) => {
          try {
            setFeedback({ type: 'info', text: `Verifying payment for ${member.name || member.email}...` })
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_id: planId,
                user_id: member.user_id || member.email,
                email: member.email || member.user_id
              })
            })

            const verifyData = await verifyRes.json()
            if (verifyRes.ok && verifyData.verified) {
              setFeedback({
                type: 'success',
                text: `Payment confirmed! ${planDisplayNames[planId]} successfully activated for ${member.name || member.email}.`
              })
              const uid = localStorage.getItem('user_id') || ''
              const em = localStorage.getItem('user_email') || ''
              loadAllPortalData(uid, em)
            } else {
              setFeedback({
                type: 'error',
                text: verifyData.detail || 'Payment verification failed.'
              })
            }
          } catch (vErr: any) {
            setFeedback({ type: 'error', text: `Verification error: ${vErr.message}` })
          } finally {
            setPaymentProcessingUserId(null)
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessingUserId(null)
          }
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', (response: any) => {
        setPaymentProcessingUserId(null)
        setFeedback({
          type: 'error',
          text: `Payment failed: ${response.error?.description || response.error?.reason || 'Cancelled'}`
        })
      })
      rzp.open()
    } catch (err: any) {
      setPaymentProcessingUserId(null)
      setFeedback({ type: 'error', text: err.message || 'Payment initiation failed' })
    }
  }

  // Direct Plan Assignment (SUPER-ADMIN ONLY override — org admins never see it)
  const handleAssignPlan = async (member: Member, planId: 'org_starter' | 'org_pro' | 'org_pro_3m' | 'none') => {
    if (!isSuperAdmin) {
      setFeedback({ type: 'error', text: 'Only Super Admin can assign plans directly. Please pay via Razorpay.' })
      return
    }
    setOpenActionMenuUserId(null)
    const targetKey = member.user_id || member.email
    setActionLoadingId(targetKey)
    setFeedback(null)

    try {
      const res = await fetch('/api/enterprise-admin/members', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: member.user_id || member.email,
          email: member.email || member.user_id,
          target_user_id: member.user_id || member.email,
          target_email: member.email || member.user_id,
          plan_id: planId
        })
      })

      const data = await res.json()
      if (res.ok) {
        setFeedback({
          type: 'success',
          text: `Plan updated to ${planId === 'none' ? 'No Plan' : planId} for ${member.name || member.email}.`
        })
        const uid = localStorage.getItem('user_id') || ''
        const em = localStorage.getItem('user_email') || ''
        loadAllPortalData(uid, em, true)
      } else {
        setFeedback({ type: 'error', text: data.detail || 'Failed to update plan' })
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message || 'Network error updating plan' })
    } finally {
      setActionLoadingId(null)
    }
  }

  // Poll live execution log if modal is open and task is active
  useEffect(() => {
    if (!selectedLiveLog?.task_id) return
    if (selectedLiveLog.status !== 'running' && selectedLiveLog.status !== 'pending') return

    const pollTaskLogs = async () => {
      try {
        const res = await fetch(`/api/enterprise-admin/on-demand?task_id=${encodeURIComponent(selectedLiveLog.task_id)}`, {
          headers: getAuthHeaders()
        })
        if (res.ok) {
          const data = await res.json()
          if (data.task) {
            setSelectedLiveLog(prev => prev ? {
              ...prev,
              status: data.task.status,
              summary: data.task.summary,
              logs: data.task.logs_preview && data.task.logs_preview.length > 0 ? data.task.logs_preview : prev.logs
            } : null)
          }
        }
      } catch (e) {
        console.warn('Failed to poll live log:', e)
      }
    }

    const timer = setInterval(pollTaskLogs, 2500)
    return () => clearInterval(timer)
  }, [selectedLiveLog?.task_id, selectedLiveLog?.status])

  // Silent queue-status refresh while any member has an active task
  const hasActiveQueue = members.some(m => m.active_task)
  useEffect(() => {
    if (!hasActiveQueue) return
    const timer = setInterval(() => {
      const uid = localStorage.getItem('user_id') || ''
      const em = localStorage.getItem('user_email') || ''
      loadAllPortalData(uid, em, true)
    }, 15000)
    return () => clearInterval(timer)
  }, [hasActiveQueue])

  // Open Live Log Stream Modal for a Candidate
  const handleOpenLiveLog = async (member: Member) => {
    if (!member.plan_active) {
      setFeedback({ type: 'info', text: 'Live Log is unavailable for candidates with No Plan.' })
      return
    }
    setLiveLogLoading(true)
    setSelectedLiveLog({
      task_id: '',
      user_id: member.user_id,
      member_name: member.name || member.user_id,
      status: 'loading',
      logs: ['Connecting to cloud execution pipeline...']
    })

    try {
      const res = await fetch(`/api/enterprise-admin/on-demand?user_id=${encodeURIComponent(member.user_id)}`, {
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (data.task) {
        setSelectedLiveLog({
          task_id: data.task.task_id,
          user_id: member.user_id,
          member_name: member.name || member.user_id,
          status: data.task.status,
          summary: data.task.summary,
          logs: data.task.logs_preview && data.task.logs_preview.length > 0 ? data.task.logs_preview : ['No logs captured yet.']
        })
      } else {
        setSelectedLiveLog({
          task_id: '',
          user_id: member.user_id,
          member_name: member.name || member.user_id,
          status: 'idle',
          logs: ['No active or recent execution runs found for this candidate.']
        })
      }
    } catch (e: any) {
      setSelectedLiveLog(prev => prev ? { ...prev, logs: ['Error fetching log: ' + e.message] } : null)
    } finally {
      setLiveLogLoading(false)
    }
  }

  // Halt / Stop a Running Task
  const handleHaltTask = async (taskId: string) => {
    if (!taskId) return
    setHaltingTask(true)
    try {
      const res = await fetch(`/api/enterprise-admin/on-demand?task_id=${encodeURIComponent(taskId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (res.ok) {
        setSelectedLiveLog(prev => prev ? { ...prev, status: 'cancelled', summary: 'Halted by Administrator' } : null)
        setFeedback({ type: 'info', text: `Task ${taskId} halted successfully.` })
        loadAllPortalData()
      } else {
        alert(data.detail || 'Failed to halt task')
      }
    } catch (e: any) {
      alert('Error halting task: ' + e.message)
    } finally {
      setHaltingTask(false)
    }
  }

  // Send Invitation
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanEmail = inviteEmail.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFeedback({ type: 'error', text: 'Please enter a valid candidate email address.' })
      return
    }

    setInviteSubmitting(true)
    setFeedback(null)

    try {
      const res = await fetch('/api/enterprise-admin/invite', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: cleanEmail })
      })

      const data = await res.json()
      if (res.ok) {
        setInviteEmail('')
        setFeedback({
          type: 'success',
          text: `Invitation sent to ${cleanEmail}! When they log in, an Enterprise acceptance banner will appear on their dashboard.`
        })
        loadAllPortalData()
      } else {
        setFeedback({ type: 'error', text: data.detail || 'Failed to send invite' })
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message || 'Network error sending invite' })
    } finally {
      setInviteSubmitting(false)
    }
  }

  // Revoke Invitation
  const handleRevokeInvite = async (inviteId: string, email: string) => {
    try {
      const res = await fetch(`/api/enterprise-admin/invite?invite_id=${inviteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      if (res.ok) {
        setInvites(prev => prev.filter(inv => inv.invite_id !== inviteId))
        setFeedback({ type: 'info', text: `Invitation for ${email} revoked.` })
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: 'Failed to revoke invite: ' + e.message })
    }
  }

  const handleSignOut = () => {
    if (isSuperAdmin) {
      if (typeof window !== 'undefined') {
        if (window.opener) {
          window.close()
        } else {
          window.location.href = '/admin'
        }
      }
      return
    }
    try { navigator.sendBeacon('/api/auth/logout') } catch {}
    localStorage.clear()
    window.location.href = '/login'
  }

  // Save Org Name
  const handleSaveOrgName = async () => {
    const trimmedName = orgNameInput.trim()
    if (!trimmedName || trimmedName.length < 2) {
      setFeedback({ type: 'error', text: 'Org name must be at least 2 characters.' })
      return
    }
    setOrgNameSaving(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/enterprise-admin/org', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: trimmedName })
      })
      const data = await res.json()
      if (res.ok) {
        setOrg(prev => prev ? { ...prev, name: trimmedName } : prev)
        setEditingOrgName(false)
        setFeedback({ type: 'success', text: `Organisation renamed to "${trimmedName}" successfully!` })
      } else {
        setFeedback({ type: 'error', text: data.detail || 'Failed to update org name.' })
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message || 'Network error updating org name.' })
    } finally {
      setOrgNameSaving(false)
    }
  }

  // Save Daily Sweep Time
  const handleSaveSweepTime = async () => {
    const t = sweepTimeInput.trim()
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(t)) {
      setFeedback({ type: 'error', text: 'Sweep time must be HH:MM in 24-hour IST (e.g. 09:00).' })
      return
    }
    setSweepTimeSaving(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/enterprise-admin/org', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ daily_sweep_time: t })
      })
      const data = await res.json()
      if (res.ok) {
        setOrg(prev => prev ? { ...prev, daily_sweep_time: t } : prev)
        setFeedback({ type: 'success', text: `Daily sweep time set to ${t} IST. All members queue one-by-one from that time each day.` })
      } else {
        setFeedback({ type: 'error', text: data.detail || 'Failed to update sweep time.' })
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message || 'Network error updating sweep time.' })
    } finally {
      setSweepTimeSaving(false)
    }
  }

  // Filter members by search
  const filteredMembers = members.filter(m =>
    (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.user_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-black light:bg-white text-white light:text-zinc-900 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Ambient Cyber Aurora Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/3 w-[600px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Navigation Bar with Super Admin Org Management Banner */}
      <div className="sticky top-0 z-30">
        {isSuperAdmin && (
          <div className="bg-gradient-to-r from-sky-950 via-indigo-950 to-sky-950 border-b border-sky-500/30 px-4 sm:px-6 py-2 text-xs flex flex-wrap items-center justify-between gap-2 text-sky-200 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="font-bold text-white tracking-wide">Super Admin Org Management View:</span>
              <span className="text-zinc-300">
                Managing workspace <strong>{org?.name || currentOrgId || 'Organization'}</strong> ({org?.org_id || currentOrgId})
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-900/60 border border-sky-600/40 text-sky-300 hidden sm:inline-block">
                Super Admin Session Active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.opener) {
                    window.close()
                  } else {
                    window.location.href = '/admin'
                  }
                }}
                className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Return to Super Admin Console</span>
              </button>
            </div>
          </div>
        )}

        <header className="border-b border-zinc-900 light:border-zinc-200 bg-zinc-950/80 light:bg-white/85 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-cyan-300 light:text-cyan-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base text-white light:text-zinc-900 tracking-tight">
                    {org?.name || 'Technohm SIT Org'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 light:bg-cyan-50 border border-cyan-800/60 light:border-cyan-300 text-cyan-300 light:text-cyan-700 font-semibold uppercase">
                    Enterprise Portal
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 light:text-zinc-600 font-mono">
                  Admin: {org?.admin_email || currentUserEmail}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <ThemeToggle />
              {isSuperAdmin && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 rounded-lg bg-sky-950/50 hover:bg-sky-900/50 border border-sky-800/50 text-sky-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Super Admin Panel</span>
                </Link>
              )}

              <button
                onClick={() => loadAllPortalData()}
                disabled={loading}
                className="p-2 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                {isSuperAdmin ? (
                  <>
                    <Shield className="w-3.5 h-3.5 text-sky-400" />
                    <span className="hidden sm:inline">Back to Super Admin</span>
                    <span className="sm:hidden">Exit</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 relative z-10">
        {/* Banner Feedback */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm animate-fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/60 light:border-emerald-300 text-emerald-300 light:text-emerald-700'
                : feedback.type === 'error'
                  ? 'bg-rose-950/40 light:bg-rose-50 border-rose-800/60 text-rose-300 light:text-rose-600'
                  : 'bg-cyan-950/40 border-cyan-800/60 light:border-cyan-300 text-cyan-300 light:text-cyan-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 light:text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 light:text-rose-600" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── Org Disabled Warning ───────────────────────────────── */}
        {org && org.status === 'disabled' && (
          <div className="p-4 rounded-2xl bg-rose-950/40 light:bg-rose-50 border-2 border-rose-500/50 light:border-rose-300 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-rose-400 light:text-rose-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-rose-300 light:text-rose-600 mb-0.5">Organisation Temporarily Disabled</p>
              <p className="text-xs text-rose-400/80 leading-relaxed">
                Your organisation <strong className="text-rose-300 light:text-rose-600">{org.name}</strong> has been disabled by the Super Admin.
                All automated daily sweeps and on-demand runs are <strong>completely blocked</strong> for every member until re-enabled.
                Please contact support if you believe this is an error.
              </p>
            </div>
          </div>
        )}

        {/* Modern Enterprise KPI Strip */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Candidates */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 light:bg-white border border-zinc-800/80 light:border-zinc-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 light:text-zinc-500 font-mono">
                Candidates
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 light:text-cyan-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-white light:text-zinc-900 tracking-tight">
                {metrics?.total_members || members.length}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400 light:text-zinc-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span><strong className="text-zinc-300 light:text-zinc-800">{metrics?.active_scheduled_members || 0}</strong> active runs</span>
              </div>
            </div>
          </div>

          {/* Today's Applications */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 light:bg-white border border-zinc-800/80 light:border-zinc-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 light:text-zinc-500 font-mono">
                Today's Applies
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 light:text-sky-600">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-cyan-400 light:text-cyan-600 tracking-tight">
                {metrics?.applied_today || 0}
              </div>
              <div className="mt-1 text-xs text-zinc-400 light:text-zinc-600">
                Daily cap: 55 / member
              </div>
            </div>
          </div>

          {/* This Week */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 light:bg-white border border-zinc-800/80 light:border-zinc-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 light:text-zinc-500 font-mono">
                Weekly Volume
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 light:text-indigo-600">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-indigo-300 light:text-indigo-600 tracking-tight">
                {metrics?.applied_this_week || 0}
              </div>
              <div className="mt-1 text-xs text-zinc-400 light:text-zinc-600">
                Rolling 7-day total
              </div>
            </div>
          </div>

          {/* Total Applications */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 light:bg-white border border-zinc-800/80 light:border-zinc-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 light:text-zinc-500 font-mono">
                All-Time Total
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 light:text-emerald-600">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-emerald-400 light:text-emerald-600 tracking-tight">
                {metrics?.total_applied || 0}
              </div>
              <div className="mt-1 text-xs text-zinc-400 light:text-zinc-600">
                Applications submitted
              </div>
            </div>
          </div>

          {/* On-Demand Runs */}
          <div className="p-4 rounded-2xl bg-zinc-950/70 light:bg-white border border-zinc-800/80 light:border-zinc-200 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 light:text-zinc-500 font-mono">
                On-Demand Runs
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 light:text-amber-600">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-amber-300 light:text-amber-600 tracking-tight">
                {metrics?.on_demand_runs_used_this_week || 0}
              </div>
              <div className="mt-1 text-xs text-zinc-400 light:text-zinc-600">
                Quota: 15 / week (Org Pro)
              </div>
            </div>
          </div>
        </section>

        {/* Workspace Management & Candidate Onboarding */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Card 1: Workspace & Automation Schedule (7 cols) */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-zinc-950/70 light:bg-white border border-zinc-800/80 light:border-zinc-200 shadow-sm flex flex-col justify-between space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 light:text-cyan-600 shrink-0">
                  <Building2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white light:text-zinc-900 tracking-tight">
                    Workspace &amp; Daily Sweep Automation
                  </h4>
                  <p className="text-[11px] text-zinc-400 light:text-zinc-600">
                    Manage organization name and automated morning sweep dispatch time.
                  </p>
                </div>
              </div>
              <span className="shrink-0 font-mono text-[10px] px-2.5 py-1 rounded-full bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-300 text-zinc-400 light:text-zinc-600">
                ID: {org?.org_id || 'org_main'}
              </span>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Org Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium font-mono text-zinc-400 light:text-zinc-600 uppercase tracking-wider block">
                  Organization Name
                </label>
                {editingOrgName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={orgNameInput}
                      onChange={e => setOrgNameInput(e.target.value)}
                      placeholder="Organization name..."
                      className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-cyan-600 focus:outline-none text-xs text-white light:text-zinc-900 font-medium placeholder-zinc-500"
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveOrgName(); if (e.key === 'Escape') setEditingOrgName(false) }}
                    />
                    <button
                      onClick={handleSaveOrgName}
                      disabled={orgNameSaving}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors disabled:opacity-60 cursor-pointer shrink-0"
                    >
                      {orgNameSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingOrgName(false)}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 text-xs cursor-pointer shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 truncate px-3 py-1.5 rounded-xl bg-zinc-900/60 light:bg-zinc-100 border border-zinc-800/80 light:border-zinc-200 text-xs text-white light:text-zinc-900 font-medium">
                      {org?.name || 'Unnamed Organization'}
                    </div>
                    <button
                      onClick={() => { setOrgNameInput(org?.name || ''); setEditingOrgName(true) }}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 text-xs font-medium cursor-pointer transition-colors shrink-0"
                    >
                      Rename
                    </button>
                  </div>
                )}
              </div>

              {/* Sweep Time */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium font-mono text-zinc-400 light:text-zinc-600 uppercase tracking-wider block">
                  Daily Sweep Dispatch Time
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-1 rounded-xl bg-zinc-900/60 light:bg-zinc-100 border border-zinc-800/80 light:border-zinc-200">
                    <Clock className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600 shrink-0" />
                    <input
                      type="time"
                      value={sweepTimeInput || org?.daily_sweep_time || '06:00'}
                      onChange={e => setSweepTimeInput(e.target.value)}
                      className="bg-transparent focus:outline-none text-xs text-white light:text-zinc-900 font-mono flex-1 [color-scheme:dark]"
                    />
                    <span className="text-[10px] font-mono text-zinc-500 font-semibold">IST</span>
                  </div>
                  <button
                    onClick={handleSaveSweepTime}
                    disabled={sweepTimeSaving}
                    className="px-3 py-1.5 rounded-xl bg-cyan-950/60 light:bg-cyan-50 hover:bg-cyan-900/60 border border-cyan-800/60 light:border-cyan-300 text-cyan-300 light:text-cyan-700 text-xs font-medium cursor-pointer disabled:opacity-60 transition-colors shrink-0"
                  >
                    {sweepTimeSaving ? 'Saving...' : 'Set Time'}
                  </button>
                </div>
              </div>
            </div>

            {/* Sweep Status Banner */}
            <div className="p-3 rounded-xl bg-cyan-950/30 light:bg-cyan-50/60 border border-cyan-800/40 light:border-cyan-200 text-xs flex flex-wrap items-center justify-between gap-2 text-zinc-300 light:text-zinc-700">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-zinc-300 light:text-zinc-700 font-medium">
                  Autonomous queue triggers daily at <strong className="text-white light:text-zinc-900 font-mono">{org?.daily_sweep_time || '06:00'} IST</strong>
                </span>
              </div>
              {(() => {
                const t = (org?.daily_sweep_time || '06:00')
                try {
                  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false })
                  const nowHm = fmt.format(new Date())
                  const nextDay = t > nowHm ? 'today' : 'tomorrow'
                  return (
                    <span className="text-[11px] font-mono text-cyan-400 light:text-cyan-700 bg-cyan-900/40 light:bg-cyan-100/80 px-2 py-0.5 rounded-md border border-cyan-700/40 light:border-cyan-300">
                      Next run: {nextDay} at {t} IST
                    </span>
                  )
                } catch {
                  return null
                }
              })()}
            </div>
          </div>

          {/* Card 2: Candidate Onboarding & Invites (5 cols) */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-zinc-950/70 light:bg-white border border-zinc-800/80 light:border-zinc-200 shadow-sm flex flex-col justify-between space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 light:text-emerald-600 shrink-0">
                <UserPlus className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white light:text-zinc-900 tracking-tight">
                  Invite Candidate
                </h4>
                <p className="text-[11px] text-zinc-400 light:text-zinc-600">
                  Onboard new candidates into this organization.
                </p>
              </div>
            </div>

            {/* Invite Form */}
            <form onSubmit={handleSendInvite} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="candidate@email.com"
                  className="flex-1 min-w-0 px-3.5 py-2 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 focus:border-cyan-500 focus:outline-none text-xs text-white light:text-zinc-900 placeholder-zinc-500 light:placeholder-zinc-400"
                />
                <button
                  type="submit"
                  disabled={inviteSubmitting}
                  className="px-4 py-2 rounded-xl bg-white light:bg-zinc-900 hover:bg-zinc-200 light:hover:bg-zinc-800 text-black light:text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shrink-0 transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{inviteSubmitting ? 'Sending...' : 'Invite'}</span>
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 light:text-zinc-600">
                Invited candidates can log in and link their Naukri credentials to participate in daily sweeps.
              </p>
            </form>

            {/* Pending Invites List */}
            {invites.filter(inv => inv.status === 'pending').length > 0 && (
              <div className="pt-2 border-t border-zinc-900 light:border-zinc-200">
                <span className="text-[10px] font-mono text-zinc-400 light:text-zinc-500 uppercase tracking-wider block mb-1.5">
                  Pending Invitations ({invites.filter(inv => inv.status === 'pending').length})
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {invites
                    .filter(inv => inv.status === 'pending')
                    .map(inv => (
                      <div
                        key={inv.invite_id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-xs font-mono"
                      >
                        <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="text-zinc-200 light:text-zinc-800 truncate max-w-[160px]">{inv.invited_email}</span>
                        <button
                          type="button"
                          onClick={() => handleRevokeInvite(inv.invite_id, inv.invited_email)}
                          className="text-zinc-500 hover:text-rose-400 transition-colors ml-0.5 cursor-pointer"
                          title="Revoke Invite"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Org Member Management Table */}
        <section className="p-5 sm:p-6 rounded-2xl bg-zinc-950/70 light:bg-white border border-zinc-900 light:border-zinc-200 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white light:text-zinc-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400 light:text-cyan-600" />
                <span>Organization Candidates &amp; Automation Controls</span>
              </h3>
              <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
                Sweep controls for every member.
              </p>
            </div>

            <div className="w-full sm:w-64 relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 light:text-zinc-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search member or email..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 focus:border-cyan-500 focus:outline-none text-xs text-white light:text-zinc-900 placeholder-zinc-500 light:placeholder-zinc-400"
              />
            </div>
          </div>

          {/* Members Table (desktop) + Cards (mobile) */}
          <div className="hidden md:block overflow-x-auto min-h-[380px] rounded-xl border border-zinc-900 light:border-zinc-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/60 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 font-mono uppercase text-[10px] tracking-wider border-b border-zinc-900 light:border-zinc-200">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4 text-center">Today</th>
                  <th className="py-3 px-4 text-center">On-Demand</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 light:divide-zinc-200">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500 light:text-zinc-600">
                      No organization members found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map(member => {
                    const memberKey = member.user_id || member.email
                    const isProcessing = actionLoadingId === member.user_id || (member.email && actionLoadingId === member.email)
                    const isEnabled = member.enabled_for_daily_run
                    const isActionMenuOpen = openActionMenuUserId === memberKey
                    const isPaying = paymentProcessingUserId === memberKey

                    return (
                      <tr key={memberKey} className="hover:bg-zinc-900/30 light:hover:bg-zinc-50 transition-colors">
                        {/* Candidate Identity */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white light:text-zinc-900">
                            {member.name || member.user_id}
                          </div>
                          <div className="text-[11px] text-zinc-400 light:text-zinc-600 font-mono">
                            {member.email}
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {member.enterprise_role === 'admin' && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 light:bg-cyan-50 text-cyan-300 light:text-cyan-700 border border-cyan-800/50 light:border-cyan-300 font-semibold">
                                Org Admin
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${
                              !member.plan_active
                                ? 'bg-zinc-800/60 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 border-zinc-700/60 light:border-zinc-300'
                                : member.plan === 'org_pro' || member.plan === 'org_pro_3m'
                                ? 'bg-amber-950/60 light:bg-amber-50 text-amber-300 light:text-amber-700 border-amber-700/60 light:border-amber-300'
                                : 'bg-cyan-950/60 light:bg-cyan-50 text-cyan-300 light:text-cyan-700 border-cyan-800/60 light:border-cyan-300'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${member.plan_active ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                              {member.plan_active ? member.plan_name : 'No Plan'}
                            </span>
                          </div>
                          {member.plan_active && member.plan_expires_at && (
                            <div className="text-[10px] text-zinc-500 light:text-zinc-600 font-mono mt-1">
                              till {new Date(member.plan_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          )}
                        </td>

                        {/* Today's Applications */}
                        <td className="py-3.5 px-4 text-center">
                          {(() => {
                            const memberCap = member.daily_application_limit ?? 0
                            return (
                              <>
                                <span className={`font-mono font-bold ${
                                  !member.plan_active ? 'text-zinc-500' :
                                  member.applied_today >= memberCap && memberCap > 0 ? 'text-amber-400 light:text-amber-600' : 'text-cyan-300 light:text-cyan-700'
                                }`}>
                                  {member.applied_today}
                                </span>
                                <span className="text-zinc-600 font-mono"> / {memberCap}</span>
                              </>
                            )
                          })()}
                        </td>

                        {/* On-Demand Usage */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono text-cyan-300 light:text-cyan-700 font-semibold">
                            {member.on_demand_runs_used}
                          </span>
                          <span className="text-zinc-600 font-mono"> / {member.on_demand_quota || 0}</span>
                        </td>

                        {/* Automated Run Status */}
                        <td className="py-3.5 px-4 text-center">
                          {!member.plan_active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/60 light:bg-zinc-100 border border-zinc-700/60 light:border-zinc-300 text-zinc-400 light:text-zinc-600 text-[10px] font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                              No Plan
                            </span>
                          ) : isEnabled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 light:bg-emerald-50 border border-emerald-800/60 light:border-emerald-300 text-emerald-300 light:text-emerald-700 text-[10px] font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active Runs
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800/80 light:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-400 light:text-zinc-600 text-[10px] font-mono">
                              <Pause className="w-2.5 h-2.5 text-zinc-400 light:text-zinc-600" />
                              Paused
                            </span>
                          )}
                          <div className="text-[10px] font-mono mt-1 truncate max-w-[180px] mx-auto" title={(member.sweep_blockers || []).join('; ')}>
                            {!member.plan_active ? (
                              <span className="text-zinc-500 light:text-zinc-600">No active plan</span>
                            ) : member.sweep_eligible === false ? (
                              <span className="text-amber-300 light:text-amber-700">
                                {(member.sweep_blockers || ['blocked'])[0]}
                              </span>
                            ) : (
                              <span className="text-emerald-400/80">In daily sweep</span>
                            )}
                          </div>
                        </td>

                        {/* Action Buttons: Enable/Disable + Trigger On-Demand + Three-Dots Menu */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Toggle Enable/Disable Button */}
                            <button
                              onClick={() => handleToggleMember(member)}
                              disabled={isProcessing || !member.plan_active}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 ${
                                isEnabled
                                  ? 'bg-zinc-900 light:bg-zinc-100 hover:bg-rose-950/50 border-zinc-800 light:border-zinc-200 hover:border-rose-700/60 text-zinc-300 light:text-zinc-700 hover:text-rose-300'
                                  : 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-800/60 light:border-emerald-300 text-emerald-300 light:text-emerald-700'
                              }`}
                              title={!member.plan_active ? 'No active plan: assign or pay for a plan to enable runs' : isEnabled ? 'Pause candidate from automated daily runs' : 'Enable candidate for automated daily runs'}
                            >
                              {isEnabled ? (
                                <>
                                  <Pause className="w-3 h-3 text-rose-400 light:text-rose-600" />
                                  <span>Pause</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3 text-emerald-400 light:text-emerald-600" />
                                  <span>Resume</span>
                                </>
                              )}
                            </button>

                            {/* View Live Log Button */}
                            <button
                              onClick={() => handleOpenLiveLog(member)}
                              disabled={!member.plan_active || isProcessing}
                              className="px-2 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-sky-300 hover:text-white light:hover:text-zinc-900 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              title={!member.plan_active ? 'Live Log unavailable — candidate has No Plan' : 'View real-time execution stream and bot logs'}
                            >
                              <Activity className="w-3 h-3 text-sky-400" />
                              <span>Live Log</span>
                            </button>

                            {/* On-Demand Sweep Button */}
                            {member.active_task ? (
                              <button
                                type="button"
                                disabled
                                className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-not-allowed ${
                                  member.active_task.status === 'running'
                                    ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300 light:text-emerald-700'
                                    : 'bg-sky-950/50 border-sky-800/60 text-sky-300'
                                }`}
                                title={member.active_task.status === 'running'
                                  ? 'Sweep is RUNNING live right now — open Live Log to watch.'
                                  : `Sweep queued at position #${member.active_task.queue_position ?? '?'}.`}
                              >
                                {member.active_task.status === 'running' ? (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                    <span>Running…</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 text-sky-400" />
                                    <span>Queued #{member.active_task.queue_position ?? '?'}</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleTriggerOnDemand(member)}
                                disabled={isProcessing || !isEnabled || org?.status === 'disabled' || !member.plan_active || (member.on_demand_quota || 0) === 0}
                                className="px-2.5 py-1 rounded-lg bg-cyan-950/60 light:bg-cyan-50 hover:bg-cyan-900/60 border border-cyan-800/60 light:border-cyan-300 text-cyan-300 light:text-cyan-700 hover:text-white light:hover:text-zinc-900 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
                                title={
                                  !member.plan_active
                                    ? 'No active plan — assign or pay for a plan'
                                    : (member.on_demand_quota || 0) === 0
                                    ? 'Org Starter plan includes scheduled morning sweeps only (upgrade to Org Pro for on-demand)'
                                    : org?.status === 'disabled'
                                    ? 'Org is disabled by Super Admin — all runs are blocked'
                                    : `Dispatch instant on-demand sweep (${member.applied_today || 0}/${member.daily_application_limit || 55} used today)`
                                }
                              >
                                <Zap className="w-3 h-3 text-cyan-400 light:text-cyan-600" />
                                <span>On-Demand</span>
                              </button>
                            )}

                            {/* Three Dots Menu for Individual Payments & Plan Assignment */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenActionMenuUserId(isActionMenuOpen ? null : memberKey)
                                }}
                                disabled={isProcessing || isPaying}
                                className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer flex items-center justify-center ${
                                  isActionMenuOpen
                                    ? 'bg-zinc-800 text-white border-zinc-600'
                                    : 'bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border-zinc-800 light:border-zinc-200 text-zinc-400 hover:text-white light:hover:text-zinc-900'
                                }`}
                                title="Candidate options: Pay subscription or configure plan"
                              >
                                {isPaying ? (
                                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                                ) : (
                                  <MoreVertical className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Dropdown Menu */}
                              {isActionMenuOpen && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 top-full mt-1.5 w-72 rounded-xl bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 shadow-2xl z-50 p-2 divide-y divide-zinc-900 light:divide-zinc-100 text-left font-sans"
                                >
                                  {/* Candidate Header */}
                                  <div className="px-2 pb-2">
                                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 light:text-zinc-600">
                                      Subscription
                                    </div>
                                    <div className="text-xs font-semibold text-white light:text-zinc-900 truncate">
                                      {member.name || member.email}
                                    </div>
                                    <div className="text-[11px] text-zinc-400 light:text-zinc-600 font-mono mt-0.5 flex items-center justify-between">
                                      <span>Current: <span className="text-cyan-400 font-medium">{member.plan_active ? member.plan_name : 'No Plan'}</span></span>
                                      {member.plan_active && member.plan_expires_at && (
                                        <span className="text-zinc-500 text-[10px]">
                                          till {new Date(member.plan_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Pay per member */}
                                  <div className="py-1.5 space-y-1">
                                    <div className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1">
                                      <CreditCard className="w-3 h-3" />
                                      <span>Pay per member</span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handlePayForMember(member, 'org_starter')}
                                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 light:hover:bg-zinc-100 text-xs text-zinc-200 light:text-zinc-800 flex items-center justify-between group transition-colors cursor-pointer"
                                    >
                                      <div>
                                        <div className="font-medium group-hover:text-cyan-300">Org Starter</div>
                                        <div className="text-[10px] text-zinc-500 font-mono">20/day · 30 days</div>
                                      </div>
                                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                                        ₹79
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handlePayForMember(member, 'org_pro')}
                                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 light:hover:bg-zinc-100 text-xs text-zinc-200 light:text-zinc-800 flex items-center justify-between group transition-colors cursor-pointer"
                                    >
                                      <div>
                                        <div className="font-medium flex items-center gap-1 group-hover:text-amber-300">
                                          <Crown className="w-3 h-3 text-amber-400" />
                                          <span>Org Pro</span>
                                        </div>
                                        <div className="text-[10px] text-zinc-500 font-mono">55/day · 30 days</div>
                                      </div>
                                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                                        ₹99
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handlePayForMember(member, 'org_pro_3m')}
                                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 light:hover:bg-zinc-100 text-xs text-zinc-200 light:text-zinc-800 flex items-center justify-between group transition-colors cursor-pointer"
                                    >
                                      <div>
                                        <div className="font-medium flex items-center gap-1 group-hover:text-amber-300">
                                          <Crown className="w-3 h-3 text-amber-400" />
                                          <span>Org Pro · 3 Months</span>
                                        </div>
                                        <div className="text-[10px] text-zinc-500 font-mono">55/day · 90 days</div>
                                      </div>
                                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                                        ₹289
                                      </span>
                                    </button>
                                  </div>

                                  {/* Direct assign — SUPER ADMIN ONLY */}
                                  {isSuperAdmin && (
                                  <div className="pt-1.5 space-y-0.5 border-t border-zinc-800/80 light:border-zinc-200 mt-1">
                                    <div className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-amber-400 light:text-amber-600 font-semibold flex items-center justify-between">
                                      <span>Super Admin Privilege</span>
                                      <span className="text-[9px] text-zinc-500">Free Grant</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleAssignPlan(member, 'org_starter')}
                                      className="w-full text-left px-2.5 py-1 rounded hover:bg-zinc-900 light:hover:bg-zinc-100 text-[11px] text-zinc-300 light:text-zinc-700 hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                                    >
                                      <span>Grant Starter Privilege</span>
                                      <span className="text-[10px] font-mono text-zinc-500">30 days</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAssignPlan(member, 'org_pro')}
                                      className="w-full text-left px-2.5 py-1 rounded hover:bg-cyan-950/40 light:hover:bg-cyan-50 text-[11px] text-cyan-300 light:text-cyan-700 font-medium transition-colors cursor-pointer flex items-center justify-between"
                                    >
                                      <span>Grant Pro Privilege</span>
                                      <span className="text-[10px] font-mono text-cyan-400">30 days</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAssignPlan(member, 'org_pro_3m')}
                                      className="w-full text-left px-2.5 py-1 rounded hover:bg-zinc-900 light:hover:bg-zinc-100 text-[11px] text-zinc-300 light:text-zinc-700 hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                                    >
                                      <span>Grant Pro · 3M Privilege</span>
                                      <span className="text-[10px] font-mono text-zinc-500">90 days</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAssignPlan(member, 'none')}
                                      className="w-full text-left px-2.5 py-1 rounded hover:bg-rose-950/30 text-[11px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                      <RotateCcw className="w-3 h-3 text-rose-400" />
                                      <span>Revoke Plan Privilege</span>
                                    </button>
                                  </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Member Cards (mobile): one premium card per candidate */}
          <div className="md:hidden space-y-3">
            {filteredMembers.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 light:text-zinc-600">
                No members found matching "{searchQuery}"
              </div>
            ) : (
              filteredMembers.map(member => {
                const memberKey = member.user_id || member.email
                const isEnabled = member.enabled_for_daily_run
                const isProcessing = actionLoadingId === member.user_id || (member.email && actionLoadingId === member.email)
                const isActionMenuOpen = openActionMenuUserId === memberKey
                return (
                  <div key={memberKey} className="p-3.5 rounded-2xl bg-zinc-900/40 light:bg-zinc-50 border border-zinc-800/80 light:border-zinc-200 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-white light:text-zinc-900 truncate">
                          {member.name || member.user_id}
                        </div>
                        <div className="text-[11px] text-zinc-400 light:text-zinc-600 font-mono truncate">
                          {member.email}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                          !member.plan_active
                            ? 'bg-zinc-800/60 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 border-zinc-700/60 light:border-zinc-300'
                            : member.plan === 'org_pro' || member.plan === 'org_pro_3m'
                            ? 'bg-amber-950/60 light:bg-amber-50 text-amber-300 light:text-amber-700 border-amber-700/60 light:border-amber-300'
                            : 'bg-cyan-950/60 light:bg-cyan-50 text-cyan-300 light:text-cyan-700 border-cyan-800/60 light:border-cyan-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${member.plan_active ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                          {member.plan_active ? member.plan_name : 'No Plan'}
                        </span>
                        {member.plan_active && member.plan_expires_at && (
                          <span className="text-[9px] text-zinc-500 light:text-zinc-600 font-mono mt-0.5">
                            till {new Date(member.plan_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-400 light:text-zinc-600">
                      <span>Today <strong className="text-white light:text-zinc-900">{member.applied_today}/{member.daily_application_limit ?? 0}</strong></span>
                      <span>On-demand <strong className="text-white light:text-zinc-900">{member.on_demand_runs_used}/{member.on_demand_quota || 0}</strong></span>
                      <span className={isEnabled && member.plan_active ? 'text-emerald-400' : 'text-zinc-500'}>
                        {member.plan_active ? (isEnabled ? '● Active' : '● Paused') : '○ No plan'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleToggleMember(member)}
                        disabled={isProcessing || !member.plan_active}
                        className="flex-1 min-w-[88px] px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-40 bg-zinc-900 light:bg-white border-zinc-800 light:border-zinc-200 text-zinc-200 light:text-zinc-800"
                      >
                        {isEnabled ? <><Pause className="w-3 h-3 text-rose-400" /><span>Pause</span></> : <><Play className="w-3 h-3 text-emerald-400" /><span>Resume</span></>}
                      </button>
                      <button
                        onClick={() => handleOpenLiveLog(member)}
                        disabled={!member.plan_active || isProcessing}
                        className="flex-1 min-w-[88px] px-2.5 py-1.5 rounded-lg bg-zinc-900 light:bg-white border border-zinc-800 light:border-zinc-200 text-sky-300 text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title={!member.plan_active ? 'Live Log unavailable — candidate has No Plan' : 'View real-time execution stream and bot logs'}
                      >
                        <Activity className="w-3 h-3 text-sky-400" />
                        <span>Live Log</span>
                      </button>
                      {member.active_task ? (
                        <span className="flex-1 min-w-[88px] px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1 bg-sky-950/50 border-sky-800/60 text-sky-300">
                          {member.active_task.status === 'running' ? 'Running…' : `Queued #${member.active_task.queue_position ?? '?'}`}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleTriggerOnDemand(member)}
                          disabled={isProcessing || !isEnabled || !member.plan_active || (member.on_demand_quota || 0) === 0}
                          className="flex-1 min-w-[88px] px-2.5 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-40 cursor-pointer"
                        >
                          <Zap className="w-3 h-3" />
                          <span>On-Demand</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenActionMenuUserId(isActionMenuOpen ? null : memberKey)
                        }}
                        className="px-3 py-1.5 rounded-lg border text-xs bg-zinc-900 light:bg-white border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 cursor-pointer flex items-center gap-1"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                        <span>Plan</span>
                      </button>
                    </div>
                    {isActionMenuOpen && (
                      <div className="rounded-xl bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 p-2 space-y-1">
                        <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">Pay per member</div>
                        {([
                          { id: 'org_starter' as const, label: 'Org Starter', sub: '20/day · 30 days', price: '₹79' },
                          { id: 'org_pro' as const, label: 'Org Pro', sub: '55/day · 30 days', price: '₹99' },
                          { id: 'org_pro_3m' as const, label: 'Org Pro · 3 Months', sub: '55/day · 90 days', price: '₹289' }
                        ]).map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handlePayForMember(member, opt.id)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 light:hover:bg-zinc-100 text-xs text-zinc-200 light:text-zinc-800 flex items-center justify-between cursor-pointer"
                          >
                            <span>{opt.label} <span className="text-zinc-500 font-mono text-[10px]">· {opt.sub}</span></span>
                            <span className="font-mono font-bold text-emerald-400">{opt.price}</span>
                          </button>
                        ))}
                        {isSuperAdmin && (
                          <div className="pt-1.5 border-t border-zinc-800/80 light:border-zinc-200 space-y-1">
                            <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-amber-400 light:text-amber-600 font-semibold flex items-center justify-between">
                              <span>Super Admin Privilege</span>
                              <span className="text-[9px] text-zinc-500">Free Grant</span>
                            </div>
                            {([
                              { id: 'org_starter' as const, label: 'Grant Starter Privilege', duration: '30 days' },
                              { id: 'org_pro' as const, label: 'Grant Pro Privilege', duration: '30 days' },
                              { id: 'org_pro_3m' as const, label: 'Grant Pro · 3M Privilege', duration: '90 days' }
                            ]).map(opt => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleAssignPlan(member, opt.id)}
                                className="w-full text-left px-2.5 py-1 rounded text-[11px] text-zinc-300 light:text-zinc-700 cursor-pointer flex items-center justify-between hover:bg-zinc-900 light:hover:bg-zinc-100"
                              >
                                <span>{opt.label}</span>
                                <span className="text-[10px] font-mono text-zinc-500">{opt.duration}</span>
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleAssignPlan(member, 'none')}
                              className="w-full text-left px-2.5 py-1 rounded text-[11px] text-rose-400 cursor-pointer hover:bg-rose-950/30 flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3 text-rose-400" />
                              <span>Revoke Plan Privilege</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </section>
      </main>

      {/* Live Execution Stream Modal */}
      {selectedLiveLog && (
        <div
          className="fixed inset-0 z-50 bg-black/80 light:bg-white/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLiveLog(null)
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
          >
            {/* Modal Header */}
            <div className="p-4 bg-zinc-900 light:bg-zinc-100 border-b border-zinc-800 light:border-zinc-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white light:text-zinc-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span>Execution Stream: {selectedLiveLog.member_name} ({selectedLiveLog.user_id})</span>
                  {selectedLiveLog.status === 'running' && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 light:text-emerald-700 border border-emerald-500/40 animate-pulse">
                      <Radio className="w-2.5 h-2.5 text-emerald-400 light:text-emerald-600" />
                      LIVE STREAMING
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-zinc-400 light:text-zinc-600 font-mono mt-0.5">
                  {selectedLiveLog.task_id ? `Task ID: ${selectedLiveLog.task_id} · ` : ''}Status:{' '}
                  <span className={`uppercase font-bold ${
                    selectedLiveLog.status === 'running'
                      ? 'text-emerald-400 light:text-emerald-600'
                      : selectedLiveLog.status === 'failed' || selectedLiveLog.status === 'cancelled'
                      ? 'text-rose-400 light:text-rose-600'
                      : 'text-sky-300'
                  }`}>
                    {selectedLiveLog.status}
                  </span>
                  {selectedLiveLog.summary && (
                    <span className="ml-2 text-zinc-400 light:text-zinc-600">· {selectedLiveLog.summary}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {liveLogLoading && <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />}
                <button
                  type="button"
                  onClick={() => setSelectedLiveLog(null)}
                  className="p-1.5 rounded-lg text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 bg-zinc-800 light:bg-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Logs Body */}
            <div className="p-4 bg-black light:bg-white overflow-y-auto flex-1 font-mono text-xs space-y-1 select-text scroll-smooth max-h-[55vh]">
              {selectedLiveLog.logs.map((line, i) => (
                <div
                  key={i}
                  className={`leading-relaxed ${
                    line.includes('❌') || line.includes('Error') || line.includes('Failed')
                      ? 'text-rose-400 light:text-rose-600 font-medium'
                      : line.includes('🛑') || line.includes('⚠️')
                      ? 'text-amber-400 light:text-amber-600'
                      : line.includes('🎉') || line.includes('APPLIED!') || line.includes('COMPLETED')
                      ? 'text-emerald-400 light:text-emerald-600 font-semibold'
                      : line.includes('🏢') || line.includes('🚀') || line.includes('Company resolved')
                      ? 'text-sky-300'
                      : 'text-zinc-300 light:text-zinc-700'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-zinc-900 light:bg-zinc-100 border-t border-zinc-800 light:border-zinc-200 flex items-center justify-between text-xs">
              <div className="text-zinc-400 light:text-zinc-600">
                Total Captured Lines: <strong className="text-white light:text-zinc-900">{selectedLiveLog.logs.length}</strong>
                {selectedLiveLog.status === 'running' && (
                  <span className="ml-2 text-zinc-500 light:text-zinc-600 text-[11px]">(Auto-refreshing every 2.5s)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {(selectedLiveLog.status === 'running' || selectedLiveLog.status === 'pending') && selectedLiveLog.task_id && (
                  <button
                    type="button"
                    disabled={haltingTask}
                    onClick={() => handleHaltTask(selectedLiveLog.task_id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 light:border-rose-300 text-rose-300 light:text-rose-600 font-semibold cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    <span>{haltingTask ? 'Stopping...' : 'Stop / Halt Task'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedLiveLog(null)}
                  className="px-4 py-1.5 rounded-lg bg-zinc-800 light:bg-zinc-200 hover:bg-zinc-700 text-white light:text-zinc-900 font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Checkout Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
    </div>
  )
}
