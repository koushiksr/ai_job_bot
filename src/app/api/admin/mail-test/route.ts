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
      from: `"TechNOHMS Helpdesk" <${user}>`,
      to: target,
      subject: '⚡ TechNOHMS Helpdesk: Live SMTP Delivery Confirmed (JobFlux AI & FitMetrix)',
      text: `Hi Koushik,\n\nVerified! Your Gmail SMTP connection for ${user} is operational.\n\nUniversal Admin Dispatch Gateway is active for JobFlux AI & FitMetrix.\n\nRecipient: ${target}\nServer Response: 250 OK`,
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
      .mobile-stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e4e4e7;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#09090b;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="container-table" style="max-width:540px;background-color:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;box-shadow:0 20px 30px rgba(0,0,0,0.5);">
          <!-- Top Accent Stream -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#0284c7 0%,#10b981 50%,#f59e0b 100%);"></td>
          </tr>
          <!-- Header -->
          <tr>
            <td style="padding:20px 24px;background:linear-gradient(180deg,#1c1c21 0%,#141417 100%);border-bottom:1px solid #27272a;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td valign="middle" style="width:44px;padding-right:12px;">
                    <img src="https://jobfluxai.vercel.app/jobflux-logo.svg" width="38" height="38" alt="JobFlux AI" style="display:block;border-radius:10px;border:1px solid #27272a;box-shadow:0 0 10px rgba(56,189,248,0.25);background:#09090b;" />
                  </td>
                  <td valign="middle">
                    <div style="font-size:16px;font-weight:800;color:#ffffff;line-height:1.2;">
                      ⚡ JobFlux <span style="color:#38bdf8;">AI</span>
                    </div>
                    <div style="font-size:10px;font-family:monospace;color:#a1a1aa;letter-spacing:0.5px;margin-top:2px;">
                      Autonomous Career &amp; Recruitment Intelligence
                    </div>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display:inline-block;font-size:10px;font-family:monospace;font-weight:700;background-color:#064e3b;color:#34d399;border:1px solid #059669;padding:4px 9px;border-radius:6px;text-transform:uppercase;">
                      250 OK LIVE
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td class="mobile-padding" style="padding:28px 24px;">
              <h2 style="margin:0 0 10px 0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                ⚡ Live Email Pipeline Verified
              </h2>
              <p style="margin:0 0 20px 0;font-size:13px;line-height:1.6;color:#a1a1aa;">
                Hi Koushik,<br>
                Your universal notification gateway is fully operational. Emails from this sender will now be delivered cleanly across mobile and desktop devices for both <strong>JobFlux AI</strong> and <strong>FitMetrix</strong>.
              </p>
              <!-- Telemetry Card -->
              <div style="background-color:#09090b;border:1px solid #27272a;border-radius:12px;padding:16px;font-size:12px;margin-bottom:20px;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:6px 0;color:#71717a;width:35%;">Sender Account:</td>
                    <td style="padding:6px 0;font-family:monospace;color:#38bdf8;font-weight:600;">${user}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#71717a;border-top:1px solid #1f1f23;">Recipient Target:</td>
                    <td style="padding:6px 0;font-family:monospace;color:#4ade80;font-weight:600;border-top:1px solid #1f1f23;">${target}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#71717a;border-top:1px solid #1f1f23;">Delivery Protocol:</td>
                    <td style="padding:6px 0;color:#f4f4f5;border-top:1px solid #1f1f23;">Google SMTP (Port 465 SSL)</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#71717a;border-top:1px solid #1f1f23;">Status:</td>
                    <td style="padding:6px 0;font-weight:700;color:#34d399;border-top:1px solid #1f1f23;">✓ Delivered Directly to Inbox</td>
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
            <td style="padding:18px 24px;background-color:#09090b;border-top:1px solid #27272a;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:11px;font-weight:600;color:#e4e4e7;">
                TechNOHMS Unified Cloud &amp; Admin Helpdesk
              </p>
              <p style="margin:0;font-size:10px;color:#71717a;">
                Serving JobFlux AI &bull; FitMetrix Platform &bull; technohmsit@gmail.com
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
