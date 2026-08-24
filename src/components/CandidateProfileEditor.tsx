'use client'

import React, { useEffect, useState } from 'react'
import {
  User,
  Briefcase,
  Sliders,
  HelpCircle,
  FileText,
  FileJson,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  Upload,
  Download,
  RefreshCw
} from 'lucide-react'

interface CandidateProfileEditorProps {
  userId: string
  isAdmin?: boolean
  onSaveSuccess?: () => void
}

export default function CandidateProfileEditor({
  userId,
  isAdmin = false,
  onSaveSuccess
}: CandidateProfileEditorProps) {
  const [profileSubTab, setProfileSubTab] = useState<'form' | 'json'>('form')
  const [loading, setLoading] = useState<boolean>(true)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    experience: 0,
    current_ctc: 0,
    expected_ctc: 0,
    search_url: '',
    skills_str: '',
    locations_str: '',
    notice_period: 'Immediate / 15 Days',
    career_break: 'No',
    relocate: 'Yes'
  })

  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [rawJsonStr, setRawJsonStr] = useState<string>('{\n}')
  const [jsonError, setJsonError] = useState<string>('')
  const [savingProfile, setSavingProfile] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<string>('')
  const [uploadingResume, setUploadingResume] = useState<boolean>(false)
  const [resumeFilename, setResumeFilename] = useState<string>('')
  const [resumeSuccess, setResumeSuccess] = useState<string>('')
  const [resumeError, setResumeError] = useState<string>('')

  // Load Profile on Mount or userId change
  useEffect(() => {
    if (userId) {
      loadProfileData(userId)
    }
  }, [userId])

  const loadProfileData = async (uid: string) => {
    setLoading(true)
    setSaveSuccess('')
    setJsonError('')
    setResumeSuccess('')
    setResumeError('')

    try {
      const res = await fetch(`/api/profile?user_id=${uid}`)
      if (res.ok) {
        const data = await res.json()
        const skillsArr = data.skills || data.job_filters?.keywords || []
        const locArr = data.job_filters?.location || []
        const answers = data.predefined_answers || {}

        setFormData({
          name: data.name || '',
          email: data.email || '',
          password: '',
          experience: data.experience || 0,
          current_ctc: data.current_ctc || 0,
          expected_ctc: data.expected_ctc || 0,
          search_url: data.search_url || '',
          skills_str: Array.isArray(skillsArr) ? skillsArr.join(', ') : '',
          locations_str: Array.isArray(locArr) ? locArr.join(', ') : '',
          notice_period: answers['What is your notice period?'] || answers['notice_period'] || 'Immediate / 15 Days',
          career_break: answers['Are you on a career break?'] || 'No',
          relocate: answers['Are you willing to relocate to Bangalore?'] || answers['willing_to_relocate'] || 'Yes'
        })
        setResumeFilename(data.resume_filename || `${uid}_Resume.pdf`)
        setRawJsonStr(data.raw_json || JSON.stringify(data, null, 2))
      }
    } catch (e: any) {
      setJsonError(`Failed to load candidate profile: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setSaveSuccess('')
    setJsonError('')

    const skills = formData.skills_str.split(',').map(s => s.trim()).filter(Boolean)
    const locations = formData.locations_str.split(',').map(s => s.trim()).filter(Boolean)
    const predefined_answers = {
      'What is your notice period?': formData.notice_period,
      'Are you on a career break?': formData.career_break,
      'Are you willing to relocate to Bangalore?': formData.relocate,
      'Are you comfortable working from office / hybrid?': 'Yes',
      'What is your current CTC?': `${formData.current_ctc ? Math.round(formData.current_ctc / 100000) : 0} LPA`,
      'What is your expected CTC?': `${formData.expected_ctc ? Math.round(formData.expected_ctc / 100000) : 0} LPA`
    }
    const job_filters = {
      location: locations.length ? locations : ['Bangalore', 'Bengaluru', 'Remote', 'Hybrid'],
      keywords: skills,
      must_have_keywords: skills.slice(0, 1)
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: formData.name,
          email: formData.email,
          ...(formData.password ? { password: formData.password } : {}),
          experience: formData.experience,
          current_ctc: formData.current_ctc,
          expected_ctc: formData.expected_ctc,
          search_url: formData.search_url,
          skills: skills,
          job_filters: job_filters,
          predefined_answers: predefined_answers,
          resume_filename: resumeFilename
        })
      })

      if (res.ok) {
        setSaveSuccess('Candidate profile saved successfully in MongoDB Atlas!')
        loadProfileData(userId)
        if (onSaveSuccess) onSaveSuccess()
        setTimeout(() => setSaveSuccess(''), 4000)
      } else {
        const data = await res.json()
        setJsonError(data.detail || 'Failed to save profile.')
      }
    } catch (err: any) {
      setJsonError(err.message || 'Error saving profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveJson = async () => {
    setSavingProfile(true)
    setSaveSuccess('')
    setJsonError('')

    try {
      const parsed = JSON.parse(rawJsonStr)
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          raw_json: rawJsonStr,
          ...parsed
        })
      })

      if (res.ok) {
        setSaveSuccess('JSON document synchronized with MongoDB Atlas!')
        loadProfileData(userId)
        if (onSaveSuccess) onSaveSuccess()
        setTimeout(() => setSaveSuccess(''), 4000)
      } else {
        const data = await res.json()
        setJsonError(data.detail || 'Failed to save JSON.')
      }
    } catch (e: any) {
      setJsonError(`Invalid JSON syntax: ${e.message}`)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file.')
      return
    }

    setUploadingResume(true)
    setResumeSuccess('')
    setResumeError('')

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64Str = (reader.result as string).split(',')[1]
        // Preserve user-uploaded exact filename
        const cleanName = file.name.trim()

        const res = await fetch('/api/profile/resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            filename: cleanName,
            file_base64: base64Str,
            file_size_bytes: file.size
          })
        })

        if (res.ok) {
          const data = await res.json()
          setResumeFilename(data.filename)
          setResumeSuccess(`Resume "${data.filename}" (${Math.round(file.size / 1024)} KB) uploaded & saved to MongoDB Atlas!`)
          setTimeout(() => setResumeSuccess(''), 5000)
          loadProfileData(userId)
          if (onSaveSuccess) onSaveSuccess()
        } else {
          const err = await res.json().catch(() => ({}))
          setResumeError(err.detail || 'Failed to upload resume.')
          setTimeout(() => setResumeError(''), 5000)
        }
        setUploadingResume(false)
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      setResumeError(`Error reading file: ${err.message}`)
      setUploadingResume(false)
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-3 text-blue-500" />
        Loading candidate profile from MongoDB Atlas...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sub-tab Switcher: Visual Form vs Raw JSON */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setProfileSubTab('form')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              profileSubTab === 'form'
                ? isAdmin ? 'bg-indigo-600 text-white shadow-md' : 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Structured Form
          </button>
          <button
            type="button"
            onClick={() => setProfileSubTab('json')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              profileSubTab === 'json'
                ? isAdmin ? 'bg-indigo-600 text-white shadow-md' : 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" /> Raw JSON Editor
          </button>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-xl border border-emerald-500/30 font-medium animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5" /> {saveSuccess}
          </div>
        )}
      </div>

      {/* 1. VISUAL FORM VIEW */}
      {profileSubTab === 'form' && (
        <form onSubmit={handleSaveForm} className="space-y-4">
          {/* Card 1: Account Credentials */}
          <div className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" /> Naukri Account & Login Credentials
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Candidate Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Naukri Login Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Naukri Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Leave blank to keep unchanged"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-9 py-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Experience & Compensation */}
          <div className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Professional Experience & Compensation
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Total Experience (Years)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.experience}
                  onChange={e => setFormData({ ...formData, experience: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Current Annual CTC (₹ INR)</label>
                <input
                  type="number"
                  value={formData.current_ctc}
                  onChange={e => setFormData({ ...formData, current_ctc: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Expected Annual CTC (₹ INR)</label>
                <input
                  type="number"
                  value={formData.expected_ctc}
                  onChange={e => setFormData({ ...formData, expected_ctc: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Skills, Keywords & Locations */}
          <div className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4" /> Target Skills, Keywords & Locations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Primary Skills (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="Python, FastAPI, Django, AI, LLM, PyTorch"
                  value={formData.skills_str}
                  onChange={e => setFormData({ ...formData, skills_str: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Preferred Locations (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="Bangalore, Bengaluru, Remote, Hybrid"
                  value={formData.locations_str}
                  onChange={e => setFormData({ ...formData, locations_str: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Naukri Recommended / Search URL (Universal Default: <code className="text-slate-400 bg-slate-900 px-1 py-0.5 rounded">https://www.naukri.com/mnjuser/recommendedjobs</code>)
                </label>
                <input
                  type="url"
                  value={formData.search_url}
                  onChange={e => setFormData({ ...formData, search_url: e.target.value })}
                  placeholder="https://www.naukri.com/mnjuser/recommendedjobs"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Predefined Recruiter Questionnaire Answers */}
          <div className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> Predefined Recruiter Questionnaire Answers
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Notice Period</label>
                <input
                  type="text"
                  placeholder="Immediate / 15 Days"
                  value={formData.notice_period}
                  onChange={e => setFormData({ ...formData, notice_period: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Career Break?</label>
                <select
                  value={formData.career_break}
                  onChange={e => setFormData({ ...formData, career_break: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Willing to Relocate?</label>
                <select
                  value={formData.relocate}
                  onChange={e => setFormData({ ...formData, relocate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 5: Resume PDF in MongoDB Atlas */}
          <div className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" /> Candidate Resume PDF (Cloud Synchronized)
            </h3>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">
                      {resumeFilename || `${userId}_Resume.pdf`}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Active in MongoDB Atlas
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Recruiters receive this exact document during automated job applications.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <a
                  href={`/api/profile/resume?user_id=${userId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Preview PDF
                </a>

                <label className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold ${
                  isAdmin ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-blue-600 hover:bg-blue-500'
                } text-white cursor-pointer shadow-md transition-all`}>
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
              </div>
            </div>

            {resumeSuccess && (
              <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5" /> {resumeSuccess}
              </div>
            )}

            {resumeError && (
              <div className="text-xs text-rose-400 flex items-center gap-1.5 font-medium animate-fadeIn">
                <span className="w-2 h-2 rounded-full bg-rose-400" /> {resumeError}
              </div>
            )}
          </div>

          {jsonError && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
              {jsonError}
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold ${
                isAdmin
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white shadow-lg shadow-blue-500/25'
              } transition-all`}
            >
              <Save className="w-4 h-4" />
              {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      )}

      {/* 2. RAW JSON EDITOR VIEW */}
      {profileSubTab === 'json' && (
        <div className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              MongoDB Atlas Raw Profile Document (JSON)
            </span>
            {jsonError && (
              <span className="text-xs text-rose-400 font-semibold">{jsonError}</span>
            )}
          </div>

          <textarea
            rows={20}
            value={rawJsonStr}
            onChange={e => {
              setRawJsonStr(e.target.value)
              setJsonError('')
            }}
            className="w-full bg-[#050811] border border-slate-800 rounded-xl p-4 font-mono text-xs text-cyan-300 focus:outline-none focus:border-blue-500"
            spellCheck={false}
          />

          <div className="flex justify-end">
            <button
              onClick={handleSaveJson}
              disabled={savingProfile}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold ${
                isAdmin ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-blue-600 hover:bg-blue-500'
              } text-white shadow-lg`}
            >
              <Save className="w-4 h-4" /> {savingProfile ? 'Saving...' : 'Save JSON'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
