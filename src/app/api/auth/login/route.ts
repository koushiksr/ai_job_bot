import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const emailClean = (body.email || '').trim().toLowerCase()
    const pwdClean = (body.password || '').trim()

    // 1. Admin login check
    if (
      (emailClean === 'admin' || emailClean === 'admin@jobbot.ai' || emailClean === 'admin@admin.com') &&
      pwdClean === 'admin'
    ) {
      return NextResponse.json({
        status: 'success',
        role: 'admin',
        user_id: 'admin',
        email: 'admin@jobbot.ai',
        name: 'Admin Controller'
      })
    }

    // 2. Authenticate against MongoDB Atlas profiles collection
    const db = await getDb()
    if (db) {
      const profile = await db.collection('profiles').findOne({
        email: { $regex: `^${emailClean}$`, $options: 'i' }
      })

      if (profile) {
        if (profile.password === pwdClean) {
          return NextResponse.json({
            status: 'success',
            role: 'user',
            user_id: profile.user_id,
            email: profile.email,
            name: profile.name || profile.user_id.replace('_', ' ')
          })
        } else {
          return NextResponse.json(
            { detail: 'Invalid Naukri password.' },
            { status: 401 }
          )
        }
      }
    }

    // 3. Fallback check for known seed credentials
    if (emailClean === 'koushiksr1999@gmail.com' && pwdClean === 'qohcyt-hobsEx-1xirco') {
      return NextResponse.json({
        status: 'success',
        role: 'user',
        user_id: 'candidate1_koushiksr',
        email: 'koushiksr1999@gmail.com',
        name: 'Koushik S R'
      })
    }
    if (emailClean === 'rakshithadl2003@gmail.com' && pwdClean === 'Rakshitha@123') {
      return NextResponse.json({
        status: 'success',
        role: 'user',
        user_id: 'candidate2_rakshitha_D_L',
        email: 'rakshithadl2003@gmail.com',
        name: 'Rakshitha D L'
      })
    }

    return NextResponse.json(
      { detail: 'Invalid email or Naukri password.' },
      { status: 401 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Authentication error' },
      { status: 500 }
    )
  }
}
