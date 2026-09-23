'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
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
  FileText
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
  const [metrics, setMetrics] = useState<OrgMetrics | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<InviteItem[]>([])
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSubmitting, setInviteSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

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
      // Step 1: Ingest Google OAuth params if this is a redirect from Google SSO
      const p = new URLSearchParams(window.location.search)
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

      loadAllPortalData(storedUid, storedEmail)
    }
  }, [])

  // Auth is the httpOnly session cookie (same-origin fetch sends it automatically).
  // Never send identity headers — the server ignores them.
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json'
    }
  }

  const loadAllPortalData = async (uid = currentUserId, email = currentUserEmail, silent = false) => {
    if (!silent) setLoading(true)
    try {
      const headers = {
        'x-user-id': uid || 'koushiksrmedala',
        'x-user-email': email || 'koushiksrmedala@gmail.com'
      }

      const [orgRes, membersRes, invitesRes] = await Promise.all([
        fetch('/api/enterprise-admin/org', { headers }),
        fetch('/api/enterprise-admin/members', { headers }),
        fetch('/api/enterprise-admin/invite', { headers })
      ])

      if (orgRes.ok) {
        const orgData = await orgRes.json()
        setOrg(orgData.org)
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
    setActionLoadingId(member.user_id)
    setFeedback(null)

    try {
      const res = await fetch('/api/enterprise-admin/members', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: member.user_id,
          email: member.email,
          enabled: newStatus
        })
      })

      const data = await res.json()
      if (res.ok) {
        setMembers(prev =>
          prev.map(m =>
            m.user_id === member.user_id
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

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-900 light:border-zinc-200 bg-zinc-950/80 light:bg-white/85 backdrop-blur-xl">
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
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

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
              <p className="text-sm font-bold text-rose-300 light:text-rose-600 mb-0.5">⛔ Organisation Temporarily Disabled</p>
              <p className="text-xs text-rose-400/80 leading-relaxed">
                Your organisation <strong className="text-rose-300 light:text-rose-600">{org.name}</strong> has been disabled by the Super Admin.
                All automated daily sweeps and on-demand runs are <strong>completely blocked</strong> for every member until re-enabled.
                Please contact support if you believe this is an error.
              </p>
            </div>
          </div>
        )}

        {/* Compact KPI Strip */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          <div className="p-3 rounded-xl bg-zinc-950/70 light:bg-white border border-zinc-800/80 light:border-zinc-200 flex items-center gap-2.5">
            <Users className="w-4 h-4 text-cyan-400 light:text-cyan-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-lg font-bold font-mono text-white light:text-zinc-900 leading-none">
                {metrics?.total_members || members.length}
              </div>
              <div className="text-[10px] text-zinc-500 light:text-zinc-600 font-mono truncate">
                Members · {metrics?.active_scheduled_members || 0} active
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/70 light:bg-white border border-zinc-800/80 light:border-zinc-200 flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-cyan-400 light:text-cyan-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-lg font-bold font-mono text-cyan-400 light:text-cyan-600 leading-none">
                {metrics?.applied_today || 0}
              </div>
              <div className="text-[10px] text-zinc-500 light:text-zinc-600 font-mono truncate">
                Today's Apps · 55/user max
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/70 light:bg-white border border-zinc-800/80 light:border-zinc-200 flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-cyan-400 light:text-cyan-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-lg font-bold font-mono text-cyan-300 light:text-cyan-700 leading-none">
                {metrics?.applied_this_week || 0}
              </div>
              <div className="text-[10px] text-zinc-500 light:text-zinc-600 font-mono truncate">
                This Week · rolling 7-day
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/70 light:bg-white border border-zinc-800/80 light:border-zinc-200 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 light:text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-lg font-bold font-mono text-emerald-400 light:text-emerald-600 leading-none">
                {metrics?.total_applied || 0}
              </div>
              <div className="text-[10px] text-zinc-500 light:text-zinc-600 font-mono truncate">
                Total Applications
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/70 light:bg-white border border-zinc-800/80 light:border-zinc-200 flex items-center gap-2.5 col-span-2 sm:col-span-1">
            <Zap className="w-4 h-4 text-amber-400 light:text-amber-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-lg font-bold font-mono text-amber-300 light:text-amber-700 leading-none">
                {metrics?.on_demand_runs_used_this_week || 0}
              </div>
              <div className="text-[10px] text-zinc-500 light:text-zinc-600 font-mono truncate">
                On-Demand · 3/day · 10/wk
              </div>
            </div>
          </div>
        </section>

        {/* Organisation Settings + Invite (single compact card) */}
        <section className="p-4 rounded-2xl bg-zinc-950/70 light:bg-white border border-zinc-800/80 light:border-zinc-200 backdrop-blur-md space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Org name + daily sweep time */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400 light:text-cyan-600 shrink-0" />
                {editingOrgName ? (
                  <>
                    <input
                      type="text"
                      value={orgNameInput}
                      onChange={e => setOrgNameInput(e.target.value)}
                      placeholder="Organisation name..."
                      className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-zinc-900/80 light:bg-zinc-100 border border-cyan-700 focus:border-cyan-500 focus:outline-none text-xs text-white light:text-zinc-900 placeholder-zinc-500 light:placeholder-zinc-400"
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveOrgName(); if (e.key === 'Escape') setEditingOrgName(false) }}
                    />
                    <button
                      onClick={handleSaveOrgName}
                      disabled={orgNameSaving}
                      className="px-3 py-1.5 rounded-lg bg-white light:bg-zinc-900 hover:bg-zinc-200 light:hover:bg-zinc-800 text-black light:text-white font-semibold text-xs flex items-center gap-1 disabled:opacity-60 cursor-pointer shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {orgNameSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingOrgName(false)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 text-xs cursor-pointer shrink-0"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 min-w-0 truncate px-3 py-1.5 rounded-lg bg-zinc-900/50 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-xs text-white light:text-zinc-900 font-medium" title={org?.name || 'Unnamed Organisation'}>
                      {org?.name || 'Unnamed Organisation'}
                    </span>
                    <button
                      onClick={() => { setOrgNameInput(org?.name || ''); setEditingOrgName(true) }}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 text-xs font-medium cursor-pointer shrink-0"
                    >
                      Rename
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400 light:text-cyan-600 shrink-0" />
                <span className="text-[11px] text-zinc-400 light:text-zinc-600">Daily sweep</span>
                <input
                  type="time"
                  value={sweepTimeInput || org?.daily_sweep_time || '06:00'}
                  onChange={e => setSweepTimeInput(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-zinc-900/80 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 focus:border-cyan-500 focus:outline-none text-xs text-white light:text-zinc-900 font-mono [color-scheme:dark]"
                />
                <span className="text-[10px] text-zinc-500 light:text-zinc-600 font-mono">IST</span>
                <button
                  onClick={handleSaveSweepTime}
                  disabled={sweepTimeSaving}
                  className="px-3 py-1 rounded-lg bg-cyan-950/60 light:bg-cyan-50 hover:bg-cyan-900/60 border border-cyan-800/60 light:border-cyan-300 text-cyan-300 light:text-cyan-700 text-xs font-medium cursor-pointer disabled:opacity-60 shrink-0"
                >
                  {sweepTimeSaving ? 'Saving...' : 'Set Time'}
                </button>
                <span className="text-[10px] text-zinc-600 font-mono hidden sm:inline">members queue one-by-one from this time daily</span>
                {(() => {
                  const t = (org?.daily_sweep_time || '06:00')
                  try {
                    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false })
                    const nowHm = fmt.format(new Date())
                    const nextDay = t > nowHm ? 'today' : 'tomorrow'
                    return <span className="text-[10px] font-mono text-cyan-400/90">· Next run {nextDay} {t} IST</span>
                  } catch {
                    return null
                  }
                })()}
              </div>
            </div>

            {/* Invite */}
            <form onSubmit={handleSendInvite} className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400 light:text-cyan-600 shrink-0" />
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="candidate@email.com — invite to org"
                className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-zinc-900/80 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 focus:border-cyan-500 focus:outline-none text-xs text-white light:text-zinc-900 placeholder-zinc-500 light:placeholder-zinc-400"
              />
              <button
                type="submit"
                disabled={inviteSubmitting}
                className="px-3.5 py-1.5 rounded-lg bg-white light:bg-zinc-900 hover:bg-zinc-200 light:hover:bg-zinc-800 text-black light:text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{inviteSubmitting ? 'Sending...' : 'Invite'}</span>
              </button>
            </form>
          </div>

          <div className="text-[10px] text-zinc-500 light:text-zinc-600 font-mono">
            Org ID: <span className="text-zinc-400 light:text-zinc-600">{org?.org_id || 'org_technohmsit'}</span> · Admin: <span className="text-zinc-400 light:text-zinc-600">{org?.admin_email || currentUserEmail}</span>
            <span className="text-zinc-600"> · Members get 10 on-demand/week + 55 daily applications</span>
            <span className="text-cyan-400/80"> · Daily sweep {org?.daily_sweep_time || '06:00'} IST</span>
          </div>

          {/* Pending Invites List */}
          {invites.filter(inv => inv.status === 'pending').length > 0 && (
            <div className="pt-2 border-t border-zinc-900/80 light:border-zinc-200">
              <span className="text-[10px] font-mono text-zinc-400 light:text-zinc-600 uppercase tracking-wider">
                Pending Invitations ({invites.filter(inv => inv.status === 'pending').length})
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {invites
                  .filter(inv => inv.status === 'pending')
                  .map(inv => (
                    <div
                      key={inv.invite_id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-xs font-mono"
                    >
                      <Clock className="w-3 h-3 text-amber-400 light:text-amber-600" />
                      <span className="text-zinc-200 light:text-zinc-800">{inv.invited_email}</span>
                      <button
                        onClick={() => handleRevokeInvite(inv.invite_id, inv.invited_email)}
                        className="text-zinc-500 light:text-zinc-600 hover:text-rose-400 transition-colors ml-1"
                        title="Revoke Invite"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
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
                Manage candidate accounts, toggle automated sweep eligibility, or trigger live on-demand sweeps.
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

          {/* Members Table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-900 light:border-zinc-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/60 text-zinc-400 light:text-zinc-600 font-mono uppercase text-[10px] tracking-wider border-b border-zinc-900 light:border-zinc-200">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Role &amp; Plan</th>
                  <th className="py-3 px-4 text-center">Today's Apps</th>
                  <th className="py-3 px-4 text-center">On-Demand Usage</th>
                  <th className="py-3 px-4 text-center">Run Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500 light:text-zinc-600">
                      No organization members found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map(member => {
                    const isProcessing = actionLoadingId === member.user_id
                    const isEnabled = member.enabled_for_daily_run

                    return (
                      <tr key={member.user_id} className="hover:bg-zinc-900/30 transition-colors">
                        {/* Candidate Identity */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white light:text-zinc-900">
                            {member.name || member.user_id}
                          </div>
                          <div className="text-[11px] text-zinc-400 light:text-zinc-600 font-mono">
                            {member.email}
                          </div>
                          <div className="text-[10px] text-zinc-600 font-mono mt-0.5">
                            Joined {member.created_at ? new Date(member.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            {' · '}All-time {member.total_applied || 0} applies
                          </div>
                        </td>

                        {/* Role & Plan */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 light:bg-cyan-50 text-cyan-300 light:text-cyan-700 border border-cyan-800/50 light:border-cyan-300 font-semibold">
                              {member.enterprise_role === 'admin' ? 'Org Admin' : 'Org Member'}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${
                              member.plan === 'org_pro'
                                ? 'bg-amber-950/60 light:bg-amber-50 text-amber-300 light:text-amber-700 border-amber-700/60 light:border-amber-300'
                                : 'bg-zinc-900 light:bg-zinc-100 text-zinc-300 light:text-zinc-700 border-zinc-800 light:border-zinc-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${(member.plan_active ?? true) ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                              {member.plan_name}
                            </span>
                          </div>
                          {member.plan === 'org_pro' && member.plan_expires_at && (
                            <div className="text-[10px] text-zinc-500 light:text-zinc-600 font-mono mt-1">
                              valid till {new Date(member.plan_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          )}
                          {member.plan !== 'org_pro' && (
                            <div className="text-[10px] text-zinc-600 font-mono mt-1">
                              Org base plan · free
                            </div>
                          )}
                        </td>

                        {/* Today's Applications */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`font-mono font-bold ${member.applied_today >= 55 ? 'text-amber-400 light:text-amber-600' : 'text-cyan-300 light:text-cyan-700'}`}>
                            {member.applied_today}
                          </span>
                          <span className="text-zinc-600 font-mono"> / 55 max</span>
                          <div className="text-[10px] text-zinc-600 font-mono mt-0.5">
                            Week {member.applied_this_week || 0} · Month {member.applied_this_month || 0}
                          </div>
                        </td>

                        {/* On-Demand Usage */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono text-cyan-300 light:text-cyan-700 font-semibold">
                            {member.on_demand_runs_used}
                          </span>
                          <span className="text-zinc-600 font-mono"> / {member.on_demand_quota || 10} week</span>
                        </td>

                        {/* Automated Run Status (Active or Paused) */}
                        <td className="py-3.5 px-4 text-center">
                          {isEnabled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 light:bg-emerald-50 border border-emerald-800/60 light:border-emerald-300 text-emerald-300 light:text-emerald-700 text-[10px] font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active Runs
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/60 light:bg-rose-50 border border-rose-800/60 text-rose-300 light:text-rose-600 text-[10px] font-mono">
                              <Pause className="w-2.5 h-2.5 text-rose-400 light:text-rose-600" />
                              Paused
                            </span>
                          )}
                          <div className="text-[10px] text-zinc-600 font-mono mt-1">
                            Last active {member.last_applied_at ? new Date(member.last_applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                          </div>
                          {member.sweep_eligible === false ? (
                            <div className="text-[10px] font-mono mt-1 text-amber-300 light:text-amber-700" title={(member.sweep_blockers || []).join('; ')}>
                              ⚠️ Not queued: {(member.sweep_blockers || ['blocked'])[0]}
                            </div>
                          ) : (
                            <div className="text-[10px] font-mono mt-1 text-emerald-400/80">
                              ✓ In daily sweep
                            </div>
                          )}
                        </td>

                        {/* Action Buttons: Enable/Disable + Trigger On-Demand */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Toggle Enable/Disable Button */}
                            <button
                              onClick={() => handleToggleMember(member)}
                              disabled={isProcessing}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                                isEnabled
                                  ? 'bg-zinc-900 light:bg-zinc-100 hover:bg-rose-950/50 border-zinc-800 light:border-zinc-200 hover:border-rose-700/60 text-zinc-300 light:text-zinc-700 hover:text-rose-300'
                                  : 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-800/60 light:border-emerald-300 text-emerald-300 light:text-emerald-700'
                              }`}
                              title={isEnabled ? 'Pause candidate from automated daily runs' : 'Enable candidate for automated daily runs'}
                            >
                              {isEnabled ? (
                                <>
                                  <Pause className="w-3 h-3 text-rose-400 light:text-rose-600" />
                                  <span>Pause Daily Run</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3 text-emerald-400 light:text-emerald-600" />
                                  <span>Resume Daily Run</span>
                                </>
                              )}
                            </button>

                            {/* View Live Log Button */}
                            <button
                              onClick={() => handleOpenLiveLog(member)}
                              className="px-2 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-sky-300 hover:text-white light:hover:text-zinc-900 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                              title="View real-time execution stream and bot logs"
                            >
                              <Activity className="w-3 h-3 text-sky-400" />
                              <span>Live Log</span>
                            </button>

                            {/* On-Demand Sweep Button — blocked with live status while member has an active task */}
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
                                  ? 'Sweep is RUNNING live right now — open Live Log to watch. Button unlocks when it finishes.'
                                  : `Sweep queued at position #${member.active_task.queue_position ?? '?'} — starts automatically in order. Button unlocks when it finishes.`}
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
                                disabled={isProcessing || !isEnabled || org?.status === 'disabled'}
                                className="px-2.5 py-1 rounded-lg bg-cyan-950/60 light:bg-cyan-50 hover:bg-cyan-900/60 border border-cyan-800/60 light:border-cyan-300 text-cyan-300 light:text-cyan-700 hover:text-white light:hover:text-zinc-900 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
                                title={
                                  org?.status === 'disabled'
                                    ? 'Org is disabled by Super Admin — all runs are blocked'
                                    : `Dispatch instant on-demand sweep (${member.applied_today || 0}/55 used today — run tops up the rest from newly posted jobs)`
                                }
                              >
                                <Zap className="w-3 h-3 text-cyan-400 light:text-cyan-600" />
                                <span>On-Demand</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
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
    </div>
  )
}
