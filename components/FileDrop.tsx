"use client";

import { useId, useState } from "react";

/** ファイルをドロップ、またはクリックして選ぶ欄。ファイルは端末の中だけで扱う */
export function FileDrop({ label, accept, multiple, onFiles, hint }: { label: string; accept?: string; multiple?: boolean; onFiles: (files: File[]) => void; hint?: string }) {
  const id = useId();
  const [over, setOver] = useState(false);
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
