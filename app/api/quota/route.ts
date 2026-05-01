import { ratelimit } from '@/lib/ratelimit';

function getIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
}

export async function GET(req: Request) {
  const ip = getIp(req);
  const { remaining, limit, reset } = await ratelimit.getRemaining(ip);
  return Response.json({ remaining, limit, reset });
}
