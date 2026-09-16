'use client'

import React, { useEffect, useRef, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageView } from '@/lib/tracker'

function TrackerInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastTrackedRef = useRef<string>('')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const fullPath = searchParams && searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname

    // Avoid double tracking identical paths in fast succession
    if (lastTrackedRef.current === fullPath) return
    lastTrackedRef.current = fullPath

    // Extract UTM parameters if present
    const utm_source = searchParams?.get('utm_source') || undefined
    const utm_medium = searchParams?.get('utm_medium') || undefined
    const utm_campaign = searchParams?.get('utm_campaign') || undefined
    const ref = searchParams?.get('ref') || undefined

    const metadata: Record<string, any> = {}
    if (utm_source) metadata.utm_source = utm_source
    if (utm_medium) metadata.utm_medium = utm_medium
    if (utm_campaign) metadata.utm_campaign = utm_campaign
    if (ref) metadata.referral_code = ref

    trackPageView(pathname, document.title, metadata)
  }, [pathname, searchParams])

  return null
}

export default function VisitorTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerInner />
    </Suspense>
  )
}
