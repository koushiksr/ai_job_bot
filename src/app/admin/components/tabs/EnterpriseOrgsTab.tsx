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
  ChevronDown,
  ChevronUp,
  Zap,
  Mail,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Settings,
  Sparkles
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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form State
  const [newOrgName, setNewOrgName] = useState('')
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminName, setNewAdminName] = useState('')
  const [newDailyLimit, setNewDailyLimit] = useState(55)
  const [newOnDemandQuota, setNewOnDemandQuota] = useState(10)

  // Quick Seed / Sync Primary Org
  const handleSeedPrimaryOrg = async () => {
    setSeeding(true)
    setStatusMessage(null)
    try {
      const res = await fetch('/api/enterprise-admin/setup', {
        method: 'POST',
        headers: getAdminHeaders()
      })
      const data = await res.json()
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Primary Technohm SIT Org successfully synchronized and active.' })
        await fetchEnterpriseOrgs()
      } else {
        setStatusMessage({ type: 'error', text: data.detail || 'Failed to sync primary org.' })
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Network error syncing primary org.' })
    } finally {
      setSeeding(false)
    }
  }

  // Create New Enterprise Org
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgName.trim() || !newAdminEmail.trim()) {
      setStatusMessage({ type: 'error', text: 'Organization name and admin email are required.' })
      return
    }

    setCreating(true)
    setStatusMessage(null)
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
        setStatusMessage({ type: 'success', text: `Organization '${newOrgName}' successfully created.` })
        setShowCreateModal(false)
        setNewOrgName('')
        setNewAdminEmail('')
        setNewAdminName('')
        await fetchEnterpriseOrgs()
      } else {
        setStatusMessage({ type: 'error', text: data.detail || 'Failed to create organization.' })
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error creating organization.' })
    } finally {
      setCreating(false)
    }
  }

  // Delete Organization
  const handleDeleteOrg = async (orgId: string, orgName: string) => {
    if (!confirm(`Are you sure you want to delete organization "${orgName}" (${orgId})? Members will be unlinked from the org.`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/enterprise-orgs?org_id=${encodeURIComponent(orgId)}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      })
      const data = await res.json()
      if (res.ok) {
        setStatusMessage({ type: 'success', text: `Organization '${orgName}' deleted successfully.` })
        await fetchEnterpriseOrgs()
      } else {
        setStatusMessage({ type: 'error', text: data.detail || 'Failed to delete organization.' })
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error deleting organization.' })
    }
  }

  const totalMembers = enterpriseOrgs.reduce((acc, o) => acc + (o.member_count || 0), 0)
  const totalAppliedAcrossOrgs = enterpriseOrgs.reduce((acc, o) => acc + (o.total_applied || 0), 0)
  const todayAppliedAcrossOrgs = enterpriseOrgs.reduce((acc, o) => acc + (o.today_applied || 0), 0)

  return (
    <div className="space-y-6">
      {/* Top Banner & Telemetry Cards */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-black border border-indigo-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Enterprise Organizations Management
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Super Admin Access
              </span>
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Designate Enterprise Admins (e.g. <span className="text-indigo-300 font-mono">koushiksrmedala@gmail.com</span>), provision enterprise licensing cohorts, manage candidate quotas, and preview dedicated client portals.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/enterprise-admin"
            target="_blank"
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Enterprise Portal</span>
          </Link>
          <button
            type="button"
            onClick={handleSeedPrimaryOrg}
            disabled={seeding}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ensure Technohm SIT Org is seeded with Koushik as admin and Technohm SIT as member"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? 'Syncing...' : 'Sync Primary Org'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>New Organization</span>
          </button>
          <button
            type="button"
            onClick={() => fetchEnterpriseOrgs()}
            disabled={loadingOrgs}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh organizations"
          >
            <RefreshCw className={`w-4 h-4 ${loadingOrgs ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-zinc-500 hover:text-white text-xs cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#09090b] border border-zinc-800 flex flex-col justify-between">
          <div className="text-zinc-500 text-[11px] font-medium uppercase tracking-wider flex items-center justify-between">
            <span>Total Organizations</span>
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {enterpriseOrgs.length}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">Multi-tenant client cohorts</div>
        </div>

        <div className="p-4 rounded-xl bg-[#09090b] border border-zinc-800 flex flex-col justify-between">
          <div className="text-zinc-500 text-[11px] font-medium uppercase tracking-wider flex items-center justify-between">
            <span>Enterprise Members</span>
            <Users className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {totalMembers}
          </div>
          <div className="text-[10px] text-cyan-400/80 mt-1">Under managed orgs</div>
        </div>

        <div className="p-4 rounded-xl bg-[#09090b] border border-zinc-800 flex flex-col justify-between">
          <div className="text-zinc-500 text-[11px] font-medium uppercase tracking-wider flex items-center justify-between">
            <span>Today's Dispatches</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {todayAppliedAcrossOrgs}
          </div>
          <div className="text-[10px] text-amber-400/80 mt-1">55 daily max limit per user</div>
        </div>

        <div className="p-4 rounded-xl bg-[#09090b] border border-zinc-800 flex flex-col justify-between">
          <div className="text-zinc-500 text-[11px] font-medium uppercase tracking-wider flex items-center justify-between">
            <span>Total Applied Jobs</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {totalAppliedAcrossOrgs}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-1">Cumulative enterprise submissions</div>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="rounded-2xl bg-[#09090b] border border-zinc-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Provisioned Organizations ({enterpriseOrgs.length})
            </h3>
          </div>
          <span className="text-[11px] text-zinc-500">
            Click &quot;Open Portal&quot; to inspect an organization as Super Admin
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-4">Organization</th>
                <th className="py-3.5 px-4">Enterprise Admin</th>
                <th className="py-3.5 px-4 text-center">Members</th>
                <th className="py-3.5 px-4 text-center">Applied (Today / Total)</th>
                <th className="py-3.5 px-4 text-center">Quotas</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loadingOrgs ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
                    Loading enterprise organizations...
                  </td>
                </tr>
              ) : enterpriseOrgs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-zinc-700" />
                    <p className="font-semibold text-zinc-400">No Enterprise Organizations configured yet.</p>
                    <p className="text-[11px] text-zinc-500 mt-1 mb-4">Click below to initialize the primary Technohm SIT Org.</p>
                    <button
                      type="button"
                      onClick={handleSeedPrimaryOrg}
                      disabled={seeding}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-md inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{seeding ? 'Syncing...' : 'Initialize Technohm SIT Org'}</span>
                    </button>
                  </td>
                </tr>
              ) : (
                enterpriseOrgs.map((org) => (
                  <tr key={org.org_id} className="hover:bg-zinc-900/30 transition-colors">
                    {/* Organization Info */}
                    <td className="py-4 px-4 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-1.5">
                            <span>{org.name}</span>
                            {org.org_id === 'org_technohmsit' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Primary Org
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                            ID: {org.org_id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Admin Email */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-zinc-200">{org.admin_name || org.admin_email.split('@')[0]}</div>
                      <a
                        href={`mailto:${org.admin_email}`}
                        className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Mail className="w-3 h-3 text-zinc-500" />
                        <span>{org.admin_email}</span>
                      </a>
                    </td>

                    {/* Members Count */}
                    <td className="py-4 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {org.member_count} {org.member_count === 1 ? 'member' : 'members'}
                      </span>
                    </td>

                    {/* Applications Dispatched */}
                    <td className="py-4 px-4 text-center">
                      <div className="font-mono text-xs font-bold text-white">
                        <span className="text-emerald-400">{org.today_applied}</span>
                        <span className="text-zinc-600 mx-1">/</span>
                        <span className="text-zinc-300">{org.total_applied}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500">today / lifetime</div>
                    </td>

                    {/* Quotas */}
                    <td className="py-4 px-4 text-center font-mono text-[11px] text-zinc-300">
                      <div>55 daily max</div>
                      <div className="text-zinc-500 text-[10px]">10 on-demand / wk</div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          org.status === 'paused'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {org.status || 'active'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/enterprise-admin?org_id=${encodeURIComponent(org.org_id)}`}
                          target="_blank"
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Open dedicated organization portal"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open Portal</span>
                        </Link>
                        {org.org_id !== 'org_technohmsit' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteOrg(org.org_id, org.name)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-500/40 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Organization"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Enterprise Org */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Create Enterprise Organization</h3>
                  <p className="text-[11px] text-zinc-400">Provision a new organization cohort</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Staffing / SRM Placement Cell"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Enterprise Admin Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. koushiksrmedala@gmail.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  This user will be granted Enterprise Admin access to /enterprise-admin.
                </p>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Admin Contact Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Koushik S.R. Medala"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1">Daily Limit per Member</label>
                  <input
                    type="number"
                    max={55}
                    min={1}
                    value={newDailyLimit}
                    onChange={(e) => setNewDailyLimit(Math.min(55, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[9px] text-zinc-500">Hard capped at 55 max</span>
                </div>
                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1">Weekly On-Demand Quota</label>
                  <input
                    type="number"
                    min={1}
                    value={newOnDemandQuota}
                    onChange={(e) => setNewOnDemandQuota(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[9px] text-zinc-500">Default 10 sweeps / wk</span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{creating ? 'Creating...' : 'Create Organization'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
