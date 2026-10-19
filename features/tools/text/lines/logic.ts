/** 行数・段落数・文の数を数える */

export type LineInfo = {
  no: number;
  text: string;
  length: number;
  blank: boolean;
};

export type LineStats = {
  /** 行の数（最後の改行のあとの空の行は数えない） */
  lines: number;
  nonEmpty: number;
  /** 空白だけの行も空行として数える */
  blank: number;
  /** 空行で区切られたまとまり */
  paragraphs: number;
  /** 。！？.!? で終わる文（最後の区切りのない文も1つ） */
  sentences: number;
  /** 空行を除いた行の平均の文字数 */
  averageLength: number;
  longestLength: number;
  /** いちばん長い行の行番号（1から。行がなければ0） */
  longestLine: number;
  chars: number;
};

const len = (s: string) => [...s].length;

/** 改行をそろえて行に分ける。最後の改行のあとは行として数えない */
export function splitLines(input: string): string[] {
  const text = input.replace(/\r\n?/g, "\n");
  if (text === "") return [];
  return (text.endsWith("\n") ? text.slice(0, -1) : text).split("\n");
}

export function lineInfos(input: string): LineInfo[] {
  return splitLines(input).map((text, i) => ({
    no: i + 1,
    text,
    length: len(text),
    blank: text.trim() === "",
  }));
}

/** 文の数。。！？!? は常に区切り、半角の . は後ろが空白か終わりのときだけ区切る（3.14 などは区切らない） */
export function countSentences(input: string): number {
  return input
    .replace(/\r\n?/g, "\n")
    .split(/[。！？!?．]+[」』）)"'”’]*|\.+(?=[\s"'”’)]|$)/)
    .filter((s) => /[\p{L}\p{N}]/u.test(s)).length;
}

export function analyzeLines(input: string): LineStats {
  const infos = lineInfos(input);
  const filled = infos.filter((l) => !l.blank);
  let longest: LineInfo | null = null;
  for (const l of infos) if (!longest || l.length > longest.length) longest = l;
  const text = input.replace(/\r\n?/g, "\n");
  return {
    lines: infos.length,
    nonEmpty: filled.length,
    blank: infos.length - filled.length,
    paragraphs: text.split(/\n[ \t　]*\n/).filter((p) => p.trim()).length,
    sentences: countSentences(text),
    averageLength: filled.length ? filled.reduce((s, l) => s + l.length, 0) / filled.length : 0,
    longestLength: longest?.length ?? 0,
    longestLine: longest?.no ?? 0,
    chars: len(text.replace(/\n/g, "")),
  };
}

/** 行番号を付けた文章（「  1: 本文」の形）。skipBlank なら空行には番号を付けない */
export function numberedText(input: string, skipBlank = false): string {
  const infos = lineInfos(input);
  const width = String(infos.length).length;
  let n = 0;
  return infos
    .map((l) => {
      if (skipBlank && l.blank) return "";
      n += 1;
      return `${String(skipBlank ? n : l.no).padStart(width, " ")}: ${l.text}`;
    })
    .join("\n");
}
