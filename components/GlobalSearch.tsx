"use client";

import Link from "next/link";
import { useId, useMemo, useRef, useState } from "react";
import { search, type SearchItem } from "@/lib/search";
import { Icon } from "./icons";

/** ツール・グッズ・記事をまとめて探す検索窓。索引はビルド時に作ってpropsで受け取る */
export function GlobalSearch({ items }: { items: SearchItem[] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const listId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const results = useMemo(() => search(items, q), [items, q]);
  const office = /word|ワード|excel|エクセル|パワポ|powerpoint|docx|xlsx/i.test(q) && /pdf/i.test(q);

  return (
    <div
      ref={wrap}
      className="relative"
      onBlur={(e) => {
        if (!wrap.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <label className="flex items-center gap-2 rounded-xl border border-line bg-panel px-3 text-muted focus-within:outline-2 focus-within:outline-accent">
        <Icon name="search" />
        <span className="sr-only">ツール・便利グッズを検索</span>
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="ツール・便利グッズを検索（例：文字数、消費税、割り勘）"
          className="w-full bg-transparent py-3 text-base text-ink outline-none"
          aria-controls={listId}
          autoComplete="off"
        />
      </label>
      {open && q.trim() && (
        <div id={listId} className="absolute inset-x-0 top-full z-40 mt-1 max-h-[60vh] overflow-auto rounded-xl border border-line bg-panel p-1.5 shadow-xl">
          {office && (
            <p className="px-3 py-2 text-xs text-muted">
              Word・Excel・PowerPointは、アプリの「ファイル」→「名前を付けて保存」（エクスポート）で「PDF」を選ぶと、見た目そのままのPDFにできます。
            </p>
          )}
          {results.length > 0 ? (
            results.map((r) => (
              <Link key={r.href} href={r.href} onClick={() => setOpen(false)} className="grid grid-cols-[auto_1fr] items-center gap-x-3 rounded-lg px-3 py-2 text-ink no-underline hover:bg-accent-soft">
                <span className="row-span-2 rounded border border-accent px-1.5 text-[11px] font-bold text-accent">{r.kind}</span>
                <b className="text-sm">{r.title}</b>
                <small className="text-xs text-muted">{r.summary}</small>
              </Link>
            ))
          ) : (
            !office && <p className="px-3 py-2 text-xs text-muted">見つかりませんでした。ほかの言葉で試してください。</p>
          )}
        </div>
      )}
    </div>
  );
}
