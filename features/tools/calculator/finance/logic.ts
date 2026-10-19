/** ローン返済・BMI の計算 */

export type LoanMethod = "annuity" | "principal";
export type LoanInput = {
  /** 借入額（円） */
  amount: number;
  /** 年利（%） */
  annualRate: number;
  /** 返済期間（年） */
  years: number;
  method: LoanMethod;
};
export type LoanResult = {
  /** 1回目の返済額（元利均等なら毎月同じ） */
  firstPayment: number;
  /** 最終回の返済額 */
  lastPayment: number;
  totalPayment: number;
  totalInterest: number;
  months: number;
  /** 年ごとの返済額と年末の残高 */
  yearly: { year: number; paid: number; interest: number; balance: number }[];
};

/**
 * 毎月返済の目安（ボーナス払いなし）。
 * 元利均等：毎月の返済額 = 借入額 × 月利 ×(1+月利)^回数 ÷((1+月利)^回数 − 1)
 * 元金均等：毎月の元金 = 借入額 ÷ 回数、利息は残高 × 月利
 * 1円未満は毎月四捨五入し、最終回で残高をちょうど0にする。
 */
export function calcLoan({ amount, annualRate, years, method }: LoanInput): LoanResult | null {
  const P = Math.floor(amount || 0);
  const n = Math.round((years || 0) * 12);
  if (P <= 0 || n <= 0 || n > 600 || !(annualRate >= 0) || annualRate > 30) return null;
  const r = annualRate / 100 / 12;
  const fixed = r === 0 ? P / n : (P * r * (1 + r) ** n) / ((1 + r) ** n - 1);
  let balance = P;
  let total = 0;
  let totalInterest = 0;
  let first = 0;
  let last = 0;
  const yearly: LoanResult["yearly"] = [];
  let yPaid = 0;
  let yInterest = 0;
  for (let m = 1; m <= n; m++) {
    const interest = Math.round(balance * r);
    let principal = method === "annuity" ? Math.round(fixed) - interest : Math.round(P / n);
    if (m === n || principal > balance) principal = balance;
    const pay = principal + interest;
    balance -= principal;
    total += pay;
    totalInterest += interest;
    yPaid += pay;
    yInterest += interest;
    if (m === 1) first = pay;
    last = pay;
    if (m % 12 === 0 || m === n) {
      yearly.push({ year: Math.ceil(m / 12), paid: yPaid, interest: yInterest, balance });
      yPaid = 0;
      yInterest = 0;
    }
  }
  return { firstPayment: first, lastPayment: last, totalPayment: total, totalInterest, months: n, yearly };
}

/** BMI と、日本肥満学会の判定（18.5未満〜40以上） */
export function calcBmi(heightCm: number, weightKg: number): { bmi: number; label: string; standardWeight: number } | null {
  const m = heightCm / 100;
  if (!(m > 0.5 && m < 2.6) || !(weightKg > 1 && weightKg < 400)) return null;
  const bmi = weightKg / (m * m);
  const label = bmi < 18.5 ? "低体重" : bmi < 25 ? "普通体重" : bmi < 30 ? "肥満（1度）" : bmi < 35 ? "肥満（2度）" : bmi < 40 ? "肥満（3度）" : "肥満（4度）";
  return { bmi, label, standardWeight: 22 * m * m };
}
