"use client";

import { useState, type ReactNode } from "react";
import { ui } from "./styles";

/** ラベル付きの入力欄 */
export function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`${ui.label} ${wide ? "sm:col-span-full" : ""}`}>
      {label}
      {children}
    </label>
  );
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

/** 計算結果のタイル。数が多くても行が欠けないよう、件数に合わせて折り返す */
export function Stats({ items }: { items: { label: string; value: ReactNode; emphasis?: boolean }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4" aria-live="polite">
      {items.map((it) => (
        <div key={it.label} className={`flex flex-col-reverse rounded-lg border px-3 py-2 ${it.emphasis ? "border-accent bg-accent-soft" : "border-line bg-panel"}`}>
          <dt className="text-xs text-muted">{it.label}</dt>
          <dd className="font-mono text-xl font-semibold tabular-nums">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** クリップボードにコピーするボタン。失敗したら案内を出す */
export function CopyButton({ text, label = "コピー", primary }: { text: string; label?: string; primary?: boolean }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  return (
    <button
      type="button"
      className={primary ? ui.buttonPrimary : ui.button}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState("done");
        } catch {
          setState("fail");
        }
        setTimeout(() => setState("idle"), 2000);
      }}
    >
      {state === "done" ? "コピーしました" : state === "fail" ? "コピーできませんでした" : label}
    </button>
  );
}

export const yen = (n: number) => `${n.toLocaleString("ja-JP")} 円`;
