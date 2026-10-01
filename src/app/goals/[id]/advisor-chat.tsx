"use client";

import { useState } from "react";
import type { AdvisorMessage } from "@/lib/actions/advisor";

export function AdvisorChat({ goalTitle }: { goalTitle: string }) {
  const [messages, setMessages] = useState<AdvisorMessage[]>([
    {
      role: "ai",
      content: `سلام! دیدم روی «${goalTitle}» کار می‌کنی. پیشنهاد می‌کنم صبح‌ها یه جلسه کوتاه و ثابت داشته باشی تا ریتمت بشکنه.`,
      chips: ["تغییر ساعت یادآوری", "برنامه این هفته"],
    },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: "user", content: input.trim() }]);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-3 border-b border-line pb-4">
        <div className="grid size-9 place-items-center rounded-full bg-accent font-bold text-ink">AI</div>
        <div>
          <b className="block text-sm">مشاور برنامه‌ریزی</b>
          <span className="text-xs text-muted">بر اساس گروه شخصیتی تو</span>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === "ai"
                ? "self-start rounded-br-sm border border-line bg-surface"
                : "self-end rounded-bl-sm bg-accent text-ink"
            }`}
          >
            {msg.content}
            {msg.chips?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {msg.chips.map((c) => (
                  <span key={c} className="rounded-full bg-raised/60 px-2 py-0.5 text-xs text-muted">
                    {c}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="پیام بنویس..."
          className="flex-1 rounded-full border border-line bg-surface px-4 py-2 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button onClick={send} className="grid size-9 place-items-center rounded-full bg-accent text-ink">
          ↑
        </button>
      </div>
    </div>
  );
}
