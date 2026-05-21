export type User = {
  id: string;
  email: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  preferences: Record<string, unknown>;
  created_at: string;
};

export type ConversationListItem = {
  id: string;
  title: string;
  model: string;
  provider: string;
  knowledge_base_id?: string | null;
  is_archived: boolean;
  is_pinned: boolean;
  is_favorite: boolean;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  token_count: number;
  message_metadata: Record<string, unknown>;
  created_at: string;
};

export type Conversation = ConversationListItem & {
  system_prompt?: string | null;
  temperature: number;
  max_tokens: number;
  created_at: string;
  messages: ChatMessage[];
};

export type ProviderInfo = {
  id: string;
  name: string;
  provider: string;
  base_url?: string | null;
  default_model?: string | null;
  is_enabled: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  is_default: boolean;
};

export type KnowledgeBaseInfo = {
  id: string;
  name: string;
  description?: string | null;
  is_archived: boolean;
  is_pinned: boolean;
  is_favorite: boolean;
  tags: string[];
  kb_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type KnowledgeDocumentInfo = {
  id: string;
  knowledge_base_id?: string | null;
  file_id?: string | null;
  title: string;
  source_type: string;
  index_name: string;
  embedding_model?: string | null;
  document_metadata: Record<string, unknown>;
  chunk_count: number;
  created_at: string;
  updated_at: string;
};

export type ModelInfo = {
  id: string;
  name: string;
  provider: string;
  context_window: number;
  supports_streaming: boolean;
};

export type FileAsset = {
  id: string;
  filename: string;
  content_type?: string | null;
  size_bytes: number;
  status: "uploaded" | "parsing" | "parsed" | "failed";
  extracted_text?: string | null;
  file_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
