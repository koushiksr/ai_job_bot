import nodemailer from 'nodemailer'
import { getDb } from '@/lib/mongodb'
import { APP_CONFIG } from '@/config/appConfig'

interface SendMailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  fromName?: string
}

interface MailResult {
  success: boolean
  messageId?: string
  simulated?: boolean
  error?: string
}

/**
 * Returns sanitized SMTP credentials from environment variables.
 */
export function getSmtpCredentials() {
  const user = (process.env.SMTP_USER || process.env.ADMIN_MAIL_TO_SEND_PASSWORD || APP_CONFIG.supportEmail).trim()
  const pass = (process.env.SMTP_PASS || process.env.ADMIN_MAIL_PASSWORD || 'tidw wevs gebl qljb')
    .trim()
    .replace(/['"]/g, '')
    .replace(/\s+/g, '')

  return { user, pass }
}

/**
 * Returns dynamic SMTP credentials.
 * Prioritizes active credentials saved in MongoDB `system_config` (key: 'smtp_config'),
 * allowing instant password updates from the admin UI without redeploying.
 */
export async function getDynamicSmtpCredentials(db?: any) {
  let { user, pass } = getSmtpCredentials()

  try {
    const database = db || (await getDb())
    if (database) {
      const config = await database.collection('system_config').findOne({ key: 'smtp_config' })
      if (config) {
        if (config.user && typeof config.user === 'string' && config.user.trim()) {
          user = config.user.trim()
        }
        if (config.pass && typeof config.pass === 'string' && config.pass.trim()) {
          pass = config.pass.trim().replace(/['"]/g, '').replace(/\s+/g, '')
        }
      }
    }
  } catch (err) {
    // Fallback quietly to env vars
  }

  return { user, pass }
}

/**
 * Creates and returns a Nodemailer transporter configured for Gmail SMTP.
 */
export function createTransporter(credentials?: { user: string; pass: string }) {
  const { user, pass } = credentials || getSmtpCredentials()

  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass
    }
  })
}

/**
 * Centralized mail dispatch function.
 * Supports Resend API (if configured) or direct Gmail SMTP with MongoDB audit logging.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  fromName = 'JobFlux AI'
}: SendMailOptions): Promise<MailResult> {
  const recipient = Array.isArray(to) ? to.join(', ') : to
  const now = new Date()

  let db: any = null
  try {
    db = await getDb()
  } catch (err) {
    console.warn('MongoDB connection unavailable for mail audit:', err)
  }

  // 1. Check for Resend API Key in env or MongoDB
  let resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey && db) {
    try {
      const resendConfig = await db.collection('system_config').findOne({ key: 'resend_config' })
      if (resendConfig?.api_key) {
        resendApiKey = resendConfig.api_key.trim()
      }
    } catch (_) {}
  }

  if (resendApiKey) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@jobfluxai.com'
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `"${fromName}" <${fromEmail}>`,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        })
      })

      const data = await response.json()
      if (response.ok) {
        if (db) {
          await db.collection('emails').insertOne({
            to: recipient,
            from: `"${fromName}" <${fromEmail}>`,
            subject,
            html_preview: html.slice(0, 1000),
            status: 'sent',
            provider: 'resend',
            message_id: data.id,
            created_at: now
          })
        }
        return {
          success: true,
          messageId: data.id,
          simulated: false
        }
      }
    } catch (resendErr: any) {
      console.warn('Resend dispatch failed, falling back to Gmail SMTP:', resendErr.message)
    }
  }

  // 2. Gmail SMTP Delivery
  const { user, pass } = await getDynamicSmtpCredentials(db)
  const formattedFrom = `"${fromName}" <${user}>`

  try {
    const transporter = createTransporter({ user, pass })
    const info = await transporter.sendMail({
      from: formattedFrom,
      to: recipient,
      subject,
      text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      html
    })

    // Log successful dispatch in MongoDB
    if (db) {
      await db.collection('emails').insertOne({
        to: recipient,
        from: formattedFrom,
        subject,
        html_preview: html.slice(0, 1000),
        status: 'sent',
        provider: 'gmail_smtp',
        message_id: info.messageId,
        smtp_response: info.response,
        created_at: now
      })
    }

    return {
      success: true,
      messageId: info.messageId,
      simulated: false
    }
  } catch (smtpErr: any) {
    console.error('SMTP transport dispatch notice (logging to database):', smtpErr.message)

    // Resilient fallback: Save email payload into MongoDB audit collection
    if (db) {
      try {
        await db.collection('emails').insertOne({
          to: recipient,
          from: formattedFrom,
          subject,
          html_preview: html.slice(0, 1000),
          status: 'failed',
          provider: 'gmail_smtp',
          smtp_error: smtpErr.message || 'SMTP Authentication required',
          created_at: now
        })
      } catch (logErr) {
        console.error('Failed to log email to audit collection:', logErr)
      }
    }

    return {
      success: false,
      simulated: true,
      error: smtpErr.message,
      messageId: `failed_${Date.now()}`
    }
  }
}

/**
 * Universal HTML Template: Password Reset Request
 * Clean, modern executive design with JobFlux Helpdesk branding.
 */
export function generatePasswordResetHtml(name: string, resetUrl: string, otp: string) {
  const previewText = `Your JobFlux AI verification code is ${otp}. Use this code or click the secure link to reset your password.`
  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>Reset Your Password · JobFlux Helpdesk</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container-table { width: 100% !important; max-width: 100% !important; border-radius: 12px !important; }
      .mobile-padding { padding: 22px 16px !important; }
      .mobile-header-padding { padding: 20px 14px !important; }
      .mobile-stack { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .mobile-btn { display: block !important; width: 100% !important; text-align: center !important; padding: 14px 16px !important; box-sizing: border-box !important; font-size: 14px !important; }
      .mobile-title { font-size: 20px !important; line-height: 1.25 !important; }
      .mobile-otp { font-size: 22px !important; letter-spacing: 4px !important; }
      .mobile-logo { width: 68px !important; height: 68px !important; min-width: 68px !important; min-height: 68px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0b0c0e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e4e4e7;-webkit-font-smoothing:antialiased;">
  <!-- Hidden Preheader for Mobile Inbox Preview -->
  <div style="display:none;font-size:1px;color:#0b0c0e;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0b0c0e;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="container-table" style="max-width:540px;background-color:#131416;border:1px solid #222428;border-radius:14px;overflow:hidden;box-shadow:0 20px 30px rgba(0,0,0,0.5);">
          <!-- Subtle Accent Line -->
          <tr>
            <td style="height:2px;background-color:#38bdf8;"></td>
          </tr>

          <!-- Header with JobFlux AI Branding -->
          <tr>
            <td class="mobile-header-padding" align="center" style="padding:26px 20px 18px 20px;background-color:#16171a;border-bottom:1px solid #222428;text-align:center;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;text-align:center;">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="https://jobfluxai.vercel.app" target="_blank" style="text-decoration:none;display:inline-block;">
                      <img class="mobile-logo" src="https://jobfluxai.vercel.app/icon.png" width="68" height="68" alt="JobFlux AI Logo" style="display:block;width:68px;height:68px;min-width:68px;min-height:68px;max-width:68px;max-height:68px;border-radius:14px;background-color:#0b0c0e;border:1px solid #2a2d34;margin:0 auto;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <div style="font-size:20px;font-weight:700;letter-spacing:-0.3px;color:#ffffff;line-height:1.2;">
                      JobFlux <span style="color:#38bdf8;">AI</span>
                    </div>
                    <div style="font-size:11px;font-family:monospace;color:#9ca3af;letter-spacing:0.5px;margin-top:3px;">
                      Autonomous Career &amp; Recruitment Intelligence
                    </div>
                    <div style="margin-top:10px;">
                      <span style="display:inline-block;font-size:10px;font-family:monospace;font-weight:600;background-color:#1a1c20;color:#94a3b8;border:1px solid #2d3036;padding:3px 10px;border-radius:6px;text-transform:uppercase;letter-spacing:0.5px;">
                        Security Verification
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td class="mobile-padding" style="padding:30px 24px;">
              <h1 class="mobile-title" style="margin:0 0 12px 0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                Reset Your Password
              </h1>
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#9ca3af;">
                Hi <strong style="color:#f4f4f5;">${name || 'Candidate'}</strong>, we received a password recovery request for your JobFlux AI account. Use the button or code below to configure your new password:
              </p>

              <!-- Reset Action Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:20px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" class="mobile-btn" style="display:inline-block;background-color:#ffffff;color:#0b0c0e;font-size:14px;font-weight:700;text-decoration:none;padding:13px 32px;border-radius:8px;">
                      Reset Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- 6-Digit OTP Box -->
              <div style="background-color:#0b0c0e;border:1px solid #222428;border-radius:10px;padding:16px;text-align:center;margin:20px 0;">
                <span style="display:block;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;font-weight:600;">
                  Or enter this 6-digit one-time code
                </span>
                <span class="mobile-otp" style="font-size:24px;font-weight:700;font-family:monospace;letter-spacing:5px;color:#38bdf8;">
                  ${otp}
                </span>
              </div>

              <p style="margin:0 0 12px 0;font-size:12px;line-height:1.6;color:#71717a;">
                This link and verification code expire in <strong>60 minutes</strong>. If you did not make this request, you can safely ignore this notice.
              </p>
              <p style="margin:0;font-size:11px;line-height:1.5;color:#52525b;word-break:break-all;">
                Direct URL: <a href="${resetUrl}" style="color:#38bdf8;text-decoration:underline;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- JobFlux Helpdesk Footer -->
          <tr>
            <td style="padding:18px 24px;background-color:#0e0f11;border-top:1px solid #222428;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#e4e4e7;">
                JobFlux Helpdesk
              </p>
              <p style="margin:0 0 6px 0;font-size:11px;color:#71717a;line-height:1.5;">
                Autonomous Career &amp; Recruitment Intelligence
              </p>
              <p style="margin:0;font-size:11px;color:#52525b;">
                Support: <a href="mailto:support@jobfluxai.com" style="color:#38bdf8;text-decoration:none;">support@jobfluxai.com</a> &bull; Priority Helpdesk
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * Universal HTML Template: Purchase Offer & Promotional Upgrade
 * Clean, modern executive design with JobFlux Helpdesk branding.
 */
export function generatePurchaseOfferHtml({
  candidateName,
  offerTitle,
  discountBadge,
  originalPrice,
  discountedPrice,
  promoCode = 'OFFER90',
  claimUrl = 'https://jobfluxai.vercel.app/pricing',
  customMessage
}: {
  candidateName: string
  offerTitle: string
  discountBadge: string
  originalPrice: string
  discountedPrice: string
  promoCode?: string
  claimUrl?: string
  customMessage?: string
}) {
  const previewText = `Exclusive Offer: ${offerTitle} for ${discountedPrice} (Save against ${originalPrice}) with code ${promoCode}.`
  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>${offerTitle} · JobFlux Exclusive Offer</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container-table { width: 100% !important; max-width: 100% !important; border-radius: 12px !important; }
      .mobile-padding { padding: 22px 16px !important; }
      .mobile-header-padding { padding: 20px 14px !important; }
      .mobile-stack { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .mobile-btn { display: block !important; width: 100% !important; text-align: center !important; padding: 14px 16px !important; box-sizing: border-box !important; font-size: 14px !important; }
      .mobile-title { font-size: 20px !important; line-height: 1.25 !important; }
      .mobile-promo-col { margin-top: 12px !important; text-align: left !important; }
      .mobile-logo { width: 68px !important; height: 68px !important; min-width: 68px !important; min-height: 68px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0b0c0e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e4e4e7;-webkit-font-smoothing:antialiased;">
  <!-- Hidden Preheader for Mobile Inbox Preview -->
  <div style="display:none;font-size:1px;color:#0b0c0e;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0b0c0e;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="container-table" style="max-width:550px;background-color:#131416;border:1px solid #222428;border-radius:14px;overflow:hidden;box-shadow:0 20px 30px rgba(0,0,0,0.5);">
          <!-- Subtle Accent Line -->
          <tr>
            <td style="height:2px;background-color:#38bdf8;"></td>
          </tr>

          <!-- Header with JobFlux AI Branding -->
          <tr>
            <td class="mobile-header-padding" align="center" style="padding:26px 20px 18px 20px;background-color:#16171a;border-bottom:1px solid #222428;text-align:center;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;text-align:center;">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="https://jobfluxai.vercel.app" target="_blank" style="text-decoration:none;display:inline-block;">
                      <img class="mobile-logo" src="https://jobfluxai.vercel.app/icon.png" width="68" height="68" alt="JobFlux AI Logo" style="display:block;width:68px;height:68px;min-width:68px;min-height:68px;max-width:68px;max-height:68px;border-radius:14px;background-color:#0b0c0e;border:1px solid #2a2d34;margin:0 auto;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <div style="font-size:20px;font-weight:700;letter-spacing:-0.3px;color:#ffffff;line-height:1.2;">
                      JobFlux <span style="color:#38bdf8;">AI</span>
                    </div>
                    <div style="font-size:11px;font-family:monospace;color:#9ca3af;letter-spacing:0.5px;margin-top:3px;">
                      Autonomous Career &amp; Recruitment Intelligence
                    </div>
                    <div style="margin-top:10px;">
                      <span style="display:inline-block;font-size:10px;font-family:monospace;font-weight:600;background-color:#1a1c20;color:#38bdf8;border:1px solid #28303d;padding:3px 10px;border-radius:6px;text-transform:uppercase;letter-spacing:0.5px;">
                        ${discountBadge || 'PROMOTIONAL OFFER'}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="mobile-padding" style="padding:30px 24px;">
              <div style="font-size:11px;font-weight:600;color:#38bdf8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;">
                Account Upgrade Pass
              </div>
              <h1 class="mobile-title" style="margin:0 0 12px 0;font-size:21px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;line-height:1.25;">
                ${offerTitle}
              </h1>
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#9ca3af;">
                Hi <strong style="color:#f4f4f5;">${candidateName || 'Candidate'}</strong>,
              </p>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#d4d4d8;">
                ${customMessage || 'We have reserved an exclusive promotional upgrade for your account to accelerate your interview pipeline with continuous daily job applications, Harvard ATS resume formatting, and direct recruiter visibility.'}
              </p>

              <!-- Deal Card -->
              <div style="background-color:#0b0c0e;border:1px solid #222428;border-radius:12px;padding:18px;margin:20px 0;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td class="mobile-stack" valign="middle">
                      <div style="font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;font-weight:600;">
                        Promotional Rate
                      </div>
                      <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td valign="baseline" style="font-size:28px;font-weight:700;color:#ffffff;font-family:monospace;line-height:1;">
                            ${discountedPrice}
                          </td>
                          <td valign="baseline" style="padding-left:8px;font-size:15px;color:#71717a;text-decoration:line-through;line-height:1;">
                            ${originalPrice}
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td class="mobile-stack mobile-promo-col" align="right" valign="middle">
                      <div style="display:inline-block;background-color:#16171a;border:1px solid #2e3035;padding:6px 14px;border-radius:6px;text-align:center;">
                        <span style="display:block;font-size:9px;color:#71717a;text-transform:uppercase;margin-bottom:1px;font-weight:600;">Code</span>
                        <span style="font-size:13px;font-weight:700;font-family:monospace;color:#38bdf8;">${promoCode}</span>
                      </div>
                    </td>
                  </tr>
                </table>

                <div style="margin-top:16px;padding-top:14px;border-top:1px solid #1c1d21;">
                  <ul style="margin:0;padding-left:18px;font-size:12px;color:#9ca3af;line-height:1.8;">
                    <li>Daily Autonomous Application Sweeps on Naukri (600+ monthly applies)</li>
                    <li>Up to 5 On-Demand Real-Time Sweeps per Week</li>
                    <li>Verified Direct Job Portal Link Access &amp; Status Logs</li>
                    <li>Application Records Export to CSV Spreadsheet</li>
                    <li>Harvard / FAANG ATS Resume Builder &amp; 1-Click Bot Sync</li>
                  </ul>
                </div>
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:22px 0 10px 0;">
                <tr>
                  <td align="center">
                    <a href="${claimUrl}" class="mobile-btn" style="display:inline-block;background-color:#ffffff;color:#0b0c0e;font-size:14px;font-weight:700;text-decoration:none;padding:14px 34px;border-radius:8px;">
                      Claim Offer &amp; Activate &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:10px 0 0 0;font-size:11px;text-align:center;color:#71717a;">
                Instant digital activation upon checkout. Cancel or adjust anytime.
              </p>
            </td>
          </tr>

          <!-- JobFlux Helpdesk Footer -->
          <tr>
            <td style="padding:18px 24px;background-color:#0e0f11;border-top:1px solid #222428;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#e4e4e7;">
                JobFlux Helpdesk
              </p>
              <p style="margin:0 0 6px 0;font-size:11px;color:#71717a;line-height:1.5;">
                Autonomous Career &amp; Recruitment Intelligence
              </p>
              <p style="margin:0;font-size:11px;color:#52525b;">
                Support: <a href="mailto:support@jobfluxai.com" style="color:#38bdf8;text-decoration:none;">support@jobfluxai.com</a> &bull; Priority Helpdesk
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

export interface JobDispatchReportOptions {
  candidateName: string
  appliedCount: number
  totalApplied?: number
  totalTargetCount?: number
  matchScore?: number
  recruiterViews?: number
  isPaidPlan?: boolean
  planName?: string
  planExpiresAt?: string | Date | null
  daysRemaining?: number
  freeTrialUsed?: number
  freeTrialLimit?: number
  topCompanies?: Array<{
    name: string
    role: string
    location?: string
    status?: string
    tag?: string
  }>
  dashboardUrl?: string
  upgradeUrl?: string
  dateString?: string
  promoCode?: string
  discountedPrice?: string
  originalPrice?: string
}

/**
 * Universal HTML Template: Daily Job Dispatch & Career Activity Digest
 * Clean, executive dark aesthetic with reduced color accents, comprehensive upgrade
 * analysis, and dedicated JobFlux Helpdesk branding.
 */
export function generateJobDispatchReportHtml({
  candidateName = 'Candidate',
  appliedCount = 47,
  totalApplied = 0,
  matchScore = 96,
  recruiterViews = 4,
  isPaidPlan = false,
  planName = 'JobFlux Professional',
  planExpiresAt = null,
  daysRemaining = 0,
  freeTrialUsed = 47,
  freeTrialLimit = 50,
  topCompanies = [
    { name: 'MedBuddy', role: 'Senior Full Stack Engineer', location: 'Bangalore / Hybrid', status: 'Fast-Track Dispatched', tag: 'Verified' },
    { name: 'TIA Technology', role: 'Full Stack Developer', location: 'Remote', status: 'Direct Submission', tag: 'ATS Matched' },
    { name: 'Infosys', role: 'Frontend Specialist (React/Next.js)', location: 'Bangalore', status: 'Resume Synced', tag: 'Priority' },
    { name: 'Tipco Industries', role: 'React Developer', location: 'Bangalore', status: 'In Review', tag: 'Active' },
    { name: 'Matrimony.com', role: 'Software Development Engineer', location: 'Chennai / Remote', status: 'Dispatched', tag: 'HR Queue' },
    { name: 'UST Global', role: 'Cloud & Web Solutions Engineer', location: 'Trivandrum / Hybrid', status: 'Dispatched', tag: 'Applied' },
  ],
  dashboardUrl = 'https://jobfluxai.vercel.app/dashboard',
  upgradeUrl = 'https://jobfluxai.vercel.app/pricing',
  promoCode = 'WELCOMEPRO',
  discountedPrice = '₹199',
  originalPrice = '₹2,500',
  dateString = 'Today'
}: JobDispatchReportOptions): string {
  const remainingFree = Math.max(0, freeTrialLimit - freeTrialUsed)
  const percentUsed = Math.min(100, Math.round((freeTrialUsed / freeTrialLimit) * 100))
  const previewText = `JobFlux AI: ${appliedCount} jobs applied today · ${isPaidPlan ? `${planName} Active` : `${remainingFree} free applications remaining`} · ${recruiterViews} recruiter views`

  let formattedExpiry = 'Active'
  if (planExpiresAt) {
    try {
      const d = new Date(planExpiresAt)
      formattedExpiry = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch (_) {}
  }

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>JobFlux AI · Daily Job Dispatch Report (${appliedCount} Applied)</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container-table { width: 100% !important; max-width: 100% !important; border-radius: 12px !important; }
      .mobile-padding { padding: 20px 14px !important; }
      .mobile-header-padding { padding: 20px 14px !important; }
      .mobile-stack { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .mobile-col-half { display: block !important; width: 100% !important; margin-bottom: 8px !important; }
      .mobile-btn { display: block !important; width: 100% !important; text-align: center !important; padding: 14px 16px !important; box-sizing: border-box !important; font-size: 14px !important; }
      .mobile-btn-secondary { display: block !important; width: 100% !important; text-align: center !important; padding: 12px 14px !important; box-sizing: border-box !important; font-size: 12px !important; margin-top: 8px !important; }
      .mobile-title { font-size: 19px !important; line-height: 1.25 !important; }
      .mobile-stat-number { font-size: 26px !important; }
      .mobile-logo { width: 64px !important; height: 64px !important; min-width: 64px !important; min-height: 64px !important; }
      .mobile-company-card { padding: 12px 12px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0b0c0e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e4e4e7;-webkit-font-smoothing:antialiased;">
  <!-- Hidden Preheader for Mobile Inbox Preview -->
  <div style="display:none;font-size:1px;color:#0b0c0e;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0b0c0e;padding:24px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="container-table" style="max-width:560px;background-color:#131416;border:1px solid #222428;border-radius:14px;overflow:hidden;box-shadow:0 20px 35px rgba(0,0,0,0.55);">
          
          <!-- Subtle Accent Line -->
          <tr>
            <td style="height:2px;background-color:#38bdf8;"></td>
          </tr>

          <!-- Header Section with JobFlux AI Branding -->
          <tr>
            <td class="mobile-header-padding" align="center" style="padding:26px 20px 18px 20px;background-color:#16171a;border-bottom:1px solid #222428;text-align:center;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;text-align:center;">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="${dashboardUrl}" target="_blank" style="text-decoration:none;display:inline-block;">
                      <img class="mobile-logo" src="https://jobfluxai.vercel.app/icon.png" width="64" height="64" alt="JobFlux AI Logo" style="display:block;width:64px;height:64px;min-width:64px;min-height:64px;max-width:64px;max-height:64px;border-radius:14px;background-color:#0b0c0e;border:1px solid #2a2d34;margin:0 auto;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <div style="font-size:20px;font-weight:700;letter-spacing:-0.3px;color:#ffffff;line-height:1.2;">
                      JobFlux <span style="color:#38bdf8;">AI</span>
                    </div>
                    <div style="font-size:11px;font-family:monospace;color:#9ca3af;letter-spacing:0.5px;margin-top:3px;">
                      Autonomous Career &amp; Recruitment Intelligence
                    </div>
                    <div style="margin-top:10px;">
                      <span style="display:inline-block;font-size:10px;font-family:monospace;font-weight:600;background-color:#1a1c20;color:#94a3b8;border:1px solid #2d3036;padding:3px 10px;border-radius:6px;text-transform:uppercase;letter-spacing:0.5px;">
                        ${isPaidPlan ? `👑 ${planName} Active` : 'Daily Dispatch Digest'} &bull; ${dateString}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td class="mobile-padding" style="padding:28px 22px;">
              
              <!-- Greeting & Overview -->
              <h1 class="mobile-title" style="margin:0 0 10px 0;font-size:21px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;line-height:1.25;">
                ${appliedCount} Jobs Dispatched Today
              </h1>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#9ca3af;">
                Hi <strong style="color:#f4f4f5;">${candidateName}</strong>, your autonomous agent completed today's scheduled recruiter sweep on Naukri. Here is your individual application briefing:
              </p>

              <!-- Metric Grid (2x2 table) -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:22px;">
                <tr>
                  <td class="mobile-col-half" width="50%" valign="top" style="padding-right:5px;padding-bottom:10px;">
                    <div style="background-color:#0b0c0e;border:1px solid #222428;border-radius:10px;padding:14px;text-align:center;">
                      <div style="font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
                        Applications Sent
                      </div>
                      <div class="mobile-stat-number" style="font-size:28px;font-weight:700;color:#ffffff;font-family:monospace;line-height:1.1;">
                        ${appliedCount}
                      </div>
                      <div style="font-size:11px;color:#71717a;margin-top:3px;">
                        Dispatched Today ${totalApplied > 0 ? `(${totalApplied} Total)` : ''}
                      </div>
                    </div>
                  </td>
                  <td class="mobile-col-half" width="50%" valign="top" style="padding-left:5px;padding-bottom:10px;">
                    <div style="background-color:#0b0c0e;border:1px solid #222428;border-radius:10px;padding:14px;text-align:center;">
                      <div style="font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
                        ATS Match Rate
                      </div>
                      <div class="mobile-stat-number" style="font-size:28px;font-weight:700;color:#38bdf8;font-family:monospace;line-height:1.1;">
                        ${matchScore}%
                      </div>
                      <div style="font-size:11px;color:#71717a;margin-top:3px;">
                        Target Precision
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="mobile-col-half" width="50%" valign="top" style="padding-right:5px;">
                    <div style="background-color:#0b0c0e;border:1px solid #222428;border-radius:10px;padding:14px;text-align:center;">
                      <div style="font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
                        Recruiter Views
                      </div>
                      <div class="mobile-stat-number" style="font-size:28px;font-weight:700;color:#ffffff;font-family:monospace;line-height:1.1;">
                        ${recruiterViews}
                      </div>
                      <div style="font-size:11px;color:#71717a;margin-top:3px;">
                        Active HR Reviews
                      </div>
                    </div>
                  </td>
                  <td class="mobile-col-half" width="50%" valign="top" style="padding-left:5px;">
                    <div style="background-color:#0b0c0e;border:1px solid #222428;border-radius:10px;padding:14px;text-align:center;">
                      <div style="font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
                        Harvard ATS Resume
                      </div>
                      <div class="mobile-stat-number" style="font-size:20px;font-weight:700;color:#ffffff;font-family:monospace;line-height:1.2;padding-top:4px;">
                        Synced ✓
                      </div>
                      <div style="font-size:11px;color:#71717a;margin-top:3px;">
                        FAANG Standard
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Verified Employers Section -->
              <div style="margin-bottom:24px;">
                <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:10px;">
                  Top Dispatched Employers in this Sweep
                </div>
                <div style="background-color:#0b0c0e;border:1px solid #222428;border-radius:10px;overflow:hidden;">
                  ${topCompanies.map((c, idx) => `
                    <div class="mobile-company-card" style="padding:12px 16px;border-bottom:${idx === topCompanies.length - 1 ? 'none' : '1px solid #1a1b1f'};">
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td valign="middle">
                            <div style="font-size:13px;font-weight:600;color:#ffffff;margin-bottom:2px;">
                              ${c.name}
                            </div>
                            <div style="font-size:12px;color:#9ca3af;margin-bottom:2px;">
                              ${c.role}
                            </div>
                            <div style="font-size:11px;color:#71717a;">
                              📍 ${c.location || 'India / Remote'}
                            </div>
                          </td>
                          <td align="right" valign="middle" style="white-space:nowrap;padding-left:10px;">
                            <span style="display:inline-block;font-size:10px;font-weight:600;font-family:monospace;background-color:#16171a;color:#94a3b8;border:1px solid #26282d;padding:2px 8px;border-radius:4px;">
                              ${c.tag || 'Dispatched'}
                            </span>
                          </td>
                        </tr>
                      </table>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- DYNAMIC PACKAGE STATUS & INTELLIGENT OFFER -->
              ${isPaidPlan ? `
              <!-- ALREADY HAS ACTIVE PACKAGE -->
              <div style="background-color:#16171a;border:1px solid #26282d;border-radius:12px;padding:18px;margin-bottom:22px;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td valign="middle">
                      <div style="font-size:11px;font-weight:700;font-family:monospace;color:#38bdf8;text-transform:uppercase;letter-spacing:0.5px;">
                        👑 Active Membership Status
                      </div>
                      <div style="font-size:16px;font-weight:700;color:#ffffff;margin:3px 0 4px 0;">
                        ${planName}
                      </div>
                      <div style="font-size:12px;color:#9ca3af;">
                        Coverage active until <strong style="color:#ffffff;">${formattedExpiry}</strong> (${daysRemaining} days remaining)
                      </div>
                    </td>
                    <td align="right" valign="middle">
                      <span style="display:inline-block;font-size:10px;font-weight:700;font-family:monospace;color:#38bdf8;background-color:#082f49;border:1px solid #0369a1;padding:3px 8px;border-radius:4px;">
                        ACTIVE PRO
                      </span>
                    </td>
                  </tr>
                </table>

                <div style="margin-top:14px;padding-top:12px;border-top:1px solid #222428;">
                  <ul style="margin:0;padding-left:18px;font-size:12px;color:#9ca3af;line-height:1.8;">
                    <li><strong style="color:#ffffff;">Daily Auto-Apply:</strong> Active (Dispatched ${appliedCount} jobs today${totalApplied > 0 ? `, ${totalApplied} total` : ''})</li>
                    <li><strong style="color:#ffffff;">On-Demand Sweeps:</strong> 5x/Week real-time radar sweeps unlocked</li>
                    <li><strong style="color:#ffffff;">Harvard ATS Resume:</strong> PDF Print &amp; Export Unlocked</li>
                    <li><strong style="color:#ffffff;">Recruiter Telemetry:</strong> Live recruiter application links enabled</li>
                  </ul>
                </div>

                <!-- VIP Opportunity for Active Subscribers -->
                <div style="margin-top:14px;background-color:#0b0c0e;border:1px solid #2e3035;border-radius:8px;padding:12px;">
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td valign="middle">
                        <div style="font-size:10px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">
                          Subscriber Extension Opportunity
                        </div>
                        <div style="font-size:13px;font-weight:700;color:#ffffff;">
                          3-Month VIP Professional Extension &bull; ₹299 <span style="font-size:11px;color:#71717a;text-decoration:line-through;">₹2,500</span>
                        </div>
                        <div style="font-size:11px;color:#9ca3af;margin-top:2px;">
                          Add 90 days of continuous automated sweeps, priority queue slot, and on-demand radar sweeps.
                        </div>
                      </td>
                      <td align="right" valign="middle">
                        <span style="font-size:10px;font-family:monospace;color:#38bdf8;border:1px solid #28303d;padding:2px 6px;border-radius:4px;">CODE: VIP299</span>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>
              ` : `
              <!-- FREE TRIAL / EXPIRED USER -->
              <div style="background-color:#16171a;border:1px solid #26282d;border-radius:12px;padding:18px;margin-bottom:22px;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td valign="middle">
                      <div style="font-size:11px;font-weight:700;font-family:monospace;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">
                        Account Usage Status
                      </div>
                      <div style="font-size:15px;font-weight:700;color:#ffffff;margin:3px 0 6px 0;">
                        ${freeTrialUsed} of ${freeTrialLimit} Free Applications Used
                      </div>
                    </td>
                    <td align="right" valign="middle">
                      <span style="display:inline-block;font-size:11px;font-weight:700;font-family:monospace;color:#ffffff;background-color:#222428;border:1px solid #33363e;padding:3px 8px;border-radius:4px;">
                        ${remainingFree} REMAINING
                      </span>
                    </td>
                  </tr>
                </table>

                <!-- Clean Progress Bar -->
                <div style="background-color:#0b0c0e;border-radius:9999px;height:6px;width:100%;overflow:hidden;margin:8px 0 10px 0;">
                  <div style="background-color:#38bdf8;width:${percentUsed}%;height:100%;border-radius:9999px;"></div>
                </div>

                <p style="margin:0 0 12px 0;font-size:12px;line-height:1.6;color:#9ca3af;">
                  <strong>Why morning continuity matters:</strong> Recruiters review inbound candidates between 9 AM and 11 AM. Once your remaining <strong>${remainingFree} free applications</strong> are completed, automatic daily sweeps pause, causing you to miss high-priority applicant windows.
                </p>

                <!-- Detailed Upgrade Options Breakdown -->
                <div style="border-top:1px solid #222428;padding-top:12px;margin-top:10px;">
                  <div style="font-size:11px;font-weight:700;color:#ffffff;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">
                    Available Upgrade Tiers:
                  </div>

                  <!-- Tier 1: Essentials -->
                  <div style="background-color:#0b0c0e;border:1px solid #222428;border-radius:8px;padding:12px;margin-bottom:8px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td valign="middle">
                          <div style="font-size:13px;font-weight:700;color:#ffffff;">
                            JobFlux Essentials &bull; ₹99 <span style="font-size:11px;color:#71717a;text-decoration:line-through;">₹1,000</span>
                          </div>
                          <div style="font-size:11px;color:#9ca3af;margin-top:2px;">
                            30 Days &bull; 600+ Monthly Applications &bull; Daily Morning Automation
                          </div>
                        </td>
                        <td align="right" valign="middle">
                          <span style="font-size:10px;font-family:monospace;color:#94a3b8;border:1px solid #2d3036;padding:2px 6px;border-radius:4px;">CODE: OFFER90</span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Tier 2: Professional (Recommended) -->
                  <div style="background-color:#0b0c0e;border:1px solid #38bdf8;border-radius:8px;padding:12px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td valign="middle">
                          <div style="font-size:13px;font-weight:700;color:#ffffff;">
                            JobFlux Professional &bull; ${discountedPrice} <span style="font-size:11px;color:#71717a;text-decoration:line-through;">${originalPrice}</span>
                          </div>
                          <div style="font-size:11px;color:#9ca3af;margin-top:2px;">
                            90 Days (~₹66/mo) &bull; 1,800+ Applications &bull; 5x/Wk On-Demand Sweeps &bull; <strong>Harvard ATS PDF Export</strong> &bull; Direct Job Links
                          </div>
                        </td>
                        <td align="right" valign="middle">
                          <span style="font-size:10px;font-family:monospace;color:#38bdf8;border:1px solid #28303d;padding:2px 6px;border-radius:4px;">CODE: ${promoCode}</span>
                        </td>
                      </tr>
                    </table>
                  </div>
                </div>
              </div>
              `}

              <!-- Main Call to Action Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${isPaidPlan ? `${upgradeUrl}?promo=VIP299` : `${upgradeUrl}?promo=${promoCode}`}" class="mobile-btn" style="display:inline-block;background-color:#ffffff;color:#0b0c0e;font-size:14px;font-weight:700;text-decoration:none;padding:14px 34px;border-radius:8px;letter-spacing:-0.2px;">
                      ${isPaidPlan ? 'Extend 3 Months with VIP Pass (₹299) &rarr;' : `Upgrade to Professional (${discountedPrice}) &rarr;`}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:10px;">
                    <a href="${dashboardUrl}" class="mobile-btn-secondary" style="display:inline-block;color:#9ca3af;font-size:12px;font-weight:500;text-decoration:underline;">
                      Open JobFlux Cockpit to View All Dispatched Jobs &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- JobFlux AI Footer -->
          <tr>
            <td style="padding:18px 22px;background-color:#0e0f11;border-top:1px solid #222428;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#e4e4e7;">
                JobFlux AI
              </p>
              <p style="margin:0 0 6px 0;font-size:11px;color:#71717a;line-height:1.5;">
                Autonomous Career &amp; Recruitment Intelligence &bull; Bengaluru, India
              </p>
              <p style="margin:0;font-size:11px;color:#52525b;">
                Questions or Feedback: <a href="mailto:support@jobfluxai.com" style="color:#38bdf8;text-decoration:none;">support@jobfluxai.com</a> &bull; 
                <a href="${dashboardUrl}" style="color:#71717a;text-decoration:underline;">Candidate Cockpit</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}


