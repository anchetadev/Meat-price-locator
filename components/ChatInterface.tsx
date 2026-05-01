'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import MessageBubble from './MessageBubble';
import SuggestedPrompts from './SuggestedPrompts';

interface Props {
  location: string | null;
}

interface Quota {
  remaining: number;
  limit: number;
  reset: number | null;
}

export default function ChatInterface({ location }: Props) {
  const [input, setInput] = useState('');
  const [quota, setQuota] = useState<Quota | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
  });

  const isStreaming = status === 'streaming' || status === 'submitted';
  const isEmpty = messages.length === 0;
  const isRateLimited = quota !== null && quota.remaining <= 0;

  const handleSend = (text: string) => {
    if (!text.trim() || isStreaming || isRateLimited) return;
    if (quota) setQuota((q) => (q ? { ...q, remaining: Math.max(0, q.remaining - 1) } : q));
    sendMessage({ text }, { body: { location } });
    setInput('');
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-6 space-y-3 sm:space-y-4">
        {isEmpty ? (
          <SuggestedPrompts onSelect={handleSend} location={location} />
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-zinc-800 bg-zinc-900 px-3 sm:px-4 py-2.5 sm:py-3">
        {!location && (
          <p className="text-amber-400 text-xs mb-2 text-center">
            Set your location above for accurate local prices
          </p>
        )}

        {quota !== null && (
          <p className={`text-xs mb-2 text-center ${isRateLimited ? 'text-red-400' : 'text-zinc-500'}`}>
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
