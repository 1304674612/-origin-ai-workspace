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
