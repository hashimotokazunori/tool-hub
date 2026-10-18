import Link from "next/link";
import { ProductCard } from "@/components/Cards";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageHeading } from "@/components/PageHeading";
import { RelatedContent } from "@/components/RelatedContent";
import { ui } from "@/components/styles";
import { getGoodsCategory, getPublicProducts, getPublicTools } from "@/lib/content";
import { renderMarkdownFile } from "@/lib/markdown";
import type { Article } from "@/lib/types";

/** 比較ガイド・悩み別ガイドの共通ページ */
export function ArticlePage({ article, section }: { article: Article; section: { label: string; href: string } }) {
  const html = renderMarkdownFile(article.bodyFile);
  const tools = getPublicTools().filter((t) => article.toolSlugs.includes(t.slug));
  const products = getPublicProducts().filter((p) => article.productIds.includes(p.id));
  const goods = article.goodsCategoryIds.map(getGoodsCategory).filter((c) => c !== undefined);
  return (
    <article className="flex flex-col gap-6">
      <Breadcrumbs items={[section, { label: article.title }]} />
      {article.status !== "published" && (
        <p className="rounded-lg bg-warn px-3 py-2 text-sm font-bold text-white">下書きです（人の確認前のため公開されていません。SHOW_DRAFTS=1 のときだけ表示）</p>
      )}
      <PageHeading title={article.title} lead={article.description}>
        <p className={ui.note}>
          {article.author}
          {article.reviewedAt && `・内容確認日 ${article.reviewedAt.replaceAll("-", "/")}`}
        </p>
      </PageHeading>
      {products.length > 0 && <p className="w-fit rounded border border-muted px-2 text-xs font-bold text-muted">PR　この記事には広告（アフィリエイトリンク）が含まれます</p>}
      <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />
      {products.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className={ui.h2}>紹介した商品</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
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
