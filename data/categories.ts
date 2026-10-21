import type { Category } from "@/lib/types";

const tool = (order: number, id: string, slug: string, name: string, description: string): Category => ({ id, slug, kind: "tool", name, description, order });
const goods = (order: number, id: string, slug: string, name: string, description: string): Category => ({ id, slug, kind: "goods", name, description, order });

export const toolCategories: Category[] = [
  tool(1, "text", "text", "文章・日本語", "文字数のカウント、ひらがな・カタカナや全角・半角の変換、置換、比較など"),
  tool(2, "calc", "calculator", "計算・単位変換", "消費税・割引・割合・ローンの計算と、長さや面積などの単位変換"),
  tool(3, "image", "image", "画像", "画像の変換・圧縮・リサイズ・切り抜き・文字入れ"),
  tool(4, "pdf", "pdf", "PDF・ファイル", "PDFの結合・分割・編集・圧縮と、ファイルの変換"),
  tool(5, "gen", "generator", "生成・作成", "QRコード・パスワード・乱数・メール文面などの作成"),
  tool(6, "web", "developer", "Web・開発者", "JSON整形・エンコード・正規表現・ハッシュなど開発者向けの道具"),
  tool(7, "life", "life", "日常生活・お金", "割り勘・時給・残業代・電気代など暮らしのお金の計算"),
  tool(8, "date", "date", "日付・時間", "日数・営業日・年齢・時差・タイムスタンプの計算"),
  tool(9, "biz", "business", "学習・ビジネス", "プレゼン時間・進捗率・議事録など仕事と勉強の道具"),
  tool(10, "design", "design", "色・デザイン", "配色・グラデーション・コントラスト比・CSSの作成"),
  tool(11, "data", "data", "データ・変換", "CSV・Excel・JSONの変換と、文字コードの変換"),
];

export const goodsCategories: Category[] = [
  goods(1, "desk", "desk", "デスク・仕事の便利グッズ", "PCスタンド、ケーブル整理、デスク収納、モニター台"),
  goods(2, "gadgets", "gadgets", "スマホ・PC周辺機器", "充電器、モバイルバッテリー、USBハブ、スマホスタンド"),
  goods(3, "home", "home", "家事・収納の便利グッズ", "収納用品、掃除グッズ、キッチン小物、省スペース用品"),
  goods(4, "travel", "travel", "旅行・外出グッズ", "圧縮袋、旅行用ポーチ、変換プラグ、携帯用品"),
  goods(5, "stationery", "stationery", "文房具・アイデア雑貨", "ラベル、書類整理、手帳、時短文具"),
  goods(6, "apps", "apps", "AI・仕事効率化アプリ", "AIアシスタント、コードを書くAI、画像づくり"),
];

export const allCategories = [...toolCategories, ...goodsCategories];
