import { ArticleCard } from "@/components/Cards";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState, PageHeading } from "@/components/PageHeading";
import { getPublicArticles } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "悩み別に探す", description: "困っていることから、使えるツール・便利グッズ・解決のヒントをまとめて探せます。", path: "/solutions/" });

export default function SolutionsPage() {
  const list = getPublicArticles("solution");
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "悩み別に探す" }]} />
      <PageHeading title="悩み別に探す" lead="困りごとから、解決のヒントと使えるツール・便利グッズを探せます。" />
      {list.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">{list.map((a) => <ArticleCard key={a.id} article={a} />)}</div>
      ) : (
        <EmptyState>悩み別のガイドは内容を確認してから公開します。もうしばらくお待ちください。</EmptyState>
      )}
    </div>
  );
}
