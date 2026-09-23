'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Star,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Send,
  Building2,
  Briefcase,
  User,
  MessageSquare
} from 'lucide-react'

interface CandidateReviewModalProps {
  isOpen: boolean
  onClose: () => void
  initialName?: string
  initialEmail?: string
  initialUserId?: string
  initialAvatar?: string
  onSubmitted?: () => void
}

const SATISFACTION_TAGS = [
  '⚡ 4+ Recruiter Callbacks in First Week',
  '🚀 Saved 20+ Hours Every Week',
  '🎯 95%+ ATS Resume Match Rate',
  '⏰ 6:00 AM Morning Sweeps Landed Interviews',
  '🛡️ High Screening Answer Precision',
  '💼 Landed Dream Product Offer'
]

export default function CandidateReviewModal({
  isOpen,
  onClose,
  initialName = '',
  initialEmail = '',
  initialUserId = '',
  initialAvatar = '',
  onSubmitted
}: CandidateReviewModalProps) {
  const [userName, setUserName] = useState<string>(initialName)
  const [userEmail, setUserEmail] = useState<string>(initialEmail)
  const [userAvatar, setUserAvatar] = useState<string>(initialAvatar)
  const [roleTitle, setRoleTitle] = useState<string>('')
  const [company, setCompany] = useState<string>('')
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [satisfactionLevel, setSatisfactionLevel] = useState<string>(SATISFACTION_TAGS[0])
  const [reviewText, setReviewText] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('user_name') || ''
      const storedEmail = localStorage.getItem('user_email') || ''
      const storedPic = localStorage.getItem('user_picture') || ''
      if (!userName && storedName) setUserName(storedName)
      if (!userEmail && storedEmail) setUserEmail(storedEmail)
      if (!userAvatar && storedPic) setUserAvatar(storedPic)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!userName.trim()) {
      setErrorMsg('Please provide your name.')
      return
    }

    if (!reviewText.trim() || reviewText.trim().length < 10) {
      setErrorMsg('Please write at least a few sentences (minimum 10 characters) about your experience.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: initialUserId || (typeof window !== 'undefined' ? localStorage.getItem('user_id') : '') || '',
          user_email: userEmail.trim(),
          user_name: userName.trim(),
          user_avatar: userAvatar.trim(),
          role_title: roleTitle.trim() || 'Software Engineer',
          company: company.trim() || 'Verified Employer',
          rating,
          satisfaction_level: satisfactionLevel,
          review_text: reviewText.trim()
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to submit review')
      }

      setSubmittedSuccess(true)
      if (onSubmitted) onSubmitted()
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setSubmittedSuccess(false)
    setErrorMsg('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/80 light:bg-white/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-[#0a0a0c] border border-zinc-800 light:border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle top amber border accent */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-800/80 light:border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 light:border-amber-300 flex items-center justify-center text-amber-400 light:text-amber-600 shrink-0">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white light:text-zinc-900 flex items-center gap-1.5">
                <span>Candidate Satisfaction &amp; Review</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 light:text-amber-700 font-bold">
                  VERIFIED
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400 light:text-zinc-600 mt-0.5">
                Share how JobFlux automated runs &amp; ATS targeting worked for you.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseModal}
            className="p-1 rounded-lg text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 light:border-emerald-300 text-emerald-400 light:text-emerald-600 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white light:text-zinc-900">Thank You for Your Feedback!</h3>
              <p className="text-xs text-zinc-300 light:text-zinc-700 max-w-sm mx-auto leading-relaxed">
                Your satisfaction review has been submitted for verification. It will appear on our official public homepage once verified by our team.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 text-[11px] text-zinc-400 light:text-zinc-600 max-w-sm mx-auto flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 light:text-emerald-600 shrink-0" />
              <span>JobFlux maintains 100% genuine, human-verified reviews.</span>
            </div>
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-6 py-2 rounded-lg bg-white light:bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 light:hover:bg-zinc-100 text-black light:text-zinc-900 light:text-zinc-900 font-semibold text-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-950/40 light:bg-red-50 border border-red-800 text-red-300 light:text-red-600 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Star Rating Selector */}
            <div className="p-3.5 rounded-xl bg-zinc-950 light:bg-white border border-zinc-800/80 light:border-zinc-200 space-y-2 text-center">
              <label className="text-[11px] font-medium text-zinc-300 light:text-zinc-700 block">
                Overall Satisfaction Rating
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map(starValue => {
                  const active = (hoverRating || rating) >= starValue
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(starValue)}
                      className="p-1 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                      aria-label={`Rate ${starValue} stars`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          active
                            ? 'fill-amber-400 text-amber-400 light:text-amber-600 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                            : 'text-zinc-700 hover:text-zinc-500'
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
              <div className="text-[10px] font-mono text-amber-300 light:text-amber-700 font-semibold">
                {rating === 5 && '★★★★★ Outstanding (5.0 / 5)'}
                {rating === 4 && '★★★★ Very Good (4.0 / 5)'}
                {rating === 3 && '★★★ Satisfactory (3.0 / 5)'}
                {rating <= 2 && '★★ Needs Improvement'}
              </div>
            </div>

            {/* Candidate Identity Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-zinc-400 light:text-zinc-600 font-medium flex items-center gap-1">
                  <User className="w-3 h-3 text-zinc-500 light:text-zinc-600" />
                  <span>Your Full Name *</span>
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="e.g. Koushik S R"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 light:text-zinc-600 font-medium flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-zinc-500 light:text-zinc-600" />
                  <span>Target Role / Title *</span>
                </label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={e => setRoleTitle(e.target.value)}
                  placeholder="e.g. AI Engineer / React Dev"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>

            {/* Current Company & Avatar URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-zinc-400 light:text-zinc-600 font-medium flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-zinc-500 light:text-zinc-600" />
                  <span>Current Company / City (Optional)</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="e.g. Capgemini / Bengaluru"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 light:text-zinc-600 font-medium">Profile Photo URL (Optional)</label>
                <input
                  type="url"
                  value={userAvatar}
                  onChange={e => setUserAvatar(e.target.value)}
                  placeholder="https://... or auto-fallback to initials"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none focus:border-zinc-700 font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Quick Satisfaction Highlights */}
            <div className="space-y-1.5">
              <label className="text-zinc-400 light:text-zinc-600 font-medium block">
                Select Your Biggest Satisfaction Highlight:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SATISFACTION_TAGS.map(tag => {
                  const selected = satisfactionLevel === tag
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSatisfactionLevel(tag)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                        selected
                          ? 'bg-amber-500/20 text-amber-300 light:text-amber-700 border border-amber-500/40 light:border-amber-300 font-semibold'
                          : 'bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-850 text-zinc-400 light:text-zinc-600 border border-zinc-800 light:border-zinc-200'
                      }`}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Review Written Textarea */}
            <div className="space-y-1">
              <label className="text-zinc-400 light:text-zinc-600 font-medium flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-zinc-500 light:text-zinc-600" />
                  <span>Your Review &amp; Experience *</span>
                </span>
                <span className="text-[10px] text-zinc-500 light:text-zinc-600 font-mono">
                  {reviewText.length} characters
                </span>
              </label>
              <textarea
                rows={3}
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Describe how the automated morning sweeps, ATS keyword matching, or screening answers helped your job search..."
                required
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none focus:border-zinc-700 leading-relaxed"
              />
            </div>

            {/* Admin Verification Notice */}
            <div className="p-2.5 rounded-xl bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 text-[11px] text-zinc-400 light:text-zinc-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 light:text-emerald-600 shrink-0" />
              <span>
                All reviews require verification by the JobFlux administrator before appearing on the public homepage.
              </span>
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-300 light:text-zinc-700 border border-zinc-800 light:border-zinc-200 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting Review...' : 'Submit for Verification'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
