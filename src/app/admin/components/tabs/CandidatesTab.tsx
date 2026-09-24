'use client'

import React from 'react'
import {
  Search,
  X,
  User,
  Filter,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Crown,
  Users,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Tag,
  ToggleRight,
  ToggleLeft,
  FileText,
  ExternalLink,
  Eye,
  Send,
  Edit,
  Trash2,
  Server,
  Zap,
  Cpu,
  Laptop,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Shield,
  ShieldAlert,
  Building2,
  MoreHorizontal,
  MoreVertical,
  RotateCcw,
  Check
} from 'lucide-react'
import { CandidateUser } from '../../types'

interface CandidatesTabProps {
  userSearch: string
  setUserSearch: (val: string) => void
  usersList: CandidateUser[]
  loadingUsers: boolean
  candidateStatusFilter: string
  setCandidateStatusFilter: (val: string) => void
  executionStatusFilter?: string
  setExecutionStatusFilter?: (val: string) => void
  showStatusGuide: boolean
  setShowStatusGuide: (val: boolean) => void
  candidatesTableCollapsed: boolean
  toggleCandidatesTable: () => void
  selectedCandidateId: string | null
  setSelectedCandidateId: (id: string | null) => void
  formatTimestamp: (ts: any) => string
  handleChangePlan: (userId: string, plan: string) => Promise<void>
  handleToggleVip: (userId: string, isVip: boolean) => Promise<void>
  handleToggleDaily: (userId: string, currentState: boolean) => Promise<void>
  handleInspectCandidate: (candidate: any) => void
  handleDeleteUser: (userId: string) => Promise<void>
  setEditingUser: (u: any) => void
  dispatchReportLoading: boolean
  onOpenDispatchReportForUser: (email: string) => void
  onTriggerOnDemand?: (userId: string, force: boolean) => Promise<void>
  actionProcessingId?: string | null
}

export default function CandidatesTab({
  userSearch,
  setUserSearch,
  usersList,
  loadingUsers,
  candidateStatusFilter,
  setCandidateStatusFilter,
  executionStatusFilter,
  setExecutionStatusFilter,
  showStatusGuide,
  setShowStatusGuide,
  candidatesTableCollapsed,
  toggleCandidatesTable,
  selectedCandidateId,
  setSelectedCandidateId,
  formatTimestamp,
  handleChangePlan,
  handleToggleVip,
  handleToggleDaily,
  handleInspectCandidate,
  handleDeleteUser,
  setEditingUser,
  dispatchReportLoading,
  onOpenDispatchReportForUser,
  onTriggerOnDemand,
  actionProcessingId
}: CandidatesTabProps) {
  // Execution status filter state
  const [internalExecFilter, setInternalExecFilter] = React.useState<string>(() => {
    try {
      return localStorage.getItem('admin_candidate_exec_filter') || 'all'
    } catch {
      return 'all'
    }
  })
  const activeExecFilter = executionStatusFilter ?? internalExecFilter
  const handleSetExecFilter = (val: string) => {
    if (setExecutionStatusFilter) {
      setExecutionStatusFilter(val)
    } else {
      setInternalExecFilter(val)
    }
    try {
      localStorage.setItem('admin_candidate_exec_filter', val)
    } catch {}
  }

  // Account Type Visibility filter: 'all' | 'candidates' | 'admins'
  const [accountTypeFilter, setAccountTypeFilter] = React.useState<'all' | 'candidates' | 'admins'>(() => {
    try {
      return (localStorage.getItem('admin_account_type_filter') as any) || 'all'
    } catch {
      return 'all'
    }
  })

  const handleSetAccountTypeFilter = (val: 'all' | 'candidates' | 'admins') => {
    setAccountTypeFilter(val)
    try {
      localStorage.setItem('admin_account_type_filter', val)
    } catch {}
  }

  // Sorting state with localStorage persistence
  type SortField = 'plan' | 'enabled' | 'today' | 'total' | 'execution' | 'name' | 'email' | 'last_login' | 'created_at'
  type SortOrder = 'asc' | 'desc'

  const [sortField, setSortField] = React.useState<SortField>(() => {
    try {
      return (localStorage.getItem('admin_candidate_sort_field') as SortField) || 'plan'
    } catch {
      return 'plan'
    }
  })

  const [sortOrder, setSortOrder] = React.useState<SortOrder>(() => {
    try {
      return (localStorage.getItem('admin_candidate_sort_order') as SortOrder) || 'desc'
    } catch {
      return 'desc'
    }
  })

  const handleSetSortField = (field: SortField) => {
    if (field === sortField) {
      const nextOrder = sortOrder === 'asc' ? 'desc' : 'asc'
      setSortOrder(nextOrder)
      try {
        localStorage.setItem('admin_candidate_sort_order', nextOrder)
      } catch {}
    } else {
      const defaultOrder: SortOrder = ['name', 'email'].includes(field) ? 'asc' : 'desc'
      setSortField(field)
      setSortOrder(defaultOrder)
      try {
        localStorage.setItem('admin_candidate_sort_field', field)
        localStorage.setItem('admin_candidate_sort_order', defaultOrder)
      } catch {}
    }
  }

  const handleToggleSortOrder = () => {
    const nextOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    setSortOrder(nextOrder)
    try {
      localStorage.setItem('admin_candidate_sort_order', nextOrder)
    } catch {}
  }

  const handleResetSort = () => {
    setSortField('plan')
    setSortOrder('desc')
    try {
      localStorage.setItem('admin_candidate_sort_field', 'plan')
      localStorage.setItem('admin_candidate_sort_order', 'desc')
    } catch {}
  }

  // Filter menu popover state and click-outside handler
  const [showFilterMenu, setShowFilterMenu] = React.useState(false)
  const filterMenuRef = React.useRef<HTMLDivElement>(null)

  // Row action menu state
  const [openRowActionMenuId, setOpenRowActionMenuId] = React.useState<string | null>(null)
  const rowActionMenuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false)
      }
      if (rowActionMenuRef.current && !rowActionMenuRef.current.contains(event.target as Node)) {
        setOpenRowActionMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isFiltered = activeExecFilter !== 'all' || candidateStatusFilter !== 'all' || accountTypeFilter !== 'all' || userSearch.trim().length > 0 || sortField !== 'plan' || sortOrder !== 'desc'
  const activeFilterCount = (activeExecFilter !== 'all' ? 1 : 0) + (candidateStatusFilter !== 'all' ? 1 : 0) + (accountTypeFilter !== 'all' ? 1 : 0) + (sortField !== 'plan' || sortOrder !== 'desc' ? 1 : 0)

  const handleClearAllFilters = () => {
    handleSetExecFilter('all')
    setCandidateStatusFilter('all')
    handleSetAccountTypeFilter('all')
    try {
      localStorage.setItem('admin_candidate_status_filter', 'all')
      localStorage.setItem('admin_account_type_filter', 'all')
    } catch {}
    handleResetSort()
    setUserSearch('')
    try {
      localStorage.removeItem('admin_candidate_search')
    } catch {}
  }

  const getSortLabel = (field: SortField): string => {
    switch (field) {
      case 'plan': return 'Plan Tier (Elite → Pro → Starter → Trial → Free)'
      case 'enabled': return 'Auto-Apply (Enabled / Active First)'
      case 'today': return "Today's Applications (Highest First)"
      case 'total': return 'Lifetime Total Applied (Highest First)'
      case 'execution': return 'Bot Execution Status'
      case 'name': return 'Candidate Name (A → Z)'
      case 'email': return 'Portal Email (A → Z)'
      case 'last_login': return 'Last Login / Activity (Recent First)'
      case 'created_at': return 'Signup Date (Newest First)'
      default: return field
    }
  }

  const renderSortIcon = (field: SortField) => {
    if (sortField === field) {
      return sortOrder === 'asc' ? (
        <ArrowUp className="w-3 h-3 text-sky-400 shrink-0" />
      ) : (
        <ArrowDown className="w-3 h-3 text-sky-400 shrink-0" />
      )
    }
    return <ArrowUpDown className="w-2.5 h-2.5 text-zinc-600 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
  }

  // Super Admin & Org Admin Identification
  const isSuperAdminUser = (u: CandidateUser) => Boolean(
    u.is_admin ||
    u.role === 'admin' ||
    u.user_id === 'technohmsit' ||
    u.email?.toLowerCase() === 'technohmsit@gmail.com'
  )

  const isOrgAdminUser = (u: CandidateUser) => Boolean(
    !isSuperAdminUser(u) && (
      u.is_org_admin ||
      u.role === 'enterprise_admin' ||
      u.enterprise_role === 'admin' ||
      u.is_org_admin_only ||
      u.email?.toLowerCase() === 'ranganathat32@gmail.com' ||
      u.email?.toLowerCase() === 'koushiksrmedala@gmail.com'
    )
  )

  const isAdministrativeUser = (u: CandidateUser) => isSuperAdminUser(u) || isOrgAdminUser(u)

  // Weight calculators for clean, structured ranking
  const getPlanWeight = (u: CandidateUser): number => {
    if (isSuperAdminUser(u)) return 999
    if (isOrgAdminUser(u)) return 950
    const isVip = Boolean(u.is_vip || u.plan === 'vip' || u.plan_expiry_status === 'vip_lifetime')
    const p = (u.plan || u.plan_name || '').toLowerCase()

    if (p.includes('enterprise') || p.includes('org_pro')) return 120
    if (p.includes('elite') || p.includes('professional')) return isVip ? 115 : 100
    if (isVip) return 95
    if (p.includes('pro')) return 80
    if (p.includes('starter')) return 50
    if (p.includes('trial')) return 20
    return 0
  }

  const getExecutionWeight = (u: CandidateUser): number => {
    if (isAdministrativeUser(u)) return 0
    const status = u.execution_summary?.status || (u.current_execution?.status === 'applying' ? 'applying' : '')
    if (status === 'applying' || u.current_execution?.status === 'applying') return 60
    if (status === 'in_queue' || u.execution_summary?.is_in_queue) return 50
    if (status === 'applied_today' || (u.applied_today && u.applied_today > 0)) return 40
    if (status === 'not_applied_today') return 30
    if (status === 'payment_required') return 20
    if (u.enabled_for_daily_run === false) return 10
    return 0
  }

  // Pre-calculate real-time execution & plan counts for filters
  const countApplying = usersList.filter(u => u.execution_summary?.status === 'applying' || u.current_execution?.status === 'applying').length
  const countAppliedToday = usersList.filter(u => u.execution_summary?.status === 'applied_today' || u.execution_summary?.is_applied_today || (u.applied_today && u.applied_today > 0)).length
  const countInQueue = usersList.filter(u => u.execution_summary?.status === 'in_queue' || u.execution_summary?.is_in_queue).length
  const countEnabled = usersList.filter(u => !isAdministrativeUser(u) && u.enabled_for_daily_run !== false).length
  const countDisabled = usersList.filter(u => !isAdministrativeUser(u) && u.enabled_for_daily_run === false).length
  const countPaymentRequired = usersList.filter(u => {
    if (isAdministrativeUser(u)) return false
    return u.execution_summary?.status === 'payment_required' || u.plan_expiry_status === 'expired' || u.plan_expiry_status === 'no_plan'
  }).length
  const countNotAppliedToday = usersList.filter(u => {
    if (isAdministrativeUser(u)) return false
    const st = u.execution_summary?.status
    if (st) return st === 'not_applied_today'
    return u.current_execution?.status !== 'applying' && (!u.applied_today || u.applied_today === 0) && u.enabled_for_daily_run !== false && u.plan_expiry_status !== 'expired' && u.plan_expiry_status !== 'no_plan'
  }).length

  const countCandidatesOnly = usersList.filter(u => !isAdministrativeUser(u)).length
  const countAdminsOnly = usersList.filter(u => isAdministrativeUser(u)).length

  const countElite = usersList.filter(u => (u.plan || '').toLowerCase().includes('elite') || (u.plan || '').toLowerCase().includes('professional')).length
  const countPro = usersList.filter(u => (u.plan || '').toLowerCase() === 'pro').length
  const countStarter = usersList.filter(u => (u.plan || '').toLowerCase() === 'starter').length
  const countTrial = usersList.filter(u => (u.plan || '').toLowerCase() === 'trial').length

  // Filter users by search, execution status, and plan status
  const filteredUsers = usersList.filter(u => {
    // 0. Account Type Filter (All / Candidates Only / Admins Only)
    if (accountTypeFilter === 'candidates' && isAdministrativeUser(u)) return false
    if (accountTypeFilter === 'admins' && !isAdministrativeUser(u)) return false

    // 1. Search Query Match
    const q = userSearch.toLowerCase().trim()
    const matchesSearch = !q || (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.user_id && u.user_id.toLowerCase().includes(q)) ||
      (u.org_name && u.org_name.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.execution_summary?.device && u.execution_summary.device.toLowerCase().includes(q)) ||
      (u.execution_summary?.hostname && u.execution_summary.hostname.toLowerCase().includes(q)) ||
      (u.execution_summary?.device_brand && u.execution_summary.device_brand.toLowerCase().includes(q)) ||
      (u.execution_summary?.hardware_model && u.execution_summary.hardware_model.toLowerCase().includes(q)) ||
      (u.execution_summary?.mac_address && u.execution_summary.mac_address.toLowerCase().includes(q)) ||
      (u.current_execution?.hostname && u.current_execution.hostname.toLowerCase().includes(q)) ||
      (u.last_execution?.hostname && u.last_execution.hostname.toLowerCase().includes(q)) ||
      (u.last_execution?.device_brand && u.last_execution.device_brand.toLowerCase().includes(q)) ||
      (u.last_execution?.mac_address && u.last_execution.mac_address.toLowerCase().includes(q))
    )
    if (!matchesSearch) return false

    // 2. Execution Status Filter
    if (activeExecFilter !== 'all') {
      if (isAdministrativeUser(u)) return false
      const summary = u.execution_summary
      const isApp = summary?.is_applying || u.current_execution?.status === 'applying'
      const isDone = summary?.is_applied_today || (u.applied_today && u.applied_today > 0)
      const isQueued = summary?.is_in_queue || summary?.status === 'in_queue'

      if (activeExecFilter === 'applying' && !isApp) return false
      if (activeExecFilter === 'applied_today' && (!isDone || isApp)) return false
      if (activeExecFilter === 'in_queue' && !isQueued) return false
      if (activeExecFilter === 'enabled' && u.enabled_for_daily_run === false) return false
      if (activeExecFilter === 'disabled' && u.enabled_for_daily_run !== false) return false
      if (activeExecFilter === 'payment_required' && u.plan_expiry_status !== 'expired' && u.plan_expiry_status !== 'no_plan' && summary?.status !== 'payment_required') return false
      if (activeExecFilter === 'not_applied_today') {
        if (isApp || isDone || isQueued || u.enabled_for_daily_run === false || u.plan_expiry_status === 'expired' || u.plan_expiry_status === 'no_plan') {
          return false
        }
      }
    }

    // 3. Plan & Expiry Status Filter
    if (candidateStatusFilter === 'all') return true
    if (candidateStatusFilter === 'active') return u.plan_expiry_status === 'active'
    if (candidateStatusFilter === 'elite') return (u.plan || '').toLowerCase().includes('elite') || (u.plan || '').toLowerCase().includes('professional')
    if (candidateStatusFilter === 'pro') return (u.plan || '').toLowerCase() === 'pro'
    if (candidateStatusFilter === 'starter') return (u.plan || '').toLowerCase() === 'starter'
    if (candidateStatusFilter === 'trial') return (u.plan || '').toLowerCase() === 'trial'
    if (candidateStatusFilter === 'expiring') return u.plan_expiry_status === 'expiring_soon_2d' || u.plan_expiry_status === 'expiring_soon_1d'
    if (candidateStatusFilter === 'urgent') return u.plan_expiry_status === 'expiring_soon_1d'
    if (candidateStatusFilter === 'expired') return u.plan_expiry_status === 'expired'
    if (candidateStatusFilter === 'vip') return u.is_vip || u.plan === 'vip' || u.plan_expiry_status === 'vip_lifetime'
    if (candidateStatusFilter === 'no_plan') return u.plan_expiry_status === 'no_plan' || u.plan === 'none' || u.plan === 'no_plan'

    return true
  })

  // 4. Sort Candidates Multi-Attribute Comparator
  const sortedUsers = React.useMemo(() => {
    const list = [...filteredUsers]
    list.sort((a, b) => {
      let diff = 0
      switch (sortField) {
        case 'plan':
          diff = getPlanWeight(a) - getPlanWeight(b)
          break
        case 'enabled': {
          const aEn = a.enabled_for_daily_run !== false ? 1 : 0
          const bEn = b.enabled_for_daily_run !== false ? 1 : 0
          diff = aEn - bEn
          break
        }
        case 'today': {
          const aToday = Number(a.applied_today || a.stats?.today || 0)
          const bToday = Number(b.applied_today || b.stats?.today || 0)
          diff = aToday - bToday
          break
        }
        case 'total': {
          const aTotal = Number(a.total_applied || a.applied_count || a.stats?.total_applied || 0)
          const bTotal = Number(b.total_applied || b.applied_count || b.stats?.total_applied || 0)
          diff = aTotal - bTotal
          break
        }
        case 'execution':
          diff = getExecutionWeight(a) - getExecutionWeight(b)
          break
        case 'name': {
          const aName = (a.name || a.user_id || '').toLowerCase()
          const bName = (b.name || b.user_id || '').toLowerCase()
          diff = aName.localeCompare(bName)
          break
        }
        case 'email': {
          const aEmail = (a.email || '').toLowerCase()
          const bEmail = (b.email || '').toLowerCase()
          diff = aEmail.localeCompare(bEmail)
          break
        }
        case 'last_login': {
          const aDate = a.last_login_at ? new Date(a.last_login_at).getTime() : 0
          const bDate = b.last_login_at ? new Date(b.last_login_at).getTime() : 0
          diff = aDate - bDate
          break
        }
        case 'created_at': {
          const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
          const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
          diff = aDate - bDate
          break
        }
        default:
          diff = 0
      }

      if (diff !== 0) {
        return sortOrder === 'asc' ? diff : -diff
      }

      // Tie-breaker: Name A-Z
      const aName = (a.name || a.user_id || '').toLowerCase()
      const bName = (b.name || b.user_id || '').toLowerCase()
      return aName.localeCompare(bName)
    })
    return list
  }, [filteredUsers, sortField, sortOrder])

  return (
    <div className="space-y-4">
      {/* Search & Status Filters Header */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 space-y-3 shadow-xl relative">
        {/* Main Toolbar Row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Left: Search input + Quick Filter Tabs */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
              <Search className="w-4 h-4 text-zinc-500 light:text-zinc-600 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search candidates, servers..."
                value={userSearch}
                onChange={e => {
                  const val = e.target.value
                  setUserSearch(val)
                  try {
                    localStorage.setItem('admin_candidate_search', val)
                  } catch {}
                }}
                className="w-full bg-zinc-950 light:bg-zinc-50 border border-zinc-800 light:border-zinc-300 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white light:text-zinc-900 placeholder-zinc-500 light:placeholder-zinc-400 focus:outline-none focus:border-sky-500 light:focus:border-sky-600"
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
                  className="absolute right-2.5 top-2 text-zinc-500 hover:text-white light:hover:text-zinc-900 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick 1-Click Status Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
              {[
                {
                  id: 'tab_candidates',
                  label: 'Candidates',
                  count: countCandidatesOnly,
                  isActive: accountTypeFilter === 'candidates' && activeExecFilter === 'all',
                  onClick: () => {
                    handleSetAccountTypeFilter('candidates')
                    handleSetExecFilter('all')
                  }
                },
                {
                  id: 'tab_live',
                  label: 'Live',
                  count: countApplying,
                  color: 'text-sky-400 font-medium',
                  pulse: true,
                  isActive: activeExecFilter === 'applying',
                  onClick: () => {
                    handleSetExecFilter('applying')
                    if (accountTypeFilter === 'admins') handleSetAccountTypeFilter('all')
                  }
                },
                {
                  id: 'tab_done',
                  label: 'Done Today',
                  count: countAppliedToday,
                  color: 'text-emerald-400 light:text-emerald-700 font-medium',
                  isActive: activeExecFilter === 'applied_today',
                  onClick: () => {
                    handleSetExecFilter('applied_today')
                    if (accountTypeFilter === 'admins') handleSetAccountTypeFilter('all')
                  }
                },
                {
                  id: 'tab_needs_attention',
                  label: 'Needs Attention',
                  count: countPaymentRequired + countNotAppliedToday,
                  color: 'text-amber-400 light:text-amber-700 font-medium',
                  isActive: activeExecFilter === 'not_applied_today',
                  onClick: () => {
                    handleSetExecFilter('not_applied_today')
                    if (accountTypeFilter === 'admins') handleSetAccountTypeFilter('all')
                  }
                },
                {
                  id: 'tab_admins',
                  label: 'Admins & Orgs',
                  count: countAdminsOnly,
                  color: 'text-indigo-400 light:text-indigo-600 font-medium',
                  isActive: accountTypeFilter === 'admins',
                  onClick: () => {
                    handleSetAccountTypeFilter('admins')
                    handleSetExecFilter('all')
                  }
                },
                {
                  id: 'tab_all',
                  label: 'All',
                  count: usersList.length,
                  isActive: accountTypeFilter === 'all' && activeExecFilter === 'all',
                  onClick: () => {
                    handleSetAccountTypeFilter('all')
                    handleSetExecFilter('all')
                  }
                }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={tab.onClick}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    tab.isActive
                      ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 border border-zinc-700 light:border-zinc-300 font-semibold shadow-sm'
                      : 'bg-zinc-950/60 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 border border-zinc-900 light:border-zinc-200'
                  }`}
                >
                  {tab.pulse && tab.count > 0 && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping mr-0.5" />}
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full bg-black/60 light:bg-white font-semibold ${tab.color || 'text-zinc-400 light:text-zinc-600'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Triple-Dot Filter Menu + Reset + Status Guide + Create Candidate */}
          <div className="flex items-center gap-2 shrink-0 justify-end" ref={filterMenuRef}>
            {/* TRIPLE-DOT FILTER & SORT MENU BUTTON */}
            <button
              type="button"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                showFilterMenu || activeFilterCount > 0
                  ? 'bg-zinc-800 light:bg-zinc-200 border-zinc-700 light:border-zinc-300 text-white light:text-zinc-900'
                  : 'bg-zinc-950 light:bg-zinc-100 border-zinc-800 light:border-zinc-300 text-zinc-300 light:text-zinc-700 hover:bg-zinc-900 light:hover:bg-zinc-200'
              }`}
              title="Open Filter & Sort Options Menu"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-semibold">Filters &amp; Sort</span>
              {activeFilterCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-zinc-700 light:bg-zinc-300 text-white light:text-zinc-900">
                  {activeFilterCount}
                </span>
              ) : (
                <MoreHorizontal className="w-3.5 h-3.5 text-zinc-500" />
              )}
            </button>

            {/* Quick Reset Button if filtered */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="p-1.5 rounded-xl bg-zinc-950 light:bg-zinc-100 hover:bg-zinc-900 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-300 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Reset all filters and sorting to defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Status Guide Toggle */}
            <button
              type="button"
              onClick={() => setShowStatusGuide(!showStatusGuide)}
              className="p-1.5 rounded-xl bg-zinc-950 light:bg-zinc-100 hover:bg-zinc-900 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-300 text-zinc-400 hover:text-zinc-200 light:hover:text-zinc-800 transition-colors cursor-pointer"
              title={showStatusGuide ? 'Hide Status Legend Guide' : 'Show Status Legend Guide'}
            >
              <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {/* Create Candidate Button */}
            <button
              type="button"
              onClick={() => setEditingUser({ isNew: true, user_id: '' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 light:bg-zinc-900 light:hover:bg-zinc-800 light:text-white font-semibold text-xs transition-all shadow-sm cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Create Candidate</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </div>

        {/* Active Filter Chips Bar (Shown when any filter is active) */}
        {isFiltered && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-zinc-900 light:border-zinc-200 text-[11px] font-mono">
            <span className="text-zinc-500 light:text-zinc-600">Active filters:</span>
            {accountTypeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 light:bg-zinc-100 text-zinc-300 light:text-zinc-700 border border-zinc-800 light:border-zinc-300">
                <span>Account: {accountTypeFilter === 'candidates' ? 'Candidates Only' : 'Admins & Orgs Only'}</span>
                <button type="button" onClick={() => handleSetAccountTypeFilter('all')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            {activeExecFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 light:bg-zinc-100 text-zinc-300 light:text-zinc-700 border border-zinc-800 light:border-zinc-300">
                <span>Bot: {activeExecFilter.replace(/_/g, ' ')}</span>
                <button type="button" onClick={() => handleSetExecFilter('all')} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            {candidateStatusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 light:bg-zinc-100 text-zinc-300 light:text-zinc-700 border border-zinc-800 light:border-zinc-300">
                <span>Plan: {candidateStatusFilter}</span>
                <button type="button" onClick={() => {
                  setCandidateStatusFilter('all')
                  try { localStorage.setItem('admin_candidate_status_filter', 'all') } catch {}
                }} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            {(sortField !== 'plan' || sortOrder !== 'desc') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 light:bg-zinc-100 text-zinc-300 light:text-zinc-700 border border-zinc-800 light:border-zinc-300">
                <span>Sort: {sortField} ({sortOrder})</span>
                <button type="button" onClick={handleResetSort} className="hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
              </span>
            )}
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-zinc-500 hover:text-rose-400 underline ml-1 cursor-pointer transition-colors text-[10px]"
            >
              Clear all
            </button>
          </div>
        )}

        {/* TRIPLE-DOT FILTER & SORT POPOVER MENU */}
        {showFilterMenu && (
          <div className="absolute top-full right-4 mt-2 w-[340px] sm:w-[500px] p-4 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 shadow-2xl z-50 space-y-4 animate-fadeIn">
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800 light:border-zinc-200">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
                <h4 className="text-xs font-bold text-white light:text-zinc-900 uppercase tracking-wider font-mono">
                  Filter &amp; Sort Candidates
                </h4>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 light:bg-zinc-200 text-zinc-300 light:text-zinc-700 border border-zinc-700 light:border-zinc-300 font-mono font-bold">
                    {activeFilterCount} active
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowFilterMenu(false)}
                className="text-zinc-400 hover:text-white light:hover:text-zinc-900 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Section 0: Account Type Visibility */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400 light:text-zinc-600 font-semibold uppercase flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-zinc-400" /> Account Visibility:
                </span>
                {accountTypeFilter !== 'all' && (
                  <button type="button" onClick={() => handleSetAccountTypeFilter('all')} className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono cursor-pointer">
                    Reset
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'candidates', label: 'Candidates Only', count: countCandidatesOnly, color: 'text-sky-400' },
                  { key: 'admins', label: 'Admins & Orgs', count: countAdminsOnly, color: 'text-indigo-400 light:text-indigo-600' },
                  { key: 'all', label: 'All Accounts', count: usersList.length, color: 'text-zinc-400' }
                ].map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => handleSetAccountTypeFilter(f.key as any)}
                    className={`p-1.5 rounded-lg text-[11px] font-mono transition-all text-left flex items-center justify-between cursor-pointer ${
                      accountTypeFilter === f.key
                        ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 border border-zinc-700 light:border-zinc-300 font-semibold shadow-sm'
                        : 'bg-zinc-950 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 border border-zinc-900 light:border-zinc-200'
                    }`}
                  >
                    <span className="truncate">{f.label}</span>
                    <span className={`text-[10px] font-bold shrink-0 ml-1 ${f.color || 'text-zinc-500'}`}>{f.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 1: Bot Execution Filter */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-900 light:border-zinc-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400 light:text-zinc-600 font-semibold uppercase flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-zinc-400" /> Bot Execution Status:
                </span>
                {activeExecFilter !== 'all' && (
                  <button type="button" onClick={() => handleSetExecFilter('all')} className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono cursor-pointer">
                    Reset
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { key: 'all', label: 'All Candidates', count: usersList.length },
                  { key: 'applying', label: 'Applying Live', count: countApplying, color: 'text-sky-400' },
                  { key: 'applied_today', label: 'Applied Today', count: countAppliedToday, color: 'text-emerald-400 light:text-emerald-700' },
                  { key: 'in_queue', label: 'In Queue', count: countInQueue, color: 'text-zinc-400' },
                  { key: 'enabled', label: 'Bot Active', count: countEnabled, color: 'text-zinc-300 light:text-zinc-700' },
                  { key: 'disabled', label: 'Bot Off', count: countDisabled, color: 'text-zinc-500' },
                  { key: 'not_applied_today', label: 'Not Applied', count: countNotAppliedToday, color: 'text-amber-400 light:text-amber-700' },
                  { key: 'payment_required', label: 'Payment Req.', count: countPaymentRequired, color: 'text-rose-400 light:text-rose-600' }
                ].map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => handleSetExecFilter(f.key)}
                    className={`p-1.5 rounded-lg text-[11px] font-mono transition-all text-left flex items-center justify-between cursor-pointer ${
                      activeExecFilter === f.key
                        ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 border border-zinc-700 light:border-zinc-300 font-semibold shadow-sm'
                        : 'bg-zinc-950 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 border border-zinc-900 light:border-zinc-200'
                    }`}
                  >
                    <span className="truncate">{f.label}</span>
                    <span className={`text-[10px] font-bold shrink-0 ml-1 ${f.color || 'text-zinc-500'}`}>{f.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Plan Tier & Validity Filter */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-900 light:border-zinc-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400 light:text-zinc-600 font-semibold uppercase flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-zinc-400" /> Plan &amp; Expiry Filter:
                </span>
                {candidateStatusFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      setCandidateStatusFilter('all')
                      try { localStorage.setItem('admin_candidate_status_filter', 'all') } catch {}
                    }}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  { key: 'all', label: 'All Plans', count: usersList.length },
                  { key: 'elite', label: 'Elite (90d)', count: countElite },
                  { key: 'pro', label: 'Pro (30d)', count: countPro },
                  { key: 'starter', label: 'Starter (30d)', count: countStarter },
                  { key: 'trial', label: 'Trial', count: countTrial },
                  { key: 'active', label: 'Active Plan', count: usersList.filter(u => u.plan_expiry_status === 'active').length, color: 'text-emerald-400 light:text-emerald-700' },
                  { key: 'expiring', label: 'Expiring 1-2d', count: usersList.filter(u => u.plan_expiry_status === 'expiring_soon_2d' || u.plan_expiry_status === 'expiring_soon_1d').length, color: 'text-amber-400 light:text-amber-700' },
                  { key: 'expired', label: 'Expired', count: usersList.filter(u => u.plan_expiry_status === 'expired').length, color: 'text-rose-400 light:text-rose-600' },
                  { key: 'vip', label: 'VIP Pass', count: usersList.filter(u => u.is_vip || u.plan === 'vip' || u.plan_expiry_status === 'vip_lifetime').length }
                ].map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => {
                      setCandidateStatusFilter(f.key)
                      try { localStorage.setItem('admin_candidate_status_filter', f.key) } catch {}
                    }}
                    className={`p-1.5 rounded-lg text-[11px] font-mono transition-all text-left flex items-center justify-between cursor-pointer ${
                      candidateStatusFilter === f.key
                        ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 border border-zinc-700 light:border-zinc-300 font-bold shadow-sm'
                        : 'bg-zinc-950 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 border border-zinc-900 light:border-zinc-200'
                    }`}
                  >
                    <span className="truncate">{f.label}</span>
                    <span className={`text-[10px] font-bold shrink-0 ml-1 ${f.color || 'text-zinc-500'}`}>{f.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 3: Sort Options */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-900 light:border-zinc-200">
              <span className="text-[11px] font-mono text-zinc-400 light:text-zinc-600 font-semibold uppercase flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" /> Sort Candidates By:
              </span>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Sort candidates by"
                  value={sortField}
                  onChange={e => handleSetSortField(e.target.value as any)}
                  className="flex-1 bg-zinc-950 light:bg-zinc-100 border border-zinc-800 light:border-zinc-300 text-white light:text-zinc-900 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-zinc-500 cursor-pointer"
                >
                  <option value="plan">Plan Tier (Highest First)</option>
                  <option value="today">Applications Today (Highest First)</option>
                  <option value="total">Lifetime Total Applied (Highest First)</option>
                  <option value="execution">Bot Execution Status (Applying Live First)</option>
                  <option value="enabled">Auto-Apply Active First</option>
                  <option value="name">Candidate Name (A → Z)</option>
                  <option value="email">Portal Email (A → Z)</option>
                  <option value="last_login">Recent Login First</option>
                  <option value="created_at">Date Added (Newest First)</option>
                </select>

                <button
                  type="button"
                  onClick={handleToggleSortOrder}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-950 light:bg-zinc-100 hover:bg-zinc-900 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-300 text-zinc-300 light:text-zinc-700 text-xs font-mono flex items-center gap-1 cursor-pointer"
                  title="Toggle Ascending / Descending"
                >
                  {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-zinc-300" /> : <ArrowDown className="w-3.5 h-3.5 text-zinc-300" />}
                  <span>{sortOrder.toUpperCase()}</span>
                </button>
              </div>
            </div>

            {/* Popover Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-900 light:border-zinc-200">
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-xs font-mono text-zinc-500 hover:text-rose-400 underline cursor-pointer"
              >
                Clear all filters
              </button>
              <button
                type="button"
                onClick={() => setShowFilterMenu(false)}
                className="px-3 py-1 rounded-lg bg-zinc-200 hover:bg-white text-zinc-900 light:bg-zinc-900 light:hover:bg-zinc-800 light:text-white text-xs font-semibold font-mono cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Expandable Status Legend Guide */}
        {showStatusGuide && (
          <div className="p-4 rounded-xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 text-xs space-y-2.5 animate-fadeIn shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white light:text-zinc-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-zinc-400" />
                <span>Candidate Plan Expiry Status &amp; Visual Indicator Guide</span>
              </span>
              <button
                type="button"
                onClick={() => setShowStatusGuide(false)}
                className="text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              <div className="p-2.5 rounded-lg bg-zinc-950 light:bg-zinc-50 border border-zinc-800 light:border-zinc-200 space-y-1">
                <div className="flex items-center gap-1.5 text-sky-400 font-semibold font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Applying Live (Server Identity)</span>
                </div>
                <p className="text-[11px] text-zinc-400 light:text-zinc-600">
                  Candidate actively claimed by a server machine (e.g. <span className="text-zinc-200 light:text-zinc-800 font-mono">macs-MacBook-Air.local</span>). Protected from duplicate execution across servers via atomic lock.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 light:bg-zinc-50 border border-zinc-800 light:border-zinc-200 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 light:text-emerald-700 font-semibold font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" />
                  <span>Applied Today (Completed)</span>
                </div>
                <p className="text-[11px] text-zinc-400 light:text-zinc-600">
                  Daily run successfully executed for today&apos;s IST cycle. Machine identity, PID, and completion timestamp are permanently saved.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 light:bg-zinc-50 border border-zinc-800 light:border-zinc-200 space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-400 font-semibold font-mono">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>In Queue / Scheduled</span>
                </div>
                <p className="text-[11px] text-zinc-400 light:text-zinc-600">
                  Pending in the automated queue, or waiting for the scheduled morning run (06:00 AM IST).
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 light:bg-white border border-emerald-900/40 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-300 light:text-emerald-700 font-bold font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" />
                  <span>Active Plan (Xd left)</span>
                </div>
                <p className="text-[11px] text-zinc-400 light:text-zinc-600">
                  Paid plan with &gt; 48 hours remaining. Protected from discount offers to avoid cannibalizing subscription value.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 light:bg-white border border-amber-800/40 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-300 light:text-amber-700 font-bold font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" />
                  <span>Expiring: 1-2d (36h left)</span>
                </div>
                <p className="text-[11px] text-zinc-400 light:text-zinc-600">
                  Plan expiring within 24–48 hours. Prime window to send retention renewal offers and automated reminders.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 light:bg-white border border-rose-800/50 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-300 light:text-rose-600 font-bold font-mono">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                  <span>Expiring: &lt;24h left (Red Pulse)</span>
                </div>
                <p className="text-[11px] text-zinc-400 light:text-zinc-600">
                  Urgent final 24-hour expiration countdown. Critical retention period before candidate&apos;s daily apply halts.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 light:bg-white border border-rose-900/60 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-400 light:text-rose-600 font-bold font-mono">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 light:text-rose-600" />
                  <span>Plan Expired</span>
                </div>
                <p className="text-[11px] text-zinc-400 light:text-zinc-600">
                  Validity ended. Candidate is paused and eligible for win-back discount offers and immediate reactivation.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 light:bg-white border border-amber-500/30 light:border-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-300 light:text-amber-700 font-bold font-mono">
                  <Crown className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" />
                  <span>VIP Pass (3 Months / 90d)</span>
                </div>
                <p className="text-[11px] text-zinc-400 light:text-zinc-600">
                  Candidate holds an active VIP access pass (90 days). Renewable upon completion.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-400 light:text-zinc-600 font-bold font-mono">
                  <Server className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" />
                  <span>Multi-Server Distributed Execution</span>
                </div>
                <p className="text-[11px] text-zinc-400 light:text-zinc-600">
                  Any server or device running backend workers records its unique machine name, worker ID, and OS platform.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Candidates Table */}
      <div className="rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 overflow-hidden shadow-xl">
        <div 
          onClick={toggleCandidatesTable}
          className="px-5 py-4 bg-zinc-950 light:bg-white hover:bg-zinc-900/60 light:hover:bg-zinc-50 border-b border-zinc-800 light:border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition-colors"
        >
          <div>
            <h4 className="text-sm font-bold text-white light:text-zinc-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Candidate Profiles Directory</span>
              <span className="text-[10px] font-mono text-zinc-400 light:text-zinc-600 bg-zinc-900 light:bg-zinc-100 px-2 py-0.5 rounded border border-zinc-800 light:border-zinc-200">
                {filteredUsers.length} profiles
              </span>
            </h4>
            <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
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
              className="px-2.5 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
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
            className="px-5 py-3 bg-zinc-900/30 light:bg-zinc-100 hover:bg-zinc-900/60 light:hover:bg-zinc-200 border-t border-zinc-800 light:border-zinc-200 flex items-center justify-between text-xs text-zinc-400 light:text-zinc-600 cursor-pointer transition-colors"
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
            <table className="w-full min-w-[880px] text-left text-xs text-zinc-300 light:text-zinc-700">
              <thead className="select-none">
                <tr className="bg-zinc-950 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 uppercase text-[10px] tracking-wider border-b border-zinc-800 light:border-zinc-200">
                  <th 
                    onClick={() => handleSetSortField('name')}
                    className="py-3.5 px-4 cursor-pointer hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900/60 light:hover:bg-zinc-200/70 transition-colors group min-w-[220px]"
                    title="Click to sort by Candidate Name (A → Z)"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span>Candidate &amp; Quota</span>
                        {renderSortIcon('name')}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSetSortField('today')
                        }}
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors flex items-center gap-1 cursor-pointer ${
                          sortField === 'today'
                            ? 'bg-sky-950/80 border-sky-500 text-sky-300 font-bold'
                            : 'bg-zinc-900/60 light:bg-zinc-200 border-zinc-800 light:border-zinc-300 text-zinc-500 hover:text-zinc-300'
                        }`}
                        title="Sort by Today's Applications"
                      >
                        <span>Today</span>
                        {renderSortIcon('today')}
                      </button>
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSetSortField('execution')}
                    className="py-3.5 px-4 cursor-pointer hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900/60 light:hover:bg-zinc-200/70 transition-colors group"
                    title="Click to sort by Bot Execution Status (Live Applying First)"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Bot &amp; Server</span>
                      {renderSortIcon('execution')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSetSortField('plan')}
                    className="py-3.5 px-4 cursor-pointer hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900/60 light:hover:bg-zinc-200/70 transition-colors group"
                    title="Click to sort by Plan Tier (Elite → Pro → Starter → Trial → Free)"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Plan &amp; Access</span>
                      {renderSortIcon('plan')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSetSortField('enabled')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900/60 light:hover:bg-zinc-200/70 transition-colors group"
                    title="Click to sort by Auto-Apply Status (Enabled / Active First)"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Auto-Apply</span>
                      {renderSortIcon('enabled')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSetSortField('last_login')}
                    className="py-3.5 px-4 cursor-pointer hover:text-white light:hover:text-zinc-900 hover:bg-zinc-900/60 light:hover:bg-zinc-200/70 transition-colors group"
                    title="Click to sort by recent activity (login / resume sync first)"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Activity</span>
                      {renderSortIcon('last_login')}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 light:divide-zinc-200">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400 light:text-zinc-500">
                      <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
                      Loading candidate profiles...
                    </td>
                  </tr>
                ) : sortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500 light:text-zinc-500">
                      No candidate profiles match your search query.
                    </td>
                  </tr>
                ) : (
                  sortedUsers.map((u, idx) => (
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
                          ? 'bg-indigo-950/40 light:bg-indigo-50/80 border-l-2 border-l-indigo-500 ring-1 ring-indigo-500/30'
                          : 'hover:bg-zinc-800/30 light:hover:bg-zinc-50'
                      }`}
                    >
                      <td className="py-3 px-3.5 font-bold text-white light:text-zinc-900">
                        <div className="flex flex-col gap-2 min-w-[210px] max-w-[280px]">
                          {/* User Identity */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-zinc-800 light:bg-zinc-200 border border-zinc-700/60 light:border-zinc-300 flex items-center justify-center text-xs font-semibold text-zinc-200 light:text-zinc-800 shrink-0 shadow-sm">
                              {u.name ? u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'C'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white light:text-zinc-900 flex items-center gap-1.5 flex-wrap">
                                <span className="truncate">{u.name || u.user_id}</span>
                                {selectedCandidateId === u.user_id && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-zinc-800 text-zinc-200 light:bg-zinc-200 light:text-zinc-800 border border-zinc-700 light:border-zinc-300 font-mono font-semibold">
                                    SELECTED
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono truncate" title={u.user_id}>@{u.user_id}</div>
                              <div className="text-[11px] text-zinc-400 light:text-zinc-600 font-mono truncate" title={u.email}>{u.email}</div>
                            </div>
                          </div>

                          {/* Symbolic Application Progress Meter or Administrative Badge */}
                          {isAdministrativeUser(u) ? (
                            <div className="pt-1.5 border-t border-zinc-800/60 light:border-zinc-200/80 flex items-center justify-between text-[11px] font-mono">
                              <div className="flex items-center gap-1.5 text-zinc-400 light:text-zinc-600">
                                {isOrgAdminUser(u) ? (
                                  <>
                                    <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                    <span className="text-indigo-300 light:text-indigo-700 font-medium truncate max-w-[170px]" title={u.org_name || u.org_id || 'Enterprise Org'}>
                                      {u.org_name || 'Enterprise Org'}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <ShieldAlert className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                    <span className="text-purple-300 light:text-purple-700 font-medium">
                                      Super Admin
                                    </span>
                                  </>
                                )}
                              </div>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800/80 light:bg-zinc-200 text-zinc-300 light:text-zinc-700 font-semibold border border-zinc-700/60 light:border-zinc-300 font-mono">
                                {isOrgAdminUser(u) ? 'ORG ADMIN' : 'SUPER ADMIN'}
                              </span>
                            </div>
                          ) : (() => {
                            const limit = u.daily_application_limit || (u.is_vip || u.plan === 'elite' || u.plan === 'vip' ? 150 : (u.plan === 'pro' || u.plan === 'starter' ? 50 : 20))
                            const appliedToday = u.applied_today || 0
                            const totalApplied = u.total_applied || u.applied_count || 0
                            const pct = Math.min(100, Math.round((appliedToday / Math.max(1, limit)) * 100))
                            const isApplying = u.execution_summary?.is_applying || u.current_execution?.status === 'applying'
                            const isQuotaMet = appliedToday >= limit && limit > 0

                            return (
                              <div className="pt-1.5 border-t border-zinc-800/60 light:border-zinc-200/80 space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="flex items-center gap-1.5">
                                    {isApplying ? (
                                      <span className="flex items-center gap-1 text-sky-400 font-semibold animate-pulse">
                                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                                        Applying:
                                      </span>
                                    ) : isQuotaMet ? (
                                      <span className="flex items-center gap-1 text-emerald-400 light:text-emerald-700 font-semibold">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400 light:text-emerald-600 shrink-0" />
                                        Quota Met:
                                      </span>
                                    ) : (
                                      <span className="text-zinc-400 light:text-zinc-600 flex items-center gap-1">
                                        Today:
                                      </span>
                                    )}
                                    <strong className={appliedToday > 0 ? "text-emerald-400 light:text-emerald-700 font-semibold" : "text-zinc-300 light:text-zinc-700"}>
                                      {appliedToday}/{limit}
                                    </strong>
                                    <span className="text-zinc-500 text-[9px]">({pct}%)</span>
                                  </span>
                                  <span className="text-zinc-500 light:text-zinc-500 text-[10px]" title="Lifetime Total Applications">
                                    Total: {totalApplied}
                                  </span>
                                </div>

                                {/* Symbolic Progress Track */}
                                <div className="w-full h-1.5 rounded-full bg-zinc-900 light:bg-zinc-200 overflow-hidden relative border border-zinc-800/80 light:border-zinc-300">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isApplying
                                        ? 'bg-sky-500 animate-pulse'
                                        : isQuotaMet
                                        ? 'bg-emerald-500'
                                        : appliedToday > 0
                                        ? 'bg-emerald-500/80'
                                        : 'bg-transparent'
                                    }`}
                                    style={{ width: `${Math.max(appliedToday > 0 ? 5 : 0, pct)}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      </td>
                      {/* Bot Execution & Server Identity Status */}
                      <td className="py-3 px-3">
                        {(() => {
                          const summary: any = u.execution_summary || {}
                          const isApplying = summary.is_applying || u.current_execution?.status === 'applying'
                          const isAppliedToday = summary.is_applied_today || (u.applied_today && u.applied_today > 0)
                          const isInQueue = summary.is_in_queue || summary.status === 'in_queue'
                          const device = summary.device || summary.hostname || u.current_execution?.hostname || u.last_execution?.hostname || u.current_execution?.last_hostname
                          const workerId = summary.worker_id || u.current_execution?.worker_id || u.last_execution?.worker_id || u.current_execution?.last_worker_id
                          const platform = summary.platform || u.current_execution?.platform || u.last_execution?.platform
                          const completedAt = summary.last_completed_at || u.last_automated_run_at || u.last_execution?.completed_at

                          const deviceBrand = summary.device_brand || u.last_execution?.device_brand || u.current_execution?.device_brand || (platform?.includes('Darwin') ? 'Apple Mac' : (platform?.includes('Windows') ? 'Windows PC' : (platform ? 'Linux Server' : null)))
                          const hardwareModel = summary.hardware_model || summary.device_brand || u.last_execution?.hardware_model || u.current_execution?.hardware_model || deviceBrand
                          const macAddress = summary.mac_address || u.last_execution?.mac_address || u.current_execution?.mac_address
                          const pidVal = summary.pid || u.last_execution?.pid || u.current_execution?.pid

                          if (isAdministrativeUser(u)) {
                            const isSuper = isSuperAdminUser(u)
                            return (
                              <div className="space-y-1">
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                                  isSuper
                                    ? 'bg-purple-500/15 text-purple-300 light:text-purple-700 border border-purple-500/30 light:border-purple-300'
                                    : 'bg-indigo-500/15 text-indigo-300 light:text-indigo-700 border border-indigo-500/30 light:border-indigo-300'
                                }`}>
                                  {isSuper ? <ShieldAlert className="w-3 h-3 text-purple-400" /> : <Building2 className="w-3 h-3 text-indigo-400" />}
                                  <span>{isSuper ? 'SUPER ADMIN' : 'ORG ADMIN'}</span>
                                </div>
                                <div className="text-[10px] font-mono text-zinc-500 light:text-zinc-600">
                                  Exempt from bot sweeps
                                </div>
                              </div>
                            )
                          }

                          if (isApplying) {
                            return (
                              <div className="space-y-1.5 cursor-pointer group" onClick={() => handleInspectCandidate(u)} title="Click to inspect live device telemetry">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-[0_0_8px_rgba(56,189,248,0.3)] animate-pulse">
                                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                                  <Sparkles className="w-3 h-3 text-sky-400" />
                                  <span>APPLYING NOW</span>
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1 text-[11px] font-bold text-white light:text-zinc-900 group-hover:text-sky-300 transition-colors">
                                    <Laptop className="w-3 h-3 text-sky-400 shrink-0" />
                                    <span className="truncate max-w-[145px]">{hardwareModel || 'Apple Mac'}</span>
                                  </div>
                                  {device && (
                                    <div
                                      className="flex items-center gap-1 text-[10px] font-mono text-sky-200/90"
                                      title={`Server: ${device}\nPID: ${pidVal || 'N/A'}\nWorker: ${workerId || 'N/A'}`}
                                    >
                                      <Server className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                                      <span className="truncate max-w-[145px]">{device}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          }

                          if (isInQueue) {
                            return (
                              <div className="space-y-1">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 light:text-amber-700 border border-amber-500/30 light:border-amber-300">
                                  <Clock className="w-3 h-3 text-amber-400 light:text-amber-600 animate-spin" />
                                  <span>IN QUEUE</span>
                                </div>
                                <div className="text-[10px] font-mono text-zinc-400 light:text-zinc-600">
                                  Awaiting worker slot
                                </div>
                              </div>
                            )
                          }

                          if (isAppliedToday) {
                            return (
                              <div className="space-y-1.5 cursor-pointer group" onClick={() => handleInspectCandidate(u)} title="Click to inspect execution device details">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 light:text-emerald-700 border border-emerald-500/30 light:border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400 light:text-emerald-600" />
                                  <span>APPLIED TODAY</span>
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1 text-[11px] font-bold text-white light:text-zinc-900 group-hover:text-emerald-300 transition-colors">
                                    <Laptop className="w-3 h-3 text-emerald-400 light:text-emerald-600 shrink-0" />
                                    <span className="truncate max-w-[145px]">{hardwareModel || 'Apple Mac'}</span>
                                  </div>
                                  {device && (
                                    <div
                                      className="flex items-center gap-1 text-[10px] font-mono text-zinc-300 light:text-zinc-700"
                                      title={`Server: ${device}\nWorker: ${workerId || 'N/A'}${platform ? `\nPlatform: ${platform}` : ''}`}
                                    >
                                      <Server className="w-2.5 h-2.5 text-zinc-400 light:text-zinc-600 shrink-0" />
                                      <span className="truncate max-w-[145px]">{device}</span>
                                    </div>
                                  )}

                                </div>
                                {completedAt && (
                                  <div className="text-[9px] font-mono text-zinc-500 light:text-zinc-600">
                                    {formatTimestamp(completedAt)}
                                  </div>
                                )}
                              </div>
                            )
                          }

                          if (u.enabled_for_daily_run === false) {
                            return (
                              <div className="space-y-1">
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500 light:text-zinc-600 bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200">
                                  <AlertCircle className="w-3 h-3 text-zinc-500 light:text-zinc-600" />
                                  <span>AUTO-APPLY OFF</span>
                                </div>
                                <div className="text-[10px] font-mono text-zinc-600">Daily bot disabled</div>
                              </div>
                            )
                          }

                          if (u.plan_expiry_status === 'expired' || u.plan_expiry_status === 'no_plan') {
                            return (
                              <div className="space-y-1">
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-rose-400 light:text-rose-600 bg-rose-950/30 border border-rose-800/40">
                                  <AlertCircle className="w-3 h-3 text-rose-400 light:text-rose-600" />
                                  <span>PLAN REQUIRED</span>
                                </div>
                                <div className="text-[10px] font-mono text-zinc-500 light:text-zinc-600">Auto-apply paused</div>
                              </div>
                            )
                          }

                          return (
                            <div className="space-y-1 cursor-pointer group" onClick={() => handleInspectCandidate(u)} title="Click to view candidate details">
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-amber-300 light:text-amber-700 bg-amber-950/20 border border-amber-800/40">
                                <Clock className="w-3 h-3 text-amber-400 light:text-amber-600" />
                                <span>NOT APPLIED TODAY</span>
                              </div>
                              <div className="text-[10px] font-mono text-zinc-500 light:text-zinc-600">Next cycle: 06:00 AM</div>
                              {(hardwareModel || device) && (
                                <div className="text-[9px] font-mono text-zinc-500 light:text-zinc-600 truncate max-w-[140px]">
                                  Last: {hardwareModel || device}
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </td>
                      <td className="py-3 px-3">
                        {(() => {
                          if (isSuperAdminUser(u)) {
                            return (
                              <div className="flex flex-col items-start gap-1 py-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 light:text-purple-700 border border-purple-500/40 shadow-sm">
                                  <ShieldAlert className="w-3 h-3 text-purple-400" />
                                  <span>SUPER ADMIN</span>
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400 light:text-zinc-600">
                                  Master Access • Exempt from Plans
                                </span>
                              </div>
                            )
                          }
                          if (isOrgAdminUser(u)) {
                            return (
                              <div className="flex flex-col items-start gap-1 py-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 light:text-indigo-700 border border-indigo-500/40 shadow-sm">
                                  <Building2 className="w-3 h-3 text-indigo-400" />
                                  <span>ORG ADMIN</span>
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400 light:text-zinc-600 truncate max-w-[170px]" title={u.org_name || 'Enterprise Org'}>
                                  {u.org_name || 'Enterprise Org'} • Exempt
                                </span>
                              </div>
                            )
                          }
                          return (
                            <div className="flex flex-col items-start gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                  u.plan === 'none' || u.plan === 'no_plan' 
                                    ? 'bg-zinc-800/60 light:bg-zinc-100 text-zinc-500 light:text-zinc-500 border border-zinc-800 light:border-zinc-200' 
                                    : 'bg-zinc-800/90 light:bg-zinc-100 text-zinc-300 light:text-zinc-700 border border-zinc-700 light:border-zinc-300'
                                }`}>
                                  {u.plan === 'none' || u.plan === 'no_plan' ? 'NO PLAN' : (u.plan || 'trial')}
                                </span>
                            {u.is_vip && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-400 light:text-amber-700 border border-amber-500/30 light:border-amber-300">
                                <Crown className="w-2.5 h-2.5 text-amber-400 light:text-amber-600" />
                                VIP
                              </span>
                            )}
                            {(() => {
                              const limit = u.daily_application_limit || (u.is_vip || u.plan === 'elite' || u.plan === 'vip' ? 150 : (u.plan === 'pro' || u.plan === 'starter' ? 50 : 20))
                              return (
                                <span 
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-zinc-800 light:bg-zinc-200 text-zinc-400 light:text-zinc-600 border border-zinc-700/60 light:border-zinc-300"
                                  title={`Daily Application Limit: ${limit}/day on Naukri platform`}
                                >
                                  {limit}/d
                                </span>
                              )
                            })()}
                          </div>

                          {/* Admin Plan Override Dropdown */}
                          <select
                            value={u.plan || 'trial'}
                            onChange={(e) => handleChangePlan(u.user_id, e.target.value)}
                            className="bg-zinc-900 light:bg-white hover:bg-zinc-800 light:hover:bg-zinc-100 border border-zinc-700/80 light:border-zinc-300 text-[10px] text-zinc-200 light:text-zinc-800 rounded-md px-1.5 py-1 focus:outline-none focus:border-zinc-500 light:focus:border-zinc-400 cursor-pointer font-mono font-medium transition-colors"
                            title="Admin Quick Action: Change this candidate's plan tier"
                          >
                            <option value="none">No Plan (Inactive)</option>
                            <option value="trial">Free Trial (3 Days)</option>
                            <option value="starter">Starter (30d)</option>
                            <option value="pro">Pro (30d)</option>
                            <option value="elite">Professional (90d)</option>
                            <option value="vip">VIP Pass (3 Months / 90d)</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleToggleVip(u.user_id, !u.is_vip)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                              u.is_vip
                                ? 'bg-amber-500/10 text-amber-400 light:text-amber-700 border border-amber-500/30 light:border-amber-300 hover:bg-rose-500/15 hover:text-rose-400 hover:border-rose-500/30'
                                : 'bg-zinc-900 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 border border-zinc-800 light:border-zinc-300 hover:bg-zinc-800 hover:text-zinc-200 light:hover:bg-zinc-200'
                            }`}
                            title={u.is_vip ? "Click to Revoke VIP Pass" : "Click to Grant 3-Month VIP Pass"}
                          >
                            <Crown className="w-3 h-3 text-amber-400 light:text-amber-600" />
                            {u.is_vip ? 'Revoke VIP' : 'Grant VIP'}
                          </button>

                          {/* Expiry Countdown & Visual Status */}
                          {(() => {
                            if (u.is_vip || u.plan === 'vip') {
                              return (
                                <div
                                  className="text-[10px] font-mono mt-1 flex items-center gap-1 text-amber-300 light:text-amber-700 bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-500/30 light:border-amber-300"
                                  title="Candidate has active VIP access (90d)."
                                >
                                  <Crown className="w-3 h-3 text-amber-400 light:text-amber-600 shrink-0" />
                                  <span className="font-semibold">VIP Pass (90d Active)</span>
                                </div>
                              )
                            }

                            if (u.plan === 'none' || u.plan === 'no_plan' || u.plan_expiry_status === 'no_plan') {
                              return (
                                <div
                                  className="text-[10px] font-mono mt-1 flex items-center gap-1 text-zinc-400 light:text-zinc-600 bg-zinc-900 light:bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-800 light:border-zinc-200"
                                  title="Candidate has no active plan. Prime prospect for conversion offer."
                                >
                                  <Clock className="w-3 h-3 text-zinc-500 light:text-zinc-600 shrink-0" />
                                  <span>No Active Plan</span>
                                </div>
                              )
                            }

                            const hoursLeft = u.plan_hours_left ?? u.hours_until_expiry

                            if (u.plan_expiry_status === 'expired' || (hoursLeft !== null && hoursLeft !== undefined && hoursLeft <= 0)) {
                              return (
                                <div
                                  className="text-[10px] font-mono mt-1 flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/40 light:bg-rose-50 text-rose-300 light:text-rose-600 border border-rose-800/60 light:border-rose-300"
                                  title={`Plan expired on ${u.plan_expires_at ? formatTimestamp(u.plan_expires_at) : 'recently'}. Eligible for renewal retention offer.`}
                                >
                                  <AlertCircle className="w-3 h-3 text-rose-400 light:text-rose-600 shrink-0" />
                                  <span className="font-bold">Plan Expired</span>
                                </div>
                              )
                            }

                            if (u.plan_expiry_status === 'expiring_soon_1d' || (hoursLeft !== null && hoursLeft !== undefined && hoursLeft <= 24)) {
                              return (
                                <div
                                  className="text-[10px] font-mono mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/50 text-rose-300 light:text-rose-600 border border-rose-800"
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
                                  className="text-[10px] font-mono mt-1 flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/40 light:bg-amber-50 text-amber-300 light:text-amber-700 border border-amber-800/60 light:border-amber-300"
                                  title={`Expires in ${hoursLeft} hours (${days}d). Within 1-2 days renewal retention window.`}
                                >
                                  <Clock className="w-3 h-3 text-amber-400 light:text-amber-600 shrink-0" />
                                  <span className="font-bold text-amber-300 light:text-amber-700">Expiring: {days}d ({hoursLeft}h left)</span>
                                </div>
                              )
                            }

                            if (hoursLeft !== null && hoursLeft !== undefined && hoursLeft > 48) {
                              const days = Math.ceil(hoursLeft / 24)
                              return (
                                <div
                                  className="text-[10px] font-mono mt-1 flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/30 text-emerald-300 light:text-emerald-700 border border-emerald-800/40"
                                  title={`Active plan until ${u.plan_expires_at ? formatTimestamp(u.plan_expires_at) : ''} (${days} days left). Protected from discount offers.`}
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400 light:text-emerald-600 shrink-0" />
                                  <span className="font-medium text-emerald-300 light:text-emerald-700">Active ({days}d left)</span>
                                </div>
                              )
                            }

                            if (u.plan_expires_at) {
                              return (
                                <div className="text-[10px] font-mono mt-1 flex items-center gap-1 text-zinc-400 light:text-zinc-600 bg-zinc-900 light:bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-800 light:border-zinc-200">
                                  <Clock className="w-3 h-3 text-zinc-500 light:text-zinc-600 shrink-0" />
                                  <span>Expires: {formatTimestamp(u.plan_expires_at)}</span>
                                </div>
                              )
                            }

                            return (
                              <div className="text-[10px] font-mono mt-1 flex items-center gap-1 text-zinc-400 light:text-zinc-600 bg-zinc-900 light:bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-800 light:border-zinc-200">
                                <Clock className="w-3 h-3 text-zinc-500 light:text-zinc-600 shrink-0" />
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
                                      ? 'bg-zinc-900 light:bg-zinc-100 text-zinc-500 light:text-zinc-600 line-through border border-zinc-800 light:border-zinc-200'
                                      : 'bg-amber-500/15 text-amber-300 light:text-amber-700 border border-amber-500/30 light:border-amber-300'
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
                          )
                        })()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isAdministrativeUser(u) ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-zinc-800/60 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 border border-zinc-700/60 light:border-zinc-300"
                            title="Administrative accounts do not run automated bot sweeps"
                          >
                            Exempt (Admin)
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleDaily(u.user_id, u.enabled_for_daily_run !== false)}
                            className="text-xs transition-colors cursor-pointer"
                            title="Toggle automated daily apply"
                          >
                            {u.enabled_for_daily_run !== false ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 light:text-emerald-600 border border-emerald-500/30 light:border-emerald-300">
                                <ToggleRight className="w-4 h-4 text-emerald-400 light:text-emerald-600" /> ENABLED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-800 light:bg-zinc-200 text-zinc-400 light:text-zinc-600 border border-zinc-700 light:border-zinc-300">
                                <ToggleLeft className="w-4 h-4 text-zinc-500 light:text-zinc-600" /> DISABLED
                              </span>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="text-zinc-100 light:text-zinc-900 font-mono text-[11px] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-500 light:text-zinc-600 shrink-0" />
                            <span>{formatTimestamp(u.last_login_at)}</span>
                            <span className="text-[9px] text-zinc-500 light:text-zinc-600">· {u.login_count || 0} logins</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-zinc-700 light:text-zinc-700">
                            <FileText className="w-3 h-3 text-zinc-500 light:text-zinc-500 shrink-0" />
                            <span className="truncate max-w-[130px]" title={u.resume_filename || 'No resume file recorded'}>
                              {u.resume_filename || (isAdministrativeUser(u) ? 'Admin Account' : 'No PDF')}
                            </span>
                            <span className="text-[9px] text-zinc-500 light:text-zinc-500">
                              · {u.last_resume_updated_at ? formatTimestamp(u.last_resume_updated_at) : (u.last_profile_updated_at ? formatTimestamp(u.last_profile_updated_at) : 'synced')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-right relative">
                        <div className="flex items-center justify-end gap-1.5" ref={openRowActionMenuId === u.user_id ? rowActionMenuRef : undefined}>
                          {/* Primary Quick Action: Zap Sweep (Candidates Only) */}
                          {!isAdministrativeUser(u) && onTriggerOnDemand && (
                            <button
                              type="button"
                              disabled={Boolean(
                                u.execution_summary?.is_applying ||
                                u.current_execution?.status === 'applying' ||
                                actionProcessingId === u.user_id
                              )}
                              onClick={async (e) => {
                                e.stopPropagation()
                                if (confirm(`Trigger immediate on-demand application for "${u.name || u.user_id}"?\n(Bypasses daily lock to run on next available server)`)) {
                                  await onTriggerOnDemand(u.user_id, true)
                                }
                              }}
                              className="p-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white transition-colors border border-cyan-500/30 shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              title={actionProcessingId === u.user_id ? 'Queuing on-demand run…' : 'Trigger immediate on-demand bot run for this candidate'}
                            >
                              {actionProcessingId === u.user_id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Zap className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* Quick Inspect Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleInspectCandidate(u)
                            }}
                            className="p-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-amber-300 light:text-amber-700 transition-colors border border-amber-500/30 light:border-amber-300 shadow-sm cursor-pointer"
                            title="Inspect candidate plan validity, assigned offers & reminder telemetry"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* ROW TRIPLE-DOT ACTIONS MENU BUTTON */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenRowActionMenuId(openRowActionMenuId === u.user_id ? null : u.user_id)
                              }}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                openRowActionMenuId === u.user_id
                                  ? 'bg-sky-950 border-sky-500 text-sky-300'
                                  : 'bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-300 light:text-zinc-700 border-zinc-800 light:border-zinc-300'
                              }`}
                              title="More Candidate Actions"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {/* ROW ACTION DROPDOWN */}
                            {openRowActionMenuId === u.user_id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1 w-52 p-1.5 rounded-xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 shadow-2xl z-50 text-left space-y-0.5 animate-fadeIn"
                              >
                                {!isAdministrativeUser(u) && onTriggerOnDemand && (
                                  <button
                                    type="button"
                                    disabled={Boolean(
                                      u.execution_summary?.is_applying ||
                                      u.current_execution?.status === 'applying' ||
                                      actionProcessingId === u.user_id
                                    )}
                                    onClick={async () => {
                                      setOpenRowActionMenuId(null)
                                      if (confirm(`Trigger immediate on-demand application for "${u.name || u.user_id}"?\n(Bypasses daily lock to run on next available server)`)) {
                                        await onTriggerOnDemand(u.user_id, true)
                                      }
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-cyan-300 hover:bg-cyan-950/50 light:hover:bg-cyan-50 transition-colors cursor-pointer disabled:opacity-40"
                                  >
                                    <Zap className="w-3.5 h-3.5 shrink-0" />
                                    <span>Run On-Demand Sweep</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenRowActionMenuId(null)
                                    handleInspectCandidate(u)
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 light:text-zinc-800 hover:bg-zinc-900 light:hover:bg-zinc-100 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span>Inspect Telemetry &amp; Plan</span>
                                </button>

                                {!isAdministrativeUser(u) && (
                                  <button
                                    type="button"
                                    disabled={dispatchReportLoading}
                                    onClick={() => {
                                      setOpenRowActionMenuId(null)
                                      onOpenDispatchReportForUser(u.email)
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 light:text-zinc-800 hover:bg-zinc-900 light:hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    <Send className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                    <span>Send Dispatch Report</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenRowActionMenuId(null)
                                    const orgParam = u.org_id || u.enterprise_org_id || ''
                                    const adminEmailParam = u.email || ''
                                    const targetUrl = isOrgAdminUser(u)
                                      ? `/enterprise-admin?${orgParam ? `org_id=${encodeURIComponent(orgParam)}&` : ''}admin_email=${encodeURIComponent(adminEmailParam)}`
                                      : (isSuperAdminUser(u) ? '/admin' : `/dashboard?view_as=${encodeURIComponent(u.user_id)}`)
                                    window.open(targetUrl, '_blank')
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 light:text-zinc-800 hover:bg-zinc-900 light:hover:bg-zinc-100 transition-colors cursor-pointer"
                                >
                                  {isOrgAdminUser(u) ? (
                                    <>
                                      <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                      <span>Org Enterprise Portal ↗</span>
                                    </>
                                  ) : isSuperAdminUser(u) ? (
                                    <>
                                      <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                      <span>Super Admin Portal ↗</span>
                                    </>
                                  ) : (
                                    <>
                                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                      <span>Inspect Candidate Dashboard ↗</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenRowActionMenuId(null)
                                    setEditingUser(u)
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 light:text-zinc-800 hover:bg-zinc-900 light:hover:bg-zinc-100 transition-colors cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                  <span>Edit Profile</span>
                                </button>

                                <div className="border-t border-zinc-900 light:border-zinc-200 my-1" />

                                {isSuperAdminUser(u) ? (
                                  <div className="px-2.5 py-1 text-[11px] text-zinc-500 font-mono italic">
                                    Primary Admin (Protected)
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenRowActionMenuId(null)
                                      handleDeleteUser(u.user_id)
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 light:hover:bg-rose-50 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                    <span>{isOrgAdminUser(u) ? 'Delete Org Admin' : 'Delete Candidate'}</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
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
  )
}
