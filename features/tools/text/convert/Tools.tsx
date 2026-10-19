"use client";

import { useState } from "react";
import { Check, Choice, TextTransform } from "@/components/TextTransform";
import { useStoredState } from "@/components/useStoredState";
import { ui } from "@/components/styles";
import {
  cleanWhitespace,
  convertCase,
  convertKana,
  convertWidth,
  dedupeLines,
  replaceText,
  type CaseMode,
  type DedupeOptions,
  type KanaMode,
  type WhitespaceOptions,
  type WidthOptions,
} from "./logic";

export function HiraganaKatakana() {
  const [input, setInput] = useStoredState("hiragana-katakana:input", "");
  const [mode, setMode] = useState<KanaMode>("toKatakana");
  const [half, setHalf] = useState(true);
  return (
    <TextTransform
      input={input}
      onInput={setInput}
      output={convertKana(input, mode, half)}
      placeholder="例：やまだ たろう"
      options={
        <>
          <Choice label="変換" value={mode} onChange={setMode} options={[["toKatakana", "ひらがな → カタカナ"], ["toHiragana", "カタカナ → ひらがな"]]} />
          <Check label="半角カナも全角にしてから変換する" checked={half} onChange={setHalf} />
        </>
      }
    />
  );
}

export function ZenkakuHankaku() {
  const [input, setInput] = useStoredState("zenkaku-hankaku:input", "");
  const [o, setO] = useState<WidthOptions>({ direction: "toHalf", alnum: true, symbol: true, space: true, kana: false });
  const set = (k: keyof WidthOptions) => (v: boolean) => setO({ ...o, [k]: v });
  return (
    <TextTransform
      input={input}
      onInput={setInput}
      output={convertWidth(input, o)}
      placeholder="例：ＴＥＬ：０３－１２３４－５６７８"
      options={
        <>
          <Choice label="変換" value={o.direction} onChange={(v) => setO({ ...o, direction: v })} options={[["toHalf", "全角 → 半角"], ["toFull", "半角 → 全角"]]} />
          <Check label="英数字" checked={o.alnum} onChange={set("alnum")} />
          <Check label="記号" checked={o.symbol} onChange={set("symbol")} />
          <Check label="スペース" checked={o.space} onChange={set("space")} />
          <Check label="カタカナ" checked={o.kana} onChange={set("kana")} />
        </>
      }
    />
  );
}

export function CaseConverter() {
  const [input, setInput] = useStoredState("case-converter:input", "");
  const [mode, setMode] = useState<CaseMode>("title");
  return (
    <TextTransform
      input={input}
      onInput={setInput}
      output={convertCase(input, mode)}
      placeholder="例：user profile image"
      options={
        <Choice
          label="変換"
          value={mode}
          onChange={setMode}
          options={[
            ["upper", "すべて大文字（UPPER）"],
            ["lower", "すべて小文字（lower）"],
            ["title", "単語の先頭を大文字（Title Case）"],
            ["sentence", "文の先頭だけ大文字（Sentence case）"],
            ["swap", "大文字と小文字を入れ替え"],
            ["camel", "camelCase"],
            ["pascal", "PascalCase"],
            ["snake", "snake_case"],
            ["kebab", "kebab-case"],
            ["constant", "CONSTANT_CASE"],
          ]}
        />
      }
    />
  );
}

export function WhitespaceRemover() {
  const [input, setInput] = useStoredState("whitespace-remover:input", "");
  const [o, setO] = useState<WhitespaceOptions>({ trimLines: true, collapseSpaces: true, fullWidthSpace: true, tabsToSpace: false, collapseBlankLines: true, removeBlankLines: false, joinParagraphLines: false, removeAllNewlines: false });
  const set = (k: keyof WhitespaceOptions) => (v: boolean) => setO({ ...o, [k]: v });
  return (
    <TextTransform
      input={input}
      onInput={setInput}
      output={cleanWhitespace(input, o)}
      placeholder="PDFやWebページからコピーした文章を貼り付けてください"
      options={
        <>
          <Check label="行頭・行末の空白を削除" checked={o.trimLines} onChange={set("trimLines")} />
          <Check label="連続する空白を1つに" checked={o.collapseSpaces} onChange={set("collapseSpaces")} />
          <Check label="全角スペースも空白として扱う" checked={o.fullWidthSpace} onChange={set("fullWidthSpace")} />
          <Check label="タブを空白に" checked={o.tabsToSpace} onChange={set("tabsToSpace")} />
          <Check label="連続する空行を1行に" checked={o.collapseBlankLines} onChange={set("collapseBlankLines")} />
          <Check label="空行をすべて削除" checked={o.removeBlankLines} onChange={set("removeBlankLines")} />
          <Check label="段落は残して、段落内の改行だけ削除" checked={o.joinParagraphLines} onChange={set("joinParagraphLines")} />
          <Check label="改行をすべて削除" checked={o.removeAllNewlines} onChange={set("removeAllNewlines")} />
        </>
      }
    />
  );
}

export function TextReplace() {
  const [input, setInput] = useStoredState("text-replace:input", "");
  const [o, setO] = useState({ find: "", replace: "", regex: false, ignoreCase: false, rules: "" });
  const r = replaceText(input, o);
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={ui.label}>
          検索する文字
          <input className={ui.input} value={o.find} onChange={(e) => setO({ ...o, find: e.target.value })} placeholder="例：株式会社サンプル" />
        </label>
        <label className={ui.label}>
          置き換える文字
          <input className={ui.input} value={o.replace} onChange={(e) => setO({ ...o, replace: e.target.value })} placeholder="例：（株）サンプル" />
        </label>
        <label className={`${ui.label} sm:col-span-2`}>
          まとめて置換（1行に「検索 → 置換」。使わないときは空欄）
          <textarea className={`${ui.input} min-h-20 font-mono text-sm`} value={o.rules} onChange={(e) => setO({ ...o, rules: e.target.value })} placeholder={"2025年 → 令和7年\n東京 → 東京都"} />
        </label>
      </div>
      {r.error && <p className="text-sm text-warn">{r.error}</p>}
      <TextTransform
        input={input}
        onInput={setInput}
        output={r.text}
        summary={`${r.count} か所を置換`}
        options={
          <>
            <Check label="正規表現を使う（$1 でグループを参照）" checked={o.regex} onChange={(v) => setO({ ...o, regex: v })} />
            <Check label="英字の大文字・小文字を区別しない" checked={o.ignoreCase} onChange={(v) => setO({ ...o, ignoreCase: v })} />
          </>
        }
      />
    </div>
  );
}

export function RemoveDuplicateLines() {
  const [input, setInput] = useStoredState("remove-duplicate-lines:input", "");
  const [o, setO] = useState<DedupeOptions>({ mode: "unique", sort: "none", trim: true, ignoreCase: false, removeBlank: true, showCount: false });
  const r = dedupeLines(input, o);
  return (
    <TextTransform
      input={input}
      onInput={setInput}
      output={r.text}
      summary={`${r.before} 行 → ${r.after} 行`}
      placeholder={"1行に1つずつ入れてください\n例：メールアドレスの一覧"}
      options={
        <>
          <Choice label="結果" value={o.mode} onChange={(v) => setO({ ...o, mode: v })} options={[["unique", "重複を1つにまとめる"], ["duplicatesOnly", "重複している行だけ"], ["singlesOnly", "1回しか出てこない行だけ"]]} />
          <Choice label="並び" value={o.sort} onChange={(v) => setO({ ...o, sort: v })} options={[["none", "元の順番"], ["asc", "昇順"], ["desc", "降順"], ["count", "出現回数の多い順"]]} />
          <Check label="前後の空白を無視" checked={o.trim} onChange={(v) => setO({ ...o, trim: v })} />
          <Check label="大文字・小文字を区別しない" checked={o.ignoreCase} onChange={(v) => setO({ ...o, ignoreCase: v })} />
          <Check label="空行を削除" checked={o.removeBlank} onChange={(v) => setO({ ...o, removeBlank: v })} />
          <Check label="出現回数を付ける" checked={o.showCount} onChange={(v) => setO({ ...o, showCount: v })} />
        </>
      }
    />
  );
}
