'use client';

import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  return (
    <main className="flex flex-col h-full bg-zinc-950">
      <header className="flex items-center px-4 py-3 border-b border-zinc-800 bg-zinc-900 shrink-0">
        <span className="text-xl font-bold text-red-500">MeatPrice</span>
        <span className="text-zinc-500 text-sm ml-2 hidden sm:block">AI Grocery Scout</span>
      </header>

      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </main>
  );
}
