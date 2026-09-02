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
    let pdfBase64 = file_base64
    
    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })

    if (!pdfBase64) {
      const resume = await db.collection('resumes').findOne({ user_id })
      if (!resume || !resume.file_base64) {
        return NextResponse.json({ detail: `No resume found in database for user "${user_id}". Please upload one first.` }, { status: 404 })
      }
      pdfBase64 = resume.file_base64
    }

    // Load existing profile to preserve user edits, but STRIP employment data to prevent context poisoning
    let existingProfileJson = ""
    const existingProfile = await db.collection('profiles').findOne({ user_id })
    if (existingProfile) {
      const { _id, user_id: _, employment_history, current_company, avoid_companies, ...profileData } = existingProfile
      // We explicitly remove employment_history and current_company so the LLM is forced to re-extract them fresh from the PDF.
      existingProfileJson = JSON.stringify(profileData)
    }

      console.log(`[ANALYZE] Parsing PDF for ${user_id}...`)
      try {
        const { PDFExtract } = await import('pdf.js-extract')
        const pdfExtract = new PDFExtract()
        
        const pdfBuffer = Buffer.from(pdfBase64, 'base64')
        const data = await pdfExtract.extractBuffer(pdfBuffer, {})
        
        resumeText = data.pages
          .map((page: any) => page.content.map((item: any) => item.str).join(' '))
          .join('\n')

        if (!resumeText || resumeText.trim().length < 50) {
          throw new Error('Parsed text is too short or empty.')
        }
    } catch (err: any) {
      console.warn(`[ANALYZE] pdf.js-extract failed (${err.message}), falling back to pdf2json...`)
      try {
        const PDFParser = (await import('pdf2json')).default
        const pdfParser = new (PDFParser as any)(null, 1);
        const pdfBuffer = Buffer.from(pdfBase64, 'base64')
        
        resumeText = await new Promise((resolve, reject) => {
          pdfParser.on("pdfParser_dataError", (errData: any) => reject(new Error(errData.parserError)));
          pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
          pdfParser.parseBuffer(pdfBuffer);
        });
        
        if (!resumeText || resumeText.trim().length < 50) {
          throw new Error('Parsed text from fallback is too short or empty.')
        }
      } catch (fallbackErr: any) {
        return NextResponse.json({ detail: `Failed to parse PDF resume with all parsers. Primary: ${err.message}, Fallback: ${fallbackErr.message}` }, { status: 400 })
      }
    }

    // Call Groq LLM
    const systemPrompt = `You are an expert technical recruiter AI. Your job is to extract candidate information from their resume text.

Return ONLY valid JSON. Do not include markdown, backticks, or reasoning.

IMPORTANT EMPLOYMENT RULES:
1. Extract EVERY employer from the candidate's work experience.
2. For each employer extract:
   - company (Clean, short normalized name ONLY, e.g., "Capgemini")
   - job_title
   - start_date
   - end_date
   - is_current
3. A company is current ONLY when its end date is "Present", "Current", or equivalent.
4. NEVER determine the current company based on where words such as "currently" appear inside job descriptions.

Schema:
{
  "name": "",
  "email": "",
  "password": "",
  "experience": 0,
  "current_ctc": 0,
  "expected_ctc": 0,
  "employment_history": [
    {
      "company": "",
      "job_title": "",
      "start_date": "",
      "end_date": "",
      "is_current": false
    }
  ],
  "current_company": "",
  "current_location": "",
  "search_url": "https://www.naukri.com/mnjuser/recommendedjobs",
  "skills": [],
  "job_filters": {
    "location": [],
    "roles": [],
    "keywords": [],
    "must_have_keywords": [],
    "avoid_companies": []
  },
  "predefined_answers": {
    "What is your notice period?": "",
    "Are you on a career break?": "No",
    "Are you willing to relocate to Bangalore?": "",
    "Current Company (payroll)?": "",
    "Total years of experience?": "",
    "Current location?": "",
    "Preferred location?": "",
    "Any active backlogs?": "No"
  }
}

Keyword rules:
- keywords must contain individual searchable technology terms.
- Do not invent skills not supported by the source.
- roles should contain realistic job titles matching the candidate's experience.
- avoid_companies must contain every unique employer.
- predefined_answers["Current Company (payroll)?"] must equal current_company.

Incorporate custom user instructions only if they do not contradict the candidate data.`

    let userMessage = `Candidate Resume Text:\n${resumeText}\n\nCustom User Instructions:\n${custom_prompt || "No custom instructions."}`
    if (existingProfileJson) {
      userMessage += `\n\nPreviously Saved Profile Data (use this as a baseline to preserve the user's edits, but ALWAYS extract missing companies/roles from the resume):\n${existingProfileJson}`
    }
    userMessage += `\n\nOutput only valid JSON matching the schema.`

    let resultText = '{}';
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
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
    
    let resultJson: any = {}
    try {
      resultJson = JSON.parse(resultText)
    } catch (e) {
      const cleaned = resultText.replace(/```json/gi, '').replace(/```/g, '').trim()
      resultJson = JSON.parse(cleaned)
    }

    // ------------------------------------
    // Deterministic employment validation
    // ------------------------------------

    const employmentHistory = Array.isArray(resultJson.employment_history)
      ? resultJson.employment_history
      : []

    const normalize = (value: string = '') => String(value).trim().toLowerCase()

    function getCurrentJob(jobs: any[]) {
      const presentJob = jobs.find(job => {
        const endDate = normalize(job.end_date)
        return ['present', 'current', 'ongoing', 'now'].includes(endDate)
      })
      if (presentJob) return presentJob

      return [...jobs].sort((a, b) => {
        const dateA = new Date(a.end_date || a.start_date || 0).getTime()
        const dateB = new Date(b.end_date || b.start_date || 0).getTime()
        return dateB - dateA
      })[0]
    }

    const currentJob = getCurrentJob(employmentHistory)

    if (currentJob?.company) {
      resultJson.current_company = currentJob.company
      resultJson.predefined_answers = {
        ...(resultJson.predefined_answers || {}),
        'Current Company (payroll)?': currentJob.company
      }
    }

    // Build avoid_companies directly from employment history
    const companies = [
      ...new Set(employmentHistory.map((job: any) => job.company).filter(Boolean))
    ] as string[]

    resultJson.job_filters = {
      ...(resultJson.job_filters || {}),
      avoid_companies: companies
    }

    // Final overwrite to ensure the LLM's hallucinated is_current field doesn't break things
    resultJson.employment_history = employmentHistory

    return NextResponse.json({
      status: 'success',
      data: resultJson
    })
  } catch (err: any) {
    console.error("Analyze error:", err)
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
