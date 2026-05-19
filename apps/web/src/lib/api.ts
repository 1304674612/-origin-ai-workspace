import type { Conversation, ConversationListItem, FileAsset, ModelInfo, User } from "@origin/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  user: User;
};

export type DashboardStats = {
  total_conversations: number;
  total_messages: number;
  total_files: number;
  indexed_documents: number;
  token_usage_today: number;
  provider_status: Array<{
    provider: string;
    configured: boolean;
    default_model?: string | null;
    latency_ms?: number | null;
  }>;
  usage_series: Array<{ label: string; tokens: number; latency_ms: number }>;
};

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("origin_token");
}

export function setSession(response: AuthResponse) {
  window.localStorage.setItem("origin_token", response.access_token);
  window.localStorage.setItem("origin_user", JSON.stringify(response.user));
}

export function clearSession() {
  window.localStorage.removeItem("origin_token");
  window.localStorage.removeItem("origin_user");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail ?? "Request failed");
  }
  return response.json() as Promise<T>;
}

export const api = {
  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>("/api/v1/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  register: (payload: { email: string; username: string; password: string; full_name?: string }) =>
    request<AuthResponse>("/api/v1/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request<User>("/api/v1/users/me"),
  dashboard: () => request<DashboardStats>("/api/v1/dashboard/stats"),
  models: () => request<ModelInfo[]>("/api/v1/providers/models"),
  conversations: (q?: string) =>
    request<ConversationListItem[]>(`/api/v1/chat/conversations${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  conversation: (id: string) => request<Conversation>(`/api/v1/chat/conversations/${id}`),
  files: () => request<FileAsset[]>("/api/v1/files"),
  uploadFile: (file: File) => {
    const form = new FormData();
    form.append("upload", file);
    return request<FileAsset>("/api/v1/files", { method: "POST", body: form });
  },
  streamChat: async (
    payload: {
      conversation_id?: string | null;
      message: string;
      provider: string;
      model: string;
      system_prompt?: string | null;
      temperature: number;
      max_tokens: number;
    },
    handlers: {
      onMeta?: (conversationId: string) => void;
      onToken: (delta: string) => void;
      onError?: (detail: string) => void;
      onDone?: () => void;
    },
    signal?: AbortSignal
  ) => {
    const token = getToken();
    const response = await fetch(`${API_URL}/api/v1/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload),
      signal
    });
    if (!response.ok || !response.body) {
      const error = await response.json().catch(() => ({ detail: "Streaming failed" }));
      throw new Error(error.detail ?? "Streaming failed");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const event of events) {
        const eventType = event.match(/^event: (.+)$/m)?.[1];
        const data = event.match(/^data: (.+)$/m)?.[1];
        if (!data) continue;
        try {
          const parsed = JSON.parse(data) as Record<string, unknown>;
          if (eventType === "meta" && typeof parsed.conversation_id === "string") {
            handlers.onMeta?.(parsed.conversation_id);
          }
          if (eventType === "token" && typeof parsed.delta === "string") {
            handlers.onToken(parsed.delta);
          }
          if (eventType === "error") {
            const detail = typeof parsed.detail === "string" ? parsed.detail : "Streaming failed";
            handlers.onError?.(detail);
          }
          if (eventType === "done") handlers.onDone?.();
        } catch {
          continue;
        }
      }
    }
  }
};
