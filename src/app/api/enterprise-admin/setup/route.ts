import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyEnterpriseAdminRequest } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

/**
 * Enterprise Setup / Seed API
 * Initializes the default 'Technohm SIT Org' organization:
 * - Enterprise Admin: koushiksrmedala@gmail.com
 * - Enterprise Member: technohmsit@gmail.com
 * - Quotas: 55 daily applications, 10 on-demand runs/week
 */
export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const auth = await verifyEnterpriseAdminRequest(req, db)
    if (!auth.authorized) {
      return NextResponse.json({ detail: 'Unauthorized. Super Admin or Enterprise Admin privileges required.' }, { status: 403 })
    }

    const now = new Date()
    const orgId = 'org_technohmsit'

    // 1. Upsert default Enterprise Organization
    await db.collection('enterprise_orgs').updateOne(
      { org_id: orgId },
      {
        $set: {
          org_id: orgId,
          name: 'Technohm SIT Org',
          admin_email: 'koushiksrmedala@gmail.com',
          admin_user_id: 'koushiksrmedala',
          admin_name: 'Koushik S.R. Medala',
          created_by: 'technohmsit@gmail.com',
          daily_limit_per_user: 55,
          weekly_on_demand_quota: 10,
          status: 'active',
          updated_at: now
        },
        $setOnInsert: {
          created_at: now
        }
      },
      { upsert: true }
    )

    // 2. Ensure Enterprise Admin profile for koushiksrmedala@gmail.com
    await db.collection('profiles').updateOne(
      { email: { $regex: '^koushiksrmedala@gmail\\.com$', $options: 'i' } },
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
      { email: { $regex: '^koushiksrmedala@gmail\\.com$', $options: 'i' } },
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

    // 3. Ensure technohmsit@gmail.com is linked as an Enterprise Member in addition to Super Admin
    await db.collection('profiles').updateOne(
      { email: { $regex: '^technohmsit@gmail\\.com$', $options: 'i' } },
      {
        $set: {
          enterprise_org_id: orgId,
          enterprise_role: 'member',
          enterprise_status: 'active',
          plan: 'enterprise',
          plan_name: 'JobFlux Enterprise Member',
          daily_application_limit: 55,
          enabled_for_daily_run: true,
          updated_at: now
        }
      }
    )
    await db.collection('users').updateOne(
      { email: { $regex: '^technohmsit@gmail\\.com$', $options: 'i' } },
      {
        $set: {
          enterprise_org_id: orgId,
          enterprise_role: 'member',
          enterprise_status: 'active',
          plan: 'enterprise',
          plan_name: 'JobFlux Enterprise Member',
          daily_application_limit: 55,
          enabled_for_daily_run: true,
          updated_at: now
        }
      }
    )

    return NextResponse.json({
      status: 'success',
      message: 'Technohm SIT Enterprise Org initialized successfully.',
      org_id: orgId,
      admin: 'koushiksrmedala@gmail.com',
      member: 'technohmsit@gmail.com'
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Setup error' }, { status: 500 })
  }
}
