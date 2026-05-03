import type { RoleConfig, GeminiPayload, GeminiResponse, HistoryEntry } from '../types/types';

// ─── CONFIG ──────────────────────────────────────────────────

export const API_URL = '/api/chat';

const isDev = import.meta.env.DEV;

// export const API_URL = isDev
//   ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`
//   : `${import.meta.env.BASE_URL}api/chat`.replace(/\/+/g, '/');

const DEFAULT_MAX_TOKENS = 1500;
const MAX_HISTORY_ENTRIES = 20;

// ─── PAYLOAD BUILDER ─────────────────────────────────────────

export function buildPayload(
  role:       RoleConfig,
  userName:   string,
  history:    HistoryEntry[],
  newMessage: string,
): GeminiPayload {
  return {
    contents: [
      ...history.map((h) => ({
        role:  h.role,
        parts: [{ text: h.text }],
      })),
      { role: 'user', parts: [{ text: newMessage }] },
    ],
    systemInstruction: {
      parts: [{ text: role.prompt(userName) }],
    },
    generationConfig: {
      temperature:     role.temp,
      maxOutputTokens: Math.max(role.tokens, DEFAULT_MAX_TOKENS),
      candidateCount:  1,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };
}

// ─── TEXT EXTRACTOR ──────────────────────────────────────────

function extractReplyText(
  parts: Array<{ text?: string; thoughtSignature?: string }>,
): string | null {
  if (!parts.length) return null;
  const cleanParts = parts.filter(p => p.text?.trim() && !p.thoughtSignature);
  const lastClean = cleanParts[cleanParts.length - 1];
  if (lastClean?.text) return lastClean.text.trim();
  const anyParts = parts.filter(p => p.text?.trim());
  const lastAny = anyParts[anyParts.length - 1];
  if (lastAny?.text) return lastAny.text.trim();
  return null;
}

// ─── RESULT TYPE ─────────────────────────────────────────────

export interface SendResult {
  reply:        string | null;
  error:        string | null;
  isRateLimit:  boolean;
  wasTruncated: boolean;
}

// ─── SEND MESSAGE ────────────────────────────────────────────

export async function sendMessage(
  role:     RoleConfig,
  userName: string,
  history:  HistoryEntry[],
  message:  string,
): Promise<SendResult> {
  const payload = buildPayload(role, userName, history, message);

  const res = await fetch(API_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  const data: GeminiResponse = await res.json();

  if (!res.ok) {
    if (res.status === 429) {
      return { reply: null, error: null, isRateLimit: true, wasTruncated: false };
    }
    return {
      reply:        null,
      error:        data?.error?.message ?? `Error ${res.status}`,
      isRateLimit:  false,
      wasTruncated: false,
    };
  }

  const candidate    = data?.candidates?.[0];
  const parts        = candidate?.content?.parts ?? [];
  const finishReason = candidate?.finishReason ?? 'STOP';
  const wasTruncated = finishReason === 'MAX_TOKENS';
  const reply        = extractReplyText(parts);

  return { reply, error: null, isRateLimit: false, wasTruncated };
}

// ─── HISTORY HELPER ──────────────────────────────────────────

export function appendHistory(
  history:   HistoryEntry[],
  userText:  string,
  modelText: string,
): HistoryEntry[] {
  const updated: HistoryEntry[] = [
    ...history,
    { role: 'user',  text: userText  },
    { role: 'model', text: modelText },
  ];
  return updated.length > MAX_HISTORY_ENTRIES
    ? updated.slice(-MAX_HISTORY_ENTRIES)
    : updated;
}