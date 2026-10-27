const MAX_CENTS = 1_000_000_000; // 10,000,000.00

/** Accepts 250, "250", "₹1,250.50" … returns integer minor units, or null if invalid. */
export function parseAmountToCents(input: unknown): number | null {
  const raw = typeof input === "number" ? String(input) : String(input ?? "");
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned || cleaned === ".") return null;
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value)) return null;
  const cents = Math.round(value * 100);
  return cents > 0 && cents < MAX_CENTS ? cents : null;
}

const currency = process.env.NEXT_PUBLIC_CURRENCY ?? "INR";
const locale = process.env.NEXT_PUBLIC_LOCALE ?? "en-IN";

const make = (digits: number) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const whole = make(0);
const fractional = make(2);

/** ₹1,250 for whole amounts, ₹1,250.50 otherwise. */
export const formatMoney = (cents: number) =>
  (cents % 100 === 0 ? whole : fractional).format(cents / 100);

export const currencySymbol =
  whole.formatToParts(0).find((p) => p.type === "currency")?.value ?? "₹";

/** Groups the integer part of a typed amount ("1250.5" -> "1,250.5") for the keypad display. */
export function groupTyped(typed: string): string {
  const [int, dec] = typed.split(".");
  const grouped = new Intl.NumberFormat(locale).format(Number(int || "0"));
  return dec === undefined ? grouped : `${grouped}.${dec}`;
}
