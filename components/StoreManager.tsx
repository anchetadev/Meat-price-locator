'use client';

import { useState, useRef, useEffect } from 'react';

interface Props {
  stores: string[];
  open: boolean;
  onToggle: () => void;
  onAdd: (store: string) => void;
  onUpdate: (oldStore: string, newStore: string) => void;
  onRemove: (store: string) => void;
}

function StoreChip({
  store,
  onUpdate,
  onRemove,
}: {
  store: string;
  onUpdate: (s: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(store);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== store) onUpdate(trimmed);
    setEditing(false);
  };

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          commit();
        }}
        className="inline-flex items-center"
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
          className="bg-zinc-700 border border-red-600 rounded-l px-2 py-0.5 text-xs text-zinc-100 outline-none w-28"
        />
        <button
          type="button"
          onClick={onRemove}
          className="bg-zinc-700 border border-l-0 border-red-600 rounded-r px-1.5 py-0.5 text-zinc-400 hover:text-red-400 text-xs transition-colors"
        >
          ✕
        </button>
      </form>
    );
  }

  return (
    <span className="inline-flex items-center bg-zinc-800 border border-zinc-700 rounded text-xs">
      <button
        onClick={() => setEditing(true)}
        className="px-2 py-0.5 text-zinc-300 hover:text-white transition-colors"
      >
        {store}
      </button>
      <button
        onClick={onRemove}
        className="px-1.5 py-0.5 text-zinc-600 hover:text-red-400 border-l border-zinc-700 transition-colors"
      >
        ✕
      </button>
    </span>
  );
}

export default function StoreManager({ stores, open, onToggle, onAdd, onUpdate, onRemove }: Props) {
  const [newStore, setNewStore] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && stores.length === 0) addInputRef.current?.focus();
  }, [open, stores.length]);

  const handleAdd = () => {
    const trimmed = newStore.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewStore('');
    addInputRef.current?.focus();
  };

  const preview =
    stores.length === 0
      ? null
      : stores.slice(0, 2).join(', ') + (stores.length > 2 ? ` +${stores.length - 2}` : '');

  return (
    <div>
      {/* Trigger row */}
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-zinc-500">🛒</span>
        {stores.length === 0 ? (
          <button
            onClick={onToggle}
            className="text-red-400 hover:text-red-300 transition-colors font-medium"
          >
            {open ? 'hide store manager' : 'Add your stores for better results'}
          </button>
        ) : (
          <>
            <span className="text-zinc-300 font-medium truncate max-w-[180px]">{preview}</span>
            <span className="text-zinc-600">·</span>
            <button
              onClick={onToggle}
              className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors"
            >
              {open ? 'hide' : 'manage'}
            </button>
          </>
        )}
      </div>

      {/* Expanded panel */}
      {open && (
        <div className="mt-2 bg-zinc-800/60 border border-zinc-700 rounded-xl px-3 py-2.5 space-y-2">
          {stores.length === 0 && (
            <p className="text-xs text-zinc-500">
              Add stores you shop at — we'll search them first.
            </p>
          )}

          {stores.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {stores.map((store) => (
                <StoreChip
                  key={store}
                  store={store}
                  onUpdate={(newName) => onUpdate(store, newName)}
                  onRemove={() => onRemove(store)}
                />
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAdd();
            }}
            className="flex gap-1.5"
          >
            <input
              ref={addInputRef}
              value={newStore}
              onChange={(e) => setNewStore(e.target.value)}
              placeholder="Add a store (e.g. Sprouts, WinCo)"
              className="flex-1 min-w-0 bg-zinc-700 border border-zinc-600 rounded-lg px-2.5 py-1 text-xs
                         text-zinc-100 placeholder-zinc-500 outline-none focus:border-red-600 transition-colors"
            />
            <button
              type="submit"
              disabled={!newStore.trim()}
              className="bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed
                         text-white rounded-lg px-2.5 py-1 text-xs font-medium transition-colors shrink-0"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
