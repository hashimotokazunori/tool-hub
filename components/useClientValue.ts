"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * 端末でしか決まらない値（今日の日付・乱数など）を読む。
 * 静的生成のHTMLでは serverValue を使い、ブラウザで開いたあとに clientValue に切り替わる。
 * clientValue は同じ入力なら同じ値を返すこと（毎回変わると描画が止まらない）。
 */
export function useClientValue<T>(clientValue: () => T, serverValue: T): T {
  return useSyncExternalStore(noopSubscribe, clientValue, () => serverValue);
}
