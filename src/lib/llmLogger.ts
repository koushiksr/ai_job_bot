/**
 * src/lib/llmLogger.ts
 * Telemetry and observability logger for all LLM calls made in Next.js API routes.
 * Non-blocking, failsafe MongoDB persistence into `llm_logs` collection.
 */

import { getDb } from '@/lib/mongodb'

export interface LlmLogPayload {
  userId?: string
  userEmail?: string
  provider: 'groq' | 'openrouter' | 'gemini' | 'openai' | 'anthropic' | 'grok' | string
  model: string
  taskType: 'screening_question' | 'resume_parsing' | 'headline_generation' | 'resume_generation' | 'general' | string
  question?: string
  prompt?: string
  answer?: string
  candidateContext?: Record<string, any>
  durationMs: number
  status: 'success' | 'fallback' | 'error'
  error?: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  metadata?: Record<string, any>
}

export async function logLlmTelemetry(payload: LlmLogPayload): Promise<void> {
  try {
    const db = await getDb()
    if (!db) return

    const now = new Date()
    const doc = {
      user_id: payload.userId || 'system',
      user_email: payload.userEmail || '',
      provider: (payload.provider || 'unknown').toLowerCase(),
      model: payload.model || '',
      task_type: payload.taskType || 'general',
      question: payload.question || '',
      prompt: payload.prompt || '',
      answer: payload.answer || '',
      candidate_context: payload.candidateContext || {},
      duration_ms: Math.max(0, Math.round(payload.durationMs || 0)),
      status: payload.status,
      error: payload.error || '',
      prompt_tokens: Math.round(payload.promptTokens || 0),
      completion_tokens: Math.round(payload.completionTokens || 0),
      total_tokens: Math.round(payload.totalTokens || ((payload.promptTokens || 0) + (payload.completionTokens || 0))),
      metadata: payload.metadata || {},
      created_at: now,
      date: now.toISOString().split('T')[0], // YYYY-MM-DD for fast daily indexing and queries
    }

    // Non-blocking fire-and-forget insert
    db.collection('llm_logs').insertOne(doc).catch(err => {
      console.warn('[llmLogger] Insert error:', err?.message || err)
    })
  } catch (err: any) {
    console.warn('[llmLogger] Warning:', err?.message || err)
  }
}
