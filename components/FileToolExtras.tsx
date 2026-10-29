"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { formatBytes, saveBlob } from "@/lib/files";
import { getLastOutput, handOff, nextToolsFor, onOutputChange } from "@/lib/handoff";
import { ui } from "./styles";

/** ファイルを扱うツールの下に出す2つ：「次のツールで使う」と「通信の記録」 */
export function FileToolExtras({ slug, name }: { slug: string; name: string }) {
  return (
    <div className="flex flex-col gap-3">
      <SendToNext slug={slug} />
      <NetworkRecord name={name} />
    </div>
  );
}

/** 保存した結果を、そのまま次のツールに渡す（工場のラインのように、ツールをつないで使う） */
function SendToNext({ slug }: { slug: string }) {
  const router = useRouter();
  const out = useSyncExternalStore(onOutputChange, getLastOutput, () => null);
  if (!out) return null;
  const next = nextToolsFor(out).filter((t) => t.slug !== slug);
  if (next.length === 0) return null;
  return (
    <section aria-label="次のツールで使う" className={`${ui.panel} flex flex-col gap-2 p-4`}>
      <h2 className={ui.h3}>保存した「{out.name}」を、続けて次のツールで使う</h2>
      <div className="flex flex-wrap gap-2">
        {next.map((t) => (
          <button
            key={t.slug}
            type="button"
            className={ui.button}
            onClick={() => {
              handOff([out]);
              router.push(`/tools/${t.slug}/`);
            }}
          >
            {t.name} →
          </button>
        ))}
      </div>
      <p className={ui.note}>ファイルはこの端末の中で次のツールに渡します。もう一度選び直す必要はありません。</p>
    </section>
  );
}

type Req = { at: number; host: string; kind: string };

/** よく出る通信先の説明 */
function describeHost(host: string): string {
  if (/googlesyndication|doubleclick|adtrafficquality|googleads/.test(host)) return "広告の表示";
  if (/google-analytics|googletagmanager/.test(host)) return "閲覧数の計測（Google アナリティクス）";
  if (/cloudflareinsights/.test(host)) return "閲覧数の計測（Cloudflare）";
  if (/fonts\.(googleapis|gstatic)/.test(host)) return "文字の形（フォント）";
  if (host === location.host) return "このサイトの部品の読み込み";
  return "";
}

/**
 * ファイルを選んでからの通信を、ブラウザが記録したとおりに見せる。
 * 「送っていない」とサイトが言うだけでなく、この端末の記録で確かめられるようにする。保存もできる。
 */
function NetworkRecord({ name }: { name: string }) {
  const [start, setStart] = useState<number | null>(null);
  const [files, setFiles] = useState<{ name: string; size: number }[]>([]);
  const [reqs, setReqs] = useState<Req[]>([]);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    // ファイルを選んだ・ドロップした時刻を始まりにする
    const begin = (list: FileList | null | undefined) => {
      if (!list?.length) return;
      const t = performance.now();
      startRef.current = t;
      setStart(t);
      setFiles([...list].map((f) => ({ name: f.name, size: f.size })));
      setReqs([]);
    };
    const onChange = (e: Event) => {
      const el = e.target as HTMLInputElement | null;
      if (el?.type === "file") begin(el.files);
    };
    const onDrop = (e: DragEvent) => begin(e.dataTransfer?.files);
    document.addEventListener("change", onChange, true);
    document.addEventListener("drop", onDrop, true);
    const obs = new PerformanceObserver((list) => {
      const s = startRef.current;
      if (s === null) return;
      const add: Req[] = [];
      for (const e of list.getEntries() as PerformanceResourceTiming[]) {
        if (e.startTime < s || e.name.startsWith("blob:") || e.name.startsWith("data:")) continue;
        let host = "";
        try {
          host = new URL(e.name).host;
        } catch {
          continue;
        }
        add.push({ at: e.startTime, host, kind: e.initiatorType });
      }
      if (add.length) setReqs((p) => [...p, ...add]);
    });
    obs.observe({ type: "resource", buffered: false });
    return () => {
      document.removeEventListener("change", onChange, true);
      document.removeEventListener("drop", onDrop, true);
      obs.disconnect();
    };
  }, []);

  if (start === null) return null;
  const hosts = [...new Set(reqs.map((r) => r.host))];
  const save = () => {
    const now = new Date();
    const lines = [
      "ツールひろば 処理の記録（通信の記録）",
      "",
      `ツール：${name}`,
      `ページ：${location.href}`,
      `記録した日時：${now.toLocaleString("ja-JP")}`,
      "",
      "■ 選んだファイル",
      ...files.map((f) => `・${f.name}（${formatBytes(f.size)}）`),
      "",
      `■ ファイルを選んでから、このブラウザが記録した通信：${reqs.length}件`,
      ...(reqs.length ? reqs.map((r) => `・${(r.at / 1000).toFixed(1)}秒　${r.host}　${describeHost(r.host)}`) : ["・なし"]),
      "",
      "■ この記録について",
      "・この一覧は、あなたのブラウザが記録した通信（Resource Timing）をそのまま書き出したものです。ツールひろばのサーバーが作った証明ではありません。",
      "・ツールひろばのプログラムは、選んだファイルを外に送りません。一覧に広告や閲覧数の計測の通信が出ることがありますが、ファイルの中身は含みません。",
      "・自分で確かめるには、ページを開いたあと機内モードにしてからファイルを処理してください。通信なしで処理できれば、ファイルは外に出ていません。",
    ];
    saveBlob(`処理の記録_${now.toISOString().slice(0, 10)}.txt`, new Blob(["﻿" + lines.join("\r\n")], { type: "text/plain" }), { remember: false });
  };
  return (
    <section aria-label="通信の記録" className={`${ui.panel} flex flex-col gap-2 p-4`}>
      <h2 className={ui.h3}>ファイルを選んでからの通信：{reqs.length}件</h2>
      {hosts.length > 0 ? (
        <ul className="flex flex-col gap-0.5 text-sm">
          {hosts.map((h) => (
            <li key={h}>
              {h}
              {describeHost(h) && <span className="text-muted">（{describeHost(h)}）</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm">ファイルを選んでから、外への通信はありません。</p>
      )}
      <p className={ui.note}>
        この端末のブラウザが記録した通信をそのまま表示しています。選んだファイルは外に送りません。自分で確かめたいときは、ページを開いたあと機内モードにして処理してみてください。
      </p>
      <div>
        <button type="button" className={ui.button} onClick={save}>
          処理の記録を保存（テキスト）
        </button>
      </div>
    </section>
  );
}
