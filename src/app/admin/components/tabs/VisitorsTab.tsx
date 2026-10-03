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
  Code,
  Activity,
  UserCheck
} from 'lucide-react'
import { VisitorEventRecord, VisitorMetrics, UniqueVisitorRecord } from '../../types'
import { loadAdminPrefs, saveAdminPrefs } from '@/lib/adminPrefs'

export default function VisitorsTab() {
  const [viewMode, setViewMode] = useState<'unique_visitors' | 'events'>('unique_visitors')
  const [uniqueVisitors, setUniqueVisitors] = useState<UniqueVisitorRecord[]>([])
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
  // Lazy by default: first page loads on mount, no auto-polling after tab
  // switches — user hits Refresh for fresh data. Keeps tab switches cheap.
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalRecords, setTotalRecords] = useState<number>(0)
  const [limit, setLimit] = useState<number>(25)
  // Debounced search — typing filters locally, API fires 500ms after pause.
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
  const [inspectVisitor, setInspectVisitor] = useState<UniqueVisitorRecord | null>(null)
  const [taggingVid, setTaggingVid] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Manual browser→identity tagging (Short Name / Alias and/or Email)
  const [tagName, setTagName] = useState<string>('')
  const [tagEmail, setTagEmail] = useState<string>('')
  const [isEditingTag, setIsEditingTag] = useState<boolean>(false)
  const [tagBusy, setTagBusy] = useState<boolean>(false)
  const [tagNotice, setTagNotice] = useState<string | null>(null)

  const submitTag = async () => {
    const targetVid = taggingVid || inspectVisitor?.visitor_id || inspectEvent?.visitor_id
    if (!targetVid || tagBusy) return
    const cleanName = tagName.trim()
    const cleanEmail = tagEmail.trim().toLowerCase()
    if (!cleanName && !cleanEmail) {
      setTagNotice('Enter a short name / tag or an email.')
      return
    }
    if (cleanEmail && !cleanEmail.includes('@')) {
      setTagNotice('Please enter a valid email address with @.')
      return
    }
    setTagBusy(true)
    setTagNotice(null)
    try {
      const res = await fetch('/api/admin/visitor-identities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          visitor_id: targetVid,
          tag_name: cleanName || null,
          email: cleanEmail || null
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Tagging failed.')

      const updatedLinked = {
        email: cleanEmail || inspectEvent?.linked?.email || inspectEvent?.email || null,
        user_id: data.user_id || inspectEvent?.linked?.user_id || inspectEvent?.user_id || null,
        tag_name: cleanName || null,
        manual: true
      }

      if (inspectEvent && inspectEvent.visitor_id === targetVid) {
        setInspectEvent({
          ...inspectEvent,
          tag_name: cleanName || null,
          linked: updatedLinked
        })
      }

      if (inspectVisitor && inspectVisitor.visitor_id === targetVid) {
        setInspectVisitor({
          ...inspectVisitor,
          tag_name: cleanName || null,
          email: cleanEmail || inspectVisitor.email,
          manual: true
        })
      }

      // Immediately sync with the active lists
      setUniqueVisitors((prev) =>
        prev.map((v) =>
          v.visitor_id === targetVid
            ? { ...v, tag_name: cleanName || null, email: cleanEmail || v.email, manual: true }
            : v
        )
      )

      setEvents((prevEvents) =>
        prevEvents.map((e) =>
          e.visitor_id === targetVid
            ? {
                ...e,
                tag_name: cleanName || null,
                linked: {
                  ...(e.linked || {}),
                  email: cleanEmail || e.linked?.email || e.email || null,
                  tag_name: cleanName || null,
                  manual: true
                }
              }
            : e
        )
      )

      setIsEditingTag(false)
      setTaggingVid(null)
      const noticeParts = []
      if (cleanName) noticeParts.push(`name '${cleanName}'`)
      if (cleanEmail) noticeParts.push(`email '${cleanEmail}'`)
      setTagNotice(`✅ Tag saved: ${noticeParts.join(' & ')}.`)
    } catch (err: any) {
      setTagNotice(err.message || 'Tagging failed.')
    } finally {
      setTagBusy(false)
    }
  }

  const removeTag = async (overrideVid?: string) => {
    const targetVid = overrideVid || taggingVid || inspectVisitor?.visitor_id || inspectEvent?.visitor_id
    if (!targetVid || tagBusy) return
    setTagBusy(true)
    setTagNotice(null)
    try {
      await fetch(`/api/admin/visitor-identities?visitor_id=${encodeURIComponent(targetVid)}`, {
        method: 'DELETE',
        credentials: 'same-origin'
      })
      if (inspectEvent && inspectEvent.visitor_id === targetVid) {
        setInspectEvent({ ...inspectEvent, tag_name: null, linked: null })
      }
      if (inspectVisitor && inspectVisitor.visitor_id === targetVid) {
        setInspectVisitor({ ...inspectVisitor, tag_name: null, manual: false })
      }
      setUniqueVisitors((prev) =>
        prev.map((v) =>
          v.visitor_id === targetVid
            ? { ...v, tag_name: null, manual: false }
            : v
        )
      )
      setEvents((prevEvents) =>
        prevEvents.map((e) =>
          e.visitor_id === targetVid
            ? { ...e, tag_name: null, linked: null }
            : e
        )
      )
      setTagName('')
      setTagEmail('')
      setIsEditingTag(false)
      setTaggingVid(null)
      setTagNotice('Manual tag removed.')
    } catch (err: any) {
      setTagNotice(err.message || 'Untag failed.')
    } finally {
      setTagBusy(false)
    }
  }

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

  const ignoreTrail = (evt: { email?: string | null; visitor_id?: string; ip_address?: string; last_ip?: string }, includeIp = false) => {
    const emails = [...ignored.emails]
    const vids = [...ignored.vids]
    const ips = [...ignored.ips]
    const ip = evt.ip_address || evt.last_ip
    if (evt.email && !emails.map((e) => e.toLowerCase()).includes(evt.email.toLowerCase())) emails.push(evt.email.toLowerCase())
    if (evt.visitor_id && !vids.includes(evt.visitor_id)) vids.push(evt.visitor_id)
    if (includeIp && ip && !ips.includes(ip)) ips.push(ip)
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

  const [debouncedSearch, setDebouncedSearch] = useState<string>('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 500)
    return () => clearTimeout(t)
  }, [search])

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
      params.set('view_mode', viewMode)
      params.set('page', String(page))
      params.set('limit', String(limit))
      params.set('time_range', timeRange)
      params.set('auth_user_id', uid || 'technohmsit')
      params.set('auth_email', uEmail || 'technohmsit@gmail.com')

      if (debouncedSearch) params.set('search', debouncedSearch)
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
        // Session died (e.g. signed out elsewhere): stop polling instead of
        // hammering a 403 every 10s and spamming the console.
        if (res.status === 403) setAutoRefresh(false)
        throw new Error(errData.detail || `Failed to fetch visitors (Status ${res.status})`)
      }

      const data = await res.json()
      if (Array.isArray(data.visitors)) {
        setUniqueVisitors(data.visitors)
      }
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
  }, [viewMode, page, limit, timeRange, debouncedSearch, eventTypeFilter, deviceFilter, selectedVisitorId, identityFilter, countryFilter, hideMine])

  // Lazy first-page load on mount; tab switches remount cheaply (25 rows, no auto-poll).
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

      {/* 2.5 View Mode Switcher: Unique Visitors Directory vs Live Event Telemetry */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-950/80 light:bg-zinc-100 border border-zinc-800/80 light:border-zinc-200">
        <button
          type="button"
          onClick={() => {
            setViewMode('unique_visitors')
            setPage(1)
          }}
          className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            viewMode === 'unique_visitors'
              ? 'bg-zinc-800 light:bg-white text-white light:text-zinc-900 shadow-md border border-zinc-700/80 light:border-zinc-300'
              : 'text-zinc-400 light:text-zinc-600 hover:text-zinc-200 light:hover:text-zinc-900 hover:bg-zinc-900/50'
          }`}
        >
          <Users className="w-4 h-4 text-cyan-400 light:text-cyan-600" />
          <span>Unique Visitors Directory</span>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-cyan-950 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 border border-cyan-800/60 light:border-cyan-200 font-bold">
            {(metrics?.total_unique_visitors || 0).toLocaleString()}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setViewMode('events')
            setPage(1)
          }}
          className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            viewMode === 'events'
              ? 'bg-zinc-800 light:bg-white text-white light:text-zinc-900 shadow-md border border-zinc-700/80 light:border-zinc-300'
              : 'text-zinc-400 light:text-zinc-600 hover:text-zinc-200 light:hover:text-zinc-900 hover:bg-zinc-900/50'
          }`}
        >
          <Activity className="w-4 h-4 text-purple-400 light:text-purple-600" />
          <span>Live Event Telemetry</span>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-purple-950 light:bg-purple-100 text-purple-300 light:text-purple-800 border border-purple-800/60 light:border-purple-200 font-bold">
            {(metrics?.total_page_views || 0).toLocaleString()}
          </span>
        </button>
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
              placeholder="Search by Short Name / Tag, Email, IP, Visitor ID, URL, or Plan..."
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
            { id: 'tagged', label: 'Tagged by Name' },
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

      {/* 4. Live Chronological Events & Unique Visitors Directory */}
      <div className="rounded-2xl bg-zinc-950 light:bg-white border border-zinc-800/80 light:border-zinc-200 overflow-hidden shadow-sm">
        {selectedVisitorId && viewMode === 'events' && (
          <div className="p-3 bg-purple-950/40 border-b border-purple-800/80 flex items-center justify-between flex-wrap gap-2 text-xs text-purple-200">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>
                Filtering chronological event stream for Visitor: <strong className="font-mono text-purple-300">{selectedVisitorId}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedVisitorId(null)
                  setViewMode('unique_visitors')
                  setPage(1)
                }}
                className="px-2.5 py-1 rounded-lg bg-purple-900 hover:bg-purple-800 text-white font-medium border border-purple-700 cursor-pointer text-xs transition-colors"
              >
                ← Return to Unique Visitors Directory
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedVisitorId(null)
                  setPage(1)
                }}
                className="px-2 py-1 text-purple-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Clear Drilldown
              </button>
            </div>
          </div>
        )}

        {viewMode === 'unique_visitors' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300 light:text-zinc-700 border-collapse">
              <thead className="bg-zinc-900/80 light:bg-zinc-100 text-[11px] font-semibold text-zinc-400 light:text-zinc-600 uppercase tracking-wider border-b border-zinc-800 light:border-zinc-200">
                <tr>
                  <th className="py-3 px-4">Last Seen &amp; Recency</th>
                  <th className="py-3 px-4">Visitor / Identity</th>
                  <th className="py-3 px-4">Location &amp; Network</th>
                  <th className="py-3 px-4">Device &amp; OS</th>
                  <th className="py-3 px-4 text-center">Engagement</th>
                  <th className="py-3 px-4">Landing &amp; Latest Page</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 light:divide-zinc-200">
                {loading && uniqueVisitors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-zinc-500 light:text-zinc-600">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 light:text-cyan-600 mb-2" />
                      Loading unique visitors directory...
                    </td>
                  </tr>
                ) : uniqueVisitors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-zinc-500 light:text-zinc-600">
                      No unique visitors found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  uniqueVisitors.map((v) => {
                    const hasEmail = Boolean(v.email)
                    const hasPayment = Boolean(v.has_payment_intent || v.total_payment_clicks > 0)

                    return (
                      <tr
                        key={v.id}
                        className={`hover:bg-zinc-900/40 light:hover:bg-zinc-50 transition-colors ${
                          hasPayment ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        {/* Last Seen */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono text-zinc-200 light:text-zinc-800 font-semibold">
                            {formatTimeExact(v.last_seen_at)}
                          </div>
                          <div className="text-[10px] text-zinc-500 light:text-zinc-600 flex items-center gap-1.5 mt-0.5">
                            <span>{formatDateExact(v.last_seen_at)}</span>
                            <span className="text-cyan-400 light:text-cyan-600 font-mono font-medium">
                              • {formatRelativeTime(v.last_seen_at)}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-600 font-mono mt-0.5">
                            First: {formatDateExact(v.first_seen_at)}
                          </div>
                        </td>

                        {/* Visitor / Identity */}
                        <td className="py-3 px-4">
                          {v.tag_name && (
                            <div className="mb-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setTaggingVid(v.visitor_id)
                                  setTagName(v.tag_name || '')
                                  setTagEmail(v.email || '')
                                  setTagNotice(null)
                                  setIsEditingTag(true)
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 light:text-violet-700 border border-violet-500/40 hover:border-violet-400 text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                                title="Click to edit short name tag"
                              >
                                🏷️ {v.tag_name}
                              </button>
                            </div>
                          )}
                          {hasEmail ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 light:text-emerald-700 border border-emerald-800 text-[11px] font-medium">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 light:text-emerald-600" />
                                {v.email}
                              </span>
                              {v.user_id && (
                                <div className="text-[10px] text-zinc-400 light:text-zinc-600 font-mono">
                                  UID: {v.user_id}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 font-mono text-[11px] text-zinc-400 light:text-zinc-600">
                                <span>{v.visitor_id.slice(0, 14)}...</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(v.visitor_id, `vid-${v.id}`)}
                                  className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                                  title="Copy Full Visitor ID"
                                >
                                  {copiedId === `vid-${v.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              <span className="text-[10px] text-zinc-600 block">
                                Anonymous Visitor
                              </span>
                            </div>
                          )}
                          {v.known_emails && v.known_emails.length > 1 && (
                            <div className="mt-1">
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/70 light:bg-amber-100 text-amber-300 light:text-amber-800 border border-amber-800/60 light:border-amber-300 text-[10px] font-medium"
                                title={`Shared browser profile used across accounts: ${v.known_emails.join(', ')}`}
                              >
                                👥 Shared ({v.known_emails.length} accounts)
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Location & Network */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-zinc-200 light:text-zinc-800 font-medium">
                            <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span className="truncate max-w-[150px]">
                              {v.last_city ? `${v.last_city}, ` : ''}{v.last_country || 'Unknown'}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400 light:text-zinc-500 mt-0.5 flex items-center gap-1">
                            <span>{v.last_ip}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(v.last_ip, `ip-${v.id}`)}
                              className="text-zinc-600 hover:text-zinc-400 cursor-pointer"
                              title="Copy IP"
                            >
                              {copiedId === `ip-${v.id}` ? (
                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </div>
                          {v.known_ips && v.known_ips.length > 1 && (
                            <div className="text-[10px] font-mono text-blue-400 light:text-blue-600 mt-0.5" title={`Observed IPs: ${v.known_ips.join(', ')}`}>
                              🛡️ Multi-IP ({v.known_ips.length} IPs)
                            </div>
                          )}
                        </td>

                        {/* Device & Browser */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-zinc-200 light:text-zinc-800">
                            {v.last_device === 'mobile' ? (
                              <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                            )}
                            <span className="font-medium capitalize">{v.last_device}</span>
                            <span className="text-zinc-500">•</span>
                            <span>{v.last_os}</span>
                          </div>
                          <div className="text-[11px] text-zinc-400 light:text-zinc-500 mt-0.5 truncate max-w-[140px]" title={v.last_browser}>
                            {v.last_browser}
                          </div>
                        </td>

                        {/* Engagement */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/80 light:bg-cyan-100 text-cyan-300 light:text-cyan-800 border border-cyan-800/60 light:border-cyan-300 font-mono text-[11px] font-bold">
                              <Eye className="w-3 h-3" />
                              {v.total_page_views} {v.total_page_views === 1 ? 'view' : 'views'}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 light:text-zinc-600">
                              {v.total_events} raw events
                            </span>
                            {hasPayment && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950 light:bg-amber-100 text-amber-300 light:text-amber-800 border border-amber-800 light:border-amber-300 text-[10px] font-bold">
                                <CreditCard className="w-2.5 h-2.5" />
                                Checkout ({v.total_payment_clicks || 1})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Landing & Latest Page */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5 max-w-[180px]">
                            <div className="font-mono text-zinc-200 light:text-zinc-800 truncate text-[11px]" title={v.last_path}>
                              {v.last_path}
                            </div>
                            <div className="text-[10px] text-zinc-500 truncate" title={v.first_referrer}>
                              Ref: {v.first_referrer || 'Direct'}
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tag button */}
                            <button
                              type="button"
                              onClick={() => {
                                setTaggingVid(v.visitor_id)
                                setTagName(v.tag_name || '')
                                setTagEmail(v.email || '')
                                setTagNotice(null)
                                setIsEditingTag(true)
                              }}
                              className="p-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-300 light:text-zinc-700 hover:text-cyan-300 border border-zinc-800 light:border-zinc-200 transition-colors cursor-pointer"
                              title={v.tag_name ? `Edit Tag (${v.tag_name})` : 'Assign short name / tag'}
                            >
                              🏷️
                            </button>

                            {/* View Live Events Stream for this visitor */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVisitorId(v.visitor_id)
                                setViewMode('events')
                                setPage(1)
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 light:text-purple-700 border border-purple-800/80 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Drilldown into this visitor's chronological clickstream"
                            >
                              <Activity className="w-3 h-3 text-purple-400" />
                              <span>Events</span>
                            </button>

                            {/* Ignore Button */}
                            <button
                              type="button"
                              disabled={ignoreBusy}
                              onClick={() => {
                                ignoreTrail({ email: v.email, visitor_id: v.visitor_id, last_ip: v.last_ip })
                              }}
                              className="p-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-rose-950/50 text-zinc-500 hover:text-rose-300 border border-zinc-800 light:border-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
                              title={v.email ? `Never show ${v.email} or this browser again` : 'Never show this browser again'}
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
        ) : (
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
                        {(evt.tag_name || evt.linked?.tag_name) && (
                          <div className="mb-1">
                            <button
                              type="button"
                              onClick={() => {
                                setInspectEvent(evt)
                                setTagName(evt.tag_name || evt.linked?.tag_name || '')
                                setTagEmail(evt.linked?.email || evt.email || '')
                                setTagNotice(null)
                                setIsEditingTag(true)
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 light:text-violet-700 border border-violet-500/40 hover:border-violet-400 text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                              title="Click to edit short name tag"
                            >
                              🏷️ {evt.tag_name || evt.linked?.tag_name}
                            </button>
                          </div>
                        )}
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
                            {evt.linked?.email ? (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/60 light:bg-cyan-50 text-cyan-300 light:text-cyan-700 border border-cyan-800/60 light:border-cyan-300 text-[10px] font-medium"
                                title={evt.linked.manual ? 'Manually tagged browser — mapped by super-admin' : 'Known browser — mapped automatically at login'}
                              >
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                🔗 {evt.linked.email}
                                {evt.linked.manual ? ' · tagged' : ''}
                              </span>
                            ) : !(evt.tag_name || evt.linked?.tag_name) ? (
                              <span className="text-[10px] text-zinc-600 block">
                                Anonymous Visitor
                              </span>
                            ) : null}
                          </div>
                        )}
                        {evt.linked?.known_emails && evt.linked.known_emails.length > 1 && (
                          <div className="mt-1">
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/70 light:bg-amber-100 text-amber-300 light:text-amber-800 border border-amber-800/60 light:border-amber-300 text-[10px] font-medium"
                              title={`Shared browser profile used across multiple accounts: ${evt.linked.known_emails.join(', ')}`}
                            >
                              👥 Shared ({evt.linked.known_emails.length} accounts)
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
                        {evt.linked?.known_ips && evt.linked.known_ips.length > 1 && (
                          <div className="mt-1">
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-950/70 light:bg-blue-100 text-blue-300 light:text-blue-800 border border-blue-800/60 light:border-blue-300 text-[9px] font-medium"
                              title={`Multi-IP / VPN detected (${evt.linked.known_ips.length} IPs): ${evt.linked.known_ips.join(', ')}`}
                            >
                              🛡️ Multi-IP ({evt.linked.known_ips.length})
                            </span>
                          </div>
                        )}
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
                            onClick={() => {
                              setInspectEvent(evt)
                              setTagName(evt.tag_name || evt.linked?.tag_name || '')
                              setTagEmail(evt.linked?.email || evt.email || '')
                              setTagNotice(null)
                              setIsEditingTag(true)
                            }}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                              evt.tag_name || evt.linked?.tag_name
                                ? 'bg-violet-950/40 text-violet-300 light:text-violet-700 border-violet-800/60 light:border-violet-300 hover:bg-violet-900/50'
                                : 'bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-zinc-200 border border-zinc-800 light:border-zinc-200'
                            }`}
                            title="Assign or edit friendly short name tag for this visitor"
                          >
                            <span>🏷️ {evt.tag_name || evt.linked?.tag_name ? 'Edit' : 'Tag'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setInspectEvent(evt)
                              setTagName(evt.tag_name || evt.linked?.tag_name || '')
                              setTagEmail(evt.linked?.email || evt.email || '')
                              setTagNotice(null)
                              setIsEditingTag(false)
                            }}
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
      )}

      {/* Table Footer / Pagination */}
      <div className="p-4 bg-zinc-950 light:bg-white border-t border-zinc-900 light:border-zinc-200 flex items-center justify-between flex-wrap gap-3 text-xs text-zinc-400 light:text-zinc-600">
        <div>
          Showing <strong className="text-white light:text-zinc-900">{viewMode === 'unique_visitors' ? uniqueVisitors.length : events.length}</strong> of{' '}
          <strong className="text-white light:text-zinc-900">{totalRecords.toLocaleString()}</strong> {viewMode === 'unique_visitors' ? 'unique visitors' : 'events'}
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

      {/* 4.5 Standalone Tagging Modal for Directory / Events */}
      {isEditingTag && taggingVid && !inspectEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 light:bg-black/50 backdrop-blur-md animate-in fade-in"
          onClick={() => { setIsEditingTag(false); setTaggingVid(null) }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-[#0d1017] light:bg-white border border-zinc-800 light:border-zinc-200 text-white light:text-zinc-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => { setIsEditingTag(false); setTaggingVid(null) }}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white light:hover:text-zinc-900"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold flex items-center gap-2 mb-1">
              🏷️ Tag Visitor Identity
            </h3>
            <p className="text-xs text-zinc-400 light:text-zinc-600 mb-4">
              Assign a recognizable nickname or link an email to visitor <code className="text-cyan-400 font-mono">{taggingVid.slice(0, 14)}...</code>
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 light:text-zinc-600 block mb-1 font-medium">Short Name / Tag</label>
                <input
                  type="text"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitTag() }}
                  placeholder="e.g. Rohan (Lead), VIP Recruiter, Friend"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-300 text-xs text-zinc-200 light:text-zinc-800 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 light:text-zinc-600 block mb-1 font-medium">Linked Email (Optional)</label>
                <input
                  type="email"
                  value={tagEmail}
                  onChange={(e) => setTagEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitTag() }}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-300 text-xs text-zinc-200 light:text-zinc-800 focus:outline-none focus:border-cyan-500"
                />
              </div>
              {tagNotice && (
                <div className="text-xs text-cyan-400 light:text-cyan-600 font-medium">{tagNotice}</div>
              )}
              <div className="flex items-center justify-between pt-2">
                {tagName || tagEmail ? (
                  <button
                    type="button"
                    onClick={() => removeTag(taggingVid)}
                    disabled={tagBusy}
                    className="text-xs text-rose-400 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Remove Tag
                  </button>
                ) : <span />}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsEditingTag(false); setTaggingVid(null) }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 light:bg-zinc-200 hover:bg-zinc-700 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitTag}
                    disabled={tagBusy}
                    className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {tagBusy ? 'Saving…' : 'Save Tag'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                {(inspectEvent.tag_name || inspectEvent.linked?.tag_name) && (
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 light:text-violet-700 border border-violet-500/40 text-[11px] font-bold">
                      🏷️ {inspectEvent.tag_name || inspectEvent.linked?.tag_name}
                    </span>
                  </div>
                )}
                <div className={`text-xs font-medium mt-1 ${inspectEvent.email ? 'text-emerald-400 light:text-emerald-600' : 'text-zinc-300 light:text-zinc-700'}`}>
                  {inspectEvent.email || (inspectEvent.linked?.email ? `🔗 ${inspectEvent.linked.email}` : 'Anonymous (Unauthenticated)')}
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

            {/* Multi-Account / Shared System Alert */}
            {inspectEvent.linked?.known_emails && inspectEvent.linked.known_emails.length > 1 && (
              <div className="p-3.5 rounded-xl bg-amber-950/40 light:bg-amber-50 border border-amber-800/60 light:border-amber-300 mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm">👥</span>
                  <span className="text-xs font-bold text-amber-300 light:text-amber-800 uppercase tracking-wide">
                    Shared System / Multi-Account Detected
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-200 light:bg-amber-200 light:text-amber-900 font-mono font-bold">
                    {inspectEvent.linked.known_emails.length} accounts
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 light:text-zinc-700 mb-2">
                  Multiple distinct user accounts have logged in from this identical browser profile:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {inspectEvent.linked.known_emails.map((em) => (
                    <span
                      key={em}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium ${
                        em.toLowerCase() === (inspectEvent.email || '').toLowerCase()
                          ? 'bg-amber-500/20 text-amber-300 light:text-amber-900 border border-amber-500/50 font-bold'
                          : 'bg-zinc-900 light:bg-zinc-200 text-zinc-300 light:text-zinc-800 border border-zinc-800 light:border-zinc-300'
                      }`}
                    >
                      {em.toLowerCase() === (inspectEvent.email || '').toLowerCase() && <span>👉 (This Event)</span>}
                      {em}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* VPN / Dynamic IP / Multi-Location Alert */}
            {inspectEvent.linked?.known_ips && inspectEvent.linked.known_ips.length > 1 && (
              <div className="p-3.5 rounded-xl bg-blue-950/40 light:bg-blue-50 border border-blue-800/60 light:border-blue-300 mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm">🛡️</span>
                  <span className="text-xs font-bold text-blue-300 light:text-blue-800 uppercase tracking-wide">
                    VPN / Dynamic IP / Multi-Location Detected
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-200 light:bg-blue-200 light:text-blue-900 font-mono font-bold">
                    {inspectEvent.linked.known_ips.length} IPs recorded
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 light:text-zinc-700 mb-2">
                  This visitor&apos;s persistent browser session has routed through multiple networks or VPN servers:
                </p>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {inspectEvent.linked.known_ips.map((ip) => (
                    <span
                      key={ip}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono ${
                        ip === inspectEvent.ip_address
                          ? 'bg-blue-500/20 text-blue-300 light:text-blue-900 border border-blue-500/50 font-bold'
                          : 'bg-zinc-900 light:bg-zinc-200 text-zinc-400 light:text-zinc-700 border border-zinc-800 light:border-zinc-300'
                      }`}
                    >
                      {ip === inspectEvent.ip_address && <span>📍 Current:</span>}
                      {ip}
                    </span>
                  ))}
                </div>
                {inspectEvent.linked.known_countries && inspectEvent.linked.known_countries.length > 0 && (
                  <div className="text-[10px] text-zinc-400 light:text-zinc-600">
                    Locations observed: {inspectEvent.linked.known_countries.join(' • ')}
                  </div>
                )}
              </div>
            )}

            {/* Identity: stored, linked, or taggable with Short Name and/or Email */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500 light:text-zinc-600 uppercase font-semibold">
                  Browser Identity &amp; Short Name Tag
                </span>
                {!isEditingTag && (inspectEvent.tag_name || inspectEvent.linked?.tag_name || inspectEvent.linked?.manual) ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTagName(inspectEvent.tag_name || inspectEvent.linked?.tag_name || '')
                        setTagEmail(inspectEvent.linked?.email || '')
                        setIsEditingTag(true)
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium"
                    >
                      Edit Tag
                    </button>
                    <button
                      type="button"
                      onClick={removeTag}
                      disabled={tagBusy}
                      className="text-[11px] text-zinc-500 hover:text-rose-400 cursor-pointer disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ) : !isEditingTag && (
                  <span className="text-[10px] text-zinc-500">Assign recognizable nickname</span>
                )}
              </div>

              {!isEditingTag && (inspectEvent.tag_name || inspectEvent.linked?.tag_name || inspectEvent.linked?.email) ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {(inspectEvent.tag_name || inspectEvent.linked?.tag_name) && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 light:text-violet-700 border border-violet-500/30 text-xs font-bold">
                        🏷️ {inspectEvent.tag_name || inspectEvent.linked?.tag_name}
                      </span>
                    )}
                    {inspectEvent.linked?.email && (
                      <span className="inline-flex items-center gap-1 text-xs text-cyan-300 light:text-cyan-700 font-mono">
                        🔗 {inspectEvent.linked.email}
                      </span>
                    )}
                    {inspectEvent.email && (
                      <span className="text-[11px] text-emerald-400 light:text-emerald-600 font-medium">
                        ({inspectEvent.email})
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    This visitor is now easily recognized by this short name tag across the dashboard.
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-400 light:text-zinc-600 block mb-1 font-medium">
                        Short Name / Tag <span className="text-zinc-500 font-normal">(e.g. Rohan, Recruiter A, VIP Friend)</span>
                      </label>
                      <input
                        type="text"
                        value={tagName}
                        onChange={(e) => setTagName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') submitTag() }}
                        placeholder="e.g. Rohan (Lead)"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black light:bg-white border border-zinc-800 light:border-zinc-300 text-xs text-zinc-200 light:text-zinc-800 placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 light:text-zinc-600 block mb-1 font-medium">
                        Link Email <span className="text-zinc-500 font-normal">(Optional — if known)</span>
                      </label>
                      <input
                        type="email"
                        value={tagEmail}
                        onChange={(e) => setTagEmail(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') submitTag() }}
                        placeholder={inspectEvent.email || "email@example.com"}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black light:bg-white border border-zinc-800 light:border-zinc-300 text-xs text-zinc-200 light:text-zinc-800 placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-[11px] text-zinc-500 light:text-zinc-600">
                      Tag any unregistered visitor or registered user with a short name for instant recognition.
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isEditingTag && (
                        <button
                          type="button"
                          onClick={() => setIsEditingTag(false)}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={submitTag}
                        disabled={tagBusy}
                        className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {tagBusy ? 'Saving…' : 'Save Tag'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {tagNotice && (
                <div className="text-[11px] text-cyan-400 light:text-cyan-600 mt-2 font-medium">{tagNotice}</div>
              )}
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
