"use client";

import { useEffect } from "react";
import type { Tool } from "@/lib/types";
import { ToolCard } from "./Cards";
import { Icon } from "./icons";
import { ui } from "./styles";
import { useStoredState } from "./useStoredState";

/**
 * 最近使ったツールとお気に入り。どちらもこの端末のブラウザ（localStorage）にだけ保存し、外部には送らない。
 */
const NONE: string[] = [];
const RECENT_MAX = 6;

/** ツールのページを開いたら「最近使ったツール」の先頭に入れる */
export function RememberTool({ slug }: { slug: string }) {
  const [, setRecent] = useStoredState<string[]>("recent-tools", NONE);
  useEffect(() => {
    setRecent((prev) => [slug, ...prev.filter((s) => s !== slug)].slice(0, RECENT_MAX));
  }, [slug, setRecent]);
  return null;
}

/** ★ お気に入りに入れる・外すボタン */
export function FavoriteButton({ slug, name }: { slug: string; name: string }) {
  const [favorites, setFavorites] = useStoredState<string[]>("favorite-tools", NONE);
  const on = favorites.includes(slug);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setFavorites((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [slug, ...prev]))}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 transition ${on ? "bg-amber-50 text-amber-700 ring-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-700" : "bg-field text-muted ring-line hover:text-ink"}`}
      title={on ? `${name}をお気に入りから外す` : `${name}をお気に入りに入れる`}
    >
      <span aria-hidden>{on ? "★" : "☆"}</span>
      {on ? "お気に入り済み" : "お気に入り"}
    </button>
  );
}

/** トップやツール一覧に出す「お気に入り」と「最近使ったツール」。どちらも空なら何も出さない */
export function MyTools({ tools, exclude }: { tools: Tool[]; exclude?: string }) {
  const [favorites] = useStoredState<string[]>("favorite-tools", NONE);
  const [recent, , clearRecent] = useStoredState<string[]>("recent-tools", NONE);
  const bySlug = new Map(tools.map((t) => [t.slug, t]));
  const pick = (slugs: string[]) => slugs.filter((s) => s !== exclude).flatMap((s) => bySlug.get(s) ?? []);
  const fav = pick(favorites);
  const rec = pick(recent).filter((t) => !favorites.includes(t.slug));
  if (fav.length === 0 && rec.length === 0) return null;
  return (
    <section aria-label="あなたのツール" className="flex flex-col gap-4">
      {fav.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className={`${ui.h3} flex items-center gap-1.5`}>
            <span aria-hidden className="text-amber-500">★</span>お気に入り
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {fav.map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        </div>
      )}
      {rec.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className={`${ui.h3} flex items-center gap-1.5`}>
              <Icon name="date" size={16} className="text-muted" />
              最近使ったツール
            </h2>
            <button type="button" onClick={clearRecent} className="text-xs text-muted underline underline-offset-2 hover:text-ink">
              履歴を消す
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {rec.map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        </div>
      )}
      <p className={ui.note}>お気に入りと履歴は、この端末のブラウザの中だけに保存しています（外部には送りません）。</p>
    </section>
  );
}
