"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { defaultCategories, lookupEmoji, type Category, type Kind } from "./categories";
import { monthKey, shiftMonth } from "./dates";
import type { Summary, Tx } from "./types";

export interface NewTx {
  amount: string;
  kind: Kind;
  category: string;
  note: string;
}

interface State {
  authed: boolean | null; // null = still checking
  month: string;
  txs: Tx[];
  summary: Summary | null;
  categories: Category[];
  loading: boolean;
  error: string | null;

  checkSession: () => Promise<void>;
  login: (passcode: string) => Promise<string | null>; // returns an error message, or null on success
  logout: () => Promise<void>;
  setMonth: (month: string) => void;
  shift: (delta: number) => void;
  refresh: () => Promise<void>;
  add: (tx: NewTx) => Promise<{ ok: true; message: string } | { ok: false; error: string }>;
  remove: (id: number) => Promise<void>;
  loadCategories: () => Promise<void>;
  addCategory: (kind: Kind, name: string, emoji: string) => Promise<Result>;
  editCategory: (id: number, patch: { name?: string; emoji?: string }) => Promise<Result>;
}

type Result = { ok: true } | { ok: false; error: string };

// Small things remembered on this device so the app can open instantly:
//  - a hint that this device was signed in (the server still confirms it right after)
//  - the last category list (so your chips don't flash the defaults first)
const HINT_KEY = "tm_authed";
const CATS_KEY = "tm_cats";

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // private mode / blocked storage: just skip the shortcut
  }
}

function writeLocal(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function isCategory(c: unknown): c is Category {
  const x = c as Partial<Category> | null;
  return (
    !!x &&
    typeof x.id === "number" &&
    (x.kind === "expense" || x.kind === "income") &&
    typeof x.name === "string" &&
    typeof x.emoji === "string"
  );
}

function readCachedCategories(): Category[] {
  try {
    const parsed = JSON.parse(readLocal(CATS_KEY) ?? "null");
    return Array.isArray(parsed) ? parsed.filter(isCategory) : [];
  } catch {
    return [];
  }
}

/** The server said we're not signed in (or we signed out). */
function dropSession() {
  writeLocal(HINT_KEY, null);
  useStore.setState({ authed: false });
}

let requestCounter = 0; // ignore out-of-order responses when the month changes quickly

export const useStore = create<State>((set, get) => ({
  authed: null,
  month: monthKey(new Date()),
  txs: [],
  summary: null,
  categories: [],
  loading: false,
  error: null,

  async checkSession() {
    // Instant start: if this device was signed in before, show the app straight away
    // and confirm with the server in the background (it signs you out if it disagrees).
    const hinted = readLocal(HINT_KEY) === "1";
    if (get().authed === null && hinted) {
      const cached = readCachedCategories();
      set({ authed: true, ...(cached.length ? { categories: cached } : {}) });
    }
    try {
      const res = await fetch("/api/session", { cache: "no-store" });
      const data = await res.json();
      const authed = Boolean(data.authed);
      writeLocal(HINT_KEY, authed ? "1" : null);
      set({ authed });
    } catch {
      // Offline or server hiccup: keep showing the app if we already were.
      set({ authed: get().authed ?? false, error: "Can't reach the server." });
    }
  },

  async login(passcode) {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    }).catch(() => null);
    if (!res) return "Can't reach the server.";
    if (!res.ok) return res.status === 401 ? "Wrong passcode." : "Something went wrong.";
    writeLocal(HINT_KEY, "1");
    set({ authed: true });
    return null;
  },

  async logout() {
    await fetch("/api/logout", { method: "POST" }).catch(() => null);
    writeLocal(HINT_KEY, null);
    writeLocal(CATS_KEY, null);
    set({ authed: false, txs: [], summary: null, categories: [] });
  },

  setMonth: (month) => {
    set({ month });
    void get().refresh();
  },
  shift: (delta) => get().setMonth(shiftMonth(get().month, delta)),

  async refresh() {
    const id = ++requestCounter;
    const { month } = get();
    set({ loading: true, error: null });
    try {
      const [txRes, sumRes] = await Promise.all([
        fetch(`/api/transactions?month=${month}`, { cache: "no-store" }),
        fetch(`/api/summary?month=${month}`, { cache: "no-store" }),
      ]);
      if (txRes.status === 401 || sumRes.status === 401) {
        dropSession();
        return;
      }
      if (!txRes.ok || !sumRes.ok) throw new Error("Failed to load data.");
      const [{ transactions }, summary] = await Promise.all([txRes.json(), sumRes.json()]);
      if (id === requestCounter) set({ txs: transactions, summary, loading: false });
    } catch (e) {
      if (id === requestCounter) {
        set({ loading: false, error: e instanceof Error ? e.message : "Failed to load data." });
      }
    }
  },

  async add(tx) {
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tx),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        dropSession();
        return { ok: false, error: "Please sign in again." };
      }
      if (!res.ok) return { ok: false, error: data.error ?? "Couldn't save." };
      // No refresh here: Home and History reload themselves when you open them.
      return { ok: true, message: data.message as string };
    } catch {
      return { ok: false, error: "No connection. Try again." };
    }
  },

  async remove(id) {
    const previous = get().txs;
    set({ txs: previous.filter((t) => t.id !== id) }); // optimistic
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) set({ txs: previous, error: "Couldn't delete. Try again." });
    void get().refresh();
  },

  async loadCategories() {
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      if (res.status === 401) return dropSession();
      if (!res.ok) return;
      const { categories } = await res.json();
      writeLocal(CATS_KEY, JSON.stringify(categories));
      set({ categories });
    } catch {
      /* keep whatever we have; defaults are used until this succeeds */
    }
  },

  async addCategory(kind, name, emoji) {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, name, emoji }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data.error ?? "Couldn't add category." };
      await get().loadCategories();
      return { ok: true };
    } catch {
      return { ok: false, error: "No connection. Try again." };
    }
  },

  async editCategory(id, patch) {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data.error ?? "Couldn't save changes." };
      await get().loadCategories();
      if (patch.name !== undefined) void get().refresh(); // past transactions were renamed too
      return { ok: true };
    } catch {
      return { ok: false, error: "No connection. Try again." };
    }
  },
}));

/** Categories for one kind. Shows the built-in defaults until the real list has loaded. */
export function useCategories(kind: Kind): Category[] {
  const all = useStore((s) => s.categories);
  return useMemo(() => {
    const mine = all.filter((c) => c.kind === kind);
    return mine.length > 0 ? mine : defaultCategories(kind);
  }, [all, kind]);
}

/** Returns a function that finds the emoji for a category name. */
export function useEmojiFor(): (kind: Kind, name: string) => string {
  const all = useStore((s) => s.categories);
  return useMemo(() => (kind, name) => lookupEmoji(all, kind, name), [all]);
}
