/** 複利・貯金目標・残業代・歩数と距離の計算（DOMを使わない純粋な計算） */

/* ---------- 複利計算 ---------- */

export type CompoundInput = {
  /** 元本（円） */
  principal: number;
  /** 毎月の積立額（円） */
  monthly: number;
  /** 年利（%） */
  annualRate: number;
  /** 期間（年） */
  years: number;
};
export type CompoundRow = { year: number; contributed: number; balance: number; gain: number };
export type CompoundResult = { final: number; contributed: number; gain: number; yearly: CompoundRow[] };

/**
 * 月複利（年利 ÷ 12 を毎月かける）。積立は毎月末に入れる前提。
 * 毎月：残高 = 残高 ×(1 + 年利/12) + 積立額
 */
export function calcCompound({ principal, monthly, annualRate, years }: CompoundInput): CompoundResult | null {
  const P = principal || 0;
  const M = monthly || 0;
  const n = Math.round((years || 0) * 12);
  if (P < 0 || M < 0 || P + M <= 0 || n <= 0 || n > 1200 || !(annualRate >= -50 && annualRate <= 100)) return null;
  const r = annualRate / 100 / 12;
  let balance = P;
  let contributed = P;
  const yearly: CompoundRow[] = [];
  for (let m = 1; m <= n; m++) {
    balance = balance * (1 + r) + M;
    contributed += M;
    if (m % 12 === 0 || m === n) yearly.push({ year: Math.ceil(m / 12), contributed, balance, gain: balance - contributed });
  }
  return { final: balance, contributed, gain: balance - contributed, yearly };
}

/* ---------- 貯金目標 ---------- */

/** 期間（か月）で目標額に届くための毎月の積立額（円・切り上げ）。利息は月複利、積立は月末 */
export function requiredMonthly({ target, current, months, annualRate }: { target: number; current: number; months: number; annualRate: number }): { monthly: number; final: number; interest: number } | null {
  const n = Math.round(months);
  if (!(target > 0) || !(current >= 0) || !(n >= 1 && n <= 1200) || !(annualRate >= 0 && annualRate <= 50)) return null;
  const r = annualRate / 100 / 12;
  const grow = (1 + r) ** n;
  const need = target - current * grow;
  const pay = need <= 0 ? 0 : r === 0 ? need / n : (need * r) / (grow - 1);
  const monthly = pay > 0 ? Math.ceil(pay - 1e-9) : 0;
  const final = current * grow + (r === 0 ? monthly * n : (monthly * (grow - 1)) / r);
  return { monthly, final, interest: final - current - monthly * n };
}

/** 毎月の積立額で、目標額に届くまでの月数（届かないときは null） */
export function monthsToGoal({ target, current, monthly, annualRate }: { target: number; current: number; monthly: number; annualRate: number }): { months: number; balance: number } | null {
  if (!(target > 0) || !(current >= 0) || !(monthly >= 0) || !(annualRate >= 0 && annualRate <= 50)) return null;
  if (current >= target) return { months: 0, balance: current };
  const r = annualRate / 100 / 12;
  let b = current;
  for (let m = 1; m <= 1200; m++) {
    b = b * (1 + r) + monthly;
    if (b >= target - 1e-6) return { months: m, balance: b };
  }
  return null;
}

/** "YYYY-MM-DD" から n か月後の年・月 */
export function addMonthsYm(ymd: string, n: number): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})/.exec(ymd);
  if (!m) return null;
  const idx = Number(m[1]) * 12 + Number(m[2]) - 1 + n;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

/** 今日から期限の年月までの月数（同じ月なら0）。期限の月の末までに貯める考え方 */
export function monthsUntil(todayYmd: string, deadlineYmd: string): number | null {
  const a = /^(\d{4})-(\d{2})/.exec(todayYmd);
  const b = /^(\d{4})-(\d{2})/.exec(deadlineYmd);
  if (!a || !b) return null;
  return (Number(b[1]) - Number(a[1])) * 12 + Number(b[2]) - Number(a[2]);
}

/* ---------- 残業代 ---------- */

export type OvertimeHours = {
  /** 時間外（深夜を除く） */
  ot: number;
  /** 時間外かつ深夜（22時〜5時） */
  otNight: number;
  /** 法定休日（深夜を除く） */
  holiday: number;
  /** 法定休日かつ深夜 */
  holidayNight: number;
  /** 所定労働時間内の深夜（深夜の割増分だけ） */
  nightOnly: number;
};
export type OvertimeRow = { label: string; hours: number; rate: number; amount: number };

/** 労働基準法の割増率の下限 */
export const PREMIUM = { overtime: 0.25, over60: 0.5, night: 0.25, holiday: 0.35 } as const;

/**
 * 残業代の目安。1時間あたりの賃金 × 時間 × 率。
 * 時間外：1.25、時間外かつ深夜：1.5、法定休日：1.35、法定休日かつ深夜：1.6、所定内の深夜：0.25（割増分のみ）。
 * 時間外（深夜を含む）が月60時間を超えた分は、さらに 0.25 を上乗せ（合計 1.5、深夜なら 1.75）。
 * 深夜の割増は足し算なので、60時間を超えた分が深夜かどうかで合計は変わらない。
 * 法定休日の労働は60時間の計算に含めない。
 */
export function calcOvertime(hourly: number, h: OvertimeHours): { rows: OvertimeRow[]; total: number; overtimeHours: number; over60Hours: number } | null {
  if (!(hourly > 0)) return null;
  const v = (x: number) => (Number.isFinite(x) && x > 0 ? x : 0);
  const ot = v(h.ot);
  const otNight = v(h.otNight);
  const holiday = v(h.holiday);
  const holidayNight = v(h.holidayNight);
  const nightOnly = v(h.nightOnly);
  const overtimeHours = ot + otNight;
  const over60Hours = Math.max(0, overtimeHours - 60);
  const row = (label: string, hours: number, rate: number): OvertimeRow => ({ label, hours, rate, amount: Math.round(hourly * hours * rate) });
  const rows = [
    row("時間外（深夜を除く）", ot, 1 + PREMIUM.overtime),
    row("時間外かつ深夜", otNight, 1 + PREMIUM.overtime + PREMIUM.night),
    row("月60時間を超えた時間外の上乗せ分", over60Hours, PREMIUM.over60 - PREMIUM.overtime),
    row("法定休日（深夜を除く）", holiday, 1 + PREMIUM.holiday),
    row("法定休日かつ深夜", holidayNight, 1 + PREMIUM.holiday + PREMIUM.night),
    row("所定時間内の深夜（割増分のみ）", nightOnly, PREMIUM.night),
  ];
  return { rows, total: rows.reduce((s, r) => s + r.amount, 0), overtimeHours, over60Hours };
}

/* ---------- 歩数・距離 ---------- */

/** 身長から歩幅を推定（身長 × 0.45、cm）。あくまで目安 */
export const strideFromHeight = (heightCm: number) => (heightCm > 0 ? heightCm * 0.45 : Number.NaN);

/** 歩数 → 距離（m） */
export const stepsToMeters = (steps: number, strideCm: number) => (steps >= 0 && strideCm > 0 ? (steps * strideCm) / 100 : Number.NaN);

/** 距離（m） → 歩数（四捨五入） */
export const metersToSteps = (meters: number, strideCm: number) => (meters >= 0 && strideCm > 0 ? Math.round((meters * 100) / strideCm) : Number.NaN);

/** 歩く時間（分）。分速80mを目安にする */
export const walkMinutes = (meters: number, metersPerMin = 80) => (meters >= 0 && metersPerMin > 0 ? meters / metersPerMin : Number.NaN);
