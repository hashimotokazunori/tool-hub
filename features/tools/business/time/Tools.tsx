"use client";

import { useState } from "react";
import { Choice } from "@/components/TextTransform";
import { Field, FieldGrid, Stats, yen } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { fromHourly, fromMonthly } from "@/features/tools/life/wage/logic";
import { formatMinutes, readingPlan, scriptChars, speakingMinutes } from "./logic";

function Num({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step?: string }) {
  return (
    <Field label={label}>
      <input className={ui.input} type="number" inputMode="decimal" step={step ?? "any"} value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(e.target.value === "" ? Number.NaN : Number(e.target.value))} />
    </Field>
  );
}
const n0 = (x: number) => (Number.isFinite(x) ? Math.round(x).toLocaleString("ja-JP") : "—");

export function WageConverter() {
  const [mode, setMode] = useState<"hourly" | "monthly">("hourly");
  const [hourly, setHourly] = useState(1200);
  const [monthly, setMonthly] = useState(250000);
  const [hours, setHours] = useState(8);
  const [days, setDays] = useState(20);
  const [bonus, setBonus] = useState(0);
  const w = { hoursPerDay: hours, daysPerMonth: days, bonusMonths: bonus };
  const h = fromHourly(hourly, w);
  const m = fromMonthly(monthly, w);
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Choice label="計算" value={mode} onChange={setMode} options={[["hourly", "時給 → 月給・年収"], ["monthly", "月給 → 時給"]]} />
        {mode === "hourly" ? <Num label="時給（円）" value={hourly} onChange={setHourly} /> : <Num label="月給（円）" value={monthly} onChange={setMonthly} />}
        <Num label="1日の勤務時間" value={hours} onChange={setHours} step="0.25" />
        <Num label="1か月の勤務日数" value={days} onChange={setDays} step="0.5" />
        <Num label="賞与（月給の何か月分。なければ0）" value={bonus} onChange={setBonus} step="0.5" />
      </FieldGrid>
      {mode === "hourly" ? (
        <Stats
          items={[
            { label: "月給", value: yen(Math.round(h.monthly)), emphasis: true },
            { label: "日給", value: yen(Math.round(h.daily)) },
            { label: "年収", value: yen(Math.round(h.yearly)) },
            { label: "月の労働時間", value: `${h.monthlyHours} 時間` },
          ]}
        />
      ) : (
        <Stats
          items={[
            { label: "時給に換算", value: `${n0(m.hourly)} 円`, emphasis: true },
            { label: "日給に換算", value: `${n0(m.daily)} 円` },
            { label: "年収", value: yen(Math.round(m.yearly)) },
            { label: "月の労働時間", value: `${m.monthlyHours} 時間` },
          ]}
        />
      )}
      <p className={ui.note}>税金・社会保険料を引く前の金額（額面）です。</p>
    </div>
  );
}

export function PresentationTime() {
  const [text, setText] = useState("");
  const [chars, setChars] = useState(Number.NaN);
  const [speed, setSpeed] = useState<"250" | "300" | "350">("300");
  const [goal, setGoal] = useState(5);
  const c = text.trim() ? scriptChars(text) : Number.isFinite(chars) ? chars : 0;
  const min = speakingMinutes(c, Number(speed));
  return (
    <div className="flex flex-col gap-4">
      <label className={ui.label}>
        原稿（貼り付けると文字数を数えます）
        <textarea className={`${ui.input} min-h-36`} value={text} onChange={(e) => setText(e.target.value)} placeholder="発表やスピーチの原稿" />
      </label>
      <FieldGrid>
        <Num label="または文字数" value={chars} onChange={setChars} />
        <Choice label="話す速さ" value={speed} onChange={setSpeed} options={[["250", "ゆっくり（1分に250字）"], ["300", "ふつう（1分に300字）"], ["350", "速め（1分に350字）"]]} />
        <Num label="目標の時間（分）" value={goal} onChange={setGoal} step="0.5" />
      </FieldGrid>
      <Stats
        items={[
          { label: "話す時間の目安", value: formatMinutes(min), emphasis: true },
          { label: "原稿の文字数", value: `${c.toLocaleString("ja-JP")} 字` },
          { label: `${goal}分に合う文字数`, value: `${n0(goal * Number(speed))} 字` },
          { label: "スライド枚数の目安（1枚1分）", value: `${n0(Math.max(1, goal))} 枚` },
        ]}
      />
      <p className={ui.note}>1分300字は、原稿を読み上げる速さとしてよく使われる目安です。質疑応答や間（ま）の時間は含みません。</p>
    </div>
  );
}

export function ReadingTime() {
  const [pages, setPages] = useState(320);
  const [cpp, setCpp] = useState<"600" | "700" | "800" | "400">("600");
  const [speed, setSpeed] = useState<"400" | "600" | "900">("600");
  const [perDay, setPerDay] = useState(30);
  const r = readingPlan(pages, Number(cpp), Number(speed), perDay);
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Num label="ページ数" value={pages} onChange={setPages} />
        <Choice label="本の種類" value={cpp} onChange={setCpp} options={[["600", "文庫本（1ページ約600字）"], ["700", "新書（約700字）"], ["800", "単行本（約800字）"], ["400", "実用書・図の多い本（約400字）"]]} />
        <Choice label="読む速さ" value={speed} onChange={setSpeed} options={[["400", "ゆっくり（1分400字）"], ["600", "ふつう（1分600字）"], ["900", "速い（1分900字）"]]} />
        <Num label="1日の読書時間（分）" value={perDay} onChange={setPerDay} />
      </FieldGrid>
      <Stats
        items={[
          { label: "読み終わるまで", value: formatMinutes(r.minutes), emphasis: true },
          { label: `1日${perDay}分読むと`, value: `${n0(r.days)} 日` },
          { label: "本の文字数の目安", value: `${n0(r.chars)} 字` },
          { label: "1日に読めるページ", value: `${n0(r.pagesPerDay)} ページ` },
        ]}
      />
      <p className={ui.note}>1ページの文字数と読む速さは目安です。本の組み方や内容によって変わります。</p>
    </div>
  );
}
