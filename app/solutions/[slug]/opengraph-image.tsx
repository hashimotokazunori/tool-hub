import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";
import { getArticleBySlug, getPublicArticles } from "@/lib/content";

export const alt = "記事の紹介画像";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const dynamic = "force-static";

export function generateStaticParams() {
  return getPublicArticles("solution").map((a) => ({ slug: a.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const a = getArticleBySlug("solution", (await params).slug);
  return renderOg({ title: a?.title ?? "悩み別ガイド", kind: "solution", sub: a?.description });
}
