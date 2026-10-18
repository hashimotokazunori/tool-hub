/** 行頭に来てはいけない句読点など（前の行の最後のマスにぶら下げる） */
const HANG = "、。，．」』）】〕";
export const CELLS_PER_LINE = 20;

export type Manuscript = {
  /** 1行ずつの文字（1マス1要素。ぶら下げた句読点は最後のマスに2文字入る） */
  lines: string[][];
  pages: number;
  /** 最後の1枚で使った行数 */
  lastPageRows: number;
  /** 改行を除いた文字数 */
  chars: number;
};

/**
 * 原稿用紙に書いたときの配置を計算する。
 * - 改行（段落）ごとに新しい行から書く
 * - indent が true なら、字下げのない段落の頭に1マス空ける（かぎかっこで始まる段落は除く）
 * - 行頭に句読点や閉じかっこが来るときは、前の行の最後のマスにぶら下げる
 */
export function layoutManuscript(text: string, rowsPerPage: 20 | 10, indent: boolean): Manuscript {
  const lines: string[][] = [];
  let chars = 0;
  for (const para of text.replace(/\r\n?/g, "\n").split("\n")) {
    let cs = [...para];
    chars += cs.length;
    if (indent && cs.length && !/^[　 「『（]/.test(para)) cs = ["　", ...cs];
    if (cs.length === 0) {
      lines.push([]);
      continue;
    }
    let cur: string[] = [];
    for (const c of cs) {
      if (cur.length === CELLS_PER_LINE) {
        if (HANG.includes(c)) {
          cur[CELLS_PER_LINE - 1] += c;
          continue;
        }
        lines.push(cur);
        cur = [];
      }
      cur.push(c);
    }
    lines.push(cur);
  }
  if (text === "") return { lines: [], pages: 0, lastPageRows: 0, chars: 0 };
  const pages = Math.max(1, Math.ceil(lines.length / rowsPerPage));
  return { lines, pages, lastPageRows: lines.length - (pages - 1) * rowsPerPage, chars };
}
