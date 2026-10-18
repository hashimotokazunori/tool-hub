export type TextCount = {
  /** 改行を含む文字数（サロゲートペアは1文字） */
  chars: number;
  charsNoNewline: number;
  charsNoSpace: number;
  lines: number;
  paragraphs: number;
  /** UTF-8 のバイト数 */
  bytes: number;
  /** 400字詰め原稿用紙の枚数（1行20字、改行で次の行へ） */
  manuscriptPages: number;
  /** X（旧Twitter）の数え方。全角2・半角1、URLは23 */
  xCount: number;
  /** 半角の文字（英数字・記号・半角カナ・半角スペース。改行は除く） */
  halfWidth: number;
  /** 全角の文字（改行は除く） */
  fullWidth: number;
  /** 英単語などの語数（空白で区切ったまとまり） */
  words: number;
};

/** 半角として扱う文字：ASCII と半角カナ（U+FF61〜U+FF9F） */
export const isHalfWidth = (ch: string) => {
  const cp = ch.codePointAt(0)!;
  return cp <= 0x7e || (cp >= 0xff61 && cp <= 0xff9f);
};

/** X の数え方で1として数える文字の範囲（Twitter text の設定に基づく） */
const isLight = (cp: number) => cp <= 0x10ff || (cp >= 0x2000 && cp <= 0x200d) || (cp >= 0x2010 && cp <= 0x201f) || (cp >= 0x2032 && cp <= 0x2037);

export function xWeightedCount(text: string): number {
  let n = 0;
  const rest = text.replace(/https?:\/\/\S+/g, () => {
    n += 23;
    return "";
  });
  for (const ch of rest) n += isLight(ch.codePointAt(0)!) ? 1 : 2;
  return n;
}

export function countText(input: string): TextCount {
  const text = input.replace(/\r\n?/g, "\n");
  const chars = [...text];
  const noNewline = chars.filter((c) => c !== "\n");
  const lineList = text === "" ? [] : text.split("\n");
  const rows = lineList.reduce((sum, l) => sum + Math.max(1, Math.ceil([...l].length / 20)), 0);
  return {
    chars: chars.length,
    charsNoNewline: noNewline.length,
    charsNoSpace: noNewline.filter((c) => !/\s/.test(c)).length,
    lines: lineList.length,
    paragraphs: text.split(/\n\s*\n/).filter((p) => p.trim()).length,
    bytes: new TextEncoder().encode(text).length,
    manuscriptPages: text === "" ? 0 : Math.ceil(rows / 20),
    xCount: xWeightedCount(text),
    halfWidth: noNewline.filter(isHalfWidth).length,
    fullWidth: noNewline.filter((c) => !isHalfWidth(c)).length,
    words: text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length,
  };
}

export type LimitBasis = "chars" | "charsNoNewline" | "charsNoSpace";

/** 目標（上限）の文字数との比較。limit が0以下なら null */
export function compareLimit(c: TextCount, limit: number, basis: LimitBasis): { count: number; remaining: number; ratio: number } | null {
  const l = Math.floor(limit || 0);
  if (l <= 0) return null;
  const count = c[basis];
  return { count, remaining: l - count, ratio: count / l };
}
