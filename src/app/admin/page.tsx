'use client'

import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, Users, Database, LogOut, PlayCircle, Edit, ExternalLink, Activity, Terminal, X, History } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [userList, setUserList] = useState<any[]>([])
  
  // Terminal Modal State
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<string>('Idle')
  const [logs, setLogs] = useState<string[]>([])
  const [showBrowser, setShowBrowser] = useState<boolean>(false)
  const [userHistories, setUserHistories] = useState<Record<string, any[]>>({})
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({})
  const logsEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // Load expanded state from localStorage
    const saved = localStorage.getItem('adminExpandedUsers')
    if (saved) {
      try { setExpandedUsers(JSON.parse(saved)) } catch(e) {}
    }
  }, [])
  
  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => {
      const next = { ...prev, [userId]: !prev[userId] }
      localStorage.setItem('adminExpandedUsers', JSON.stringify(next))
      return next
    })
  }
  
  useEffect(() => {
    const checkAuth = async () => {
      const userId = localStorage.getItem('user_id')
      if (!userId) {
        // Fallback for local admin access
        setUser({ email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@naukribot.com' })
        fetchUsers()
        return
      }
      
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single()
        if (data) {
          setUser(data)
        } else {
          setUser({ email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@naukribot.com' })
        }
      } catch {
        setUser({ email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@naukribot.com' })
      }
      fetchUsers()
    }
    checkAuth()
  }, [])


  const fetchUsers = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/admin/users`, {
        headers: { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'your-secret-api-key' }
      })
      const data = await res.json()
      if (res.ok) {
        setUserList(data.users)
        // Fetch last 10 logs for each user
        const histories: Record<string, any[]> = {}
        for (const u of data.users) {
          const { data: logsData } = await supabase
            .from('job_logs')
            .select('*')
            .eq('user_id', u.user_id)
            .order('created_at', { ascending: false })
            .limit(10)
          if (logsData) {
            histories[u.user_id] = logsData
          }
        }
        setUserHistories(histories)
      }
    } catch (e) {
      console.error("Failed to fetch users", e)
    }
  }

  const handleRunBot = async (userId: string) => {
    try {
      // 1. Check if user already has an active job
      const checkRes = await fetch(`http://localhost:8000/api/active-job/${userId}`, {
        headers: { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'your-secret-api-key' }
      })
      const checkData = await checkRes.json()
      
      if (checkData.active) {
        // Reconnect to existing job
        setActiveJobId(checkData.job_id)
        setJobStatus('Running')
        return
      }
      
      // 2. Otherwise start a new job
      setJobStatus('Starting...')
      setLogs([])
      setActiveJobId('pending') // Open modal immediately
      
      const res = await fetch('http://localhost:8000/api/start-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'your-secret-api-key'
        },
        body: JSON.stringify({
          profile_path: userId,
          headless: false
        })
      })
      const data = await res.json()
      if (res.ok) {
        setActiveJobId(data.job_id)
        setJobStatus('Running')
      } else {
        setJobStatus('Error: ' + data.detail)
      }
    } catch (err) {
      setJobStatus('Failed to connect to backend')
    }
  }

  // Poll logs for active job
  useEffect(() => {
    if (!activeJobId || activeJobId === 'pending' || jobStatus !== 'Running') return
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/status/${activeJobId}`, {
          headers: { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'your-secret-api-key' }
        })
        const data = await res.json()
        if (data.logs && data.logs.length > 0) {
          setLogs(data.logs)
          logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
        if (data.status === 'completed' || data.status === 'failed') {
          setJobStatus(data.status === 'completed' ? 'Finished ✅' : 'Failed ❌')
          fetchUsers() // refresh stats
        }
      } catch (e) {
        console.error("Polling error", e)
      }
    }, 2000)
    
    return () => clearInterval(interval)
  }, [activeJobId, jobStatus])

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">Loading Admin...</div>

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 relative">
      <header className="flex justify-between items-center mb-12 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-red-500" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
            Admin Console
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
            Go to User Dashboard
          </Link>
          <span className="text-sm text-gray-400">Admin: {user.email}</span>
          <button onClick={() => { localStorage.removeItem('user_id'); window.location.href = '/' }} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <LogOut className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto space-y-6">
        
        {/* System Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 border-red-500/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold text-gray-300">Total Users</h2>
            </div>
            <div className="text-4xl font-bold">{userList.length}</div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <h2 className="font-semibold text-gray-300">Total Applications</h2>
            </div>
            <div className="text-4xl font-bold">
              {userList.reduce((acc, u) => acc + u.total_applied, 0)}
            </div>
          </motion.div>
        </div>

        {/* User Management Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">User Management</h2>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={showBrowser}
                  onChange={(e) => setShowBrowser(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/50"
                />
                Show Browser UI (Debug Mode)
              </label>
              <button onClick={fetchUsers} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                Refresh Data
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-gray-400 uppercase bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Email</th>
                  <th className="px-4 py-3">Applied Today</th>
                  <th className="px-4 py-3">Total Applied</th>
                  <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userList.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-500">No users found</td></tr>
                ) : (
                  userList.map((u, i) => (
                    <React.Fragment key={u.user_id}>
                      <tr className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                        <td className="px-4 py-4 font-medium text-gray-200">{u.email}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.applied_today > 0 ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                            {u.applied_today}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-mono text-gray-400">{u.total_applied}</td>
                        <td className="px-4 py-4 text-right flex items-center justify-end gap-2">
                          <button 
                            onClick={() => toggleUserExpanded(u.user_id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            <History className="w-4 h-4" /> {expandedUsers[u.user_id] ? 'Hide History' : 'View History'}
                          </button>
                          <button 
                            onClick={() => handleRunBot(u.user_id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            <PlayCircle className="w-4 h-4" /> Run Bot
                          </button>
                        </td>
                      </tr>
                      {expandedUsers[u.user_id] && (
                        <tr className="bg-gray-900/30">
                          <td colSpan={4} className="p-4 border-b border-gray-800/50">
                            <div className="pl-4 border-l-2 border-blue-500/30">
                              <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Last 10 Applications</h4>
                              {userHistories[u.user_id]?.length > 0 ? (
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="text-gray-500">
                                      <th className="pb-2 font-medium">Time</th>
                                      <th className="pb-2 font-medium">Job Title</th>
                                      <th className="pb-2 font-medium">Company</th>
                                      <th className="pb-2 font-medium">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {userHistories[u.user_id].map((log: any) => (
                                      <tr key={log.id} className="text-gray-300 border-t border-gray-800/30">
                                        <td className="py-2 text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                                        <td className="py-2">{log.job_title}</td>
                                        <td className="py-2">{log.company_name}</td>
                                        <td className="py-2">
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                            log.status.includes('Success') || log.status.includes('Applied') 
                                              ? 'bg-green-500/10 text-green-400' 
                                              : 'bg-red-500/10 text-red-400'
                                          }`}>
                                            {log.status}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <div className="text-gray-500 text-sm py-2">No history found for this user.</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
        
      </main>

      {/* Terminal Modal */}
      <AnimatePresence>
        {activeJobId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0a0a] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[70vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#111]">
                <div className="flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-green-400" />
                  <span className="font-semibold text-gray-200">Admin Bot Terminal</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                    jobStatus === 'Running' ? 'bg-blue-500/20 text-blue-400' :
                    jobStatus.includes('Error') || jobStatus.includes('Failed') ? 'bg-red-500/20 text-red-400' :
                    jobStatus.includes('Finished') ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {jobStatus}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {jobStatus === 'Running' && (
                    <button 
                      onClick={async () => {
                        if (!activeJobId) return;
                        await fetch(`http://localhost:8000/api/stop-bot/${activeJobId}`, {
                          method: 'POST',
                          headers: { 'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'your-secret-api-key' }
                        });
                        setJobStatus('Stopped');
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold mr-2 transition-colors"
                    >
                      Stop Bot
                    </button>
                  )}
                  <button onClick={() => setActiveJobId(null)} className="p-1 hover:bg-gray-800 rounded-full transition-colors text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-[#1a1b26] p-6 overflow-y-auto font-mono text-sm leading-relaxed custom-scrollbar">
                {logs.length === 0 ? (
                  <div className="text-gray-500 italic">Awaiting bot output...</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="mb-2 text-gray-300">
                      {log.startsWith('[') ? (
                        <>
                          <span className="text-blue-400">{log.substring(0, log.indexOf(']') + 1)}</span>
                          <span className={log.includes('✅') || log.includes('Success') ? 'text-green-400 ml-2' : log.includes('❌') || log.includes('Failed') ? 'text-red-400 ml-2' : 'ml-2'}>
                            {log.substring(log.indexOf(']') + 1)}
                          </span>
                        </>
                      ) : (
                        <span className={log.includes('✅') ? 'text-green-400' : log.includes('❌') ? 'text-red-400' : ''}>{log}</span>
                      )}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
