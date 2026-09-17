export interface ReviewItem {
  id: string
  user_id?: string
  user_email?: string
  user_name: string
  user_avatar?: string
  role_title?: string
  company?: string
  rating: number
  satisfaction_level?: string
  review_text: string
  verified: boolean
  featured?: boolean
  status: 'approved' | 'pending' | 'rejected'
  created_at: string
}

export const INITIAL_SAMPLE_REVIEWS: Array<Omit<ReviewItem, 'id'>> = [
  {
    user_name: 'Aditya Nambiar',
    user_avatar: '/images/candidates/aditya_nambiar.svg',
    role_title: 'Senior AI & Full-Stack Systems Engineer',
    company: 'Fintech Cloud Systems · Bengaluru',
    rating: 5,
    satisfaction_level: '4 Recruiter Calls in First Week',
    review_text: 'The 6:00 AM & 8:00 AM dual morning sweeps are a total game-changer. My applications hit hiring managers’ dashboards right as their morning shifts started. The AI-generated answers to screening questionnaires were spot on. Received 4 direct recruiter calls in the first 10 days.',
    verified: true,
    featured: true,
    status: 'approved',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    user_name: 'Meera Krishnan',
    user_avatar: '/images/candidates/meera_krishnan.svg',
    role_title: 'Lead Machine Learning & NLP Specialist',
    company: 'Applied AI Labs · Hyderabad',
    rating: 5,
    satisfaction_level: 'Saved 20+ Hours Every Week',
    review_text: 'Manually searching and applying on Naukri used to consume hours every night after work. JobFlux tailored my ATS keywords for each machine learning opening and applied autonomously. Scheduled two technical rounds within 2 weeks.',
    verified: true,
    featured: true,
    status: 'approved',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    user_name: 'Rohit Deshmukh',
    user_avatar: '/images/candidates/rohit_deshmukh.svg',
    role_title: 'Cloud DevOps & Platform Architect',
    company: 'Enterprise SaaS Infrastructure · Pune',
    rating: 5,
    satisfaction_level: '10x Better Screening Pass Rate',
    review_text: 'The application audit receipts provide complete proof with exact timestamps and screening answers submitted. The targeting filters prioritized high-growth product teams with exact tech stack matches.',
    verified: true,
    featured: true,
    status: 'approved',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString()
  },
  {
    user_name: 'Ananya Sengupta',
    user_avatar: '/images/candidates/ananya_sengupta.svg',
    role_title: 'Senior Product & Growth Lead',
    company: 'Consumer Tech Platforms · Gurugram',
    rating: 5,
    satisfaction_level: 'Top 5% Naukri Resdex Visibility',
    review_text: 'Pairing the Harvard ATS resume standard with daily autonomous dispatches gave my profile unprecedented reach. The customer support was remarkably fast and helpful when setting up my custom role criteria.',
    verified: true,
    featured: false,
    status: 'approved',
    created_at: new Date(Date.now() - 9 * 86400000).toISOString()
  },
  {
    user_name: 'Karthik Venkataraman',
    user_avatar: '/images/candidates/karthik_venkataraman.svg',
    role_title: 'Principal Backend Engineer (Go / Distributed Systems)',
    company: 'NextGen Financial Cloud · Chennai',
    rating: 5,
    satisfaction_level: 'High Precision Matching · Verified Submissions',
    review_text: 'JobFlux’s intelligent suitability analysis carefully evaluated tech stack alignments and experience criteria before submitting every application. The targeting accuracy was exceptional, and I received an offer through one of its verified dispatches within 3 weeks.',
    verified: true,
    featured: false,
    status: 'approved',
    created_at: new Date(Date.now() - 11 * 86400000).toISOString()
  }
]
