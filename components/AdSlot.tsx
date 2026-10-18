import { site } from "@/data/site";

/**
 * 広告枠。data/site.ts の ads.enabled が true のときだけ表示する。
 * ツールの操作を邪魔しないよう、結果や解説の下にだけ置く。
 * 広告サービスのタグは、審査・規約・プライバシーポリシーの整備が済んでからここに入れる。
 */
export function AdSlot({ id }: { id: string }) {
  if (!site.ads.enabled) return null;
  return (
    <aside aria-label="広告" data-ad-slot={id} className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-line text-xs text-muted">
      広告
    </aside>
  );
}
