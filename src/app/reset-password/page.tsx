'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react'
import JobFluxLogo from '@/components/JobFluxLogo'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlToken = searchParams.get('token') || ''
  const urlEmail = searchParams.get('email') || ''

  const [token, setToken] = useState(urlToken)
  const [email, setEmail] = useState(urlEmail)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [resetSuccess, setResetSuccess] = useState(false)

  // Use code mode if no token in URL
  const [useOtpMode, setUseOtpMode] = useState(!urlToken)

  useEffect(() => {
    if (urlToken) {
      setToken(urlToken)
      setUseOtpMode(false)
    }
    if (urlEmail) {
      setEmail(urlEmail)
    }
  }, [urlToken, urlEmail])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMessage(null)

    if (newPassword.length < 4) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 4 characters long.' })
      return
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Passwords do not match. Please verify.' })
      return
    }

    if (useOtpMode && (!email || !otp)) {
      setStatusMessage({ type: 'error', text: 'Please enter both your email and the 6-digit verification code.' })
      return
    }

    if (!useOtpMode && !token) {
      setStatusMessage({ type: 'error', text: 'Reset token is missing. Please check your reset link.' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: useOtpMode ? undefined : token,
          otp: useOtpMode ? otp : undefined,
          email: useOtpMode ? email : undefined,
          newPassword
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to reset password.')
      }

      setResetSuccess(true)
      setStatusMessage({
        type: 'success',
        text: 'Password successfully updated! Redirecting to sign in...'
      })

      setTimeout(() => {
        router.push('/?action=signin')
      }, 2500)
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'An error occurred while resetting password.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-600/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-indigo-600/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Navigation Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-6 group cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to JobFlux AI
        </Link>

        {/* Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 mb-3 shadow-inner">
              <JobFluxLogo size="md" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
              Reset Password
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
              Securely set a new password for your JobFlux AI candidate account.
            </p>
          </div>

          {/* Feedback Alerts */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs mb-5 flex items-start gap-2.5 border ${
                statusMessage.type === 'error'
                  ? 'bg-rose-950/40 border-rose-800/50 text-rose-300'
                  : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
              }`}
            >
              {statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              )}
              <div className="leading-relaxed">{statusMessage.text}</div>
            </div>
          )}

          {resetSuccess ? (
            <div className="py-4 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Credentials Successfully Reset</p>
                <p className="text-xs text-zinc-400 mt-1">
                  You can now sign in with your new password to resume autonomous job applications.
                </p>
              </div>
              <Link
                href="/?action=signin"
                className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                Sign In Now <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Method Switcher if user has both or wants OTP */}
              <div className="flex rounded-lg bg-zinc-950/80 p-1 border border-zinc-800/80 text-[11px] mb-2">
                <button
                  type="button"
                  onClick={() => setUseOtpMode(false)}
                  className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                    !useOtpMode ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Via Token Link
                </button>
                <button
                  type="button"
                  onClick={() => setUseOtpMode(true)}
                  className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                    useOtpMode ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Via 6-Digit Code
                </button>
              </div>

              {useOtpMode ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Account Email</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="koushiksrmedala@gmail.com"
                        required
                        className="w-full bg-black border border-zinc-800 focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/40 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">6-Digit Verification Code</label>
                    <div className="relative">
                      <KeyRound className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 583921"
                        required
                        className="w-full bg-black border border-zinc-800 focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/40 rounded-lg pl-9 pr-3 py-2 text-xs font-mono tracking-widest text-sky-400 placeholder-zinc-600 outline-none transition-all"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Security Token</label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste reset token from email link"
                      required
                      className="w-full bg-black border border-zinc-800 focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/40 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-zinc-300 placeholder-zinc-600 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    className="w-full bg-black border border-zinc-800 focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/40 rounded-lg pl-9 pr-9 py-2 text-xs text-white placeholder-zinc-600 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300 p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    className="w-full bg-black border border-zinc-800 focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/40 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-4"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Bottom links */}
          <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center text-xs text-zinc-500">
            Remembered your password?{' '}
            <Link href="/?action=signin" className="text-sky-400 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
          <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
