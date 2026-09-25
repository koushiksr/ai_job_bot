'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Loader2 from 'lucide-react/dist/esm/icons/loader-2'

function RegisterRedirectContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const ref = searchParams?.get('ref') || searchParams?.get('referral') || ''
    if (ref) {
      try {
        localStorage.setItem('jobflux_referral_code', ref.trim().toUpperCase())
      } catch (_) {}
    }

    const targetUrl = ref 
      ? `/login?mode=signup&ref=${encodeURIComponent(ref.trim().toUpperCase())}`
      : '/login?mode=signup'

    window.location.replace(targetUrl)
  }, [searchParams])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white font-sans p-4">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-zinc-400 font-mono">Redirecting to candidate registration...</p>
      </div>
    </div>
  )
}

export default function RegisterRedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white font-sans p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <p className="text-sm text-zinc-400 font-mono">Loading...</p>
        </div>
      </div>
    }>
      <RegisterRedirectContent />
    </Suspense>
  )
}
