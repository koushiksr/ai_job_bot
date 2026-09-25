'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Building2,
  User,
  Sparkles
} from 'lucide-react'
import JobFluxLogo from '@/components/JobFluxLogo'
import { ThemeToggle } from '@/components/ThemeProvider'
import { validatedIdentity, getDeviceId } from '@/lib/sessionClient'
import { getVisitorId, trackSignUp } from '@/lib/tracker'

export default function LoginPage() {
  const router = useRouter()
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect only with a server-validated session (stale localStorage alone
  // used to bounce users dashboard -> profile -> login -> dashboard).
  useEffect(() => {
    if (typeof window !== 'undefined') {
      getDeviceId() // ensure stable device id + cookie for OAuth-redirect logins
      validatedIdentity().then(ident => {
        if (!ident) return
        const { uid, role, email: storedEmail } = ident
        if (role === 'admin' || uid === 'technohmsit') {
          window.location.replace('/admin')
        } else if (role === 'enterprise_admin' || storedEmail === 'koushiksrmedala@gmail.com') {
          window.location.replace('/enterprise-admin')
        } else {
          window.location.replace('/dashboard')
        }
      })

      // Pre-fill error and mode from URL
      const p = new URLSearchParams(window.location.search)
      const errParam = p.get('error')
      if (errParam) setError(decodeURIComponent(errParam))

      const modeParam = p.get('mode')
      if (modeParam === 'signup' || modeParam === 'register' || modeParam === 'free') {
        setAuthMode('signup')
      }
    }
  }, [])

  const handleGoogleAuth = () => {
    window.location.href = '/api/auth/google/signin'
  }

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

    if (authMode === 'signup') {
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
    } else {
      if (!cleanPwd) {
        setError('Please enter your password.')
        setLoading(false)
        return
      }
    }

    // NOTE: no client-side admin shortcut — sign-in always goes through the
    // server, which issues the httpOnly session cookie on success.

    try {
      const endpoint = authMode === 'signup' ? '/api/auth/register' : '/api/auth/login'
      const refCode = (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') || localStorage.getItem('jobflux_referral_code') || '' : '').trim()
      const payload = authMode === 'signup'
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
        : {
            email: cleanEmail,
            password: cleanPwd,
            device_id: getDeviceId(),
            visitor_id: (() => { try { return getVisitorId() } catch { return '' } })()
          }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.detail && data.detail.includes('already exists')) {
          setAuthMode('signin')
          throw new Error('Account already exists! Please enter your password to sign in.')
        }
        setError(data.detail || data.error || 'Authentication failed. Please check your credentials.')
        setLoading(false)
        return
      }

      // Store session
      localStorage.setItem('user_id', data.user_id || cleanEmail)
      localStorage.setItem('user_email', data.email || cleanEmail)
      localStorage.setItem('user_role', data.role || 'user')
      if (data.name) localStorage.setItem('user_name', data.name)
      if (data.plan) localStorage.setItem('user_plan', data.plan)
      if (data.enterprise_org_id) localStorage.setItem('enterprise_org_id', data.enterprise_org_id)

      if (authMode === 'signup') {
        trackSignUp('login_page_signup', data.plan || 'trial', { email: data.email, name })
      }

      // Role-based redirect
      if (data.role === 'enterprise_admin') {
        window.location.href = '/enterprise-admin'
      } else if (data.role === 'admin' || data.user_id === 'technohmsit') {
        window.location.href = '/admin'
      } else {
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black light:bg-white flex flex-col items-center justify-center p-4">
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-cyan-950/20 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-[400px] z-10 space-y-6">
        {/* Logo */}
        <div className="text-center space-y-1">
          <div className="flex justify-center mb-3">
            <Link href="/">
              <JobFluxLogo size="md" showText />
            </Link>
          </div>
          <h1 className="text-xl font-bold text-white light:text-zinc-900">
            {authMode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-xs text-zinc-400 light:text-zinc-600">
            {authMode === 'signup' ? 'Start your 3-day free automated job search' : 'Sign in to your JobFlux AI account'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 rounded-2xl p-6 shadow-xl space-y-4">

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-zinc-900 light:bg-zinc-100 p-1 rounded-xl border border-zinc-800 light:border-zinc-200 gap-1">
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setError('') }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'signin'
                  ? 'bg-white light:bg-white light:ring-1 light:ring-zinc-300 text-black light:text-zinc-900 shadow-sm'
                  : 'text-zinc-400 light:text-zinc-600 hover:text-zinc-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setError('') }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'signup'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-zinc-400 light:text-zinc-600 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 hover:border-zinc-600 text-zinc-200 light:text-zinc-800 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{authMode === 'signup' ? 'Sign up free with Google' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 text-zinc-700 text-[11px] font-mono">
            <div className="flex-1 h-px bg-zinc-800 light:bg-zinc-200" />
            <span>{authMode === 'signup' ? 'or register with email' : 'or sign in with email'}</span>
            <div className="flex-1 h-px bg-zinc-800 light:bg-zinc-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 light:text-zinc-700 mb-1.5">Full Name (optional)</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 light:text-zinc-600 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300 light:text-zinc-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 light:text-zinc-600 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                  autoFocus={authMode === 'signin'}
                  className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-300 light:text-zinc-700">
                  {authMode === 'signup' ? 'Create Password' : 'Password'}
                </label>
                {authMode === 'signin' && (
                  <Link
                    href="/?mode=forgot"
                    className="text-[11px] text-cyan-400 light:text-cyan-600 hover:text-cyan-300 hover:underline"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 light:text-zinc-600 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={authMode === 'signup' ? 'Create password (min 6 chars)' : 'Your password'}
                  required
                  minLength={authMode === 'signup' ? 6 : undefined}
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
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
            </div>

            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 light:text-zinc-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 light:text-zinc-600 absolute left-3.5 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-950/40 light:bg-red-50 border border-red-800/50 light:border-red-300 text-red-300 light:text-red-600 rounded-xl text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                authMode === 'signup'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900'
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{authMode === 'signup' ? 'Create Account & Start Free' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Enterprise Admin hint (only shown in signin mode) */}
          {authMode === 'signin' && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-[11px] text-indigo-300">
              <Building2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-400" />
              <span>
                <strong className="text-indigo-200">Enterprise Admin?</strong> Use your registered email + password above.
                If your account was created via Google, click &ldquo;Continue with Google&rdquo; instead.
              </span>
            </div>
          )}
        </div>

        {/* Switch Mode CTA */}
        <p className="text-center text-xs text-zinc-500 light:text-zinc-600">
          {authMode === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setError('') }}
                className="text-cyan-400 light:text-cyan-600 hover:underline font-medium cursor-pointer"
              >
                Create one free — no card needed
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setError('') }}
                className="text-cyan-400 light:text-cyan-600 hover:underline font-medium cursor-pointer"
              >
                Sign in to your account
              </button>
            </>
          )}
        </p>

        {/* Admin quick-access (hidden but accessible) */}
        <p className="text-center text-[10px] text-zinc-700 pt-2">
          <Link href="/admin" className="hover:text-zinc-500">Admin Portal</Link>
          {' · '}
          <Link href="/enterprise-admin" className="hover:text-zinc-500">Enterprise Portal</Link>
        </p>

        {/* Admin quick-access (hidden but accessible) */}
        <p className="text-center text-[10px] text-zinc-700 pt-2">
          <Link href="/admin" className="hover:text-zinc-500">Admin Portal</Link>
          {' · '}
          <Link href="/enterprise-admin" className="hover:text-zinc-500">Enterprise Portal</Link>
        </p>
      </div>
    </div>
  )
}
