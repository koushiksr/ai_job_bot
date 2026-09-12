'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, ChevronRight, Mail, Lock, Loader2, Sparkles } from 'lucide-react'
import JobFluxLogo from '@/components/JobFluxLogo'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const cleanEmail = email.trim().toLowerCase()
    const cleanPwd = password.trim()

    // Direct Admin check
    if (
      (
        cleanEmail === 'admin' ||
        cleanEmail === 'admin@jobfluxai.com' ||
        cleanEmail === 'admin@jobflux.ai' ||
        cleanEmail === 'admin@jobbot.ai' ||
        cleanEmail === 'admin@admin.com'
      ) &&
      cleanPwd === 'admin'
    ) {
      localStorage.setItem('user_id', 'admin')
      localStorage.setItem('user_email', cleanEmail.includes('@') ? cleanEmail : 'admin@jobfluxai.com')
      localStorage.setItem('user_role', 'admin')
      window.location.href = '/admin'
      return
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPwd })
      })

      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('user_id', data.user_id)
        localStorage.setItem('user_email', data.email)
        localStorage.setItem('user_role', data.role)
        if (data.role === 'admin') {
          window.location.href = '/admin'
        } else {
          window.location.href = '/dashboard'
        }
      } else {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Invalid email or password.')
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center p-6 md:p-24 relative overflow-hidden bg-[#080c14] text-slate-100">
      
      {/* Subtle, standard clean background highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(37,99,235,0.12),rgba(255,255,255,0))] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 text-center md:text-left md:pr-16 z-10"
      >
        <div className="mb-6 inline-flex">
          <JobFluxLogo size="lg" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-white leading-tight">
          Autonomous Job Application Engine
        </h1>
        
        <p className="text-base md:text-lg text-slate-400 mb-8 max-w-lg leading-relaxed">
          Intelligent job search and automated application delivery. Streamline your job hunt with precision AI candidate profile matching.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center md:items-start text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Briefcase className="w-4 h-4 text-sky-400" />
            <span>Multi-Candidate Automation</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>AI Matching & Answer Engine</span>
          </div>
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="flex-1 w-full max-w-md mt-12 md:mt-0 z-10"
      >
        <div className="p-8 w-full border border-slate-800 bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold text-white">Sign In</h2>
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Cloud Online
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Log in with your candidate credentials
          </p>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl text-xs mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Candidate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 transition-all outline-none"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 transition-all outline-none"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
