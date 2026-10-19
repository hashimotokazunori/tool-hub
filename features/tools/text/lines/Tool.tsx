"use client";

import { useMemo } from "react";
import { Check } from "@/components/TextTransform";
import { CopyButton, SavedNote, Stats } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { useStoredState } from "@/components/useStoredState";
import { analyzeLines, lineInfos, numberedText } from "./logic";

const MAX_ROWS = 1000;
const fmt = (n: number, d = 0) => n.toLocaleString("ja-JP", { maximumFractionDigits: d });

export function LineParagraphCounter() {
  const [text, setText, clear] = useStoredState("line-paragraph-counter:text", "");
  const [showList, setShowList] = useStoredState("line-paragraph-counter:list", false);
  const [skipBlank, setSkipBlank] = useStoredState("line-paragraph-counter:skipBlank", false);
  const s = useMemo(() => analyzeLines(text), [text]);
  const infos = useMemo(() => {
    if (!showList) return [];
    let n = 0;
    return lineInfos(text).map((l) => ({
      ...l,
      label: skipBlank && l.blank ? "" : String(skipBlank ? ++n : l.no),
    }));
  }, [text, showList, skipBlank]);
  const numbered = useMemo(() => (showList ? numberedText(text, skipBlank) : ""), [text, showList, skipBlank]);

  return (
    <div className="flex flex-col gap-4">
      <label className={ui.label}>
        数えたい文章
        <textarea
          className={`${ui.input} min-h-56 leading-relaxed`}
          placeholder="ここに文章を入力するか、貼り付けてください。入力と同時に数えます。"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.button} onClick={clear} disabled={!text}>
          消す
        </button>
      </div>
      <Stats
        items={[
          { label: "行（全体）", value: s.lines, emphasis: true },
          { label: "文字が入っている行", value: s.nonEmpty },
          { label: "空行", value: s.blank },
          { label: "段落", value: s.paragraphs, emphasis: true },
          { label: "文（。！？.!?で区切り）", value: s.sentences },
          {
            label: "1行の平均文字数（空行を除く）",
            value: `${fmt(s.averageLength, 1)} 文字`,
          },
          {
            label: "いちばん長い行",
            value: s.longestLine ? `${s.longestLine} 行目（${fmt(s.longestLength)} 文字）` : "—",
          },
          { label: "文字（改行を除く）", value: s.chars },
        ]}
      />
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <Check label="行番号と1行ごとの文字数を表示する" checked={showList} onChange={setShowList} />
        {showList && <Check label="空行には番号を付けない" checked={skipBlank} onChange={setSkipBlank} />}
      </div>
      {showList && infos.length > 0 && (
        <>
          <div className="max-h-[28rem] overflow-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-field text-left text-xs text-muted">
                <tr>
                  <th className="px-3 py-1.5 text-right font-medium whitespace-nowrap">行</th>
                  <th className="px-3 py-1.5 text-right font-medium whitespace-nowrap">文字数</th>
                  <th className="px-3 py-1.5 font-medium">内容</th>
                </tr>
              </thead>
              <tbody>
                {infos.slice(0, MAX_ROWS).map((l) => (
                  <tr key={l.no} className={`border-t border-line ${l.blank ? "text-muted" : ""} ${l.no === s.longestLine ? "bg-accent-soft" : ""}`}>
                    <td className="px-3 py-1 text-right tabular-nums">{l.label}</td>
                    <td className="px-3 py-1 text-right tabular-nums">{l.length}</td>
                    <td className="px-3 py-1 break-all whitespace-pre-wrap">{l.blank ? "（空行）" : l.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {infos.length > MAX_ROWS && <p className={ui.note}>表は最初の {fmt(MAX_ROWS)} 行まで表示しています（コピーにはすべての行が入ります）。</p>}
          <div className="flex flex-wrap gap-2">
            <CopyButton text={numbered} label="行番号付きでコピー" primary />
          </div>
        </>
      )}
      <p className={ui.note}>
        最後の改行のあとの何もない行は数えません。空白だけの行は空行として数え、空行で区切られたまとまりを1段落とします。文は「。」「！」「？」などで区切って数え、「3.14」のような数字の中の点では区切りません。表の色付きの行がいちばん長い行です。
      </p>
      <SavedNote />
    </div>
  );
}
