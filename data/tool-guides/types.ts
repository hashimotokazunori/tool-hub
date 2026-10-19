/** ツールページの「使い方」と「よくある質問」 */
export type ToolGuide = {
  /** 使い方の手順（2〜4個。1文ずつ、画面のボタン名どおりに） */
  steps: string[];
  /** よくある質問（2〜3個） */
  faq: { q: string; a: string }[];
};
