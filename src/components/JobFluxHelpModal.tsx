'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Mail,
  Copy,
  Check,
  HelpCircle,
  MessageSquare,
  Send,
  ExternalLink,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface JobFluxHelpModalProps {
  isOpen?: boolean
  onClose?: () => void
  onOpen?: () => void
  showFloatingTrigger?: boolean
  initialEmail?: string
  initialName?: string
  initialUserId?: string
  onTicketSubmitted?: (ticketId: string) => void
}

export default function JobFluxHelpModal({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onOpen,
  showFloatingTrigger = true,
  initialEmail = '',
  initialName = '',
  initialUserId = '',
  onTicketSubmitted
}: JobFluxHelpModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  
  // Modal is considered open if either the controlled prop is true OR the internal trigger was clicked
  const isModalOpen = controlledIsOpen !== undefined ? (controlledIsOpen || internalIsOpen) : internalIsOpen
  
  const handleClose = () => {
    setInternalIsOpen(false)
    if (controlledOnClose) {
      controlledOnClose()
    }
  }

  const handleOpen = () => {
    setInternalIsOpen(true)
    if (onOpen) {
      onOpen()
    }
  }

  const [activeTab, setActiveTab] = useState<'ticket' | 'faq'>('ticket')
  const [copied, setCopied] = useState(false)

  // Form State
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [category, setCategory] = useState('urgent_query')
  const [priority, setPriority] = useState('normal')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null)
  const [formError, setFormError] = useState('')

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  const supportEmail = 'technohmsit@gmail.com'

  // Pre-fill from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEmail = localStorage.getItem('user_email') || ''
      const storedUid = localStorage.getItem('user_id') || ''
      if (!email && storedEmail) setEmail(storedEmail)
      if (!name && storedUid) setName(storedUid.replace(/^candidate\d+_/, '').replace(/_/g, ' '))
    }
  }, [email, name])

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(supportEmail)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback
    }
  }

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!email || !email.includes('@')) {
      setFormError('Please provide a valid email address.')
      return
    }
    if (!message || message.trim().length < 5) {
      setFormError('Please enter a descriptive message.')
      return
    }

    setSubmitting(true)
    try {
      const uid = initialUserId || (typeof window !== 'undefined' ? localStorage.getItem('user_id') || '' : '')
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          category,
          priority,
          subject: subject || `${category.toUpperCase()} Query from ${name || email}`,
          message,
          user_id: uid
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setSubmittedTicket(data.ticket_id)
        setMessage('')
        if (onTicketSubmitted) {
          onTicketSubmitted(data.ticket_id)
        }
      } else {
        setFormError(data.detail || 'Failed to submit support request. Please email us directly.')
      }
    } catch (err: any) {
      setFormError(err.message || 'Submission error. Please email us directly.')
    } finally {
      setSubmitting(false)
    }
  }

  const faqs = [
    {
      q: 'How do the daily automated application runs work?',
      a: 'JobFlux AI autonomous engines execute twice every single day at 06:00 AM and 08:00 AM IST. The bot dynamically matches open vacancies on Naukri according to your exact target roles, experience, and location preferences, intelligently answering employer screening questions with your tailored ATS profile.'
    },
    {
      q: 'How do I update or replace my candidate resume?',
      a: 'Navigate to your Candidate Dashboard and click on Profile Settings. You can upload a new PDF file at any time. The engine will instantly parse your latest credentials and use this new PDF for all subsequent job applications.'
    },
    {
      q: 'What is the priority contact email for immediate assistance?',
      a: 'Our central support desk is managed at technohmsit@gmail.com. Inquiries sent to this address receive direct priority attention from our technical team within 2 to 4 hours.'
    },
    {
      q: 'Can I trigger an application scout on-demand anytime?',
      a: 'To maximize cloud energy efficiency and optimize server resource utilization, all applications are dispatched automatically during high-visibility morning recruiter windows (06:00 AM & 08:00 AM IST). Real-time On-Demand manual triggers are currently in active beta development and coming soon to premium accounts.'
    },
    {
      q: 'How do enterprise and agency cohorts work?',
      a: 'For staffing agencies, colleges, or team cohorts, we offer dedicated worker nodes, unified group analytics, and bulk seat billing. Reach out through the Enterprise modal on the pricing page or email us directly at technohmsit@gmail.com.'
    }
  ]

  return (
    <>
      {/* Floating Trigger Button in Bottom-Right Corner */}
      {showFloatingTrigger && !isModalOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpen}
          type="button"
          aria-label="Help & Support"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-zinc-900/95 hover:bg-zinc-800 border border-zinc-700/80 hover:border-teal-500/50 text-white shadow-2xl backdrop-blur-md transition-all text-xs font-medium cursor-pointer group pointer-events-auto select-none"
        >
          <div className="w-5 h-5 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
            <HelpCircle className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold tracking-wide">Help & Support</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </motion.button>
      )}

      {/* Modal Dialog Backdrop & Card */}
      <AnimatePresence>
        {isModalOpen && (
          <div 
            onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-xl max-h-[94vh] sm:max-h-[92vh] bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      JobFlux Help & Support Center
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Direct access to the JobFlux technical support team
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Priority Email Hero Banner */}
              <div className="p-5 bg-gradient-to-b from-zinc-900/50 to-transparent border-b border-zinc-800/80">
                <div className="p-4 rounded-xl bg-black border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/30 text-teal-300">
                        Primary Preference
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" /> 2-4h response
                      </span>
                    </div>
                    <div className="text-sm font-mono font-semibold text-white tracking-wide">
                      {supportEmail}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <a
                      href={`mailto:${supportEmail}?subject=JobFlux%20AI%20Support%20Request`}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Send Mail</span>
                    </a>
                    <button
                      onClick={handleCopyEmail}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Segmented Tab Navigation */}
              <div className="px-5 pt-3 flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('ticket')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'ticket'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white bg-transparent'
                  }`}
                >
                  Submit Inquiry Ticket
                </button>
                <button
                  onClick={() => setActiveTab('faq')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'faq'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white bg-transparent'
                  }`}
                >
                  Knowledge Base & FAQ
                </button>
              </div>

              {/* Body Content */}
              <div className="p-5 flex-1 overflow-y-auto">
                {activeTab === 'ticket' && (
                  <div>
                    {submittedTicket ? (
                      <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                          <Check className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">
                            Inquiry Received Successfully
                          </h4>
                          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                            Ticket reference <strong className="text-zinc-200 font-mono">#{submittedTicket}</strong> has been forwarded to our support queue at <span className="text-teal-300 font-mono">{supportEmail}</span>.
                          </p>
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          We will respond directly to your email at <span className="text-zinc-300">{email}</span>.
                        </p>
                        <button
                          onClick={() => setSubmittedTicket(null)}
                          className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
                        >
                          Submit Another Inquiry
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitTicket} className="space-y-3.5">
                        {formError && (
                          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                            {formError}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] text-zinc-400 font-medium">Your Name</label>
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Alex Mercer"
                              className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] text-zinc-400 font-medium">
                              Email Address <span className="text-teal-400">*</span>
                            </label>
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="alex@domain.com"
                              className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] text-zinc-400 font-medium">Request Type</label>
                            <select
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white text-xs focus:outline-none focus:border-zinc-600 cursor-pointer"
                            >
                              <option value="urgent_query">Urgent Query / Issue</option>
                              <option value="daily_runs">Daily Runs (6 AM & 8 AM)</option>
                              <option value="resume_profile">Resume & Profile Criteria</option>
                              <option value="technical">Technical Bug / Problem</option>
                              <option value="feature_request">Feature Request</option>
                              <option value="billing_enterprise">Plans & Enterprise</option>
                              <option value="general">General Inquiry</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] text-zinc-400 font-medium">Priority</label>
                            <select
                              value={priority}
                              onChange={(e) => setPriority(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white text-xs focus:outline-none focus:border-zinc-600 cursor-pointer"
                            >
                              <option value="normal">Normal Priority</option>
                              <option value="high">High Priority</option>
                              <option value="urgent">Urgent Priority</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] text-zinc-400 font-medium">Subject</label>
                            <input
                              type="text"
                              value={subject}
                              onChange={(e) => setSubject(e.target.value)}
                              placeholder="Brief summary of your query"
                              className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-zinc-400 font-medium">
                            Message Details <span className="text-teal-400">*</span>
                          </label>
                          <textarea
                            required
                            rows={4}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe how we can help you..."
                            className="w-full px-3 py-2 rounded-lg bg-black border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
                          />
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-[11px] text-zinc-500 font-mono">
                            Dispatches to {supportEmail}
                          </span>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{submitting ? 'Submitting...' : 'Send Inquiry'}</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {activeTab === 'faq' && (
                  <div className="space-y-2.5">
                    {faqs.map((faq, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-black border border-zinc-800/80 overflow-hidden transition-colors"
                      >
                        <button
                          onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                          className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs font-medium text-white hover:bg-zinc-900/40 cursor-pointer"
                        >
                          <span>{faq.q}</span>
                          {openFaqIndex === idx ? (
                            <ChevronUp className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          )}
                        </button>
                        {openFaqIndex === idx && (
                          <div className="px-3.5 pb-3.5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-900/60 pt-2.5">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3.5 border-t border-zinc-800 bg-zinc-950 text-center text-[11px] text-zinc-500 flex items-center justify-between px-5">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit SSL Encrypted Support
                </span>
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  {supportEmail}
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

