export type Kind = "expense" | "income";

export interface Category {
  id: number;
  kind: Kind;
  name: string;
  emoji: string;
}

/** The catch-all bucket. Unknown names from the Shortcut land here, so it can't be renamed. */
export const FALLBACK_CATEGORY = "Other";
export const DEFAULT_EMOJI = "🏷️";
export const MAX_NAME_LENGTH = 24;
export const MAX_CATEGORIES_PER_KIND = 40;

/** Used to seed the database the first time, and shown instantly before the real list loads. */
export const DEFAULTS: Record<Kind, { name: string; emoji: string }[]> = {
  expense: [
    { name: "Food", emoji: "🍔" },
    { name: "Transport", emoji: "🚕" },
    { name: "Groceries", emoji: "🛒" },
    { name: "Shopping", emoji: "🛍️" },
    { name: "Bills", emoji: "💡" },
    { name: "Fun", emoji: "🎬" },
    { name: "Health", emoji: "💊" },
    { name: "Education", emoji: "📚" },
    { name: "Other", emoji: "✨" },
  ],
  income: [
    { name: "Pocket money", emoji: "👪" },
    { name: "Salary", emoji: "💼" },
    { name: "Freelance", emoji: "💻" },
    { name: "Gift", emoji: "🎁" },
    { name: "Other", emoji: "✨" },
  ],
};

export const EMOJI_CHOICES = [
  "🍔", "☕", "🚕", "🛒", "🛍️", "💡", "🎬", "🎮", "💊", "📚",
  "🏠", "✈️", "🎁", "💼", "💻", "📱", "🐶", "🏋️", "🧾", "💰",
];

export const defaultCategories = (kind: Kind): Category[] =>
  DEFAULTS[kind].map((c, i) => ({ id: -(i + 1), kind, ...c }));

/** Emoji for a category name; falls back to the defaults, then a generic tag. */
export function lookupEmoji(all: Category[], kind: Kind, name: string): string {
  return (
    all.find((c) => c.kind === kind && c.name === name)?.emoji ??
    DEFAULTS[kind].find((c) => c.name === name)?.emoji ??
    DEFAULT_EMOJI
  );
}

/** Trim, collapse inner whitespace, enforce length. Returns null if unusable. */
export function cleanCategoryName(input: unknown): string | null {
  const name = String(input ?? "").replace(/\s+/g, " ").trim();
  return name.length >= 1 && name.length <= MAX_NAME_LENGTH ? name : null;
}

/** First visible character (so "🍕🍕" or pasted text becomes one emoji). */
export function cleanEmoji(input: unknown): string {
  const text = String(input ?? "").trim();
  if (!text) return DEFAULT_EMOJI;
  const first = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)][0];
  return first?.segment ?? DEFAULT_EMOJI;
}
