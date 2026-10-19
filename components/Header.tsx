import Link from "next/link";
import { site } from "@/data/site";
import { buildSearchIndex } from "@/lib/search-index";
import { HeaderSearch } from "./GlobalSearch";
import { Icon } from "./icons";
import { NavLinks } from "./NavLinks";

/** 画面の上に貼りつく、すりガラス風のヘッダー */
export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/75 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 py-2.5 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] md:gap-5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-ink no-underline">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white shadow-card">
            <Icon name="bolt" size={18} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[17px] font-extrabold tracking-tight">{site.name}</span>
            <span className="mt-1 hidden text-[10px] text-muted sm:block">{site.tagline}</span>
          </span>
        </Link>
        <div className="order-last w-full empty:hidden sm:order-none sm:w-auto sm:min-w-0 sm:flex-1">
          <HeaderSearch items={buildSearchIndex()} />
        </div>
        <NavLinks variant="top" />
      </div>
    </header>
  );
}
