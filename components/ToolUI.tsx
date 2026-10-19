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

type StatItem = { label: string; value: ReactNode; emphasis?: boolean };

/** 計算結果のタイル。数が多くても行が欠けないよう、件数に合わせて折り返す。文字や数の値は押すとコピーできる */
export function Stats({ items }: { items: StatItem[] }) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4" aria-live="polite">
      {items.map((it) => (
        <StatTile key={it.label} {...it} />
      ))}
    </dl>
  );
}

function StatTile({ label, value, emphasis }: StatItem) {
  const [copied, setCopied] = useState(false);
  const text = typeof value === "string" || typeof value === "number" ? String(value) : null;
  return (
    <div className={`group relative flex flex-col-reverse gap-0.5 rounded-2xl border px-3.5 py-2.5 transition hover:shadow-card ${emphasis ? "border-accent/30 bg-gradient-to-br from-accent-soft to-panel" : "border-line bg-field/60"}`}>
      <dt className="text-xs text-muted">{copied ? "コピーしました" : label}</dt>
      <dd className={`text-xl font-bold tracking-tight tabular-nums ${emphasis ? "text-accent" : ""}`}>{value}</dd>
      {text !== null && (
        <button
          type="button"
          className="absolute inset-0 cursor-copy rounded-2xl focus-visible:outline-2 focus-visible:outline-accent"
          aria-label={`${label}の値「${text}」をコピー`}
          title="押すとコピー"
          onClick={async () => {
            try {
              // 「1,234 円」のような表示は数字だけをコピーする
              await navigator.clipboard.writeText(/^[\d,.\-−]+\s*(円|枚|文字|日|%|％)?$/.test(text) ? text.replace(/[,\s円枚文字日%％]/g, "").replace("−", "-") : text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              // コピーできない環境では何もしない（値は画面で読める）
            }
          }}
        />
      )}
    </div>
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

/** 入力をこの端末に保存していることの案内 */
export function SavedNote() {
  return <p className="text-xs text-muted">入力した内容は、次に開いたときのためにこの端末のブラウザにだけ保存されます（外部には送りません）。「消す」で消えます。</p>;
}

/** 今の入力内容を含むURLを共有する。スマホでは共有メニュー、パソコンではコピー */
export function ShareButton({ getUrl, title }: { getUrl: () => string; title: string }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  return (
    <button
      type="button"
      className={ui.button}
      onClick={async () => {
        const url = getUrl();
        try {
          if (typeof navigator.share === "function" && matchMedia("(pointer: coarse)").matches) {
            await navigator.share({ title, url });
            return;
          }
          await navigator.clipboard.writeText(url);
          setState("done");
        } catch (e) {
          // 共有メニューを閉じただけのときは何も出さない
          if ((e as Error).name !== "AbortError") setState("fail");
        }
        setTimeout(() => setState("idle"), 2500);
      }}
    >
      {state === "done" ? "リンクをコピーしました" : state === "fail" ? "コピーできませんでした" : "結果をリンクで共有"}
    </button>
  );
}
