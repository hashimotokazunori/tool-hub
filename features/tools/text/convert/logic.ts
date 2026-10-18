/**
 * 文章変換ツールの計算部分（ひらがな・カタカナ、全角・半角、大文字・小文字、空白、置換、重複行）。
 * どれも「文字列 → 文字列」の純粋関数なので1つのファイルにまとめている。
 */
import { fullKanaToHalf, halfKanaToFull, hiraganaToKatakana, katakanaToHiragana } from "@/lib/kana";

/* ひらがな・カタカナ */
export type KanaMode = "toKatakana" | "toHiragana";
export function convertKana(s: string, mode: KanaMode, includeHalfWidth: boolean): string {
  const t = includeHalfWidth ? halfKanaToFull(s) : s;
  return mode === "toKatakana" ? hiraganaToKatakana(t) : katakanaToHiragana(t);
}

/* 全角・半角 */
export type WidthOptions = { direction: "toHalf" | "toFull"; alnum: boolean; symbol: boolean; space: boolean; kana: boolean };
export function convertWidth(s: string, o: WidthOptions): string {
  if (o.direction === "toHalf") {
    if (o.alnum) s = s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
    if (o.symbol) s = s.replace(/[！-／：-＠［-｀｛-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
    if (o.space) s = s.replace(/　/g, " ");
    // カナを半角にしないときは、まじっている半角カナを全角にそろえる
    s = o.kana ? fullKanaToHalf(s) : halfKanaToFull(s);
    return s;
  }
  if (o.alnum) s = s.replace(/[A-Za-z0-9]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0xfee0));
  if (o.symbol) s = s.replace(/[!-/:-@[-`{-~]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0xfee0));
  if (o.space) s = s.replace(/ /g, "　");
  if (o.kana) s = halfKanaToFull(s);
  return s;
}

/* 大文字・小文字 */
export type CaseMode = "upper" | "lower" | "title" | "sentence" | "swap" | "camel" | "pascal" | "snake" | "kebab" | "constant";
const words = (l: string) =>
  l
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
export function convertCase(s: string, mode: CaseMode): string {
  return s
    .split("\n")
    .map((l) => {
      const w = words(l);
      switch (mode) {
        case "upper":
          return l.toUpperCase();
        case "lower":
          return l.toLowerCase();
        case "title":
          return l.toLowerCase().replace(/(^|[^A-Za-z'])([a-z])/g, (_m, a: string, b: string) => a + b.toUpperCase());
        case "sentence":
          return l.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, (_m, a: string, b: string) => a + b.toUpperCase());
        case "swap":
          return [...l].map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join("");
        case "camel":
          return w.map((x, i) => (i ? cap(x) : x.toLowerCase())).join("");
        case "pascal":
          return w.map(cap).join("");
        case "snake":
          return w.map((x) => x.toLowerCase()).join("_");
        case "kebab":
          return w.map((x) => x.toLowerCase()).join("-");
        case "constant":
          return w.map((x) => x.toUpperCase()).join("_");
      }
    })
    .join("\n");
}

/* 改行・空白 */
export type WhitespaceOptions = {
  trimLines: boolean;
  collapseSpaces: boolean;
  fullWidthSpace: boolean;
  tabsToSpace: boolean;
  collapseBlankLines: boolean;
  removeBlankLines: boolean;
  /** 段落（空行）は残して、段落の中の改行だけ削除 */
  joinParagraphLines: boolean;
  removeAllNewlines: boolean;
};
export function cleanWhitespace(input: string, o: WhitespaceOptions): string {
  let s = input.replace(/\r\n?/g, "\n");
  if (o.tabsToSpace) s = s.replace(/\t/g, " ");
  const W = o.fullWidthSpace ? "[ \\t\\u3000]" : "[ \\t]";
  if (o.trimLines) s = s.split("\n").map((l) => l.replace(new RegExp(`^${W}+|${W}+$`, "g"), "")).join("\n");
  if (o.collapseSpaces) s = s.replace(new RegExp(`${W}{2,}`, "g"), " ");
  if (o.joinParagraphLines) s = s.split(/\n\s*\n/).map((p) => p.replace(/\n/g, "")).join("\n\n");
  if (o.removeBlankLines) s = s.split("\n").filter((l) => l.trim()).join("\n");
  else if (o.collapseBlankLines) s = s.replace(/\n(\s*\n){2,}/g, "\n\n");
  if (o.removeAllNewlines) s = s.replace(/\n/g, "");
  return s;
}

/* 置換 */
export type ReplaceOptions = { find: string; replace: string; regex: boolean; ignoreCase: boolean; rules: string };
export type ReplaceResult = { text: string; count: number; error?: string };
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** 1組の置換と、「検索 → 置換」を1行ずつ書いたルールをまとめて適用する */
export function replaceText(input: string, o: ReplaceOptions): ReplaceResult {
  let text = input;
  let count = 0;
  const flags = "g" + (o.ignoreCase ? "i" : "");
  const apply = (find: string, rep: string) => {
    if (!find) return;
    const re = new RegExp(o.regex ? find : escapeRegExp(find), flags);
    count += (text.match(re) ?? []).length;
    // 正規表現のときは $1 などを使えるよう文字列で、通常のときは $ をそのまま入れるよう関数で置換する
    text = o.regex ? text.replace(re, rep) : text.replace(re, () => rep);
  };
  try {
    apply(o.find, o.replace);
    for (const line of o.rules.split("\n")) {
      const parts = line.split(/\s*(?:→|=>|\t)\s*/);
      if (parts.length >= 2 && parts[0]) apply(parts[0], parts.slice(1).join(""));
    }
  } catch (e) {
    return { text: input, count: 0, error: `正規表現が正しくありません：${(e as Error).message}` };
  }
  return { text, count };
}

/* 重複行 */
export type DedupeOptions = { mode: "unique" | "duplicatesOnly" | "singlesOnly"; sort: "none" | "asc" | "desc" | "count"; trim: boolean; ignoreCase: boolean; removeBlank: boolean; showCount: boolean };
export function dedupeLines(input: string, o: DedupeOptions): { text: string; before: number; after: number } {
  const lines = input.replace(/\r/g, "").split("\n");
  const map = new Map<string, { line: string; n: number }>();
  let before = 0;
  for (const l of lines) {
    if (o.removeBlank && !l.trim()) continue;
    before++;
    const shown = o.trim ? l.trim() : l;
    const key = o.ignoreCase ? shown.toLowerCase() : shown;
    const hit = map.get(key);
    if (hit) hit.n++;
    else map.set(key, { line: shown, n: 1 });
  }
  let arr = [...map.values()];
  if (o.mode === "duplicatesOnly") arr = arr.filter((x) => x.n > 1);
  if (o.mode === "singlesOnly") arr = arr.filter((x) => x.n === 1);
  if (o.sort === "asc") arr.sort((a, b) => a.line.localeCompare(b.line, "ja"));
  if (o.sort === "desc") arr.sort((a, b) => b.line.localeCompare(a.line, "ja"));
  if (o.sort === "count") arr.sort((a, b) => b.n - a.n);
  return { text: arr.map((x) => (o.showCount ? `${x.n}\t` : "") + x.line).join("\n"), before, after: arr.length };
}
