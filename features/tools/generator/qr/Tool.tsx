"use client";

import { useMemo, useState } from "react";
import { create, type QRCodeErrorCorrectionLevel } from "qrcode";
import { Check, Choice } from "@/components/TextTransform";
import { Field, FieldGrid } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { saveBlob } from "@/lib/files";
import { contrastRatio, qrSvg, wifiPayload } from "./logic";

type Mode = "text" | "wifi";
type Security = "WPA" | "WEP" | "nopass";

function build(text: string, level: QRCodeErrorCorrectionLevel) {
  if (!text) return { error: "" };
  try {
    return { qr: create(text, { errorCorrectionLevel: level }) };
  } catch {
    return { error: "文字が多すぎてQRコードにできません。短くするか、誤り訂正のレベルを下げてください。" };
  }
}

export default function QrCode() {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("https://");
  const [ssid, setSsid] = useState("");
  const [pass, setPass] = useState("");
  const [security, setSecurity] = useState<Security>("WPA");
  const [hidden, setHidden] = useState(false);
  const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [fg, setFg] = useState("#000000");
  const [bg, setBg] = useState("#ffffff");
  const [px, setPx] = useState<"256" | "512" | "1024">("512");
  const payload = mode === "wifi" ? (ssid ? wifiPayload(ssid, pass, security, hidden) : "") : text === "https://" ? "" : text;
  const r = useMemo(() => build(payload, level), [payload, level]);
  const svg = r.qr ? qrSvg(r.qr.modules.size, (row, col) => r.qr!.modules.get(row, col) === 1, { margin: 4, fg, bg }) : "";
  const contrast = contrastRatio(fg, bg);

  const savePng = () => {
    if (!r.qr) return;
    const n = r.qr.modules.size + 8;
    const size = Number(px);
    const scale = Math.max(1, Math.floor(size / n));
    const c = document.createElement("canvas");
    c.width = c.height = n * scale;
    const g = c.getContext("2d")!;
    g.fillStyle = bg;
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = fg;
    for (let row = 0; row < r.qr.modules.size; row++)
      for (let col = 0; col < r.qr.modules.size; col++) if (r.qr.modules.get(row, col)) g.fillRect((col + 4) * scale, (row + 4) * scale, scale, scale);
    c.toBlob((b) => b && saveBlob("qrcode.png", b), "image/png");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 self-start rounded-lg border border-line p-1" role="tablist" aria-label="QRコードの種類">
        {(
          [
            ["text", "URL・文字"],
            ["wifi", "Wi-Fi 接続"],
          ] as [Mode, string][]
        ).map(([m, l]) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} className={`rounded-md px-3 py-1.5 text-sm ${mode === m ? "bg-accent text-accent-ink" : "text-ink"}`} onClick={() => setMode(m)}>
            {l}
          </button>
        ))}
      </div>
      {mode === "text" ? (
        <label className={ui.label}>
          URL や文字
          <textarea className={`${ui.input} min-h-24 font-mono text-sm`} value={text} onChange={(e) => setText(e.target.value)} placeholder="https://example.com" />
        </label>
      ) : (
        <FieldGrid>
          <Field label="ネットワーク名（SSID）">
            <input className={ui.input} value={ssid} onChange={(e) => setSsid(e.target.value)} autoComplete="off" />
          </Field>
          {security !== "nopass" && (
            <Field label="パスワード">
              <input className={ui.input} value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="off" spellCheck={false} />
            </Field>
          )}
          <Choice<Security>
            label="暗号化"
            value={security}
            onChange={setSecurity}
            options={[
              ["WPA", "WPA / WPA2 / WPA3"],
              ["WEP", "WEP"],
              ["nopass", "なし"],
            ]}
          />
          <div className="self-end pb-2">
            <Check label="ステルス（SSIDを隠している）" checked={hidden} onChange={setHidden} />
          </div>
        </FieldGrid>
      )}
      <div className="grid gap-4 md:grid-cols-[minmax(0,18rem)_1fr]">
        <div className="flex aspect-square items-center justify-center rounded-xl border border-line bg-field p-2">
          {svg ? <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" role="img" aria-label="作成したQRコード" dangerouslySetInnerHTML={{ __html: svg }} /> : <p className="p-4 text-center text-sm text-muted">{r.error || "内容を入れると、ここにQRコードが出ます"}</p>}
        </div>
        <div className="flex flex-col gap-3">
          <Choice
            label="誤り訂正（汚れや欠けへの強さ）"
            value={level}
            onChange={setLevel}
            options={[
              ["L", "L（約7%まで復元・いちばん小さい）"],
              ["M", "M（約15%・ふつう）"],
              ["Q", "Q（約25%）"],
              ["H", "H（約30%・ロゴを重ねるとき）"],
            ]}
          />
          <div className="flex flex-wrap gap-4">
            <label className={ui.label}>
              線の色
              <input type="color" className="h-10 w-16 rounded border border-line" value={fg} onChange={(e) => setFg(e.target.value)} />
            </label>
            <label className={ui.label}>
              背景の色
              <input type="color" className="h-10 w-16 rounded border border-line" value={bg} onChange={(e) => setBg(e.target.value)} />
            </label>
            <Choice
              label="PNG の大きさ"
              value={px}
              onChange={setPx}
              options={[
                ["256", "小（約256px）"],
                ["512", "中（約512px）"],
                ["1024", "大（約1024px・印刷向け）"],
              ]}
            />
          </div>
          {contrast < 4 && <p className="text-sm text-warn">線と背景の色が近いため、読み取れないことがあります。濃い線と明るい背景がおすすめです。</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" className={ui.buttonPrimary} disabled={!r.qr} onClick={savePng}>
              PNG で保存
            </button>
            <button type="button" className={ui.button} disabled={!r.qr} onClick={() => saveBlob("qrcode.svg", new Blob([svg], { type: "image/svg+xml" }))}>
              SVG で保存（印刷向け）
            </button>
          </div>
          {r.qr && (
            <p className={ui.note}>
              バージョン {r.qr.version}（{r.qr.modules.size}×{r.qr.modules.size} マス）・{[...payload].length} 文字
            </p>
          )}
        </div>
      </div>
      <p className={ui.note}>
        QRコードは端末の中で作り、入力した内容（Wi-Fi のパスワードを含む）はどこにも送りません。作ったQRコードは期限なしで使えます。印刷する前に、スマホのカメラで読み取れるか確かめてください。QRコードは株式会社デンソーウェーブの登録商標です。
      </p>
    </div>
  );
}
