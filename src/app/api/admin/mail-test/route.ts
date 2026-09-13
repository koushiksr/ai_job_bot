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
      from: `"JobFlux AI Diagnostic" <${user}>`,
      to: target,
      subject: '⚡ JobFlux AI Live SMTP Diagnostic Receipt',
      text: `Hi Koushik,\n\nThis is a verified live diagnostic email sent directly from your deployed JobFlux AI application.\n\nSender: ${user}\nRecipient: ${target}\nTimestamp: ${now.toISOString()}\n\nStatus: 250 OK Delivered directly to your inbox.`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#09090b;color:#f4f4f5;border:1px solid #27272a;border-radius:12px;padding:24px;">
          <h2 style="color:#38bdf8;margin-top:0;">⚡ JobFlux AI Live Email Diagnostic</h2>
          <p style="color:#d4d4d8;font-size:14px;line-height:1.6;">
            Hi Koushik,<br><br>
            Your deployed JobFlux AI instance authenticated with Google SMTP and delivered this email successfully.
          </p>
          <div style="background:#18181b;border:1px solid #27272a;border-radius:8px;padding:14px;margin:16px 0;font-size:13px;">
            <div><strong>Sender:</strong> <span style="color:#38bdf8;">${user}</span></div>
            <div style="margin-top:6px;"><strong>Recipient:</strong> <span style="color:#4ade80;">${target}</span></div>
            <div style="margin-top:6px;"><strong>Server Response:</strong> <span style="color:#34d399;">250 2.0.0 OK</span></div>
            <div style="margin-top:6px;"><strong>Timestamp:</strong> <span style="color:#a1a1aa;">${now.toISOString()}</span></div>
          </div>
          <p style="color:#71717a;font-size:12px;">JobFlux AI · Automatic Job Apply Bot</p>
        </div>
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
