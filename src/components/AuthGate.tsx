"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { Login } from "./Login";
import { TabBar } from "./TabBar";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const authed = useStore((s) => s.authed);
  const checkSession = useStore((s) => s.checkSession);
  const refresh = useStore((s) => s.refresh);
  const loadCategories = useStore((s) => s.loadCategories);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (authed) void loadCategories();
  }, [authed, loadCategories]);

  // The Add screen only needs the keypad and your categories, so it skips loading the
  // month's data. Every other screen loads it when you open it.
  useEffect(() => {
    if (authed && pathname !== "/add") void refresh();
  }, [authed, pathname, refresh]);

  // Pick up entries made by the Shortcut while the app was in the background.
  useEffect(() => {
    const onVisible = () => {
      const { authed: ok, refresh: reload } = useStore.getState();
      if (document.visibilityState === "visible" && ok && window.location.pathname !== "/add") {
        void reload();
      }
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
      <main className="flex flex-1 flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <TabBar />
    </div>
  );
}
