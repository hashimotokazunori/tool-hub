import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GoodsCategoryCard, ProductCard } from "@/components/Cards";
import { PageHeading } from "@/components/PageHeading";
import { Section } from "@/components/Section";
import { ui } from "@/components/styles";
import { goodsCategories } from "@/data/categories";
import { getBuyingGuides, getProductsByCategory, getPublicProducts, sortCategories } from "@/lib/content";
import { withImages } from "@/lib/rakuten";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "便利グッズ",
  description: "デスク・スマホ周辺機器・家事・旅行・文房具など、暮らしと仕事を便利にするアイテムの選び方と比較。",
  path: "/goods/",
});

/** 楽天の価格を取り直す間隔（秒） */
export const revalidate = 21600;

export default async function GoodsPage() {
  // 画像のない商品は載せない
  const { products, market } = await withImages(getPublicProducts());
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <Breadcrumbs items={[{ label: "便利グッズ" }]} />
        <PageHeading title="便利グッズ" lead="困りごと別に、暮らしと仕事を便利にするアイテムを紹介します。仕様と価格は出典と確認日を記録して掲載しています。" />
      </div>
      <Section eyebrow="Categories" icon="bag" tone="goods" title="ジャンルから探す">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {sortCategories(goodsCategories).map((c) => (
            <GoodsCategoryCard key={c.id} category={c} examples={c.description.split("、")} count={getProductsByCategory(c.id).length + getBuyingGuides(c.id).length} />
          ))}
        </div>
      </Section>
      {products.length > 0 && (
        <Section eyebrow="Items" icon="bag" tone="goods" title="掲載中の商品">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} market={market.get(p.id)} />
            ))}
          </div>
        </Section>
      )}
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
