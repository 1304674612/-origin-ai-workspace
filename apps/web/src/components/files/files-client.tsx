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
import { useToast } from "@/lib/toast";

function iconFor(file: FileAsset) {
  if (file.content_type?.startsWith("image/")) return ImageIcon;
  if (file.filename.endsWith(".pdf")) return FileArchive;
  return FileText;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesClient() {
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  async function load() {
    try {
      setFiles((await api.files()).items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    }
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const list = Array.from(fileList);
    if (list.length === 0) return;
    setUploading(list.length);
    setError(null);
    let ok = 0;
    for (const file of list) {
      try {
        await api.uploadFile(file);
        ok++;
      } catch {
        // continue with remaining files
      }
    }
    await load();
    setUploading(0);
    if (ok === list.length) {
      toast(`${ok} file${ok > 1 ? "s" : ""} uploaded`, "success");
    } else if (ok > 0) {
      toast(`${ok}/${list.length} files uploaded`, "success");
    } else {
      toast("Upload failed", "error");
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void uploadFiles(event.dataTransfer.files);
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
              <Button onClick={() => inputRef.current?.click()} disabled={uploading > 0}>
                {uploading > 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                {uploading > 0 ? `Uploading ${uploading}...` : "Upload files"}
              </Button>
            }
          />
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.txt,.md,.markdown,.docx,.png,.jpg,.jpeg,.webp"
            onChange={(event) => {
              if (event.target.files) void uploadFiles(event.target.files);
              event.target.value = "";
            }}
          />

          {error ? (
            <div className="mt-6 rounded-lg border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</div>
          ) : null}

          <div
            className={cn(
              "mt-8 grid min-h-48 place-items-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center transition",
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
              <UploadCloud className="mx-auto h-10 w-10 text-cyan-300/60" />
              <h2 className="mt-4 text-lg font-semibold text-white">Drop files to parse and index</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Drag and drop or click to browse. TXT, Markdown and DOCX parse immediately.
              </p>
              <Button className="mt-5" variant="secondary" onClick={() => inputRef.current?.click()}>
                Browse files
              </Button>
            </div>
          </div>

          {files.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {files.map((file) => {
                const Icon = iconFor(file);
                return (
                  <Card key={file.id} className="group transition hover:border-white/20">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/8">
                            <Icon className="h-5 w-5 text-cyan-200" />
                          </span>
                          <div className="min-w-0">
                            <CardTitle className="truncate text-sm">{file.filename}</CardTitle>
                            <CardDescription>{formatSize(file.size_bytes)}</CardDescription>
                          </div>
                        </div>
                        <Badge
                          variant={
                            file.status === "parsed" ? "success"
                            : file.status === "failed" ? "warning"
                            : "secondary"
                          }
                        >
                          {file.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-28 overflow-hidden rounded-lg border border-white/10 bg-black/25 p-3 text-xs leading-5 text-zinc-400">
                        {file.extracted_text ? file.extracted_text.slice(0, 320) : "No text preview available yet."}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center py-12 text-center">
              <FileText className="h-8 w-8 text-zinc-600" />
              <p className="mt-3 text-sm text-zinc-500">No files uploaded yet. Drag and drop files above.</p>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedPage>
  );
}
