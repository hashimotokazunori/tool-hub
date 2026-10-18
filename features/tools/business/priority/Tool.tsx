"use client";

import { useEffect, useState } from "react";
import { ui } from "@/components/styles";

type Task = { id: number; text: string; urgent: boolean; important: boolean };
const QUADRANTS = [
  { key: "do", title: "今すぐやる", sub: "緊急 × 重要", match: (t: Task) => t.urgent && t.important, tone: "border-warn" },
  { key: "plan", title: "計画してやる", sub: "重要だが緊急でない", match: (t: Task) => !t.urgent && t.important, tone: "border-accent" },
  { key: "delegate", title: "任せる・短く済ませる", sub: "緊急だが重要でない", match: (t: Task) => t.urgent && !t.important, tone: "border-line" },
  { key: "drop", title: "やめる・後回し", sub: "どちらでもない", match: (t: Task) => !t.urgent && !t.important, tone: "border-line" },
];
const STORE = "task-priority";

/** アイゼンハワー・マトリクス。やることはこの端末にだけ保存する */
export default function TaskPriority() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [text, setText] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(true);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) ?? "[]");
      if (Array.isArray(saved) && saved.length) queueMicrotask(() => setTasks(saved));
    } catch {
      /* 保存を使えない環境ではそのまま */
    }
  }, []);
  const update = (next: Task[]) => {
    setTasks(next);
    try {
      localStorage.setItem(STORE, JSON.stringify(next));
    } catch {
      /* 保存できなくても使える */
    }
  };
  const add = () => {
    if (!text.trim()) return;
    update([...tasks, { id: Date.now(), text: text.trim(), urgent, important }]);
    setText("");
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input className={`${ui.input} min-w-0 flex-1`} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="やること（例：見積書を作る）" aria-label="やること" />
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-accent" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
          緊急
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-accent" checked={important} onChange={(e) => setImportant(e.target.checked)} />
          重要
        </label>
        <button type="button" className={ui.buttonPrimary} onClick={add}>
          追加
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {QUADRANTS.map((q) => (
          <section key={q.key} className={`flex min-h-36 flex-col gap-2 rounded-xl border-2 bg-field p-3 ${q.tone}`} aria-label={q.title}>
            <div>
              <b>{q.title}</b>
              <p className="text-xs text-muted">{q.sub}</p>
            </div>
            <ul className="flex flex-col gap-1.5">
              {tasks.filter(q.match).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 rounded-lg bg-panel px-3 py-1.5 text-sm">
                  <span className="min-w-0 break-words">{t.text}</span>
                  <button type="button" className={`${ui.button} shrink-0 px-2 py-0.5 text-xs`} onClick={() => update(tasks.filter((x) => x.id !== t.id))} aria-label={`「${t.text}」を完了にする`}>
                    完了
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className={ui.button} disabled={!tasks.length} onClick={() => update([])}>
          すべて消す
        </button>
        <span className={ui.note}>やることは、この端末のブラウザにだけ保存されます。</span>
      </div>
    </div>
  );
}
