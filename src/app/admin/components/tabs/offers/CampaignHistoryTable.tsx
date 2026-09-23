'use client'

import React from 'react'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  History
} from 'lucide-react'
import { OffersData } from '../../../types'

interface CampaignHistoryTableProps {
  offersData: OffersData
  offersCollapsedHistory: boolean
  toggleOffersHistory: () => void
  campaignHistoryPage: number
  setCampaignHistoryPage: React.Dispatch<React.SetStateAction<number>>
  campaignHistoryPerPage: number
  setCampaignHistoryPerPage: (val: number) => void
}

export const CampaignHistoryTable: React.FC<CampaignHistoryTableProps> = ({
  offersData,
  offersCollapsedHistory,
  toggleOffersHistory,
  campaignHistoryPage,
  setCampaignHistoryPage,
  campaignHistoryPerPage,
  setCampaignHistoryPerPage,
}) => {
  return (
    <div className="rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 overflow-hidden shadow-xl">
      <div 
        onClick={toggleOffersHistory}
        className="px-5 py-4 bg-zinc-950 light:bg-white hover:bg-zinc-900/60 light:hover:bg-zinc-50 border-b border-zinc-800 light:border-zinc-200 flex items-center justify-between cursor-pointer select-none transition-colors"
      >
        <div>
          <h4 className="text-sm font-bold text-white light:text-zinc-900 flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400 light:text-amber-600" />
            <span>Dispatched Campaigns Audit Trail</span>
          </h4>
          <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
            Log of past purchase offers sent to single candidates or cohorts.
          </p>
        </div>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs font-mono text-zinc-500 light:text-zinc-600 hidden sm:inline">
            {offersData.history.length} logged campaigns
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleOffersHistory()
            }}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            {offersCollapsedHistory ? (
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

      {offersCollapsedHistory && (
        <div 
          onClick={toggleOffersHistory}
          className="px-5 py-3 bg-zinc-900/30 light:bg-zinc-100 hover:bg-zinc-900/60 light:hover:bg-zinc-200 border-t border-zinc-800 light:border-zinc-200 flex items-center justify-between text-xs text-zinc-400 light:text-zinc-600 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500/80" />
            <span>Table shrunk (<strong>{offersData.history.length}</strong> logged campaigns hidden) &bull; Click anywhere on head to expand</span>
          </div>
          <span className="text-amber-400 light:text-amber-600 font-semibold flex items-center gap-1">
            <span>Expand Table</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </span>
        </div>
      )}

      {!offersCollapsedHistory && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead 
                onClick={toggleOffersHistory}
                className="cursor-pointer group select-none"
                title="Click table head to shrink / expand"
              >
                <tr className="border-b border-zinc-800 light:border-zinc-200 bg-black/40 light:bg-white/85 group-hover:bg-zinc-900/60 light:group-hover:bg-zinc-100 text-zinc-400 light:text-zinc-600 font-mono uppercase text-[10px] transition-colors">
                  <th className="py-3 px-4 flex items-center gap-1.5">
                    <span>Campaign Name</span>
                    <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-amber-400 transition-colors" />
                  </th>
                  <th className="py-3 px-4">Target Audience</th>
                  <th className="py-3 px-4">Offer Price &amp; Code</th>
                  <th className="py-3 px-4">Recipients</th>
                  <th className="py-3 px-4">Dispatched At</th>
                  <th className="py-3 px-4 text-center">Status (Click Head to Shrink ▲)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 light:divide-zinc-200/60">
                {offersData.history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500 light:text-zinc-600 italic">
                      No promotional campaigns dispatched yet. Use the builder above to launch your first offer.
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const pagedHistory = offersData.history.slice(
                      (campaignHistoryPage - 1) * campaignHistoryPerPage,
                      campaignHistoryPage * campaignHistoryPerPage
                    )

                    return pagedHistory.map((h: any) => (
                      <tr key={h.id} className="hover:bg-zinc-900/40 light:hover:bg-zinc-50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white light:text-zinc-900">
                          {h.campaign_name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="capitalize text-zinc-300 light:text-zinc-700">{h.target_type.replace('_', ' ')}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-amber-300 light:text-amber-700">
                          {h.discounted_price} <span className="text-zinc-500 light:text-zinc-600">({h.promo_code})</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 light:bg-zinc-200 font-mono text-zinc-300 light:text-zinc-700">
                            {h.recipient_count} recipient{h.recipient_count > 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-400 light:text-zinc-600 text-[11px]">
                          {new Date(h.created_at).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 light:text-emerald-600 border border-emerald-500/30 light:border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            DISPATCHED
                          </span>
                        </td>
                      </tr>
                    ))
                  })()
                )}
              </tbody>
            </table>
          </div>

          {offersData.history.length > 0 && (
            <div className="px-5 py-3 bg-zinc-950 light:bg-white border-t border-zinc-800 light:border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400 light:text-zinc-600">
              <div className="flex items-center gap-3">
                <span>
                  Showing <strong className="text-white light:text-zinc-900">{(campaignHistoryPage - 1) * campaignHistoryPerPage + 1}</strong> to <strong className="text-white light:text-zinc-900">{Math.min(campaignHistoryPage * campaignHistoryPerPage, offersData.history.length)}</strong> of <strong className="text-white light:text-zinc-900">{offersData.history.length}</strong> campaigns
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-zinc-500 light:text-zinc-600">Per page:</span>
                  <select
                    value={campaignHistoryPerPage}
                    onChange={(e) => {
                      setCampaignHistoryPerPage(Number(e.target.value))
                      setCampaignHistoryPage(1)
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
                  disabled={campaignHistoryPage <= 1}
                  onClick={() => setCampaignHistoryPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 text-xs disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed font-medium"
                >
                  Previous
                </button>
                <span className="text-xs font-mono text-zinc-300 light:text-zinc-700 px-1">
                  Page {campaignHistoryPage} of {Math.max(1, Math.ceil(offersData.history.length / campaignHistoryPerPage))}
                </span>
                <button
                  type="button"
                  disabled={campaignHistoryPage >= Math.max(1, Math.ceil(offersData.history.length / campaignHistoryPerPage))}
                  onClick={() => setCampaignHistoryPage(prev => Math.min(Math.max(1, Math.ceil(offersData.history.length / campaignHistoryPerPage)), prev + 1))}
                  className="px-3 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 text-xs disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
