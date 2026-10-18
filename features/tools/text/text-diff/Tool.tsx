"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Check } from "@/components/TextTransform";
import { ui } from "@/components/styles";
import { changedRange, diffLines, type DiffOp } from "./logic";

/** 変わった部分に下線を引く */
function marked(text: string, [from, to]: [number, number]): ReactNode {
  const cs = [...text];
  return (
    <>
      {cs.slice(0, from).join("")}
      <mark className="bg-transparent text-inherit underline decoration-accent decoration-2 underline-offset-2">{cs.slice(from, to).join("")}</mark>
      {cs.slice(to).join("")}
    </>
  );
}

function Line({ op, children }: { op: DiffOp["type"]; children: ReactNode }) {
  const style = op === "added" ? "bg-ok/15" : op === "removed" ? "bg-warn/15" : "";
  const sign = op === "added" ? "+" : op === "removed" ? "−" : "";
  return (
    <div className={`flex px-3 py-0.5 ${style}`}>
      <span className="w-5 shrink-0 font-semibold text-muted" aria-label={op === "added" ? "追加" : op === "removed" ? "削除" : undefined}>
        {sign}
      </span>
      <span className="min-w-0 break-all whitespace-pre-wrap">{children || " "}</span>
    </div>
  );
}

export default function TextDiff() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [ignoreWs, setIgnoreWs] = useState(false);
  const ops = useMemo(() => diffLines(a, b, ignoreWs), [a, b, ignoreWs]);
  const added = ops?.filter((o) => o.type === "added").length ?? 0;
  const removed = ops?.filter((o) => o.type === "removed").length ?? 0;
  const rows: ReactNode[] = [];
  if (ops) {
    for (let k = 0; k < ops.length; k++) {
      const o = ops[k];
      const next = ops[k + 1];
      // 削除の直後が追加なら「書き換え」とみなし、変わった部分に下線を引く
      if (o.type === "removed" && next?.type === "added") {
        const r = changedRange(o.text, next.text);
        rows.push(<Line key={k} op="removed">{marked(o.text, r.a)}</Line>, <Line key={`${k}+`} op="added">{marked(next.text, r.b)}</Line>);
        k++;
      } else rows.push(<Line key={k} op={o.type}>{o.text}</Line>);
    }
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className={ui.label}>
          変更前
          <textarea className={`${ui.input} min-h-44 font-mono text-sm`} value={a} onChange={(e) => setA(e.target.value)} placeholder="元の文章" />
        </label>
        <label className={ui.label}>
          変更後
          <textarea className={`${ui.input} min-h-44 font-mono text-sm`} value={b} onChange={(e) => setB(e.target.value)} placeholder="直したあとの文章" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Check label="前後の空白の違いを無視" checked={ignoreWs} onChange={setIgnoreWs} />
        <button
          type="button"
          className={ui.button}
          onClick={() => {
            setA(b);
            setB(a);
          }}
          disabled={!a && !b}
        >
          左右を入れ替え
        </button>
        <button
          type="button"
          className={ui.button}
          onClick={() => {
            setA("");
            setB("");
          }}
          disabled={!a && !b}
        >
          消す
        </button>
        <span className="text-sm" aria-live="polite">
          {!ops ? "行数が多すぎます（それぞれ4,000行程度まで）" : a || b ? (added || removed ? `追加 ${added} 行・削除 ${removed} 行` : "違いはありません") : "2つの文章を入れると、違いを色分けします"}
        </span>
      </div>
      {ops && (a || b) && <div className="max-h-[28rem] overflow-auto rounded-xl border border-line font-mono text-sm">{rows}</div>}
    </div>
  );
}
