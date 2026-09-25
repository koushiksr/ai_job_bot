'use client'

import React, { useState, useEffect } from 'react'
import {
  Gift,
  Copy,
  Check,
  Share2,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  Smartphone,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react'

interface ReferralStats {
  total_signups: number
  total_conversions: number
  total_earned_cash: number
  pending_cash: number
  paid_cash: number
}

interface PayoutSettings {
  payout_type: 'upi' | 'bank'
  upi_id: string
  bank_details: {
    account_number: string
    ifsc_code: string
    account_holder_name: string
    bank_name: string
  }
}

interface ReferralHistoryItem {
  referral_id: string
  referee_name: string
  referee_email_masked: string
  plan_id: string
  reward_amount: number
  status: 'pending_payout' | 'paid' | 'rejected'
  created_at: string
  paid_at?: string | null
  transaction_ref?: string | null
}

export default function ReferralPayoutSection({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true)
  const [referralCode, setReferralCode] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [stats, setStats] = useState<ReferralStats>({
    total_signups: 0,
    total_conversions: 0,
    total_earned_cash: 0,
    pending_cash: 0,
    paid_cash: 0
  })
  const [payoutSettings, setPayoutSettings] = useState<PayoutSettings>({
    payout_type: 'upi',
    upi_id: '',
    bank_details: {
      account_number: '',
      ifsc_code: '',
      account_holder_name: '',
      bank_name: ''
    }
  })
  const [history, setHistory] = useState<ReferralHistoryItem[]>([])
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saveError, setSaveError] = useState('')

  // Form states for payout details
  const [selectedType, setSelectedType] = useState<'upi' | 'bank'>('upi')
  const [upiInput, setUpiInput] = useState('')
  const [bankAccNumber, setBankAccNumber] = useState('')
  const [bankAccConfirm, setBankAccConfirm] = useState('')
  const [bankIfsc, setBankIfsc] = useState('')
  const [bankHolder, setBankHolder] = useState('')
  const [bankName, setBankName] = useState('')

  useEffect(() => {
    fetchReferralData()
  }, [userId])

  const fetchReferralData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/referrals?user_id=${encodeURIComponent(userId)}`)
      if (!res.ok) throw new Error('Failed to load referral data')
      const data = await res.json()
      setReferralCode(data.referral_code || '')
      setShareUrl(data.share_url || '')
      if (data.stats) setStats(data.stats)
      if (data.payout_settings) {
        setPayoutSettings(data.payout_settings)
        setSelectedType(data.payout_settings.payout_type || 'upi')
        setUpiInput(data.payout_settings.upi_id || '')
        if (data.payout_settings.bank_details) {
          setBankAccNumber(data.payout_settings.bank_details.account_number || '')
          setBankAccConfirm(data.payout_settings.bank_details.account_number || '')
          setBankIfsc(data.payout_settings.bank_details.ifsc_code || '')
          setBankHolder(data.payout_settings.bank_details.account_holder_name || '')
          setBankName(data.payout_settings.bank_details.bank_name || '')
        }
      }
      if (data.history) setHistory(data.history)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    const link = shareUrl || `${window.location.origin}/register?ref=${referralCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleShareWhatsApp = () => {
    const link = shareUrl || `${window.location.origin}/register?ref=${referralCode}`
    const text = encodeURIComponent(
      `Hey! Check out JobFlux AI — it automatically applies to 55+ matched jobs daily on Naukri with AI tailored answers. Use my invite link to get started: ${link}`
    )
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  const handleSavePayoutDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess('')
    setSaveError('')

    if (selectedType === 'upi') {
      if (!upiInput.trim() || !upiInput.includes('@')) {
        setSaveError('Please enter a valid UPI ID (e.g. mobile@paytm or name@oksbi)')
        setSaving(false)
        return
      }
    } else {
      if (!bankAccNumber.trim() || !bankIfsc.trim() || !bankHolder.trim()) {
        setSaveError('Please provide Account Number, IFSC code, and Account Holder Name.')
        setSaving(false)
        return
      }
      if (bankAccNumber.trim() !== bankAccConfirm.trim()) {
        setSaveError('Bank Account Numbers do not match. Please re-check.')
        setSaving(false)
        return
      }
    }

    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          payout_type: selectedType,
          upi_id: upiInput.trim(),
          bank_details: {
            account_number: bankAccNumber.trim(),
            ifsc_code: bankIfsc.trim().toUpperCase(),
            account_holder_name: bankHolder.trim(),
            bank_name: bankName.trim()
          }
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to save payout settings')

      setSaveSuccess(data.message || 'Payout details saved! Rewards will be sent here.')
      if (data.payout_settings) {
        setPayoutSettings(data.payout_settings)
      }
    } catch (err: any) {
      setSaveError(err.message || 'Error saving payout details')
    } finally {
      setSaving(false)
    }
  }

  const activeLink = shareUrl || (typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${referralCode}` : `https://jobfluxai.com/register?ref=${referralCode}`)

  return (
    <div className="rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 overflow-hidden shadow-sm">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-black light:from-emerald-50 light:via-white light:to-zinc-50 border-b border-zinc-800 light:border-zinc-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white light:text-zinc-900">
                  Refer Friends &amp; Earn ₹150 Cash
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 light:text-emerald-700 border border-emerald-500/40">
                  Direct Cash
                </span>
              </div>
              <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
                Share your invite link with college friends or peers. When they buy any Pro plan, you get ₹150 cash sent directly to your UPI or Bank Account!
              </p>
            </div>
          </div>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Share2 className="w-4 h-4" />
            <span>Share on WhatsApp</span>
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Metric Overview Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 rounded-xl bg-zinc-900/60 light:bg-zinc-50 border border-zinc-800/80 light:border-zinc-200">
            <div className="text-[11px] font-medium text-zinc-400 light:text-zinc-600 flex items-center gap-1.5">
              <span>Friends Joined</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white light:text-zinc-900 mt-1">
              {stats.total_signups}
            </div>
            <div className="text-[10px] text-zinc-500 light:text-zinc-400 mt-0.5">Registered with your code</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 light:bg-zinc-50 border border-zinc-800/80 light:border-zinc-200">
            <div className="text-[11px] font-medium text-zinc-400 light:text-zinc-600 flex items-center gap-1.5">
              <span>Upgrades Converted</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white light:text-zinc-900 mt-1">
              {stats.total_conversions}
            </div>
            <div className="text-[10px] text-zinc-500 light:text-zinc-400 mt-0.5">Pro plan subscribers</div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-950/20 light:bg-emerald-50/60 border border-emerald-500/20 light:border-emerald-300">
            <div className="text-[11px] font-medium text-emerald-400 light:text-emerald-700 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Total Earned</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-300 light:text-emerald-700 mt-1">
              ₹{stats.total_earned_cash}
            </div>
            <div className="text-[10px] text-emerald-400/70 light:text-emerald-600/80 mt-0.5">₹150 per active purchase</div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/20 light:bg-amber-50/60 border border-amber-500/20 light:border-amber-300">
            <div className="text-[11px] font-medium text-amber-400 light:text-amber-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Payout</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300 light:text-amber-700 mt-1">
              ₹{stats.pending_cash}
            </div>
            <div className="text-[10px] text-amber-400/70 light:text-amber-600/80 mt-0.5">
              {stats.pending_cash > 0 ? 'Admin disbursing soon' : 'All payouts cleared'}
            </div>
          </div>
        </div>

        {/* Shareable Link Box */}
        <div className="p-4 rounded-xl bg-black/60 light:bg-zinc-100/70 border border-zinc-800 light:border-zinc-200 space-y-2">
          <label className="text-xs font-semibold text-zinc-300 light:text-zinc-700 flex items-center justify-between">
            <span>Your Personal Referral Link &amp; Code</span>
            <span className="font-mono text-[11px] text-emerald-400 light:text-emerald-600">
              Code: <strong className="text-white light:text-zinc-900">{referralCode || '...'}</strong>
            </span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={activeLink}
              className="flex-1 bg-zinc-900 light:bg-white border border-zinc-800 light:border-zinc-300 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 light:text-zinc-800 select-all focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 light:bg-zinc-200 light:hover:bg-zinc-300 text-xs font-semibold text-white light:text-zinc-900 transition-colors cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Payout Settings: UPI & Bank Details */}
        <div className="rounded-xl border border-zinc-800 light:border-zinc-200 p-4 sm:p-5 bg-zinc-950/40 light:bg-zinc-50/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white light:text-zinc-900">
                Where should we send your ₹150 cash rewards?
              </h3>
            </div>
            {payoutSettings.upi_id || payoutSettings.bank_details?.account_number ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 light:text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Payout Destination Saved
              </span>
            ) : (
              <span className="text-[11px] text-amber-400 light:text-amber-700 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Add UPI or Bank to receive cash
              </span>
            )}
          </div>

          {/* Type Toggle */}
          <div className="flex items-center gap-2 max-w-xs">
            <button
              type="button"
              onClick={() => setSelectedType('upi')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedType === 'upi'
                  ? 'bg-emerald-500/20 text-emerald-300 light:text-emerald-700 border border-emerald-500/50'
                  : 'bg-zinc-900 light:bg-zinc-200 text-zinc-400 light:text-zinc-700 border border-zinc-800 light:border-zinc-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>UPI ID (Instant)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('bank')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedType === 'bank'
                  ? 'bg-emerald-500/20 text-emerald-300 light:text-emerald-700 border border-emerald-500/50'
                  : 'bg-zinc-900 light:bg-zinc-200 text-zinc-400 light:text-zinc-700 border border-zinc-800 light:border-zinc-300 hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Bank Account</span>
            </button>
          </div>

          <form onSubmit={handleSavePayoutDetails} className="space-y-4">
            {selectedType === 'upi' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 light:text-zinc-700">
                  Your UPI ID (VPA)
                </label>
                <input
                  type="text"
                  placeholder="e.g. yourname@oksbi or 9876543210@paytm"
                  value={upiInput}
                  onChange={e => setUpiInput(e.target.value)}
                  className="w-full bg-black/60 light:bg-white border border-zinc-800 light:border-zinc-300 rounded-lg px-3 py-2 text-xs text-white light:text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-zinc-500 light:text-zinc-400">
                  Admin will disburse ₹150 directly to this UPI address on every eligible referral purchase.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-zinc-300 light:text-zinc-700">Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="Full name as per bank records"
                    value={bankHolder}
                    onChange={e => setBankHolder(e.target.value)}
                    className="w-full bg-black/60 light:bg-white border border-zinc-800 light:border-zinc-300 rounded-lg px-3 py-2 text-xs text-white light:text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300 light:text-zinc-700">Account Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 50100123456789"
                    value={bankAccNumber}
                    onChange={e => setBankAccNumber(e.target.value)}
                    className="w-full bg-black/60 light:bg-white border border-zinc-800 light:border-zinc-300 rounded-lg px-3 py-2 text-xs font-mono text-white light:text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300 light:text-zinc-700">Confirm Account Number</label>
                  <input
                    type="text"
                    placeholder="Re-enter account number"
                    value={bankAccConfirm}
                    onChange={e => setBankAccConfirm(e.target.value)}
                    className="w-full bg-black/60 light:bg-white border border-zinc-800 light:border-zinc-300 rounded-lg px-3 py-2 text-xs font-mono text-white light:text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300 light:text-zinc-700">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC0001234"
                    value={bankIfsc}
                    onChange={e => setBankIfsc(e.target.value.toUpperCase())}
                    className="w-full bg-black/60 light:bg-white border border-zinc-800 light:border-zinc-300 rounded-lg px-3 py-2 text-xs font-mono text-white light:text-zinc-900 uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300 light:text-zinc-700">Bank Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank, SBI"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full bg-black/60 light:bg-white border border-zinc-800 light:border-zinc-300 rounded-lg px-3 py-2 text-xs text-white light:text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {saveSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 light:text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{saveSuccess}</span>
              </div>
            )}

            {saveError && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 light:text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-white light:bg-zinc-900 text-black light:text-white text-xs font-semibold hover:bg-zinc-200 light:hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {saving ? 'Saving Details...' : 'Save Payout Details'}
            </button>
          </form>
        </div>

        {/* Referral Activity / Rewards History */}
        {history.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-zinc-300 light:text-zinc-700">
              Recent Referral Rewards ({history.length})
            </h4>
            <div className="rounded-xl border border-zinc-800 light:border-zinc-200 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/80 light:bg-zinc-100 text-zinc-400 light:text-zinc-600 font-mono text-[11px] border-b border-zinc-800 light:border-zinc-200">
                  <tr>
                    <th className="py-2.5 px-3">Friend</th>
                    <th className="py-2.5 px-3">Plan</th>
                    <th className="py-2.5 px-3">Reward</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 light:divide-zinc-200 text-zinc-300 light:text-zinc-700">
                  {history.map(item => (
                    <tr key={item.referral_id} className="hover:bg-zinc-900/30 light:hover:bg-zinc-50">
                      <td className="py-2.5 px-3 font-mono">{item.referee_email_masked}</td>
                      <td className="py-2.5 px-3 capitalize">{item.plan_id}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-400 light:text-emerald-700 font-bold">
                        ₹{item.reward_amount}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-500 text-[11px]">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3">
                        {item.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 light:text-emerald-700 border border-emerald-500/30 font-semibold">
                            <Check className="w-3 h-3" />
                            Disbursed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 light:text-amber-700 border border-amber-500/30 font-semibold">
                            <Clock className="w-3 h-3" />
                            Pending Transfer
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
