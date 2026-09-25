import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/app/version — Android shell version info (public, no auth).
 * The APK is a thin native shell over the live site: all content is dynamic,
 * so this only matters when the shell itself needs an update.
 */
export async function GET(_req: NextRequest) {
  const version = process.env.APK_VERSION || '1.0.0'
  const apkUrl = process.env.APK_DOWNLOAD_URL || ''
  return NextResponse.json({
    status: 'success',
    app: 'JobFlux AI',
    version,
    min_version: process.env.APK_MIN_VERSION || '1.0.0',
    apk_available: Boolean(apkUrl),
    update_url: '/api/app/download',
    notes: 'Shell update required only for native changes. Web content updates deploy instantly.'
  })
}
