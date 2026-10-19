"use client";

import { useState } from "react";
import { Choice } from "@/components/TextTransform";
import { Field, FieldGrid, Stats, yen } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { useClientValue } from "@/components/useClientValue";
import { toYmd } from "@/lib/date";
import { addMonthsYm, calcCompound, calcOvertime, metersToSteps, monthsToGoal, monthsUntil, requiredMonthly, stepsToMeters, strideFromHeight, walkMinutes, type OvertimeHours } from "./logic";

const num = (s: string) => (s === "" ? Number.NaN : Number(s));
const fmt = (x: number, d = 1) => (Number.isFinite(x) ? x.toLocaleString("ja-JP", { maximumFractionDigits: d }) : "—");
const yenR = (x: number) => yen(Math.round(x));
const man = (n: number) => (Math.abs(n) >= 10_000 ? `${(n / 10_000).toLocaleString("ja-JP", { maximumFractionDigits: 1 })} 万円` : yenR(n));
const minutesText = (min: number) => {
  if (!Number.isFinite(min)) return "—";
  const m = Math.round(min);
  return m >= 60 ? `${Math.floor(m / 60)} 時間 ${m % 60} 分` : `${m} 分`;
};

function Num({ label, value, onChange, step, min, max }: { label: string; value: number; onChange: (v: number) => void; step?: string; min?: number; max?: number }) {
  return (
    <Field label={label}>
      <input className={ui.input} type="number" inputMode="decimal" step={step ?? "any"} min={min ?? 0} max={max} value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(num(e.target.value))} />
    </Field>
  );
}

/* ---------- 複利計算 ---------- */

export function CompoundInterest() {
  const [principal, setPrincipal] = useState(1_000_000);
  const [monthly, setMonthly] = useState(30_000);
  const [rate, setRate] = useState(3);
  const [years, setYears] = useState(20);
  const [showAll, setShowAll] = useState(false);
  const r = calcCompound({ principal, monthly, annualRate: rate, years });
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Num label="元本・最初に入れる金額（円）" value={principal} onChange={setPrincipal} step="10000" />
        <Num label="毎月の積立額（円）" value={monthly} onChange={setMonthly} step="1000" />
        <Num label="年利（%）" value={rate} onChange={setRate} step="0.1" min={-50} max={100} />
        <Num label="期間（年）" value={years} onChange={setYears} step="1" max={100} />
      </FieldGrid>
      {r ? (
        <>
          <Stats
            items={[
              { label: `${fmt(years)}年後の金額`, value: man(r.final), emphasis: true },
              { label: "入れたお金の合計", value: man(r.contributed) },
              { label: "増えた分（運用益）", value: man(r.gain) },
              { label: "増えた割合", value: `${fmt((r.gain / r.contributed) * 100)} %` },
            ]}
          />
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm whitespace-nowrap tabular-nums">
              <thead className="bg-field text-left text-xs text-muted">
                <tr>
                  <th className="px-3 py-1.5 font-medium">年</th>
                  <th className="px-3 py-1.5 text-right font-medium">入れたお金の合計</th>
                  <th className="px-3 py-1.5 text-right font-medium">増えた分</th>
                  <th className="px-3 py-1.5 text-right font-medium">年末の金額</th>
                </tr>
              </thead>
              <tbody>
                {(showAll ? r.yearly : r.yearly.slice(0, 10)).map((y) => (
                  <tr key={y.year} className="border-t border-line">
                    <td className="px-3 py-1.5">{y.year}年目</td>
                    <td className="px-3 py-1.5 text-right">{yenR(y.contributed)}</td>
                    <td className="px-3 py-1.5 text-right">{yenR(y.gain)}</td>
                    <td className="px-3 py-1.5 text-right">{yenR(y.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {r.yearly.length > 10 && (
            <button type="button" className={`${ui.button} w-fit`} onClick={() => setShowAll((x) => !x)}>
              {showAll ? "10年目までにする" : `${r.yearly.length}年目まですべて見る`}
            </button>
          )}
        </>
      ) : (
        <p className={ui.note}>元本か毎月の積立額のどちらかと、年利・期間（100年まで）を入れてください。</p>
      )}
      <p className={ui.note}>
        年利を12で割った利率で毎月複利運用し、積立は毎月末に入れる前提の計算です。利率が期間中ずっと変わらない場合の目安で、実際の運用成果を保証するものではありません。税金（NISA口座以外では運用益に通常20.315%）や手数料は差し引いていません。投資の判断はご自身で行ってください。
      </p>
    </div>
  );
}

/* ---------- 貯金目標 ---------- */

type GoalMode = "need" | "when";
type PeriodMode = "months" | "date";

export function SavingsGoal() {
  const today = useClientValue(() => toYmd(new Date()), "");
  const [mode, setMode] = useState<GoalMode>("need");
  const [target, setTarget] = useState(1_000_000);
  const [current, setCurrent] = useState(0);
  const [rate, setRate] = useState(0);
  const [period, setPeriod] = useState<PeriodMode>("months");
  const [months, setMonths] = useState(24);
  const [deadline, setDeadline] = useState("");
  const [monthly, setMonthly] = useState(30_000);

  const n = period === "months" ? months : today && deadline ? monthsUntil(today, deadline) : null;
  const need = mode === "need" && n !== null && n >= 1 ? requiredMonthly({ target, current, months: n, annualRate: rate }) : null;
  const when = mode === "when" ? monthsToGoal({ target, current, monthly, annualRate: rate }) : null;
  const reach = when && today ? addMonthsYm(today, when.months) : null;

  return (
    <div className="flex flex-col gap-4">
      <Choice<GoalMode>
        label="計算すること"
        value={mode}
        onChange={setMode}
        options={[
          ["need", "毎月いくら貯めればよいか"],
          ["when", "いつ目標に届くか"],
        ]}
      />
      <FieldGrid>
        <Num label="目標額（円）" value={target} onChange={setTarget} step="10000" />
        <Num label="今の貯金額（円）" value={current} onChange={setCurrent} step="10000" />
        <Num label="利息の年利（%・なければ0）" value={rate} onChange={setRate} step="0.01" max={50} />
        {mode === "need" ? (
          <>
            <Choice<PeriodMode>
              label="期間の決め方"
              value={period}
              onChange={setPeriod}
              options={[
                ["months", "月数で入れる"],
                ["date", "期限の年月で入れる"],
              ]}
            />
            {period === "months" ? (
              <Num label="期間（か月）" value={months} onChange={setMonths} step="1" max={1200} />
            ) : (
              <Field label="期限（その月の末まで）">
                <input className={ui.input} type="month" value={deadline.slice(0, 7)} onChange={(e) => setDeadline(e.target.value ? `${e.target.value}-01` : "")} />
              </Field>
            )}
          </>
        ) : (
          <Num label="毎月の積立額（円）" value={monthly} onChange={setMonthly} step="1000" />
        )}
      </FieldGrid>

      {mode === "need" &&
        (need && n !== null ? (
          <Stats
            items={[
              { label: "毎月の積立額", value: yen(need.monthly), emphasis: true },
              { label: "期間", value: `${n} か月` },
              { label: "1年あたり", value: yen(need.monthly * 12) },
              { label: "期間の終わりの金額", value: yenR(need.final) },
              ...(rate > 0 ? [{ label: "うち利息", value: yenR(need.interest) }] : []),
            ]}
          />
        ) : (
          <p className={ui.note} aria-live="polite">
            {period === "date" && n !== null && n < 1 ? "期限は来月以降の年月にしてください。" : "目標額・期間（1か月以上）を入れてください。"}
          </p>
        ))}

      {mode === "when" &&
        (when ? (
          <Stats
            items={[
              { label: "達成までの期間", value: when.months === 0 ? "達成済み" : `${when.months} か月`, emphasis: true },
              { label: "年に直すと", value: `${Math.floor(when.months / 12)} 年 ${when.months % 12} か月` },
              { label: "達成する月", value: reach ? `${reach.year}年${reach.month}月` : "—" },
              { label: "そのときの金額", value: yenR(when.balance) },
            ]}
          />
        ) : (
          <p className={ui.note} aria-live="polite">
            {monthly > 0 || rate > 0 ? "100年以内には目標に届きません。積立額を見直してください。" : "目標額と毎月の積立額を入れてください。"}
          </p>
        ))}

      <p className={ui.note}>
        積立は毎月末に入れ、利息は年利÷12で毎月複利で付く前提の目安です（利息にかかる税金は差し引いていません）。「達成する月」は今月を0か月目として数えています。毎月の積立額は1円単位で切り上げています。
      </p>
    </div>
  );
}

/* ---------- 残業代 ---------- */

type WageMode = "hourly" | "monthly";
const NO_HOURS: OvertimeHours = { ot: 20, otNight: 0, holiday: 0, holidayNight: 0, nightOnly: 0 };

export function OvertimePay() {
  const [wageMode, setWageMode] = useState<WageMode>("monthly");
  const [hourlyIn, setHourly] = useState(1_500);
  const [salary, setSalary] = useState(250_000);
  const [scheduled, setScheduled] = useState(160);
  const [h, setH] = useState<OvertimeHours>(NO_HOURS);
  const set = (k: keyof OvertimeHours) => (x: number) => setH((p) => ({ ...p, [k]: x }));
  const hourly = wageMode === "hourly" ? hourlyIn : salary > 0 && scheduled > 0 ? salary / scheduled : Number.NaN;
  const r = calcOvertime(hourly, h);
  return (
    <div className="flex flex-col gap-4">
      <Choice<WageMode>
        label="基本の賃金"
        value={wageMode}
        onChange={setWageMode}
        options={[
          ["monthly", "月給から計算する"],
          ["hourly", "時給を入れる"],
        ]}
      />
      <FieldGrid>
        {wageMode === "hourly" ? (
          <Num label="1時間あたりの賃金（円）" value={hourlyIn} onChange={setHourly} step="10" />
        ) : (
          <>
            <Num label="月給（割増の基礎になる額・円）" value={salary} onChange={setSalary} step="1000" />
            <Num label="1か月の所定労働時間（時間）" value={scheduled} onChange={setScheduled} step="0.5" />
          </>
        )}
      </FieldGrid>
      <h3 className={ui.h3}>1か月の時間（時間）</h3>
      <FieldGrid>
        <Num label="時間外（深夜を除く）" value={h.ot} onChange={set("ot")} step="0.5" />
        <Num label="時間外かつ深夜（22時〜5時）" value={h.otNight} onChange={set("otNight")} step="0.5" />
        <Num label="法定休日（深夜を除く）" value={h.holiday} onChange={set("holiday")} step="0.5" />
        <Num label="法定休日かつ深夜" value={h.holidayNight} onChange={set("holidayNight")} step="0.5" />
        <Num label="所定時間内の深夜" value={h.nightOnly} onChange={set("nightOnly")} step="0.5" />
      </FieldGrid>
      {r ? (
        <>
          <Stats
            items={[
              { label: "残業代の合計（目安）", value: yen(r.total), emphasis: true },
              { label: "1時間あたりの賃金", value: `${fmt(hourly, 2)} 円` },
              { label: "時間外の合計", value: `${fmt(r.overtimeHours)} 時間` },
              { label: "うち月60時間超", value: `${fmt(r.over60Hours)} 時間` },
            ]}
          />
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm whitespace-nowrap tabular-nums">
              <thead className="bg-field text-left text-xs text-muted">
                <tr>
                  <th className="px-3 py-1.5 font-medium">区分</th>
                  <th className="px-3 py-1.5 text-right font-medium">時間</th>
                  <th className="px-3 py-1.5 text-right font-medium">賃金×</th>
                  <th className="px-3 py-1.5 text-right font-medium">金額</th>
                </tr>
              </thead>
              <tbody>
                {r.rows
                  .filter((x) => x.hours > 0)
                  .map((x) => (
                    <tr key={x.label} className="border-t border-line">
                      <td className="px-3 py-1.5">{x.label}</td>
                      <td className="px-3 py-1.5 text-right">{fmt(x.hours, 2)}</td>
                      <td className="px-3 py-1.5 text-right">{x.rate.toFixed(2)}</td>
                      <td className="px-3 py-1.5 text-right">{yen(x.amount)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className={ui.note}>賃金を入れてください。</p>
      )}
      <ul className={`${ui.note} list-disc space-y-1 pl-5`}>
        <li>労働基準法の割増率の下限で計算した目安です：時間外25%、時間外のうち月60時間を超えた分50%、深夜（22時〜5時）25%、法定休日35%。深夜の割増は重ねてかかります（時間外かつ深夜50%、法定休日かつ深夜60%）。</li>
        <li>「時間外」は法定労働時間（1日8時間・週40時間）を超えた時間です。所定時間を超えても法定時間内なら割増は不要です。法定休日の労働は60時間の計算に含めません。</li>
        <li>月給には家族手当・通勤手当・住宅手当など、割増の基礎から除く手当は含めないでください。会社の規則で率が高く決められていることもあります。管理監督者などは扱いが異なります。正確な額は勤務先にご確認ください。</li>
      </ul>
    </div>
  );
}

/* ---------- 歩数・距離 ---------- */

type StrideMode = "height" | "stride";
type Direction = "steps" | "distance";

export function StepsDistance() {
  const [strideMode, setStrideMode] = useState<StrideMode>("height");
  const [height, setHeight] = useState(165);
  const [strideIn, setStride] = useState(70);
  const [dir, setDir] = useState<Direction>("steps");
  const [steps, setSteps] = useState(8_000);
  const [km, setKm] = useState(5);
  const stride = strideMode === "height" ? strideFromHeight(height) : strideIn;
  const meters = dir === "steps" ? stepsToMeters(steps, stride) : km * 1000;
  const stepCount = dir === "steps" ? steps : metersToSteps(km * 1000, stride);
  const ok = stride > 0 && Number.isFinite(meters) && Number.isFinite(stepCount);
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Choice<StrideMode>
          label="歩幅の決め方"
          value={strideMode}
          onChange={setStrideMode}
          options={[
            ["height", "身長から推定する"],
            ["stride", "歩幅を入れる"],
          ]}
        />
        {strideMode === "height" ? <Num label="身長（cm）" value={height} onChange={setHeight} step="1" /> : <Num label="歩幅（cm）" value={strideIn} onChange={setStride} step="1" />}
        <Choice<Direction>
          label="換算の向き"
          value={dir}
          onChange={setDir}
          options={[
            ["steps", "歩数 → 距離"],
            ["distance", "距離 → 歩数"],
          ]}
        />
        {dir === "steps" ? <Num label="歩数（歩）" value={steps} onChange={setSteps} step="100" /> : <Num label="距離（km）" value={km} onChange={setKm} step="0.1" />}
      </FieldGrid>
      {ok ? (
        <Stats
          items={[
            dir === "steps" ? { label: "距離", value: `${fmt(meters / 1000, 2)} km`, emphasis: true } : { label: "歩数", value: `${stepCount.toLocaleString("ja-JP")} 歩`, emphasis: true },
            { label: "歩幅", value: `${fmt(stride)} cm` },
            { label: "距離（m）", value: `${Math.round(meters).toLocaleString("ja-JP")} m` },
            { label: "歩く時間（分速80m）", value: minutesText(walkMinutes(meters)) },
          ]}
        />
      ) : (
        <p className={ui.note}>身長か歩幅と、歩数または距離を入れてください。</p>
      )}
      <p className={ui.note}>
        身長から出す歩幅は「身長 × 0.45」というよく使われる目安で、実際の歩幅は人や歩き方で変わります。正確に知りたいときは、10歩歩いた距離を測って10で割り、「歩幅を入れる」で入れてください。歩く時間は分速80m（不動産の広告で徒歩1分＝80mとする基準と同じ）で計算した目安です。
      </p>
    </div>
  );
}
