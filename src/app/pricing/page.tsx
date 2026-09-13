'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  Zap,
  ArrowRight,
  X,
  CreditCard,
  Building2,
  Users,
  FolderKanban,
  CheckCheck,
  Mail,
  Send,
  Headset,
  Loader2,
  Sliders,
  Sparkles,
  LogOut,
  ShieldCheck,
  Lock
} from 'lucide-react'
import JobFluxLogo from '@/components/JobFluxLogo'
import JobFluxHelpModal from '@/components/JobFluxHelpModal'
import LiquidFlowMesh from '@/components/LiquidFlowMesh'

interface Plan {
  id: string
  name: string
  subtitle: string
  badge?: string
  price: string
  originalPrice?: string
  period: string
  featuresIntro: string
  features: { text: string; isAddon?: boolean }[]
  cta: string
  highlight?: boolean
  popular?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'trial',
    name: 'Free',
    subtitle: 'No credit card needed. Start testing for free.',
    price: '₹0',
    period: '/ 24 hours',
    featuresIntro: 'Up to 15 verified job applications with zero risk, plus...',
    features: [
      { text: '1 Full Day of Autonomous Auto-Apply' },
      { text: 'Up to 15 Verified Job Applications' },
      { text: 'Automated screening questions answered' },
      { text: 'Real-time application telemetry dashboard' },
      { text: 'Zero credit card required to start' }
    ],
    cta: 'Start free trial',
    highlight: false
  },
  {
    id: 'pro',
    name: 'Essentials',
    subtitle: 'For candidates with daily proactive application demands.',
    badge: 'POPULAR',
    price: '₹99',
    originalPrice: '₹1,000',
    period: '/ month',
    featuresIntro: 'Everything in Free, with 600+ monthly applications, plus...',
    features: [
      { text: '30 Days of Continuous Daily Auto-Apply' },
      { text: 'Up to 600+ Verified Job Applications' },
      { text: 'Daily Autonomous Application Sweeps' },
      { text: 'AI Tailored Responses for Recruiter Screening' },
      { text: 'Target Role, Location & Salary Filters' },
      { text: 'Priority Cloud Worker Queue' },
      { text: 'Live Application History & Recruiter Links' }
    ],
    cta: 'Get 1 Month for ₹99',
    popular: true,
    highlight: true
  },
  {
    id: 'elite',
    name: 'Professional',
    subtitle: 'Best for comprehensive pipeline until you sign an offer.',
    price: '₹199',
    originalPrice: '₹2,500',
    period: '/ 3 months',
    featuresIntro: 'Everything in Essentials, with extended 90-day pipeline, plus...',
    features: [
      { text: '90 Days of Continuous Daily Auto-Apply' },
      { text: 'Up to 1,800+ Verified Job Applications' },
      { text: 'VIP Priority Server Queue Slot' },
      { text: 'AI Resume Optimization & Keyword Match' },
      { text: 'On-Demand Real-Time Sweeps (Up to 5x / week)' },
      { text: 'Continuous Applications Until Hired' },
      { text: 'Dedicated Recruiter Response Priority' }
    ],
    cta: 'Get 3 Months (₹199)',
    highlight: false
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    subtitle: 'For staffing agencies and colleges needing cohort scale.',
    price: 'Custom',
    period: '/ volume quote',
    featuresIntro: 'Everything in Professional, with bulk candidate controls, plus...',
    features: [
      { text: 'Bulk Candidate Licensing (10 to 500+ Seats)' },
      { text: 'Candidate Cohort Grouping & Batching' },
      { text: 'Multi-User Telemetry & Aggregated Stats' },
      { text: 'Dedicated Cloud Automation Workers' },
      { text: 'Priority SLA & Dedicated Support Desk' },
      { text: 'Custom ATS Integration & Webhooks', isAddon: true },
      { text: 'Dedicated Placement Coordinator', isAddon: true }
    ],
    cta: 'Contact sales',
    highlight: false
  }
]

export default function PricingPage() {
  const [useCase, setUseCase] = useState<'b2c' | 'b2b'>('b2c')
  const [monthlyVolume, setMonthlyVolume] = useState<number>(600)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [candidateEmail, setCandidateEmail] = useState('')
  const [paymentStep, setPaymentStep] = useState<'details' | 'success'>('details')
  const [activating, setActivating] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  // Enterprise & Bulk Inquiry Modal State
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false)
  const [enterpriseForm, setEnterpriseForm] = useState({
    name: '',
    email: '',
    company: '',
    seats: '25-50 Candidates',
    phone: '',
    notes: ''
  })
  const [enterpriseSubmitting, setEnterpriseSubmitting] = useState(false)
  const [enterpriseSuccess, setEnterpriseSuccess] = useState(false)
  const [enterpriseError, setEnterpriseError] = useState('')

  // Promo Code & Special Purchase Offers State
  const [inputPromoCode, setInputPromoCode] = useState('')
  const [appliedPromoCode, setAppliedPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState<{
    code: string
    displayPrice: string
    label: string
    durationDays?: number
  } | null>(null)
  const [promoError, setPromoError] = useState('')

  const PROMO_DEFINITIONS: Record<
    string,
    { displayPrice: string; label: string; allowedPlans: string[]; durationDays?: number }
  > = {
    FLASH49: {
      displayPrice: '₹49',
      label: '95% OFF Flash Pass (Actual ₹1,000 / mo)',
      allowedPlans: ['pro', 'starter'],
      durationDays: 30
    },
    SPRINT69: {
      displayPrice: '₹69',
      label: '93% OFF Weekend Sprint (Actual ₹1,000 / mo)',
      allowedPlans: ['pro', 'starter'],
      durationDays: 30
    },
    OFFER90: {
      displayPrice: '₹99',
      label: '90% OFF Special Pass (Actual ₹1,000 / mo)',
      allowedPlans: ['pro', 'starter'],
      durationDays: 30
    },
    PRO199: {
      displayPrice: '₹199',
      label: '92% OFF 3-Month Full Pass (Actual ₹2,500 / 3 mos)',
      allowedPlans: ['elite', 'professional'],
      durationDays: 90
    },
    PRO129: {
      displayPrice: '₹129',
      label: '95% OFF 3-Month Fast-Track (Actual ₹2,500 / 3 mos)',
      allowedPlans: ['elite', 'professional'],
      durationDays: 90
    },
    VIP299: {
      displayPrice: '₹299',
      label: '97% OFF Lifetime VIP Pass (Actual ₹10,000 Value)',
      allowedPlans: ['elite', 'professional'],
      durationDays: 365
    }
  }

  const applyPromoToPlan = (code: string, plan: Plan | null) => {
    const clean = code.trim().toUpperCase()
    if (!clean) {
      setAppliedPromoCode('')
      setPromoDiscount(null)
      setPromoError('')
      return
    }

    const def = PROMO_DEFINITIONS[clean]
    if (!def) {
      setPromoError('Invalid promo code. Please check and try again.')
      setAppliedPromoCode('')
      setPromoDiscount(null)
      return
    }

    if (plan && !def.allowedPlans.includes(plan.id)) {
      setPromoError(
        `Promo code ${clean} is only valid for ${
          def.allowedPlans.includes('pro') ? 'Essentials (1-Month)' : 'Professional (3-Month)'
        } plan.`
      )
      setAppliedPromoCode('')
      setPromoDiscount(null)
      return
    }

    setAppliedPromoCode(clean)
    setInputPromoCode(clean)
    setPromoDiscount({
      code: clean,
      displayPrice: def.displayPrice,
      label: def.label,
      durationDays: def.durationDays
    })
    setPromoError('')
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('user_email') || ''
      const uid = localStorage.getItem('user_id') || ''
      if (email || uid) {
        setIsLoggedIn(true)
        setCurrentUserEmail(email)
        setCurrentUserId(uid)
        setCandidateEmail(email)
        setEnterpriseForm(prev => ({
          ...prev,
          email: prev.email || email,
          name: prev.name || (uid.replace(/_/g, ' ') || '')
        }))
      }

      // Check URL query parameters for direct plan or promo code triggers
      const params = new URLSearchParams(window.location.search)
      const targetPlanId = params.get('plan')
      const promoParam = params.get('promo')

      let initialPlan: Plan | null = null
      if (targetPlanId) {
        const found = PLANS.find(p => p.id === targetPlanId || (targetPlanId === 'professional' && p.id === 'elite'))
        if (found && found.id !== 'trial') {
          initialPlan = found
        }
      } else if (promoParam) {
        const clean = promoParam.trim().toUpperCase()
        if (clean === 'FLASH49' || clean === 'SPRINT69') {
          initialPlan = PLANS.find(p => p.id === 'pro') || null
        } else if (clean === 'PRO129' || clean === 'VIP299') {
          initialPlan = PLANS.find(p => p.id === 'elite') || null
        }
      }

      if (initialPlan) {
        setSelectedPlan(initialPlan)
        setPaymentStep('details')
        if (email) setCandidateEmail(email)
      }

      if (promoParam) {
        applyPromoToPlan(promoParam, initialPlan)
      }
    }
  }, [])

  const handleOpenPlanModal = (plan: Plan) => {
    if (plan.id === 'enterprise') {
      setShowEnterpriseModal(true)
      setEnterpriseSuccess(false)
      return
    }

    if (plan.id === 'trial') {
      if (isLoggedIn) {
        window.location.href = '/dashboard'
      } else {
        window.location.href = '/?mode=trial'
      }
      return
    }

    setSelectedPlan(plan)
    setPaymentStep('details')
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('user_email') || '' : ''
    setCandidateEmail(storedEmail || currentUserEmail)

    if (appliedPromoCode) {
      applyPromoToPlan(appliedPromoCode, plan)
    }
  }

  const handleActivatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!candidateEmail || !selectedPlan) return

    setActivating(true)
    try {
      const storedUid = typeof window !== 'undefined' ? localStorage.getItem('user_id') : ''

      // 1. Create Razorpay order on backend
      const orderRes = await fetch('/api/payment/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          promo_code: appliedPromoCode || undefined,
          user_id: storedUid || undefined,
          email: candidateEmail
        })
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok) {
        throw new Error(orderData.detail || 'Failed to initiate payment')
      }

      // 2. Launch Razorpay Checkout Modal
      if (typeof window === 'undefined' || !(window as any).Razorpay) {
        throw new Error('Razorpay gateway is still loading. Please refresh and try again.')
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'JobFlux AI',
        description: orderData.plan_name || selectedPlan.name,
        image: '/jobflux-logo.svg',
        order_id: orderData.order_id,
        prefill: {
          email: candidateEmail,
          name: typeof window !== 'undefined' ? localStorage.getItem('user_id')?.replace(/_/g, ' ') || '' : ''
        },
        theme: {
          color: '#000000'
        },
        handler: async (response: any) => {
          try {
            // 3. Verify cryptographic payment signature on backend
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_id: selectedPlan.id,
                promo_code: appliedPromoCode || undefined,
                user_id: storedUid || undefined,
                email: candidateEmail
              })
            })

            const verifyData = await verifyRes.json()
            if (verifyRes.ok && verifyData.verified) {
              if (typeof window !== 'undefined') {
                localStorage.setItem('user_plan', selectedPlan.id)
              }
              setPaymentStep('success')
            } else {
              alert(verifyData.detail || 'Payment verification failed. Plan could not be activated.')
            }
          } catch (vErr: any) {
            alert(`Payment verification error: ${vErr.message}`)
          } finally {
            setActivating(false)
          }
        },
        modal: {
          ondismiss: () => {
            setActivating(false)
          }
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', (response: any) => {
        alert(`Payment failed: ${response.error?.description || response.error?.reason || 'Unknown error'}`)
        setActivating(false)
      })
      rzp.open()
    } catch (err: any) {
      alert(err.message || 'Payment error')
      setActivating(false)
    }
  }

  const handleEnterpriseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnterpriseSubmitting(true)
    setEnterpriseError('')
    try {
      const res = await fetch('/api/enterprise/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enterpriseForm)
      })
      const data = await res.json()
      if (res.ok) {
        setEnterpriseSuccess(true)
      } else {
        setEnterpriseError(data.detail || 'Failed to submit inquiry')
      }
    } catch (err: any) {
      setEnterpriseError(err.message || 'Submission error')
    } finally {
      setEnterpriseSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white relative">
      
      {/* Interactive Liquid Flow Mesh */}
      <LiquidFlowMesh
        className="h-[650px] w-full top-0 left-0"
        opacity={0.5}
        speedMultiplier={0.8}
        interactive={true}
      />

      {/* Subtle Auth0 ambient radial light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-spotlight pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-zinc-900 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <JobFluxLogo size="sm" />
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <button
              onClick={() => setIsHelpOpen(true)}
              className="text-xs text-zinc-400 hover:text-white transition-colors font-medium cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="hidden sm:inline">Help & Support</span>
            </button>

            {isLoggedIn ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                  <div className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-300 font-medium flex items-center justify-center text-[10px]">
                    {(currentUserEmail || currentUserId || 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-zinc-400 font-mono text-[11px] max-w-[160px] truncate">
                    {currentUserEmail || currentUserId}
                  </span>
                </div>
                <Link
                  href="/dashboard"
                  className="px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => {
                    localStorage.clear()
                    window.location.href = '/'
                  }}
                  className="text-xs text-zinc-400 hover:text-white transition-colors font-medium px-2 py-1 cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/?mode=signin"
                  className="text-xs text-zinc-400 hover:text-white transition-colors font-medium px-2 py-1"
                >
                  Sign In
                </Link>
                <Link
                  href="/?mode=trial"
                  className="px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-colors shrink-0 shadow-sm"
                >
                  <span className="hidden sm:inline">Start Free Trial</span>
                  <span className="sm:hidden">Try Free</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero & Auth0 Pricing Header */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:px-8 md:py-16 space-y-12 z-10">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight">
            Flexible pricing for{' '}
            <span className="text-zinc-400">
              candidates & companies
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
            Choose the right autonomous tier for your career goals or agency talent pool.
          </p>
        </div>

        {/* Auth0 Controls Bar: Use Case Segmented Pill + Volume Slider */}
        <div className="max-w-4xl mx-auto p-5 rounded-2xl bg-[#09090b] border border-zinc-800/90 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left: What is your use case? */}
          <div className="space-y-2 w-full md:w-auto">
            <label className="text-xs font-medium text-zinc-400 block">
              What is your use case?
            </label>
            <div className="inline-flex p-1 rounded-lg bg-black border border-zinc-800 text-xs">
              <button
                onClick={() => setUseCase('b2c')}
                className={`px-4 py-1.5 rounded-md font-medium transition-all ${
                  useCase === 'b2c'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Candidates (B2C)
              </button>
              <button
                onClick={() => {
                  setUseCase('b2b')
                  setShowEnterpriseModal(true)
                  setEnterpriseSuccess(false)
                }}
                className={`px-4 py-1.5 rounded-md font-medium transition-all ${
                  useCase === 'b2b'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Staffing & Teams (B2B)
              </button>
            </div>
          </div>

          {/* Right: Application / Candidate Volume Slider */}
          <div className="space-y-2 w-full md:w-80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Estimated monthly applications</span>
              <span className="font-mono text-zinc-200 font-medium">{monthlyVolume}+ jobs</span>
            </div>
            
            <input
              type="range"
              min="100"
              max="1800"
              step="100"
              value={monthlyVolume}
              onChange={(e) => setMonthlyVolume(parseInt(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>100 (Trial)</span>
              <span>600 (1-Month)</span>
              <span>1,800+ (Elite)</span>
            </div>
          </div>
        </div>

        {/* 4 Pricing Cards Grid (Auth0 Architecture) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {PLANS.map((plan) => {
            const isFeatured = plan.popular

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 flex flex-col justify-between border transition-all overflow-hidden ${
                  isFeatured
                    ? 'bg-[#0c0c0f] border-zinc-700 shadow-2xl card-featured-glow z-10'
                    : 'bg-[#09090b] border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                {/* Laser beam sweep accent for featured plan */}
                {isFeatured && (
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-laser-sweep pointer-events-none" />
                )}

                {/* Header Info */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-white">{plan.name}</h3>
                    {plan.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono uppercase">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed min-h-[36px]">
                    {plan.subtitle}
                  </p>

                  <div className="pt-2">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-3xl font-bold text-white tracking-tight">
                        {plan.price}
                      </span>
                      {plan.originalPrice && (
                        <span className="text-xs text-zinc-500 line-through">
                          {plan.originalPrice}
                        </span>
                      )}
                      <span className="text-xs text-zinc-400 font-normal">
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  {/* Primary Call to Action Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleOpenPlanModal(plan)}
                      className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isFeatured
                          ? 'bg-white hover:bg-zinc-200 text-black shadow-sm'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
                      }`}
                    >
                      <span>
                        {plan.id === 'trial' && isLoggedIn ? 'Active on Dashboard' : plan.cta}
                      </span>
                    </button>
                  </div>

                  <div className="h-px bg-zinc-800/80 my-4" />

                  {/* Features List */}
                  <div className="space-y-3">
                    <span className="text-[11px] text-zinc-400 font-medium block">
                      {plan.featuresIntro}
                    </span>

                    <ul className="space-y-2.5 text-xs text-zinc-300">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                          <span className="leading-tight text-zinc-300">
                            {feat.text}
                          </span>
                          {feat.isAddon && (
                            <span className="ml-auto text-[9px] px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
                              ADD-ON
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom Spacer */}
                <div className="pt-6" />
              </div>
            )
          })}
        </div>

        {/* Risk Reversal & Interview Assurance Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-[#09090b] border border-emerald-500/30 flex items-start gap-4 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h3 className="font-bold text-white text-sm">14-Day Interview Guarantee</h3>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                If you don&apos;t receive at least 3 recruiter profile shortlists or calls in 14 days, get a 100% full refund immediately.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#09090b] border border-sky-500/30 flex items-start gap-4 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h3 className="font-bold text-white text-sm">9 AM Resdex Freshness Bump</h3>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Silently touches your profile daily, placing you on Page 1 of recruiter searches (worth ₹15,000 in placement consulting).
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#09090b] border border-cyan-500/30 flex items-start gap-4 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h3 className="font-bold text-white text-sm">100% Local Stealth & 0 Bans</h3>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Runs using your real home IP address and human-like delays. Completely undetectable by Cloudflare or Naukri firewalls.
              </p>
            </div>
          </div>
        </div>

        {/* Staffing Agencies & Placement Cells Banner */}
        <section className="rounded-2xl bg-[#09090b] border border-zinc-800 p-8 space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">
                Institutional Cohorts
              </span>
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                Bulk candidate licensing with grouped telemetry access.
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Organize candidates into batches (e.g. CS 2026, Full Stack Cohort), track aggregated delivery receipts, and supercharge candidate placement rates across your organization.
              </p>
            </div>

            <button
              onClick={() => {
                setShowEnterpriseModal(true)
                setEnterpriseSuccess(false)
              }}
              className="px-5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-xs font-semibold transition-all shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-zinc-400" />
              <span>Request Institutional Quote</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-2">
            <div className="p-4 rounded-xl bg-black border border-zinc-800/80 space-y-1">
              <div className="text-zinc-200 font-medium flex items-center gap-2">
                <FolderKanban className="w-3.5 h-3.5 text-zinc-400" />
                <span>Cohort Grouping</span>
              </div>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                Filter and manage candidates by batch or client specialization.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black border border-zinc-800/80 space-y-1">
              <div className="text-zinc-200 font-medium flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span>Aggregated Telemetry</span>
              </div>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                Supervise total match velocity, delivery receipts, and interviews.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black border border-zinc-800/80 space-y-1">
              <div className="text-zinc-200 font-medium flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-zinc-400" />
                <span>Dedicated Workers</span>
              </div>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                Isolated cloud worker threads for reliable morning dispatch.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black border border-zinc-800/80 space-y-1">
              <div className="text-zinc-200 font-medium flex items-center gap-2">
                <Headset className="w-3.5 h-3.5 text-zinc-400" />
                <span>Dedicated SLA</span>
              </div>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                Priority direct Slack and WhatsApp channel with rapid response.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Plan Purchase & Activation Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md bg-[#09090b] border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-base font-semibold text-white">Activate {selectedPlan.name}</h3>
                  <div className="flex items-baseline gap-1.5 text-xs text-zinc-400">
                    {promoDiscount ? (
                      <>
                        <span className="line-through text-zinc-500 font-mono">{selectedPlan.price}</span>
                        <span className="font-extrabold text-amber-400 font-mono text-sm">{promoDiscount.displayPrice}</span>
                        <span>{selectedPlan.period}</span>
                      </>
                    ) : (
                      <span>{selectedPlan.price} {selectedPlan.period}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedPlan(null)
                    setPromoError('')
                  }}
                  className="p-1 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {paymentStep === 'details' ? (
                <form onSubmit={handleActivatePlan} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Candidate Account Email
                    </label>
                    <input
                      type="email"
                      value={candidateEmail}
                      onChange={e => setCandidateEmail(e.target.value)}
                      placeholder="Your login email"
                      required
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">
                      The plan will be linked to this account for automated applications.
                    </p>
                  </div>

                  {/* Promo Code / Purchase Offer Section */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center justify-between">
                      <span>Promo Code / Purchase Offer</span>
                      <span className="text-[10px] text-amber-400 font-mono">Special Deals Supported</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inputPromoCode}
                        onChange={e => {
                          setInputPromoCode(e.target.value.toUpperCase())
                          setPromoError('')
                        }}
                        placeholder="e.g. FLASH49, PRO129, VIP299"
                        className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono uppercase text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => applyPromoToPlan(inputPromoCode, selectedPlan)}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {appliedPromoCode && promoDiscount && (
                      <div className="mt-1.5 flex items-center justify-between text-[11px] bg-amber-500/10 border border-amber-500/30 rounded-md px-2.5 py-1.5 text-amber-300">
                        <span className="font-medium">✓ {appliedPromoCode}: {promoDiscount.label}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedPromoCode('')
                            setInputPromoCode('')
                            setPromoDiscount(null)
                            setPromoError('')
                          }}
                          className="text-zinc-400 hover:text-white ml-2 underline cursor-pointer text-[10px]"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    {promoError && (
                      <p className="text-[11px] text-rose-400 mt-1">{promoError}</p>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-black border border-zinc-800 space-y-2">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono block">
                      Payment Gateway
                    </span>
                    <div className="flex items-center justify-between text-xs text-zinc-300">
                      <span>UPI, Cards, NetBanking (Razorpay)</span>
                      <span className="text-emerald-400 font-mono text-[10px]">256-BIT SSL</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={activating}
                    className="w-full py-2.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {activating ? (
                      <span>Connecting to gateway...</span>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Proceed to Pay ({promoDiscount ? promoDiscount.displayPrice : selectedPlan.price})</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-white">Payment Confirmed · Plan Activated</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      {selectedPlan.name} is now cryptographically verified and active for {candidateEmail}.
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Enterprise & Bulk Licensing Inquiry Modal */}
      <AnimatePresence>
        {showEnterpriseModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowEnterpriseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-lg bg-[#09090b] border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Enterprise & Bulk Inquiries</h3>
                    <p className="text-xs text-zinc-400">Custom volume rates for staffing & placement cells</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEnterpriseModal(false)}
                  className="p-1 rounded-lg text-zinc-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {enterpriseSuccess ? (
                <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">Inquiry Received</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                    Our enterprise team will review your cohort volume and respond within <strong>4 business hours</strong> with custom seat pricing.
                  </p>
                  <div className="pt-2 text-xs text-zinc-500 flex items-center justify-center gap-1.5 font-mono">
                    <Mail className="w-3.5 h-3.5 text-zinc-400" />
                    <span>enterprise@jobfluxai.com</span>
                  </div>
                  <div className="pt-3">
                    <button
                      onClick={() => setShowEnterpriseModal(false)}
                      className="px-5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEnterpriseSubmit} className="space-y-3.5">
                  {enterpriseError && (
                    <div className="p-3 rounded-lg bg-red-950/30 border border-red-900/50 text-xs text-red-300">
                      {enterpriseError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-zinc-300 block mb-1">Contact Name *</label>
                      <input
                        type="text"
                        required
                        value={enterpriseForm.name}
                        onChange={(e) => setEnterpriseForm({ ...enterpriseForm, name: e.target.value })}
                        placeholder="Ramesh Kumar"
                        className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-300 block mb-1">Work Email *</label>
                      <input
                        type="email"
                        required
                        value={enterpriseForm.email}
                        onChange={(e) => setEnterpriseForm({ ...enterpriseForm, email: e.target.value })}
                        placeholder="name@company.com"
                        className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-zinc-300 block mb-1">Company / College *</label>
                      <input
                        type="text"
                        required
                        value={enterpriseForm.company}
                        onChange={(e) => setEnterpriseForm({ ...enterpriseForm, company: e.target.value })}
                        placeholder="Apex Staffing Solutions"
                        className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-300 block mb-1">Candidate Seats *</label>
                      <select
                        value={enterpriseForm.seats}
                        onChange={(e) => setEnterpriseForm({ ...enterpriseForm, seats: e.target.value })}
                        className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
                      >
                        <option value="10-25 Candidates">10 – 25 Candidates (Starter Team)</option>
                        <option value="25-50 Candidates">25 – 50 Candidates (Growth Agency)</option>
                        <option value="50-100 Candidates">50 – 100 Candidates (Mid-Tier Cohort)</option>
                        <option value="100-250 Candidates">100 – 250 Candidates (College Batch)</option>
                        <option value="250-500+ Candidates">250 – 500+ Candidates (Enterprise)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={enterpriseForm.phone}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1">Requirements / Notes</label>
                    <textarea
                      rows={3}
                      value={enterpriseForm.notes}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, notes: e.target.value })}
                      placeholder="Candidate batch details, target role domains..."
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none transition-colors"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={enterpriseSubmitting}
                      className="w-full py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {enterpriseSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                          <span>Sending Inquiry...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Inquiry & Request Quote</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Official Razorpay Checkout Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      {/* Universal JobFlux Help & Support Center */}
      <JobFluxHelpModal
        isOpen={isHelpOpen}
        onOpen={() => setIsHelpOpen(true)}
        onClose={() => setIsHelpOpen(false)}
        showFloatingTrigger={true}
        initialEmail={currentUserEmail}
        initialUserId={currentUserId}
      />
    </div>
  )
}
