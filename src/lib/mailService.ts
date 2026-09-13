import nodemailer from 'nodemailer'
import { getDb } from '@/lib/mongodb'

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
  const user = (process.env.SMTP_USER || process.env.ADMIN_MAIL_TO_SEND_PASSWORD || 'technohmsit@gmail.com').trim()
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
 * Fully responsive across iOS Mail, Android Gmail, Desktop Outlook, and Webmail.
 * Features TechNOHMS Admin Helpdesk universal branding (JobFlux AI & FitMetrix).
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
  <title>Reset Your Password · TechNOHMS Helpdesk</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container-table { width: 100% !important; max-width: 100% !important; border-radius: 12px !important; }
      .mobile-padding { padding: 24px 18px !important; }
      .mobile-header-padding { padding: 22px 16px 18px 16px !important; }
      .mobile-stack { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .mobile-btn { display: block !important; width: 100% !important; text-align: center !important; padding: 14px 16px !important; box-sizing: border-box !important; font-size: 14px !important; }
      .mobile-title { font-size: 20px !important; line-height: 1.25 !important; }
      .mobile-otp { font-size: 22px !important; letter-spacing: 4px !important; }
      .mobile-logo { width: 98px !important; height: 98px !important; min-width: 98px !important; min-height: 98px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e4e4e7;-webkit-font-smoothing:antialiased;">
  <!-- Hidden Preheader for Mobile Inbox Preview -->
  <div style="display:none;font-size:1px;color:#09090b;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#09090b;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="container-table" style="max-width:560px;background-color:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;box-shadow:0 25px 35px -5px rgba(0,0,0,0.6);">
          <!-- Top Accent Gradient (JobFlux Cyan + FitMetrix Green + TechNOHMS Gold) -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#0284c7 0%,#10b981 50%,#f59e0b 100%);"></td>
          </tr>

          <!-- Universal Header with Prominent 98x98 JobFlux AI Logo -->
          <tr>
            <td class="mobile-header-padding" align="center" style="padding:28px 24px 22px 24px;background:linear-gradient(180deg,#1c1c21 0%,#141417 100%);border-bottom:1px solid #27272a;text-align:center;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;text-align:center;">
                <tr>
                  <td align="center" style="padding-bottom:14px;">
                    <a href="https://jobfluxai.vercel.app" target="_blank" style="text-decoration:none;display:inline-block;">
                      <img class="mobile-logo" src="https://jobfluxai.vercel.app/icon.png" width="98" height="98" alt="JobFlux AI Logo" style="display:block;width:98px;height:98px;min-width:98px;min-height:98px;max-width:98px;max-height:98px;border-radius:20px;background-color:#09090b;border:1px solid rgba(56,189,248,0.35);box-shadow:0 10px 25px -5px rgba(56,189,248,0.3);margin:0 auto;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <div style="font-size:22px;font-weight:800;letter-spacing:-0.4px;color:#ffffff;line-height:1.2;">
                      ⚡ JobFlux <span style="color:#38bdf8;">AI</span>
                    </div>
                    <div style="font-size:11px;font-family:monospace;color:#a1a1aa;letter-spacing:0.5px;margin-top:4px;">
                      Autonomous Career &amp; Recruitment Intelligence
                    </div>
                    <div style="margin-top:10px;">
                      <span style="display:inline-block;font-size:10px;font-family:monospace;font-weight:700;background-color:#0f172a;color:#38bdf8;border:1px solid #1e293b;padding:4px 12px;border-radius:9999px;text-transform:uppercase;letter-spacing:0.5px;">
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
            <td class="mobile-padding" style="padding:32px 28px;">
              <h1 class="mobile-title" style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.4px;">
                Reset Your JobFlux AI Password
              </h1>
              <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#a1a1aa;">
                Hi <strong style="color:#f4f4f5;">${name || 'Candidate'}</strong>, we received a password recovery request for your JobFlux AI account. Tap the button below to configure your new password securely:
              </p>

              <!-- Reset Action Button (Full width on mobile) -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" class="mobile-btn" style="display:inline-block;background-color:#ffffff;color:#09090b;font-size:14px;font-weight:700;text-decoration:none;padding:14px 34px;border-radius:10px;box-shadow:0 8px 16px -2px rgba(0,0,0,0.4);">
                      Reset Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- 6-Digit OTP Verification Box -->
              <div style="background-color:#09090b;border:1px solid #27272a;border-radius:12px;padding:18px;text-align:center;margin:24px 0;">
                <span style="display:block;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;font-weight:600;">
                  Or enter this 6-digit one-time code
                </span>
                <span class="mobile-otp" style="font-size:26px;font-weight:800;font-family:monospace;letter-spacing:6px;color:#38bdf8;">
                  ${otp}
                </span>
              </div>

              <p style="margin:0 0 14px 0;font-size:12px;line-height:1.6;color:#71717a;">
                This link and verification code expire in <strong>60 minutes</strong>. If you did not make this request, your account is secure and you can ignore this notice.
              </p>
              <p style="margin:0;font-size:11px;line-height:1.5;color:#52525b;word-break:break-all;">
                Direct URL: <a href="${resetUrl}" style="color:#38bdf8;text-decoration:underline;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Universal Multi-Service Footer -->
          <tr>
            <td style="padding:22px 28px;background-color:#09090b;border-top:1px solid #27272a;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:12px;font-weight:600;color:#e4e4e7;">
                TechNOHMS Unified Cloud &amp; Admin Helpdesk
              </p>
              <p style="margin:0 0 8px 0;font-size:11px;color:#71717a;line-height:1.5;">
                Official Dispatch Gateway for <strong style="color:#38bdf8;">JobFlux AI</strong> &amp; <strong style="color:#10b981;">FitMetrix</strong>
              </p>
              <p style="margin:0;font-size:11px;color:#52525b;">
                Admin Support: <a href="mailto:technohmsit@gmail.com" style="color:#38bdf8;text-decoration:none;">technohmsit@gmail.com</a> &bull; Priority Helpdesk
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
 * Fully responsive across iPhone, Android, Gmail App, and Desktop Outlook.
 * Features TechNOHMS Admin Helpdesk universal branding (JobFlux AI & FitMetrix).
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
  const previewText = `Exclusive Offer: ${offerTitle} for only ${discountedPrice} (Save against ${originalPrice}) with code ${promoCode}.`
  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>${offerTitle} · Exclusive Offer</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container-table { width: 100% !important; max-width: 100% !important; border-radius: 12px !important; }
      .mobile-padding { padding: 24px 18px !important; }
      .mobile-header-padding { padding: 22px 16px 18px 16px !important; }
      .mobile-stack { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .mobile-btn { display: block !important; width: 100% !important; text-align: center !important; padding: 15px 16px !important; box-sizing: border-box !important; font-size: 14px !important; }
      .mobile-title { font-size: 20px !important; line-height: 1.25 !important; }
      .mobile-promo-col { margin-top: 14px !important; text-align: left !important; }
      .mobile-logo { width: 98px !important; height: 98px !important; min-width: 98px !important; min-height: 98px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e4e4e7;-webkit-font-smoothing:antialiased;">
  <!-- Hidden Preheader for Mobile Inbox Preview -->
  <div style="display:none;font-size:1px;color:#09090b;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#09090b;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="container-table" style="max-width:580px;background-color:#18181b;border:1px solid #27272a;border-radius:18px;overflow:hidden;box-shadow:0 25px 35px -5px rgba(0,0,0,0.6);">
          <!-- Top Accent Stream (JobFlux Cyan + FitMetrix Green + TechNOHMS Gold) -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#0284c7 0%,#10b981 50%,#f59e0b 100%);"></td>
          </tr>

          <!-- Universal Header with Prominent 98x98 JobFlux AI Logo -->
          <tr>
            <td class="mobile-header-padding" align="center" style="padding:28px 24px 22px 24px;background:linear-gradient(180deg,#1c1c21 0%,#141417 100%);border-bottom:1px solid #27272a;text-align:center;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;text-align:center;">
                <tr>
                  <td align="center" style="padding-bottom:14px;">
                    <a href="https://jobfluxai.vercel.app" target="_blank" style="text-decoration:none;display:inline-block;">
                      <img class="mobile-logo" src="https://jobfluxai.vercel.app/icon.png" width="98" height="98" alt="JobFlux AI Logo" style="display:block;width:98px;height:98px;min-width:98px;min-height:98px;max-width:98px;max-height:98px;border-radius:20px;background-color:#09090b;border:1px solid rgba(56,189,248,0.35);box-shadow:0 10px 25px -5px rgba(56,189,248,0.3);margin:0 auto;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <div style="font-size:22px;font-weight:800;letter-spacing:-0.4px;color:#ffffff;line-height:1.2;">
                      ⚡ JobFlux <span style="color:#38bdf8;">AI</span>
                    </div>
                    <div style="font-size:11px;font-family:monospace;color:#a1a1aa;letter-spacing:0.5px;margin-top:4px;">
                      Autonomous Career &amp; Recruitment Intelligence
                    </div>
                    <div style="margin-top:10px;">
                      <span style="display:inline-block;font-size:10px;font-weight:800;font-family:monospace;background-color:#451a03;color:#fbbf24;border:1px solid #b45309;padding:5px 12px;border-radius:9999px;text-transform:uppercase;letter-spacing:0.5px;">
                        ${discountBadge || 'EXCLUSIVE OFFER'}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="mobile-padding" style="padding:32px 28px;">
              <div style="display:inline-block;font-size:11px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
                Verified Account Exclusive
              </div>
              <h1 class="mobile-title" style="margin:0 0 14px 0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1.25;">
                ${offerTitle}
              </h1>
              <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#a1a1aa;">
                Hi <strong style="color:#f4f4f5;">${candidateName || 'Candidate'}</strong>,
              </p>
              <p style="margin:0 0 22px 0;font-size:14px;line-height:1.6;color:#d4d4d8;">
                ${customMessage || 'We have reserved an exclusive promotional rate for your account to accelerate your interview pipeline with automated daily job sweeps, Harvard ATS resume formatting, and direct priority recruiter scout triggers.'}
              </p>

              <!-- Deal Card (Bulletproof Mobile & Desktop Table) -->
              <div style="background-color:#09090b;border:1px solid #27272a;border-radius:14px;padding:22px;margin:24px 0;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td class="mobile-stack" valign="middle">
                      <div style="font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;font-weight:600;">
                        Special Promotional Rate
                      </div>
                      <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td valign="baseline" style="font-size:32px;font-weight:800;color:#ffffff;font-family:monospace;line-height:1;">
                            ${discountedPrice}
                          </td>
                          <td valign="baseline" style="padding-left:10px;font-size:16px;color:#71717a;text-decoration:line-through;line-height:1;">
                            ${originalPrice}
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td class="mobile-stack mobile-promo-col" align="right" valign="middle">
                      <div style="display:inline-block;background-color:#18181b;border:1px dashed #38bdf8;padding:8px 16px;border-radius:8px;text-align:center;">
                        <span style="display:block;font-size:9px;color:#a1a1aa;text-transform:uppercase;margin-bottom:2px;font-weight:600;">Promo Code</span>
                        <span style="font-size:14px;font-weight:800;font-family:monospace;color:#38bdf8;letter-spacing:0.5px;">${promoCode}</span>
                      </div>
                    </td>
                  </tr>
                </table>

                <div style="margin-top:18px;padding-top:16px;border-top:1px solid #27272a;">
                  <ul style="margin:0;padding-left:18px;font-size:12px;color:#a1a1aa;line-height:1.8;">
                    <li>Daily Autonomous Application Sweeps on Naukri (600+ monthly applies)</li>
                    <li>Up to 5 On-Demand Real-Time Scout Sweeps per Week</li>
                    <li>Verified Direct Job Portal Link Access &amp; Status Logs</li>
                    <li>Application Records Export to CSV Spreadsheet</li>
                    <li>Harvard / FAANG ATS Resume Builder &amp; 1-Click Bot Sync</li>
                  </ul>
                </div>
              </div>

              <!-- CTA Button (Full width on mobile) -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:26px 0 12px 0;">
                <tr>
                  <td align="center">
                    <a href="${claimUrl}" class="mobile-btn" style="display:inline-block;background-color:#ffffff;color:#09090b;font-size:14px;font-weight:800;text-decoration:none;padding:15px 38px;border-radius:10px;box-shadow:0 10px 20px -3px rgba(0,0,0,0.5);">
                      Claim Offer &amp; Activate &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:12px 0 0 0;font-size:11px;text-align:center;color:#71717a;">
                Offer confirmed by Administrator &bull; Instant digital activation upon checkout.
              </p>
            </td>
          </tr>

          <!-- Universal Multi-Service Footer -->
          <tr>
            <td style="padding:22px 28px;background-color:#09090b;border-top:1px solid #27272a;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:12px;font-weight:600;color:#e4e4e7;">
                TechNOHMS Unified Cloud &amp; Admin Helpdesk
              </p>
              <p style="margin:0 0 8px 0;font-size:11px;color:#71717a;line-height:1.5;">
                Official Dispatch Gateway for <strong style="color:#38bdf8;">JobFlux AI</strong> &amp; <strong style="color:#10b981;">FitMetrix</strong>
              </p>
              <p style="margin:0;font-size:11px;color:#52525b;">
                Admin Support: <a href="mailto:technohmsit@gmail.com" style="color:#38bdf8;text-decoration:none;">technohmsit@gmail.com</a> &bull; Priority Helpdesk
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
