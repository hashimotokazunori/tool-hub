import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";
import { getPublicTools, getToolBySlug } from "@/lib/content";

export const alt = "ツールの紹介画像";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const dynamic = "force-static";

export function generateStaticParams() {
  return getPublicTools().map((t) => ({ slug: t.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const tool = getToolBySlug((await params).slug);
  return renderOg({ title: tool?.name ?? "無料ツール", kind: "tool", sub: tool?.description });
}
