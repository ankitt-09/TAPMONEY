"use client";

import { useState, useSyncExternalStore } from "react";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { useStore } from "@/lib/store";

function Copy({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="mt-2">
      <div className="flex items-stretch overflow-hidden rounded-xl border border-line bg-surface">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre px-3 py-2.5 text-xs">{value}</code>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setDone(true);
              setTimeout(() => setDone(false), 1500);
            } catch {
              /* clipboard unavailable — user can select the text instead */
            }
          }}
          aria-label={`Copy ${label}`}
          className="shrink-0 border-l border-line px-3 text-xs font-semibold text-accent"
        >
          {done ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children?: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent">
        {n}
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-1 space-y-1 text-mute">{children}</div>}
      </div>
    </li>
  );
}

export default function SetupPage() {
  const logout = useStore((s) => s.logout);
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "https://your-app.vercel.app",
  );

  const addUrl = `${origin}/add`;
  const apiUrl = `${origin}/api/transactions`;
  const json = `{
  "amount": <Provided Input>,
  "category": <Chosen Item>,
  "kind": "expense"
}`;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Back Tap setup</h1>
        <p className="mt-1 text-sm text-mute">
          Tap the back of your iPhone twice and log an expense. Takes about three minutes.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mute">1 · Install the app</h2>
        <ol className="space-y-4">
          <Step n={1} title="Open this site in Safari">
            <p>Use Safari, not Chrome, so it can be added to your Home Screen.</p>
          </Step>
          <Step n={2} title="Share → Add to Home Screen">
            <p>You get a full-screen app icon. It opens straight on the quick-add screen.</p>
          </Step>
        </ol>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mute">
          2 · Make the shortcut (pick one)
        </h2>

        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <h3 className="font-semibold">A. Open the quick-add screen</h3>
            <p className="mt-0.5 text-xs text-mute">Easiest. Shows the keypad so you can choose any amount.</p>
            <ol className="mt-4 space-y-4">
              <Step n={1} title="Shortcuts app → + (new shortcut)">
                <p>Search for the action “Open URLs”.</p>
              </Step>
              <Step n={2} title="Set the URL to">
                <Copy value={addUrl} label="quick-add URL" />
              </Step>
              <Step n={3} title="Name it “Add expense”">
                <p>This opens in Safari, not the Home Screen app. That’s an iOS limit.</p>
              </Step>
            </ol>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4">
            <h3 className="font-semibold">B. Log silently, with no app opening</h3>
            <p className="mt-0.5 text-xs text-mute">
              Fastest. Asks for an amount and category, saves it, then shows a notification.
            </p>
            <ol className="mt-4 space-y-4">
              <Step n={1} title="Ask for Input">
                <p>Type: Number. Prompt: “How much?”</p>
              </Step>
              <Step n={2} title="Choose from List">
                <p>Add these items:</p>
                <p className="text-ink">{EXPENSE_CATEGORIES.map((c) => c.name).join(", ")}</p>
              </Step>
              <Step n={3} title="Get Contents of URL">
                <p>URL:</p>
                <Copy value={apiUrl} label="API URL" />
                <p className="pt-1">Show More → Method: POST. Add a header:</p>
                <Copy value="Authorization: Bearer YOUR_SECRET" label="auth header" />
                <p className="pt-1">
                  Replace YOUR_SECRET with the APP_SECRET you set when deploying. Request Body: JSON, with these
                  fields (tap the variables in the Shortcuts editor):
                </p>
                <Copy value={json} label="JSON body" />
              </Step>
              <Step n={4} title="Get Dictionary Value → “message”">
                <p>Read the “message” key from Contents of URL.</p>
              </Step>
              <Step n={5} title="Show Notification">
                <p>Show the Dictionary Value, for example “Saved ₹250 · Food”.</p>
              </Step>
            </ol>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-mute">3 · Assign it to Back Tap</h2>
        <ol className="space-y-4">
          <Step n={1} title="Settings → Accessibility → Touch → Back Tap" />
          <Step n={2} title="Choose Double Tap (or Triple Tap)">
            <p>Scroll to the Shortcuts section and pick the shortcut you just made.</p>
          </Step>
          <Step n={3} title="Test it">
            <p>Tap twice on the back of the phone, near the Apple logo. Thick cases can block it.</p>
          </Step>
        </ol>
        <p className="mt-4 text-xs text-mute">Back Tap needs an iPhone 8 or newer on iOS 14 or later.</p>
      </section>

      <button
        onClick={() => void logout()}
        className="w-full rounded-xl border border-line py-3 text-sm font-semibold text-mute active:bg-surface"
      >
        Sign out
      </button>
    </div>
  );
}
