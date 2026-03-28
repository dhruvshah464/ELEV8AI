type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  identifier: string,
  options: {
    maxRequests: number;
    windowMs: number;
  }
) {
  const now = Date.now();
  const current = buckets.get(identifier);

  if (!current || current.resetAt <= now) {
    const next: Bucket = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    buckets.set(identifier, next);

    return {
      allowed: true,
      remaining: Math.max(0, options.maxRequests - 1),
      resetAt: next.resetAt,
    };
  }

  if (current.count >= options.maxRequests) {
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
    remaining: Math.max(0, options.maxRequests - current.count),
    resetAt: current.resetAt,
  };
}
