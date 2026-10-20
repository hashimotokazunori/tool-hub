/**
 * /furusato/ の返礼品カテゴリ。
 *
 * genreId は楽天市場のジャンルIDで、楽天ふるさと納税の公式トップページ
 * （https://event.rakuten.co.jp/furusato/ ・2026-10-20 確認）にあるジャンル別の検索リンク
 * 「https://search.rakuten.co.jp/search/event/ふるさと納税/{ジャンルID}/?ev=40」と同じ値を使う。
 * 名前は楽天ウェブサービスのジャンル検索API（IchibaGenre/Search）でも確かめた。
 * お酒は広告の扱い（未成年への配慮）を確かめていないので載せない。
 */
export type FurusatoCategory = {
  id: "recommend" | "meat" | "rice" | "seafood" | "fruit" | "daily";
  label: string;
  /** 楽天市場のジャンルID。おすすめはジャンルで絞らない */
  genreId?: string;
};

export const FURUSATO_CATEGORIES: FurusatoCategory[] = [
  { id: "recommend", label: "おすすめ" },
  { id: "meat", label: "お肉", genreId: "100228" },
  { id: "rice", label: "お米", genreId: "110472" },
  { id: "seafood", label: "海鮮", genreId: "100236" },
  { id: "fruit", label: "果物", genreId: "100246" },
  { id: "daily", label: "日用品", genreId: "215783" },
];

/** 楽天ふるさと納税の公式サイトで、そのカテゴリを開くURL（データが取れないときの案内に使う） */
export function rakutenFurusatoSearchUrl(c: FurusatoCategory): string {
  return c.genreId ? `https://search.rakuten.co.jp/search/event/%E3%81%B5%E3%82%8B%E3%81%95%E3%81%A8%E7%B4%8D%E7%A8%8E/${c.genreId}/?ev=40` : "https://event.rakuten.co.jp/furusato/";
}
