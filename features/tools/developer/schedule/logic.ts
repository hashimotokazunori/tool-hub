/* ---------- 時間の単位の変換 ---------- */

export type TimeUnit = "ms" | "s" | "min" | "h" | "d" | "w";

/** 1単位あたりの秒数 */
export const UNIT_SECONDS: Record<TimeUnit, number> = {
  ms: 0.001,
  s: 1,
  min: 60,
  h: 3600,
  d: 86_400,
  w: 604_800,
};
export const UNIT_LABELS: Record<TimeUnit, string> = {
  ms: "ミリ秒",
  s: "秒",
  min: "分",
  h: "時間",
  d: "日",
  w: "週",
};

/** value（unit）を、すべての単位に直す */
export function convertTime(value: number, unit: TimeUnit): Record<TimeUnit, number> | null {
  if (!Number.isFinite(value)) return null;
  const sec = value * UNIT_SECONDS[unit];
  const out = {} as Record<TimeUnit, number>;
  for (const u of Object.keys(UNIT_SECONDS) as TimeUnit[]) out[u] = sec / UNIT_SECONDS[u];
  return out;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** 秒 → "h:mm:ss"（秒は四捨五入。時は24を超えてもそのまま） */
export function formatHms(seconds: number, withSeconds = true): string {
  const sign = seconds < 0 ? "-" : "";
  const total = Math.round(Math.abs(seconds) / (withSeconds ? 1 : 60)) * (withSeconds ? 1 : 60);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return withSeconds ? `${sign}${h}:${pad2(m)}:${pad2(s)}` : `${sign}${h}:${pad2(m)}`;
}

/** 秒 → 「1日2時間3分4秒」（0の単位は省く。秒は四捨五入） */
export function formatJa(seconds: number, useDays = true): string {
  let t = Math.round(Math.abs(seconds));
  if (t === 0) return "0秒";
  const parts: string[] = [];
  if (useDays && t >= 86_400) {
    parts.push(`${Math.floor(t / 86_400)}日`);
    t %= 86_400;
  }
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  if (h) parts.push(`${h}時間`);
  if (m) parts.push(`${m}分`);
  if (s) parts.push(`${s}秒`);
  return (seconds < 0 ? "−" : "") + parts.join("");
}

const UNIT_WORDS: [RegExp, number][] = [
  [/^(日|d|days?)$/i, 86_400],
  [/^(時間|h|hr|hrs|hours?)$/i, 3600],
  [/^(分|m|min|mins|minutes?)$/i, 60],
  [/^(秒|s|sec|secs|seconds?)$/i, 1],
];

/**
 * 時間の長さの文字を秒に直す。読めなければ null。
 * 「1:30」（時:分）「1:30:15」（時:分:秒）「1.75」（10進数の時間）「1時間30分」「90分」「1h30m」に対応。
 */
export function parseDuration(input: string): number | null {
  const s = input
    .trim()
    .replace(/[０-９．：]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, "");
  if (!s) return null;
  const neg = /^[-−]/.test(s);
  const body = s.replace(/^[-−+]/, "");
  let sec: number | null = null;
  const colon = /^(\d+):(\d{1,2})(?::(\d{1,2}(?:\.\d+)?))?$/.exec(body);
  if (colon) {
    const m = Number(colon[2]);
    const sc = Number(colon[3] ?? 0);
    if (m >= 60 || sc >= 60) return null;
    sec = Number(colon[1]) * 3600 + m * 60 + sc;
  } else if (/^\d+(\.\d+)?$|^\.\d+$/.test(body)) {
    sec = Number(body) * 3600;
  } else {
    const re = /(\d+(?:\.\d+)?)([^\d.]+)/g;
    let used = 0;
    let total = 0;
    for (const m of body.matchAll(re)) {
      const unit = UNIT_WORDS.find(([r]) => r.test(m[2]));
      if (!unit) return null;
      total += Number(m[1]) * unit[1];
      used += m[0].length;
    }
    if (used !== body.length || used === 0) return null;
    sec = total;
  }
  return neg ? -sec : sec;
}

export type DurationItem = { raw: string; seconds: number | null };

/** 改行・カンマ・読点で区切った時間を合計する（読めない項目は合計に入れない） */
export function sumDurations(input: string): {
  items: DurationItem[];
  total: number;
  invalid: number;
} {
  const items = input
    .split(/[\n,、，]+/)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw) => ({ raw, seconds: parseDuration(raw) }));
  return {
    items,
    total: items.reduce((s, it) => s + (it.seconds ?? 0), 0),
    invalid: items.filter((it) => it.seconds === null).length,
  };
}

/* ---------- cron ---------- */

export type CronFieldKey = "minute" | "hour" | "dom" | "month" | "dow";

type FieldSpec = {
  key: CronFieldKey;
  label: string;
  min: number;
  max: number;
  names?: string[];
};

const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DOW_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
export const DOW_JA = ["日曜", "月曜", "火曜", "水曜", "木曜", "金曜", "土曜"];

export const CRON_FIELDS: FieldSpec[] = [
  { key: "minute", label: "分", min: 0, max: 59 },
  { key: "hour", label: "時", min: 0, max: 23 },
  { key: "dom", label: "日", min: 1, max: 31 },
  { key: "month", label: "月", min: 1, max: 12, names: MONTH_NAMES },
  { key: "dow", label: "曜日", min: 0, max: 7, names: DOW_NAMES },
];

export const CRON_MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

export type CronField = {
  raw: string;
  /** 当てはまる値（小さい順。曜日の7は0にまとめる） */
  values: number[];
  /** * で始まる（すべて・*\/n）。日と曜日の組み合わせ方の判定に使う */
  star: boolean;
};

export type Cron = { expr: string; fields: Record<CronFieldKey, CronField> };

function parseValue(s: string, spec: FieldSpec): number {
  const upper = s.toUpperCase();
  const named = spec.names?.indexOf(upper) ?? -1;
  if (named >= 0) return spec.key === "month" ? named + 1 : named;
  if (!/^\d+$/.test(s)) throw new Error(`「${spec.label}」の「${s}」は数字（または${spec.key === "month" ? "JAN などの月の名前" : spec.key === "dow" ? "MON などの曜日の名前" : "*"}）ではありません`);
  const n = Number(s);
  if (n < spec.min || n > spec.max) throw new Error(`「${spec.label}」の ${n} は範囲外です（${spec.min}〜${spec.max}）`);
  return n;
}

function parseField(raw: string, spec: FieldSpec): CronField {
  const set = new Set<number>();
  for (const item of raw.split(",")) {
    if (item === "") throw new Error(`「${spec.label}」にカンマが続いているか、空の項目があります`);
    const [range, stepStr, extra] = item.split("/");
    if (extra !== undefined) throw new Error(`「${spec.label}」の「${item}」は / が多すぎます`);
    let step = 1;
    if (stepStr !== undefined) {
      if (!/^\d+$/.test(stepStr) || Number(stepStr) === 0) throw new Error(`「${spec.label}」の「/${stepStr}」：/ のあとには1以上の数字を入れてください`);
      step = Number(stepStr);
    }
    let lo: number;
    let hi: number;
    if (range === "*") {
      lo = spec.min;
      hi = spec.key === "dow" ? 6 : spec.max;
    } else if (range.includes("-")) {
      const [a, b, more] = range.split("-");
      if (more !== undefined || a === "" || b === "") throw new Error(`「${spec.label}」の範囲「${range}」が読めません`);
      lo = parseValue(a, spec);
      hi = parseValue(b, spec);
      if (lo > hi) throw new Error(`「${spec.label}」の範囲「${range}」は小さい値から大きい値の順に書いてください`);
    } else {
      lo = parseValue(range, spec);
      // 「5/15」は 5 から最後まで 15 ごと
      hi = stepStr !== undefined ? (spec.key === "dow" ? 6 : spec.max) : lo;
    }
    for (let v = lo; v <= hi; v += step) set.add(spec.key === "dow" && v === 7 ? 0 : v);
  }
  return {
    raw,
    values: [...set].sort((a, b) => a - b),
    star: raw.startsWith("*"),
  };
}

/** 5つの項目のcron式を読む。エラーなら { error } */
export function parseCron(input: string): Cron | { error: string } {
  const expr = input.trim().replace(/\s+/g, " ");
  if (!expr) return { error: "cron式を入れてください（例：0 9 * * 1-5）" };
  if (expr.toLowerCase() === "@reboot")
    return {
      error: "@reboot は起動したときに1回だけ実行する指定のため、決まった実行日時はありません",
    };
  const expanded = expr.startsWith("@") ? CRON_MACROS[expr.toLowerCase()] : expr;
  if (!expanded)
    return {
      error: `「${expr}」は使えない指定です（@yearly・@monthly・@weekly・@daily・@hourly などが使えます）`,
    };
  const parts = expanded.split(" ");
  if (parts.length !== 5) {
    const hint = parts.length === 6 || parts.length === 7 ? "秒や年を含む形式（Quartz・Spring など）には対応していません。" : "";
    return {
      error: `「分 時 日 月 曜日」の5つの項目をスペースで区切って入れてください（いまは ${parts.length} 個です）。${hint}`,
    };
  }
  try {
    const fields = {} as Record<CronFieldKey, CronField>;
    CRON_FIELDS.forEach((spec, i) => (fields[spec.key] = parseField(parts[i], spec)));
    return { expr: expanded, fields };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** その日付が当てはまるか。日と曜日の両方を指定（どちらも * で始まらない）したときは「どちらか」に当てはまればよい */
export function dayMatches(c: Cron, dom: number, dow: number): boolean {
  const d = c.fields.dom;
  const w = c.fields.dow;
  const dm = d.values.includes(dom);
  const wm = w.values.includes(dow);
  return d.star || w.star ? dm && wm : dm || wm;
}

/**
 * fromMs より後の実行時刻を count 個。offsetMinutes はタイムゾーンのUTCとの差（日本時間なら540）。
 * 何年先まで探しても見つからなければ、そこまでの分だけ返す。
 */
export function nextRuns(c: Cron, fromMs: number, count: number, offsetMinutes: number): number[] {
  const off = offsetMinutes * 60_000;
  // 現地の時刻を UTC の値として扱って進める
  const t = new Date(Math.floor((fromMs + off) / 60_000) * 60_000 + 60_000);
  const limitYear = t.getUTCFullYear() + 30;
  const out: number[] = [];
  const f = c.fields;
  while (out.length < count && t.getUTCFullYear() <= limitYear) {
    if (!f.month.values.includes(t.getUTCMonth() + 1)) {
      t.setUTCMonth(t.getUTCMonth() + 1, 1);
      t.setUTCHours(0, 0, 0, 0);
      continue;
    }
    if (!dayMatches(c, t.getUTCDate(), t.getUTCDay())) {
      t.setUTCDate(t.getUTCDate() + 1);
      t.setUTCHours(0, 0, 0, 0);
      continue;
    }
    if (!f.hour.values.includes(t.getUTCHours())) {
      t.setUTCHours(t.getUTCHours() + 1, 0, 0, 0);
      continue;
    }
    if (!f.minute.values.includes(t.getUTCMinutes())) {
      t.setUTCMinutes(t.getUTCMinutes() + 1, 0, 0);
      continue;
    }
    out.push(t.getTime() - off);
    t.setUTCMinutes(t.getUTCMinutes() + 1, 0, 0);
  }
  return out;
}

/* ----- 日本語の説明 ----- */

const isAll = (f: CronField, spec: FieldSpec) => f.raw === "*" || (spec.key === "dow" ? f.values.length === 7 : f.values.length === spec.max - spec.min + 1 && f.raw.startsWith("*"));

function valueLabel(v: number, key: CronFieldKey): string {
  if (key === "dow") return DOW_JA[v];
  if (key === "month") return `${v}月`;
  if (key === "dom") return `${v}日`;
  if (key === "hour") return `${v}時`;
  return `${v}分`;
}

/** 1つの項目（「1-5」「*\/15」「1,15」など）を日本語に */
export function describeField(f: CronField, key: CronFieldKey): string {
  const spec = CRON_FIELDS.find((s) => s.key === key)!;
  if (isAll(f, spec))
    return {
      minute: "毎分",
      hour: "毎時",
      dom: "毎日",
      month: "毎月",
      dow: "毎日",
    }[key];
  const stepUnit: Record<CronFieldKey, string> = {
    minute: "分",
    hour: "時間",
    dom: "日",
    month: "か月",
    dow: "日",
  };
  return f.raw
    .split(",")
    .map((item) => {
      const [range, step] = item.split("/");
      const toLabel = (s: string) => valueLabel(parseValue(s, spec) === 7 && key === "dow" ? 0 : parseValue(s, spec), key);
      if (step) {
        const every = `${step}${stepUnit[key]}ごと`;
        if (range === "*") return key === "dow" ? f.values.map((v) => DOW_JA[v]).join("・") : key === "dom" || key === "month" ? `${valueLabel(1, key)}から${every}` : every;
        if (range.includes("-")) {
          const [a, b] = range.split("-");
          return `${toLabel(a)}〜${toLabel(b)}の${every}`;
        }
        return `${toLabel(range)}から${every}`;
      }
      if (range.includes("-")) {
        const [a, b] = range.split("-");
        return `${toLabel(a)}〜${toLabel(b)}`;
      }
      return toLabel(range);
    })
    .join("・");
}

const plain = (f: CronField) => /^\d+(,\d+)*$/.test(f.raw);

/** cron式全体を日本語の1文に */
export function describeCron(c: Cron): string {
  const f = c.fields;
  const spec = (k: CronFieldKey) => CRON_FIELDS.find((s) => s.key === k)!;
  // 時刻
  let time: string;
  const minAll = isAll(f.minute, spec("minute"));
  const hourAll = isAll(f.hour, spec("hour"));
  if (plain(f.minute) && plain(f.hour) && f.minute.values.length * f.hour.values.length <= 6) {
    time = f.hour.values.flatMap((h) => f.minute.values.map((m) => `${h}:${pad2(m)}`)).join("・");
  } else if (minAll && hourAll) {
    time = "毎分";
  } else if (hourAll) {
    time = f.minute.raw.startsWith("*/") ? describeField(f.minute, "minute") : `毎時 ${describeField(f.minute, "minute")}`;
  } else if (minAll) {
    time = `${describeField(f.hour, "hour")}の間、毎分`;
  } else {
    time = `${describeField(f.hour, "hour")}の ${describeField(f.minute, "minute")}`;
  }
  // 日付
  const domAll = isAll(f.dom, spec("dom"));
  const dowAll = isAll(f.dow, spec("dow"));
  const monthAll = isAll(f.month, spec("month"));
  let day: string;
  if ((domAll && dowAll) || (!f.dom.star && !f.dow.star && (domAll || dowAll))) day = "毎日";
  else if (dowAll || f.dow.star) day = `${monthAll ? "毎月 " : ""}${describeField(f.dom, "dom")}${dowAll ? "" : `（かつ ${describeField(f.dow, "dow")}）`}`;
  else if (domAll || f.dom.star) day = `毎週 ${describeField(f.dow, "dow")}${domAll ? "" : `（かつ ${describeField(f.dom, "dom")}）`}`;
  else day = `${monthAll ? "毎月 " : ""}${describeField(f.dom, "dom")}、または毎週 ${describeField(f.dow, "dow")}`;
  const month = monthAll ? "" : `${describeField(f.month, "month")}の `;
  return `${month}${day}${day || month ? " " : ""}${time}に実行`.replace(/\s+/g, " ").trim();
}

export const CRON_EXAMPLES: { expr: string; label: string }[] = [
  { expr: "0 9 * * 1-5", label: "平日の9時" },
  { expr: "*/15 * * * *", label: "15分ごと" },
  { expr: "30 2 * * *", label: "毎日2時30分" },
  { expr: "0 0 1 * *", label: "毎月1日の0時" },
  { expr: "0 8-18/2 * * MON-FRI", label: "平日8〜18時に2時間ごと" },
  { expr: "0 12 1,15 * *", label: "毎月1日と15日" },
];
