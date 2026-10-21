import type { MarketData } from "@/lib/rakuten";
import type { Product } from "@/lib/types";
import { goodsCategoryIcon, Icon } from "./icons";
import { ui } from "./styles";

export const yenText = (n: number) => `${n.toLocaleString("ja-JP")}円`;

/** 取得日時（日本時間）の表示 */
export function fetchedLabel(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** ★の評価。半分の星も描く */
export function Stars({
  value,
  count,
  size = 14,
}: {
  value?: number;
  count?: number;
  size?: number;
}) {
  if (!value || !count)
    return <span className="text-xs text-muted">レビューなし</span>;
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs"
      aria-label={`評価 ${value.toFixed(2)}（${count}件）`}
    >
      <span
        className="relative inline-block leading-none tracking-[0.1em]"
        style={{ fontSize: size }}
        aria-hidden="true"
      >
        <span className="text-line">★★★★★</span>
        <span
          className="absolute inset-0 overflow-hidden whitespace-nowrap text-amber-400"
          style={{ width: `${pct}%` }}
        >
          ★★★★★
        </span>
      </span>
      <b className="font-semibold">{value.toFixed(2)}</b>
      <span className="text-muted">({count.toLocaleString("ja-JP")}件)</span>
    </span>
  );
}

/** 商品写真。楽天の写真がなければカテゴリのアイコン */
export function ProductImage({
  product,
  market,
  className = "",
}: {
  product: Product;
  market?: MarketData | null;
  className?: string;
}) {
  const src = market?.imageUrl ?? product.imageUrl;
  return (
    <span
      className={`relative grid place-items-center overflow-hidden bg-white ${className}`}
    >
      {src ? (
        // 楽天ウェブサービスの商品画像（規約に従い、商品ページへのリンクと一緒に表示する）
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={product.name}
          className="absolute inset-0 h-full w-full object-contain p-3"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <span className="grid h-full w-full place-items-center bg-gradient-to-br from-goods-soft to-panel text-goods">
          <Icon
            name={goodsCategoryIcon[product.categoryId] ?? "bag"}
            size={48}
          />
        </span>
      )}
    </span>
  );
}

/** 最安値の表示（カード用の小さい版） */
export function MinPrice({ market }: { market?: MarketData | null }) {
  if (!market?.minPrice)
    return <span className="text-xs text-muted">価格は準備中</span>;
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-[11px] font-semibold text-muted">最安</span>
      <b className="text-lg font-extrabold tracking-tight text-warn tabular-nums">
        {yenText(market.minPrice)}
      </b>
    </span>
  );
}

/** 楽天ウェブサービスのクレジット表示（利用規約で求められている） */
export function RakutenCredit() {
  return (
    <a
      href="https://developers.rakuten.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="text-[11px] text-muted underline-offset-2 hover:underline"
    >
      Supported by Rakuten Developers
    </a>
  );
}

/** 商品ページ上部の価格の要約 */
export function PriceSummary({ market }: { market: MarketData | null }) {
  if (!market?.minPrice)
    return (
      <div className="rounded-2xl border border-dashed border-line bg-field/60 p-4 text-sm text-muted">
        価格情報は準備中です。各ショップの価格を自動で比べられるようになるまで、もうしばらくお待ちください。
      </div>
    );
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-gradient-to-br from-goods-soft/70 to-panel p-4 sm:p-5">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
        <span className="flex flex-col">
          <span className="text-xs font-semibold text-muted">
            最安価格（税込）
          </span>
          <b className="text-[clamp(1.8rem,5vw,2.4rem)] leading-none font-extrabold tracking-tight text-warn tabular-nums">
            {yenText(market.minPrice)}
          </b>
        </span>
        {market.maxPrice && market.maxPrice > market.minPrice && (
          <span className="pb-1 text-sm text-muted">
            〜 {yenText(market.maxPrice)}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        {market.itemCount !== undefined && (
          <span>
            楽天市場の出品 {market.itemCount.toLocaleString("ja-JP")}件
          </span>
        )}
        {market.averagePrice && (
          <span>平均 {yenText(Math.round(market.averagePrice))}</span>
        )}
        <Stars value={market.reviewAverage} count={market.reviewCount} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {market.offers[0] && (
          <a
            href={market.offers[0].url}
            rel="sponsored noopener noreferrer"
            target="_blank"
            className={ui.buttonPrimary}
          >
            最安のショップを見る
          </a>
        )}
        {market.productUrl && (
          <a
            href={market.productUrl}
            rel="sponsored noopener noreferrer"
            target="_blank"
            className={ui.button}
          >
            楽天市場ですべての価格を見る
          </a>
        )}
      </div>
      <p className={ui.note}>
        {fetchedLabel(market.fetchedAt)}{" "}
        時点の楽天市場の価格です。価格・在庫・送料は変わることがあるため、購入前に販売ページで確認してください。{" "}
        <RakutenCredit />
      </p>
    </div>
  );
}

/** ショップ別の価格の表（安い順） */
export function OfferTable({ market }: { market: MarketData }) {
  if (market.offers.length === 0) return null;
  const min = market.offers[0].price;
  return (
    <>
      {/* スマホ：1店舗1枚のカード */}
      <ol className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel shadow-card sm:hidden">
        {market.offers.map((o, i) => (
          <li key={o.url} className="flex items-center gap-3 p-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-1.5">
                {i === 0 && (
                  <span className="shrink-0 rounded-full bg-warn px-1.5 py-0.5 text-[10px] font-bold text-white">
                    最安
                  </span>
                )}
                <b className="truncate text-sm">{o.shopName}</b>
              </span>
              <b
                className={`text-lg tabular-nums ${i === 0 ? "text-warn" : ""}`}
              >
                {yenText(o.price)}
              </b>
              <span className="flex flex-wrap gap-x-2 text-[11px]">
                {o.postageIncluded ? (
                  <span className="font-semibold text-ok">送料込み</span>
                ) : (
                  <span className="text-muted">送料別</span>
                )}
                {o.pointRate > 1 && (
                  <span className="font-semibold text-goods">
                    ポイント{o.pointRate}倍
                  </span>
                )}
                <Stars
                  value={o.reviewAverage}
                  count={o.reviewCount}
                  size={11}
                />
              </span>
            </div>
            <a
              href={o.url}
              rel="sponsored noopener noreferrer"
              target="_blank"
              className={`${ui.button} shrink-0 px-3 py-1.5 text-xs`}
            >
              ショップへ
            </a>
          </li>
        ))}
      </ol>
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-panel shadow-card sm:block">
        <table className="w-full min-w-[34rem] text-sm">
          <thead className="bg-field text-left text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">ショップ</th>
              <th className="px-3 py-2 text-right font-medium">価格（税込）</th>
              <th className="px-3 py-2 font-medium">送料</th>
              <th className="px-3 py-2 font-medium">ポイント</th>
              <th className="px-3 py-2 font-medium">ショップの評価</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {market.offers.map((o, i) => (
              <tr key={o.url} className="border-t border-line align-middle">
                <td className="max-w-[16rem] px-3 py-2.5">
                  <span className="flex items-center gap-2">
                    {i === 0 && (
                      <span className="shrink-0 rounded-full bg-warn px-2 py-0.5 text-[10px] font-bold text-white">
                        最安
                      </span>
                    )}
                    <span className="flex min-w-0 flex-col">
                      <b className="truncate">{o.shopName}</b>
                      <span
                        className="truncate text-[11px] text-muted"
                        title={o.itemName}
                      >
                        {o.itemName}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  <b
                    className={`text-base tabular-nums ${i === 0 ? "text-warn" : ""}`}
                  >
                    {yenText(o.price)}
                  </b>
                  {o.price > min && (
                    <span className="block text-[11px] text-muted">
                      +{yenText(o.price - min)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                  {o.postageIncluded ? (
                    <span className="font-semibold text-ok">送料込み</span>
                  ) : (
                    <span className="text-muted">送料別</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                  {o.pointRate > 1 ? (
                    <span className="font-semibold text-goods">
                      {o.pointRate}倍
                    </span>
                  ) : (
                    <span className="text-muted">通常</span>
                  )}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <Stars
                    value={o.reviewAverage}
                    count={o.reviewCount}
                    size={12}
                  />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <a
                    href={o.url}
                    rel="sponsored noopener noreferrer"
                    target="_blank"
                    className={`${ui.button} px-3 py-1.5 text-xs whitespace-nowrap`}
                  >
                    ショップへ
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
