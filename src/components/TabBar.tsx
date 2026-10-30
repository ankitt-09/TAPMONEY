"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const icon = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const tabs = [
  {
    href: "/",
    label: "Home",
    svg: (
      <svg viewBox="0 0 24 24" className="size-6" {...icon}>
        <path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    href: "/add",
    label: "Add",
    svg: (
      <svg viewBox="0 0 24 24" className="size-6" {...icon} strokeWidth={2.4}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    href: "/history",
    label: "History",
    svg: (
      <svg viewBox="0 0 24 24" className="size-6" {...icon}>
        <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
      </svg>
    ),
  },
  {
    href: "/setup",
    label: "Setup",
    svg: (
      <svg viewBox="0 0 24 24" className="size-6" {...icon}>
        <path d="M13 3 5 14h6l-1 7 8-11h-6z" />
      </svg>
    ),
  },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-bg/90 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {tabs.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          const isAdd = t.href === "/add";
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium ${
                  active ? "text-accent" : "text-mute"
                }`}
              >
                <span
                  className={
                    isAdd
                      ? `grid size-9 place-items-center rounded-full ${
                          active ? "bg-accent text-bg" : "bg-accent/15 text-accent"
                        }`
                      : "grid size-9 place-items-center"
                  }
                >
                  {t.svg}
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
