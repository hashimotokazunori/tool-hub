import { notFound } from "next/navigation";
import { RelatedContent } from "@/components/RelatedContent";
import { ToolLayout } from "@/components/ToolLayout";
import { getToolGuide } from "@/data/tool-guides";
import { hasToolComponent } from "@/features/tools/keys";
import { toolComponents } from "@/features/tools/registry";
import { getPublicTools, getRelatedForTool, getToolBySlug, getToolCategory } from "@/lib/content";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublicTools().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tools/[slug]">) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();
  return pageMetadata({ title: getToolGuide(slug)?.title ?? `${tool.name}（無料・登録不要）`, description: tool.description, path: `/tools/${tool.slug}/` });
}

export default async function ToolPage({ params }: PageProps<"/tools/[slug]">) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  const category = tool && getToolCategory(tool.categoryId);
  if (!tool || !category || !tool.componentKey || !hasToolComponent(tool.componentKey)) notFound();
  const Tool = toolComponents[tool.componentKey];
  const related = getRelatedForTool(tool);
  // Google 向けに「ブラウザで使える無料のWebアプリ」であることを伝える構造化データ
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description: tool.description,
    url: absoluteUrl(`/tools/${tool.slug}/`),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    inLanguage: "ja",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: 0, priceCurrency: "JPY" },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ToolLayout tool={tool} category={category} guide={getToolGuide(tool.slug)} related={<RelatedContent tools={related.tools} articles={related.articles} />}>
        <Tool />
      </ToolLayout>
    </>
  );
}
