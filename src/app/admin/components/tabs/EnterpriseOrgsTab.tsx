'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Users,
  ShieldCheck,
  Plus,
  RefreshCw,
  ExternalLink,
  Zap,
  Mail,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Sparkles,
  Power,
  PowerOff,
  ChevronDown,
  ChevronUp,
  UserPlus,
  UserMinus,
  UserCheck,
  Loader2,
  Crown,
  ToggleLeft,
  ToggleRight,
  X
} from 'lucide-react'

interface EnterpriseOrg {
  org_id: string
  name: string
  admin_email: string
  admin_name?: string
  status?: string
  member_count: number
  total_applied: number
  today_applied: number
  created_at: string
  created_by?: string
}

interface OrgMember {
  user_id: string
  email: string
  name: string
  role: string
  enterprise_role: string
  enterprise_status: string
  is_org_admin_only: boolean
  enabled_for_daily_run: boolean
  plan: string
  applied_today: number
  applied_total: number
}

interface EnterpriseOrgsTabProps {
  enterpriseOrgs: EnterpriseOrg[]
  loadingOrgs: boolean
  fetchEnterpriseOrgs: () => Promise<void>
  getAdminHeaders: () => Record<string, string>
}

export default function EnterpriseOrgsTab({
  enterpriseOrgs,
  loadingOrgs,
  fetchEnterpriseOrgs,
  getAdminHeaders
}: EnterpriseOrgsTabProps) {
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [seeding, setSeeding] = useState(false)

  // Create org form
  const [newOrgName, setNewOrgName] = useState('')
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminName, setNewAdminName] = useState('')
  const [newDailyLimit, setNewDailyLimit] = useState(55)
  const [newOnDemandQuota, setNewOnDemandQuota] = useState(10)

  // Per-org expanded state
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null)
  const [orgMembers, setOrgMembers] = useState<Record<string, OrgMember[]>>({})
  const [loadingMembersFor, setLoadingMembersFor] = useState<string | null>(null)

  // Assign Admin modal
  const [assignAdminModal, setAssignAdminModal] = useState<EnterpriseOrg | null>(null)
  const [assignAdminEmail, setAssignAdminEmail] = useState('')
  const [assigningAdmin, setAssigningAdmin] = useState(false)

  // Add member
  const [addMemberOrgId, setAddMemberOrgId] = useState<string | null>(null)
  const [addMemberEmail, setAddMemberEmail] = useState('')
  const [addingMember, setAddingMember] = useState(false)

  // Action loading tracker
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const msg = (type: 'success' | 'error', text: string) => setStatusMessage({ type, text })

  // ─── Load org members ────────────────────────────────────────────────
  const loadOrgMembers = async (orgId: string) => {
    setLoadingMembersFor(orgId)
    try {
      const res = await fetch(`/api/admin/enterprise-orgs/members?org_id=${encodeURIComponent(orgId)}`, {
        headers: getAdminHeaders()
      })
      const data = await res.json()
      if (res.ok) {
        setOrgMembers(prev => ({ ...prev, [orgId]: data.members || [] }))
      } else {
        msg('error', data.detail || 'Failed to load members.')
      }
    } catch (e: any) {
      msg('error', e.message || 'Network error.')
    } finally {
      setLoadingMembersFor(null)
    }
  }

  const toggleExpand = (orgId: string) => {
    if (expandedOrgId === orgId) {
      setExpandedOrgId(null)
    } else {
      setExpandedOrgId(orgId)
      if (!orgMembers[orgId]) loadOrgMembers(orgId)
    }
  }

  // ─── Create org ──────────────────────────────────────────────────────
  const handleSeedPrimaryOrg = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/enterprise-admin/setup', { method: 'POST', headers: getAdminHeaders() })
      const data = await res.json()
      if (res.ok) {
        msg('success', 'Primary Technohm SIT Org synchronized successfully.')
        await fetchEnterpriseOrgs()
      } else {
        msg('error', data.detail || 'Failed to sync primary org.')
      }
    } catch (e: any) { msg('error', e.message) }
    finally { setSeeding(false) }
  }

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgName.trim() || !newAdminEmail.trim()) {
      msg('error', 'Organization name and admin email are required.')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/enterprise-orgs', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          name: newOrgName.trim(),
          admin_email: newAdminEmail.trim().toLowerCase(),
          admin_name: newAdminName.trim() || undefined,
          daily_limit_per_user: Math.min(55, Number(newDailyLimit) || 55),
          weekly_on_demand_quota: Number(newOnDemandQuota) || 10
        })
      })
      const data = await res.json()
      if (res.ok) {
        msg('success', `Organisation '${newOrgName}' created successfully.`)
        setShowCreateModal(false)
        setNewOrgName(''); setNewAdminEmail(''); setNewAdminName('')
        await fetchEnterpriseOrgs()
      } else {
        msg('error', data.detail || 'Failed to create organization.')
      }
    } catch (e: any) { msg('error', e.message) }
    finally { setCreating(false) }
  }

  // ─── Delete org ──────────────────────────────────────────────────────
  const handleDeleteOrg = async (orgId: string, orgName: string) => {
    if (!confirm(`Delete "${orgName}" (${orgId})? All members will be unlinked. This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/enterprise-orgs?org_id=${encodeURIComponent(orgId)}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      })
      const data = await res.json()
      if (res.ok) {
        msg('success', `Organisation '${orgName}' deleted successfully.`)
        await fetchEnterpriseOrgs()
      } else {
        msg('error', data.detail || 'Failed to delete.')
      }
    } catch (e: any) { msg('error', e.message) }
  }

  // ─── Toggle org status ───────────────────────────────────────────────
  const handleToggleOrgStatus = async (org: EnterpriseOrg) => {
    const newStatus = org.status === 'disabled' ? 'active' : 'disabled'
    const action = newStatus === 'disabled' ? 'disable' : 're-enable'
    if (!confirm(`${action === 'disable' ? 'DISABLE' : 'Enable'} organisation "${org.name}"?\n\n${newStatus === 'disabled' ? 'All daily and on-demand runs for EVERY member in this org will be BLOCKED immediately.' : 'All enabled members will resume normal daily and on-demand runs.'}`)) return

    setActionLoadingId(org.org_id + '_status')
    try {
      const res = await fetch('/api/admin/enterprise-orgs', {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify({ org_id: org.org_id, status: newStatus })
      })
      const data = await res.json()
      if (res.ok) {
        msg('success', `Organisation "${org.name}" is now ${newStatus}.`)
        await fetchEnterpriseOrgs()
      } else {
        msg('error', data.detail || 'Failed to update org status.')
      }
    } catch (e: any) { msg('error', e.message) }
    finally { setActionLoadingId(null) }
  }

  // ─── Assign Admin ────────────────────────────────────────────────────
  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignAdminModal || !assignAdminEmail.trim()) return
    setAssigningAdmin(true)
    try {
      const res = await fetch('/api/admin/enterprise-orgs/assign-admin', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ org_id: assignAdminModal.org_id, email: assignAdminEmail.trim().toLowerCase() })
      })
      const data = await res.json()
      if (res.ok) {
        msg('success', data.message || 'Admin assigned successfully.')
        setAssignAdminModal(null)
        setAssignAdminEmail('')
        await fetchEnterpriseOrgs()
      } else {
        msg('error', data.detail || 'Failed to assign admin.')
      }
    } catch (e: any) { msg('error', e.message) }
    finally { setAssigningAdmin(false) }
  }

  // ─── Invite member (invite-only; joins on candidate Accept) ──────────
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addMemberOrgId || !addMemberEmail.trim()) return
    setAddingMember(true)
    try {
      const res = await fetch('/api/admin/enterprise-orgs/members', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ org_id: addMemberOrgId, email: addMemberEmail.trim().toLowerCase() })
      })
      const data = await res.json()
      if (res.ok) {
        msg('success', data.message || 'Member added successfully.')
        setAddMemberEmail('')
        setAddMemberOrgId(null)
        await loadOrgMembers(addMemberOrgId)
        await fetchEnterpriseOrgs()
      } else {
        msg('error', data.detail || 'Failed to send invite.')
      }
    } catch (e: any) { msg('error', e.message) }
    finally { setAddingMember(false) }
  }

  // ─── Toggle member ───────────────────────────────────────────────────
  const handleToggleMember = async (orgId: string, member: OrgMember) => {
    setActionLoadingId(member.user_id)
    try {
      const res = await fetch('/api/admin/enterprise-orgs/members', {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify({ org_id: orgId, user_id: member.user_id, enabled: !member.enabled_for_daily_run })
      })
      const data = await res.json()
      if (res.ok) {
        setOrgMembers(prev => ({
          ...prev,
          [orgId]: (prev[orgId] || []).map(m =>
            m.user_id === member.user_id
              ? { ...m, enabled_for_daily_run: !m.enabled_for_daily_run, enterprise_status: !m.enabled_for_daily_run ? 'active' : 'disabled' }
              : m
          )
        }))
      } else {
        msg('error', data.detail || 'Failed to update member.')
      }
    } catch (e: any) { msg('error', e.message) }
    finally { setActionLoadingId(null) }
  }

  // ─── Remove member ───────────────────────────────────────────────────
  const handleRemoveMember = async (orgId: string, member: OrgMember) => {
    if (!confirm(`Remove ${member.name || member.email} from this org? They'll revert to a free trial user.`)) return
    setActionLoadingId(member.user_id + '_remove')
    try {
      const res = await fetch(`/api/admin/enterprise-orgs/members?org_id=${encodeURIComponent(orgId)}&user_id=${encodeURIComponent(member.user_id)}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      })
      const data = await res.json()
      if (res.ok) {
        msg('success', `${member.name || member.email} removed from org.`)
        setOrgMembers(prev => ({
          ...prev,
          [orgId]: (prev[orgId] || []).filter(m => m.user_id !== member.user_id)
        }))
        await fetchEnterpriseOrgs()
      } else {
        msg('error', data.detail || 'Failed to remove member.')
      }
    } catch (e: any) { msg('error', e.message) }
    finally { setActionLoadingId(null) }
  }

  const totalMembers = enterpriseOrgs.reduce((acc, o) => acc + (o.member_count || 0), 0)
  const totalApplied = enterpriseOrgs.reduce((acc, o) => acc + (o.total_applied || 0), 0)
  const todayApplied = enterpriseOrgs.reduce((acc, o) => acc + (o.today_applied || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-black light:from-indigo-50 light:via-white light:to-white border border-indigo-500/20 light:border-indigo-300 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white light:text-zinc-900 flex items-center gap-2">
              Enterprise Organizations
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Super Admin</span>
            </h2>
          </div>
          <p className="text-xs text-zinc-400 light:text-zinc-600 max-w-xl">
            Create, disable, or delete enterprise orgs. Assign admins, manage members, and control access.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/enterprise-admin" target="_blank" className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white light:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer">
            <ExternalLink className="w-3.5 h-3.5" />
            Open Portal
          </Link>
          <button type="button" onClick={handleSeedPrimaryOrg} disabled={seeding}
            className="px-3 py-2 rounded-xl bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
            <Sparkles className={`w-3.5 h-3.5 text-amber-400 light:text-amber-600 ${seeding ? 'animate-spin' : ''}`} />
            {seeding ? 'Syncing...' : 'Sync Primary Org'}
          </button>
          <button type="button" onClick={() => setShowCreateModal(true)}
            className="px-3 py-2 rounded-xl bg-zinc-800 light:bg-zinc-200 hover:bg-zinc-700 border border-zinc-700 light:border-zinc-300 text-white light:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
            <Plus className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" />
            New Organization
          </button>
          <button type="button" onClick={fetchEnterpriseOrgs} disabled={loadingOrgs}
            className="p-2 rounded-xl bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 transition-colors cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loadingOrgs ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {statusMessage && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 light:border-emerald-300 text-emerald-300 light:text-emerald-700'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300 light:text-rose-600'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 text-emerald-400 light:text-emerald-600 shrink-0" />
              : <AlertCircle className="w-4 h-4 text-rose-400 light:text-rose-600 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button type="button" onClick={() => setStatusMessage(null)} className="text-zinc-500 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 cursor-pointer ml-4">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Orgs', value: enterpriseOrgs.length, sub: 'Multi-tenant cohorts', icon: <Building2 className="w-3.5 h-3.5 text-indigo-400" />, color: 'text-white light:text-zinc-900' },
          { label: 'Enterprise Members', value: totalMembers, sub: 'Across all orgs', icon: <Users className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />, color: 'text-cyan-300 light:text-cyan-700' },
          { label: "Today's Runs", value: todayApplied, sub: '55 max/user/day', icon: <Zap className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" />, color: 'text-amber-300 light:text-amber-700' },
          { label: 'Total Applied', value: totalApplied, sub: 'All-time submissions', icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" />, color: 'text-emerald-300 light:text-emerald-700' },
        ].map(card => (
          <div key={card.label} className="p-4 rounded-xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 flex flex-col justify-between">
            <div className="text-zinc-500 light:text-zinc-600 text-[11px] font-medium uppercase tracking-wider flex items-center justify-between">
              <span>{card.label}</span>{card.icon}
            </div>
            <div className={`text-2xl font-bold font-mono mt-2 ${card.color}`}>{card.value}</div>
            <div className="text-[10px] text-zinc-500 light:text-zinc-600 mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Orgs List */}
      <div className="rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-800 light:border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white light:text-zinc-900 uppercase tracking-wider">Provisioned Organizations ({enterpriseOrgs.length})</h3>
          </div>
          <span className="text-[11px] text-zinc-500 light:text-zinc-600">Expand to manage members · Click actions to control access</span>
        </div>

        {loadingOrgs ? (
          <div className="py-12 text-center text-zinc-400 light:text-zinc-600">
            <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
            Loading organizations...
          </div>
        ) : enterpriseOrgs.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 light:text-zinc-600">
            <Building2 className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
            <p className="font-semibold text-zinc-400 light:text-zinc-600">No organizations yet.</p>
            <p className="text-[11px] mt-1 mb-4">Click below to initialize the primary org.</p>
            <button type="button" onClick={handleSeedPrimaryOrg} disabled={seeding}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white light:text-zinc-900 text-xs font-semibold cursor-pointer shadow-md inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 light:text-amber-700" />
              {seeding ? 'Syncing...' : 'Initialize Primary Org'}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800 light:divide-zinc-200/50">
            {enterpriseOrgs.map((org) => {
              const isDisabled = org.status === 'disabled'
              const isExpanded = expandedOrgId === org.org_id
              const members = orgMembers[org.org_id] || []
              const loadingThis = loadingMembersFor === org.org_id

              return (
                <div key={org.org_id} className={isDisabled ? 'bg-rose-950/10' : ''}>
                  {/* Org Row */}
                  <div className="flex flex-wrap items-center gap-3 py-4 px-4 hover:bg-zinc-900/30 light:hover:bg-zinc-50 transition-colors">
                    {/* Name & ID */}
                    <div className="flex items-center gap-2.5 min-w-[180px] flex-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${isDisabled ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 light:text-rose-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white light:text-zinc-900 text-xs flex items-center gap-1.5 flex-wrap">
                          <span>{org.name}</span>
                          {org.org_id === 'org_technohmsit' && (
                            <span className="px-1.5 rounded text-[9px] font-mono uppercase bg-amber-500/20 text-amber-300 light:text-amber-700 border border-amber-500/30 light:border-amber-300">Primary</span>
                          )}
                          {isDisabled && (
                            <span className="px-1.5 rounded text-[9px] font-mono uppercase bg-rose-500/20 text-rose-300 light:text-rose-600 border border-rose-500/30">DISABLED</span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 light:text-zinc-600 mt-0.5">{org.org_id}</div>
                      </div>
                    </div>

                    {/* Admin */}
                    <div className="min-w-[150px]">
                      <div className="font-semibold text-zinc-200 light:text-zinc-800 text-xs">{org.admin_name || org.admin_email.split('@')[0]}</div>
                      <div className="text-[11px] text-indigo-400">{org.admin_email}</div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs font-mono text-zinc-300 light:text-zinc-700">
                      <div className="text-center">
                        <div className="font-bold text-cyan-300 light:text-cyan-700">{org.member_count}</div>
                        <div className="text-[10px] text-zinc-500 light:text-zinc-600">members</div>
                      </div>
                      <div className="text-center">
                        <span className="text-emerald-400 light:text-emerald-600 font-bold">{org.today_applied}</span>
                        <span className="text-zinc-600 mx-1">/</span>
                        <span className="text-zinc-300 light:text-zinc-700">{org.total_applied}</span>
                        <div className="text-[10px] text-zinc-500 light:text-zinc-600">today/total</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">
                      {/* Expand members */}
                      <button type="button" onClick={() => toggleExpand(org.org_id)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Manage members">
                        <Users className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
                        <span>Members</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {/* Assign Admin */}
                      <button type="button" onClick={() => { setAssignAdminModal(org); setAssignAdminEmail('') }}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Assign existing user as admin">
                        <Crown className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" />
                        <span className="hidden sm:inline">Assign Admin</span>
                      </button>

                      {/* Open Portal */}
                      <Link href={`/enterprise-admin?org_id=${encodeURIComponent(org.org_id)}`} target="_blank"
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer">
                        <ExternalLink className="w-3 h-3" />
                        <span className="hidden sm:inline">Portal</span>
                      </Link>

                      {/* Enable / Disable Toggle */}
                      <button type="button"
                        onClick={() => handleToggleOrgStatus(org)}
                        disabled={actionLoadingId === org.org_id + '_status'}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                          isDisabled
                            ? 'bg-emerald-950/30 hover:bg-emerald-950/50 border-emerald-800/50 text-emerald-300 light:text-emerald-700 hover:text-emerald-200'
                            : 'bg-zinc-900 light:bg-zinc-100 hover:bg-rose-950/30 border-zinc-700 light:border-zinc-300 hover:border-rose-500/40 text-zinc-300 light:text-zinc-700 hover:text-rose-300'
                        }`}
                        title={isDisabled ? 'Re-enable this org' : 'Disable this org (blocks ALL runs)'}
                      >
                        {actionLoadingId === org.org_id + '_status'
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : isDisabled
                            ? <Power className="w-3.5 h-3.5" />
                            : <PowerOff className="w-3.5 h-3.5" />
                        }
                        <span className="hidden sm:inline">{isDisabled ? 'Enable' : 'Disable'}</span>
                      </button>

                      {/* Delete */}
                      {org.org_id !== 'org_technohmsit' && (
                        <button type="button" onClick={() => handleDeleteOrg(org.org_id, org.name)}
                          className="p-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-rose-950/40 border border-zinc-800 light:border-zinc-200 hover:border-rose-500/40 text-zinc-400 light:text-zinc-600 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Organization">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Disabled org warning banner */}
                  {isDisabled && (
                    <div className="mx-4 mb-3 p-3 rounded-xl bg-rose-950/40 light:bg-rose-50 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300 light:text-rose-600">
                      <PowerOff className="w-3.5 h-3.5 shrink-0 text-rose-400 light:text-rose-600" />
                      <span><strong>Org is DISABLED</strong> — All daily and on-demand runs are completely blocked for every member of this organization.</span>
                    </div>
                  )}

                  {/* Expanded Members Panel */}
                  {isExpanded && (
                    <div className="mx-4 mb-4 rounded-xl bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 overflow-hidden">
                      <div className="p-3 border-b border-zinc-800 light:border-zinc-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
                          <span className="text-xs font-bold text-white light:text-zinc-900">Members of {org.name}</span>
                          <span className="text-[10px] text-zinc-500 light:text-zinc-600 font-mono">({members.length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => loadOrgMembers(org.org_id)} disabled={loadingThis}
                            className="p-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 cursor-pointer transition-colors">
                            <RefreshCw className={`w-3 h-3 ${loadingThis ? 'animate-spin' : ''}`} />
                          </button>
                          <button type="button" onClick={() => setAddMemberOrgId(addMemberOrgId === org.org_id ? null : org.org_id)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white light:text-zinc-900 text-[11px] font-semibold flex items-center gap-1 cursor-pointer">
                            <UserPlus className="w-3 h-3" />
                            Invite Member
                          </button>
                        </div>
                      </div>

                      {/* Invite member form — invite only; user joins after accepting in their dashboard */}
                      {addMemberOrgId === org.org_id && (
                        <form onSubmit={handleAddMember} className="p-3 border-b border-zinc-800 light:border-zinc-200 flex items-center gap-2 bg-zinc-900/50 light:bg-zinc-100">
                          <Mail className="w-4 h-4 text-zinc-500 light:text-zinc-600 shrink-0" />
                          <input
                            type="email"
                            value={addMemberEmail}
                            onChange={e => setAddMemberEmail(e.target.value)}
                            placeholder="existing.user@email.com — they must accept the invite"
                            required
                            className="flex-1 bg-black light:bg-white border border-zinc-700 light:border-zinc-300 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 outline-none"
                          />
                          <button type="submit" disabled={addingMember}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white light:text-zinc-900 text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-60">
                            {addingMember ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                            Invite
                          </button>
                          <button type="button" onClick={() => { setAddMemberOrgId(null); setAddMemberEmail('') }}
                            className="p-1.5 rounded-lg bg-zinc-800 light:bg-zinc-200 hover:bg-zinc-700 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 cursor-pointer">
                            <X className="w-3 h-3" />
                          </button>
                        </form>
                      )}

                      {/* Member list */}
                      {loadingThis ? (
                        <div className="py-6 text-center text-zinc-500 light:text-zinc-600 text-xs flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Loading members...
                        </div>
                      ) : members.length === 0 ? (
                        <div className="py-6 text-center text-zinc-500 light:text-zinc-600 text-xs">
                          No members in this organization yet.
                        </div>
                      ) : (
                        <div className="divide-y divide-zinc-800 light:divide-zinc-200/50">
                          {members.map(member => {
                            const isRemoving = actionLoadingId === member.user_id + '_remove'
                            const isToggling = actionLoadingId === member.user_id
                            return (
                              <div key={member.user_id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900/30 light:hover:bg-zinc-100 transition-colors">
                                {/* Avatar */}
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  member.enterprise_role === 'admin' ? 'bg-amber-500/20 text-amber-300 light:text-amber-700 border border-amber-500/30 light:border-amber-300' : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                                }`}>
                                  {(member.name || member.email || '?')[0].toUpperCase()}
                                </div>

                                {/* Name + email */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white light:text-zinc-900 truncate">
                                    <span>{member.name || member.user_id}</span>
                                    {member.enterprise_role === 'admin' && (
                                      <Crown className="w-3 h-3 text-amber-400 light:text-amber-600 shrink-0" />
                                    )}
                                    {member.is_org_admin_only && (
                                      <span className="text-[9px] px-1 rounded bg-zinc-800 light:bg-zinc-200 text-zinc-400 light:text-zinc-600 font-mono">admin only</span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-zinc-500 light:text-zinc-600 truncate">{member.email}</div>
                                </div>

                                {/* Stats */}
                                <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-zinc-400 light:text-zinc-600 shrink-0">
                                  <span>{member.applied_today} today</span>
                                  <span>·</span>
                                  <span>{member.applied_total} total</span>
                                </div>

                                {/* Status badge */}
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase font-mono shrink-0 ${
                                  member.enterprise_status === 'disabled' ? 'bg-rose-500/20 text-rose-300 light:text-rose-600 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-400 light:text-emerald-600 border border-emerald-500/30 light:border-emerald-300'
                                }`}>
                                  {member.enterprise_status || 'active'}
                                </span>

                                {/* Toggle enabled */}
                                {!member.is_org_admin_only && (
                                  <button type="button"
                                    onClick={() => handleToggleMember(org.org_id, member)}
                                    disabled={isToggling}
                                    title={member.enabled_for_daily_run ? 'Disable daily runs' : 'Enable daily runs'}
                                    className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                                      member.enabled_for_daily_run
                                        ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-400 light:text-emerald-600 hover:bg-rose-950/30 hover:border-rose-500/40 hover:text-rose-400'
                                        : 'bg-zinc-900 light:bg-zinc-100 border-zinc-700 light:border-zinc-300 text-zinc-500 light:text-zinc-600 hover:bg-emerald-950/30 hover:border-emerald-800/50 hover:text-emerald-400'
                                    }`}
                                  >
                                    {isToggling ? <Loader2 className="w-3 h-3 animate-spin" /> : member.enabled_for_daily_run ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                                  </button>
                                )}

                                {/* Remove from org */}
                                <button type="button"
                                  onClick={() => handleRemoveMember(org.org_id, member)}
                                  disabled={isRemoving}
                                  title="Remove from org"
                                  className="p-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-rose-950/30 border border-zinc-800 light:border-zinc-200 hover:border-rose-500/40 text-zinc-500 light:text-zinc-600 hover:text-rose-400 cursor-pointer transition-colors">
                                  {isRemoving ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserMinus className="w-3 h-3" />}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── Create Org Modal ──────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 light:bg-white/85 backdrop-blur-sm">
          <div className="bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 light:border-zinc-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white light:text-zinc-900">Create Enterprise Organization</h3>
                  <p className="text-[11px] text-zinc-400 light:text-zinc-600">Provision a new organization cohort</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-zinc-500 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 cursor-pointer p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-300 light:text-zinc-700 font-semibold mb-1">Organization Name *</label>
                <input type="text" required placeholder="e.g. Apex Global Staffing" value={newOrgName}
                  onChange={e => setNewOrgName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-white light:text-zinc-900 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-zinc-300 light:text-zinc-700 font-semibold mb-1">Enterprise Admin Email *</label>
                <input type="email" required placeholder="admin@example.com" value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-white light:text-zinc-900 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500" />
                <p className="text-[10px] text-zinc-500 light:text-zinc-600 mt-1">Must be a registered JobFlux user. They get access to /enterprise-admin.</p>
              </div>
              <div>
                <label className="block text-zinc-300 light:text-zinc-700 font-semibold mb-1">Admin Display Name</label>
                <input type="text" placeholder="Optional" value={newAdminName}
                  onChange={e => setNewAdminName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-white light:text-zinc-900 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-zinc-400 light:text-zinc-600 text-[11px] mb-1">Daily Limit / Member</label>
                  <input type="number" max={55} min={1} value={newDailyLimit} onChange={e => setNewDailyLimit(Math.min(55, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-white light:text-zinc-900 font-mono focus:outline-none focus:border-indigo-500" />
                  <span className="text-[9px] text-zinc-500 light:text-zinc-600">Max 55</span>
                </div>
                <div>
                  <label className="block text-zinc-400 light:text-zinc-600 text-[11px] mb-1">Weekly On-Demand</label>
                  <input type="number" min={1} value={newOnDemandQuota} onChange={e => setNewOnDemandQuota(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-white light:text-zinc-900 font-mono focus:outline-none focus:border-indigo-500" />
                  <span className="text-[9px] text-zinc-500 light:text-zinc-600">Default 10/wk</span>
                </div>
              </div>
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800 light:border-zinc-200">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-300 light:text-zinc-700 font-semibold cursor-pointer">Cancel</button>
                <button type="submit" disabled={creating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white light:text-zinc-900 font-semibold flex items-center gap-1.5 shadow-lg cursor-pointer disabled:opacity-60">
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  {creating ? 'Creating...' : 'Create Org'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Assign Admin Modal ────────────────────────────────────────── */}
      {assignAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 light:bg-white/85 backdrop-blur-sm">
          <div className="bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 light:border-zinc-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 light:border-amber-300 flex items-center justify-center text-amber-400 light:text-amber-600">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white light:text-zinc-900">Assign Enterprise Admin</h3>
                  <p className="text-[11px] text-zinc-400 light:text-zinc-600">{assignAdminModal.name}</p>
                </div>
              </div>
              <button type="button" onClick={() => setAssignAdminModal(null)} className="text-zinc-500 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 light:text-zinc-600 leading-relaxed">
              Enter the email of an <strong className="text-white light:text-zinc-900">existing</strong> registered JobFlux user. They will be promoted to <strong className="text-amber-300 light:text-amber-700">Enterprise Admin</strong> for this org and can access the Enterprise Admin Portal.
            </p>

            <form onSubmit={handleAssignAdmin} className="space-y-3">
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 light:text-zinc-600 absolute left-3 top-2.5" />
                <input type="email" required value={assignAdminEmail}
                  onChange={e => setAssignAdminEmail(e.target.value)}
                  placeholder="existing.user@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-white light:text-zinc-900 text-sm placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none focus:border-amber-500" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button type="button" onClick={() => setAssignAdminModal(null)}
                  className="flex-1 py-2 rounded-xl bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-300 light:text-zinc-700 font-semibold text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={assigningAdmin}
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white light:text-zinc-900 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60">
                  {assigningAdmin ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                  {assigningAdmin ? 'Assigning...' : 'Assign Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
