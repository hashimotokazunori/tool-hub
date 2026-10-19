import Link from "next/link";
import { toolCategories } from "@/data/categories";
import { site } from "@/data/site";
import { getToolsByCategory, sortCategories } from "@/lib/content";
import { Icon } from "./icons";

const LINKS = [
  { href: "/about/", label: "運営者情報" },
  { href: "/disclosure/", label: "広告・PR表記" },
  { href: "/privacy/", label: "プライバシーポリシー" },
];
const SECTIONS = [
  { href: "/tools/", label: "無料Webツール" },
  { href: "/goods/", label: "便利グッズ" },
  { href: "/solutions/", label: "悩みから探す" },
  { href: "/guides/", label: "比較・活用ガイド" },
];

export function Footer() {
  const cats = sortCategories(toolCategories).filter((c) => getToolsByCategory(c.id).length > 0);
  return (
    <footer className="mt-10 border-t border-line bg-panel/60 pb-24 md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-8 py-10 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] text-sm md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex w-fit items-center gap-2 text-ink no-underline">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white">
              <Icon name="bolt" size={16} />
            </span>
            <b className="text-base tracking-tight">{site.name}</b>
          </Link>
          <p className="max-w-sm text-xs leading-relaxed text-muted">
            ツールは登録不要で使えます。入力した文字やファイルはサーバーに送らず、端末の中だけで処理します。計算結果は目安です。お金や契約に関わる判断は、公式の情報もあわせて確認してください。
          </p>
        </div>
        <nav aria-label="ツールのカテゴリ" className="flex flex-col gap-2">
          <b className="text-xs font-semibold tracking-wide text-muted">ツールのカテゴリ</b>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {cats.map((c) => (
              <li key={c.id}>
                <Link href={`/tools/category/${c.slug}/`} className="text-ink/80 no-underline hover:text-accent">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="サイトについて" className="flex flex-col gap-2">
          <b className="text-xs font-semibold tracking-wide text-muted">サイト</b>
          <ul className="flex flex-col gap-1.5">
            {[...SECTIONS, ...LINKS, ...(site.operator.contact ? [{ href: "/contact/", label: "お問い合わせ" }] : [])].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-ink/80 no-underline hover:text-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="mx-auto max-w-6xl border-t border-line py-4 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] text-xs text-muted">© {site.name}</p>
    </footer>
  );
}
