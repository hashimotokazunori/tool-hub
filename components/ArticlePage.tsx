import Link from "next/link";
import { ArticleImage, ProductCard } from "@/components/Cards";
import { getMarketDataMap } from "@/lib/rakuten";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Icon } from "@/components/icons";
import { PageHeading } from "@/components/PageHeading";
import { RelatedContent } from "@/components/RelatedContent";
import { ui } from "@/components/styles";
import { getGoodsCategory, getPublicProducts, getPublicTools } from "@/lib/content";
import { renderMarkdownFile } from "@/lib/markdown";
import type { Article } from "@/lib/types";

/** 比較ガイド・悩み別ガイドの共通ページ */
export async function ArticlePage({ article, section }: { article: Article; section: { label: string; href: string } }) {
  const html = renderMarkdownFile(article.bodyFile);
  const tools = getPublicTools().filter((t) => article.toolSlugs.includes(t.slug));
  const products = getPublicProducts().filter((p) => article.productIds.includes(p.id));
  const market = await getMarketDataMap(products);
  const goods = article.goodsCategoryIds.map(getGoodsCategory).filter((c) => c !== undefined);
  return (
    <article className="flex flex-col gap-6">
      <Breadcrumbs items={[section, { label: article.title }]} />
      {article.status !== "published" && (
        <p className="rounded-lg bg-warn px-3 py-2 text-sm font-bold text-white">下書きです（確認前のため公開されていません。SHOW_DRAFTS=1 のときだけ表示）</p>
      )}
      <div className="flex flex-col gap-3">
        <span className={`${ui.eyebrow} flex items-center gap-1.5 ${article.type === "guide" ? "text-guide" : "text-solution"}`}>
          <Icon name={article.type === "guide" ? "book" : "bulb"} size={16} />
          {article.type === "guide" ? "Guide · ガイド" : "Solution · 悩み別"}
        </span>
        <PageHeading title={article.type === "solution" ? `「${article.title}」ときは` : article.title} lead={article.description} />
        {/* 信頼性の手がかり：だれが書き、いつ更新し、何を参考にしたか（AIの確認は誤りがありうるので「確認済み」とは書かない） */}
        <dl className="flex flex-wrap gap-x-5 gap-y-1 rounded-xl border border-line bg-panel px-4 py-2.5 text-xs text-muted">
          <div className="flex gap-1">
            <dt>執筆</dt>
            <dd className="font-medium text-ink">{article.author}</dd>
          </div>
          <div className="flex items-center gap-1">
            <Icon name="date" size={14} />
            <dt>最終更新</dt>
            <dd className="font-medium text-ink">{(article.reviewedAt ?? article.publishedAt ?? "").replaceAll("-", "/")}</dd>
          </div>
          <div className="flex gap-1">
            <dt>参考にした情報</dt>
            <dd className="font-medium text-ink">{article.sources.length}件</dd>
          </div>
        </dl>
      </div>
      <ArticleImage slug={article.slug} className="max-w-[44rem] rounded-2xl border border-line" />
      {products.length > 0 && <p className="w-fit rounded border border-muted px-2 text-xs font-bold text-muted">PR　この記事には広告（アフィリエイトリンク）が含まれます</p>}
      <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />
      {products.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className={ui.h2}>紹介した商品</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} market={market.get(p.id)} />
            ))}
          </div>
        </section>
      )}
      {goods.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className={ui.h2}>関連する便利グッズ</h2>
          <div className="flex flex-wrap gap-2">
            {goods.map((c) => (
              <Link key={c.id} href={`/goods/category/${c.slug}/`} className={ui.chip}>
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}
      <RelatedContent tools={tools} title="この記事で使うツール" />
      {article.sources.length > 0 && (
        <section className="flex flex-col gap-1 text-xs text-muted">
          <p>この記事は公式情報をもとにまとめていますが、誤りがあったり、制度が変わったりしている場合があります。手続きの前に、下の公式ページや、お住まいの市区町村・税務署などで確かめてください。誤りに気づいたらお知らせください。</p>
          <p>参考にした情報：</p>
          <ul className="list-disc pl-5">
            {article.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} rel="noopener noreferrer" target="_blank" className="underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
