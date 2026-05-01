'use client';

import { useState, useEffect } from 'react';

interface Props {
  location: string | null;
  onLocationChange: (loc: string) => void;
}

const PinIcon = () => (
  <svg className="w-3 h-3 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
      clipRule="evenodd"
    />
  </svg>
);

export default function LocationInput({ location, onLocationChange }: Props) {
  const [editing, setEditing] = useState(!location);
  const [draft, setDraft] = useState(location ?? '');

  useEffect(() => {
    if (location) {
      setEditing(false);
      setDraft(location);
    }
  }, [location]);

  if (!editing && location) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <PinIcon />
        <span className="text-zinc-300 font-medium">{location}</span>
        <span className="text-zinc-600">·</span>
        <button
          onClick={() => setEditing(true)}
          className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors"
        >
          change location
        </button>
      </div>
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
      <PinIcon />
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Enter zip code or city for local prices..."
        className="flex-1 min-w-0 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm
                   text-zinc-100 placeholder-zinc-500 outline-none focus:border-red-600 transition-colors"
      />
      <button
        type="submit"
        className="bg-red-700 hover:bg-red-600 text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors shrink-0"
      >
        Set
      </button>
    </form>
  );
}
