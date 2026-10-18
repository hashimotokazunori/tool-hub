import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SolutionCard } from "@/components/Cards";
import { EmptyState, PageHeading } from "@/components/PageHeading";
import { getPublicArticles, getPublicTools } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "悩み別に探す", description: "困っていることから、使えるツール・便利グッズ・解決のヒントをまとめて探せます。", path: "/solutions/" });

export default function SolutionsPage() {
  const list = getPublicArticles("solution");
  const published = new Set(getPublicTools().map((t) => t.slug));
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "悩み別に探す" }]} />
      <PageHeading title="悩み別に探す" lead="当てはまる困りごとを選ぶと、解決のヒント・使えるツール・役立つ道具がまとめて見つかります。" />
      {list.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <SolutionCard key={a.id} article={a} toolCount={a.toolSlugs.filter((s) => published.has(s)).length} />
          ))}
        </div>
      ) : (
        <EmptyState>悩み別のガイドは内容を確認してから公開します。もうしばらくお待ちください。</EmptyState>
      )}
    </div>
  );
}
