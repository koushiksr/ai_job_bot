'use client'

import React, { useState, useEffect, useCallback, useTransition } from 'react'
import {
  Users,
  Eye,
  CreditCard,
  Smartphone,
  Laptop,
  Globe,
  Search,
  RefreshCw,
  Clock,
  ExternalLink,
  Shield,
  Filter,
  CheckCircle2,
  EyeOff,
  Ban,
  X,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MapPin,
  Compass,
  ArrowUpRight,
  Layers,
  Code
} from 'lucide-react'
import { VisitorEventRecord, VisitorMetrics } from '../../types'
import { loadAdminPrefs, saveAdminPrefs } from '@/lib/adminPrefs'

export default function VisitorsTab() {
  const [events, setEvents] = useState<VisitorEventRecord[]>([])
  const [metrics, setMetrics] = useState<VisitorMetrics | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [errorNotice, setErrorNotice] = useState<string | null>(null)

  // Filters state
  const [search, setSearch] = useState<string>('')
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all')
  const [deviceFilter, setDeviceFilter] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('all')
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true)
  const [page, setPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalRecords, setTotalRecords] = useState<number>(0)
  const [limit, setLimit] = useState<number>(50)
  // Advanced tracking filters: hide own trail, identity, country
  const [hideMine, setHideMine] = useState<boolean>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('admin_visitors_hide_mine') : null
      return saved === null ? true : saved === '1'
    } catch { return true }
  })
  const [identityFilter, setIdentityFilter] = useState<string>('all')
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [countries, setCountries] = useState<string[]>([])

  // Inspect Modal state
  const [inspectEvent, setInspectEvent] = useState<VisitorEventRecord | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Persistent ignore list: your other accounts / devices / browsers.
  // Stored per-admin in MongoDB, applied server-side on every fetch.
  const [ignored, setIgnored] = useState<{ emails: string[]; vids: string[]; ips: string[] }>({ emails: [], vids: [], ips: [] })
  const [showIgnoreMgr, setShowIgnoreMgr] = useState<boolean>(false)
  const [ignoreBusy, setIgnoreBusy] = useState<boolean>(false)
  const ignoredCount = ignored.emails.length + ignored.vids.length + ignored.ips.length

  const saveIgnoreLists = async (next: { emails: string[]; vids: string[]; ips: string[] }) => {
    setIgnored(next)
    setIgnoreBusy(true)
    try {
      await fetch('/api/admin/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ x_emails: next.emails, x_vids: next.vids, x_ips: next.ips })
      })
    } catch {}
    finally {
      setIgnoreBusy(false)
    }
    setPage(1)
    fetchVisitors(false)
  }

  const ignoreTrail = (evt: { email?: string | null; visitor_id?: string; ip_address?: string }, includeIp = false) => {
    const emails = [...ignored.emails]
    const vids = [...ignored.vids]
    const ips = [...ignored.ips]
    if (evt.email && !emails.map((e) => e.toLowerCase()).includes(evt.email.toLowerCase())) emails.push(evt.email.toLowerCase())
    if (evt.visitor_id && !vids.includes(evt.visitor_id)) vids.push(evt.visitor_id)
    if (includeIp && evt.ip_address && !ips.includes(evt.ip_address)) ips.push(evt.ip_address)
    saveIgnoreLists({ emails: emails.slice(0, 50), vids: vids.slice(0, 50), ips: ips.slice(0, 50) })
  }

  const removeIgnore = (kind: 'emails' | 'vids' | 'ips', value: string) => {
    saveIgnoreLists({ ...ignored, [kind]: ignored[kind].filter((v) => v !== value) })
  }

  // Server-persisted filters (per admin user; localStorage is instant cache).
  const serverPrefsReadyRef = React.useRef(false)
  useEffect(() => {
    let alive = true
    fetch('/api/admin/preferences', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || !data) return
        const prefs = data.prefs || {}
        try {
          const events = ['all', 'payment_success', 'payment_click', 'signup', 'page_view', 'cta_click', 'pwa_install_click']
          const devices = ['all', 'desktop', 'mobile', 'tablet']
          const times = ['today', '24h', '7d', '30d', 'all']
          const identities = ['all', 'known', 'anonymous']
          if (prefs.v_event && events.includes(prefs.v_event)) setEventTypeFilter(prefs.v_event)
          if (prefs.v_device && devices.includes(prefs.v_device)) setDeviceFilter(prefs.v_device)
          if (prefs.v_time && times.includes(prefs.v_time)) setTimeRange(prefs.v_time)
          if (prefs.v_identity && identities.includes(prefs.v_identity)) setIdentityFilter(prefs.v_identity)
          if (typeof prefs.v_country === 'string') setCountryFilter(prefs.v_country || 'all')
          if (prefs.v_hide === '1' || prefs.v_hide === '0') {
            setHideMine(prefs.v_hide === '1')
            try { localStorage.setItem('admin_visitors_hide_mine', prefs.v_hide) } catch {}
          }
          if (prefs.v_limit && ['25', '50', '100'].includes(prefs.v_limit)) setLimit(Number(prefs.v_limit))
          const ig = data.ignore || {}
          setIgnored({
            emails: Array.isArray(ig.x_emails) ? ig.x_emails.filter((e: any) => typeof e === 'string') : [],
            vids: Array.isArray(ig.x_vids) ? ig.x_vids.filter((e: any) => typeof e === 'string') : [],
            ips: Array.isArray(ig.x_ips) ? ig.x_ips.filter((e: any) => typeof e === 'string') : []
          })
        } catch {}
        serverPrefsReadyRef.current = true
      })
      .catch(() => { serverPrefsReadyRef.current = true })
    return () => { alive = false }
  }, [])
  useEffect(() => {
    if (!serverPrefsReadyRef.current) return
    try { localStorage.setItem('admin_visitors_hide_mine', hideMine ? '1' : '0') } catch {}
    saveAdminPrefs({
      v_event: eventTypeFilter,
      v_device: deviceFilter,
      v_time: timeRange,
      v_identity: identityFilter,
      v_country: countryFilter,
      v_hide: hideMine ? '1' : '0',
      v_limit: String(limit)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventTypeFilter, deviceFilter, timeRange, identityFilter, countryFilter, hideMine, limit])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const fetchVisitors = useCallback(async (isBackground: boolean = false) => {
    if (!isBackground) setLoading(true)
    else setRefreshing(true)

    try {
      const uid = typeof window !== 'undefined' ? localStorage.getItem('user_id') || '' : ''
      const uEmail = typeof window !== 'undefined' ? localStorage.getItem('user_email') || '' : ''

      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      params.set('time_range', timeRange)
      params.set('auth_user_id', uid || 'technohmsit')
      params.set('auth_email', uEmail || 'technohmsit@gmail.com')

      if (search.trim()) params.set('search', search.trim())
      if (eventTypeFilter !== 'all') params.set('event_type', eventTypeFilter)
      if (deviceFilter !== 'all') params.set('device_type', deviceFilter)
      if (selectedVisitorId) params.set('visitor_id', selectedVisitorId)
      if (identityFilter !== 'all') params.set('identity', identityFilter)
      if (countryFilter !== 'all') params.set('country', countryFilter)
      if (hideMine) {
        params.set('exclude_admin', '1')
        try {
          const myVid = localStorage.getItem('jobflux_visitor_id')
          if (myVid) params.set('exclude_visitor_id', myVid)
        } catch {}
      }

      const res = await fetch(`/api/admin/visitors?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': uid || 'technohmsit',
          'x-user-email': uEmail || 'technohmsit@gmail.com'
        }
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || `Failed to fetch visitors (Status ${res.status})`)
      }

      const data = await res.json()
      setEvents(data.events || [])
      setMetrics(data.metrics || null)
      if (Array.isArray(data.countries)) setCountries(data.countries)
      setErrorNotice(null)
      if (data.pagination) {
        setTotalPages(data.pagination.total_pages || 1)
        setTotalRecords(data.pagination.total || 0)
      }
    } catch (err: any) {
      console.error('[VisitorsTab] Fetch error:', err)
      setErrorNotice(err.message || 'Error loading visitor activity telemetry')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, limit, timeRange, search, eventTypeFilter, deviceFilter, selectedVisitorId, identityFilter, countryFilter, hideMine])

  useEffect(() => {
    fetchVisitors()
  }, [fetchVisitors])

  // Auto refresh every 10 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      fetchVisitors(true)
    }, 10000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchVisitors])

  const formatRelativeTime = (iso: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
      if (diff < 10) return 'Just now'
      if (diff < 60) return `${diff}s ago`
      const mins = Math.floor(diff / 60)
      if (mins < 60) return `${mins}m ago`
      const hrs = Math.floor(mins / 60)
      if (hrs < 24) return `${hrs}h ago`
      return `${Math.floor(hrs / 24)}d ago`
    } catch {
      return iso
    }
  }

  const formatTimeExact = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch {
      return ''
    }
  }

  const formatDateExact = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    } catch {
      return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Indicator */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-zinc-950 light:bg-white p-4 sm:p-5 rounded-2xl border border-zinc-800/80 light:border-zinc-200">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-bold text-white light:text-zinc-900 tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400 light:text-cyan-600" />
              Live Visitors &amp; Interaction Telemetry
            </h2>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 light:bg-emerald-50 border border-emerald-800 text-emerald-300 light:text-emerald-700 text-[10px] font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              REAL-TIME
            </span>
          </div>
          <p className="text-xs text-zinc-400 light:text-zinc-600 mt-1">
            Tracking every incoming IP, country, visited URL, device type, and high-intent payment click across JobFlux AI.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Auto Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
              autoRefresh
                ? 'bg-cyan-950/50 text-cyan-300 light:text-cyan-700 border-cyan-800/80'
                : 'bg-zinc-900 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 border-zinc-800 light:border-zinc-200 hover:text-zinc-200'
            }`}
            title="Toggle 10s automated polling"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-cyan-400 animate-ping' : 'bg-zinc-600'}`} />
            <span>{autoRefresh ? 'Auto (10s)' : 'Paused'}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => fetchVisitors(false)}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-200 light:text-zinc-800 border border-zinc-800 light:border-zinc-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing || loading ? 'animate-spin text-cyan-400 light:text-cyan-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {errorNotice && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 light:text-rose-600 text-xs flex items-center justify-between">
          <span>{errorNotice}</span>
          <button
            type="button"
            onClick={() => fetchVisitors(false)}
            className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Top High-Level Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Unique Visitors */}
        <div className="p-4 rounded-xl bg-zinc-950/90 light:bg-white border border-zinc-800/80 light:border-zinc-200">
          <div className="flex items-center justify-between text-zinc-400 light:text-zinc-600 text-xs mb-1.5">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
              Unique Visitors
            </span>
            <span className="text-[10px] font-mono text-cyan-400 light:text-cyan-600 bg-cyan-950 px-1 rounded">ALL TIME</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white light:text-zinc-900 font-mono">
            {metrics?.total_unique_visitors.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-zinc-400 light:text-zinc-600 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 light:text-emerald-600 font-semibold font-mono">+{metrics?.today_visitors || 0}</span>
            <span>seen today</span>
          </div>
        </div>

        {/* Page Views */}
        <div className="p-4 rounded-xl bg-zinc-950/90 light:bg-white border border-zinc-800/80 light:border-zinc-200">
          <div className="flex items-center justify-between text-zinc-400 light:text-zinc-600 text-xs mb-1.5">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              Total Page Views
            </span>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-950 px-1 rounded">HITS</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white light:text-zinc-900 font-mono">
            {metrics?.total_page_views.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-zinc-400 light:text-zinc-600 mt-1 flex items-center gap-1">
            <span className="text-cyan-400 light:text-cyan-600 font-semibold font-mono">+{metrics?.today_page_views || 0}</span>
            <span>views today</span>
          </div>
        </div>

        {/* Payment Clicks / Purchase Intent */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-zinc-950 border border-amber-500/30 light:border-amber-300">
          <div className="flex items-center justify-between text-zinc-400 light:text-zinc-600 text-xs mb-1.5">
            <span className="flex items-center gap-1.5 text-amber-300 light:text-amber-700 font-semibold">
              <CreditCard className="w-3.5 h-3.5 text-amber-400 light:text-amber-600" />
              Payment Clicks
            </span>
            <span className="text-[10px] font-mono text-amber-300 light:text-amber-700 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-800">INTENT</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-300 light:text-amber-700 font-mono">
            {metrics?.total_payment_intents.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-amber-200/80 mt-1 flex items-center gap-1">
            <span className="text-amber-400 light:text-amber-600 font-bold font-mono">+{metrics?.today_payment_clicks || 0}</span>
            <span>clicked checkout today</span>
          </div>
        </div>

        {/* Identified Leads */}
        <div className="p-4 rounded-xl bg-zinc-950/90 light:bg-white border border-zinc-800/80 light:border-zinc-200">
          <div className="flex items-center justify-between text-zinc-400 light:text-zinc-600 text-xs mb-1.5">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" />
              Identified Leads
            </span>
            <span className="text-[10px] font-mono text-emerald-400 light:text-emerald-600 bg-emerald-950 px-1 rounded">EMAILS</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-300 light:text-emerald-700 font-mono">
            {metrics?.identified_visitors_count.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-zinc-400 light:text-zinc-600 mt-1">
            Visitors linked to accounts
          </div>
        </div>

        {/* Device Spread */}
        <div className="p-4 rounded-xl bg-zinc-950/90 light:bg-white border border-zinc-800/80 light:border-zinc-200 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-zinc-400 light:text-zinc-600 text-xs mb-1.5">
            <span className="flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-purple-400" />
              Device Spread
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs mt-2">
            <div className="flex items-center gap-1 text-zinc-300 light:text-zinc-700">
              <Laptop className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
              <span className="font-mono font-bold">{metrics?.devices_breakdown.desktop || 0}</span>
              <span className="text-[10px] text-zinc-500 light:text-zinc-600">PC</span>
            </div>
            <div className="flex items-center gap-1 text-zinc-300 light:text-zinc-700">
              <Smartphone className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-mono font-bold">{metrics?.devices_breakdown.mobile || 0}</span>
              <span className="text-[10px] text-zinc-500 light:text-zinc-600">Mob</span>
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 light:text-zinc-600 mt-1.5">
            Top URL: <span className="text-zinc-300 light:text-zinc-700 font-mono">{metrics?.top_pages[0]?.path || '/'}</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Interactive Filter Controls */}
      <div className="p-4 rounded-2xl bg-zinc-950 light:bg-white border border-zinc-800/80 light:border-zinc-200 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-zinc-500 light:text-zinc-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by Email, IP, Visitor ID, URL, or Plan..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-200 light:text-zinc-800 placeholder-zinc-500 light:placeholder-zinc-400 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1) }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 light:text-zinc-600 hover:text-zinc-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Time Range Dropdown */}
          <select
            value={timeRange}
            onChange={(e) => { setTimeRange(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="today">Today Only</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>

          {/* Device Type Dropdown */}
          <select
            value={deviceFilter}
            onChange={(e) => { setDeviceFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">All Devices</option>
            <option value="desktop">Desktop / Laptop</option>
            <option value="mobile">Mobile Phones</option>
            <option value="tablet">Tablets</option>
          </select>

          {/* Rows per page */}
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}
            className="px-3 py-2 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer font-mono"
          >
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>

          {/* Country Dropdown (populated live from traffic) */}
          <select
            value={countryFilter}
            onChange={(e) => { setCountryFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer max-w-[160px]"
            title="Filter by visitor country"
          >
            <option value="all">All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Hide my trail: drops your own admin traffic (email + this browser) */}
          <button
            type="button"
            onClick={() => {
              const next = !hideMine
              setHideMine(next)
              setPage(1)
              try { localStorage.setItem('admin_visitors_hide_mine', next ? '1' : '0') } catch {}
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors border cursor-pointer ${
              hideMine
                ? 'bg-emerald-950/50 text-emerald-300 light:text-emerald-700 border-emerald-800/80'
                : 'bg-zinc-900 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 border-zinc-800 light:border-zinc-200 hover:text-zinc-200'
            }`}
            title="Hide events from your own admin email and this browser — see only other visitors"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>{hideMine ? 'Trail hidden: you' : 'Show my trail'}</span>
          </button>

          {/* Ignore manager: your other accounts / devices / browsers */}
          <button
            type="button"
            onClick={() => setShowIgnoreMgr(!showIgnoreMgr)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors border cursor-pointer ${
              ignoredCount > 0
                ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
                : 'bg-zinc-900 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 border-zinc-800 light:border-zinc-200 hover:text-zinc-200'
            }`}
            title="Emails, browsers and IPs you never want to see (stored per admin)"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Ignored ({ignoredCount})</span>
          </button>
        </div>

        {/* Ignore list manager */}
        {showIgnoreMgr && (
          <div className="p-3 rounded-xl bg-zinc-900/60 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              { kind: 'emails' as const, label: 'Ignored emails', items: ignored.emails },
              { kind: 'vids' as const, label: 'Ignored browsers', items: ignored.vids },
              { kind: 'ips' as const, label: 'Ignored IPs', items: ignored.ips }
            ]).map((group) => (
              <div key={group.kind}>
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 light:text-zinc-600 mb-1.5">
                  {group.label} ({group.items.length})
                </div>
                {group.items.length === 0 ? (
                  <div className="text-[11px] text-zinc-600 font-mono">— none —</div>
                ) : (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {group.items.map((v) => (
                      <div key={v} className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 text-[11px] font-mono text-zinc-300 light:text-zinc-700">
                        <span className="truncate" title={v}>{v}</span>
                        <button
                          type="button"
                          onClick={() => removeIgnore(group.kind, v)}
                          className="text-zinc-500 hover:text-emerald-300 shrink-0 cursor-pointer"
                          title="Stop ignoring (show again)"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-zinc-900 light:border-zinc-200">
          <span className="text-xs text-zinc-500 light:text-zinc-600 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Event Filter:
          </span>

          {[
            { id: 'all', label: 'All Events' },
            { id: 'payment_success', label: 'Purchases' },
            { id: 'payment_click', label: 'Payment Clicks' },
            { id: 'signup', label: 'Signups' },
            { id: 'page_view', label: 'Page Views' },
            { id: 'cta_click', label: 'CTA Clicks' },
            { id: 'pwa_install_click', label: 'PWA Actions' }
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => { setEventTypeFilter(pill.id); setPage(1) }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                eventTypeFilter === pill.id
                  ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 font-semibold border border-zinc-700 light:border-zinc-300 shadow-sm'
                  : 'bg-zinc-900/60 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 border border-zinc-800/80 light:border-zinc-200'
              }`}
            >
              {pill.label}
            </button>
          ))}

          {selectedVisitorId && (
            <div className="ml-auto flex items-center gap-2 bg-purple-950/60 border border-purple-800 px-2.5 py-1 rounded-lg text-xs text-purple-200">
              <span>Drilldown: <strong className="font-mono">{selectedVisitorId.slice(0, 12)}...</strong></span>
              <button
                type="button"
                onClick={() => setSelectedVisitorId(null)}
                className="text-purple-400 hover:text-white light:hover:text-zinc-900 font-bold ml-1 cursor-pointer"
                title="Clear visitor drilldown"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Identity Filter Pills: identified leads vs anonymous lurkers */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs text-zinc-500 light:text-zinc-600 flex items-center gap-1 mr-1">
            <Users className="w-3 h-3" /> Identity:
          </span>

          {[
            { id: 'all', label: 'Everyone' },
            { id: 'known', label: 'Identified (email)' },
            { id: 'anonymous', label: 'Anonymous lurkers' }
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => { setIdentityFilter(pill.id); setPage(1) }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                identityFilter === pill.id
                  ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 font-semibold border border-zinc-700 light:border-zinc-300 shadow-sm'
                  : 'bg-zinc-900/60 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 border border-zinc-800/80 light:border-zinc-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Live Chronological Events Table */}
      <div className="rounded-2xl bg-zinc-950 light:bg-white border border-zinc-800/80 light:border-zinc-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300 light:text-zinc-700 border-collapse">
            <thead className="bg-zinc-900/80 light:bg-zinc-100 text-[11px] font-semibold text-zinc-400 light:text-zinc-600 uppercase tracking-wider border-b border-zinc-800 light:border-zinc-200">
              <tr>
                <th className="py-3 px-4">Time &amp; Recency</th>
                <th className="py-3 px-4">Visitor / Identity</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Page &amp; Referrer</th>
                <th className="py-3 px-4">IP &amp; Geolocation</th>
                <th className="py-3 px-4">Device &amp; OS</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 light:divide-zinc-200">
              {loading && events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500 light:text-zinc-600">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 light:text-cyan-600 mb-2" />
                    Loading visitor activity records...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-zinc-500 light:text-zinc-600">
                    No visitor events found matching current criteria.
                  </td>
                </tr>
              ) : (
                events.map((evt) => {
                  const isPayment = evt.event_type === 'payment_click'
                  const isPageView = evt.event_type === 'page_view'
                  const hasEmail = Boolean(evt.email)

                  return (
                    <tr
                      key={evt.id}
                      className={`hover:bg-zinc-900/40 light:hover:bg-zinc-50 transition-colors ${
                        isPayment ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-zinc-200 light:text-zinc-800 font-semibold">
                          {formatTimeExact(evt.created_at)}
                        </div>
                        <div className="text-[10px] text-zinc-500 light:text-zinc-600 flex items-center gap-1.5 mt-0.5">
                          <span>{formatDateExact(evt.created_at)}</span>
                          <span className="text-cyan-400 light:text-cyan-600 font-mono font-medium">
                            • {formatRelativeTime(evt.created_at)}
                          </span>
                        </div>
                      </td>

                      {/* Visitor / Identity */}
                      <td className="py-3 px-4">
                        {hasEmail ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 light:text-emerald-700 border border-emerald-800 text-[11px] font-medium">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 light:text-emerald-600" />
                              {evt.email}
                            </span>
                            {evt.user_id && (
                              <div className="text-[10px] text-zinc-400 light:text-zinc-600 font-mono">
                                UID: {evt.user_id}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <button
                              type="button"
                              onClick={() => setSelectedVisitorId(evt.visitor_id)}
                              className="font-mono text-zinc-400 light:text-zinc-600 hover:text-cyan-300 transition-colors cursor-pointer text-[11px] flex items-center gap-1 group"
                              title="Click to filter all events by this visitor"
                            >
                              <span>{evt.visitor_id.slice(0, 14)}...</span>
                              <Filter className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
                            </button>
                            <span className="text-[10px] text-zinc-600 block">
                              Anonymous Visitor
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Event Type */}
                      <td className="py-3 px-4">
                        {isPayment ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950 text-amber-300 light:text-amber-700 border border-amber-700 text-[10px] font-extrabold tracking-wide">
                              <CreditCard className="w-3 h-3 text-amber-400 light:text-amber-600" />
                              PAYMENT CLICK
                            </span>
                            {evt.metadata?.plan_name && (
                              <div className="text-[11px] font-semibold text-white light:text-zinc-900">
                                {evt.metadata.plan_name}
                                {evt.metadata.amount ? ` (₹${evt.metadata.amount})` : ''}
                              </div>
                            )}
                          </div>
                        ) : evt.event_type === 'payment_success' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 light:text-emerald-700 border border-emerald-700 text-[10px] font-bold">
                              <Sparkles className="w-3 h-3 text-emerald-400 light:text-emerald-600" />
                              PAID PURCHASE
                            </span>
                            {evt.metadata?.plan_name && (
                              <div className="text-[11px] font-bold text-emerald-400 light:text-emerald-600">
                                {evt.metadata.plan_name} (₹{evt.metadata.amount || 99})
                              </div>
                            )}
                          </div>
                        ) : evt.event_type === 'signup' || evt.event_type === 'lead' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-950 text-green-300 border border-green-800 text-[10px] font-bold">
                              <Sparkles className="w-3 h-3 text-green-400" />
                              NEW SIGNUP
                            </span>
                            {evt.metadata?.plan && (
                              <div className="text-[10px] text-zinc-400 light:text-zinc-600">
                                {evt.metadata.plan} ({evt.metadata.method || 'form'})
                              </div>
                            )}
                          </div>
                        ) : isPageView ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/80 light:bg-cyan-50 text-cyan-300 light:text-cyan-700 border border-cyan-800 text-[10px] font-medium">
                            <Eye className="w-3 h-3" />
                            PAGE VIEW
                          </span>
                        ) : evt.event_type === 'pwa_install_click' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 text-[10px] font-medium">
                            <Smartphone className="w-3 h-3" />
                            PWA INSTALL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-medium">
                            <Sparkles className="w-3 h-3" />
                            {evt.event_type.replace('_', ' ').toUpperCase()}
                          </span>
                        )}
                      </td>

                      {/* Visited Page & Referrer */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-mono text-white light:text-zinc-900 font-medium truncate" title={evt.path}>
                          {evt.path}
                        </div>
                        <div className="text-[10px] text-zinc-500 light:text-zinc-600 truncate mt-0.5" title={evt.referrer}>
                          Ref: {evt.referrer || 'Direct'}
                        </div>
                      </td>

                      {/* IP & Geolocation */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-zinc-300 light:text-zinc-700 text-xs flex items-center gap-1.5">
                          <span>{evt.ip_address}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(evt.ip_address, evt.id + '_ip')}
                            className="text-zinc-600 hover:text-zinc-400 transition-colors"
                            title="Copy IP"
                          >
                            {copiedId === evt.id + '_ip' ? <Check className="w-3 h-3 text-emerald-400 light:text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="text-[10px] text-zinc-400 light:text-zinc-600 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-rose-400 light:text-rose-600 shrink-0" />
                          <span>
                            {evt.city ? `${evt.city}, ` : ''}{evt.country_name || evt.country || 'Unknown Location'}
                          </span>
                        </div>
                      </td>

                      {/* Device & OS */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-zinc-200 light:text-zinc-800">
                          {evt.device_type === 'desktop' ? (
                            <Laptop className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600 shrink-0" />
                          ) : (
                            <Smartphone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          )}
                          <span className="font-medium">{evt.os} • {evt.browser}</span>
                        </div>
                        {evt.screen_resolution && (
                          <div className="text-[10px] text-zinc-500 light:text-zinc-600 font-mono mt-0.5">
                            {evt.screen_resolution}
                          </div>
                        )}
                      </td>

                      {/* Details / Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectEvent(evt)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 border border-zinc-800 light:border-zinc-200 text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Inspect
                          </button>
                          <button
                            type="button"
                            onClick={() => ignoreTrail(evt)}
                            disabled={ignoreBusy}
                            className="p-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-rose-950/50 text-zinc-500 light:text-zinc-600 hover:text-rose-300 border border-zinc-800 light:border-zinc-200 hover:border-rose-800/60 transition-colors cursor-pointer disabled:opacity-50"
                            title={evt.email ? `Never show ${evt.email} or this browser again` : 'Never show this browser again'}
                          >
                            <Ban className="w-3.5 h-3.5" />
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

        {/* Table Footer / Pagination */}
        <div className="p-4 bg-zinc-950 light:bg-white border-t border-zinc-900 light:border-zinc-200 flex items-center justify-between flex-wrap gap-3 text-xs text-zinc-400 light:text-zinc-600">
          <div>
            Showing <strong className="text-white light:text-zinc-900">{events.length}</strong> of{' '}
            <strong className="text-white light:text-zinc-900">{totalRecords.toLocaleString()}</strong> events
            {selectedVisitorId && (
              <span className="ml-2 text-purple-400">
                (Filtered for single visitor)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-300 light:text-zinc-700 disabled:opacity-30 border border-zinc-800 light:border-zinc-200 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-zinc-300 light:text-zinc-700 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-300 light:text-zinc-700 disabled:opacity-30 border border-zinc-800 light:border-zinc-200 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Inspection Modal / Drawer */}
      {inspectEvent && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 light:bg-white/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setInspectEvent(null)}
        >
          <div 
            className="relative w-full max-w-2xl rounded-3xl bg-[#0d1017] light:bg-white border border-zinc-800 light:border-zinc-200 text-white light:text-zinc-900 p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setInspectEvent(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800/80 light:bg-zinc-200 hover:bg-zinc-700 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 flex items-center justify-center transition-colors border border-zinc-700/60 light:border-zinc-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5 pr-8">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 light:text-cyan-600 flex items-center justify-center shrink-0 border border-cyan-500/30 light:border-cyan-300">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white light:text-zinc-900 tracking-tight flex items-center gap-2">
                  Visitor Telemetry Inspection
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 light:bg-zinc-200 text-zinc-300 light:text-zinc-700 uppercase">
                    {inspectEvent.event_type}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
                  Full capture payload from client browser and network headers
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-zinc-900/80 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200">
                <span className="text-[10px] text-zinc-500 light:text-zinc-600 uppercase font-semibold block">IP &amp; Location</span>
                <div className="text-xs font-mono font-bold text-white light:text-zinc-900 mt-1">{inspectEvent.ip_address}</div>
                <div className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
                  {inspectEvent.city ? `${inspectEvent.city}, ` : ''}{inspectEvent.country_name || inspectEvent.country}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/80 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200">
                <span className="text-[10px] text-zinc-500 light:text-zinc-600 uppercase font-semibold block">Visitor Identity</span>
                <div className="text-xs font-medium text-emerald-400 light:text-emerald-600 mt-1">
                  {inspectEvent.email || 'Anonymous (Unauthenticated)'}
                </div>
                <div className="text-[10px] font-mono text-zinc-500 light:text-zinc-600 mt-0.5 truncate">
                  VID: {inspectEvent.visitor_id}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/80 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200">
                <span className="text-[10px] text-zinc-500 light:text-zinc-600 uppercase font-semibold block">Device &amp; Environment</span>
                <div className="text-xs font-semibold text-zinc-200 light:text-zinc-800 mt-1">
                  {inspectEvent.os} • {inspectEvent.browser}
                </div>
                <div className="text-[10px] text-zinc-500 light:text-zinc-600 font-mono mt-0.5">
                  Screen: {inspectEvent.screen_resolution || 'N/A'} • Lang: {inspectEvent.language || 'N/A'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/80 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200">
                <span className="text-[10px] text-zinc-500 light:text-zinc-600 uppercase font-semibold block">URL &amp; Referrer</span>
                <div className="text-xs font-mono font-semibold text-cyan-300 light:text-cyan-700 mt-1 truncate" title={inspectEvent.path}>
                  {inspectEvent.path}
                </div>
                <div className="text-[10px] text-zinc-500 light:text-zinc-600 truncate mt-0.5" title={inspectEvent.referrer}>
                  Ref: {inspectEvent.referrer || 'Direct'}
                </div>
              </div>
            </div>

            {/* Raw JSON Payload Viewer */}
            <div className="space-y-1.5 mb-5">
              <div className="flex items-center justify-between text-xs text-zinc-400 light:text-zinc-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Code className="w-3.5 h-3.5 text-cyan-400 light:text-cyan-600" />
                  Full Payload JSON
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(JSON.stringify(inspectEvent, null, 2), 'raw_json')}
                  className="text-xs text-cyan-400 light:text-cyan-600 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'raw_json' ? <Check className="w-3 h-3 text-emerald-400 light:text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'raw_json' ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-black light:bg-white border border-zinc-800 light:border-zinc-200 text-[11px] font-mono text-zinc-300 light:text-zinc-700 overflow-x-auto max-h-56 leading-relaxed">
                {JSON.stringify(inspectEvent, null, 2)}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedVisitorId(inspectEvent.visitor_id)
                  setInspectEvent(null)
                  setPage(1)
                }}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black light:text-white font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Filter All Actions by this Visitor
              </button>
              <button
                type="button"
                onClick={() => setInspectEvent(null)}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 light:bg-zinc-200 hover:bg-zinc-700 text-zinc-200 light:text-zinc-800 font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Ignore this trail forever (your other accounts / devices / browsers) */}
            <div className="mt-3 p-3 rounded-xl bg-zinc-900/80 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200">
              <div className="text-[11px] font-semibold text-zinc-300 light:text-zinc-700 flex items-center gap-1.5 mb-2">
                <Ban className="w-3.5 h-3.5 text-rose-400" />
                Ignore this trail forever
              </div>
              <div className="flex flex-wrap gap-2">
                {inspectEvent.email && (
                  <button
                    type="button"
                    disabled={ignoreBusy}
                    onClick={() => { ignoreTrail({ email: inspectEvent.email }); }}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950/50 border border-zinc-700 hover:border-rose-800/60 text-[11px] font-mono text-zinc-300 hover:text-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                    title="Hide every event from this email on all devices"
                  >
                    ✕ {inspectEvent.email}
                  </button>
                )}
                <button
                  type="button"
                  disabled={ignoreBusy}
                  onClick={() => { ignoreTrail({ visitor_id: inspectEvent.visitor_id }); }}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950/50 border border-zinc-700 hover:border-rose-800/60 text-[11px] font-mono text-zinc-300 hover:text-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                  title="Hide every event from this browser"
                >
                  ✕ this browser ({inspectEvent.visitor_id.slice(0, 10)}…)
                </button>
                <button
                  type="button"
                  disabled={ignoreBusy}
                  onClick={() => { ignoreTrail({ ip_address: inspectEvent.ip_address }, true); }}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950/50 border border-zinc-700 hover:border-rose-800/60 text-[11px] font-mono text-zinc-300 hover:text-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                  title="Careful: shared / office networks hide other people too"
                >
                  ✕ IP {inspectEvent.ip_address}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
