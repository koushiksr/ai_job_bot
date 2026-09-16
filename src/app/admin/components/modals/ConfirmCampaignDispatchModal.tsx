'use client'

import React, { useEffect } from 'react'
import { AlertTriangle, Sparkles, RefreshCw, Send } from 'lucide-react'

interface ConfirmCampaignDispatchModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  sendingOffer: boolean
  offerTitle: string
  targetType: 'single' | 'multiple' | 'bulk_unsubscribed' | 'all_users'
  targetEmail: string
  selectedCandidates: string[]
  customExtraEmails: string
  unsubscribedCount: number
  totalCandidatesCount: number
  discountedPrice: string
  promoCode: string
  validityHours: number
  forceOverride: boolean
}

export default function ConfirmCampaignDispatchModal({
  isOpen,
  onClose,
  onConfirm,
  sendingOffer,
  offerTitle,
  targetType,
  targetEmail,
  selectedCandidates,
  customExtraEmails,
  unsubscribedCount,
  totalCandidatesCount,
  discountedPrice,
  promoCode,
  validityHours,
  forceOverride
}: ConfirmCampaignDispatchModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const targetCount = Array.from(new Set([...selectedCandidates, ...customExtraEmails.split(/[,;\n]/).map(e => e.trim().toLowerCase()).filter(e => e && e.includes('@'))])).length

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl shadow-black space-y-4"
      >
        <div className="flex items-center gap-3 text-amber-400">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Confirm Campaign Dispatch</h3>
            <p className="text-[11px] text-zinc-400">Mandatory administrative authorization</p>
          </div>
        </div>

        <div className="p-3.5 bg-black/70 border border-zinc-800 rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Campaign:</span>
            <span className="font-semibold text-white">{offerTitle}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Target Audience:</span>
            <span className="font-mono text-amber-300 capitalize">
              {targetType === 'single'
                ? targetEmail
                : targetType === 'multiple'
                ? `${targetCount} Selected Candidates`
                : targetType === 'bulk_unsubscribed'
                ? `${unsubscribedCount} Unsubscribed Candidates`
                : `${totalCandidatesCount} Registered Candidates`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Delivery Channels:</span>
            <span className="font-mono text-sky-400">Email + Native Background Web Push</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Pricing / Code:</span>
            <span className="font-mono text-emerald-400">{discountedPrice} · {promoCode}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Validity Window:</span>
            <span className="font-mono text-amber-400 font-bold">{validityHours} Hours ({Math.round(validityHours / 24 * 10) / 10} days)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Sales Policy Rule:</span>
            <span className={`font-mono font-bold text-[11px] ${
              forceOverride ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {forceOverride ? 'Override Active (Forced VIP Upsell)' : 'Enforced (1-2 Days Before Expiry Only)'}
            </span>
          </div>
        </div>

        <div className="p-3 bg-zinc-950/90 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 space-y-1.5">
          <div className="text-white font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Dual-Channel Delivery &amp; Anti-Spam Safeguard:</span>
          </div>
          <p className="leading-relaxed">
            • <strong>Email Delivery:</strong> Dispatches custom branded HTML offer via Google SMTP.<br />
            • <strong>Background Web Push:</strong> Delivers native OS banners to Android &amp; desktop via Google FCM and Apple APNs (reaches devices even when browser tab is closed).<br />
            • <strong>Smart Tagging:</strong> Uses promo code tagging to replace duplicate alerts rather than spamming multiple buzzes on candidate phones.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={sendingOffer}
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={sendingOffer}
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {sendingOffer ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Dispatching Campaign...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Confirm &amp; Dispatch Campaign</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
