"use client";

import { useState } from "react";
import { Field, FieldGrid, Stats } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { useClientValue } from "@/components/useClientValue";
import { formatJa, parseYmd, toYmd, wareki } from "@/lib/date";
import { daysBetween } from "./logic";

export default function DaysBetween() {
  // 今日の日付は表示する端末で決まる。入力されるまでは「今日〜今年の大みそか」を使う
  const today = useClientValue(() => toYmd(new Date()), "");
  const [startInput, setStart] = useState<string | null>(null);
  const [endInput, setEnd] = useState<string | null>(null);
  const start = startInput ?? today;
  const end = endInput ?? (today ? `${today.slice(0, 4)}-12-31` : "");
  const r = start && end ? daysBetween(start, end) : null;
  const e = parseYmd(end);
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Field label="開始日">
          <input className={ui.input} type="date" value={start} onChange={(ev) => setStart(ev.target.value)} />
        </Field>
        <Field label="終了日">
          <input className={ui.input} type="date" value={end} onChange={(ev) => setEnd(ev.target.value)} />
        </Field>
      </FieldGrid>
      {r ? (
        <>
          <Stats
            items={[
              { label: "日（差）", value: r.days, emphasis: true },
              { label: "日（両端を含む）", value: r.inclusiveDays },
              { label: "週", value: r.weeks.toFixed(1) },
              { label: "平日（土日を除く）", value: r.weekdays },
              { label: "営業日（土日祝を除く）", value: r.businessDays },
            ]}
          />
          {e && (
            <p className={ui.note}>
              終了日は {formatJa(e)}・{wareki(e)}。
              {r.holidays.length > 0 && `期間中の平日の祝日：${r.holidays.map((h) => `${h.date} ${h.name}`).join("、")}`}
            </p>
          )}
        </>
      ) : (
        <p className={ui.note}>開始日と終了日を選んでください。</p>
      )}
    </div>
  );
}
