/**
 * Shared OpenAI chat helper (primary LLM provider).
 *
 * Requires OPENAI_API_KEY in the environment (set it in Vercel dashboard).
 * Optional OPENAI_MODEL override, defaults to gpt-4.1-nano (cheapest).
 *
 * Includes a small in-memory response cache keyed by model + messages so
 * repeated identical requests (retries, re-renders, same resume analyzed
 * twice) cost $0. Serverless instances each hold their own cache; entries
 * expire after 24h and the map is capped to bound memory.
 */

interface ChatMessage {
  role: 'system' | 'user'
  content: string
}

interface OpenAIChatOptions {
  system?: string
  user: string
  temperature?: number
  maxTokens?: number
  jsonMode?: boolean
  timeoutMs?: number
  /** Set to false for non-deterministic / user-unique prompts */
  cacheable?: boolean
}

interface OpenAIChatResult {
  content: string
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
}

const cache = new Map<string, { content: string; usage: OpenAIChatResult['usage']; expires: number }>()
const MAX_ENTRIES = 200
const TTL_MS = 24 * 60 * 60 * 1000

function simpleHash(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  }
  return h.toString(36)
}

function getCached(key: string): { content: string; usage: OpenAIChatResult['usage'] } | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    cache.delete(key)
    return null
  }
  // Refresh LRU position
  cache.delete(key)
  cache.set(key, entry)
  return { content: entry.content, usage: entry.usage }
}

function setCached(key: string, content: string, usage: OpenAIChatResult['usage']) {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }
  cache.set(key, { content, usage, expires: Date.now() + TTL_MS })
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-4.1-nano'
}

export async function openaiChatCompletion(opts: OpenAIChatOptions): Promise<OpenAIChatResult | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const {
    system,
    user,
    temperature = 0.2,
    maxTokens = 1500,
    jsonMode = true,
    timeoutMs = 25000,
    cacheable = true,
  } = opts

  const model = getOpenAIModel()
  const messages: ChatMessage[] = []
  if (system) messages.push({ role: 'system', content: system })
  messages.push({ role: 'user', content: user })

  // Reasoning models (gpt-5*, o1/o3*) only support temperature=1 and use
  // max_completion_tokens instead of max_tokens.
  const isReasoningModel = /^(gpt-5|o1|o3)/i.test(model)
  const body: Record<string, unknown> = {
    model,
    messages,
    ...(isReasoningModel
      ? { max_completion_tokens: maxTokens }
      : { temperature, max_tokens: maxTokens }),
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
  }

  const key = cacheable
    ? `${model}|${temperature}|${maxTokens}|${jsonMode}|${simpleHash(JSON.stringify(messages))}`
    : null

  if (key) {
    const hit = getCached(key)
    if (hit) return hit
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) {
      console.warn(`[OpenAI] HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
      return null
    }
    const data = await res.json()
    const content: string = data.choices?.[0]?.message?.content || ''
    if (!content) return null
    const usage = {
      prompt_tokens: data.usage?.prompt_tokens || 0,
      completion_tokens: data.usage?.completion_tokens || 0,
      total_tokens: data.usage?.total_tokens || 0,
    }
    if (key) setCached(key, content, usage)
    return { content, usage }
  } catch (e: any) {
    console.warn(`[OpenAI] request failed: ${e?.message || e}`)
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}
