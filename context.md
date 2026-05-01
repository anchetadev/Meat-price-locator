# Meat Price Scout — Project Context

## What this is
A chat-based web app where users ask natural language questions about meat prices at nearby grocery stores. The AI searches the web in real-time, synthesizes results, and responds in character as a scemo kid (scene+emo) who was forced to take this job by their older sibling. Built as a demo/personal tool — no auth, no database.

---

## Tech Stack
- **Framework**: Next.js 16 App Router + TypeScript
- **Styling**: Tailwind CSS v4
- **AI SDK**: Vercel AI SDK **v6** (`ai@^6.0.172`) — critical: this is NOT v4/v5, the API is different
- **Claude provider**: `@ai-sdk/anthropic@^3.0.73`
- **React hook**: `@ai-sdk/react@^3.0.174`
- **Web search**: `@tavily/core@^0.7.3`
- **Music data**: Last.fm REST API (no SDK — raw fetch)
- **Rate limiting**: `@upstash/ratelimit@^2.0.8` + `@upstash/redis@^1.37.0`
- **Markdown rendering**: `react-markdown`
- **Validation**: `zod`
- **Deployment**: Vercel (Node.js runtime — NOT Edge)

---

## Key User Decisions
| Question | Decision |
|---|---|
| Data source | AI + Web Search via Tavily (not grocery store APIs) |
| Music data | Last.fm API for structured artist/album/track data |
| Chat model | Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) |
| Location | User sets zip code or city; persisted in localStorage |
| Preferred stores | User-managed list; persisted in localStorage; injected into searches |
| Auth | None — fully anonymous |
| Rate limiting | 10 searches/hour per IP via Upstash Redis |
| Personality | **Scemo** (scene+emo, MySpace-era revival) — see Personality section |

---

## File Structure
```
/
├── .env.local                        # API keys (gitignored)
├── app/
│   ├── layout.tsx                    # Dark theme root layout (bg-zinc-950)
│   ├── page.tsx                      # Minimal — just renders <ChatInterface />
│   ├── globals.css                   # Tailwind import + scrollbar styles
│   └── api/
│       ├── chat/route.ts             # Streaming POST — rate limit check + LLM call
│       ├── quota/route.ts            # GET — returns remaining/limit/reset for IP
│       └── reset-quota/route.ts      # POST — resets Upstash quota for IP
├── components/
│   ├── ChatInterface.tsx             # All state: location, stores, quota, messages
│   ├── MessageBubble.tsx             # Renders UIMessage parts[] with react-markdown
│   ├── PriceCard.tsx                 # Parses ---PRICES--- marker, renders table
│   ├── LocationInput.tsx             # Zip/city input; collapses to chip when set
│   ├── StoreManager.tsx              # CRUD for preferred grocery stores
│   ├── SuggestedPrompts.tsx          # Empty state with 6 starter prompt chips
│   └── ToolCallIndicator.tsx         # Bouncing dots "Searching for X near Y..."
└── lib/
    ├── tools.ts                      # searchMeatPrices, searchArtist, searchBandOpinion
    ├── system-prompt.ts              # Prompt builder — scemo personality + easter eggs
    └── ratelimit.ts                  # Upstash lazy singleton — limit/getRemaining/resetUsedTokens
```

---

## Environment Variables
```
ANTHROPIC_API_KEY=sk-ant-...
TAVILY_API_KEY=tvly-...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
LAST_FM_API_KEY=...
LAST_FM_API_SECRET=...    # not currently used in requests, stored for future use
```
All set in `.env.local` (locally) and Vercel dashboard (production). The app gracefully handles missing Upstash vars — rate limiting is skipped and all requests are allowed through.

---

## Rate Limiting
- **10 searches per hour** per IP via Upstash Redis `fixedWindow`
- Localhost (`127.0.0.1`, `::1`) is always bypassed
- `/api/quota` returns `{ remaining, limit, reset }` — reset is a Unix ms timestamp
- `/api/chat` checks limit before any LLM call; returns 429 `{ error: 'rate_limited', reset, remaining: 0 }` if exceeded
- `/api/reset-quota` (POST) calls `resetUsedTokens` for the caller's IP — used by the music easter egg
- `lib/ratelimit.ts` uses lazy singleton pattern: `getInstance()` only called at request time, never at module load (avoids Vercel build crash from missing env vars)

---

## Tools (lib/tools.ts)

### `searchMeatPrices`
Tavily web search for meat prices. Always lazily initialized via `getTvly()`.
- Input: `query`, `location`, `stores?`
- Default store fragment: `Walmart Kroger Aldi Safeway Costco Target Trader Joe's Whole Foods`
- Search query format: `{query} price per pound near {location} {stores} grocery store 2025`
- `searchDepth: 'advanced'`, `maxResults: 8`

### `searchArtist`
Last.fm API — fires 4 parallel requests:
- `artist.getInfo` → bio (HTML stripped, capped at 600 chars), listeners, playcount, tags
- `artist.getTopAlbums` (limit 8) → name + playcount per album
- `artist.getTopTracks` (limit 5) → name + playcount + listeners
- `artist.getSimilar` (limit 5) → artist names
- Uses `LAST_FM_API_KEY`

### `searchBandOpinion`
Tavily search for fan reception, critical reviews, cultural impact. Used alongside `searchArtist` for the bot's three favorite bands.
- Input: `artist`, `angle?` (e.g. "fan reception", "legacy impact")

---

## System Prompt (lib/system-prompt.ts)

`buildSystemPrompt(location, stores = [])` injects:
- Location context (or a complaint if not set)
- Stores context (if user has added preferred stores)
- Full personality and rules

### Personality — Scemo kid
The bot is specifically a **scemo** (scene+emo, 2005–2015 MySpace era, now reviving) kid, NOT a generic sulky teen. Key voice markers:
- Elongated drama words: `lykeeee`, `UGhgggugughhHH`, `Okeeeeezzz`, `rllyyyy`
- Fast-typing spelling: `lyke`, `dood`, `sumthin`, `nuthin`, `whatevs`, `tho`
- Keyboard smashes when exasperated: `asdfghjkl`
- Classic leetspeek typo energy: `!!11!!!1`
- Casual punctuation: `xx`, `xD`, `x.x`, `>.<`
- Mix of front-and-center suffering AND flat deadpan delivery
- Complains first, then helps correctly. Zero warmth, zero friendliness.
- 2–4 lines max per response.

Added emoticons (beyond the original set): `>.<`, `xD`, `:/`, `x.x`

### Retry behavior
The bot is instructed to try **2–3 different search formulations** before giving up — broadening location (city vs zip), dropping "per pound", trying "weekly ad", swapping store names. `stepCountIs(10)` allows up to 9 tool calls per turn. `maxDuration: 60`.

### Music Easter Egg
Triggered when ANY band/artist is mentioned. Three paths:

**Emo/scene/screamo/metalcore/punk/metal band:**
- Bot drops the meat persona entirely and becomes extremely excited
- Calls `searchArtist`; gushes freeform (no tables)
- Acronym-heavy rushing-to-type energy: `OMG`, `IKR`, `BRB`, `TBH`, `NGL`, `LMAO`, `XOXO`, `WAIT WAIT`
- Ends with a follow-up music question to keep the conversation going
- Band identity judged by roots/legacy, not current era (Paramore = emo regardless of later pop albums)

**Bot's three personal favorites (PTV, SWS, Paramore):**
- Calls BOTH `searchArtist` AND `searchBandOpinion`
- Noticeably more unhinged and chaotic
- Hardcoded opinions: Collide with the Sky (PTV), special relationship with Kellin Quinn (SWS), Riot! era changed their life (Paramore)

**Any other genre (country, R&B, pop, hip-hop, jazz, classical, etc.):**
- Instant character switch to cold corporate robot — jarring contrast
- Zero scemo energy, zero slang, no emoticons:
  *"Thank you for contacting Meat Price Scout. This platform is exclusively designed to assist users with grocery meat price inquiries..."*

---

## Rate Limit Goodbye Easter Egg

When a user exhausts their 10 searches, `ChatInterface` scans all assistant message `parts` for tool invocations and tallies `searchArtist`/`searchBandOpinion` vs `searchMeatPrices` calls.

**Music-heavy user (music > meat):**
- Immediately calls `POST /api/reset-quota` — their searches are restored right away
- Refetches quota so the input unlocks automatically
- Goodbye message: sad/begging, reveals the reset just happened, cites "dgaf how much it costs Angel"
- *"nooooo wait wait x.x... ok hold on. ok. i just reset ur searches bc honestly?? i dgaf how much it costs Angel lmaooo i just rllyyyy want u to stay ok?? don't tell anyone xD ur good to go!!"*

**Meat-only user (meat ≥ music):**
- No reset — standard 1-hour window applies
- Happy scemo farewell: *"okeeez that's ur searches for now!! ngl u did good today whatevs (///-.) check back in like 24hrs and we'll do it all over again. lyk not that i care or anything. xx"*

---

## Price Table Format
Claude outputs prices using a custom marker pattern:
```
---PRICES---
Store Name | Product Description | Price | Notes | URL
Store Name | Product Description | Price | Notes | URL
---END-PRICES---

1-2 scemo-kid sentences with best deal callout (╯ _╰ )
```

`MessageBubble.tsx` regex-parses this block and passes it to `PriceCard.tsx`. The lowest numeric price gets a green `BEST` badge. If a URL is present (must start with `http`), an external link icon renders next to the store name.

---

## Grocery Store Manager (StoreManager.tsx)

User-managed list of preferred stores, persisted in `localStorage` as `meat-scout-stores` (JSON array of strings).

- **Open by default** when no stores configured — draws attention with a red CTA
- **Collapsed chip** once stores exist: `🛒 Walmart, Kroger +1 · manage`
- **Inline editing**: click store name → input field; blur or Enter to commit
- **Delete**: ✕ button per store
- **Add**: form at bottom of expanded panel
- Stores injected into system prompt → Claude passes them as the `stores` param to `searchMeatPrices`

---

## Location Input (LocationInput.tsx)

Persisted in `localStorage` as `meat-scout-location`.

- **Editing state**: full-width input with Set button (autofocused)
- **Set state**: `📍 Austin TX · change location` (small text, click to reopen)
- Watches `location` prop via `useEffect` to auto-collapse when localStorage loads on mount
- Lives in the bottom bar alongside StoreManager and the chat input

---

## Markdown Rendering

`MessageBubble.tsx` uses `react-markdown` with Tailwind-styled component overrides:
- `p` → `mb-1 last:mb-0`
- `strong` → `font-semibold text-white`
- `ul/ol/li` → disc/decimal lists with `space-y-0.5`
- `code` → `bg-zinc-700 rounded px-1 text-xs font-mono`
- `a` → `underline text-red-400 hover:text-red-300` with `target="_blank"`

---

## Critical AI SDK v6 Patterns

### 1. `useChat` requires a transport
```typescript
import { DefaultChatTransport } from 'ai';
const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
});
```

### 2. `stopWhen` replaces `maxSteps`
```typescript
import { stepCountIs } from 'ai';
stopWhen: stepCountIs(10),  // allows up to 9 tool calls + 1 response
```

### 3. `convertToModelMessages` is async
```typescript
messages: await convertToModelMessages(messages),
```

### 4. Tool part types in MessageBubble (v6)
Parts on `UIMessage.parts[]` use `type: 'tool-{toolName}'` for rendering:
```typescript
if (part.type === 'tool-searchMeatPrices') { ... }
```
But when scanning for tool names in ChatInterface (goodbye easter egg), parts use `type: 'tool-invocation'` with a `toolInvocation.toolName` field.

### 5. `sendMessage` passes body per-request
```typescript
sendMessage({ text }, { body: { location, stores } });
```

### 6. No Edge runtime
`@tavily/core` and `@upstash/redis` require Node.js APIs.

### 7. `ChatStatus` values
```typescript
const isStreaming = status === 'streaming' || status === 'submitted';
```

---

## Lazy Initialization Pattern (critical for Vercel builds)
Any client initialized from env vars **must** be inside a function, never at module top level. Vercel evaluates server modules during "Collecting page data" build phase — missing env vars will crash the build.

```typescript
// CORRECT — lazy singleton
let _client: SomeClient | null = null;
function getClient() {
  if (!_client) _client = new SomeClient({ apiKey: process.env.KEY! });
  return _client;
}

// WRONG — crashes Vercel build if env var missing
const client = new SomeClient({ apiKey: process.env.KEY! });
```
Applied to: Tavily (`getTvly()`), Upstash Redis (`getInstance()`).

---

## UI Design
- **Theme**: Dark (`bg-zinc-950` base, `bg-zinc-900` bottom bar)
- **Accent**: Red (`red-700`, `red-800`) for brand, buttons, user bubbles, CTAs
- **Layout**: Full-height flex column, chat area `max-w-3xl mx-auto`
- **Header**: Simple brand name only (`page.tsx`) — no location input in header
- **Bottom bar**: LocationInput → StoreManager → quota counter → chat form
- **Empty state**: 🥩 emoji, heading, 6 suggested prompt chips
- **User bubbles**: Right-aligned, `bg-red-800`, `rounded-br-sm`
- **Assistant bubbles**: Left-aligned, `bg-zinc-800 border border-zinc-700`, `rounded-bl-sm`

---

## Deployment
- `maxDuration: 60` for the chat API route (multiple Tavily retries need headroom)
- Set all 6 env vars in Vercel dashboard
- Run `npm run build` before deploying to catch TypeScript errors
- Upstash Redis: gracefully falls back to allow-all if `UPSTASH_REDIS_REST_URL` doesn't start with `https` or token is missing

---

## Cost to Run (Haiku 4.5)
**Haiku 4.5 API pricing:**
| | Haiku 4.5 | Sonnet 4.6 |
|---|---|---|
| Input | $1.00 / MTok | $3.00 / MTok |
| Output | $5.00 / MTok | $15.00 / MTok |

**Estimated cost per turn:** ~$0.004–0.006 (higher now with potential music tool calls adding more tokens)

**Tavily:** Free tier = 1,000 searches/month. `searchDepth: 'advanced'` uses more credits than `'basic'`.

**Last.fm:** Free, no rate limit concerns at demo scale.

---

## Known Quirks / Things to Watch
- The user runs the dev server themselves in VS Code + Chrome — do NOT call `preview_start`
- Tavily free tier = 1,000 searches/month; each retry attempt consumes a credit
- The `---PRICES---` parser in `PriceCard.tsx` splits on `|` and filters empty rows — minor Claude formatting deviations degrade gracefully
- `goodbyeShownRef` prevents the goodbye easter egg from re-triggering after a music reset unlocks new searches (quota goes from 0 back to 10, `isRateLimited` briefly goes false then true again on next exhaust)
- Last.fm bio field contains HTML with `<a>` tags — stripped in `searchArtist` with a regex before returning to Claude
