import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { neon } from "@neondatabase/serverless";
import { DEFAULTS, type Kind } from "./categories";

/**
 * Tiny database wrapper so the app talks plain SQL to either:
 *  - Neon Postgres (when DATABASE_URL is set; use this in production), or
 *  - PGlite, an in-process Postgres stored in ./.data (zero-setup local dev).
 */
export interface Db {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
}

const SCHEMA = [
  `create table if not exists transactions (
    id serial primary key,
    amount_cents integer not null check (amount_cents > 0),
    kind text not null check (kind in ('expense', 'income')),
    category text not null,
    note text not null default '',
    created_at timestamptz not null default now()
  )`,
  `create index if not exists transactions_created_at_idx on transactions (created_at desc)`,
  `create table if not exists categories (
    id serial primary key,
    kind text not null check (kind in ('expense', 'income')),
    name text not null,
    emoji text not null default '🏷️',
    sort_order integer not null default 0
  )`,
  `create unique index if not exists categories_kind_name_idx on categories (kind, lower(name))`,
];

/** Fill the categories table with the defaults the first time only. */
async function seedCategories(db: Db) {
  const [{ n }] = await db.query<{ n: number }>(`select count(*)::int as n from categories`);
  if (Number(n) > 0) return;
  for (const kind of Object.keys(DEFAULTS) as Kind[]) {
    for (const [i, c] of DEFAULTS[kind].entries()) {
      await db.query(
        `insert into categories (kind, name, emoji, sort_order) values ($1, $2, $3, $4)
         on conflict do nothing`,
        [kind, c.name, c.emoji, i],
      );
    }
  }
}

async function init(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  let db: Db;

  if (url) {
    const sql = neon(url);
    db = {
      query: async <T,>(text: string, params: unknown[] = []) =>
        (await sql.query(text, params)) as unknown as T[],
    };
  } else {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL is not set (required in production).");
    }
    const dir = process.env.PGLITE_DIR ?? ".data/pglite";
    mkdirSync(dirname(dir), { recursive: true });
    const pg = new PGlite(dir);
    await pg.waitReady;
    db = {
      query: async <T,>(text: string, params: unknown[] = []) =>
        (await pg.query(text, params)).rows as T[],
    };
  }

  for (const statement of SCHEMA) await db.query(statement);
  await seedCategories(db);
  return db;
}

// Cache across hot reloads / route modules so we open the database once.
const globalForDb = globalThis as unknown as { __tapmoneyDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  if (!globalForDb.__tapmoneyDb) {
    globalForDb.__tapmoneyDb = init().catch((err) => {
      globalForDb.__tapmoneyDb = undefined; // allow retry on next request
      throw err;
    });
  }
  return globalForDb.__tapmoneyDb;
}
