import { timeLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { useEmojiFor } from "@/lib/store";
import type { Tx } from "@/lib/types";

export function TxRow({ tx }: { tx: Tx }) {
  const emojiFor = useEmojiFor();
  const income = tx.kind === "income";
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-raised text-lg" aria-hidden>
        {emojiFor(tx.kind, tx.category)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{tx.note || tx.category}</p>
        <p className="truncate text-xs text-mute">
          {tx.note ? `${tx.category} · ` : ""}
          {timeLabel(tx.createdAt)}
        </p>
      </div>
      <p className={`num text-sm font-semibold ${income ? "text-accent" : ""}`}>
        {income ? "+" : ""}
        {formatMoney(tx.amountCents)}
      </p>
    </div>
  );
}
