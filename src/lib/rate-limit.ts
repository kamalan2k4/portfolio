/**
 * Fixed-window in-memory rate limiter. Each serverless instance keeps its own
 * window, so this is a first line of defence, not a global guarantee.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function check(key: string, now: number) {
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true, retryAfter: 0 };
    }
    entry.count += 1;
    if (entry.count > limit) return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
    return { ok: true, retryAfter: 0 };
  };
}
