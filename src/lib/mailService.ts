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
 * Returns sanitized and validated SMTP credentials.
 * Automatically overrides any stale revoked keys (e.g. nxgq or vkij) with the verified active key.
 */
export function getSmtpCredentials() {
  const user = (process.env.SMTP_USER || process.env.ADMIN_MAIL_TO_SEND_PASSWORD || 'technohmsit@gmail.com').trim()
  let pass = (process.env.SMTP_PASS || process.env.ADMIN_MAIL_PASSWORD || 'tidw wevs gebl qljb')
    .trim()
    .replace(/['"]/g, '')
    .replace(/\s+/g, '')

  // Critical safeguard: if Vercel or local env still has old/revoked passwords, override with verified active pass
  if (!pass || pass.includes('nxgq') || pass.includes('vkij')) {
    pass = 'tidwwevsgeblqljb'
  }

  return { user, pass }
}

/**
 * Creates and returns a Nodemailer transporter configured for Gmail SMTP.
 */
export function createTransporter() {
  const { user, pass } = getSmtpCredentials()

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
 * Tries SMTP delivery; automatically audits and records all emails into MongoDB `emails` collection.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  fromName = 'JobFlux AI'
}: SendMailOptions): Promise<MailResult> {
  const recipient = Array.isArray(to) ? to.join(', ') : to
  const { user } = getSmtpCredentials()
  const formattedFrom = `"${fromName}" <${user}>`
  const now = new Date()

  let db: any = null
  try {
    db = await getDb()
  } catch (err) {
    console.warn('MongoDB connection unavailable for mail audit:', err)
  }

  try {
    const transporter = createTransporter()
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
 * Luxury HTML Template: Password Reset Request
 */
export function generatePasswordResetHtml(name: string, resetUrl: string, otp: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your JobFlux AI Password</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e4e4e7;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#09090b;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:540px;background-color:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding:28px 32px;background:linear-gradient(180deg,#18181b 0%,#09090b 100%);border-bottom:1px solid #27272a;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size:18px;font-weight:700;letter-spacing:-0.5px;color:#ffffff;">
                      ⚡ JobFlux <span style="color:#38bdf8;">AI</span>
                    </span>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;font-size:10px;font-family:monospace;background-color:#0f172a;color:#38bdf8;border:1px solid #1e293b;padding:4px 8px;border-radius:6px;text-transform:uppercase;">
                      Security Verification
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:600;color:#ffffff;letter-spacing:-0.3px;">
                Reset Your Password
              </h1>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#a1a1aa;">
                Hi ${name || 'Candidate'}, we received a request to reset the password for your JobFlux AI account. Click the button below to choose a new password:
              </p>

              <!-- Reset Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display:inline-block;background-color:#ffffff;color:#09090b;font-size:13px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.3);">
                      Reset Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Quick OTP Section -->
              <div style="background-color:#09090b;border:1px solid #27272a;border-radius:12px;padding:16px;text-align:center;margin:24px 0;">
                <span style="display:block;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
                  Or use this 6-digit verification code
                </span>
                <span style="font-size:24px;font-weight:700;font-family:monospace;letter-spacing:6px;color:#38bdf8;">
                  ${otp}
                </span>
              </div>

              <p style="margin:0 0 16px 0;font-size:12px;line-height:1.5;color:#71717a;">
                This link and verification code expire in <strong>60 minutes</strong>. If you did not initiate this request, you can safely ignore this email.
              </p>
              <p style="margin:0;font-size:11px;line-height:1.5;color:#52525b;word-break:break-all;">
                Direct link: <a href="${resetUrl}" style="color:#38bdf8;text-decoration:underline;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#09090b;border-top:1px solid #27272a;text-align:center;">
              <p style="margin:0;font-size:11px;color:#71717a;">
                JobFlux AI · Autonomous Career & Recruitment Intelligence<br>
                Need help? Contact <a href="mailto:technohmsit@gmail.com" style="color:#38bdf8;text-decoration:none;">technohmsit@gmail.com</a>
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
 * Luxury HTML Template: Purchase Offer & Promotional Upgrade
 */
export function generatePurchaseOfferHtml({
  candidateName,
  offerTitle,
  discountBadge,
  originalPrice,
  discountedPrice,
  promoCode = 'FLASH49',
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
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${offerTitle} · Exclusive Offer</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e4e4e7;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#09090b;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#18181b;border:1px solid #27272a;border-radius:18px;overflow:hidden;box-shadow:0 25px 30px -5px rgba(0,0,0,0.6);">
          <!-- Top Accent Stream -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#0284c7 0%,#38bdf8 50%,#f59e0b 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:28px 32px;background:linear-gradient(180deg,#18181b 0%,#09090b 100%);border-bottom:1px solid #27272a;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size:18px;font-weight:700;letter-spacing:-0.5px;color:#ffffff;">
                      ⚡ JobFlux <span style="color:#38bdf8;">AI</span>
                    </span>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;font-size:10px;font-weight:700;font-family:monospace;background-color:#451a03;color:#fbbf24;border:1px solid #b45309;padding:4px 10px;border-radius:9999px;text-transform:uppercase;">
                      ${discountBadge || 'SPECIAL OFFER'}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <span style="display:inline-block;font-size:11px;font-weight:600;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
                Verified Candidate Exclusive
              </span>
              <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                ${offerTitle}
              </h1>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#a1a1aa;">
                Hi ${candidateName || 'Candidate'},
              </p>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#d4d4d8;">
                ${customMessage || 'We have reserved an exclusive promotional rate for your account to accelerate your interview pipeline with automated daily job sweeps and on-demand scout triggers.'}
              </p>

              <!-- Deal Card -->
              <div style="background-color:#09090b;border:1px solid #27272a;border-radius:14px;padding:22px;margin:24px 0;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <span style="display:block;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
                        Special Promotional Rate
                      </span>
                      <div style="display:flex;align-items:baseline;gap:8px;">
                        <span style="font-size:28px;font-weight:800;color:#ffffff;font-family:monospace;">
                          ${discountedPrice}
                        </span>
                        <span style="font-size:15px;color:#71717a;text-decoration:line-through;margin-left:8px;">
                          ${originalPrice}
                        </span>
                      </div>
                    </td>
                    <td align="right" valign="middle">
                      <div style="background-color:#18181b;border:1px dashed #38bdf8;padding:8px 14px;border-radius:8px;text-align:center;">
                        <span style="display:block;font-size:9px;color:#a1a1aa;text-transform:uppercase;margin-bottom:2px;">Promo Code</span>
                        <span style="font-size:13px;font-weight:700;font-family:monospace;color:#38bdf8;">${promoCode}</span>
                      </div>
                    </td>
                  </tr>
                </table>

                <div style="margin-top:16px;padding-top:16px;border-top:1px solid #1f1f23;">
                  <ul style="margin:0;padding-left:18px;font-size:12px;color:#a1a1aa;line-height:1.8;">
                    <li>Daily Autonomous Application Sweeps on Naukri</li>
                    <li>Up to 5 On-Demand Real-Time Sweeps per Week</li>
                    <li>Verified Direct Job Portal Link Access</li>
                    <li>Application Records Export to CSV Spreadsheet</li>
                    <li>Harvard / FAANG ATS Resume Builder &amp; 1-Click Bot Sync</li>
                  </ul>
                </div>
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:24px 0 12px 0;">
                <tr>
                  <td align="center">
                    <a href="${claimUrl}" style="display:inline-block;background-color:#ffffff;color:#09090b;font-size:13px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.4);">
                      Claim Offer &amp; Activate &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:12px 0 0 0;font-size:11px;text-align:center;color:#71717a;">
                Offer confirmed by Administrator · Instant digital activation upon checkout.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#09090b;border-top:1px solid #27272a;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:11px;color:#71717a;">
                JobFlux AI · Primary Administrator: technohmsit@gmail.com
              </p>
              <p style="margin:0;font-size:10px;color:#52525b;">
                You received this offer because of your active JobFlux candidate account.
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
