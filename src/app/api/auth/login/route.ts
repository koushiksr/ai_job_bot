import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { logUserActivity, getClientInfo } from '@/lib/activityLogger'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const emailClean = (body.email || '').trim().toLowerCase()
    const pwdClean = (body.password || '').trim()
    const { ip, userAgent } = getClientInfo(req)

    const db = await getDb()

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
      if (db) {
        await logUserActivity(db, {
          userId: 'admin',
          email: emailClean.includes('@') ? emailClean : 'admin@jobfluxai.com',
          eventType: 'login',
          description: 'Administrator signed in to central control hub',
          ipAddress: ip,
          userAgent: userAgent,
          metadata: { method: 'admin_password', role: 'admin' }
        })
      }

      return NextResponse.json({
        status: 'success',
        role: 'admin',
        user_id: 'admin',
        email: emailClean.includes('@') ? emailClean : 'admin@jobfluxai.com',
        name: 'JobFlux Controller'
      })
    }

    // 2. Authenticate against cloud users & profiles collections
    if (!db) {
      return NextResponse.json(
        { detail: 'Database unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    const profile = await db.collection('users').findOne({
      email: { $regex: `^${emailClean}$`, $options: 'i' }
    }) || await db.collection('profiles').findOne({
      email: { $regex: `^${emailClean}$`, $options: 'i' }
    })

    if (profile) {
      if (profile.password === pwdClean) {
        const assignedRole = (
          emailClean === 'technohmsit@gmail.com' ||
          emailClean === 'technohmsit' ||
          profile.user_id === 'technohmsit' ||
          (profile.email && profile.email.toLowerCase() === 'technohmsit@gmail.com') ||
          profile.role === 'admin'
        ) ? 'admin' : 'user'

        // Log candidate/admin login event
        await logUserActivity(db, {
          userId: profile.user_id,
          email: profile.email,
          eventType: 'login',
          description: assignedRole === 'admin' ? `Administrator signed in (${profile.user_id})` : `Candidate signed in successfully (Method: Password)`,
          ipAddress: ip,
          userAgent: userAgent,
          metadata: {
            method: 'password',
            role: assignedRole,
            plan: profile.plan || 'trial'
          }
        })

        return NextResponse.json({
          status: 'success',
          role: assignedRole,
          user_id: profile.user_id,
          email: profile.email,
          name: profile.name || profile.user_id.replace('_', ' '),
          plan: profile.plan || 'trial',
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
