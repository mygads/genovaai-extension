# Rate Limiting Feature - GenovaAI v1.4.0

## Overview

The Rate Limiting feature allows users to monitor and control their Gemini API usage to stay within tier limits. This prevents unexpected API errors and helps users understand their usage patterns.

## What Changed in v1.4.0

### New Files
1. **src/shared/rateLimits.ts** - Core rate limiting logic
2. **src/options/components/UsageMonitor.tsx** - UI component for monitoring usage

### Modified Files
1. **src/shared/types.ts** - Added `ApiTier`, `RateLimitConfig`, `UsageData` types
2. **src/background/index.ts** - Integrated rate limit checks before API calls
3. **src/options/App.tsx** - Added UsageMonitor component
4. **src/options/styles.css** - Added usage monitor styling
5. **package.json** - Version bumped to 1.4.0

## Features

### 1. Tier Detection & Selection

Users can select their API tier:
- **Free Tier**: Limited requests per day
- **Tier 1**: Billing account linked
- **Tier 2**: $250+ spent, 30+ days
- **Tier 3**: $1000+ spent, 30+ days
- **Unknown**: Auto-detect (conservative limits)

### 2. Rate Limit Configuration

Based on official Gemini API documentation:

| Model | Tier | RPM | TPM | RPD |
|-------|------|-----|-----|-----|
| gemini-2.5-flash | Free | 10 | 8M | 1500 |
| gemini-2.5-flash | Tier 1 | 1000 | 8M | Unlimited |
| gemini-2.5-flash | Tier 2 | 2000 | 8M | Unlimited |
| gemini-2.5-flash | Tier 3 | 10000 | 8M | Unlimited |
| gemini-2.5-pro | Free | 2 | 8M | 50 |
| gemini-2.5-pro | Tier 1-3 | 1000-2000 | 8M | Unlimited |
| gemini-2.0-flash | Free | 15 | 30M | 1500 |
| gemini-2.0-flash | Tier 1-3 | 2000-30000 | 30M | Unlimited |

### 3. Real-Time Usage Tracking

The UsageMonitor component displays:
- **Requests Per Minute (RPM)** - Progress bar with color coding
- **Tokens Per Minute (TPM)** - Progress bar with color coding
- **Requests Per Day (RPD)** - Only shown for tiers with daily limits
- **Tool Usage** - Google Search, Code Execution, URL Context counts

### 4. Automatic Reset

- **Per-minute counters**: Reset every 60 seconds
- **Daily counters**: Reset at midnight Pacific Time (official reset time)

### 5. Enforcement Options

Users can choose enforcement mode:
- **ON**: Block requests that exceed limits (shows error message)
- **OFF**: Warning only (requests proceed, user monitors manually)

### 6. Visual Warnings

Color-coded progress bars:
- **Green** (0-60%): Safe usage
- **Yellow** (60-80%): Moderate usage
- **Orange** (80-90%): Approaching limit
- **Red** (90-100%): Critical - near limit

Warning banner appears when any metric exceeds 80%.

## How It Works

### Rate Limit Check Flow

```
User triggers context menu
  ↓
Background script receives request
  ↓
Check if rate limiting enabled
  ↓
Get current usage data from chrome.storage.local
  ↓
Reset counters if time windows expired
  ↓
Estimate token count for request
  ↓
Check against tier limits (RPM/TPM/RPD)
  ↓
If within limits → Proceed with API call
If exceeded & enforced → Block request with error
  ↓
After API call → Update usage counters
  ↓
Save updated usage to storage
```

### Token Estimation

Since the Gemini API doesn't always return token counts in basic requests, we use estimation:
- **1 token ≈ 4 characters** (rough approximation)
- Includes: system prompt + knowledge + question + answer
- Future improvement: Parse `usage_metadata` from API responses when available

### Storage Structure

```typescript
// chrome.storage.local
{
  usageData: {
    requestsThisMinute: 5,
    tokensThisMinute: 125000,
    requestsToday: 234,
    lastMinuteReset: 1700000000000,  // Unix timestamp
    lastDayReset: "2024-11-20",      // YYYY-MM-DD in Pacific Time
    toolUsageToday: {
      googleSearch: 10,
      codeExecution: 5,
      urlContext: 8
    }
  }
}
```

## Usage Examples

### Example 1: Free Tier User

**Scenario**: Student using Free tier with gemini-2.5-flash

**Limits**:
- 10 RPM (requests per minute)
- 8M TPM (tokens per minute)
- 1500 RPD (requests per day)

**User makes 5 requests in one minute**:
- RPM: 5/10 (50%) - Green
- TPM: ~500K/8M (6%) - Green
- RPD: 234/1500 (15%) - Green

**User approaches daily limit (1450/1500)**:
- Warning banner appears
- User sees: "Approaching rate limit! You're at 97% capacity."
- If enforcement ON: Next 50 requests blocked after hitting 1500

### Example 2: Tier 2 User

**Scenario**: Professional with Tier 2 account

**Limits**:
- 2000 RPM
- 8M TPM
- Unlimited RPD

**Heavy usage**:
- RPM: 1800/2000 (90%) - Red warning
- TPM: 7M/8M (87%) - Red warning
- RPD: No limit shown

**Extension behavior**:
- Orange/red progress bars
- Warning banner: "Approaching rate limit! You're at 90% capacity."
- If enforcement ON and user hits 2000 RPM: Blocks next request for remainder of minute

### Example 3: Using Tools (Future Feature)

When tools are implemented:

```
Today's Usage:
- Google Search: 15 queries
- Code Execution: 3 executions  
- URL Context: 5 URLs processed

Note: Tool usage may count separately in billing
```

## Configuration

### In Options Page

1. **Select Your Tier**:
   - Dropdown with 5 options (Unknown, Free, Tier 1, 2, 3)
   - Shows description and qualification criteria

2. **Enable/Disable Enforcement**:
   - Toggle button (ON/OFF)
   - ON: Blocks requests exceeding limits
   - OFF: Shows warnings but allows requests

3. **Real-Time Monitoring**:
   - Refreshes every 5 seconds
   - Live progress bars
   - Color-coded status

### Default Settings

```typescript
{
  apiTier: 'unknown',           // Conservative limits until user selects
  enforceRateLimit: true,       // Block by default for safety
  autoDetectTier: true         // Future: attempt to detect from API responses
}
```

## Error Messages

### When Rate Limit Exceeded

**RPM exceeded**:
```
Rate limit exceeded: 10 requests per minute. Please wait.
```

**TPM exceeded**:
```
Token limit exceeded: 8,000,000 tokens per minute.
```

**RPD exceeded** (Free tier only):
```
Daily limit exceeded: 1500 requests per day. Resets at midnight Pacific Time.
```

## Best Practices

### For Free Tier Users

1. **Monitor daily usage** - Check RPD regularly to avoid hitting limit
2. **Spread requests** - Avoid bursts of requests in one minute
3. **Enable enforcement** - Prevents wasting attempts on rate limit errors
4. **Consider upgrade** - Tier 1 costs nothing if you already have billing account

### For Paid Tier Users

1. **Set correct tier** - Don't use "Unknown" or "Free" unnecessarily
2. **Monitor RPM/TPM** - Even paid tiers have per-minute limits
3. **Watch for spikes** - Burst usage can still hit per-minute limits
4. **Optional enforcement** - Can disable if you prefer warnings only

### General Tips

1. **Check usage before heavy work** - Open options page to see current stats
2. **Wait for resets** - RPM resets every minute, RPD at midnight PT
3. **Track tools** - Remember tool usage may have separate pricing
4. **Read documentation** - [Official Gemini Rate Limits](https://ai.google.dev/gemini-api/docs/quota-rate-limits)

## API Reference

### rateLimits.ts Functions

```typescript
// Get rate limit config for specific tier and model
RATE_LIMITS[tier][model] // Returns RateLimitConfig

// Get current Pacific Time date (for daily reset)
getPacificDate(): string // Returns "YYYY-MM-DD"

// Initialize new usage data
initUsageData(): UsageData

// Get usage from storage
getUsageData(): Promise<UsageData>

// Save usage to storage
saveUsageData(data: UsageData): Promise<void>

// Reset counters if time windows passed
resetUsageIfNeeded(data: UsageData): Promise<UsageData>

// Check if request allowed
checkRateLimit(tier, model, usage, estimatedTokens): 
  { allowed: boolean; reason?: string }

// Update usage after request
updateUsage(actualTokens: number, toolsUsed?: {
  googleSearch?: boolean;
  codeExecution?: boolean;
  urlContext?: boolean;
}): Promise<void>

// Estimate token count from text
estimateTokens(text: string): number // ~1 token per 4 chars

// Get tier information
getTierInfo(tier: ApiTier): {
  name: string;
  description: string;
  qualification: string;
}
```

## Future Improvements

### Planned Features

1. **Automatic Tier Detection**
   - Parse API response headers
   - Detect tier from 429 error patterns
   - Auto-update tier setting

2. **Actual Token Counts**
   - Parse `usage_metadata` from API responses
   - More accurate tracking
   - Separate input/output token counts

3. **Usage Analytics**
   - Daily/weekly/monthly charts
   - Cost estimation
   - Usage trends

4. **Smart Rate Limiting**
   - Priority queue for important requests
   - Automatic retry after reset
   - Request scheduling

5. **Tool-Specific Limits**
   - Track tool usage separately
   - Warn about tool-specific pricing
   - Tool usage history

### Known Limitations

1. **Token estimation is approximate** - Uses 1 token ≈ 4 chars rule
2. **No cross-device sync** - Usage tracked per device (chrome.storage.local)
3. **No historical data** - Only tracks current minute and current day
4. **OpenRouter not tracked** - Only Gemini API has rate limiting
5. **Manual tier selection** - No automatic detection yet

## Troubleshooting

### Q: Why does my usage show 0 after closing browser?

A: Usage data is stored in chrome.storage.local which persists across sessions. However, per-minute counters reset every 60 seconds, so if you close and reopen within a new minute, it will show 0.

### Q: I'm on Tier 1 but see Free tier limits

A: Make sure to select "Tier 1" in the dropdown. Default is "Unknown" which uses conservative (Free tier) limits.

### Q: Extension blocks my request even though I'm under limit

A: Check all three metrics (RPM, TPM, RPD). You might be under RPM but over TPM. Also check if reset time has passed.

### Q: Can I disable rate limiting completely?

A: Yes, toggle "Enforce Rate Limits" to OFF. You'll still see usage stats but requests won't be blocked.

### Q: Does this work with OpenRouter?

A: No, rate limiting only applies to Gemini API. OpenRouter has different limits per model and the extension doesn't track those yet.

### Q: What timezone is used for daily reset?

A: Pacific Time (America/Los_Angeles), as specified in Gemini API documentation.

## Testing Checklist

- [ ] Free tier: Hit RPD limit (1500), verify block message
- [ ] Free tier: Make 11 requests in one minute, verify 11th blocked
- [ ] Tier 1: Verify unlimited RPD (no daily counter shown)
- [ ] Progress bars: Colors change correctly (green→yellow→orange→red)
- [ ] Warning banner: Appears at 80%+ usage
- [ ] Enforcement toggle: OFF allows requests even when over limit
- [ ] Daily reset: Counters reset at midnight Pacific Time
- [ ] Per-minute reset: Counters reset after 60 seconds
- [ ] Token estimation: Large prompts show TPM usage
- [ ] UI: Refresh every 5 seconds shows updated counts

## Version History

### v1.4.0 (Current)
- ✅ Tier detection and selection
- ✅ RPM/TPM/RPD tracking
- ✅ Automatic resets (per-minute, daily)
- ✅ Real-time usage monitor UI
- ✅ Enforcement toggle
- ✅ Color-coded warnings
- ✅ Tool usage tracking (structure ready)

### Future Versions
- v1.5.0: Automatic tier detection
- v1.6.0: Actual token counts from API
- v1.7.0: Usage analytics and charts
- v1.8.0: Tool-specific pricing warnings

## References

- [Gemini API Rate Limits Documentation](https://ai.google.dev/gemini-api/docs/quota-rate-limits)
- [Gemini API Pricing](https://ai.google.dev/pricing)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Pacific Time Zone Info](https://www.timeanddate.com/time/zones/pt)
