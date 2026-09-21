'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Building2,
  Compass,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Check
} from 'lucide-react'
import { APP_CONFIG } from '@/config/appConfig'
import { trackSignUp } from '@/lib/tracker'

interface RoleData {
  id: string
  label: string
  icon: string
  openings: number
  salaryRange: string
  companies: string[]
  matchRate: string
  skills: string[]
}

const ROLE_PRESETS: RoleData[] = [
  {
    id: 'fullstack',
    label: 'Full Stack',
    icon: '💻',
    openings: 46,
    salaryRange: '₹22L - ₹48L',
    companies: ['Razorpay', 'Swiggy', 'Stripe', 'Zepto'],
    matchRate: '98.8%',
    skills: ['React', 'Next.js', 'Node.js', 'PostgreSQL']
  },
  {
    id: 'backend',
    label: 'Python / Backend',
    icon: '🐍',
    openings: 52,
    salaryRange: '₹25L - ₹52L',
    companies: ['Zomato', 'PhonePe', 'Flipkart', 'CRED'],
    matchRate: '99.1%',
    skills: ['Python', 'FastAPI', 'Django', 'Microservices']
  },
  {
    id: 'frontend',
    label: 'React / Frontend',
    icon: '⚛️',
    openings: 38,
    salaryRange: '₹20L - ₹42L',
    companies: ['Atlassian', 'Zepto', 'Meesho', 'Groww'],
    matchRate: '98.4%',
    skills: ['React', 'TypeScript', 'Tailwind', 'Next.js']
  },
  {
    id: 'devops',
    label: 'DevOps & Cloud',
    icon: '☁️',
    openings: 34,
    salaryRange: '₹26L - ₹55L',
    companies: ['Amazon', 'Microsoft', 'Oracle', 'Jio'],
    matchRate: '97.9%',
    skills: ['Kubernetes', 'AWS', 'Docker', 'Terraform']
  },
  {
    id: 'ai-ml',
    label: 'AI & Data Science',
    icon: '🧠',
    openings: 29,
    salaryRange: '₹30L - ₹65L',
    companies: ['Google', 'DeepMind', 'Fractal', 'Ola Krutrim'],
    matchRate: '99.4%',
    skills: ['LLMs', 'PyTorch', 'Python', 'MLOps']
  },
  {
    id: 'mobile',
    label: 'Mobile (Flutter/iOS)',
    icon: '📱',
    openings: 24,
    salaryRange: '₹22L - ₹44L',
    companies: ['Uber', 'Swiggy', 'Paytm', 'Urban Company'],
    matchRate: '98.2%',
    skills: ['Flutter', 'React Native', 'Swift', 'Kotlin']
  }
]

interface FuturisticHeroCockpitProps {
  onSuccess?: () => void
}

export default function FuturisticHeroCockpit({ onSuccess }: FuturisticHeroCockpitProps) {
  const [selectedRole, setSelectedRole] = useState<RoleData>(ROLE_PRESETS[0])
  const [authMode, setAuthMode] = useState<'trial' | 'signin' | 'forgot'>('trial')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isInAppBrowser, setIsInAppBrowser] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [radarScanning, setRadarScanning] = useState(false)

  // Detect Instagram / Facebook / TikTok in-app webview
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = (navigator.userAgent || '').toLowerCase()
      const inApp = ua.includes('instagram') || ua.includes('fban') || ua.includes('fbav') || ua.includes('wv') || ua.includes('bytedance')
      setIsInAppBrowser(inApp)
    }
  }, [])

  // Animate radar on role change
  const handleSelectRole = (role: RoleData) => {
    setSelectedRole(role)
    setRadarScanning(true)
    setTimeout(() => setRadarScanning(false), 500)
  }

  // Handle 1-Click Free Trial Activation or Standard Sign In
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const cleanEmail = email.trim().toLowerCase()
    const cleanPwd = password.trim()

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.')
      setLoading(false)
      return
    }

    // Direct Master Admin bypass
    if (
      authMode === 'signin' &&
      (cleanEmail === 'admin' || cleanEmail === 'technohmsit' || cleanEmail === 'technohmsit@gmail.com') &&
      cleanPwd === 'admin'
    ) {
      localStorage.setItem('user_id', 'technohmsit')
      localStorage.setItem('user_email', 'technohmsit@gmail.com')
      localStorage.setItem('user_role', 'admin')
      window.location.href = '/admin'
      return
    }

    try {
      if (authMode === 'forgot') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Password reset failed.')
        setForgotSent(true)
        return
      }

      const endpoint = authMode === 'trial' ? '/api/auth/register' : '/api/auth/login'
      const payload = authMode === 'trial'
        ? {
            name: name || cleanEmail.split('@')[0],
            email: cleanEmail,
            password: cleanPwd || undefined,
            target_role: selectedRole.label,
            plan: 'trial'
          }
        : { email: cleanEmail, password: cleanPwd }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (data.detail && data.detail.includes('already exists')) {
          setAuthMode('signin')
          throw new Error('Account already exists! Please enter your password to sign in.')
        }
        throw new Error(data.detail || 'Authentication failed.')
      }

      // Store credentials
      localStorage.setItem('user_id', data.user_id)
      localStorage.setItem('user_email', data.email)
      localStorage.setItem('user_role', data.role || 'user')
      if (data.plan) localStorage.setItem('user_plan', data.plan)
      if (data.picture) localStorage.setItem('user_picture', data.picture)

      // Conversion tracking for Meta Pixel and GA4
      if (authMode === 'trial') {
        trackSignUp('hero_cockpit_1click', data.plan || 'trial', {
          email: data.email,
          role: selectedRole.label,
          device: isInAppBrowser ? 'in_app_browser' : 'browser'
        })
      }

      // Redirect
      if (data.user_id === 'technohmsit' || data.email === 'technohmsit@gmail.com') {
        window.location.href = '/admin'
      } else {
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = () => {
    setLoading(true)
    setError('')
    window.location.href = '/api/auth/google/signin'
  }

  return (
    <div className="w-full relative">
      {/* Outer Cyber Glow Frame */}
      <div className="relative rounded-3xl glass-card-futuristic p-5 sm:p-7 overflow-hidden shadow-2xl border border-cyan-500/20">
        {/* Animated Cyber Scanner Beam */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-purple-500 animate-laser-sweep" />

        {/* Cockpit HUD Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-inner">
              <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white tracking-wide uppercase">
                  NEURAL AUTOPILOT COCKPIT
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  ONLINE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Matches openings &amp; applies at 6:00 AM &amp; 8:00 AM IST
              </p>
            </div>
          </div>

          {/* Segmented Mode Switcher */}
          <div className="flex items-center bg-zinc-950/80 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => { setAuthMode('trial'); setError('') }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                authMode === 'trial'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Free Autopilot (10s)</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setError('') }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Tab 1: Instant 10-Second Free Autopilot Activator */}
        {authMode === 'trial' && (
          <div className="pt-4 space-y-4">
            {/* Step 1: Interactive Role Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-[10px] flex items-center justify-center font-bold">1</span>
                  <span>Select Target Tech Role:</span>
                </span>
                <span className="text-[11px] font-mono text-cyan-400">
                  {selectedRole.openings} verified openings active
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ROLE_PRESETS.map((role) => {
                  const isSelected = selectedRole.id === role.id
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => handleSelectRole(role)}
                      className={`p-2.5 rounded-xl text-left text-xs transition-all duration-200 cursor-pointer flex items-center gap-2 border ${
                        isSelected
                          ? 'bg-gradient-to-br from-cyan-950/80 to-zinc-900 border-cyan-500 text-white font-bold shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-500/40'
                          : 'bg-zinc-950/70 hover:bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-base shrink-0">{role.icon}</span>
                      <div className="truncate min-w-0">
                        <div className="truncate font-semibold text-[11px] sm:text-xs">
                          {role.label}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {role.salaryRange}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Instant Live Discovery Card */}
            <div className={`p-3.5 rounded-xl bg-zinc-950/90 border border-cyan-500/30 space-y-1.5 transition-all duration-300 ${
              radarScanning ? 'ring-2 ring-cyan-400/50 bg-cyan-950/30' : ''
            }`}>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-mono text-cyan-300 font-bold">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>⚡ {selectedRole.openings} Openings Ready For Dispatch</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold">
                  {selectedRole.matchRate} ATS Match
                </span>
              </div>

              <div className="text-[11px] text-zinc-300 flex items-center justify-between flex-wrap gap-1">
                <span>
                  Salary: <strong className="text-white font-mono">{selectedRole.salaryRange}</strong>
                </span>
                <span className="text-zinc-500">&bull;</span>
                <span>
                  Hiring: <strong className="text-zinc-200">{selectedRole.companies.join(', ')}</strong>
                </span>
                <span className="text-zinc-500">&bull;</span>
                <span className="text-emerald-400 font-medium">Bengaluru &amp; Remote</span>
              </div>
            </div>

            {/* Step 2: 1-Step Email Autopilot Activator Form */}
            <form onSubmit={handleSubmit} className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-[10px] flex items-center justify-center font-bold">2</span>
                    <span>Where should AI send your daily 6:00 AM dispatch report?</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-medium">100% Free · No Card</span>
                </label>

                <div className="relative">
                  <Mail className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your personal or work email..."
                    required
                    className="w-full bg-black/90 border border-zinc-700 hover:border-cyan-500/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-950/40 border border-red-800/50 text-red-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Big High-Converting Glowing Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-5 rounded-xl text-xs sm:text-sm font-extrabold text-white shimmer-button-glow flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all cursor-pointer disabled:opacity-50 group transform active:scale-[0.99]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>Activate Free AI Autopilot (No Card Needed)</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {/* Trust Subtext */}
              <div className="flex items-center justify-center gap-3 pt-1 text-[10px] sm:text-[11px] text-zinc-400 flex-wrap">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Check className="w-3 h-3" />
                  3-Day Free Trial
                </span>
                <span>&bull;</span>
                <span>Zero Card Details</span>
                <span>&bull;</span>
                <span className="text-zinc-300">10-Second Setup</span>
              </div>
            </form>

            {/* Or Continue With 1-Click Google */}
            <div className="pt-2 space-y-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Or Continue with 1-Click Google</span>
              </button>

              {/* Helpful In-App Browser Disclaimer */}
              {isInAppBrowser && (
                <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[10px] text-amber-300 text-center leading-relaxed">
                  💡 <strong>Browsing on Instagram/Facebook?</strong> Use the 1-step email form above for instant free activation (Google blocks in-app browsers).
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Standard Member Sign In */}
        {authMode === 'signin' && (
          <form onSubmit={handleSubmit} className="pt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-black border border-zinc-800 focus:border-cyan-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-zinc-600 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-zinc-300">Password</label>
                <button
                  type="button"
                  onClick={() => { setAuthMode('forgot'); setError('') }}
                  className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-black border border-zinc-800 focus:border-cyan-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-600 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-800/50 text-red-300 rounded-xl text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In to Dashboard &rarr;</span>}
            </button>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Sign In with Google</span>
            </button>
          </form>
        )}

        {/* Tab 3: Password Recovery */}
        {authMode === 'forgot' && (
          <div className="pt-4 space-y-3.5">
            <h3 className="text-sm font-bold text-white">Reset Account Password</h3>
            <p className="text-xs text-zinc-400">
              Enter your account email to receive your password reset link.
            </p>

            {forgotSent ? (
              <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 space-y-2">
                <p className="font-semibold text-white">Check Your Email</p>
                <p className="text-[11px] text-zinc-400">Reset instructions dispatched to {email}.</p>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setForgotSent(false) }}
                  className="text-cyan-400 hover:underline text-xs"
                >
                  &larr; Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-black border border-zinc-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-white"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl text-xs"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className="w-full text-center text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
