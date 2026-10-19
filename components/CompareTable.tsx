"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ui } from "./styles";

export type CompareRow = {
  slug: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  minPrice?: number;
  reviewAverage?: number;
  reviewCount?: number;
  itemCount?: number;
  specs: Record<string, string>;
};

type SortKey = "recommended" | "price" | "rating" | "reviews";
const SORTS: [SortKey, string][] = [
  ["recommended", "おすすめ順"],
  ["price", "価格の安い順"],
  ["rating", "評価の高い順"],
  ["reviews", "レビューの多い順"],
];
const yen = (n: number) => `${n.toLocaleString("ja-JP")}円`;

/** カテゴリの商品を、価格.comの一覧のように並べ替え・選んで比較する表 */
export function CompareTable({ rows }: { rows: CompareRow[] }) {
  const [sort, setSort] = useState<SortKey>("recommended");
  const [picked, setPicked] = useState<string[]>([]);
  const sorted = useMemo(() => {
    const a = [...rows];
    // 値がない商品はいつも後ろ
    const by = (f: (r: CompareRow) => number | undefined, asc: boolean) => a.sort((x, y) => (f(x) === undefined ? 1 : f(y) === undefined ? -1 : asc ? f(x)! - f(y)! : f(y)! - f(x)!));
    if (sort === "price") by((r) => r.minPrice, true);
    if (sort === "rating") by((r) => (r.reviewCount ? r.reviewAverage : undefined), false);
    if (sort === "reviews") by((r) => r.reviewCount || undefined, false);
    return a;
  }, [rows, sort]);
  const chosen = rows.filter((r) => picked.includes(r.slug));
  const specKeys = [...new Set(chosen.flatMap((r) => Object.keys(r.specs)))];
  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : p.length >= 4 ? p : [...p, slug]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted">並べ替え</span>
        {SORTS.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setSort(k)} aria-pressed={sort === k} className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${sort === k ? "border-transparent bg-gradient-to-r from-accent to-accent-2 text-accent-ink" : "border-line bg-panel hover:border-accent/50"}`}>
            {l}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted">{rows.length}件</span>
      </div>
      <ol className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel shadow-card">
        {sorted.map((r, i) => (
          <li key={r.slug} className="grid grid-cols-[auto_4.5rem_1fr] items-center gap-3 p-3 sm:grid-cols-[auto_5.5rem_1fr_auto] sm:gap-4 sm:p-4">
            <label className="flex flex-col items-center gap-1 text-[10px] text-muted">
              <input type="checkbox" className="h-4 w-4 accent-accent" checked={picked.includes(r.slug)} onChange={() => toggle(r.slug)} disabled={!picked.includes(r.slug) && picked.length >= 4} aria-label={`${r.name}を比較に入れる`} />
              比較
            </label>
            <Link href={`/goods/items/${r.slug}/`} className="grid aspect-square place-items-center overflow-hidden rounded-xl border border-line bg-white" tabIndex={-1} aria-hidden="true">
              {r.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.imageUrl} alt="" className="h-full w-full object-contain p-1.5" loading="lazy" />
              ) : (
                <span className="text-[10px] text-muted">写真なし</span>
              )}
            </Link>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="flex items-center gap-2 text-[11px] text-muted">
                {sort !== "recommended" && <b className="font-mono text-accent">{i + 1}位</b>}
                {r.brand}
              </span>
              <Link href={`/goods/items/${r.slug}/`} className="line-clamp-2 text-[15px] font-bold leading-snug text-ink no-underline hover:underline">
                {r.name}
              </Link>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                {r.reviewCount ? (
                  <span>
                    <span className="text-amber-400">★</span> <b>{r.reviewAverage!.toFixed(2)}</b> <span className="text-muted">({r.reviewCount}件)</span>
                  </span>
                ) : (
                  <span className="text-muted">レビューなし</span>
                )}
                {r.itemCount !== undefined && <span className="text-muted">出品 {r.itemCount}件</span>}
              </span>
              <span className="sm:hidden">{r.minPrice ? <b className="text-lg text-warn tabular-nums">{yen(r.minPrice)}〜</b> : <span className="text-xs text-muted">価格は準備中</span>}</span>
            </div>
            <div className="hidden flex-col items-end gap-1 sm:flex">
              {r.minPrice ? (
                <>
                  <span className="text-[11px] text-muted">最安価格</span>
                  <b className="text-xl font-extrabold text-warn tabular-nums">{yen(r.minPrice)}</b>
                </>
              ) : (
                <span className="text-xs text-muted">価格は準備中</span>
              )}
              <Link href={`/goods/items/${r.slug}/`} className={`${ui.button} px-3 py-1 text-xs`}>
                価格を比較
              </Link>
            </div>
          </li>
        ))}
      </ol>
      {chosen.length >= 2 && (
        <section className="flex flex-col gap-2" aria-live="polite">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold">選んだ{chosen.length}商品の比較</h3>
            <button type="button" className={`${ui.button} px-3 py-1 text-xs`} onClick={() => setPicked([])}>
              選択を解除
            </button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-line bg-panel shadow-card">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="bg-field">
                  <th className="w-28 px-3 py-2 text-left text-xs font-medium text-muted" />
                  {chosen.map((r) => (
                    <th key={r.slug} className="px-3 py-2 text-left align-top text-[13px] font-bold">
                      {r.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-line">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted">最安価格</th>
                  {chosen.map((r) => (
                    <td key={r.slug} className="px-3 py-2 font-bold text-warn tabular-nums">
                      {r.minPrice ? yen(r.minPrice) : "—"}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-line">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted">評価</th>
                  {chosen.map((r) => (
                    <td key={r.slug} className="px-3 py-2">
                      {r.reviewCount ? `★${r.reviewAverage!.toFixed(2)}（${r.reviewCount}件）` : "—"}
                    </td>
                  ))}
                </tr>
                {specKeys.map((k) => (
                  <tr key={k} className="border-t border-line">
                    <th className="px-3 py-2 text-left align-top text-xs font-semibold text-muted">{k}</th>
                    {chosen.map((r) => (
                      <td key={r.slug} className="px-3 py-2 align-top">
                        {r.specs[k] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {picked.length === 1 && <p className={ui.note}>もう1つ以上選ぶと、スペックを横に並べて比べられます（4つまで）。</p>}
    </div>
  );
}
