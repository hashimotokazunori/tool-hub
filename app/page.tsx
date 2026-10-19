import Link from "next/link";
import { EntryCard, GoodsCategoryCard, GuideFeature, GuideRow, ProductCard, SolutionCard, ToolCard } from "@/components/Cards";
import { Hero } from "@/components/Hero";
import { Section } from "@/components/Section";
import { ui } from "@/components/styles";
import { goodsCategories, toolCategories } from "@/data/categories";
import { getBuyingGuides, getProductsByCategory, getPublicArticles, getPublicProducts, getPublicTools, getToolsByCategory, sortCategories } from "@/lib/content";
import { getMarketDataMap } from "@/lib/rakuten";
import { buildSearchIndex } from "@/lib/search-index";

/** ヒーローの下に並べる「よく使う操作」（公開中のツールだけを出す） */
const QUICK: { slug: string; label: string }[] = [
  { slug: "warikan", label: "割り勘する" },
  { slug: "consumption-tax", label: "消費税を計算" },
  { slug: "character-counter", label: "文字数を数える" },
  { slug: "days-between", label: "日数を数える" },
  { slug: "password-generator", label: "パスワードを作る" },
];

/** トップに出す人気ツールの順番（公開中のものだけ表示） */
const POPULAR = ["character-counter", "consumption-tax", "warikan", "days-between", "password-generator"];

/** 楽天の価格を取り直す間隔（秒） */
export const revalidate = 21600;

export default async function Home() {
  const tools = getPublicTools();
  const toolBySlug = new Map(tools.map((t) => [t.slug, t]));
  const popular = [...POPULAR.map((s) => toolBySlug.get(s)).filter((t) => t !== undefined), ...tools.filter((t) => !POPULAR.includes(t.slug))].slice(0, 9);
  const quick = QUICK.filter((q) => toolBySlug.has(q.slug)).map((q) => ({ href: `/tools/${q.slug}/`, label: q.label }));
  const products = getPublicProducts().slice(0, 3);
  const market = await getMarketDataMap(products);
  const solutions = getPublicArticles("solution").slice(0, 6);
  const [featured, ...guides] = getPublicArticles("guide");
  const toolCount = (slugs: string[]) => slugs.filter((s) => toolBySlug.has(s)).length;

  return (
    <div className="flex flex-col gap-14 sm:gap-20">
      <div className="flex flex-col gap-6">
        <Hero items={buildSearchIndex()} quick={quick} toolCount={tools.length} />
        <section aria-labelledby="entry-title" className="flex flex-col gap-3">
          <h2 id="entry-title" className="sr-only">
            何をする？
          </h2>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            <EntryCard href="/tools/" icon="tool" title="無料Webツール" sub="今すぐ使える便利機能" tone="tool" />
            <EntryCard href="/goods/" icon="bag" title="便利グッズ" sub="暮らしを変える道具" tone="goods" />
            <EntryCard href="/solutions/" icon="bulb" title="悩みから探す" sub="困りごとを解決" tone="solution" />
            <EntryCard href="/guides/" icon="book" title="比較・活用ガイド" sub="選び方を詳しく解説" tone="guide" />
          </div>
        </section>
      </div>

      <Section id="tools" eyebrow="Tools" icon="tool" tone="tool" title="人気の無料ツール" lead="目的別に、すぐ使える。登録もインストールもいりません。" more={{ href: "/tools/", label: "すべてのツール" }}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((t) => (
            <ToolCard key={t.id} tool={t} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {sortCategories(toolCategories)
            .filter((c) => getToolsByCategory(c.id).length > 0)
            .map((c) => (
              <Link key={c.id} href={`/tools/category/${c.slug}/`} className={ui.chip}>
                {c.name}
                <small className="font-mono text-muted">{getToolsByCategory(c.id).length}</small>
              </Link>
            ))}
        </div>
      </Section>

      <Section id="goods" eyebrow="Goods" icon="bag" tone="goods" band title="今、注目したい便利グッズ" lead="写真と比較ポイントで、自分に合う道具を見つける。" more={{ href: "/goods/", label: "便利グッズを見る" }}>
        {products.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} market={market.get(p.id)} />
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {sortCategories(goodsCategories).map((c) => (
            <GoodsCategoryCard key={c.id} category={c} examples={c.description.split("、").slice(0, 3)} count={getProductsByCategory(c.id).length + getBuyingGuides(c.id).length} />
          ))}
        </div>
      </Section>

      {solutions.length > 0 && (
        <Section id="solutions" eyebrow="Solutions" icon="bulb" tone="solution" title="悩みから解決策を見つける" lead="困りごとを選ぶと、解決のヒント・使えるツール・おすすめの道具がまとめて見つかります。" more={{ href: "/solutions/", label: "悩みをすべて見る" }}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {solutions.map((a) => (
              <SolutionCard key={a.id} article={a} toolCount={toolCount(a.toolSlugs)} />
            ))}
          </div>
        </Section>
      )}

      {featured && (
        <Section id="guides" eyebrow="Guides" icon="book" tone="guide" title="特集・比較ガイド" lead="根拠と具体例のある記事で、選び方と使い方を詳しく。" more={{ href: "/guides/", label: "ガイドをすべて見る" }}>
          <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
            <GuideFeature article={featured} />
            {guides.length > 0 && (
              <div className="flex flex-col">
                {guides.slice(0, 4).map((a) => (
                  <GuideRow key={a.id} article={a} />
                ))}
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}
