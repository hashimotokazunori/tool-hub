/**
 * ふるさと納税の控除額と、自己負担2,000円で収まる寄附額の上限（目安）。すべて純粋関数。
 *
 * 出典（2026年10月確認）
 * - 総務省「税金の控除について」 https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/mechanism/deduction.html
 *   (1) 所得税 =（寄附額−2,000円）×所得税の税率（令和19年中の寄附までは復興特別所得税を加えた率）。対象は総所得金額等の40%まで
 *   (2) 住民税・基本分 =（寄附額−2,000円）×10%。対象は総所得金額等の30%まで
 *   (3) 住民税・特例分 =（寄附額−2,000円）×（100%−10%−所得税の税率）。住民税所得割額の2割が上限
 * - 地方税法 第37条の2第11項・第314条の7第11項（特例控除の割合の表）、附則第5条の6（復興特別所得税の期間の割合）
 *   84.895% / 79.79% / 69.58% / 66.517% / 56.307% / 49.16% / 44.055%、課税総所得金額−人的控除差調整額が0円未満なら90%
 * - 地方税法等の一部を改正する法律（令和8年法律第2号）：特例控除額の上限を「所得割額の20%」と
 *   定額（道府県民税77万2千円＋市町村民税115万8千円＝合計193万円。指定都市は38万6千円＋154万4千円）の低いほうに。
 *   令和10年度分の住民税から適用＝令和9年（2027年）中の寄附から
 *   https://www.soumu.go.jp/main_content/001067617.pdf
 * - 国税庁 No.2260 所得税の税率 https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm
 */

/** 自己負担になる額（寄附額のうち控除されない部分） */
export const SELF_BURDEN = 2_000;

/** 所得税の税率（%）。0は「所得税がかからない（課税される所得が0円）」 */
export const INCOME_TAX_RATES = [0, 5, 10, 20, 23, 33, 40, 45] as const;
export type IncomeTaxRate = (typeof INCOME_TAX_RATES)[number];

/**
 * 住民税・特例分の割合（10万分の1単位の整数。84.895% → 84895）。
 * 地方税法 附則第5条の6 の割合。= 90% − 所得税の税率 × 1.021
 */
const SPECIAL_RATE_E5: Record<IncomeTaxRate, number> = {
  0: 90_000,
  5: 84_895,
  10: 79_790,
  20: 69_580,
  23: 66_517,
  33: 56_307,
  40: 49_160,
  45: 44_055,
};

/** 特例分の割合（%） */
export const specialRatePct = (rate: IncomeTaxRate) => SPECIAL_RATE_E5[rate] / 1000;

/** 所得税の控除に使う率（%）：税率 × 1.021（復興特別所得税） */
export const incomeTaxRatePct = (rate: IncomeTaxRate) => (rate * 1021) / 1000;

/** 令和9年（2027年）中の寄附から加わる、特例分の定額の上限（道府県民税＋市町村民税） */
export const FIXED_SPECIAL_CAP = 1_930_000;
/** 定額の上限が加わる最初の寄附の年 */
export const FIXED_CAP_FROM_YEAR = 2027;

/** 国税庁 No.2260 の速算表（課税される所得金額 → 税率）。上限は「以下」 */
const BRACKETS: { upTo: number; rate: IncomeTaxRate }[] = [
  { upTo: 1_949_000, rate: 5 },
  { upTo: 3_299_000, rate: 10 },
  { upTo: 6_949_000, rate: 20 },
  { upTo: 8_999_000, rate: 23 },
  { upTo: 17_999_000, rate: 33 },
  { upTo: 39_999_000, rate: 40 },
  { upTo: Number.POSITIVE_INFINITY, rate: 45 },
];

/** 課税される所得金額（円）から所得税の税率を出す。1,000円未満は切り捨ててから当てはめる。1,000円未満なら0% */
export function rateFromTaxableIncome(taxable: number): IncomeTaxRate | null {
  if (!Number.isFinite(taxable) || taxable < 0) return null;
  const t = Math.floor(taxable / 1000) * 1000;
  if (t < 1000) return 0;
  return BRACKETS.find((b) => t <= b.upTo)!.rate;
}

export type FurusatoInput = {
  /** 住民税の所得割額（道府県民税＋市町村民税。調整控除後・税額控除前） */
  shotokuwari: number;
  /** 所得税の税率（%） */
  rate: IncomeTaxRate;
  /** 寄附する年（西暦） */
  year: number;
  /** 総所得金額等（わからなければ NaN。40%・30% の上限の確認だけに使う） */
  totalIncome?: number;
};

const valid = (n: number | undefined): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0;

/** 特例分の上限の10万倍（整数で比べるため）：所得割額の20%。2027年以降の寄附は 193万円とのいずれか低いほう */
const specialCapE5 = (shotokuwari: number, year: number) =>
  year >= FIXED_CAP_FROM_YEAR ? Math.min(shotokuwari * 20_000, FIXED_SPECIAL_CAP * 100_000) : shotokuwari * 20_000;

/** 特例分の上限（円） */
export const specialCap = (shotokuwari: number, year: number) => specialCapE5(shotokuwari, year) / 100_000;

/**
 * 自己負担2,000円で収まる寄附額の上限（円・1円未満切り捨て）。
 * 特例分 =（寄附額−2,000）× 割合 ≦ 上限 となる最大の寄附額。
 * 総所得金額等がわかるときは、基本分の対象（総所得金額等の30%）を超えない額に抑える。
 */
export function fullDeductionLimit(input: FurusatoInput): number | null {
  const { shotokuwari, rate, year, totalIncome } = input;
  if (!valid(shotokuwari) || !(rate in SPECIAL_RATE_E5)) return null;
  // 誤差を避けるため整数で計算する：(D − 2000) × k/100000 ≦ cap
  let limit = Math.floor(specialCapE5(shotokuwari, year) / SPECIAL_RATE_E5[rate]) + SELF_BURDEN;
  if (valid(totalIncome)) limit = Math.min(limit, Math.floor((totalIncome * 3) / 10));
  return Math.max(0, limit);
}

export type Breakdown = {
  donation: number;
  /** 所得税からの控除（所得税の軽減額の目安） */
  incomeTax: number;
  /** 住民税・基本分 */
  basic: number;
  /** 住民税・特例分 */
  special: number;
  /** 特例分が上限で頭打ちになったか */
  specialCapped: boolean;
  /** 控除の合計 */
  total: number;
  /** 自己負担（寄附額 − 控除の合計） */
  selfBurden: number;
};

/** 寄附額ごとの控除の内訳（各項目は1円未満切り捨て） */
export function breakdown(donation: number, input: FurusatoInput): Breakdown | null {
  const { shotokuwari, rate, year, totalIncome } = input;
  if (!valid(donation) || !valid(shotokuwari) || !(rate in SPECIAL_RATE_E5)) return null;
  const over = (d: number) => Math.max(0, d - SELF_BURDEN);
  const hasTotal = valid(totalIncome);
  // 所得税：対象は総所得金額等の40%まで。（寄附額−2,000）× 税率 × 1.021
  const forIncomeTax = over(hasTotal ? Math.min(donation, (totalIncome * 4) / 10) : donation);
  const incomeTax = Math.floor((forIncomeTax * rate * 1021) / 100_000);
  // 住民税・基本分：対象は総所得金額等の30%まで。（寄附額−2,000）× 10%
  const forBasic = over(hasTotal ? Math.min(donation, (totalIncome * 3) / 10) : donation);
  const basic = Math.floor(forBasic / 10);
  // 住民税・特例分：（寄附額−2,000）× 割合。所得割額の20%（2027年以降は193万円とも比べて低いほう）が上限
  const rawE5 = over(donation) * SPECIAL_RATE_E5[rate];
  const capE5 = specialCapE5(shotokuwari, year);
  const specialCapped = rawE5 > capE5;
  let special = Math.floor(Math.min(rawE5, capE5) / 100_000);
  // 住民税からの控除は所得割額を超えない
  if (basic + special > shotokuwari) special = Math.max(0, Math.floor(shotokuwari) - basic);
  const total = incomeTax + basic + special;
  return { donation, incomeTax, basic, special, specialCapped, total, selfBurden: donation - total };
}
