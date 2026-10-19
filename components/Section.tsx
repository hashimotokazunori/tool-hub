import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { tone as tones, ui, type Tone } from "./styles";

/**
 * ページの中の1つのまとまり。上に小さな英字の見出し（eyebrow）、大きな見出し、説明、右に「すべて見る」。
 * band を付けると、色付きの帯の上に置いて前後のセクションと区切る。
 */
export function Section({
  id,
  eyebrow,
  title,
  lead,
  icon,
  tone,
  more,
  band,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  lead?: string;
  icon?: IconName;
  tone?: Tone;
  more?: { href: string; label: string };
  band?: boolean;
  children: ReactNode;
}) {
  const t = tone ? tones[tone] : null;
  const body = (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="flex flex-col gap-1.5">
          <span className={`${ui.eyebrow} flex w-fit items-center gap-1.5 rounded-full bg-panel/70 px-2.5 py-1 shadow-card ${t?.text ?? "text-accent"}`}>
            {icon && <Icon name={icon} size={14} />}
            {eyebrow}
          </span>
          <h2 id={id ? `${id}-title` : undefined} className={ui.h2}>
            {title}
          </h2>
          {lead && <p className={`${ui.lead} text-sm`}>{lead}</p>}
        </div>
        {more && (
          <Link href={more.href} className="group flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-ink no-underline transition hover:bg-panel hover:shadow-card">
            {more.label}
            <Icon name="arrow" size={16} className="transition group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
  if (!band) return body;
  return <div className={`-mx-4 rounded-[2rem] px-4 py-8 sm:mx-0 sm:px-8 sm:py-10 ${t?.soft ?? "bg-panel"}`}>{body}</div>;
}
