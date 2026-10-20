"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FURUSATO_CATEGORIES, rakutenFurusatoSearchUrl, type FurusatoCategory } from "@/data/furusato-categories";
import type { SponsoredLink } from "@/data/sponsored";
import { PRICE_BANDS, filterByPrice, parseMaxParam, type PriceFilter } from "@/lib/furusato-filter";
import type { FurusatoItem, FurusatoItemsByCategory } from "@/lib/furusato-items";
import { municipalitySearchLinks } from "@/lib/furusato-links";
import { useClientValue } from "./useClientValue";

const FIRST_ROWS = 8;
const yen = (n: number) => `￥${n.toLocaleString("ja-JP")}`;

/** カテゴリのアイコン（線画） */
function CategoryIcon({ id }: { id: FurusatoCategory["id"] }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<FurusatoCategory["id"], ReactNode> = {
    recommend: <path {...p} d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />,
    meat: (
      <>
        <path {...p} d="M14.5 4.5c3.3 0 5.5 2.4 5.5 5.3 0 4.6-5 8.7-10.4 8.7C6.3 18.5 4 16.6 4 14c0-2.4 1.8-3.5 3.4-4.6 2.2-1.6 3.6-4.9 7.1-4.9z" />
        <circle {...p} cx="14.5" cy="10" r="2" />
      </>
    ),
    rice: (
      <>
        <path {...p} d="M3.5 11.5h17a8.5 8.5 0 01-17 0z" />
        <path {...p} d="M7 11.5c.4-2.4 2.5-4 5-4s4.6 1.6 5 4M10 20h4" />
      </>
    ),
    seafood: (
      <>
        <path {...p} d="M3 12c2.5-3.6 6-5.5 9.5-5.5 3.2 0 5.8 2 7.5 5.5-1.7 3.5-4.3 5.5-7.5 5.5C9 17.5 5.5 15.6 3 12z" />
        <path {...p} d="M3 12l-1-3M3 12l-1 3" />
        <circle cx="16" cy="11" r="1" fill="currentColor" />
      </>
    ),
    fruit: (
      <>
        <path {...p} d="M12 8.5c-1.6-1.3-5.5-1.6-7 1.5-1.6 3.4.4 9.5 4 9.5 1.3 0 1.8-.6 3-.6s1.7.6 3 .6c3.6 0 5.6-6.1 4-9.5-1.5-3.1-5.4-2.8-7-1.5z" />
        <path {...p} d="M12 8.5V5.5c0-1 .8-2 2.5-2" />
      </>
    ),
    daily: (
      <>
        <rect {...p} x="4" y="9" width="16" height="10.5" rx="2" />
        <path {...p} d="M9 9c0-2.5 1.5-4.5 3-4.5S15 6.5 15 9M4 13h16" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
      {paths[id]}
    </svg>
  );
}

function Stars({ average, count }: { average: number; count: number }) {
  if (count <= 0) return <span className="text-[11px] text-muted">レビューなし</span>;
  return (
    <span className="flex items-center gap-1 text-[12px] tabular-nums">
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-amber-400" fill="currentColor" aria-hidden>
        <path d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.7L10 14.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8z" />
      </svg>
      <b className="font-semibold text-ink">{average.toFixed(1)}</b>
      <span className="text-[10px] text-muted">（{count.toLocaleString("ja-JP")}件）</span>
    </span>
  );
}

function Chip({ active, onClick, children, controls }: { active: boolean; onClick: () => void; children: ReactNode; controls?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-controls={controls}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] whitespace-nowrap transition ${
        active ? "bg-furu font-bold text-white shadow-card dark:text-bg" : "bg-field font-medium text-muted ring-1 ring-line/70 hover:text-furu"
      }`}
    >
      {children}
    </button>
  );
}

function ItemCard({ item, onOpen }: { item: FurusatoItem; onOpen: (item: FurusatoItem, el: HTMLButtonElement) => void }) {
  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={(e) => onOpen(item, e.currentTarget)}
        className="group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-panel text-left shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift"
        aria-haspopup="dialog"
      >
        <span className="block aspect-square w-full overflow-hidden bg-field">
          {/* eslint-disable-next-line @next/next/no-img-element -- 楽天ウェブサービスの商品画像（規約に従い、商品ページへのリンクと一緒に表示する） */}
          <img src={item.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1 p-2.5 pb-3">
          <span className="truncate text-[11px] text-muted">{item.municipality}</span>
          <span className="line-clamp-2 min-h-[2.5em] text-[13px] leading-[1.25] font-bold text-ink">{item.name}</span>
          <span className="mt-auto pt-1">
            <Stars average={item.reviewAverage} count={item.reviewCount} />
          </span>
          <span className="flex items-baseline gap-1">
            <span className="text-[10px] text-muted">寄附額</span>
            <b className="text-[16px] leading-tight font-extrabold tracking-tight text-furu tabular-nums">{yen(item.price)}</b>
          </span>
        </span>
      </button>
    </li>
  );
}

/** シートの各サイトの行の色（淡い地色と点の色）。楽天＝赤、au PAY＝オレンジ、ふるさと本舗＝緑 */
const ROW_TONE: Record<string, { row: string; dot: string; pr: string }> = {
  rakuten: { row: "bg-red-50 ring-red-200/70 dark:bg-red-950/35 dark:ring-red-900/60", dot: "bg-red-600 dark:bg-red-400", pr: "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200" },
  "aupay-furusato": { row: "bg-orange-50 ring-orange-200/70 dark:bg-orange-950/35 dark:ring-orange-900/60", dot: "bg-orange-500 dark:bg-orange-400", pr: "bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-200" },
  "furusato-honpo": { row: "bg-emerald-50 ring-emerald-200/70 dark:bg-emerald-950/35 dark:ring-emerald-900/60", dot: "bg-emerald-600 dark:bg-emerald-400", pr: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200" },
};
const NEUTRAL_TONE = { row: "bg-field ring-line", dot: "bg-muted", pr: "bg-line text-muted" };

function SiteRow({ href, label, tone, pixel }: { href: string; label: string; tone: string; pixel?: string }) {
  const t = ROW_TONE[tone] ?? NEUTRAL_TONE;
  return (
    <li className="flex items-center">
      <a href={href} target="_blank" rel="nofollow sponsored noopener" className={`flex min-h-12 flex-1 items-center gap-2.5 rounded-xl px-3.5 py-3 text-[13px] font-semibold text-ink no-underline ring-1 transition hover:brightness-[0.98] ${t.row}`}>
        <span className={`h-2 w-2 shrink-0 rounded-full ${t.dot}`} aria-hidden />
        <span className="flex-1">{label}</span>
        <span className={`rounded px-1.5 text-[10px] leading-[18px] font-bold ${t.pr}`}>PR</span>
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
        </svg>
        <span className="sr-only">（外部サイト）</span>
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element -- A8.net の表示回数の計測用。変えずに置く */}
      {pixel && <img width={1} height={1} src={pixel} alt="" className="h-px w-px" />}
    </li>
  );
}

/** 返礼品をタップしたときに出る下からのシート（スマホ）／中央のダイアログ（PC） */
function ItemSheet({ item, others, onClose }: { item: FurusatoItem | null; others: SponsoredLink[]; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (item && !d.open) {
      d.showModal();
      document.documentElement.style.overflow = "hidden";
    }
    if (!item && d.open) d.close();
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [item]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="furusato-sheet-title"
      onClose={onClose}
      onClick={(e) => {
        // 背景（シートの外）を押したら閉じる
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-3xl border-0 bg-panel p-0 text-ink shadow-lift backdrop:bg-black/50 backdrop:backdrop-blur-[2px] sm:inset-0 sm:m-auto sm:h-fit sm:max-w-md sm:rounded-3xl"
    >
      {item && (
        <div className="flex flex-col gap-4 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          <div className="mx-auto h-1 w-10 rounded-full bg-line" aria-hidden />
          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- 楽天ウェブサービスの商品画像 */}
            <img src={item.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl bg-field object-cover ring-1 ring-line/60" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="text-[11px] text-muted">{item.municipality}</p>
              <h2 id="furusato-sheet-title" className="line-clamp-2 text-[13px] leading-snug font-bold">
                {item.name}
              </h2>
              <p className="text-[15px] font-extrabold text-furu tabular-nums">寄附額：{yen(item.price)}</p>
            </div>
            <button type="button" onClick={() => ref.current?.close()} className="-mt-1 -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-field hover:text-ink" aria-label="閉じる">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-[12px] font-bold text-ink">この返礼品を取り扱うサイトで探す</h3>
              <span className="shrink-0 text-[10px] text-muted">※外部サイトへ移動します</span>
            </div>
            <ul className="flex flex-col gap-2">
              <SiteRow href={item.url} label="楽天ふるさと納税で見る" tone="rakuten" />
              {others.map((s) => {
                // 自治体名で探すリンク（A8 の商品リンク）。作れなければトップページへの広告リンク
                const deep = municipalitySearchLinks(item.municipality).find((d) => d.id === s.id);
                return deep ? (
                  <SiteRow key={s.id} href={deep.href} label={`${s.name}で${deep.keyword}の返礼品を見る`} tone={s.id} />
                ) : (
                  <SiteRow key={s.id} href={s.href} label={`${s.name}で探す`} tone={s.id} pixel={s.pixel} />
                );
              })}
            </ul>
            <p className="text-[10px] leading-relaxed text-muted">
              楽天ふるさと納税はこの返礼品のページが、ほかのサイトはこの自治体の返礼品の一覧が開きます（同じ返礼品がないこともあります）。「PR」は広告リンクです。寄附額・在庫は変わることがあるので、寄附の前に各サイトで確かめてください。
            </p>
          </div>

          <button type="button" onClick={() => ref.current?.close()} className="mx-auto px-6 py-2 text-[13px] font-semibold text-muted transition hover:text-ink">
            閉じる
          </button>
        </div>
      )}
    </dialog>
  );
}

export function FurusatoGallery({ items, others }: { items: FurusatoItemsByCategory | null; others: SponsoredLink[] }) {
  // 返礼品が取れたときは、0件のカテゴリを出さない（取れなかったときは全カテゴリを出し、楽天の公式ページへ案内する）
  const categories = items ? FURUSATO_CATEGORIES.filter((c) => items[c.id]?.length) : FURUSATO_CATEGORIES;
  const [category, setCategory] = useState<FurusatoCategory["id"]>(categories[0]?.id ?? "recommend");
  // null のあいだは URL の ?max= に従う（控除上限の計算ツールから来たとき）
  const [chosen, setChosen] = useState<PriceFilter | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<FurusatoItem | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const urlMax = useClientValue(() => parseMaxParam(window.location.search), null);
  const filter: PriceFilter = chosen ?? (urlMax !== null ? { kind: "max", value: urlMax } : { kind: "all" });

  const cat = categories.find((c) => c.id === category) ?? FURUSATO_CATEGORIES[0];
  const all = items?.[category] ?? [];
  const list = filterByPrice(all, filter);
  const shown = expanded ? list : list.slice(0, FIRST_ROWS);

  const pick = (f: PriceFilter) => {
    setChosen(f);
    setExpanded(false);
  };
  const isBand = (id: string) => filter.kind === "band" && filter.id === id;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* カテゴリ：横にスクロールできるチップ。ページ全体は横にはみ出さない */}
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2 pb-1" role="group" aria-label="カテゴリ">
          {categories.map((c) => (
            <Chip
              key={c.id}
              active={c.id === category}
              controls="furusato-items"
              onClick={() => {
                setCategory(c.id);
                setExpanded(false);
              }}
            >
              <CategoryIcon id={c.id} />
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      {items && (
        <div className="-mx-4 -mt-1 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max items-center gap-1.5 py-1" role="group" aria-label="寄附額で絞り込む">
            <span className="mr-0.5 flex items-center gap-1 text-xs font-semibold text-muted">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
                <path d="M4 5h16l-6 7.5V19l-4-2v-4.5z" />
              </svg>
              寄附額:
            </span>
            <button type="button" aria-pressed={filter.kind === "all"} onClick={() => pick({ kind: "all" })} className={priceChip(filter.kind === "all")}>
              すべて
            </button>
            {urlMax !== null && (
              <button type="button" aria-pressed={filter.kind === "max"} onClick={() => pick({ kind: "max", value: urlMax })} className={priceChip(filter.kind === "max")}>
                上限額 {yen(urlMax)} 以内
              </button>
            )}
            {PRICE_BANDS.map((b) => (
              <button key={b.id} type="button" aria-pressed={isBand(b.id)} onClick={() => pick({ kind: "band", id: b.id })} className={priceChip(isBand(b.id))}>
                {b.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div id="furusato-items" aria-live="polite" className="min-w-0">
        {!items ? (
          <div className="flex flex-col items-start gap-3 rounded-3xl border border-dashed border-line bg-panel p-5 text-sm">
            <p className="text-muted">ただいま返礼品の一覧を表示できません。楽天ふるさと納税のサイトで「{cat.label}」の返礼品を直接ご覧ください。</p>
            <a href={rakutenFurusatoSearchUrl(cat)} target="_blank" rel="noopener" className="font-semibold text-furu underline underline-offset-2">
              楽天ふるさと納税で{cat.label === "おすすめ" ? "返礼品" : `「${cat.label}」`}を見る →
            </a>
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-3xl border border-dashed border-line bg-panel p-5 text-sm">
            <p className="text-muted">この寄附額に合う「{cat.label}」の返礼品は、いまの一覧にはありませんでした。</p>
            <button type="button" onClick={() => pick({ kind: "all" })} className="font-semibold text-furu underline underline-offset-2">
              寄附額の絞り込みをやめる
            </button>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {shown.map((it) => (
                <ItemCard
                  key={it.id}
                  item={it}
                  onOpen={(item, el) => {
                    opener.current = el;
                    setSelected(item);
                  }}
                />
              ))}
            </ul>
            <div className="mt-6 flex flex-col items-center gap-3">
              {list.length > shown.length && (
                <button type="button" onClick={() => setExpanded(true)} className="rounded-full border border-line bg-panel px-6 py-2.5 text-sm font-semibold text-ink shadow-card transition hover:border-furu/50 hover:text-furu">
                  もっと見る（あと{list.length - shown.length}件）
                </button>
              )}
              <a href={rakutenFurusatoSearchUrl(cat)} target="_blank" rel="noopener" className="text-xs font-semibold text-furu-2 underline underline-offset-2">
                楽天ふるさと納税で{cat.label === "おすすめ" ? "すべての返礼品" : `「${cat.label}」の返礼品`}を見る →
              </a>
            </div>
          </>
        )}
      </div>

      <ItemSheet
        item={selected}
        others={others}
        onClose={() => {
          setSelected(null);
          opener.current?.focus();
        }}
      />
    </div>
  );
}

const priceChip = (active: boolean) =>
  `rounded-md border px-2.5 py-1 text-[12px] whitespace-nowrap transition ${active ? "border-furu bg-furu-soft font-bold text-furu" : "border-line bg-panel text-muted hover:border-furu/40 hover:text-furu"}`;
