import Link from "next/link";
import type { SponsoredLink } from "@/data/sponsored";
import { ui } from "./styles";

/** A8.net の文字リンク。リンクと計測用の画像は A8 が作ったものをそのまま出す */
export function SponsoredLinks({ items }: { items: SponsoredLink[] }) {
  if (items.length === 0) return null;
  return (
    <aside aria-label="広告" className={`${ui.panel} flex flex-col gap-3 p-4 sm:p-5`}>
      <div className="flex items-center gap-2">
        <span className="rounded border border-muted px-1.5 text-xs font-bold text-muted">PR</span>
        <h2 className="text-sm font-bold">あわせて使えるサービス（広告）</h2>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((s) => (
          <li key={s.id} className="flex flex-col gap-0.5">
            <p className="font-semibold">
              {s.before}
              <a href={s.href} target="_blank" rel="nofollow sponsored noopener" className="text-accent underline underline-offset-2">
                {s.text}
              </a>
              {/* eslint-disable-next-line @next/next/no-img-element -- A8.net の表示回数の計測用。変えずに置く */}
              <img width={1} height={1} src={s.pixel} alt="" className="inline" />
            </p>
            <p className="text-sm text-muted">{s.note}</p>
          </li>
        ))}
      </ul>
      <p className={ui.note}>
        リンク先は外部のサービスです。リンクから申し込むと、当サイトに報酬が支払われることがあります。
        <Link href="/disclosure/" className="underline underline-offset-2">
          広告・PR表記
        </Link>
      </p>
    </aside>
  );
}
