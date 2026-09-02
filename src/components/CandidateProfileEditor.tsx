'use client'

import React, { useEffect, useState } from 'react'
import {
  User,
  FileText,
  FileJson,
  Save,
  CheckCircle2,
  Upload,
  Download,
  RefreshCw,
  Sparkles
} from 'lucide-react'

interface CandidateProfileEditorProps {
  userId?: string
  isNew?: boolean
  isAdmin?: boolean
  onSaveSuccess?: () => void
}

export default function CandidateProfileEditor({
  userId = '',
  isNew = false,
  isAdmin = false,
  onSaveSuccess
}: CandidateProfileEditorProps) {
  const [loading, setLoading] = useState<boolean>(true)
  const [newUserId, setNewUserId] = useState<string>('')

  // Data state
  const [rawJsonStr, setRawJsonStr] = useState<string>('{\n}')
  const [jsonError, setJsonError] = useState<string>('')
  
  // UI state
  const [savingProfile, setSavingProfile] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<string>('')
  const [uploadingResume, setUploadingResume] = useState<boolean>(false)
  const [resumeFilename, setResumeFilename] = useState<string>('')
  const [resumeSuccess, setResumeSuccess] = useState<string>('')
  const [resumeError, setResumeError] = useState<string>('')

  // AI State
  const [showAiPrompt, setShowAiPrompt] = useState<boolean>(false)
  const [aiPrompt, setAiPrompt] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)

  useEffect(() => {
    if (isNew) {
      setLoading(false)
      // Provide a better default JSON template
      setRawJsonStr(JSON.stringify({
        name: "",
        email: "",
        password: "",
        experience: 0,
        current_ctc: 0,
        expected_ctc: 0,
        search_url: "https://www.naukri.com/mnjuser/recommendedjobs",
        skills: ["Skill1", "Skill2"],
        job_filters: {
          location: ["Bangalore", "Remote"],
          keywords: ["Skill1"],
          must_have_keywords: ["Skill1"],
          avoid_companies: ["CurrentCompany Pvt Ltd", "ExCompany Solutions"]
        },
        predefined_answers: {
          "What is your notice period?": "Immediate / 15 Days",
          "Are you on a career break?": "No",
          "Are you willing to relocate to Bangalore?": "Yes"
        }
      }, null, 2))
    } else if (userId) {
      loadProfileData(userId)
    }
  }, [userId, isNew])

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
        setResumeFilename(data.resume_filename || `${uid}_Resume.pdf`)
        setRawJsonStr(data.raw_json || JSON.stringify(data, null, 2))
      }
    } catch (e: any) {
      setJsonError(`Failed to load candidate profile: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveJson = async () => {
    setSavingProfile(true)
    setSaveSuccess('')
    setJsonError('')
    
    if (isNew && !newUserId) {
      setJsonError('Candidate Unique ID is required.')
      setSavingProfile(false)
      return
    }

    try {
      const parsed = JSON.parse(rawJsonStr)
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: isNew ? newUserId : userId,
          raw_json: rawJsonStr,
          ...parsed
        })
      })

      if (res.ok) {
        setSaveSuccess('JSON document synchronized with MongoDB Atlas!')
        if (!isNew) loadProfileData(userId)
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

  const handleAiAutoFill = async () => {
    if (isNew && !newUserId) {
      setJsonError('Candidate Unique ID is required for AI Auto-Fill.')
      return
    }
    

    
    setIsAnalyzing(true)
    setJsonError('')
    try {
      const res = await fetch('/api/profile/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: isNew ? newUserId : userId,
          custom_prompt: aiPrompt
        })
      })
      if (res.ok) {
        const data = await res.json()
        setRawJsonStr(JSON.stringify(data.data, null, 2))
        setShowAiPrompt(false)
        setAiPrompt('')
        setSaveSuccess('AI successfully analyzed the resume and populated the editor!')
        setTimeout(() => setSaveSuccess(''), 5000)
      } else {
        let errMessage = 'Failed to analyze resume with AI.'
        try {
          const err = await res.json()
          errMessage = err.detail || err.error || err.message || errMessage
        } catch {
          // If it fails to parse JSON, it might be an HTML error page. Don't show HTML.
        }
        setJsonError(errMessage)
      }
    } catch (e: any) {
      setJsonError(`AI analysis failed: ${e.message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file.')
      return
    }

    if (isNew && !newUserId) {
      alert('Please enter a Candidate Unique ID before uploading a resume.')
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
            user_id: isNew ? newUserId : userId,
            filename: cleanName,
            file_base64: base64Str,
            file_size_bytes: file.size
          })
        })

        if (res.ok) {
          const data = await res.json()
          setResumeFilename(data.filename)
          setResumeSuccess(`Resume "${data.filename}" uploaded to MongoDB Atlas!`)
          setTimeout(() => setResumeSuccess(''), 5000)
          if (!isNew) loadProfileData(userId)
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
        <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-3 text-indigo-500" />
        Loading candidate profile from MongoDB Atlas...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header status */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-md">
            <FileJson className="w-3.5 h-3.5" /> Advanced Profile Editor
          </div>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-xl border border-emerald-500/30 font-medium animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5" /> {saveSuccess}
          </div>
        )}
      </div>

      {isNew && (
        <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-3 shadow-xl">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4" /> New Candidate Identity
          </h3>
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Candidate Unique ID (e.g. candidate4_john_doe)</label>
            <input
              type="text"
              value={newUserId}
              onChange={e => setNewUserId(e.target.value)}
              required
              placeholder="No spaces, use underscores"
              className="w-full bg-slate-950 border border-indigo-500/30 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
            />
          </div>
        </div>
      )}

      {/* RAW JSON EDITOR VIEW */}
      <div className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
            MongoDB Atlas Profile Document (JSON)
          </span>
          {jsonError && (
            <span className="text-xs text-rose-400 font-semibold">{jsonError}</span>
          )}
        </div>

        <textarea
          rows={22}
          value={rawJsonStr}
          onChange={e => {
            setRawJsonStr(e.target.value)
            setJsonError('')
          }}
          className="w-full bg-[#050811] border border-slate-800 rounded-xl p-5 font-mono text-sm text-cyan-300 focus:outline-none focus:border-indigo-500 leading-relaxed shadow-inner"
          spellCheck={false}
        />

        <div className="flex justify-end gap-3">
          <div className="relative">
            {showAiPrompt && (
              <div className="absolute bottom-full right-0 mb-3 w-80 p-4 bg-slate-900 border border-indigo-500/50 rounded-xl shadow-2xl z-10 animate-fadeIn">
                <label className="block text-xs font-bold text-slate-300 mb-1">Target Job Title & Instructions (Optional)</label>
                <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                  <strong>Example:</strong> "Target Job: Senior Python Developer. I am looking for remote roles only. My expected CTC is 18 LPA. Please do not apply to any crypto or Web3 companies. I have a 30-day notice period."
                </p>
                <textarea
                  rows={4}
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Enter your target job title and specific instructions for the AI to follow when generating your profile..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 mb-3"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowAiPrompt(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors">Cancel</button>
                  <button onClick={handleAiAutoFill} disabled={isAnalyzing} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
                    {isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {isAnalyzing ? 'Analyzing...' : 'Auto-Fill'}
                  </button>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setShowAiPrompt(!showAiPrompt)}
              disabled={savingProfile || isAnalyzing}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-indigo-900/50 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-500 shadow-lg transition-all`}
            >
              <Sparkles className="w-4 h-4" /> ✨ Auto-Fill with AI
            </button>
          </div>

          <button
            onClick={handleSaveJson}
            disabled={savingProfile || isAnalyzing}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold ${
              isAdmin ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-blue-600 hover:bg-blue-500'
            } text-white shadow-lg transition-all`}
          >
            <Save className="w-4 h-4" /> {savingProfile ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Resume PDF in MongoDB Atlas */}
      <div className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 space-y-3 shadow-xl">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4" /> Candidate Resume PDF (Cloud Synchronized)
        </h3>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-mono">
                  {resumeFilename || (isNew ? `${newUserId}_Resume.pdf` : `${userId}_Resume.pdf`)}
                </span>
                {!isNew && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Active in MongoDB Atlas
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Recruiters receive this exact document during automated job applications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {!isNew && (
              <a
                href={`/api/profile/resume?user_id=${userId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Preview PDF
              </a>
            )}

            <label className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold ${
              isAdmin ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-amber-600 hover:bg-amber-500'
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

    </div>
  )
}
