import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

/**
 * Super Admin Enterprise Organizations Management API
 * Strictly restricted to technohmsit@gmail.com
 */
export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const auth = await verifyAdminRequest(req, db)
    if (!auth.authorized) {
      return NextResponse.json({ detail: 'Unauthorized. Super Admin access required.' }, { status: 403 })
    }

    const orgs = await db.collection('enterprise_orgs').find({}).sort({ created_at: -1 }).toArray()

    // For each org, compute live member count and total applied count
    const enrichedOrgs = await Promise.all(
      orgs.map(async (org) => {
        const members = await db.collection('profiles').find({
          $or: [
            { enterprise_org_id: org.org_id },
            { email: org.admin_email }
          ]
        }).toArray()

        const memberIds = members.map(m => m.user_id).filter(Boolean)
        const stats = await db.collection('user_stats').find({ user_id: { $in: memberIds } }).toArray()

        let totalApplied = 0
        let todayApplied = 0
        stats.forEach(s => {
          totalApplied += (s.total_applied || 0)
          todayApplied += (s.today || 0)
        })

        return {
          org_id: org.org_id,
          name: org.name,
          admin_email: org.admin_email,
          admin_name: org.admin_name || org.admin_email.split('@')[0],
          status: org.status || 'active',
          member_count: members.length,
          total_applied: totalApplied,
          today_applied: todayApplied,
          created_at: org.created_at,
          created_by: org.created_by
        }
      })
    )

    return NextResponse.json({
      status: 'success',
      orgs: enrichedOrgs
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error fetching orgs' }, { status: 500 })
  }
}

/**
 * POST: Super Admin creates a new Enterprise Org and assigns an existing user email as Enterprise Admin.
 * Body: { name: string, admin_email: string, daily_limit?: number }
 */
export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const auth = await verifyAdminRequest(req, db)
    if (!auth.authorized) {
      return NextResponse.json({ detail: 'Unauthorized. Super Admin access required.' }, { status: 403 })
    }

    const body = await req.json()
    const name = (body.name || '').trim()
    const adminEmail = (body.admin_email || '').trim().toLowerCase()

    if (!name) {
      return NextResponse.json({ detail: 'Organization name is required.' }, { status: 400 })
    }
    if (!adminEmail || !adminEmail.includes('@')) {
      return NextResponse.json({ detail: 'A valid admin email is required.' }, { status: 400 })
    }

    const orgId = `org_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Math.floor(100 + Math.random() * 900)}`
    const now = new Date()

    // 1. Create Organization in enterprise_orgs
    const newOrg = {
      org_id: orgId,
      name: name,
      admin_email: adminEmail,
      admin_name: body.admin_name || adminEmail.split('@')[0],
      created_by: auth.email,
      daily_limit_per_user: 55,
      weekly_on_demand_quota: 10,
      status: 'active',
      created_at: now,
      updated_at: now
    }

    await db.collection('enterprise_orgs').insertOne(newOrg)

    // 2. Assign existing candidate as Enterprise Admin (if profile exists)
    const existingProfile = await db.collection('profiles').findOne({
      email: { $regex: `^${adminEmail}$`, $options: 'i' }
    })

    if (existingProfile) {
      await db.collection('profiles').updateOne(
        { _id: existingProfile._id },
        {
          $set: {
            enterprise_org_id: orgId,
            enterprise_role: 'admin',
            enterprise_status: 'active',
            role: 'enterprise_admin',
            daily_application_limit: 55,
            updated_at: now
          }
        }
      )
      await db.collection('users').updateOne(
        { email: { $regex: `^${adminEmail}$`, $options: 'i' } },
        {
          $set: {
            enterprise_org_id: orgId,
            enterprise_role: 'admin',
            enterprise_status: 'active',
            role: 'enterprise_admin',
            daily_application_limit: 55,
            updated_at: now
          }
        }
      )
    }

    return NextResponse.json({
      status: 'success',
      message: `Organization '${name}' created successfully. ${adminEmail} designated as Enterprise Admin.`,
      org: newOrg
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error creating organization' }, { status: 500 })
  }
}

/**
 * PATCH: Super Admin updates an enterprise organization's status or quotas.
 * Body: { org_id: string, status?: 'active' | 'paused', daily_limit_per_user?: number, weekly_on_demand_quota?: number }
 */
export async function PATCH(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const auth = await verifyAdminRequest(req, db)
    if (!auth.authorized) {
      return NextResponse.json({ detail: 'Unauthorized. Super Admin access required.' }, { status: 403 })
    }

    const body = await req.json()
    const { org_id, status, daily_limit_per_user, weekly_on_demand_quota } = body

    if (!org_id) {
      return NextResponse.json({ detail: 'Organization ID is required.' }, { status: 400 })
    }

    const updateDoc: any = { updated_at: new Date() }
    if (status && ['active', 'paused'].includes(status)) {
      updateDoc.status = status
    }
    if (typeof daily_limit_per_user === 'number') {
      updateDoc.daily_limit_per_user = Math.min(55, Math.max(1, daily_limit_per_user))
    }
    if (typeof weekly_on_demand_quota === 'number') {
      updateDoc.weekly_on_demand_quota = Math.max(1, weekly_on_demand_quota)
    }

    const res = await db.collection('enterprise_orgs').updateOne(
      { org_id },
      { $set: updateDoc }
    )

    if (res.matchedCount === 0) {
      return NextResponse.json({ detail: 'Organization not found.' }, { status: 404 })
    }

    return NextResponse.json({
      status: 'success',
      message: 'Organization updated successfully.'
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error updating organization' }, { status: 500 })
  }
}

/**
 * DELETE: Super Admin deletes an enterprise organization and unlinks its members.
 * Query or body: ?org_id=...
 */
export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const auth = await verifyAdminRequest(req, db)
    if (!auth.authorized) {
      return NextResponse.json({ detail: 'Unauthorized. Super Admin access required.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    let orgId = searchParams.get('org_id')
    if (!orgId) {
      try {
        const b = await req.json()
        orgId = b.org_id
      } catch {}
    }

    if (!orgId) {
      return NextResponse.json({ detail: 'Organization ID is required.' }, { status: 400 })
    }

    if (orgId === 'org_technohmsit') {
      return NextResponse.json({ detail: 'Cannot delete the primary Technohm SIT Organization.' }, { status: 400 })
    }

    // Unlink members
    await db.collection('profiles').updateMany(
      { enterprise_org_id: orgId },
      {
        $unset: {
          enterprise_org_id: '',
          enterprise_role: '',
          enterprise_status: ''
        }
      }
    )

    // Delete invites
    await db.collection('enterprise_invites').deleteMany({ org_id: orgId })

    // Delete organization
    const res = await db.collection('enterprise_orgs').deleteOne({ org_id: orgId })
    if (res.deletedCount === 0) {
      return NextResponse.json({ detail: 'Organization not found.' }, { status: 404 })
    }

    return NextResponse.json({
      status: 'success',
      message: `Organization ${orgId} deleted successfully.`
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error deleting organization' }, { status: 500 })
  }
}

