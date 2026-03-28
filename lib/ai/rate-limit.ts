const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 12;

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function checkAiRateLimit(identifier: string) {
  const now = Date.now();
  const current = buckets.get(identifier);

  if (!current || current.resetAt <= now) {
    const next: Bucket = {
      count: 1,
      resetAt: now + WINDOW_MS,
    };
    buckets.set(identifier, next);
    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetAt: next.resetAt,
    };
  }

  if (current.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
    };
  }

  current.count += 1;
  buckets.set(identifier, current);

  return {
    allowed: true,
    remaining: Math.max(0, MAX_REQUESTS - current.count),
    resetAt: current.resetAt,
  };
}
