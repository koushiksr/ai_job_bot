/**
 * Central Application Configuration
 * 
 * Single source of truth for global metadata, administrative accounts,
 * support contacts, brand assets, and test delivery configurations.
 * 
 * Update this file to modify company-wide settings across the entire platform.
 */

export const APP_CONFIG = {
  name: 'JobFlux AI',
  tagline: 'Autonomous AI Job Application Engine',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://jobfluxai.vercel.app',
  
  // Support and operational contact
  supportEmail: 'technohmsit@gmail.com',
  supportPhone: '+91 99999 99999',
  
  // Master Administrator Credentials - strictly technohmsit only
  masterAdminId: 'technohmsit',
  adminEmails: [
    'technohmsit@gmail.com'
  ] as string[],

  // Default testing and preview recipients
  defaultTestRecipients: [
    'koushiksrmedala@gmail.com',
    'koushiksr1999@gmail.com',
    'technohmsit@gmail.com'
  ],

  // Platform brand assets
  assets: {
    logoSvg: '/icon.svg',
    iconPng: '/images/icon.png',
    logoPng: '/images/icon.png',
    favicon: '/icon.svg'
  }
} as const

/**
 * Check if a given email address or user ID belongs to the administrator.
 * Strictly restricted to technohmsit@gmail.com.
 */
export function isAdminUser(identifier?: string | null): boolean {
  if (!identifier) return false
  const clean = identifier.toLowerCase().trim()
  return clean === 'technohmsit' || clean === 'technohmsit@gmail.com'
}
