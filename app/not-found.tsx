import Link from "next/link";
import { ui } from "@/components/styles";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4 py-10">
      <h1 className={ui.h1}>ページが見つかりません</h1>
      <p className="text-muted">URLが間違っているか、ページが移動・削除された可能性があります。上の検索窓から探すか、次のページからお進みください。</p>
      <div className="flex flex-wrap gap-2">
        <Link href="/" className={ui.buttonPrimary}>
          トップへ
        </Link>
        <Link href="/tools/" className={ui.button}>
          ツール一覧
        </Link>
      </div>
    </div>
  );
}
