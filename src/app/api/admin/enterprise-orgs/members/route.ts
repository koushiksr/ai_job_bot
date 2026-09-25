import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import { exactMatchCI } from '@/lib/query'

export const dynamic = 'force-dynamic'

/**
 * Super Admin: manage individual members of an enterprise org directly.
 * GET    ?org_id=...                         → list members in org
 * POST   { org_id, email }                   → INVITE existing user (pending until THEY accept in their dashboard)
 * PATCH  { org_id, user_id, enabled }        → enable / disable member
 * DELETE ?org_id=...&user_id=...             → remove user from org
 *
 * Consent rule: nobody is ever pulled into an org silently. POST only creates
 * a pending enterprise_invites record; membership activates when the candidate
 * clicks Accept in their own dashboard (POST /api/user/invites).
 */

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })

    const auth = await verifyAdminRequest(req, db)
    if (!auth.authorized) return NextResponse.json({ detail: 'Unauthorized. Super Admin access required.' }, { status: 403 })

    const orgId = req.nextUrl.searchParams.get('org_id') || ''
    if (!orgId) return NextResponse.json({ detail: 'org_id is required.' }, { status: 400 })

    const members = await db.collection('profiles').find({
      enterprise_org_id: orgId
    }).toArray()

    const memberIds = members.map(m => m.user_id).filter(Boolean)
    const statsDocs = await db.collection('user_stats').find({ user_id: { $in: memberIds } }).toArray()
    const statsMap = new Map(statsDocs.map(s => [s.user_id, s]))
    const istToday = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const list = members.map(m => {
      const s = statsMap.get(m.user_id) || {}
      const todayCount = s.last_date === istToday ? (s.today || 0) : 0
      return {
        user_id: m.user_id,
        email: m.email,
        name: m.name || m.user_id,
        role: m.role || 'user',
        enterprise_role: m.enterprise_role || 'member',
        enterprise_status: m.enterprise_status || 'active',
        is_org_admin_only: m.is_org_admin_only || false,
        enabled_for_daily_run: m.enabled_for_daily_run !== false,
        plan: m.plan || 'enterprise',
        applied_today: todayCount,
        applied_total: s.total_applied || 0,
        created_at: m.created_at
      }
    })

    return NextResponse.json({ status: 'success', org_id: orgId, members: list, total: list.length })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error listing members' }, { status: 500 })
  }
}

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
      return NextResponse.json({ detail: 'org_id and valid email are required.' }, { status: 400 })
    }

    // Find existing user
    const existingUser = await db.collection('profiles').findOne({
      email: exactMatchCI(email)
    }) || await db.collection('users').findOne({
      email: exactMatchCI(email)
    })

    if (!existingUser) {
      return NextResponse.json({ detail: `No user found with email ${email}. Ask them to sign up first.` }, { status: 404 })
    }

    // Verify org exists
    const org = await db.collection('enterprise_orgs').findOne({ org_id: orgId })
    if (!org) return NextResponse.json({ detail: 'Organization not found.' }, { status: 404 })

    // Consent rule: if already an active member, nothing to do
    if (existingUser.enterprise_org_id === orgId && existingUser.enterprise_role === 'member') {
      return NextResponse.json({ detail: `${existingUser.name || email} is already an active member of ${org.name}.` }, { status: 400 })
    }

    const now = new Date()

    // If a pending invite already exists, just refresh it (never duplicate, never force-add)
    const existingInvite = await db.collection('enterprise_invites').findOne({
      org_id: orgId,
      invited_email: email,
      status: 'pending'
    })
    if (existingInvite) {
      await db.collection('enterprise_invites').updateOne(
        { _id: existingInvite._id },
        { $set: { updated_at: now, invited_by: auth.email || auth.userId } }
      )
      return NextResponse.json({
        status: 'success',
        invite_id: existingInvite.invite_id || existingInvite._id.toString(),
        email,
        message: `Invitation refreshed for ${email}. They must accept it in their dashboard before joining ${org.name}.`
      })
    }

    // Create a pending invitation — membership activates ONLY on candidate Accept
    const inviteId = `inv_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    await db.collection('enterprise_invites').insertOne({
      invite_id: inviteId,
      org_id: orgId,
      org_name: org.name,
      invited_email: email,
      invited_by: auth.email || auth.userId,
      status: 'pending',
      created_at: now,
      updated_at: now
    })

    return NextResponse.json({
      status: 'success',
      message: `Invitation sent to ${email}. They will join ${org.name} only after accepting it in their dashboard.`,
      invite_id: inviteId,
      email
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error adding member' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })

    const auth = await verifyAdminRequest(req, db)
    if (!auth.authorized) return NextResponse.json({ detail: 'Unauthorized. Super Admin access required.' }, { status: 403 })

    const body = await req.json()
    const { org_id, user_id, enabled } = body

    if (!org_id || !user_id) {
      return NextResponse.json({ detail: 'org_id and user_id are required.' }, { status: 400 })
    }

    const isEnabled = Boolean(enabled)
    const update = {
      enabled_for_daily_run: isEnabled,
      enterprise_status: isEnabled ? 'active' : 'disabled',
      updated_at: new Date()
    }

    await db.collection('profiles').updateOne({ user_id, enterprise_org_id: org_id }, { $set: update })
    await db.collection('users').updateOne({ user_id }, { $set: update })

    return NextResponse.json({
      status: 'success',
      message: `Member ${user_id} ${isEnabled ? 'enabled' : 'disabled'} successfully.`
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error updating member' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })

    const auth = await verifyAdminRequest(req, db)
    if (!auth.authorized) return NextResponse.json({ detail: 'Unauthorized. Super Admin access required.' }, { status: 403 })

    const orgId = req.nextUrl.searchParams.get('org_id') || ''
    const userId = req.nextUrl.searchParams.get('user_id') || ''

    if (!orgId || !userId) {
      return NextResponse.json({ detail: 'org_id and user_id are required.' }, { status: 400 })
    }

    await db.collection('profiles').updateOne(
      { user_id: userId, enterprise_org_id: orgId },
      {
        $unset: { enterprise_org_id: '', enterprise_role: '', enterprise_status: '' },
        $set: { plan: 'trial', daily_application_limit: 10, updated_at: new Date() }
      }
    )
    await db.collection('users').updateOne(
      { user_id: userId },
      { $unset: { enterprise_org_id: '', enterprise_role: '', enterprise_status: '' }, $set: { updated_at: new Date() } }
    )

    return NextResponse.json({ status: 'success', message: `User ${userId} removed from org ${orgId}.` })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error removing member' }, { status: 500 })
  }
}
