import { notFound } from "next/navigation";
import { RelatedContent } from "@/components/RelatedContent";
import { ToolLayout } from "@/components/ToolLayout";
import { hasToolComponent } from "@/features/tools/keys";
import { toolComponents } from "@/features/tools/registry";
import { getPublicTools, getRelatedForTool, getToolBySlug, getToolCategory } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublicTools().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tools/[slug]">) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();
  return pageMetadata({ title: `${tool.name}（無料・登録不要）`, description: tool.description, path: `/tools/${tool.slug}/` });
}

export default async function ToolPage({ params }: PageProps<"/tools/[slug]">) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  const category = tool && getToolCategory(tool.categoryId);
  if (!tool || !category || !tool.componentKey || !hasToolComponent(tool.componentKey)) notFound();
  const Tool = toolComponents[tool.componentKey];
  const related = getRelatedForTool(tool);
  return (
    <ToolLayout tool={tool} category={category} related={<RelatedContent tools={related.tools} articles={related.articles} />}>
      <Tool />
    </ToolLayout>
  );
}
