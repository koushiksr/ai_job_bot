'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Bot, Briefcase, ChevronRight, Mail, Lock, Loader2, Shield, User, Key, Wifi, WifiOff } from 'lucide-react'
import { bootstrapEngineUrl, discoverEngineUrl, saveActiveEngineUrl } from '@/lib/engineDiscovery'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLocalEnv, setIsLocalEnv] = useState(false)
  const [discoveredUrl, setDiscoveredUrl] = useState<string | null>(null)
  const [engineStatus, setEngineStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  // Detect environment and probe reachable engine URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname
      setIsLocalEnv(host === 'localhost' || host === '127.0.0.1')
    }

    bootstrapEngineUrl().then(url => {
      if (url) {
        setDiscoveredUrl(url)
        setEngineStatus('online')
      } else {
        setEngineStatus('offline')
      }
    })
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const cleanEmail = email.trim().toLowerCase()
    const cleanPwd = password.trim()

    // 1. Direct Admin Access Check (Password: admin)
    if ((cleanEmail === 'admin' || cleanEmail === 'admin@jobbot.ai' || cleanEmail === 'admin@admin.com') && cleanPwd === 'admin') {
      localStorage.setItem('user_id', 'admin')
      localStorage.setItem('user_email', 'admin@jobbot.ai')
      localStorage.setItem('user_role', 'admin')
      window.location.href = '/admin'
      return
    }

    try {
      if (isLogin) {
        // 1. Try Internal MongoDB Cloud API Login
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
            return
          } else if (res.status === 401) {
            const errData = await res.json().catch(() => ({}))
            throw new Error(errData.detail || 'Invalid email or Naukri password.')
          }
        } catch (fetchErr: any) {
          if (fetchErr.message && fetchErr.message.includes('Invalid email or Naukri password')) {
            throw fetchErr
          }
          console.warn('API login failed, trying fallback:', fetchErr)
        }

        // 2. Fallback to Supabase Login (if configured)
        try {
          const { data, error: sbError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', cleanEmail)
            .eq('password', cleanPwd)
            .single()

          if (data) {
            localStorage.setItem('user_id', data.user_id)
            localStorage.setItem('user_email', data.email)
            window.location.href = '/dashboard'
            return
          }
        } catch {
          // Supabase not reachable
        }

        throw new Error('Invalid email or Naukri password. Check your profile credentials.')
      } else {
        // Sign Up Flow
        const userId = crypto.randomUUID()
        const { error } = await supabase.from('profiles').insert([{ 
          user_id: userId, 
          email: email, 
          password: password, 
          name: email.split('@')[0],
          is_active: true,
          bot_config: {}
        }])
        
        if (error) {
            if (error.code === '23505') throw new Error('Email already exists')
            throw error
        }
        
        localStorage.setItem('user_id', userId)
        localStorage.setItem('user_email', email)
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error')
    } finally {
      setLoading(false)
    }
  }

  const fillCreds = (em: string, pw: string) => {
    setEmail(em)
    setPassword(pw)
    setError('')
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
          Automated multi-candidate job application bot with daily 6 AM & 8 AM scheduling, AI questionnaire answering, and live stats.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center md:items-start text-sm text-gray-500 font-medium">
          <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-400"/> Multi-Profile Management</div>
          <div className="hidden sm:block text-gray-700">•</div>
          <div className="flex items-center gap-2"><Bot className="w-4 h-4 text-purple-400"/> Python 3.13 & uv Engine</div>
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
            <h2 className="text-2xl font-bold">
              {isLogin ? 'Sign In to Portal' : 'Create an Account'}
            </h2>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
              engineStatus === 'online'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : engineStatus === 'checking'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                engineStatus === 'online' ? 'bg-emerald-400 animate-pulse' : engineStatus === 'checking' ? 'bg-amber-400 animate-pulse' : 'bg-rose-400'
              }`} />
              {engineStatus === 'online' ? (discoveredUrl?.includes('ts.net') || discoveredUrl?.includes('trycloudflare.com') ? 'Global Engine' : 'Local Engine') : engineStatus === 'checking' ? 'Connecting...' : 'Engine Offline'}
            </div>
          </div>
          <p className="text-gray-400 mb-6 text-xs">
            {isLogin ? 'Use your candidate email & password, or admin credentials.' : 'Set up your candidate account.'}
          </p>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Email Address or Username</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/50 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="admin@jobbot.ai or user email"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Password"
                  required
                />
              </div>
            </div>

            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>}
            {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">{success}</div>}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl py-3 mt-2 transition-all flex items-center justify-center gap-2 text-xs shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  {isLogin ? 'Sign In' : 'Sign Up'}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Autofill Helper */}
          <div className="mt-6 pt-4 border-t border-gray-800/80">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Key className="w-3 h-3 text-amber-400" /> Candidate Naukri Credentials</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
            </div>
            
            <div className="space-y-1.5 text-xs">
              <button
                type="button"
                onClick={() => fillCreds('koushiksr1999@gmail.com', 'qohcyt-hobsEx-1xirco')}
                className="w-full p-2 bg-black/40 hover:bg-gray-800/60 rounded-lg border border-gray-800 text-left flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-semibold text-gray-300 group-hover:text-white">Koushik S R</span>
                </div>
                <span className="text-[10px] font-mono text-gray-400">koushiksr1999@gmail.com</span>
              </button>

              <button
                type="button"
                onClick={() => fillCreds('rakshithadl2003@gmail.com', 'Rakshitha@123')}
                className="w-full p-2 bg-black/40 hover:bg-gray-800/60 rounded-lg border border-gray-800 text-left flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-semibold text-gray-300 group-hover:text-white">Rakshitha D L</span>
                </div>
                <span className="text-[10px] font-mono text-gray-400">rakshithadl2003@gmail.com</span>
              </button>

              <button
                type="button"
                onClick={() => fillCreds('admin@jobbot.ai', 'admin')}
                className="w-full p-2 bg-black/40 hover:bg-gray-800/60 rounded-lg border border-gray-800 text-left flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-red-400" />
                  <span className="font-semibold text-gray-300 group-hover:text-white">Admin Controller</span>
                </div>
                <span className="text-[10px] font-mono text-gray-400">admin@jobbot.ai / admin</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

