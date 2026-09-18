'use client'

import React, { useState, useEffect } from 'react'
import {
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Trash2,
  Sparkles,
  RefreshCw,
  Search,
  MessageSquare,
  AlertCircle,
  Building2,
  Mail,
  User,
  ExternalLink
} from 'lucide-react'

interface ReviewDoc {
  id: string
  user_id: string
  user_email: string
  user_name: string
  user_avatar?: string
  role_title?: string
  company?: string
  rating: number
  satisfaction_level?: string
  review_text: string
  verified: boolean
  featured: boolean
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  approved_at?: string | null
}

interface ReviewMetrics {
  total: number
  pending: number
  approved: number
  rejected: number
  featured: number
  avg_rating: number
}

interface ReviewsTabProps {
  getAdminHeaders: () => Record<string, string>
}

export default function ReviewsTab({ getAdminHeaders }: ReviewsTabProps) {
  const [reviews, setReviews] = useState<ReviewDoc[]>([])
  const [metrics, setMetrics] = useState<ReviewMetrics>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    featured: 0,
    avg_rating: 4.8
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text })
    setTimeout(() => setToastMessage(null), 3500)
  }

  const fetchAdminReviews = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reviews', {
        headers: getAdminHeaders()
      })
      if (!res.ok) throw new Error('Failed to fetch reviews')
      const data = await res.json()
      setReviews(data.reviews || [])
      if (data.metrics) setMetrics(data.metrics)
    } catch (err: any) {
      showToast(err.message || 'Error loading reviews', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminReviews()
  }, [])

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    setActionLoadingId(id)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminHeaders()
        },
        body: JSON.stringify({ id, status: newStatus })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Update failed')

      // Optimistically update
      setReviews(prev =>
        prev.map(r => (r.id === id ? { ...r, status: newStatus } : r))
      )
      showToast(
        newStatus === 'approved'
          ? '✓ Review approved & published to homepage!'
          : newStatus === 'rejected'
          ? 'Review rejected.'
          : 'Review marked pending.'
      )
      // Refresh metrics
      fetchAdminReviews()
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    setActionLoadingId(id)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminHeaders()
        },
        body: JSON.stringify({ id, featured: !currentFeatured })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Update failed')

      setReviews(prev =>
        prev.map(r => (r.id === id ? { ...r, featured: !currentFeatured } : r))
      )
      showToast(!currentFeatured ? '★ Pinned to hero carousel!' : 'Unpinned from hero.')
      fetchAdminReviews()
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this candidate review?')) return

    setActionLoadingId(id)
    try {
      const res = await fetch(`/api/admin/reviews?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Delete failed')

      setReviews(prev => prev.filter(r => r.id !== id))
      showToast('Review permanently removed.')
      fetchAdminReviews()
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  const filteredReviews = reviews.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        r.user_name.toLowerCase().includes(q) ||
        r.user_email.toLowerCase().includes(q) ||
        (r.role_title || '').toLowerCase().includes(q) ||
        (r.company || '').toLowerCase().includes(q) ||
        r.review_text.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-5 border ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-800 text-emerald-200'
              : 'bg-red-950/95 border-red-800 text-red-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
          <div className="text-[11px] font-mono text-zinc-400 uppercase">Total Reviews</div>
          <div className="text-2xl font-bold text-white mt-1">{metrics.total}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Candidate submissions</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40">
          <div className="text-[11px] font-mono text-amber-300 uppercase flex items-center justify-between">
            <span>Pending Verification</span>
            {metrics.pending > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{metrics.pending}</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">Require admin approval</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
          <div className="text-[11px] font-mono text-emerald-300 uppercase">Approved &amp; Live</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{metrics.approved}</div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Visible on homepage</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
          <div className="text-[11px] font-mono text-zinc-400 uppercase">Avg Rating</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 flex items-center gap-1">
            <Star className="w-5 h-5 fill-amber-400" />
            <span>{metrics.avg_rating.toFixed(1)}</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">5-star scale</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
          <div className="text-[11px] font-mono text-cyan-300 uppercase">Featured</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">{metrics.featured}</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Hero carousel pinned</div>
        </div>
      </div>

      {/* Control Bar: Filter Tabs, Search & Refresh */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-zinc-900">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
              statusFilter === 'all'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800'
            }`}
          >
            All ({metrics.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Pending ({metrics.pending})</span>
            {metrics.pending > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
              statusFilter === 'approved'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800'
            }`}
          >
            Approved ({metrics.approved})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
              statusFilter === 'rejected'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-semibold'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800'
            }`}
          >
            Rejected ({metrics.rejected})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search candidate, email, role..."
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
            />
          </div>
          <button
            type="button"
            onClick={fetchAdminReviews}
            disabled={loading}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            title="Refresh reviews"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Reviews Cards List */}
      {loading ? (
        <div className="py-12 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading candidate reviews &amp; feedback...</span>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-2">
          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="text-sm font-semibold text-white">No Reviews Found</div>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {searchQuery
              ? `No reviews match "${searchQuery}".`
              : statusFilter === 'pending'
              ? 'All caught up! There are no candidate reviews awaiting approval.'
              : 'No candidate reviews recorded in this view.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredReviews.map(r => {
            const isActing = actionLoadingId === r.id
            return (
              <div
                key={r.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  r.status === 'pending'
                    ? 'bg-amber-950/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : r.status === 'approved'
                    ? 'bg-[#0a0a0c] border-zinc-800/90 hover:border-zinc-700'
                    : 'bg-zinc-950/40 border-zinc-900 opacity-70'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Candidate Info & Header */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="relative shrink-0">
                      {r.user_avatar ? (
                        <img
                          src={r.user_avatar}
                          alt={r.user_name}
                          className="w-11 h-11 rounded-xl object-cover border border-zinc-700 shadow-sm"
                          onError={e => {
                            ;(e.target as HTMLElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                          {r.user_name
                            ? r.user_name
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()
                            : 'JD'}
                        </div>
                      )}
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 border-2 border-black" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{r.user_name}</span>
                        {r.user_email && (
                          <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                            <Mail className="w-3 h-3 text-zinc-500" />
                            {r.user_email}
                          </span>
                        )}
                        {/* Status Badge */}
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            r.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              : r.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-950/80 text-red-300 border border-red-800'
                          }`}
                        >
                          {r.status === 'pending'
                            ? 'Pending Verification'
                            : r.status === 'approved'
                            ? 'Approved · Live'
                            : 'Rejected'}
                        </span>

                        {r.featured && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1 font-semibold">
                            <Sparkles className="w-2.5 h-2.5" /> HERO PINNED
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-zinc-400 flex items-center gap-2 flex-wrap">
                        <span>{r.role_title || 'Software Professional'}</span>
                        {r.company && (
                          <>
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-300 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-zinc-500" />
                              {r.company}
                            </span>
                          </>
                        )}
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500 font-mono text-[11px]">
                          Submitted {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Star Rating & Satisfaction Level */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <div className="flex items-center text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < Math.round(r.rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-300">{Number(r.rating).toFixed(1)}★</span>
                        {r.satisfaction_level && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-300">
                            {r.satisfaction_level}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                    {r.status !== 'approved' && (
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleUpdateStatus(r.id, 'approved')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                        title="Approve and publish to homepage"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    {r.status === 'approved' && (
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleUpdateStatus(r.id, 'rejected')}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-red-300 border border-zinc-800 transition-colors text-xs cursor-pointer disabled:opacity-50"
                        title="Unpublish from homepage"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Unpublish</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => handleToggleFeatured(r.id, r.featured)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer text-xs disabled:opacity-50 ${
                        r.featured
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
                      }`}
                      title={r.featured ? 'Unpin from hero' : 'Pin to hero carousel'}
                    >
                      <Star className={`w-3.5 h-3.5 ${r.featured ? 'fill-amber-400' : ''}`} />
                    </button>

                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition-colors cursor-pointer text-xs disabled:opacity-50"
                      title="Permanently delete review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Written Review Quote */}
                <div className="mt-3 p-3 rounded-xl bg-black/60 border border-zinc-900 text-xs text-zinc-200 leading-relaxed font-sans italic">
                  &ldquo;{r.review_text}&rdquo;
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
