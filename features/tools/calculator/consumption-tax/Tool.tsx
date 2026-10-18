"use client";

import { useState } from "react";
import { Field, FieldGrid, Stats, yen } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { calcReceipt, calcTax, type ReceiptItem, type TaxInput } from "./logic";

type Mode = "single" | "receipt";

export default function ConsumptionTax() {
  const [mode, setMode] = useState<Mode>("single");
  const [v, setV] = useState<TaxInput>({ amount: 1980, basis: "excluded", rate: 10, rounding: "floor" });
  const set = <K extends keyof TaxInput>(k: K, value: TaxInput[K]) => setV((p) => ({ ...p, [k]: value }));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 self-start rounded-lg border border-line p-1" role="tablist" aria-label="計算のしかた">
        {(
          [
            ["single", "1つの金額"],
            ["receipt", "複数の品目（8%・10%混在）"],
          ] as [Mode, string][]
        ).map(([m, l]) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} className={`rounded-md px-3 py-1.5 text-sm ${mode === m ? "bg-accent text-accent-ink" : "text-ink"}`} onClick={() => setMode(m)}>
            {l}
          </button>
        ))}
      </div>
      <FieldGrid>
        {mode === "single" && (
          <Field label="金額（円）">
            <input className={ui.input} type="number" inputMode="numeric" min={0} value={v.amount || ""} onChange={(e) => set("amount", Number(e.target.value))} />
          </Field>
        )}
        <Field label="入力した金額は">
          <select className={ui.input} value={v.basis} onChange={(e) => set("basis", e.target.value as TaxInput["basis"])}>
            <option value="excluded">税抜</option>
            <option value="included">税込</option>
          </select>
        </Field>
        {mode === "single" && (
          <Field label="税率">
            <select className={ui.input} value={v.rate} onChange={(e) => set("rate", Number(e.target.value))}>
              <option value={10}>10%（標準税率）</option>
              <option value={8}>8%（軽減税率：飲食料品など）</option>
            </select>
          </Field>
        )}
        <Field label="1円未満の端数">
          <select className={ui.input} value={v.rounding} onChange={(e) => set("rounding", e.target.value as TaxInput["rounding"])}>
            <option value="floor">切り捨て</option>
            <option value="round">四捨五入</option>
            <option value="ceil">切り上げ</option>
          </select>
        </Field>
      </FieldGrid>
      {mode === "single" ? <Single v={v} /> : <Receipt basis={v.basis} rounding={v.rounding} />}
    </div>
  );
}

function Single({ v }: { v: TaxInput }) {
  const r = calcTax(v);
  return (
    <Stats
      items={[
        { label: "税抜", value: yen(r.excluded) },
        { label: `消費税（${v.rate}%）`, value: yen(r.tax) },
        { label: "税込", value: yen(r.included), emphasis: true },
      ]}
    />
  );
}

const blank = (rate: number): ReceiptItem => ({ name: "", price: 0, rate });

function Receipt({ basis, rounding }: Pick<TaxInput, "basis" | "rounding">) {
  const [items, setItems] = useState<ReceiptItem[]>([
    { name: "お弁当", price: 540, rate: 8 },
    { name: "お茶", price: 150, rate: 8 },
    { name: "ボールペン", price: 220, rate: 10 },
  ]);
  const update = (i: number, patch: Partial<ReceiptItem>) => setItems((list) => list.map((it, k) => (k === i ? { ...it, ...patch } : it)));
  const r = calcReceipt(items, basis, rounding);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-4 sm:gap-2">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 sm:grid-cols-[1fr_8rem_auto_auto]">
            <input className={`${ui.input} col-span-3 sm:col-span-1`} aria-label={`${i + 1}行目の品名`} placeholder="品名（任意）" value={it.name} onChange={(e) => update(i, { name: e.target.value })} />
            <input className={ui.input} aria-label={`${i + 1}行目の金額`} type="number" inputMode="numeric" min={0} placeholder="金額" value={it.price || ""} onChange={(e) => update(i, { price: Number(e.target.value) })} />
            <select className={`${ui.input} w-auto`} aria-label={`${i + 1}行目の税率`} value={it.rate} onChange={(e) => update(i, { rate: Number(e.target.value) })}>
              <option value={10}>10%</option>
              <option value={8}>8%※</option>
            </select>
            <button type="button" className={ui.button} aria-label={`${i + 1}行目を削除`} onClick={() => setItems((list) => list.filter((_, k) => k !== i))}>
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={ui.button} onClick={() => setItems((list) => [...list, blank(10)])}>
          ＋ 10%の品目
        </button>
        <button type="button" className={ui.button} onClick={() => setItems((list) => [...list, blank(8)])}>
          ＋ 8%の品目
        </button>
        <button type="button" className={ui.button} onClick={() => setItems([blank(10)])}>
          全部消す
        </button>
      </div>
      {r.rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap tabular-nums">
            <thead className="text-left text-muted">
              <tr>
                <th className="py-1 font-normal">税率</th>
                <th className="py-1 text-right font-normal">税抜</th>
                <th className="py-1 text-right font-normal">消費税</th>
                <th className="py-1 text-right font-normal">税込</th>
              </tr>
            </thead>
            <tbody>
              {r.rows.map((row) => (
                <tr key={row.rate} className="border-t border-line">
                  <td className="py-1.5">
                    {row.rate}%{row.rate === 8 && "（軽減）"}・{row.count}点
                  </td>
                  <td className="py-1.5 text-right">{yen(row.excluded)}</td>
                  <td className="py-1.5 text-right">{yen(row.tax)}</td>
                  <td className="py-1.5 text-right">{yen(row.included)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Stats
        items={[
          { label: "税抜の合計", value: yen(r.total.excluded) },
          { label: "消費税の合計", value: yen(r.total.tax) },
          { label: "税込の合計", value: yen(r.total.included), emphasis: true },
        ]}
      />
      <p className={ui.note}>※は軽減税率（8%）の品目です。インボイス（適格請求書）と同じく、税率ごとに合計してから1回だけ端数を処理しています。</p>
    </div>
  );
}
