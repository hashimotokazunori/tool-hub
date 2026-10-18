import Link from "next/link";
import type { SearchItem } from "@/lib/search";
import { GlobalSearch } from "./GlobalSearch";
import { ui } from "./styles";

/** トップの検索エリア。検索を主役にし、よく使う操作をすぐ下に置く */
export function Hero({ items, quick }: { items: SearchItem[]; quick: { href: string; label: string }[] }) {
  return (
    <section aria-labelledby="hero-title" className="relative rounded-3xl bg-hero px-5 pt-8 pb-7 text-hero-ink sm:px-10 sm:pt-12 sm:pb-10">
      <p className={`${ui.eyebrow} text-hero-muted`}>Tools · Goods · Solutions</p>
      <h1 id="hero-title" className="mt-3 text-[clamp(2rem,6vw,3.25rem)] leading-[1.15] font-bold tracking-tight">
        面倒なことは、
        <br />
        <span className="text-lime">ここで片づける。</span>
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-hero-muted sm:text-base">登録不要の無料ツール、便利グッズの選び方、悩み別の解決策を、ひとつの場所で。入力した内容は送信せず、ブラウザの中だけで処理します。</p>
      <div className="mt-6 max-w-2xl">
        <GlobalSearch items={items} variant="hero" />
      </div>
      <nav aria-label="よく使う操作" className="mt-4 flex flex-wrap gap-2">
        {quick.map((q, i) => (
          <Link
            key={q.href}
            href={q.href}
            className={`rounded-full px-4 py-2 text-sm font-semibold no-underline transition ${i === 0 ? "bg-lime text-lime-ink hover:opacity-90" : "border border-hero-muted/50 text-hero-ink hover:border-hero-ink"}`}
          >
            {q.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
