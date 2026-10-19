import Link from "next/link";
import { priceLabel, productLink } from "@/lib/affiliate";
import type { Article, Category, Product, Tool } from "@/lib/types";
import { goodsCategoryIcon, Icon, toolCategoryIcon, type IconName } from "./icons";
import { gradientFor, tone as tones, ui, type Tone } from "./styles";

/* ------------------------------------------------------------------
 * ツール：すぐ見つけて、すぐ開ける。アイコン＋名前＋短い説明の小さなカード
 * ------------------------------------------------------------------ */
export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tools/${tool.slug}/`}
      className="group relative flex min-w-0 items-start gap-3.5 rounded-2xl border border-line bg-panel p-4 text-ink no-underline shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lift"
    >
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-card ${gradientFor(tool.categoryId)}`}>
        <Icon name={toolCategoryIcon[tool.categoryId] ?? "tool"} size={21} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <b className="pr-5 text-[15px] leading-snug">{tool.name}</b>
        <span className="line-clamp-2 text-xs leading-relaxed text-muted">{tool.summary}</span>
      </span>
      <Icon name="arrow" size={16} className="absolute top-4 right-4 text-muted opacity-0 transition group-hover:translate-x-0.5 group-hover:text-accent group-hover:opacity-100" />
    </Link>
  );
}

/* トップの「何をする？」の入口。種類ごとの色で塗り分ける */
export function EntryCard({ href, icon, title, sub, tone }: { href: string; icon: IconName; title: string; sub: string; tone: Tone }) {
  const t = tones[tone];
  return (
    <Link href={href} className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-line bg-panel p-4 text-ink no-underline shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:p-5">
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${t.soft} ${t.text}`}>
        <Icon name={icon} size={22} />
      </span>
      <span className="flex flex-col gap-0.5">
        <b className="text-[15px] sm:text-lg">{title}</b>
        <span className="text-xs text-muted sm:text-sm">{sub}</span>
      </span>
      <Icon name="arrow" size={18} className={`absolute top-4 right-4 opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-100 ${t.text}`} />
    </Link>
  );
}

/* ------------------------------------------------------------------
 * 便利グッズ：写真（無ければ絵）を主役に、特徴と比較ポイントを添える
 * ------------------------------------------------------------------ */
export function GoodsCategoryCard({ category, examples, count }: { category: Category; examples: string[]; count: number }) {
  return (
    <Link href={`/goods/category/${category.slug}/`} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-panel text-ink no-underline shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <span className="relative grid aspect-[16/9] place-items-center bg-gradient-to-br from-goods-soft to-panel text-goods">
        <Icon name={goodsCategoryIcon[category.id] ?? "bag"} size={56} className="transition group-hover:scale-105" />
        <span className="absolute bottom-2 left-3 rounded-full bg-panel/90 px-2 py-0.5 text-[11px] font-semibold text-goods">{count > 0 ? `${count}件を掲載` : "選び方を準備中"}</span>
      </span>
      <span className="flex flex-col gap-1.5 p-4">
        <b className="text-base">{category.name}</b>
        <span className="flex flex-wrap gap-1">
          {examples.map((e) => (
            <span key={e} className="rounded-md bg-field px-1.5 py-0.5 text-[11px] text-muted">
              {e}
            </span>
          ))}
        </span>
      </span>
    </Link>
  );
}

/** 商品カード。画像・特徴タグ・比較ポイント・確認日つきの価格・PR表記 */
export function ProductCard({ product }: { product: Product }) {
  const link = productLink(product);
  const price = priceLabel(product);
  const specs = Object.entries(product.specifications).slice(0, 3);
  return (
    <article className="relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-card transition duration-200 hover:shadow-lift">
      <Link href={`/goods/items/${product.slug}/`} className="relative block aspect-[4/3] bg-gradient-to-br from-goods-soft to-panel">
        {product.imageUrl ? (
          // 画像は使用条件を確認したものだけが入る（data/products.ts の imageLicenseNote）
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain p-4" loading="lazy" />
        ) : (
          <span className="grid h-full place-items-center text-goods">
            <Icon name={goodsCategoryIcon[product.categoryId] ?? "bag"} size={56} />
          </span>
        )}
        {link?.sponsored && <span className="absolute top-2 right-2 rounded bg-panel/95 px-1.5 text-[11px] font-bold text-muted ring-1 ring-line">PR</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        {product.status !== "published" && <span className="w-fit rounded bg-warn px-1.5 text-[11px] font-bold text-white">下書き（非公開）</span>}
        {product.brand && <span className="text-xs text-muted">{product.brand}</span>}
        <Link href={`/goods/items/${product.slug}/`} className="font-bold leading-snug text-ink hover:underline">
          {product.name}
        </Link>
        {product.features.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.features.slice(0, 3).map((f) => (
              <span key={f} className="rounded-full bg-goods-soft px-2 py-0.5 text-[11px] font-medium text-goods">
                {f}
              </span>
            ))}
          </div>
        )}
        {specs.length > 0 && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
            {specs.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="mt-auto flex flex-col gap-2 pt-1">
          {price && <p className="text-sm font-bold">{price}</p>}
          {link && (
            <a href={link.href} rel={link.rel} target="_blank" className={ui.buttonPrimary}>
              {link.label}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------
 * 悩み解決：「自分のことだ」と思えるよう、困りごとの言葉をそのまま大きく
 * ------------------------------------------------------------------ */
export function SolutionCard({ article, toolCount }: { article: Article; toolCount: number }) {
  return (
    <Link href={`/solutions/${article.slug}/`} className="group flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-panel p-5 text-ink no-underline shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-solution">
        <Icon name="bulb" size={16} />
        こんなことで困っていませんか？
      </span>
      <b className="text-lg leading-snug">「{article.title}」</b>
      <span className="text-sm leading-relaxed text-muted">{article.description}</span>
      <span className="mt-auto flex flex-wrap items-center gap-2 pt-1 text-xs">
        {toolCount > 0 && <span className="rounded-full bg-solution-soft px-2 py-0.5 font-medium text-solution">使えるツール {toolCount}</span>}
        {article.goodsCategoryIds.length > 0 && <span className="rounded-full bg-goods-soft px-2 py-0.5 font-medium text-goods">便利グッズあり</span>}
        <span className="ml-auto flex items-center gap-1 font-semibold text-solution">
          解決策を見る
          <Icon name="arrow" size={14} className="transition group-hover:translate-x-0.5" />
        </span>
      </span>
      <DraftBadge article={article} />
    </Link>
  );
}

/* ------------------------------------------------------------------
 * ガイド：読みやすさと信頼性。先頭の記事は大きく、ほかは行で
 * ------------------------------------------------------------------ */
function TrustMeta({ article }: { article: Article }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
      <span className="flex items-center gap-1">
        <Icon name="shield" size={14} />
        {article.reviewedAt ? `${article.reviewedAt.replaceAll("-", "/")} 内容確認` : "内容確認前"}
      </span>
      {article.sources.length > 0 && <span>出典 {article.sources.length}件</span>}
      <span>{article.author}</span>
    </span>
  );
}

export function GuideFeature({ article }: { article: Article }) {
  return (
    <Link href={`/guides/${article.slug}/`} className="group relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-guide-soft via-panel to-accent-soft p-6 text-ink no-underline shadow-card transition duration-200 hover:shadow-lift sm:p-8">
      <span className={`${ui.eyebrow} text-guide`}>Feature · 特集</span>
      <b className="text-[clamp(1.3rem,3vw,1.9rem)] leading-snug font-extrabold tracking-tight">{article.title}</b>
      <span className="max-w-2xl leading-relaxed text-muted">{article.description}</span>
      <TrustMeta article={article} />
      <DraftBadge article={article} />
    </Link>
  );
}

export function GuideRow({ article }: { article: Article }) {
  return (
    <Link href={`/guides/${article.slug}/`} className="group flex min-w-0 items-start gap-3 rounded-2xl px-3 py-4 text-ink no-underline transition hover:bg-panel hover:shadow-card">
      <Icon name="book" size={20} className="mt-0.5 shrink-0 text-guide" />
      <span className="flex min-w-0 flex-col gap-1">
        <b className="leading-snug group-hover:underline">{article.title}</b>
        <span className="text-sm text-muted">{article.description}</span>
        <TrustMeta article={article} />
        <DraftBadge article={article} />
      </span>
    </Link>
  );
}

/** 関連コンテンツ用の小さなカード（記事の種類で色を変える） */
export function ArticleCard({ article }: { article: Article }) {
  const guide = article.type === "guide";
  const t = tones[guide ? "guide" : "solution"];
  return (
    <Link href={`/${guide ? "guides" : "solutions"}/${article.slug}/`} className={`${ui.card} ${t.border}`}>
      <span className={`flex items-center gap-1 text-[11px] font-semibold ${t.text}`}>
        <Icon name={guide ? "book" : "bulb"} size={14} />
        {guide ? "ガイド" : "悩み別"}
      </span>
      <b className="text-[15px]">{article.title}</b>
      <span className="text-xs text-muted">{article.description}</span>
      <DraftBadge article={article} />
    </Link>
  );
}

function DraftBadge({ article }: { article: Article }) {
  if (article.status === "published") return null;
  return <span className="w-fit rounded bg-warn px-1.5 text-[11px] font-bold text-white">下書き（非公開）</span>;
}
