import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";
import { getProductBySlug, getPublicProducts } from "@/lib/content";

export const alt = "便利グッズの紹介画像";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const dynamic = "force-static";

export function generateStaticParams() {
  return getPublicProducts().map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProductBySlug((await params).slug);
  return renderOg({ title: p?.name ?? "便利グッズ", kind: "goods", sub: p?.summary });
}
