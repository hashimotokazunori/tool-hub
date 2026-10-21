"use client";

import { useEffect, useState } from "react";

/** ブラウザがホーム画面への追加を案内できるときに出すイベント（Chrome・Edge など。型は標準にないので最小限） */
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const VISITS = "toolhiroba:visits";
const DISMISSED = "toolhiroba:install-dismissed";
/** 閉じたら、この日数は出さない */
const SNOOZE_DAYS = 30;

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    // 保存できない環境（プライベートブラウズなど）では何もしない
  }
};

/**
 * 「ホーム画面に追加」の案内。2回目以降に来た人にだけ、画面の下に小さく出す。
 * - Chrome・Edge など：ボタンでそのまま追加の画面を開く
 * - iPhone・iPad の Safari：イベントがないので、共有ボタンからの手順を出す
 * すでにホーム画面から開いているとき・閉じてから30日以内は出さない。
 */
export function InstallPrompt() {
  const [mode, setMode] = useState<"none" | "button" | "ios">("none");
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;
    const visits = Number(read(VISITS) ?? "0") + 1;
    write(VISITS, String(visits));
    const dismissedAt = Number(read(DISMISSED) ?? "0");
    if (visits < 2 || Date.now() - dismissedAt < SNOOZE_DAYS * 86400000) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      setMode("button");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    // iPhone の Safari は beforeinstallprompt が来ないので、少し待ってから手順を出す
    const timer = ios && safari ? window.setTimeout(() => setMode("ios"), 4000) : undefined;
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (mode === "none") return null;
  const close = () => {
    write(DISMISSED, String(Date.now()));
    setMode("none");
  };
  return (
    <div role="dialog" aria-label="ホーム画面に追加" className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-panel p-3 shadow-lift md:bottom-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- 小さなアイコン */}
      <img src="/icon-192.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-xl" />
      <p className="flex-1 text-xs leading-relaxed text-ink">
        {mode === "button" ? (
          <>
            <b className="block text-[13px]">ホーム画面に追加できます</b>
            アプリのようにすぐ開けて、一度開いたページは電波がなくても使えます。
          </>
        ) : (
          <>
            <b className="block text-[13px]">ホーム画面に追加できます</b>
            下の共有ボタン（□に↑）から「ホーム画面に追加」を選んでください。
          </>
        )}
      </p>
      {mode === "button" && event && (
        <button
          type="button"
          onClick={async () => {
            await event.prompt();
            await event.userChoice;
            close();
          }}
          className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-white"
        >
          追加
        </button>
      )}
      <button type="button" onClick={close} aria-label="閉じる" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-field">
        ×
      </button>
    </div>
  );
}
