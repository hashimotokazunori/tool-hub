import type { Metadata } from "next";
import { site } from "@/data/site";

/** ページごとのメタデータを組み立てる。title はルートの template で「| サイト名」が付く */
export function pageMetadata({ title, description, path, noindex }: { title: string; description: string; path: string; noindex?: boolean }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${site.name}`,
      description,
      url: path,
      siteName: site.name,
      locale: site.locale,
      type: "website",
      // ページ専用の opengraph-image.tsx があるページでは、そちらが優先される。ないページはサイト共通の画像
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: site.name }],
    },
    robots: noindex ? { index: false, follow: true } : undefined,
  };
}

export const absoluteUrl = (path: string) => new URL(path, site.url).toString();
