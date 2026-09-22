import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

/**
 * GET: Fetch pending enterprise invites for the candidate
 */
export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const { searchParams } = new URL(req.url)
    const email = (searchParams.get('email') || '').trim().toLowerCase()
    const userId = (searchParams.get('user_id') || '').trim()

    let candidateEmail = email
    if (!candidateEmail && userId) {
      const p = await db.collection('profiles').findOne({ user_id: userId })
      if (p?.email) candidateEmail = p.email.toLowerCase()
    }

    if (!candidateEmail) {
      return NextResponse.json({ invites: [] })
    }

    const invites = await db.collection('enterprise_invites').find({
      invited_email: candidateEmail,
      status: 'pending'
    }).toArray()

    return NextResponse.json({
      status: 'success',
      invites: invites.map(inv => ({
        invite_id: inv.invite_id || inv._id.toString(),
        org_id: inv.org_id,
        org_name: inv.org_name,
        invited_email: inv.invited_email,
        invited_by: inv.invited_by,
        created_at: inv.created_at
      }))
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error fetching user invites' }, { status: 500 })
  }
}

/**
 * POST: Candidate responds to an enterprise invitation (accept or decline)
 * Body: { invite_id: string, action: 'accept' | 'decline', user_id: string }
 *
 * Consent + ownership rule: the invite can only be answered by the account
 * that owns the invited email. user_id must resolve to a profile whose
 * email matches invite.invited_email, otherwise 403.
 */
export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const body = await req.json()
    const inviteId = (body.invite_id || '').trim()
    const action = body.action === 'accept' ? 'accept' : 'decline'
    const userId = (body.user_id || '').trim()

    if (!inviteId) {
      return NextResponse.json({ detail: 'invite_id is required' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ detail: 'user_id is required' }, { status: 400 })
    }

    const invite = await db.collection('enterprise_invites').findOne({
      $or: [{ invite_id: inviteId }]
    })

    if (!invite) {
      return NextResponse.json({ detail: 'Invitation not found or has expired.' }, { status: 404 })
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ detail: `This invitation is no longer pending (status: ${invite.status}).` }, { status: 410 })
    }

    // Ownership check: only the invited email's own account may answer
    const caller = await db.collection('profiles').findOne({ user_id: userId })
      || await db.collection('users').findOne({ user_id: userId })
    const callerEmail = (caller?.email || '').toLowerCase()
    if (!callerEmail || callerEmail !== (invite.invited_email || '').toLowerCase()) {
      return NextResponse.json({ detail: 'This invitation belongs to a different account.' }, { status: 403 })
    }

    const now = new Date()

    if (action === 'decline') {
      await db.collection('enterprise_invites').updateOne(
        { _id: invite._id },
        { $set: { status: 'declined', responded_at: now } }
      )
      return NextResponse.json({
        status: 'success',
        action: 'declined',
        message: 'Enterprise invitation declined.'
      })
    }

    // Action: Accept -> Link user to the Enterprise Org
    await db.collection('enterprise_invites').updateOne(
      { _id: invite._id },
      { $set: { status: 'accepted', responded_at: now } }
    )

    const updateFields = {
      enterprise_org_id: invite.org_id,
      enterprise_role: 'member',
      enterprise_status: 'active',
      plan: 'enterprise',
      plan_name: `JobFlux Enterprise (${invite.org_name})`,
      daily_application_limit: 55,
      enabled_for_daily_run: true,
      updated_at: now
    }

    const query = userId ? { user_id: userId } : { email: invite.invited_email }

    await db.collection('profiles').updateOne(query, { $set: updateFields })
    await db.collection('users').updateOne(query, { $set: updateFields })

    // Retire any other pending invites for this email so stale banners don't linger
    await db.collection('enterprise_invites').updateMany(
      { invited_email: invite.invited_email, status: 'pending', _id: { $ne: invite._id } },
      { $set: { status: 'superseded', responded_at: now } }
    )

    return NextResponse.json({
      status: 'success',
      action: 'accepted',
      message: `Welcome to ${invite.org_name}! You now have Enterprise perks including 10 weekly on-demand sweeps and 55 daily job applications.`,
      org_id: invite.org_id,
      org_name: invite.org_name,
      plan: 'enterprise',
      plan_name: `JobFlux Enterprise (${invite.org_name})`
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error processing invite response' }, { status: 500 })
  }
}
