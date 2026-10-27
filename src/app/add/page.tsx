"use client";

import { useEffect, useRef, useState } from "react";
import { categoriesFor, type Kind } from "@/lib/categories";
import { currencySymbol, groupTyped } from "@/lib/money";
import { useStore } from "@/lib/store";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"] as const;

export default function AddPage() {
  const add = useStore((s) => s.add);

  // Deep links like /add?kind=income&category=Salary. This page only renders on the
  // client (after sign-in), so reading window here can't cause a hydration mismatch.
  const [query] = useState(() =>
    new URLSearchParams(typeof window === "undefined" ? "" : window.location.search),
  );
  const [kind, setKind] = useState<Kind>(query.get("kind") === "income" ? "income" : "expense");
  const [typed, setTyped] = useState("");
  const [category, setCategory] = useState<string | null>(query.get("category"));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const categories = categoriesFor(kind);
  const chosen = category ?? categories[0].name;
  const canSave = Number(typed) > 0 && !busy;

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  function press(key: (typeof KEYS)[number]) {
    navigator.vibrate?.(5);
    setTyped((prev) => {
      if (key === "⌫") return prev.slice(0, -1);
      if (key === ".") return prev.includes(".") ? prev : prev === "" ? "0." : `${prev}.`;
      if (prev.includes(".") && prev.split(".")[1].length >= 2) return prev; // 2 decimals max
      if (prev.replace(".", "").length >= 9) return prev;
      return prev === "0" ? key : prev + key;
    });
  }

  function showToast(text: string, ok: boolean) {
    clearTimeout(toastTimer.current);
    setToast({ text, ok });
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  async function save() {
    if (!canSave) return;
    setBusy(true);
    const result = await add({ amount: typed, kind, category: chosen, note });
    setBusy(false);
    if (result.ok) {
      showToast(result.message, true);
      setTyped("");
      setNote("");
    } else {
      showToast(result.error, false);
    }
  }

  function switchKind(next: Kind) {
    setKind(next);
    setCategory(null);
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div
          role="status"
          className={`toast-in fixed inset-x-5 top-[max(1rem,env(safe-area-inset-top))] z-20 mx-auto max-w-sm rounded-2xl px-4 py-3 text-center text-sm font-semibold shadow-lg ${
            toast.ok ? "bg-accent text-bg" : "bg-danger text-bg"
          }`}
        >
          {toast.ok ? "✓ " : ""}
          {toast.text}
        </div>
      )}

      <div role="tablist" aria-label="Type" className="grid grid-cols-2 rounded-xl bg-surface p-1 text-sm font-semibold">
        {(["expense", "income"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={kind === k}
            onClick={() => switchKind(k)}
            className={`rounded-lg py-2 capitalize transition ${
              kind === k ? "bg-raised text-ink" : "text-mute"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="py-2 text-center" aria-live="polite">
        <span className="num text-6xl font-semibold tracking-tight">
          <span className="mr-1 text-4xl text-mute">{currencySymbol}</span>
          {typed ? groupTyped(typed) : <span className="text-mute">0</span>}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Category">
        {categories.map((c) => (
          <button
            key={c.name}
            role="radio"
            aria-checked={chosen === c.name}
            onClick={() => setCategory(c.name)}
            className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-sm transition ${
              chosen === c.name
                ? "border-accent bg-accent/10 text-ink"
                : "border-line bg-surface text-mute"
            }`}
          >
            <span aria-hidden>{c.emoji}</span>
            <span className="truncate">{c.name}</span>
          </button>
        ))}
      </div>

      <label className="block">
        <span className="sr-only">Note (optional)</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={120}
          placeholder="Add a note (optional)"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none placeholder:text-mute focus:border-accent"
        />
      </label>

      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            aria-label={k === "⌫" ? "Delete" : k}
            className="num h-14 rounded-xl bg-surface text-2xl font-medium active:bg-raised"
          >
            {k}
          </button>
        ))}
      </div>

      <button
        onClick={save}
        disabled={!canSave}
        className="w-full rounded-2xl bg-accent py-4 text-lg font-semibold text-bg transition active:scale-[0.99] disabled:opacity-35"
      >
        {busy ? "Saving…" : kind === "income" ? "Add income" : "Add expense"}
      </button>
    </div>
  );
}
