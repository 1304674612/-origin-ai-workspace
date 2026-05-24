"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Loader2, Plus, Sparkles, X } from "lucide-react";
import { Button } from "@origin/ui/components/button";
import { Input } from "@origin/ui/components/input";
import { Textarea } from "@origin/ui/components/textarea";
import { api, getStoredUser } from "@/lib/api";
import { useToast } from "@/lib/toast";

interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export function DesktopPet() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"create" | "browse">("create");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [viewingDoc, setViewingDoc] = useState<KnowledgeDoc | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const user = getStoredUser();

  const loadDocs = useCallback(async () => {
    if (!user) return;
    try {
      const result = await api.knowledgeList();
      setDocs(result.items);
    } catch {}
  }, [user]);

  useEffect(() => {
    if (open && tab === "browse") loadDocs();
  }, [open, tab, loadDocs]);

  // Generate content from title
  async function generate() {
    if (!title.trim()) return;
    setGenerating(true);
    try {
      const result = await api.knowledgeGenerate(title.trim());
      setContent(result.content);
      toast("Content generated", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Generation failed", "error");
    } finally {
      setGenerating(false);
    }
  }

  // Save to knowledge base
  async function save() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await api.knowledgeSave({ title: title.trim(), content: content.trim() });
      toast("Saved to knowledge base", "success");
      setTitle("");
      setContent("");
      setTab("browse");
      loadDocs();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <>
      {/* Floating mascot button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-white/10 shadow-2xl shadow-cyan-300/10 transition hover:scale-110 active:scale-95 hover:ring-cyan-300/30"
        style={{ animation: "pet-float 3s ease-in-out infinite" }}
      >
        <div className="relative">
          <Sparkles className="h-6 w-6 text-cyan-300" />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-cyan-400" style={{ animation: "pet-pulse 2s ease-in-out infinite" }} />
        </div>
      </button>

      {/* Knowledge panel */}
      {open && (
          <div
            ref={containerRef}
            className="fixed bottom-24 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/40"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-cyan-200" />
                <h3 className="text-sm font-semibold text-white">Knowledge Base</h3>
              </div>
              <button onClick={() => { setOpen(false); setViewingDoc(null); }} className="rounded-md p-1 text-zinc-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => { setTab("create"); setViewingDoc(null); }}
                className={`flex-1 px-4 py-2.5 text-xs font-medium transition ${tab === "create" ? "border-b-2 border-cyan-300 text-cyan-200" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <Plus className="mr-1.5 inline h-3 w-3" />
                Create
              </button>
              <button
                onClick={() => { setTab("browse"); setViewingDoc(null); }}
                className={`flex-1 px-4 py-2.5 text-xs font-medium transition ${tab === "browse" ? "border-b-2 border-cyan-300 text-cyan-200" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <BookOpen className="mr-1.5 inline h-3 w-3" />
                Browse
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[500px] overflow-y-auto p-5">
              {viewingDoc ? (
                /* View mode */
                <div>
                  <button onClick={() => setViewingDoc(null)} className="mb-4 text-xs text-zinc-500 hover:text-zinc-300">← Back</button>
                  <h2 className="text-lg font-semibold text-white">{viewingDoc.title}</h2>
                  <div className="mt-4 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">{viewingDoc.content}</div>
                </div>
              ) : tab === "create" ? (
                /* Create tab */
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">Document title</label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Docker Compose networking deep dive"
                      className="border-white/10 bg-white/[0.04]"
                    />
                  </div>
                  {!content ? (
                    <Button
                      className="w-full"
                      onClick={generate}
                      disabled={!title.trim() || generating}
                    >
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {generating ? "Researching..." : "Generate with AI"}
                    </Button>
                  ) : null}
                  {content ? (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">Generated content</label>
                      <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-48 border-white/10 bg-white/[0.04] text-sm leading-relaxed"
                      />
                      <div className="mt-3 flex gap-2">
                        <Button onClick={save} disabled={saving} className="flex-1">
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Save to knowledge base
                        </Button>
                        <Button variant="ghost" onClick={() => setContent("")}>Clear</Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                /* Browse tab */
                <div className="space-y-2">
                  {docs.length === 0 ? (
                    <p className="py-8 text-center text-sm text-zinc-500">
                      No documents yet. Create your first one.
                    </p>
                  ) : (
                    docs.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => setViewingDoc(doc)}
                        className="w-full rounded-lg border border-white/10 px-4 py-3 text-left transition hover:border-cyan-300/20 hover:bg-white/[0.04]"
                      >
                        <div className="text-sm font-medium text-white">{doc.title}</div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {new Date(doc.created_at).toLocaleDateString()} · {doc.content.length} chars
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
    </>
  );
}
