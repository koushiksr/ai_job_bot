'use client'

import React from 'react'
import { X, Check, Building2, Crown, Sparkles, ArrowRight, ShieldCheck, Lock } from 'lucide-react'
import { ORG_PLANS, PlanDefinition } from '@/config/plans'

interface OrgPlansModalProps {
  isOpen: boolean
  onClose: () => void
  userPlan: string
  isPlanActive: boolean
  onSelectPlan: (planId: 'org_pro' | 'org_pro_3m') => void
  isLoading?: boolean
  loadingPlanId?: string | null
}

export default function OrgPlansModal({
  isOpen,
  onClose,
  userPlan,
  isPlanActive,
  onSelectPlan,
  isLoading = false,
  loadingPlanId = null
}: OrgPlansModalProps) {
  if (!isOpen) return null

  // Determine current active tier's price weight to gray out lower tiers
  const currentPlanDef = ORG_PLANS.find(p => p.id === userPlan)
  const currentAmount = isPlanActive && currentPlanDef ? currentPlanDef.amountPaise : 0

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#0c0c0f] light:bg-white border border-zinc-800 light:border-zinc-300 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 light:border-zinc-200 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white light:text-zinc-900">
                  Organization Member Plans
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 light:text-cyan-700 border border-cyan-500/30 uppercase">
                  Institutional
                </span>
              </div>
              <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
                Subsidized autonomous tiers synchronized with your organization.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white light:hover:text-zinc-900 hover:bg-zinc-800 light:hover:bg-zinc-100 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plans List */}
        <div className="space-y-3 pt-1">
          {ORG_PLANS.map((plan: PlanDefinition) => {
            const isActive = isPlanActive && userPlan === plan.id
            const isLowerTier = isPlanActive && currentAmount > plan.amountPaise
            const isLocked = isActive || isLowerTier
            const isSelectedLoading = isLoading && loadingPlanId === plan.id

            return (
              <div
                key={plan.id}
                className={`p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-zinc-950/50 light:bg-zinc-100/50 border-amber-500/40 opacity-70 cursor-not-allowed'
                    : isLowerTier
                    ? 'bg-zinc-950/30 light:bg-zinc-100/30 border-zinc-900 light:border-zinc-300 opacity-40 cursor-not-allowed select-none'
                    : 'bg-zinc-900/90 light:bg-zinc-50 border-zinc-700 light:border-zinc-300 hover:border-amber-400/80 shadow-md'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white light:text-zinc-900 flex items-center gap-1.5">
                        {plan.id === 'org_pro_3m' ? (
                          <Crown className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-amber-400" />
                        )}
                        {plan.name}
                      </span>

                      {isActive ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          CURRENT ACTIVE
                        </span>
                      ) : isLowerTier ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-800 text-zinc-500 border border-zinc-700">
                          INCLUDED IN ACTIVE TIER
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {plan.badge || 'UPGRADE'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 light:text-zinc-600 line-clamp-1">
                      {plan.subtitle}
                    </p>
                  </div>

                  {/* Price Tag */}
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold font-mono text-white light:text-zinc-900">
                      {plan.price}
                      <span className="text-[11px] font-normal text-zinc-400 light:text-zinc-600 ml-1">
                        {plan.period}
                      </span>
                    </div>
                    {plan.originalPrice && !isLocked && (
                      <div className="text-[10px] text-zinc-500 line-through">
                        {plan.originalPrice}
                      </div>
                    )}
                  </div>
                </div>

                {/* Features Pill Strip */}
                <div className="mt-3 pt-3 border-t border-zinc-800/60 light:border-zinc-200 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {plan.features.slice(0, 4).map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-zinc-300 light:text-zinc-700">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{f.text}</span>
                    </div>
                  ))}
                </div>

                {/* Action CTA */}
                <div className="mt-3.5 pt-2 flex items-center justify-end">
                  {isActive ? (
                    <button
                      type="button"
                      disabled
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-800/80 text-zinc-400 text-xs font-semibold cursor-not-allowed flex items-center gap-1.5 border border-zinc-700/60"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Active Plan</span>
                    </button>
                  ) : isLowerTier ? (
                    <button
                      type="button"
                      disabled
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-900 text-zinc-500 text-xs font-medium cursor-not-allowed flex items-center gap-1.5 border border-zinc-800"
                    >
                      <Lock className="w-3 h-3 text-zinc-600" />
                      <span>Current Tier Includes This</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectPlan(plan.id as 'org_pro' | 'org_pro_3m')}
                      disabled={isLoading}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span>
                        {isSelectedLoading
                          ? 'Opening Gateway…'
                          : !isPlanActive
                          ? `Get ${plan.name}`
                          : `Upgrade to ${plan.name}`}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Guarantee */}
        <div className="pt-2 border-t border-zinc-800/80 light:border-zinc-200 flex items-center justify-between text-[11px] text-zinc-500 light:text-zinc-600">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Razorpay Checkout • Instantly Activated</span>
          </div>
          <span>Cancel or switch anytime</span>
        </div>
      </div>
    </div>
  )
}
