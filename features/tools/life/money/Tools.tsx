"use client";

import { useState } from "react";
import { Choice } from "@/components/TextTransform";
import { Field, FieldGrid, Stats, yen } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { allocate, convertDataSize, electricityCost, parseBudgetLines, rankUnitPrices, settle, tipTotal, transferSeconds } from "./logic";

const fmt = (x: number, d = 2) => (Number.isFinite(x) ? x.toLocaleString("ja-JP", { maximumFractionDigits: d }) : "—");
function Num({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step?: string }) {
  return (
    <Field label={label}>
      <input className={ui.input} type="number" inputMode="decimal" step={step ?? "any"} value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(e.target.value === "" ? Number.NaN : Number(e.target.value))} />
    </Field>
  );
}

/** 行を追加・削除できる表の入力 */
function RowsEditor<T extends Record<string, string | number>>({ columns, rows, onChange, blank }: { columns: { key: keyof T; label: string; type: "text" | "number" }[]; rows: T[]; onChange: (rows: T[]) => void; blank: T }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[30rem] text-sm">
          <thead className="bg-field text-left text-xs text-muted">
            <tr>
              {columns.map((c) => (
                <th key={String(c.key)} className="px-2 py-1.5 font-medium">
                  {c.label}
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-line">
                {columns.map((c) => (
                  <td key={String(c.key)} className="p-1">
                    <input
                      className={`${ui.input} py-1.5`}
                      aria-label={`${i + 1}行目の${c.label}`}
                      type={c.type}
                      inputMode={c.type === "number" ? "decimal" : undefined}
                      value={c.type === "number" && !Number.isFinite(r[c.key] as number) ? "" : r[c.key]}
                      onChange={(e) => onChange(rows.map((x, k) => (k === i ? { ...x, [c.key]: c.type === "number" ? (e.target.value === "" ? Number.NaN : Number(e.target.value)) : e.target.value } : x)))}
                    />
                  </td>
                ))}
                <td className="p-1">
                  <button type="button" className={`${ui.button} px-2 py-1`} onClick={() => onChange(rows.filter((_, k) => k !== i))} aria-label={`${i + 1}行目を削除`}>
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className={`${ui.button} w-fit`} onClick={() => onChange([...rows, blank])}>
        行を追加
      </button>
    </div>
  );
}

export function TravelExpenseSplit() {
  const [rows, setRows] = useState([
    { name: "", paid: Number.NaN },
    { name: "", paid: Number.NaN },
    { name: "", paid: Number.NaN },
  ]);
  const r = settle(rows.map((x) => ({ name: x.name, paid: x.paid })));
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">参加した全員の名前と、立て替えた金額を入れてください（立て替えていない人は0か空欄）。</p>
      <RowsEditor columns={[{ key: "name", label: "名前", type: "text" }, { key: "paid", label: "立て替えた金額（円）", type: "number" }]} rows={rows} onChange={setRows} blank={{ name: "", paid: Number.NaN }} />
      <Stats
        items={[
          { label: "合計", value: yen(r.total) },
          { label: "1人あたり", value: yen(Math.round(r.perPerson)), emphasis: true },
        ]}
      />
      <section className="flex flex-col gap-2" aria-live="polite">
        <h3 className={ui.h3}>精算のしかた</h3>
        {r.transfers.length ? (
          <ul className="flex flex-col gap-1.5">
            {r.transfers.map((t, i) => (
              <li key={i} className="rounded-lg bg-accent-soft px-3 py-2">
                <b>{t.from}</b> さんが <b>{t.to}</b> さんに <b>{yen(t.amount)}</b>
              </li>
            ))}
          </ul>
        ) : (
          <p className={ui.note}>精算は不要です。</p>
        )}
      </section>
      <p className={ui.note}>送金の回数ができるだけ少なくなる組み合わせです。1円未満は四捨五入するため、数円の差が出ることがあります。</p>
    </div>
  );
}

export function UnitPrice() {
  const [rows, setRows] = useState([
    { name: "", price: Number.NaN, amount: Number.NaN, packs: 1 },
    { name: "", price: Number.NaN, amount: Number.NaN, packs: 1 },
  ]);
  const ranked = rankUnitPrices(rows);
  return (
    <div className="flex flex-col gap-4">
      <RowsEditor
        columns={[
          { key: "name", label: "商品", type: "text" },
          { key: "price", label: "価格（円）", type: "number" },
          { key: "amount", label: "内容量（g・mL・枚など）", type: "number" },
          { key: "packs", label: "入数", type: "number" },
        ]}
        rows={rows}
        onChange={setRows}
        blank={{ name: "", price: Number.NaN, amount: Number.NaN, packs: 1 }}
      />
      {ranked.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-field text-left text-xs text-muted">
              <tr>
                <th className="px-3 py-1.5">順位</th>
                <th className="px-3 py-1.5">商品</th>
                <th className="px-3 py-1.5">100あたり</th>
                <th className="px-3 py-1.5">1あたり</th>
                <th className="px-3 py-1.5">最安との差</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => (
                <tr key={i} className={`border-t border-line tabular-nums ${i === 0 ? "bg-ok/10" : ""}`}>
                  <td className="px-3 py-1.5">{i + 1}</td>
                  <td className="px-3 py-1.5">{r.name || `${r.index + 1}行目`}</td>
                  <td className="px-3 py-1.5 font-bold">{fmt(r.per100, 1)} 円</td>
                  <td className="px-3 py-1.5">{fmt(r.unit, 3)} 円</td>
                  <td className="px-3 py-1.5">{i === 0 ? "最安" : `+${fmt(r.diffPct, 1)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className={ui.note}>「100あたり」は内容量100（g・mL・枚など）あたりの値段です。単位の違う商品どうし（gとmLなど）は比べられません。</p>
    </div>
  );
}

export function Budget() {
  const [total, setTotal] = useState(250000);
  const [mode, setMode] = useState<"custom" | "503020">("custom");
  const [text, setText] = useState("住居 25\n食費 15\n水道光熱・通信 8\n日用品 4\n交通 4\n趣味・交際 10\n保険・医療 6\n貯蓄・投資 20\n予備費 8");
  const items = mode === "503020" ? [{ name: "必要なもの（住居・食費・光熱費など）", weight: 50 }, { name: "欲しいもの（趣味・外食など）", weight: 30 }, { name: "貯蓄・投資", weight: 20 }] : parseBudgetLines(text);
  const r = allocate(total, items);
  const max = Math.max(1, ...items.map((x) => x.weight));
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Num label="予算・手取り（円）" value={total} onChange={setTotal} />
        <Choice label="配分の決め方" value={mode} onChange={setMode} options={[["custom", "下の表で決める"], ["503020", "50/30/20ルール（必要・欲しい・貯蓄）"]]} />
      </FieldGrid>
      {mode === "custom" && (
        <label className={ui.label}>
          費目と割合（1行に「費目 割合」。合計が100でなくても自動で調整）
          <textarea className={`${ui.input} min-h-40 font-mono text-sm`} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
      )}
      {r.rows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <tbody>
              {r.rows.map((x) => (
                <tr key={x.name} className="border-t border-line first:border-t-0 tabular-nums">
                  <td className="px-3 py-1.5">{x.name}</td>
                  <td className="px-3 py-1.5 text-muted">{fmt(x.share * 100, 1)}%</td>
                  <td className="px-3 py-1.5 font-bold">{yen(x.amount)}</td>
                  <td className="w-32 px-3 py-1.5">
                    <span className="block h-2 overflow-hidden rounded-full bg-line">
                      <span className="block h-full bg-accent" style={{ width: `${(x.weight / max) * 100}%` }} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-warn">「費目 割合」の形で入れてください（例：食費 15）。</p>
      )}
      {mode === "custom" && r.sum !== 100 && r.rows.length > 0 && <p className={ui.note}>割合の合計が {fmt(r.sum)} なので、100になるように調整しました。</p>}
    </div>
  );
}

export function ElectricityCost() {
  const [w, setW] = useState(1200);
  const [h, setH] = useState(0.5);
  const [n, setN] = useState(1);
  const [price, setPrice] = useState(31);
  const [days, setDays] = useState(30);
  const r = electricityCost(w, h, n, price, days);
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Num label="消費電力（W）" value={w} onChange={setW} />
        <Num label="1日に使う時間" value={h} onChange={setH} step="0.25" />
        <Num label="台数" value={n} onChange={setN} />
        <Num label="電気料金の単価（円/kWh）" value={price} onChange={setPrice} />
        <Num label="1か月に使う日数" value={days} onChange={setDays} />
      </FieldGrid>
      <Stats
        items={[
          { label: "1か月あたり", value: `${fmt(r.perMonth, 0)} 円`, emphasis: true },
          { label: "1日あたり", value: `${fmt(r.perDay, 1)} 円` },
          { label: "1年あたり（毎日使う場合）", value: `${fmt(r.perYear, 0)} 円` },
          { label: "1時間あたり", value: `${fmt(r.perHour, 1)} 円` },
          { label: "1日の電力量", value: `${fmt(r.kwhPerDay, 2)} kWh` },
        ]}
      />
      <p className={ui.note}>
        単価31円/kWhは、全国家庭電気製品公正取引協議会が家電の電気代の表示に使う目安単価です。実際の単価は電力会社・料金プラン・燃料費調整額で変わるので、検針票の値に置き換えると正確になります。
      </p>
    </div>
  );
}

export function Tip() {
  const [amount, setAmount] = useState(120);
  const [rate, setRate] = useState<"10" | "15" | "18" | "20" | "25" | "jp">("18");
  const [people, setPeople] = useState(2);
  const [roundUp, setRoundUp] = useState(true);
  const r = tipTotal(amount, rate === "jp" ? "jp" : Number(rate), people, roundUp);
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Num label="金額（現地の通貨・円）" value={amount} onChange={setAmount} />
        <Choice label="チップ・サービス料" value={rate} onChange={setRate} options={[["10", "10%"], ["15", "15%"], ["18", "18%"], ["20", "20%"], ["25", "25%"], ["jp", "日本式（サービス料10%＋消費税10%）"]]} />
        <Num label="人数" value={people} onChange={setPeople} />
      </FieldGrid>
      {rate !== "jp" && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-accent" checked={roundUp} onChange={(e) => setRoundUp(e.target.checked)} />
          合計を切りのいい数に切り上げる
        </label>
      )}
      <Stats
        items={[
          { label: rate === "jp" ? "サービス料" : "チップ", value: fmt(r.tip) },
          { label: "支払う合計", value: fmt(r.total), emphasis: true },
          { label: "1人あたり", value: fmt(r.perPerson) },
        ]}
      />
      <p className={ui.note}>チップの相場は国や店によって異なります。日本式は、サービス料にも消費税がかかる計算です。</p>
    </div>
  );
}

export function DataSize() {
  const [value, setValue] = useState(64);
  const [unit, setUnit] = useState<"0" | "1" | "2" | "3" | "4" | "5">("3");
  const [base, setBase] = useState<"1000" | "1024">("1000");
  const [mbps, setMbps] = useState(100);
  const b = Number(base) as 1000 | 1024;
  const r = convertDataSize(value, Number(unit), b);
  const sec = transferSeconds(r.bytes, mbps);
  const time = !Number.isFinite(sec) ? "—" : sec < 60 ? `${fmt(sec, 1)} 秒` : sec < 3600 ? `${fmt(sec / 60, 1)} 分` : `${fmt(sec / 3600, 1)} 時間`;
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Num label="値" value={value} onChange={setValue} />
        <Choice label="単位" value={unit} onChange={setUnit} options={[["0", "B"], ["1", "KB"], ["2", "MB"], ["3", "GB"], ["4", "TB"], ["5", "PB"]]} />
        <Choice label="換算" value={base} onChange={setBase} options={[["1000", "1KB＝1000B（製品・通信の表示）"], ["1024", "1KB＝1024B（WindowsなどOSの表示）"]]} />
        <Num label="通信速度（Mbps）" value={mbps} onChange={setMbps} />
      </FieldGrid>
      <Stats
        items={[
          ...r.units.map((u, i) => ({ label: u.unit, value: fmt(u.value, i < 2 ? 0 : 4), emphasis: String(i) === unit })),
          { label: `${fmt(mbps, 0)}Mbpsで転送する時間（目安）`, value: time },
          { label: b === 1000 ? "OSで表示される容量" : "1000倍で数えた場合", value: `${fmt(r.bytes / (b === 1000 ? 1024 : 1000) ** Number(unit), 3)} ${r.units[Number(unit)].unit}` },
        ]}
      />
      <p className={ui.note}>
        製品は1000倍、OSは1024倍で数えるため、64GBのUSBメモリはパソコンで約{fmt(64e9 / 1024 ** 3, 1)}GBと表示されます。転送時間は理論値で、実際はもっとかかります。
      </p>
    </div>
  );
}
