import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const emailClean = (body.email || '').trim().toLowerCase()
    const pwdClean = (body.password || '').trim()

    // 1. Admin login check
    if (
      (
        emailClean === 'admin' ||
        emailClean === 'admin@jobfluxai.com' ||
        emailClean === 'admin@jobflux.ai' ||
        emailClean === 'admin@jobbot.ai' ||
        emailClean === 'admin@admin.com'
      ) &&
      pwdClean === 'admin'
    ) {
      return NextResponse.json({
        status: 'success',
        role: 'admin',
        user_id: 'admin',
        email: emailClean.includes('@') ? emailClean : 'admin@jobfluxai.com',
        name: 'JobFlux Controller'
      })
    }

    // 2. Authenticate against cloud profiles collection
    const db = await getDb()
    if (!db) {
      return NextResponse.json(
        { detail: 'Database unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    const profile = await db.collection('profiles').findOne({
      email: { $regex: `^${emailClean}$`, $options: 'i' }
    })

    if (profile) {
      if (profile.password === pwdClean) {
        return NextResponse.json({
          status: 'success',
          role: 'user',
          user_id: profile.user_id,
          email: profile.email,
          name: profile.name || profile.user_id.replace('_', ' '),
          plan: profile.plan || 'pro',
          trial_expires_at: profile.trial_expires_at || null
        })
      } else {
        return NextResponse.json(
          { detail: 'Invalid password. Please check your credentials.' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      { detail: 'Invalid email or password. Candidate account not found.' },
      { status: 401 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Authentication error' },
      { status: 500 }
    )
  }
}
