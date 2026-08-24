/**
 * src/lib/seedData.ts
 * Default Candidate Profiles, QA Memories, and Starter Application Histories.
 * Ensures the Web Dashboard and Admin Controller always display rich data immediately.
 */

export interface CandidateSeed {
  user_id: string
  name: string
  email: string
  password: string
  experience: number
  current_ctc: number
  expected_ctc: number
  search_url: string
  job_filters: {
    location: string[]
    keywords: string[]
    must_have_keywords: string[]
    must_not_have_keywords?: string[]
    women_only?: boolean
    remote_only?: boolean
  }
  predefined_answers?: Record<string, string>
  resume_filename: string
  stats: {
    today: number
    this_week: number
    this_month: number
    total_applied: number
    last_applied_at: string
  }
  initial_history: Array<{
    id: string
    title: string
    company: string
    location: string
    url: string
    status: string
    date: string
    score: number
  }>
}

export const SEED_CANDIDATES: Record<string, CandidateSeed> = {
  candidate1_koushiksr: {
    user_id: 'candidate1_koushiksr',
    name: 'Koushik S R',
    email: 'koushiksr1999@gmail.com',
    password: 'qohcyt-hobsEx-1xirco',
    experience: 3,
    current_ctc: 800000,
    expected_ctc: 1600000,
    search_url: 'https://www.naukri.com/python-developer-jobs-in-bangalore-bengaluru',
    job_filters: {
      location: ['Bangalore', 'Bengaluru', 'Remote', 'Hybrid'],
      keywords: ['Python', 'FastAPI', 'Django', 'Backend Engineer', 'Full Stack Developer', 'Software Engineer'],
      must_have_keywords: ['Python']
    },
    predefined_answers: {
      'What is your notice period?': 'Immediate / 15 Days',
      'What is your current CTC?': '8 LPA',
      'What is your expected CTC?': '16 LPA',
      'Are you willing to relocate to Bangalore?': 'Yes'
    },
    resume_filename: 'Koushik_S_R_Resume.pdf',
    stats: {
      today: 12,
      this_week: 64,
      this_month: 218,
      total_applied: 486,
      last_applied_at: new Date().toISOString()
    },
    initial_history: [
      {
        id: 'job_k1',
        title: 'Senior Python Backend Engineer',
        company: 'Infosys BPM',
        location: 'Bengaluru / Bangalore',
        url: 'https://www.naukri.com/job-listings-python-backend',
        status: 'applied',
        date: new Date(Date.now() - 3600000 * 2).toISOString().replace('T', ' ').substring(0, 19),
        score: 94
      },
      {
        id: 'job_k2',
        title: 'Full Stack Python Developer (FastAPI + React)',
        company: 'Razorpay Software',
        location: 'Bangalore / Remote',
        url: 'https://www.naukri.com/job-listings-fastapi-react',
        status: 'applied',
        date: new Date(Date.now() - 3600000 * 5).toISOString().replace('T', ' ').substring(0, 19),
        score: 91
      },
      {
        id: 'job_k3',
        title: 'Software Development Engineer II - Backend',
        company: 'Swiggy',
        location: 'Bengaluru',
        url: 'https://www.naukri.com/job-listings-sde-2-backend',
        status: 'applied',
        date: new Date(Date.now() - 3600000 * 18).toISOString().replace('T', ' ').substring(0, 19),
        score: 88
      },
      {
        id: 'job_k4',
        title: 'AI Platform Engineer (Python / LangChain)',
        company: 'Flipkart Internet',
        location: 'Bangalore / Hybrid',
        url: 'https://www.naukri.com/job-listings-ai-platform-engineer',
        status: 'applied',
        date: new Date(Date.now() - 86400000 * 2).toISOString().replace('T', ' ').substring(0, 19),
        score: 96
      }
    ]
  },
  candidate2_rakshitha_D_L: {
    user_id: 'candidate2_rakshitha_D_L',
    name: 'Rakshitha D L',
    email: 'rakshithadl2003@gmail.com',
    password: 'Rakshitha@123',
    experience: 1,
    current_ctc: 400000,
    expected_ctc: 800000,
    search_url: 'https://www.naukri.com/data-analyst-jobs-in-bangalore-bengaluru',
    job_filters: {
      location: ['Bangalore', 'Bengaluru', 'Remote', 'Hybrid'],
      keywords: ['Python', 'SQL', 'Data Analyst', 'Business Analyst', 'Power BI', 'Machine Learning'],
      must_have_keywords: ['SQL', 'Python']
    },
    predefined_answers: {
      'What is your notice period?': 'Immediate',
      'What is your current CTC?': '4 LPA',
      'What is your expected CTC?': '8 LPA',
      'Are you comfortable working in Bangalore?': 'Yes'
    },
    resume_filename: 'Rakshitha_D_L_Resume.pdf',
    stats: {
      today: 8,
      this_week: 42,
      this_month: 135,
      total_applied: 240,
      last_applied_at: new Date().toISOString()
    },
    initial_history: [
      {
        id: 'job_r1',
        title: 'Junior Data Analyst (Python / SQL)',
        company: 'Mu Sigma Inc',
        location: 'Bengaluru / Bangalore',
        url: 'https://www.naukri.com/job-listings-data-analyst-sql',
        status: 'applied',
        date: new Date(Date.now() - 3600000 * 3).toISOString().replace('T', ' ').substring(0, 19),
        score: 92
      },
      {
        id: 'job_r2',
        title: 'Business Intelligence Analyst',
        company: 'Accenture Solutions',
        location: 'Bangalore / Hybrid',
        url: 'https://www.naukri.com/job-listings-bi-analyst',
        status: 'applied',
        date: new Date(Date.now() - 3600000 * 8).toISOString().replace('T', ' ').substring(0, 19),
        score: 89
      },
      {
        id: 'job_r3',
        title: 'Data Engineer Trainee',
        company: 'TCS Digital',
        location: 'Bengaluru',
        url: 'https://www.naukri.com/job-listings-data-engineer-trainee',
        status: 'applied',
        date: new Date(Date.now() - 86400000 * 3).toISOString().replace('T', ' ').substring(0, 19),
        score: 87
      }
    ]
  }
}

/**
 * Auto-seed candidate profiles and initial stats into MongoDB if empty.
 */
export async function ensureDbSeeded(db: any) {
  if (!db) return

  try {
    for (const [userId, candidate] of Object.entries(SEED_CANDIDATES)) {
      // 1. Seed Profile
      await db.collection('profiles').updateOne(
        { user_id: userId },
        {
          $setOnInsert: {
            user_id: candidate.user_id,
            name: candidate.name,
            email: candidate.email,
            password: candidate.password,
            experience: candidate.experience,
            current_ctc: candidate.current_ctc,
            expected_ctc: candidate.expected_ctc,
            search_url: candidate.search_url,
            job_filters: candidate.job_filters,
            predefined_answers: candidate.predefined_answers || {},
            resume_filename: candidate.resume_filename,
            updated_at: new Date()
          }
        },
        { upsert: true }
      )

      // 2. Seed Stats
      await db.collection('user_stats').updateOne(
        { user_id: userId },
        {
          $setOnInsert: {
            user_id: candidate.user_id,
            today: candidate.stats.today,
            this_week: candidate.stats.this_week,
            this_month: candidate.stats.this_month,
            total_applied: candidate.stats.total_applied,
            last_applied_at: new Date(candidate.stats.last_applied_at)
          }
        },
        { upsert: true }
      )

      // 3. Seed Applied Jobs History
      for (const job of candidate.initial_history) {
        await db.collection('applied_jobs').updateOne(
          { user_id: userId, job_title: job.title, company: job.company },
          {
            $setOnInsert: {
              user_id: userId,
              job_title: job.title,
              company: job.company,
              location: job.location,
              job_url: job.url,
              status: job.status,
              match_score: job.score,
              applied_at: new Date(job.date)
            }
          },
          { upsert: true }
        )
      }
    }
  } catch (err) {
    console.warn('[Seed] Warning during auto-seeding:', err)
  }
}
