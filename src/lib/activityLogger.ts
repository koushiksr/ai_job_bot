import { Db } from 'mongodb'
import { NextRequest } from 'next/server'

export type ActivityEventType =
  | 'login'
  | 'profile_update'
  | 'resume_upload'
  | 'task_run'
  | 'plan_update'

export interface LogActivityParams {
  userId: string
  email?: string
  eventType: ActivityEventType
  description: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Extract client IP address and user-agent string from incoming request
 */
export function getClientInfo(req: NextRequest | Request): { ip: string; userAgent: string } {
  try {
    const headers = req.headers
    const forwarded = headers.get('x-forwarded-for')
    const realIp = headers.get('x-real-ip')
    const cfConnectingIp = headers.get('cf-connecting-ip')
    
    let ip = ''
    if (forwarded) {
      ip = forwarded.split(',')[0].trim()
    } else if (cfConnectingIp) {
      ip = cfConnectingIp.trim()
    } else if (realIp) {
      ip = realIp.trim()
    } else {
      ip = '127.0.0.1'
    }

    const userAgent = headers.get('user-agent') || 'Unknown Device / Browser'
    return { ip, userAgent }
  } catch {
    return { ip: '127.0.0.1', userAgent: 'Unknown' }
  }
}

/**
 * Log user activity into MongoDB and update aggregated user stats
 */
export async function logUserActivity(
  db: Db | null,
  params: LogActivityParams
): Promise<void> {
  if (!db || !params.userId) return

  try {
    const now = new Date()
    const logDoc = {
      user_id: params.userId,
      email: (params.email || '').trim().toLowerCase(),
      event_type: params.eventType,
      description: params.description,
      metadata: params.metadata || {},
      ip_address: params.ipAddress || '',
      user_agent: params.userAgent || '',
      created_at: now
    }

    // 1. Insert into dedicated activity logs collection
    await db.collection('user_activity_logs').insertOne(logDoc)

    // 2. Increment counters and record latest timestamps in users & profiles
    const userUpdates: any = {
      updated_at: now
    }

    if (params.eventType === 'login') {
      userUpdates.last_login_at = now
      if (params.ipAddress) userUpdates.last_login_ip = params.ipAddress
      await db.collection('users').updateOne(
        { user_id: params.userId },
        { $set: userUpdates, $inc: { login_count: 1 } }
      )
      await db.collection('profiles').updateOne(
        { user_id: params.userId },
        { $set: userUpdates, $inc: { login_count: 1 } }
      )
    } else if (params.eventType === 'profile_update') {
      userUpdates.last_profile_updated_at = now
      await db.collection('users').updateOne(
        { user_id: params.userId },
        { $set: userUpdates, $inc: { profile_update_count: 1 } }
      )
      await db.collection('profiles').updateOne(
        { user_id: params.userId },
        { $set: userUpdates, $inc: { profile_update_count: 1 } }
      )
    } else if (params.eventType === 'resume_upload') {
      userUpdates.last_resume_updated_at = now
      if (params.metadata?.filename) {
        userUpdates.resume_filename = params.metadata.filename
      }
      await db.collection('users').updateOne(
        { user_id: params.userId },
        { $set: userUpdates, $inc: { resume_upload_count: 1 } }
      )
      await db.collection('profiles').updateOne(
        { user_id: params.userId },
        { $set: userUpdates, $inc: { resume_upload_count: 1 } }
      )
    } else if (params.eventType === 'task_run') {
      userUpdates.last_scout_run_at = now
      await db.collection('users').updateOne(
        { user_id: params.userId },
        { $set: userUpdates, $inc: { on_demand_run_count: 1 } }
      )
      await db.collection('profiles').updateOne(
        { user_id: params.userId },
        { $set: userUpdates, $inc: { on_demand_run_count: 1 } }
      )
    }
  } catch (err) {
    console.error('[ActivityLogger Error]', err)
  }
}

/**
 * Record (or refresh) a device identity on login without touching trust.
 * Trust is granted explicitly by super-admin via /api/admin/devices.
 */
export async function recordLoginDevice(
  db: Db | null,
  args: { deviceId?: string; ip?: string; userAgent?: string; userId?: string; email?: string }
): Promise<{ deviceId: string; label: string; trusted: boolean }> {
  const { parseDeviceInfo } = await import('@/lib/device')
  const deviceId = (args.deviceId || '').trim() || `ip-${(args.ip || 'unknown').replace(/[^a-zA-Z0-9]/g, '')}`
  const { label } = parseDeviceInfo(args.userAgent || '')
  if (!db || !deviceId) {
    return { deviceId, label, trusted: false }
  }
  try {
    const now = new Date()
    await db.collection('trusted_devices').updateOne(
      { device_id: deviceId },
      {
        $set: {
          last_seen_at: now,
          last_ip: args.ip || '',
          last_user_id: args.userId || '',
          last_email: (args.email || '').toLowerCase(),
          label
        },
        $setOnInsert: { device_id: deviceId, trusted: false, created_at: now }
      },
      { upsert: true }
    )
    const rec = await db.collection('trusted_devices').findOne({ device_id: deviceId })
    return { deviceId, label, trusted: Boolean(rec?.trusted) }
  } catch {
    return { deviceId, label, trusted: false }
  }
}

