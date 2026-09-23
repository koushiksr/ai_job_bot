'use client'

import React from 'react'
import {
  CreditCard,
  Sparkles,
  Crown,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2
} from 'lucide-react'

interface PaymentsTabProps {
  paymentsList: any[]
  loadingPayments: boolean
  vipProfilesCount: number
  paymentsTableCollapsed: boolean
  togglePaymentsTable: () => void
  fetchPayments: () => Promise<void>
}

export default function PaymentsTab({
  paymentsList,
  loadingPayments,
  vipProfilesCount,
  paymentsTableCollapsed,
  togglePaymentsTable,
  fetchPayments
}: PaymentsTabProps) {
  const uniquePaidUsersCount = new Set(paymentsList.map(p => p.user_id || p.email)).size

  return (
    <div className="space-y-6">
      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Transactions</div>
            <div className="text-2xl font-extrabold text-white light:text-zinc-900 mt-1">{paymentsList.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Paid Subscribers</div>
            <div className="text-2xl font-extrabold text-emerald-400 light:text-emerald-600 mt-1">
              {uniquePaidUsersCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 light:text-emerald-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">VIP Free Passes</div>
            <div className="text-2xl font-extrabold text-amber-400 light:text-amber-600 mt-1">{vipProfilesCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 light:text-amber-600">
            <Crown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 overflow-hidden shadow-xl">
        <div
          onClick={togglePaymentsTable}
          className="px-5 py-4 bg-slate-950 light:bg-white border-b border-slate-800 light:border-zinc-200 flex items-center justify-between cursor-pointer select-none hover:bg-slate-900/60 light:hover:bg-zinc-50 transition-colors group"
        >
          <div>
            <h3 className="font-bold text-sm text-white light:text-zinc-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              Verified Razorpay Transactions
              <span className="text-[10px] font-mono text-zinc-500 light:text-zinc-600 bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 px-2 py-0.5 rounded-full">
                {paymentsList.length} records
              </span>
            </h3>
            <p className="text-xs text-slate-400 light:text-zinc-600 mt-0.5">
              Real-time payment verification records and active plan subscriptions.
            </p>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); fetchPayments() }}
              disabled={loadingPayments}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 light:bg-zinc-100 hover:bg-slate-800 light:hover:bg-zinc-200 text-slate-300 light:text-zinc-700 border border-slate-800 light:border-zinc-300 text-xs font-semibold transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPayments ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); togglePaymentsTable() }}
              className="p-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 transition-colors cursor-pointer"
              title={paymentsTableCollapsed ? 'Expand table' : 'Collapse table'}
            >
              {paymentsTableCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {paymentsTableCollapsed && (
          <div
            onClick={togglePaymentsTable}
            className="flex items-center justify-center gap-2 py-4 text-xs text-zinc-500 light:text-zinc-600 cursor-pointer hover:text-zinc-300 light:hover:text-zinc-900 hover:bg-zinc-900/30 light:hover:bg-zinc-100 transition-all select-none"
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
            <span>Table shrunk ({paymentsList.length} transactions hidden) · Click anywhere on head to expand</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        )}

        {!paymentsTableCollapsed && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 light:text-zinc-700">
              <thead
                onClick={togglePaymentsTable}
                className="bg-slate-950/70 light:bg-zinc-100 text-slate-400 light:text-zinc-600 uppercase text-[10px] tracking-wider border-b border-slate-800 light:border-zinc-200 cursor-pointer group select-none"
                title="Click table head to shrink / expand"
              >
                <tr className="hover:bg-zinc-900/60 light:hover:bg-zinc-200/70 transition-colors">
                  <th className="py-3.5 px-4 flex items-center gap-1">
                    <span>Candidate / User</span>
                    <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-indigo-400" />
                  </th>
                  <th className="py-3.5 px-4">Plan Purchased</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Razorpay Payment ID</th>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Verified Date</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 light:divide-zinc-200">
                {loadingPayments ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 light:text-zinc-500">
                      <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
                      Loading Razorpay transactions...
                    </td>
                  </tr>
                ) : paymentsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 light:text-zinc-500">
                      <CreditCard className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                      No Razorpay payments recorded in the database yet.
                      <div className="text-[11px] text-slate-600 mt-1">
                        When users upgrade their plan via Razorpay checkout, their verified orders will appear here automatically.
                      </div>
                    </td>
                  </tr>
                ) : (
                  paymentsList.map((p, idx) => (
                    <tr key={p.id || p._id || idx} className="hover:bg-slate-800/30 light:hover:bg-zinc-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white light:text-zinc-900">{p.email || p.user_id}</div>
                        <div className="text-[11px] text-slate-500 light:text-zinc-500 font-mono">{p.user_id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.plan_id === 'elite' ? 'bg-amber-500/15 text-amber-400 light:text-amber-600 border border-amber-500/30 light:border-amber-300' :
                          p.plan_id === 'pro' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' :
                          'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        }`}>
                          {p.plan_id || 'Starter'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400 light:text-emerald-600 font-mono text-sm">
                        {p.amount || (p.plan_id === 'elite' || p.plan_id === 'professional' ? '₹199' : '₹99')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-cyan-400 light:text-cyan-600">
                        {p.payment_id}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 light:text-zinc-600">
                        {p.order_id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 light:text-zinc-600 text-[11px]">
                        {p.verified_at ? new Date(p.verified_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 light:text-emerald-600 border border-emerald-500/30 light:border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 light:text-emerald-600" />
                          SUCCESS
                        </span>
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
