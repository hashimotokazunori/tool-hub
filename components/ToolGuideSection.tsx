import type { ToolGuide } from "@/data/tool-guides/types";
import { ui } from "./styles";

/** ツールページの「使い方」「計算式」「使い方の例」「よくある質問」「根拠」。質問は開閉できる */
export function ToolGuideSection({ name, guide }: { name: string; guide: ToolGuide }) {
  return (
    <>
      <section className="flex flex-col gap-2">
        <h2 className={ui.h2}>{name}の使い方</h2>
        <ol className="flex max-w-3xl flex-col gap-2">
          {guide.steps.map((s, i) => (
            <li key={i} className="flex gap-3 leading-relaxed">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-xs font-semibold text-accent" aria-hidden="true">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </section>
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
