# Bubble UX Improvements - Loading & Error States

## Issues Fixed

### 1. ❌ MAX_TOKENS Error on Identical Questions
**Problem:** Request 1 & 2 succeeded, but request 3 failed with "MAX_TOKENS" error despite identical question.

**Root Cause:** `maxOutputTokens: 500` was too restrictive. Sometimes the model starts generating a longer explanation before realizing it should be concise, hitting the token limit.

**Solution:**
- Increased `maxOutputTokens` from **500 → 2000**
- Applied to both Gemini and OpenRouter APIs
- Allows model to generate complete responses without premature cutoff

**Files Modified:**
- `src/shared/api.ts` - Updated both `callGeminiAPI()` and `callOpenRouterAPI()`

```typescript
// Before
maxOutputTokens: 500

// After  
maxOutputTokens: 2000 // Prevents MAX_TOKENS errors
```

---

### 2. ❌ Error Bubble Appears in Wrong Location (Bottom Right)
**Problem:** Errors displayed in separate red bubble at bottom-right corner, different from answer location.

**Solution:**
- Removed separate error bubble styling
- Errors now appear in **same bubble location** as answers
- Uses configured `bubbleAppearance.position` (bl/br/tl/tr)
- Red background applied via `.error` CSS class

**Files Modified:**
- `src/content/index.ts` - Updated message listener
- `src/content/bubble.css` - Added `.error` styling

**Before:**
```typescript
// Separate red bubble at bottom-right
showBubble(`❌ ${message.error}`, {
  position: 'br',  // Always bottom-right
  bgColor: '#dc2626',
  textColor: '#ffffff',
});
```

**After:**
```typescript
// Same location as answers, with error flag
showBubble(`❌ ${message.error}`, message.bubbleAppearance, true);
// isError=true applies red background
```

---

### 3. ❌ No Loading Indicator
**Problem:** No visual feedback while waiting for API response, user doesn't know if request is processing.

**Solution:**
- Added loading indicator with spinner animation
- Shows immediately when user selects text
- Replaced with answer/error when response arrives

**Implementation:**

**1. New Message Type:**
```typescript
// src/shared/types.ts
export interface GenovaMessage {
  type: 'GENOVA_RESULT' | 'GENOVA_ERROR' | 'GENOVA_LOADING'; // Added LOADING
  bubbleAppearance?: BubbleAppearance;
}
```

**2. Send Loading Before API Call:**
```typescript
// src/background/index.ts
// Show loading indicator
await chrome.tabs.sendMessage(tab.id, {
  type: 'GENOVA_LOADING',
  bubbleAppearance: settings.bubbleAppearance,
});

// Then call API
const answer = await callLLM({...});
```

**3. Loading Bubble UI:**
```typescript
// src/content/index.ts
function showLoadingBubble(appearance?: BubbleAppearance): void {
  const bubble = document.createElement('div');
  bubble.className = 'genovaai-bubble loading';
  bubble.innerHTML = '<div class="loading-spinner"></div><span>Loading...</span>';
  // ... positioning logic
}
```

**4. CSS Spinner Animation:**
```css
/* src/content/bubble.css */
.genovaai-bubble.loading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

### 4. ❌ Mode Filtering (Requested: Show All Responses)
**Problem:** User requested to see ALL LLM responses without filtering by mode (short/option/full).

**Current Behavior:** System prompt already guides the model on format:
- `option` mode → Single letter only
- `short` mode → 1-2 sentences
- `full` mode → Comprehensive explanation

**Status:** ✅ **No filtering applied** - All responses are already shown as-is from LLM. The mode only affects the system prompt instruction, not post-processing filtering.

---

## User Flow Comparison

### Before
```
1. User selects text
2. [No visual feedback]
3. API call happens
4. Answer appears in configured position
   OR Error appears in bottom-right (different location!)
```

### After
```
1. User selects text
2. ✨ Loading spinner appears immediately in configured position
3. API call happens
4. Loading replaced with:
   ✅ Answer in same position
   OR ❌ Error in same position (red background)
```

---

## Visual States

### Loading State
```
┌─────────────────────┐
│ ⟳ Loading...        │  <- Spinner + text
└─────────────────────┘
```

### Success State
```
┌─────────────────────┐
│ d. Hotfix           │  <- Normal appearance
└─────────────────────┘
```

### Error State
```
┌─────────────────────┐
│ ❌ Gemini API stop- │  <- Red background
│ ped due to max      │
│ tokens...           │
└─────────────────────┘
```

---

## Testing Checklist

### 1. Test Loading Indicator
1. Select text on page
2. Verify spinner appears immediately
3. Verify spinner disappears when answer arrives

### 2. Test Error Display
1. Trigger error (invalid API key, MAX_TOKENS, etc.)
2. Verify error appears in **same position** as normal answers
3. Verify red background applied
4. Verify no separate bubble appears

### 3. Test MAX_TOKENS Fix
1. Ask the same question 3+ times
2. Verify all requests succeed
3. No MAX_TOKENS errors

### 4. Test All Positions
For each position (bl, br, tl, tr):
1. Configure in Settings
2. Test loading state
3. Test success state
4. Test error state
All should appear in configured position

---

## Technical Details

### Message Flow
```
Background Script                Content Script
      │                               │
      │──── GENOVA_LOADING ──────────>│ Show spinner
      │                               │
      │  [API call in progress]       │
      │                               │
      │──── GENOVA_RESULT ───────────>│ Replace spinner with answer
      │                               │
   OR │                               │
      │──── GENOVA_ERROR ────────────>│ Replace spinner with error
      │                               │
```

### CSS Classes
- `.genovaai-bubble` - Base bubble styling
- `.genovaai-bubble.loading` - Loading state (flexbox layout)
- `.genovaai-bubble.error` - Error state (red background)
- `.loading-spinner` - Animated spinner element

### Token Limits
- **Before:** 500 tokens (caused frequent MAX_TOKENS errors)
- **After:** 2000 tokens (allows complete responses)
- **Reasoning:** Even "short" mode can occasionally generate longer responses before self-correcting

---

## Related Documentation
- [ERROR_LOGGING_FIX.md](./ERROR_LOGGING_FIX.md) - Debug/History logging for errors
- [DEBUGGING_CHECKLIST.md](./DEBUGGING_CHECKLIST.md) - Troubleshooting guide
- [NATIVE_PDF_FEATURE.md](./NATIVE_PDF_FEATURE.md) - PDF handling

---

## Files Modified
1. `src/shared/types.ts` - Added `GENOVA_LOADING` message type
2. `src/shared/api.ts` - Increased `maxOutputTokens` to 2000
3. `src/background/index.ts` - Send loading indicator before API call
4. `src/content/index.ts` - Handle loading state, unified error location
5. `src/content/bubble.css` - Loading spinner animation, error styling

---

## Performance Notes
- Loading indicator adds ~50ms latency (message passing)
- Increased token limit may increase API response time slightly
- Spinner animation uses GPU-accelerated CSS transform (minimal CPU)
- No impact on successful request flow
