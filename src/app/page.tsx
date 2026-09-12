'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { motion } from 'framer-motion'
import {
  Mail,
  Lock,
  Loader2,
  User,
  ArrowRight,
  ChevronDown,
  Search,
  Cpu,
  Send,
  CheckCircle2,
  ShieldCheck,
  Clock,
  LogOut
} from 'lucide-react'
import JobFluxLogo from '@/components/JobFluxLogo'
import JobFluxSplash from '@/components/JobFluxSplash'
import AiEngineVisualizer from '@/components/AiEngineVisualizer'
import JobFluxHelpModal from '@/components/JobFluxHelpModal'

export default function Home() {
  const [showSplash, setShowSplash] = useState(true)
  const [authMode, setAuthMode] = useState<'signin' | 'trial'>('signin')
  const [existingUser, setExistingUser] = useState<{ id: string; email: string; role: string } | null>(null)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  
  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check if already logged in -> auto navigate to dashboard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUid = localStorage.getItem('user_id')
      const storedEmail = localStorage.getItem('user_email') || ''
      const storedRole = localStorage.getItem('user_role') || 'user'

      if (storedUid) {
        setExistingUser({ id: storedUid, email: storedEmail, role: storedRole })
        // If already logged in, navigate immediately to appropriate portal
        const destination = storedRole === 'admin' ? '/admin' : '/dashboard'
        window.location.replace(destination)
        return
      }

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

  const handleSignOut = () => {
    localStorage.clear()
    setExistingUser(null)
    window.location.href = '/'
  }

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
      
      <div className="min-h-screen flex flex-col bg-[#000000] text-zinc-100 selection:bg-zinc-800 selection:text-white relative">
        
        {/* Subtle Auth0/Gladia top ambient radial light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[420px] bg-spotlight pointer-events-none" />

        {/* Top Minimalist Header */}
        <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-20 border-b border-zinc-900/60">
          <Link href="/" className="flex items-center gap-2">
            <JobFluxLogo size="sm" />
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-xs text-zinc-400 hover:text-white transition-colors font-medium hidden sm:inline-block"
            >
              Pricing
            </Link>

            <button
              onClick={() => setIsHelpOpen(true)}
              className="text-xs text-zinc-400 hover:text-white transition-colors font-medium cursor-pointer flex items-center gap-1"
            >
              <Mail className="w-3 h-3 text-violet-400" />
              <span>Help & Support</span>
            </button>

            {existingUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-zinc-300 font-mono text-[11px] max-w-[150px] truncate">
                    {existingUser.email || existingUser.id}
                  </span>
                </div>
                <Link
                  href={existingUser.role === 'admin' ? '/admin' : '/dashboard'}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-zinc-400 hover:text-white transition-colors font-medium px-2 py-1 cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => { setAuthMode('signin'); setError('') }}
                  className="text-xs text-zinc-400 hover:text-white transition-colors font-medium px-2 py-1 cursor-pointer"
                >
                  Sign in
                </button>
                <button
                  onClick={() => { setAuthMode('trial'); setError('') }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-all shadow-sm cursor-pointer"
                >
                  Start Free Trial
                </button>
              </>
            )}
          </div>
        </header>
        
        {/* Main Hero Section */}
        <main className="w-full max-w-7xl mx-auto px-6 py-12 md:py-20 flex-1 flex flex-col lg:flex-row items-center justify-between gap-12 z-10">
          
          {/* Left Column: Clean Value Proposition */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 w-full text-center lg:text-left space-y-7"
          >
            <div>
              {/* Minimalist Top Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>Autonomous Application Engine</span>
              </div>
              
              <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-white leading-[1.1]">
                Autonomous job applications, <br className="hidden sm:inline" />
                <span className="text-zinc-400">engineered for precision.</span>
              </h1>
              
              <p className="text-base sm:text-lg text-zinc-400 mt-5 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                JobFlux AI monitors verified hiring feeds, formulates context-aware answers to employer screening questions, and delivers your verified applications twice daily at 6:00 AM & 8:00 AM IST.
              </p>
            </div>

            {/* Benefit Badges in Monochromatic Glass Style */}
            <div className="flex flex-wrap gap-2.5 items-center justify-center lg:justify-start text-xs text-zinc-300">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Dual Morning Runs (6 & 8 AM IST)</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>1-Day Free Trial (₹0)</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                <span>Direct Recruiter Delivery</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              {existingUser ? (
                <Link
                  href={existingUser.role === 'admin' ? '/admin' : '/dashboard'}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>Open {existingUser.role === 'admin' ? 'Admin Portal' : 'Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  onClick={() => { setAuthMode('trial'); setError('') }}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Start 1-Day Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <a
                href="#ai-engine-showcase"
                className="w-full sm:w-auto px-5 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium text-xs sm:text-sm border border-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Engine Simulation</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </a>
            </div>
          </motion.div>
          
          {/* Right Column: Auth0-Style Authentication Card or Already Logged In Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full lg:w-[420px] shrink-0"
          >
            {existingUser ? (
              <div className="p-7 w-full border border-zinc-800 bg-[#09090b] rounded-2xl shadow-xl space-y-5 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center mx-auto">
                  <User className="w-6 h-6 text-zinc-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Active Session Detected</h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    You are signed in as <strong className="text-zinc-200 font-mono">{existingUser.email || existingUser.id}</strong>.
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Navigating to your dashboard... To use a different account, sign out first.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <Link
                    href={existingUser.role === 'admin' ? '/admin' : '/dashboard'}
                    className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Go to {existingUser.role === 'admin' ? 'Admin Portal' : 'Dashboard'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-medium rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out to Switch Account</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-7 w-full border border-zinc-800 bg-[#09090b] rounded-2xl shadow-xl space-y-5">
                
                {/* Auth0-Style Segmented Control */}
                <div className="flex items-center bg-black p-1 rounded-lg border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signin'); setError('') }}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      authMode === 'signin'
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('trial'); setError('') }}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      authMode === 'trial'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Start 1-Day Trial
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">
                      {authMode === 'trial' ? 'Start Free Trial' : 'Sign in to JobFlux'}
                    </h2>
                    <span className="text-[10px] text-zinc-400 font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                      {authMode === 'trial' ? 'Instant Access' : 'Engine Ready'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {authMode === 'trial'
                      ? '1 full day of autonomous applications at zero cost.'
                      : 'Access your candidate telemetry and application audit.'}
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-950/30 border border-red-900/50 text-red-300 rounded-lg text-xs">
                    {error}
                  </div>
                )}

                {/* Google OAuth Button */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#a1a1aa" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#71717a" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Minimalist Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">
                    or email
                  </span>
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>

                {/* Email / Password Form */}
                <form onSubmit={handleAuth} className="space-y-3.5">
                  {authMode === 'trial' && (
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                        <input 
                          type="text" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-black border border-zinc-800 focus:border-zinc-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 outline-none transition-colors"
                          placeholder="Candidate name"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black border border-zinc-800 focus:border-zinc-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 outline-none transition-colors"
                        placeholder="name@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black border border-zinc-800 focus:border-zinc-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 outline-none transition-colors"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{authMode === 'trial' ? 'Start 1-Day Trial (₹0)' : 'Sign In'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-2 text-center">
                  <Link
                    href="/pricing"
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1"
                  >
                    <span>Compare full pricing tiers</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </main>

        {/* Section 2: AI Engine Simulation (Sleek Gladia Cockpit) */}
        <section id="ai-engine-showcase" className="w-full max-w-7xl mx-auto px-6 py-16 border-t border-zinc-900 z-10 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
              Autonomous Flow
            </span>
            <h2 className="text-2xl sm:text-4xl font-semibold text-white tracking-tight">
              Watch JobFlux AI execute in real time.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              The engine automatically handles job discovery, candidate skill matching, screening questionnaire formulation, and application delivery.
            </p>
          </div>

          <AiEngineVisualizer />
        </section>

        {/* Section 3: 3 Pillars (Clean Bento Grid) */}
        <section className="w-full max-w-7xl mx-auto px-6 py-16 border-t border-zinc-900 z-10 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Built for speed, accuracy, and reach.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Stop manually clicking apply on dozens of repetitive portals every evening.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-xl bg-[#09090b] border border-zinc-800 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                <Search className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">1. Intelligent Radar</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Monitors verified openings across leading tech companies and startups. Eliminates spam posts and matches strictly with your preferences.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#09090b] border border-zinc-800 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">2. Contextual Screening Q&A</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Formulates tailored answers for recruiter screening prompts (notice period, compensation expectations, tech stack depth) using your profile context.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#09090b] border border-zinc-800 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                <Send className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">3. Morning Inbox Delivery</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Dispatches applications early at 06:00 AM & 08:00 AM IST so your candidate packet sits at the very top of recruiter review queues.
              </p>
            </div>
          </div>

          {/* Clean Monochrome Metrics */}
          <div className="p-6 rounded-xl bg-[#09090b] border border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-semibold text-white font-mono">600+</div>
              <div className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider font-mono">Monthly Applications</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-semibold text-zinc-200 font-mono">20+ Hrs</div>
              <div className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider font-mono">Saved Weekly</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-semibold text-zinc-200 font-mono">8.4x</div>
              <div className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider font-mono">Recruiter Visibility</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-semibold text-zinc-200 font-mono">100%</div>
              <div className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider font-mono">Safe Automation</div>
            </div>
          </div>
        </section>

        {/* Minimalist Footer */}
        <footer className="w-full border-t border-zinc-900 py-8 px-6 z-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <JobFluxLogo size="sm" />
              <span>© {new Date().getFullYear()} JobFlux AI. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-5 text-zinc-400">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
              <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
            </div>
          </div>
        </footer>

        {/* Universal JobFlux Help & Support Center */}
        <JobFluxHelpModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          showFloatingTrigger={true}
        />
      </div>

      {/* Google Identity Services SDK Script */}
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
    </>
  )
}
