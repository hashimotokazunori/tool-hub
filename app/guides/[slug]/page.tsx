import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/ArticlePage";
import { getArticleBySlug, getPublicArticles } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublicArticles("guide").map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  const a = getArticleBySlug("guide", slug);
  if (!a) notFound();
  return pageMetadata({ title: a.title, description: a.description, path: `/guides/${a.slug}/`, noindex: a.status !== "published" });
}

export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  const a = getArticleBySlug("guide", slug);
  if (!a) notFound();
  return <ArticlePage article={a} section={{ label: "特集・比較ガイド", href: "/guides/" }} />;
}
