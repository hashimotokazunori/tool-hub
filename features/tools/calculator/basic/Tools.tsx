"use client";

import { useState } from "react";
import { Choice } from "@/components/TextTransform";
import { Field, FieldGrid, Stats, yen } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { calcDiscount, calcPercent, numberStats, parseNumbers, roundAll, simplifyRatio, solveRatio, wariLabel } from "./logic";

const fmt = (x: number | null | undefined, d = 2) => (x === null || x === undefined || !Number.isFinite(x) ? "—" : x.toLocaleString("ja-JP", { maximumFractionDigits: d }));
const signed = (x: number, d = 2) => (Number.isFinite(x) ? `${x > 0 ? "+" : ""}${fmt(x, d)}` : "—");

/** 数値の入力欄（空欄は NaN として扱う） */
function Num({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step?: string }) {
  return (
    <Field label={label}>
      <input className={ui.input} type="number" inputMode="decimal" step={step ?? "any"} value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(e.target.value === "" ? Number.NaN : Number(e.target.value))} />
    </Field>
  );
}

export function Discount() {
  const [price, setPrice] = useState(5980);
  const [rate, setRate] = useState(20);
  const [extra, setExtra] = useState(0);
  const [tax, setTax] = useState<"none" | "10" | "8">("none");
  const r = calcDiscount(price, rate, extra, tax === "none" ? 1 : 1 + Number(tax) / 100);
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Num label="定価（円）" value={price} onChange={setPrice} />
        <Num label="割引率（%）" value={rate} onChange={setRate} />
        <Num label="さらに割引（%・クーポンなど。なければ0）" value={extra} onChange={setExtra} />
        <Choice label="税" value={tax} onChange={setTax} options={[["none", "定価のまま計算"], ["10", "定価は税抜（税込10%で表示）"], ["8", "定価は税抜（税込8%で表示）"]]} />
      </FieldGrid>
      <Stats
        items={[
          { label: "割引後の価格", value: yen(r.discounted), emphasis: true },
          { label: "割引額", value: yen(r.off) },
          { label: "実質の割引率", value: `${fmt(r.effectiveRate, 1)}%` },
          { label: "割・分で言うと", value: r.label },
        ]}
      />
      {extra > 0 && (
        <p className={ui.note}>
          {rate}%引きのあとに{extra}%引きすると、合計 {rate + extra}%引きではなく {fmt(r.effectiveRate, 1)}%引き（{wariLabel(r.effectiveRate)}）になります。1円未満は四捨五入しています。
        </p>
      )}
    </div>
  );
}

export function Percentage() {
  const [a, setA] = useState(30);
  const [b, setB] = useState(120);
  const [x, setX] = useState(15);
  const r = calcPercent(a, b, x);
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Num label="A（比べる量・前の値）" value={a} onChange={setA} />
        <Num label="B（もとにする量・後の値）" value={b} onChange={setB} />
        <Num label="X（%）" value={x} onChange={setX} />
      </FieldGrid>
      <Stats
        items={[
          { label: "A は B の何%", value: `${fmt(r.aOfB)}%`, emphasis: true },
          { label: "B の X% はいくつ", value: fmt(r.xOfB) },
          { label: "A → B の増減率", value: `${signed(r.changeRate)}%` },
          { label: "差（B − A）", value: signed(r.diff) },
          { label: "X% が A になるもとの量", value: fmt(r.baseFromA) },
        ]}
      />
    </div>
  );
}

export function Ratio() {
  const [a, setA] = useState(16);
  const [b, setB] = useState(9);
  const [c, setC] = useState(1920);
  const s = simplifyRatio(a, b);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">
        <b>a : b = c : x</b> の x を求めます。
      </p>
      <FieldGrid>
        <Num label="a" value={a} onChange={setA} />
        <Num label="b" value={b} onChange={setB} />
        <Num label="c" value={c} onChange={setC} />
      </FieldGrid>
      <Stats
        items={[
          { label: `x（${fmt(a)}:${fmt(b)} = ${fmt(c)}:x）`, value: fmt(solveRatio(a, b, c), 4), emphasis: true },
          { label: "いちばん簡単な比", value: s ? `${s[0]} : ${s[1]}` : "—" },
          { label: "倍率（c ÷ a）", value: `× ${fmt(c / a, 4)}` },
          { label: "割合で表すと", value: `${fmt((a / (a + b)) * 100, 1)}% : ${fmt((b / (a + b)) * 100, 1)}%` },
        ]}
      />
    </div>
  );
}

export function Average() {
  const [text, setText] = useState("");
  const values = parseNumbers(text);
  const s = numberStats(values);
  return (
    <div className="flex flex-col gap-4">
      <label className={ui.label}>
        数値（改行・カンマ・スペース区切り。Excelの列をそのまま貼り付けられます）
        <textarea className={`${ui.input} min-h-40 font-mono`} value={text} onChange={(e) => setText(e.target.value)} placeholder={"72\n85\n90\n64"} />
      </label>
      {s ? (
        <Stats
          items={[
            { label: "平均", value: fmt(s.mean, 4), emphasis: true },
            { label: "件数", value: s.count },
            { label: "合計", value: fmt(s.sum, 4) },
            { label: "中央値", value: fmt(s.median, 4) },
            { label: "最大", value: fmt(s.max, 4) },
            { label: "最小", value: fmt(s.min, 4) },
            { label: "標準偏差（母集団）", value: fmt(s.sdPopulation, 4) },
            { label: "標準偏差（標本）", value: fmt(s.sdSample, 4) },
            { label: "最頻値", value: s.modes.length ? s.modes.map((m) => fmt(m, 4)).join("、") : "なし" },
          ]}
        />
      ) : (
        <p className={ui.note}>数値を入れると、平均・合計・中央値などを計算します。</p>
      )}
    </div>
  );
}

export function Rounding() {
  const [x, setX] = useState(1234.5678);
  const [d, setD] = useState("2");
  const digits = Number(d);
  const r = roundAll(x, digits);
  const show = (v: number) => (Number.isFinite(v) ? (digits > 0 ? v.toLocaleString("ja-JP", { minimumFractionDigits: digits, maximumFractionDigits: digits }) : v.toLocaleString("ja-JP")) : "—");
  return (
    <div className="flex flex-col gap-4">
      <FieldGrid>
        <Num label="数値" value={x} onChange={setX} />
        <Choice
          label="どこまで残すか"
          value={d}
          onChange={setD}
          options={[
            ["0", "整数（小数第1位を処理）"],
            ["1", "小数第1位まで"],
            ["2", "小数第2位まで"],
            ["3", "小数第3位まで"],
            ["-1", "十の位まで（一の位を処理）"],
            ["-2", "百の位まで"],
            ["-3", "千の位まで"],
            ["-4", "万の位まで"],
          ]}
        />
      </FieldGrid>
      <Stats
        items={[
          { label: "四捨五入", value: show(r.halfUp), emphasis: true },
          { label: "切り捨て", value: show(r.down) },
          { label: "切り上げ", value: show(r.up) },
          { label: "偶数丸め（銀行丸め）", value: show(r.halfEven) },
          { label: "五捨六入", value: show(r.fiveDownSixUp) },
        ]}
      />
      <p className={ui.note}>マイナスの数は、0に近づける方向を「切り捨て」としています。</p>
    </div>
  );
}
