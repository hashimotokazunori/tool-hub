"use client";

import { useState, type ReactNode } from "react";
import { CopyButton } from "./ToolUI";
import { ui } from "./styles";

/**
 * 文章を変換するツールの共通画面（変換前 → 変換後）。
 * 変換の中身は各ツールの logic.ts にあり、convert に渡す。オプションは children に置く。
 */
export function TextTransform({ input, onInput, output, options, summary, placeholder }: { input: string; onInput: (s: string) => void; output: string; options?: ReactNode; summary?: string; placeholder?: string }) {
  const [copiedBack, setCopiedBack] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      {options && <div className="flex flex-wrap items-end gap-x-5 gap-y-3">{options}</div>}
      <div className="grid gap-3 md:grid-cols-2">
        <label className={ui.label}>
          変換前
          <textarea className={`${ui.input} min-h-56 font-mono text-sm leading-relaxed`} value={input} placeholder={placeholder ?? "ここに文章を入力するか、貼り付けてください。"} onChange={(e) => onInput(e.target.value)} />
        </label>
        <label className={ui.label}>
          変換後
          <textarea className={`${ui.input} min-h-56 font-mono text-sm leading-relaxed`} value={output} readOnly />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton text={output} label="結果をコピー" primary />
        <button
          type="button"
          className={ui.button}
          onClick={() => {
            onInput(output);
            setCopiedBack(true);
            setTimeout(() => setCopiedBack(false), 1500);
          }}
        >
          {copiedBack ? "入れました" : "結果を変換前に入れる"}
        </button>
        <button type="button" className={ui.button} onClick={() => onInput("")} disabled={!input}>
          消す
        </button>
        <span className="text-xs text-muted" aria-live="polite">
          {summary ?? `${[...input].length} 文字 → ${[...output].length} 文字`}
        </span>
      </div>
    </div>
  );
}

/** チェックボックス1つ */
export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" className="h-4 w-4 accent-accent" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

/** 選択肢（ラベル付き） */
export function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <label className={ui.label}>
      {label}
      <select className={`${ui.input} w-auto`} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
