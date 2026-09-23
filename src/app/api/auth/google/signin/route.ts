import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { getGoogleOAuthConfig } from '@/lib/googleAuth'

export async function GET(req: NextRequest) {
  let redirectUri: string
  let clientId: string
  try {
    const cfg = getGoogleOAuthConfig(req)
    redirectUri = cfg.redirectUri
    clientId = cfg.clientId
  } catch (e: any) {
    const errorMsg = encodeURIComponent(e.message || 'Google OAuth is not configured.')
    return NextResponse.redirect(new URL(`/?error=${errorMsg}`, req.url))
  }

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  googleAuthUrl.searchParams.set('client_id', clientId)
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri)
  googleAuthUrl.searchParams.set('response_type', 'code')
  googleAuthUrl.searchParams.set('scope', 'openid email profile')
  googleAuthUrl.searchParams.set('prompt', 'select_account')
  googleAuthUrl.searchParams.set('access_type', 'offline')

  return NextResponse.redirect(googleAuthUrl.toString())
}
