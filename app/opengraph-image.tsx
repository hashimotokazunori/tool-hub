import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";
import { site } from "@/data/site";

export const alt = "ツールひろば";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const dynamic = "force-static";

export default function Image() {
  return renderOg({ title: "無料Webツールと便利グッズ", kind: "site", sub: site.description });
}
