"use client";

import { useState } from "react";
import { Field, FieldGrid, Stats, yen } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { calcTax, type TaxInput } from "./logic";

export default function ConsumptionTax() {
  const [v, setV] = useState<TaxInput>({ amount: 1980, basis: "excluded", rate: 10, rounding: "floor" });
  const set = <K extends keyof TaxInput>(k: K, value: TaxInput[K]) => setV((p) => ({ ...p, [k]: value }));
  const r = calcTax(v);
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Field label="金額（円）">
          <input className={ui.input} type="number" inputMode="numeric" min={0} value={v.amount || ""} onChange={(e) => set("amount", Number(e.target.value))} />
        </Field>
        <Field label="入力した金額は">
          <select className={ui.input} value={v.basis} onChange={(e) => set("basis", e.target.value as TaxInput["basis"])}>
            <option value="excluded">税抜</option>
            <option value="included">税込</option>
          </select>
        </Field>
        <Field label="税率">
          <select className={ui.input} value={v.rate} onChange={(e) => set("rate", Number(e.target.value))}>
            <option value={10}>10%（標準税率）</option>
            <option value={8}>8%（軽減税率：飲食料品など）</option>
          </select>
        </Field>
        <Field label="1円未満の端数">
          <select className={ui.input} value={v.rounding} onChange={(e) => set("rounding", e.target.value as TaxInput["rounding"])}>
            <option value="floor">切り捨て</option>
            <option value="round">四捨五入</option>
            <option value="ceil">切り上げ</option>
          </select>
        </Field>
      </FieldGrid>
      <Stats
        items={[
          { label: "税抜", value: yen(r.excluded) },
          { label: `消費税（${v.rate}%）`, value: yen(r.tax) },
          { label: "税込", value: yen(r.included), emphasis: true },
        ]}
      />
    </div>
  );
}
