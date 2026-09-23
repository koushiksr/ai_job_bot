import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import { exactMatchCI } from '@/lib/query'

export const dynamic = 'force-dynamic'

/**
 * Super Admin: assign an existing registered user as Enterprise Admin for an org.
 * POST { org_id, email } → promotes user to enterprise_admin role for that org.
 */
export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })

    const auth = await verifyAdminRequest(req, db)
    if (!auth.authorized) return NextResponse.json({ detail: 'Unauthorized. Super Admin access required.' }, { status: 403 })

    const body = await req.json()
    const orgId = (body.org_id || '').trim()
    const email = (body.email || '').trim().toLowerCase()

    if (!orgId || !email || !email.includes('@')) {
      return NextResponse.json({ detail: 'org_id and valid admin email are required.' }, { status: 400 })
    }

    // Verify org exists
    const org = await db.collection('enterprise_orgs').findOne({ org_id: orgId })
    if (!org) return NextResponse.json({ detail: 'Organization not found.' }, { status: 404 })

    // Find the user
    const profile = await db.collection('profiles').findOne({
      email: exactMatchCI(email)
    }) || await db.collection('users').findOne({
      email: exactMatchCI(email)
    })

    if (!profile) {
      return NextResponse.json({
        detail: `No registered user found with email ${email}. The user must sign up on JobFlux first.`
      }, { status: 404 })
    }

    const now = new Date()

    // Promote user to enterprise_admin
    const adminUpdate = {
      role: 'enterprise_admin',
      enterprise_role: 'admin',
      enterprise_org_id: orgId,
      enterprise_status: 'active',
      is_org_admin_only: true,
      plan: 'none',
      updated_at: now
    }

    await db.collection('profiles').updateOne(
      { email: exactMatchCI(email) },
      { $set: adminUpdate }
    )
    await db.collection('users').updateOne(
      { email: exactMatchCI(email) },
      { $set: adminUpdate }
    )

    // Update org's admin_email and admin_name
    await db.collection('enterprise_orgs').updateOne(
      { org_id: orgId },
      {
        $set: {
          admin_email: email,
          admin_user_id: profile.user_id,
          admin_name: profile.name || email.split('@')[0],
          updated_at: now
        }
      }
    )

    return NextResponse.json({
      status: 'success',
      message: `${profile.name || email} has been assigned as Enterprise Admin for ${org.name}.`,
      admin_email: email,
      admin_name: profile.name || email.split('@')[0]
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error assigning admin' }, { status: 500 })
  }
}
