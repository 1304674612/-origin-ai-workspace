"use client";

import { DragEvent, useEffect, useRef, useState } from "react";
import { FileArchive, FileText, ImageIcon, Loader2, UploadCloud } from "lucide-react";
import type { FileAsset } from "@origin/shared";
import { Badge } from "@origin/ui/components/badge";
import { Button } from "@origin/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@origin/ui/components/card";
import { cn } from "@origin/ui/lib/utils";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedPage } from "@/components/layout/protected-page";
import { api } from "@/lib/api";

function iconFor(file: FileAsset) {
  if (file.content_type?.startsWith("image/")) return ImageIcon;
  if (file.filename.endsWith(".pdf")) return FileArchive;
  return FileText;
}

export function FilesClient() {
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    try {
      setFiles(await api.files());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    }
  }

  async function upload(file: File) {
    setLoading(true);
    setError(null);
    try {
      await api.uploadFile(file);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files.item(0);
    if (file) void upload(file);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <ProtectedPage>
      <AppShell>
        <div className="min-h-screen px-5 py-8 md:px-10">
          <PageHeader
            eyebrow="Files"
            title="Local knowledge intake"
            description="Upload PDFs, Markdown, text, DOCX, and images. Parsed text is indexed into the RAG document schema when available."
            action={
              <Button onClick={() => inputRef.current?.click()} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Upload file
              </Button>
            }
          />
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.txt,.md,.markdown,.docx,.png,.jpg,.jpeg,.webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />

          {error ? <div className="mt-6 rounded-md border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</div> : null}

          <div
            className={cn(
              "mt-8 grid min-h-56 place-items-center rounded-lg border border-dashed border-white/15 bg-white/[0.035] p-8 text-center transition",
              dragging && "border-cyan-300/60 bg-cyan-300/10"
            )}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <div>
              <UploadCloud className="mx-auto h-10 w-10 text-cyan-200" />
              <h2 className="mt-4 text-lg font-semibold text-white">Drop files to parse and index</h2>
              <p className="mt-2 text-sm text-zinc-400">TXT, Markdown and DOCX parse immediately. PDF and OCR adapters are ready for extension.</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-3">
            {files.map((file) => {
              const Icon = iconFor(file);
              return (
                <Card key={file.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/8">
                          <Icon className="h-5 w-5 text-cyan-200" />
                        </span>
                        <div className="min-w-0">
                          <CardTitle className="truncate text-sm">{file.filename}</CardTitle>
                          <CardDescription>{(file.size_bytes / 1024).toFixed(1)} KB</CardDescription>
                        </div>
                      </div>
                      <Badge variant={file.status === "parsed" ? "success" : file.status === "failed" ? "warning" : "secondary"}>
                        {file.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-28 overflow-hidden rounded-md border border-white/10 bg-black/25 p-3 text-xs leading-5 text-zinc-400">
                      {file.extracted_text ? file.extracted_text.slice(0, 320) : "No text preview available yet."}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </AppShell>
    </ProtectedPage>
  );
}
