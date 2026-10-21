/**
 * 年末のセール（/sale/ に出す）。日程は公式の発表を確認してから入れる。発表前は start/end を入れない。
 * start/end は日本時間の ISO 8601。ページは6時間ごとに作り直すので、開催前・開催中・終了後の表示はその時点で切り替わる。
 */
export type Sale = {
  id: string;
  /** 例：楽天ブラックフライデー */
  name: string;
  store: "楽天市場" | "Amazon";
  start?: string;
  end?: string;
  /** 公式の特設ページ（発表後に入れる） */
  officialUrl?: string;
  /** 日程を確認したページ */
  sourceUrl?: string;
  checkedAt?: string;
};

export const sales: Sale[] = [
  { id: "rakuten-black-friday-2026", name: "楽天ブラックフライデー", store: "楽天市場" },
  { id: "amazon-black-friday-2026", name: "Amazon ブラックフライデー", store: "Amazon" },
];

export type SalePhase = "unannounced" | "before" | "during" | "after";

export function salePhase(s: Sale, now: Date): SalePhase {
  if (!s.start || !s.end) return "unannounced";
  if (now < new Date(s.start)) return "before";
  if (now <= new Date(s.end)) return "during";
  return "after";
}

/** 予算の区切り（税込・円） */
export const BUDGETS = [
  { id: "under-2000", label: "2,000円まで", min: 0, max: 2000 },
  { id: "2000-5000", label: "2,000〜5,000円", min: 2000, max: 5000 },
  { id: "over-5000", label: "5,000円から", min: 5000, max: Number.POSITIVE_INFINITY },
] as const;

/** 予算の区切りに入るか（min 以上・max 未満） */
export const inBudget = (price: number, b: (typeof BUDGETS)[number]) => price >= b.min && price < b.max;
