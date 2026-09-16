// PWA Helper: Cross-platform installation detection, device telemetry, and install state management

export interface DeviceEnvironment {
  isDesktop: boolean
  isMobile: boolean
  isIOS: boolean
  isAndroid: boolean
  os: 'mac' | 'windows' | 'linux' | 'ios' | 'android' | 'other'
  browser: 'chrome' | 'edge' | 'safari' | 'firefox' | 'other'
  isMacSafari: boolean
  browserName: string
  osName: string
}

export function getDeviceEnvironment(): DeviceEnvironment {
  if (typeof window === 'undefined') {
    return {
      isDesktop: true,
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      os: 'other',
      browser: 'other',
      isMacSafari: false,
      browserName: 'Browser',
      osName: 'Desktop'
    }
  }

  const ua = window.navigator.userAgent || ''
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
  const isAndroid = /Android/i.test(ua)
  const isMobile = isIOS || isAndroid || /Mobi|Tablet|mobile/i.test(ua)
  const isDesktop = !isMobile

  let os: DeviceEnvironment['os'] = 'other'
  let osName = 'Desktop'
  if (isIOS) {
    os = 'ios'
    osName = 'iOS (iPhone/iPad)'
  } else if (isAndroid) {
    os = 'android'
    osName = 'Android'
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'mac'
    osName = 'macOS'
  } else if (/Windows/i.test(ua)) {
    os = 'windows'
    osName = 'Windows'
  } else if (/Linux/i.test(ua)) {
    os = 'linux'
    osName = 'Linux'
  }

  let browser: DeviceEnvironment['browser'] = 'other'
  let browserName = 'Browser'
  if (/Edg/i.test(ua)) {
    browser = 'edge'
    browserName = 'Microsoft Edge'
  } else if (/Chrome|CriOS/i.test(ua)) {
    browser = 'chrome'
    browserName = 'Google Chrome'
  } else if (/Safari/i.test(ua) && !/Chrome|CriOS|Edg/i.test(ua)) {
    browser = 'safari'
    browserName = 'Apple Safari'
  } else if (/Firefox|FxiOS/i.test(ua)) {
    browser = 'firefox'
    browserName = 'Mozilla Firefox'
  }

  const isMacSafari = os === 'mac' && browser === 'safari'

  return {
    isDesktop,
    isMobile,
    isIOS,
    isAndroid,
    os,
    browser,
    isMacSafari,
    browserName,
    osName
  }
}

/**
 * Multi-tier verification to determine if JobFlux AI is already installed:
 * 1. Current window is running standalone (display-mode: standalone or navigator.standalone)
 * 2. Persistent storage flag (jobflux_pwa_installed === 'true')
 * 3. Browser native API (navigator.getInstalledRelatedApps)
 */
export async function checkIsPwaInstalled(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
    // 1. Standalone display mode (PWA is currently running as installed app)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')

    if (isStandalone) {
      markPwaAsInstalled()
      return true
    }

    // 2. Persistent LocalStorage flag saved from previous installation / standalone session
    if (localStorage.getItem('jobflux_pwa_installed') === 'true') {
      return true
    }

    // 3. Modern Chromium API check (navigator.getInstalledRelatedApps)
    if ('getInstalledRelatedApps' in navigator && typeof (navigator as any).getInstalledRelatedApps === 'function') {
      const apps = await (navigator as any).getInstalledRelatedApps()
      if (Array.isArray(apps) && apps.length > 0) {
        markPwaAsInstalled()
        return true
      }
    }
  } catch (err) {
    console.warn('[PWA Helper] Error verifying installed apps:', err)
  }

  return false
}

/**
 * Mark the PWA as permanently installed in this browser/device
 */
export function markPwaAsInstalled(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('jobflux_pwa_installed', 'true')
    localStorage.removeItem('jobflux_pwa_dismissed_at')
  } catch (e) {
    // LocalStorage might be disabled in private mode
  }
}

/**
 * Mark the PWA as uninstalled (in case user resets or tests)
 */
export function unmarkPwaAsInstalled(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('jobflux_pwa_installed')
  } catch (e) {}
}

/**
 * Record when the user explicitly dismissed the install prompt
 */
export function markPwaAsDismissed(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('jobflux_pwa_dismissed_at', String(Date.now()))
  } catch (e) {}
}

/**
 * Determines whether the PWA modal should auto-open:
 * Returns false if already installed, if running standalone, or if dismissed within 3 days.
 */
export async function shouldShowPwaAutoPrompt(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const isInstalled = await checkIsPwaInstalled()
  if (isInstalled) return false

  try {
    const dismissedAt = localStorage.getItem('jobflux_pwa_dismissed_at')
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 3) {
        return false
      }
    }
  } catch (e) {
    return false
  }

  return true
}
