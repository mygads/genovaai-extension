// Types for Genova AI Extension

export type LLMProvider = 'gemini' | 'openrouter';

export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.0-flash';

export type OpenRouterModel = 
  | 'google/gemini-2.5-flash'
  | 'google/gemini-2.5-pro' 
  | 'google/gemini-2.0-flash'
  | 'anthropic/claude-3.5-sonnet'
  | 'openai/gpt-4o'
  | 'openai/gpt-4o-mini';

export type ApiTier = 'free' | 'tier1' | 'tier2' | 'tier3' | 'unknown';

export type AnswerMode = 'option' | 'short' | 'full';

export type BubblePosition = 'bl' | 'br' | 'tl' | 'tr';

export interface RateLimitConfig {
  rpm: number; // Requests per minute
  tpm: number; // Tokens per minute
  rpd: number; // Requests per day (0 = unlimited)
}

export interface UsageData {
  requestsThisMinute: number;
  tokensThisMinute: number;
  requestsToday: number;
  lastMinuteReset: number; // timestamp
  lastDayReset: string; // YYYY-MM-DD in Pacific Time
  toolUsageToday: {
    googleSearch: number;
    codeExecution: number;
    urlContext: number;
  };
}

// Native PDF support - store File API URI instead of extracted text
export interface KnowledgeFile {
  name: string;
  type: 'pdf' | 'txt';
  content: string; // For TXT: raw text | For PDF: extracted text (fallback)
  fileUri?: string; // Gemini File API URI (for native PDF understanding)
  mimeType?: string; // MIME type for File API
}

export interface SessionHistoryItem {
  id: string;
  timestamp: number;
  question: string;
  answer: string;
  model: string;
  answerMode: AnswerMode;
  // Request context for debugging (minimal to avoid quota)
  requestContext?: {
    systemInstruction: string; // "[1500 chars]" format
    knowledgeLength: number;   // Length only, content is in session
    fileCount: number;
    totalChars: number;
    estimatedTokens: number;
  };
}

export interface ErrorLogItem {
  id: string;
  timestamp: number;
  type: 'pdf_csp' | 'api_error' | 'upload_error' | 'general';
  message: string;
  details?: string;
  stack?: string;
}

export interface Session {
  id: string;
  name: string;
  knowledgeText: string;
  knowledgeFiles: KnowledgeFile[];
  dateModified: number;
  history: SessionHistoryItem[];
}

export interface BubbleAppearance {
  position: BubblePosition;
  bgColor: string;
  textColor: string;
  bgTransparent: boolean; // If true, use transparent background
}

export interface DebugLogItem {
  id: string;
  timestamp: number;
  provider: string;
  model: string;
  request: {
    systemInstruction?: string;
    knowledgeText?: string;
    fileCount: number;
    question: string;
    estimatedTokens?: number;
  };
  response: {
    answer?: string;
    error?: string;
    rawResponse?: string;
    finishReason?: string;
    tokenCount?: number;
  };
  duration: number; // ms
}

export interface Settings {
  provider: LLMProvider;
  apiKey: string;
  selectedModel: GeminiModel | OpenRouterModel;
  answerMode: AnswerMode;
  useCustomPrompt: boolean;
  userPrompt: string;
  bubbleAppearance: BubbleAppearance;
  activeSessionId: string | null;
  // Rate limiting settings
  apiTier: ApiTier;
  enforceRateLimit: boolean; // If true, block requests that exceed limits
  autoDetectTier: boolean; // If true, try to detect tier from API responses
  // Debug mode
  debugMode: boolean; // If true, log all requests/responses
}

export interface StorageData {
  settings: Settings;
  sessions: Session[];
}

export const DEFAULT_SETTINGS: Settings = {
  provider: 'gemini',
  apiKey: '',
  selectedModel: 'gemini-2.5-flash',
  answerMode: 'short',
  useCustomPrompt: false,
  userPrompt: '',
  bubbleAppearance: {
    position: 'bl',
    bgColor: '#111111',
    textColor: '#ffffff',
    bgTransparent: false,
  },
  activeSessionId: null,
  apiTier: 'unknown',
  enforceRateLimit: true,
  autoDetectTier: true,
  debugMode: false,
};

export interface GenovaMessage {
  type: 'GENOVA_RESULT' | 'GENOVA_ERROR' | 'GENOVA_LOADING';
  answer?: string;
  error?: string;
  bubbleAppearance?: BubbleAppearance;
}

