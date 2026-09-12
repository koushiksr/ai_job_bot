'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Zap, Sparkles, Shield, Clock, ArrowRight, X, CreditCard, ChevronRight } from 'lucide-react'
import JobFluxLogo from '@/components/JobFluxLogo'

interface Plan {
  id: string
  name: string
  badge?: string
  price: string
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
    description: 'Test the automated application engine completely free for 1 day.',
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
    id: 'starter',
    name: 'Starter Sprint',
    badge: 'Urgent Seekers',
    price: '₹499',
    period: 'for 7 days',
    description: 'A focused 1-week blitz to trigger immediate recruiter callbacks.',
    features: [
      '7 Days of Continuous Daily Auto-Apply',
      'Up to 150+ Verified Job Applications',
      'Dual Daily Automation Runs (6 AM & 8 AM)',
      'Company blacklisting & preference filters',
      'Live application history & direct links'
    ],
    cta: 'Get Starter Plan',
    highlight: false
  },
  {
    id: 'pro',
    name: 'Career Pro',
    badge: 'Most Popular',
    price: '₹1,499',
    period: 'for 30 days',
    description: 'Comprehensive 1-month continuous pipeline to secure multiple offers.',
    features: [
      '30 Days of Continuous Daily Auto-Apply',
      'Up to 600+ Verified Job Applications',
      'Priority execution server queue',
      'AI tailored responses for recruiter questions',
      'Custom keyword and salary targeting',
      'Priority email & WhatsApp support'
    ],
    cta: 'Choose Pro Plan',
    popular: true,
    highlight: true
  },
  {
    id: 'elite',
    name: 'Career Elite',
    badge: 'Best Value',
    price: '₹3,499',
    period: 'for 90 days',
    description: 'Full-cycle automated job hunt with priority until you sign an offer.',
    features: [
      '90 Days of Continuous Daily Auto-Apply',
      'Up to 1,800+ Verified Job Applications',
      'VIP priority server queue slot',
      'Continuous daily applications until hired',
      'Resume optimization review by AI',
      'Dedicated recruiter assistance'
    ],
    cta: 'Choose Elite Plan',
    highlight: false
  }
]

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [candidateEmail, setCandidateEmail] = useState('')
  const [paymentStep, setPaymentStep] = useState<'details' | 'success'>('details')
  const [activating, setActivating] = useState(false)

  const handleOpenPlanModal = (plan: Plan) => {
    if (plan.id === 'trial') {
      window.location.href = '/?mode=trial'
      return
    }
    setSelectedPlan(plan)
    setPaymentStep('details')
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('user_email') || '' : ''
    setCandidateEmail(storedEmail)
  }

  const handleActivatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!candidateEmail || !selectedPlan) return

    setActivating(true)
    try {
      // Simulate plan activation in MongoDB / API
      await new Promise(r => setTimeout(r, 1200))
      setPaymentStep('success')
    } catch {
      alert('Failed to activate plan. Please try again.')
    } finally {
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

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/?mode=trial"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20"
            >
              Start 1-Day Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-12 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-sky-400 font-semibold tracking-wide uppercase inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Simple, Transparent Pricing
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            AI Applies to Jobs for You. <br className="hidden sm:inline" />
            <span className="text-sky-400">Choose Your Plan.</span>
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Every plan includes automated daily job applications submitted directly on your behalf, custom answers for recruiter screening questions, and full tracking.
          </p>
        </div>

        {/* 4 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 flex flex-col justify-between border transition-all ${
                plan.popular
                  ? 'bg-slate-900/90 border-blue-500 shadow-xl shadow-blue-500/10 scale-105 z-10'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-md">
                  Most Popular
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
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl md:text-4xl font-extrabold text-white">{plan.price}</span>
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
                  <span>{plan.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

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
    </div>
  )
}
