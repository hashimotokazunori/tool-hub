import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export const dynamic = "force-static";

/** スマホの「ホーム画面に追加」で、アプリのように開けるようにする */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name}｜無料Webツール`,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f7fb",
    theme_color: "#4f46e5",
    lang: "ja",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
