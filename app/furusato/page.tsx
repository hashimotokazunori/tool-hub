import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FurusatoGallery } from "@/components/FurusatoGallery";
import { RakutenCredit } from "@/components/Market";
import { FURUSATO_POINT_RULE, FURUSATO_PORTALS, type FurusatoPortal } from "@/data/furusato-portals";
import { furusatoShare, furusatoStats } from "@/data/furusato-stats";
import { sponsoredLinks, type SponsoredLink } from "@/data/sponsored";
import { getFurusatoItems } from "@/lib/furusato-items";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "ふるさと納税の返礼品をさがす（お肉・お米・海鮮・果物・日用品）",
  description: "楽天ふるさと納税でレビューの多い返礼品を、お肉・お米・海鮮・果物・日用品のカテゴリと寄附額で絞り込んで探せます。控除上限の計算ツールと、ふるさと納税サイトの特徴もまとめています。",
  path: "/furusato/",
});

/** 楽天の返礼品を取り直す間隔（秒）。ほかのページと同じ */
export const revalidate = 21600;

/** ポータルの id → 提携中の広告リンク（A8.net） */
const AD_BY_PORTAL: Record<string, string> = { "au-pay": "aupay-furusato", "furusato-honpo": "furusato-honpo" };
const adFor = (portalId: string) => sponsoredLinks.find((s) => s.id === AD_BY_PORTAL[portalId]);

function PrTag() {
  return <span className="rounded border border-muted/70 px-1 text-[10px] leading-4 font-bold text-muted">PR</span>;
}

function Badge({ on, children }: { on: boolean; children: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${on ? "bg-furu-2-soft text-furu-2" : "bg-field text-muted/80 line-through decoration-muted/40"}`}>
      {children}
    </span>
  );
}

function PortalCard({ p }: { p: FurusatoPortal }) {
  const ad = p.status === "available" ? adFor(p.id) : undefined;
  return (
    <li className="flex min-w-0 flex-col gap-2.5 rounded-2xl border border-line bg-panel p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <b className="text-sm leading-snug">{p.name}</b>
        {p.status === "suspended" && <span className="shrink-0 rounded-full bg-warn/10 px-2 py-0.5 text-[11px] font-bold text-warn">停止中</span>}
        {p.status === "unverified" && <span className="shrink-0 rounded-full bg-field px-2 py-0.5 text-[11px] font-semibold text-muted">未確認</span>}
      </div>
      {p.status === "available" ? (
        <div className="flex flex-wrap gap-1.5">
          <Badge on={!!p.oneStopOnline?.value.supported}>ネット申請</Badge>
          <Badge on={!!p.simulator?.value}>シミュレーター</Badge>
        </div>
      ) : (
        <p className="text-[11px] leading-relaxed text-muted">{p.status === "suspended" ? "公式サイトでサービス停止中と告知されています。" : "公式サイトを確認できていません。"}</p>
      )}
      <div className="mt-auto">
        {ad ? <AdLink ad={ad} /> : (
          <a href={p.officialUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold whitespace-nowrap text-furu-2 underline underline-offset-2">
            公式サイトへ →
          </a>
        )}
      </div>
    </li>
  );
}

function AdLink({ ad }: { ad: SponsoredLink }) {
  return (
    <span className="flex items-center gap-1.5">
      <PrTag />
      <a href={ad.href} target="_blank" rel="nofollow sponsored noopener" className="text-xs font-semibold whitespace-nowrap text-furu underline underline-offset-2">
        公式サイトへ →
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element -- A8.net の表示回数の計測用。変えずに置く */}
      <img width={1} height={1} src={ad.pixel} alt="" className="h-px w-px" />
    </span>
  );
}

function PersonIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`-mx-px h-4 w-4 ${filled ? "text-furu" : "text-line"}`} fill="currentColor" aria-hidden>
      <circle cx="12" cy="6.5" r="4" />
      <path d="M4 22c0-4.97 3.58-8.5 8-8.5s8 3.53 8 8.5z" />
    </svg>
  );
}

export default async function FurusatoPage() {
  const items = await getFurusatoItems();
  const fetchedAt = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "long", day: "numeric" }).format(new Date());
  const others = ["aupay-furusato", "furusato-honpo"].map((id) => sponsoredLinks.find((s) => s.id === id)).filter((s): s is SponsoredLink => !!s);
  const order = { available: 0, unverified: 1, suspended: 2 } as const;
  const portals = [...FURUSATO_PORTALS].sort((a, b) => order[a.status] - order[b.status]);
  const share = furusatoShare();

  return (
    <div className="flex min-w-0 flex-col gap-8 sm:gap-10">
      <div className="flex flex-col gap-4">
        <Breadcrumbs items={[{ label: "ふるさと納税" }]} />
        <p className="w-fit rounded-full border border-line bg-panel px-3 py-1 text-[11px] font-semibold text-muted">
          <span className="mr-1.5 font-bold text-ink">PR</span>このページには広告（アフィリエイトリンク）が含まれます
        </p>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold tracking-[0.2em] text-furu">FURUSATO NOZEI</p>
          <h1 className="text-[clamp(1.6rem,6vw,2.4rem)] leading-tight font-extrabold tracking-tight">
            返礼品から選ぶ
            <br className="sm:hidden" />
            ふるさと納税
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">楽天ふるさと納税でレビューの多い返礼品を、カテゴリと寄附額で絞り込めます。</p>
        </div>
      </div>

      <div className="-mt-3 flex flex-col gap-2.5 sm:-mt-4">
        <Link
          href="/tools/furusato-limit/"
          className="group flex items-center gap-3 rounded-2xl bg-furu-2 px-4 py-3.5 text-white no-underline shadow-card transition hover:shadow-lift hover:brightness-110 dark:bg-furu-2-soft dark:ring-1 dark:ring-furu-2/40"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 dark:bg-furu-2/15 dark:text-furu-2" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="5" y="3" width="14" height="18" rx="2.5" />
              <path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" />
            </svg>
          </span>
          <span className="flex min-w-0 flex-1 flex-col dark:text-ink">
            <span className="text-[11px] font-medium opacity-85">まずは自分の目安を知る</span>
            <b className="text-[15px] leading-snug">控除額上限チェック（1分）</b>
          </span>
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 transition group-hover:translate-x-0.5 dark:text-furu-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>

        <section aria-label="ふるさと納税をしている人の割合" className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-2.5">
          <div className="flex shrink-0 items-end" aria-hidden>
            {Array.from({ length: 6 }, (_, i) => (
              <PersonIcon key={i} filled={i === 0} />
            ))}
          </div>
          <div className="flex min-w-0 flex-col">
            <p className="text-[13px] leading-snug">
              ふるさと納税をしている人は<br className="sm:hidden" /><b className="mr-0.5 text-[15px] font-extrabold whitespace-nowrap sm:mx-0.5 text-furu">約6人に1人</b>
              <span className="text-[11px] text-muted">（{share}%）</span>
            </p>
            <p className="text-[10px] leading-snug text-muted">住民税を納める人のうち。{furusatoStats.year}・総務省の統計から当サイトが計算</p>
          </div>
        </section>
      </div>

      <section className="flex min-w-0 flex-col gap-4" aria-labelledby="items-heading">
        <div className="flex items-end justify-between gap-3">
          <h2 id="items-heading" className="text-xl font-bold tracking-tight sm:text-2xl">
            人気の返礼品
          </h2>
          {items && <span className="text-[11px] text-muted">レビュー件数順・{fetchedAt}時点</span>}
        </div>
        <FurusatoGallery items={items} others={others} />
        {items && (
          <div className="flex flex-col gap-1">
            <p className="text-xs leading-relaxed text-muted">
              楽天ふるさと納税（自治体が楽天市場に出している店舗）の返礼品を、楽天ウェブサービスのAPIで取得し、レビューの件数が多い順に並べています（同じ自治体は1件まで）。寄附額・在庫は取得した時点のものです。並び順に報酬の有無は関係しません。
            </p>
            <RakutenCredit />
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="portals-heading">
        <div className="flex flex-col gap-1">
          <h2 id="portals-heading" className="text-xl font-bold tracking-tight sm:text-2xl">
            ふるさと納税サイト
          </h2>
          <p className="text-xs leading-relaxed text-muted">「ネット申請」はワンストップ特例の申請をネットで済ませる方法を案内しているサイト、「シミュレーター」は控除上限の計算があるサイトです。</p>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {portals.map((p) => (
            <PortalCard key={p.id} p={p} />
          ))}
        </ul>
        <p className="text-xs leading-relaxed text-muted">
          情報は{furusatoStats.checkedAt.replaceAll("-", "/")}に各サイトの公式ページで確認したものです。打ち消し線は、公式ページで確認できなかった項目です。「PR」の付いたリンクは広告で、申し込みがあると当サイトに報酬が支払われることがあります。
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-3xl bg-furu-2-soft/60 p-5 sm:p-6">
        <h2 className="text-base font-bold">知っておきたいルール</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          <li>
            {FURUSATO_POINT_RULE.effectiveFromWording.replace(/[【】]/g, "")}、ポータルサイトなどが寄附に伴ってポイントを付ける形での募集は禁止されています（{FURUSATO_POINT_RULE.notice}）。
          </li>
          <li>確定申告をしなくてよい会社員などは、1年間の寄附先が5団体以内なら「ワンストップ特例」を使えます。寄附先ごとの申請が必要です。</li>
          <li>控除の上限を超えた分は自己負担になります。上限は年収・家族構成・ほかの控除で変わるので、先に目安を確かめてから寄附するのがおすすめです。</li>
        </ul>
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="text-sm font-bold">出典</h2>
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
          <li>各サイトの情報：上に載せた各ふるさと納税サイトの公式ページ</li>
        </ul>
      </section>
    </div>
  );
}
