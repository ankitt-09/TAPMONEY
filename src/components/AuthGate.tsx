"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { Login } from "./Login";
import { TabBar } from "./TabBar";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const authed = useStore((s) => s.authed);
  const checkSession = useStore((s) => s.checkSession);
  const refresh = useStore((s) => s.refresh);
  const loadCategories = useStore((s) => s.loadCategories);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (authed) {
      void refresh();
      void loadCategories();
    }
  }, [authed, refresh, loadCategories]);

  // Pick up entries made by the Shortcut while the app was in the background.
  useEffect(() => {
    const onVisible = () => {
      const { authed: ok, refresh: reload } = useStore.getState();
      if (document.visibilityState === "visible" && ok) void reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  if (authed === null) {
    return (
      <div className="grid min-h-dvh place-items-center text-mute" role="status">
        Loading…
      </div>
    );
  }
  if (!authed) return <Login />;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <main className="flex-1 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-32">
        {children}
      </main>
      <TabBar />
    </div>
  );
}
