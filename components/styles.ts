/** 共通の見た目（Tailwindのクラス）。サーバー・クライアントの両方から使う */
export const ui = {
  panel: "rounded-xl border border-line bg-panel",
  card: "flex min-w-0 flex-col gap-0.5 rounded-xl border border-line bg-panel px-4 py-3 text-ink no-underline transition hover:border-accent",
  input: "w-full rounded-lg border border-line bg-field px-3 py-2.5 text-base text-ink focus:border-transparent focus:outline-2 focus:outline-accent",
  label: "flex flex-col gap-1 text-[13px] text-muted",
  button: "inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition hover:border-accent",
  buttonPrimary: "inline-flex items-center justify-center gap-1.5 rounded-lg border border-accent bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition hover:opacity-90",
  chip: "inline-flex items-center gap-1 rounded-full border border-line bg-panel px-3 py-1 text-[13px] text-ink no-underline hover:border-accent",
  h1: "font-display text-[clamp(1.5rem,4vw,2rem)] font-normal leading-snug",
  h2: "text-lg font-bold",
  lead: "text-muted",
  note: "text-xs text-muted",
};
