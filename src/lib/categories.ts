export type Kind = "expense" | "income";

export interface Category {
  name: string;
  emoji: string;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { name: "Food", emoji: "🍔" },
  { name: "Transport", emoji: "🚕" },
  { name: "Groceries", emoji: "🛒" },
  { name: "Shopping", emoji: "🛍️" },
  { name: "Bills", emoji: "💡" },
  { name: "Fun", emoji: "🎬" },
  { name: "Health", emoji: "💊" },
  { name: "Education", emoji: "📚" },
  { name: "Other", emoji: "✨" },
];

export const INCOME_CATEGORIES: Category[] = [
  { name: "Pocket money", emoji: "👪" },
  { name: "Salary", emoji: "💼" },
  { name: "Freelance", emoji: "💻" },
  { name: "Gift", emoji: "🎁" },
  { name: "Other", emoji: "✨" },
];

export const categoriesFor = (kind: Kind) =>
  kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

/** Case-insensitive match to a known category; anything unknown becomes "Other". */
export function normalizeCategory(kind: Kind, input: unknown): string {
  const wanted = String(input ?? "").trim().toLowerCase();
  return categoriesFor(kind).find((c) => c.name.toLowerCase() === wanted)?.name ?? "Other";
}

export function emojiFor(kind: Kind, name: string): string {
  return categoriesFor(kind).find((c) => c.name === name)?.emoji ?? "✨";
}
