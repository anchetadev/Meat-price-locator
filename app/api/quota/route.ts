import { ratelimit, DAILY_LIMIT } from '@/lib/ratelimit';

function getIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
}

export async function GET(req: Request) {
  const ip = getIp(req);
  if (ip === '127.0.0.1' || ip === '::1') {
    return Response.json({ remaining: DAILY_LIMIT, limit: DAILY_LIMIT, reset: null });
  }

  const { remaining, limit, reset } = await ratelimit.getRemaining(ip);
  return Response.json({ remaining, limit, reset });
}
