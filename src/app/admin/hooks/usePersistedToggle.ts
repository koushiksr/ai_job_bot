import { useState } from 'react'

/**
 * Boolean UI state persisted to localStorage, with a stable toggle.
 * Lazy-reads storage on init (SSR-safe) so restored preferences apply on
 * first paint instead of flickering in via a post-mount effect.
 */
export function usePersistedToggle(storageKey: string, initial = false): [boolean, () => void] {
  const [value, setValue] = useState<boolean>(() => {
    if (typeof window === 'undefined') return initial
    try {
      const saved = localStorage.getItem(storageKey)
      return saved !== null ? saved === 'true' : initial
    } catch {
      return initial
    }
  })

  const toggle = () => {
    setValue(prev => {
      const next = !prev
      try {
        localStorage.setItem(storageKey, String(next))
      } catch {}
      return next
    })
  }

  return [value, toggle]
}
