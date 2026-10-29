/**
 * AIの答えの検算。ChatGPT などの答えの文章から数字を読み取り、このサイトの計算で計算し直して比べる。
 * AIは使わない（ルールで読み取る）。読み取れない書き方のときは、読み取れなかったと正直に返す。
 */
import { calcTax, type TaxRounding } from "@/features/tools/calculator/consumption-tax/logic";
import { daysBetween } from "@/features/tools/date/days-between/logic";

export type CheckKind = "warikan" | "tax" | "days";

/** 1つの数字の答え合わせ */
export type Claim = {
  label: string;
  /** AIの答えに書かれていた数字 */
  claimed: number;
  /** 計算し直した数字 */
  actual: number;
  ok: boolean;
  unit: string;
  note?: string;
};

export type CheckResult = {
  kind: CheckKind;
  /** 読み取った前提（合計金額・人数など） */
  read: { label: string; value: string }[];
  claims: Claim[];
  /** 読み取れなかったときの理由 */
  problem?: string;
};

export const KIND_LABEL: Record<CheckKind, string> = { warikan: "割り勘", tax: "消費税", days: "日数・営業日" };

/** 全角の数字・記号を半角に、桁区切りのカンマを外し、「2万3500円」を「23500円」にする */
export function normalize(text: string): string {
  let s = text.replace(/[０-９．，％／－]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  s = s.replace(/(\d),(?=\d{3}(?!\d))/g, "$1");
  s = s.replace(/(\d+(?:\.\d+)?)万(\d*)/g, (_, man: string, rest: string) => String(Math.round(Number(man) * 10000 + (rest ? Number(rest) : 0))));
  return s;
}

export function detectKind(text: string): CheckKind | null {
  const s = normalize(text);
  if (/割り勘|割勘|(?:1人|一人|ひとり)(?:あたり|当たり)|人で割/.test(s)) return "warikan";
  if (/消費税|税込|税抜|税率/.test(s)) return "tax";
  if (/営業日|平日|日数|何日|日間|\d{4}[年/-]\d{1,2}[月/-]\d{1,2}|\d{1,2}月\d{1,2}日/.test(s)) return "days";
  return null;
}

const num = (m: RegExpMatchArray | null, i = 1) => (m ? Number(m[i]) : null);

// ---------- 割り勘 ----------

function checkWarikan(s: string): CheckResult {
  const read: CheckResult["read"] = [];
  // 人数：「6人」「6名」。「1人あたり」は除く
  const people = [...s.matchAll(/(\d+)\s*(?:人|名)(?!\s*(?:あたり|当たり))/g)].map((m) => Number(m[1])).find((n) => n >= 2);
  const total =
    num(s.match(/(?:合計|総額|全部で|会計|代金|総計|支払い)[^\d]{0,12}(\d+(?:\.\d+)?)\s*円/)) ??
    Math.max(0, ...[...s.matchAll(/(\d+(?:\.\d+)?)\s*円/g)].map((m) => Number(m[1])));
  const per =
    num(s.match(/(?:1人|一人|ひとり)(?:あたり|当たり)[^\d]{0,15}(\d+(?:\.\d+)?)\s*円/)) ?? num(s.match(/(\d+(?:\.\d+)?)\s*円ずつ/));
  if (!people || !total) return { kind: "warikan", read, claims: [], problem: "合計金額と人数を読み取れませんでした。「合計23,500円を6人で」のような書き方が含まれているか確かめてください。" };
  read.push({ label: "合計金額", value: `${total.toLocaleString("ja-JP")}円` }, { label: "人数", value: `${people}人` });
  const exact = total / people;
  const claims: Claim[] = [];
  if (per !== null) {
    let ok = Math.abs(per - exact) < 1;
    let note = ok ? "ちょうど割った金額と合っています（1円未満の差は丸めの違い）" : undefined;
    // 集めやすい単位（10・100・500・1000円）に切り上げた答えも正しいとみなす
    for (const u of [10, 100, 500, 1000]) {
      if (!ok && per % u === 0 && per >= exact && per - exact < u) {
        ok = true;
        note = `${u}円単位に切り上げた金額です（集めると${(per * people - total).toLocaleString("ja-JP")}円あまります）`;
      }
    }
    if (!ok) note = `ちょうど割ると1人 ${exact.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}円です`;
    claims.push({ label: "1人あたり", claimed: per, actual: Math.round(exact * 100) / 100, ok, unit: "円", note });
  }
  if (claims.length === 0) return { kind: "warikan", read, claims, problem: "「1人あたり〇円」の答えを読み取れませんでした。" };
  return { kind: "warikan", read, claims };
}

// ---------- 消費税 ----------

const ROUNDINGS: TaxRounding[] = ["floor", "round", "ceil"];
const ROUNDING_LABEL: Record<TaxRounding, string> = { floor: "切り捨て", round: "四捨五入", ceil: "切り上げ" };

function checkTax(s: string): CheckResult {
  const read: CheckResult["read"] = [];
  const rate = num(s.match(/(10|8)\s*%/)) ?? 10;
  read.push({ label: "税率", value: `${rate}%${/(10|8)\s*%/.test(s) ? "" : "（書かれていないので10%として計算）"}` });
  const yenNear = (re: RegExp) => num(s.match(re));
  const excluded = yenNear(/税抜(?:き)?(?:価格|金額)?[^\d]{0,8}(\d+)\s*円/) ?? yenNear(/(\d+)\s*円\s*[（(]?\s*税抜/);
  const included = yenNear(/税込(?:み)?(?:価格|金額)?[^\d]{0,8}(\d+)\s*円/) ?? yenNear(/(\d+)\s*円\s*[（(]?\s*税込/);
  // 「消費税（10%）は198円」のように税率をはさむ書き方も読む
  const tax = yenNear(/消費税(?:額)?(?:\s*[（(]\s*\d+\s*%\s*[）)])?[^\d]{0,8}(\d+)\s*円/);
  const claims: Claim[] = [];
  if (excluded !== null) {
    read.push({ label: "税抜の金額", value: `${excluded.toLocaleString("ja-JP")}円` });
    const results = ROUNDINGS.map((r) => ({ r, ...calcTax({ amount: excluded, basis: "excluded", rate, rounding: r }) }));
    if (tax !== null) {
      const hit = results.find((x) => x.tax === tax);
      claims.push({ label: "消費税", claimed: tax, actual: results[0].tax, ok: Boolean(hit), unit: "円", note: hit ? `1円未満を${ROUNDING_LABEL[hit.r]}した金額です` : `税抜${excluded.toLocaleString("ja-JP")}円 × ${rate}% ＝ ${((excluded * rate) / 100).toLocaleString("ja-JP")}円です` });
    }
    if (included !== null) {
      const hit = results.find((x) => x.included === included);
      claims.push({ label: "税込", claimed: included, actual: results[0].included, ok: Boolean(hit), unit: "円", note: hit ? `消費税の1円未満を${ROUNDING_LABEL[hit.r]}した金額です` : undefined });
    }
  } else if (included !== null) {
    read.push({ label: "税込の金額", value: `${included.toLocaleString("ja-JP")}円` });
    const results = ROUNDINGS.map((r) => ({ r, ...calcTax({ amount: included, basis: "included", rate, rounding: r }) }));
    if (tax !== null) {
      const hit = results.find((x) => x.tax === tax);
      claims.push({ label: "消費税（税込から）", claimed: tax, actual: results[0].tax, ok: Boolean(hit), unit: "円", note: hit ? `税込 × ${rate} ÷ ${100 + rate} の1円未満を${ROUNDING_LABEL[hit.r]}した金額です` : `税込 × ${rate} ÷ ${100 + rate} ＝ ${((included * rate) / (100 + rate)).toFixed(2)}円です` });
    }
  } else {
    return { kind: "tax", read, claims, problem: "「税抜〇円」か「税込〇円」を読み取れませんでした。" };
  }
  if (claims.length === 0) return { kind: "tax", read, claims, problem: "比べる答え（「消費税〇円」「税込〇円」）を読み取れませんでした。" };
  return { kind: "tax", read, claims };
}

// ---------- 日数 ----------

type FoundDate = { date: Date; index: number; length: number };

function findDates(s: string, thisYear: number): FoundDate[] {
  const out: FoundDate[] = [];
  const re = /(?:(\d{4})\s*[年/-]\s*)?(\d{1,2})\s*[月/-]\s*(\d{1,2})\s*日?/g;
  let lastYear = thisYear;
  for (const m of s.matchAll(re)) {
    const y = m[1] ? Number(m[1]) : lastYear;
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) continue;
    // 年を書かずに「12月1日〜1月10日」と年をまたぐときは、後ろの日付を翌年にする
    let date = new Date(y, mo - 1, d);
    if (!m[1] && out.length > 0 && date < out[out.length - 1].date) date = new Date(y + 1, mo - 1, d);
    lastYear = date.getFullYear();
    out.push({ date, index: m.index ?? 0, length: m[0].length });
  }
  return out;
}

function checkDays(s: string, today: Date): CheckResult {
  const read: CheckResult["read"] = [];
  const dates = findDates(s, today.getFullYear());
  if (dates.length < 2) return { kind: "days", read, claims: [], problem: "日付を2つ読み取れませんでした。「2026年12月1日から2027年1月10日まで」のような書き方が含まれているか確かめてください。" };
  const [a, b] = dates;
  const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const r = daysBetween(ymd(a.date), ymd(b.date));
  if (!r) return { kind: "days", read, claims: [], problem: "日付を読み取れませんでした。" };
  const ja = (d: Date) => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  read.push({ label: "開始日", value: ja(a.date) }, { label: "終了日", value: ja(b.date) });
  // 日付の部分を消してから「〇日」「〇営業日」を探す
  let rest = s;
  for (const d of [...dates].reverse()) rest = rest.slice(0, d.index) + " ".repeat(d.length) + rest.slice(d.index + d.length);
  const claims: Claim[] = [];
  for (const m of rest.matchAll(/(\d+)\s*(営業日|平日|日間|日)/g)) {
    const n = Number(m[1]);
    // 「営業日は20日」のように、言葉が数字の前にあるときも見る
    const before = rest.slice(Math.max(0, (m.index ?? 0) - 10), m.index ?? 0);
    const word = m[2] === "日" || m[2] === "日間" ? (/営業日/.test(before) ? "営業日" : /平日/.test(before) ? "平日" : m[2]) : m[2];
    if (word === "営業日") {
      claims.push({ label: "営業日（土日祝を除く）", claimed: n, actual: r.businessDays, ok: n === r.businessDays, unit: "日", note: r.holidays.length ? `期間中の祝日：${r.holidays.map((h) => `${h.date} ${h.name}`).join("、")}` : undefined });
    } else if (word === "平日") {
      claims.push({ label: "平日（土日を除く）", claimed: n, actual: r.weekdays, ok: n === r.weekdays, unit: "日" });
    } else {
      const ok = n === r.days || n === r.inclusiveDays;
      claims.push({ label: "日数", claimed: n, actual: r.days, ok, unit: "日", note: ok ? (n === r.days ? "終了日−開始日の日数と合っています" : "開始日と終了日の両方を数えた日数と合っています") : `差は${r.days}日、両端を含むと${r.inclusiveDays}日です` });
    }
  }
  if (claims.length === 0) return { kind: "days", read, claims, problem: "「〇日」「〇営業日」の答えを読み取れませんでした。" };
  return { kind: "days", read, claims };
}

export function checkAnswer(text: string, kind: CheckKind | "auto" = "auto", today = new Date()): CheckResult | null {
  const s = normalize(text);
  const k = kind === "auto" ? detectKind(s) : kind;
  if (!k) return null;
  return k === "warikan" ? checkWarikan(s) : k === "tax" ? checkTax(s) : checkDays(s, today);
}
