import { buildSearchIndex } from "@/lib/search-index";

export const dynamic = "force-static";

/**
 * サイト内検索の索引を /search-index.json として書き出す。
 * 前は全ページの HTML に索引を丸ごと入れていたが（トップページは2回分）、ページが重くなるので、
 * 検索窓を触ったときにだけこのファイルを読み込む。
 */
export function GET() {
  return Response.json(buildSearchIndex());
}
