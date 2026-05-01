import { ratelimit } from '@/lib/ratelimit';

function getIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
}

export async function POST(req: Request) {
  const ip = getIp(req);
  await ratelimit.resetUsedTokens(ip);
  return Response.json({ ok: true });
}
