import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductCard } from "@/components/Cards";
import { Icon } from "@/components/icons";
import { PageHeading } from "@/components/PageHeading";
import { Section } from "@/components/Section";
import { ui } from "@/components/styles";
import { goodsCategories } from "@/data/categories";
import { BUDGETS, inBudget, salePhase, sales } from "@/data/sales";
import { getProductsByCategory, getPublicProducts, sortCategories } from "@/lib/content";
import { withImages } from "@/lib/rakuten";
import { pageMetadata } from "@/lib/seo";
import type { Product } from "@/lib/types";

export const metadata = pageMetadata({
  title: "ブラックフライデー・年末セールで買う候補",
  description: "楽天・Amazon のブラックフライデーや年末のセールに向けて、便利グッズを予算別・ジャンル別にまとめました。価格は楽天市場の今の最安値（定期的に自動更新）です。",
  path: "/sale/",
});

/** 楽天の価格と、セールの開催前・中・後の表示を取り直す間隔（秒） */
export const revalidate = 21600;

const PHASE_LABEL = { unannounced: "日程は未発表", before: "開催前", during: "開催中", after: "終了" } as const;
const fmt = (iso: string) => new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });

/** 楽天の特設ページへのアフィリエイトリンク（ID がないときは普通のリンク） */
function rakutenLink(url: string): string {
  const id = process.env.RAKUTEN_AFFILIATE_ID?.trim();
  return id ? `https://hb.afl.rakuten.co.jp/hgc/${id}/?pc=${encodeURIComponent(url)}&m=${encodeURIComponent(url)}` : url;
}

const pill = "rounded-full border border-line bg-panel px-3 py-1.5 text-sm font-semibold text-ink no-underline shadow-card";

export default async function SalePage() {
  const { products, market } = await withImages(getPublicProducts());
  const now = new Date();
  // 楽天の今の最安値（取れなければ公式で確認した価格）で予算に分ける
  const priceOf = (p: Product) => market.get(p.id)?.minPrice ?? p.price;
  const priced = products.filter((p) => priceOf(p) !== undefined).sort((a, b) => (priceOf(a) ?? 0) - (priceOf(b) ?? 0));
  const checkedAt = [...market.values()].map((m) => m.fetchedAt).sort().pop();

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <Breadcrumbs items={[{ label: "便利グッズ", href: "/goods/" }, { label: "セールで買う候補" }]} />
        <p className="w-fit rounded border border-muted px-2 text-xs font-bold text-muted">PR　このページには広告（アフィリエイトリンク）が含まれます</p>
        <PageHeading title="ブラックフライデー・年末セールで買う候補" lead="セールの前に、欲しい物のふだんの値段を知っておくと、本当にお得かを見分けやすくなります。便利グッズを予算別・ジャンル別にまとめました。" />
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="sale-schedule">
        <h2 id="sale-schedule" className={ui.h2}>
          セールの日程
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sales.map((s) => {
            const phase = salePhase(s, now);
            return (
              <li key={s.id} className={`${ui.panel} flex flex-col gap-1.5 p-4`}>
                <span className="flex items-center justify-between gap-2">
                  <b>{s.name}</b>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${phase === "during" ? "bg-red-600 text-white" : "bg-field text-muted"}`}>{PHASE_LABEL[phase]}</span>
                </span>
                {s.start && s.end ? (
                  <span className="text-sm tabular-nums">
                    {fmt(s.start)} 〜 {fmt(s.end)}
                  </span>
                ) : (
                  <span className="text-sm text-muted">今年の日程はまだ発表されていません。発表され次第、ここに載せます。</span>
                )}
                {s.officialUrl && phase !== "after" && (
                  <a href={s.store === "楽天市場" ? rakutenLink(s.officialUrl) : s.officialUrl} target="_blank" rel="sponsored noopener" className="text-sm font-semibold text-accent underline">
                    {s.store}の特設ページを見る（PR）
                  </a>
                )}
                {s.sourceUrl && (
                  <span className="text-[11px] text-muted">
                    出典：
                    <a href={s.sourceUrl} className="underline" target="_blank" rel="noopener">
                      公式の発表
                    </a>
                    {s.checkedAt && `（${s.checkedAt} 確認）`}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <nav aria-label="予算で探す" className="flex flex-wrap gap-2">
        {BUDGETS.map((b) => (
          <a key={b.id} href={`#${b.id}`} className={pill}>
            {b.label}
          </a>
        ))}
        <a href="#furusato" className={pill}>
          ふるさと納税
        </a>
      </nav>

      {BUDGETS.map((b) => {
        const list = priced.filter((p) => inBudget(priceOf(p) ?? 0, b));
        if (list.length === 0) return null;
        return (
          <Section key={b.id} id={b.id} eyebrow="Budget" icon="bag" tone="goods" title={`${b.label}で買える物`}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} market={market.get(p.id)} />
              ))}
            </div>
          </Section>
        );
      })}

      <Section eyebrow="Categories" icon="bag" tone="goods" title="ジャンルから探す">
        <div className="flex flex-wrap gap-2">
          {sortCategories(goodsCategories).map((c) => (
            <Link key={c.id} href={`/goods/category/${c.slug}/`} className={pill}>
              {c.name}（{getProductsByCategory(c.id).length}）
            </Link>
          ))}
        </div>
      </Section>

      <section id="furusato" className={`${ui.panel} flex scroll-mt-24 flex-col gap-2 p-5`}>
        <h2 className={ui.h2}>年末はふるさと納税も</h2>
        <p className="text-sm leading-relaxed text-muted">ふるさと納税は12月31日までの寄附がその年の分になります。上限の目安を出してから、残りの枠で返礼品を選ぶと安心です。</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href="/tools/furusato-limit/" className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white no-underline">
            控除上限を計算する <Icon name="arrow" size={14} />
          </Link>
          <Link href="/furusato/" className={pill}>
            返礼品を見る
          </Link>
          <Link href="/solutions/furusato-deadline/" className={pill}>
            年末に気をつけること
          </Link>
        </div>
      </section>

      <p className={ui.note}>
        価格は楽天市場で今いちばん安い出品の値段で
        {checkedAt ? `（${new Date(checkedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })} 時点）` : ""}
        、セール価格や割引率ではありません。値段は変わるので、買う前に販売ページで確かめてください。
        <Link href="/disclosure/" className="text-accent underline">
          広告・PR表記
        </Link>
      </p>
    </div>
  );
}
