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
  Building2
} from 'lucide-react'
import JobFluxLogo from '@/components/JobFluxLogo'
import { validatedIdentity } from '@/lib/sessionClient'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect only with a server-validated session (stale localStorage alone
  // used to bounce users dashboard -> profile -> login -> dashboard).
  useEffect(() => {
    if (typeof window !== 'undefined') {
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

      // Pre-fill error from URL
      const p = new URLSearchParams(window.location.search)
      const errParam = p.get('error')
      if (errParam) setError(decodeURIComponent(errParam))
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

    // NOTE: no client-side admin shortcut — sign-in always goes through the
    // server, which issues the httpOnly session cookie on success.

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPwd })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || data.error || 'Invalid email or password.')
        setLoading(false)
        return
      }

      // Store session
      localStorage.setItem('user_id', data.user_id || cleanEmail)
      localStorage.setItem('user_email', data.email || cleanEmail)
      localStorage.setItem('user_role', data.role || 'user')
      if (data.name) localStorage.setItem('user_name', data.name)
      if (data.enterprise_org_id) localStorage.setItem('enterprise_org_id', data.enterprise_org_id)

      // Role-based redirect
      if (data.role === 'enterprise_admin') {
        window.location.href = '/enterprise-admin'
      } else if (data.role === 'admin' || data.user_id === 'technohmsit') {
        window.location.href = '/admin'
      } else {
        window.location.href = '/dashboard'
      }
    } catch (err: unknown) {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
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
          <h1 className="text-xl font-bold text-white">Welcome back</h1>
          <p className="text-xs text-zinc-400">Sign in to your JobFlux AI account</p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">

          {/* Google Login — shown first for frictionless access */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-200 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
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
          <div className="flex items-center gap-3 text-zinc-700 text-[11px] font-mono">
            <div className="flex-1 h-px bg-zinc-800" />
            <span>or sign in with email</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                  autoFocus
                  className="w-full bg-black border border-zinc-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-300">Password</label>
                <Link
                  href="/?mode=forgot"
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  autoComplete="current-password"
                  className="w-full bg-black border border-zinc-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-all"
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
              <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-800/50 text-red-300 rounded-xl text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Enterprise Admin hint */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-[11px] text-indigo-300">
            <Building2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-400" />
            <span>
              <strong className="text-indigo-200">Enterprise Admin?</strong> Use your registered email + password above.
              If your account was created via Google, click &ldquo;Continue with Google&rdquo; instead.
            </span>
          </div>
        </div>

        {/* Sign Up CTA */}
        <p className="text-center text-xs text-zinc-500">
          Don&apos;t have an account?{' '}
          <Link href="/" className="text-cyan-400 hover:underline font-medium">
            Start free — no card needed
          </Link>
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
