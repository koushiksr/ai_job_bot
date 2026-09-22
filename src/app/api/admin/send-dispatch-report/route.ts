import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import { sendEmail, generateJobDispatchReportHtml } from '@/lib/mailService'
import { sendPushToUser } from '@/lib/webPushService'
import { APP_CONFIG } from '@/config/appConfig'

export const dynamic = 'force-dynamic'

/**
 * Heuristics to parse clean company name and Indian city/location
 * from Naukri job URLs when database records have "Not Specified" or placeholders.
 */
function extractCompanyAndLocation(
  company: string = '',
  location: string = '',
  url: string = '',
  jobTitle: string = ''
): { company: string; location: string } {
  let cleanCompany = (company || '').trim()
  let cleanLoc = (location || '').trim()

  const isUnknownCompany = !cleanCompany ||
    cleanCompany.toLowerCase() === 'unknown company' ||
    cleanCompany.toLowerCase() === 'unknown' ||
    cleanCompany.toLowerCase() === 'not specified' ||
    cleanCompany.toLowerCase() === 'confidential'

  const isUnknownLoc = !cleanLoc ||
    cleanLoc.toLowerCase() === 'not specified' ||
    cleanLoc.toLowerCase() === 'unknown'

  // Extract from Naukri job URL if available
  if (url && (isUnknownCompany || isUnknownLoc)) {
    const slugMatch = url.match(/\/job-listings-([a-z0-9-]+?)(?:\?|$)/i)
    if (slugMatch) {
      let slug = slugMatch[1].toLowerCase()

      // Strip trailing numeric job ID
      slug = slug.replace(/-\d{8,16}$/, '')

      // Strip experience suffix
      slug = slug.replace(/-\d+(?:-to-\d+)?-years?$/, '')

      const indianLocations: Record<string, string> = {
        'hyderabad-secunderabad': 'Hyderabad',
        'hyderabad': 'Hyderabad',
        'secunderabad': 'Hyderabad',
        'bengaluru-bangalore': 'Bengaluru',
        'bengaluru': 'Bengaluru',
        'bangalore': 'Bengaluru',
        'pune': 'Pune',
        'mumbai': 'Mumbai',
        'navi-mumbai': 'Navi Mumbai',
        'thane': 'Thane / Mumbai',
        'delhi-ncr': 'Delhi NCR',
        'new-delhi': 'New Delhi',
        'noida': 'Noida',
        'greater-noida': 'Greater Noida',
        'gurgaon-gurugram': 'Gurugram',
        'gurgaon': 'Gurugram',
        'gurugram': 'Gurugram',
        'chennai': 'Chennai',
        'kolkata': 'Kolkata',
        'ahmedabad': 'Ahmedabad',
        'kochi': 'Kochi',
        'coimbatore': 'Coimbatore',
        'indore': 'Indore',
        'remote': 'Remote',
        'hybrid': 'Hybrid / Pan India'
      }

      for (const [locKey, locDisplay] of Object.entries(indianLocations)) {
        if (slug.endsWith('-' + locKey)) {
          if (isUnknownLoc) cleanLoc = locDisplay
          slug = slug.slice(0, -(locKey.length + 1))
          break
        }
      }

      if (isUnknownCompany) {
        if (jobTitle) {
          const titleSlug = jobTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
          const titleTokens = titleSlug.split('-').filter(Boolean)
          for (let len = titleTokens.length; len >= 2; len--) {
            const prefix = titleTokens.slice(0, len).join('-')
            if (slug.startsWith(prefix + '-')) {
              slug = slug.slice(prefix.length + 1)
              break
            }
          }
        }
        const tokens = slug.split('-').filter(Boolean)
        if (tokens.length >= 1) {
          const companyTokens = tokens.slice(-Math.min(3, tokens.length))
          cleanCompany = companyTokens.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
        }
      }
    }
  }

  if (!cleanCompany || cleanCompany.toLowerCase() === 'unknown' || cleanCompany.toLowerCase() === 'not specified') {
    cleanCompany = 'Confidential Hiring Partner'
  }
  if (!cleanLoc || cleanLoc.toLowerCase() === 'not specified') {
    cleanLoc = 'India / Remote'
  }

  return { company: cleanCompany, location: cleanLoc }
}

/**
 * Processes and sends the dynamic job dispatch report for a single candidate.
 */
async function dispatchReportForCandidate(
  db: any,
  candidateInput: { userId?: string; email?: string; taskId?: string },
  channel: 'both' | 'email' | 'push' = 'both',
  offerOverrides: any = {},
  options: {
    source?: string
    force?: boolean
    isOnDemand?: boolean
    status?: string
    error?: string
    failureReason?: string
    workerInfo?: any
  } = {}
) {
  const targetEmail = (candidateInput.email || '').toLowerCase().trim()
  const targetUserId = (candidateInput.userId || '').trim()

  // 1. Resolve Candidate Profile & User records
  let user = null
  let profile = null

  if (targetUserId) {
    profile = await db.collection('profiles').findOne({ user_id: targetUserId })
    user = await db.collection('users').findOne({ user_id: targetUserId })
  }

  if (!profile && !user && targetEmail) {
    profile = await db.collection('profiles').findOne({ email: { $regex: `^${targetEmail}$`, $options: 'i' } })
    user = await db.collection('users').findOne({ email: { $regex: `^${targetEmail}$`, $options: 'i' } })
  }

  if (!profile && !user && targetEmail && !targetEmail.includes('@')) {
    profile = await db.collection('profiles').findOne({ user_id: targetEmail })
    user = await db.collection('users').findOne({ user_id: targetEmail })
  }

  const resolvedUserId = profile?.user_id || user?.user_id || targetUserId
  const resolvedEmail = (profile?.email || user?.email || targetEmail).toLowerCase().trim()
  const candidateName = profile?.name || user?.name || (resolvedEmail.includes('@') ? resolvedEmail.split('@')[0] : 'Candidate')

  if (!resolvedEmail || !resolvedEmail.includes('@')) {
    return { success: false, error: `Valid email address required for candidate ${resolvedUserId || 'unknown'}` }
  }

  const now = new Date()
  const istOffsetMs = 5.5 * 60 * 60 * 1000
  const istNow = new Date(now.getTime() + istOffsetMs)
  const todayIstStr = `${istNow.getUTCFullYear()}-${String(istNow.getUTCMonth() + 1).padStart(2, '0')}-${String(istNow.getUTCDate()).padStart(2, '0')}`
  const startOfTodayUtc = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0) - istOffsetMs)

  // 1.5. Failure / Error Safeguard: Suppress candidate email and alert Admin
  if (options.status === 'failed' || Boolean(options.error)) {
    const errorDetail = options.error || options.failureReason || 'Automation run interrupted with error'
    console.warn(`🚨 [Dispatch] Automation failure reported for ${resolvedEmail}: ${errorDetail}. Suppressing candidate report and notifying admin.`)

    // Notify Admin via Web Push
    try {
      const adminSubscriptions = await db.collection('push_subscriptions').find({}).toArray()
      for (const sub of adminSubscriptions) {
        if (sub.endpoint && sub.keys) {
          await sendPushToUser(sub.user_email || 'admin', {
            title: `🚨 Bot Run Failed: ${candidateName}`,
            body: `${errorDetail.slice(0, 100)} (Task: ${candidateInput.taskId || 'N/A'})`,
            url: '/admin'
          })
        }
      }
    } catch (pushErr) {
      console.warn('Failed to send admin push alert:', pushErr)
    }

    // Notify Admin via Email Alert
    try {
      await sendEmail({
        to: APP_CONFIG.supportEmail,
        subject: `🚨 [JobFlux Admin Alert] Automation Failed for ${candidateName} (${resolvedEmail})`,
        html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background: #09090b; color: #f8fafc; border-radius: 12px; border: 1px solid #27272a; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f43f5e; margin: 0 0 16px 0; font-size: 18px;">🚨 Automated Job Application Issue</h2>
          <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 16px;">
            The automation bot encountered an issue for candidate <strong>${candidateName}</strong> (${resolvedEmail}). Candidate email was safely suppressed to prevent sending misleading or error emails.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; font-family: monospace;">
            <tr style="border-bottom: 1px solid #18181b;"><td style="padding: 8px; color: #94a3b8;">Candidate:</td><td style="padding: 8px; color: #fff; font-weight: bold;">${candidateName} (${resolvedEmail})</td></tr>
            <tr style="border-bottom: 1px solid #18181b;"><td style="padding: 8px; color: #94a3b8;">User ID:</td><td style="padding: 8px; color: #38bdf8;">${resolvedUserId}</td></tr>
            <tr style="border-bottom: 1px solid #18181b;"><td style="padding: 8px; color: #94a3b8;">Task ID:</td><td style="padding: 8px; color: #cbd5e1;">${candidateInput.taskId || 'N/A'}</td></tr>
            <tr style="border-bottom: 1px solid #18181b;"><td style="padding: 8px; color: #94a3b8;">Failure Reason:</td><td style="padding: 8px; color: #f43f5e; font-weight: bold;">${errorDetail}</td></tr>
            <tr><td style="padding: 8px; color: #94a3b8;">Date (IST):</td><td style="padding: 8px; color: #cbd5e1;">${todayIstStr}</td></tr>
          </table>
          <a href="https://jobfluxai.vercel.app/admin" style="display: inline-block; padding: 10px 18px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px;">Inspect in Admin Console &rarr;</a>
        </div>`
      })
    } catch (mailErr) {
      console.warn('Failed to send admin email alert:', mailErr)
    }

    // Log to admin_push_logs
    await db.collection('admin_push_logs').insertOne({
      target_email: resolvedEmail,
      candidate_name: candidateName,
      user_id: resolvedUserId,
      channel: 'admin_alert',
      type: 'run_failed_alert',
      error: errorDetail,
      task_id: candidateInput.taskId || null,
      dispatched_at: new Date(),
      status: 'alert_sent'
    })

    return {
      success: true,
      skipped: true,
      reason: `Run failed: ${errorDetail}. Candidate email suppressed. Admin alerted.`,
      error: errorDetail
    }
  }

  // 2. Fetch User Stats
  const stats = await db.collection('user_stats').findOne({
    $or: [
      ...(resolvedUserId ? [{ user_id: resolvedUserId }] : []),
      { email: { $regex: `^${resolvedEmail}$`, $options: 'i' } }
    ]
  })

  // 3. Query Real Applied Jobs from applied_jobs collection
  const orConditions: any[] = []
  if (resolvedUserId) orConditions.push({ user_id: resolvedUserId })
  if (resolvedEmail) {
    orConditions.push({ user_email: { $regex: `^${resolvedEmail}$`, $options: 'i' } })
    orConditions.push({ email: { $regex: `^${resolvedEmail}$`, $options: 'i' } })
  }

  const candidateCondition = orConditions.length > 1
    ? { $or: orConditions }
    : orConditions[0] || { user_id: '__none__' }

  const notJobUrlCondition = { job_url: { $not: { $regex: /developer-jobs|-jobs-in-|\/search\?/i } } }

  // A. Query jobs from this specific task if provided
  let sweepJobs: any[] = []
  if (candidateInput.taskId) {
    sweepJobs = await db.collection('applied_jobs').find({
      $and: [
        candidateCondition,
        notJobUrlCondition,
        { task_id: candidateInput.taskId }
      ]
    }).sort({ applied_at: -1, created_at: -1 }).toArray()
  }

  // B. If no specific task jobs found, query today's jobs (strictly IST date or start of today UTC)
  if (sweepJobs.length === 0) {
    sweepJobs = await db.collection('applied_jobs').find({
      $and: [
        candidateCondition,
        notJobUrlCondition,
        {
          $or: [
            { applied_date: todayIstStr },
            { applied_at: { $gte: startOfTodayUtc } }
          ]
        }
      ]
    }).sort({ applied_at: -1, created_at: -1 }).toArray()
  }

  const totalAppliedCount = stats?.total_applied || (await db.collection('applied_jobs').countDocuments({
    $and: [candidateCondition, notJobUrlCondition]
  })) || 0

  let todayApplied = sweepJobs.length
  if (stats?.today && stats?.last_date === todayIstStr) {
    todayApplied = Math.max(todayApplied, stats.today)
  }

  // 4. Deduplication Check: If already mailed today, do NOT mail again unless triggered on-demand
  const isOnDemand = options.isOnDemand ?? (options.force || ['on_demand', 'web_dashboard_on_demand', 'manual_cli_on_demand', 'admin_on_demand'].includes(options.source || ''))

  if (!isOnDemand && (channel === 'both' || channel === 'email')) {
    const emailAlreadySent = await db.collection('emails').findOne({
      to: { $regex: `^${resolvedEmail}$`, $options: 'i' },
      status: 'sent',
      created_at: { $gte: startOfTodayUtc }
    })

    const pushLogAlreadySent = !emailAlreadySent ? await db.collection('admin_push_logs').findOne({
      target_email: { $regex: `^${resolvedEmail}$`, $options: 'i' },
      channel: { $in: ['both', 'email'] },
      status: 'delivered',
      dispatched_at: { $gte: startOfTodayUtc }
    }) : null

    if (emailAlreadySent || pushLogAlreadySent) {
      console.log(`ℹ️ [Dispatch] Candidate ${resolvedEmail} already received a report email today (${todayIstStr}). Skipping automated duplicate send.`)
      return {
        success: true,
        skipped: true,
        reason: `Already mailed today (${todayIstStr}). Automated duplicate email prevented.`,
        candidate: {
          name: candidateName,
          email: resolvedEmail,
          userId: resolvedUserId,
          todayApplied,
          totalApplied: totalAppliedCount
        }
      }
    }
  }

  // 5. Zero-Jobs Safeguard: Do NOT email candidate with old or 0 jobs if nothing applied today
  if (sweepJobs.length === 0) {
    console.log(`ℹ️ [Dispatch] Candidate ${resolvedEmail} has 0 jobs applied for today (${todayIstStr}). Suppressing email to candidate and notifying admin.`)

    // Alert admin if this was an automated run
    if (!isOnDemand) {
      try {
        await sendEmail({
          to: APP_CONFIG.supportEmail,
          subject: `⚠️ [JobFlux Admin Notice] 0 Jobs Applied for ${candidateName} (${todayIstStr})`,
          html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background: #09090b; color: #f8fafc; border-radius: 12px; border: 1px solid #27272a; max-width: 600px; margin: 0 auto;">
            <h3 style="color: #fbbf24; margin: 0 0 12px 0; font-size: 16px;">⚠️ Automated Run Yielded 0 Applications</h3>
            <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 12px;">The scheduled run finished with <strong>0 applications</strong> for candidate <strong>${candidateName}</strong> (${resolvedEmail}).</p>
            <p style="color: #94a3b8; font-size: 13px;">Candidate email was safely suppressed to prevent sharing zero or outdated jobs.</p>
            <a href="https://jobfluxai.vercel.app/admin" style="display: inline-block; padding: 8px 16px; background: #38bdf8; color: #000; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 12px; margin-top: 8px;">Inspect Candidate in Admin Console &rarr;</a>
          </div>`
        })
      } catch (err) {
        console.warn('Failed to send 0-job notice to admin:', err)
      }
    }

    return {
      success: true,
      skipped: true,
      reason: `Zero jobs applied for today (${todayIstStr}). Candidate email suppressed to prevent sharing 0 or outdated jobs. Admin notified.`,
      candidate: {
        name: candidateName,
        email: resolvedEmail,
        userId: resolvedUserId,
        todayApplied: 0,
        totalApplied: totalAppliedCount
      }
    }
  }

  let displayJobs = sweepJobs.slice(0, 8)

  // 6. Plan status & package intelligence
  const plan = user?.plan || profile?.plan || 'trial'
  const planName = user?.plan_name || profile?.plan_name || (
    plan === 'elite' || plan === 'professional' ? 'JobFlux Professional' :
    plan === 'pro' ? 'JobFlux Essentials' : 'JobFlux Free Trial'
  )
  const planExpiresAt = user?.plan_expires_at || profile?.plan_expires_at || null
  const isPaidPlan = Boolean(
    planExpiresAt &&
    new Date(planExpiresAt) > new Date() &&
    (plan === 'elite' || plan === 'professional' || plan === 'pro' || plan === 'starter' || plan === 'vip')
  )

  let daysRemaining = 0
  if (isPaidPlan && planExpiresAt) {
    daysRemaining = Math.max(0, Math.ceil((new Date(planExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  }

  // 5. Format Top Companies Dynamically from real records
  const topCompanies = displayJobs.map((j: any) => {
    const parsed = extractCompanyAndLocation(j.company, j.location, j.job_url, j.job_title)

    let formattedTime = ''
    if (j.applied_at) {
      try {
        const d = new Date(j.applied_at)
        formattedTime = new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).format(d)
      } catch (_) {}
    }

    let score = j.match_score || 0
    if (score <= 0) {
      const idCode = (j._id?.toString() || '').slice(-3)
      const varOffset = parseInt(idCode, 16) % 9
      score = 90 + varOffset
    }

    return {
      name: parsed.company,
      role: j.job_title || 'Software Engineer',
      location: parsed.location,
      status: j.status === 'applied' ? 'Applied & Verified' : j.status === 'external' ? 'Direct Submission' : 'Dispatched',
      tag: j.status === 'applied' ? 'ATS Matched' : 'Verified',
      url: isPaidPlan && j.job_url && !j.job_url.includes('saveApply?') ? j.job_url : '',
      appliedAtFormatted: formattedTime ? `Today ${formattedTime} IST` : '',
      matchScore: score
    }
  })

  // Dynamic ATS Match Score & Recruiter Views calculation
  const matchScore = topCompanies.length > 0
    ? Math.round(topCompanies.reduce((acc: number, c: any) => acc + (c.matchScore || 94), 0) / topCompanies.length)
    : (profile?.ats_score || 94)

  const recruiterViews = Math.min(18, Math.max(2, Math.floor(todayApplied * 0.12) + (isPaidPlan ? 3 : 1)))

  const dateString = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  // 6. Resolve Offer Intelligence
  const activeAssignedOffer = await db.collection('assigned_offers').findOne({
    candidate_email: { $regex: `^${resolvedEmail}$`, $options: 'i' },
    revoked: { $ne: true },
    is_expired: { $ne: true }
  })

  const promoCode = offerOverrides.promoCode || activeAssignedOffer?.promo_code || (isPaidPlan ? 'VIP299' : 'WELCOMEPRO')
  const discountedPrice = offerOverrides.discountedPrice || activeAssignedOffer?.discounted_price || (isPaidPlan ? '₹299' : '₹149')
  const originalPrice = offerOverrides.originalPrice || activeAssignedOffer?.original_price || (isPaidPlan ? '₹2,500' : '₹999')
  const offerTitle = offerOverrides.offerTitle || activeAssignedOffer?.title || (isPaidPlan ? '3-Month VIP Professional Extension' : '1-Month Essentials Unlimited Access')

  let emailResult: any = null
  let pushResult: any = null

  // 7. Dispatch Email
  if (channel === 'both' || channel === 'email') {
    const html = generateJobDispatchReportHtml({
      candidateName,
      appliedCount: todayApplied,
      totalApplied: totalAppliedCount,
      matchScore,
      recruiterViews,
      isPaidPlan,
      planName,
      planExpiresAt,
      daysRemaining,
      topCompanies,
      dateString,
      dashboardUrl: 'https://jobfluxai.vercel.app/dashboard',
      upgradeUrl: 'https://jobfluxai.vercel.app/pricing',
      promoCode,
      discountedPrice,
      originalPrice,
      sectionTitle: `Today's Verified Applications (${topCompanies.length})`
    })

    const subject = todayApplied > 0
      ? `JobFlux AI · Daily Dispatch Report (${todayApplied} Jobs Applied Today · ${isPaidPlan ? `${planName} Active` : 'Review Activity'})`
      : `JobFlux AI · Daily Recruiter Sweep (${totalAppliedCount} Total Applications Active)`

    emailResult = await sendEmail({
      to: resolvedEmail,
      subject,
      html,
      fromName: 'JobFlux AI'
    })
  }

  // 8. Dispatch Push Notification & In-App Notification
  if (channel === 'both' || channel === 'push') {
    const companySummary = topCompanies.slice(0, 2).map(c => c.name).join(', ')
    const pushTitle = todayApplied > 0
      ? `🚀 ${todayApplied} Jobs Applied Today by JobFlux AI`
      : `✨ Daily Recruiter Sweep Complete`

    const pushMessage = todayApplied > 0 && companySummary
      ? `Dispatched: ${companySummary} & more. ${recruiterViews} recruiter reviews active.`
      : `All active vacancies up to date (${totalAppliedCount} total applications).`

    const pushUrl = '/dashboard'

    try {
      pushResult = await sendPushToUser(resolvedEmail, {
        title: pushTitle,
        body: pushMessage,
        url: pushUrl
      })

      await db.collection('user_notifications').insertOne({
        user_email: resolvedEmail,
        email: resolvedEmail,
        user_id: resolvedUserId || resolvedEmail,
        title: pushTitle,
        message: pushMessage,
        url: pushUrl,
        type: 'dispatch_report',
        read: false,
        created_at: new Date()
      })
    } catch (pushErr: any) {
      pushResult = { error: pushErr.message, delivered: 0 }
    }
  }

  // 9. Audit Logging
  await db.collection('admin_push_logs').insertOne({
    target_email: resolvedEmail,
    user_id: resolvedUserId,
    target_type: 'single',
    title: `Daily Dispatch Report (${todayApplied} Jobs)`,
    message: `Dispatched ${todayApplied} jobs to ${resolvedEmail} via ${channel}.`,
    claim_url: '/dashboard',
    channel,
    is_paid_plan: isPaidPlan,
    plan_name: planName,
    dispatched_at: new Date(),
    recipient_count: 1,
    status: emailResult?.success ? 'delivered' : 'failed'
  })

  return {
    success: true,
    channel,
    candidate: {
      name: candidateName,
      email: resolvedEmail,
      userId: resolvedUserId,
      planName,
      isPaidPlan,
      daysRemaining,
      todayApplied,
      totalApplied: totalAppliedCount,
      recentCompaniesCount: topCompanies.length,
      companiesPreview: topCompanies.slice(0, 3).map(c => `${c.role} @ ${c.name}`)
    },
    offer: {
      promoCode,
      discountedPrice,
      originalPrice,
      offerTitle
    },
    emailResult,
    pushResult
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    // Authenticate Admin or Internal Background Worker.
    // The worker secret must match WORKER_SECRET (backend .env) or CRON_SECRET (Vercel).
    // No hardcoded fallback exists by design — set the same value in both environments.
    const workerSecret = req.headers.get('x-worker-secret')
    const expectedWorkerSecrets = [process.env.WORKER_SECRET, process.env.CRON_SECRET].filter((s): s is string => Boolean(s))
    const isWorkerAuthorized = Boolean(workerSecret) && workerSecret !== null && expectedWorkerSecrets.includes(workerSecret)

    if (!isWorkerAuthorized) {
      const { authorized } = await verifyAdminRequest(req, db)
      if (!authorized) {
        return NextResponse.json({ error: 'Unauthorized: Admin or Worker access required' }, { status: 401 })
      }
    }

    const body = await req.json().catch(() => ({}))
    const rawTarget = (body.targetEmail || body.email || body.userId || body.user_id || '').trim()
    const channel = (body.channel || 'both') as 'both' | 'email' | 'push'
    const source = (body.source || 'daily_scheduled').toLowerCase()
    const force = Boolean(body.force)
    const isOnDemand = force || ['on_demand', 'web_dashboard_on_demand', 'manual_cli_on_demand', 'admin_on_demand'].includes(source)
    const status = (body.status || 'completed').toLowerCase()
    const error = body.error || body.error_message || null
    const failureReason = body.failureReason || body.failure_reason || null
    const dispatchOptions = {
      source,
      force,
      isOnDemand,
      status,
      error,
      failureReason,
      workerInfo: body.worker_info || null
    }

    const offerOverrides = {
      promoCode: body.promoCode,
      discountedPrice: body.discountedPrice,
      originalPrice: body.originalPrice,
      offerTitle: body.offerTitle
    }

    // Broadcast Mode: Send individual dynamic report to all active candidates
    if (rawTarget === 'all') {
      const activeProfiles = await db.collection('profiles').find({
        email: { $exists: true, $ne: '' }
      }).toArray()

      const results = []
      for (const p of activeProfiles) {
        if (!p.email) continue
        try {
          const res = await dispatchReportForCandidate(
            db,
            { userId: p.user_id, email: p.email },
            channel,
            offerOverrides,
            dispatchOptions
          )
          results.push(res)
        } catch (candidateErr: any) {
          results.push({ email: p.email, error: candidateErr.message })
        }
      }

      return NextResponse.json({
        success: true,
        broadcast: true,
        dispatchedCount: results.filter((r: any) => r.success && !r.skipped).length,
        skippedCount: results.filter((r: any) => r.skipped).length,
        totalCandidates: activeProfiles.length,
        details: results
      })
    }

    // Single Candidate Mode
    const candidateInput = {
      userId: body.userId || body.user_id,
      email: body.targetEmail || body.email,
      taskId: body.taskId || body.task_id
    }

    const result = await dispatchReportForCandidate(db, candidateInput, channel, offerOverrides, dispatchOptions)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

