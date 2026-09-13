'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Sparkles,
  Download,
  Send,
  CheckCircle2,
  Shield,
  FileText,
  Lock,
  Plus,
  Trash2,
  Eye,
  Sliders,
  ChevronRight,
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  Copy,
  Printer,
  RefreshCw,
  Crown
} from 'lucide-react'
import JobFluxLogo from '@/components/JobFluxLogo'
import ProfessionalUpgradeModal from '@/components/ProfessionalUpgradeModal'

// Pre-configured High-Paying FAANG & Executive ATS Templates
const PRESET_TEMPLATES = [
  {
    id: 'ai-lead',
    name: 'Lead AI & Agentic Systems Engineer',
    bracket: '₹38 - 55 LPA',
    ats_score: 99.7,
    data: {
      name: 'Karthik S. Rao',
      role: 'Lead AI Engineer (GenAI & Agentic Workflows)',
      bracket: '₹38 - 55 LPA',
      email: 'karthik.rao.ai@gmail.com',
      phone: '+91 98452 41088',
      location: 'Bengaluru, Karnataka, India · Hybrid / Remote',
      linkedin: 'linkedin.com/in/karthik-s-rao',
      summary:
        'Results-driven AI Engineer with 4+ years architecting enterprise GenAI pipelines, multi-agent orchestration workflows, and production RAG microservices. Proven track record reducing LLM hallucination rates by 62% using LangGraph and semantic vector indexing, serving 12M+ monthly queries across fault-tolerant distributed infrastructure.',
      skills: {
        'AI & GenAI Core': [
          'LLM Application Development',
          'RAG (Retrieval-Augmented Generation)',
          'Agentic Workflows',
          'Multi-Agent Orchestration',
          'Model Context Protocol (MCP)',
          'Prompt Engineering',
          'LangSmith Evaluation'
        ],
        'Frameworks & APIs': [
          'LangGraph',
          'LangChain',
          'FastAPI',
          'PyTorch',
          'HuggingFace',
          'Groq API',
          'Ollama',
          'vLLM'
        ],
        'Cloud & Databases': [
          'AWS (ECS, Bedrock)',
          'Docker',
          'Qdrant',
          'Milvus',
          'MongoDB Atlas',
          'Redis Vector Store',
          'CI/CD'
        ],
        'Languages': ['Python (AsyncIO)', 'TypeScript', 'SQL', 'C++ basics', 'Bash']
      },
      experience: [
        {
          company: 'Cognitive Intelligent Systems Lab',
          title: 'Senior AI Systems Analyst · GenAI Pipelines',
          location: 'Bengaluru, India',
          period: 'Mar 2024 – Present',
          metrics: [
            'Architected end-to-end RAG architecture with Nomic embeddings and semantic chunking, slashing hallucination by 62% for 4.5M monthly customer queries.',
            'Engineered multi-agent reasoning graphs using LangGraph with automated fallback retry pipelines, lifting unattended task completion from 81% to 99.2%.',
            'Deployed high-throughput FastAPI inference microservices behind Redis caching layer, achieving p99 response latencies under 45ms.',
            'Established systematic evaluation suites in LangSmith tracking schema validation and token usage, cutting cloud model inference costs by 38%.'
          ]
        },
        {
          company: 'Nexus Tech Global',
          title: 'Full Stack AI Developer',
          location: 'Hyderabad, India',
          period: 'Aug 2022 – Feb 2024',
          metrics: [
            'Led migration of monolithic reporting backend to event-driven microservices architecture using Python and Next.js, accelerating page loads by 3.4x.',
            'Integrated LLM-assisted document parsing engine, saving client operational teams 35+ hours of manual data entry weekly.',
            'Configured automated CI/CD deployment pipelines on Docker and AWS ECS, boosting release frequency from bi-weekly to daily with 99.98% uptime.'
          ]
        }
      ],
      education: 'B.Tech in Computer Science & Engineering · BITS Pilani (Honors, 9.1 CGPA)',
      certifications: [
        'AWS Certified Solutions Architect – Professional',
        'DeepLearning.AI Generative AI with LLMs Specialization',
        'Certified Kubernetes Application Developer (CKAD)'
      ]
    }
  },
  {
    id: 'staff-systems',
    name: 'Staff Cloud & Distributed Systems Architect',
    bracket: '₹52 - 75 LPA',
    ats_score: 99.4,
    data: {
      name: 'Arjun Mehta',
      role: 'Staff Systems Architect (High-Concurrency Infrastructure)',
      bracket: '₹52 - 75 LPA',
      email: 'arjun.mehta@enterprise.org',
      phone: '+91 98765 •••••',
      location: 'Bengaluru, India · Remote',
      linkedin: 'linkedin.com/in/arjun-systems-architect',
      summary:
        'Staff Systems Architect with 8+ years experience scaling high-concurrency payment pipelines, distributed streaming microservices, and multi-region Kubernetes clusters. Track record delivering 99.999% SLA across ₹2,000Cr+ monthly gross merchandise value while slashing cloud infrastructure costs by 44%.',
      skills: {
        'Distributed Architecture': [
          'Event-Driven Microservices',
          'Kafka Streaming',
          'gRPC',
          'Distributed Locking',
          'CQRS Pattern',
          'High Availability'
        ],
        'Cloud & Platform': [
          'Kubernetes (EKS)',
          'Terraform',
          'AWS Multi-Region',
          'Docker',
          'Prometheus',
          'Grafana',
          'Istio Service Mesh'
        ],
        'Databases & Caching': [
          'PostgreSQL (Partitioning)',
          'Redis Cluster',
          'Cassandra',
          'MongoDB Atlas',
          'DynamoDB'
        ],
        'Languages': ['Go (Golang)', 'Python', 'Java', 'Rust', 'SQL']
      },
      experience: [
        {
          company: 'FinScale Payments Group',
          title: 'Staff Systems Architect (Core Engine)',
          location: 'Bengaluru, India',
          period: '2022 – Present',
          metrics: [
            'Re-architected core settlement pipeline handling 45,000 TPS using Go and Apache Kafka, eliminating transaction bottlenecks during peak Diwali sale events.',
            'Spearheaded multi-region active-active failover on AWS EKS, reducing recovery time objective (RTO) from 18 minutes to zero observable downtime.',
            'Optimized PostgreSQL connection pooling and memory allocations, driving down AWS RDS monthly infrastructure bill by ₹42L (44%).'
          ]
        },
        {
          company: 'HyperCommerce Global',
          title: 'Lead Backend Engineer',
          location: 'Bengaluru, India',
          period: '2019 – 2022',
          metrics: [
            'Built real-time inventory synchronization engine serving 80M product SKUs with sub-10ms latency over distributed Redis cluster.',
            'Mentored platform engineering group of 14 engineers, championing automated integration testing that reduced critical production defects by 78%.'
          ]
        }
      ],
      education: 'B.Tech in Computer Science & Engineering · IIT Madras',
      certifications: [
        'Certified Kubernetes Administrator (CKA)',
        'AWS Certified Solutions Architect – Professional'
      ]
    }
  },
  {
    id: 'fullstack-lead',
    name: 'Lead Full Stack Engineer',
    bracket: '₹35 - 50 LPA',
    ats_score: 98.9,
    data: {
      name: 'Priya Sharma',
      role: 'Lead Full Stack Engineer (Next.js & Microservices)',
      bracket: '₹35 - 50 LPA',
      email: 'priya.sharma@talentmesh.net',
      phone: '+91 99123 •••••',
      location: 'Hyderabad, India · Hybrid',
      linkedin: 'linkedin.com/in/priya-fullstack-lead',
      summary:
        'Lead Full Stack Engineer with 6+ years driving enterprise web platforms, reactive frontend systems, and resilient REST/GraphQL APIs. Proven ability to scale user-facing web applications from initial MVP to 4M+ active daily users while maintaining sub-second Time-To-Interactive.',
      skills: {
        'Frontend': ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS', 'WebSockets', 'Zustand', 'Radix UI'],
        'Backend': ['Node.js', 'FastAPI', 'Express', 'GraphQL', 'RESTful Microservices', 'Kafka'],
        'Cloud & DevOps': ['AWS', 'Docker', 'Vercel', 'PostgreSQL', 'MongoDB', 'GitHub Actions CI/CD'],
        'Testing & Performance': ['Jest', 'Playwright', 'Core Web Vitals Optimization', 'Lighthouse 98+']
      },
      experience: [
        {
          company: 'SaaSUnicorn Platforms',
          title: 'Senior Lead Frontend & Fullstack Architect',
          location: 'Hyderabad, India',
          period: '2022 – Present',
          metrics: [
            'Engineered modern Next.js enterprise portal processing $12M in annual SaaS subscriptions with perfect 98+ Lighthouse performance metrics.',
            'Decreased client bundle size by 54% through server components and dynamic imports, reducing mobile bounce rate by 22%.',
            'Designed and published company-wide React component library adopted by 6 autonomous product squads.'
          ]
        },
        {
          company: 'CloudFirst Technologies',
          title: 'Full Stack Software Engineer',
          location: 'Hyderabad, India',
          period: '2019 – 2022',
          metrics: [
            'Built responsive analytics dashboard in React and Node.js serving 250k+ daily business metrics for B2B enterprise clients.',
            'Automated end-to-end regression testing with Playwright, catching 95% of regressions before staging deployments.'
          ]
        }
      ],
      education: 'B.Tech in Information Technology · JNTU Hyderabad (First Class with Distinction)',
      certifications: ['Meta Certified Front-End Developer', 'AWS Certified Developer – Associate']
    }
  }
]

export default function ResumeBuilderPage() {
  const [userId, setUserId] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('user')
  const [userPlan, setUserPlan] = useState<string>('trial')
  const [isPlanActive, setIsPlanActive] = useState<boolean>(true)
  const [isVip, setIsVip] = useState<boolean>(false)
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true)

  // Current Resume State
  const [resumeData, setResumeData] = useState<any>(PRESET_TEMPLATES[0].data)
  const [selectedPresetId, setSelectedPresetId] = useState<string>('ai-lead')
  const [activeEditorTab, setActiveEditorTab] = useState<'basics' | 'experience' | 'skills' | 'education'>('basics')

  // Mobile view toggle (Editor vs ATS Sheet)
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor')

  // Action states
  const [syncingBot, setSyncingBot] = useState<boolean>(false)
  const [syncSuccess, setSyncSuccess] = useState<string>('')
  const [syncError, setSyncError] = useState<string>('')
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false)
  const [upgradeFeature, setUpgradeFeature] = useState<string>('Download Print-Ready ATS PDF')

  const resumeSheetRef = useRef<HTMLDivElement>(null)

  // Professional privilege checked against active plan or VIP pass
  const isProfessional =
    (userPlan === 'elite' || userPlan === 'professional' || userPlan === 'enterprise' || userPlan === 'vip' || isVip) && isPlanActive

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const uid = localStorage.getItem('user_id') || ''
      const email = localStorage.getItem('user_email') || ''
      const role = localStorage.getItem('user_role') || 'user'
      const plan = localStorage.getItem('user_plan') || 'trial'

      setUserId(uid)
      setUserEmail(email)
      setUserRole(role)
      setUserPlan(plan)

      if (uid) {
        loadUserProfile(uid)
      } else {
        setLoadingProfile(false)
      }
    }
  }, [])

  const loadUserProfile = async (uid: string) => {
    try {
      setLoadingProfile(true)
      const res = await fetch(`/api/profile?user_id=${encodeURIComponent(uid)}&t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        if (data.plan) setUserPlan(data.plan)
        if (typeof data.is_plan_active === 'boolean') setIsPlanActive(data.is_plan_active)
        if (typeof data.is_vip === 'boolean') setIsVip(Boolean(data.is_vip || data.plan === 'vip'))

        // If user already has profile details, enrich template
        if (data.name) {
          setResumeData((prev: any) => ({
            ...prev,
            name: data.name || prev.name,
            email: data.email || prev.email,
            phone: data.phone || prev.phone,
            role: data.target_role || data.role || prev.role,
            location: data.location || prev.location
          }))
        }
      }
    } catch (e) {
      console.warn('Failed to load profile for resume builder:', e)
    } finally {
      setLoadingProfile(false)
    }
  }

  // Switch between presets
  const handleSelectPreset = (presetId: string) => {
    const found = PRESET_TEMPLATES.find((p) => p.id === presetId)
    if (found) {
      setSelectedPresetId(presetId)
      setResumeData({
        ...found.data,
        name: resumeData.name || found.data.name,
        email: userEmail || resumeData.email || found.data.email,
        phone: resumeData.phone || found.data.phone
      })
    }
  }

  // Handle 1-Click Sync to Auto-Apply Bot
  const handleSyncToBot = async () => {
    if (!isProfessional && userRole !== 'admin') {
      setUpgradeFeature('1-Click Sync to Naukri Auto-Apply Bot')
      setShowUpgradeModal(true)
      return
    }

    if (!userId) {
      alert('Please sign in to sync your ATS resume with your candidate bot.')
      return
    }

    try {
      setSyncingBot(true)
      setSyncSuccess('')
      setSyncError('')

      const res = await fetch('/api/resume/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          resume: resumeData
        })
      })

      if (res.ok) {
        const data = await res.json()
        setSyncSuccess(
          data.message ||
            'Resume successfully attached! The automated bot will dispatch this document on upcoming morning runs.'
        )
        setTimeout(() => setSyncSuccess(''), 6000)
      } else {
        const err = await res.json()
        if (err.requires_upgrade) {
          setUpgradeFeature('1-Click Sync to Naukri Auto-Apply Bot')
          setShowUpgradeModal(true)
        } else {
          setSyncError(err.detail || 'Failed to sync resume with bot.')
        }
      }
    } catch (e: any) {
      setSyncError(`Sync failed: ${e.message}`)
    } finally {
      setSyncingBot(false)
    }
  }

  // Handle Download Print-Ready ATS PDF
  const handleDownloadPdf = () => {
    if (!isProfessional && userRole !== 'admin') {
      setUpgradeFeature('Print-Ready Harvard ATS PDF Download')
      setShowUpgradeModal(true)
      return
    }

    // Trigger browser print dialog with dedicated print styling
    window.print()
  }

  // Bullet Point Editor Handlers
  const handleAddMetric = (expIdx: number) => {
    setResumeData((prev: any) => {
      const expList = [...(prev.experience || [])]
      if (expList[expIdx]) {
        expList[expIdx] = {
          ...expList[expIdx],
          metrics: [
            ...(expList[expIdx].metrics || []),
            'Accomplished [Impact Goal] as measured by [Metric % or $] by implementing [Technical Solution].'
          ]
        }
      }
      return { ...prev, experience: expList }
    })
  }

  const handleUpdateMetric = (expIdx: number, metricIdx: number, text: string) => {
    setResumeData((prev: any) => {
      const expList = [...(prev.experience || [])]
      if (expList[expIdx] && expList[expIdx].metrics) {
        const metrics = [...expList[expIdx].metrics]
        metrics[metricIdx] = text
        expList[expIdx] = { ...expList[expIdx], metrics }
      }
      return { ...prev, experience: expList }
    })
  }

  const handleDeleteMetric = (expIdx: number, metricIdx: number) => {
    setResumeData((prev: any) => {
      const expList = [...(prev.experience || [])]
      if (expList[expIdx] && expList[expIdx].metrics) {
        const metrics = expList[expIdx].metrics.filter((_: any, i: number) => i !== metricIdx)
        expList[expIdx] = { ...expList[expIdx], metrics }
      }
      return { ...prev, experience: expList }
    })
  }

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 flex flex-col selection:bg-zinc-800 selection:text-white">
      {/* Print stylesheet to enforce Harvard single-column ATS format on print */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header,
          nav,
          .no-print {
            display: none !important;
          }
          #ats-resume-sheet {
            display: block !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0.4in !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>

      {/* Top Navigation Bar */}
      <header className="no-print border-b border-zinc-900 bg-black/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">Dashboard</span>
          </Link>

          <div className="h-4 w-[1px] bg-zinc-800" />

          <div className="flex items-center gap-2">
            <JobFluxLogo size="sm" showText={false} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                  Harvard / FAANG ATS Resume Studio
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-700/60 text-amber-300 font-semibold uppercase">
                  Single Column Ivy
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Header Status & Subtle PII Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Minimal PII Shield Badge */}
          <div
            className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800"
            title="Zero Data-Leak Guarantee: Automatically scrubs and anonymizes sensitive PII (Home address, Aadhaar/PAN, internal IDs, personal phone) before cloud processing"
          >
            <Shield className="w-3 text-emerald-400 shrink-0" />
            <span>Auto PII Sanitized</span>
          </div>

          {/* User Plan & VIP Badges */}
          <div className="flex items-center gap-1.5">
            {(isVip || userPlan === 'vip') && (
              <span
                className="inline-flex items-center gap-1 text-[9px] font-mono px-2.5 py-0.5 rounded-full border border-amber-400/80 bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 text-amber-300 font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.25)] shrink-0"
                title="VIP Lifetime Access Pass Active"
              >
                <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400/40 shrink-0" />
                <span>VIP</span>
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase font-semibold ${
                isProfessional
                  ? 'border-amber-400/80 bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 text-amber-300 font-bold tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              {isProfessional && <Sparkles className="w-2.5 h-2.5 text-amber-400 shrink-0" />}
              <span>{isProfessional ? (userPlan === 'vip' ? 'VIP PASS' : userPlan === 'elite' ? 'PROFESSIONAL' : userPlan.toUpperCase()) : 'FREE PREVIEW'}</span>
            </span>
          </div>

          {/* Sync to Naukri Bot Button */}
          <button
            onClick={handleSyncToBot}
            disabled={syncingBot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-950/80 hover:bg-blue-900 border border-blue-600/60 text-blue-200 transition-all cursor-pointer shadow-sm"
            title="Automatically dispatch this ATS resume on automated morning runs"
          >
            {syncingBot ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-blue-300" />
            )}
            <span className="hidden sm:inline">Sync with Auto-Apply Bot</span>
            <span className="sm:hidden">Sync Bot</span>
            {!isProfessional && <Lock className="w-3 h-3 text-blue-400 ml-0.5" />}
          </button>

          {/* Print/Download Button */}
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-zinc-200 text-black transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download ATS PDF</span>
            <span className="sm:hidden">PDF</span>
            {!isProfessional && (
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black text-white ml-0.5">
                PRO
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Sync Status Banner */}
      {syncSuccess && (
        <div className="no-print bg-emerald-950/70 border-b border-emerald-800/60 px-4 py-2 text-xs text-emerald-200 flex items-center justify-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncSuccess}</span>
        </div>
      )}
      {syncError && (
        <div className="no-print bg-red-950/70 border-b border-red-800/60 px-4 py-2 text-xs text-red-200 flex items-center justify-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
          <span>{syncError}</span>
        </div>
      )}

      {/* Mobile Tab Switcher: Editor vs ATS Live Sheet */}
      <div className="no-print lg:hidden flex items-center border-b border-zinc-800 bg-zinc-950 p-1">
        <button
          onClick={() => setMobileView('editor')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            mobileView === 'editor' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Resume Editor & Bullets</span>
        </button>
        <button
          onClick={() => setMobileView('preview')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            mobileView === 'preview' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Live Harvard ATS Sheet</span>
        </button>
      </div>

      {/* Main Spacious 2-Column Split Workspace */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: RESUME CUSTOMIZER & AI BUILDER (Spacious Controls)           */}
        {/* ========================================================================= */}
        <div
          className={`no-print lg:col-span-6 xl:col-span-5 space-y-4 ${
            mobileView === 'preview' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Preset Selector Card */}
          <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Select Harvard/FAANG Standard Template
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-400">
                100% Free to Prepare
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRESET_TEMPLATES.map((p) => {
                const active = selectedPresetId === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-amber-950/40 border-amber-600/70 text-white shadow-sm ring-1 ring-amber-500/40'
                        : 'bg-black border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate text-white">{p.name.split('(')[0]}</div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{p.bracket}</div>
                    <div className="text-[9px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400" />
                      {p.ats_score}% ATS Match
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-x-auto scrollbar-none">
            {[
              { id: 'basics', label: 'Basics & Role', icon: User },
              { id: 'experience', label: 'Work Experience', icon: Briefcase },
              { id: 'skills', label: 'Skills Matrix', icon: Wrench },
              { id: 'education', label: 'Education & Certs', icon: GraduationCap }
            ].map((tab) => {
              const Icon = tab.icon
              const active = activeEditorTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveEditorTab(tab.id as any)}
                  className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    active ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* TAB 1: BASIC INFORMATION */}
          {activeEditorTab === 'basics' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={resumeData.name || ''}
                    onChange={(e) => setResumeData({ ...resumeData, name: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Target Senior Title</label>
                  <input
                    type="text"
                    value={resumeData.role || ''}
                    onChange={(e) => setResumeData({ ...resumeData, role: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={resumeData.email || ''}
                    onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={resumeData.phone || ''}
                    onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Location</label>
                  <input
                    type="text"
                    value={resumeData.location || ''}
                    onChange={(e) => setResumeData({ ...resumeData, location: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">LinkedIn / Portfolio</label>
                <input
                  type="text"
                  value={resumeData.linkedin || ''}
                  onChange={(e) => setResumeData({ ...resumeData, linkedin: e.target.value })}
                  placeholder="linkedin.com/in/username"
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Executive Professional Summary (3-4 Sentences)
                </label>
                <textarea
                  rows={4}
                  value={resumeData.summary || ''}
                  onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 leading-relaxed resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: WORK EXPERIENCE & QUANTIFIED BULLETS */}
          {activeEditorTab === 'experience' && (
            <div className="space-y-4">
              {(resumeData.experience || []).map((exp: any, expIdx: number) => (
                <div key={expIdx} className="p-4 sm:p-5 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Company</label>
                      <input
                        type="text"
                        value={exp.company || ''}
                        onChange={(e) => {
                          const list = [...resumeData.experience]
                          list[expIdx].company = e.target.value
                          setResumeData({ ...resumeData, experience: list })
                        }}
                        className="w-full bg-black border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Role Title</label>
                      <input
                        type="text"
                        value={exp.title || ''}
                        onChange={(e) => {
                          const list = [...resumeData.experience]
                          list[expIdx].title = e.target.value
                          setResumeData({ ...resumeData, experience: list })
                        }}
                        className="w-full bg-black border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Period</label>
                      <input
                        type="text"
                        value={exp.period || ''}
                        onChange={(e) => {
                          const list = [...resumeData.experience]
                          list[expIdx].period = e.target.value
                          setResumeData({ ...resumeData, experience: list })
                        }}
                        className="w-full bg-black border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Location</label>
                      <input
                        type="text"
                        value={exp.location || ''}
                        onChange={(e) => {
                          const list = [...resumeData.experience]
                          list[expIdx].location = e.target.value
                          setResumeData({ ...resumeData, experience: list })
                        }}
                        className="w-full bg-black border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Quantified XYZ Bullets */}
                  <div className="space-y-2 pt-2 border-t border-zinc-900">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold">
                        Google XYZ Formula Bullets (Accomplished [X] as measured by [Y] by doing [Z])
                      </span>
                      <button
                        onClick={() => handleAddMetric(expIdx)}
                        className="text-[10px] font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Bullet</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(exp.metrics || []).map((m: string, mIdx: number) => (
                        <div key={mIdx} className="flex items-start gap-2">
                          <span className="text-zinc-600 text-xs mt-1.5 font-mono">•</span>
                          <textarea
                            rows={2}
                            value={m}
                            onChange={(e) => handleUpdateMetric(expIdx, mIdx, e.target.value)}
                            className="flex-1 bg-black border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 resize-none leading-relaxed"
                          />
                          <button
                            onClick={() => handleDeleteMetric(expIdx, mIdx)}
                            className="p-1.5 rounded text-zinc-600 hover:text-red-400 transition-colors cursor-pointer mt-1"
                            title="Delete bullet"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: TECHNICAL COMPETENCIES */}
          {activeEditorTab === 'skills' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-3.5">
              <div className="text-xs text-zinc-400 leading-relaxed">
                Group your technical competencies clearly. Standard ATS parsers (Workday, Greenhouse, Lever) match keywords against job descriptions using these categories.
              </div>

              {Object.entries(resumeData.skills || {}).map(([cat, sks]: any, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="block text-[11px] font-medium text-zinc-300 font-mono">{cat}</label>
                  <input
                    type="text"
                    value={Array.isArray(sks) ? sks.join(', ') : sks}
                    onChange={(e) => {
                      const updated = { ...resumeData.skills }
                      updated[cat] = e.target.value.split(',').map((s: string) => s.trim())
                      setResumeData({ ...resumeData, skills: updated })
                    }}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
                  />
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: EDUCATION & CREDENTIALS */}
          {activeEditorTab === 'education' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Degrees & Institutions</label>
                <textarea
                  rows={2}
                  value={resumeData.education || ''}
                  onChange={(e) => setResumeData({ ...resumeData, education: e.target.value })}
                  placeholder="e.g. B.Tech in Computer Science & Engineering · IIT Madras"
                  className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Certifications & Honors (Comma-separated)
                </label>
                <textarea
                  rows={3}
                  value={(resumeData.certifications || []).join('\n')}
                  onChange={(e) =>
                    setResumeData({
                      ...resumeData,
                      certifications: e.target.value.split('\n').filter(Boolean)
                    })
                  }
                  placeholder="One certification per line"
                  className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: PRINT-READY LIVE HARVARD ATS SINGLE-COLUMN SHEET            */}
        {/* ========================================================================= */}
        <div
          className={`lg:col-span-6 xl:col-span-7 space-y-3 ${
            mobileView === 'editor' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Header Bar above Preview */}
          <div className="no-print flex items-center justify-between px-2 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">Live Harvard/FAANG Standard Layout</span>
              <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
                · A4 Single-Column (Workday, Greenhouse & Lever 100% Compliant)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer font-medium"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Preview</span>
              </button>
            </div>
          </div>

          {/* Freemium Watermark/Notification Bar if not Professional */}
          {!isProfessional && (
            <div className="no-print p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <span className="font-semibold text-white">Free Candidate Preparation Mode</span>
                  <p className="text-[11px] text-zinc-400">
                    Customize your resume freely. Upgrade to Professional to unlock high-res unwatermarked ATS PDF download and 1-Click Bot Sync.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setUpgradeFeature('Official Harvard ATS PDF & Bot Sync')
                  setShowUpgradeModal(true)
                }}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs shrink-0 cursor-pointer shadow-sm"
              >
                Unlock Pro
              </button>
            </div>
          )}

          {/* Authentic Clean A4 Harvard ATS Sheet */}
          <div
            id="ats-resume-sheet"
            ref={resumeSheetRef}
            className="relative bg-[#ffffff] text-[#000000] p-6 sm:p-10 rounded-2xl shadow-2xl border border-zinc-700 min-h-[900px] font-serif transition-all"
            style={{ fontFamily: "'Times New Roman', Times, Georgia, serif" }}
          >
            {/* Watermark for Free / Trial accounts */}
            {!isProfessional && (
              <div className="no-print absolute top-3 right-4 px-2 py-1 rounded bg-black/5 border border-black/10 text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider">
                JobFlux ATS Sample Preview
              </div>
            )}

            {/* Candidate Header */}
            <div className="text-center mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase mb-1">
                {resumeData.name || 'Candidate Name'}
              </h1>
              <div className="text-xs text-neutral-800 space-x-2 flex flex-wrap justify-center items-center gap-y-1">
                {resumeData.location && <span>{resumeData.location}</span>}
                {resumeData.email && (
                  <>
                    <span>·</span>
                    <span className="font-mono">{resumeData.email}</span>
                  </>
                )}
                {resumeData.phone && (
                  <>
                    <span>·</span>
                    <span className="font-mono">{resumeData.phone}</span>
                  </>
                )}
                {resumeData.linkedin && (
                  <>
                    <span>·</span>
                    <span className="font-mono">{resumeData.linkedin}</span>
                  </>
                )}
              </div>
            </div>

            {/* PROFESSIONAL SUMMARY */}
            {resumeData.summary && (
              <div className="mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5 text-neutral-900">
                  Professional Summary
                </h2>
                <p className="text-xs leading-relaxed text-neutral-800 text-justify">
                  {resumeData.summary}
                </p>
              </div>
            )}

            {/* TECHNICAL COMPETENCIES */}
            {resumeData.skills && Object.keys(resumeData.skills).length > 0 && (
              <div className="mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5 text-neutral-900">
                  Technical Competencies
                </h2>
                <div className="text-xs space-y-1 text-neutral-800">
                  {Object.entries(resumeData.skills).map(([cat, sks]: any, idx) => (
                    <div key={idx} className="leading-snug">
                      <strong className="text-black">{cat}:</strong>{' '}
                      <span>{Array.isArray(sks) ? sks.join(', ') : sks}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PROFESSIONAL EXPERIENCE */}
            {resumeData.experience && resumeData.experience.length > 0 && (
              <div className="mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2 text-neutral-900">
                  Professional Experience
                </h2>
                <div className="space-y-3.5">
                  {resumeData.experience.map((exp: any, idx: number) => (
                    <div key={idx} className="text-xs">
                      <div className="flex justify-between items-baseline font-bold text-black">
                        <span>{exp.company}</span>
                        <span className="font-normal italic text-neutral-700">{exp.location}</span>
                      </div>
                      <div className="flex justify-between items-baseline italic text-neutral-800 mb-1">
                        <span>{exp.title}</span>
                        <span className="font-mono text-[11px] not-italic">{exp.period}</span>
                      </div>
                      <ul className="list-disc list-outside ml-4 space-y-1 text-neutral-800 leading-snug">
                        {(exp.metrics || []).map((m: string, mIdx: number) => (
                          <li key={mIdx}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EDUCATION & CREDENTIALS */}
            {resumeData.education && (
              <div className="mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5 text-neutral-900">
                  Education
                </h2>
                <p className="text-xs text-neutral-800 leading-snug">{resumeData.education}</p>
              </div>
            )}

            {/* CERTIFICATIONS */}
            {Array.isArray(resumeData.certifications) && resumeData.certifications.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5 text-neutral-900">
                  Certifications & Honors
                </h2>
                <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-neutral-800">
                  {resumeData.certifications.map((c: string, idx: number) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Modal for Freemium Gating */}
      <ProfessionalUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureTitle={upgradeFeature}
      />
    </div>
  )
}

