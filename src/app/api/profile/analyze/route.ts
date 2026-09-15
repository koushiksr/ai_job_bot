import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import Groq from 'groq-sdk'
import { logLlmTelemetry } from '@/lib/llmLogger'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

// Common tech keywords for deterministic parsing fallback
const TECH_KEYWORDS = [
  'Python', 'FastAPI', 'Django', 'Flask', 'Java', 'Spring Boot', 'JavaScript', 'TypeScript',
  'React', 'Node.js', 'Next.js', 'Vue', 'Angular', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
  'CI/CD', 'Git', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'GraphQL',
  'REST API', 'Microservices', 'PyTorch', 'TensorFlow', 'LangChain', 'LangGraph', 'LlamaIndex',
  'RAG', 'LLM', 'GenAI', 'Generative AI', 'Agentic Workflows', 'Prompt Engineering', 'Vector DB',
  'ChromaDB', 'Pinecone', 'Kafka', 'RabbitMQ', 'Linux', 'Tailwind CSS', 'Pandas', 'NumPy',
  'Scikit-learn', 'CrewAI', 'Ollama', 'Groq', 'OpenAI', 'Claude', 'Llama 3', 'Mistral', 'Gemini'
]

function deterministicFallbackExtraction(resumeText: string, existingProfile: any = null) {
  // 1. Email
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  const email = existingProfile?.email || (emailMatch ? emailMatch[0] : '')

  // 2. Experience
  let experience = existingProfile?.experience || 0
  const expMatch = resumeText.match(/(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?|yoe)/i)
  if (expMatch && expMatch[1]) {
    experience = parseFloat(expMatch[1])
  }

  // 3. Name (first non-empty line or from email handle)
  let name = existingProfile?.name || ''
  if (!name) {
    const lines = resumeText.split('\n').map(l => l.trim()).filter(l => l.length > 2 && !l.includes('@') && !l.match(/^\+?\d/))
    if (lines.length > 0) {
      name = lines[0].replace(/[^a-zA-Z\s]/g, '').trim()
    }
  }

  // 4. Skills extraction
  const lowerText = resumeText.toLowerCase()
  const matchedSkills = TECH_KEYWORDS.filter(skill => {
    const pattern = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    return pattern.test(lowerText)
  })

  // 5. Companies & Employment detection
  const detectedCompanies: string[] = []
  const knownCompanies = [
    'Capgemini', 'Infosys', 'Wipro', 'TCS', 'Tata Consultancy', 'Accenture', 'Cognizant',
    'IBM', 'Google', 'Microsoft', 'Amazon', 'Meta', 'Dell', 'Oracle', 'Cisco', 'Skillogic',
    'Quantum Gates Technologies', 'Tech Mahindra', 'HCL'
  ]
  for (const c of knownCompanies) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(resumeText)) {
      detectedCompanies.push(c)
    }
  }

  const employmentHistory: any[] = []
  if (detectedCompanies.length > 0) {
    employmentHistory.push({
      company: detectedCompanies[0],
      job_title: 'Software Engineer',
      start_date: '2022',
      end_date: 'Present',
      is_current: true
    })
    for (let i = 1; i < detectedCompanies.length; i++) {
      employmentHistory.push({
        company: detectedCompanies[i],
        job_title: 'Software Engineer',
        start_date: '2020',
        end_date: '2022',
        is_current: false
      })
    }
  }

  const currentCompany = detectedCompanies[0] || existingProfile?.current_company || ''

  return {
    name: name || 'Candidate',
    email: email,
    password: existingProfile?.password || '',
    experience: experience,
    current_ctc: existingProfile?.current_ctc || 0,
    expected_ctc: existingProfile?.expected_ctc || 0,
    employment_history: employmentHistory,
    current_company: currentCompany,
    current_location: existingProfile?.current_location || 'Bangalore',
    search_url: existingProfile?.search_url || 'https://www.naukri.com/mnjuser/recommendedjobs',
    skills: matchedSkills.length > 0 ? matchedSkills : (existingProfile?.skills || ['Python', 'FastAPI']),
    job_filters: {
      location: existingProfile?.job_filters?.location || ['Bangalore', 'Remote', 'Hybrid'],
      roles: existingProfile?.job_filters?.roles || ['Python Developer', 'Backend Developer', 'AI Engineer'],
      keywords: matchedSkills,
      must_have_keywords: existingProfile?.job_filters?.must_have_keywords || [],
      avoid_companies: detectedCompanies
    },
    predefined_answers: {
      'What is your notice period?': existingProfile?.predefined_answers?.['What is your notice period?'] || 'Immediate / 15 Days',
      'Are you on a career break?': 'No',
      'Are you willing to relocate to Bangalore?': 'Yes',
      'Current Company (payroll)?': currentCompany,
      'Total years of experience?': String(experience),
      'Current location?': existingProfile?.current_location || 'Bangalore',
      'Preferred location?': 'Bangalore',
      'Any active backlogs?': 'No'
    }
  }
}

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

    // Load existing profile to preserve user edits
    let existingProfileJson = ""
    const existingProfile = await db.collection('profiles').findOne({ user_id })
    if (existingProfile) {
      const { _id, user_id: _, employment_history, current_company, avoid_companies, ...profileData } = existingProfile
      existingProfileJson = JSON.stringify(profileData)
    }

    console.log(`[ANALYZE] Parsing PDF for user ${user_id}...`)
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
      console.warn(`[ANALYZE] pdf.js-extract failed (${err.message}), trying fallback...`)
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
        let errorMsg = fallbackErr.message || String(fallbackErr);
        if (errorMsg.includes('Invalid XRef stream header') || errorMsg.includes('Invalid PDF structure')) {
          return NextResponse.json({ 
            detail: `The PDF file is corrupted, password-protected, or not a true PDF. Please download a clean PDF copy and re-upload.` 
          }, { status: 400 })
        }
        return NextResponse.json({ detail: `Failed to parse PDF resume: ${err.message}` }, { status: 400 })
      }
    }

    // Call LLM for Structured Extraction
    const systemPrompt = `You are an expert technical recruiter AI. Your job is to extract candidate information from their resume text.

Return ONLY valid JSON matching the schema below. Do not include markdown codeblocks, backticks, or conversational text.

IMPORTANT EMPLOYMENT RULES:
1. Extract EVERY employer from the candidate's work experience.
2. For each employer extract:
   - company (Clean, short normalized name ONLY, e.g., "Capgemini")
   - job_title
   - start_date
   - end_date
   - is_current (true ONLY if end_date is "Present" or "Current")
3. A company is current ONLY when its end date is "Present", "Current", or equivalent.
4. Set current_company to the employer marked current.

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
    "Are you willing to relocate to Bangalore?": "Yes",
    "Current Company (payroll)?": "",
    "Total years of experience?": "",
    "Current location?": "",
    "Preferred location?": "",
    "Any active backlogs?": "No"
  }
}

Keyword rules:
- skills and keywords must contain individual searchable technology terms.
- roles should contain realistic job titles matching the candidate's experience.
- avoid_companies must contain every past and present employer name.
- predefined_answers["Current Company (payroll)?"] must equal current_company.
- Incorporate custom user instructions where applicable.`

    let userMessage = `Candidate Resume Text:\n${resumeText.slice(0, 8000)}\n\nCustom User Instructions:\n${custom_prompt || "No custom instructions."}`
    if (existingProfileJson) {
      userMessage += `\n\nPreviously Saved Profile Data (use as reference to preserve existing non-empty fields):\n${existingProfileJson}`
    }
    userMessage += `\n\nOutput only valid JSON.`

    let resultText = ''
    let extractionSource = 'groq'
    const groqKey = process.env.GROQ_API_KEY
    const groqPrimaryModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
    const groqFallbackModel = 'openai/gpt-oss-20b'

    // Step 1: Try Primary Groq Model
    if (groqKey && groqKey !== 'dummy_key') {
      const t0 = Date.now()
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          model: groqPrimaryModel,
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
        resultText = completion.choices[0]?.message?.content || ''
        const durationMs = Date.now() - t0
        logLlmTelemetry({
          userId: user_id,
          userEmail: existingProfile?.email || user_id,
          provider: 'groq',
          model: groqPrimaryModel,
          taskType: 'resume_parsing',
          question: 'Extract structured candidate profile from uploaded resume PDF',
          prompt: userMessage.slice(0, 1500),
          answer: resultText,
          durationMs,
          status: 'success',
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        }).catch(() => {})
      } catch (err1: any) {
        console.warn(`[ANALYZE] Groq primary (${groqPrimaryModel}) failed: ${err1.message}. Trying Groq fallback (${groqFallbackModel})...`)
        // Try Secondary Groq Model
        try {
          const completion = await groq.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage }
            ],
            model: groqFallbackModel,
            temperature: 0.1,
            response_format: { type: 'json_object' }
          })
          resultText = completion.choices[0]?.message?.content || ''
          const durationMs = Date.now() - t0
          logLlmTelemetry({
            userId: user_id,
            userEmail: existingProfile?.email || user_id,
            provider: 'groq',
            model: groqFallbackModel,
            taskType: 'resume_parsing',
            question: 'Extract structured candidate profile from uploaded resume PDF',
            prompt: userMessage.slice(0, 1500),
            answer: resultText,
            durationMs,
            status: 'success',
            promptTokens: completion.usage?.prompt_tokens || 0,
            completionTokens: completion.usage?.completion_tokens || 0,
            totalTokens: completion.usage?.total_tokens || 0,
          }).catch(() => {})
        } catch (err2: any) {
          console.warn(`[ANALYZE] Groq fallback failed: ${err2.message}`)
        }
      }
    }

    // Step 2: Try OpenRouter if Groq didn't succeed
    if (!resultText) {
      const openRouterKey = process.env.OPENROUTER_API_KEY
      const openRouterModel = process.env.MODEL || 'google/gemma-4-26b-a4b-it:free'
      if (openRouterKey) {
        extractionSource = 'openrouter'
        const t0Or = Date.now()
        try {
          // Strict 8.5-second timeout on OpenRouter to prevent Vercel 504 Gateway Timeout
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 8500)

          const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openRouterKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: openRouterModel,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
              ],
              temperature: 0.1,
              response_format: { type: 'json_object' }
            }),
            signal: controller.signal
          })
          clearTimeout(timeoutId)

          if (openRouterRes.ok) {
            const orData = await openRouterRes.json()
            resultText = orData.choices?.[0]?.message?.content || ''
            logLlmTelemetry({
              userId: user_id,
              userEmail: existingProfile?.email || user_id,
              provider: 'openrouter',
              model: openRouterModel,
              taskType: 'resume_parsing',
              question: 'Extract structured candidate profile from uploaded resume PDF',
              prompt: userMessage.slice(0, 1500),
              answer: resultText,
              durationMs: Date.now() - t0Or,
              status: 'fallback',
              promptTokens: orData.usage?.prompt_tokens || 0,
              completionTokens: orData.usage?.completion_tokens || 0,
              totalTokens: orData.usage?.total_tokens || 0,
            }).catch(() => {})
          }
        } catch (orErr: any) {
          console.warn(`[ANALYZE] OpenRouter fallback failed or timed out: ${orErr.message}`)
        }
      }
    }

    // Step 3: Parse Result or Fallback to Deterministic Parser
    let resultJson: any = {}
    if (resultText) {
      try {
        resultJson = JSON.parse(resultText)
      } catch (e) {
        try {
          const cleaned = resultText.replace(/```json/gi, '').replace(/```/g, '').trim()
          resultJson = JSON.parse(cleaned)
        } catch {
          resultJson = {}
        }
      }
    }

    // If LLM returned empty or malformed output, use our deterministic extractor
    if (!resultJson || Object.keys(resultJson).length === 0 || (!resultJson.name && !resultJson.skills)) {
      console.log(`[ANALYZE] LLM output unavailable or invalid, using deterministic regex extractor...`)
      resultJson = deterministicFallbackExtraction(resumeText, existingProfile)
      extractionSource = 'deterministic'
    }

    // ------------------------------------
    // Deterministic employment validation
    // ------------------------------------
    const employmentHistory: any[] = Array.isArray(resultJson.employment_history)
      ? resultJson.employment_history
      : []

    const normalize = (value: string = '') => String(value).trim().toLowerCase()

    function getCurrentJob(jobs: any[]) {
      const presentJob = jobs.find(job => {
        const endDate = normalize(job.end_date)
        return ['present', 'current', 'ongoing', 'now'].includes(endDate) || job.is_current
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
    }

    // Avoid companies: every unique past and current employer
    const extractedCompanies = [
      ...new Set(employmentHistory.map((job: any) => job.company).filter(Boolean))
    ] as string[]

    // ----------------------------------------------------
    // SMART MERGE & AUTO-UPDATE EXISTING CANDIDATE PROFILE
    // ----------------------------------------------------
    const existingRoles = Array.isArray(existingProfile?.job_filters?.roles) ? existingProfile.job_filters.roles : []
    const extractedRoles = Array.isArray(resultJson.job_filters?.roles) ? resultJson.job_filters.roles : []
    const mergedRoles = Array.from(new Set([...existingRoles, ...extractedRoles].filter(Boolean)))

    const existingSkills = Array.isArray(existingProfile?.skills) ? existingProfile.skills : []
    const extractedSkills = Array.isArray(resultJson.skills) ? resultJson.skills : []
    // Case-insensitive deduplication for skills
    const seenSkills = new Set<string>()
    const mergedSkills: string[] = []
    for (const s of [...existingSkills, ...extractedSkills]) {
      const cleaned = String(s || '').trim()
      if (cleaned && !seenSkills.has(cleaned.toLowerCase())) {
        seenSkills.add(cleaned.toLowerCase())
        mergedSkills.push(cleaned)
      }
    }

    const existingAvoid = Array.isArray(existingProfile?.job_filters?.avoid_companies) ? existingProfile.job_filters.avoid_companies : []
    const mergedAvoidCompanies = Array.from(new Set([...existingAvoid, ...extractedCompanies].filter(Boolean)))

    const existingLocations = Array.isArray(existingProfile?.job_filters?.location) ? existingProfile.job_filters.location : []
    const extractedLocation = resultJson.current_location || ''
    let mergedLocations = existingLocations
    if (mergedLocations.length === 0) {
      mergedLocations = extractedLocation ? [extractedLocation, 'Remote', 'Hybrid'] : ['Bangalore', 'Remote', 'Hybrid']
    }

    const finalCompany = resultJson.current_company || existingProfile?.current_company || (employmentHistory[0]?.company || '')
    const finalExperience = (resultJson.experience !== undefined && resultJson.experience !== null && !isNaN(Number(resultJson.experience)) && Number(resultJson.experience) > 0)
      ? Number(resultJson.experience)
      : (existingProfile?.experience || 0)

    const now = new Date()
    const mergedProfile: any = {
      user_id: user_id || existingProfile?.user_id,
      name: resultJson.name || existingProfile?.name || '',
      email: existingProfile?.email || resultJson.email || '',
      password: existingProfile?.password || resultJson.password || '',
      experience: finalExperience,
      current_ctc: existingProfile?.current_ctc || resultJson.current_ctc || 0,
      expected_ctc: existingProfile?.expected_ctc || resultJson.expected_ctc || 0,
      current_company: finalCompany,
      current_location: resultJson.current_location || existingProfile?.current_location || 'Bangalore',
      search_url: existingProfile?.search_url || resultJson.search_url || 'https://www.naukri.com/mnjuser/recommendedjobs',
      skills: mergedSkills.length > 0 ? mergedSkills : ['Python', 'FastAPI'],
      employment_history: employmentHistory.length > 0 ? employmentHistory : (existingProfile?.employment_history || []),
      job_filters: {
        ...(existingProfile?.job_filters || {}),
        roles: mergedRoles.length > 0 ? mergedRoles : ['Python Developer', 'Backend Developer', 'AI Engineer'],
        location: mergedLocations,
        keywords: mergedSkills,
        must_have_keywords: existingProfile?.job_filters?.must_have_keywords || [],
        avoid_companies: mergedAvoidCompanies
      },
      predefined_answers: {
        ...(existingProfile?.predefined_answers || {}),
        ...(resultJson.predefined_answers || {}),
        'Current Company (payroll)?': finalCompany,
        'Total years of experience?': String(finalExperience),
        'Current location?': resultJson.current_location || existingProfile?.current_location || 'Bangalore',
        'What is your notice period?': existingProfile?.predefined_answers?.['What is your notice period?'] || resultJson.predefined_answers?.['What is your notice period?'] || 'Immediate / 15 Days',
        'Are you on a career break?': existingProfile?.predefined_answers?.['Are you on a career break?'] || 'No',
        'Are you willing to relocate to Bangalore?': existingProfile?.predefined_answers?.['Are you willing to relocate to Bangalore?'] || 'Yes'
      },
      resume_filename: existingProfile?.resume_filename || `${user_id}_Resume.pdf`,
      picture: existingProfile?.picture || '',
      has_resume: true,
      last_profile_updated_at: now,
      updated_at: now
    }

    // Persist and update directly in MongoDB
    if (user_id) {
      await db.collection('profiles').updateOne(
        { user_id },
        { $set: mergedProfile },
        { upsert: true }
      )
      console.log(`[ANALYZE] Successfully updated and persisted profile for ${user_id} in MongoDB (source: ${extractionSource})`)
    }

    return NextResponse.json({
      status: 'success',
      source: extractionSource,
      data: mergedProfile
    })
  } catch (err: any) {
    console.error("Analyze error:", err)
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
