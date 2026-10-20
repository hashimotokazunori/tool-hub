import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";


export const alt = "ふるさと納税の返礼品ページの紹介画像";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const dynamic = "force-static";

export default function Image() {
  return renderOg({ title: "返礼品から選ぶふるさと納税", kind: "furusato", sub: "お肉・お米・海鮮・果物・日用品を、レビューの多い順に寄附額で絞り込めます。" });
}
