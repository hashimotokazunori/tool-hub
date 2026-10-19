"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Check } from "@/components/TextTransform";
import { CopyButton, Field, FieldGrid } from "@/components/ToolUI";
import { FileDrop } from "@/components/FileDrop";
import { ui } from "@/components/styles";
import { formatBytes } from "@/lib/files";
import { HASH_ALGORITHMS, SAMPLE_JWT, contrastRatio, decodeJwt, formatColor, hashAll, jwtTimes, parseColor, rgbToHex, sameHash, utf8, type ColorFormat, type HashAlgorithm, type Rgb } from "./logic";

/* ---------- ハッシュ ---------- */

type Hashes = Record<HashAlgorithm, string>;

function HashTable({ hashes, upper, expect }: { hashes: Hashes; upper: boolean; expect: string }) {
  return (
    <ul className="flex flex-col gap-2" aria-live="polite">
      {HASH_ALGORITHMS.map((a) => {
        const v = upper ? hashes[a].toUpperCase() : hashes[a];
        const match = expect.trim() !== "" && sameHash(expect, hashes[a]);
        return (
          <li key={a} className={`flex flex-col gap-1 rounded-lg border px-3 py-2 ${match ? "border-accent bg-accent-soft" : "border-line bg-panel"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted">
                {a}
                {(a === "MD5" || a === "SHA-1") && <span className="ml-1 font-normal">（改ざん検知・安全性の用途には不向き）</span>}
                {match && <span className="ml-1 text-ink">✓ 照合した値と一致</span>}
              </span>
              <CopyButton text={v} label={`${a}をコピー`} />
            </div>
            <code className="font-mono text-sm break-all">{v}</code>
          </li>
        );
      })}
    </ul>
  );
}

export function HashGenerator() {
  const [mode, setMode] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [textHashes, setTextHashes] = useState<Hashes | null>(null);
  const [file, setFile] = useState<{ name: string; size: number; hashes: Hashes | null; error?: string } | null>(null);
  const [upper, setUpper] = useState(false);
  const [expect, setExpect] = useState("");
  const latest = useRef(0);

  const onText = async (s: string) => {
    setText(s);
    const id = ++latest.current;
    const h = await hashAll(utf8(s));
    if (id === latest.current) setTextHashes(h);
  };
  const onFile = async (f: File) => {
    const id = ++latest.current;
    setFile({ name: f.name, size: f.size, hashes: null });
    try {
      const h = await hashAll(new Uint8Array(await f.arrayBuffer()));
      if (id === latest.current) setFile({ name: f.name, size: f.size, hashes: h });
    } catch {
      if (id === latest.current) setFile({ name: f.name, size: f.size, hashes: null, error: "ファイルを読み込めませんでした。大きすぎるファイルは計算できないことがあります。" });
    }
  };
  const hashes = mode === "text" ? textHashes : file?.hashes;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="計算する対象">
        {(
          [
            ["text", "テキスト"],
            ["file", "ファイル"],
          ] as const
        ).map(([m, l]) => (
          <button key={m} type="button" aria-pressed={mode === m} className={mode === m ? ui.buttonPrimary : ui.button} onClick={() => setMode(m)}>
            {l}
          </button>
        ))}
      </div>
      {mode === "text" ? (
        <label className={ui.label}>
          テキスト（UTF-8として計算します）
          <textarea className={`${ui.input} min-h-32 font-mono text-sm`} value={text} placeholder="ハッシュ値を求めたい文字を入力してください。" onChange={(e) => void onText(e.target.value)} />
        </label>
      ) : (
        <>
          <FileDrop label="ファイル" onFiles={(fs) => void onFile(fs[0])} hint="どんな種類のファイルでも計算できます。ファイルは送信されません。" />
          {file && (
            <p className="text-sm" aria-live="polite">
              {file.name}（{formatBytes(file.size)}）{!file.hashes && !file.error && " を計算しています…"}
            </p>
          )}
          {file?.error && <p className="text-sm text-warn">{file.error}</p>}
        </>
      )}
      <FieldGrid>
        <Field label="照合したいハッシュ値（任意）" wide>
          <input className={`${ui.input} font-mono text-sm`} type="text" value={expect} placeholder="配布元に書かれた値を貼り付けると、一致する行に印が付きます" onChange={(e) => setExpect(e.target.value)} />
        </Field>
      </FieldGrid>
      <Check label="英字を大文字で表示" checked={upper} onChange={setUpper} />
      {expect.trim() && hashes && (
        <p className="text-sm font-semibold" aria-live="polite">
          {HASH_ALGORITHMS.some((a) => sameHash(expect, hashes[a])) ? "照合した値と一致しました。" : "どの方式の値とも一致しません。"}
        </p>
      )}
      {hashes ? <HashTable hashes={hashes} upper={upper} expect={expect} /> : mode === "text" && <p className={ui.note}>文字を入力すると、ハッシュ値が表示されます。</p>}
      <p className={ui.note}>
        計算はすべてこの端末のブラウザの中で行い、文字やファイルを外部に送ることはありません。MD5とSHA-1は衝突（別のデータで同じ値になること）を作る方法が知られているため、パスワードの保存や改ざん防止などの安全性が必要な用途には使わないでください。ファイルの破損確認などにはSHA-256以上がおすすめです。
      </p>
    </div>
  );
}

/* ---------- カラーコード ---------- */

const FORMATS: [ColorFormat, string, string][] = [
  ["hex", "HEX", "#1E90FF"],
  ["rgb", "RGB", "rgb(30, 144, 255)"],
  ["hsl", "HSL", "hsl(210, 100%, 56%)"],
  ["cmyk", "CMYK", "cmyk(88%, 44%, 0%, 0%)"],
];
const INITIAL: Rgb = { r: 30, g: 144, b: 255 };

export function ColorConverter() {
  const [rgb, setRgb] = useState<Rgb>(INITIAL);
  // 入力中の欄だけは、打った文字をそのまま見せる
  const [draft, setDraft] = useState<{ format: ColorFormat; text: string } | null>(null);
  const hex = rgbToHex(rgb);
  const white = contrastRatio(rgb, { r: 255, g: 255, b: 255 });
  const black = contrastRatio(rgb, { r: 0, g: 0, b: 0 });
  const invalid = draft && !parseColor(draft.format, draft.text);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-stretch gap-3">
        <div className="h-24 min-w-32 flex-1 rounded-xl border border-line" style={{ background: hex }} role="img" aria-label={`色の見本 ${hex}`} />
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="rounded-lg px-3 py-1.5 font-semibold" style={{ background: hex, color: "#fff" }}>
            白い文字 {white.toFixed(2)}:1
          </span>
          <span className="rounded-lg px-3 py-1.5 font-semibold" style={{ background: hex, color: "#000" }}>
            黒い文字 {black.toFixed(2)}:1
          </span>
        </div>
      </div>
      <Field label="色を選ぶ">
        <input
          type="color"
          className="h-11 w-full cursor-pointer rounded-lg border border-line bg-field"
          value={hex.toLowerCase()}
          onChange={(e) => {
            const c = parseColor("hex", e.target.value);
            if (c) setRgb(c);
            setDraft(null);
          }}
        />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-live="polite">
        {FORMATS.map(([f, label, ph]) => {
          const value = draft?.format === f ? draft.text : formatColor(f, rgb);
          return (
            <div key={f} className="flex flex-col gap-1">
              <label className={ui.label}>
                {label}
                <input
                  className={`${ui.input} font-mono`}
                  type="text"
                  spellCheck={false}
                  autoCapitalize="off"
                  value={value}
                  placeholder={ph}
                  aria-invalid={draft?.format === f && !!invalid}
                  onChange={(e) => {
                    setDraft({ format: f, text: e.target.value });
                    const c = parseColor(f, e.target.value);
                    if (c) setRgb(c);
                  }}
                  onBlur={() => setDraft(null)}
                />
              </label>
              <div className="flex items-center gap-2">
                <CopyButton text={formatColor(f, rgb)} label={`${label}をコピー`} />
                {draft?.format === f && invalid && <span className="text-xs text-warn">この形式では読めません（例：{ph}）</span>}
              </div>
            </div>
          );
        })}
      </div>
      <p className={ui.note}>
        HEXは「#RGB」「#RRGGBB」、RGBは0〜255、HSLは色相0〜360・彩度と明度は0〜100%で入れます。HSLとCMYKは整数に丸めて表示するため、行き来すると1ずれることがあります。CMYKは単純な計算式による近似で、印刷会社の色設定（ICCプロファイル）による変換とは一致しません。印刷の色は入稿先の指定で確かめてください。コントラスト比はWCAG 2の計算式で、文字なら4.5:1以上が目安です。
      </p>
    </div>
  );
}

/* ---------- JWT ---------- */

function subscribeSecond(cb: () => void) {
  const id = setInterval(cb, 1000);
  return () => clearInterval(id);
}
const useNowSecond = () =>
  useSyncExternalStore(
    subscribeSecond,
    () => Math.floor(Date.now() / 1000),
    () => 0,
  );

export function JwtDecoder() {
  const [token, setToken] = useState("");
  const nowSec = useNowSecond();
  const r = token.trim() ? decodeJwt(token) : null;
  const st = r?.ok && nowSec ? jwtTimes(r.payload, nowSec) : null;
  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-lg border border-warn px-3 py-2 text-sm">
        <b>署名は検証しません。</b>中身を読んで表示するだけなので、このトークンが本物か・改ざんされていないかは分かりません。また、本番で使うトークンは信頼できないサイトに貼り付けないでください（このページは端末の中だけで処理し、外部に送りません）。
      </p>
      <label className={ui.label}>
        JWT（トークン）
        <textarea className={`${ui.input} min-h-28 font-mono text-sm break-all`} value={token} spellCheck={false} placeholder="eyJhbGciOi… の形のトークンを貼り付けてください。「Bearer 」付きでもかまいません。" onChange={(e) => setToken(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={ui.button} onClick={() => setToken(SAMPLE_JWT)}>
          サンプルを入れる
        </button>
        <button type="button" className={ui.button} onClick={() => setToken("")} disabled={!token}>
          消す
        </button>
      </div>
      <div aria-live="polite" className="flex flex-col gap-4">
        {r && !r.ok && <p className="text-sm text-warn">{r.message}</p>}
        {r?.ok && (
          <>
            {st && st.expired !== null && (
              <p className={`rounded-lg px-3 py-2 text-sm font-semibold ${st.expired ? "bg-warn text-white" : "bg-accent-soft"}`}>{st.expired ? "有効期限（exp）を過ぎています。" : "有効期限（exp）内です。"}</p>
            )}
            {st?.notYetValid && <p className="rounded-lg bg-warn px-3 py-2 text-sm font-semibold text-white">まだ有効になる日時（nbf）の前です。</p>}
            {st && st.times.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full text-sm whitespace-nowrap tabular-nums">
                  <tbody>
                    {st.times.map((t) => (
                      <tr key={t.claim} className="border-t border-line first:border-t-0">
                        <th className="bg-field px-3 py-1.5 text-left text-xs font-medium text-muted">{t.label}</th>
                        <td className="px-3 py-1.5">{t.jst}</td>
                        <td className="px-3 py-1.5 font-mono text-xs text-muted">{t.seconds}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <JsonBlock title={`ヘッダー${typeof r.header.alg === "string" ? `（署名方式：${r.header.alg}）` : ""}`} json={r.headerJson} />
            <JsonBlock title="ペイロード（中身）" json={r.payloadJson} />
            <p className={ui.note}>署名部分：{r.signature ? `${r.signature.length}文字（検証していません）` : "なし（署名のないトークンです）"}</p>
          </>
        )}
      </div>
      <p className={ui.note}>JWTのヘッダーとペイロードは暗号化されておらず、base64urlで書き換えただけなので、誰でも読めます。パスワードなどの秘密をペイロードに入れないでください。</p>
    </div>
  );
}

function JsonBlock({ title, json }: { title: string; json: string }) {
  return (
    <section className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={ui.h3}>{title}</h3>
        <CopyButton text={json} label="JSONをコピー" />
      </div>
      <pre className="max-h-96 overflow-auto rounded-lg border border-line bg-field px-3 py-2 font-mono text-sm whitespace-pre-wrap break-all">{json}</pre>
    </section>
  );
}
