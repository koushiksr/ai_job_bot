'use client'

import { useState, useEffect, useRef } from 'react'
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
  LogOut,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  X,
  Zap
} from 'lucide-react'
import JobFluxLogo from '@/components/JobFluxLogo'
import AiEngineVisualizer from '@/components/AiEngineVisualizer'
import HomeInteractiveToolsCard from '@/components/HomeInteractiveToolsCard'
import JobFluxHelpModal from '@/components/JobFluxHelpModal'
import HeroReviewCarousel from '@/components/HeroReviewCarousel'
import CandidateReviewModal from '@/components/CandidateReviewModal'
import LiveHiringTicker from '@/components/LiveHiringTicker'
import HeroCareerLeapWidget from '@/components/HeroCareerLeapWidget'
import JobFluxFourPillars from '@/components/JobFluxFourPillars'
import FuturisticHeroCockpit from '@/components/FuturisticHeroCockpit'
import EmployerProofMarquee from '@/components/EmployerProofMarquee'
import TrustBadgesBar from '@/components/TrustBadgesBar'
import LiveConversionToast from '@/components/LiveConversionToast'
import Footer from '@/components/Footer'
import { APP_CONFIG, isAdminUser } from '@/config/appConfig'
import { trackSignUp } from '@/lib/tracker'

const FAQS = [
  {
    q: 'How does the JobFlux autonomous auto-apply bot work?',
    a: 'JobFlux AI scans active employer listings matching your target roles, skills, and preferences, accurately completes recruiter questionnaires using your background context, and submits verified applications directly to hiring managers.'
  },
  {
    q: 'What makes the Harvard & FAANG ATS resume standard different?',
    a: 'Unlike multi-column or graphic-heavy resumes that fail Applicant Tracking Systems, our Harvard ATS format uses a clean, single-column structure with Google XYZ formula metric bullets ("Accomplished X, measured by Y, by doing Z"). This layout achieves a 99%+ parsing pass rate across Workday, Greenhouse, Lever, Taleo, and iCIMS.'
  },
  {
    q: 'Can I blacklist my current employer and mass consultancies?',
    a: 'Yes. JobFlux includes quick-tap exclusion presets for major consultancies and IT service firms (TCS, Infosys, Wipro, Cognizant, Accenture, Capgemini, HCLTech, etc.) as well as custom company blocking. The autonomous bot automatically skips any openings from blacklisted companies.'
  },
  {
    q: 'Does the AI bot accurately answer custom recruiter screening questions?',
    a: 'Yes. JobFlux AI utilizes contextual profiling to formulate accurate responses for notice period (e.g. Immediate / 15 Days), expected CTC, current CTC, relocation preferences, and key technical stack depth, ensuring screening forms are never left blank.'
  },
  {
    q: 'Is automated job applying safe for my candidate profile?',
    a: 'JobFlux AI is engineered with human-like operational pacing, secure session encryption, and zero data-leak sanitization. Sensitive PII is anonymized prior to cloud processing, and the engine adheres strictly to platform application rate guidelines.'
  },
  {
    q: 'Can I start using JobFlux AI for free?',
    a: 'Yes! You can start completely free with zero payment details required. Simply create your account, configure your target roles, and let the autopilot begin applying on your behalf.'
  }
]

export default function Home() {
  const [authMode, setAuthMode] = useState<'signin' | 'trial' | 'forgot'>('trial')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('')
  const [existingUser, setExistingUser] = useState<{ id: string; email: string; role: string } | null>(null)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  
  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cardHighlighted, setCardHighlighted] = useState(false)

  const authCardRef = useRef<HTMLDivElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setForgotSuccessMessage('')
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setForgotLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to send password reset email.')
      }
      setForgotSent(true)
      setForgotSuccessMessage(data.message || 'Password reset link and verification code have been dispatched!')
    } catch (err: any) {
      setError(err.message || 'Error requesting password reset.')
    } finally {
      setForgotLoading(false)
    }
  }

  const scrollToAuth = (mode: 'signin' | 'trial' | 'forgot') => {
    setAuthMode(mode)
    setError('')
    setForgotSent(false)
    setForgotSuccessMessage('')

    if (authCardRef.current) {
      authCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setCardHighlighted(true)
      setTimeout(() => setCardHighlighted(false), 1500)
    }

    setTimeout(() => {
      if (mode === 'trial' && nameInputRef.current) {
        nameInputRef.current.focus()
      } else if (emailInputRef.current) {
        emailInputRef.current.focus()
      }
    }, 400)
  }

  // Check if already logged in -> auto navigate to dashboard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUid = localStorage.getItem('user_id')
      const storedEmail = localStorage.getItem('user_email') || ''
      const storedRole = localStorage.getItem('user_role') || 'user'

      if (storedUid) {
        setExistingUser({ id: storedUid, email: storedEmail, role: storedRole })
        // If already logged in, navigate directly based on role
        if (storedRole === 'admin' || storedUid === 'technohmsit' || storedEmail === 'technohmsit@gmail.com') {
          window.location.replace('/admin')
        } else if (storedRole === 'enterprise_admin' || storedEmail === 'koushiksrmedala@gmail.com') {
          window.location.replace('/enterprise-admin')
        } else {
          window.location.replace('/dashboard')
        }
        return
      }

      const p = new URLSearchParams(window.location.search)
      const modeParam = p.get('mode')
      const hash = window.location.hash

      if (modeParam === 'signin' || hash === '#signin' || hash === '#auth-card') {
        setAuthMode('signin')
        setTimeout(() => {
          authCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setCardHighlighted(true)
          setTimeout(() => setCardHighlighted(false), 1500)
          emailInputRef.current?.focus()
        }, 700)
      } else if (modeParam === 'trial' || modeParam === 'free' || hash === '#trial' || hash === '#free' || p.get('plan') === 'free' || p.get('plan') === 'trial') {
        setAuthMode('trial')
        setTimeout(() => {
          authCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setCardHighlighted(true)
          setTimeout(() => setCardHighlighted(false), 1500)
          nameInputRef.current?.focus()
        }, 700)
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

    // Direct Master Administrator credentials bypass check
    if (
      authMode === 'signin' &&
      (
        cleanEmail === 'admin' ||
        cleanEmail === 'technohmsit' ||
        cleanEmail === 'technohmsit@gmail.com' ||
        cleanEmail === 'admin@jobflux.ai' ||
        cleanEmail === 'admin@jobfluxai.com'
      ) &&
      cleanPwd === 'admin'
    ) {
      const masterUid = (cleanEmail === 'admin' || cleanEmail.startsWith('admin@')) ? 'admin' : APP_CONFIG.masterAdminId
      const masterEmail = cleanEmail.includes('@') ? cleanEmail : APP_CONFIG.supportEmail
      localStorage.setItem('user_id', masterUid)
      localStorage.setItem('user_email', masterEmail)
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

        // Track signup/lead conversion event for Meta Pixel and GA4
        if (authMode === 'trial') {
          trackSignUp('email_form', data.plan || 'trial', { email: data.email, name })
        }

        // If user explicitly signed in with primary master admin credentials, navigate to /admin.
        // For all candidate accounts and users, navigate directly to candidate /dashboard!
        if (data.role === 'admin' || data.user_id === 'technohmsit' || data.email === 'technohmsit@gmail.com' || data.user_id === 'admin') {
          window.location.href = '/admin'
        } else if (data.role === 'enterprise_admin' || data.email === 'koushiksrmedala@gmail.com') {
          window.location.href = '/enterprise-admin'
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
                if (data.picture) {
                  localStorage.setItem('user_picture', data.picture)
                }
                trackSignUp('google_one_tap', data.plan || 'trial', { email: data.email, user_id: data.user_id })
                window.location.href = (data.user_id === 'technohmsit' || data.email === 'technohmsit@gmail.com') ? '/admin' : '/dashboard'
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
      <div className="min-h-screen flex flex-col bg-[#000000] text-zinc-100 selection:bg-cyan-500/20 selection:text-white relative cyber-grid-pattern">
        
        {/* Luminous Cosmic Cyber Aurora Atmosphere */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-80px] left-1/4 w-[520px] h-[520px] bg-cyan-500/15 rounded-full blur-[140px] animate-aurora-pulse" />
          <div className="absolute top-[-40px] right-1/4 w-[520px] h-[520px] bg-purple-600/15 rounded-full blur-[140px] animate-aurora-pulse" style={{ animationDelay: '4s' }} />
          <div className="absolute top-[240px] left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-600/10 rounded-full blur-[120px]" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent pointer-events-none" />

        {/* Top Sticky Minimalist Header */}
        <header className="sticky top-0 z-40 w-full bg-black/80 backdrop-blur-xl border-b border-zinc-900/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <JobFluxLogo size="sm" />
            </Link>

            {/* In-page Anchor & Navigation Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-medium">
              <a
                href="#ai-engine-showcase"
                className="hover:text-white transition-colors"
              >
                Engine
              </a>
              <a
                href="#features"
                className="hover:text-white transition-colors"
              >
                Features
              </a>
              <Link
                href="/resume-builder"
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <span>Resume Studio</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-950/80 border border-amber-700/50 text-amber-300">ATS</span>
              </Link>
              <Link
                href="/tools"
                className="hover:text-cyan-400 transition-colors flex items-center gap-1 text-cyan-400/90 font-semibold"
              >
                <span>Free Tools</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-950/80 border border-cyan-700/50 text-cyan-300">NEW</span>
              </Link>
              <Link
                href="/pricing"
                className="hover:text-white transition-colors"
              >
                Pricing
              </Link>
              <a
                href="#faq"
                className="hover:text-white transition-colors"
              >
                FAQ
              </a>
              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Help & Support</span>
              </button>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile Help Trigger */}
              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="text-xs text-zinc-400 hover:text-white transition-colors font-medium cursor-pointer flex md:hidden items-center gap-1 shrink-0 px-2 py-1"
              >
                <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="hidden sm:inline">Help</span>
              </button>

              <Link
                href="/tools"
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium md:hidden hidden sm:inline-block px-2 py-1"
              >
                Tools
              </Link>
              <Link
                href="/pricing"
                className="text-xs text-zinc-400 hover:text-white transition-colors font-medium md:hidden hidden sm:inline-block px-2 py-1"
              >
                Pricing
              </Link>

              {existingUser ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                    <span className="text-zinc-300 font-mono text-[11px] max-w-[150px] truncate">
                      {existingUser.email || existingUser.id}
                    </span>
                  </div>
                  <Link
                    href={existingUser.role === 'admin' ? '/admin' : '/dashboard'}
                    className="px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-colors shrink-0"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-xs text-zinc-400 hover:text-white transition-colors font-medium px-2 py-1 cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sign out</span>
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-xs text-zinc-400 hover:text-white transition-colors font-medium px-2.5 py-1.5 rounded-lg hover:bg-zinc-900/80 cursor-pointer"
                  >
                    Sign in
                  </Link>
                  <button
                    type="button"
                    onClick={() => scrollToAuth('trial')}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-all shadow-sm cursor-pointer shrink-0"
                  >
                    <span className="hidden sm:inline">Start Free (AI Autopilot)</span>
                    <span className="sm:hidden">Start Free</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Welcome Guide Strip — only shown to guests (non-logged-in) */}
        {!existingUser && (
          <div className="w-full border-b border-zinc-900 bg-zinc-950/90 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-zinc-400 text-center sm:text-left">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 hidden sm:inline-block animate-pulse" />
                <span>Stop applying manually. AI applies for you while you sleep • <span className="text-zinc-200 font-medium">Free to start</span></span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/login"
                  className="text-xs text-zinc-400 hover:text-white transition-colors px-2.5 py-1 rounded-md hover:bg-zinc-900 cursor-pointer"
                >
                  Sign in
                </Link>
                <button
                  type="button"
                  onClick={() => scrollToAuth('trial')}
                  className="px-3 py-1 rounded-md bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors cursor-pointer"
                >
                  Start Free →
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Real-Time Live Hiring Activity Ticker */}
        <LiveHiringTicker />

        {/* Main Hero Section */}
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 md:py-16 flex-1 flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12 z-10">
          
          {/* Left Column: Clean Value Proposition */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 w-full text-center lg:text-left space-y-6"
          >
            <div>
              {/* Futuristic Cyber Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-950/80 via-zinc-900/90 to-purple-950/80 border border-cyan-500/40 text-zinc-200 text-xs font-mono mb-4 sm:mb-5 shadow-lg shadow-cyan-950/40">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-white font-bold tracking-wide">⚡ NEURAL JOB ENGINE v4.2</span>
                <span className="text-zinc-600">&bull;</span>
                <span className="text-cyan-300 font-semibold">100% Free 7-Day Access</span>
              </div>
              
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.05]">
                Wake Up to 5+ Tech <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-400 text-cyber-glow">
                  Interview Calls.
                </span>
              </h1>
              
              <p className="text-sm sm:text-base text-zinc-300 mt-4 sm:mt-5 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                <strong className="text-white font-semibold">85% of interview shortlists go to the first 10 candidates</strong> who apply within 2 hours. Stop grinding job portals after work. JobFlux AI matches high-paying tech openings and submits verified Harvard ATS applications every morning at 6:00 AM &amp; 8:00 AM IST—putting you at the top of recruiter inboxes while you sleep.
              </p>
            </div>

            {/* Value Highlights */}
            <div className="flex flex-wrap gap-2 sm:gap-2.5 items-center justify-center lg:justify-start text-xs text-zinc-300">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800 hover:border-cyan-500/40 transition-colors">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Be First In Line (6 &amp; 8 AM Early Sweeps)</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800 hover:border-purple-500/40 transition-colors">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Target ₹20L–₹60L Product Roles</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800 hover:border-emerald-500/40 transition-colors">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Anti-Ban &amp; Employer Blocker</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              {existingUser ? (
                <Link
                  href={existingUser.role === 'admin' ? '/admin' : '/dashboard'}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/5"
                >
                  <span>Open {existingUser.role === 'admin' ? 'Admin Portal' : 'Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => scrollToAuth('trial')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-white font-bold text-xs sm:text-sm shimmer-button-glow transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-cyan-500/20 group"
                >
                  <span>Start Free AI Autopilot (10s)</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              <a
                href="#why-jobflux"
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white font-medium text-xs sm:text-sm border border-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Why JobFlux Works</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </a>
            </div>

            {/* Live Candidate Reviews & Satisfaction Social Proof Carousel */}
            <div className="pt-4 sm:pt-6 border-t border-zinc-900/80">
              <HeroReviewCarousel onOpenReviewModal={() => setIsReviewModalOpen(true)} />
            </div>
          </motion.div>
          
          {/* Right Column: Futuristic Hero Cockpit or Active Session Card */}
          <motion.div 
            ref={authCardRef}
            id="auth-card"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full lg:w-[460px] xl:w-[490px] shrink-0 scroll-mt-24"
          >
            {existingUser ? (
              <div className="p-7 w-full border border-zinc-800 bg-[#09090b] rounded-2xl shadow-xl space-y-5 text-center relative overflow-hidden card-featured-glow">
                {/* Subtle top border accent */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-600/40 to-transparent pointer-events-none" />
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
              <FuturisticHeroCockpit />
            )}
          </motion.div>
        </main>

        {/* Premier Tech Employer Hiring & Interview Proof Marquee */}
        <EmployerProofMarquee />

        {/* Minimalist Platform Telemetry Bar */}
        <div className="w-full border-y border-zinc-900 bg-zinc-950/70 py-2.5 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-zinc-400 text-center sm:text-left">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 hidden sm:inline-block animate-pulse" />
              <span className="text-zinc-400">Scheduled Dispatch:</span>
              <span className="text-zinc-200 font-medium">
                Dual morning runs at 06:00 AM &amp; 08:00 AM IST directly to hiring managers
              </span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-[11px] text-zinc-400 font-mono">
              <span>14,820+ Submitted</span>
              <span className="text-zinc-700">·</span>
              <span>98.6% ATS Pass Rate</span>
              <span className="text-zinc-700 hidden sm:inline">·</span>
              <span className="text-emerald-400 font-medium hidden sm:inline">Zero Account Bans Guaranteed</span>
            </div>
          </div>
        </div>

        {/* Institutional Trust, Safety & Anti-Ban Standards */}
        <TrustBadgesBar />

        {/* Interactive Opportunity Scanner & CTC Calculator */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 z-10">
          <HeroCareerLeapWidget 
            onStartFree={scrollToAuth} 
            onGoogleAuth={handleGoogleAuth} 
          />
        </section>

        {/* Section 2: AI Engine Simulation (Sleek Gladia Cockpit) */}
        <section id="ai-engine-showcase" className="w-full max-w-7xl mx-auto px-6 py-16 border-t border-zinc-900 z-10 space-y-8 scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
              Autonomous Flow
            </span>
            <h2 className="text-2xl sm:text-4xl font-semibold text-white tracking-tight">
              Watch AI apply for you in real time.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              From finding matching openings to answering screening questions, see the autonomous engine at work.
            </p>
          </div>

          <AiEngineVisualizer />
        </section>

        {/* Section 3: 4 Emotional Pillars of JobFlux (Need, Status, Passion, Brand) */}
        <JobFluxFourPillars
          onStartFree={scrollToAuth}
          onGoogleAuth={handleGoogleAuth}
        />

        {/* Section 3.5: Performance Impact & Trust Metrics */}
        <section id="features" className="w-full max-w-7xl mx-auto px-6 pb-16 z-10 space-y-6">

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

        {/* Section 4: Interactive ATS Scorer & Mini-Tools Suite */}
        <section id="tools-preview" className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-16 border-t border-zinc-900 z-10 space-y-8 scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
              Free Candidate Diagnostics
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Test your profile before you apply.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Run a free ATS compatibility check, calculate your recruiter search ranking, or generate direct cold outreach templates.
            </p>
          </div>

          <HomeInteractiveToolsCard
            onTriggerAuth={scrollToAuth}
            isLoggedIn={!!existingUser}
          />
        </section>

        {/* Section: Why Buy JobFlux AI — The Comparison & Math */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-16 border-t border-zinc-900 z-10 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Sparkles className="w-3.5 h-3.5" /> High-Return Career Investment
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
              Why 1,200+ Tech Engineers Choose JobFlux AI
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              Applying manually wastes 60+ hours of your life every month. Here is why automated autopilot is the highest ROI investment for your tech career.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-[#09090b] shadow-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/90 text-zinc-400">
                  <th className="p-4 sm:p-5 font-semibold">Key Capabilities</th>
                  <th className="p-4 sm:p-5 font-semibold text-zinc-500">Manual Applying</th>
                  <th className="p-4 sm:p-5 font-semibold text-zinc-500">Cheap Chrome Extensions</th>
                  <th className="p-4 sm:p-5 font-bold text-white bg-zinc-900/80">JobFlux AI Autopilot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Daily Application Velocity</td>
                  <td className="p-4 sm:p-5 text-zinc-500">5-10 / day (Exhausting)</td>
                  <td className="p-4 sm:p-5 text-zinc-500">Unreliable (Crashes often)</td>
                  <td className="p-4 sm:p-5 font-semibold text-white bg-zinc-900/40">Up to 50 / day on Autopilot</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">24h Recruiter Profile Bump</td>
                  <td className="p-4 sm:p-5 text-zinc-500">Must remember every morning</td>
                  <td className="p-4 sm:p-5 text-zinc-500">None</td>
                  <td className="p-4 sm:p-5 font-semibold text-white bg-zinc-900/40">Automatic 9 AM Silent Touch (3x more calls)</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">AI Screening Questionnaire Solver</td>
                  <td className="p-4 sm:p-5 text-zinc-500">Manual typing on every job</td>
                  <td className="p-4 sm:p-5 text-zinc-500">Leaves blank or random guesses</td>
                  <td className="p-4 sm:p-5 font-semibold text-white bg-zinc-900/40">Context-Aware AI Answers from Resume</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Account Safety &amp; Ban Risk</td>
                  <td className="p-4 sm:p-5 text-zinc-400">Safe (Manual)</td>
                  <td className="p-4 sm:p-5 text-rose-400">High Risk (Datacenter IP bans)</td>
                  <td className="p-4 sm:p-5 font-semibold text-white bg-zinc-900/40">100% Safe (Local Residential IP + Stealth)</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Harvard ATS Resume Studio</td>
                  <td className="p-4 sm:p-5 text-zinc-500">Pay ₹2,000+ for external writers</td>
                  <td className="p-4 sm:p-5 text-zinc-500">None</td>
                  <td className="p-4 sm:p-5 font-semibold text-white bg-zinc-900/40">Included Free (99.7% ATS pass rate)</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Time Invested Per Month</td>
                  <td className="p-4 sm:p-5 text-rose-400 font-semibold">60 - 75 Hours Wasted</td>
                  <td className="p-4 sm:p-5 text-zinc-400">15 Hours debugging errors</td>
                  <td className="p-4 sm:p-5 font-semibold text-white bg-zinc-900/40">0 Hours (100% Automated Background)</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Monthly Investment</td>
                  <td className="p-4 sm:p-5 text-zinc-400">₹45,000+ (in lost dev time)</td>
                  <td className="p-4 sm:p-5 text-zinc-400">₹1,500 - ₹3,000/mo ($20-$40)</td>
                  <td className="p-4 sm:p-5 font-bold text-white bg-zinc-900/60">Just ₹99 / Month (was ₹1,000 · ₹3.3 / day)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 14-Day Interview Callback Guarantee & ROI Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <div className="p-6 sm:p-7 rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  14-Day Recruiter Interview Guarantee
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  We are so confident in our dual-run engine and 9 AM profile booster that we offer a 100% money-back guarantee. If you don&apos;t receive at least 3 recruiter profile shortlists or interview calls within 14 days, email us for an immediate, full refund. Zero hassle.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-mono text-zinc-300 flex items-center gap-1.5 font-semibold">
                <Check className="w-4 h-4" /> 100% Risk-Free Guarantee
              </div>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <Zap className="w-6 h-6 text-zinc-300" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  The ROI: Why ₹99 is a Complete No-Brainer
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  As a software engineer, your time is worth ₹1,000 to ₹3,000 per hour. Spending 60 hours clicking apply manually costs you ₹60,000+ in wasted personal time and burnout. JobFlux AI costs just ₹99 for a full month (down from ₹1,000) to run in the background while you focus on interview prep.
                </p>
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-lg shadow-white/5"
              >
                <span>Get Started for ₹99 / Month</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Section 4: Interactive SEO FAQ Accordion & Knowledge Base */}
        <section id="faq" className="w-full max-w-5xl mx-auto px-6 py-16 border-t border-zinc-900 z-10 space-y-8 scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-mono text-sky-400 uppercase tracking-wider">
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl sm:text-4xl font-semibold text-white tracking-tight">
              Everything you need to know about JobFlux AI
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Real answers about safety, ATS compliance, automation limits, and money-back guarantees.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:border-zinc-700"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="text-xs sm:text-sm font-semibold text-white leading-snug">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-sky-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-0 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-900 mt-1">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Section 5: Semantic Tech Roles & Indian Tech Hubs Matrix (SEO Indexing Mesh) */}
        <section className="w-full max-w-7xl mx-auto px-6 py-12 border-t border-zinc-900/60 z-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-2">
              <h4 className="text-[11px] font-mono uppercase text-zinc-300 font-semibold tracking-wider">
                Target Engineering Roles
              </h4>
              <p className="text-zinc-500 leading-relaxed text-[11px]">
                Senior AI Engineer · Generative AI & RAG Architect · Lead Full Stack Developer · Staff Cloud Infrastructure · DevOps & Kubernetes SRE · Backend Microservices Engineer (Python, Go, Java) · Engineering Manager
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-[11px] font-mono uppercase text-zinc-300 font-semibold tracking-wider">
                Primary Tech Hubs Covered
              </h4>
              <p className="text-zinc-500 leading-relaxed text-[11px]">
                Bengaluru (Whitefield, Bellandur, Electronic City) · Hyderabad (HITEC City, Gachibowli) · Pune (Hinjewadi) · Gurgaon & NCR (Cyber City) · Noida · Chennai (OMR) · Mumbai · Remote India
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-[11px] font-mono uppercase text-zinc-300 font-semibold tracking-wider">
                ATS Platforms & Screeners Supported
              </h4>
              <p className="text-zinc-500 leading-relaxed text-[11px]">
                Workday · Greenhouse · Lever · Taleo · iCIMS · SmartRecruiters · Rapid Recruiter Apply · SuccessFactors · Ashby
              </p>
            </div>
          </div>
        </section>

        {/* Mobile Sticky Floating Quick-Action Bar for Guests */}
        {!existingUser && (
          <div className="fixed bottom-0 left-0 right-0 z-50 p-2.5 sm:p-3 bg-black/95 backdrop-blur-xl border-t border-zinc-800 md:hidden flex items-center justify-between gap-3 shadow-[0_-10px_25px_rgba(0,0,0,0.85)]">
            <div className="space-y-0.5 min-w-0">
              <div className="text-[11px] font-extrabold text-white flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="truncate">JobFlux AI Autopilot</span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono truncate">100% Free · No Card Needed</div>
            </div>
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg shrink-0 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Start Free (1-Click)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Universal Footer with Legal Non-Affiliation & Disclaimers */}
        <div className="pb-16 md:pb-0">
          <Footer />
        </div>

        {/* Universal JobFlux Help & Support Center */}
        <JobFluxHelpModal
          isOpen={isHelpOpen}
          onOpen={() => setIsHelpOpen(true)}
          onClose={() => setIsHelpOpen(false)}
          showFloatingTrigger={true}
        />

        {/* Real-time Simulated Candidate Applications & Shortlist Toast */}
        <LiveConversionToast onActivateFree={() => scrollToAuth('trial')} />

        {/* Sticky Mobile Conversion Bar (for 88%+ Ad Mobile Visitors) */}
        {!existingUser && (
          <div className="fixed bottom-0 left-0 right-0 z-40 p-2.5 sm:hidden bg-zinc-950/95 backdrop-blur-xl border-t border-cyan-500/30 flex items-center justify-between gap-2.5 shadow-2xl">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                <span>7-Day Free AI Autopilot</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono truncate">
                Zero Card Needed &bull; 10s Setup
              </span>
            </div>
            <button
              type="button"
              onClick={() => scrollToAuth('trial')}
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold text-white shimmer-button-glow shadow-md shadow-cyan-500/30 shrink-0 cursor-pointer flex items-center gap-1"
            >
              <span>Start Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Google Identity Services SDK Script */}
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />

      {/* FAQPage Schema.org Structured Data for Google Rich Snippets */}
      <Script
        id="faq-schema-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: f.a
              }
            }))
          })
        }}
      />
    </>
  )
}
