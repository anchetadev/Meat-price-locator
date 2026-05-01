import { anthropic } from '@ai-sdk/anthropic';
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai';
import { searchMeatPrices, searchArtist, searchBandOpinion } from '@/lib/tools';
import { buildSystemPrompt } from '@/lib/system-prompt';
import { ratelimit } from '@/lib/ratelimit';

export const maxDuration = 60;

function getIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
}

export async function POST(req: Request) {
  const ip = getIp(req);
  if (ip !== '127.0.0.1' && ip !== '::1') {
    const { success, reset, remaining } = await ratelimit.limit(ip);
    if (!success) {
      return Response.json({ error: 'rate_limited', reset, remaining: 0 }, { status: 429 });
    }
  }

  const { messages, location, stores }: { messages: UIMessage[]; location: string | null; stores?: string[] } =
    await req.json();

  const result = streamText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: buildSystemPrompt(location, stores),
    messages: await convertToModelMessages(messages),
    tools: { searchMeatPrices, searchArtist, searchBandOpinion },
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}
