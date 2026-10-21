import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/ArticlePage";
import { getArticleBySlug, getPublicArticles } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;
/** 紹介している商品の楽天の価格を取り直す間隔（秒） */
export const revalidate = 21600;

export function generateStaticParams() {
  return getPublicArticles("solution").map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/solutions/[slug]">) {
  const { slug } = await params;
  const a = getArticleBySlug("solution", slug);
  if (!a) notFound();
  return pageMetadata({ title: a.seoTitle ?? `${a.title}ときの解決策`, description: a.description, path: `/solutions/${a.slug}/`, noindex: a.status !== "published" });
}

export default async function SolutionPage({ params }: PageProps<"/solutions/[slug]">) {
  const { slug } = await params;
  const a = getArticleBySlug("solution", slug);
  if (!a) notFound();
  return <ArticlePage article={a} section={{ label: "悩み別に探す", href: "/solutions/" }} />;
}
