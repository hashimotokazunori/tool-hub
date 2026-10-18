import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductCard } from "@/components/Cards";
import { EmptyState, PageHeading } from "@/components/PageHeading";
import { ui } from "@/components/styles";
import { tools } from "@/data/tools";
import { goodsCategories } from "@/data/categories";
import { getBuyingGuides, getGoodsCategoryBySlug, getProductsByCategory, isToolPublic } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return goodsCategories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/goods/category/[slug]">) {
  const { slug } = await params;
  const c = getGoodsCategoryBySlug(slug);
  if (!c) notFound();
  const empty = getProductsByCategory(c.id).length === 0 && getBuyingGuides(c.id).length === 0;
  return pageMetadata({ title: `${c.name}の選び方・おすすめ`, description: `${c.description}の選び方と、確認した商品の紹介。`, path: `/goods/category/${c.slug}/`, noindex: empty });
}

export default async function GoodsCategoryPage({ params }: PageProps<"/goods/category/[slug]">) {
  const { slug } = await params;
  const c = getGoodsCategoryBySlug(slug);
  if (!c) notFound();
  const products = getProductsByCategory(c.id);
  const guides = getBuyingGuides(c.id);
  const toolBySlug = (s: string) => tools.find((t) => t.slug === s && isToolPublic(t));
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "便利グッズ", href: "/goods/" }, { label: c.name }]} />
      <PageHeading title={c.name} lead={c.description} />

      <section className="flex flex-col gap-3">
        <h2 className={ui.h2}>掲載商品</h2>
        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState>このカテゴリの商品は、仕様と価格を確認してから掲載します。もうしばらくお待ちください。</EmptyState>
        )}
      </section>

      {guides.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className={ui.h2}>選び方のポイント</h2>
          {guides.map((g) => (
            <article key={g.id} className={`${ui.panel} flex flex-col gap-2 p-4 sm:p-5`}>
              <h3 className="text-lg font-bold">
                {g.name}
                {g.status !== "published" && <span className="ml-2 rounded bg-warn px-1.5 align-middle text-[11px] font-bold text-white">下書き（非公開）</span>}
              </h3>
              <p>{g.summary}</p>
              <ul className="list-disc pl-5 text-sm leading-relaxed">
                {g.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <p className="text-xs text-muted">比べるときに見る仕様：{g.specsToCompare.join("・")}</p>
              <div className="flex flex-wrap gap-2">
                {g.toolSlugs.map(toolBySlug).map((t) =>
                  t ? (
                    <Link key={t.slug} href={`/tools/${t.slug}/`} className={ui.chip}>
                      {t.name}
                    </Link>
                  ) : null,
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
