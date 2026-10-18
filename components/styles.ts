/** 共通の見た目（Tailwindのクラス）。サーバー・クライアントの両方から使う */
export const ui = {
  panel: "rounded-2xl border border-line bg-panel",
  card: "flex min-w-0 flex-col gap-0.5 rounded-xl border border-line bg-panel px-4 py-3 text-ink no-underline transition hover:border-accent",
  input: "w-full rounded-lg border border-line bg-field px-3 py-2.5 text-base text-ink focus:border-transparent focus:outline-2 focus:outline-accent",
  label: "flex flex-col gap-1 text-[13px] text-muted",
  button: "inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition hover:border-accent",
  buttonPrimary: "inline-flex items-center justify-center gap-1.5 rounded-lg border border-accent bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition hover:opacity-90",
  chip: "inline-flex items-center gap-1 rounded-full border border-line bg-panel px-3 py-1 text-[13px] text-ink no-underline hover:border-accent",
  // 文字の大きさの段階：ページ見出し > セクション見出し > カード見出し > 本文 > 補足
  h1: "text-[clamp(1.6rem,4.5vw,2.25rem)] font-bold leading-tight tracking-tight",
  h2: "text-xl font-bold leading-snug sm:text-2xl",
  h3: "text-base font-bold leading-snug",
  eyebrow: "font-mono text-[11px] font-semibold tracking-[0.18em] uppercase",
  lead: "text-muted leading-relaxed",
  note: "text-xs text-muted",
};

/** コンテンツの種類ごとの色。カードやセクションの見出しに使う */
export const tone = {
  tool: { text: "text-tool", soft: "bg-tool-soft", border: "hover:border-tool" },
  goods: { text: "text-goods", soft: "bg-goods-soft", border: "hover:border-goods" },
  solution: { text: "text-solution", soft: "bg-solution-soft", border: "hover:border-solution" },
  guide: { text: "text-guide", soft: "bg-guide-soft", border: "hover:border-guide" },
} as const;

export type Tone = keyof typeof tone;
