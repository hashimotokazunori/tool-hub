"use client";

import { useState } from "react";
import { Field, FieldGrid, Stats, yen } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { calcWarikan, type WarikanInput } from "./logic";

export default function Warikan() {
  const [v, setV] = useState<WarikanInput>({ total: 23500, people: 6, unit: 100, heavyPayers: 0, ratio: 1.5 });
  const set = (k: keyof WarikanInput, value: number) => setV((p) => ({ ...p, [k]: value }));
  const r = calcWarikan(v);
  const k = Math.min(Math.max(0, Math.floor(v.heavyPayers || 0)), Math.max(1, Math.floor(v.people || 1)));
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Field label="合計金額（円）">
          <input className={ui.input} type="number" inputMode="numeric" min={0} value={v.total || ""} onChange={(e) => set("total", Number(e.target.value))} />
        </Field>
        <Field label="人数">
          <input className={ui.input} type="number" inputMode="numeric" min={1} value={v.people || ""} onChange={(e) => set("people", Number(e.target.value))} />
        </Field>
        <Field label="集める単位">
          <select className={ui.input} value={v.unit} onChange={(e) => set("unit", Number(e.target.value))}>
            {[1, 10, 100, 500, 1000].map((u) => (
              <option key={u} value={u}>
                {u.toLocaleString("ja-JP")}円
              </option>
            ))}
          </select>
        </Field>
        <Field label="多めに払う人の数（いなければ0）">
          <input className={ui.input} type="number" inputMode="numeric" min={0} value={v.heavyPayers} onChange={(e) => set("heavyPayers", Number(e.target.value))} />
        </Field>
        <Field label="多めに払う人は何倍">
          <input className={ui.input} type="number" inputMode="decimal" min={1} step={0.1} value={v.ratio} onChange={(e) => set("ratio", Number(e.target.value))} />
        </Field>
      </FieldGrid>
      <Stats
        items={[
          { label: k ? `1人あたり（${Math.max(1, Math.floor(v.people || 1)) - k}人）` : "1人あたり", value: yen(r.perPerson), emphasis: true },
          ...(r.perHeavyPayer !== null ? [{ label: `多めに払う人（${k}人）`, value: yen(r.perHeavyPayer) }] : []),
          { label: "集まる合計", value: yen(r.collected) },
          { label: "余り（幹事の手元に残る額）", value: r.surplus ? yen(r.surplus) : "ぴったり" },
        ]}
      />
      <p className={ui.note}>ちょうど割ると1人 {r.exact.toLocaleString("ja-JP", { maximumFractionDigits: 1 })} 円です。集める単位に切り上げて計算しています。</p>
    </div>
  );
}
