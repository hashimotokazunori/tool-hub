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

export type ReceiptItem = { name: string; price: number; rate: number };
export type ReceiptRow = TaxResult & { rate: number; count: number };

/**
 * 複数の品目をまとめて計算する。インボイス（適格請求書）と同じく、
 * 税率ごとに金額を合計してから1回だけ端数処理する。
 */
export function calcReceipt(items: ReceiptItem[], basis: TaxInput["basis"], rounding: TaxRounding): { rows: ReceiptRow[]; total: TaxResult } {
  const rows: ReceiptRow[] = [];
  for (const rate of [10, 8]) {
    const list = items.filter((it) => it.rate === rate && it.price > 0);
    if (list.length === 0) continue;
    const sum = list.reduce((s, it) => s + Math.floor(it.price), 0);
    rows.push({ rate, count: list.length, ...calcTax({ amount: sum, basis, rate, rounding }) });
  }
  const total = rows.reduce((t, r) => ({ excluded: t.excluded + r.excluded, tax: t.tax + r.tax, included: t.included + r.included }), { excluded: 0, tax: 0, included: 0 });
  return { rows, total };
}
