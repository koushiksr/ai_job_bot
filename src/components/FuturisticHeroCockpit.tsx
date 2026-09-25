'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Zap,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Building2,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  User
} from 'lucide-react'
import { APP_CONFIG } from '@/config/appConfig'
import { trackSignUp, getVisitorId } from '@/lib/tracker'
import { getDeviceId } from '@/lib/sessionClient'

interface FuturisticHeroCockpitProps {
  onSuccess?: () => void
  initialMode?: 'trial' | 'signin'
}

export default function FuturisticHeroCockpit({ onSuccess, initialMode }: FuturisticHeroCockpitProps) {
  const [authMode, setAuthMode] = useState<'trial' | 'signin' | 'forgot'>(initialMode || 'trial')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isInAppBrowser, setIsInAppBrowser] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  // Auto-detect sign-in mode from URL ?mode=signin param
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      if (p.get('mode') === 'signin' || window.location.hash === '#signin') {
        setAuthMode('signin')
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = (navigator.userAgent || '').toLowerCase()
      const inApp = ua.includes('instagram') || ua.includes('fban') || ua.includes('fbav') || ua.includes('wv') || ua.includes('bytedance')
      setIsInAppBrowser(inApp)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const cleanEmail = email.trim().toLowerCase()
    const cleanPwd = password.trim()
    const cleanConfirmPwd = confirmPassword.trim()

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.')
      setLoading(false)
      return
    }

    if (authMode === 'trial') {
      if (!cleanPwd) {
        setError('Please create a password for your account.')
        setLoading(false)
        return
      }
      if (cleanPwd.length < 6) {
        setError('Password must be at least 6 characters long.')
        setLoading(false)
        return
      }
      if (cleanPwd !== cleanConfirmPwd) {
        setError('Passwords do not match. Please verify both passwords.')
        setLoading(false)
        return
      }
    } else if (authMode === 'signin') {
      if (!cleanPwd) {
        setError('Please enter your password.')
        setLoading(false)
        return
      }
    }

    // NOTE: no client-side admin shortcut — sign-in always goes through the
    // server, which issues the httpOnly session cookie on success.

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
        setLoading(false)
        return
      }

      const endpoint = authMode === 'trial' ? '/api/auth/register' : '/api/auth/login'
      const refCode = (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') || localStorage.getItem('jobflux_referral_code') || '' : '').trim()
      const payload = authMode === 'trial'
        ? {
            name: name.trim() || cleanEmail.split('@')[0],
            email: cleanEmail,
            password: cleanPwd,
            confirm_password: cleanConfirmPwd,
            plan: 'trial',
            ref: refCode,
            referral_code: refCode,
            device_id: getDeviceId(),
            visitor_id: (() => { try { return getVisitorId() } catch { return '' } })()
          }
        : { email: cleanEmail, password: cleanPwd, device_id: getDeviceId(), visitor_id: (() => { try { return getVisitorId() } catch { return '' } })() }

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
      if (data.name) localStorage.setItem('user_name', data.name)
      if (data.plan) localStorage.setItem('user_plan', data.plan)
      if (data.picture) localStorage.setItem('user_picture', data.picture)
      if (data.enterprise_org_id) localStorage.setItem('enterprise_org_id', data.enterprise_org_id)

      if (authMode === 'trial') {
        trackSignUp('hero_cockpit', data.plan || 'trial', { email: data.email })
      }

      // Redirect based on role
      if (data.role === 'admin' || data.user_id === 'technohmsit' || data.email === 'technohmsit@gmail.com') {
        window.location.href = '/admin'
      } else if (data.role === 'enterprise_admin' || data.email === 'koushiksrmedala@gmail.com') {
        window.location.href = '/enterprise-admin'
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

  // ─── Shared Google Button ──────────────────────────────────────────────
  const GoogleButton = ({ label = 'Continue with Google' }: { label?: string }) => (
    <button
      type="button"
      onClick={handleGoogleAuth}
      disabled={loading}
      className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-zinc-950 light:bg-white hover:bg-zinc-900 light:hover:bg-zinc-100 border border-zinc-800 light:border-zinc-200 hover:border-zinc-700 light:hover:border-zinc-300 text-zinc-200 light:text-zinc-800 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-60"
    >
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
      <span>{label}</span>
    </button>
  )

  return (
    <div className="w-full relative">
      <div className="relative rounded-2xl bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 p-6 shadow-2xl">

        {/* Tab Switcher */}
        <div className="flex items-center bg-zinc-900 light:bg-zinc-100 p-1 rounded-xl border border-zinc-800 light:border-zinc-200 gap-1 mb-5">
          <button
            type="button"
            onClick={() => { setAuthMode('trial'); setError('') }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              authMode === 'trial'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white light:text-zinc-900 shadow-md'
                : 'text-zinc-400 light:text-zinc-600 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Free Sign Up
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('signin'); setError('') }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              authMode === 'signin'
                ? 'bg-white light:bg-white light:ring-1 light:ring-zinc-300 text-black light:text-zinc-900 shadow-sm'
                : 'text-zinc-400 light:text-zinc-600 hover:text-zinc-200'
            }`}
          >
            <User className="w-3 h-3" />
            Sign In
          </button>
        </div>

        {/* ─── Tab 1: Sign Up ─────────────────────────────────────── */}
        {authMode === 'trial' && (
          <div className="space-y-3">
            {/* Google first — easiest path */}
            <GoogleButton label="Sign up free with Google" />

            <div className="flex items-center gap-3 text-zinc-700 text-[11px]">
              <div className="flex-1 h-px bg-zinc-800 light:bg-zinc-200" />
              <span>or with email</span>
              <div className="flex-1 h-px bg-zinc-800 light:bg-zinc-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Name */}
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 light:text-zinc-600 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 outline-none transition-all"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 light:text-zinc-600 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                  className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 outline-none transition-all"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 light:text-zinc-600 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create password (min 6 chars)"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-500 light:text-zinc-600 hover:text-zinc-300 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 light:text-zinc-600 absolute left-3.5 top-3" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-zinc-500 light:text-zinc-600 hover:text-zinc-300 cursor-pointer"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-950/40 light:bg-red-50 border border-red-800/50 light:border-red-300 text-red-300 light:text-red-600 rounded-xl text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white light:text-zinc-900 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Start Free — No Card Needed</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Trust line */}
              <div className="flex items-center justify-center gap-3 text-[11px] text-zinc-500 light:text-zinc-600 flex-wrap pt-1">
                <span className="flex items-center gap-1 text-emerald-400 light:text-emerald-600"><Check className="w-3 h-3" />3-Day Free Trial</span>
                <span>·</span>
                <span>No Credit Card</span>
                <span>·</span>
                <span>Cancel Anytime</span>
              </div>
            </form>

            {isInAppBrowser && (
              <p className="text-[10px] text-amber-300 light:text-amber-700 bg-amber-950/30 border border-amber-800/40 rounded-lg p-2 text-center">
                💡 On Instagram/Facebook? Use the email form above — Google blocks in-app browsers.
              </p>
            )}

            <p className="text-center text-xs text-zinc-500 light:text-zinc-600">
              Already have an account?{' '}
              <button type="button" onClick={() => { setAuthMode('signin'); setError('') }} className="text-cyan-400 light:text-cyan-600 hover:underline cursor-pointer font-medium">
                Sign in
              </button>
            </p>
          </div>
        )}

        {/* ─── Tab 2: Sign In ─────────────────────────────────────── */}
        {authMode === 'signin' && (
          <div className="space-y-3">
            {/* Google first */}
            <GoogleButton label="Continue with Google" />

            <div className="flex items-center gap-3 text-zinc-700 text-[11px]">
              <div className="flex-1 h-px bg-zinc-800 light:bg-zinc-200" />
              <span>or email &amp; password</span>
              <div className="flex-1 h-px bg-zinc-800 light:bg-zinc-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Email */}
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 light:text-zinc-600 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                  autoFocus
                  className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 outline-none transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-zinc-300 light:text-zinc-700">Password</span>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('forgot'); setError('') }}
                    className="text-[11px] text-cyan-400 light:text-cyan-600 hover:text-cyan-300 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 light:text-zinc-600 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                    autoComplete="current-password"
                    className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-zinc-500 light:text-zinc-600 hover:text-zinc-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-950/40 light:bg-red-50 border border-red-800/50 light:border-red-300 text-red-300 light:text-red-600 rounded-xl text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            {/* Enterprise Admin hint */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-[10px] text-indigo-300">
              <Building2 className="w-3 h-3 shrink-0 mt-0.5 text-indigo-400" />
              <span>Enterprise Admin? Sign in with your email &amp; password, or Google if you registered via Google.</span>
            </div>

            <p className="text-center text-xs text-zinc-500 light:text-zinc-600">
              New here?{' '}
              <button type="button" onClick={() => { setAuthMode('trial'); setError('') }} className="text-cyan-400 light:text-cyan-600 hover:underline cursor-pointer font-medium">
                Start free — no card needed
              </button>
            </p>
          </div>
        )}

        {/* ─── Tab 3: Forgot Password ──────────────────────────────── */}
        {authMode === 'forgot' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white light:text-zinc-900 mb-1">Reset Password</h3>
              <p className="text-xs text-zinc-400 light:text-zinc-600">Enter your email to receive a reset link.</p>
            </div>

            {forgotSent ? (
              <div className="p-4 bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 rounded-xl text-xs text-zinc-300 light:text-zinc-700 space-y-2">
                <p className="font-semibold text-white light:text-zinc-900">✅ Check Your Inbox</p>
                <p className="text-zinc-400 light:text-zinc-600">Reset link sent to <strong>{email}</strong>.</p>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setForgotSent(false) }}
                  className="text-cyan-400 light:text-cyan-600 hover:underline text-xs"
                >
                  ← Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 light:text-zinc-600 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoFocus
                    className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 focus:border-cyan-500 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 outline-none transition-all"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-950/40 light:bg-red-50 border border-red-800/50 light:border-red-300 text-red-300 light:text-red-600 rounded-xl text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 font-semibold rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setError('') }}
                  className="w-full text-center text-xs text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 cursor-pointer py-1"
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
