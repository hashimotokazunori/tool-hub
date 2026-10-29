"use client";

import Link from "next/link";
import { useState } from "react";
import { Field, SavedNote } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { useStoredState } from "@/components/useStoredState";
import { checkAnswer, KIND_LABEL, type CheckKind } from "./logic";

const SAMPLE = "合計23,500円を6人で割り勘すると、1人あたり3,800円になります。";

/** 種類ごとに、自分で計算し直せるツール */
const TOOL_OF: Record<CheckKind, { href: string; name: string }> = {
  warikan: { href: "/tools/warikan/", name: "割り勘計算" },
  tax: { href: "/tools/consumption-tax/", name: "消費税計算" },
  days: { href: "/tools/days-between/", name: "日数計算" },
};

export default function AiCheck() {
  const [text, setText] = useStoredState("ai-check:text", "");
  const [kind, setKind] = useState<CheckKind | "auto">("auto");
  const r = text.trim() ? checkAnswer(text, kind) : null;
  return (
    <div className="flex flex-col gap-4">
      <Field label="AIの答え（ChatGPT・Gemini・Claude などの答えを貼り付け）" wide>
        <textarea className={`${ui.input} min-h-32`} value={text} onChange={(e) => setText(e.target.value)} placeholder={`例：${SAMPLE}`} />
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          <span className="whitespace-nowrap text-muted">計算の種類</span>
          <select className={`${ui.input} w-auto`} value={kind} onChange={(e) => setKind(e.target.value as CheckKind | "auto")}>
            <option value="auto">自動で見分ける</option>
            {(Object.keys(KIND_LABEL) as CheckKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={ui.button} onClick={() => setText(SAMPLE)}>
          例を入れる
        </button>
        <button type="button" className={`${ui.buttonDanger} ml-auto`} onClick={() => setText("")} disabled={!text}>
          消す
        </button>
      </div>

      <section aria-live="polite" className="flex flex-col gap-3">
        {!text.trim() ? (
          <p className={ui.note}>答えを貼り付けると、書かれている数字をこのサイトの計算で計算し直して、合っているかを表示します。</p>
        ) : !r ? (
          <p className="rounded-xl bg-field px-4 py-3 text-sm">割り勘・消費税・日数のどれの答えか見分けられませんでした。上の「計算の種類」を選んでください。</p>
        ) : (
          <>
            <p className="text-sm">
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">{KIND_LABEL[r.kind]}</span>{" "}
              {r.read.map((x) => `${x.label}：${x.value}`).join("　")}
            </p>
            {r.problem ? (
              <p className="rounded-xl bg-field px-4 py-3 text-sm">{r.problem}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {r.claims.map((c, i) => (
                  <li key={i} className={`flex flex-col gap-1 rounded-2xl border-2 px-4 py-3 ${c.ok ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/30" : "border-red-500/50 bg-red-50 dark:bg-red-950/30"}`}>
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <b className={`text-lg ${c.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>{c.ok ? "○ 合っています" : "× ずれています"}</b>
                      <span className="font-semibold">{c.label}</span>
                    </span>
                    <span className="tabular-nums">
                      AIの答え {c.claimed.toLocaleString("ja-JP")}
                      {c.unit}
                      {!c.ok && (
                        <>
                          {" "}
                          → 計算し直すと <b>{c.actual.toLocaleString("ja-JP")}</b>
                          {c.unit}
                        </>
                      )}
                    </span>
                    {c.note && <span className="text-xs text-muted">{c.note}</span>}
                  </li>
                ))}
              </ul>
            )}
            <p className={ui.note}>
              読み取りがずれていると感じたら、
              <Link href={TOOL_OF[r.kind].href}>{TOOL_OF[r.kind].name}</Link>
              で数字を入れて確かめてください。
            </p>
          </>
        )}
      </section>
      <SavedNote />
    </div>
  );
}
