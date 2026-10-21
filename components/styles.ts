/** 共通の見た目（Tailwindのクラス）。サーバー・クライアントの両方から使う */
export const ui = {
  panel: "rounded-3xl border border-line bg-panel shadow-card",
  card: "flex min-w-0 flex-col gap-0.5 rounded-2xl border border-line bg-panel px-4 py-3 text-ink no-underline shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift",
  input:
    "w-full rounded-xl border border-line bg-field px-3.5 py-2.5 text-base text-ink transition placeholder:text-muted/70 hover:border-muted/40 focus:border-transparent focus:bg-panel focus:outline-2 focus:outline-accent",
  label: "flex flex-col gap-1.5 text-[13px] font-medium text-muted",
  button:
    "inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink/20 bg-panel px-4 py-2 text-sm font-semibold text-ink shadow-card transition hover:-translate-y-px hover:border-accent/40 hover:shadow-lift disabled:pointer-events-none disabled:opacity-55",
  buttonPrimary:
    "inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-accent to-accent-2 px-4 py-2 text-sm font-semibold text-accent-ink shadow-card transition hover:-translate-y-px hover:shadow-lift hover:brightness-110 disabled:pointer-events-none disabled:opacity-55",
  chip: "inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 text-[13px] font-medium text-ink no-underline shadow-card transition hover:border-accent/50 hover:text-accent",
  // 文字の大きさの段階：ページ見出し > セクション見出し > カード見出し > 本文 > 補足
  h1: "text-[clamp(1.75rem,4.5vw,2.6rem)] font-extrabold leading-tight tracking-tight",
  h2: "text-xl font-bold leading-snug tracking-tight sm:text-2xl",
  h3: "text-base font-bold leading-snug",
  eyebrow: "font-mono text-[11px] font-semibold tracking-[0.18em] uppercase",
  lead: "text-muted leading-relaxed",
  note: "text-xs leading-relaxed text-muted",
};

/** コンテンツの種類ごとの色。カードやセクションの見出しに使う */
export const tone = {
  tool: { text: "text-tool", soft: "bg-tool-soft", border: "hover:border-tool/50" },
  goods: { text: "text-goods", soft: "bg-goods-soft", border: "hover:border-goods/50" },
  solution: { text: "text-solution", soft: "bg-solution-soft", border: "hover:border-solution/50" },
  guide: { text: "text-guide", soft: "bg-guide-soft", border: "hover:border-guide/50" },
} as const;

export type Tone = keyof typeof tone;

/** ツールのカテゴリごとのアイコンの色（グラデーション） */
export const categoryGradient: Record<string, string> = {
  text: "from-sky-500 to-indigo-500",
  calc: "from-emerald-500 to-teal-600",
  image: "from-pink-500 to-rose-500",
  pdf: "from-red-500 to-orange-500",
  gen: "from-violet-500 to-fuchsia-500",
  web: "from-slate-600 to-slate-900",
  life: "from-amber-400 to-orange-500",
  date: "from-cyan-500 to-blue-600",
  biz: "from-indigo-500 to-violet-600",
  design: "from-fuchsia-500 to-pink-500",
  data: "from-lime-500 to-emerald-600",
};
export const gradientFor = (categoryId: string) => categoryGradient[categoryId] ?? "from-indigo-500 to-violet-500";
