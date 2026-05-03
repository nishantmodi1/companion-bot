// ─── CORE TYPES ──────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant';
export type HistoryRole = 'user' | 'model';

export interface Message {
  role:    MessageRole;
  content: string;
  time:    string;
  id:      string;
  status?: 'sending' | 'delivered' | 'read';
}

export interface HistoryEntry {
  role: HistoryRole;
  text: string;
}

// ─── ROLE ────────────────────────────────────────────────────

export interface RoleConfig {
  id:       string;
  label:    string;
  emoji:    string;
  color:    string;
  g1:       string;
  g2:       string;
  bg:       string;
  category: string;
  tagline:  string;
  temp:     number;
  tokens:   number;
  greeting: (name: string) => string;
  prompt:   (name: string) => string;
}

// ─── GEMINI API ──────────────────────────────────────────────

export interface GeminiPart {
  text: string;
}

export interface GeminiContent {
  role:  'user' | 'model';
  parts: GeminiPart[];
}

export interface GeminiSafetySettings {
  category:  string;
  threshold: string;
}

export interface GeminiGenerationConfig {
  temperature:     number;
  maxOutputTokens: number;
  candidateCount?: number;
}

export interface GeminiPayload {
  contents:          GeminiContent[];
  systemInstruction: { parts: GeminiPart[] };
  generationConfig:  GeminiGenerationConfig;
  safetySettings:    GeminiSafetySettings[];
}

export interface GeminiResponsePart {
  text?:             string;
  thoughtSignature?: string;
}

export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiResponsePart[];
    };
    finishReason?: string;
  }>;
  error?: { message?: string };
}

// ─── CHAT STORAGE ────────────────────────────────────────────

export interface ChatSession {
  roleId:    string;
  userName:  string;
  messages:  Message[];
  createdAt: number;
  updatedAt: number;
}