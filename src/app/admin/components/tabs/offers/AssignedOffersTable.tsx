'use client'

import React from 'react'
import {
  ChevronDown,
  ChevronUp,
  Tag,
  Trash2
} from 'lucide-react'
import { OffersData } from '../../../types'

interface AssignedOffersTableProps {
  offersData: OffersData
  assignedOfferFilter: 'all' | 'active' | 'claimed' | 'expired'
  handleAssignedFilterChange: (filter: 'all' | 'active' | 'claimed' | 'expired') => void
  offersCollapsedAssigned: boolean
  toggleOffersAssigned: () => void
  assignedOffersPage: number
  setAssignedOffersPage: React.Dispatch<React.SetStateAction<number>>
  assignedOffersPerPage: number
  setAssignedOffersPerPage: (val: number) => void
  revokingOfferId: string | null
  handleRevokeOffer: (id: string, email: string, code: string) => Promise<void> | void
  formatTimestamp: (ts: any) => string
}

export const AssignedOffersTable: React.FC<AssignedOffersTableProps> = ({
  offersData,
  assignedOfferFilter,
  handleAssignedFilterChange,
  offersCollapsedAssigned,
  toggleOffersAssigned,
  assignedOffersPage,
  setAssignedOffersPage,
  assignedOffersPerPage,
  setAssignedOffersPerPage,
  revokingOfferId,
  handleRevokeOffer,
  formatTimestamp,
}) => {
  return (
    <div className="rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 overflow-hidden shadow-xl space-y-0">
      <div 
        onClick={toggleOffersAssigned}
        className="px-5 py-4 bg-zinc-950 light:bg-white hover:bg-zinc-900/60 light:hover:bg-zinc-50 border-b border-zinc-800 light:border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition-colors"
      >
        <div>
          <h4 className="text-sm font-bold text-white light:text-zinc-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400 light:text-emerald-600" />
            <span>Live Assigned Candidate Offers Hub</span>
            <span className="text-[10px] font-mono text-zinc-400 light:text-zinc-600 bg-zinc-900 light:bg-zinc-100 px-2 py-0.5 rounded border border-zinc-800 light:border-zinc-200">
              {(offersData.assigned_offers || []).length} assigned
            </span>
          </h4>
          <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
            Active promo codes provisioned to candidates. Revoking an offer instantly removes it from the candidate&apos;s dashboard and checkout.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap" onClick={(e) => e.stopPropagation()}>
          <div className="flex bg-black light:bg-white p-0.5 rounded-lg border border-zinc-800 light:border-zinc-200 text-[11px] font-medium overflow-x-auto scrollbar-none flex-nowrap max-w-full">
            {(['all', 'active', 'claimed', 'expired'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleAssignedFilterChange(filter)
                }}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors cursor-pointer whitespace-nowrap ${
                  assignedOfferFilter === filter
                    ? 'bg-amber-500/20 text-amber-300 light:text-amber-700 font-bold'
                    : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleOffersAssigned()
            }}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
          >
            {offersCollapsedAssigned ? (
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

      {offersCollapsedAssigned && (
        <div 
          onClick={toggleOffersAssigned}
          className="px-5 py-3 bg-zinc-900/30 light:bg-zinc-100 hover:bg-zinc-900/60 light:hover:bg-zinc-200 border-t border-zinc-800 light:border-zinc-200 flex items-center justify-between text-xs text-zinc-400 light:text-zinc-600 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
            <span>Table shrunk (<strong>{(offersData.assigned_offers || []).length}</strong> assigned offers hidden) &bull; Click anywhere on head to expand</span>
          </div>
          <span className="text-amber-400 light:text-amber-600 font-semibold flex items-center gap-1">
            <span>Expand Table</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </span>
        </div>
      )}

      {!offersCollapsedAssigned && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead 
                onClick={toggleOffersAssigned}
                className="cursor-pointer group select-none"
                title="Click table head to shrink / expand"
              >
                <tr className="border-b border-zinc-800 light:border-zinc-200 bg-black/40 light:bg-white/85 group-hover:bg-zinc-900/60 light:group-hover:bg-zinc-100 text-zinc-400 light:text-zinc-600 font-mono uppercase text-[10px] transition-colors">
                  <th className="py-3 px-4 flex items-center gap-1.5">
                    <span>Candidate</span>
                    <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-amber-400 transition-colors" />
                  </th>
                  <th className="py-3 px-4">Offer Title &amp; Code</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Validity Countdown</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action (Click Head to Shrink ▲)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 light:divide-zinc-200/60">
                {(() => {
                  const filtered = (offersData.assigned_offers || []).filter((off: any) => {
                    if (assignedOfferFilter === 'active') return !off.claimed && !off.is_expired && !off.revoked
                    if (assignedOfferFilter === 'claimed') return off.claimed && !off.revoked
                    if (assignedOfferFilter === 'expired') return off.is_expired && !off.revoked
                    return true
                  })

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-500 light:text-zinc-600 italic">
                          No candidate offers found matching &quot;{assignedOfferFilter}&quot; filter.
                        </td>
                      </tr>
                    )
                  }

                  const paginated = filtered.slice(
                    (assignedOffersPage - 1) * assignedOffersPerPage,
                    assignedOffersPage * assignedOffersPerPage
                  )

                  return paginated.map((off: any, idx: number) => (
                    <tr key={off.id || `${off.candidate_email}_${off.promo_code}_${idx}`} className="hover:bg-zinc-900/40 light:hover:bg-zinc-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white light:text-zinc-900">{off.candidate_name || off.candidate_email?.split('@')[0] || 'Candidate'}</div>
                        <div className="text-[11px] text-zinc-400 light:text-zinc-600 font-mono">{off.candidate_email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-zinc-200 light:text-zinc-800">{off.offer_title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sky-300 font-mono font-bold">{off.promo_code}</span>
                          <span className="text-[10px] uppercase bg-amber-500/15 text-amber-300 light:text-amber-700 px-1.5 py-0.2 rounded border border-amber-500/30 light:border-amber-300">
                            {off.discount_badge}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-emerald-400 light:text-emerald-600">{off.discounted_price}</div>
                        <div className="text-[10px] text-zinc-500 light:text-zinc-600 line-through font-mono">{off.original_price}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-zinc-300 light:text-zinc-700">
                          {off.revoked ? (
                            <span className="text-zinc-500 light:text-zinc-600">Revoked</span>
                          ) : off.is_expired ? (
                            <span className="text-rose-400 light:text-rose-600 font-semibold">Expired</span>
                          ) : (
                            <span className="text-amber-400 light:text-amber-600 font-bold">{off.hours_left}h remaining</span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 light:text-zinc-600 font-mono">
                          Expires: {off.expires_at ? formatTimestamp(off.expires_at) : 'No expiry'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {off.revoked ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 light:bg-zinc-200 text-zinc-400 light:text-zinc-600 border border-zinc-700 light:border-zinc-300">
                            Revoked
                          </span>
                        ) : off.claimed ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 light:text-emerald-700 border border-emerald-800">
                            Claimed
                          </span>
                        ) : off.is_expired ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 light:text-rose-600 border border-rose-800">
                            Expired
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 light:text-amber-700 border border-amber-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {off.revoked ? (
                          <span className="text-[11px] text-zinc-600 font-mono italic">Revoked</span>
                        ) : (
                          <button
                            type="button"
                            disabled={revokingOfferId === (off.id || off.promo_code)}
                            onClick={() => handleRevokeOffer(off.id, off.candidate_email, off.promo_code)}
                            className="px-2.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 light:text-rose-600 border border-rose-500/30 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                            title="Revoke and remove offer from candidate account"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{revokingOfferId === (off.id || off.promo_code) ? 'Revoking...' : 'Revoke Offer'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>

          {(() => {
            const filtered = (offersData.assigned_offers || []).filter((off: any) => {
              if (assignedOfferFilter === 'active') return !off.claimed && !off.is_expired && !off.revoked
              if (assignedOfferFilter === 'claimed') return off.claimed && !off.revoked
              if (assignedOfferFilter === 'expired') return off.is_expired && !off.revoked
              return true
            })
            const totalPages = Math.max(1, Math.ceil(filtered.length / assignedOffersPerPage))
            if (filtered.length === 0) return null

            return (
              <div className="px-5 py-3 bg-zinc-950 light:bg-white border-t border-zinc-800 light:border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400 light:text-zinc-600">
                <div className="flex items-center gap-3">
                  <span>
                    Showing <strong className="text-white light:text-zinc-900">{filtered.length === 0 ? 0 : (assignedOffersPage - 1) * assignedOffersPerPage + 1}</strong> to <strong className="text-white light:text-zinc-900">{Math.min(assignedOffersPage * assignedOffersPerPage, filtered.length)}</strong> of <strong className="text-white light:text-zinc-900">{filtered.length}</strong> offers
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-500 light:text-zinc-600">Per page:</span>
                    <select
                      value={assignedOffersPerPage}
                      onChange={(e) => {
                        setAssignedOffersPerPage(Number(e.target.value))
                        setAssignedOffersPage(1)
                      }}
                      className="px-2 py-0.5 rounded bg-black light:bg-white border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 text-xs font-mono"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={assignedOffersPage <= 1}
                    onClick={() => setAssignedOffersPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 text-xs disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed font-medium"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-mono text-zinc-300 light:text-zinc-700 px-1">
                    Page {assignedOffersPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={assignedOffersPage >= totalPages}
                    onClick={() => setAssignedOffersPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-3 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 text-xs disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}
