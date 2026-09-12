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
  const [resumeVersion, setResumeVersion] = useState<number>(Date.now())
  const [resumeSuccess, setResumeSuccess] = useState<string>('')
  const [resumeError, setResumeError] = useState<string>('')

  // AI State
  const [showAiPrompt, setShowAiPrompt] = useState<boolean>(false)
  const [aiPrompt, setAiPrompt] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)

  const effectiveUserId = isNew ? newUserId : userId

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
      const res = await fetch(`/api/profile?user_id=${encodeURIComponent(uid)}&t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        setResumeFilename(data.resume_filename || `${uid}_Resume.pdf`)
        setResumeVersion(Date.now())
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
        setSaveSuccess('Profile configuration synchronized successfully!')
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
      e.target.value = ''
      return
    }

    if (isNew && !newUserId) {
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
            user_id: isNew ? newUserId : userId,
            filename: cleanName,
            file_base64: base64Str,
            file_size_bytes: file.size
          })
        })

        if (res.ok) {
          const data = await res.json()
          setResumeFilename(data.filename)
          setResumeVersion(data.timestamp || Date.now())
          setResumeSuccess(`Resume "${data.filename}" saved to JobFlux Cloud!`)
          setTimeout(() => setResumeSuccess(''), 5000)

          // Keep rawJsonStr in sync so saving JSON later doesn't revert the resume filename
          try {
            const currentObj = JSON.parse(rawJsonStr)
            currentObj.resume_filename = data.filename
            setRawJsonStr(JSON.stringify(currentObj, null, 2))
          } catch {}

          if (!isNew) loadProfileData(userId)
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

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-3 text-sky-500" />
        Loading candidate profile...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header status */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-200">
            <FileJson className="w-3.5 h-3.5 text-zinc-400" /> Advanced Profile Editor
          </div>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> {saveSuccess}
          </div>
        )}
      </div>

      {isNew && (
        <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-zinc-400" /> New Candidate Identity
          </h3>
          <div>
            <label className="block text-zinc-400 text-xs font-medium mb-1">Candidate Unique ID (e.g. candidate4_john_doe)</label>
            <input
              type="text"
              value={newUserId}
              onChange={e => setNewUserId(e.target.value)}
              required
              placeholder="No spaces, use underscores"
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-zinc-500 font-mono text-xs"
            />
          </div>
        </div>
      )}

      {/* RAW JSON EDITOR VIEW */}
      <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-400 font-medium uppercase tracking-wider">
            Candidate Profile Document (JSON)
          </span>
          {jsonError && (
            <span className="text-xs text-red-400 font-medium">{jsonError}</span>
          )}
        </div>

        <textarea
          rows={22}
          value={rawJsonStr}
          onChange={e => {
            setRawJsonStr(e.target.value)
            setJsonError('')
          }}
          className="w-full bg-black border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 leading-relaxed"
          spellCheck={false}
        />

        <div className="flex justify-end gap-3">
          <div className="relative">
            {showAiPrompt && (
              <div className="absolute bottom-full right-0 mb-3 w-80 p-4 bg-[#09090b] border border-zinc-700 rounded-xl shadow-2xl z-10">
                <label className="block text-xs font-medium text-zinc-200 mb-1">Target Job Title & Instructions (Optional)</label>
                <p className="text-[10px] text-zinc-400 mb-2 leading-relaxed">
                  <strong>Example:</strong> "Target Job: Senior Python Developer. Remote roles only. Expected CTC is 18 LPA. Notice period 30 days."
                </p>
                <textarea
                  rows={4}
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Enter your target job title and instructions..."
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-zinc-500 mb-3 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowAiPrompt(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition-colors">Cancel</button>
                  <button onClick={handleAiAutoFill} disabled={isAnalyzing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-colors">
                    {isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {isAnalyzing ? 'Analyzing...' : 'Auto-Fill'}
                  </button>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setShowAiPrompt(!showAiPrompt)}
              disabled={savingProfile || isAnalyzing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" /> Auto-Fill with AI
            </button>
          </div>

          <button
            onClick={handleSaveJson}
            disabled={savingProfile || isAnalyzing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" /> {savingProfile ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Resume PDF Section */}
      <div className="p-5 rounded-2xl bg-[#09090b] border border-zinc-800 space-y-3">
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-zinc-400" /> Candidate Resume PDF
        </h3>

        <div className="p-4 rounded-xl bg-black border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-white">
                  {resumeFilename || (effectiveUserId ? `${effectiveUserId}_Resume.pdf` : 'Candidate_Resume.pdf')}
                </span>
                {(resumeFilename || !isNew) && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-emerald-400 font-mono">
                    Cloud Synced
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Recruiters receive this exact document during automated applications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {effectiveUserId && (
              <a
                href={`/api/profile/resume?user_id=${encodeURIComponent(effectiveUserId)}&t=${resumeVersion}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Preview PDF
              </a>
            )}

            <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-black cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploadingResume ? 'Uploading...' : 'Upload PDF'}</span>
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
          <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> {resumeSuccess}
          </div>
        )}

        {resumeError && (
          <div className="text-xs text-red-400 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> {resumeError}
          </div>
        )}
      </div>
    </div>
  )
}
