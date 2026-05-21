"use client";

import { useMemo } from "react";
import { marked } from "marked";
import hljs from "highlight.js";

// Configure marked to use highlight.js
marked.setOptions({
  breaks: true,
  gfm: true,
});

export function MarkdownContent({ content }: { content: string }) {
  const html = useMemo(() => {
    if (!content) return "";
    return marked.parse(content, {
      async: false,
    }) as string;
  }, [content]);

  return (
    <div
      className="text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap"
    >
      {content}
    </div>
  );
}

// Register highlight.js languages if needed
try {
  hljs.configure({});
} catch {}
