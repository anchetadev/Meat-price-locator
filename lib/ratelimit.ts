import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const DAILY_LIMIT = 15;

let _instance: Ratelimit | null = null;

function getInstance(): Ratelimit {
  if (!_instance) {
    _instance = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.fixedWindow(DAILY_LIMIT, '1 d'),
      prefix: 'meat-scout',
    });
  }
  return _instance;
}

export const ratelimit = {
  limit: (identifier: string) => getInstance().limit(identifier),
  getRemaining: (identifier: string) => getInstance().getRemaining(identifier),
};
