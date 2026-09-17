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
    user_name: 'Koushik S R',
    user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role_title: 'AI & GenAI Systems Engineer',
    company: 'Dell Technologies / Capgemini · Bengaluru',
    rating: 5,
    satisfaction_level: '4 Recruiter Calls in First Week',
    review_text: 'JobFlux automated my morning Naukri sweeps at 6:00 AM sharp while I was resting. The context-aware answers to employer screening questionnaires are remarkably precise. Received 4 direct recruiter interview callbacks in the first 10 days alone.',
    verified: true,
    featured: true,
    status: 'approved',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    user_name: 'Rakshitha D. L.',
    user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role_title: 'Full Stack React Native Developer',
    company: 'Tech Scaleup · Bengaluru',
    rating: 5,
    satisfaction_level: 'Saved 25+ Hours Every Week',
    review_text: 'Applying manually on Naukri used to take 2-3 exhausting hours every evening. JobFlux AI matches applications with Harvard ATS formats and applies during peak recruiter screening windows. Landed my target dev role through it!',
    verified: true,
    featured: true,
    status: 'approved',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    user_name: 'Arjun Sharma',
    user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role_title: 'Senior DevOps & Cloud Architect',
    company: 'Enterprise Cloud SaaS · Hyderabad',
    rating: 5,
    satisfaction_level: '10x Better Screening Pass Rate',
    review_text: 'The 6:00 AM & 8:00 AM dual morning schedule lands your profile on top of the recruiter stack before others even log in. The verified audit receipts in the dashboard provide complete transparency on dispatched applications.',
    verified: true,
    featured: true,
    status: 'approved',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString()
  },
  {
    user_name: 'Pooja Verma',
    user_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    role_title: 'Data Analyst & BI Specialist',
    company: 'FinTech Solutions · Pune',
    rating: 5,
    satisfaction_level: 'Pure Quality · Zero Irrelevant Applies',
    review_text: 'Unlike other bots that spray and pray random jobs, JobFlux respects experience thresholds and specific tech stacks. Got shortlisted for 3 product company interviews within two weeks.',
    verified: true,
    featured: false,
    status: 'approved',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString()
  },
  {
    user_name: 'Sneha Iyer',
    user_avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    role_title: 'Associate Product Manager',
    company: 'Consumer Internet · Mumbai',
    rating: 5,
    satisfaction_level: 'Top 5% Naukri Resdex Visibility',
    review_text: 'The ATS Resume Studio combined with automated application sweeps drastically increased my recruiter reach. The support team was also super fast in helping me tune my target role filters.',
    verified: true,
    featured: false,
    status: 'approved',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString()
  }
]
