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
  };
}
