"use client";

import { useMemo, useState } from "react";
import { CopyButton, Stats } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { countText } from "./logic";

export default function CharacterCounter() {
  const [text, setText] = useState("");
  const c = useMemo(() => countText(text), [text]);
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
      <Stats
        items={[
          { label: "文字（改行を含む）", value: c.chars, emphasis: true },
          { label: "文字（改行を除く）", value: c.charsNoNewline },
          { label: "文字（空白・改行を除く）", value: c.charsNoSpace },
          { label: "行", value: c.lines },
          { label: "段落", value: c.paragraphs },
          { label: "バイト（UTF-8）", value: c.bytes },
          { label: "原稿用紙（400字詰め）", value: `${c.manuscriptPages} 枚` },
          { label: "Xでの文字数（上限280）", value: c.xCount },
        ]}
      />
      <div className="flex flex-wrap gap-2">
        <CopyButton text={text} label="文章をコピー" />
        <button type="button" className={ui.button} onClick={() => setText("")}>
          消す
        </button>
      </div>
    </div>
  );
}
