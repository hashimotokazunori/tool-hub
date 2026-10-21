import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GuideFeature, GuideRow } from "@/components/Cards";
import { EmptyState, PageHeading } from "@/components/PageHeading";
import { getPublicArticles } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "特集・比較ガイド", description: "ツールの使い方、便利グッズの選び方・比較、困りごとの解決方法をまとめたガイド。", path: "/guides/" });

export default function GuidesPage() {
  const [featured, ...rest] = getPublicArticles("guide");
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "特集・比較ガイド" }]} />
      <PageHeading title="特集・比較ガイド" lead="ツールの使い方、商品の選び方と比較、活用のアイデアをまとめています。記事は公式情報をもとにまとめ、更新日と出典を載せています。誤りが含まれる場合もあるため、大切なことは出典の公式情報で確かめてください。" />
      {featured ? (
        <>
          <GuideFeature article={featured} />
          {rest.length > 0 && (
            <div className="flex flex-col">
              {rest.map((a) => (
                <GuideRow key={a.id} article={a} />
              ))}
            </div>
          )}
        </>
      ) : (
        <EmptyState>ガイドは内容を確認してから公開します。もうしばらくお待ちください。</EmptyState>
      )}
    </div>
  );
}
