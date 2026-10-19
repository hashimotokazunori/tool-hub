"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * 入力した内容を、この端末のブラウザ（localStorage）に保存しておく状態。
 * ページを閉じても次に開いたときに残る。外部には送らない。
 * localStorage が使えない環境（プライベートブラウズなど）では、ページを開いているあいだだけ覚える。
 */
const PREFIX = "toolhiroba:";
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function read(key: string): string | null {
  if (memory.has(key)) return memory.get(key)!;
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

function write(key: string, raw: string | null) {
  if (raw === null) memory.delete(key);
  else memory.set(key, raw);
  try {
    if (raw === null) localStorage.removeItem(PREFIX + key);
    else localStorage.setItem(PREFIX + key, raw);
  } catch {
    // 保存できなくても、開いているあいだは memory で動く
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** JSON では NaN が null になるので、数値の欄は読み戻すときに NaN に戻す */
const reviver = (_k: string, v: unknown) => (v === null ? Number.NaN : v);

/** initial は文字・数などの値か、部品の外で作った定数を渡す（毎回作り直すと保存内容を読み直し続ける） */
export function useStoredState<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void, () => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const value = useMemo(() => {
    if (raw === null) return initial;
    try {
      return JSON.parse(raw, reviver) as T;
    } catch {
      return initial;
    }
  }, [raw, initial]);
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const r = read(key);
      let prev = initial;
      if (r !== null) {
        try {
          prev = JSON.parse(r, reviver) as T;
        } catch {
          // 壊れた保存内容は初期値として扱う
        }
      }
      const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      write(key, JSON.stringify(v));
    },
    [key, initial],
  );
  const reset = useCallback(() => write(key, null), [key]);
  return [value, set, reset];
}
