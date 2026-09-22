/**
 * Automated Expiry & Renewal Reminder Service
 * 
 * Manages validity periods for Candidate Plans and Promotional Offers.
 * Automatically identifies candidates expiring in 2 days (48h) and 1 day (24h)
 * and dispatches dual-channel reminders (Google SMTP Email + Background OS Web Push).
 * 
 * Implements strict anti-flooding frequency capping to guarantee a quiet gap (18-24 hours)
 * between notifications so candidates are never bombarded.
 */

import { Db } from "mongodb"
import { sendEmail } from "@/lib/mailService"
import { sendPushToUser } from "@/lib/webPushService"
import { APP_CONFIG } from "@/config/appConfig"

export interface ReminderRecord {
  _id?: any
  email: string
  candidate_name?: string
  reminder_type: "plan_expiry_2d" | "plan_expiry_1d" | "offer_expiry_2d" | "offer_expiry_1d"
  reference_id?: string // promo_code or plan_name
  title: string
  message: string
  expires_at: Date
  channels: {
    email_sent: boolean
    push_delivered: number
  }
  created_at: Date
}

/**
 * Generates responsive branded HTML email for Plan Expiry reminders.
 */
function generatePlanExpiryEmailHtml({
  candidateName,
  daysLeft,
  planName,
  expiresAt,
  renewalUrl
}: {
  candidateName: string
  daysLeft: 1 | 2
  planName: string
  expiresAt: Date
  renewalUrl: string
}): string {
  const isUrgent = daysLeft === 1
  const headerColor = isUrgent ? "#ef4444" : "#f59e0b"
  const badgeText = isUrgent ? "FINAL CALL: EXPIRES IN 24 HOURS" : "EXPIRING IN 48 HOURS"
  const subjectSubtitle = isUrgent
    ? "Your daily recruiter application queue will pause tomorrow morning unless renewed."
    : "Renew your JobFlux AI subscription now to ensure continuous daily recruiter applications."

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JobFlux AI Plan Expiry Notice</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050508; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #050508; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #0c0d14; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
          <tr>
            <td style="padding: 28px 30px; border-bottom: 1px solid #1f2029; background: linear-gradient(180deg, #131422 0%, #0c0d14 100%);">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                      ⚡ JOB<span style="color: #38bdf8;">FLUX</span> <span style="font-size: 11px; background-color: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 8px; border-radius: 6px; font-family: monospace; vertical-align: middle;">AI</span>
                    </div>
                  </td>
                  <td align="right">
                    <span style="background-color: ${isUrgent ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)"}; color: ${headerColor}; border: 1px solid ${isUrgent ? "rgba(239, 68, 68, 0.3)" : "rgba(245, 158, 11, 0.3)"}; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 12px; font-family: monospace; letter-spacing: 0.5px;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 35px 30px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #ffffff;">
                ${isUrgent ? "🚨 Immediate Action Required, " + candidateName : "Heads Up, " + candidateName}
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #a1a1aa;">
                ${subjectSubtitle}
              </p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #12131f; border: 1px solid #27272a; border-radius: 12px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #1f2029;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 12px; color: #71717a;">Current Plan:</td>
                        <td align="right" style="font-size: 13px; font-weight: 700; color: #38bdf8;">${planName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #1f2029;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 12px; color: #71717a;">Expiration Date:</td>
                        <td align="right" style="font-size: 13px; font-weight: 700; font-family: monospace; color: ${headerColor};">
                          ${expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 12px; color: #71717a;">Status Impact:</td>
                        <td align="right" style="font-size: 12px; font-weight: 600; color: #f43f5e;">Daily 6 AM IST Sweep Paused</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                <tr>
                  <td align="center">
                    <a href="${renewalUrl}" style="display: block; width: 100%; box-sizing: border-box; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000000; font-size: 14px; font-weight: 800; padding: 14px 25px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
                      Renew Plan to Maintain Continuous Job Apply Engine →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #71717a;">
                Your Harvard ATS Resume formatting and verified screening profile will remain securely saved.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #1f2029; background-color: #08080d; font-size: 11px; color: #52525b; text-align: center;">
              JobFlux AI Automated Cloud Cockpit · Support: ${APP_CONFIG.supportEmail}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates responsive branded HTML email for Offer Expiry reminders.
 */
function generateOfferExpiryEmailHtml({
  candidateName,
  daysLeft,
  offerTitle,
  discountBadge,
  promoCode,
  discountedPrice,
  originalPrice,
  expiresAt,
  claimUrl
}: {
  candidateName: string
  daysLeft: 1 | 2
  offerTitle: string
  discountBadge: string
  promoCode: string
  discountedPrice: string
  originalPrice: string
  expiresAt: Date
  claimUrl: string
}): string {
  const isUrgent = daysLeft === 1
  const badgeText = isUrgent ? "FINAL HOURS: CODE EXPIRES TOMORROW" : "SPECIAL DEAL: 48 HOURS LEFT"

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Exclusive JobFlux Offer is Expiring</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050508; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #050508; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #0c0d14; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
          <tr>
            <td style="padding: 28px 30px; border-bottom: 1px solid #1f2029; background: linear-gradient(180deg, #1c1505 0%, #0c0d14 100%);">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                      ⚡ JOB<span style="color: #fbbf24;">FLUX</span> <span style="font-size: 11px; background-color: rgba(251, 191, 36, 0.15); color: #fbbf24; padding: 2px 8px; border-radius: 6px; font-family: monospace; vertical-align: middle;">DEAL</span>
                    </div>
                  </td>
                  <td align="right">
                    <span style="background-color: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 12px; font-family: monospace; letter-spacing: 0.5px;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 35px 30px;">
              <div style="display: inline-block; background-color: #f59e0b; color: #000000; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; font-family: monospace; margin-bottom: 12px;">
                ${discountBadge}
              </div>
              <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 800; color: #ffffff;">
                ${offerTitle}
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #a1a1aa;">
                Hi ${candidateName}, your exclusive administrator assigned offer is set to expire on <strong style="color: #ffffff;">${expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</strong>.
              </p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(20, 20, 30, 0.6) 100%); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; margin-bottom: 25px; padding: 20px;">
                <tr>
                  <td align="center">
                    <div style="font-size: 12px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Exclusive Discounted Price</div>
                    <div style="font-size: 32px; font-weight: 900; color: #10b981; font-family: monospace; margin-bottom: 4px;">
                      ${discountedPrice}
                      <span style="font-size: 16px; color: #71717a; text-decoration: line-through; margin-left: 8px;">${originalPrice}</span>
                    </div>
                    <div style="font-size: 12px; color: #f59e0b; font-family: monospace;">
                      Promo Code: <strong>${promoCode}</strong> (Locked to your account)
                    </div>
                  </td>
                </tr>
              </table>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                <tr>
                  <td align="center">
                    <a href="${claimUrl}" style="display: block; width: 100%; box-sizing: border-box; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-size: 14px; font-weight: 800; padding: 14px 25px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                      Claim Exclusive Deal Before It Expires →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #1f2029; background-color: #08080d; font-size: 11px; color: #52525b; text-align: center;">
              JobFlux AI Automated Cloud Cockpit · Support: ${APP_CONFIG.supportEmail}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Executes an automated expiry sweep across all candidate plans and promotional offers.
 * Enforces anti-flooding cooldowns (min 18 hours between alerts to the same user).
 */
export async function checkAndDispatchExpiryReminders(
  db: Db,
  options?: { candidateEmail?: string; force?: boolean }
): Promise<{
  plan_reminders_sent: number
  offer_reminders_sent: number
  skipped_cooldown: number
  total_processed: number
  details: Array<{ email: string; type: string; status: string }>
}> {
  const now = new Date()
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jobfluxai.vercel.app"
  const details: Array<{ email: string; type: string; status: string }> = []

  let planRemindersSent = 0
  let offerRemindersSent = 0
  let skippedCooldown = 0

  const cooldownCutoff = new Date(now.getTime() - 18 * 60 * 60 * 1000)

  // PART A: CANDIDATE PLAN EXPIRY SCAN
  const profilesQuery: any = options?.candidateEmail
    ? { email: options.candidateEmail.toLowerCase().trim() }
    : {
        $or: [
          { plan_expires_at: { $exists: true, $ne: null } },
          { trial_expires_at: { $exists: true, $ne: null } }
        ]
      }

  const profiles = await db.collection("profiles").find(profilesQuery).toArray()

  for (const p of profiles) {
    const email = (p.email || "").toLowerCase().trim()
    if (!email || !email.includes("@")) continue

    const rawExpiry = p.plan_expires_at || p.trial_expires_at
    if (!rawExpiry) continue

    const expiresAt = new Date(rawExpiry)
    const diffHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (diffHours <= 0 || diffHours > 48) continue

    const daysLeft: 1 | 2 = diffHours <= 24 ? 1 : 2
    const reminderType: "plan_expiry_1d" | "plan_expiry_2d" = daysLeft === 1 ? "plan_expiry_1d" : "plan_expiry_2d"

    const alreadySent = await db.collection("expiry_reminders_sent").findOne({
      email,
      reminder_type: reminderType,
      expires_at: {
        $gte: new Date(expiresAt.getTime() - 12 * 60 * 60 * 1000),
        $lte: new Date(expiresAt.getTime() + 12 * 60 * 60 * 1000)
      }
    })

    if (alreadySent && !options?.force) {
      details.push({ email, type: reminderType, status: "already_sent_in_cycle" })
      continue
    }

    const recentAnyReminder = await db.collection("expiry_reminders_sent").findOne({
      email,
      created_at: { $gte: cooldownCutoff }
    })

    if (recentAnyReminder && !options?.force) {
      skippedCooldown++
      details.push({ email, type: reminderType, status: "skipped_18h_cooldown" })
      continue
    }

    const planName = p.plan_name || (p.plan === "pro" ? "JobFlux PRO" : "3-Day Free Access")
    const renewalUrl = `${siteUrl}/pricing?renew=true&email=${encodeURIComponent(email)}`
    const candidateName = p.name || email.split("@")[0]

    const emailSubject = daysLeft === 1
      ? "🚨 Final 24h Call: Your JobFlux AI Plan Expires Tomorrow"
      : "⚡ 48 Hours Remaining: Renew Your JobFlux AI Plan"

    const emailHtml = generatePlanExpiryEmailHtml({
      candidateName,
      daysLeft,
      planName,
      expiresAt,
      renewalUrl
    })

    let emailSent = false
    try {
      const mailRes = await sendEmail({
        to: email,
        subject: emailSubject,
        html: emailHtml,
        text: `Hi ${candidateName},\n\nYour JobFlux AI plan (${planName}) will expire in ${daysLeft} day(s).\nRenew here: ${renewalUrl}`
      })
      emailSent = Boolean(mailRes && (mailRes as any).success)
    } catch (mErr) {
      console.warn(`[ExpiryReminders] Email failed to ${email}:`, mErr)
    }

    let pushDelivered = 0
    try {
      const pushTitle = daysLeft === 1
        ? "🚨 Plan Expires in 24 Hours!"
        : "⏰ Plan Renewal: 48h Remaining"
      const pushBody = daysLeft === 1
        ? `Your ${planName} expires tomorrow. Tap to renew and keep daily applications active.`
        : `Your ${planName} expires in 2 days. 1-click renewal available.`

      const pushRes = await sendPushToUser(email, {
        title: pushTitle,
        body: pushBody,
        url: "/pricing",
        tag: "jobflux_plan_expiry"
      })
      pushDelivered = pushRes.delivered
    } catch (pErr) {
      console.warn(`[ExpiryReminders] Push notice for ${email}:`, pErr)
    }

    await db.collection("expiry_reminders_sent").insertOne({
      email,
      candidate_name: candidateName,
      reminder_type: reminderType,
      reference_id: planName,
      title: emailSubject,
      message: `${planName} expires in ${daysLeft} day(s)`,
      expires_at: expiresAt,
      channels: {
        email_sent: emailSent,
        push_delivered: pushDelivered
      },
      created_at: now
    })

    await db.collection("user_notifications").insertOne({
      email,
      type: "plan_expiry_alert",
      title: daysLeft === 1 ? "🚨 Plan Expires in 24 Hours!" : "⏰ Plan Renewal Notice (48h)",
      message: `Your ${planName} expires on ${expiresAt.toLocaleDateString()}. Tap to renew now.`,
      claim_url: "/pricing",
      read: false,
      created_at: now
    })

    planRemindersSent++
    details.push({ email, type: reminderType, status: `dispatched_email_${emailSent}_push_${pushDelivered}` })
  }

  // PART B: ASSIGNED PROMOTIONAL OFFER EXPIRY SCAN
  const offersQuery: any = {
    claimed: false,
    expires_at: { $exists: true, $ne: null }
  }
  if (options?.candidateEmail) {
    offersQuery.candidate_email = options.candidateEmail.toLowerCase().trim()
  }

  const assignedOffers = await db.collection("assigned_offers").find(offersQuery).toArray()

  for (const offer of assignedOffers) {
    const email = (offer.candidate_email || "").toLowerCase().trim()
    if (!email || !email.includes("@")) continue

    const expiresAt = new Date(offer.expires_at)
    const diffHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (diffHours <= 0 || diffHours > 48) continue

    const daysLeft: 1 | 2 = diffHours <= 24 ? 1 : 2
    const reminderType: "offer_expiry_1d" | "offer_expiry_2d" = daysLeft === 1 ? "offer_expiry_1d" : "offer_expiry_2d"
    const promoCode = (offer.promo_code || "").toUpperCase()

    const alreadySent = await db.collection("expiry_reminders_sent").findOne({
      email,
      reminder_type: reminderType,
      reference_id: promoCode
    })

    if (alreadySent && !options?.force) {
      details.push({ email, type: reminderType, status: "offer_reminder_already_sent" })
      continue
    }

    const recentAnyReminder = await db.collection("expiry_reminders_sent").findOne({
      email,
      created_at: { $gte: cooldownCutoff }
    })

    if (recentAnyReminder && !options?.force) {
      skippedCooldown++
      details.push({ email, type: reminderType, status: "skipped_18h_cooldown" })
      continue
    }

    const candidateName = offer.candidate_name || email.split("@")[0]
    const claimUrl = offer.claim_url || `${siteUrl}/pricing?promo=${encodeURIComponent(promoCode)}`

    const emailSubject = daysLeft === 1
      ? `⏰ Final Hours: Code ${promoCode} Expires Tomorrow!`
      : `🎁 48h Remaining: ${offer.discount_badge || "Special Discount"} on JobFlux AI`

    const emailHtml = generateOfferExpiryEmailHtml({
      candidateName,
      daysLeft,
      offerTitle: offer.offer_title || "Exclusive JobFlux Discount",
      discountBadge: offer.discount_badge || "SPECIAL OFFER",
      promoCode,
      discountedPrice: offer.discounted_price || "₹49",
      originalPrice: offer.original_price || "₹99",
      expiresAt,
      claimUrl
    })

    let emailSent = false
    try {
      const mailRes = await sendEmail({
        to: email,
        subject: emailSubject,
        html: emailHtml,
        text: `Hi ${candidateName},\n\nYour exclusive discount code ${promoCode} expires in ${daysLeft} day(s).\nClaim here: ${claimUrl}`
      })
      emailSent = Boolean(mailRes && (mailRes as any).success)
    } catch (mErr) {
      console.warn(`[ExpiryReminders] Offer email failed for ${email}:`, mErr)
    }

    let pushDelivered = 0
    try {
      const pushTitle = daysLeft === 1
        ? `⏰ Code ${promoCode} Expires Tomorrow!`
        : `🎁 48h Left: ${offer.discount_badge}`
      const pushBody = `${offer.offer_title} (${offer.original_price} → ${offer.discounted_price}). 1-click claim locked to your account.`

      const pushRes = await sendPushToUser(email, {
        title: pushTitle,
        body: pushBody,
        url: `/pricing?promo=${encodeURIComponent(promoCode)}`,
        tag: `jobflux_offer_${promoCode}`
      })
      pushDelivered = pushRes.delivered
    } catch (pErr) {
      console.warn(`[ExpiryReminders] Offer push notice for ${email}:`, pErr)
    }

    await db.collection("expiry_reminders_sent").insertOne({
      email,
      candidate_name: candidateName,
      reminder_type: reminderType,
      reference_id: promoCode,
      title: emailSubject,
      message: `Offer code ${promoCode} expires in ${daysLeft} day(s)`,
      expires_at: expiresAt,
      channels: {
        email_sent: emailSent,
        push_delivered: pushDelivered
      },
      created_at: now
    })

    offerRemindersSent++
    details.push({ email, type: reminderType, status: `dispatched_email_${emailSent}_push_${pushDelivered}` })
  }

  return {
    plan_reminders_sent: planRemindersSent,
    offer_reminders_sent: offerRemindersSent,
    skipped_cooldown: skippedCooldown,
    total_processed: details.length,
    details
  }
}

/**
 * Returns comprehensive statistics for the Admin Cockpit on upcoming expiries and reminder history.
 */
export async function getExpiryReminderStats(db: Db): Promise<{
  plans_expiring_24h: number
  plans_expiring_48h: number
  offers_expiring_24h: number
  offers_expiring_48h: number
  total_active_offers: number
  recent_reminders: ReminderRecord[]
}> {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  const profiles = await db.collection("profiles").find({
    $or: [
      { plan_expires_at: { $exists: true, $ne: null } },
      { trial_expires_at: { $exists: true, $ne: null } }
    ]
  }).toArray()

  let plans24h = 0
  let plans48h = 0
  profiles.forEach(p => {
    const raw = p.plan_expires_at || p.trial_expires_at
    if (!raw) return
    const exp = new Date(raw)
    if (exp > now && exp <= in24h) plans24h++
    else if (exp > in24h && exp <= in48h) plans48h++
  })

  const activeOffers = await db.collection("assigned_offers").find({
    claimed: false,
    expires_at: { $exists: true, $ne: null }
  }).toArray()

  let offers24h = 0
  let offers48h = 0
  activeOffers.forEach(o => {
    if (!o.expires_at) return
    const exp = new Date(o.expires_at)
    if (exp > now && exp <= in24h) offers24h++
    else if (exp > in24h && exp <= in48h) offers48h++
  })

  const recentReminders = await db.collection("expiry_reminders_sent")
    .find({})
    .sort({ created_at: -1 })
    .limit(20)
    .toArray()

  return {
    plans_expiring_24h: plans24h,
    plans_expiring_48h: plans48h,
    offers_expiring_24h: offers24h,
    offers_expiring_48h: offers48h,
    total_active_offers: activeOffers.length,
    recent_reminders: recentReminders as any[]
  }
}
