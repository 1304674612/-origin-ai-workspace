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
      className="prose prose-invert max-w-none prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-white/10 prose-code:text-cyan-200 prose-a:text-cyan-300"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Register highlight.js languages if needed
try {
  hljs.configure({});
} catch {}
