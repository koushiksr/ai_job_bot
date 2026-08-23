'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Upload, Loader2, CheckCircle2, FileText, FileJson } from 'lucide-react'
import Link from 'next/link'

export default function ProfileSetup() {
  const [user, setUser] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)
  const [resumeUrl, setResumeUrl] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    current_ctc_annual: '',
    expected_ctc_annual: '',
    my_experience: '',
  })
  
  const [rawJsonStr, setRawJsonStr] = useState('{\n  \n}')
  const [jsonError, setJsonError] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      const userId = localStorage.getItem('user_id')
      if (!userId) {
        window.location.href = '/'
        return
      }
      
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single()
      
      if (error || !data) {
        localStorage.removeItem('user_id')
        window.location.href = '/'
        return
      }

      setUser(data)
      fetchProfile(userId)
    }
    checkAuth()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single()
    if (data) {
      setFormData({
        name: data.name || '',
        current_ctc_annual: data.current_ctc_annual?.toString() || '',
        expected_ctc_annual: data.expected_ctc_annual?.toString() || '',
        my_experience: data.my_experience?.toString() || '',
      })
      
      const config = data.bot_config || {}
      
      if (Object.keys(config).length === 0) {
        const DEFAULT_BOT_CONFIG = {
          "MY_EXPERIENCE": 0,
          "RESUME_FILE": "",
          "CURRENT_CTC_ANNUAL": 0,
          "EXPECTED_CTC_ANNUAL": 0,
          "SEARCH_URL": "",
          "JOB_FILTERS": {
              "location": [],
              "experience": [],
              "job_type": [],
              "keywords": [],
              "must_have_keywords": [],
              "must_not_have_keywords": [],
              "women_only": false,
              "remote_only": false
          }
        }
        setRawJsonStr(JSON.stringify(DEFAULT_BOT_CONFIG, null, 2))
      } else {
        setRawJsonStr(JSON.stringify(config, null, 2))
      }
      
      if (config.RESUME_FILE) {
        setResumeUrl(config.RESUME_FILE)
      }
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return
    const file = e.target.files[0]
    setUploading(true)
    
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.user_id}/${Math.random()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, { upsert: true })
        
      if (uploadError) throw uploadError
      
      const { data } = supabase.storage.from('resumes').getPublicUrl(filePath)
      setResumeUrl(data.publicUrl)
      
      // Attempt to immediately patch the JSON with the new resume
      try {
        const currentJson = JSON.parse(rawJsonStr)
        currentJson.RESUME_FILE = data.publicUrl
        setRawJsonStr(JSON.stringify(currentJson, null, 2))
      } catch (e) {
        // Ignore if JSON is currently invalid
      }
      
      setSuccess('Resume uploaded!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error(error)
      alert("Error uploading resume")
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess('')
    setJsonError('')
    
    let parsedConfig = {}
    try {
      parsedConfig = JSON.parse(rawJsonStr)
    } catch (err) {
      setJsonError("Invalid JSON format. Please fix any syntax errors before saving.")
      setSaving(false)
      return
    }
    
    try {
      const { error } = await supabase.from('profiles').upsert({
        user_id: user.user_id,
        email: user.email,
        name: formData.name,
        current_ctc_annual: parseInt(formData.current_ctc_annual) || 0,
        expected_ctc_annual: parseInt(formData.expected_ctc_annual) || 0,
        my_experience: parseInt(formData.my_experience) || 0,
        bot_config: parsedConfig
      })
      
      if (error) throw error
      setSuccess('Profile saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error(err)
      alert("Error saving profile")
    } finally {
      setSaving(false)
    }
  }

  if (!user) return <div className="min-h-screen bg-[#0a0a0a]" />

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12">
      <header className="max-w-5xl mx-auto mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-6">Profile Setup</h1>
        <p className="text-gray-400 mt-2">Configure the AI bot directly using your preferred JSON schema.</p>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-6"
      >
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-panel p-8 space-y-6">
              <h2 className="text-xl font-semibold mb-4 border-b border-gray-800 pb-2">Basic Info</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Total Experience (Years)</label>
                  <input 
                    type="number" 
                    value={formData.my_experience}
                    onChange={e => setFormData({...formData, my_experience: e.target.value})}
                    className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="3"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Current CTC (in Lacs)</label>
                  <input 
                    type="number" 
                    value={formData.current_ctc_annual}
                    onChange={e => setFormData({...formData, current_ctc_annual: e.target.value})}
                    className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="8"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Expected CTC (in Lacs)</label>
                  <input 
                    type="number" 
                    value={formData.expected_ctc_annual}
                    onChange={e => setFormData({...formData, expected_ctc_annual: e.target.value})}
                    className="w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="12"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="glass-panel p-8 space-y-6">
              <h2 className="text-xl font-semibold mb-4 border-b border-gray-800 pb-2">Resume Upload</h2>
              
              <label className="border-2 border-dashed border-blue-500/30 rounded-xl p-8 flex flex-col items-center justify-center bg-blue-500/5 hover:bg-blue-500/10 transition-colors cursor-pointer relative overflow-hidden group">
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
                ) : (
                  <Upload className="w-8 h-8 text-blue-400 mb-3 group-hover:-translate-y-1 transition-transform" />
                )}
                
                <p className="text-sm font-medium text-white mb-1">
                  {uploading ? 'Uploading securely to cloud...' : 'Click or drag to upload your Resume (PDF)'}
                </p>
                <p className="text-xs text-gray-500">Max file size 5MB. Must be .pdf</p>
              </label>

              {resumeUrl && (
                <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700 mt-4">
                  <FileText className="w-5 h-5 text-green-400" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm text-white font-medium truncate">Resume active in bot memory</p>
                    <a href={resumeUrl} target="_blank" className="text-xs text-blue-400 hover:underline truncate block">
                      {resumeUrl}
                    </a>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel p-8 space-y-6">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-2">
              <FileJson className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-semibold">Raw Configuration JSON</h2>
            </div>
            
            <p className="text-sm text-gray-400 mb-4">
              Edit your advanced bot parameters here. This directly controls the bot's behavior in the backend.
            </p>

            <div className="relative">
              <textarea 
                value={rawJsonStr}
                onChange={e => setRawJsonStr(e.target.value)}
                className="w-full h-[500px] bg-[#1a1b26] border border-gray-800 rounded-xl p-6 text-gray-300 font-mono text-sm leading-relaxed focus:outline-none focus:border-purple-500 transition-colors custom-scrollbar"
                spellCheck={false}
              />
            </div>
            
            {jsonError && (
              <div className="text-red-400 text-sm font-medium flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                {jsonError}
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between pb-12">
            <div className="text-green-400 flex items-center gap-2">
              {success && <><CheckCircle2 className="w-4 h-4" /> {success}</>}
            </div>
            <button 
              type="submit" 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-12 py-4 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Complete Profile
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
