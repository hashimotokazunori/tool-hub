import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FurusatoCompare } from "@/components/FurusatoCompare";
import { PageHeading } from "@/components/PageHeading";
import { ui } from "@/components/styles";
import { FURUSATO_POINT_RULE, FURUSATO_PORTALS } from "@/data/furusato-portals";
import { furusatoShare, furusatoStats } from "@/data/furusato-stats";
import { sponsoredLinks, type SponsoredLink } from "@/data/sponsored";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "ふるさと納税サイト比較（12サイト）",
  description: "楽天・ふるなび・au PAY・ANA・JAL など12のふるさと納税サイトを、支払い方法・ワンストップ特例のネット申請・控除上限シミュレーターで比較。各サイトの公式ページで確認した情報だけを載せています。",
  path: "/furusato/",
});

/** ポータルの id → 提携中の広告リンク */
const AD_BY_PORTAL: Record<string, string> = { "au-pay": "aupay-furusato", "furusato-honpo": "furusato-honpo" };

export default function FurusatoPage() {
  const sponsored: Record<string, SponsoredLink> = {};
  for (const [portal, id] of Object.entries(AD_BY_PORTAL)) {
    const s = sponsoredLinks.find((x) => x.id === id);
    if (s) sponsored[portal] = s;
  }
  // 停止中・未確認のサイトは表の下のほうに
  const order = { available: 0, unverified: 1, suspended: 2 } as const;
  const portals = [...FURUSATO_PORTALS].sort((a, b) => order[a.status] - order[b.status]);
  const share = furusatoShare();

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumbs items={[{ label: "ふるさと納税サイト比較" }]} />
      <PageHeading title="ふるさと納税サイト比較" lead="支払い方法や手続きのしやすさで、自分に合うサイトを選べます。各サイトの公式ページで確認できた情報だけを載せ、確認できなかった項目は「未確認」にしています。">
        <p className="w-fit rounded border border-muted px-2 text-xs font-bold text-muted">PR　このページには広告（アフィリエイトリンク）が含まれます</p>
      </PageHeading>

      <section aria-label="ふるさと納税をしている人の割合" className={`${ui.panel} flex flex-col gap-3 p-4 sm:p-6`}>
        <p className="text-sm font-semibold text-muted">ふるさと納税をしている人は</p>
        <div className="flex items-end gap-1.5" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            <svg key={i} viewBox="0 0 24 24" className={`h-10 w-10 sm:h-12 sm:w-12 ${i === 0 ? "text-accent" : "text-line"}`} fill="currentColor">
              <circle cx="12" cy="6.5" r="4" />
              <path d="M4 22c0-4.97 3.58-8.5 8-8.5s8 3.53 8 8.5z" />
            </svg>
          ))}
        </div>
        <p className="text-2xl font-extrabold sm:text-3xl">
          約6人に1人<span className="ml-2 text-base font-bold text-muted">（{share}%）</span>
        </p>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-field ring-1 ring-line">
          <div className="h-full rounded-full bg-accent" style={{ width: `${share}%` }} />
        </div>
        <p className="text-sm text-muted">
          {furusatoStats.year}、住民税（所得割）を納めた{furusatoStats.incomeLevyTaxpayersLabel}のうち、ふるさと納税で住民税の控除を受けた人は{furusatoStats.deductedPeopleLabel}でした。最新の{furusatoStats.latest.year}では{furusatoStats.latest.deductedPeopleLabel}（うちワンストップ特例{furusatoStats.latest.oneStopLabel}）に増えています。割合は、総務省の2つの統計から当サイトが計算したものです。
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={ui.h2}>まず、いくらまで寄附できるか</h2>
        <p className="text-sm text-muted">自己負担2,000円で収まる寄附額は、住民税の通知書の数字から計算できます。</p>
        <Link href="/tools/furusato-limit/" className={`${ui.card} max-w-md`}>
          <b className="text-[15px]">ふるさと納税の控除上限 計算 →</b>
          <span className="text-xs text-muted">住民税の所得割額と所得税の税率から、上限の目安と内訳を出す</span>
        </Link>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={ui.h2}>12サイトを比べる</h2>
        <FurusatoCompare portals={portals} sponsored={sponsored} />
        <p className={ui.note}>
          情報は{furusatoStats.checkedAt.replaceAll("-", "/")}に各サイトの公式ページで確認したものです。支払い方法は自治体や返礼品によって使えないことがあります。申し込む前に、各サイトで最新の情報を確かめてください。「PR」の付いたボタンは広告リンクで、申し込みがあると当サイトに報酬が支払われることがあります。並び順や表示に報酬の有無は関係しません。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={ui.h2}>知っておきたいルール</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          <li>
            {FURUSATO_POINT_RULE.effectiveFromWording.replace(/[【】]/g, "")}、ポータルサイトなどが寄附に伴ってポイントを付ける形での募集は禁止されています（{FURUSATO_POINT_RULE.notice}）。クレジットカード会社が通常の買い物と同じく付けるポイントは別です。
          </li>
          <li>確定申告をしなくてよい会社員などは、1年間の寄附先が5団体以内なら「ワンストップ特例」を使えます。寄附先ごとの申請が必要で、表の「ネット申請」に○があるサイトは、申請をネットで済ませる方法を案内しています。</li>
          <li>控除の上限を超えた分は自己負担になります。上限は年収・家族構成・ほかの控除で変わるので、先に目安を確かめてから寄附するのがおすすめです。</li>
        </ul>
      </section>

      <section className="flex flex-col gap-1">
        <h2 className={ui.h3}>出典</h2>
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
          {furusatoStats.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                {s.title}
              </a>
            </li>
          ))}
          <li>
            <a href={FURUSATO_POINT_RULE.source} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              総務省「{FURUSATO_POINT_RULE.title}」
            </a>
          </li>
          <li>各サイトの情報：表に載せた各ふるさと納税サイトの公式ページ</li>
        </ul>
      </section>
    </div>
  );
}
