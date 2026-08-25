'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, Briefcase, ChevronRight, Mail, Lock, Loader2 } from 'lucide-react'

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
    if ((cleanEmail === 'admin' || cleanEmail === 'admin@jobbot.ai' || cleanEmail === 'admin@admin.com') && cleanPwd === 'admin') {
      localStorage.setItem('user_id', 'admin')
      localStorage.setItem('user_email', 'admin@jobbot.ai')
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
        throw new Error(errData.detail || 'Invalid email or Naukri password.')
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center p-6 md:p-24 relative overflow-hidden bg-[#090a0f] text-white">
      
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="flex-1 text-center md:text-left md:pr-16 z-10"
      >
        <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-2xl mb-6 border border-blue-500/20">
          <Bot className="w-8 h-8 text-blue-400" />
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
          AI Job Bot
        </h1>
        <p className="text-lg text-gray-400 mb-8 max-w-lg">
          Automated multi-candidate job application engine powered by AI and MongoDB Atlas.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center md:items-start text-sm text-gray-500 font-medium">
          <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-400"/> Multi-Candidate Automation</div>
          <div className="hidden sm:block text-gray-700">•</div>
          <div className="flex items-center gap-2"><Bot className="w-4 h-4 text-purple-400"/> AI-Powered Matching</div>
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex-1 w-full max-w-md mt-12 md:mt-0 z-10"
      >
        <div className="glass-panel p-8 w-full border border-gray-800/80 bg-gray-900/60 backdrop-blur-xl rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-2xl font-bold">Sign In</h2>
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Cloud Online
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-6">
            Log in using your Naukri candidate credentials
          </p>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-600 transition-all outline-none"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-600 transition-all outline-none"
                  placeholder="Your Naukri password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In
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
