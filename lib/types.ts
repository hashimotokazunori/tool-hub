/** 公開状態。published 以外は一覧・検索・サイトマップに出さない */
export type PublishStatus = "draft" | "published" | "retired";

/** 内容確認の状態。下書きは pending から始め、事実確認が済んだら verified にする */
export type ReviewStatus = "pending" | "verified" | "needs_update";

export type Priority = "P0" | "P1" | "P2";

export type Category = {
  id: string;
  slug: string;
  kind: "tool" | "goods";
  name: string;
  description: string;
  order: number;
};

export type Tool = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  /** 一覧用の短い説明 */
  summary: string;
  /** ページの説明（meta description にも使う） */
  description: string;
  /** サイト内検索用の関連語 */
  keywords: string[];
  /** features/tools/registry.ts のキー。未実装なら null */
  componentKey: string | null;
  status: PublishStatus;
  priority: Priority;
  /** YYYY-MM-DD */
  updatedAt: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand?: string;
  categoryId: string;
  summary: string;
  features: string[];
  pros: string[];
  cons: string[];
  /** 寸法・重量・対応規格など */
  specifications: Record<string, string>;
  /** 税込価格（円） */
  price?: number;
  currency: "JPY";
  /** 価格を確認した日時（ISO 8601）。price があるときは必須 */
  priceCheckedAt?: string;
  merchantName?: string;
  /** 実際に提携登録した販売先のURLだけを入れる */
  affiliateUrl?: string;
  officialUrl?: string;
  /** 使用条件を確認した画像だけを入れる */
  imageUrl?: string;
  /** 画像の出典・使用条件のメモ */
  imageLicenseNote?: string;
  /**
   * 楽天から価格を取ってくるときの検索語と、同じ商品だと見なす条件。
   * match はどれか1組の語がすべて商品名に含まれていれば同じ商品とする（型番など）。exclude を含む商品は除く。
   */
  market?: { keyword: string; match: string[][]; exclude?: string[]; /** これより安い出品は取らない（消耗品・ケースが上位を埋める商品向け） */ minPrice?: number };
  /** 仕様を確認した情報源 */
  sourceUrls: string[];
  /** 仕様を確認した日（YYYY-MM-DD）と、確認した人・方法 */
  reviewedAt?: string;
  reviewedBy?: string;
  reviewStatus: ReviewStatus;
  status: PublishStatus;
  updatedAt: string;
};

export type ArticleType = "guide" | "solution";

export type Article = {
  id: string;
  slug: string;
  type: ArticleType;
  title: string;
  /** 検索結果向けの説明 */
  description: string;
  /** content/ 以下の本文ファイル（Markdown） */
  bodyFile: string;
  productIds: string[];
  toolSlugs: string[];
  goodsCategoryIds: string[];
  sources: { title: string; url: string }[];
  /** 検索結果に出す題名（なければ「題名＋ときの解決策」） */
  seoTitle?: string;
  author: string;
  /** 内容を確認した日（YYYY-MM-DD） */
  reviewedAt?: string;
  /** 内容を確認した人・方法（記録用。読者には出さない。AIの確認は誤りがありうるため） */
  reviewedBy?: string;
  publishedAt?: string;
  reviewStatus: ReviewStatus;
  status: PublishStatus;
};

/** 便利グッズの「品目」ごとの選び方（商品データとは別。特定の商品を指さない） */
export type BuyingGuide = {
  id: string;
  categoryId: string;
  name: string;
  summary: string;
  points: string[];
  specsToCompare: string[];
  toolSlugs: string[];
  reviewStatus: ReviewStatus;
  status: PublishStatus;
};
