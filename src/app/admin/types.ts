export type AdminTabType = 'candidates' | 'requests' | 'queue' | 'payments' | 'offers' | 'enterprise_leads' | 'enterprise_orgs' | 'logs' | 'visitors' | 'reviews'

export type LogsSubTabType = 'activity' | 'llm_telemetry' | 'job_history' | 'tickets'

export interface AdminOverviewMetrics {
  total_profiles: number
  scheduled_profiles_active: number
  vip_profiles_count: number
  applied_today: number
  applied_this_week: number
  applied_this_month: number
  total_applied: number
}

export interface AdminQueueMetrics {
  total: number
  pending: number
  running: number
  completed: number
  failed: number
  cancelled: number
}

export interface AdminWorkerStatus {
  is_busy: boolean
  active_task_id: string | null
  active_user_id: string | null
  started_at: string | null
}

export interface AdminExecutionCounts {
  all: number
  applying: number
  applied_today: number
  in_queue: number
  not_applied_today: number
  disabled: number
  payment_required: number
}

export interface CandidateExecutionInfo {
  status: 'applying' | 'applied_today' | 'in_queue' | 'not_applied_today' | 'disabled' | 'payment_required'
  is_applying: boolean
  is_applied_today: boolean
  is_in_queue?: boolean
  device: string | null
  hostname?: string | null
  device_brand?: string | null
  hardware_model?: string | null
  mac_address?: string | null
  worker_id: string | null
  platform?: string | null
  pid?: number | string | null
  last_run_date?: string | null
  completed_at?: string | null
  locked_at?: string | null
  task_id?: string | null
  source?: string | null
}

export interface CandidateUser {
  _id?: string
  user_id: string
  email: string
  name?: string
  phone?: string
  created_at?: string
  updated_at?: string
  is_vip?: boolean
  is_admin?: boolean
  is_org_admin?: boolean
  is_org_admin_only?: boolean
  org_id?: string | null
  org_name?: string | null
  enterprise_role?: string | null
  role?: string
  plan?: string
  plan_name?: string
  plan_tier?: string
  plan_expires_at?: string | null
  plan_expiry_status?: string
  plan_hours_left?: number | null
  hours_until_expiry?: number | null
  target_role?: string
  target_roles?: string[]
  target_locations?: string[]
  min_experience_years?: number
  max_experience_years?: number
  expected_salary?: string
  enabled_for_daily_run?: boolean
  last_login_at?: string
  applied_count?: number
  total_applied?: number
  applied_today?: number
  daily_application_limit?: number
  applied_this_week?: number
  applied_this_month?: number
  stats?: any
  bot_schedule?: any
  subscription?: any
  naukri_credentials?: any
  last_automated_run_date?: string | null
  last_automated_run_at?: string | null
  daily_status?: string | null
  current_execution?: any
  last_execution?: any
  execution_summary?: CandidateExecutionInfo
  [key: string]: any
}

export interface QueueTask {
  _id: string
  task_id: string
  user_id: string
  candidate_name?: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  target_roles?: string[]
  max_applications?: number
  applied_count?: number
  created_at?: string
  updated_at?: string
  started_at?: string
  completed_at?: string
  error_message?: string
  execution_logs?: string[]
  [key: string]: any
}

export interface PaymentRecord {
  _id: string
  order_id: string
  payment_id?: string
  user_id: string
  email: string
  amount: number
  plan_name: string
  plan_tier: string
  status: 'paid' | 'created' | 'failed'
  created_at: string
  [key: string]: any
}

export interface SupportTicket {
  _id: string
  ticket_id: string
  user_id: string
  name: string
  email: string
  category: string
  priority: 'normal' | 'high' | 'urgent'
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  updated_at?: string
  admin_notes?: string
  [key: string]: any
}

export interface EnterpriseLead {
  _id: string
  name: string
  email: string
  phone?: string
  organization: string
  seat_count?: string
  notes?: string
  created_at: string
  status?: string
  [key: string]: any
}

export interface OffersData {
  presets: any[]
  metrics: {
    total_candidates: number
    unsubscribed_count: number
    subscribed_count: number
    active_assigned_offers?: number
    expired_offers?: number
    revoked_offers?: number
  }
  assigned_offers?: any[]
  history: any[]
}

export interface LlmStats {
  total_calls: number
  avg_duration_ms: number
  success_rate: number
  total_tokens: number
  providers: Array<{ provider: string; count: number; avg_duration_ms: number; share_percent: number }>
  top_questions: Array<{ question: string; count: number; sample_answer: string }>
}

export interface ActivityStats {
  total_logins: number
  total_profile_updates: number
  total_resume_uploads: number
  total_task_runs: number
  total_logged_events: number
}

export interface TicketStats {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
}

export interface VisitorEventRecord {
  id: string
  visitor_id: string
  session_id: string
  event_type: 'page_view' | 'payment_click' | 'payment_success' | 'payment_fail' | 'pwa_install_click' | 'cta_click' | 'signup' | 'lead' | 'custom'
  path: string
  full_url?: string
  referrer?: string
  title?: string
  email?: string
  user_id?: string
  user_name?: string
  is_authenticated: boolean
  ip_address: string
  country?: string
  country_name?: string
  city?: string
  region?: string
  user_agent: string
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  os: string
  browser: string
  screen_resolution?: string
  language?: string
  metadata: Record<string, any>
  created_at: string
  linked?: { email: string | null; user_id: string | null; manual: boolean } | null
}

export interface VisitorMetrics {
  total_unique_visitors: number
  total_page_views: number
  total_payment_intents: number
  identified_visitors_count: number
  today_visitors: number
  today_page_views: number
  today_payment_clicks: number
  top_pages: Array<{ path: string; count: number }>
  devices_breakdown: { desktop: number; mobile: number; tablet: number }
}
