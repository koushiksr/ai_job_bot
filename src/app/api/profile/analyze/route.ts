import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id, custom_prompt, file_base64 } = body

    if (!user_id && !file_base64) {
      return NextResponse.json({ detail: 'user_id or file_base64 is required' }, { status: 400 })
    }

    let resumeText = ""
    let existingProfileJson = ""

    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })

    // Check if a profile already exists in MongoDB
    const existingProfile = await db.collection('profiles').findOne({ user_id })
    if (existingProfile) {
      // If we are editing, we don't need to parse the PDF again! We just use their existing profile data.
      const { _id, user_id: _, ...profileData } = existingProfile
      existingProfileJson = JSON.stringify(profileData)
      resumeText = `EXISTING PROFILE DATA:\n${existingProfileJson}`
      console.log(`[ANALYZE] Found existing profile for ${user_id}. Reusing JSON data instead of parsing PDF.`)
    } else {
      // If no profile exists, they are uploading a new resume. We parse the PDF using lightweight pdf-parse.
      let pdfBase64 = file_base64
      if (!pdfBase64) {
        const resume = await db.collection('resumes').findOne({ user_id })
        if (!resume || !resume.file_base64) {
          return NextResponse.json({ detail: `No resume found in database for user "${user_id}". Please upload one first.` }, { status: 404 })
        }
        pdfBase64 = resume.file_base64
      }

      console.log(`[ANALYZE] Parsing new PDF for ${user_id}...`)
      try {
        const pdfParseModule = (await import('pdf-parse')) as any
        const pdfParse = pdfParseModule.default || pdfParseModule
        
        const pdfBuffer = Buffer.from(pdfBase64, 'base64')
        const data = await pdfParse(pdfBuffer)
        resumeText = data.text

        if (!resumeText || resumeText.trim().length < 50) {
          throw new Error('Parsed text is too short or empty. Ensure this is a valid text-based PDF.')
        }
      } catch (err: any) {
        return NextResponse.json({ detail: `Failed to parse PDF resume: ${err.message}` }, { status: 400 })
      }
    }

    // Call Groq LLM
    const systemPrompt = `You are an expert technical recruiter AI. Your job is to extract candidate information from their resume text and output a strictly valid JSON object matching our exact schema.
Do NOT include any markdown formatting, backticks, or extra text. Output ONLY raw JSON.

Schema requirements:
{
  "name": "Extract candidate name",
  "email": "Extract candidate email",
  "password": "", // Leave empty
  "experience": 0, // Number in years (e.g. 3.5)
  "current_ctc": 0, // Suggest a reasonable current CTC in INR (e.g. 1200000) based on experience if not mentioned
  "expected_ctc": 0, // Suggest an expected CTC (+30% of current) if not mentioned
  "search_url": "https://www.naukri.com/mnjuser/recommendedjobs",
  "skills": ["List", "Of", "Top", "Skills"],
  "job_filters": {
    "location": ["Bangalore", "Remote"],
    "keywords": ["Skill1", "Skill2"],
    "must_have_keywords": ["TopSkill1"],
    "avoid_companies": ["List", "Of", "Every", "Current", "And", "Past", "Company", "They", "Worked", "For"]
  },
  "predefined_answers": {
    "What is your notice period?": "Immediate / 15 Days",
    "Are you on a career break?": "No",
    "Are you willing to relocate to Bangalore?": "Yes"
  }
}

Important Rules:
1. "avoid_companies" MUST contain the names of ALL companies the candidate has currently or previously worked for, to prevent applying back to them.
2. Incorporate any custom instructions provided by the user.`

    const userMessage = `Candidate Resume Text:\n${resumeText}\n\nCustom User Instructions:\n${custom_prompt || "No custom instructions."}\n\nOutput only valid JSON matching the schema.`

    let resultText = '{}';
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });
      resultText = completion.choices[0]?.message?.content || '{}';
    } catch (groqErr: any) {
      console.warn("Groq API failed, falling back to OpenRouter:", groqErr.message);
      const openRouterKey = process.env.OPENROUTER_API_KEY;
      if (!openRouterKey) {
        throw new Error("Groq API failed and no OPENROUTER_API_KEY is available for fallback.");
      }
      
      const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.MODEL || "openrouter/free",
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      });

      let openRouterData;
      let openRouterErrorText = "";
      try {
        openRouterData = await openRouterRes.json();
      } catch (e) {
        openRouterErrorText = await openRouterRes.text();
      }

      if (!openRouterRes.ok) {
        const errorDetail = openRouterData?.error?.message || openRouterErrorText || openRouterRes.statusText;
        if (openRouterRes.status === 429) {
          throw new Error(`Rate Limit Exceeded. Both Groq and OpenRouter are currently busy or rate-limited. Please wait a minute and try again. (OpenRouter: ${errorDetail})`);
        }
        throw new Error(`Both Groq and OpenRouter failed. OpenRouter error: ${errorDetail}`);
      }
      
      resultText = openRouterData.choices?.[0]?.message?.content || '{}';
    }
    
    let resultJson = {}
    try {
      resultJson = JSON.parse(resultText)
    } catch (e) {
      // Cleanup backticks if LLM disobeyed
      const cleaned = resultText.replace(/```json/g, '').replace(/```/g, '').trim()
      resultJson = JSON.parse(cleaned)
    }

    return NextResponse.json({
      status: 'success',
      data: resultJson
    })
  } catch (err: any) {
    console.error("Analyze error:", err)
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
