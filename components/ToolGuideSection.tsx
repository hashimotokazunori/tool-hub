import type { ReactNode } from "react";
import howtoShots from "@/data/howto-shots.json";
import type { ToolGuide } from "@/data/tool-guides/types";
import { ui } from "./styles";

/** 使い方の画像（例を入れた画面に手順の番号を付けたもの。scripts/tool-howto-shots.mjs で撮る）があるツール */
const HOWTO = new Set<string>(howtoShots);

/** ツールページの「使い方」「計算式」「使い方の例」「よくある質問」「根拠」。質問は開閉できる */
export function ToolGuideSection({ slug, name, guide, afterSteps }: { slug: string; name: string; guide: ToolGuide; afterSteps?: ReactNode }) {
  const howto = HOWTO.has(slug);
  return (
    <>
      {/* 使い方はカードで囲み、上のツールの操作パネルと分けて見せる */}
      <section className={`${ui.panel} flex flex-col gap-3 p-4 sm:p-6`}>
        <h2 className={ui.h2}>{name}の使い方</h2>
        <div className={howto ? "grid max-w-5xl items-start gap-5 md:grid-cols-[1fr_400px]" : ""}>
          <ol className="flex max-w-3xl flex-col gap-2">
            {guide.steps.map((s, i) => (
              <li key={i} className="flex gap-3 leading-relaxed">
                {/* 番号は使い方の画像の番号と同じ色にする */}
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#9b2c3a] font-mono text-xs font-bold text-white" aria-hidden="true">
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          {howto && (
            <figure className="mx-auto flex w-full max-w-[400px] flex-col gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- 静的書き出しなので next/image の最適化は使えない */}
              <img src={`/howto/${slug}.webp`} alt={`${name}の使い方の例。画面の番号は上の手順の番号です`} width={640} height={1000} loading="lazy" decoding="async" className="h-auto w-full rounded-2xl border border-ink/15 shadow-lift" />
              <figcaption className="text-center text-xs text-muted">例を入れた画面。番号は手順の番号です</figcaption>
            </figure>
          )}
        </div>
      </section>
      {/* 使い方のすぐ後に「次はこちら」（ツール → 使い方 → 次はこちら の順） */}
      {afterSteps}
      {guide.formula && (
        <section className="flex flex-col gap-2">
          <h2 className={ui.h2}>{guide.formula.title}</h2>
          <ul className="flex max-w-3xl flex-col gap-1.5 rounded-2xl border border-line bg-panel px-4 py-3 shadow-card">
            {guide.formula.lines.map((l, i) => (
              <li key={i} className="leading-relaxed">
                {l}
              </li>
            ))}
          </ul>
        </section>
      )}
      {guide.examples && guide.examples.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className={ui.h2}>使い方の例</h2>
          <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
            {guide.examples.map((e, i) => (
              <div key={i} className="flex flex-col gap-1 rounded-2xl border border-line bg-panel px-4 py-3 shadow-card">
                <h3 className={ui.h3}>{e.title}</h3>
                <p className="leading-relaxed text-ink/90">{e.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="flex flex-col gap-2">
        <h2 className={ui.h2}>よくある質問</h2>
        <div className="flex max-w-3xl flex-col divide-y divide-line rounded-2xl border border-line bg-panel shadow-card">
          {guide.faq.map((f, i) => (
            <details key={i} className="group px-4 py-3" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">
                <span>Q. {f.q}</span>
                <span className="text-muted transition group-open:rotate-45" aria-hidden="true">
                  ＋
                </span>
              </summary>
              <p className="mt-2 leading-relaxed text-ink/90">A. {f.a}</p>
            </details>
          ))}
        </div>
      </section>
      {guide.sources && guide.sources.length > 0 && (
        <section className="flex flex-col gap-1 text-xs text-muted">
          <p>根拠にした公式の情報：</p>
          <ul className="list-disc pl-5">
            {guide.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} rel="noopener noreferrer" target="_blank" className="underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
