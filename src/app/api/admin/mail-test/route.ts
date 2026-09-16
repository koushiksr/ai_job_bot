import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import { createTransporter, getDynamicSmtpCredentials } from '@/lib/mailService'

export const dynamic = 'force-dynamic'

const ALLOWED_TEST_RECIPIENTS = ['koushiksrmedala@gmail.com', 'koushiksr1999@gmail.com']

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user, pass } = await getDynamicSmtpCredentials(db)
    const maskedPass = pass ? `${pass.slice(0, 4)} **** **** ${pass.slice(-4)}` : 'MISSING'

    // Fetch latest 15 email records from MongoDB
    const recentLogs = await db.collection('emails')
      .find({})
      .sort({ created_at: -1 })
      .limit(15)
      .toArray()

    return NextResponse.json({
      sender: user,
      masked_passcode: maskedPass,
      has_passcode: Boolean(pass),
      recent_logs: recentLogs.map(log => ({
        id: log._id.toString(),
        to: log.to,
        from: log.from,
        subject: log.subject,
        status: log.status,
        provider: log.provider || 'gmail_smtp',
        message_id: log.message_id,
        smtp_response: log.smtp_response,
        smtp_error: log.smtp_error,
        created_at: log.created_at
      }))
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ detail: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    let target = (body.targetEmail || 'koushiksrmedala@gmail.com').trim().toLowerCase()

    // Strict security constraint: only allow test dispatch to user's authorized addresses
    if (!ALLOWED_TEST_RECIPIENTS.includes(target)) {
      target = 'koushiksrmedala@gmail.com'
    }

    const currentCreds = await getDynamicSmtpCredentials(db)
    const user = (body.newUser ? String(body.newUser).trim() : currentCreds.user)
    const pass = (body.newPass ? String(body.newPass).trim().replace(/['"]/g, '').replace(/\s+/g, '') : currentCreds.pass)
    const saveToConfig = Boolean(body.saveToConfig)

    const transporter = createTransporter({ user, pass })
    const now = new Date()

    // 1. Verify Handshake
    try {
      await transporter.verify()
    } catch (verifyErr: any) {
      if (db) {
        await db.collection('emails').insertOne({
          to: target,
          from: `"JobFlux AI Diagnostic" <${user}>`,
          subject: '⚡ Diagnostic Test Attempt',
          status: 'failed',
          provider: 'gmail_smtp',
          smtp_error: verifyErr.message,
          created_at: now
        })
      }

      return NextResponse.json({
        success: false,
        step: 'verify',
        error: verifyErr.message,
        sender: user,
        masked_pass: pass ? `${pass.slice(0, 4)} **** **** ${pass.slice(-4)}` : 'EMPTY',
        detail: `Google SMTP rejected authentication: ${verifyErr.message}`,
        help_steps: [
          { label: 'Check Google Security Alerts (Click "Yes, it was me")', url: 'https://myaccount.google.com/notifications' },
          { label: 'Unlock Google Captcha for external cloud sign-ins', url: 'https://accounts.google.com/DisplayUnlockCaptcha' },
          { label: 'Generate a fresh 16-character App Password', url: 'https://myaccount.google.com/apppasswords' }
        ]
      }, { status: 400 })
    }

    // Handshake succeeded: If user wanted to save these verified credentials to MongoDB
    if (saveToConfig && db) {
      await db.collection('system_config').updateOne(
        { key: 'smtp_config' },
        { $set: { key: 'smtp_config', user, pass, updated_at: now } },
        { upsert: true }
      )
    }

    // 2. Send Live Test Message
    const info = await transporter.sendMail({
      from: `"JobFlux Helpdesk" <${user}>`,
      to: target,
      subject: '⚡ JobFlux Helpdesk: Live SMTP Delivery Confirmed',
      text: `Hi Koushik,\n\nVerified! Your Gmail SMTP connection for ${user} is operational.\n\nAutonomous dispatch gateway is active for JobFlux AI.\n\nRecipient: ${target}\nServer Response: 250 OK`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style type="text/css">
    @media only screen and (max-width: 600px) {
      .container-table { width: 100% !important; border-radius: 12px !important; }
      .mobile-padding { padding: 20px 16px !important; }
      .mobile-header-padding { padding: 20px 16px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
      .mobile-logo { width: 68px !important; height: 68px !important; min-width: 68px !important; min-height: 68px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0b0c0e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e4e4e7;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0b0c0e;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="container-table" style="max-width:540px;background-color:#131416;border:1px solid #222428;border-radius:14px;overflow:hidden;box-shadow:0 20px 30px rgba(0,0,0,0.5);">
          <!-- Subtle Accent Line -->
          <tr>
            <td style="height:2px;background-color:#38bdf8;"></td>
          </tr>
          <!-- Header with JobFlux AI Logo -->
          <tr>
            <td class="mobile-header-padding" align="center" style="padding:24px 20px 18px 20px;background-color:#16171a;border-bottom:1px solid #222428;text-align:center;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;text-align:center;">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="https://jobfluxai.vercel.app" target="_blank" style="text-decoration:none;display:inline-block;">
                      <img class="mobile-logo" src="https://jobfluxai.vercel.app/icon.png" width="68" height="68" alt="JobFlux AI Logo" style="display:block;width:68px;height:68px;min-width:68px;min-height:68px;max-width:68px;max-height:68px;border-radius:14px;border:1px solid #2a2d34;background:#0b0c0e;margin:0 auto;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <div style="font-size:20px;font-weight:700;color:#ffffff;line-height:1.2;">
                      JobFlux <span style="color:#38bdf8;">AI</span>
                    </div>
                    <div style="font-size:11px;font-family:monospace;color:#9ca3af;letter-spacing:0.5px;margin-top:3px;">
                      Autonomous Career &amp; Recruitment Intelligence
                    </div>
                    <div style="margin-top:10px;">
                      <span style="display:inline-block;font-size:10px;font-family:monospace;font-weight:600;background-color:#1a1c20;color:#94a3b8;border:1px solid #2d3036;padding:3px 10px;border-radius:6px;text-transform:uppercase;letter-spacing:0.5px;">
                        250 OK LIVE
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td class="mobile-padding" style="padding:26px 22px;">
              <h2 style="margin:0 0 10px 0;font-size:19px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                Live Email Pipeline Verified
              </h2>
              <p style="margin:0 0 18px 0;font-size:13px;line-height:1.6;color:#9ca3af;">
                Hi Koushik,<br>
                Your notification gateway is fully operational. Emails from this sender will now be delivered cleanly across mobile and desktop devices for <strong>JobFlux AI</strong>.
              </p>
              <!-- Telemetry Card -->
              <div style="background-color:#0b0c0e;border:1px solid #222428;border-radius:10px;padding:14px;font-size:12px;margin-bottom:18px;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:5px 0;color:#71717a;width:35%;">Sender Account:</td>
                    <td style="padding:5px 0;font-family:monospace;color:#38bdf8;font-weight:600;">${user}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;color:#71717a;border-top:1px solid #1c1d21;">Recipient Target:</td>
                    <td style="padding:5px 0;font-family:monospace;color:#f4f4f5;font-weight:600;border-top:1px solid #1c1d21;">${target}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;color:#71717a;border-top:1px solid #1c1d21;">Delivery Protocol:</td>
                    <td style="padding:5px 0;color:#9ca3af;border-top:1px solid #1c1d21;">Google SMTP (Port 465 SSL)</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;color:#71717a;border-top:1px solid #1c1d21;">Status:</td>
                    <td style="padding:5px 0;font-weight:600;color:#38bdf8;border-top:1px solid #1c1d21;">✓ Delivered to Inbox</td>
                  </tr>
                </table>
              </div>
              <p style="margin:0;font-size:11px;color:#52525b;line-height:1.5;">
                Timestamp: ${now.toISOString()} &bull; Dispatched from JobFlux AI Production Engine
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 22px;background-color:#0e0f11;border-top:1px solid #222428;text-align:center;">
              <p style="margin:0 0 3px 0;font-size:11px;font-weight:600;color:#e4e4e7;">
                JobFlux Helpdesk
              </p>
              <p style="margin:0;font-size:10px;color:#71717a;">
                Autonomous Career &amp; Recruitment Intelligence &bull; support@jobfluxai.com
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
    })

    // Log success in DB
    if (db) {
      await db.collection('emails').insertOne({
        to: target,
        from: `"JobFlux AI Diagnostic" <${user}>`,
        subject: '⚡ JobFlux AI Live SMTP Diagnostic Receipt',
        status: 'sent',
        provider: 'gmail_smtp',
        message_id: info.messageId,
        smtp_response: info.response,
        created_at: now
      })
    }

    return NextResponse.json({
      success: true,
      sender: user,
      saved_to_db: saveToConfig,
      recipient: target,
      message_id: info.messageId,
      smtp_response: info.response,
      message: `Email delivered successfully to ${target}! (Google response: ${info.response})`
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      detail: `Dispatch failed: ${err.message}`
    }, { status: 500 })
  }
}
