'use client'

import React, { useState, useEffect } from 'react'
import { UserPlus, ArrowRight, Loader2, X, CheckCircle2 } from 'lucide-react'

interface GoogleAccount {
  user_id?: string
  name: string
  email: string
  avatar?: string
  plan?: string
}

interface GoogleAccountChooserModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (account: { email: string; name: string }) => Promise<void>
}

export default function GoogleAccountChooserModal({
  isOpen,
  onClose,
  onSelect
}: GoogleAccountChooserModalProps) {
  const [accounts, setAccounts] = useState<GoogleAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(true)
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)

  // Use another account inline form
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false)
  const [customEmail, setCustomEmail] = useState<string>('')
  const [customName, setCustomName] = useState<string>('')
  const [customError, setCustomError] = useState<string>('')

  useEffect(() => {
    if (!isOpen) return

    const fetchAccounts = async () => {
      setLoadingAccounts(true)
      try {
        const res = await fetch('/api/auth/google')
        let fetched: GoogleAccount[] = []
        if (res.ok) {
          const data = await res.json()
          fetched = data.accounts || []
        }

        // Also check localStorage for last remembered user
        const lastEmail = localStorage.getItem('user_email')
        const lastId = localStorage.getItem('user_id')
        if (lastEmail && !fetched.some(a => a.email.toLowerCase() === lastEmail.toLowerCase())) {
          fetched.unshift({
            email: lastEmail,
            name: lastId?.replace(/_/g, ' ') || lastEmail.split('@')[0],
            user_id: lastId || undefined
          })
        }

        // If no accounts found in db, provide standard quick accounts
        if (fetched.length === 0) {
          fetched = [
            { name: 'Candidate Account', email: 'candidate@gmail.com' }
          ]
        }

        setAccounts(fetched)
      } catch (e) {
        console.error('Failed to load accounts for Google Chooser:', e)
      } finally {
        setLoadingAccounts(false)
      }
    }

    fetchAccounts()
  }, [isOpen])

  if (!isOpen) return null

  const handleChoose = async (acc: GoogleAccount) => {
    setSelectedEmail(acc.email)
    setSubmitting(true)
    try {
      await onSelect({ email: acc.email, name: acc.name })
    } catch (err) {
      console.error(err)
      setSubmitting(false)
      setSelectedEmail(null)
    }
  }

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = customEmail.trim().toLowerCase()
    if (!clean || !clean.includes('@')) {
      setCustomError('Please enter a valid Google email address.')
      return
    }
    setCustomError('')
    setSubmitting(true)
    try {
      const derivedName = customName.trim() || clean.split('@')[0]
      await onSelect({ email: clean, name: derivedName })
    } catch (err: any) {
      setCustomError(err.message || 'Failed to sign in.')
      setSubmitting(false)
    }
  }

  const getInitials = (name: string, email: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ')
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      return name.slice(0, 2).toUpperCase()
    }
    return email.slice(0, 2).toUpperCase()
  }

  const getAvatarBg = (index: number) => {
    const colors = [
      'from-blue-600 to-indigo-600',
      'from-emerald-600 to-teal-600',
      'from-purple-600 to-pink-600',
      'from-amber-600 to-orange-600'
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#0f141f] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="pt-8 pb-4 px-6 text-center border-b border-slate-800/80 relative">
          <button
            onClick={onClose}
            disabled={submitting}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Official Google G Logo */}
          <div className="mx-auto w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg p-2.5 mb-3">
            <svg className="w-full h-full" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>

          <h3 className="text-xl font-semibold text-white tracking-tight">
            Choose an account
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            to continue to <span className="text-blue-400 font-medium">JobFlux AI</span>
          </p>
        </div>

        {/* Account Selection List */}
        <div className="p-4 sm:p-6 space-y-2 max-h-[340px] overflow-y-auto">
          {loadingAccounts ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-xs">Finding Google accounts...</span>
            </div>
          ) : (
            <>
              {accounts.map((acc, idx) => {
                const isSelected = selectedEmail === acc.email
                return (
                  <button
                    key={acc.email}
                    onClick={() => handleChoose(acc)}
                    disabled={submitting}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500/50 shadow-md shadow-blue-500/10'
                        : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 overflow-hidden">
                      {/* Avatar */}
                      <div className={`w-10 h-10 shrink-0 rounded-full bg-gradient-to-tr ${getAvatarBg(idx)} flex items-center justify-center font-bold text-white text-xs shadow-md`}>
                        {getInitials(acc.name, acc.email)}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors truncate">
                            {acc.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium shrink-0">
                            Active
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono truncate">
                          {acc.email}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3">
                      {isSelected && submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-800/60 group-hover:bg-blue-600 text-slate-400 group-hover:text-white transition-all">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}

              {/* Use Another Account Toggle */}
              {!showCustomInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  disabled={submitting}
                  className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900/30 hover:bg-slate-800/60 border border-dashed border-slate-700 hover:border-slate-600 transition-all text-left text-slate-300 hover:text-white"
                >
                  <div className="w-10 h-10 shrink-0 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-medium">Use another account</span>
                    <p className="text-xs text-slate-500">Sign in with a different Google email</p>
                  </div>
                </button>
              ) : (
                /* Inline Custom Google Account Entry */
                <form onSubmit={handleCustomSubmit} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Sign in with another Google account</span>
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Back
                    </button>
                  </div>

                  <div>
                    <input
                      type="email"
                      required
                      placeholder="username@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Your Full Name (optional)"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {customError && (
                    <p className="text-xs text-rose-400">{customError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue with this account</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Bottom Disclaimer */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800/80 text-[11px] text-slate-500 text-center leading-relaxed">
          To continue, Google will share your name, email address, and profile with JobFlux AI. See our Privacy Policy and Terms of Service.
        </div>
      </div>
    </div>
  )
}
