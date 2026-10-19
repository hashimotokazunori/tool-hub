"use client";

import { useRef, useState } from "react";
import { FileDrop } from "@/components/FileDrop";
import { Choice } from "@/components/TextTransform";
import { Field, FieldGrid, Stats } from "@/components/ToolUI";
import { ui } from "@/components/styles";
import { baseName, formatBytes, saveBlob } from "@/lib/files";
import { GIF_MAX_SECONDS, GIF_TRAILER, clampRange, concatBytes, encodeRgbaFrame, encodeWav, formatTime, frameDelays, frameTimes, gifHeader, scaledSize, wavSize } from "./logic";

const PRIVACY = "ファイルはサーバーに送らず、この端末の中だけで処理します。";

/** 秒の入力欄（小数1桁） */
function SecondsInput({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) {
  return (
    <Field label={label}>
      <input className={ui.input} type="number" inputMode="decimal" min={0} max={max} step={0.1} value={Math.round(value * 10) / 10} onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value) || 0)))} />
    </Field>
  );
}

// ───────── 動画→GIF ─────────

/** 動画を指定の時刻に動かし、絵が出るまで待つ */
function seekTo(v: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      v.removeEventListener("seeked", finish);
      resolve();
    };
    v.addEventListener("seeked", finish);
    setTimeout(finish, 4000);
    v.currentTime = t;
  });
}

type Meta = { duration: number; width: number; height: number };
type GifResult = { url: string; size: number; width: number; height: number; frames: number; blob: Blob };

/** 動画をGIFに変換：区間・コマ数・横幅を選んで GIF アニメにする */
export function VideoToGif() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(5);
  const [fps, setFps] = useState<"5" | "10" | "15">("10");
  const [width, setWidth] = useState<"240" | "320" | "480">("320");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<GifResult | null>(null);
  const [msg, setMsg] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const cancel = useRef(false);

  const open = (files: File[]) => {
    const f = files.find((x) => x.type.startsWith("video/") || /\.(mp4|m4v|webm|mov|ogv)$/i.test(x.name));
    if (!f) return setMsg("動画ファイルを選んでください");
    if (url) URL.revokeObjectURL(url);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setMeta(null);
    setFile(f);
    setUrl(URL.createObjectURL(f));
    setMsg("読み込み中…");
  };

  const range = meta ? clampRange(start, end, meta.duration) : { start: 0, end: 0 };
  const size = meta ? scaledSize(meta.width, meta.height, Number(width)) : null;
  const count = meta ? frameTimes(range.start, range.end, Number(fps)).length : 0;
  const tooLong = meta && end - start > GIF_MAX_SECONDS;

  const make = async () => {
    const v = video.current;
    if (!v || !meta || !size || range.end <= range.start) return;
    setBusy(true);
    cancel.current = false;
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setMsg("");
    try {
      v.pause();
      const c = document.createElement("canvas");
      c.width = size.width;
      c.height = size.height;
      const g = c.getContext("2d", { willReadFrequently: true })!;
      g.imageSmoothingQuality = "high";
      const times = frameTimes(range.start, range.end, Number(fps));
      const delays = frameDelays(times.length, Number(fps));
      const parts: Uint8Array[] = [gifHeader(size.width, size.height)];
      for (const [i, t] of times.entries()) {
        if (cancel.current) throw new Error("中止しました");
        await seekTo(v, t);
        g.drawImage(v, 0, 0, size.width, size.height);
        parts.push(encodeRgbaFrame(g.getImageData(0, 0, size.width, size.height).data, size.width, size.height, delays[i]));
        setProgress((i + 1) / times.length);
      }
      parts.push(GIF_TRAILER);
      const blob = new Blob([concatBytes(parts) as BlobPart], { type: "image/gif" });
      setResult({ url: URL.createObjectURL(blob), size: blob.size, width: size.width, height: size.height, frames: times.length, blob });
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="動画" accept="video/*,.mp4,.webm,.mov,.m4v" onFiles={open} hint="MP4・WebM・MOV など、このブラウザで再生できる動画" />
      {url && (
        <div className="flex justify-center rounded-xl bg-field p-2">
          <video
            ref={video}
            src={url}
            controls
            muted
            playsInline
            preload="auto"
            className="block max-h-[50vh] max-w-full rounded-lg"
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (!v.videoWidth) {
                setMsg("この動画には映像がないか、このブラウザでは表示できません");
                return;
              }
              const duration = Number.isFinite(v.duration) ? v.duration : 0;
              setMeta({ duration, width: v.videoWidth, height: v.videoHeight });
              setStart(0);
              setEnd(Math.min(duration, 5));
              setMsg("");
            }}
            onError={() => setMsg("この動画はこのブラウザでは読み込めません（形式や圧縮方式が対応していない可能性があります）")}
          />
        </div>
      )}
      {meta && (
        <>
          <FieldGrid>
            <SecondsInput label={`開始（秒）／ 長さ ${formatTime(meta.duration)}`} value={start} max={meta.duration} onChange={setStart} />
            <SecondsInput label="終了（秒）" value={end} max={meta.duration} onChange={setEnd} />
            <Choice
              label="なめらかさ（1秒あたりのコマ数）"
              value={fps}
              onChange={setFps}
              options={[
                ["5", "5コマ（軽い）"],
                ["10", "10コマ"],
                ["15", "15コマ（なめらか）"],
              ]}
            />
            <Choice
              label="横幅"
              value={width}
              onChange={setWidth}
              options={[
                ["240", "240 px"],
                ["320", "320 px"],
                ["480", "480 px"],
              ]}
            />
          </FieldGrid>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={ui.button} onClick={() => video.current && setStart(video.current.currentTime)}>
              再生位置を開始にする
            </button>
            <button type="button" className={ui.button} onClick={() => video.current && setEnd(video.current.currentTime)}>
              再生位置を終了にする
            </button>
          </div>
          {tooLong && <p className="text-sm text-muted">GIFにできるのは最長 {GIF_MAX_SECONDS} 秒です。開始から {GIF_MAX_SECONDS} 秒までを使います。</p>}
          <Stats
            items={[
              { label: "使う区間", value: `${formatTime(range.start)}〜${formatTime(range.end)}` },
              { label: "コマ数", value: `${count}` },
              { label: "GIFの大きさ（px）", value: size ? `${size.width}×${size.height}` : "-" },
            ]}
          />
        </>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} disabled={!meta || busy || range.end <= range.start} onClick={make}>
          GIFを作る
        </button>
        {busy && (
          <button type="button" className={ui.button} onClick={() => (cancel.current = true)}>
            中止
          </button>
        )}
        <span className="text-sm text-muted" aria-live="polite">
          {busy ? `作成中… ${Math.round(progress * 100)}%` : msg}
        </span>
      </div>
      {busy && <progress className="h-2 w-full accent-accent" value={progress} max={1} aria-label="GIFの作成の進み具合" />}
      {result && file && (
        <section className="flex flex-col gap-3" aria-live="polite">
          <div className="flex justify-center rounded-xl bg-field p-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- 端末で作ったGIF（blob:）を表示する */}
            <img src={result.url} alt="作成したGIFアニメ" width={result.width} height={result.height} className="block h-auto max-w-full" />
          </div>
          <Stats
            items={[
              { label: "ファイルの大きさ", value: formatBytes(result.size), emphasis: true },
              { label: "大きさ（px）", value: `${result.width}×${result.height}` },
              { label: "コマ数", value: `${result.frames}` },
            ]}
          />
          <div>
            <button type="button" className={ui.buttonPrimary} onClick={() => saveBlob(`${baseName(file.name)}.gif`, result.blob)}>
              GIFを保存
            </button>
          </div>
        </section>
      )}
      <p className={ui.note}>
        GIFは1コマ256色までのため、写真のような動画では色の境目が粗く見えることがあります。また、MP4よりファイルがかなり大きくなります。重いときは横幅・コマ数・区間を小さくしてください。音声は入りません。{PRIVACY}
      </p>
    </div>
  );
}

// ───────── 動画から音声を取り出す（WAV） ─────────

type Decoded = { buffer: AudioBuffer; name: string };
type WavResult = { url: string; blob: Blob; name: string };

/** 動画から音声を取り出す（WAV）：ブラウザで音声を読み、切り出して WAV で保存する */
export function AudioConverter() {
  const [src, setSrc] = useState<Decoded | null>(null);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [channels, setChannels] = useState<"2" | "1">("2");
  const [rate, setRate] = useState<"44100" | "48000">("44100");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<WavResult | null>(null);
  const [msg, setMsg] = useState("");

  const open = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setSrc(null);
    setBusy(true);
    setMsg("音声を読み込み中…（長い動画は時間がかかります）");
    let ctx: AudioContext | null = null;
    try {
      const data = await f.arrayBuffer();
      ctx = new AudioContext();
      const buffer = await ctx.decodeAudioData(data);
      setSrc({ buffer, name: f.name });
      setStart(0);
      setEnd(buffer.duration);
      setChannels(buffer.numberOfChannels === 1 ? "1" : "2");
      setRate(buffer.sampleRate === 48000 ? "48000" : "44100");
      setMsg("");
    } catch {
      setMsg("このファイルの音声は、このブラウザでは読み込めませんでした（音声のない動画や、ブラウザが対応していない形式の可能性があります）");
    } finally {
      ctx?.close().catch(() => {});
      setBusy(false);
    }
  };

  const range = src ? clampRange(start, end, src.buffer.duration, Infinity) : { start: 0, end: 0 };
  const seconds = range.end - range.start;

  const convert = async () => {
    if (!src || seconds <= 0) return;
    setBusy(true);
    setMsg("変換中…");
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    try {
      const sr = Number(rate);
      const nch = Number(channels);
      const ctx = new OfflineAudioContext(nch, Math.max(1, Math.ceil(seconds * sr)), sr);
      const node = ctx.createBufferSource();
      node.buffer = src.buffer;
      node.connect(ctx.destination);
      node.start(0, range.start, seconds);
      const out = await ctx.startRendering();
      const ch = Array.from({ length: out.numberOfChannels }, (_, i) => out.getChannelData(i));
      const blob = new Blob([encodeWav(ch, sr) as BlobPart], { type: "audio/wav" });
      setResult({ url: URL.createObjectURL(blob), blob, name: `${baseName(src.name)}.wav` });
      setMsg(`できました（${formatBytes(blob.size)}）`);
    } catch (e) {
      setMsg(`変換できませんでした：${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <FileDrop label="動画・音声ファイル" accept="video/*,audio/*,.mp4,.mov,.m4a,.mp3,.webm,.wav,.ogg" onFiles={open} hint="MP4・MOV・WebM の動画や、MP3・M4A・WAV などの音声" />
      {src && (
        <>
          <Stats
            items={[
              { label: "長さ", value: formatTime(src.buffer.duration) },
              { label: "元のチャンネル", value: src.buffer.numberOfChannels === 1 ? "モノラル" : `${src.buffer.numberOfChannels}ch` },
              { label: "読み込んだ音の周波数", value: `${(src.buffer.sampleRate / 1000).toFixed(1)} kHz` },
            ]}
          />
          <FieldGrid>
            <SecondsInput label="開始（秒）" value={start} max={src.buffer.duration} onChange={setStart} />
            <SecondsInput label="終了（秒）" value={end} max={src.buffer.duration} onChange={setEnd} />
            <Choice
              label="チャンネル"
              value={channels}
              onChange={setChannels}
              options={[
                ["2", "ステレオ"],
                ["1", "モノラル（大きさが半分）"],
              ]}
            />
            <Choice
              label="サンプリング周波数"
              value={rate}
              onChange={setRate}
              options={[
                ["44100", "44.1 kHz（音楽CDと同じ）"],
                ["48000", "48 kHz（動画でよく使う）"],
              ]}
            />
          </FieldGrid>
          <Stats
            items={[
              { label: "取り出す長さ", value: formatTime(seconds), emphasis: true },
              { label: "WAVの大きさの目安", value: formatBytes(wavSize(seconds, Number(rate), Number(channels))) },
            ]}
          />
        </>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={ui.buttonPrimary} disabled={!src || busy || seconds <= 0} onClick={convert}>
          WAVに変換
        </button>
        <span className="text-sm text-muted" aria-live="polite">
          {msg}
        </span>
      </div>
      {result && (
        <section className="flex flex-col gap-3" aria-label="変換した音声">
          <audio src={result.url} controls className="w-full" />
          <div>
            <button type="button" className={ui.buttonPrimary} onClick={() => saveBlob(result.name, result.blob)}>
              WAVを保存
            </button>
          </div>
        </section>
      )}
      <p className={ui.note}>
        保存形式は WAV（16ビット・非圧縮）です。MP3 への変換には専用の圧縮処理が必要なため、このツールでは扱っていません（WAV は多くの編集ソフトやスマホで再生できます）。WAV は1分あたりステレオ44.1kHzで約10MBと大きくなります。ブラウザが読み込めない形式のファイルは変換できません。{PRIVACY}
      </p>
    </div>
  );
}
