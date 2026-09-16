'use client'

import React from 'react'
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Eye,
  Mail,
  Search,
  Send,
  Shield,
  Sparkles,
  Users
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
  return (
    <div className="space-y-4">
      <div 
        onClick={toggleOffersDesigner}
        className="p-4 rounded-2xl bg-[#09090b] hover:border-zinc-700 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg cursor-pointer select-none transition-all"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 flex-wrap">
              <span>Campaign Designer &amp; Live Email Preview</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-900 text-amber-300 border border-zinc-750">
                Code: {promoCode} ({discountBadge})
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Audience: <strong className="text-zinc-200 capitalize">{targetType.replace('_', ' ')}</strong> &bull; Validity: <strong className="text-zinc-200">{validityHours}h</strong> &bull; Hero Price: <strong className="text-emerald-400 font-mono">{discountedPrice}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleOffersPreview()
            }}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title={offersCollapsedPreview ? 'Show email preview column' : 'Hide preview to expand form width'}
          >
            <Eye className="w-3.5 h-3.5 text-zinc-400" />
            <span>{offersCollapsedPreview ? 'Show Preview' : 'Hide Preview'}</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleOffersDesigner()
            }}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            {offersCollapsedDesigner ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Expand Designer</span>
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

      {!offersCollapsedDesigner && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Settings */}
          <div className={`${offersCollapsedPreview ? 'lg:col-span-12' : 'lg:col-span-7'} space-y-5 p-5 rounded-2xl bg-[#09090b] border border-zinc-800`}>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>1. Select Offer Preset</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {offersData.presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPresetId === p.id
                        ? 'bg-zinc-800/90 border-amber-500/60 ring-1 ring-amber-500/40 text-white'
                        : 'bg-black/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    <span className="block text-[11px] font-bold text-amber-400 mb-1">{p.discountBadge}</span>
                    <span className="block text-xs font-semibold text-white truncate">{p.name}</span>
                    <span className="block text-[11px] font-mono text-zinc-400 mt-1">{p.discountedPrice}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>2. Target Audience &amp; Recipients</span>
              </h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black border border-zinc-800/80 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === 'single'}
                    onChange={() => setTargetType('single')}
                    className="text-amber-500 focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-white">Single Candidate Target</span>
                    <span className="block text-[11px] text-zinc-500">Send tailored offer to a specific candidate</span>
                  </div>
                </label>

                {targetType === 'single' && (
                  <div className="pl-6 space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={targetEmail}
                        onChange={(e) => setTargetEmail(e.target.value)}
                        placeholder="candidate@example.com"
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-amber-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setTargetEmail('koushiksrmedala@gmail.com')}
                        className="px-2.5 py-2 text-[11px] rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 whitespace-nowrap cursor-pointer font-medium"
                      >
                        Set to koushiksrmedala@gmail.com
                      </button>
                    </div>

                    {(() => {
                      const cleanTarget = (targetEmail || '').trim().toLowerCase()
                      const matched = usersList.find(u => (u.email || u.user_id || '').toLowerCase() === cleanTarget)
                      if (matched?.offer_eligibility) {
                        const el = matched.offer_eligibility
                        return (
                          <div className={`p-2.5 rounded-lg text-xs border flex items-center justify-between ${
                            el.eligible
                              ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                              : 'bg-amber-950/40 border-amber-800/40 text-amber-300'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Shield className="w-3.5 h-3.5 shrink-0" />
                              <span><strong>{el.badge}:</strong> {el.reason}</span>
                            </div>
                            {!el.eligible && (
                              <label className="flex items-center gap-1 text-[10px] shrink-0 font-bold cursor-pointer text-white ml-2 bg-black/60 px-2 py-1 rounded border border-amber-500/40">
                                <input
                                  type="checkbox"
                                  checked={forceOverride}
                                  onChange={(e) => setForceOverride(e.target.checked)}
                                  className="rounded text-amber-500"
                                />
                                <span>Force Override</span>
                              </label>
                            )}
                          </div>
                        )
                      }
                      return null
                    })()}
                  </div>
                )}

                {/* Option 2: Select Multiple Candidates */}
                <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black border border-zinc-800/80 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === 'multiple'}
                    onChange={() => setTargetType('multiple')}
                    className="text-amber-500 focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">Select Multiple Specific Candidates</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold">
                        {selectedCandidates.length} selected
                      </span>
                    </div>
                    <span className="block text-[11px] text-zinc-500">
                      Choose 2 or more candidates to receive this same offer simultaneously (Email + Background Web Push)
                    </span>
                  </div>
                </label>

                {targetType === 'multiple' && (
                  <div className="pl-6 space-y-2.5 pt-1">
                    {/* Search and quick selection action bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                          type="text"
                          value={candidateFilterQuery}
                          onChange={(e) => setCandidateFilterQuery(e.target.value)}
                          placeholder="Filter candidates by name or email..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-amber-500 outline-none font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const pool = [...usersList]
                            APP_CONFIG.defaultTestRecipients.forEach(testEmail => {
                              if (!pool.some(u => (u.email || '').toLowerCase() === testEmail.toLowerCase())) {
                                pool.push({ name: testEmail.split('@')[0], email: testEmail, user_id: testEmail, plan: 'trial' })
                              }
                            })
                            const q = candidateFilterQuery.toLowerCase()
                            const matched = pool
                              .filter(u => {
                                const name = (u.name || '').toLowerCase()
                                const email = (u.email || u.user_id || '').toLowerCase()
                                return !q || name.includes(q) || email.includes(q)
                              })
                              .map(u => (u.email || (u.user_id?.includes('@') ? u.user_id : '')).toLowerCase().trim())
                              .filter(e => e && e.includes('@'))
                            setSelectedCandidates(Array.from(new Set([...selectedCandidates, ...matched])))
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-medium cursor-pointer"
                        >
                          Select All Visible
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedCandidates([])}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[11px] cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Candidates Checklist Scrollbox */}
                    <div className="max-h-52 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 divide-y divide-zinc-900 p-1">
                      {(() => {
                        const pool = [...usersList]
                        APP_CONFIG.defaultTestRecipients.forEach(testEmail => {
                          if (!pool.some(u => (u.email || '').toLowerCase() === testEmail.toLowerCase())) {
                            pool.push({
                              name: testEmail.split('@')[0],
                              email: testEmail,
                              user_id: testEmail,
                              plan: 'trial'
                            })
                          }
                        })

                        const q = candidateFilterQuery.toLowerCase()
                        const filtered = pool.filter(u => {
                          const name = (u.name || '').toLowerCase()
                          const email = (u.email || u.user_id || '').toLowerCase()
                          return !q || name.includes(q) || email.includes(q)
                        })

                        if (filtered.length === 0) {
                          return (
                            <div className="p-4 text-center text-xs text-zinc-500">
                              No candidates matching query.
                            </div>
                          )
                        }

                        const totalPickerPages = Math.max(1, Math.ceil(filtered.length / 10))
                        const pagedCandidates = filtered.slice((candidatePickerPage - 1) * 10, candidatePickerPage * 10)

                        return (
                          <>
                            {pagedCandidates.map(u => {
                              const email = (u.email || (u.user_id?.includes('@') ? u.user_id : '')).toLowerCase().trim()
                              if (!email) return null
                              const isChecked = selectedCandidates.includes(email)
                              return (
                                <div
                                  key={email}
                                  onClick={() => {
                                    setSelectedCandidates(prev =>
                                      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
                                    )
                                  }}
                                  className={`p-2 rounded-lg flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                                    isChecked ? 'bg-amber-500/10 border border-amber-500/30' : 'hover:bg-zinc-900 border border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}}
                                      className="rounded text-amber-500 focus:ring-amber-500 shrink-0 cursor-pointer"
                                    />
                                    <div className="min-w-0">
                                      <div className="font-medium text-white truncate text-xs">
                                        {u.name || email.split('@')[0]}
                                      </div>
                                      <div className="text-[11px] text-zinc-400 font-mono truncate">
                                        {email}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {u.offer_eligibility ? (
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${
                                          u.offer_eligibility.eligible
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        }`}
                                        title={u.offer_eligibility.reason}
                                      >
                                        {u.offer_eligibility.badge}
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase shrink-0 bg-zinc-800 text-zinc-400">
                                        {u.plan || 'Free'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}

                            {totalPickerPages > 1 && (
                              <div className="p-2 bg-black/60 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-400">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const pageEmails = pagedCandidates
                                      .map(u => (u.email || (u.user_id?.includes('@') ? u.user_id : '')).toLowerCase().trim())
                                      .filter(Boolean)
                                    setSelectedCandidates(Array.from(new Set([...selectedCandidates, ...pageEmails])))
                                  }}
                                  className="text-amber-400 hover:text-amber-300 font-medium underline cursor-pointer"
                                >
                                  + Select 10 on this page
                                </button>
                                <div className="flex items-center gap-2 font-mono">
                                  <button
                                    type="button"
                                    disabled={candidatePickerPage <= 1}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setCandidatePickerPage(prev => Math.max(1, prev - 1))
                                    }}
                                    className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-40 cursor-pointer"
                                  >
                                    &larr; Prev
                                  </button>
                                  <span>Page {candidatePickerPage} of {totalPickerPages}</span>
                                  <button
                                    type="button"
                                    disabled={candidatePickerPage >= totalPickerPages}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setCandidatePickerPage(prev => Math.min(totalPickerPages, prev + 1))
                                    }}
                                    className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-40 cursor-pointer"
                                  >
                                    Next &rarr;
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>

                    {/* Extra custom comma-separated candidate emails */}
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Additional Custom Candidate Emails (Optional, comma-separated):
                      </label>
                      <input
                        type="text"
                        value={customExtraEmails}
                        onChange={(e) => setCustomExtraEmails(e.target.value)}
                        placeholder="user1@example.com, user2@example.com"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-amber-500 outline-none font-mono"
                      />
                    </div>

                    {/* Sales Revenue Safeguard Policy Box */}
                    <div className="p-3 rounded-xl bg-black border border-zinc-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-amber-400" />
                          <span>Sales &amp; Retention Policy Safeguard</span>
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">1-2 Days Before Expiry</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Candidates with active subscriptions (&gt; 48 hours remaining) are protected from receiving standard discount offers to prevent cannibalizing full-price subscription value.
                      </p>
                      <label className="flex items-center gap-2 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={forceOverride}
                          onChange={(e) => setForceOverride(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-[11px] text-zinc-200 font-semibold">
                          Override Safeguard: Force send to all selected active subscribers (Special VIP Promotion)
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black border border-zinc-800/80 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === 'bulk_unsubscribed'}
                    onChange={() => setTargetType('bulk_unsubscribed')}
                    className="text-amber-500 focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">All Unsubscribed / Expired Trial Candidates (Bulk)</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                        {offersData.metrics.unsubscribed_count} candidates
                      </span>
                    </div>
                    <span className="block text-[11px] text-zinc-500">High conversion cohort for flash activation</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black border border-zinc-800/80 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === 'all_users'}
                    onChange={() => setTargetType('all_users')}
                    className="text-amber-500 focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">All Registered Candidates (Global Blast)</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono">
                        {offersData.metrics.total_candidates} candidates
                      </span>
                    </div>
                    <span className="block text-[11px] text-zinc-500">Includes active trial, expired, and free tiers</span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Edit className="w-3.5 h-3.5 text-zinc-400" />
                <span>3. Customize Offer Details</span>
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Offer Title</label>
                  <input
                    type="text"
                    value={offerTitle}
                    onChange={(e) => setOfferTitle(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Discount Badge</label>
                    <input
                      type="text"
                      value={discountBadge}
                      onChange={(e) => setDiscountBadge(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-amber-400 font-bold focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Promo Code</label>
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-sky-400 font-mono font-bold focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Original Price (Strikethrough)</label>
                    <input
                      type="text"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-400 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Discounted Price (Hero)</label>
                    <input
                      type="text"
                      value={discountedPrice}
                      onChange={(e) => setDiscountedPrice(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-bold focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Custom Pitch &amp; Value Proposition</label>
                  <textarea
                    rows={3}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 flex items-center justify-between">
                    <span className="font-semibold text-white">Offer Validity Duration (Auto-expiry &amp; Reminders)</span>
                    <span className="text-[10px] text-amber-400 font-mono">
                      Expires in {validityHours} hours ({Math.round(validityHours / 24 * 10) / 10} days)
                    </span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { hours: 24, label: '24 Hours', sub: 'Flash Deal (1 Day)' },
                      { hours: 48, label: '48 Hours', sub: 'Standard (2 Days)' },
                      { hours: 72, label: '3 Days', sub: 'Weekend Pass' },
                      { hours: 168, label: '7 Days', sub: 'Extended Week' }
                    ].map((opt) => (
                      <button
                        key={opt.hours}
                        type="button"
                        onClick={() => setValidityHours(opt.hours)}
                        className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                          validityHours === opt.hours
                            ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold ring-1 ring-amber-500/40'
                            : 'bg-black/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <span className="block text-xs">{opt.label}</span>
                        <span className="block text-[9px] text-zinc-500 font-mono">{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Candidates will receive automated 1-day/2-day expiry warnings via Google SMTP email and OS push before expiry.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOfferModalOpen(true)}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Review &amp; Dispatch Offer Campaign...</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Luxury Email Preview */}
          {!offersCollapsedPreview && (
            <div className="lg:col-span-5 space-y-3">
              <div 
                onClick={toggleOffersPreview}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer select-none transition-all"
                title="Click to hide email preview column"
              >
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Live Candidate Email Preview</span>
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 hidden sm:inline">
                    HTML Luxury Template
                  </span>
                  <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                    <span>Hide</span>
                    <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-[#09090b] overflow-hidden shadow-2xl">
                {/* Email Chrome Header */}
                <div className="p-3 bg-zinc-950 border-b border-zinc-800/80 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>From: <strong className="text-zinc-200">JobFlux AI</strong> &lt;technohmsit@gmail.com&gt;</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-800/40">Verified</span>
                  </div>
                  <div className="text-zinc-300">
                    Subject: <span className="font-semibold text-white">⚡ {offerTitle} [Code: {promoCode}]</span>
                  </div>
                </div>

                {/* Email Body Preview */}
                <div className="p-6 bg-zinc-950/60 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <JobFluxLogo size="sm" />
                      <span className="font-bold text-sm text-white">JobFlux AI</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                      {discountBadge}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-base font-bold text-white tracking-tight">{offerTitle}</h5>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      Hi <strong className="text-zinc-300">{targetType === 'single' ? targetEmail.split('@')[0] : 'Candidate'}</strong>, {customMessage}
                    </p>
                  </div>

                  {/* Price Callout */}
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-mono">Special Upgrade Price</span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs line-through text-zinc-500">{originalPrice}</span>
                      <span className="text-2xl font-black text-amber-400 tracking-tight">{discountedPrice}</span>
                    </div>
                    <div className="pt-2">
                      <span className="inline-block text-[11px] font-mono font-bold bg-black px-3 py-1 rounded-md border border-amber-500/40 text-amber-300">
                        PROMO CODE: {promoCode}
                      </span>
                    </div>
                  </div>

                  <div className="text-center pt-1">
                    <div className="inline-block py-2.5 px-6 rounded-lg bg-white text-black font-bold text-xs shadow-md">
                      Claim {discountBadge} &rarr;
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
      )}
    </div>
  )
}
