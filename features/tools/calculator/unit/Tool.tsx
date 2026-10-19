"use client";

import { useState } from "react";
import { Field } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { TEMPS, UNITS, convertTemp, convertUnit, formatNumber, type TempUnit, type UnitKind } from "./logic";

const KINDS: [UnitKind, string][] = [
  ["length", "長さ"],
  ["mass", "重さ"],
  ["area", "面積"],
  ["volume", "体積・容量"],
  ["temperature", "温度"],
];
const DEFAULT_FROM: Record<UnitKind, string> = { length: "cm", mass: "kg", area: "m2", volume: "ml", temperature: "c" };

export default function UnitConverter() {
  const [kind, setKind] = useState<UnitKind>("length");
  const [from, setFrom] = useState("cm");
  const [value, setValue] = useState(100);
  const units = kind === "temperature" ? TEMPS.map((t) => ({ id: t.id as string, label: t.label as string, factor: 0 })) : UNITS[kind];
  const src = units.find((u) => u.id === from) ?? units[0];
  const rows = units.map((u) => ({
    u,
    v: !Number.isFinite(value) ? Number.NaN : kind === "temperature" ? convertTemp(value, src.id as TempUnit, u.id as TempUnit) : convertUnit(value, src, u),
  }));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="単位の種類">
        {KINDS.map(([k, l]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={kind === k}
            className={`rounded-full border px-3 py-1 text-sm ${kind === k ? "border-accent bg-accent text-accent-ink" : "border-line bg-panel"}`}
            onClick={() => {
              setKind(k);
              setFrom(DEFAULT_FROM[k]);
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="数値">
          <input className={ui.input} type="number" inputMode="decimal" step="any" value={Number.isFinite(value) ? value : ""} onChange={(e) => setValue(e.target.value === "" ? Number.NaN : Number(e.target.value))} />
        </Field>
        <Field label="単位">
          <select className={ui.input} value={src.id} onChange={(e) => setFrom(e.target.value)}>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <ul className="flex flex-col divide-y divide-line rounded-xl border border-line" aria-live="polite">
        {rows.map(({ u, v }) => (
          <li key={u.id} className={`flex items-baseline justify-between gap-3 px-3 py-2 ${u.id === src.id ? "bg-accent-soft" : ""}`}>
            <span className="text-sm text-muted">{u.label}</span>
            <button
              type="button"
              className="font-mono text-base font-semibold tabular-nums hover:underline"
              title="押すとこの単位を基準にする"
              onClick={() => {
                if (Number.isFinite(v)) setValue(Number(v.toPrecision(10)));
                setFrom(u.id);
              }}
            >
              {formatNumber(v)}
            </button>
          </li>
        ))}
      </ul>
      <p className={ui.note}>
        数値を押すと、その単位を基準に切り替えます。尺・寸・間・坪・匁・貫・合・升は尺貫法の換算値（1尺＝10/33m、1坪＝400/121m²、1升＝2401/1331L など）です。畳の広さは地域や建物で違うため、不動産広告の基準（1畳＝1.62m²以上）で計算しています。
      </p>
    </div>
  );
}
