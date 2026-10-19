import type { ReactNode } from "react";
import type { ToolGuide } from "@/data/tool-guides/types";
import type { Category, Tool } from "@/lib/types";
import { AdSlot } from "./AdSlot";
import { Breadcrumbs } from "./Breadcrumbs";
import { PageHeading } from "./PageHeading";
import { ToolGuideSection } from "./ToolGuideSection";
import { ui } from "./styles";

/** 個別ツールページの共通の枠。ツール本体を先に、解説と広告はその下に置く */
export function ToolLayout({ tool, category, children, related, guide }: { tool: Tool; category: Category; children: ReactNode; related?: ReactNode; guide?: ToolGuide }) {
  return (
    <div className="flex flex-col gap-5">
      <Breadcrumbs items={[{ label: "無料Webツール", href: "/tools/" }, { label: category.name, href: `/tools/category/${category.slug}/` }, { label: tool.name }]} />
      <PageHeading title={tool.name} lead={tool.summary} />
      <section aria-label={`${tool.name}の操作`} className={`${ui.panel} p-4 sm:p-6`}>
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
