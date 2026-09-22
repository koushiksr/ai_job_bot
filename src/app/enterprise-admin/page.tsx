'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
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
  applied_today: number
  applied_this_week: number
  applied_this_month: number
  total_applied: number
  on_demand_runs_used: number
  on_demand_quota: number
  daily_application_limit: number
  last_applied_at: string | null
  created_at: string | null
}

interface OrgInfo {
  org_id: string
  name: string
  admin_email: string
  admin_name: string
  status: string
  daily_limit_per_user: number
  weekly_on_demand_quota: number
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

  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'x-user-id': currentUserId || 'koushiksrmedala',
      'x-user-email': currentUserEmail || 'koushiksrmedala@gmail.com'
    }
  }

  const loadAllPortalData = async (uid = currentUserId, email = currentUserEmail) => {
    setLoading(true)
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
      if (res.ok) {
        setFeedback({
          type: 'success',
          text: `🚀 Live on-demand sweep dispatched for ${member.name || member.email}! Position #${data.queue_position} in line.`
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
          text: `🎉 Invitation sent to ${cleanEmail}! When they log in, an Enterprise acceptance banner will appear on their dashboard.`
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
        setFeedback({ type: 'success', text: `✅ Organisation renamed to "${trimmedName}" successfully!` })
      } else {
        setFeedback({ type: 'error', text: data.detail || 'Failed to update org name.' })
      }
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message || 'Network error updating org name.' })
    } finally {
      setOrgNameSaving(false)
    }
  }

  // Filter members by search
  const filteredMembers = members.filter(m =>
    (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.user_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Ambient Cyber Aurora Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/3 w-[600px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 border border-indigo-400/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                  {org?.name || 'Technohm SIT Org'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 font-semibold uppercase">
                  Enterprise Portal
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Admin: {org?.admin_email || currentUserEmail}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
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
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
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
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : feedback.type === 'error'
                  ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  : 'bg-indigo-950/40 border-indigo-800/60 text-indigo-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-zinc-400 hover:text-white text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── Org Disabled Warning ───────────────────────────────── */}
        {org && org.status === 'disabled' && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border-2 border-rose-500/50 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-rose-300 mb-0.5">⛔ Organisation Temporarily Disabled</p>
              <p className="text-xs text-rose-400/80 leading-relaxed">
                Your organisation <strong className="text-rose-300">{org.name}</strong> has been disabled by the Super Admin.
                All automated daily sweeps and on-demand runs are <strong>completely blocked</strong> for every member until re-enabled.
                Please contact support if you believe this is an error.
              </p>
            </div>
          </div>
        )}

        {/* Aggregate KPI Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
              <span>Total Members</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {metrics?.total_members || members.length}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              {metrics?.active_scheduled_members || 0} active in daily sweeps
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
              <span>Today's Apps</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-400">
              {metrics?.applied_today || 0}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              Max 55 jobs / user / day
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
              <span>This Week</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-purple-300">
              {metrics?.applied_this_week || 0}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              Rolling 7-day volume
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md space-y-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
              <span>Total Applications</span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
              {metrics?.total_applied || 0}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              All-time org submissions
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md space-y-1 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
              <span>On-Demand Runs</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-300">
              {metrics?.on_demand_runs_used_this_week || 0}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              Max 3/day · 10/week per member
            </div>
          </div>
        </section>

        {/* Organisation Settings Card */}
        <section className="p-5 sm:p-6 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>Organisation Settings</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Customise your organisation name visible to all members.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {editingOrgName ? (
              <>
                <input
                  type="text"
                  value={orgNameInput}
                  onChange={e => setOrgNameInput(e.target.value)}
                  placeholder="Enter organisation name..."
                  className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-indigo-700 focus:border-indigo-500 focus:outline-none text-xs sm:text-sm text-white placeholder-zinc-500"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveOrgName(); if (e.key === 'Escape') setEditingOrgName(false) }}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveOrgName}
                    disabled={orgNameSaving}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 disabled:opacity-60 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {orgNameSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingOrgName(false)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-sm text-white font-medium">
                  {org?.name || 'Unnamed Organisation'}
                </div>
                <button
                  onClick={() => { setOrgNameInput(org?.name || ''); setEditingOrgName(true) }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  Rename Organisation
                </button>
              </>
            )}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            Org ID: <span className="text-zinc-400">{org?.org_id || 'org_technohmsit'}</span> · Admin: <span className="text-zinc-400">{org?.admin_email || currentUserEmail}</span>
          </div>
        </section>

        {/* Invite Member Section */}
        <section className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-indigo-950/30 via-zinc-950/80 to-purple-950/30 border border-indigo-900/40 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Invite Candidate to Organization</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Invited candidates automatically receive Enterprise perks (10 weekly on-demand runs and 55 daily job applications).
              </p>
            </div>
          </div>

          <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row items-center gap-2.5">
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="candidate@company.com or candidate@gmail.com"
              className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 focus:border-indigo-500 focus:outline-none text-xs sm:text-sm text-white placeholder-zinc-500"
            />
            <button
              type="submit"
              disabled={inviteSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-60 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{inviteSubmitting ? 'Sending Invite...' : 'Send Enterprise Invite'}</span>
            </button>
          </form>

          {/* Pending Invites List */}
          {invites.filter(inv => inv.status === 'pending').length > 0 && (
            <div className="pt-2 border-t border-zinc-900/80">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                Pending Invitations ({invites.filter(inv => inv.status === 'pending').length})
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {invites
                  .filter(inv => inv.status === 'pending')
                  .map(inv => (
                    <div
                      key={inv.invite_id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono"
                    >
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span className="text-zinc-200">{inv.invited_email}</span>
                      <button
                        onClick={() => handleRevokeInvite(inv.invite_id, inv.invited_email)}
                        className="text-zinc-500 hover:text-rose-400 transition-colors ml-1"
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
        <section className="p-5 sm:p-6 rounded-2xl bg-zinc-950/70 border border-zinc-900 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Organization Candidates &amp; Automation Controls</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Manage candidate accounts, toggle automated sweep eligibility, or trigger live on-demand sweeps.
              </p>
            </div>

            <div className="w-full sm:w-64 relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search member or email..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder-zinc-500"
              />
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/60 text-zinc-400 font-mono uppercase text-[10px] tracking-wider border-b border-zinc-900">
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
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
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
                          <div className="font-semibold text-white">
                            {member.name || member.user_id}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono">
                            {member.email}
                          </div>
                        </td>

                        {/* Role & Plan */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 font-semibold">
                              {member.enterprise_role === 'admin' ? 'Org Admin' : 'Org Member'}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                              {member.plan_name}
                            </span>
                          </div>
                        </td>

                        {/* Today's Applications */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`font-mono font-bold ${member.applied_today >= 55 ? 'text-amber-400' : 'text-cyan-300'}`}>
                            {member.applied_today}
                          </span>
                          <span className="text-zinc-600 font-mono"> / 55 max</span>
                        </td>

                        {/* On-Demand Usage */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono text-purple-300 font-semibold">
                            {member.on_demand_runs_used}
                          </span>
                          <span className="text-zinc-600 font-mono"> / 10 week</span>
                        </td>

                        {/* Automated Run Status (Active or Paused) */}
                        <td className="py-3.5 px-4 text-center">
                          {isEnabled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[10px] font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active Runs
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-800/60 text-rose-300 text-[10px] font-mono">
                              <Pause className="w-2.5 h-2.5 text-rose-400" />
                              Paused
                            </span>
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
                                  ? 'bg-zinc-900 hover:bg-rose-950/50 border-zinc-800 hover:border-rose-700/60 text-zinc-300 hover:text-rose-300'
                                  : 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-800/60 text-emerald-300'
                              }`}
                              title={isEnabled ? 'Pause candidate from automated daily runs' : 'Enable candidate for automated daily runs'}
                            >
                              {isEnabled ? (
                                <>
                                  <Pause className="w-3 h-3 text-rose-400" />
                                  <span>Pause Runs</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3 text-emerald-400" />
                                  <span>Enable Runs</span>
                                </>
                              )}
                            </button>

                            {/* View Live Log Button */}
                            <button
                              onClick={() => handleOpenLiveLog(member)}
                              className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sky-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                              title="View real-time execution stream and bot logs"
                            >
                              <Activity className="w-3 h-3 text-sky-400" />
                              <span>Live Log</span>
                            </button>

                            {/* Trigger On-Demand Sweep Button */}
                            <button
                              onClick={() => handleTriggerOnDemand(member)}
                              disabled={isProcessing || !isEnabled || org?.status === 'disabled'}
                              className="px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 text-indigo-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
                              title={org?.status === 'disabled' ? 'Org is disabled by Super Admin — all runs are blocked' : 'Dispatch instant on-demand application sweep'}
                            >
                              <Zap className="w-3 h-3 text-indigo-400" />
                              <span>Trigger Sweep</span>
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
        </section>
      </main>

      {/* Live Execution Stream Modal */}
      {selectedLiveLog && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLiveLog(null)
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
          >
            {/* Modal Header */}
            <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span>Execution Stream: {selectedLiveLog.member_name} ({selectedLiveLog.user_id})</span>
                  {selectedLiveLog.status === 'running' && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                      <Radio className="w-2.5 h-2.5 text-emerald-400" />
                      LIVE STREAMING
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  {selectedLiveLog.task_id ? `Task ID: ${selectedLiveLog.task_id} · ` : ''}Status:{' '}
                  <span className={`uppercase font-bold ${
                    selectedLiveLog.status === 'running'
                      ? 'text-emerald-400'
                      : selectedLiveLog.status === 'failed' || selectedLiveLog.status === 'cancelled'
                      ? 'text-rose-400'
                      : 'text-sky-300'
                  }`}>
                    {selectedLiveLog.status}
                  </span>
                  {selectedLiveLog.summary && (
                    <span className="ml-2 text-zinc-400">· {selectedLiveLog.summary}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {liveLogLoading && <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />}
                <button
                  type="button"
                  onClick={() => setSelectedLiveLog(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Logs Body */}
            <div className="p-4 bg-black overflow-y-auto flex-1 font-mono text-xs space-y-1 select-text scroll-smooth max-h-[55vh]">
              {selectedLiveLog.logs.map((line, i) => (
                <div
                  key={i}
                  className={`leading-relaxed ${
                    line.includes('❌') || line.includes('Error') || line.includes('Failed')
                      ? 'text-rose-400 font-medium'
                      : line.includes('🛑') || line.includes('⚠️')
                      ? 'text-amber-400'
                      : line.includes('🎉') || line.includes('APPLIED!') || line.includes('COMPLETED')
                      ? 'text-emerald-400 font-semibold'
                      : line.includes('🏢') || line.includes('🚀') || line.includes('Company resolved')
                      ? 'text-sky-300'
                      : 'text-zinc-300'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs">
              <div className="text-zinc-400">
                Total Captured Lines: <strong className="text-white">{selectedLiveLog.logs.length}</strong>
                {selectedLiveLog.status === 'running' && (
                  <span className="ml-2 text-zinc-500 text-[11px]">(Auto-refreshing every 2.5s)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {(selectedLiveLog.status === 'running' || selectedLiveLog.status === 'pending') && selectedLiveLog.task_id && (
                  <button
                    type="button"
                    disabled={haltingTask}
                    onClick={() => handleHaltTask(selectedLiveLog.task_id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-semibold cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    <span>{haltingTask ? 'Stopping...' : 'Stop / Halt Task'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedLiveLog(null)}
                  className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold cursor-pointer"
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
