import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageHeading } from "@/components/PageHeading";
import { ui } from "@/components/styles";
import { goodsCategories } from "@/data/categories";
import { getProductsByCategory, sortCategories } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "便利グッズ",
  description: "デスク・スマホ周辺機器・家事・旅行・文房具など、暮らしと仕事を便利にするアイテムの選び方と比較。",
  path: "/goods/",
});

export default function GoodsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "便利グッズ" }]} />
      <PageHeading title="便利グッズ" lead="困りごと別に、暮らしと仕事を便利にするアイテムの選び方と、確認した商品を紹介します。" />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {sortCategories(goodsCategories).map((c) => (
          <Link key={c.id} href={`/goods/category/${c.slug}/`} className={`${ui.card} py-4`}>
            <b>{c.name}</b>
            <span className="text-xs text-muted">{c.description}</span>
            <span className="mt-1 text-xs text-muted">掲載商品 {getProductsByCategory(c.id).length} 件</span>
          </Link>
        ))}
      </div>
      <p className={ui.note}>
        商品の紹介には広告・アフィリエイトを含むことがあります。詳しくは
        <Link href="/disclosure/" className="text-accent underline">
          広告・PR表記
        </Link>
        をご覧ください。
      </p>
    </div>
  );
}
