import Link from "next/link";
import { site } from "@/data/site";

const LINKS = [
  { href: "/about/", label: "運営者情報" },
  { href: "/disclosure/", label: "広告・PR表記" },
  { href: "/privacy/", label: "プライバシーポリシー" },
];

export function Footer() {
  return (
    <footer className="mt-6 flex flex-col gap-3 border-t border-line pt-5 text-xs text-muted">
      <nav aria-label="サイトについて" className="flex flex-wrap gap-x-4 gap-y-2">
        {[...LINKS, ...(site.operator.contact ? [{ href: "/contact/", label: "お問い合わせ" }] : [])].map((l) => (
          <Link key={l.href} href={l.href} className="text-muted underline-offset-2 hover:underline">
            {l.label}
          </Link>
        ))}
      </nav>
      <p className="max-w-3xl">
        ツールは登録不要で使えます。入力した文字やファイルはサーバーに送らず、端末の中だけで処理します。計算結果は目安です。お金や契約に関わる判断は、公式の情報もあわせて確認してください。
      </p>
      <p>© {site.name}</p>
    </footer>
  );
}
