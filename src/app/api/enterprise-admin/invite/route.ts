import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyEnterpriseAdminRequest } from '@/lib/adminAuth'
import { exactMatchCI } from '@/lib/query'

export const dynamic = 'force-dynamic'

/**
 * GET: List invites for the enterprise organization
 */
export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const auth = await verifyEnterpriseAdminRequest(req, db)
    if (!auth.authorized) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 403 })
    }

    const orgId = auth.orgId || 'org_technohmsit'

    const invites = await db.collection('enterprise_invites')
      .find({ org_id: orgId })
      .sort({ created_at: -1 })
      .toArray()

    return NextResponse.json({
      status: 'success',
      invites: invites.map(inv => ({
        invite_id: inv.invite_id || inv._id.toString(),
        org_id: inv.org_id,
        org_name: inv.org_name,
        invited_email: inv.invited_email,
        invited_by: inv.invited_by,
        status: inv.status,
        created_at: inv.created_at,
        responded_at: inv.responded_at || null
      }))
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error fetching invites' }, { status: 500 })
  }
}

/**
 * POST: Send an invitation to a candidate's email address
 */
export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const auth = await verifyEnterpriseAdminRequest(req, db)
    if (!auth.authorized) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const targetEmail = (body.email || '').trim().toLowerCase()

    if (!targetEmail || !targetEmail.includes('@')) {
      return NextResponse.json({ detail: 'A valid email address is required to send an invitation.' }, { status: 400 })
    }

    const orgId = auth.orgId || 'org_technohmsit'
    const org = await db.collection('enterprise_orgs').findOne({ org_id: orgId })
    const orgName = org?.name || 'Technohm SIT Org'

    // Check if the user is already an active member of this org
    const existingProfile = await db.collection('profiles').findOne({
      email: exactMatchCI(targetEmail)
    })

    if (existingProfile && existingProfile.enterprise_org_id === orgId && existingProfile.enterprise_role === 'member') {
      return NextResponse.json({ detail: 'User is already an active member of this organization.' }, { status: 400 })
    }

    // Check if there is already an active pending invite
    const existingInvite = await db.collection('enterprise_invites').findOne({
      org_id: orgId,
      invited_email: targetEmail,
      status: 'pending'
    })

    const now = new Date()
    const inviteId = `inv_${Date.now()}_${Math.floor(Math.random() * 1000)}`

    if (existingInvite) {
      // Re-trigger invite timestamp
      await db.collection('enterprise_invites').updateOne(
        { _id: existingInvite._id },
        { $set: { updated_at: now, invited_by: auth.email } }
      )
      return NextResponse.json({
        status: 'success',
        message: `Invitation refreshed for ${targetEmail}. They will see an invitation banner upon their next login.`,
        invite_id: existingInvite.invite_id || existingInvite._id.toString()
      })
    }

    const newInvite = {
      invite_id: inviteId,
      org_id: orgId,
      org_name: orgName,
      invited_email: targetEmail,
      invited_by: auth.email,
      status: 'pending',
      created_at: now,
      updated_at: now
    }

    await db.collection('enterprise_invites').insertOne(newInvite)

    return NextResponse.json({
      status: 'success',
      message: `Invitation successfully sent to ${targetEmail}. They will be prompted to accept in their candidate dashboard.`,
      invite_id: inviteId,
      invited_email: targetEmail,
      org_name: orgName
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error creating invite' }, { status: 500 })
  }
}

/**
 * DELETE: Revoke a pending invite
 */
export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const auth = await verifyEnterpriseAdminRequest(req, db)
    if (!auth.authorized) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const inviteId = searchParams.get('invite_id')
    const email = searchParams.get('email')

    if (!inviteId && !email) {
      return NextResponse.json({ detail: 'invite_id or email is required' }, { status: 400 })
    }

    const filter: any = inviteId ? { invite_id: inviteId } : { invited_email: email?.toLowerCase().trim() }
    await db.collection('enterprise_invites').deleteOne(filter)

    return NextResponse.json({
      status: 'success',
      message: 'Invitation revoked successfully.'
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error revoking invite' }, { status: 500 })
  }
}
