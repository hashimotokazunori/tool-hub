/**
 * ふるさと納税の利用者の割合（総務省の公表値から計算）。
 * 分子と分母は同じ「令和7年度課税」にそろえる（令和8年度の納税義務者数はまだ公表されていない）。
 */
export const furusatoStats = {
  /** 令和7年度課税で、ふるさと納税による住民税の控除を受けた人（市町村民税の計数） */
  deductedPeople: 10_814_000,
  deductedPeopleLabel: "約1,081万人",
  /** 令和7年度の個人の市町村民税で、所得割を納める人（全国合計） */
  incomeLevyTaxpayers: 62_206_393,
  incomeLevyTaxpayersLabel: "約6,221万人",
  year: "令和7年度課税（令和6年中の寄附）",
  /** 最新（令和8年度課税・令和7年中の寄附）の控除適用者数 */
  latest: { year: "令和8年度課税（令和7年中の寄附）", deductedPeopleLabel: "約1,151万人", oneStopLabel: "約614万人" },
  sources: [
    { title: "総務省「ふるさと納税に関する現況調査結果（令和8年度実施）」", url: "https://www.soumu.go.jp/main_content/001084951.pdf" },
    { title: "総務省「令和7年度 市町村税課税状況等の調」第2表（個人の市町村民税の納税義務者等）", url: "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/ichiran09_25.html" },
  ],
  checkedAt: "2026-10-20",
} as const;

/** 利用者の割合（%・小数1桁） */
export function furusatoShare(): number {
  return Math.round((furusatoStats.deductedPeople / furusatoStats.incomeLevyTaxpayers) * 1000) / 10;
}
