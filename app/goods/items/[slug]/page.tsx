import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { OfferTable, PriceSummary, ProductImage, RakutenCredit, Stars } from "@/components/Market";
import { RelatedContent } from "@/components/RelatedContent";
import { Icon } from "@/components/icons";
import { ui } from "@/components/styles";
import { priceLabel, productLink } from "@/lib/affiliate";
import { getGoodsCategory, getProductBySlug, getPublicArticles, getPublicProducts } from "@/lib/content";
import { getMarketData, hasImage, marketEnabled } from "@/lib/rakuten";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;
/** 楽天の価格を取り直す間隔（秒）。lib/rakuten.ts の MARKET_REVALIDATE と同じ値 */
export const revalidate = 21600;

export function generateStaticParams() {
  return getPublicProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/goods/items/[slug]">) {
  const { slug } = await params;
  const p = getProductBySlug(slug);
  if (!p) notFound();
  // 画像のない商品は検索に出さない（一覧にも載せない）
  const noImage = marketEnabled() && !hasImage(p, await getMarketData(p));
  return pageMetadata({ title: p.market ? `${p.name}の最安価格・特徴・仕様` : `${p.name}の特徴・料金・できること`, description: p.summary, path: `/goods/items/${p.slug}/`, noindex: noImage });
}

export default async function ProductPage({ params }: PageProps<"/goods/items/[slug]">) {
  const { slug } = await params;
  const p = getProductBySlug(slug);
  const c = p && getGoodsCategory(p.categoryId);
  if (!p || !c) notFound();
  const link = productLink(p);
  const price = priceLabel(p);
  const market = await getMarketData(p);
  const articles = getPublicArticles().filter((a) => a.productIds.includes(p.id));
  return (
    <div className="flex flex-col gap-8">
      <Breadcrumbs items={[{ label: "便利グッズ", href: "/goods/" }, { label: c.name, href: `/goods/category/${c.slug}/` }, { label: p.name }]} />
      {p.status !== "published" && <p className="rounded-lg bg-warn px-3 py-2 text-sm font-bold text-white">下書きです（確認前のため公開されていません。SHOW_DRAFTS=1 のときだけ表示）</p>}
      <div className="grid gap-6 md:grid-cols-[minmax(0,22rem)_1fr]">
        <ProductImage product={p} market={market} className="mx-auto aspect-square w-full max-w-72 rounded-3xl border border-line shadow-card md:max-w-none" />
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-goods-soft px-2.5 py-1 font-semibold text-goods">{c.name}</span>
            {(market || link?.sponsored) && <span className="rounded border border-muted/50 px-1.5 font-bold text-muted">PR</span>}
          </div>
          {p.brand && <p className="text-sm text-muted">{p.brand}</p>}
          <h1 className={ui.h1}>{p.name}</h1>
          {market && <Stars value={market.reviewAverage} count={market.reviewCount} size={16} />}
          <p className={ui.lead}>{p.summary}</p>
          <div className="flex flex-wrap gap-1.5">
            {p.features.map((f) => (
              <span key={f} className="rounded-full bg-field px-2.5 py-1 text-xs ring-1 ring-line">
                {f}
              </span>
            ))}
          </div>
          {p.market && <PriceSummary market={market} />}
          {!market && (price || link) && (
            <div className="flex flex-wrap items-center gap-3">
              {price && <p className="text-sm font-bold">参考価格：{price}</p>}
              {link && (
                <a href={link.href} rel={link.rel} target="_blank" className={ui.button}>
                  {link.label}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      {market && market.offers.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className={ui.h2}>ショップ別の価格</h2>
            <span className="text-xs text-muted">安い順・型番が一致した商品だけ</span>
          </div>
          <OfferTable market={market} />
          <p className={ui.note}>
            同じ型番の商品を楽天市場から探して、安い順に並べています（中古・互換品は除いています）。セット品や色違いが含まれることがあるため、購入前に商品名を確かめてください。 <RakutenCredit />
          </p>
        </section>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <section className={`${ui.panel} flex flex-col gap-2 p-5`}>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-ok/15 text-ok">
              <Icon name="check" size={16} />
            </span>
            良い点
          </h2>
          <ul className="flex flex-col gap-1.5 text-sm leading-relaxed">
            {p.pros.map((x) => (
              <li key={x} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ok" aria-hidden="true" />
                {x}
              </li>
            ))}
          </ul>
        </section>
        <section className={`${ui.panel} flex flex-col gap-2 p-5`}>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-warn/15 text-warn font-bold">!</span>
            気になる点
          </h2>
          <ul className="flex flex-col gap-1.5 text-sm leading-relaxed">
            {p.cons.map((x) => (
              <li key={x} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" aria-hidden="true" />
                {x}
              </li>
            ))}
          </ul>
        </section>
      </div>
      {Object.keys(p.specifications).length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className={ui.h2}>スペック</h2>
          <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-card">
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(p.specifications).map(([k, v]) => (
                  <tr key={k} className="border-t border-line first:border-t-0">
                    <th scope="row" className="w-36 bg-field px-4 py-2.5 text-left align-top text-xs font-semibold text-muted sm:w-48">
                      {k}
                    </th>
                    <td className="px-4 py-2.5">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {market && market.specs.length > 0 && (
            <details className="rounded-2xl border border-line bg-panel px-4 py-3 text-sm">
              <summary className="cursor-pointer font-semibold">楽天市場の製品情報（{market.specs.length}項目）</summary>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                {market.specs.map((d) => (
                  <div key={d.name} className="contents">
                    <dt className="text-muted">{d.name}</dt>
                    <dd>{d.value}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
        </section>
      )}
      <section className="flex flex-col gap-1 text-xs text-muted">
        {p.reviewedAt && (
          <p>
            仕様を調べた日：{p.reviewedAt.replaceAll("-", "/")}（最新の仕様・価格は、購入前に公式ページで確かめてください）
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
