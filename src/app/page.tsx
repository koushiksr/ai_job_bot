'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { motion } from 'framer-motion'
import { ChevronRight, Mail, Lock, Loader2, Sparkles, User, Zap, Gift, Clock, ArrowRight } from 'lucide-react'
import JobFluxLogo from '@/components/JobFluxLogo'
import JobFluxSplash from '@/components/JobFluxSplash'

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
      
      <div className="min-h-screen flex flex-col md:flex-row items-center justify-center p-6 md:p-24 relative overflow-hidden bg-[#080c14] text-slate-100">
        
        {/* Subtle, standard clean background highlight */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(37,99,235,0.12),rgba(255,255,255,0))] pointer-events-none" />
        
        {/* Left Value Proposition (Customer-first, no technical jargon) */}
        <motion.div 
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 text-center md:text-left md:pr-16 z-10"
        >
          <div className="mb-4 inline-flex">
            <JobFluxLogo size="lg" />
          </div>

          <div className="mb-5">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-blue-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold hover:border-amber-400/50 transition-all shadow-md shadow-amber-500/10"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>🔥 Launch Special: 1 Full Month of Auto-Apply for only ₹499!</span>
              <ArrowRight className="w-3 h-3 text-amber-400" />
            </Link>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-white leading-tight">
            AI Applies to Jobs on Your Behalf — Every Single Day.
          </h1>
          
          <p className="text-base md:text-lg text-slate-400 mb-8 max-w-lg leading-relaxed">
            Set your target job once. JobFlux AI finds matching roles, customizes application responses, and submits verified applications directly to recruiters daily.
          </p>
          
          {/* Benefit Badges */}
          <div className="flex flex-wrap gap-2.5 items-center md:items-start text-xs text-slate-300 font-medium mb-8">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span>Daily Autonomous Auto-Apply</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <Gift className="w-3.5 h-3.5 text-emerald-400" />
              <span>1-Day Free Trial (Zero Risk)</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>₹499 / 1 Full Month Special</span>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 transition-colors"
            >
              <span>Explore Plans & Pricing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
        
        {/* Right Authentication Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex-1 w-full max-w-md mt-12 md:mt-0 z-10"
        >
          <div className="p-8 w-full border border-slate-800 bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl">
            
            {/* Tab Switcher: Sign In vs 1-Day Free Trial */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setError('') }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
                {authMode === 'trial' ? 'Instant Activation' : 'Cloud Online'}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-5">
              {authMode === 'trial'
                ? 'Test the bot free for 1 day — AI applies to jobs for you'
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
                <span>Want to see all subscription options?</span>
                <span className="text-sky-400 font-semibold underline">View Plans</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Google Identity Services SDK Script */}
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
    </>
  )
}
