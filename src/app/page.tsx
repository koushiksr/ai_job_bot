'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { motion } from 'framer-motion'
import {
  ChevronRight,
  ChevronDown,
  Mail,
  Lock,
  Loader2,
  Sparkles,
  User,
  Zap,
  Gift,
  Clock,
  ArrowRight,
  Search,
  Cpu,
  Target,
  Send,
  Eye,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Award
} from 'lucide-react'
import JobFluxLogo from '@/components/JobFluxLogo'
import JobFluxSplash from '@/components/JobFluxSplash'
import AiEngineVisualizer from '@/components/AiEngineVisualizer'

export default function Home() {
  const [showSplash, setShowSplash] = useState(true)
  const [authMode, setAuthMode] = useState<'signin' | 'trial'>('signin')
  
  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check URL parameters for trial mode or errors
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      if (p.get('mode') === 'trial') {
        setAuthMode('trial')
      }
      const errParam = p.get('error')
      if (errParam) {
        setError(decodeURIComponent(errParam))
      }
    }
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const cleanEmail = email.trim().toLowerCase()
    const cleanPwd = password.trim()

    // Direct Admin check
    if (
      authMode === 'signin' &&
      (
        cleanEmail === 'admin' ||
        cleanEmail === 'admin@jobfluxai.com' ||
        cleanEmail === 'admin@jobflux.ai' ||
        cleanEmail === 'admin@jobbot.ai' ||
        cleanEmail === 'admin@admin.com'
      ) &&
      cleanPwd === 'admin'
    ) {
      localStorage.setItem('user_id', 'admin')
      localStorage.setItem('user_email', cleanEmail.includes('@') ? cleanEmail : 'admin@jobfluxai.com')
      localStorage.setItem('user_role', 'admin')
      window.location.href = '/admin'
      return
    }

    try {
      const endpoint = authMode === 'trial' ? '/api/auth/register' : '/api/auth/login'
      const payload = authMode === 'trial'
        ? { name, email: cleanEmail, password: cleanPwd, plan: 'trial' }
        : { email: cleanEmail, password: cleanPwd }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('user_id', data.user_id)
        localStorage.setItem('user_email', data.email)
        localStorage.setItem('user_role', data.role || 'user')
        if (data.plan) {
          localStorage.setItem('user_plan', data.plan)
        }
        if (data.role === 'admin') {
          window.location.href = '/admin'
        } else {
          window.location.href = '/dashboard'
        }
      } else {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Authentication failed. Please check your credentials.')
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  // Initialize Google Identity Services if client ID is configured
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (typeof window !== 'undefined' && clientId && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (response.credential) {
              setLoading(true)
              const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential })
              })
              if (res.ok) {
                const data = await res.json()
                localStorage.setItem('user_id', data.user_id)
                localStorage.setItem('user_email', data.email)
                localStorage.setItem('user_role', data.role || 'user')
                localStorage.setItem('user_plan', data.plan || 'trial')
                window.location.href = data.role === 'admin' ? '/admin' : '/dashboard'
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        })
      } catch (e) {
        console.warn('Google Identity Services initialization:', e)
      }
    }
  }, [])

  const handleGoogleAuth = () => {
    setLoading(true)
    setError('')
    window.location.href = '/api/auth/google/signin'
  }

  return (
    <>
      {showSplash && <JobFluxSplash onComplete={() => setShowSplash(false)} />}
      
      <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#080c14] text-slate-100 selection:bg-blue-600 selection:text-white">
        
        {/* Subtle background ambient radial light */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(37,99,235,0.14),rgba(255,255,255,0))] pointer-events-none" />

        {/* Top Navbar */}
        <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-20">
          <Link href="/" className="flex items-center gap-2">
            <JobFluxLogo size="sm" />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/25 text-amber-300 hover:bg-amber-500/20 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>1 Month @ ₹499</span>
            </Link>
            <Link
              href="/pricing"
              className="text-xs text-slate-400 hover:text-white transition-colors font-medium px-2.5 py-1.5 hidden sm:inline-block"
            >
              Pricing Plans
            </Link>
            <button
              onClick={() => { setAuthMode('trial'); setError('') }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20"
            >
              Start Free Trial
            </button>
          </div>
        </header>
        
        {/* Main Hero Section (Clean Above-The-Fold 2-Column Presentation) */}
        <main className="w-full max-w-7xl mx-auto px-6 py-10 md:py-16 flex-1 flex flex-col lg:flex-row items-center justify-between gap-12 z-10">
          
          {/* Left Column: Value Prop, Badges & Direct Actions */}
          <motion.div 
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 w-full text-center lg:text-left space-y-7"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-blue-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-4 shadow-md shadow-amber-500/10">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>🔥 Limited Time Launch Special: 1 Full Month for only ₹499!</span>
              </div>
              
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
                AI Applies to Jobs on Your Behalf — <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-300 to-indigo-300">
                  Every Single Day.
                </span>
              </h1>
              
              <p className="text-base sm:text-lg text-slate-400 mt-5 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Set your target role, preferred city, and compensation once. JobFlux AI continuously scans hiring feeds, answers recruiter screening questions with AI reasoning, and submits verified applications twice every morning while you sleep.
              </p>
            </div>

            {/* Benefit Badges */}
            <div className="flex flex-wrap gap-2.5 items-center justify-center lg:justify-start text-xs text-slate-300 font-medium">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <Zap className="w-4 h-4 text-sky-400" />
                <span>Dual Daily Runs (6 AM & 8 AM IST)</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <Gift className="w-4 h-4 text-emerald-400" />
                <span>1-Day Free Trial (Zero Risk)</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 font-semibold shadow-sm">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Save 20+ Hours Weekly</span>
              </div>
            </div>

            {/* Primary Action Buttons & Scroll Indicator */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => { setAuthMode('trial'); setError('') }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Start 1-Day Free Trial (₹0)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#ai-engine-showcase"
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm border border-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <span>Watch Live AI Tour</span>
                <ChevronDown className="w-4 h-4 text-sky-400 animate-bounce" />
              </a>
            </div>
          </motion.div>
          
          {/* Right Column: Authentication Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="w-full lg:w-[440px] shrink-0"
          >
            <div className="p-8 w-full border border-slate-800 bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl">
              
              {/* Tab Switcher: Sign In vs 1-Day Free Trial */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-5">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setError('') }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    authMode === 'signin'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('trial'); setError('') }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    authMode === 'trial'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Start 1-Day Free Trial
                </button>
              </div>

              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-white">
                  {authMode === 'trial' ? 'Start Free Trial' : 'Welcome Back'}
                </h2>
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {authMode === 'trial' ? 'Instant Access' : 'Engine Ready'}
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-5">
                {authMode === 'trial'
                  ? 'Test the bot free for 1 day — AI applies to verified jobs for you'
                  : 'Log in to your candidate account or control center'}
              </p>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl text-xs mb-4">
                  {error}
                </div>
              )}

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white flex items-center justify-center gap-2.5 transition-all shadow-sm mb-4 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                  or with email
                </span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              {/* Email / Password Form */}
              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'trial' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 transition-all outline-none"
                        placeholder="Your name"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Candidate Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 transition-all outline-none"
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 transition-all outline-none"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>
                        {authMode === 'trial' ? 'Start 1-Day Free Trial (₹0)' : 'Sign In'}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
                <Link
                  href="/pricing"
                  className="text-[11px] text-slate-400 hover:text-sky-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Explore all plan options & features</span>
                  <ArrowRight className="w-3 h-3 text-sky-400" />
                </Link>
              </div>
            </div>
          </motion.div>
        </main>

        {/* Section 2: EXPANSIVE CREATIVE AI ENGINE SHOWCASE (Scroll to see) */}
        <section id="ai-engine-showcase" className="w-full max-w-7xl mx-auto px-6 py-20 border-t border-slate-800/60 z-10 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-blue-500/10 border border-blue-500/25 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Interactive Platform Simulation
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Watch JobFlux Autonomous AI in Action
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Explore how our autonomous radar sweeps job portals, computes neural skill fit, solves employer screening questionnaires, and delivers verified applications early each morning.
            </p>
          </div>

          {/* Full Width Creative Visualizer Cockpit */}
          <AiEngineVisualizer />
        </section>

        {/* Section 3: 3-Pillar Autonomous Architecture */}
        <section className="w-full max-w-7xl mx-auto px-6 py-16 border-t border-slate-800/60 z-10 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Why Candidates Secure Callbacks with JobFlux
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Stop spending hours every night manually clicking apply. Let high-throughput AI do the heavy lifting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sky-400 font-bold">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">1. Intelligent Job Radar</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Continuously tracks verified openings across top company portals every morning. Filters out spam and low-reputation recruiters, focusing only on high-paying matching roles.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">2. Contextual Screening Q&A</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When recruiters prompt for notice period, relocation preferences, CTC expectations, and technical stack depth, the AI generates accurate, pre-aligned answers instantly.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">3. Early Morning Delivery</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Executes daily at 06:00 AM & 08:00 AM IST. Your profile sits directly at the top of the recruiter's inbox before hundreds of manual applicants begin applying.
              </p>
            </div>
          </div>

          {/* Social Proof & Metrics Bar */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/20 via-slate-900/60 to-purple-950/20 border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">600+</div>
              <div className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Monthly Applications</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-sky-400 font-mono">20+ Hrs</div>
              <div className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Saved Every Week</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">8.4x</div>
              <div className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">More Recruiter Views</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">100%</div>
              <div className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Autonomous & Safe</div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-slate-900 py-8 px-6 z-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <JobFluxLogo size="sm" />
              <span>© {new Date().getFullYear()} JobFlux AI. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/pricing" className="hover:text-slate-300 transition-colors">Pricing</Link>
              <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</Link>
              <Link href="/admin" className="hover:text-slate-300 transition-colors">Admin Portal</Link>
            </div>
          </div>
        </footer>
      </div>

      {/* Google Identity Services SDK Script */}
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
    </>
  )
}
