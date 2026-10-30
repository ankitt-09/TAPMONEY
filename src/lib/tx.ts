import type { Kind } from "./categories";
import type { Tx } from "./types";

export interface TxRow {
  id: number;
  amount_cents: number;
  kind: Kind;
  category: string;
  note: string;
  created_at: string | Date;
}

export const toTx = (r: TxRow): Tx => ({
  id: Number(r.id),
  amountCents: Number(r.amount_cents),
  kind: r.kind,
  category: r.category,
  note: r.note,
  createdAt: new Date(r.created_at).toISOString(),
});
