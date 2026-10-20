import Link from "next/link";
import { GlobalSearch } from "./GlobalSearch";
import { Icon, type IconName } from "./icons";

const POINTS: { icon: IconName; label: string }[] = [
  { icon: "check", label: "登録不要・無料" },
  { icon: "shield", label: "入力内容は送信しない" },
  { icon: "bolt", label: "スマホでもすぐ使える" },
];

/** 広い画面だけに出す飾り：ツールの結果カードが浮かんでいるイメージ（読み上げない） */
function HeroVisual() {
  const cards = [
    { cls: "top-0 right-6 rotate-3", from: "from-emerald-500 to-teal-600", icon: "calc" as IconName, label: "消費税計算", value: "2,178 円", sub: "税込（10%）" },
    { cls: "top-32 right-32 -rotate-2", from: "from-sky-500 to-indigo-500", icon: "text" as IconName, label: "文字数カウンター", value: "1,234 字", sub: "400字詰め 4枚" },
    { cls: "top-64 right-10 rotate-1", from: "from-amber-400 to-orange-500", icon: "life" as IconName, label: "割り勘計算", value: "4,000 円", sub: "1人あたり・6人" },
  ];
  return (
    <div className="pointer-events-none absolute top-14 right-10 hidden h-96 w-[25rem] xl:block" aria-hidden="true">
      {cards.map((c) => (
        <div key={c.label} className={`absolute w-60 rounded-2xl border border-line bg-panel/90 p-4 shadow-lift backdrop-blur ${c.cls}`}>
          <div className="flex items-center gap-2.5">
            <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white ${c.from}`}>
              <Icon name={c.icon} size={18} />
            </span>
            <span className="text-[13px] font-bold">{c.label}</span>
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight tabular-nums">{c.value}</div>
          <div className="text-xs text-muted">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

/** トップの検索エリア。検索を主役にし、よく使う操作をすぐ下に置く */
export function Hero({ quick, toolCount }: { quick: { href: string; label: string }[]; toolCount: number }) {
  return (
    <section aria-labelledby="hero-title" className="hero-mesh relative isolate overflow-hidden rounded-[2rem] border border-line px-5 pt-10 pb-8 shadow-card sm:px-12 sm:pt-16 sm:pb-12">
      <div className="hero-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <HeroVisual />
      <Link href="/tools/" className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/80 py-1 pr-3 pl-1 text-[11px] font-semibold whitespace-nowrap sm:text-xs text-ink no-underline shadow-card backdrop-blur transition hover:border-accent/50">
        <span className="rounded-full bg-gradient-to-r from-accent to-accent-2 px-2 py-0.5 text-[11px] text-white">NEW</span>
        無料ツールが {toolCount} 種類に
        <Icon name="arrow" size={14} />
      </Link>
      <h1 id="hero-title" className="mt-5 text-[clamp(1.9rem,6.5vw,3.9rem)] leading-[1.12] font-extrabold tracking-tight [word-break:auto-phrase]">
        面倒なことは、
        <br />
        <span className="text-gradient">ここで片づける。</span>
      </h1>
      <p className="mt-4 max-w-xl text-[15px] xl:max-w-lg leading-relaxed text-muted sm:text-base">
        計算・文章・画像・PDFの無料ツールと、便利グッズの選び方、悩み別の解決策をひとつの場所に。入力した内容はブラウザの中だけで処理します。
      </p>
      <div className="mt-7 max-w-2xl xl:max-w-xl">
        <GlobalSearch variant="hero" />
      </div>
      <nav aria-label="よく使う操作" className="mt-4 flex flex-wrap gap-2">
        {quick.map((q) => (
          <Link key={q.href} href={q.href} className="rounded-full border border-line bg-panel/80 px-3.5 py-1.5 text-[13px] font-semibold text-ink no-underline shadow-card backdrop-blur transition hover:-translate-y-px hover:border-accent/50 hover:text-accent">
            {q.label}
          </Link>
        ))}
      </nav>
      <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted">
        {POINTS.map((p) => (
          <li key={p.label} className="flex items-center gap-1.5">
            <Icon name={p.icon} size={16} className="text-accent" />
            {p.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
