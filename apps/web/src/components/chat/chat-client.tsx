"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Loader2, Plus, RefreshCw, Search, Send, Square, WandSparkles } from "lucide-react";
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
import { api } from "@/lib/api";

type LocalMessage = Pick<ChatMessage, "role" | "content"> & { id: string; pending?: boolean };

const welcome: LocalMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome to ORIGIN AI Workspace. Choose a provider, adjust generation settings, and start a streaming chat."
};

export function ChatClient() {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([welcome]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [systemPrompt, setSystemPrompt] = useState("You are a precise, practical AI copilot inside ORIGIN AI Workspace.");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const filteredConversations = useMemo(
    () => conversations.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())),
    [conversations, search]
  );

  async function loadConversations() {
    setConversations(await api.conversations());
  }

  async function loadConversation(id: string) {
    const conversation: Conversation = await api.conversation(id);
    setConversationId(conversation.id);
    setProvider(conversation.provider);
    setModel(conversation.model);
    setSystemPrompt(conversation.system_prompt ?? "");
    setTemperature(conversation.temperature);
    setMaxTokens(conversation.max_tokens);
    setMessages(conversation.messages.length ? conversation.messages : [welcome]);
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
  }, []);

  function newConversation() {
    setConversationId(null);
    setMessages([welcome]);
    setInput("");
  }

  function stopGeneration() {
    abortRef.current?.abort();
    setLoading(false);
  }

  async function submit(messageText: string = input) {
    const trimmed = messageText.trim();
    if (!trimmed || loading) return;
    setInput("");
    setLoading(true);
    setError(null);

    const userMessage: LocalMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const assistantId = crypto.randomUUID();
    setMessages((current) => [
      ...current.filter((item) => item.id !== "welcome"),
      userMessage,
      { id: assistantId, role: "assistant", content: "", pending: true }
    ]);

    const abort = new AbortController();
    abortRef.current = abort;
    let activeConversationId = conversationId;

    try {
      await api.streamChat(
        {
          conversation_id: conversationId,
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
      setError(err instanceof Error ? err.message : "Chat failed");
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? { ...item, content: "Generation failed. Check provider configuration and API availability.", pending: false }
            : item
        )
      );
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  async function regenerate() {
    const lastUser = [...messages].reverse().find((message) => message.role === "user");
    if (lastUser) await submit(lastUser.content);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  return (
    <ProtectedPage>
      <AppShell>
        <div className="grid min-h-screen lg:grid-cols-[320px_1fr]">
          <aside className="hidden border-r border-white/10 bg-black/20 p-4 lg:block">
            <div className="flex items-center gap-2">
              <Button className="flex-1" onClick={newConversation}>
                <Plus className="h-4 w-4" />
                New chat
              </Button>
            </div>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search chats" />
            </div>
            <div className="mt-4 space-y-2">
              {filteredConversations.map((item) => (
                <button
                  key={item.id}
                  onClick={() => void loadConversation(item.id)}
                  className={cn(
                    "w-full rounded-md border border-transparent p-3 text-left text-sm text-zinc-400 transition hover:border-white/10 hover:bg-white/[0.04] hover:text-white",
                    item.id === conversationId && "border-cyan-300/25 bg-cyan-300/8 text-white"
                  )}
                >
                  <div className="line-clamp-1 font-medium">{item.title}</div>
                  <div className="mt-1 text-xs text-zinc-500">{item.provider} / {item.model}</div>
                </button>
              ))}
            </div>
          </aside>

          <section className="flex min-h-screen flex-col">
            <header className="border-b border-white/10 bg-zinc-950/70 p-4 backdrop-blur-xl">
              <div className="grid gap-3 xl:grid-cols-[1fr_220px_220px]">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <WandSparkles className="h-4 w-4 text-cyan-200" />
                    AI Chat
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">Streaming Markdown chat with provider controls.</p>
                </div>
                <Select value={provider} onChange={(event) => setProvider(event.target.value)}>
                  <option value="openai">OpenAI</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="qwen">Qwen</option>
                  <option value="compatible">Compatible</option>
                </Select>
                <Select value={model} onChange={(event) => setModel(event.target.value)}>
                  {models.map((item) => (
                    <option key={`${item.provider}-${item.id}`} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </div>
            </header>

            <div className="grid flex-1 overflow-hidden xl:grid-cols-[1fr_320px]">
              <div className="flex min-h-0 flex-col">
                <div className="flex-1 space-y-5 overflow-y-auto p-4 md:p-8">
                  {error ? <div className="rounded-md border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">{error}</div> : null}
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                </div>
                <form onSubmit={onSubmit} className="border-t border-white/10 bg-zinc-950/80 p-4 backdrop-blur">
                  <div className="mx-auto flex max-w-4xl gap-3">
                    <Textarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      placeholder="Ask ORIGIN anything..."
                      className="min-h-14 resize-none"
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void submit();
                        }
                      }}
                    />
                    {loading ? (
                      <Button type="button" variant="destructive" size="icon" onClick={stopGeneration}>
                        <Square className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button type="submit" size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="mx-auto mt-3 flex max-w-4xl justify-end">
                    <Button type="button" variant="ghost" size="sm" onClick={() => void regenerate()} disabled={loading}>
                      <RefreshCw className="h-4 w-4" />
                      Regenerate
                    </Button>
                  </div>
                </form>
              </div>

              <aside className="hidden border-l border-white/10 bg-black/20 p-4 xl:block">
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-white">System prompt</h3>
                  <Textarea className="mt-3 min-h-40" value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} />
                </Card>
                <Card className="mt-4 p-4">
                  <div className="flex justify-between text-sm text-zinc-300">
                    <span>Temperature</span>
                    <span>{temperature.toFixed(1)}</span>
                  </div>
                  <Slider
                    className="mt-4"
                    min={0}
                    max={2}
                    step={0.1}
                    value={temperature}
                    onChange={(event) => setTemperature(Number(event.target.value))}
                  />
                  <div className="mt-5 flex justify-between text-sm text-zinc-300">
                    <span>Max tokens</span>
                    <span>{maxTokens}</span>
                  </div>
                  <Input
                    className="mt-3"
                    type="number"
                    min={1}
                    max={32000}
                    value={maxTokens}
                    onChange={(event) => setMaxTokens(Number(event.target.value))}
                  />
                </Card>
              </aside>
            </div>
          </section>
        </div>
      </AppShell>
    </ProtectedPage>
  );
}

function MessageBubble({ message }: { message: LocalMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "group max-w-3xl rounded-lg border p-4",
          isUser ? "border-cyan-300/20 bg-cyan-300/10" : "border-white/10 bg-white/[0.04]"
        )}
      >
        <div className="mb-2 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.16em] text-zinc-500">
          <span>{message.role}</span>
          <button
            className="opacity-0 transition group-hover:opacity-100"
            onClick={() => void navigator.clipboard.writeText(message.content)}
            aria-label="Copy message"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
        {message.pending && !message.content ? (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Thinking...
          </div>
        ) : (
          <p style={{whiteSpace:"pre-wrap",color:"#e2e8f0",fontSize:14}}>{message.content}</p>
        )}
      </div>
    </div>
  );
}
