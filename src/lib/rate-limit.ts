type Entry = { count: number; resetAt: number };

const globalForRateLimit = globalThis as unknown as { tripRateLimits?: Map<string, Entry> };
const buckets = globalForRateLimit.tripRateLimits ?? new Map<string, Entry>();
if (process.env.NODE_ENV !== "production") globalForRateLimit.tripRateLimits = buckets;

/**
 * Proteção imediata por instância. Em múltiplas réplicas, substitua o storage
 * por Redis/Upstash mantendo esta interface.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}
