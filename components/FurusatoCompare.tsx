"use client";

import { useState } from "react";
import type { FurusatoPortal } from "@/data/furusato-portals";
import type { SponsoredLink } from "@/data/sponsored";
import { ui } from "./styles";

/** 絞り込みの条件。公式ページで確認できた事実だけで判定する（未確認は当てはまらない扱い） */
const FILTERS: { id: string; label: string; test: (p: FurusatoPortal) => boolean }[] = [
  { id: "online", label: "ワンストップをネットで申請", test: (p) => p.oneStopOnline?.value.supported === true },
  { id: "sim", label: "上限シミュレーターあり", test: (p) => p.simulator?.value === true },
  { id: "app", label: "専用アプリあり", test: (p) => !!p.app && !/記載はなし|記載なし/.test(p.app.value) },
  { id: "paypay", label: "PayPay", test: (p) => pays(p, /PayPay/) },
  { id: "amazonpay", label: "Amazon Pay", test: (p) => pays(p, /Amazon Pay/) },
  { id: "dpay", label: "d払い", test: (p) => pays(p, /d払い/) },
  { id: "aupay", label: "au PAY", test: (p) => pays(p, /au PAY/) },
  { id: "bank", label: "銀行振込・コンビニ", test: (p) => pays(p, /銀行振込|コンビニ|郵便振替/) },
];

function pays(p: FurusatoPortal, re: RegExp) {
  return p.paymentMethods?.value.some((m) => re.test(m)) ?? false;
}

function Mark({ v }: { v: boolean | null | undefined }) {
  if (v === true) return <span className="font-bold text-emerald-600 dark:text-emerald-400">○</span>;
  if (v === false) return <span className="text-muted">✕</span>;
  return <span className="text-xs text-muted">未確認</span>;
}

export function FurusatoCompare({ portals, sponsored }: { portals: FurusatoPortal[]; sponsored: Record<string, SponsoredLink> }) {
  const [on, setOn] = useState<string[]>([]);
  const active = FILTERS.filter((f) => on.includes(f.id));
  const shown = portals.filter((p) => active.every((f) => f.test(p)));
  const toggle = (id: string) => setOn((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="条件で絞り込む" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={on.includes(f.id)}
            onClick={() => toggle(f.id)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold ring-1 transition ${on.includes(f.id) ? "bg-accent text-white ring-accent" : "bg-panel text-ink ring-line hover:ring-accent/50"}`}
          >
            {f.label}
          </button>
        ))}
        {on.length > 0 && (
          <button type="button" onClick={() => setOn([])} className="shrink-0 px-2 text-sm text-muted underline underline-offset-2">
            条件を外す
          </button>
        )}
      </div>
      <p className="text-sm text-muted" aria-live="polite">
        {shown.length} / {portals.length} サイト{on.length > 0 ? "が条件に当てはまります" : ""}
        <span className="ml-2 text-xs">← 表は横にスワイプできます</span>
      </p>

      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <table className="w-full min-w-[900px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="sticky left-0 z-10 w-40 border-b border-line bg-panel px-3 py-2">サイト</th>
              <th className="w-56 border-b border-line px-3 py-2">支払い方法</th>
              <th className="w-24 whitespace-nowrap border-b border-line px-3 py-2 text-center">ワンストップ<br />ネット申請</th>
              <th className="w-24 whitespace-nowrap border-b border-line px-3 py-2 text-center">上限<br />シミュレーター</th>
              <th className="w-72 border-b border-line px-3 py-2">特徴</th>
              <th className="w-36 border-b border-line px-3 py-2">運営会社</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => {
              const ad = sponsored[p.id];
              return (
                <tr key={p.id} className="align-top">
                  <th scope="row" className="sticky left-0 z-10 w-40 border-b border-line bg-panel px-3 py-3 text-left font-normal">
                    <b className="block text-[15px] leading-snug">{p.name}</b>
                    {p.status === "suspended" && <span className="mt-1 inline-block rounded bg-red-50 px-1.5 text-[11px] font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">サービス停止中</span>}
                    {p.status !== "suspended" &&
                      (ad ? (
                        <span className="mt-2 flex flex-col gap-0.5">
                          <a href={ad.href} target="_blank" rel="nofollow sponsored noopener" className={`${ui.button} !px-3 !py-1.5 !text-xs`}>
                            公式サイトで探す
                          </a>
                          {/* eslint-disable-next-line @next/next/no-img-element -- A8.net の表示回数の計測用。変えずに置く */}
                          <img width={1} height={1} src={ad.pixel} alt="" className="inline" />
                          <span className="text-[10px] text-muted">PR（広告リンク）</span>
                        </span>
                      ) : (
                        <a href={p.officialUrl} target="_blank" rel="noopener" className={`${ui.button} mt-2 !px-3 !py-1.5 !text-xs`}>
                          公式サイトへ
                        </a>
                      ))}
                  </th>
                  <td className="border-b border-line px-3 py-3">{p.paymentMethods ? p.paymentMethods.value.join("・") : <span className="text-xs text-muted">未確認</span>}</td>
                  <td className="border-b border-line px-3 py-3 text-center">
                    <Mark v={p.oneStopOnline?.value.supported} />
                  </td>
                  <td className="border-b border-line px-3 py-3 text-center">
                    <Mark v={p.simulator?.value} />
                  </td>
                  <td className="border-b border-line px-3 py-3">
                    {p.features.length > 0 ? (
                      <ul className="list-disc space-y-0.5 pl-4">
                        {p.features.slice(0, 2).map((f) => (
                          <li key={f.value}>{f.value}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-muted">未確認</span>
                    )}
                    {p.notes.slice(0, 1).map((n) => (
                      <p key={n.value} className="mt-1 text-xs text-red-700 dark:text-red-300">
                        {n.value}
                      </p>
                    ))}
                  </td>
                  <td className="border-b border-line px-3 py-3 text-xs text-muted">{p.operator?.value ?? "未確認"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {shown.length === 0 && <p className="text-sm text-muted">条件に当てはまるサイトがありません。条件を減らしてください。</p>}
    </div>
  );
}
