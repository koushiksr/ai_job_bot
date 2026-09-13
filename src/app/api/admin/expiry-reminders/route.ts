import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { checkAndDispatchExpiryReminders, getExpiryReminderStats } from "@/lib/expiryReminderService"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/expiry-reminders
 * Returns upcoming plan and offer expiry metrics, candidates within 24h/48h window, and recent reminder logs.
 */
export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
    }

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stats = await getExpiryReminderStats(db)

    // Also fetch detailed candidates expiring within 48h
    const now = new Date()
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    const profiles = await db.collection("profiles").find({
      $or: [
        { plan_expires_at: { $exists: true, $ne: null } },
        { trial_expires_at: { $exists: true, $ne: null } }
      ]
    }).toArray()

    const expiringCandidates = profiles
      .map(p => {
        const raw = p.plan_expires_at || p.trial_expires_at
        if (!raw) return null
        const exp = new Date(raw)
        if (exp <= now || exp > in48h) return null
        const hoursLeft = Math.max(0, Math.round((exp.getTime() - now.getTime()) / (1000 * 60 * 60)))
        return {
          email: p.email,
          name: p.name || (p.email ? p.email.split("@")[0] : p.user_id),
          user_id: p.user_id,
          plan: p.plan || "trial",
          plan_name: p.plan_name || (p.plan === "pro" ? "JobFlux PRO" : "1-Day Free Trial"),
          expires_at: exp,
          hours_left: hoursLeft,
          days_left: hoursLeft <= 24 ? 1 : 2
        }
      })
      .filter(Boolean)

    return NextResponse.json({
      success: true,
      stats,
      expiring_candidates: expiringCandidates
    })
  } catch (err: any) {
    console.error("Expiry reminders GET error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/expiry-reminders
 * Triggers automated expiry reminder sweep across candidate plans and offers.
 * Supports optional { candidateEmail, force } in body.
 */
export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
    }

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const candidateEmail = body.candidateEmail ? body.candidateEmail.toLowerCase().trim() : undefined
    const force = Boolean(body.force)

    const result = await checkAndDispatchExpiryReminders(db, {
      candidateEmail,
      force
    })

    const stats = await getExpiryReminderStats(db)

    return NextResponse.json({
      success: true,
      message: `✓ Expiry sweep completed: ${result.plan_reminders_sent} plan reminder(s) sent, ${result.offer_reminders_sent} offer reminder(s) sent (${result.skipped_cooldown} skipped due to 18h cooldown).`,
      result,
      stats
    })
  } catch (err: any) {
    console.error("Expiry reminders POST error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
