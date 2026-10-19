"use client";

import { useState } from "react";
import { Choice } from "@/components/TextTransform";
import { Field, FieldGrid, Stats, yen } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { calcBmi, calcLoan, type LoanInput, type LoanMethod } from "./logic";

const man = (n: number) => (n >= 10_000 ? `${(n / 10_000).toLocaleString("ja-JP", { maximumFractionDigits: 1 })} 万円` : yen(n));

export function LoanSimulator() {
  const [v, setV] = useState<LoanInput>({ amount: 30_000_000, annualRate: 1.5, years: 35, method: "annuity" });
  const set = <K extends keyof LoanInput>(k: K, x: LoanInput[K]) => setV((p) => ({ ...p, [k]: x }));
  const r = calcLoan(v);
  const [showAll, setShowAll] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Field label="借入額（万円）">
          <input className={ui.input} type="number" inputMode="decimal" min={0} step="10" value={v.amount ? v.amount / 10_000 : ""} onChange={(e) => set("amount", Math.round(Number(e.target.value) * 10_000))} />
        </Field>
        <Field label="金利（年・%）">
          <input className={ui.input} type="number" inputMode="decimal" min={0} max={30} step="0.01" value={Number.isFinite(v.annualRate) ? v.annualRate : ""} onChange={(e) => set("annualRate", e.target.value === "" ? Number.NaN : Number(e.target.value))} />
        </Field>
        <Field label="返済期間（年）">
          <input className={ui.input} type="number" inputMode="numeric" min={1} max={50} value={v.years || ""} onChange={(e) => set("years", Number(e.target.value))} />
        </Field>
        <Choice<LoanMethod>
          label="返済方法"
          value={v.method}
          onChange={(m) => set("method", m)}
          options={[
            ["annuity", "元利均等（毎月同じ額）"],
            ["principal", "元金均等（だんだん減る）"],
          ]}
        />
      </FieldGrid>
      {r ? (
        <>
          <Stats
            items={[
              { label: v.method === "annuity" ? "毎月の返済額" : "初回の返済額", value: yen(r.firstPayment), emphasis: true },
              ...(v.method === "principal" ? [{ label: "最終回の返済額", value: yen(r.lastPayment) }] : []),
              { label: "総返済額", value: man(r.totalPayment) },
              { label: "利息の合計", value: man(r.totalInterest) },
              { label: "返済回数", value: `${r.months} 回` },
            ]}
          />
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm whitespace-nowrap tabular-nums">
              <thead className="bg-field text-left text-xs text-muted">
                <tr>
                  <th className="px-3 py-1.5 font-medium">年</th>
                  <th className="px-3 py-1.5 text-right font-medium">その年の返済額</th>
                  <th className="px-3 py-1.5 text-right font-medium">うち利息</th>
                  <th className="px-3 py-1.5 text-right font-medium">年末の残高</th>
                </tr>
              </thead>
              <tbody>
                {(showAll ? r.yearly : r.yearly.slice(0, 5)).map((y) => (
                  <tr key={y.year} className="border-t border-line">
                    <td className="px-3 py-1.5">{y.year}年目</td>
                    <td className="px-3 py-1.5 text-right">{yen(y.paid)}</td>
                    <td className="px-3 py-1.5 text-right">{yen(y.interest)}</td>
                    <td className="px-3 py-1.5 text-right">{yen(y.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {r.yearly.length > 5 && (
            <button type="button" className={`${ui.button} w-fit`} onClick={() => setShowAll((x) => !x)}>
              {showAll ? "5年目までにする" : `${r.yearly.length}年目まですべて見る`}
            </button>
          )}
        </>
      ) : (
        <p className={ui.note}>借入額・金利（0〜30%）・返済期間（50年まで）を入れてください。</p>
      )}
      <p className={ui.note}>
        金利が変わらない場合の目安です（ボーナス払い・手数料・保証料・団体信用生命保険の保険料は含みません）。1円未満は毎月四捨五入しているため、金融機関の計算と数円ずれることがあります。実際の返済額は借入先にご確認ください。
      </p>
    </div>
  );
}

export function Bmi() {
  const [h, setH] = useState(170);
  const [w, setW] = useState(65);
  const r = calcBmi(h, w);
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Field label="身長（cm）">
          <input className={ui.input} type="number" inputMode="decimal" min={50} max={250} step="0.1" value={h || ""} onChange={(e) => setH(Number(e.target.value))} />
        </Field>
        <Field label="体重（kg）">
          <input className={ui.input} type="number" inputMode="decimal" min={1} step="0.1" value={w || ""} onChange={(e) => setW(Number(e.target.value))} />
        </Field>
      </FieldGrid>
      {r ? (
        <>
          <Stats
            items={[
              { label: "BMI", value: r.bmi.toFixed(1), emphasis: true },
              { label: "判定（日本肥満学会）", value: r.label },
              { label: "BMI 22 の体重（標準体重）", value: `${r.standardWeight.toFixed(1)} kg` },
              { label: "標準体重との差", value: `${w - r.standardWeight >= 0 ? "+" : "−"}${Math.abs(w - r.standardWeight).toFixed(1)} kg` },
            ]}
          />
          <div className="relative h-3 overflow-hidden rounded-full" aria-hidden="true" style={{ background: "linear-gradient(90deg,#7aa7d8 0 28.3%,#7ccf80 28.3% 50%,#e7c35a 50% 66.7%,#f08a5d 66.7% 100%)" }}>
            <span className="absolute top-0 h-full w-1 -translate-x-1/2 rounded bg-ink" style={{ left: `${Math.min(100, Math.max(0, ((r.bmi - 10) / 30) * 100))}%` }} />
          </div>
          <p className={ui.note}>目盛り：BMI 10〜40（青：18.5未満、緑：18.5〜25未満、黄：25〜30未満、橙：30以上）</p>
        </>
      ) : (
        <p className={ui.note}>身長と体重を入れてください。</p>
      )}
      <p className={ui.note}>BMI = 体重(kg) ÷ 身長(m)²。18歳以上の大人向けの目安で、子ども・妊娠中の方・筋肉量の多い方には当てはまりにくいことがあります。健康状態の判断は医師にご相談ください。</p>
    </div>
  );
}
