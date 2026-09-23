'use client'

import React, { useEffect, useState } from 'react'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  IndianRupee,
  MapPin,
  Calendar,
  Building2,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Upload,
  Download,
  RefreshCw,
  Shield,
  Ban,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Code2,
  FileText,
  Sliders,
  Check,
  Radio,
  Coffee,
  Zap,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'
import ProfileSaveCelebrationModal from '@/components/ProfileSaveCelebrationModal'

interface CandidateProfileEditorProps {
  userId?: string
  isNew?: boolean
  isAdmin?: boolean
  onSaveSuccess?: () => void
}

interface EmploymentItem {
  company: string
  job_title: string
  start_date?: string
  end_date?: string
  is_current?: boolean
}

export default function CandidateProfileEditor({
  userId = '',
  isNew = false,
  isAdmin = false,
  onSaveSuccess
}: CandidateProfileEditorProps) {
  const [loading, setLoading] = useState<boolean>(true)
  const [newUserId, setNewUserId] = useState<string>('')

  // 1. Candidate Identity & Naukri Credentials
  const [candidateName, setCandidateName] = useState<string>('')
  const [candidatePicture, setCandidatePicture] = useState<string>('')
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false)
  const [photoError, setPhotoError] = useState<string>('')
  const [naukriEmail, setNaukriEmail] = useState<string>('')
  const [naukriPassword, setNaukriPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [currentLocation, setCurrentLocation] = useState<string>('')
  const [currentCompany, setCurrentCompany] = useState<string>('')

  // 2. Experience & Compensation (LPA)
  const [experienceYears, setExperienceYears] = useState<number | string>(0)
  const [currentCtcLpa, setCurrentCtcLpa] = useState<number | string>(0)
  const [expectedCtcLpa, setExpectedCtcLpa] = useState<number | string>(0)

  // 3. Target Job Filters
  const [targetRoles, setTargetRoles] = useState<string[]>([])
  const [newRoleInput, setNewRoleInput] = useState<string>('')

  const [targetLocations, setTargetLocations] = useState<string[]>([])
  const [newLocationInput, setNewLocationInput] = useState<string>('')

  const [skills, setSkills] = useState<string[]>([])
  const [newSkillInput, setNewSkillInput] = useState<string>('')

  const [mustHaveKeywords, setMustHaveKeywords] = useState<string[]>([])
  const [newMustHaveInput, setNewMustHaveInput] = useState<string>('')

  // 4. Screening Answers (predefined_answers)
  const [noticePeriod, setNoticePeriod] = useState<string>('Immediate / 15 Days')
  const [willingToRelocate, setWillingToRelocate] = useState<string>('Yes')
  const [careerBreak, setCareerBreak] = useState<string>('No')
  const [activeBacklogs, setActiveBacklogs] = useState<string>('No')
  const [preferredLocation, setPreferredLocation] = useState<string>('')
  const [customQaList, setCustomQaList] = useState<Array<{ key: string; val: string }>>([])
  const [newQaKey, setNewQaKey] = useState<string>('')
  const [newQaVal, setNewQaVal] = useState<string>('')

  // 5. Employment History (Enforcing strictly ONE current employer)
  const [employmentHistory, setEmploymentHistory] = useState<EmploymentItem[]>([])
  const [newEmpCompany, setNewEmpCompany] = useState<string>('')
  const [newEmpTitle, setNewEmpTitle] = useState<string>('')
  const [newEmpStart, setNewEmpStart] = useState<string>('')
  const [newEmpEnd, setNewEmpEnd] = useState<string>('Present')
  const [newEmpCurrent, setNewEmpCurrent] = useState<boolean>(true)
  const [showAddEmpForm, setShowAddEmpForm] = useState<boolean>(false)

  // 6. Company Blacklist
  const [avoidCompanies, setAvoidCompanies] = useState<string[]>([])
  const [newBlacklistCompany, setNewBlacklistCompany] = useState<string>('')

  // 7. Bot Automation Settings
  const [enabledForDailyRun, setEnabledForDailyRun] = useState<boolean>(true)
  const [dailyApplicationLimit, setDailyApplicationLimit] = useState<number>(50)
  const [searchUrl, setSearchUrl] = useState<string>('https://www.naukri.com/mnjuser/recommendedjobs')

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Resume state
  const [uploadingResume, setUploadingResume] = useState<boolean>(false)
  const [resumeFilename, setResumeFilename] = useState<string>('')
  const [resumeVersion, setResumeVersion] = useState<number>(Date.now())
  const [resumeSuccess, setResumeSuccess] = useState<string>('')
  const [resumeError, setResumeError] = useState<string>('')

  // AI State
  const [showAiPrompt, setShowAiPrompt] = useState<boolean>(false)
  const [aiPrompt, setAiPrompt] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)

  // Save / status state
  const [savingProfile, setSavingProfile] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<string>('')
  const [saveError, setSaveError] = useState<string>('')
  const [showCelebrationModal, setShowCelebrationModal] = useState<boolean>(false)
  const [hasResumeUploaded, setHasResumeUploaded] = useState<boolean>(false)

  // Advanced Raw JSON View
  const [showRawJson, setShowRawJson] = useState<boolean>(false)
  const [activeStep, setActiveStep] = useState<number>(0)

  // Guided setup steps (one section visible at a time — clean & simple)
  const STEPS = [
    { title: 'Resume', hint: 'Step 1 of 7 — Upload your resume PDF; AI extracts details and attaches it to applications.' },
    { title: 'Account', hint: 'Step 2 of 7 — Your identity and Naukri login for automated applying.' },
    { title: 'Experience & Pay', hint: 'Step 3 of 7 — Tenure, current company and CTC figures recruiters ask for.' },
    { title: 'Job Preferences', hint: 'Step 4 of 7 — Roles, locations and skills the bot hunts for.' },
    { title: 'Screening Answers', hint: 'Step 5 of 7 — How the bot answers recruiter screening questions as you.' },
    { title: 'Work History', hint: 'Step 6 of 7 — Employers plus companies to never apply to.' },
    { title: 'Review & Launch', hint: 'Step 7 of 7 — Automation controls, then save to go live.' }
  ]
  const stepDone = [
    hasResumeUploaded,
    Boolean(naukriEmail && naukriPassword),
    Boolean(currentCompany && Number(currentCtcLpa) > 0),
    targetRoles.length > 0,
    false, false, false
  ]
  const goStep = (i: number) => {
    setActiveStep(Math.max(0, Math.min(STEPS.length - 1, i)))
    const el = document.getElementById('profile-form-top')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const stepForErrors = (e: Record<string, string>): number => {
    if (e.newUserId || e.name || e.email || e.password || e.location) return 1
    if (e.company || e.experience || e.currentCtc || e.expectedCtc) return 2
    if (e.targetRoles || e.targetLocations || e.skills) return 3
    if (e.employment) return 5
    return 1
  }
  const [rawJsonStr, setRawJsonStr] = useState<string>('{\n}')
  const [jsonError, setJsonError] = useState<string>('')

  const effectiveUserId = isNew ? newUserId : userId

  // Curated presets for Indian tech market
  const POPULAR_ROLE_PRESETS = [
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'React Developer',
    'Python Developer',
    'Node.js Developer',
    'Java Developer',
    'DevOps Engineer',
    'QA Automation Engineer',
    'Data Engineer'
  ]

  // Curated Indian mass consultancy & IT services presets
  const MASS_CONSULTANCY_PRESETS = [
    'TCS',
    'Infosys',
    'Wipro',
    'Cognizant',
    'Accenture',
    'Capgemini',
    'HCLTech',
    'Tech Mahindra',
    'LTIMindtree',
    'Genpact',
    'IBM India',
    'Deloitte USI',
    'EY GDS',
    'PwC SDC',
    'KPMG India'
  ]

  const POPULAR_LOCATION_PRESETS = [
    'Bangalore',
    'Hyderabad',
    'Pune',
    'Mumbai',
    'Delhi / NCR',
    'Chennai',
    'Remote',
    'Hybrid'
  ]

  // Clear single validation error
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  // Format CTC value to Indian Rupees display format
  const formatLpaDisplay = (val: number | string): string => {
    const num = Number(val) || 0
    if (num <= 0) return '₹ 0 / year'
    const inRupees = num < 1000 ? Math.round(num * 100000) : Math.round(num)
    return `₹ ${inRupees.toLocaleString('en-IN')} / year`
  }

  // Populate visual state from a loaded profile document object (supports smart merge)
  const populateStateFromObject = (data: any, isMerge: boolean = false) => {
    if (data.name || !isMerge) setCandidateName(data.name || '')
    if (data.email || !isMerge) setNaukriEmail(data.email || '')
    if (data.password || !isMerge) setNaukriPassword(data.password || '')
    if (data.current_location || !isMerge) setCurrentLocation(data.current_location || '')
    if (data.current_company || !isMerge) setCurrentCompany(data.current_company || '')

    // Experience
    if (data.experience !== undefined && data.experience !== null && !isNaN(Number(data.experience))) {
      setExperienceYears(Number(data.experience))
    } else if (!isMerge) {
      setExperienceYears(0)
    }

    // CTC: convert rupees to LPA if >= 1000
    if (data.current_ctc !== undefined && data.current_ctc !== null && Number(data.current_ctc) > 0) {
      const num = Number(data.current_ctc)
      setCurrentCtcLpa(num >= 1000 ? +(num / 100000).toFixed(2) : num)
    } else if (!isMerge) {
      setCurrentCtcLpa(0)
    }
    if (data.expected_ctc !== undefined && data.expected_ctc !== null && Number(data.expected_ctc) > 0) {
      const num = Number(data.expected_ctc)
      setExpectedCtcLpa(num >= 1000 ? +(num / 100000).toFixed(2) : num)
    } else if (!isMerge) {
      setExpectedCtcLpa(0)
    }

    // Job Filters
    const filters = data.job_filters || {}
    const newRoles = Array.isArray(filters.roles) ? filters.roles : []
    if (isMerge && newRoles.length > 0) {
      setTargetRoles(prev => Array.from(new Set([...prev, ...newRoles])))
    } else if (!isMerge) {
      setTargetRoles(newRoles)
    }

    const newLocs = Array.isArray(filters.location) ? filters.location : (Array.isArray(data.location) ? data.location : [])
    if (isMerge && newLocs.length > 0) {
      setTargetLocations(prev => Array.from(new Set([...prev, ...newLocs])))
    } else if (!isMerge) {
      setTargetLocations(newLocs)
    }

    const incomingSkills = Array.isArray(data.skills) ? data.skills : (Array.isArray(filters.keywords) ? filters.keywords : [])
    if (isMerge && incomingSkills.length > 0) {
      setSkills(prev => {
        const seen = new Set(prev.map(s => s.toLowerCase()))
        const merged = [...prev]
        for (const s of incomingSkills) {
          const trimmed = String(s || '').trim()
          if (trimmed && !seen.has(trimmed.toLowerCase())) {
            seen.add(trimmed.toLowerCase())
            merged.push(trimmed)
          }
        }
        return merged
      })
    } else if (!isMerge) {
      setSkills(incomingSkills)
    }

    if (Array.isArray(filters.must_have_keywords) && filters.must_have_keywords.length > 0) {
      setMustHaveKeywords(prev => isMerge ? Array.from(new Set([...prev, ...filters.must_have_keywords])) : filters.must_have_keywords)
    } else if (!isMerge) {
      setMustHaveKeywords([])
    }
    
    // Avoid companies
    const avoid = Array.isArray(filters.avoid_companies)
      ? filters.avoid_companies
      : (Array.isArray(data.avoid_companies) ? data.avoid_companies : [])
    if (isMerge && avoid.length > 0) {
      setAvoidCompanies(prev => Array.from(new Set([...prev, ...avoid])))
    } else if (!isMerge) {
      setAvoidCompanies(avoid)
    }

    // Employment History: ENFORCE EXACTLY AT MOST 1 CURRENT EMPLOYER
    if (Array.isArray(data.employment_history) && data.employment_history.length > 0) {
      let foundCurrent = false
      const normalizedHistory = data.employment_history.map((job: any) => {
        const isEndPresent = ['present', 'current', 'ongoing', 'now'].includes(String(job.end_date || '').trim().toLowerCase())
        if (!foundCurrent && (job.is_current || isEndPresent)) {
          foundCurrent = true
          return { ...job, is_current: true, end_date: 'Present' }
        }
        return { ...job, is_current: false }
      })
      // If none marked present but current_company exists, match and mark it
      if (!foundCurrent && data.current_company) {
        const idx = normalizedHistory.findIndex((j: any) => j.company?.toLowerCase() === data.current_company?.toLowerCase())
        if (idx !== -1) {
          normalizedHistory[idx].is_current = true
          normalizedHistory[idx].end_date = 'Present'
        }
      }
      setEmploymentHistory(normalizedHistory)
    }

    // Predefined answers
    const predefined = data.predefined_answers || {}
    let notice = 'Immediate / 15 Days'
    let relocate = 'Yes'
    let breakAnswer = 'No'
    let backlogAnswer = 'No'
    let prefLoc = ''
    const customList: Array<{ key: string; val: string }> = []

    Object.entries(predefined).forEach(([k, v]) => {
      const kl = k.toLowerCase()
      const valStr = String(v)
      if (kl.includes('notice period')) {
        notice = valStr
      } else if (kl.includes('relocate')) {
        relocate = valStr
      } else if (kl.includes('career break')) {
        breakAnswer = valStr
      } else if (kl.includes('backlog')) {
        backlogAnswer = valStr
      } else if (kl.includes('preferred location')) {
        prefLoc = valStr
      } else if (!kl.includes('current company') && !kl.includes('experience') && !kl.includes('current location')) {
        customList.push({ key: k, val: valStr })
      }
    })

    if (notice || !isMerge) setNoticePeriod(notice)
    if (relocate || !isMerge) setWillingToRelocate(relocate)
    if (breakAnswer || !isMerge) setCareerBreak(breakAnswer)
    if (backlogAnswer || !isMerge) setActiveBacklogs(backlogAnswer)
    if (prefLoc || !isMerge) setPreferredLocation(prefLoc)
    if (customList.length > 0 || !isMerge) setCustomQaList(customList)

    // Picture
    if (data.picture) {
      setCandidatePicture(data.picture)
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_picture', data.picture)
      }
    }

    // Daily run & search url
    setEnabledForDailyRun(data.enabled_for_daily_run !== false)
    setDailyApplicationLimit(data.daily_application_limit ? Math.min(150, Math.max(1, Number(data.daily_application_limit))) : (data.plan === 'elite' || data.is_vip ? 150 : 50))
    setSearchUrl(data.search_url || 'https://www.naukri.com/mnjuser/recommendedjobs')

    // Raw JSON stringification
    setRawJsonStr(JSON.stringify(data, null, 2))
  }

  // Construct current profile object from state
  const buildCurrentProfileObject = () => {
    const ctcCurrentNum = Number(currentCtcLpa) >= 1000
      ? Number(currentCtcLpa)
      : Math.round((Number(currentCtcLpa) || 0) * 100000)

    const ctcExpectedNum = Number(expectedCtcLpa) >= 1000
      ? Number(expectedCtcLpa)
      : Math.round((Number(expectedCtcLpa) || 0) * 100000)

    const predefinedMap: Record<string, string> = {
      'What is your notice period?': noticePeriod,
      'Are you on a career break?': careerBreak,
      'Are you willing to relocate to Bangalore?': willingToRelocate,
      'Current Company (payroll)?': currentCompany,
      'Total years of experience?': String(experienceYears),
      'Current location?': currentLocation,
      'Preferred location?': preferredLocation || currentLocation,
      'Any active backlogs?': activeBacklogs
    }

    customQaList.forEach(item => {
      if (item.key.trim()) {
        predefinedMap[item.key.trim()] = item.val.trim()
      }
    })

    return {
      user_id: effectiveUserId,
      name: candidateName,
      picture: candidatePicture || '',
      email: naukriEmail,
      password: naukriPassword,
      current_location: currentLocation,
      current_company: currentCompany,
      experience: Number(experienceYears) || 0,
      current_ctc: ctcCurrentNum,
      expected_ctc: ctcExpectedNum,
      search_url: searchUrl,
      enabled_for_daily_run: enabledForDailyRun,
      // NOTE: daily_application_limit is intentionally NOT sent — it is fixed
      // by plan (55/day) and only admins may change it (server enforces this).
      skills: skills,
      job_filters: {
        roles: targetRoles,
        location: targetLocations,
        keywords: skills,
        must_have_keywords: mustHaveKeywords,
        avoid_companies: avoidCompanies
      },
      predefined_answers: predefinedMap,
      employment_history: employmentHistory,
      resume_filename: resumeFilename || (effectiveUserId ? `${effectiveUserId}_Resume.pdf` : 'Resume.pdf')
    }
  }

  // Keep rawJsonStr in sync whenever visual fields change
  useEffect(() => {
    if (!loading) {
      try {
        const obj = buildCurrentProfileObject()
        setRawJsonStr(JSON.stringify(obj, null, 2))
      } catch {}
    }
  }, [
    candidateName,
    candidatePicture,
    naukriEmail,
    naukriPassword,
    currentLocation,
    currentCompany,
    experienceYears,
    currentCtcLpa,
    expectedCtcLpa,
    targetRoles,
    targetLocations,
    skills,
    mustHaveKeywords,
    avoidCompanies,
    noticePeriod,
    willingToRelocate,
    careerBreak,
    activeBacklogs,
    preferredLocation,
    customQaList,
    employmentHistory,
    enabledForDailyRun,
    dailyApplicationLimit,
    searchUrl,
    resumeFilename,
    loading
  ])

  useEffect(() => {
    if (isNew) {
      setLoading(false)
      populateStateFromObject({
        name: '',
        email: '',
        password: '',
        experience: 5,
        current_ctc: 1200000,
        expected_ctc: 1800000,
        current_company: '',
        current_location: 'Bangalore',
        skills: ['Python', 'Selenium', 'Automation Testing'],
        job_filters: {
          roles: ['Senior QA Engineer', 'Automation Test Engineer'],
          location: ['Bangalore', 'Remote'],
          keywords: ['Python', 'Selenium'],
          must_have_keywords: ['Automation'],
          avoid_companies: []
        },
        predefined_answers: {
          'What is your notice period?': 'Immediate / 15 Days',
          'Are you on a career break?': 'No',
          'Are you willing to relocate to Bangalore?': 'Yes',
          'Any active backlogs?': 'No'
        },
        employment_history: []
      })
    } else if (userId) {
      loadProfileData(userId)
    }
  }, [userId, isNew])

  const loadProfileData = async (uid: string) => {
    setLoading(true)
    setSaveSuccess('')
    setSaveError('')
    setResumeSuccess('')
    setResumeError('')

    try {
      const res = await fetch(`/api/profile?user_id=${encodeURIComponent(uid)}&t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        setResumeFilename(data.resume_filename || `${uid}_Resume.pdf`)
        setResumeVersion(Date.now())
        setHasResumeUploaded(Boolean(data.has_resume || data.last_resume_updated_at || (data.resume_filename && !data.resume_filename.includes('_Resume.pdf') && data.resume_filename !== 'Candidate_Resume.pdf')))
        populateStateFromObject(data)
      } else {
        if (res.status === 401 || res.status === 403) {
          // No (or expired) session — localStorage alone no longer authenticates.
          // Send them to re-login instead of showing a cryptic error.
          window.location.href = '/login?error=' + encodeURIComponent('Session expired. Please sign in again.')
          return
        }
        const err = await res.json().catch(() => ({}))
        setSaveError(err.detail || 'Failed to load profile.')
      }
    } catch (e: any) {
      setSaveError(`Failed to load candidate profile: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Comprehensive Data Validation Engine
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {}

    // 1. Candidate ID (New Only)
    if (isNew && !newUserId.trim()) {
      errs.newUserId = 'Candidate Unique ID is required.'
    }

    // 2. Name
    if (!candidateName.trim()) {
      errs.name = 'Full name is required.'
    } else if (candidateName.trim().length < 2) {
      errs.name = 'Full name must be at least 2 characters.'
    }

    // 3. Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!naukriEmail.trim()) {
      errs.email = 'Naukri login email is required for the bot.'
    } else if (!emailRegex.test(naukriEmail.trim())) {
      errs.email = 'Please enter a valid email format (e.g. name@gmail.com).'
    }

    // 4. Password
    if (!naukriPassword.trim()) {
      errs.password = 'Naukri login password is required for headless automation.'
    } else if (naukriPassword.length < 4) {
      errs.password = 'Password must be at least 4 characters.'
    }

    // 5. Current Base Location
    if (!currentLocation.trim()) {
      errs.location = 'Current base location is required (e.g. Bangalore).'
    }

    // 6. Current Company
    if (!currentCompany.trim()) {
      errs.company = 'Current company name is required.'
    }

    // 7. Experience
    const expNum = Number(experienceYears)
    if (isNaN(expNum) || expNum < 0) {
      errs.experience = 'Experience must be a positive number.'
    } else if (expNum > 45) {
      errs.experience = 'Experience cannot exceed 45 years.'
    }

    // 8. Compensation (CTC)
    const curCtc = Number(currentCtcLpa)
    const expCtc = Number(expectedCtcLpa)
    if (isNaN(curCtc) || curCtc <= 0) {
      errs.currentCtc = 'Please enter your current CTC in LPA (e.g. 15 for 15 LPA).'
    }
    if (isNaN(expCtc) || expCtc <= 0) {
      errs.expectedCtc = 'Please enter your expected CTC in LPA (e.g. 20 for 20 LPA).'
    } else if (curCtc > 0 && expCtc > 0 && expCtc < curCtc * 0.5) {
      errs.expectedCtc = 'Expected CTC is unusually lower than Current CTC. Please verify.'
    }

    // 9. Target Roles (Critical for Naukri search)
    if (targetRoles.length === 0) {
      errs.targetRoles = 'Please add at least 1 Target Job Title/Role (e.g. "Senior QA Engineer").'
    }

    // 10. Preferred Locations
    if (targetLocations.length === 0) {
      errs.targetLocations = 'Please add at least 1 Preferred Location (e.g. "Bangalore" or "Remote").'
    }

    // 11. Skills & Tech Stack
    if (skills.length === 0) {
      errs.skills = 'Please add at least 1 Technical Skill or Keyword (e.g. "Python", "Selenium").'
    }

    // 12. Employment History: Strictly at most 1 current employer
    const currentCount = employmentHistory.filter(e => e.is_current).length
    if (currentCount > 1) {
      errs.employment = `You currently have ${currentCount} employers marked as current. Exactly 1 current employer is allowed.`
    }

    setErrors(errs)

    if (Object.keys(errs).length > 0) {
      const firstKey = Object.keys(errs)[0]
      setSaveError(errs[firstKey])
      // Jump straight to the step containing the first problem
      goStep(stepForErrors(errs))
      return false
    }

    setSaveError('')
    return true
  }

  // Save Profile Handler with Comprehensive Validation
  const handleSaveProfile = async () => {
    setSavingProfile(true)
    setSaveSuccess('')
    setSaveError('')

    const isValid = validateForm()
    if (!isValid) {
      setSavingProfile(false)
      return
    }

    try {
      const payload = buildCurrentProfileObject()
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          raw_json: JSON.stringify(payload, null, 2)
        })
      })

      if (res.ok) {
        setSaveSuccess('Profile saved successfully and synced with the JobFlux Bot!')
        setErrors({})
        setShowCelebrationModal(true)
        if (!isNew && userId) loadProfileData(userId)
        if (onSaveSuccess) onSaveSuccess()
        setTimeout(() => setSaveSuccess(''), 5000)
      } else if (res.status === 401 || res.status === 403) {
        window.location.href = '/login?error=' + encodeURIComponent('Session expired. Please sign in again, then retry saving.')
      } else {
        const data = await res.json()
        setSaveError(data.detail || 'Failed to save profile.')
      }
    } catch (e: any) {
      setSaveError(`Failed to save: ${e.message}`)
    } finally {
      setSavingProfile(false)
    }
  }

  // AI Auto-Fill Handler with Strict Invariant Enforcement & Timeout Protection
  const handleAiAutoFill = async () => {
    if (isNew && !newUserId.trim()) {
      setSaveError('Candidate Unique ID is required before running AI Auto-Fill.')
      return
    }

    setIsAnalyzing(true)
    setSaveError('')
    setSaveSuccess('')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)

    try {
      const res = await fetch('/api/profile/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: effectiveUserId,
          custom_prompt: aiPrompt
        }),
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (res.ok) {
        const result = await res.json()
        const aiData = result.data || {}

        // Preserve current password and custom edits if AI didn't provide
        if (!aiData.password && naukriPassword) {
          aiData.password = naukriPassword
        }

        // ENFORCE SINGLE CURRENT EMPLOYER INVARIANT ON AI EXTRACTION
        let aiHistory: EmploymentItem[] = Array.isArray(aiData.employment_history) ? aiData.employment_history : []
        let foundCurrent = false
        aiHistory = aiHistory.map((job: any) => {
          const isEndPresent = ['present', 'current', 'ongoing', 'now'].includes(String(job.end_date || '').trim().toLowerCase())
          if (!foundCurrent && (job.is_current || isEndPresent)) {
            foundCurrent = true
            return { ...job, is_current: true, end_date: 'Present' }
          }
          return { ...job, is_current: false }
        })

        if (!foundCurrent && aiHistory.length > 0) {
          const matchIdx = aiHistory.findIndex((j: any) => j.company?.toLowerCase() === (aiData.current_company || '').toLowerCase())
          if (matchIdx !== -1) {
            aiHistory[matchIdx].is_current = true
            aiHistory[matchIdx].end_date = 'Present'
          } else {
            aiHistory[0].is_current = true
            aiHistory[0].end_date = 'Present'
          }
        }
        aiData.employment_history = aiHistory

        // Sync current company with that single employer
        const currentJob = aiHistory.find(j => j.is_current)
        if (currentJob?.company) {
          aiData.current_company = currentJob.company
          // Automatically add current company to blacklist if not already there
          if (!Array.isArray(aiData.job_filters?.avoid_companies)) {
            aiData.job_filters = { ...(aiData.job_filters || {}), avoid_companies: [] }
          }
          if (!aiData.job_filters.avoid_companies.some((c: string) => c.toLowerCase() === currentJob.company.toLowerCase())) {
            aiData.job_filters.avoid_companies.push(currentJob.company)
          }
        }

        // Smart merge into state to protect existing fields
        populateStateFromObject(aiData, true)
        setErrors({})
        setShowAiPrompt(false)
        setAiPrompt('')
        setSaveSuccess('✨ AI successfully analyzed your resume and updated your profile! All fields synced.')
        if (onSaveSuccess) onSaveSuccess()
        setTimeout(() => setSaveSuccess(''), 7000)
      } else {
        let errMessage = 'Failed to analyze resume with AI.'
        try {
          const err = await res.json()
          errMessage = err.detail || err.error || err.message || errMessage
        } catch {}
        setSaveError(errMessage)
      }
    } catch (e: any) {
      clearTimeout(timeoutId)
      if (e.name === 'AbortError') {
        setSaveError('AI extraction took longer than 25 seconds and timed out. Please try again or fill in the details manually.')
      } else {
        setSaveError(`AI analysis failed: ${e.message}`)
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Resume Upload Handler
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file.')
      e.target.value = ''
      return
    }

    if (isNew && !newUserId.trim()) {
      alert('Please enter a Candidate Unique ID before uploading a resume.')
      e.target.value = ''
      return
    }

    setUploadingResume(true)
    setResumeSuccess('')
    setResumeError('')

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64Str = (reader.result as string).split(',')[1]
        const cleanName = file.name.trim()

        const res = await fetch('/api/profile/resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: effectiveUserId,
            filename: cleanName,
            file_base64: base64Str,
            file_size_bytes: file.size
          })
        })

        if (res.ok) {
          const data = await res.json()
          setResumeFilename(data.filename)
          setResumeVersion(data.timestamp || Date.now())
          setHasResumeUploaded(true)
          setResumeSuccess(`Resume "${data.filename}" saved to JobFlux Cloud! Tap "Auto-Fill with AI" to extract your details.`)
          setTimeout(() => setResumeSuccess(''), 6000)

          if (!isNew && userId) loadProfileData(userId)
          if (onSaveSuccess) onSaveSuccess()
        } else {
          const err = await res.json().catch(() => ({}))
          setResumeError(err.detail || 'Failed to upload resume.')
          setTimeout(() => setResumeError(''), 5000)
        }
        setUploadingResume(false)
        e.target.value = ''
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      setResumeError(`Error reading file: ${err.message}`)
      setUploadingResume(false)
      e.target.value = ''
    }
  }

  // Profile Photo Upload Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image size must be under 5MB.')
      return
    }
    setUploadingPhoto(true)
    setPhotoError('')

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64DataUrl = reader.result as string
        setCandidatePicture(base64DataUrl)
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_picture', base64DataUrl)
        }
        // Sync to MongoDB backend
        try {
          await fetch('/api/profile/picture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: effectiveUserId,
              picture: base64DataUrl
            })
          })
        } catch (err) {
          console.warn('Cloud picture sync error:', err)
        }
        setUploadingPhoto(false)
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      setPhotoError('Failed to read image file.')
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = async () => {
    setCandidatePicture('')
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_picture')
    }
    await fetch(`/api/profile/picture?user_id=${encodeURIComponent(effectiveUserId)}`, {
      method: 'DELETE'
    }).catch(() => {})
  }

  // Tag helper functions
  const addTag = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    input: string,
    setInput: React.Dispatch<React.SetStateAction<string>>,
    fieldKey?: string
  ) => {
    const trimmed = input.trim()
    if (!trimmed) return
    if (!list.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      setList([...list, trimmed])
      if (fieldKey) clearError(fieldKey)
    }
    setInput('')
  }

  const removeTag = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    toRemove: string
  ) => {
    setList(list.filter(item => item.toLowerCase() !== toRemove.toLowerCase()))
  }

  // Blacklist helper functions
  const handleToggleBlacklist = (company: string) => {
    const exists = avoidCompanies.some(c => c.toLowerCase() === company.toLowerCase())
    if (exists) {
      setAvoidCompanies(avoidCompanies.filter(c => c.toLowerCase() !== company.toLowerCase()))
    } else {
      setAvoidCompanies([...avoidCompanies, company])
    }
  }

  const handleExcludeAllMassConsultancies = () => {
    const topMass = ['TCS', 'Infosys', 'Wipro', 'Cognizant', 'Accenture', 'Capgemini', 'HCLTech', 'Tech Mahindra']
    const merged = [...avoidCompanies]
    topMass.forEach(c => {
      if (!merged.some(existing => existing.toLowerCase() === c.toLowerCase())) {
        merged.push(c)
      }
    })
    setAvoidCompanies(merged)
  }

  const handleAddCustomBlacklist = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newBlacklistCompany.trim()
    if (!trimmed) return
    if (!avoidCompanies.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setAvoidCompanies([...avoidCompanies, trimmed])
    }
    setNewBlacklistCompany('')
  }

  // Custom Q&A helpers
  const handleAddCustomQa = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newQaKey.trim() || !newQaVal.trim()) return
    setCustomQaList([...customQaList, { key: newQaKey.trim(), val: newQaVal.trim() }])
    setNewQaKey('')
    setNewQaVal('')
  }

  const handleRemoveCustomQa = (idx: number) => {
    setCustomQaList(customQaList.filter((_, i) => i !== idx))
  }

  // -------------------------------------------------------------
  // SINGLE CURRENT EMPLOYER LOGIC ENGINE
  // -------------------------------------------------------------

  // Mark an employer as the ONE AND ONLY current employer
  const handleSetSingleCurrentEmployer = (index: number) => {
    const targetComp = employmentHistory[index]?.company || ''
    const updated = employmentHistory.map((emp, i) => {
      if (i === index) {
        return {
          ...emp,
          is_current: true,
          end_date: 'Present'
        }
      }
      return {
        ...emp,
        is_current: false,
        end_date: emp.end_date === 'Present' ? '' : emp.end_date
      }
    })
    setEmploymentHistory(updated)

    if (targetComp) {
      setCurrentCompany(targetComp)
      clearError('company')
      // Auto-add to avoidCompanies to protect candidate
      if (!avoidCompanies.some(c => c.toLowerCase() === targetComp.toLowerCase())) {
        setAvoidCompanies(prev => [...prev, targetComp])
      }
    }
    clearError('employment')
  }

  // Unmark a current employer
  const handleUnsetCurrentEmployer = (index: number) => {
    const updated = employmentHistory.map((emp, i) => {
      if (i === index) {
        return { ...emp, is_current: false, end_date: '' }
      }
      return emp
    })
    setEmploymentHistory(updated)
  }

  // When user types in Current Company at top, keep current employer synchronized
  const handleCurrentCompanyInputChange = (val: string) => {
    setCurrentCompany(val)
    clearError('company')

    // If an employer is marked as current, sync its name
    if (employmentHistory.some(e => e.is_current)) {
      setEmploymentHistory(prev => prev.map(emp => emp.is_current ? { ...emp, company: val } : emp))
    }
  }

  // Add Employer Form Submission (Enforcing Single Current Rule)
  const handleAddEmployment = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const comp = newEmpCompany.trim()
    const title = newEmpTitle.trim()
    if (!comp || !title) return

    let updatedList = [...employmentHistory]

    if (newEmpCurrent) {
      // Set all existing employers to is_current: false
      updatedList = updatedList.map(emp => ({
        ...emp,
        is_current: false,
        end_date: emp.end_date === 'Present' ? '' : emp.end_date
      }))
      setCurrentCompany(comp)
      clearError('company')

      // Auto-add to blacklist
      if (!avoidCompanies.some(c => c.toLowerCase() === comp.toLowerCase())) {
        setAvoidCompanies(prev => [...prev, comp])
      }
    }

    const newItem: EmploymentItem = {
      company: comp,
      job_title: title,
      start_date: newEmpStart.trim() || undefined,
      end_date: newEmpCurrent ? 'Present' : (newEmpEnd.trim() || undefined),
      is_current: newEmpCurrent
    }

    setEmploymentHistory([newItem, ...updatedList])
    setNewEmpCompany('')
    setNewEmpTitle('')
    setNewEmpStart('')
    setNewEmpEnd('Present')
    setNewEmpCurrent(false)
    setShowAddEmpForm(false)
    clearError('employment')
  }

  const handleRemoveEmployment = (index: number) => {
    setEmploymentHistory(employmentHistory.filter((_, i) => i !== index))
  }

  // Raw JSON edit synchronization
  const handleRawJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setRawJsonStr(val)
    try {
      const parsed = JSON.parse(val)
      setJsonError('')
      populateStateFromObject(parsed)
    } catch (err: any) {
      setJsonError(`JSON Syntax Error: ${err.message}`)
    }
  }

  // Count current employers
  const currentEmployersCount = employmentHistory.filter(e => e.is_current).length

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-400 light:text-zinc-600">
        <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-3 text-zinc-300 light:text-zinc-700" />
        <p className="text-xs font-medium">Loading candidate profile...</p>
      </div>
    )
  }

  return (
    <div id="profile-form-top" className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 light:border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white light:text-zinc-900 tracking-wide">
              Candidate Profile & Automation Settings
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600">
              Bot Sync Active
            </span>
          </div>
          <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
            Configure your Naukri credentials, compensation, target roles, and work history. The AI Bot uses these settings to scout and apply.
          </p>
        </div>

        {/* Global Save Button in Header */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile || isAnalyzing}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            {savingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savingProfile ? 'Saving...' : 'Save Profile & Sync'}</span>
          </button>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-zinc-900 light:bg-zinc-100 border border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800 text-xs flex items-center gap-2.5 font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-zinc-300 light:text-zinc-700 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-xl bg-zinc-900/90 light:bg-zinc-100 border border-rose-500/40 light:border-rose-300 text-rose-300 light:text-rose-600 text-xs flex items-center gap-2.5 font-medium animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 light:text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* NEW CANDIDATE ID INPUT (Admin / Creation Mode Only) */}
      {isNew && (
        <div className="p-4 rounded-xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 space-y-2">
          <label className="block text-xs font-semibold text-zinc-300 light:text-zinc-700 uppercase tracking-wider">
            Candidate Unique ID <span className="text-rose-400 light:text-rose-600">*</span>
          </label>
          <input
            type="text"
            value={newUserId}
            onChange={e => {
              setNewUserId(e.target.value)
              clearError('newUserId')
            }}
            required
            placeholder="e.g. candidate4_john_doe (no spaces, use underscores)"
            className={`w-full bg-black light:bg-white border rounded-lg px-3 py-2 text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none font-mono text-xs ${
              errors.newUserId ? 'border-rose-500/80 focus:border-rose-500' : 'border-zinc-800 light:border-zinc-200 focus:border-zinc-500'
            }`}
          />
          {errors.newUserId && (
            <span className="text-[11px] text-rose-400 light:text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.newUserId}
            </span>
          )}
        </div>
      )}

      {/* GUIDED SETUP STEPPER — one step at a time */}
      <div className="p-3 sm:p-4 rounded-2xl bg-zinc-950/70 light:bg-white border border-zinc-800/80 light:border-zinc-200">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const done = stepDone[i]
            const current = i === activeStep
            return (
              <button
                key={s.title}
                type="button"
                onClick={() => goStep(i)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                  current
                    ? 'bg-cyan-500/15 border-cyan-500/40 light:border-cyan-300 text-white light:text-zinc-900'
                    : 'text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 border-transparent hover:bg-zinc-900 light:hover:bg-zinc-100'
                }`}
              >
                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  done ? 'bg-emerald-500/20 text-emerald-300 light:text-emerald-700' : current ? 'bg-cyan-500 text-black light:text-white' : 'bg-zinc-800 light:bg-zinc-200 text-zinc-400 light:text-zinc-600'
                }`}>
                  {done ? <Check className="w-3 h-3" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-zinc-500 light:text-zinc-600 mt-1.5">{STEPS[activeStep].hint}</p>
      </div>

      {/* SMART MISSING DATA SUGGESTIONS CALLOUT */}
      {(!hasResumeUploaded || !naukriEmail || !naukriPassword || targetRoles.length === 0) && (
        <div className="p-4 rounded-xl bg-zinc-900/60 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-zinc-200 light:text-zinc-800 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-zinc-400 light:text-zinc-600" />
            <span>Profile Incomplete — Checklist to activate autonomous job application:</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-zinc-400 light:text-zinc-600">
            {!hasResumeUploaded && (
              <li onClick={() => goStep(0)} className="p-2.5 rounded-lg bg-black/50 light:bg-white/85 border border-zinc-800 light:border-zinc-200 hover:border-cyan-500/50 flex items-start gap-2 cursor-pointer transition-colors">
                <span className="text-zinc-300 light:text-zinc-700 font-bold shrink-0">1.</span>
                <span>Upload your <strong className="text-white light:text-zinc-900">Resume PDF</strong> below so AI can extract details and attach to applications.</span>
              </li>
            )}
            {(!naukriEmail || !naukriPassword) && (
              <li onClick={() => goStep(1)} className="p-2.5 rounded-lg bg-black/50 light:bg-white/85 border border-zinc-800 light:border-zinc-200 hover:border-cyan-500/50 flex items-start gap-2 cursor-pointer transition-colors">
                <span className="text-zinc-300 light:text-zinc-700 font-bold shrink-0">2.</span>
                <span>Enter your <strong className="text-white light:text-zinc-900">Naukri Email & Password</strong> so the cloud bot can sign in to apply.</span>
              </li>
            )}
            {targetRoles.length === 0 && (
              <li onClick={() => goStep(3)} className="p-2.5 rounded-lg bg-black/50 light:bg-white/85 border border-zinc-800 light:border-zinc-200 hover:border-cyan-500/50 flex items-start gap-2 cursor-pointer transition-colors">
                <span className="text-zinc-300 light:text-zinc-700 font-bold shrink-0">3.</span>
                <span>Add at least 1 <strong className="text-white light:text-zinc-900">Target Role</strong> so the bot targets matching recruiter openings.</span>
              </li>
            )}
          </ul>
        </div>
      )}

      {activeStep === 0 && (<>
      {/* 1. CANDIDATE RESUME PDF & AI AUTO-FILL (TOP HERO SECTION) */}
      <div className="p-5 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200 light:text-zinc-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-400 light:text-zinc-600" /> Candidate Resume PDF
            </h3>
            <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
              Upload your resume PDF. The AI extracts your credentials, skills, and work history to auto-fill the form.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600">
              Step 1: Upload & Auto-Fill
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black light:bg-white border border-zinc-800 light:border-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-medium text-white light:text-zinc-900 truncate max-w-[240px] sm:max-w-none">
                  {resumeFilename || (effectiveUserId ? `${effectiveUserId}_Resume.pdf` : 'Candidate_Resume.pdf')}
                </span>
                {(resumeFilename || !isNew) && (
                  <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-emerald-400 light:text-emerald-600 font-mono shrink-0 flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> Cloud Synced
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 light:text-zinc-600 mt-0.5">
                Recruiters receive this exact document during automated one-click applications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {effectiveUserId && (
              <a
                href={`/api/profile/resume?user_id=${encodeURIComponent(effectiveUserId)}&t=${resumeVersion}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-300 light:text-zinc-700 border border-zinc-800 light:border-zinc-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Preview PDF
              </a>
            )}

            <label className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-zinc-800 light:bg-zinc-200 hover:bg-zinc-700 text-white light:text-zinc-900 border border-zinc-700 light:border-zinc-300 cursor-pointer transition-colors shadow-sm">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploadingResume ? 'Uploading...' : 'Upload New PDF'}</span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleResumeUpload}
                disabled={uploadingResume}
                className="hidden"
              />
            </label>

            {/* AI AUTO-FILL BUTTON */}
            <button
              type="button"
              onClick={() => setShowAiPrompt(!showAiPrompt)}
              disabled={savingProfile || isAnalyzing || uploadingResume}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isAnalyzing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
              )}
              <span>{isAnalyzing ? 'Extracting...' : 'Auto-Fill with AI'}</span>
            </button>
          </div>
        </div>

        {/* AI Optional Prompt Popover / Dropdown */}
        {showAiPrompt && (
          <div className="p-4 rounded-xl bg-zinc-950 light:bg-white border border-zinc-700 light:border-zinc-300 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-200 light:text-zinc-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" /> Optional: Customize AI Extraction
              </span>
              <button
                type="button"
                onClick={() => setShowAiPrompt(false)}
                className="text-zinc-500 light:text-zinc-600 hover:text-zinc-300 text-xs"
              >
                Close
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 light:text-zinc-600 leading-relaxed">
              You can give extra instructions to the AI (e.g. <em>"Target: Senior QA Automation Engineer. Expected CTC: 20 LPA. Notice period 15 days. Remote or Bangalore."</em>) or leave empty to auto-extract directly from your resume.
            </p>
            <textarea
              rows={2}
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="e.g. Target Role: Senior QA Engineer, Target CTC: 20 LPA, Prefer Bangalore..."
              className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 rounded-lg p-2.5 text-xs text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none focus:border-zinc-500 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAiPrompt(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAiAutoFill}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 cursor-pointer shadow-sm"
              >
                {isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isAnalyzing ? 'Extracting...' : 'Start Auto-Fill'}</span>
              </button>
            </div>
          </div>
        )}

        {resumeSuccess && (
          <div className="text-xs text-zinc-200 light:text-zinc-800 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" /> {resumeSuccess}
          </div>
        )}

        {resumeError && (
          <div className="text-xs text-rose-400 light:text-rose-600 flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5" /> {resumeError}
          </div>
        )}

        {/* Minimal PII Shield */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-400 light:text-zinc-600 bg-black/60 light:bg-white/85 px-3 py-2 rounded-xl border border-zinc-800/80 light:border-zinc-200 w-fit">
          <Shield className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600 shrink-0" />
          <span className="font-medium text-zinc-300 light:text-zinc-700">Auto PII Sanitized</span>
          <span className="text-zinc-500 light:text-zinc-600 text-[10px] hidden sm:inline">
            · Zero Data-Leak: Sensitive home address, Aadhaar/PAN, and internal IDs scrubbed before cloud sync
          </span>
        </div>
      </div>

      </>)}

      {activeStep === 1 && (<>
      {/* 2. NAUKRI CREDENTIALS & IDENTITY */}
      <div className="p-5 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/60 light:border-zinc-200 pb-3">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200 light:text-zinc-800 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-400 light:text-zinc-600" /> Naukri Account & Credentials (One-Time Setup)
            </h3>
            <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
              Configure your Naukri.com login credentials once. The automated bot securely uses them for daily application runs.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700">
            One-Time Setup
          </span>
        </div>

        {/* Candidate Profile Picture / Avatar Card (Trust-Building) */}
        <div className="p-4 rounded-xl bg-black light:bg-white border border-zinc-800 light:border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-zinc-700 light:border-zinc-300 bg-zinc-900 light:bg-zinc-100 shadow-md flex items-center justify-center">
              {candidatePicture ? (
                <img
                  src={candidatePicture}
                  alt={candidateName || 'Candidate'}
                  className="w-full h-full object-cover"
                  onError={() => setCandidatePicture('')}
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 light:bg-zinc-200 flex items-center justify-center font-bold text-white light:text-zinc-900 text-sm">
                  {candidateName ? candidateName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AI'}
                </div>
              )}
              <span className="w-3.5 h-3.5 rounded-full bg-zinc-400 absolute bottom-0 right-0 border-2 border-black" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white light:text-zinc-900">Profile Photo</span>
                {candidatePicture ? (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 font-semibold flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> Photo Active
                  </span>
                ) : (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600">
                    Google / Default Avatar
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 light:text-zinc-600 leading-relaxed max-w-md">
                Builds recruiter trust & confirms account ownership. Synced from Google OAuth or upload your own.
              </p>
              {photoError && <span className="text-[11px] text-rose-400 light:text-rose-600 font-medium block">{photoError}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-white light:text-zinc-900 border border-zinc-700 light:border-zinc-300 cursor-pointer transition-colors shadow-sm">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
                className="hidden"
              />
            </label>

            {candidatePicture && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="px-2.5 py-2 rounded-lg text-xs font-medium text-zinc-400 light:text-zinc-600 hover:text-rose-400 hover:bg-rose-950/20 border border-zinc-800 light:border-zinc-200 transition-colors cursor-pointer"
                title="Remove custom photo"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 light:text-zinc-700 mb-1.5">
              Full Name <span className="text-rose-400 light:text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={candidateName}
              onChange={e => {
                setCandidateName(e.target.value)
                clearError('name')
              }}
              placeholder="e.g. Mahalakshmi S R"
              className={`w-full bg-black light:bg-white border rounded-lg px-3.5 py-2.5 text-xs text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none ${
                errors.name ? 'border-rose-500/80 focus:border-rose-500' : 'border-zinc-800 light:border-zinc-200 focus:border-zinc-500'
              }`}
            />
            {errors.name && (
              <span className="text-[11px] text-rose-400 light:text-rose-600 mt-1 block font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" /> {errors.name}
              </span>
            )}
          </div>

          {/* Current City / Location */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 light:text-zinc-700 mb-1.5">
              Current City / Base Location <span className="text-rose-400 light:text-rose-600">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-zinc-500 light:text-zinc-600 absolute left-3 top-3" />
              <input
                type="text"
                value={currentLocation}
                onChange={e => {
                  setCurrentLocation(e.target.value)
                  clearError('location')
                }}
                placeholder="e.g. Bangalore"
                className={`w-full bg-black light:bg-white border rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none ${
                  errors.location ? 'border-rose-500/80 focus:border-rose-500' : 'border-zinc-800 light:border-zinc-200 focus:border-zinc-500'
                }`}
              />
            </div>
            {errors.location && (
              <span className="text-[11px] text-rose-400 light:text-rose-600 mt-1 block font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" /> {errors.location}
              </span>
            )}
          </div>

          {/* Naukri Login Email */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 light:text-zinc-700 mb-1.5">
              Naukri Login Email <span className="text-rose-400 light:text-rose-600">*</span>
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-zinc-500 light:text-zinc-600 absolute left-3 top-3" />
              <input
                type="email"
                value={naukriEmail}
                onChange={e => {
                  setNaukriEmail(e.target.value)
                  clearError('email')
                }}
                placeholder="candidate@gmail.com"
                required
                className={`w-full bg-black light:bg-white border rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none font-mono ${
                  errors.email ? 'border-rose-500/80 focus:border-rose-500' : 'border-zinc-800 light:border-zinc-200 focus:border-zinc-500'
                }`}
              />
            </div>
            {errors.email && (
              <span className="text-[11px] text-rose-400 light:text-rose-600 mt-1 block font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" /> {errors.email}
              </span>
            )}
          </div>

          {/* Naukri Login Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-300 light:text-zinc-700">
                Naukri Login Password <span className="text-rose-400 light:text-rose-600">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-zinc-500 light:text-zinc-600 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={naukriPassword}
                onChange={e => {
                  setNaukriPassword(e.target.value)
                  clearError('password')
                }}
                placeholder="Naukri password for automated login"
                className={`w-full bg-black light:bg-white border rounded-lg pl-9 pr-10 py-2.5 text-xs text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none font-mono ${
                  errors.password ? 'border-rose-500/80 focus:border-rose-500' : 'border-zinc-800 light:border-zinc-200 focus:border-zinc-500'
                }`}
              />
            </div>
            {errors.password ? (
              <span className="text-[11px] text-rose-400 light:text-rose-600 mt-1 block font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" /> {errors.password}
              </span>
            ) : (
              <p className="text-[10px] text-zinc-500 light:text-zinc-600 mt-1">
                Encrypted and stored in private MongoDB cluster for headless session authentication.
              </p>
            )}
          </div>
        </div>
      </div>

      </>)}

      {activeStep === 2 && (<>
      {/* 3. EXPERIENCE & COMPENSATION (CTC) */}
      <div className="p-5 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/60 light:border-zinc-200 pb-3">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200 light:text-zinc-800 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-zinc-400 light:text-zinc-600" /> Career, Experience & Compensation
            </h3>
            <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
              Recruiters use these values to verify eligibility against their budget and experience brackets.
            </p>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 light:text-zinc-600">Step 3: CTC & Tenure</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Experience */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 light:text-zinc-700 mb-1.5">
              Total Experience (Years) <span className="text-rose-400 light:text-rose-600">*</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="45"
              value={experienceYears}
              onChange={e => {
                setExperienceYears(e.target.value)
                clearError('experience')
              }}
              placeholder="e.g. 6"
              className={`w-full bg-black light:bg-white border rounded-lg px-3.5 py-2.5 text-xs text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none font-mono ${
                errors.experience ? 'border-rose-500/80 focus:border-rose-500' : 'border-zinc-800 light:border-zinc-200 focus:border-zinc-500'
              }`}
            />
            {errors.experience ? (
              <span className="text-[11px] text-rose-400 light:text-rose-600 mt-1 block font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" /> {errors.experience}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-500 light:text-zinc-600 mt-1 block">e.g. 6.0 years</span>
            )}
          </div>

          {/* Current Company */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 light:text-zinc-700 mb-1.5">
              Current Company <span className="text-rose-400 light:text-rose-600">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 text-zinc-500 light:text-zinc-600 absolute left-3 top-3" />
              <input
                type="text"
                value={currentCompany}
                onChange={e => handleCurrentCompanyInputChange(e.target.value)}
                placeholder="e.g. Wipro"
                className={`w-full bg-black light:bg-white border rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none ${
                  errors.company ? 'border-rose-500/80 focus:border-rose-500' : 'border-zinc-800 light:border-zinc-200 focus:border-zinc-500'
                }`}
              />
            </div>
            {errors.company ? (
              <span className="text-[11px] text-rose-400 light:text-rose-600 mt-1 block font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" /> {errors.company}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-500 light:text-zinc-600 mt-1 block">Current payroll company</span>
            )}
          </div>

          {/* Current CTC (LPA) */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 light:text-zinc-700 mb-1.5">
              Current CTC (₹ in LPA) <span className="text-rose-400 light:text-rose-600">*</span>
            </label>
            <div className="relative">
              <IndianRupee className="w-3.5 h-3.5 text-zinc-500 light:text-zinc-600 absolute left-3 top-3" />
              <input
                type="number"
                step="0.5"
                min="0"
                value={currentCtcLpa}
                onChange={e => {
                  setCurrentCtcLpa(e.target.value)
                  clearError('currentCtc')
                }}
                placeholder="e.g. 15"
                className={`w-full bg-black light:bg-white border rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none font-mono ${
                  errors.currentCtc ? 'border-rose-500/80 focus:border-rose-500' : 'border-zinc-800 light:border-zinc-200 focus:border-zinc-500'
                }`}
              />
            </div>
            {errors.currentCtc ? (
              <span className="text-[11px] text-rose-400 light:text-rose-600 mt-1 block font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" /> {errors.currentCtc}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-400 light:text-zinc-600 mt-1 block font-mono">
                {formatLpaDisplay(currentCtcLpa)}
              </span>
            )}
          </div>

          {/* Expected CTC (LPA) */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 light:text-zinc-700 mb-1.5">
              Expected CTC (₹ in LPA) <span className="text-rose-400 light:text-rose-600">*</span>
            </label>
            <div className="relative">
              <IndianRupee className="w-3.5 h-3.5 text-zinc-500 light:text-zinc-600 absolute left-3 top-3" />
              <input
                type="number"
                step="0.5"
                min="0"
                value={expectedCtcLpa}
                onChange={e => {
                  setExpectedCtcLpa(e.target.value)
                  clearError('expectedCtc')
                }}
                placeholder="e.g. 20"
                className={`w-full bg-black light:bg-white border rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none font-mono ${
                  errors.expectedCtc ? 'border-rose-500/80 focus:border-rose-500' : 'border-zinc-800 light:border-zinc-200 focus:border-zinc-500'
                }`}
              />
            </div>
            {errors.expectedCtc ? (
              <span className="text-[11px] text-rose-400 light:text-rose-600 mt-1 block font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" /> {errors.expectedCtc}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-400 light:text-zinc-600 mt-1 block font-mono">
                {formatLpaDisplay(expectedCtcLpa)}
              </span>
            )}
          </div>
        </div>

        {/* Current Employer Exclusion Shield Badge */}
        {currentCompany.trim() && (
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60 light:border-zinc-200 text-xs flex-wrap">
            <span className="text-zinc-400 light:text-zinc-600 text-[11px]">Employer Application Shield:</span>
            {avoidCompanies.some(c => c.toLowerCase() === currentCompany.trim().toLowerCase()) ? (
              <span className="text-zinc-300 light:text-zinc-700 flex items-center gap-1 bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 px-2 py-0.5 rounded-lg font-mono text-[10px]">
                <Shield className="w-3 h-3 text-zinc-400 light:text-zinc-600" /> "{currentCompany}" is Blacklisted (Bot will never apply)
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAvoidCompanies(prev => [...prev, currentCompany.trim()])
                }}
                className="text-amber-300 light:text-amber-700 hover:text-white light:hover:text-zinc-900 bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 px-2.5 py-1 rounded-lg font-mono text-[10px] cursor-pointer flex items-center gap-1 transition-colors"
                title="Add current company to avoid_companies to prevent accidental applications"
              >
                <Plus className="w-3 h-3" /> Add "{currentCompany}" to Blacklist (Recommended)
              </button>
            )}
          </div>
        )}
      </div>

      </>)}

      {activeStep === 3 && (<>
      {/* 4. TARGET JOB FILTERS & PREFERENCES */}
      <div className="p-5 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800/60 light:border-zinc-200 pb-3">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200 light:text-zinc-800 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-zinc-400 light:text-zinc-600" /> Target Job Search Criteria
            </h3>
            <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
              Specify what roles, locations, and technologies the bot should target during automated sweeps.
            </p>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 light:text-zinc-600">Step 4: Search Filters</span>
        </div>

        {/* Target Job Roles */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-300 light:text-zinc-700">
            Target Job Titles / Roles ({targetRoles.length}) <span className="text-rose-400 light:text-rose-600">*</span>
          </label>
          <div className={`flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-black light:bg-white border rounded-xl ${
            errors.targetRoles ? 'border-rose-500/80' : 'border-zinc-800 light:border-zinc-200'
          }`}>
            {targetRoles.map((role, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-xs text-white light:text-zinc-900 font-medium"
              >
                <span>{role}</span>
                <button
                  type="button"
                  onClick={() => removeTag(targetRoles, setTargetRoles, role)}
                  className="text-zinc-500 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <div className="flex-1 min-w-[200px] flex items-center gap-1">
              <input
                type="text"
                value={newRoleInput}
                onChange={e => setNewRoleInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag(targetRoles, setTargetRoles, newRoleInput, setNewRoleInput, 'targetRoles')
                  }
                }}
                placeholder="Type role & press Enter (e.g. Senior QA Engineer)..."
                className="w-full bg-transparent px-2 py-1 text-xs text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none"
              />
              {newRoleInput && (
                <button
                  type="button"
                  onClick={() => addTag(targetRoles, setTargetRoles, newRoleInput, setNewRoleInput, 'targetRoles')}
                  className="px-2 py-0.5 rounded bg-zinc-800 light:bg-zinc-200 text-[10px] text-white light:text-zinc-900 cursor-pointer"
                >
                  Add
                </button>
              )}
            </div>
          </div>
          {errors.targetRoles && (
            <span className="text-[11px] text-rose-400 light:text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" /> {errors.targetRoles}
            </span>
          )}

          {/* Quick presets for Target Roles */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-zinc-500 light:text-zinc-600 uppercase font-mono mr-1">Quick Add Roles:</span>
            {POPULAR_ROLE_PRESETS.map(preset => {
              const active = targetRoles.some(r => r.toLowerCase() === preset.toLowerCase())
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    if (active) {
                      removeTag(targetRoles, setTargetRoles, preset)
                    } else {
                      if (!targetRoles.some(r => r.toLowerCase() === preset.toLowerCase())) {
                        setTargetRoles(prev => [...prev, preset])
                        clearError('targetRoles')
                      }
                    }
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    active
                      ? 'bg-sky-950/80 border border-sky-500/50 text-sky-300 font-semibold'
                      : 'bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-zinc-200 hover:bg-zinc-800 light:hover:bg-zinc-200'
                  }`}
                >
                  {active ? `✓ ${preset}` : `+ ${preset}`}
                </button>
              )
            })}
          </div>
          {targetRoles.length === 0 && (
            <p className="text-[11px] text-amber-400/90 flex items-center gap-1 pt-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>Tip: Click any role title above to instantly add it to your profile.</span>
            </p>
          )}
        </div>

        {/* Target Locations */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-zinc-300 light:text-zinc-700">
              Preferred Job Locations ({targetLocations.length}) <span className="text-rose-400 light:text-rose-600">*</span>
            </label>
            <span className="text-[10px] text-zinc-500 light:text-zinc-600">Quick-add popular hubs below</span>
          </div>
          <div className={`flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-black light:bg-white border rounded-xl ${
            errors.targetLocations ? 'border-rose-500/80' : 'border-zinc-800 light:border-zinc-200'
          }`}>
            {targetLocations.map((loc, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-xs text-white light:text-zinc-900 font-medium"
              >
                <span>{loc}</span>
                <button
                  type="button"
                  onClick={() => removeTag(targetLocations, setTargetLocations, loc)}
                  className="text-zinc-500 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <div className="flex-1 min-w-[180px] flex items-center gap-1">
              <input
                type="text"
                value={newLocationInput}
                onChange={e => setNewLocationInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag(targetLocations, setTargetLocations, newLocationInput, setNewLocationInput, 'targetLocations')
                  }
                }}
                placeholder="Type location & press Enter (e.g. Bangalore)..."
                className="w-full bg-transparent px-2 py-1 text-xs text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none"
              />
              {newLocationInput && (
                <button
                  type="button"
                  onClick={() => addTag(targetLocations, setTargetLocations, newLocationInput, setNewLocationInput, 'targetLocations')}
                  className="px-2 py-0.5 rounded bg-zinc-800 light:bg-zinc-200 text-[10px] text-white light:text-zinc-900 cursor-pointer"
                >
                  Add
                </button>
              )}
            </div>
          </div>
          {errors.targetLocations && (
            <span className="text-[11px] text-rose-400 light:text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" /> {errors.targetLocations}
            </span>
          )}

          {/* Quick presets for locations */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-zinc-500 light:text-zinc-600 uppercase font-mono mr-1">Quick Add:</span>
            {POPULAR_LOCATION_PRESETS.map(preset => {
              const active = targetLocations.some(l => l.toLowerCase() === preset.toLowerCase())
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    if (active) {
                      removeTag(targetLocations, setTargetLocations, preset)
                    } else {
                      setTargetLocations([...targetLocations, preset])
                      clearError('targetLocations')
                    }
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                    active
                      ? 'bg-zinc-800 light:bg-zinc-200 border-zinc-600 text-white light:text-zinc-900'
                      : 'bg-zinc-950 light:bg-white border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-zinc-200'
                  }`}
                >
                  {active ? `✓ ${preset}` : `+ ${preset}`}
                </button>
              )
            })}
          </div>
        </div>

        {/* Primary Tech Stack & Skills */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-300 light:text-zinc-700">
            Primary Tech Stack & Keywords ({skills.length}) <span className="text-rose-400 light:text-rose-600">*</span>
          </label>
          <div className={`flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-black light:bg-white border rounded-xl ${
            errors.skills ? 'border-rose-500/80' : 'border-zinc-800 light:border-zinc-200'
          }`}>
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-xs text-white light:text-zinc-900 font-medium"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => removeTag(skills, setSkills, skill)}
                  className="text-zinc-500 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <div className="flex-1 min-w-[200px] flex items-center gap-1">
              <input
                type="text"
                value={newSkillInput}
                onChange={e => setNewSkillInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag(skills, setSkills, newSkillInput, setNewSkillInput, 'skills')
                  }
                }}
                placeholder="Type skill & press Enter (e.g. Cypress, Playwright, Python)..."
                className="w-full bg-transparent px-2 py-1 text-xs text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none"
              />
              {newSkillInput && (
                <button
                  type="button"
                  onClick={() => addTag(skills, setSkills, newSkillInput, setNewSkillInput, 'skills')}
                  className="px-2 py-0.5 rounded bg-zinc-800 light:bg-zinc-200 text-[10px] text-white light:text-zinc-900 cursor-pointer"
                >
                  Add
                </button>
              )}
            </div>
          </div>
          {errors.skills && (
            <span className="text-[11px] text-rose-400 light:text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" /> {errors.skills}
            </span>
          )}
        </div>

        {/* Must-Have Keywords (Strict Match) */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-300 light:text-zinc-700">
            Must-Have Keywords (Strict Requirement) ({mustHaveKeywords.length})
          </label>
          <p className="text-[11px] text-zinc-500 light:text-zinc-600">
            The bot will only apply to jobs that contain at least one of these strict keywords in the job description.
          </p>
          <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-black light:bg-white border border-zinc-800 light:border-zinc-200 rounded-xl">
            {mustHaveKeywords.map((kw, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-xs text-white light:text-zinc-900 font-medium"
              >
                <span>{kw}</span>
                <button
                  type="button"
                  onClick={() => removeTag(mustHaveKeywords, setMustHaveKeywords, kw)}
                  className="text-zinc-500 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <div className="flex-1 min-w-[180px] flex items-center gap-1">
              <input
                type="text"
                value={newMustHaveInput}
                onChange={e => setNewMustHaveInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag(mustHaveKeywords, setMustHaveKeywords, newMustHaveInput, setNewMustHaveInput)
                  }
                }}
                placeholder="Type must-have keyword & press Enter..."
                className="w-full bg-transparent px-2 py-1 text-xs text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none"
              />
              {newMustHaveInput && (
                <button
                  type="button"
                  onClick={() => addTag(mustHaveKeywords, setMustHaveKeywords, newMustHaveInput, setNewMustHaveInput)}
                  className="px-2 py-0.5 rounded bg-zinc-800 light:bg-zinc-200 text-[10px] text-white light:text-zinc-900 cursor-pointer"
                >
                  Add
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      </>)}

      {activeStep === 4 && (<>
      {/* 5. RECRUITER SCREENING QUESTIONS (PREDEFINED ANSWERS) */}
      <div className="p-5 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/60 light:border-zinc-200 pb-3">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200 light:text-zinc-800 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-zinc-400 light:text-zinc-600" /> Automated Recruiter Screening Q&A
            </h3>
            <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
              Recruiters ask mandatory one-click questionnaire forms. The AI bot answers using these values.
            </p>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 light:text-zinc-600">Step 5: Screening Q&A</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Notice Period */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 light:text-zinc-700 mb-1.5">
              Notice Period
            </label>
            <select
              value={noticePeriod}
              onChange={e => setNoticePeriod(e.target.value)}
              className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 rounded-lg px-3 py-2.5 text-xs text-white light:text-zinc-900 focus:outline-none focus:border-zinc-500"
            >
              <option value="Immediate / 15 Days">Immediate / 15 Days</option>
              <option value="Serving Notice (Immediate)">Serving Notice (Immediate)</option>
              <option value="15 Days">15 Days</option>
              <option value="30 Days">30 Days</option>
              <option value="45 Days">45 Days</option>
              <option value="60 Days">60 Days</option>
              <option value="90 Days">90 Days</option>
            </select>
          </div>

          {/* Relocation Willingness */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 light:text-zinc-700 mb-1.5">
              Are you willing to relocate?
            </label>
            <select
              value={willingToRelocate}
              onChange={e => setWillingToRelocate(e.target.value)}
              className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 rounded-lg px-3 py-2.5 text-xs text-white light:text-zinc-900 focus:outline-none focus:border-zinc-500"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Open for Hybrid/Remote only">Open for Hybrid / Remote only</option>
            </select>
          </div>

          {/* Career Break */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 light:text-zinc-700 mb-1.5">
              Are you on a career break?
            </label>
            <select
              value={careerBreak}
              onChange={e => setCareerBreak(e.target.value)}
              className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 rounded-lg px-3 py-2.5 text-xs text-white light:text-zinc-900 focus:outline-none focus:border-zinc-500"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          {/* Active Backlogs */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 light:text-zinc-700 mb-1.5">
              Any active backlogs / academic gaps?
            </label>
            <select
              value={activeBacklogs}
              onChange={e => setActiveBacklogs(e.target.value)}
              className="w-full bg-black light:bg-white border border-zinc-800 light:border-zinc-200 rounded-lg px-3 py-2.5 text-xs text-white light:text-zinc-900 focus:outline-none focus:border-zinc-500"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        </div>

        {/* Custom Q&A Items */}
        {customQaList.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-zinc-800/60 light:border-zinc-200">
            <span className="text-[11px] font-medium text-zinc-400 light:text-zinc-600">Additional Custom Screening Answers:</span>
            <div className="space-y-2">
              {customQaList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-black light:bg-white p-2.5 rounded-lg border border-zinc-800 light:border-zinc-200 text-xs">
                  <div className="flex-1 text-zinc-300 light:text-zinc-700 font-medium truncate">{item.key}</div>
                  <div className="text-zinc-400 light:text-zinc-600 font-mono px-2 py-0.5 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200">{item.val}</div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomQa(idx)}
                    className="text-zinc-500 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Custom Q&A Form */}
        <form onSubmit={handleAddCustomQa} className="flex flex-col sm:flex-row gap-2 pt-1">
          <input
            type="text"
            value={newQaKey}
            onChange={e => setNewQaKey(e.target.value)}
            placeholder="Custom Question (e.g. Do you have a valid passport?)..."
            className="flex-1 bg-black light:bg-white border border-zinc-800 light:border-zinc-200 rounded-lg px-3 py-2 text-xs text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
          />
          <input
            type="text"
            value={newQaVal}
            onChange={e => setNewQaVal(e.target.value)}
            placeholder="Answer (e.g. Yes)..."
            className="w-full sm:w-48 bg-black light:bg-white border border-zinc-800 light:border-zinc-200 rounded-lg px-3 py-2 text-xs text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-200 light:text-zinc-800 text-xs font-medium border border-zinc-700 light:border-zinc-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Q&A</span>
          </button>
        </form>
      </div>

      </>)}

      {activeStep === 5 && (<>
      {/* 6. EMPLOYMENT HISTORY (STRICTLY AT MOST 1 CURRENT EMPLOYER) */}
      <div className="p-5 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/60 light:border-zinc-200 pb-3 flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-zinc-200 light:text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-400 light:text-zinc-600" /> Work History & Employers ({employmentHistory.length})
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                currentEmployersCount === 1
                  ? 'bg-zinc-900 light:bg-zinc-100 border-zinc-800 light:border-zinc-200 text-emerald-400 light:text-emerald-600'
                  : currentEmployersCount === 0
                  ? 'bg-zinc-900 light:bg-zinc-100 border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600'
                  : 'bg-rose-950/60 light:bg-rose-50 border-rose-800/80 text-rose-300 light:text-rose-600'
              }`}>
                {currentEmployersCount === 1
                  ? '1 Current Employer Active'
                  : currentEmployersCount === 0
                  ? '0 Current Selected'
                  : `${currentEmployersCount} Current Marked (Must be 1)`}
              </span>
            </div>
            <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
              Verified employment timeline. Only <strong>1 employer</strong> can be marked as current.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddEmpForm(!showAddEmpForm)}
            className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Employer
          </button>
        </div>

        {errors.employment && (
          <div className="p-3 rounded-lg bg-rose-950/40 light:bg-rose-50 border border-rose-800 text-rose-300 light:text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.employment}</span>
          </div>
        )}

        {/* Add Employer Form */}
        {showAddEmpForm && (
          <form onSubmit={handleAddEmployment} className="p-4 rounded-xl bg-black light:bg-white border border-zinc-800 light:border-zinc-200 space-y-3 animate-in fade-in">
            <span className="text-xs font-medium text-white light:text-zinc-900 block">Add Employment Record</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 light:text-zinc-600 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={newEmpCompany}
                  onChange={e => setNewEmpCompany(e.target.value)}
                  placeholder="e.g. Wipro"
                  required
                  className="w-full bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-white light:text-zinc-900"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 light:text-zinc-600 mb-1">Job Title *</label>
                <input
                  type="text"
                  value={newEmpTitle}
                  onChange={e => setNewEmpTitle(e.target.value)}
                  placeholder="e.g. Software Test Engineer"
                  required
                  className="w-full bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-white light:text-zinc-900"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 light:text-zinc-600 mb-1">Start Date</label>
                <input
                  type="text"
                  value={newEmpStart}
                  onChange={e => setNewEmpStart(e.target.value)}
                  placeholder="e.g. Jan 2023"
                  className="w-full bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-white light:text-zinc-900"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 light:text-zinc-600 mb-1">End Date</label>
                <input
                  type="text"
                  value={newEmpEnd}
                  onChange={e => setNewEmpEnd(e.target.value)}
                  placeholder="e.g. Present"
                  disabled={newEmpCurrent}
                  className="w-full bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-white light:text-zinc-900 disabled:opacity-50"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-zinc-300 light:text-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newEmpCurrent}
                  onChange={e => {
                    setNewEmpCurrent(e.target.checked)
                    if (e.target.checked) setNewEmpEnd('Present')
                  }}
                  className="rounded bg-zinc-900 light:bg-zinc-100 border-zinc-700 light:border-zinc-300"
                />
                <span>This is my current employer (will become the single active current company)</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmpForm(false)}
                  className="px-3 py-1 rounded text-xs text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-white light:bg-white light:ring-1 light:ring-zinc-300 text-black light:text-zinc-900 text-xs font-semibold cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Timeline Cards */}
        {employmentHistory.length === 0 ? (
          <p className="text-xs text-zinc-500 light:text-zinc-600 italic py-2">
            No past employment records recorded. Click "Auto-Fill with AI" at the top to extract directly from your resume.
          </p>
        ) : (
          <div className="space-y-2.5">
            {employmentHistory.map((emp, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl bg-black light:bg-white border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  emp.is_current ? 'border-zinc-700 light:border-zinc-300 shadow-sm' : 'border-zinc-800 light:border-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border shrink-0 ${
                    emp.is_current ? 'bg-zinc-900 light:bg-zinc-100 border-zinc-700 light:border-zinc-300 text-white light:text-zinc-900' : 'bg-zinc-950 light:bg-white border-zinc-800 light:border-zinc-200 text-zinc-500 light:text-zinc-600'
                  }`}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-white light:text-zinc-900">{emp.company}</span>
                      {emp.is_current ? (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-700 light:border-zinc-300 text-zinc-200 light:text-zinc-800 flex items-center gap-1 font-semibold">
                          <Check className="w-2.5 h-2.5" /> Current Employer (Payroll)
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 text-zinc-500 light:text-zinc-600">
                          Former Employer
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 light:text-zinc-600 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{emp.job_title}</span>
                      {(emp.start_date || emp.end_date) && (
                        <>
                          <span className="text-zinc-600">·</span>
                          <span className="font-mono text-[10px] text-zinc-500 light:text-zinc-600">
                            {emp.start_date || 'Start'} – {emp.end_date || (emp.is_current ? 'Present' : 'End')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* Single Current Employer Radio-Toggle Button */}
                  {emp.is_current ? (
                    <button
                      type="button"
                      onClick={() => handleUnsetCurrentEmployer(idx)}
                      className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 transition-colors cursor-pointer"
                      title="Click to unmark as current employer"
                    >
                      Unmark Current
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetSingleCurrentEmployer(idx)}
                      className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-zinc-950 light:bg-white hover:bg-zinc-900 light:hover:bg-zinc-100 border border-zinc-800 light:border-zinc-200 hover:border-zinc-700 light:hover:border-zinc-300 text-zinc-400 light:text-zinc-600 hover:text-white light:hover:text-zinc-900 transition-colors cursor-pointer"
                      title="Set as the 1 current employer and sync with current_company"
                    >
                      Set as Current
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveEmployment(idx)}
                    className="text-zinc-500 light:text-zinc-600 hover:text-rose-400 p-1.5 rounded transition-colors cursor-pointer"
                    title="Remove employment record"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. COMPANY EXCLUSION BLACKLIST */}
      <div className="p-5 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200 light:text-zinc-800 uppercase tracking-wider flex items-center gap-2">
              <Ban className="w-4 h-4 text-zinc-400 light:text-zinc-600" /> Company Exclusion Blacklist
            </h3>
            <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
              The autonomous bot will automatically skip and never apply to any job openings at these companies.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-zinc-400 light:text-zinc-600">
              {avoidCompanies.length} Blocked
            </span>
            <button
              type="button"
              onClick={handleExcludeAllMassConsultancies}
              className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 text-zinc-300 light:text-zinc-700 transition-colors cursor-pointer"
              title="Add top 8 mass consultancies in one tap"
            >
              + Block Top 8 Mass Consultancies
            </button>
          </div>
        </div>

        {/* Quick-Tap Preset Pills */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-mono uppercase text-zinc-500 light:text-zinc-600 flex items-center justify-between">
            <span>Quick-Tap Presets (Tap to toggle exclusion)</span>
            <span className="text-[9px] text-zinc-600">Mass Consultancies & IT Services</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MASS_CONSULTANCY_PRESETS.map(comp => {
              const isBlocked = avoidCompanies.some(c => c.toLowerCase() === comp.toLowerCase())
              return (
                <button
                  key={comp}
                  type="button"
                  onClick={() => handleToggleBlacklist(comp)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isBlocked
                      ? 'bg-zinc-800 light:bg-zinc-200 border border-zinc-600 text-white light:text-zinc-900 shadow-sm'
                      : 'bg-zinc-900/80 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800/90 light:border-zinc-200 text-zinc-400 light:text-zinc-600 hover:text-zinc-200'
                  }`}
                  title={isBlocked ? `Click to unblock ${comp}` : `Click to exclude ${comp}`}
                >
                  {isBlocked ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                      <span>{comp}</span>
                      <span className="text-[9px] text-zinc-400 light:text-zinc-600 font-mono">Blocked</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3 text-zinc-500 light:text-zinc-600" />
                      <span>{comp}</span>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Add Custom Company Form */}
        <form onSubmit={handleAddCustomBlacklist} className="flex flex-col sm:flex-row gap-2 pt-1">
          <input
            type="text"
            value={newBlacklistCompany}
            onChange={e => setNewBlacklistCompany(e.target.value)}
            placeholder="Type custom company to blacklist (e.g. CurrentEmployer Pvt Ltd)..."
            className="flex-1 bg-black light:bg-white border border-zinc-800 light:border-zinc-200 rounded-lg px-3 py-2 text-xs text-white light:text-zinc-900 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-200 light:text-zinc-800 text-xs font-medium border border-zinc-700 light:border-zinc-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-400 light:text-zinc-600" />
            <span>Add Custom</span>
          </button>
        </form>

        {/* Active Blacklisted Badges */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-mono uppercase text-zinc-500 light:text-zinc-600">
            Active Excluded List ({avoidCompanies.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {avoidCompanies.length === 0 ? (
              <p className="text-xs text-zinc-500 light:text-zinc-600 italic">
                No companies currently blacklisted. All matching companies are eligible for automated applications.
              </p>
            ) : (
              avoidCompanies.map((comp, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 text-xs text-zinc-300 light:text-zinc-700 font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400/80 shrink-0" />
                  <span>{comp}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleBlacklist(comp)}
                    className="text-zinc-500 light:text-zinc-600 hover:text-zinc-300 p-0.5 rounded transition-colors cursor-pointer"
                    title={`Remove ${comp} from blacklist`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      </>)}

      {activeStep === 6 && (<>
      {/* 8. BOT AUTOMATION CONTROLS */}
      <div className="p-5 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200 light:text-zinc-800 uppercase tracking-wider">
              Autonomous Cloud Bot Run Schedule
            </h3>
            <p className="text-xs text-zinc-400 light:text-zinc-600 mt-0.5">
              The daemon triggers every morning at 06:00 AM IST to scout and apply to fresh openings.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabledForDailyRun}
              onChange={e => setEnabledForDailyRun(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-800 light:bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Daily limit — fixed by plan, admin-managed. Candidates see it, only admins change it. */}
        <div className="pt-3 border-t border-zinc-900 light:border-zinc-200 flex items-center justify-between gap-2">
          <p className="text-[11px] text-zinc-500 light:text-zinc-600">
            Daily limit: <span className="text-zinc-200 light:text-zinc-800 font-mono font-semibold">55 / day</span>
            <span className="text-zinc-600"> · set by your plan</span>
          </p>
        </div>
      </div>

      {/* 9. PRIMARY ACTION BAR */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#09090b] light:bg-white border border-zinc-800 light:border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20 backdrop-blur-md shadow-2xl">
        <div className="text-xs text-zinc-400 light:text-zinc-600 text-center sm:text-left">
          Make sure your Naukri credentials & target roles are accurate before saving.
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={savingProfile || isAnalyzing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 transition-all cursor-pointer shadow-lg disabled:opacity-50"
          >
            {savingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{savingProfile ? 'Saving & Syncing...' : 'Save Profile & Sync with Bot'}</span>
          </button>
        </div>
      </div>

      {/* 10. COLLAPSIBLE ADVANCED / DEVELOPER RAW JSON VIEW */}
      <div className="rounded-xl border border-zinc-900 light:border-zinc-200 bg-black/40 light:bg-white/85 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowRawJson(!showRawJson)}
          className="w-full p-3.5 text-xs font-mono text-zinc-500 light:text-zinc-600 hover:text-zinc-300 flex items-center justify-between transition-colors cursor-pointer bg-zinc-950/60 light:bg-white"
        >
          <span className="flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5 text-zinc-500 light:text-zinc-600" />
            <span>Developer View: Raw Profile Document JSON (Optional)</span>
          </span>
          {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showRawJson && (
          <div className="p-4 space-y-3 border-t border-zinc-900 light:border-zinc-200 bg-black light:bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-400 light:text-zinc-600 font-mono">
                Direct JSON Sync (Auto-updates with visual form above)
              </span>
              {jsonError && (
                <span className="text-[11px] text-rose-400 light:text-rose-600 font-mono">{jsonError}</span>
              )}
            </div>
            <textarea
              rows={16}
              value={rawJsonStr}
              onChange={handleRawJsonChange}
              className="w-full bg-zinc-950 light:bg-white border border-zinc-800 light:border-zinc-200 rounded-lg p-3 font-mono text-xs text-zinc-300 light:text-zinc-700 focus:outline-none focus:border-zinc-500 leading-relaxed"
              spellCheck={false}
            />
          </div>
        )}
      </div>

      </>)}

      {/* STEP NAVIGATION */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={() => goStep(activeStep - 1)}
          disabled={activeStep === 0}
          className="px-4 py-2 rounded-xl bg-zinc-900 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 border border-zinc-800 light:border-zinc-200 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-zinc-900 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
        <span className="text-[11px] text-zinc-500 light:text-zinc-600 font-mono">Step {activeStep + 1} of {STEPS.length}</span>
        {activeStep < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => goStep(activeStep + 1)}
            className="px-4 py-2 rounded-xl bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={savingProfile || isAnalyzing}
            className="px-4 py-2 rounded-xl bg-white light:bg-white light:ring-1 light:ring-zinc-300 hover:bg-zinc-200 light:hover:bg-zinc-100 text-black light:text-zinc-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <span>{savingProfile ? 'Saving...' : 'Save & Launch'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Celebration Modal on Successful Profile Save */}
      <ProfileSaveCelebrationModal
        isOpen={showCelebrationModal}
        onClose={() => setShowCelebrationModal(false)}
        userEmail={naukriEmail || effectiveUserId}
        isProfessional={isAdmin}
      />
    </div>
  )
}
