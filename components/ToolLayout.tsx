import Link from "next/link";
import type { ReactNode } from "react";
import { nextSteps } from "@/data/next-steps";
import { sponsoredFor } from "@/data/sponsored";
import type { ToolGuide } from "@/data/tool-guides/types";
import { getPublicTools } from "@/lib/content";
import type { Category, Tool } from "@/lib/types";
import { AdSlot } from "./AdSlot";
import { Breadcrumbs } from "./Breadcrumbs";
import { Icon, toolCategoryIcon } from "./icons";
import { SponsoredLinks } from "./SponsoredLinks";
import { FavoriteButton, RememberTool } from "./ToolMemory";
import { ToolGuideSection } from "./ToolGuideSection";
import { gradientFor, ui } from "./styles";

/** 個別ツールページの共通の枠。ツール本体を先に、解説と広告はその下に置く */
export function ToolLayout({ tool, category, children, related, guide }: { tool: Tool; category: Category; children: ReactNode; related?: ReactNode; guide?: ToolGuide }) {
  const sponsored = sponsoredFor(tool.slug);
  const published = new Map(getPublicTools().map((t) => [t.slug, t]));
  const next = (nextSteps[tool.slug] ?? []).flatMap((n) => {
    const t = published.get(n.slug);
    return t ? [{ tool: t, why: n.why }] : [];
  });
  return (
    <div className="flex flex-col gap-5">
      <Breadcrumbs items={[{ label: "無料Webツール", href: "/tools/" }, { label: category.name, href: `/tools/category/${category.slug}/` }, { label: tool.name }]} />
      <div className="flex items-start gap-4">
        <span className={`hidden h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lift sm:grid ${gradientFor(tool.categoryId)}`}>
          <Icon name={toolCategoryIcon[tool.categoryId] ?? "tool"} size={28} />
        </span>
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className={ui.h1}>{tool.name}</h1>
          <p className={`${ui.lead} max-w-3xl`}>{tool.summary}</p>
          <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-accent">{category.name}</span>
            <span className="rounded-full bg-field px-2.5 py-1 text-muted ring-1 ring-line">無料・登録不要</span>
            <span className="rounded-full bg-field px-2.5 py-1 text-muted ring-1 ring-line">端末の中で処理</span>
            <FavoriteButton slug={tool.slug} name={tool.name} />
            {/* 広告リンクがあるページは、最初に見える位置で知らせる（ステマ規制） */}
            {sponsored.length > 0 && <span className="rounded-full bg-field px-2.5 py-1 text-muted ring-1 ring-line">PR・このページには広告が含まれます</span>}
          </div>
        </div>
      </div>
      <section aria-label={`${tool.name}の操作`} className={`${ui.panel} p-4 sm:p-7`}>
        {children}
      </section>
      <RememberTool slug={tool.slug} />
      {next.length > 0 && (
        <section aria-label="次はこちら" className="flex flex-col gap-2">
          <h2 className={ui.h3}>次はこちら</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {next.map(({ tool: t, why }) => (
              <Link key={t.slug} href={`/tools/${t.slug}/`} className={ui.card}>
                <b className="text-[15px]">{t.name} →</b>
                <span className="text-xs text-muted">{why}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      {guide && <ToolGuideSection slug={tool.slug} name={tool.name} guide={guide} />}
      <section className="flex flex-col gap-2">
        <h2 className={ui.h2}>このツールについて</h2>
        <p className="max-w-3xl leading-relaxed">{tool.description}</p>
        <p className={ui.note}>最終更新：{tool.updatedAt.replaceAll("-", "/")}</p>
      </section>
      <SponsoredLinks items={sponsored} />
      <AdSlot id={`tool-${tool.slug}`} />
      {related}
    </div>
  );
}
