"use client";

import { useState } from "react";
import { Field, FieldGrid, SavedNote, Stats, yen } from "@/components/ToolUI";
import { useStoredState } from "@/components/useStoredState";
import { ui } from "@/components/styles";
import {
  FIXED_CAP_FROM_YEAR,
  INCOME_TAX_RATES,
  breakdown,
  fullDeductionLimit,
  incomeTaxRatePct,
  rateFromTaxableIncome,
  specialCap,
  specialRatePct,
  type IncomeTaxRate,
} from "./logic";

type Saved = { shotokuwari: number; rate: IncomeTaxRate; year: number; totalIncome: number; donation: number };
const INITIAL: Saved = { shotokuwari: Number.NaN, rate: 10, year: 2026, totalIncome: Number.NaN, donation: Number.NaN };

const num = (s: string) => (s === "" ? Number.NaN : Number(s));
const pct = (x: number) => `${x.toLocaleString("ja-JP", { maximumFractionDigits: 3 })}%`;

const SOURCES = [
  ["総務省 ふるさと納税ポータル「税金の控除について」", "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/mechanism/deduction.html"],
  ["総務省「ふるさと納税ワンストップ特例制度」", "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/topics/20150401.html"],
  ["国税庁 No.2260 所得税の税率", "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm"],
  ["名古屋市「寄附金税額控除について」（特例控除の割合と上限の基準）", "https://www.city.nagoya.jp/kurashi/zeikin/1037356/1011880/1012149/1011890.html"],
  ["総務省「ふるさと納税制度の適正な運用について」（令和8年4月1日・特例控除額の定額上限）", "https://www.soumu.go.jp/main_content/001067617.pdf"],
] as const;

function Num({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step?: string }) {
  return (
    <Field label={label}>
      <input className={ui.input} type="number" inputMode="numeric" min={0} step={step ?? "1"} value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(num(e.target.value))} />
    </Field>
  );
}

export default function FurusatoLimit() {
  const [v, setV, reset] = useStoredState<Saved>("furusato-limit", INITIAL);
  const set = <K extends keyof Saved>(k: K, x: Saved[K]) => setV((p) => ({ ...p, [k]: x }));
  const [taxable, setTaxable] = useState(Number.NaN);
  const helperRate = rateFromTaxableIncome(taxable);

  const input = { shotokuwari: v.shotokuwari, rate: v.rate, year: v.year, totalIncome: v.totalIncome };
  const limit = fullDeductionLimit(input);
  const donation = Number.isFinite(v.donation) ? v.donation : (limit ?? Number.NaN);
  const b = breakdown(donation, input);
  const fixedCapApplies = v.year >= FIXED_CAP_FROM_YEAR && Number.isFinite(v.shotokuwari) && specialCap(v.shotokuwari, v.year) < v.shotokuwari / 5;

  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Num label="住民税の所得割額（市町村民税＋道府県民税の合計・円）" value={v.shotokuwari} onChange={(x) => set("shotokuwari", x)} step="100" />
        <Field label="所得税の税率">
          <select className={ui.input} value={v.rate} onChange={(e) => set("rate", Number(e.target.value) as IncomeTaxRate)}>
            {INCOME_TAX_RATES.map((r) => (
              <option key={r} value={r}>
                {r === 0 ? "0%（所得税がかからない）" : `${r}%`}
              </option>
            ))}
          </select>
        </Field>
        <Field label="寄附する年">
          <select className={ui.input} value={v.year >= FIXED_CAP_FROM_YEAR ? FIXED_CAP_FROM_YEAR : 2026} onChange={(e) => set("year", Number(e.target.value))}>
            <option value={2026}>2026年中に寄附</option>
            <option value={FIXED_CAP_FROM_YEAR}>2027年以降に寄附</option>
          </select>
        </Field>
        <Num label="総所得金額等（わかれば・円）" value={v.totalIncome} onChange={(x) => set("totalIncome", x)} step="1000" />
      </FieldGrid>

      <details className="rounded-xl border border-line bg-field/40 px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium">所得税の税率がわからないとき（課税される所得金額から調べる）</summary>
        <div className="mt-3 flex flex-col gap-2">
          <FieldGrid>
            <Num label="課税される所得金額（円）" value={taxable} onChange={setTaxable} step="1000" />
          </FieldGrid>
          {helperRate !== null && (
            <div className="flex flex-wrap items-center gap-2">
              <span>
                税率は <b>{helperRate}%</b> です。
              </span>
              <button type="button" className={ui.button} onClick={() => set("rate", helperRate)} disabled={helperRate === v.rate}>
                {helperRate === v.rate ? "この税率を使っています" : "この税率を使う"}
              </button>
            </div>
          )}
          <p className={ui.note}>
            課税される所得金額は、確定申告書の「課税される所得金額」の欄の額です。会社員なら、源泉徴収票の「給与所得控除後の金額」から「所得控除の額の合計額」を引いた額です。国税庁の速算表（1,000円未満切り捨て）：195万円未満 5%、330万円未満 10%、695万円未満 20%、900万円未満 23%、1,800万円未満 33%、4,000万円未満 40%、4,000万円以上 45%。
          </p>
        </div>
      </details>

      {limit !== null && b ? (
        <>
          <Stats
            items={[
              { label: "控除上限の目安（自己負担2,000円で収まる寄附額）", value: yen(limit), emphasis: true },
              { label: "住民税・特例分の上限", value: yen(Math.floor(specialCap(v.shotokuwari, v.year))) },
              { label: "特例分の割合", value: pct(specialRatePct(v.rate)) },
            ]}
          />
          {fixedCapApplies && <p className={ui.note}>2027年以降の寄附は、特例分の上限が「所得割額の20%」と「193万円」の低いほうになります。この入力では193万円のほうが低いため、193万円で計算しています。</p>}

          <h3 className={ui.h3}>寄附額ごとの内訳</h3>
          <FieldGrid>
            <Num label="寄附する額（空欄なら上限の目安で計算・円）" value={v.donation} onChange={(x) => set("donation", x)} step="1000" />
          </FieldGrid>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm whitespace-nowrap tabular-nums">
              <thead className="bg-field text-left text-xs text-muted">
                <tr>
                  <th className="px-3 py-1.5 font-medium">区分</th>
                  <th className="px-3 py-1.5 font-medium">計算</th>
                  <th className="px-3 py-1.5 text-right font-medium">金額</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-line">
                  <td className="px-3 py-1.5">寄附額</td>
                  <td className="px-3 py-1.5 text-muted" />
                  <td className="px-3 py-1.5 text-right">{yen(b.donation)}</td>
                </tr>
                <tr className="border-t border-line">
                  <td className="px-3 py-1.5">所得税からの控除</td>
                  <td className="px-3 py-1.5 text-muted">（寄附額−2,000円）×{pct(incomeTaxRatePct(v.rate))}</td>
                  <td className="px-3 py-1.5 text-right">{yen(b.incomeTax)}</td>
                </tr>
                <tr className="border-t border-line">
                  <td className="px-3 py-1.5">住民税・基本分</td>
                  <td className="px-3 py-1.5 text-muted">（寄附額−2,000円）×10%</td>
                  <td className="px-3 py-1.5 text-right">{yen(b.basic)}</td>
                </tr>
                <tr className="border-t border-line">
                  <td className="px-3 py-1.5">住民税・特例分</td>
                  <td className="px-3 py-1.5 text-muted">{b.specialCapped ? "上限で頭打ち" : `（寄附額−2,000円）×${pct(specialRatePct(v.rate))}`}</td>
                  <td className="px-3 py-1.5 text-right">{yen(b.special)}</td>
                </tr>
                <tr className="border-t border-line font-semibold">
                  <td className="px-3 py-1.5">自己負担</td>
                  <td className="px-3 py-1.5 font-normal text-muted">寄附額−控除の合計</td>
                  <td className={`px-3 py-1.5 text-right ${b.donation > limit ? "text-red-600 dark:text-red-400" : ""}`}>{yen(b.selfBurden)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {b.donation > limit && <p className={ui.note}>この寄附額は上限の目安を超えるため、自己負担が2,000円より多くなります。</p>}
          <p className={ui.note}>
            ワンストップ特例を使うと所得税からの控除はなくなり、同じ額が翌年度の住民税から差し引かれます。控除の合計は変わりません。各金額は1円未満を切り捨てた目安で、実際の端数処理は自治体によって異なります。
          </p>
        </>
      ) : (
        <p className={ui.note}>住民税の所得割額を入れてください。</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.button} onClick={reset}>
          消す
        </button>
      </div>
      <SavedNote />

      <h3 className={ui.h3}>所得割額はどこに書いてある？</h3>
      <ul className={`${ui.note} list-disc space-y-1 pl-5`}>
        <li>会社員など給与から住民税が引かれている人は、毎年5〜6月ごろ勤務先から渡される「特別徴収税額の決定通知書」の税額の欄にある「所得割額」です。市町村民税と道府県民税（都民税）の2つに分かれているので、合計して入れてください。</li>
        <li>自分で住民税を納めている人は、6月ごろ市区町村から届く「納税通知書」の「所得割額」です。</li>
        <li>上限の計算に使うのは、住宅ローン控除などの「税額控除」を引く前の所得割額です。通知書の所得割額がすでに住宅ローン控除やふるさと納税の控除を引いた後の額になっていると、実際より低く出ます。「税額控除前所得割額」の欄があれば、その額を入れてください。</li>
        <li>通知書は前の年の所得をもとにしています。今年の収入が前の年とほぼ同じなら目安になります。</li>
      </ul>

      <h3 className={ui.h3}>この計算について</h3>
      <ul className={`${ui.note} list-disc space-y-1 pl-5`}>
        <li>これは目安です。住宅ローン控除・医療費控除などを受ける人、年の途中で収入が変わる人、退職した人などは上限が変わります。正確な額はお住まいの市区町村（住民税の担当）や税務署に確かめてください。</li>
        <li>
          控除上限は「住民税・特例分 =（寄附額−2,000円）×特例分の割合」が「所得割額の20%」を超えない最大の寄附額です（上限の目安 = 所得割額×20% ÷ 特例分の割合 + 2,000円）。特例分の割合は 90% − 所得税の税率×1.021（復興特別所得税を含む。令和19年中の寄附まで）です。
        </li>
        <li>特例分の割合は、正確には住民税の課税総所得金額から人的控除差調整額を引いた額で決まるため、所得税の税率と1段階ずれることがあります。</li>
        <li>所得税の控除の対象は総所得金額等の40%まで、住民税・基本分の対象は30%までです。総所得金額等を入れたときだけ、この上限も確かめます。</li>
        <li>2027年（令和9年）以降の寄附は、特例分の上限が「所得割額の20%」と「193万円」（道府県民税と市町村民税の合計）の低いほうになります。</li>
        <li>確定申告をしなくてよい会社員などは、1年間の寄附先が5団体以内ならワンストップ特例を使えます。寄附のときに寄附先ごとに申請書を出します（受付の締め切りは寄附先に確認してください）。申請後に住所などが変わったときの届出は、寄附した翌年の1月10日までです。確定申告をすると、ワンストップ特例の申請はなかったことになるので、確定申告でふるさと納税も申告します。</li>
      </ul>
      <p className={ui.note}>出典：</p>
      <ul className={`${ui.note} list-disc space-y-1 pl-5`}>
        {SOURCES.map(([label, url]) => (
          <li key={url}>
            <a href={url} rel="noopener noreferrer" target="_blank" className="underline">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
