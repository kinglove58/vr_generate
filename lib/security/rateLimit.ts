export type RateLimitOptions = {
  windowMs: number;
  max: number;
};

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

export function createRateLimiter(options: RateLimitOptions) {
  const store = new Map<string, { count: number; resetAt: number }>();

  return function check(key: string): RateLimitResult {
    const now = Date.now();
    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      const resetAt = now + options.windowMs;
      store.set(key, { count: 1, resetAt });
      return { ok: true, remaining: options.max - 1, resetAt };
    }

    current.count += 1;

    if (current.count > options.max) {
      return { ok: false, remaining: 0, resetAt: current.resetAt };
    }

    return { ok: true, remaining: options.max - current.count, resetAt: current.resetAt };
  };
}

export function getClientId(request: Request): string {
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

  const userAgent = request.headers.get("user-agent");
  return userAgent ? `ua:${userAgent}` : "unknown";
}