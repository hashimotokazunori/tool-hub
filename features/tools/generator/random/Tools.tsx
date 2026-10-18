"use client";

import { useState } from "react";
import { Check, Choice } from "@/components/TextTransform";
import { CopyButton, Field, FieldGrid } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { useClientValue } from "@/components/useClientValue";
import { randomNumbers, uuidV4, uuidV7, type RandomOptions } from "./logic";

/** 設定と「作り直した回数」が同じあいだは同じ結果を返す（乱数は端末の中で作る） */
function memo<T>() {
  const c = { key: "", value: undefined as T | undefined };
  return (key: string, make: () => T): T => {
    if (c.key !== key || c.value === undefined) {
      c.key = key;
      c.value = make();
    }
    return c.value;
  };
}
const randomMemo = memo<ReturnType<typeof randomNumbers>>();
const uuidMemo = memo<string[]>();

export function RandomNumber() {
  const [o, setO] = useState<RandomOptions>({ min: 1, max: 100, count: 5, decimals: 0, unique: true, sort: false });
  const [round, setRound] = useState(0);
  const r = useClientValue(() => randomMemo(`${JSON.stringify(o)}#${round}`, () => randomNumbers(o)), null);
  const num = (k: "min" | "max" | "count") => (
    <Field label={{ min: "最小", max: "最大", count: "個数" }[k]}>
      <input className={ui.input} type="number" inputMode="decimal" value={Number.isFinite(o[k]) ? o[k] : ""} onChange={(e) => setO({ ...o, [k]: Number(e.target.value) })} />
    </Field>
  );
  const values = r && "values" in r ? r.values : [];
  const text = values.map((v) => v.toFixed(o.decimals)).join("\n");
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        {num("min")}
        {num("max")}
        {num("count")}
        <Choice label="種類" value={String(o.decimals) as "0" | "1" | "2"} onChange={(v) => setO({ ...o, decimals: Number(v) as 0 | 1 | 2 })} options={[["0", "整数"], ["1", "小数第1位まで"], ["2", "小数第2位まで"]]} />
      </FieldGrid>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <Check label="重複しない" checked={o.unique} onChange={(v) => setO({ ...o, unique: v })} />
        <Check label="小さい順に並べる" checked={o.sort} onChange={(v) => setO({ ...o, sort: v })} />
      </div>
      {r && "error" in r ? (
        <p className="text-sm text-warn">{r.error}</p>
      ) : (
        <div className="flex flex-wrap gap-2" aria-live="polite">
          {values.slice(0, 300).map((v, i) => (
            <span key={i} className="rounded-lg bg-accent-soft px-3 py-1.5 font-mono text-xl font-semibold tabular-nums">
              {v.toFixed(o.decimals)}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={ui.buttonPrimary} onClick={() => setRound((n) => n + 1)}>
          もう一度
        </button>
        <CopyButton text={text} />
      </div>
    </div>
  );
}

export function Uuid() {
  const [count, setCount] = useState(5);
  const [version, setVersion] = useState<"4" | "7">("4");
  const [upper, setUpper] = useState(false);
  const [noHyphen, setNoHyphen] = useState(false);
  const [round, setRound] = useState(0);
  const n = Math.min(1000, Math.max(1, Math.floor(count || 1)));
  const raw = useClientValue(() => uuidMemo(`${n}#${version}#${round}`, () => Array.from({ length: n }, () => (version === "7" ? uuidV7() : uuidV4()))), [] as string[]);
  const list = raw.map((u) => (noHyphen ? u.replace(/-/g, "") : u)).map((u) => (upper ? u.toUpperCase() : u));
  const text = list.join("\n");
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Field label="個数">
          <input className={ui.input} type="number" inputMode="numeric" min={1} max={1000} value={count || ""} onChange={(e) => setCount(Number(e.target.value))} />
        </Field>
        <Choice label="バージョン" value={version} onChange={setVersion} options={[["4", "v4（ランダム）"], ["7", "v7（作成時刻の順に並ぶ）"]]} />
      </FieldGrid>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <Check label="大文字" checked={upper} onChange={setUpper} />
        <Check label="ハイフンなし" checked={noHyphen} onChange={setNoHyphen} />
      </div>
      <textarea className={`${ui.input} min-h-40 font-mono text-sm`} readOnly value={text} aria-label="作成したUUID" />
      <div className="flex flex-wrap gap-2">
        <button type="button" className={ui.buttonPrimary} onClick={() => setRound((x) => x + 1)}>
          作り直す
        </button>
        <CopyButton text={text} />
      </div>
    </div>
  );
}
