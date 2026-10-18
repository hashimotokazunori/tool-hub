import { ArticleCard } from "@/components/Cards";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState, PageHeading } from "@/components/PageHeading";
import { getPublicArticles } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "特集・比較ガイド", description: "ツールの使い方、便利グッズの選び方・比較、困りごとの解決方法をまとめたガイド。", path: "/guides/" });

export default function GuidesPage() {
  const list = getPublicArticles("guide");
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "特集・比較ガイド" }]} />
      <PageHeading title="特集・比較ガイド" lead="ツールの使い方、商品の選び方と比較、活用のアイデアをまとめています。" />
      {list.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{list.map((a) => <ArticleCard key={a.id} article={a} />)}</div>
      ) : (
        <EmptyState>ガイドは内容を確認してから公開します。もうしばらくお待ちください。</EmptyState>
      )}
    </div>
  );
}
