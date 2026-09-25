'use client'

import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  Sparkles,
  Crown,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Gift,
  Copy,
  Check,
  Clock,
  ArrowRight,
  Wallet,
  Smartphone,
  Building,
  Bell
} from 'lucide-react'
import WebPushReengagementCard from './WebPushReengagementCard'

interface PaymentsTabProps {
  paymentsList: any[]
  loadingPayments: boolean
  vipProfilesCount: number
  paymentsTableCollapsed: boolean
  togglePaymentsTable: () => void
  fetchPayments: () => Promise<void>
}

interface ReferralPayoutItem {
  _id: string
  referral_id: string
  referrer_id: string
  referrer_name: string
  referrer_email: string
  referee_id: string
  referee_name?: string
  referee_email: string
  plan_id: string
  plan_amount?: string | number
  reward_amount: number
  status: 'pending_payout' | 'paid' | 'rejected'
  payout_type: 'upi' | 'bank'
  upi_id?: string
  bank_details?: {
    account_number?: string
    ifsc_code?: string
    account_holder_name?: string
    bank_name?: string
  }
  created_at: string
  paid_at?: string
  transaction_ref?: string
}

export default function PaymentsTab({
  paymentsList,
  loadingPayments,
  vipProfilesCount,
  paymentsTableCollapsed,
  togglePaymentsTable,
  fetchPayments
}: PaymentsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'razorpay' | 'referrals' | 'reengagement'>('razorpay')
  const [payoutsList, setPayoutsList] = useState<ReferralPayoutItem[]>([])
  const [loadingPayouts, setLoadingPayouts] = useState<boolean>(false)
  const [payoutStats, setPayoutStats] = useState({
    total_referrals: 0,
    pending_count: 0,
    pending_amount: 0,
    paid_count: 0,
    paid_amount: 0
  })
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [disbursingId, setDisbursingId] = useState<string | null>(null)
  const [utrInput, setUtrInput] = useState<string>('')
  const [activeModalItem, setActiveModalItem] = useState<ReferralPayoutItem | null>(null)

  const uniquePaidUsersCount = new Set(paymentsList.map(p => p.user_id || p.email)).size

  const fetchPayouts = async () => {
    try {
      setLoadingPayouts(true)
      const res = await fetch('/api/admin/payouts')
      if (!res.ok) throw new Error('Failed to load payouts')
      const data = await res.json()
      setPayoutsList(data.payouts || [])
      if (data.stats) setPayoutStats(data.stats)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingPayouts(false)
    }
  }

  useEffect(() => {
    fetchPayouts()
  }, [])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleConfirmDisburse = async () => {
    if (!activeModalItem) return
    try {
      setDisbursingId(activeModalItem.referral_id)
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referral_id: activeModalItem.referral_id,
          transaction_ref: utrInput.trim() || `UTR_${Date.now()}`
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to update payout')
      }
      setActiveModalItem(null)
      setUtrInput('')
      await fetchPayouts()
    } catch (e: any) {
      alert(e.message || 'Error updating payout')
    } finally {
      setDisbursingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation Switcher */}
      <div className="flex items-center justify-between border-b border-zinc-800 light:border-zinc-200 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveSubTab('razorpay')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'razorpay'
                ? 'bg-zinc-800 light:bg-zinc-200 text-white light:text-zinc-900 shadow-sm'
                : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-indigo-400" />
            <span>Razorpay Payments ({paymentsList.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('referrals')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
              activeSubTab === 'referrals'
                ? 'bg-emerald-500/20 text-emerald-300 light:text-emerald-700 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900'
            }`}
          >
            <Gift className="w-4 h-4 text-emerald-400" />
            <span>Referral Payouts (₹200 Cash)</span>
            {payoutStats.pending_count > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-black">
                {payoutStats.pending_count} pending
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('reengagement')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
              activeSubTab === 'reengagement'
                ? 'bg-indigo-500/20 text-indigo-300 light:text-indigo-700 border border-indigo-500/40 shadow-sm'
                : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900'
            }`}
          >
            <Bell className="w-4 h-4 text-indigo-400" />
            <span>Web Push Drip (Unpaid &amp; Anonymous)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchPayments()
            fetchPayouts()
          }}
          disabled={loadingPayments || loadingPayouts}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-300 light:text-zinc-700 border border-zinc-800 light:border-zinc-300 text-xs font-semibold transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingPayments || loadingPayouts ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* RAZORPAY PAYMENTS VIEW */}
      {activeSubTab === 'razorpay' && (
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
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); togglePaymentsTable() }}
                className="p-1.5 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 transition-colors cursor-pointer"
                title={paymentsTableCollapsed ? 'Expand table' : 'Collapse table'}
              >
                {paymentsTableCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
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
                  <thead className="bg-slate-950/70 light:bg-zinc-100 text-slate-400 light:text-zinc-600 uppercase text-[10px] tracking-wider border-b border-slate-800 light:border-zinc-200">
                    <tr>
                      <th className="py-3.5 px-4">Candidate / User</th>
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
                              {p.plan_id || 'Pro'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-400 light:text-emerald-600 font-mono text-sm">
                            {p.amount || (p.plan_id === 'elite' || p.plan_id === 'professional' ? '₹1,299' : '₹499')}
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
      )}

      {/* REFERRAL PAYOUTS VIEW */}
      {activeSubTab === 'referrals' && (
        <div className="space-y-6">
          {/* Referral Payout Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Referrals</div>
                <div className="text-2xl font-extrabold text-white light:text-zinc-900 mt-1">{payoutStats.total_referrals}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Purchases via invite link</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Gift className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#09090b] light:bg-white border border-amber-500/20 light:border-amber-300 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 light:text-amber-700">
                  Pending Cash Disbursal
                </div>
                <div className="text-2xl font-extrabold text-amber-300 light:text-amber-700 mt-1">
                  ₹{payoutStats.pending_amount}
                </div>
                <div className="text-[11px] text-amber-400/70 mt-0.5">{payoutStats.pending_count} candidate(s) waiting</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#09090b] light:bg-white border border-emerald-500/20 light:border-emerald-300 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 light:text-emerald-700">
                  Total Disbursed (Paid)
                </div>
                <div className="text-2xl font-extrabold text-emerald-300 light:text-emerald-700 mt-1">
                  ₹{payoutStats.paid_amount}
                </div>
                <div className="text-[11px] text-emerald-400/70 mt-0.5">{payoutStats.paid_count} transferred to UPI/Bank</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Referral Payouts Table */}
          <div className="rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 overflow-hidden shadow-xl">
            <div className="px-5 py-4 bg-slate-950 light:bg-white border-b border-slate-800 light:border-zinc-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white light:text-zinc-900 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-400" />
                  Candidate Referral Cash Rewards
                  <span className="text-[10px] font-mono text-zinc-500 light:text-zinc-600 bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 px-2 py-0.5 rounded-full">
                    {payoutsList.length} items
                  </span>
                </h3>
                <p className="text-xs text-slate-400 light:text-zinc-600 mt-0.5">
                  Send ₹200 via UPI or Bank transfer to the referrer, then click &apos;Mark as Paid&apos; to update their dashboard.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 light:text-zinc-700">
                <thead className="bg-slate-950/70 light:bg-zinc-100 text-slate-400 light:text-zinc-600 uppercase text-[10px] tracking-wider border-b border-slate-800 light:border-zinc-200">
                  <tr>
                    <th className="py-3.5 px-4">Referrer (Gets ₹200)</th>
                    <th className="py-3.5 px-4">Payout Destination (UPI / Bank)</th>
                    <th className="py-3.5 px-4">Referee (Purchased)</th>
                    <th className="py-3.5 px-4">Plan / Amount</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 light:divide-zinc-200">
                  {loadingPayouts ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-emerald-400" />
                        Loading referral payouts...
                      </td>
                    </tr>
                  ) : payoutsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <Gift className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                        No referral rewards generated yet.
                        <div className="text-[11px] text-slate-600 mt-1">
                          When users invite friends who purchase a Pro plan, ₹200 cash reward tasks will appear here.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    payoutsList.map(item => (
                      <tr key={item.referral_id || item._id} className="hover:bg-slate-800/30 light:hover:bg-zinc-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white light:text-zinc-900">{item.referrer_name || item.referrer_id}</div>
                          <div className="text-[11px] text-slate-400 light:text-zinc-500 font-mono">{item.referrer_email || item.referrer_id}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          {item.payout_type === 'upi' ? (
                            item.upi_id ? (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 light:text-emerald-700 font-mono font-bold text-xs border border-emerald-500/30">
                                  <Smartphone className="w-3 h-3" />
                                  {item.upi_id}
                                </span>
                                <button
                                  onClick={() => handleCopy(item.upi_id!, item.referral_id)}
                                  className="p-1 rounded hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                  title="Copy UPI ID"
                                >
                                  {copiedId === item.referral_id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-amber-400/80 italic">UPI ID not entered yet</span>
                            )
                          ) : (
                            item.bank_details?.account_number ? (
                              <div className="space-y-0.5 text-[11px]">
                                <div className="flex items-center gap-1.5 font-mono text-zinc-200 light:text-zinc-800 font-semibold">
                                  <Building className="w-3 h-3 text-cyan-400" />
                                  <span>{item.bank_details.account_number}</span>
                                  <button
                                    onClick={() => handleCopy(item.bank_details!.account_number!, `${item.referral_id}_acc`)}
                                    className="p-0.5 hover:text-white"
                                  >
                                    {copiedId === `${item.referral_id}_acc` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                                <div className="text-zinc-400 light:text-zinc-600 font-mono text-[10px]">
                                  IFSC: {item.bank_details.ifsc_code} · {item.bank_details.account_holder_name}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-amber-400/80 italic">Bank details not entered yet</span>
                            )
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs">
                          <div className="text-white light:text-zinc-900">{item.referee_email}</div>
                          <div className="text-[10px] text-zinc-500">{item.referee_id}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-800 light:bg-zinc-200 text-zinc-300 light:text-zinc-700">
                              {item.plan_id}
                            </span>
                            <span className="font-mono text-emerald-400 light:text-emerald-700 font-bold">
                              ₹200 Reward
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 light:text-zinc-600 text-[11px]">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {item.status === 'paid' ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 light:text-emerald-700 border border-emerald-500/30 font-mono">
                                <CheckCircle2 className="w-3 h-3" />
                                PAID
                              </span>
                              {item.transaction_ref && (
                                <div className="text-[9px] font-mono text-zinc-500 truncate max-w-[120px] mx-auto">
                                  {item.transaction_ref}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 light:text-amber-700 border border-amber-500/30 font-mono">
                              <Clock className="w-3 h-3" />
                              PENDING
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {item.status === 'paid' ? (
                            <span className="text-[11px] text-zinc-500 light:text-zinc-400 font-mono">
                              Disbursed
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveModalItem(item)
                                setUtrInput('')
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                            >
                              Mark as Paid →
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* WEB PUSH DRIP RE-ENGAGEMENT VIEW */}
      {activeSubTab === 'reengagement' && (
        <WebPushReengagementCard />
      )}

      {/* Disbursal Confirmation Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c0c0f] light:bg-white border border-zinc-800 light:border-zinc-300 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white light:text-zinc-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                Confirm ₹200 Cash Disbursal
              </h3>
              <button
                onClick={() => setActiveModalItem(null)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 light:text-zinc-700">
              Please send ₹200 to <strong className="text-white light:text-zinc-900">{activeModalItem.referrer_name || activeModalItem.referrer_id}</strong> via:
            </p>

            <div className="p-3 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-xs font-mono space-y-1">
              {activeModalItem.payout_type === 'upi' ? (
                <div>
                  <span className="text-zinc-500 text-[10px]">UPI VPA:</span>
                  <div className="text-emerald-400 light:text-emerald-700 font-bold select-all">
                    {activeModalItem.upi_id || 'No UPI ID provided'}
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <div>Account: <strong className="text-white select-all">{activeModalItem.bank_details?.account_number}</strong></div>
                  <div>IFSC: <strong className="text-white select-all">{activeModalItem.bank_details?.ifsc_code}</strong></div>
                  <div>Name: <span className="text-zinc-300">{activeModalItem.bank_details?.account_holder_name}</span></div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 light:text-zinc-700">
                Payment Reference / UTR Number
              </label>
              <input
                type="text"
                placeholder="e.g. 423512398412 or UPI Ref ID"
                value={utrInput}
                onChange={e => setUtrInput(e.target.value)}
                className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-300 rounded-lg px-3 py-2 text-xs text-white light:text-zinc-900 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 light:bg-zinc-200 text-zinc-300 light:text-zinc-700 text-xs font-semibold hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisburse}
                disabled={Boolean(disbursingId)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {disbursingId ? 'Updating...' : 'Confirm Disbursed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
