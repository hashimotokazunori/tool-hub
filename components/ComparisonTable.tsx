import Link from "next/link";
import { priceLabel } from "@/lib/affiliate";
import type { Product } from "@/lib/types";

/**
 * 商品の比較表。比べる項目（specKeys）は記事ごとにそろえて指定する。
 * 値が無い項目は「—」と表示し、推測で埋めない。
 */
export function ComparisonTable({ products, specKeys, caption }: { products: Product[]; specKeys: string[]; caption: string }) {
  if (products.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <caption className="px-3 py-2 text-left text-xs text-muted">{caption}</caption>
        <thead className="bg-field">
          <tr>
            <th className="px-3 py-2 text-left">商品</th>
            <th className="px-3 py-2 text-left">価格</th>
            {specKeys.map((k) => (
              <th key={k} className="px-3 py-2 text-left">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t border-line">
              <td className="px-3 py-2">
                <Link href={`/goods/items/${p.slug}/`} className="text-accent underline">
                  {p.name}
                </Link>
              </td>
              <td className="px-3 py-2 tabular-nums">{priceLabel(p) ?? "—"}</td>
              {specKeys.map((k) => (
                <td key={k} className="px-3 py-2">
                  {p.specifications[k] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
