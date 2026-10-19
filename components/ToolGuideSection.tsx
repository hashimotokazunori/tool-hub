import type { ToolGuide } from "@/data/tool-guides/types";
import { ui } from "./styles";

/** ツールページの「使い方」と「よくある質問」。質問は開閉できる */
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
    </>
  );
}
