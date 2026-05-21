"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

function MarkdownContentInner({ content, streaming = false }: { content: string; streaming?: boolean }) {
  return (
    <div
      translate="no"
      className="notranslate prose prose-invert max-w-none break-words text-sm leading-relaxed text-zinc-200 prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:border prose-pre:border-white/10 prose-pre:bg-[#0d1117] prose-pre:p-4 prose-code:break-words prose-code:text-cyan-100"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={streaming ? [] : [rehypeHighlight]}
        components={{
          a: ({ children, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export const MarkdownContent = memo(MarkdownContentInner);
