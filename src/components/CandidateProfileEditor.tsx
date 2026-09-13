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
  Check
} from 'lucide-react'

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

  // 5. Employment History
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
  const [searchUrl, setSearchUrl] = useState<string>('https://www.naukri.com/mnjuser/recommendedjobs')

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

  // Advanced Raw JSON View
  const [showRawJson, setShowRawJson] = useState<boolean>(false)
  const [rawJsonStr, setRawJsonStr] = useState<string>('{\n}')
  const [jsonError, setJsonError] = useState<string>('')

  const effectiveUserId = isNew ? newUserId : userId

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

  // Convert CTC value to LPA display format
  const formatLpaDisplay = (val: number | string): string => {
    const num = Number(val) || 0
    if (num <= 0) return '₹ 0 / year'
    // If num is already in rupees (e.g. 1500000)
    const inRupees = num < 1000 ? Math.round(num * 100000) : Math.round(num)
    return `₹ ${inRupees.toLocaleString('en-IN')} / year`
  }

  // Populate visual state from a loaded profile document object
  const populateStateFromObject = (data: any) => {
    setCandidateName(data.name || '')
    setNaukriEmail(data.email || '')
    setNaukriPassword(data.password || '')
    setCurrentLocation(data.current_location || '')
    setCurrentCompany(data.current_company || '')

    // Experience
    setExperienceYears(data.experience !== undefined ? data.experience : 0)

    // CTC: convert rupees to LPA if >= 1000
    if (data.current_ctc !== undefined && data.current_ctc !== null) {
      const num = Number(data.current_ctc)
      setCurrentCtcLpa(num >= 1000 ? +(num / 100000).toFixed(2) : num)
    }
    if (data.expected_ctc !== undefined && data.expected_ctc !== null) {
      const num = Number(data.expected_ctc)
      setExpectedCtcLpa(num >= 1000 ? +(num / 100000).toFixed(2) : num)
    }

    // Job Filters
    const filters = data.job_filters || {}
    setTargetRoles(Array.isArray(filters.roles) ? filters.roles : [])
    setTargetLocations(Array.isArray(filters.location) ? filters.location : (Array.isArray(data.location) ? data.location : []))
    setSkills(Array.isArray(data.skills) ? data.skills : (Array.isArray(filters.keywords) ? filters.keywords : []))
    setMustHaveKeywords(Array.isArray(filters.must_have_keywords) ? filters.must_have_keywords : [])
    
    // Avoid companies
    const avoid = Array.isArray(filters.avoid_companies)
      ? filters.avoid_companies
      : (Array.isArray(data.avoid_companies) ? data.avoid_companies : [])
    setAvoidCompanies(avoid)

    // Employment History
    if (Array.isArray(data.employment_history)) {
      setEmploymentHistory(data.employment_history)
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

    setNoticePeriod(notice)
    setWillingToRelocate(relocate)
    setCareerBreak(breakAnswer)
    setActiveBacklogs(backlogAnswer)
    setPreferredLocation(prefLoc)
    setCustomQaList(customList)

    // Daily run & search url
    setEnabledForDailyRun(data.enabled_for_daily_run !== false)
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
      email: naukriEmail,
      password: naukriPassword,
      current_location: currentLocation,
      current_company: currentCompany,
      experience: Number(experienceYears) || 0,
      current_ctc: ctcCurrentNum,
      expected_ctc: ctcExpectedNum,
      search_url: searchUrl,
      enabled_for_daily_run: enabledForDailyRun,
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
    searchUrl,
    resumeFilename,
    loading
  ])

  useEffect(() => {
    if (isNew) {
      setLoading(false)
      // Provide clean initial template
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
        populateStateFromObject(data)
      } else {
        const err = await res.json().catch(() => ({}))
        setSaveError(err.detail || 'Failed to load profile.')
      }
    } catch (e: any) {
      setSaveError(`Failed to load candidate profile: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Save Profile Handler
  const handleSaveProfile = async () => {
    setSavingProfile(true)
    setSaveSuccess('')
    setSaveError('')

    if (isNew && !newUserId.trim()) {
      setSaveError('Candidate Unique ID is required.')
      setSavingProfile(false)
      return
    }

    if (!naukriEmail.trim()) {
      setSaveError('Naukri Login Email is required for automated applications.')
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
        if (!isNew && userId) loadProfileData(userId)
        if (onSaveSuccess) onSaveSuccess()
        setTimeout(() => setSaveSuccess(''), 5000)
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

  // AI Auto-Fill Handler
  const handleAiAutoFill = async () => {
    if (isNew && !newUserId.trim()) {
      setSaveError('Candidate Unique ID is required before running AI Auto-Fill.')
      return
    }

    setIsAnalyzing(true)
    setSaveError('')
    setSaveSuccess('')

    try {
      const res = await fetch('/api/profile/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: effectiveUserId,
          custom_prompt: aiPrompt
        })
      })

      if (res.ok) {
        const result = await res.json()
        const aiData = result.data || {}

        // Preserve current password and custom edits if AI didn't provide
        if (!aiData.password && naukriPassword) {
          aiData.password = naukriPassword
        }
        populateStateFromObject(aiData)
        setShowAiPrompt(false)
        setAiPrompt('')
        setSaveSuccess('✨ AI successfully analyzed your resume and auto-filled your profile! Review and click "Save Profile".')
        setTimeout(() => setSaveSuccess(''), 6000)
      } else {
        let errMessage = 'Failed to analyze resume with AI.'
        try {
          const err = await res.json()
          errMessage = err.detail || err.error || err.message || errMessage
        } catch {}
        setSaveError(errMessage)
      }
    } catch (e: any) {
      setSaveError(`AI analysis failed: ${e.message}`)
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
          setResumeSuccess(`Resume "${data.filename}" saved to JobFlux Cloud! Tap "Auto-Fill with AI" below to extract details.`)
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

  // Tag helper functions
  const addTag = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    input: string,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const trimmed = input.trim()
    if (!trimmed) return
    if (!list.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      setList([...list, trimmed])
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

  // Employment history helpers
  const handleAddEmployment = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newEmpCompany.trim() || !newEmpTitle.trim()) return
    const newItem: EmploymentItem = {
      company: newEmpCompany.trim(),
      job_title: newEmpTitle.trim(),
      start_date: newEmpStart.trim() || undefined,
      end_date: newEmpCurrent ? 'Present' : (newEmpEnd.trim() || undefined),
      is_current: newEmpCurrent
    }
    setEmploymentHistory([newItem, ...employmentHistory])
    if (newEmpCurrent) {
      setCurrentCompany(newEmpCompany.trim())
    }
    setNewEmpCompany('')
    setNewEmpTitle('')
    setNewEmpStart('')
    setNewEmpEnd('Present')
    setNewEmpCurrent(false)
    setShowAddEmpForm(false)
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

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-400">
        <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-3 text-zinc-300" />
        <p className="text-xs font-medium">Loading candidate profile...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white tracking-wide">
              Candidate Profile Configuration
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              Bot Sync Active
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Fill your Naukri credentials & preferences. The AI Bot uses these settings to find and apply to matching jobs.
          </p>
        </div>

        {/* Global Save Button in Header */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile || isAnalyzing}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            {savingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 font-medium animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* NEW CANDIDATE ID INPUT (Admin / Creation Mode Only) */}
      {isNew && (
        <div className="p-4 rounded-xl bg-[#09090b] border border-zinc-800 space-y-2">
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Candidate Unique ID <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={newUserId}
            onChange={e => setNewUserId(e.target.value)}
            required
            placeholder="e.g. candidate4_john_doe (no spaces, use underscores)"
            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono text-xs"
          />
        </div>
      )}

      {/* 1. CANDIDATE RESUME PDF & AI AUTO-FILL (TOP HERO SECTION) */}
      <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-400" /> Candidate Resume PDF
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Upload your resume PDF. The AI extracts your credentials, skills, and work history to auto-fill the form.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              Step 1: Upload & Auto-Fill
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-medium text-white truncate max-w-[240px] sm:max-w-none">
                  {resumeFilename || (effectiveUserId ? `${effectiveUserId}_Resume.pdf` : 'Candidate_Resume.pdf')}
                </span>
                {(resumeFilename || !isNew) && (
                  <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-400 font-mono shrink-0 flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> Cloud Synced
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Recruiters on Naukri receive this exact document during automated one-click applications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {effectiveUserId && (
              <a
                href={`/api/profile/resume?user_id=${encodeURIComponent(effectiveUserId)}&t=${resumeVersion}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Preview PDF
              </a>
            )}

            <label className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 cursor-pointer transition-colors shadow-sm">
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
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-all cursor-pointer shadow-sm disabled:opacity-50"
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
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-700 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-400" /> Optional: Customize AI Extraction
              </span>
              <button
                type="button"
                onClick={() => setShowAiPrompt(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Close
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              You can give extra instructions to the AI (e.g. <em>"Target: Senior QA Automation Engineer. Expected CTC: 20 LPA. Notice period 15 days. Remote or Bangalore."</em>) or leave empty to auto-extract directly from your resume.
            </p>
            <textarea
              rows={2}
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="e.g. Target Role: Senior QA Engineer, Target CTC: 20 LPA, Prefer Bangalore..."
              className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAiPrompt(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAiAutoFill}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black cursor-pointer shadow-sm"
              >
                {isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isAnalyzing ? 'Extracting...' : 'Start Auto-Fill'}</span>
              </button>
            </div>
          </div>
        )}

        {resumeSuccess && (
          <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> {resumeSuccess}
          </div>
        )}

        {resumeError && (
          <div className="text-xs text-rose-400 flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5" /> {resumeError}
          </div>
        )}

        {/* Minimal PII Shield */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-400 bg-black/60 px-3 py-2 rounded-xl border border-zinc-800/80 w-fit">
          <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-medium text-zinc-300">Auto PII Sanitized</span>
          <span className="text-zinc-500 text-[10px] hidden sm:inline">
            · Zero Data-Leak: Sensitive home address, Aadhaar/PAN, and internal IDs scrubbed before cloud sync
          </span>
        </div>
      </div>

      {/* 2. NAUKRI CREDENTIALS & IDENTITY */}
      <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-400" /> Naukri Account & Identity
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              The automated bot securely logs in with these credentials to submit applications on Naukri.com.
            </p>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">Step 2: Credentials</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={candidateName}
                onChange={e => setCandidateName(e.target.value)}
                placeholder="e.g. Mahalakshmi S R"
                className="w-full bg-black border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          {/* Current City / Location */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Current City / Base Location
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                value={currentLocation}
                onChange={e => setCurrentLocation(e.target.value)}
                placeholder="e.g. Bangalore"
                className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          {/* Naukri Login Email */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Naukri Login Email <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                value={naukriEmail}
                onChange={e => setNaukriEmail(e.target.value)}
                placeholder="candidate@gmail.com"
                required
                className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>
          </div>

          {/* Naukri Login Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Naukri Login Password <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={naukriPassword}
                onChange={e => setNaukriPassword(e.target.value)}
                placeholder="Naukri password for automated login"
                className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-10 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              Encrypted and stored in private MongoDB cluster for headless session authentication.
            </p>
          </div>
        </div>
      </div>

      {/* 3. EXPERIENCE & COMPENSATION (CTC) */}
      <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-zinc-400" /> Career, Experience & Compensation
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Recruiters use these values to verify eligibility against their budget and experience brackets.
            </p>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">Step 3: CTC & Tenure</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Experience */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Total Experience (Years)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={experienceYears}
              onChange={e => setExperienceYears(e.target.value)}
              placeholder="e.g. 6"
              className="w-full bg-black border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">e.g. 6.0 years</span>
          </div>

          {/* Current Company */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Current Company
            </label>
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                value={currentCompany}
                onChange={e => setCurrentCompany(e.target.value)}
                placeholder="e.g. Wipro"
                className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">Current payroll company</span>
          </div>

          {/* Current CTC (LPA) */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Current CTC (₹ in LPA)
            </label>
            <div className="relative">
              <IndianRupee className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="number"
                step="0.5"
                min="0"
                value={currentCtcLpa}
                onChange={e => setCurrentCtcLpa(e.target.value)}
                placeholder="e.g. 15"
                className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>
            <span className="text-[10px] text-zinc-400 mt-1 block font-mono">
              {formatLpaDisplay(currentCtcLpa)}
            </span>
          </div>

          {/* Expected CTC (LPA) */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Expected CTC (₹ in LPA)
            </label>
            <div className="relative">
              <IndianRupee className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="number"
                step="0.5"
                min="0"
                value={expectedCtcLpa}
                onChange={e => setExpectedCtcLpa(e.target.value)}
                placeholder="e.g. 20"
                className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>
            <span className="text-[10px] text-zinc-400 mt-1 block font-mono">
              {formatLpaDisplay(expectedCtcLpa)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. TARGET JOB FILTERS & PREFERENCES */}
      <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-zinc-400" /> Target Job Search Criteria
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Specify what roles, locations, and technologies the bot should target when searching on Naukri.
            </p>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">Step 4: Search Filters</span>
        </div>

        {/* Target Job Roles */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-300">
            Target Job Titles / Roles ({targetRoles.length})
          </label>
          <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-black border border-zinc-800 rounded-xl">
            {targetRoles.map((role, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white font-medium"
              >
                <span>{role}</span>
                <button
                  type="button"
                  onClick={() => removeTag(targetRoles, setTargetRoles, role)}
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
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
                    addTag(targetRoles, setTargetRoles, newRoleInput, setNewRoleInput)
                  }
                }}
                placeholder="Type role & press Enter (e.g. Senior QA Engineer)..."
                className="w-full bg-transparent px-2 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none"
              />
              {newRoleInput && (
                <button
                  type="button"
                  onClick={() => addTag(targetRoles, setTargetRoles, newRoleInput, setNewRoleInput)}
                  className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-white cursor-pointer"
                >
                  Add
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Target Locations */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-zinc-300">
              Preferred Job Locations ({targetLocations.length})
            </label>
            <span className="text-[10px] text-zinc-500">Quick-add popular hubs below</span>
          </div>
          <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-black border border-zinc-800 rounded-xl">
            {targetLocations.map((loc, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white font-medium"
              >
                <span>{loc}</span>
                <button
                  type="button"
                  onClick={() => removeTag(targetLocations, setTargetLocations, loc)}
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
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
                    addTag(targetLocations, setTargetLocations, newLocationInput, setNewLocationInput)
                  }
                }}
                placeholder="Type location & press Enter (e.g. Bangalore)..."
                className="w-full bg-transparent px-2 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none"
              />
              {newLocationInput && (
                <button
                  type="button"
                  onClick={() => addTag(targetLocations, setTargetLocations, newLocationInput, setNewLocationInput)}
                  className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-white cursor-pointer"
                >
                  Add
                </button>
              )}
            </div>
          </div>
          {/* Quick presets for locations */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-zinc-500 uppercase font-mono mr-1">Quick Add:</span>
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
                    }
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                    active
                      ? 'bg-zinc-800 border-zinc-600 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
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
          <label className="block text-xs font-medium text-zinc-300">
            Primary Tech Stack & Keywords ({skills.length})
          </label>
          <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-black border border-zinc-800 rounded-xl">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white font-medium"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => removeTag(skills, setSkills, skill)}
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
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
                    addTag(skills, setSkills, newSkillInput, setNewSkillInput)
                  }
                }}
                placeholder="Type skill & press Enter (e.g. Cypress, Playwright, Python)..."
                className="w-full bg-transparent px-2 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none"
              />
              {newSkillInput && (
                <button
                  type="button"
                  onClick={() => addTag(skills, setSkills, newSkillInput, setNewSkillInput)}
                  className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-white cursor-pointer"
                >
                  Add
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Must-Have Keywords (Strict Match) */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-300">
            Must-Have Keywords (Strict Requirement) ({mustHaveKeywords.length})
          </label>
          <p className="text-[11px] text-zinc-500">
            The bot will only apply to jobs that contain at least one of these strict keywords in the job description.
          </p>
          <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-black border border-zinc-800 rounded-xl">
            {mustHaveKeywords.map((kw, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white font-medium"
              >
                <span>{kw}</span>
                <button
                  type="button"
                  onClick={() => removeTag(mustHaveKeywords, setMustHaveKeywords, kw)}
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
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
                className="w-full bg-transparent px-2 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none"
              />
              {newMustHaveInput && (
                <button
                  type="button"
                  onClick={() => addTag(mustHaveKeywords, setMustHaveKeywords, newMustHaveInput, setNewMustHaveInput)}
                  className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-white cursor-pointer"
                >
                  Add
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. RECRUITER SCREENING QUESTIONS (PREDEFINED ANSWERS) */}
      <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-zinc-400" /> Automated Recruiter Screening Q&A
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Naukri recruiters ask mandatory one-click questionnaire forms. The AI bot answers using these values.
            </p>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">Step 5: Screening Q&A</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Notice Period */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Notice Period
            </label>
            <select
              value={noticePeriod}
              onChange={e => setNoticePeriod(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
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
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Are you willing to relocate?
            </label>
            <select
              value={willingToRelocate}
              onChange={e => setWillingToRelocate(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Open for Hybrid/Remote only">Open for Hybrid / Remote only</option>
            </select>
          </div>

          {/* Career Break */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Are you on a career break?
            </label>
            <select
              value={careerBreak}
              onChange={e => setCareerBreak(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          {/* Active Backlogs */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Any active backlogs / academic gaps?
            </label>
            <select
              value={activeBacklogs}
              onChange={e => setActiveBacklogs(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-500"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        </div>

        {/* Custom Q&A Items */}
        {customQaList.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-zinc-800/60">
            <span className="text-[11px] font-medium text-zinc-400">Additional Custom Screening Answers:</span>
            <div className="space-y-2">
              {customQaList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-black p-2.5 rounded-lg border border-zinc-800 text-xs">
                  <div className="flex-1 text-zinc-300 font-medium truncate">{item.key}</div>
                  <div className="text-zinc-400 font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">{item.val}</div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomQa(idx)}
                    className="text-zinc-500 hover:text-white p-1"
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
            className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          />
          <input
            type="text"
            value={newQaVal}
            onChange={e => setNewQaVal(e.target.value)}
            placeholder="Answer (e.g. Yes)..."
            className="w-full sm:w-48 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Q&A</span>
          </button>
        </form>
      </div>

      {/* 6. EMPLOYMENT HISTORY (EXTRACTED BY AI) */}
      <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" /> Work History & Employers ({employmentHistory.length})
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Verified employment timeline extracted from your resume. Used to answer company-specific questions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddEmpForm(!showAddEmpForm)}
            className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Employer
          </button>
        </div>

        {/* Add Employer Form */}
        {showAddEmpForm && (
          <form onSubmit={handleAddEmployment} className="p-4 rounded-xl bg-black border border-zinc-800 space-y-3 animate-in fade-in">
            <span className="text-xs font-medium text-white block">Add Employment Record</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={newEmpCompany}
                  onChange={e => setNewEmpCompany(e.target.value)}
                  placeholder="e.g. Wipro"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Job Title *</label>
                <input
                  type="text"
                  value={newEmpTitle}
                  onChange={e => setNewEmpTitle(e.target.value)}
                  placeholder="e.g. Software Test Engineer"
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Start Date</label>
                <input
                  type="text"
                  value={newEmpStart}
                  onChange={e => setNewEmpStart(e.target.value)}
                  placeholder="e.g. Jan 2023"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">End Date</label>
                <input
                  type="text"
                  value={newEmpEnd}
                  onChange={e => setNewEmpEnd(e.target.value)}
                  placeholder="e.g. Present"
                  disabled={newEmpCurrent}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white disabled:opacity-50"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newEmpCurrent}
                  onChange={e => {
                    setNewEmpCurrent(e.target.checked)
                    if (e.target.checked) setNewEmpEnd('Present')
                  }}
                  className="rounded bg-zinc-900 border-zinc-700"
                />
                <span>This is my current employer</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmpForm(false)}
                  className="px-3 py-1 rounded text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-white text-black text-xs font-semibold cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Timeline Cards */}
        {employmentHistory.length === 0 ? (
          <p className="text-xs text-zinc-500 italic py-2">
            No past employment records recorded. Click "Auto-Fill with AI" at the top to extract directly from your resume.
          </p>
        ) : (
          <div className="space-y-2.5">
            {employmentHistory.map((emp, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-black border border-zinc-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-white">{emp.company}</span>
                      {emp.is_current && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-400">
                          Current Employer
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
                      <span>{emp.job_title}</span>
                      {(emp.start_date || emp.end_date) && (
                        <>
                          <span className="text-zinc-600">·</span>
                          <span className="font-mono text-[10px] text-zinc-500">
                            {emp.start_date || 'Start'} – {emp.end_date || 'Present'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveEmployment(idx)}
                  className="text-zinc-500 hover:text-rose-400 p-1.5 rounded transition-colors cursor-pointer"
                  title="Remove employment record"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. COMPANY EXCLUSION BLACKLIST */}
      <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Ban className="w-4 h-4 text-zinc-400" /> Company Exclusion Blacklist
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              The autonomous bot will automatically skip and never apply to any job openings at these companies.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              {avoidCompanies.length} Blocked
            </span>
            <button
              type="button"
              onClick={handleExcludeAllMassConsultancies}
              className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition-colors cursor-pointer"
              title="Add top 8 mass consultancies in one tap"
            >
              + Block Top 8 Mass Consultancies
            </button>
          </div>
        </div>

        {/* Quick-Tap Preset Pills */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-mono uppercase text-zinc-500 flex items-center justify-between">
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
                      ? 'bg-zinc-800 border border-zinc-600 text-white shadow-sm'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/90 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={isBlocked ? `Click to unblock ${comp}` : `Click to exclude ${comp}`}
                >
                  {isBlocked ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                      <span>{comp}</span>
                      <span className="text-[9px] text-zinc-400 font-mono">Blocked</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3 text-zinc-500" />
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
            className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-400" />
            <span>Add Custom</span>
          </button>
        </form>

        {/* Active Blacklisted Badges */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-mono uppercase text-zinc-500">
            Active Excluded List ({avoidCompanies.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {avoidCompanies.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">
                No companies currently blacklisted. All matching companies on Naukri are eligible for automated applications.
              </p>
            ) : (
              avoidCompanies.map((comp, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400/80 shrink-0" />
                  <span>{comp}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleBlacklist(comp)}
                    className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors cursor-pointer"
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

      {/* 8. BOT AUTOMATION CONTROLS */}
      <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
              Autonomous Cloud Bot Run Schedule
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              The daemon triggers every morning at 11:00 AM IST to scout and apply to fresh Naukri openings.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabledForDailyRun}
              onChange={e => setEnabledForDailyRun(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>

      {/* 9. PRIMARY ACTION BAR */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#09090b] border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20 backdrop-blur-md shadow-2xl">
        <div className="text-xs text-zinc-400 text-center sm:text-left">
          Make sure your Naukri credentials & target roles are accurate before saving.
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={savingProfile || isAnalyzing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-white hover:bg-zinc-200 text-black transition-all cursor-pointer shadow-lg disabled:opacity-50"
          >
            {savingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{savingProfile ? 'Saving & Syncing...' : 'Save Profile & Sync with Bot'}</span>
          </button>
        </div>
      </div>

      {/* 10. COLLAPSIBLE ADVANCED / DEVELOPER RAW JSON VIEW */}
      <div className="rounded-xl border border-zinc-900 bg-black/40 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowRawJson(!showRawJson)}
          className="w-full p-3.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 flex items-center justify-between transition-colors cursor-pointer bg-zinc-950/60"
        >
          <span className="flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5 text-zinc-500" />
            <span>Developer View: Raw Profile Document JSON (Optional)</span>
          </span>
          {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showRawJson && (
          <div className="p-4 space-y-3 border-t border-zinc-900 bg-black">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-400 font-mono">
                Direct JSON Sync (Auto-updates with visual form above)
              </span>
              {jsonError && (
                <span className="text-[11px] text-rose-400 font-mono">{jsonError}</span>
              )}
            </div>
            <textarea
              rows={16}
              value={rawJsonStr}
              onChange={handleRawJsonChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 leading-relaxed"
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  )
}
