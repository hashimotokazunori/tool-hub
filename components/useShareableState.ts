"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { useStoredState } from "./useStoredState";

/**
 * 入力を端末に保存しつつ、URL（#s=…）で他の人に共有できる状態。
 * 共有の中身は URL の「#」より後ろに入れるので、サーバーには送られない。
 * 共有リンクで開いたときはその内容を表示し、編集を始めたら自分の保存内容として扱う。
 */
const HASH_KEY = "s=";

export function encodeShare(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeShare(s: string): unknown {
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes), (_k, v) => (v === null ? Number.NaN : v));
  } catch {
    return undefined;
  }
}

const subscribeHash = (l: () => void) => {
  window.addEventListener("hashchange", l);
  return () => window.removeEventListener("hashchange", l);
};
const readHash = () => {
  const h = window.location.hash.slice(1);
  return h.startsWith(HASH_KEY) ? h.slice(HASH_KEY.length) : null;
};

/** parse は共有リンクの中身を確かめて、使えない形なら undefined を返す（他人が作ったリンクなので信用しない） */
export function useShareableState<T>(key: string, initial: T, parse: (v: unknown) => T | undefined) {
  const [stored, setStored, reset] = useStoredState<T>(key, initial);
  const rawShared = useSyncExternalStore(subscribeHash, readHash, () => null);
  const shared = useMemo(() => (rawShared ? parse(decodeShare(rawShared)) : undefined), [rawShared, parse]);
  const [touched, setTouched] = useState(false);
  const fromLink = shared !== undefined && !touched;
  const value = fromLink ? shared : stored;

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      if (fromLink) {
        // 共有リンクの内容をもとに編集を始める。URL から共有の部分を外す
        setTouched(true);
        history.replaceState(null, "", window.location.pathname + window.location.search);
        setStored(typeof next === "function" ? (next as (p: T) => T)(shared as T) : next);
      } else setStored(next);
    },
    [fromLink, shared, setStored],
  );

  const shareUrl = useCallback(() => `${window.location.origin}${window.location.pathname}#${HASH_KEY}${encodeShare(value)}`, [value]);
  return { value, set, reset, shareUrl, fromLink };
}
