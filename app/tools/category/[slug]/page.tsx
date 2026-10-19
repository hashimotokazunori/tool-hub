import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ToolCard } from "@/components/Cards";
import { EmptyState, PageHeading } from "@/components/PageHeading";
import { toolCategories } from "@/data/categories";
import { getToolCategoryBySlug, getToolsByCategory } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return toolCategories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tools/category/[slug]">) {
  const { slug } = await params;
  const c = getToolCategoryBySlug(slug);
  if (!c) notFound();
  const noTools = getToolsByCategory(c.id).length === 0;
  return pageMetadata({ title: `${c.name}の無料ツール`, description: `${c.description}。登録不要で使える${c.name}の無料ツールの一覧です。`, path: `/tools/category/${c.slug}/`, noindex: noTools });
}

export default async function ToolCategoryPage({ params }: PageProps<"/tools/category/[slug]">) {
  const { slug } = await params;
  const c = getToolCategoryBySlug(slug);
  if (!c) notFound();
  const list = getToolsByCategory(c.id);
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "無料Webツール", href: "/tools/" }, { label: c.name }]} />
      <PageHeading title={c.name} lead={c.description} />
      {list.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <ToolCard key={t.id} tool={t} />
          ))}
        </div>
      ) : (
        <EmptyState>このカテゴリのツールは準備中です。公開までお待ちください。</EmptyState>
      )}
    </div>
  );
}
