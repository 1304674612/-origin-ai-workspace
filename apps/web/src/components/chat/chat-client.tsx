"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Pencil, Plus, RefreshCw, Search, Send, Square, Trash2, User, Sparkles, MessageSquareText, Globe } from "lucide-react";
import { Button } from "@origin/ui/components/button";
import { Card } from "@origin/ui/components/card";
import { Input } from "@origin/ui/components/input";
import { Select } from "@origin/ui/components/select";
import { Slider } from "@origin/ui/components/slider";
import { Textarea } from "@origin/ui/components/textarea";
import type { ChatMessage, Conversation, ConversationListItem, ModelInfo } from "@origin/shared";
import { cn } from "@origin/ui/lib/utils";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedPage } from "@/components/layout/protected-page";
import { MarkdownContent } from "@/components/chat/markdown-content";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";

type LocalMessage = Pick<ChatMessage, "role" | "content"> & { id: string; pending?: boolean };

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatContextWindow(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
  return `${tokens}`;
}

interface ModelGroup {
  provider: string;
  label: string;
  models: ModelInfo[];
}

export function ChatClient() {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [provider, setProvider] = useState("deepseek");
  const [model, setModel] = useState("deepseek-chat");
  const [systemPrompt, setSystemPrompt] = useState("You are a precise, practical AI copilot inside ORIGIN AI Workspace.");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const loadingRef = useRef(false);
  const conversationIdRef = useRef<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  const filteredConversations = useMemo(
    () => conversations.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())),
    [conversations, search]
  );

  const currentModel = useMemo(() => models.find((m) => m.id === model), [models, model]);

  const modelGroups = useMemo((): ModelGroup[] => {
    const groups: Record<string, ModelGroup> = {
      openai: { provider: "openai", label: "OpenAI", models: [] },
      deepseek: { provider: "deepseek", label: "DeepSeek", models: [] },
      qwen: { provider: "qwen", label: "Qwen", models: [] },
      compatible: { provider: "compatible", label: "Compatible", models: [] },
    };
    for (const m of models) {
      groups[m.provider]?.models.push(m);
    }
    return Object.values(groups).filter((g) => g.models.length > 0);
  }, [models]);

  const loadConversations = useCallback(async () => {
    setConversations(await api.conversations());
  }, []);

  async function loadConversation(id: string) {
    const conversation: Conversation = await api.conversation(id);
    setConversationId(conversation.id);
    setProvider(conversation.provider);
    setModel(conversation.model);
    setSystemPrompt(conversation.system_prompt ?? "");
    setTemperature(conversation.temperature);
    setMaxTokens(conversation.max_tokens);
    setMessages(conversation.messages.length ? conversation.messages : []);
  }

  useEffect(() => {
    async function boot() {
      try {
        const [modelList] = await Promise.all([api.models(), loadConversations()]);
        setModels(modelList);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize chat");
      }
    }
    void boot();
  }, [loadConversations]);

  const newConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setInput("");
  }, []);

  async function deleteConversation(id: string, event: React.MouseEvent) {
    event.stopPropagation();
    try {
      await api.deleteConversation(id);
      if (conversationId === id) newConversation();
      await loadConversations();
      toast("Conversation deleted", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  }

  async function startRename(id: string, title: string, event: React.MouseEvent) {
    event.stopPropagation();
    setRenaming(id);
    setRenameInput(title);
  }

  async function submitRename(id: string) {
    if (!renameInput.trim()) {
      setRenaming(null);
      return;
    }
    try {
      await api.updateConversation(id, { title: renameInput.trim() });
      await loadConversations();
      toast("Conversation renamed", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Rename failed", "error");
    }
    setRenaming(null);
  }

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
    setMessages((current) =>
      current.map((item) => (item.pending ? { ...item, pending: false } : item))
    );
  }, []);

  const submit = useCallback(async (messageText: string = input) => {
    const trimmed = messageText.trim();
    if (!trimmed || loadingRef.current) return;
    loadingRef.current = true;
    setInput("");
    setLoading(true);
    setError(null);

    const userMessage: LocalMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const assistantId = crypto.randomUUID();
    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: "assistant", content: "", pending: true }
    ]);

    const abort = new AbortController();
    abortRef.current = abort;
    let activeConversationId = conversationIdRef.current;

    try {
      await api.streamChat(
        {
          conversation_id: conversationIdRef.current,
          message: trimmed,
          provider,
          model,
          system_prompt: systemPrompt,
          temperature,
          max_tokens: maxTokens
        },
        {
          onMeta: (id) => {
            activeConversationId = id;
            conversationIdRef.current = id;
            setConversationId(id);
          },
          onToken: (delta) => {
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantId ? { ...item, content: item.content + delta, pending: false } : item
              )
            );
          },
          onError: (detail) => {
            setError(detail);
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantId ? { ...item, content: detail, pending: false } : item
              )
            );
          },
          onDone: () => {
            setMessages((current) => current.map((item) => (item.id === assistantId ? { ...item, pending: false } : item)));
          }
        },
        abort.signal
      );
      await loadConversations();
      if (activeConversationId) setConversationId(activeConversationId);
    } catch (err) {
      if (abort.signal.aborted) return;
      const msg = err instanceof Error ? err.message : "Chat failed";
      setError(msg);
      toast(msg, "error");
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? { ...item, content: "Generation failed. Check provider configuration and API availability.", pending: false }
            : item
        )
      );
    } finally {
      setLoading(false);
      loadingRef.current = false;
      abortRef.current = null;
    }
  }, [input, loadConversations, maxTokens, model, provider, systemPrompt, toast, temperature]);

  const regenerate = useCallback(async () => {
    const lastUser = [...messages].reverse().find((message) => message.role === "user");
    if (lastUser) await submit(lastUser.content);
  }, [messages, submit]);

  const onSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  }, [submit]);

  return (
    <ProtectedPage>
      <AppShell>
        <div className="grid min-h-screen lg:grid-cols-[300px_1fr]">
          {/* ── Sidebar ── */}
          <aside className="hidden border-r border-white/10 bg-zinc-950/80 p-4 lg:flex lg:flex-col">
            <Button className="w-full" onClick={newConversation}>
              <Plus className="h-4 w-4" />
              New chat
            </Button>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="border-white/10 bg-white/[0.04] pl-9 text-sm"
                placeholder="Search conversations"
              />
            </div>

            <div className="mt-4 flex-1 space-y-1 overflow-y-auto">
              {filteredConversations.length === 0 && (
                <p className="px-2 py-8 text-center text-xs text-zinc-500">
                  {search ? "No conversations match your search." : "No conversations yet. Start a new chat above."}
                </p>
              )}
              {filteredConversations.map((item) => (
                <div key={item.id} className="group relative">
                  {renaming === item.id ? (
                    <div className="flex gap-1 rounded-lg bg-white/10 px-3 py-2">
                      <Input
                        className="h-7 flex-1 border-white/10 bg-white/[0.04] text-sm"
                        value={renameInput}
                        onChange={(e) => setRenameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void submitRename(item.id);
                          if (e.key === "Escape") setRenaming(null);
                        }}
                        onBlur={() => void submitRename(item.id)}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => void loadConversation(item.id)}
                      className={cn(
                        "w-full rounded-lg px-3 py-2.5 text-left transition",
                        item.id === conversationId
                          ? "bg-white/10 text-white"
                          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                      )}
                    >
                      <div className="line-clamp-1 text-sm font-medium">{item.title}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                        <span>{item.provider} / {item.model}</span>
                        <span>·</span>
                        <span>{timeAgo(item.updated_at)}</span>
                      </div>
                    </button>
                  )}
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden gap-0.5 group-hover:flex">
                    <button
                      className="rounded p-1 text-zinc-500 hover:bg-white/10 hover:text-white"
                      onClick={(e) => void startRename(item.id, item.title, e)}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      className="rounded p-1 text-zinc-500 hover:bg-rose-500/20 hover:text-rose-300"
                      onClick={(e) => void deleteConversation(item.id, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* ── Main chat area ── */}
          <section className="flex h-screen flex-col" style={{height:"100dvh"}}>
            {/* Header */}
            <header className="flex items-center justify-between border-b border-white/10 bg-zinc-950/70 px-5 py-3 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Select
                    value={provider}
                    onChange={(event) => {
                      setProvider(event.target.value);
                      const firstModel = models.find((m) => m.provider === event.target.value);
                      if (firstModel) setModel(firstModel.id);
                    }}
                    className="w-32 border-white/10 bg-white/[0.04] text-sm"
                  >
                    {modelGroups.map((g) => (
                      <option key={g.provider} value={g.provider}>{g.label}</option>
                    ))}
                  </Select>
                  <Select value={model} onChange={(event) => setModel(event.target.value)} className="w-48 border-white/10 bg-white/[0.04] text-sm">
                    {modelGroups
                      .find((g) => g.provider === provider)
                      ?.models.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({formatContextWindow(item.context_window)} ctx)
                        </option>
                      ))}
                  </Select>
                </div>
                {currentModel && (
                  <span className="hidden text-xs text-zinc-500 xl:inline">
                    {currentModel.context_window.toLocaleString()} token context window
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Button variant="ghost" size="sm" onClick={() => void regenerate()} disabled={loading}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Regenerate
                </Button>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              {error ? (
                <div className="mx-auto mt-4 max-w-3xl rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
                  {error}
                </div>
              ) : null}

              {messages.length === 0 ? (
                /* Empty state */
                <div className="flex h-full flex-col items-center justify-center px-4 pb-32">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
                    <Sparkles className="h-8 w-8 text-cyan-300" />
                  </div>
                  <h2 className="mt-6 text-xl font-semibold text-white">What can I help with?</h2>
                  <p className="mt-2 max-w-md text-center text-sm text-zinc-400">
                    Ask a question, brainstorm ideas, analyze data, or request code. ORIGIN AI streams responses with full Markdown support.
                  </p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {[
                      { icon: Globe, text: "Explain how Docker Compose networking works" },
                      { icon: MessageSquareText, text: "Write a FastAPI endpoint with async streaming" },
                    ].map((suggestion) => (
                      <button
                        key={suggestion.text}
                        onClick={() => {
                          setInput(suggestion.text);
                        }}
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left text-sm text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                      >
                        <suggestion.icon className="h-4 w-4 shrink-0 text-zinc-500" />
                        <span className="line-clamp-2">{suggestion.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-3xl space-y-1 px-4 py-6">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="border-t border-white/10 bg-zinc-950/80 px-4 py-4 backdrop-blur">
              <form onSubmit={onSubmit} className="mx-auto max-w-3xl">
                <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition focus-within:border-cyan-300/30 focus-within:bg-white/[0.07]">
                  <Textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Ask anything..."
                    className="min-h-12 resize-none border-0 bg-transparent p-0 text-sm placeholder:text-zinc-500 focus-visible:ring-0"
                    rows={1}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void submit();
                      }
                    }}
                  />
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-zinc-600">
                      {provider} / {model}
                      {currentModel ? ` · ${formatContextWindow(currentModel.context_window)} ctx` : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      {loading ? (
                        <Button type="button" variant="ghost" size="sm" onClick={stopGeneration}>
                          <Square className="h-3.5 w-3.5" /> Stop
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          size="icon"
                          className={cn(
                            "h-8 w-8 transition-all",
                            input.trim()
                              ? "bg-cyan-500 text-zinc-950 hover:bg-cyan-400"
                              : "opacity-40"
                          )}
                          disabled={!input.trim()}
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </section>

          {/* ── Settings panel ── */}
          <aside className="hidden border-l border-white/10 bg-zinc-950/80 p-4 xl:block">
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-white">System prompt</h3>
              <Textarea
                className="mt-3 min-h-40 text-xs"
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
                placeholder="Set a custom system prompt..."
              />
            </Card>
            <Card className="mt-4 p-4">
              <div className="flex justify-between text-sm text-zinc-300">
                <span>Temperature</span>
                <span className="tabular-nums">{temperature.toFixed(1)}</span>
              </div>
              <Slider
                className="mt-3"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(event) => setTemperature(Number(event.target.value))}
              />
              <div className="mt-5 flex justify-between text-sm text-zinc-300">
                <span>Max tokens</span>
                <span className="tabular-nums">{maxTokens.toLocaleString()}</span>
              </div>
              <Input
                className="mt-3"
                type="number"
                min={1}
                max={128000}
                value={maxTokens}
                onChange={(event) => setMaxTokens(Number(event.target.value))}
              />
            </Card>
          </aside>
        </div>
      </AppShell>
    </ProtectedPage>
  );
}

function MessageBubble({ message }: { message: LocalMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3 py-2", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-cyan-500/20 text-cyan-300" : "bg-zinc-700/50 text-zinc-400"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      <div className={cn("group flex max-w-[75%] flex-col gap-1", isUser && "items-end")}>
        <div className="flex items-center gap-2 px-1 text-xs text-zinc-500">
          <span>{isUser ? "You" : "ORIGIN AI"}</span>
          <button
            className="opacity-0 transition hover:text-zinc-300 group-hover:opacity-100"
            onClick={() => void navigator.clipboard.writeText(message.content)}
            aria-label="Copy"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-md bg-zinc-700 text-zinc-100"
              : "rounded-tl-md bg-zinc-800/60 text-zinc-200"
          )}
        >
          {message.pending && !message.content ? (
            <div className="flex items-center gap-1.5 py-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
            </div>
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>
      </div>
    </div>
  );
}
