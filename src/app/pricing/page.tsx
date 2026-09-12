'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Zap, Sparkles, Shield, Clock, ArrowRight, X, CreditCard, ChevronRight, User, Sliders, Calculator, TrendingUp, Building2, Users, FolderKanban, CheckCheck, Phone, Mail, Send, Headset, Loader2 } from 'lucide-react'
import JobFluxLogo from '@/components/JobFluxLogo'

interface Plan {
  id: string
  name: string
  badge?: string
  price: string
  originalPrice?: string
  period: string
  description: string
  features: string[]
  cta: string
  highlight?: boolean
  popular?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'trial',
    name: '1-Day Free Trial',
    badge: 'Zero Risk',
    price: '₹0',
    period: 'for 24 hours',
    description: 'Test the automated application engine completely free for 1 full day.',
    features: [
      '1 Full Day of Autonomous Auto-Apply',
      'Up to 15 Verified Job Applications',
      'Automated screening questions answered',
      'Real-time application tracking dashboard',
      'Zero credit card required to start'
    ],
    cta: 'Start 1-Day Free Trial',
    highlight: false
  },
  {
    id: 'pro',
    name: '1-Month Full Access',
    badge: '🔥 67% OFF LAUNCH SPECIAL',
    price: '₹499',
    originalPrice: '₹1,499',
    period: 'for 30 days (1 Full Month)',
    description: 'Complete 30-day autonomous daily job hunt to flood your inbox with interview calls.',
    features: [
      '30 Days of Continuous Daily Auto-Apply',
      'Up to 600+ Verified Job Applications',
      'Dual Daily Automation Runs (6:00 AM & 8:00 AM IST)',
      'AI tailored responses for recruiter questions',
      'Target role, location & salary preference filters',
      'Priority execution server queue',
      'Live application history with direct recruiter links'
    ],
    cta: 'Get 1 Month for ₹499',
    popular: true,
    highlight: true
  },
  {
    id: 'elite',
    name: '3-Month Career Elite',
    badge: 'Best Value (Save 65%)',
    price: '₹1,199',
    originalPrice: '₹3,499',
    period: 'for 90 days (3 Months)',
    description: 'Comprehensive 90-day pipeline until you sign your dream job offer.',
    features: [
      '90 Days of Continuous Daily Auto-Apply',
      'Up to 1,800+ Verified Job Applications',
      'VIP priority server queue slot',
      'Continuous daily applications until hired',
      'Resume optimization review by AI',
      'Dedicated priority recruiter assistance'
    ],
    cta: 'Get 3 Months (₹1,199)',
    highlight: false
  }
]

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [candidateEmail, setCandidateEmail] = useState('')
  const [paymentStep, setPaymentStep] = useState<'details' | 'success'>('details')
  const [activating, setActivating] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')

  // Interactive ROI & Time Saved Calculator State
  const [calcAppsPerWeek, setCalcAppsPerWeek] = useState<number>(35)

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
    }
  }, [])

  const handleOpenPlanModal = (plan: Plan) => {
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
        description: selectedPlan.name,
        image: '/favicon.svg',
        order_id: orderData.order_id,
        prefill: {
          email: candidateEmail,
          name: typeof window !== 'undefined' ? localStorage.getItem('user_id')?.replace(/_/g, ' ') || '' : ''
        },
        theme: {
          color: '#2563eb'
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
                user_id: storedUid || undefined,
                email: candidateEmail
              })
            })

            const verifyData = await verifyRes.json()
            if (verifyRes.ok) {
              if (typeof window !== 'undefined') {
                localStorage.setItem('user_plan', selectedPlan.id)
              }
              setPaymentStep('success')
            } else {
              alert(verifyData.detail || 'Payment verification failed.')
            }
          } catch (vErr: any) {
            alert(`Payment verification error: ${vErr.message}`)
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

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0b0f17]/90 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <JobFluxLogo size="sm" />
          </Link>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="w-5 h-5 rounded-md bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                    {(currentUserEmail || currentUserId || 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-slate-300 font-mono text-[11px] max-w-[160px] truncate">
                    {currentUserEmail || currentUserId}
                  </span>
                </div>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/"
                  className="text-xs text-slate-400 hover:text-white transition-colors font-medium px-2 py-1"
                >
                  Sign In
                </Link>
                <Link
                  href="/?mode=trial"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20"
                >
                  Start 1-Day Free Trial
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-12 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-blue-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-lg shadow-amber-500/10">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>🔥 Special Launch Offer: 1 Full Month of Daily Autonomous Applications for just ₹499!</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            AI Applies to Jobs for You. <br className="hidden sm:inline" />
            <span className="text-sky-400">Choose Your Plan.</span>
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Every plan includes automated daily job applications submitted directly on your behalf, custom answers for recruiter screening questions, and full tracking.
          </p>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 flex flex-col justify-between border transition-all ${
                plan.popular
                  ? 'bg-slate-900/90 border-blue-500 shadow-2xl shadow-blue-500/20 scale-105 z-10 ring-1 ring-blue-500/50'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-lg shadow-blue-600/30 whitespace-nowrap">
                  {plan.badge || 'Most Popular'}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{plan.name}</h3>
                  {plan.badge && !plan.popular && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-3xl md:text-4xl font-extrabold text-white">{plan.price}</span>
                    {plan.originalPrice && (
                      <span className="text-sm text-slate-500 line-through font-bold">
                        {plan.originalPrice}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-medium">{plan.period}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{plan.description}</p>
                </div>

                <div className="h-px bg-slate-800" />

                {/* Features List */}
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="p-0.5 rounded-full bg-blue-500/10 text-sky-400 shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => handleOpenPlanModal(plan)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <span>{plan.id === 'trial' && isLoggedIn ? 'Active on Dashboard' : plan.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Enterprise & Institutional Bulk Teams Plan */}
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-blue-950/40 via-indigo-950/50 to-slate-900/80 border border-indigo-500/40 p-8 md:p-10 shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>🏢 Enterprise, Staffing Agencies & Colleges</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Bulk Candidate Licensing & Grouped Data Access
              </h3>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                Managing multiple job seekers? Group candidates into cohorts, track aggregated application velocity, monitor recruiter callbacks, and deploy autonomous automation across your entire agency talent pool.
              </p>
            </div>

            <div className="shrink-0 w-full sm:w-auto text-left lg:text-right space-y-3">
              <div>
                <div className="text-2xl md:text-3xl font-extrabold text-white">Custom Volume Rates</div>
                <span className="text-xs text-indigo-400 font-semibold">Tiered pricing for 10 to 500+ candidates</span>
              </div>
              <button
                onClick={() => {
                  setShowEnterpriseModal(true)
                  setEnterpriseSuccess(false)
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Contact Enterprise Sales</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-800/80" />

          {/* 4 Pillars of Enterprise Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-400 font-bold">
                <FolderKanban className="w-4 h-4" />
                <span>Candidate Grouping</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Organize candidates by batch, client, or skill set (e.g. &apos;2026 Batch CS&apos;, &apos;Java Cohort&apos;).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-sky-400 font-bold">
                <Users className="w-4 h-4" />
                <span>Multi-User Telemetry</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Supervise applied openings, match scores, and ATS delivery receipts for all candidates from one hub.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Zap className="w-4 h-4" />
                <span>Dedicated Automation</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Dedicated worker threads ensuring all cohort candidates execute early morning applications on time.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Headset className="w-4 h-4" />
                <span>Priority Account Manager</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Direct WhatsApp and Slack support channel with dedicated onboarding assistance.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive "Hours & Money Saved" ROI Calculator */}
        <section className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-[#0c1017] via-slate-900/80 to-[#0c1017] border border-blue-500/30 shadow-2xl space-y-8 max-w-5xl mx-auto">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" /> Interactive ROI & Effort Calculator
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              See How Much Time & Energy You Save with JobFlux AI
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl mx-auto">
              Drag the slider to match your weekly application target and discover how our autonomous bot pays for itself 10x over.
            </p>
          </div>

          {/* Slider Control */}
          <div className="max-w-xl mx-auto space-y-3 bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>Your Weekly Application Target:</span>
              </label>
              <span className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-mono font-bold">
                {calcAppsPerWeek} jobs / week
              </span>
            </div>
            
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={calcAppsPerWeek}
              onChange={(e) => setCalcAppsPerWeek(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />

            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>10 / week (Casual)</span>
              <span>50 / week (Active)</span>
              <span>100 / week (Aggressive)</span>
            </div>
          </div>

          {/* 3 Value Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-blue-500/20 space-y-2 text-center hover:border-blue-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-sky-400 flex items-center justify-center font-bold mx-auto">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">
                ~{Math.round((calcAppsPerWeek * 6 / 60) * 4.3)} hrs
              </div>
              <div className="text-xs font-bold text-slate-200">Reclaimed Every Month</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Time freed up for interview preparation, system design prep, and resting instead of manual form filling.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/70 border border-purple-500/20 space-y-2 text-center hover:border-purple-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold mx-auto">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">
                ~{Math.round(calcAppsPerWeek * 16 * 4.3).toLocaleString()}+
              </div>
              <div className="text-xs font-bold text-slate-200">Repetitive Clicks Saved</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Zero tedious resume re-uploads or manual dropdown selections for notice period, location, and CTC.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/70 border border-emerald-500/20 space-y-2 text-center hover:border-emerald-500/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold mx-auto">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                ₹16.60 / day
              </div>
              <div className="text-xs font-bold text-slate-200">Effective Daily Investment</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                A placement agency charges ₹5,000–₹15,000. JobFlux AI delivers twice daily for less than the price of a chai.
              </p>
            </div>
          </div>

          {/* Quick CTA inside calculator */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-purple-900/20 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white">Ready to automate your job search pipeline?</span> Lock in 1 Full Month of daily autonomous applications for only <strong className="text-emerald-400">₹499</strong>.
              </div>
            </div>
            <button
              onClick={() => handleOpenPlanModal(PLANS[1])}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Get Started at ₹499</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Why JobFlux AI Comparison */}
        <section className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              How JobFlux AI Applies On Your Behalf
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto">
              You no longer have to spend 4 hours every evening clicking apply and filling forms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-sky-400 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-white text-sm">Twice-Daily Automated Runs</h4>
              <p className="text-slate-400 leading-relaxed">
                The bot navigates recommended jobs every day at 6:00 AM & 8:00 AM IST, ensuring your profile is among the first seen by recruiters.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-white text-sm">Smart Screening Answers</h4>
              <p className="text-slate-400 leading-relaxed">
                Complex questions like notice period, relocation, and CTC are answered intelligently using your preconfigured answers and AI reasoning.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Shield className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-white text-sm">Employer Blacklisting</h4>
              <p className="text-slate-400 leading-relaxed">
                Add your current or previous employers to the avoid list so JobFlux AI never applies to companies you want to steer clear of.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Plan Purchase & Activation Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white">Activate {selectedPlan.name}</h3>
                  <span className="text-xs text-sky-400 font-bold">{selectedPlan.price} {selectedPlan.period}</span>
                </div>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {paymentStep === 'details' ? (
                <form onSubmit={handleActivatePlan} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Candidate Account Email
                    </label>
                    <input
                      type="email"
                      value={candidateEmail}
                      onChange={e => setCandidateEmail(e.target.value)}
                      placeholder="Your candidate login email"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      The plan will be linked to this account for automated applications.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Select Payment Method
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 p-2.5 rounded-lg border border-blue-500 bg-blue-500/10 text-white font-medium cursor-pointer">
                        <input type="radio" name="paymentMethod" defaultChecked className="accent-blue-500" />
                        <span>UPI / QR</span>
                      </label>
                      <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 font-medium cursor-pointer">
                        <input type="radio" name="paymentMethod" className="accent-blue-500" />
                        <span>Card / NetBanking</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={activating}
                    className="w-full py-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {activating ? (
                      <span>Connecting to gateway...</span>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Complete Activation ({selectedPlan.price})</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Plan Successfully Activated!</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedPlan.name} is now active for {candidateEmail}.
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-md hover:bg-blue-500 transition-colors"
                  >
                    <span>Go to Dashboard</span>
                    <ChevronRight className="w-4 h-4" />
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowEnterpriseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#0c1017] border border-indigo-500/40 rounded-3xl p-6 shadow-2xl space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Enterprise & Bulk Inquiries</h3>
                    <p className="text-xs text-slate-400">Custom volume licensing for staffing & colleges</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEnterpriseModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {enterpriseSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Inquiry Received Successfully!</h4>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                    Thank you for reaching out. Our enterprise team will review your requirements and reach out via email/phone within <strong>4 business hours</strong> with custom volume pricing.
                  </p>
                  <div className="pt-2 text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Direct Enterprise Desk: <strong>enterprise@jobfluxai.com</strong></span>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={() => setShowEnterpriseModal(false)}
                      className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEnterpriseSubmit} className="space-y-4">
                  {enterpriseError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                      {enterpriseError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Contact Name *</label>
                      <input
                        type="text"
                        required
                        value={enterpriseForm.name}
                        onChange={(e) => setEnterpriseForm({ ...enterpriseForm, name: e.target.value })}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Work / Corporate Email *</label>
                      <input
                        type="email"
                        required
                        value={enterpriseForm.email}
                        onChange={(e) => setEnterpriseForm({ ...enterpriseForm, email: e.target.value })}
                        placeholder="name@company.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Company / Institution *</label>
                      <input
                        type="text"
                        required
                        value={enterpriseForm.company}
                        onChange={(e) => setEnterpriseForm({ ...enterpriseForm, company: e.target.value })}
                        placeholder="e.g. Apex Staffing Solutions"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Candidate Seats / Volume *</label>
                      <select
                        value={enterpriseForm.seats}
                        onChange={(e) => setEnterpriseForm({ ...enterpriseForm, seats: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="10-25 Candidates">10 – 25 Candidates (Starter Team)</option>
                        <option value="25-50 Candidates">25 – 50 Candidates (Growth Agency)</option>
                        <option value="50-100 Candidates">50 – 100 Candidates (Mid-Tier Cohort)</option>
                        <option value="100-250 Candidates">100 – 250 Candidates (College Batch)</option>
                        <option value="250-500+ Candidates">250 – 500+ Candidates (Large Enterprise)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Phone / WhatsApp Number *</label>
                    <input
                      type="tel"
                      required
                      value={enterpriseForm.phone}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Cohort Requirements / Notes (Optional)</label>
                    <textarea
                      rows={3}
                      value={enterpriseForm.notes}
                      onChange={(e) => setEnterpriseForm({ ...enterpriseForm, notes: e.target.value })}
                      placeholder="Tell us about your candidate batch, target roles, or any specific ATS requirements..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={enterpriseSubmitting}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {enterpriseSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Sending Inquiry...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Enterprise Inquiry & Request Quote</span>
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
    </div>
  )
}

