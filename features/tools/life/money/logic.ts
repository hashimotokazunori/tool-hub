/** 暮らしのお金の計算（精算・単価・予算・電気代・チップ・データ容量）。すべて純粋関数 */

/* 旅行費用の精算 */
export type Transfer = { from: string; to: string; amount: number };
/**
 * 立て替えた金額から、全員が同じ額を負担するための送金を出す。
 * 多く払った人と少なく払った人を大きい順に組み合わせるので、送金の回数が少なくなる。1円未満は四捨五入。
 */
export function settle(payers: { name: string; paid: number }[]): { total: number; perPerson: number; transfers: Transfer[] } {
  const ps = payers.map((p, i) => ({ name: p.name.trim() || `${i + 1}人目`, paid: Math.max(0, p.paid || 0) }));
  const total = ps.reduce((a, p) => a + p.paid, 0);
  const perPerson = ps.length ? total / ps.length : 0;
  const creditors = ps.map((p) => ({ name: p.name, b: Math.round(p.paid - perPerson) })).filter((x) => x.b > 0).sort((a, b) => b.b - a.b);
  const debtors = ps.map((p) => ({ name: p.name, b: Math.round(perPerson - p.paid) })).filter((x) => x.b > 0).sort((a, b) => b.b - a.b);
  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].b, creditors[j].b);
    if (amount > 0) transfers.push({ from: debtors[i].name, to: creditors[j].name, amount });
    debtors[i].b -= amount;
    creditors[j].b -= amount;
    if (debtors[i].b <= 0) i++;
    if (creditors[j].b <= 0) j++;
  }
  return { total, perPerson, transfers };
}

/* 買い物の単価 */
export type UnitPriceRow = { name: string; price: number; amount: number; packs: number };
/** 容量1あたりの価格で安い順に並べる（容量・価格が正の行だけ） */
export function rankUnitPrices(rows: UnitPriceRow[]) {
  const valid = rows
    .map((r, index) => ({ ...r, index, unit: r.price / (r.amount * (r.packs > 0 ? r.packs : 1)) }))
    .filter((r) => r.price > 0 && r.amount > 0);
  valid.sort((a, b) => a.unit - b.unit);
  const best = valid[0]?.unit ?? 0;
  return valid.map((r) => ({ ...r, per100: r.unit * 100, diffPct: best ? (r.unit / best - 1) * 100 : 0 }));
}

/* 予算配分 */
/** 「費目 割合」を1行ずつ読む（「食費 15」「食費：15%」「食費,15」） */
export function parseBudgetLines(text: string): { name: string; weight: number }[] {
  return text
    .split("\n")
    .map((l) => /^(.+?)[\s,，、:：]+([\d.]+)\s*%?$/.exec(l.trim()))
    .filter((m): m is RegExpExecArray => m !== null && Number(m[2]) > 0)
    .map((m) => ({ name: m[1], weight: Number(m[2]) }));
}
/** 割合の合計が100でなくても、比率として配分する */
export function allocate(total: number, items: { name: string; weight: number }[]) {
  const sum = items.reduce((a, x) => a + x.weight, 0);
  return { sum, rows: items.map((x) => ({ ...x, share: sum ? x.weight / sum : 0, amount: sum ? Math.round((total * x.weight) / sum) : 0 })) };
}

/* 電気代 */
export function electricityCost(watts: number, hoursPerDay: number, units: number, pricePerKwh: number, daysPerMonth: number) {
  const kwhPerDay = (watts * Math.max(0, units) * hoursPerDay) / 1000;
  const perDay = kwhPerDay * pricePerKwh;
  return { kwhPerDay, perHour: (watts * Math.max(0, units) * pricePerKwh) / 1000, perDay, perMonth: perDay * daysPerMonth, perYear: perDay * 365 };
}

/* チップ・サービス料 */
export function tipTotal(amount: number, mode: number | "jp", people: number, roundUp: boolean) {
  let tip: number;
  let total: number;
  if (mode === "jp") {
    // 日本のサービス料10%＋消費税10%（サービス料にも消費税がかかる）
    tip = amount * 0.1;
    total = amount * 1.1 * 1.1;
  } else {
    tip = (amount * mode) / 100;
    total = amount + tip;
    if (roundUp) {
      const t = Math.ceil(total - 1e-9);
      tip += t - total;
      total = t;
    }
  }
  return { tip, total, perPerson: total / Math.max(1, Math.floor(people || 1)) };
}

/* データ容量 */
export const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const;
/** 値と単位をバイトに直し、各単位に換算する。base は 1000（製品・通信）か 1024（OS） */
export function convertDataSize(value: number, unitIndex: number, base: 1000 | 1024) {
  const bytes = value * base ** unitIndex;
  return { bytes, units: SIZE_UNITS.map((u, i) => ({ unit: u, value: bytes / base ** i })) };
}
/** 転送にかかる秒数（Mbps） */
export const transferSeconds = (bytes: number, mbps: number) => (mbps > 0 ? (bytes * 8) / (mbps * 1e6) : Number.NaN);
