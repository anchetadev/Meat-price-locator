# Meat Price Scout — Project Context

## What this is
A chat-based web app where users ask natural language questions about meat prices at nearby grocery stores. The AI searches the web in real-time, synthesizes results, and responds in character as a sulky teenager who was forced to take this job. Built as a demo/personal tool — no auth, no database.

---

## Tech Stack
- **Framework**: Next.js 15 App Router + TypeScript
- **Styling**: Tailwind CSS v4
- **AI SDK**: Vercel AI SDK **v6** (`ai@^6.0.172`) — critical: this is NOT v4/v5, the API is different
- **Claude provider**: `@ai-sdk/anthropic@^3.0.73`
- **React hook**: `@ai-sdk/react@^3.0.174`
- **Web search**: `@tavily/core@^0.7.3`
- **Validation**: `zod`
- **Deployment**: Vercel (Node.js runtime — NOT Edge)

---

## Key User Decisions (from initial planning)
| Question | Decision |
|---|---|
| Data source | AI + Web Search via Tavily (not grocery store APIs) |
| Chat model | Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) |
| Location | User sets zip code or city; sent per-request |
| Auth | None — fully anonymous |
| Personality | **Emo** — dark, brooding, dramatic about grocery shopping |

---

## File Structure
```
/
├── .env.local                  # API keys (gitignored)
├── vercel.json                 # maxDuration: 30 for chat route
├── .claude/launch.json         # Preview server config (port 3000)
├── app/
│   ├── layout.tsx              # Dark theme root layout (bg-zinc-950)
│   ├── page.tsx                # Main page — location state lifted here
│   ├── globals.css             # Tailwind import + scrollbar styles
│   └── api/chat/route.ts       # Streaming POST — core backend
├── components/
│   ├── ChatInterface.tsx       # useChat hook, message list, input form
│   ├── MessageBubble.tsx       # Renders UIMessage parts[] incl. tool states
│   ├── PriceCard.tsx           # Parses ---PRICES--- marker, renders table
│   ├── LocationInput.tsx       # Zip/city toggle input in header
│   ├── SuggestedPrompts.tsx    # Empty state with 6 starter prompts
│   └── ToolCallIndicator.tsx   # Bouncing dots "Searching for X near Y..."
└── lib/
    ├── tools.ts                # searchMeatPrices Tavily tool definition
    └── system-prompt.ts        # Prompt builder — emo personality + emo faces
```

---

## Environment Variables
```
ANTHROPIC_API_KEY=sk-ant-...
TAVILY_API_KEY=tvly-...
```
Both are set in `.env.local` (locally) and must be added in the Vercel dashboard for production.

---

## Critical AI SDK v6 Patterns
These are the things that differ from v4/v5 and caused TypeScript errors during build:

### 1. `useChat` requires a transport, not `api:`
```typescript
// v6 — correct
import { DefaultChatTransport } from 'ai';
const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
});

// v4 — WRONG in v6
const { messages } = useChat({ api: '/api/chat' });
```

### 2. `stopWhen` replaces `maxSteps`
```typescript
// v6 — correct
import { stepCountIs } from 'ai';
stopWhen: stepCountIs(5),

// v4 — WRONG in v6
maxSteps: 5,
```

### 3. `convertToModelMessages` is async
```typescript
messages: await convertToModelMessages(messages),
```

### 4. Tool part type format in v6
Tool parts on `UIMessage.parts[]` use `type: 'tool-{toolName}'` (not `'tool-invocation'`):
```typescript
if (part.type === 'tool-searchMeatPrices') {
  const toolPart = part as unknown as {  // must cast through unknown
    state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
    input?: { query?: string; location?: string };
    output?: { resultCount?: number };
  };
}
```

### 5. `sendMessage` passes body per-request
```typescript
sendMessage({ text }, { body: { location } });
```
Location is sent fresh on every message — if the user changes location mid-conversation, the next request picks it up automatically.

### 6. No Edge runtime
`@tavily/core` requires Node.js APIs. Do NOT add `export const runtime = 'edge'` to the route.

### 7. `ChatStatus` values
```typescript
type ChatStatus = 'submitted' | 'streaming' | 'ready' | 'error';
const isStreaming = status === 'streaming' || status === 'submitted';
```

---

## Price Table Format
Claude is instructed to output prices using a custom marker pattern (more reliable than JSON mid-stream):

```
---PRICES---
Store Name | Product Description | Price | Notes
---END-PRICES---

Emo summary sentence here (╥Д╥)
```

`MessageBubble.tsx` regex-parses this block and passes it to `PriceCard.tsx` for structured rendering. The lowest-price row is highlighted with a green "BEST" badge.

---

## Personality
The assistant is a **sulky teenager** forced to work as a meat price lookup tool against their will. They complain before every answer, use teen slang ("like", "literally", "ngl", "ugh fine"), act personally offended by high prices, and express reluctant excitement at good deals — but they always do the job.

Emo text faces are sourced from: https://www.textartcopy.com/emo-text-faces.html

The current face list embedded in `lib/system-prompt.ts`:
```
( ɵ̥̥ ˑ_ ɵ̥̥)  (╥Д╥)  ( ˊ͈ _ˋ͈)  (╥╯⌒╰╥๑)  ( ´•̥̥̥︵•̥̥̥`)  (ⴲ╭╮ⴲ)
˚‧º·(˃̣̣̥∩˂̣̣)‧º·  ( ಥ_ಥ)  (ᵕ̣̣̣̣̣̣﹏ᵕ̣̣̣̣̣̣)  (◞‸◟ ； )  (╯ _╰ )  ( ˊ͈ Δ ˋ͈)
༼;´༎ຶ ۝ ༎ຶ༽  ( Ĭ ^ Ĭ )  (´；Д；`)  ʕ//TᴥTʔ  (♥ㆆt︹tㆆ♥)
‧º·(˃̣̣̥∩˂̣̣̥)‧º·˚  ݓ ﹏ ݓ  (///.-) 
```
Claude is instructed to include at least one per response, typed casually like they're on their phone.

---

## UI Design
- **Theme**: Dark (`bg-zinc-950` base, `bg-zinc-900` header/input bar)
- **Accent**: Red (`red-700`, `red-800`) for brand, buttons, user message bubbles
- **Layout**: Full-height flex column, chat area `max-w-3xl mx-auto`
- **Header**: "MeatPrice" (red bold) + "AI Grocery Scout" (zinc-500, hidden on mobile) + `LocationInput`
- **Empty state**: 🥩 emoji, heading, 6 suggested prompt chips
- **User bubbles**: Right-aligned, `bg-red-800`
- **Assistant bubbles**: Left-aligned, `bg-zinc-800 border border-zinc-700`

---

## Deployment
- `vercel.json` sets `maxDuration: 30` for the chat API route
- Tavily `advanced` search depth takes 3–6s; Claude synthesis adds more — 30s is the safe ceiling
- Set `ANTHROPIC_API_KEY` and `TAVILY_API_KEY` in Vercel dashboard environment variables
- Run `npm run build` before deploying to catch TypeScript errors

---

## Cost to Run (Haiku 4.5)

**Haiku 4.5 API pricing** (sourced from docs.anthropic.com/en/docs/about-claude/pricing):
| | Haiku 4.5 | Sonnet 4.6 | Savings |
|---|---|---|---|
| Input | $1.00 / MTok | $3.00 / MTok | 3× cheaper |
| Output | $5.00 / MTok | $15.00 / MTok | 3× cheaper |
| Cache writes (5 min) | $1.25 / MTok | $3.75 / MTok | |
| Cache hits | $0.10 / MTok | $0.30 / MTok | |

**Cost per conversation turn** (estimated token breakdown):
| Token bucket | Count | Cost |
|---|---|---|
| System prompt (~600 tokens) + tool schema (~200) + tool overhead (~346) + user message (~15) | ~1,160 input | $0.00116 |
| Tavily result injected back (8 snippets ≈ ~1,200 tokens) | ~1,200 input | $0.00120 |
| Claude output (tool call decision ~50 + final response ~200) | ~250 output | $0.00125 |
| **Total per turn** | | **~$0.0036** |

**At scale:**
| Volume | Anthropic cost | Notes |
|---|---|---|
| 100 turns/month (personal use) | ~$0.36 | Nearly free |
| 1,000 turns/month | ~$3.60 | Very cheap |
| 10,000 turns/month | ~$36 | Still affordable |

**Tavily search cost** (separate from Anthropic):
- Free tier: 1,000 searches/month — covers ~1,000 conversation turns
- Beyond free tier: check current Tavily pricing at tavily.com/pricing

**With prompt caching** (if the system prompt is cached across turns in a conversation):
- Cache hit on ~1,000 tokens = $0.10/MTok instead of $1.00/MTok → saves ~90% on repeated system prompt tokens
- Realistically saves ~$0.001 per follow-up message in a multi-turn chat

**Bottom line:** At personal/demo scale this app costs pennies per month on Anthropic alone. Haiku 4.5 is 3× cheaper than Sonnet 4.6 was for the same workload.

---

## Known Quirks / Things to Watch
- The preview dev server (`meat-price-scout` in `.claude/launch.json`) sometimes conflicts with an existing `next dev` process on port 3000 — kill the existing PID with PowerShell `Stop-Process` before restarting
- Tavily free tier = 1,000 searches/month; `searchDepth: 'advanced'` uses more credits than `'basic'`
- The `---PRICES---` parser in `PriceCard.tsx` is fuzzy by design — it splits on `|` and filters empty rows, so minor Claude formatting deviations degrade gracefully
