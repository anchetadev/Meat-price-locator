'use client';

import { useState } from 'react';

interface Props {
  location: string | null;
  onLocationChange: (loc: string) => void;
}

export default function LocationInput({ location, onLocationChange }: Props) {
  const [editing, setEditing] = useState(!location);
  const [draft, setDraft] = useState(location ?? '');

  if (!editing && location) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-zinc-300 hover:text-white
                   bg-zinc-800 hover:bg-zinc-700 rounded-lg px-2 sm:px-3 py-1.5 transition-colors border border-zinc-700 max-w-[160px] sm:max-w-none"
      >
        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
            clipRule="evenodd"
          />
        </svg>
        <span className="font-medium truncate">{location}</span>
        <span className="text-zinc-500 text-xs shrink-0">change</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = draft.trim();
        if (trimmed) {
          onLocationChange(trimmed);
          setEditing(false);
        }
      }}
      className="flex items-center gap-1.5"
    >
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Zip or city..."
        className="bg-zinc-800 border border-zinc-600 rounded-lg px-2 sm:px-3 py-1.5 text-sm
                   text-zinc-100 placeholder-zinc-500 outline-none focus:border-red-600
                   w-28 sm:w-40"
      />
      <button
        type="submit"
        className="bg-red-700 hover:bg-red-600 text-white rounded-lg px-2.5 sm:px-3 py-1.5 text-sm font-medium transition-colors shrink-0"
      >
        Set
      </button>
    </form>
  );
}
