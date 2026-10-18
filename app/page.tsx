import Link from "next/link";
import { ArticleCard, ToolCard } from "@/components/Cards";
import { Icon, type IconName } from "@/components/icons";
import { ui } from "@/components/styles";
import { goodsCategories, toolCategories } from "@/data/categories";
import { site } from "@/data/site";
import { getPublicArticles, getPublicTools, getToolsByCategory, sortCategories } from "@/lib/content";

const ENTRIES: { href: string; icon: IconName; title: string; sub: string }[] = [
  { href: "/tools/", icon: "tool", title: "無料Webツール", sub: "すぐ使える便利機能" },
  { href: "/goods/", icon: "bag", title: "便利グッズ", sub: "暮らし・仕事のアイテム" },
  { href: "/solutions/", icon: "bulb", title: "悩み別に探す", sub: "困りごとから解決" },
  { href: "/guides/", icon: "book", title: "特集・比較ガイド", sub: "選び方・使い方" },
];

export default function Home() {
  const tools = getPublicTools();
  const guides = getPublicArticles("guide").slice(0, 6);
  const solutions = getPublicArticles("solution").slice(0, 9);
  return (
    <div className="flex flex-col gap-9">
      <section className="flex flex-col gap-2">
        <h1 className="font-display text-[clamp(1.75rem,5vw,2.5rem)] leading-tight">
          暮らしと仕事の「困った」を、
          <br />
          すぐ解決。
        </h1>
        <p className="max-w-2xl text-muted">{site.description}</p>
      </section>

      <nav aria-label="コーナー" className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {ENTRIES.map((e) => (
          <Link key={e.href} href={e.href} className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-panel px-3 py-5 text-center text-ink no-underline transition hover:border-accent hover:shadow-md">
            <Icon name={e.icon} size={28} className="mb-1 text-accent" />
            <b>{e.title}</b>
            <span className="text-xs text-muted">{e.sub}</span>
          </Link>
        ))}
      </nav>

      <section className="flex flex-col gap-3">
        <h2 className={ui.h2}>使えるツール</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <ToolCard key={t.id} tool={t} />
          ))}
        </div>
        <Link href="/tools/" className="w-fit text-sm text-accent underline">
          すべてのツールを見る
        </Link>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={ui.h2}>カテゴリから探す</h2>
        <div className="flex flex-wrap gap-2">
          {sortCategories(toolCategories).map((c) => (
            <Link key={c.id} href={`/tools/category/${c.slug}/`} className={ui.chip}>
              {c.name}
              <small className="font-mono text-muted">{getToolsByCategory(c.id).length}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={ui.h2}>便利グッズ</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sortCategories(goodsCategories).map((c) => (
            <Link key={c.id} href={`/goods/category/${c.slug}/`} className={ui.card}>
              <b className="text-[15px]">{c.name}</b>
              <span className="text-xs text-muted">{c.description}</span>
            </Link>
          ))}
        </div>
      </section>

      {(solutions.length > 0 || guides.length > 0) && (
        <section className="flex flex-col gap-3">
          <h2 className={ui.h2}>悩み別・特集ガイド</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[...solutions, ...guides].map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
