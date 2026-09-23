'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export type ThemeName = 'dark' | 'light'
const STORAGE_KEY = 'jf-theme'

const ThemeContext = createContext<{ theme: ThemeName; toggle: () => void }>({ theme: 'dark', toggle: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

function applyTheme(t: ThemeName) {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('light', t === 'light')
  }
}

/** Reads stored theme (dark default) and keeps <html> in sync. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>('dark')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const initial: ThemeName = stored === 'light' ? 'light' : 'dark'
      setTheme(initial)
      applyTheme(initial)
    } catch {
      applyTheme('dark')
    }
  }, [])

  const toggle = useCallback(() => {
    setTheme(prev => {
      const next: ThemeName = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {}
      applyTheme(next)
      return next
    })
  }, [])

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

/** Sun/moon theme switch. Works on both themes by design (neutral zinc). */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
      className={`p-2 rounded-lg border border-zinc-800 light:border-zinc-300 bg-zinc-950 light:bg-white text-zinc-400 light:text-zinc-600 hover:text-amber-400 light:hover:text-amber-500 hover:border-zinc-700 light:hover:border-zinc-400 transition-colors cursor-pointer ${className}`}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
