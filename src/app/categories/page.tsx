"use client";

import Link from "next/link";
import { useState } from "react";
import {
  EMOJI_CHOICES,
  FALLBACK_CATEGORY,
  MAX_NAME_LENGTH,
  type Category,
  type Kind,
} from "@/lib/categories";
import { useCategories, useStore } from "@/lib/store";

function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  return (
    <div role="group" aria-label="Emoji" className="flex flex-wrap gap-1.5">
      {EMOJI_CHOICES.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onChange(e)}
          aria-pressed={value === e}
          aria-label={`Use ${e}`}
          className={`grid size-9 place-items-center rounded-lg border text-lg ${
            value === e ? "border-accent bg-accent/10" : "border-line bg-bg"
          }`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

function EditRow({ cat, onDone }: { cat: Category; onDone: () => void }) {
  const editCategory = useStore((s) => s.editCategory);
  const [name, setName] = useState(cat.name);
  const [emoji, setEmoji] = useState(cat.emoji);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = cat.name === FALLBACK_CATEGORY;

  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const patch: { name?: string; emoji?: string } = {};
    if (name.trim() !== cat.name) patch.name = name;
    if (emoji !== cat.emoji) patch.emoji = emoji;
    const result = Object.keys(patch).length ? await editCategory(cat.id, patch) : { ok: true as const };
    setBusy(false);
    if (result.ok) onDone();
    else setError(result.error);
  }

  return (
    <div className="space-y-3 rounded-xl border border-accent/40 bg-surface p-3">
      <label className="block">
        <span className="mb-1 block text-xs text-mute">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_NAME_LENGTH}
          disabled={locked}
          className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 outline-none focus:border-accent disabled:opacity-50"
        />
      </label>
      {locked && (
        <p className="text-xs text-mute">
          “{FALLBACK_CATEGORY}” catches anything that doesn’t match, so its name is fixed. You can change the emoji.
        </p>
      )}
      <div>
        <span className="mb-1 block text-xs text-mute">Emoji</span>
        <EmojiPicker value={emoji} onChange={setEmoji} />
      </div>
      {!locked && cat.name !== name.trim() && (
        <p className="text-xs text-mute">Your past “{cat.name}” transactions will be renamed too.</p>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={busy || !name.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg disabled:opacity-40"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button onClick={onDone} className="rounded-lg bg-raised px-4 py-2 text-sm text-mute">
          Cancel
        </button>
      </div>
    </div>
  );
}

function AddForm({ kind }: { kind: Kind }) {
  const addCategory = useStore((s) => s.addCategory);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJI_CHOICES[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !name.trim()) return;
    setBusy(true);
    setError(null);
    const result = await addCategory(kind, name, emoji);
    setBusy(false);
    if (result.ok) setName("");
    else setError(result.error);
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-line bg-surface p-4">
      <h2 className="text-sm font-semibold">New {kind} category</h2>
      <label className="block">
        <span className="sr-only">Category name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_NAME_LENGTH}
          placeholder="e.g. Coffee"
          className="w-full rounded-lg border border-line bg-bg px-3 py-2.5 outline-none placeholder:text-mute focus:border-accent"
        />
      </label>
      <EmojiPicker value={emoji} onChange={setEmoji} />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-bg disabled:opacity-40"
      >
        {busy ? "Adding…" : "Add category"}
      </button>
    </form>
  );
}

export default function CategoriesPage() {
  const [kind, setKind] = useState<Kind>("expense");
  const [editingId, setEditingId] = useState<number | null>(null);
  const categories = useCategories(kind);
  // Before the real list loads we show read-only defaults (negative ids)
  const loaded = categories.every((c) => c.id > 0);

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-2">
        <Link
          href="/add"
          aria-label="Back to Add"
          className="grid size-10 place-items-center rounded-full text-mute active:bg-raised"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Categories</h1>
      </header>

      <div role="tablist" aria-label="Type" className="grid grid-cols-2 rounded-xl bg-surface p-1 text-sm font-semibold">
        {(["expense", "income"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={kind === k}
            onClick={() => {
              setKind(k);
              setEditingId(null);
            }}
            className={`rounded-lg py-2 capitalize transition ${kind === k ? "bg-raised text-ink" : "text-mute"}`}
          >
            {k}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {categories.map((c) => (
          <li key={c.id}>
            {editingId === c.id ? (
              <EditRow cat={c} onDone={() => setEditingId(null)} />
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5">
                <span className="grid size-9 place-items-center rounded-lg bg-raised text-lg" aria-hidden>
                  {c.emoji}
                </span>
                <span className="flex-1 truncate text-sm font-medium">{c.name}</span>
                <button
                  onClick={() => setEditingId(c.id)}
                  disabled={!loaded}
                  aria-label={`Edit ${c.name}`}
                  className="rounded-lg px-3 py-1.5 text-sm font-semibold text-accent active:bg-raised disabled:opacity-40"
                >
                  Edit
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {loaded && <AddForm key={kind} kind={kind} />}
    </div>
  );
}
