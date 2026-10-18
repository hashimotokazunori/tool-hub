import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageHeading } from "@/components/PageHeading";
import { RelatedContent } from "@/components/RelatedContent";
import { ui } from "@/components/styles";
import { priceLabel, productLink } from "@/lib/affiliate";
import { getGoodsCategory, getProductBySlug, getPublicArticles, getPublicProducts } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublicProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/goods/items/[slug]">) {
  const { slug } = await params;
  const p = getProductBySlug(slug);
  if (!p) notFound();
  return pageMetadata({ title: `${p.name}の特徴・仕様`, description: p.summary, path: `/goods/items/${p.slug}/` });
}

export default async function ProductPage({ params }: PageProps<"/goods/items/[slug]">) {
  const { slug } = await params;
  const p = getProductBySlug(slug);
  const c = p && getGoodsCategory(p.categoryId);
  if (!p || !c) notFound();
  const link = productLink(p);
  const price = priceLabel(p);
  const articles = getPublicArticles().filter((a) => a.productIds.includes(p.id));
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "便利グッズ", href: "/goods/" }, { label: c.name, href: `/goods/category/${c.slug}/` }, { label: p.name }]} />
      {p.status !== "published" && <p className="rounded-lg bg-warn px-3 py-2 text-sm font-bold text-white">下書きです（確認前のため公開されていません。SHOW_DRAFTS=1 のときだけ表示）</p>}
      {link?.sponsored && (
        <p className="w-fit rounded border border-muted px-2 text-xs font-bold text-muted">
          PR　このページには広告（アフィリエイトリンク）が含まれます
        </p>
      )}
      <PageHeading title={p.name} lead={p.summary}>
        {p.brand && <p className="text-sm text-muted">ブランド：{p.brand}</p>}
      </PageHeading>
      <div className={`${ui.panel} flex flex-col gap-3 p-4 sm:p-5`}>
        {price && <p className="text-lg font-bold">{price}</p>}
        <p className={ui.note}>価格は確認した時点のものです。最新の価格は販売ページで確認してください。</p>
        {link && (
          <a href={link.href} rel={link.rel} target="_blank" className={`${ui.buttonPrimary} w-fit`}>
            {link.label}
          </a>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="flex flex-col gap-2">
          <h2 className={ui.h2}>良い点</h2>
          <ul className="list-disc pl-5 text-sm leading-relaxed">{p.pros.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
        <section className="flex flex-col gap-2">
          <h2 className={ui.h2}>気になる点</h2>
          <ul className="list-disc pl-5 text-sm leading-relaxed">{p.cons.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>
      </div>
      {Object.keys(p.specifications).length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className={ui.h2}>仕様</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {Object.entries(p.specifications).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <section className="flex flex-col gap-1 text-xs text-muted">
        {p.reviewedAt && (
          <p>
            仕様の確認：{p.reviewedAt.replaceAll("-", "/")}
            {p.reviewedBy && `（${p.reviewedBy}）`}
          </p>
        )}
        <p>仕様の出典：</p>
        <ul className="list-disc pl-5">
          {p.sourceUrls.map((u) => (
            <li key={u}>
              <a href={u} rel="noopener noreferrer" target="_blank" className="break-all underline">
                {u}
              </a>
            </li>
          ))}
        </ul>
        <p>
          <Link href="/disclosure/" className="underline">
            広告・PR表記について
          </Link>
        </p>
      </section>
      <RelatedContent articles={articles} title="この商品を紹介しているガイド" />
    </div>
  );
}
