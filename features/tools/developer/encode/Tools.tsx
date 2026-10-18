"use client";

import { useState, type ReactNode } from "react";
import { Check, Choice, TextTransform } from "@/components/TextTransform";
import { CopyButton, Stats } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { base64Decode, base64Encode, formatJson, htmlEscape, htmlUnescape, testRegex, urlDecode, urlEncode, type CodecResult } from "./logic";

const out = (r: CodecResult) => (r.ok ? r.text : "");
const err = (r: CodecResult) => (r.ok ? undefined : r.message);
const Err = ({ children }: { children?: ReactNode }) => (children ? <p className="text-sm text-warn">{children}</p> : null);

export function JsonFormatter() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<"2" | "4" | "tab" | "minify">("2");
  const r = input.trim() ? formatJson(input, indent === "tab" ? "\t" : indent === "minify" ? "minify" : Number(indent)) : null;
  return (
    <div className="flex flex-col gap-2">
      <TextTransform
        input={input}
        onInput={setInput}
        output={r?.ok ? r.text : ""}
        placeholder='{"name":"ツールひろば","tools":["json","base64"]}'
        summary={!r ? "JSONを貼り付けると整形します" : r.ok ? "正しいJSONです" : "構文エラーがあります"}
        options={<Choice label="形式" value={indent} onChange={setIndent} options={[["2", "整形（インデント2）"], ["4", "整形（インデント4）"], ["tab", "整形（タブ）"], ["minify", "1行に圧縮"]]} />}
      />
      {r && !r.ok && <Err>{r.line ? `${r.line}行目 ${r.column}文字目付近にエラーがあります。（${r.message}）` : `構文エラー：${r.message}`}</Err>}
    </div>
  );
}

export function UrlEncode() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode" | "encodeUri" | "decode">("encode");
  const r = mode === "decode" ? urlDecode(input) : urlEncode(input, mode === "encode");
  return (
    <div className="flex flex-col gap-2">
      <TextTransform
        input={input}
        onInput={setInput}
        output={out(r)}
        placeholder="例：https://example.com/search?q=無料 ツール"
        options={<Choice label="変換" value={mode} onChange={setMode} options={[["encode", "エンコード（パラメーターの値用・すべて変換）"], ["encodeUri", "エンコード（URL全体用・: / ? & は残す）"], ["decode", "デコード（元に戻す）"]]} />}
      />
      <Err>{err(r)}</Err>
    </div>
  );
}

export function Base64() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [urlSafe, setUrlSafe] = useState(false);
  const r = mode === "encode" ? base64Encode(input, urlSafe) : base64Decode(input);
  return (
    <div className="flex flex-col gap-2">
      <TextTransform
        input={input}
        onInput={setInput}
        output={out(r)}
        placeholder="変換したい文字列"
        options={
          <>
            <Choice label="変換" value={mode} onChange={setMode} options={[["encode", "エンコード"], ["decode", "デコード"]]} />
            {mode === "encode" && <Check label="URLセーフ（+ / を - _ に、= を省略）" checked={urlSafe} onChange={setUrlSafe} />}
          </>
        }
      />
      <Err>{err(r)}</Err>
      <p className={ui.note}>文字列はUTF-8として扱います。Base64は暗号化ではないので、パスワードなどの秘密は守れません。</p>
    </div>
  );
}

export function HtmlEscape() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"escape" | "unescape">("escape");
  return (
    <TextTransform
      input={input}
      onInput={setInput}
      output={mode === "escape" ? htmlEscape(input) : htmlUnescape(input)}
      placeholder='<a href="/">トップ</a> & ほか'
      options={<Choice label="変換" value={mode} onChange={setMode} options={[["escape", "エスケープ（< を &lt; に）"], ["unescape", "アンエスケープ（&lt; を < に）"]]} />}
    />
  );
}

export function RegexTester() {
  const [pattern, setPattern] = useState("(\\d{3})-(\\d{4})");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("");
  const [rep, setRep] = useState("");
  const r = testRegex(pattern, flags, text, rep);
  const highlighted: ReactNode[] = [];
  if (r.ok) {
    let last = 0;
    r.matches.forEach((m, i) => {
      highlighted.push(text.slice(last, m.index), <mark key={i} className="rounded-sm bg-[#ffe08a] text-[#111]">{m.text || "∅"}</mark>);
      last = m.index + m.text.length;
    });
    highlighted.push(text.slice(last));
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <label className={ui.label}>
          パターン
          <input className={`${ui.input} font-mono`} value={pattern} onChange={(e) => setPattern(e.target.value)} spellCheck={false} />
        </label>
        <label className={ui.label}>
          フラグ（g i m s u）
          <input className={`${ui.input} font-mono`} value={flags} onChange={(e) => setFlags(e.target.value)} spellCheck={false} />
        </label>
      </div>
      <label className={ui.label}>
        テストする文章
        <textarea className={`${ui.input} min-h-32 font-mono text-sm`} value={text} onChange={(e) => setText(e.target.value)} placeholder={"本社：〒100-0005 東京都千代田区\n支社：〒530-0001 大阪府大阪市"} />
      </label>
      <label className={ui.label}>
        置換（空欄なら使わない。$1 で1番目のグループ）
        <input className={`${ui.input} font-mono`} value={rep} onChange={(e) => setRep(e.target.value)} placeholder="[$1-$2]" />
      </label>
      {!r.ok ? (
        <Err>{r.message}</Err>
      ) : (
        <>
          <Stats items={[{ label: "一致した数", value: r.matches.length, emphasis: true }]} />
          {text && <pre className="overflow-auto rounded-lg border border-line bg-field p-3 font-mono text-sm break-all whitespace-pre-wrap">{highlighted}</pre>}
          {r.matches.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead className="bg-field text-left">
                  <tr>
                    <th className="px-3 py-1.5">#</th>
                    <th className="px-3 py-1.5">一致</th>
                    <th className="px-3 py-1.5">位置</th>
                    {r.matches[0].groups.map((_, i) => (
                      <th key={i} className="px-3 py-1.5">
                        ${i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.matches.slice(0, 200).map((m, i) => (
                    <tr key={i} className="border-t border-line font-mono">
                      <td className="px-3 py-1">{i + 1}</td>
                      <td className="px-3 py-1">{m.text}</td>
                      <td className="px-3 py-1">{m.index}</td>
                      {m.groups.map((g, j) => (
                        <td key={j} className="px-3 py-1">
                          {g ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {r.replaced !== undefined && (
            <div className="flex flex-col gap-2">
              <span className={ui.note}>置換結果</span>
              <pre className="overflow-auto rounded-lg border border-line bg-field p-3 font-mono text-sm whitespace-pre-wrap">{r.replaced}</pre>
              <CopyButton text={r.replaced} label="置換結果をコピー" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
