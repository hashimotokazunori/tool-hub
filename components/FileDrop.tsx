"use client";

import { useEffect, useId, useRef, useState } from "react";
import { takeHandoff } from "@/lib/handoff";

/** ファイルをドロップ、またはクリックして選ぶ欄。ファイルは端末の中だけで扱う */
export function FileDrop({ label, accept, multiple, onFiles, hint }: { label: string; accept?: string; multiple?: boolean; onFiles: (files: File[]) => void; hint?: string }) {
  const id = useId();
  const [over, setOver] = useState(false);
  const [received, setReceived] = useState<string | null>(null);
  // 前のツールの「次のツールで使う」で渡されたファイルがあれば、最初に1回だけ読み込む
  const took = useRef(false);
  useEffect(() => {
    if (took.current) return;
    took.current = true;
    const files = takeHandoff(accept);
    if (!files) return;
    const use = multiple ? files : files.slice(0, 1);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 前のツールから渡されたファイル（このページの外の値）を1回だけ受け取る
    setReceived(use.map((f) => f.name).join("、"));
    onFiles(use);
  }, [accept, multiple, onFiles]);
  return (
    <label
      htmlFor={id}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files.length) onFiles([...e.dataTransfer.files]);
      }}
      className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed px-4 py-7 text-center text-sm transition focus-within:outline-2 focus-within:outline-accent ${over ? "border-accent bg-accent-soft" : "border-line bg-field hover:border-accent"}`}
    >
      <b className="text-ink">{label}をドロップ</b>
      <span className="text-muted">またはクリックして選択{multiple ? "（複数可）" : ""}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
      {received && <span className="mt-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">前のツールの結果を読み込みました：{received}</span>}
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) onFiles([...e.target.files]);
          e.target.value = "";
        }}
      />
    </label>
  );
}
