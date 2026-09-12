import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!clientId) {
    const errorMsg = encodeURIComponent(
      'Google Client ID is missing. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment.'
    )
    return NextResponse.redirect(new URL(`/?error=${errorMsg}`, req.url))
  }

  // Determine host and protocol
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https'
  const host = req.headers.get('host') || 'jobfluxai.vercel.app'
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || `${forwardedProto}://${host}`).replace(/\/+$/, '')
  const redirectUri = `${appUrl}/api/auth/callback/google`

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  googleAuthUrl.searchParams.set('client_id', clientId)
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri)
  googleAuthUrl.searchParams.set('response_type', 'code')
  googleAuthUrl.searchParams.set('scope', 'openid email profile')
  googleAuthUrl.searchParams.set('prompt', 'select_account')
  googleAuthUrl.searchParams.set('access_type', 'offline')

  return NextResponse.redirect(googleAuthUrl.toString())
}

