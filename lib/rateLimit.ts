type TokenBucket = {
  tokens: number;
  lastRefill: number;
};

const buckets = new Map<string, TokenBucket>();

export function rateLimit(options: { capacity: number; refillPerMinute: number }) {
  return function check(request: Request): { ok: boolean; retryAfterMs: number } {
    const clientId = getClientId(request);
    const now = Date.now();
    const bucket = buckets.get(clientId) ?? { tokens: options.capacity, lastRefill: now };

    const refillRatePerMs = options.refillPerMinute / 60000;
    const refill = (now - bucket.lastRefill) * refillRatePerMs;
    bucket.tokens = Math.min(options.capacity, bucket.tokens + refill);
    bucket.lastRefill = now;

    if (bucket.tokens < 1) {
      buckets.set(clientId, bucket);
      const retryAfterMs = Math.ceil((1 - bucket.tokens) / refillRatePerMs);
      return { ok: false, retryAfterMs };
    }

    bucket.tokens -= 1;
    buckets.set(clientId, bucket);
    return { ok: true, retryAfterMs: 0 };
  };
}

function getClientId(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  return `ua:${userAgent}`;
}
