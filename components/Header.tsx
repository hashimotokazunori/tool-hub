import Link from "next/link";
import { site } from "@/data/site";
import { buildSearchIndex } from "@/lib/search-index";
import { HeaderSearch } from "./GlobalSearch";
import { Icon } from "./icons";
import { NavLinks } from "./NavLinks";

export function Header() {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 text-ink no-underline">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-lime text-lime-ink">
            <Icon name="bolt" size={18} />
          </span>
          <span className="text-xl font-bold tracking-tight">{site.name}</span>
          <span className="hidden text-xs text-muted lg:inline">{site.tagline}</span>
        </Link>
        <NavLinks />
      </div>
      <HeaderSearch items={buildSearchIndex()} />
    </header>
  );
}
