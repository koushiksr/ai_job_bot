/**
 * MongoDB query helpers.
 *
 * All exact-match lookups MUST go through exactMatchCI: raw string
 * interpolation into `$regex` treats `.`, `+`, etc. as regex operators,
 * so `a.c@x.com` would match `abc@x.com` (over-matching auth/payment rows)
 * and crafted input can ReDoS the database.
 */

/** Escape all regex operators in a literal string. */
export function escapeRegExp(s: string): string {
  return (s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Exact full-string match, case-insensitive: `{ $regex: '^escaped$', $options: 'i' }`. */
export function exactMatchCI(value: string): { $regex: string; $options: string } {
  // NOTE: this file is excluded from automated $regex rewrites — it IS the helper.
  return { $regex: `^${escapeRegExp(value)}$`, $options: 'i' }
}
