import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const DAILY_LIMIT = 10;

let _instance: Ratelimit | null = null;

function getInstance(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url?.startsWith('https') || !token) return null;

  if (!_instance) {
    _instance = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.fixedWindow(DAILY_LIMIT, '1 h'),
      prefix: 'meat-scout',
    });
  }
  return _instance;
}

const ALLOW: Awaited<ReturnType<Ratelimit['limit']>> = {
  success: true,
  reset: 0,
  remaining: DAILY_LIMIT,
  limit: DAILY_LIMIT,
  pending: Promise.resolve(),
};

export const ratelimit = {
  limit: (identifier: string) => getInstance()?.limit(identifier) ?? Promise.resolve(ALLOW),
  getRemaining: (identifier: string) =>
    getInstance()?.getRemaining(identifier) ??
    Promise.resolve({ remaining: DAILY_LIMIT, reset: 0, limit: DAILY_LIMIT }),
};
