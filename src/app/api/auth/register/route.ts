import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { findActivePaymentForEmail } from '@/lib/paymentSync'
import { APP_CONFIG } from '@/config/appConfig'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = (body.name || '').trim()
    const emailClean = (body.email || '').trim().toLowerCase()
    const targetRole = (body.target_role || '').trim()
    let pwdClean = (body.password || '').trim()

    if (!emailClean) {
      return NextResponse.json(
        { detail: 'Email is required to activate free access.' },
        { status: 400 }
      )
    }

    // Auto-generate secure password if user signed up via 1-click email activator
    if (!pwdClean) {
      pwdClean = `JobFlux@${Math.floor(100000 + Math.random() * 900000)}`
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json(
        { detail: 'Database unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    // Check if candidate account already exists
    const existing = await db.collection('profiles').findOne({
      email: { $regex: `^${emailClean}$`, $options: 'i' }
    })

    if (existing) {
      return NextResponse.json(
        { detail: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      )
    }

    // Generate unique user_id based on email prefix
    let baseId = emailClean.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    let userId = baseId
    let counter = 1
    while (await db.collection('profiles').findOne({ user_id: userId })) {
      userId = `${baseId}_${counter}`
      counter++
    }

    const now = new Date()
    // 7-Day Free Access expires 168 hours (1 week) from now
    const trialExpires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Check if this email has an active purchased plan in the payments collection
    const activePayment = await findActivePaymentForEmail(db, emailClean)
    let initialPlan = 'trial'
    let initialPlanName = 'JobFlux 7-Day Free Access'
    let planActivatedAt: Date | null = null
    let planExpiresAt: Date | null = null
    let lastPaymentId: string | null = null
    let lastOrderId: string | null = null

    if (activePayment.payment && activePayment.isActive && activePayment.expiresAt) {
      const p = activePayment.payment
      const rawPlanId = p.plan_id || 'pro'
      initialPlan = rawPlanId === 'starter' ? 'pro' : rawPlanId
      initialPlanName =
        initialPlan === 'elite' || initialPlan === 'professional'
          ? 'JobFlux Professional'
          : 'JobFlux Essentials'
      planActivatedAt = p.verified_at ? new Date(p.verified_at) : now
      planExpiresAt = activePayment.expiresAt
      lastPaymentId = p.payment_id || null
      lastOrderId = p.order_id || null
    }

    let initialSkills: string[] = []
    let initialKeywords: string[] = []
    if (targetRole) {
      initialKeywords.push(targetRole)
      const r = targetRole.toLowerCase()
      if (r.includes('full')) {
        initialSkills = ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Next.js']
        initialKeywords = ['Full Stack Engineer', 'Full Stack Developer', 'React', 'Node.js']
      } else if (r.includes('back') || r.includes('python')) {
        initialSkills = ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'Microservices']
        initialKeywords = ['Backend Engineer', 'Python Developer', 'Backend Developer']
      } else if (r.includes('front') || r.includes('react')) {
        initialSkills = ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Redux']
        initialKeywords = ['Frontend Engineer', 'React Developer', 'Frontend Developer']
      } else if (r.includes('cloud') || r.includes('devops')) {
        initialSkills = ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD']
        initialKeywords = ['DevOps Engineer', 'Cloud Architect', 'Site Reliability Engineer']
      } else if (r.includes('ai') || r.includes('data') || r.includes('ml')) {
        initialSkills = ['Python', 'PyTorch', 'LLMs', 'Machine Learning', 'FastAPI']
        initialKeywords = ['AI Engineer', 'Machine Learning Engineer', 'Data Scientist']
      }
    }

      // Check if candidate is designated Enterprise Admin or has pending Enterprise Invite
      const isEntAdmin = emailClean === 'koushiksrmedala@gmail.com' || APP_CONFIG.enterpriseAdminEmails.map(e => e.toLowerCase()).includes(emailClean)
      const pendingInvite = await db.collection('enterprise_invites').findOne({
        invited_email: emailClean,
        status: 'pending'
      })

      let enterpriseOrgId = null
      let enterpriseRole = null
      if (isEntAdmin) {
        enterpriseRole = 'admin'
        enterpriseOrgId = 'org_technohmsit'
      } else if (pendingInvite) {
        enterpriseRole = 'member'
        enterpriseOrgId = pendingInvite.org_id
        initialPlan = 'enterprise'
        initialPlanName = 'JobFlux Enterprise Member'
        await db.collection('enterprise_invites').updateOne(
          { _id: pendingInvite._id },
          { $set: { status: 'accepted', responded_at: now } }
        )
      }

      const newProfile = {
        user_id: userId,
        name: name || userId.replace('_', ' '),
        email: emailClean,
        password: pwdClean,
        experience: 1,
        current_ctc: 0,
        expected_ctc: 0,
        search_url: 'https://www.naukri.com/mnjuser/recommendedjobs',
        skills: initialSkills,
        job_filters: {
          location: ['Bangalore', 'Remote', 'Hyderabad', 'Mumbai'],
          keywords: initialKeywords,
          must_have_keywords: [],
          avoid_companies: []
        },
        predefined_answers: {
          'What is your notice period?': 'Immediate / 15 Days',
          'Are you on a career break?': 'No'
        },
        enabled_for_daily_run: true,
        role: isEntAdmin ? 'enterprise_admin' : 'user',
        enterprise_org_id: enterpriseOrgId,
        enterprise_role: enterpriseRole,
        enterprise_status: 'active',
        daily_application_limit: 55,
        is_vip: false,
        plan: initialPlan,
        plan_name: initialPlanName,
        trial_started_at: now,
        trial_expires_at: trialExpires,
        plan_activated_at: planActivatedAt,
        plan_expires_at: planExpiresAt,
        last_payment_id: lastPaymentId,
        last_order_id: lastOrderId,
        created_at: now,
        updated_at: now
      }

      await db.collection('profiles').insertOne({ ...newProfile })
      await db.collection('users').insertOne({ ...newProfile })

    // Link any existing payments for this email to the new user_id
    await db.collection('payments').updateMany(
      { email: { $regex: `^${emailClean}$`, $options: 'i' } },
      { $set: { user_id: userId } }
    )

    // Initialize clean user_stats record
    await db.collection('user_stats').updateOne(
      { user_id: userId },
      {
        $setOnInsert: {
          user_id: userId,
          today: 0,
          this_week: 0,
          this_month: 0,
          total_applied: 0,
          last_applied_at: null,
          last_date: now.toISOString().split('T')[0]
        }
      },
      { upsert: true }
    )

    const isPaid = initialPlan !== 'trial'
    return NextResponse.json({
      status: 'success',
      role: newProfile.role,
      user_id: userId,
      email: emailClean,
      name: newProfile.name,
      plan: initialPlan,
      plan_name: initialPlanName,
      enterprise_org_id: enterpriseOrgId,
      enterprise_role: enterpriseRole,
      plan_expires_at: planExpiresAt ? planExpiresAt.toISOString() : null,
      trial_expires_at: trialExpires.toISOString(),
      message: isPaid
        ? `Your verified purchase (${initialPlanName}) has been automatically linked and activated!`
        : 'Your 7-Day Free Access (1 Week) has been activated! Start applying for jobs today.'
    })
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Registration failed.' },
      { status: 500 }
    )
  }
}

