import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export const dynamic = 'force-dynamic'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
})

interface HeadlineRequest {
  role: string
  experience?: string | number
  skills?: string
  noticePeriod?: string
  domain?: string
}

function generateDeterministicHeadlines(
  role: string,
  expStr: string,
  skillsList: string[],
  notice: string
) {
  const topSkills = skillsList.slice(0, 4).join(' · ')
  const expNum = parseInt(expStr) || 2
  const noticeSuffix = notice && notice.toLowerCase().includes('immediate') ? ' · Immediate' : ''

  const h1 = `${role} | ${topSkills}${noticeSuffix}`.slice(0, 99)
  const h2 = `${role} (${expNum}+ Yrs) | ${skillsList.slice(0, 3).join(', ')} | Notice: ${notice || '15 Days'}`.slice(0, 99)
  const h3 = `Senior ${role} · High-Scale Systems · ${skillsList.slice(0, 3).join(' · ')}`.slice(0, 99)
  const h4 = `${role} specializing in ${skillsList.slice(0, 2).join(' & ')} | Available to Join`.slice(0, 99)
  const h5 = `Results-Driven ${role} | ${skillsList.slice(0, 3).join(' | ')} | ${expNum}+ Yrs Exp`.slice(0, 99)

  const summary = `Dedicated and results-oriented ${role} with ${expNum}+ years of hands-on experience architecting and delivering high-performance scalable solutions. Expert in ${skillsList.join(', ')}. Demonstrated success driving system efficiency, optimizing microservices, and collaborating across cross-functional engineering teams. Actively seeking challenging roles with immediate/quick availability (${notice || '15-30 days notice'}).`

  return {
    headlines: [
      { type: 'Recruiter Keyword Magnet (Resdex #1)', text: h1 },
      { type: 'Experience & Notice Period Focused', text: h2 },
      { type: 'Senior & Architecture Driven', text: h3 },
      { type: 'Skill Depth & Availability', text: h4 },
      { type: 'High-Impact Metrics Style', text: h5 }
    ],
    summary
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: HeadlineRequest = await req.json()
    const { role, experience = '3', skills = '', noticePeriod = 'Immediate / 15 Days', domain = '' } = body

    if (!role || !role.trim()) {
      return NextResponse.json({ error: 'Target role is required' }, { status: 400 })
    }

    const cleanRole = role.trim()
    const skillsArray = skills
      ? skills.split(/[,·|\n]/).map(s => s.trim()).filter(Boolean)
      : ['Python', 'System Design', 'Cloud Architecture', 'APIs']

    // Attempt Groq LLM Generation if Key Available
    if (process.env.GROQ_API_KEY) {
      try {
        const prompt = `You are the world's best Indian tech recruiter and candidate profile SEO optimization expert.
Generate 5 diverse, click-through optimized headlines for a candidate's professional profile.
CRITICAL CONSTRAINT: Each headline MUST be under 95 characters (strict 100-character cutoff).

Candidate Info:
- Target Role: ${cleanRole}
- Total Experience: ${experience} years
- Key Tech Stack: ${skillsArray.join(', ')}
- Notice Period: ${noticePeriod}
- Domain/Focus: ${domain || 'General Tech'}

Return STRICTLY valid JSON without Markdown blocks:
{
  "headlines": [
    { "type": "Recruiter Keyword Magnet", "text": "Under 95 char headline packed with exact recruiter search keywords" },
    { "type": "Immediate Joiner & Experience", "text": "Under 95 char headline highlighting years of experience and quick notice" },
    { "type": "Senior Architecture Focused", "text": "Under 95 char headline emphasizing system design and technical depth" },
    { "type": "Impact & Metric Driven", "text": "Under 95 char headline focused on deliverable business impact" },
    { "type": "Clean Modern Tech Stack", "text": "Under 95 char clean pipe-separated headline" }
  ],
  "summary": "A 180-250 word rich, keyword-optimized Profile Summary with key technical competencies, notable achievements, and availability details."
}`

        const groqModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
        const completion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: groqModel,
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })

        const raw = completion.choices[0]?.message?.content
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed.headlines) && parsed.summary) {
            // Guarantee length safety
            parsed.headlines = parsed.headlines.map((h: { type: string; text: string }) => ({
              type: h.type,
              text: h.text.length > 98 ? h.text.substring(0, 95) + '...' : h.text
            }))
            return NextResponse.json(parsed)
          }
        }
      } catch (llmErr) {
        console.warn('Groq headline generation fallback to deterministic:', llmErr)
      }
    }

    // Deterministic High-Quality Fallback
    const fallback = generateDeterministicHeadlines(
      cleanRole,
      String(experience),
      skillsArray,
      noticePeriod
    )
    return NextResponse.json(fallback)
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

