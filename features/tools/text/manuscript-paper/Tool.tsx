"use client";

import { useMemo, useState } from "react";
import { Check, Choice } from "@/components/TextTransform";
import { Stats } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { CELLS_PER_LINE, layoutManuscript } from "./logic";

export default function ManuscriptPaper() {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<"20" | "10">("20");
  const [indent, setIndent] = useState(true);
  const m = useMemo(() => layoutManuscript(text, Number(rows) as 20 | 10, indent), [text, rows, indent]);
  const perPage = Number(rows);
  const first = m.lines.slice(0, perPage);
  return (
    <div className="flex flex-col gap-4">
      <label className={ui.label} htmlFor="mp-text">
        文章
      </label>
      <textarea id="mp-text" className={`${ui.input} min-h-48 leading-relaxed`} value={text} onChange={(e) => setText(e.target.value)} placeholder="作文・小論文・読書感想文などを貼り付けてください。" />
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <Choice label="原稿用紙" value={rows} onChange={setRows} options={[["20", "400字詰め（20字×20行）"], ["10", "200字詰め（20字×10行）"]]} />
        <Check label="段落の最初を1マス下げる（入力に字下げがない場合）" checked={indent} onChange={setIndent} />
      </div>
      <Stats
        items={[
          { label: "原稿用紙の枚数", value: `${m.pages} 枚`, emphasis: true },
          { label: "使った行数", value: `${m.lines.length} 行` },
          { label: "最後の1枚", value: `${m.lastPageRows} / ${perPage} 行` },
          { label: "文字数（改行を除く）", value: `${m.chars} 字` },
        ]}
      />
      {m.lines.length > 0 && (
        <figure className="flex flex-col gap-2">
          <figcaption className={ui.note}>1枚目のイメージ（縦書き）</figcaption>
          <div className="overflow-x-auto pb-1">
            {/* 縦書き：右の列から順に1行ずつ。direction: rtl で列を右から並べる */}
            <div
              className="grid w-max border-2 border-[#c0392b] bg-[#fffdf8] [direction:rtl]"
              style={{ gridTemplateRows: `repeat(${CELLS_PER_LINE}, 1.4rem)`, gridAutoFlow: "column", gridAutoColumns: "1.4rem" }}
              aria-hidden="true"
            >
              {Array.from({ length: perPage }, (_, col) =>
                Array.from({ length: CELLS_PER_LINE }, (_, row) => (
                  <span key={`${col}-${row}`} className="grid place-items-center border border-[#c0392b]/30 font-serif text-sm leading-none text-[#222] [direction:ltr]">
                    {first[col]?.[row] ?? ""}
                  </span>
                )),
              )}
            </div>
          </div>
        </figure>
      )}
    </div>
  );
}
