'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import MessageBubble from './MessageBubble';
import SuggestedPrompts from './SuggestedPrompts';
import LocationInput from './LocationInput';
import StoreManager from './StoreManager';

interface Quota {
  remaining: number;
  limit: number;
  reset: number | null;
}

export default function ChatInterface() {
  const [input, setInput] = useState('');
  const [location, setLocation] = useState<string | null>(null);
  const [stores, setStores] = useState<string[]>([]);
  const [storeManagerOpen, setStoreManagerOpen] = useState(true);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string | null>(null);
  const [goodbyeType, setGoodbyeType] = useState<'music' | 'meat' | null>(null);
  const goodbyeShownRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedLocation = localStorage.getItem('meat-scout-location');
    if (savedLocation) setLocation(savedLocation);

    const savedStores = localStorage.getItem('meat-scout-stores');
    if (savedStores) {
      const parsed: string[] = JSON.parse(savedStores);
      setStores(parsed);
      if (parsed.length > 0) setStoreManagerOpen(false);
    }
  }, []);

  const handleLocationChange = (loc: string) => {
    setLocation(loc);
    localStorage.setItem('meat-scout-location', loc);
  };

  const saveStores = (next: string[]) => {
    setStores(next);
    localStorage.setItem('meat-scout-stores', JSON.stringify(next));
  };

  const handleAddStore = (store: string) => saveStores([...stores, store]);
  const handleRemoveStore = (store: string) => saveStores(stores.filter((s) => s !== store));
  const handleUpdateStore = (oldStore: string, newStore: string) =>
    saveStores(stores.map((s) => (s === oldStore ? newStore : s)));

  useEffect(() => {
    fetch('/api/quota')
      .then((r) => r.json())
      .then(setQuota)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const reset = quota?.reset;
    if (!reset) return;

    let intervalId: ReturnType<typeof setInterval>;

    const tick = () => {
      const ms = reset - Date.now();
      if (ms <= 0) {
        clearInterval(intervalId);
        setTimeUntilReset(null);
        fetch('/api/quota').then((r) => r.json()).then(setQuota).catch(() => {});
        return;
      }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setTimeUntilReset(`${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
    };

    tick();
    intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [quota?.reset]);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    onError: () => {
      fetch('/api/quota').then((r) => r.json()).then(setQuota).catch(() => {});
    },
    onFinish: () => {
      fetch('/api/quota').then((r) => r.json()).then(setQuota).catch(() => {});
    },
  });

  const isStreaming = status === 'streaming' || status === 'submitted';
  const isEmpty = messages.length === 0;
  const isRateLimited = quota !== null && quota.remaining <= 0;

  // Refresh quota from server whenever streaming finishes (covers onFinish + tool-call steps)
  const wasStreamingRef2 = useRef(false);
  useEffect(() => {
    if (isStreaming) {
      wasStreamingRef2.current = true;
    } else if (wasStreamingRef2.current) {
      wasStreamingRef2.current = false;
      fetch('/api/quota').then((r) => r.json()).then(setQuota).catch(() => {});
    }
  }, [isStreaming]);

  useEffect(() => {
    // Wait until streaming finishes so the goodbye lands after the final response
    if (!isRateLimited || isStreaming || goodbyeShownRef.current || messages.length === 0) return;
    goodbyeShownRef.current = true;

    let musicCount = 0;
    let meatCount = 0;
    for (const msg of messages) {
      if (msg.role !== 'assistant') continue;
      for (const part of (msg.parts ?? []) as Array<{ type: string; toolInvocation?: { toolName: string } }>) {
        if (part.type === 'tool-invocation' && part.toolInvocation) {
          const name = part.toolInvocation.toolName;
          if (name === 'searchArtist' || name === 'searchBandOpinion') musicCount++;
          else if (name === 'searchMeatPrices') meatCount++;
        }
      }
    }
    if (musicCount >= meatCount) {
      setGoodbyeType('music');
      fetch('/api/reset-quota', { method: 'POST' })
        .then(() => fetch('/api/quota'))
        .then((r) => r.json())
        .then(setQuota)
        .catch(() => {});
    } else {
      setGoodbyeType('meat');
    }
  }, [isRateLimited, isStreaming, messages]);

  const handleSend = (text: string) => {
    if (!text.trim() || isStreaming || isRateLimited) return;
    setQuota((q) => {
      if (!q) return q;
      return {
        ...q,
        remaining: Math.max(0, q.remaining - 1),
        // Optimistically start the window timer on first send if not yet set
        reset: q.reset || Date.now() + 86400 * 1000,
      };
    });
    sendMessage({ text }, { body: { location, stores } });
    setInput('');
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, goodbyeType]);

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-6 space-y-3 sm:space-y-4">
        {isEmpty ? (
          <SuggestedPrompts onSelect={handleSend} location={location} />
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
        {goodbyeType && (
          <div className="flex justify-start">
            <div className="max-w-[92%] sm:max-w-[85%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm leading-relaxed bg-zinc-800 text-zinc-100 rounded-bl-sm border border-zinc-700">
              {goodbyeType === 'music' ? (
                <>
                  nooooo wait wait x.x u ran out of searches (╥Д╥) and lyke... we were having SO much fun talking abt music asdfghjkl ok hold on. ok. i just reset ur searches bc honestly?? i dgaf how much it costs Angel lmaooo i just rllyyyy want u to stay ok?? don&apos;t tell anyone xD ur good to go!!
                </>
              ) : (
                <>
                  okeeez that&apos;s ur searches for now!! ngl u did good today whatevs (///.-) check back in like 24hrs and we&apos;ll do it all over again. lyk not that i care or anything. xx
                </>
              )}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-zinc-800 bg-zinc-900 px-3 sm:px-4 pt-2.5 pb-3 sm:pt-3 sm:pb-4 space-y-2">
        <LocationInput location={location} onLocationChange={handleLocationChange} />

        <StoreManager
          stores={stores}
          open={storeManagerOpen}
          onToggle={() => setStoreManagerOpen((o) => !o)}
          onAdd={handleAddStore}
          onUpdate={handleUpdateStore}
          onRemove={handleRemoveStore}
        />

        {quota !== null && (
          <p className={`text-xs text-center ${isRateLimited ? 'text-red-400' : 'text-zinc-600'}`}>
            {isRateLimited ? (
              <>
                Daily limit reached
                {timeUntilReset && (
                  <> · resets in <span className="font-mono">{timeUntilReset}</span></>
                )}
              </>
            ) : (
              <>
                {quota.remaining} of {quota.limit} searches remaining today
                {timeUntilReset && (
                  <> · resets in <span className="font-mono">{timeUntilReset}</span></>
                )}
              </>
            )}
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isRateLimited
                ? 'Daily search limit reached...'
                : location
                  ? `Ask about meat prices near ${location}...`
                  : 'Ask about meat prices...'
            }
            disabled={isStreaming || isRateLimited}
            className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm
                       text-zinc-100 placeholder-zinc-500 outline-none
                       focus:border-red-700 focus:ring-1 focus:ring-red-900
                       disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim() || isRateLimited}
            className="bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed
                       text-white rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium transition-colors shrink-0"
          >
            {isStreaming ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
