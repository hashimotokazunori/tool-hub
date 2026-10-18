"use client";

import { useEffect, useState } from "react";
import { CopyButton, Field, FieldGrid } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { bingoLetter, drawBingo, shuffle } from "./logic";

export function Lottery() {
  const [text, setText] = useState("");
  const [count, setCount] = useState(1);
  const [order, setOrder] = useState<string[] | null>(null);
  const list = text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const k = Math.min(list.length, Math.max(1, Math.floor(count || 1)));
  const winners = order?.slice(0, k) ?? [];
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Field label="候補（1行に1つ）" wide>
          <textarea className={`${ui.input} min-h-40`} value={text} onChange={(e) => setText(e.target.value)} placeholder={"佐藤\n鈴木\n高橋\n田中"} />
        </Field>
        <Field label="当選数">
          <input className={ui.input} type="number" inputMode="numeric" min={1} value={count || ""} onChange={(e) => setCount(Number(e.target.value))} />
        </Field>
      </FieldGrid>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} disabled={!list.length} onClick={() => setOrder(shuffle(list))}>
          抽選する
        </button>
        <span className="text-sm text-muted">{list.length} 人の候補</span>
      </div>
      {order && (
        <section aria-live="polite" className="flex flex-col gap-3">
          <ol className="flex flex-wrap gap-2">
            {winners.map((w, i) => (
              <li key={i} className="flex items-baseline gap-2 rounded-xl bg-accent-soft px-4 py-2 text-xl font-bold">
                <small className="text-xs text-muted">{i + 1}</small>
                {w}
              </li>
            ))}
          </ol>
          <p className={ui.note}>全員の順番：{order.map((x, i) => `${i + 1}. ${x}`).join("　")}</p>
          <CopyButton text={winners.join("\n")} label="当選者をコピー" />
        </section>
      )}
      <p className={ui.note}>抽選には暗号論的乱数を使っています。候補の入力を変えたら、もう一度「抽選する」を押してください。</p>
    </div>
  );
}

const STORE = "bingo-drawn";

export function Bingo() {
  const [drawn, setDrawn] = useState<number[]>([]);
  // 再読み込みしても続きから遊べるよう、この端末にだけ保存する
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) ?? "[]");
      if (Array.isArray(saved) && saved.length) queueMicrotask(() => setDrawn(saved.filter((n) => Number.isInteger(n) && n >= 1 && n <= 75)));
    } catch {
      /* 保存を使えない環境ではそのまま */
    }
  }, []);
  const update = (next: number[]) => {
    setDrawn(next);
    try {
      localStorage.setItem(STORE, JSON.stringify(next));
    } catch {
      /* 保存できなくても遊べる */
    }
  };
  const last = drawn[drawn.length - 1];
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid h-40 w-40 place-items-center rounded-full bg-accent-soft text-4xl font-bold tabular-nums ring-4 ring-accent/30" aria-live="assertive">
        {last ? `${bingoLetter(last)}-${last}` : "–"}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          className={`${ui.buttonPrimary} px-8 py-3 text-lg`}
          disabled={drawn.length >= 75}
          onClick={() => {
            const n = drawBingo(drawn);
            if (n) update([...drawn, n]);
          }}
        >
          次の番号
        </button>
        <button type="button" className={ui.button} onClick={() => update([])}>
          はじめからやり直す
        </button>
      </div>
      <p className="text-sm text-muted">{drawn.length} / 75 個</p>
      <div className="grid w-full max-w-xl grid-cols-5 gap-1.5">
        {"BINGO".split("").map((l, c) => (
          <div key={l} className="flex flex-col items-center gap-1">
            <b className="text-lg text-accent">{l}</b>
            {Array.from({ length: 15 }, (_, i) => c * 15 + i + 1).map((n) => (
              <span key={n} className={`w-full rounded-md py-1 text-center font-mono text-sm tabular-nums ${drawn.includes(n) ? "bg-accent font-bold text-accent-ink" : "bg-field text-muted"} ${n === last ? "ring-2 ring-warn" : ""}`}>
                {n}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
