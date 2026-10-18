import type { Article } from "@/lib/types";

/**
 * 比較ガイド・悩み別ガイドの登録データ。本文は content/ 以下のMarkdown。
 * 試作版から移した文章はAIの下書きなので、すべて reviewStatus: "pending" / status: "draft"。
 * 人が事実・リンク・表記を確認したら reviewedAt を入れ、verified / published にする。
 */
const AUTHOR = "ツールひろば編集部";

const draft = (a: Omit<Article, "author" | "reviewStatus" | "status" | "productIds" | "sources"> & Partial<Pick<Article, "sources">>): Article => ({
  author: AUTHOR,
  reviewStatus: "pending",
  status: "draft",
  productIds: [],
  sources: [],
  ...a,
});

export const articles: Article[] = [
  // 比較ガイド・使い方ガイド
  draft({ id: "heic-to-jpg", slug: "heic-to-jpg", type: "guide", title: "iPhoneの写真（HEIC）をJPGに変換する方法", description: "WindowsやWebのフォームで開けないHEIC写真を、JPGに変換する方法と、これから撮る写真をJPGにする設定。", bodyFile: "guides/heic-to-jpg.md", toolSlugs: ["image-convert", "image-resize"], goodsCategoryIds: [] }),
  draft({ id: "compress-pdf-for-email", slug: "compress-pdf-for-email", type: "guide", title: "メールで送れないPDFを軽くする方法", description: "容量オーバーのPDFを、圧縮・分割・画像の縮小で小さくする3つの方法。", bodyFile: "guides/compress-pdf-for-email.md", toolSlugs: ["pdf-compress", "pdf-split", "image-compress", "image-to-pdf"], goodsCategoryIds: [] }),
  draft({ id: "warikan-tips", slug: "warikan-tips", type: "guide", title: "幹事が楽になる割り勘・精算のコツ", description: "集める単位、多めに払う人がいる場合、立て替えが複数人いる旅行の精算まで。", bodyFile: "guides/warikan-tips.md", toolSlugs: ["warikan", "travel-expense-split", "tip", "bingo", "lottery"], goodsCategoryIds: ["travel"] }),
  draft({ id: "choose-charger-mobile-battery", slug: "choose-charger-mobile-battery", type: "guide", title: "充電器・モバイルバッテリーの選び方", description: "W数・USB PD・PSEマーク・飛行機に持ち込めるWhの目安まで、数字の読み方を解説。", bodyFile: "guides/choose-charger-mobile-battery.md", toolSlugs: ["electricity-cost", "data-size"], goodsCategoryIds: ["gadgets"],
    sources: [{ title: "経済産業省「モバイルバッテリーの電気用品安全法上の取扱いについて」", url: "https://www.meti.go.jp/policy/consumer/seian/denan/" }] }),
  draft({ id: "csv-mojibake", slug: "csv-mojibake", type: "guide", title: "CSVが文字化けする理由と直し方", description: "Shift_JISとUTF-8の違い、Excelで開くときのBOM、古いシステムに渡すときの注意点。", bodyFile: "guides/csv-mojibake.md", toolSlugs: ["csv-encoding", "excel-csv-converter", "csv-delimiter"], goodsCategoryIds: [] }),
  draft({ id: "desk-organizing-steps", slug: "desk-organizing-steps", type: "guide", title: "デスクを片付ける3ステップ", description: "使う頻度で分ける、置き場所を決める、配線をまとめる。収納用品を買う前の予算の決め方も。", bodyFile: "guides/desk-organizing-steps.md", toolSlugs: ["task-priority", "budget", "unit-price"], goodsCategoryIds: ["desk"] }),
  // 悩み別
  draft({ id: "desk-cable-clutter", slug: "desk-cable-clutter", type: "solution", title: "デスクを片付けたい", description: "物や配線が散らかって作業に集中できないときの解決のヒントと、使えるツール・便利グッズ。", bodyFile: "solutions/desk-cable-clutter.md", toolSlugs: ["task-priority", "budget", "unit-price"], goodsCategoryIds: ["desk"] }),
  draft({ id: "easier-charging", slug: "easier-charging", type: "solution", title: "充電を楽にしたい", description: "充電器やケーブルが多くて面倒なときに、まとめ方と選び方のヒント。", bodyFile: "solutions/easier-charging.md", toolSlugs: ["electricity-cost"], goodsCategoryIds: ["gadgets"] }),
  draft({ id: "photos-too-large", slug: "photos-too-large", type: "solution", title: "写真が重くて送れない・開けない", description: "メールやフォームで容量オーバーになる写真や、開けないHEICの対処法。", bodyFile: "solutions/photos-too-large.md", toolSlugs: ["image-convert", "image-resize", "image-to-pdf", "pdf-compress"], goodsCategoryIds: [] }),
  draft({ id: "reduce-paper", slug: "reduce-paper", type: "solution", title: "紙の書類を減らしたい", description: "書類をスマホで撮ってPDFにまとめ、探しやすく保存する方法。", bodyFile: "solutions/reduce-paper.md", toolSlugs: ["image-to-pdf", "pdf-merge", "bulk-rename", "pdf-editor"], goodsCategoryIds: ["stationery"] }),
  draft({ id: "split-costs", slug: "split-costs", type: "solution", title: "飲み会・旅行の精算が面倒", description: "割り勘や立て替えの計算を楽にする方法。", bodyFile: "solutions/split-costs.md", toolSlugs: ["warikan", "travel-expense-split", "tip", "lottery", "bingo"], goodsCategoryIds: ["travel"] }),
  draft({ id: "mojibake-files", slug: "mojibake-files", type: "solution", title: "CSVやファイルが文字化けする", description: "Excelで開くと文字化けする、システムに取り込めないときの確認ポイント。", bodyFile: "solutions/mojibake-files.md", toolSlugs: ["csv-encoding", "excel-csv-converter", "csv-delimiter", "csv-dedupe"], goodsCategoryIds: [] }),
  draft({ id: "manage-deadlines", slug: "manage-deadlines", type: "solution", title: "締め切りや予定を管理したい", description: "納期の計算や、やることの整理を楽にする方法。", bodyFile: "solutions/manage-deadlines.md", toolSlugs: ["business-days", "countdown", "task-priority", "progress-rate", "days-between"], goodsCategoryIds: ["stationery"] }),
  draft({ id: "review-monthly-spending", slug: "review-monthly-spending", type: "solution", title: "毎月のお金を見直したい", description: "家計の配分、電気代、日用品の単価を見直すヒント。", bodyFile: "solutions/review-monthly-spending.md", toolSlugs: ["budget", "savings-goal", "electricity-cost", "unit-price", "loan-simulator", "compound-interest"], goodsCategoryIds: ["home"] }),
  draft({ id: "pack-light", slug: "pack-light", type: "solution", title: "旅行の荷物を減らしたい", description: "衣類・充電器・変換プラグをまとめて、スーツケースを軽くするヒント。", bodyFile: "solutions/pack-light.md", toolSlugs: ["timezone", "tip", "travel-expense-split"], goodsCategoryIds: ["travel", "gadgets"] }),
];
