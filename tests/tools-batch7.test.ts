import { describe, expect, it } from "vitest";
import { INCOME_TAX_RATES, breakdown, fullDeductionLimit, incomeTaxRatePct, rateFromTaxableIncome, specialCap, specialRatePct } from "@/features/tools/life/furusato/logic";

// ───────── ふるさと納税の控除上限 ─────────

describe("ふるさと納税：特例分の割合", () => {
  it("地方税法 附則第5条の6 の割合と一致する", () => {
    expect([5, 10, 20, 23, 33, 40, 45].map((r) => specialRatePct(r as (typeof INCOME_TAX_RATES)[number]))).toEqual([84.895, 79.79, 69.58, 66.517, 56.307, 49.16, 44.055]);
    // 課税総所得金額−人的控除差調整額が0円未満（所得税がかからない）なら90%
    expect(specialRatePct(0)).toBe(90);
  });

  it("どの税率でも 90% − 税率×1.021 になる", () => {
    for (const r of INCOME_TAX_RATES) expect(specialRatePct(r)).toBeCloseTo(90 - r * 1.021, 10);
  });

  it("所得税の控除に使う率は 税率×1.021", () => {
    expect(incomeTaxRatePct(20)).toBeCloseTo(20.42, 10);
    expect(incomeTaxRatePct(0)).toBe(0);
  });
});

describe("ふるさと納税：所得税の税率（国税庁 No.2260）", () => {
  it("課税される所得金額の区切り", () => {
    expect(rateFromTaxableIncome(1_000)).toBe(5);
    expect(rateFromTaxableIncome(1_949_999)).toBe(5); // 1,000円未満を切り捨てて 1,949,000円
    expect(rateFromTaxableIncome(1_950_000)).toBe(10);
    expect(rateFromTaxableIncome(3_299_000)).toBe(10);
    expect(rateFromTaxableIncome(3_300_000)).toBe(20);
    expect(rateFromTaxableIncome(6_949_999)).toBe(20);
    expect(rateFromTaxableIncome(6_950_000)).toBe(23);
    expect(rateFromTaxableIncome(9_000_000)).toBe(33);
    expect(rateFromTaxableIncome(18_000_000)).toBe(40);
    expect(rateFromTaxableIncome(40_000_000)).toBe(45);
  });

  it("1,000円未満は0%、負や数でないものは null", () => {
    expect(rateFromTaxableIncome(999)).toBe(0);
    expect(rateFromTaxableIncome(0)).toBe(0);
    expect(rateFromTaxableIncome(-1)).toBeNull();
    expect(rateFromTaxableIncome(Number.NaN)).toBeNull();
  });
});

describe("ふるさと納税：控除上限の目安", () => {
  const base = { shotokuwari: 300_000, rate: 10 as const, year: 2026 };

  it("所得割額×20% ÷ 特例分の割合 + 2,000円（1円未満切り捨て）", () => {
    // 60,000 ÷ 0.7979 = 75,197.39… → 75,197 + 2,000
    expect(fullDeductionLimit(base)).toBe(77_197);
  });

  it("上限ちょうどでは特例分が上限に届かず、1円多いと上限で頭打ちになる", () => {
    const at = breakdown(77_197, base)!;
    expect(at.specialCapped).toBe(false);
    const over = breakdown(77_198, base)!;
    expect(over.specialCapped).toBe(true);
    expect(over.special).toBe(60_000);
  });

  it("上限までの寄附なら自己負担は2,000円（各項目の端数切り捨てで数円の差）", () => {
    const b = breakdown(77_197, base)!;
    expect(b.incomeTax).toBe(7_677); // 75,197 × 10.21%
    expect(b.basic).toBe(7_519); // 75,197 × 10%
    expect(b.special).toBe(59_999); // 75,197 × 79.79%
    expect(b.selfBurden).toBeGreaterThanOrEqual(2_000);
    expect(b.selfBurden).toBeLessThanOrEqual(2_003);
  });

  it("上限を超えた分は自己負担が増える", () => {
    const b = breakdown(127_197, base)!;
    // 5万円多く寄附すると、特例分は増えず、所得税と基本分だけが増える
    expect(b.special).toBe(60_000);
    expect(b.selfBurden).toBeGreaterThan(30_000);
  });

  it("総務省の例（所得税率20%・寄附3万円）：基本分は2,800円、特例分は69.58%", () => {
    const b = breakdown(30_000, { shotokuwari: 1_000_000, rate: 20, year: 2026 })!;
    expect(b.basic).toBe(2_800);
    expect(b.special).toBe(19_482); // 28,000 × 69.58%
    expect(b.incomeTax).toBe(5_717); // 28,000 × 20.42%
  });

  it("所得税がかからない人（0%）は特例分90%", () => {
    // 10,000 ÷ 0.9 = 11,111.1… → 11,111 + 2,000
    expect(fullDeductionLimit({ shotokuwari: 50_000, rate: 0, year: 2026 })).toBe(13_111);
    expect(breakdown(13_111, { shotokuwari: 50_000, rate: 0, year: 2026 })!.incomeTax).toBe(0);
  });

  it("総所得金額等がわかるときは、基本分の対象（30%）を超えない", () => {
    expect(fullDeductionLimit({ ...base, totalIncome: 200_000 })).toBe(60_000);
    // 30%・40% を超えた寄附は、その超えた分が基本分・所得税の対象にならない
    const b = breakdown(100_000, { ...base, totalIncome: 200_000 })!;
    expect(b.basic).toBe(5_800); // (60,000 − 2,000) × 10%
    expect(b.incomeTax).toBe(7_963); // (80,000 − 2,000) × 10.21%
  });

  it("2027年以降の寄附は特例分の上限が193万円で頭打ち", () => {
    const rich = { shotokuwari: 20_000_000, rate: 45 as const };
    expect(specialCap(rich.shotokuwari, 2026)).toBe(4_000_000);
    expect(specialCap(rich.shotokuwari, 2027)).toBe(1_930_000);
    expect(fullDeductionLimit({ ...rich, year: 2026 })).toBe(9_081_559);
    // 1,930,000 ÷ 0.44055 = 4,380,887.5… → 4,380,887 + 2,000（総務省資料の「438万円」）
    expect(fullDeductionLimit({ ...rich, year: 2027 })).toBe(4_382_887);
    // 所得割額の20%が193万円より少ない人は変わらない
    expect(fullDeductionLimit({ ...base, year: 2027 })).toBe(77_197);
  });

  it("所得割額が0なら上限は自己負担分の2,000円、入力が不正なら null", () => {
    expect(fullDeductionLimit({ shotokuwari: 0, rate: 5, year: 2026 })).toBe(2_000);
    expect(fullDeductionLimit({ shotokuwari: Number.NaN, rate: 5, year: 2026 })).toBeNull();
    expect(breakdown(Number.NaN, base)).toBeNull();
  });

  it("2,000円以下の寄附は控除なし", () => {
    const b = breakdown(2_000, base)!;
    expect(b.total).toBe(0);
    expect(b.selfBurden).toBe(2_000);
  });
});
