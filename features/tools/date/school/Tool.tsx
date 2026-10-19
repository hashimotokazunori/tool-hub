"use client";

import { useState } from "react";
import { Choice } from "@/components/TextTransform";
import { CopyButton, Field, FieldGrid } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { parseYmd } from "@/lib/date";
import { schoolTimeline, warekiYear } from "./logic";

export default function SchoolYears() {
  const [birth, setBirth] = useState("2003-08-15");
  const [univ, setUniv] = useState<"4" | "2" | "6" | "0">("4");
  const [era, setEra] = useState<"both" | "west" | "japanese">("both");
  const d = parseYmd(birth);
  const list = d ? schoolTimeline(d.getFullYear(), d.getMonth() + 1, d.getDate(), Number(univ)) : [];
  const yearText = (y: number, m: number) => (era === "west" ? `${y}年` : era === "japanese" ? warekiYear(y, m) : `${y}年（${warekiYear(y, m)}）`);
  const lines = list.map((e) => `${yearText(e.year, e.month)}${e.month}月　${e.school}${e.kind}`);
  const early = d !== null && (d.getMonth() + 1 < 4 || (d.getMonth() + 1 === 4 && d.getDate() === 1));
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Field label="生年月日">
          <input className={ui.input} type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
        </Field>
        <Choice
          label="最後の学校"
          value={univ}
          onChange={setUniv}
          options={[
            ["4", "大学（4年制）"],
            ["6", "大学（6年制：医・歯・薬・獣医）"],
            ["2", "短期大学（2年制）"],
            ["0", "高等学校まで"],
          ]}
        />
        <Choice
          label="年の書き方"
          value={era}
          onChange={setEra}
          options={[
            ["both", "西暦と和暦"],
            ["west", "西暦"],
            ["japanese", "和暦"],
          ]}
        />
      </FieldGrid>
      {d ? (
        <>
          {early && <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm">1月1日〜4月1日生まれ（早生まれ）なので、前の年の4月2日以降に生まれた人と同じ学年です。</p>}
          <ol className="flex flex-col divide-y divide-line rounded-xl border border-line">
            {list.map((e, i) => (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 px-3 py-2">
                <span className="font-mono tabular-nums">
                  {yearText(e.year, e.month)} {e.month}月
                </span>
                <span className={e.kind === "卒業" ? "font-semibold" : ""}>
                  {e.school} {e.kind}
                </span>
              </li>
            ))}
          </ol>
          <div>
            <CopyButton text={lines.join("\n")} label="履歴書用にコピー" primary />
          </div>
        </>
      ) : (
        <p className={ui.note}>生年月日を入れてください。</p>
      )}
      <p className={ui.note}>浪人・留年・飛び級・海外の学校などがない場合の目安です。中高一貫校・高専・専門学校などは、実際の年数に合わせて直してください。2019年4月は平成31年、5月からが令和元年です。</p>
    </div>
  );
}
