/**
 * /furusato/ のシートで、返礼品ごとに「ほかのサイトでこの自治体の返礼品を見る」リンクを作る。
 *
 * A8.net の「商品リンク作成 → フリー素材生成」で作ったリンクの形（2026-10-20 に確認）
 *   https://px.a8.net/svt/ejp?a8mat=<素材ID>&a8ejpredirect=<飛び先URLをURLエンコード>
 * - 飛び先は広告主のサイト内に限る（au PAY は https://furusato.wowma.jp/ 内、ふるさと本舗は https://furusatohonpo.jp/ 内と指定がある）。
 * - 商品リンクの素材IDは、テキスト広告（data/sponsored.ts）の a8mat とは末尾が違う。
 *
 * 各サイトの検索ページ（2026-10-20 に実際に検索して確認）
 * - au PAY ふるさと納税：https://furusato.wowma.jp/products/list.php?search_word=<キーワード>
 * - ふるさと本舗：https://furusatohonpo.jp/donate/s/?keyword=<キーワード>
 * 同じ返礼品が別のサイトにあっても名前が違うので、商品名ではなく自治体名で探す（その自治体の返礼品の一覧が開く）。
 */
export type FurusatoDeepSite = {
  /** data/sponsored.ts の id と同じ */
  id: string;
  name: string;
  /** 商品リンク（フリー素材）の a8mat */
  a8mat: string;
  /** 飛び先として認められているサイトの先頭 */
  origin: string;
  searchUrl: (keyword: string) => string;
};

export const FURUSATO_DEEP_SITES: FurusatoDeepSite[] = [
  {
    id: "aupay-furusato",
    name: "au PAY ふるさと納税",
    a8mat: "4BEL1P+3NKU8Q+54OC+BW0YB",
    origin: "https://furusato.wowma.jp/",
    searchUrl: (k) => `https://furusato.wowma.jp/products/list.php?search_word=${encodeURIComponent(k)}`,
  },
  {
    id: "furusato-honpo",
    name: "ふるさと本舗",
    a8mat: "4BEL1P+3O69UI+5IMU+BW0YB",
    origin: "https://furusatohonpo.jp/",
    searchUrl: (k) => `https://furusatohonpo.jp/donate/s/?keyword=${encodeURIComponent(k)}`,
  },
];

/** 「北海道別海町」→「別海町」。都道府県名と、かっこ書きを外す */
export function municipalityKeyword(shopName: string): string {
  const name = shopName.replace(/[（(【［\[].*$/, "").trim();
  const short = name.replace(/^(北海道|東京都|京都府|大阪府|.{2,3}県)/, "");
  return short || name;
}

/** A8 の商品リンク。飛び先が広告主のサイトの外なら作らない */
export function a8DeepLink(a8mat: string, origin: string, target: string): string | null {
  if (!target.startsWith(origin)) return null;
  return `https://px.a8.net/svt/ejp?a8mat=${a8mat}&a8ejpredirect=${encodeURIComponent(target)}`;
}

/** 返礼品の自治体で各サイトを検索するリンク。自治体名が取れなければトップページのリンク（呼ぶ側で用意）を使う */
export function municipalitySearchLinks(shopName: string): { id: string; name: string; href: string; keyword: string }[] {
  const keyword = municipalityKeyword(shopName);
  if (!keyword) return [];
  return FURUSATO_DEEP_SITES.flatMap((s) => {
    const href = a8DeepLink(s.a8mat, s.origin, s.searchUrl(keyword));
    return href ? [{ id: s.id, name: s.name, href, keyword }] : [];
  });
}
