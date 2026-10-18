/** サイト内検索の1件 */
export type SearchItem = {
  kind: "ツール" | "グッズ" | "ガイド" | "悩み別";
  title: string;
  summary: string;
  href: string;
  /** 検索用に正規化した文字列 */
  haystack: string;
};

/** 全角英数を半角に、カタカナをひらがなに、英字を小文字にそろえる */
export function normalize(s: string): string {
  return s
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .toLowerCase();
}

export function makeItem(kind: SearchItem["kind"], title: string, summary: string, href: string, extra: string[] = []): SearchItem {
  return { kind, title, summary, href, haystack: normalize([title, summary, ...extra].join(" ")) };
}

/** すべての語を含むものを返す。名前に1語目を含むものを先に並べる */
export function search(items: SearchItem[], query: string, limit = 12): SearchItem[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return items
    .filter((it) => terms.every((t) => it.haystack.includes(t)))
    .map((it) => ({ it, score: normalize(it.title).includes(terms[0]) ? 2 : 1 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.it);
}
