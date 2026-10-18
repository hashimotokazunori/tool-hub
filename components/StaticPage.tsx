import type { ReactNode } from "react";
import { Breadcrumbs } from "./Breadcrumbs";
import { PageHeading } from "./PageHeading";

/** 運営者情報・広告表記などの固定ページ */
export function StaticPage({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: title }]} />
      <PageHeading title={title} lead={lead} />
      <div className="article-body">{children}</div>
    </div>
  );
}

/** 公開前に記入が必要な項目の目印 */
export function Todo({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-warn px-1 text-white">【要記入】{children}</mark>;
}
