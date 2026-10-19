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

/**
 * メインメニュー。パソコンではヘッダーの中（variant="top"）、スマホでは画面下のタブバー（variant="bar"）。
 * ヘッダーはすりガラス（backdrop-filter）なので、その中に position: fixed を置くと画面ではなくヘッダー基準になる。
 * そのためタブバーはヘッダーの外に別に置く。
 */
export function NavLinks({ variant }: { variant: "top" | "bar" }) {
  const path = usePathname() ?? "/";
  return (
    <nav
      aria-label="メインメニュー"
      className={
        variant === "bar"
          ? "fixed inset-x-0 bottom-0 z-30 flex border-t border-line/70 bg-panel/85 px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden"
          : "hidden shrink-0 gap-0.5 rounded-full border border-line bg-panel/70 p-1 shadow-card md:flex"
      }
    >
      {NAV.map((n) => {
        const active = n.match(path);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[11px] font-medium whitespace-nowrap no-underline transition md:flex-none md:flex-row md:gap-1.5 md:rounded-full md:px-3 md:py-1.5 md:text-[13px] ${
              active ? "text-accent md:bg-gradient-to-r md:from-accent md:to-accent-2 md:text-accent-ink md:shadow-card" : "text-muted hover:text-ink md:hover:bg-field"
            }`}
          >
            <Icon name={n.icon} size={20} />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
