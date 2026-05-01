'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import LocationInput from '@/components/LocationInput';

export default function Home() {
  const [location, setLocation] = useState<string | null>(null);

  return (
    <main className="flex flex-col h-full bg-zinc-950">
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-red-500">MeatPrice</span>
          <span className="text-zinc-500 text-sm hidden sm:block">AI Grocery Scout</span>
        </div>
        <LocationInput location={location} onLocationChange={setLocation} />
      </header>

      <div className="flex-1 overflow-hidden">
        <ChatInterface location={location} />
      </div>
    </main>
  );
}
