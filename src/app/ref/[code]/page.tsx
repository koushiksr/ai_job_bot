'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Loader2 from 'lucide-react/dist/esm/icons/loader-2'

export default function RefCodePage() {
  const params = useParams()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const rawCode = params?.code
    const code = Array.isArray(rawCode) ? rawCode[0] : (rawCode || '')

    if (code) {
      try {
        localStorage.setItem('jobflux_referral_code', code.trim().toUpperCase())
      } catch (_) {}
    }

    const targetUrl = code 
      ? `/?mode=free&ref=${encodeURIComponent(code.trim().toUpperCase())}`
      : '/?mode=free'

    window.location.replace(targetUrl)
  }, [params])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white font-sans p-4">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-zinc-400 font-mono">Activating referral pass...</p>
      </div>
    </div>
  )
}
