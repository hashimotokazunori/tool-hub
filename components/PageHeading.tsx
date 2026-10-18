import type { ReactNode } from "react";
import { ui } from "./styles";

export function PageHeading({ title, lead, children }: { title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className={ui.h1}>{title}</h1>
      {lead && <p className={`${ui.lead} max-w-3xl`}>{lead}</p>}
      {children}
    </div>
  );
}

/** データがまだ無いときの案内 */
export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line bg-panel px-4 py-6 text-sm text-muted">{children}</p>;
}
