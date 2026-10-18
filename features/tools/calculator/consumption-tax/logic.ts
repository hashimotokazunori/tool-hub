export type TaxRounding = "floor" | "round" | "ceil";
export type TaxInput = {
  /** 円（整数） */
  amount: number;
  /** 入力した金額が税抜か税込か */
  basis: "excluded" | "included";
  /** 10 または 8 */
  rate: number;
  rounding: TaxRounding;
};
export type TaxResult = { excluded: number; tax: number; included: number };

const round = (x: number, mode: TaxRounding) => {
  // 浮動小数点の誤差（例: 1980 * 0.1 = 198.00000000000003）を先に丸める
  const v = Number(x.toFixed(6));
  return mode === "floor" ? Math.floor(v) : mode === "ceil" ? Math.ceil(v) : Math.round(v);
};

/** 消費税の計算。税込から戻すときは「税込 × 税率 /(100 + 税率)」で税額を出す */
export function calcTax({ amount, basis, rate, rounding }: TaxInput): TaxResult {
  const a = Math.max(0, Math.floor(amount || 0));
  if (basis === "excluded") {
    const tax = round((a * rate) / 100, rounding);
    return { excluded: a, tax, included: a + tax };
  }
  const tax = round((a * rate) / (100 + rate), rounding);
  return { excluded: a - tax, tax, included: a };
}
