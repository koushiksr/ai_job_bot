'use client'

import React from 'react'
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Mail,
  Search,
  Send,
  Shield,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import JobFluxLogo from '@/components/JobFluxLogo'
import { APP_CONFIG } from '@/config/appConfig'
import { CandidateUser, OffersData } from '../../../types'

interface OfferCampaignDesignerProps {
  offersData: OffersData
  selectedPresetId: string
  handleSelectPreset: (preset: any) => void
  targetType: 'single' | 'multiple' | 'bulk_unsubscribed' | 'all_users'
  setTargetType: (type: 'single' | 'multiple' | 'bulk_unsubscribed' | 'all_users') => void
  targetEmail: string
  setTargetEmail: (email: string) => void
  usersList: CandidateUser[]
  forceOverride: boolean
  setForceOverride: (override: boolean) => void
  selectedCandidates: string[]
  setSelectedCandidates: React.Dispatch<React.SetStateAction<string[]>>
  candidateFilterQuery: string
  setCandidateFilterQuery: (query: string) => void
  candidatePickerPage: number
  setCandidatePickerPage: React.Dispatch<React.SetStateAction<number>>
  customExtraEmails: string
  setCustomExtraEmails: (emails: string) => void
  offerTitle: string
  setOfferTitle: (title: string) => void
  discountBadge: string
  setDiscountBadge: (badge: string) => void
  promoCode: string
  setPromoCode: (code: string) => void
  originalPrice: string
  setOriginalPrice: (price: string) => void
  discountedPrice: string
  setDiscountedPrice: (price: string) => void
  customMessage: string
  setCustomMessage: (msg: string) => void
  validityHours: number
  setValidityHours: (hours: number) => void
  offersCollapsedDesigner: boolean
  toggleOffersDesigner: () => void
  offersCollapsedPreview: boolean
  toggleOffersPreview: () => void
  setIsConfirmOfferModalOpen: (open: boolean) => void
}

export const OfferCampaignDesigner: React.FC<OfferCampaignDesignerProps> = ({
  offersData,
  selectedPresetId,
  handleSelectPreset,
  targetType,
  setTargetType,
  targetEmail,
  setTargetEmail,
  usersList,
  forceOverride,
  setForceOverride,
  selectedCandidates,
  setSelectedCandidates,
  candidateFilterQuery,
  setCandidateFilterQuery,
  candidatePickerPage,
  setCandidatePickerPage,
  customExtraEmails,
  setCustomExtraEmails,
  offerTitle,
  setOfferTitle,
  discountBadge,
  setDiscountBadge,
  promoCode,
  setPromoCode,
  originalPrice,
  setOriginalPrice,
  discountedPrice,
  setDiscountedPrice,
  customMessage,
  setCustomMessage,
  validityHours,
  setValidityHours,
  offersCollapsedDesigner,
  toggleOffersDesigner,
  offersCollapsedPreview,
  toggleOffersPreview,
  setIsConfirmOfferModalOpen,
}) => {
  const [presetFilter, setPresetFilter] = React.useState<'all' | 'org_member' | 'individual'>('all')
  const [showDetails, setShowDetails] = React.useState(false)
  const [showCandidatePicker, setShowCandidatePicker] = React.useState(false)

  // Detect if selected email is an org member
  const singleTargetCandidate = React.useMemo(() => {
    if (targetType !== 'single') return null
    const clean = (targetEmail || '').trim().toLowerCase()
    return usersList.find(u => (u.email || u.user_id || '').toLowerCase() === clean)
  }, [targetType, targetEmail, usersList])

  const isTargetOrgMember = Boolean(
    singleTargetCandidate?.org_id ||
    singleTargetCandidate?.enterprise_org_id ||
    singleTargetCandidate?.enterprise_role === 'member' ||
    (singleTargetCandidate?.plan || '').toLowerCase() === 'enterprise' ||
    (singleTargetCandidate?.plan || '').toLowerCase() === 'org_pro'
  )

  React.useEffect(() => {
    if (isTargetOrgMember) setPresetFilter('org_member')
  }, [isTargetOrgMember, targetEmail])

  const filteredPresets = React.useMemo(() => {
    if (presetFilter === 'org_member')
      return offersData.presets.filter((p: any) => p.category === 'org_member' || p.id?.includes('org_pro') || p.promoCode?.includes('ORGPRO'))
    if (presetFilter === 'individual')
      return offersData.presets.filter((p: any) => p.category !== 'org_member' && !p.id?.includes('org_pro') && !p.promoCode?.includes('ORGPRO'))
    return offersData.presets
  }, [offersData.presets, presetFilter])

  const targetLabel = (() => {
    if (targetType === 'single') return targetEmail || 'Single candidate'
    if (targetType === 'multiple') return `${selectedCandidates.length} selected`
    if (targetType === 'bulk_unsubscribed') return `${offersData.metrics.unsubscribed_count} unsubscribed`
    return `${offersData.metrics.total_candidates} all users`
  })()

  return (
    <div className="rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 overflow-hidden">
      {/* ── Header bar ─────────────────────────────────────────────── */}
      <div
        onClick={toggleOffersDesigner}
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-zinc-900/40 light:hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-bold text-white light:text-zinc-900 uppercase tracking-wider">Campaign Designer</span>
          {selectedPresetId && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {promoCode} · {discountBadge} · {discountedPrice}
            </span>
          )}
          {targetEmail && targetType === 'single' && (
            <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">→ {targetEmail}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); toggleOffersPreview() }}
            className="px-2 py-1 rounded-md text-[10px] font-medium bg-zinc-900 light:bg-zinc-100 border border-zinc-700 light:border-zinc-300 text-zinc-400 light:text-zinc-600 hover:text-white cursor-pointer transition-colors"
          >
            {offersCollapsedPreview ? 'Show preview' : 'Hide preview'}
          </button>
          {offersCollapsedDesigner
            ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            : <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
          }
        </div>
      </div>

      {!offersCollapsedDesigner && (
        <div className="border-t border-zinc-800 light:border-zinc-200">
          <div className={`grid ${offersCollapsedPreview ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} divide-y lg:divide-y-0 lg:divide-x divide-zinc-800 light:divide-zinc-200`}>

            {/* ── Left: Form ────────────────────────────────────────── */}
            <div className="p-4 space-y-4">

              {/* STEP 1: Preset chips */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-zinc-400 light:text-zinc-600 uppercase tracking-wider">Preset</span>
                  <div className="flex gap-1">
                    {(['all', 'org_member', 'individual'] as const).map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setPresetFilter(f)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                          presetFilter === f
                            ? f === 'org_member'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-zinc-700 text-white'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {f === 'all' ? `All (${offersData.presets.length})` : f === 'org_member' ? `Org (${offersData.presets.filter((p: any) => p.category === 'org_member' || p.id?.includes('org_pro') || p.promoCode?.includes('ORGPRO')).length})` : `Ind (${offersData.presets.filter((p: any) => p.category !== 'org_member' && !p.id?.includes('org_pro') && !p.promoCode?.includes('ORGPRO')).length})`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {filteredPresets.map((p: any) => {
                    const isOrg = p.category === 'org_member' || p.id?.includes('org_pro') || p.promoCode?.includes('ORGPRO')
                    const isActive = selectedPresetId === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer border whitespace-nowrap ${
                          isActive
                            ? isOrg
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                              : 'bg-amber-500 border-amber-400 text-black shadow-sm'
                            : isOrg
                              ? 'bg-indigo-950/30 border-indigo-800/50 text-indigo-400 hover:border-indigo-600'
                              : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'
                        }`}
                      >
                        <span className="font-bold">{p.discountBadge}</span>
                        <span className="opacity-70 ml-1">{p.discountedPrice}</span>
                      </button>
                    )
                  })}
                </div>

                {selectedPresetId && (
                  <div className="mt-2 text-[10px] text-zinc-500 font-mono">
                    {promoCode} · {offerTitle}
                  </div>
                )}
              </div>

              {/* STEP 2: Target */}
              <div>
                <span className="block text-[11px] font-semibold text-zinc-400 light:text-zinc-600 uppercase tracking-wider mb-2">Target</span>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(
                    [
                      { id: 'single', label: 'Single', icon: null },
                      { id: 'multiple', label: `Multiple (${selectedCandidates.length})`, icon: null },
                      { id: 'bulk_unsubscribed', label: `Unsubscribed (${offersData.metrics.unsubscribed_count})`, icon: null },
                      { id: 'all_users', label: `All (${offersData.metrics.total_candidates})`, icon: null },
                    ] as const
                  ).map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setTargetType(opt.id)
                        if (opt.id === 'multiple') setShowCandidatePicker(true)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                        targetType === opt.id
                          ? 'bg-sky-600 border-sky-500 text-white'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Single email input */}
                {targetType === 'single' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={targetEmail}
                        onChange={e => setTargetEmail(e.target.value)}
                        placeholder="candidate@example.com"
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-amber-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setTargetEmail('koushiksrmedala@gmail.com')}
                        className="px-2.5 py-1.5 text-[10px] rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 cursor-pointer whitespace-nowrap"
                      >
                        Me
                      </button>
                    </div>
                    {singleTargetCandidate?.offer_eligibility && (() => {
                      const el = singleTargetCandidate.offer_eligibility
                      return (
                        <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[11px] border ${
                          el.eligible
                            ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400'
                            : 'bg-amber-950/30 border-amber-800/40 text-amber-400'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-3 h-3 shrink-0" />
                            <span>{el.badge}: {el.reason}</span>
                          </div>
                          {!el.eligible && (
                            <label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-white shrink-0">
                              <input
                                type="checkbox"
                                checked={forceOverride}
                                onChange={e => setForceOverride(e.target.checked)}
                                className="rounded text-amber-500"
                              />
                              Override
                            </label>
                          )}
                        </div>
                      )
                    })()}
                    {isTargetOrgMember && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-[11px] text-indigo-400">
                        <Building2 className="w-3 h-3" />
                        <span>Org member · {singleTargetCandidate?.org_name || 'Enterprise'}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Multiple candidate picker */}
                {targetType === 'multiple' && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowCandidatePicker(v => !v)}
                      className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                    >
                      {showCandidatePicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {showCandidatePicker ? 'Hide' : 'Pick'} candidates
                      {selectedCandidates.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded bg-sky-600/20 text-sky-300 text-[10px] font-mono">{selectedCandidates.length} selected</span>
                      )}
                    </button>

                    {showCandidatePicker && (
                      <div className="space-y-2">
                        <div className="flex gap-1.5">
                          <div className="relative flex-1">
                            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                              type="text"
                              value={candidateFilterQuery}
                              onChange={e => setCandidateFilterQuery(e.target.value)}
                              placeholder="Filter by name / email…"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-sky-500 outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const pool = [...usersList]
                              APP_CONFIG.defaultTestRecipients.forEach(testEmail => {
                                if (!pool.some(u => (u.email || '').toLowerCase() === testEmail.toLowerCase()))
                                  pool.push({ name: testEmail.split('@')[0], email: testEmail, user_id: testEmail, plan: 'trial' })
                              })
                              const q = candidateFilterQuery.toLowerCase()
                              const matched = pool
                                .filter(u => { const n = (u.name || '').toLowerCase(); const e = (u.email || u.user_id || '').toLowerCase(); return !q || n.includes(q) || e.includes(q) })
                                .map(u => (u.email || (u.user_id?.includes('@') ? u.user_id : '')).toLowerCase().trim())
                                .filter(e => e && e.includes('@'))
                              setSelectedCandidates(Array.from(new Set([...selectedCandidates, ...matched])))
                            }}
                            className="px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] cursor-pointer whitespace-nowrap"
                          >+ All</button>
                          {selectedCandidates.length > 0 && (
                            <button type="button" onClick={() => setSelectedCandidates([])} className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 cursor-pointer">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <div className="max-h-44 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 divide-y divide-zinc-900">
                          {(() => {
                            const pool = [...usersList]
                            APP_CONFIG.defaultTestRecipients.forEach(testEmail => {
                              if (!pool.some(u => (u.email || '').toLowerCase() === testEmail.toLowerCase()))
                                pool.push({ name: testEmail.split('@')[0], email: testEmail, user_id: testEmail, plan: 'trial' })
                            })
                            const q = candidateFilterQuery.toLowerCase()
                            const filtered = pool.filter(u => {
                              const n = (u.name || '').toLowerCase()
                              const e = (u.email || u.user_id || '').toLowerCase()
                              return !q || n.includes(q) || e.includes(q)
                            })
                            const pages = Math.max(1, Math.ceil(filtered.length / 10))
                            const paged = filtered.slice((candidatePickerPage - 1) * 10, candidatePickerPage * 10)

                            return (
                              <>
                                {paged.map(u => {
                                  const email = (u.email || (u.user_id?.includes('@') ? u.user_id : '')).toLowerCase().trim()
                                  if (!email) return null
                                  const checked = selectedCandidates.includes(email)
                                  return (
                                    <div
                                      key={email}
                                      onClick={() => setSelectedCandidates(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email])}
                                      className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${checked ? 'bg-sky-500/10' : 'hover:bg-zinc-900'}`}
                                    >
                                      <input type="checkbox" checked={checked} onChange={() => {}} className="rounded text-sky-500 cursor-pointer shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <div className="text-xs font-medium text-white truncate">{u.name || email.split('@')[0]}</div>
                                        <div className="text-[10px] text-zinc-500 font-mono truncate">{email}</div>
                                      </div>
                                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                                        (u.org_id || u.enterprise_org_id) ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-800 text-zinc-500'
                                      }`}>{u.org_name || u.plan || 'free'}</span>
                                    </div>
                                  )
                                })}
                                {pages > 1 && (
                                  <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-zinc-500 border-t border-zinc-800">
                                    <button type="button" disabled={candidatePickerPage <= 1} onClick={e => { e.stopPropagation(); setCandidatePickerPage(p => Math.max(1, p - 1)) }} className="disabled:opacity-40 cursor-pointer hover:text-white">← Prev</button>
                                    <span>{candidatePickerPage} / {pages}</span>
                                    <button type="button" disabled={candidatePickerPage >= pages} onClick={e => { e.stopPropagation(); setCandidatePickerPage(p => Math.min(pages, p + 1)) }} className="disabled:opacity-40 cursor-pointer hover:text-white">Next →</button>
                                  </div>
                                )}
                              </>
                            )
                          })()}
                        </div>

                        <input
                          type="text"
                          value={customExtraEmails}
                          onChange={e => setCustomExtraEmails(e.target.value)}
                          placeholder="Extra emails (comma-separated)"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-sky-500 outline-none font-mono"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* STEP 3: Customize (collapsed by default) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowDetails(v => !v)}
                  className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white cursor-pointer mb-2"
                >
                  {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span className="uppercase tracking-wider font-semibold">Customize details</span>
                  <span className="text-zinc-600">— auto-filled from preset</span>
                </button>

                {showDetails && (
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      value={offerTitle}
                      onChange={e => setOfferTitle(e.target.value)}
                      placeholder="Offer title"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-amber-500 outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={discountBadge}
                        onChange={e => setDiscountBadge(e.target.value)}
                        placeholder="Badge e.g. 90% OFF"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-amber-400 font-bold placeholder-zinc-600 focus:border-amber-500 outline-none"
                      />
                      <input
                        type="text"
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="PROMO CODE"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-sky-400 font-mono font-bold placeholder-zinc-600 focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={originalPrice}
                        onChange={e => setOriginalPrice(e.target.value)}
                        placeholder="Original price"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-400 placeholder-zinc-600 focus:border-amber-500 outline-none"
                      />
                      <input
                        type="text"
                        value={discountedPrice}
                        onChange={e => setDiscountedPrice(e.target.value)}
                        placeholder="Discounted price"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-bold placeholder-zinc-600 focus:border-amber-500 outline-none"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={customMessage}
                      onChange={e => setCustomMessage(e.target.value)}
                      placeholder="Custom pitch message…"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:border-amber-500 outline-none resize-none"
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {[{ h: 24, l: '24h' }, { h: 48, l: '48h' }, { h: 72, l: '3d' }, { h: 168, l: '7d' }].map(opt => (
                        <button
                          key={opt.h}
                          type="button"
                          onClick={() => setValidityHours(opt.h)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-mono border cursor-pointer transition-all ${
                            validityHours === opt.h
                              ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {opt.l}
                        </button>
                      ))}
                      <span className="text-[10px] text-zinc-600 flex items-center font-mono">expires in {validityHours}h</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Send button */}
              <button
                type="button"
                onClick={() => setIsConfirmOfferModalOpen(true)}
                disabled={!selectedPresetId}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                Review &amp; Dispatch → {targetLabel}
              </button>
            </div>

            {/* ── Right: Live email preview ─────────────────────────── */}
            {!offersCollapsedPreview && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="font-semibold uppercase tracking-wider">Live Preview</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleOffersPreview}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Hide
                  </button>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden text-xs">
                  {/* Email meta */}
                  <div className="px-4 py-2.5 border-b border-zinc-800 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>From: <strong className="text-zinc-200">JobFlux AI</strong> &lt;technohmsit@gmail.com&gt;</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">Verified</span>
                    </div>
                    <div className="text-zinc-400">
                      Subject: <span className="text-white font-semibold">⚡ {offerTitle || '…'} [Code: {promoCode || '…'}]</span>
                    </div>
                  </div>

                  {/* Email body */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <JobFluxLogo size="sm" />
                        <span className="font-bold text-white">JobFlux AI</span>
                      </div>
                      {discountBadge && (
                        <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                          {discountBadge}
                        </span>
                      )}
                    </div>

                    <div>
                      <h5 className="text-sm font-bold text-white">{offerTitle || 'Offer title…'}</h5>
                      <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                        Hi <strong className="text-zinc-300">{targetType === 'single' && targetEmail ? targetEmail.split('@')[0] : 'Candidate'}</strong>,{' '}
                        {customMessage || 'Custom pitch message will appear here.'}
                      </p>
                    </div>

                    <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 text-center space-y-1.5">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block">Special Upgrade Price</span>
                      <div className="flex items-center justify-center gap-2">
                        {originalPrice && <span className="text-xs line-through text-zinc-600">{originalPrice}</span>}
                        <span className="text-xl font-black text-amber-400">{discountedPrice || '₹??'}</span>
                      </div>
                      {promoCode && (
                        <span className="inline-block text-[11px] font-mono font-bold bg-black px-3 py-1 rounded border border-amber-500/30 text-amber-300 mt-1">
                          PROMO CODE: {promoCode}
                        </span>
                      )}
                    </div>

                    <div className="text-center">
                      <div className="inline-block py-2 px-6 rounded-lg bg-white text-black font-bold text-xs shadow">
                        Claim {discountBadge || 'offer'} →
                      </div>
                    </div>

                    <p className="text-[10px] text-zinc-600 text-center border-t border-zinc-900 pt-3">
                      Autonomous Career &amp; Recruitment Intelligence · You received this exclusive upgrade invitation from JobFlux Controller.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
