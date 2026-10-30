"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

export function Login() {
  const login = useStore((s) => s.login);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode || busy) return;
    setBusy(true);
    setError(await login(passcode));
    setBusy(false);
  }

  return (
    <div className="mx-auto grid min-h-dvh max-w-sm place-items-center px-6">
      <form onSubmit={submit} className="w-full space-y-5">
        <div>
          <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-accent/15 text-accent">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <circle cx="12" cy="12" r="8" opacity="0.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">TapMoney</h1>
          <p className="mt-1 text-sm text-mute">Enter your passcode to open your money.</p>
        </div>

        <label className="block">
          <span className="sr-only">Passcode</span>
          <input
            type="password"
            autoComplete="current-password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Passcode"
            className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 outline-none focus:border-accent"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        {process.env.NODE_ENV !== "production" && (
          <p className="text-xs text-mute">Dev mode: the default passcode is 1234.</p>
        )}

        <button
          type="submit"
          disabled={!passcode || busy}
          className="w-full rounded-xl bg-accent py-3.5 font-semibold text-bg transition active:scale-[0.99] disabled:opacity-40"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
