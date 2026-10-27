"use client";

import { create } from "zustand";
import type { Kind } from "./categories";
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
}

let requestCounter = 0; // ignore out-of-order responses when the month changes quickly

export const useStore = create<State>((set, get) => ({
  authed: null,
  month: monthKey(new Date()),
  txs: [],
  summary: null,
  loading: false,
  error: null,

  async checkSession() {
    try {
      const res = await fetch("/api/session", { cache: "no-store" });
      const data = await res.json();
      set({ authed: Boolean(data.authed) });
    } catch {
      set({ authed: false, error: "Can't reach the server." });
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
    set({ authed: true });
    return null;
  },

  async logout() {
    await fetch("/api/logout", { method: "POST" }).catch(() => null);
    set({ authed: false, txs: [], summary: null });
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
        set({ authed: false });
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
        set({ authed: false });
        return { ok: false, error: "Please sign in again." };
      }
      if (!res.ok) return { ok: false, error: data.error ?? "Couldn't save." };
      void get().refresh();
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
}));
