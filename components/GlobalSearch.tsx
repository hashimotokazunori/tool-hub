"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useMemo, useRef, useState } from "react";
import { search, type SearchItem } from "@/lib/search";
import { Icon } from "./icons";

const KIND_STYLE: Record<SearchItem["kind"], string> = {
  ツール: "border-tool text-tool",
  グッズ: "border-goods text-goods",
  悩み別: "border-solution text-solution",
  ガイド: "border-guide text-guide",
};

/** 索引（ビルド時に /search-index.json として書き出したもの）。最初に検索窓を触ったときに1回だけ読み込む */
let indexPromise: Promise<SearchItem[]> | null = null;
function loadIndex(): Promise<SearchItem[]> {
  indexPromise ??= fetch("/search-index.json")
    .then((r) => (r.ok ? (r.json() as Promise<SearchItem[]>) : []))
    .catch(() => {
      indexPromise = null;
      return [];
    });
  return indexPromise;
}

/**
 * ツール・グッズ・記事をまとめて探す検索窓。
 * variant="hero" はトップの濃い背景用の大きな検索窓。
 */
export function GlobalSearch({ variant = "default" }: { variant?: "default" | "hero" }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SearchItem[] | null>(null);
  const prepare = () => {
    if (!items) loadIndex().then(setItems);
  };
  const listId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const results = useMemo(() => search(items ?? [], q), [items, q]);
  const office = /word|ワード|excel|エクセル|パワポ|powerpoint|docx|xlsx/i.test(q) && /pdf/i.test(q);
  const hero = variant === "hero";

  return (
    <div
      ref={wrap}
      className="relative"
      onBlur={(e) => {
        if (!wrap.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <label
        className={`flex items-center gap-3 border text-muted focus-within:outline-2 focus-within:outline-offset-2 ${
          hero ? "rounded-2xl border-line bg-panel px-4 shadow-lift focus-within:outline-accent" : "rounded-full border-line bg-panel/80 px-3.5 shadow-card focus-within:outline-accent"
        }`}
      >
        <Icon name="search" size={hero ? 22 : 18} />
        <span className="sr-only">ツール・便利グッズ・記事を検索</span>
        <input
          type="search"
          value={q}
          onChange={(e) => {
            prepare();
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            prepare();
            setOpen(true);
          }}
          onPointerEnter={prepare}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder={hero ? "やりたいことから検索（例：割り勘、消費税、文字数）" : "ツール・便利グッズを検索"}
          className={`w-full bg-transparent text-ink outline-none placeholder:text-muted/80 ${hero ? "py-4 text-base sm:text-lg" : "py-2 text-[15px]"}`}
          aria-controls={listId}
          autoComplete="off"
        />
      </label>
      {open && q.trim() && (
        <div id={listId} className="absolute inset-x-0 top-full z-40 mt-2 max-h-[60vh] overflow-auto rounded-2xl border border-line bg-panel p-1.5 text-left shadow-lift">
          {office && (
            <p className="px-3 py-2 text-xs text-muted">
              Word・Excel・PowerPointは、アプリの「ファイル」→「名前を付けて保存」（エクスポート）で「PDF」を選ぶと、見た目そのままのPDFにできます。
            </p>
          )}
          {results.length > 0 ? (
            results.map((r) => (
              <Link key={r.href} href={r.href} onClick={() => setOpen(false)} className="grid grid-cols-[auto_1fr] items-center gap-x-3 rounded-xl px-3 py-2 text-ink no-underline hover:bg-field">
                <span className={`row-span-2 rounded-full border px-2 text-[11px] font-bold ${KIND_STYLE[r.kind]}`}>{r.kind}</span>
                <b className="text-sm">{r.title}</b>
                <small className="text-xs text-muted">{r.summary}</small>
              </Link>
            ))
          ) : items === null ? (
            <p className="px-3 py-2 text-xs text-muted">読み込み中…</p>
          ) : (
            !office && <p className="px-3 py-2 text-xs text-muted">見つかりませんでした。ほかの言葉で試してください。</p>
          )}
        </div>
      )}
    </div>
  );
}

/** ヘッダーの検索窓。トップページでは大きな検索窓があるので出さない */
export function HeaderSearch() {
  const path = usePathname();
  if (path === "/") return null;
  return <GlobalSearch />;
}
