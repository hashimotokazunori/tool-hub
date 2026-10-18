export type WarikanInput = {
  total: number;
  people: number;
  /** 集める単位（1・10・100・500・1000円） */
  unit: number;
  /** 多めに払う人の数 */
  heavyPayers: number;
  /** 多めに払う人は何倍払うか（1以上） */
  ratio: number;
};
export type WarikanResult = {
  perPerson: number;
  perHeavyPayer: number | null;
  collected: number;
  /** 集めた額 − 合計（幹事の手元に残る額） */
  surplus: number;
  exact: number;
};

const ceilTo = (x: number, unit: number) => Math.ceil(x / unit - 1e-9) * unit;

export function calcWarikan({ total, people, unit, heavyPayers, ratio }: WarikanInput): WarikanResult {
  const n = Math.max(1, Math.floor(people || 1));
  const k = Math.min(n, Math.max(0, Math.floor(heavyPayers || 0)));
  const r = k ? Math.max(1, ratio || 1) : 1;
  const u = unit > 0 ? unit : 1;
  const t = Math.max(0, total || 0);
  const base = t / (n - k + k * r);
  const perPerson = ceilTo(base, u);
  const perHeavyPayer = k ? ceilTo(base * r, u) : null;
  const collected = perPerson * (n - k) + (perHeavyPayer ?? 0) * k;
  return { perPerson, perHeavyPayer, collected, surplus: collected - t, exact: t / n };
}
