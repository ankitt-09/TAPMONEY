import type { Kind } from "./categories";

export type { Category } from "./categories";

export interface Tx {
  id: number;
  amountCents: number;
  kind: Kind;
  category: string;
  note: string;
  createdAt: string; // ISO timestamp
}

export interface Summary {
  month: string; // YYYY-MM
  expenseCents: number;
  incomeCents: number;
  byCategory: { category: string; totalCents: number; count: number }[]; // expenses only
  daily: { day: string; expenseCents: number }[]; // YYYY-MM-DD, expenses only
}
