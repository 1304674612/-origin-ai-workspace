import type { Conversation, ConversationListItem, FileAsset, ModelInfo, User } from "@origin/shared";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/+$/, "");

export type AuthResponse = {
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

export type DashboardSummary = {
  conversations_count: number;
  files_count: number;
  blogs_count: number;
  system_status: string;
  recent_conversations: Array<{ id: string; title: string; created_at?: string | null }>;
  recent_files: Array<{ id: string; title: string; created_at?: string | null }>;
  recent_blogs: Array<{ id: string; title: string; created_at?: string | null }>;
  services: Array<{ name: string; status: string }>;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  offset: number;
  limit: number;
};

export type UpdateCheck = {
  update_available: boolean;
  current_version: string;
  latest_version?: string;
  release_name?: string;
  release_url?: string;
  release_notes?: string;
  error?: string;
};

export async function isAuthenticated(): Promise<boolean> {
  try {
    await request<User>("/api/v1/users/me");
    return true;
  } catch {
    return false;
  }
}

export function setSession(response: AuthResponse) {
  window.localStorage.setItem("origin_user", JSON.stringify(response.user));
}

export async function clearSession() {
  window.localStorage.removeItem("origin_user");
  await fetch(apiUrl("/api/v1/auth/logout"), {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("origin_user");
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    const error = await parseResponseBody<{ detail?: unknown }>(response);
    throw new Error(typeof error?.detail === "string" ? error.detail : "Request failed");
  }
  return parseResponseBody<T>(response);
}

function apiUrl(path: string): string {
  const normalizedPath =
    API_BASE.endsWith("/api") && path.startsWith("/api/") ? path.slice(4) : path;
  return `${API_BASE}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
}

async function parseResponseBody<T>(response: Response): Promise<T> {
  if (response.status === 204) return null as T;

  const text = await response.text();
  if (!text.trim()) return null as T;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return unwrapResponse<T>(JSON.parse(text));
    } catch {
      return text as T;
    }
  }

  try {
    return unwrapResponse<T>(JSON.parse(text));
  } catch {
    return text as T;
  }
}

function unwrapResponse<T>(json: unknown): T {
  if (json !== null && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    if ("data" in obj && obj.data !== null && typeof obj.data === "object") {
      return obj.data as T;
    }
    if ("result" in obj && obj.result !== null && typeof obj.result === "object") {
      return obj.result as T;
    }
  }
  return json as T;
}

export const api = {
  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>("/api/v1/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  register: (payload: { email: string; username: string; password: string; full_name?: string }) =>
    request<AuthResponse>("/api/v1/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => clearSession(),
  me: () => request<User>("/api/v1/users/me"),
  updateMe: (payload: { username?: string; full_name?: string }) =>
    request<User>("/api/v1/users/me", { method: "PATCH", body: JSON.stringify(payload) }),
  changePassword: (current_password: string, new_password: string) =>
    request<void>("/api/v1/users/me/password", { method: "POST", body: JSON.stringify({ current_password, new_password }) }),
  dashboard: () => request<DashboardStats>("/api/v1/dashboard/stats"),
  dashboardSummary: () => request<DashboardSummary>("/api/v1/dashboard/summary"),
  updateCheck: () => request<UpdateCheck>("/api/v1/system/update-check"),
  knowledgeGenerate: (title: string) =>
    request<{ content: string }>("/api/v1/knowledge/generate", { method: "POST", body: JSON.stringify({ title }) }),
  knowledgeSave: (payload: { title: string; content: string }) =>
    request<{ id: string }>("/api/v1/knowledge", { method: "POST", body: JSON.stringify(payload) }),
  knowledgeList: (offset = 0, limit = 200) =>
    request<PaginatedResponse<{ id: string; title: string; content: string; created_at: string }>>(
      `/api/v1/knowledge?offset=${offset}&limit=${limit}`
    ),
  knowledgeGet: (id: string) =>
    request<{ id: string; title: string; content: string; created_at: string }>(`/api/v1/knowledge/${id}`),
  models: () => request<ModelInfo[]>("/api/v1/providers/models"),
  conversations: (q?: string, offset = 0, limit = 200) =>
    request<PaginatedResponse<ConversationListItem>>(
      `/api/v1/chat/conversations?offset=${offset}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}`
    ),
  conversation: (id: string) => request<Conversation>(`/api/v1/chat/conversations/${id}`),
  deleteConversation: (id: string) =>
    request<void>(`/api/v1/chat/conversations/${id}`, { method: "DELETE" }),
  updateConversation: (id: string, payload: { title?: string }) =>
    request<Conversation>(`/api/v1/chat/conversations/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  files: (offset = 0, limit = 200) =>
    request<PaginatedResponse<FileAsset>>(`/api/v1/files?offset=${offset}&limit=${limit}`),
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
    signal?: AbortSignal,
  ) => {
    const response = await fetch(apiUrl("/api/v1/chat/stream"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
      signal,
    });
    if (!response.ok || !response.body) {
      const error = await parseResponseBody<{ detail?: unknown }>(response).catch(() => null);
      throw new Error(typeof error?.detail === "string" ? error.detail : "Streaming failed");
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
  },
};
