import type { ReactNode } from "react";
import type { ToolGuide } from "@/data/tool-guides/types";
import type { Category, Tool } from "@/lib/types";
import { AdSlot } from "./AdSlot";
import { Breadcrumbs } from "./Breadcrumbs";
import { Icon, toolCategoryIcon } from "./icons";
import { ToolGuideSection } from "./ToolGuideSection";
import { gradientFor, ui } from "./styles";

/** 個別ツールページの共通の枠。ツール本体を先に、解説と広告はその下に置く */
export function ToolLayout({ tool, category, children, related, guide }: { tool: Tool; category: Category; children: ReactNode; related?: ReactNode; guide?: ToolGuide }) {
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
          </div>
        </div>
      </div>
      <section aria-label={`${tool.name}の操作`} className={`${ui.panel} p-4 sm:p-7`}>
        {children}
      </section>
      {guide && <ToolGuideSection name={tool.name} guide={guide} />}
      <section className="flex flex-col gap-2">
        <h2 className={ui.h2}>このツールについて</h2>
        <p className="max-w-3xl leading-relaxed">{tool.description}</p>
        <p className={ui.note}>最終更新：{tool.updatedAt.replaceAll("-", "/")}</p>
      </section>
      <AdSlot id={`tool-${tool.slug}`} />
      {related}
    </div>
  );
}
