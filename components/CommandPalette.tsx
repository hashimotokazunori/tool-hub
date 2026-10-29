"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { search, type SearchItem } from "@/lib/search";

/** 索引は最初に開いたときに1回だけ読み込む */
let indexPromise: Promise<SearchItem[]> | null = null;
const loadIndex = () =>
  (indexPromise ??= fetch("/search-index.json")
    .then((r) => (r.ok ? (r.json() as Promise<SearchItem[]>) : []))
    .catch(() => {
      indexPromise = null;
      return [];
    }));

/** 入力欄で文字を打っているときは、「/」で開かない */
const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/**
 * キーボードだけでツールを呼び出す窓。Ctrl+K（Mac は ⌘K）か「/」で開き、↑↓で選んで Enter で移動する。
 * マウスを使わずに作業したい人向け。
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [items, setItems] = useState<SearchItem[]>([]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !typing(e.target) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    loadIndex().then(setItems);
    const t = setTimeout(() => input.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  // 何も打っていないときはツールを並べ、打ったら検索する（ツールを先に）
  const results = useMemo(() => {
    const tools = items.filter((i) => i.kind === "ツール");
    if (!q.trim()) return tools.slice(0, 8);
    const found = search(items, q, 20);
    return [...found.filter((i) => i.kind === "ツール"), ...found.filter((i) => i.kind !== "ツール")].slice(0, 10);
  }, [items, q]);

  if (!open) return null;
  const close = () => {
    setOpen(false);
    setQ("");
    setSel(0);
  };
  const go = (r: SearchItem | undefined) => {
    if (!r) return;
    close();
    router.push(r.href);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 pt-[12vh]" onClick={close} role="presentation">
      <div role="dialog" aria-modal="true" aria-label="ツールを呼び出す" className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-panel shadow-lift" onClick={(e) => e.stopPropagation()}>
        <input
          ref={input}
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSel((s) => Math.min(s + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSel((s) => Math.max(s - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              go(results[sel]);
            } else if (e.key === "Escape") {
              close();
            }
          }}
          placeholder="ツールの名前や、やりたいこと（例：PDF 結合、割り勘）"
          className="w-full border-b border-line bg-transparent px-4 py-3.5 text-base text-ink outline-none"
          aria-controls="palette-list"
          aria-activedescendant={results[sel] ? `palette-${sel}` : undefined}
          autoComplete="off"
        />
        <ul id="palette-list" role="listbox" className="max-h-[50vh] overflow-auto p-1.5">
          {results.map((r, i) => (
            <li
              key={r.href}
              id={`palette-${i}`}
              role="option"
              aria-selected={i === sel}
              onMouseEnter={() => setSel(i)}
              onClick={() => go(r)}
              className={`flex cursor-pointer flex-col rounded-xl px-3 py-2 ${i === sel ? "bg-accent-soft" : ""}`}
            >
              <b className="text-sm">
                {r.title}
                {r.kind !== "ツール" && <span className="ml-2 text-xs font-normal text-muted">{r.kind}</span>}
              </b>
              <small className="text-xs text-muted">{r.summary}</small>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-2 text-sm text-muted">見つかりませんでした</li>}
        </ul>
        <p className="border-t border-line px-4 py-2 text-xs text-muted">↑↓で選ぶ・Enterで開く・Escで閉じる　いつでも Ctrl+K（Macは ⌘K）か「/」で呼び出せます</p>
      </div>
    </div>
  );
}
