"use client";

import { useMemo } from "react";
import { Choice } from "@/components/TextTransform";
import { CopyButton, SavedNote, Stats } from "@/components/ToolUI";
import { useStoredState } from "@/components/useStoredState";
import { ui } from "@/components/styles";
import { compareLimit, countText, type LimitBasis } from "./logic";

const BASIS: [LimitBasis, string][] = [
  ["charsNoNewline", "改行を除く"],
  ["chars", "改行を含む"],
  ["charsNoSpace", "空白・改行を除く"],
];

export default function CharacterCounter() {
  const [text, setText] = useStoredState("character-counter:text", "");
  const [limit, setLimit] = useStoredState("character-counter:limit", 0);
  const [basis, setBasis] = useStoredState<LimitBasis>("character-counter:basis", "charsNoNewline");
  const c = useMemo(() => countText(text), [text]);
  const lim = compareLimit(c, limit, basis);
  return (
    <div className="flex flex-col gap-4">
      <label className={ui.label} htmlFor="cc-text">
        数えたい文章
      </label>
      <textarea
        id="cc-text"
        className={`${ui.input} min-h-56 leading-relaxed`}
        placeholder="ここに文章を入力するか、貼り付けてください。入力と同時に数えます。"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <label className={ui.label}>
          目標・上限の文字数（任意）
          <input className={`${ui.input} w-36`} type="number" inputMode="numeric" min={0} placeholder="例：400" value={limit || ""} onChange={(e) => setLimit(Number(e.target.value))} />
        </label>
        <Choice label="数え方" value={basis} onChange={setBasis} options={BASIS} />
        <div className="flex flex-wrap gap-1.5">
          {[140, 200, 400, 800, 2000].map((n) => (
            <button key={n} type="button" className={ui.chip} onClick={() => setLimit(n)}>
              {n.toLocaleString("ja-JP")}字
            </button>
          ))}
        </div>
      </div>
      {lim && (
        <div className="flex flex-col gap-1.5" aria-live="polite">
          <div className="h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div className={`h-full ${lim.remaining < 0 ? "bg-warn" : "bg-ok"}`} style={{ width: `${Math.min(100, lim.ratio * 100)}%` }} />
          </div>
          <p className="text-sm">
            {lim.count.toLocaleString("ja-JP")} / {limit.toLocaleString("ja-JP")} 字（{Math.round(lim.ratio * 100)}%）
            {lim.remaining >= 0 ? (
              <>
                ・あと <b>{lim.remaining.toLocaleString("ja-JP")}</b> 字
              </>
            ) : (
              <b className="text-warn">・{(-lim.remaining).toLocaleString("ja-JP")} 字オーバー</b>
            )}
          </p>
        </div>
      )}
      <Stats
        items={[
          { label: "文字（改行を含む）", value: c.chars, emphasis: basis === "chars" },
          { label: "文字（改行を除く）", value: c.charsNoNewline, emphasis: basis === "charsNoNewline" },
          { label: "文字（空白・改行を除く）", value: c.charsNoSpace, emphasis: basis === "charsNoSpace" },
          { label: "全角の文字", value: c.fullWidth },
          { label: "半角の文字", value: c.halfWidth },
          { label: "行", value: c.lines },
          { label: "段落", value: c.paragraphs },
          { label: "単語（空白区切り）", value: c.words },
          { label: "バイト（UTF-8）", value: c.bytes },
          { label: "原稿用紙（400字詰め）", value: `${c.manuscriptPages} 枚` },
          { label: "Xでの文字数（上限280）", value: c.xCount },
        ]}
      />
      <p className={ui.note}>結果のタイルを押すと、その数をコピーできます。</p>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={text} label="文章をコピー" />
        <button type="button" className={ui.button} onClick={() => setText("")} disabled={!text}>
          消す
        </button>
      </div>
      <SavedNote />
    </div>
  );
}
