"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icons";

const NAV: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { href: "/", label: "トップ", icon: "home", match: (p) => p === "/" },
  { href: "/tools/", label: "ツール", icon: "tool", match: (p) => p.startsWith("/tools") },
  { href: "/goods/", label: "便利グッズ", icon: "bag", match: (p) => p.startsWith("/goods") },
  { href: "/solutions/", label: "悩み別", icon: "bulb", match: (p) => p.startsWith("/solutions") },
  { href: "/guides/", label: "ガイド", icon: "book", match: (p) => p.startsWith("/guides") },
];

/** メインメニュー。スマホでは画面下のタブバーになる */
export function NavLinks() {
  const path = usePathname() ?? "/";
  return (
    <nav
      aria-label="メインメニュー"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-panel px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] md:static md:z-auto md:gap-1 md:border-0 md:bg-transparent md:p-0"
    >
      {NAV.map((n) => {
        const active = n.match(path);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] no-underline md:flex-none md:flex-row md:gap-1.5 md:rounded-full md:px-3.5 md:py-2 md:text-sm md:font-medium ${
              active ? "bg-accent-soft text-accent md:bg-accent md:text-accent-ink" : "text-ink hover:bg-accent-soft"
            }`}
          >
            <Icon name={n.icon} />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
