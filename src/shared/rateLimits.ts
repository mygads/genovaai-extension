// Rate Limits Configuration for Gemini API
// Based on official documentation: https://ai.google.dev/gemini-api/docs/quota-rate-limits

import { ApiTier, GeminiModel, RateLimitConfig, UsageData } from './types';

// Rate limit configurations per tier and model
export const RATE_LIMITS: Record<ApiTier, Record<GeminiModel, RateLimitConfig>> = {
  free: {
    'gemini-2.5-flash': { rpm: 10, tpm: 8_000_000, rpd: 1500 },
    'gemini-2.5-pro': { rpm: 2, tpm: 8_000_000, rpd: 50 },
    'gemini-2.0-flash': { rpm: 15, tpm: 30_000_000, rpd: 1500 },
  },
  tier1: {
    'gemini-2.5-flash': { rpm: 1000, tpm: 8_000_000, rpd: 0 }, // 0 = unlimited
    'gemini-2.5-pro': { rpm: 1000, tpm: 8_000_000, rpd: 0 },
    'gemini-2.0-flash': { rpm: 2000, tpm: 30_000_000, rpd: 0 },
  },
  tier2: {
    'gemini-2.5-flash': { rpm: 2000, tpm: 8_000_000, rpd: 0 },
    'gemini-2.5-pro': { rpm: 2000, tpm: 8_000_000, rpd: 0 },
    'gemini-2.0-flash': { rpm: 4000, tpm: 30_000_000, rpd: 0 },
  },
  tier3: {
    'gemini-2.5-flash': { rpm: 10_000, tpm: 8_000_000, rpd: 0 },
    'gemini-2.5-pro': { rpm: 2000, tpm: 8_000_000, rpd: 0 },
    'gemini-2.0-flash': { rpm: 30_000, tpm: 30_000_000, rpd: 0 },
  },
  unknown: {
    // Conservative defaults when tier is unknown
    'gemini-2.5-flash': { rpm: 10, tpm: 8_000_000, rpd: 1500 },
    'gemini-2.5-pro': { rpm: 2, tpm: 8_000_000, rpd: 50 },
    'gemini-2.0-flash': { rpm: 15, tpm: 30_000_000, rpd: 1500 },
  },
};

// Get current date in Pacific Time (for daily reset)
export function getPacificDate(): string {
  const now = new Date();
  const pacificTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  );
  return pacificTime.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Initialize usage data
export function initUsageData(): UsageData {
  return {
    requestsThisMinute: 0,
    tokensThisMinute: 0,
    requestsToday: 0,
    lastMinuteReset: Date.now(),
    lastDayReset: getPacificDate(),
    toolUsageToday: {
      googleSearch: 0,
      codeExecution: 0,
      urlContext: 0,
    },
  };
}

// Get usage data from storage
export async function getUsageData(): Promise<UsageData> {
  const result = await chrome.storage.local.get(['usageData']);
  if (!result.usageData) {
    const newData = initUsageData();
    await chrome.storage.local.set({ usageData: newData });
    return newData;
  }
  return result.usageData as UsageData;
}

// Save usage data to storage
export async function saveUsageData(data: UsageData): Promise<void> {
  await chrome.storage.local.set({ usageData: data });
}

// Reset usage counters if time windows have passed
export async function resetUsageIfNeeded(data: UsageData): Promise<UsageData> {
  const now = Date.now();
  const currentDate = getPacificDate();
  let updated = false;

  // Reset per-minute counters (every 60 seconds)
  if (now - data.lastMinuteReset >= 60_000) {
    data.requestsThisMinute = 0;
    data.tokensThisMinute = 0;
    data.lastMinuteReset = now;
    updated = true;
  }

  // Reset daily counters (at midnight Pacific)
  if (currentDate !== data.lastDayReset) {
    data.requestsToday = 0;
    data.lastDayReset = currentDate;
    data.toolUsageToday = {
      googleSearch: 0,
      codeExecution: 0,
      urlContext: 0,
    };
    updated = true;
  }

  if (updated) {
    await saveUsageData(data);
  }

  return data;
}

// Check if request would exceed rate limits
export function checkRateLimit(
  tier: ApiTier,
  model: GeminiModel,
  usage: UsageData,
  estimatedTokens: number = 0
): { allowed: boolean; reason?: string } {
  const limits = RATE_LIMITS[tier][model];

  // Check RPM (Requests Per Minute)
  if (usage.requestsThisMinute >= limits.rpm) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${limits.rpm} requests per minute. Please wait.`,
    };
  }

  // Check TPM (Tokens Per Minute)
  if (estimatedTokens > 0 && usage.tokensThisMinute + estimatedTokens > limits.tpm) {
    return {
      allowed: false,
      reason: `Token limit exceeded: ${limits.tpm.toLocaleString()} tokens per minute.`,
    };
  }

  // Check RPD (Requests Per Day) - only if limit exists (not 0)
  if (limits.rpd > 0 && usage.requestsToday >= limits.rpd) {
    return {
      allowed: false,
      reason: `Daily limit exceeded: ${limits.rpd} requests per day. Resets at midnight Pacific Time.`,
    };
  }

  return { allowed: true };
}

// Update usage after successful request
export async function updateUsage(
  actualTokens: number,
  toolsUsed?: {
    googleSearch?: boolean;
    codeExecution?: boolean;
    urlContext?: boolean;
  }
): Promise<void> {
  let data = await getUsageData();
  data = await resetUsageIfNeeded(data);

  data.requestsThisMinute += 1;
  data.tokensThisMinute += actualTokens;
  data.requestsToday += 1;

  if (toolsUsed) {
    if (toolsUsed.googleSearch) data.toolUsageToday.googleSearch += 1;
    if (toolsUsed.codeExecution) data.toolUsageToday.codeExecution += 1;
    if (toolsUsed.urlContext) data.toolUsageToday.urlContext += 1;
  }

  await saveUsageData(data);
}

// Estimate token count (rough approximation: 1 token ≈ 4 characters)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Get tier info with descriptions
export function getTierInfo(tier: ApiTier): {
  name: string;
  description: string;
  qualification: string;
} {
  switch (tier) {
    case 'free':
      return {
        name: 'Free Tier',
        description: 'Limited requests per day, suitable for testing',
        qualification: 'Available in eligible countries',
      };
    case 'tier1':
      return {
        name: 'Tier 1',
        description: 'Higher limits with billing account',
        qualification: 'Billing account linked to project',
      };
    case 'tier2':
      return {
        name: 'Tier 2',
        description: 'Enhanced limits for regular users',
        qualification: '$250+ spent, 30+ days since payment',
      };
    case 'tier3':
      return {
        name: 'Tier 3',
        description: 'Maximum limits for production use',
        qualification: '$1000+ spent, 30+ days since payment',
      };
    case 'unknown':
      return {
        name: 'Unknown Tier',
        description: 'Tier not detected yet',
        qualification: 'Will detect on first API call',
      };
  }
}
