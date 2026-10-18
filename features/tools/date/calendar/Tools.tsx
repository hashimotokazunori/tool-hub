"use client";

import { useState } from "react";
import { Field, FieldGrid, Stats } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { useClientValue } from "@/components/useClientValue";
import { formatJa, parseYmd, toYmd, wareki } from "@/lib/date";
import { addDaysFrom, calcAge, dayInfo } from "./logic";

/** 今日（表示する端末の日付）。静的HTMLでは空 */
const useToday = () => useClientValue(() => toYmd(new Date()), "");

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <input className={ui.input} type="date" value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function DateAdd() {
  const today = useToday();
  const [baseInput, setBase] = useState<string | null>(null);
  const [n, setN] = useState(100);
  const base = baseInput ?? today;
  const r = base ? addDaysFrom(base, n) : null;
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <DateInput label="基準日" value={base} onChange={setBase} />
        <Field label="日数（マイナスで○日前）">
          <input className={ui.input} type="number" inputMode="numeric" value={Number.isFinite(n) ? n : ""} onChange={(e) => setN(Number(e.target.value))} />
        </Field>
      </FieldGrid>
      {r ? (
        <Stats
          items={[
            { label: n >= 0 ? `${n}日後` : `${Math.abs(n)}日前`, value: formatJa(r.date), emphasis: true },
            { label: "和暦", value: wareki(r.date) || "—" },
            { label: "祝日", value: r.holiday || "—" },
            { label: "その年の", value: `${r.dayOfYear}日目` },
          ]}
        />
      ) : (
        <p className={ui.note}>基準日と日数を入れてください。</p>
      )}
    </div>
  );
}

export function Weekday() {
  const today = useToday();
  const [input, setInput] = useState<string | null>(null);
  const value = input ?? today;
  const d = parseYmd(value);
  const r = d ? dayInfo(d) : null;
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <DateInput label="日付" value={value} onChange={setInput} />
      </FieldGrid>
      {r && (
        <Stats
          items={[
            { label: "曜日", value: r.weekday, emphasis: true },
            { label: "祝日", value: r.holiday || "—" },
            { label: "和暦", value: wareki(r.date) || "—" },
            { label: "その月の", value: r.nthWeekday },
            { label: "その年の", value: `${r.dayOfYear}日目` },
          ]}
        />
      )}
    </div>
  );
}

export function Age() {
  const today = useToday();
  const [birth, setBirth] = useState("1990-05-15");
  const [atInput, setAt] = useState<string | null>(null);
  const at = atInput ?? today;
  const r = at ? calcAge(birth, at) : null;
  const b = parseYmd(birth);
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <DateInput label="生年月日" value={birth} onChange={setBirth} />
        <DateInput label="基準日（ふつうは今日）" value={at} onChange={setAt} />
      </FieldGrid>
      {r ? (
        <Stats
          items={[
            { label: "満年齢", value: `${r.years} 歳`, emphasis: true },
            { label: "くわしく", value: `${r.years}歳${r.months}か月${r.days}日` },
            { label: "数え年", value: `${r.kazoe} 歳` },
            { label: "生まれてからの日数", value: `${r.daysLived.toLocaleString("ja-JP")} 日` },
            { label: "次の誕生日まで", value: `${r.daysToBirthday} 日` },
            { label: "干支", value: r.eto },
            { label: "星座", value: r.zodiac },
            { label: "生まれた日（和暦）", value: b ? wareki(b) : "—" },
          ]}
        />
      ) : (
        <p className={ui.note}>生年月日と基準日を入れてください（基準日は生年月日より後の日付にしてください）。</p>
      )}
      <p className={ui.note}>法律上は誕生日の前日が終わる時点で年をとりますが、ここでは一般的な数え方（誕生日に1歳加える）で計算しています。</p>
    </div>
  );
}
