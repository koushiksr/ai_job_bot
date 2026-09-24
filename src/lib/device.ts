/**
 * Device identity for login audit + trust exceptions.
 *
 * Browsers cannot expose MAC addresses, so uniqueness comes from a
 * stable client-generated UUID (`jf_device_id`, persisted in localStorage
 * and mirrored to a readable cookie for OAuth-redirect flows), enriched
 * server-side with IP + parsed UA. The worker daemon additionally records
 * real MAC/hostname on task claims; both funnel into the same audit trail.
 */

/** Parse OS + browser from a user-agent string (no dependencies). */
export function parseDeviceInfo(userAgent: string): { os: string; browser: string; label: string } {
  const ua = userAgent || ''
  let os = 'Unknown OS'
  if (/Windows NT 10/i.test(ua)) os = 'Windows'
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/iPhone|iPad|iOS/i.test(ua)) os = 'iOS'
  else if (/Linux/i.test(ua)) os = 'Linux'
  else if (/CrOS/i.test(ua)) os = 'ChromeOS'

  let browser = 'Unknown browser'
  if (/Edg\//i.test(ua)) browser = 'Edge'
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera'
  else if (/Chrome\//i.test(ua)) browser = 'Chrome'
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari'
  else if (/Firefox\//i.test(ua)) browser = 'Firefox'

  return { os, browser, label: `${browser} on ${os}` }
}

export function shortDeviceId(id?: string | null): string {
  if (!id) return 'unknown-device'
  const clean = String(id).replace(/[^a-zA-Z0-9]/g, '')
  return clean ? clean.slice(0, 8) : 'unknown-device'
}
