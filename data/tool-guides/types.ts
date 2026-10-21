/** ツールページの「使い方」と「よくある質問」 */
export type ToolGuide = {
  /** ページの題名（検索で使われる言葉を入れる）。なければ「ツール名（無料・登録不要）」 */
  title?: string;
  /** 使い方の手順（2〜4個。1文ずつ、画面のボタン名どおりに） */
  steps: string[];
  /** 計算式・数え方（見出しと、1行ずつの式） */
  formula?: { title: string; lines: string[] };
  /** 使い方の例（入れた値と、出てくる結果） */
  examples?: { title: string; body: string }[];
  /** よくある質問（2〜3個） */
  faq: { q: string; a: string }[];
  /** 根拠にした公式の情報 */
  sources?: { title: string; url: string }[];
};
