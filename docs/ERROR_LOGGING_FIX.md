# Error Logging Fix - Debug & History for Failed Requests

## Problem Statement
When API requests failed (e.g., MAX_TOKENS error), the system only logged to Error Logs but NOT to Debug Logs or History. This made debugging difficult because:

1. ❌ Debug logs only saved on successful responses
2. ❌ History only saved on successful responses  
3. ✅ Error logs saved correctly

**User Report:**
```
Error: Gemini API stopped due to max tokens
- ✅ Appeared in Error Logs
- ❌ NOT in Debug Logs  
- ❌ NOT in History
```

## Root Cause Analysis

### Previous Logic Flow
```
API Request → Response
├─ Success Path:
│  ├─ Parse response
│  ├─ Save debug log ✅
│  ├─ Save history ✅
│  └─ Return answer
│
└─ Error Path:
   ├─ Save error log ✅
   ├─ Skip debug log ❌ (only if debugMode=true)
   └─ Skip history ❌ (throw immediately)
```

### Why This Was Wrong
- **Debug logs**: Only saved when `debugMode=true` AND response was successful
- **History**: Only saved after getting a valid answer
- **Missing context**: Failed requests had no record in debug/history, making troubleshooting impossible

## Solution Implemented

### 1. Always Log Debug Info on Errors
**File:** `src/shared/api.ts`

**Before:**
```typescript
if (!response.ok) {
  // Only log if debugMode enabled
  if (debugMode) {
    await addDebugLog(...);
  }
  throw new Error(...);
}
```

**After:**
```typescript
if (!response.ok) {
  // ALWAYS log debug info on error
  try {
    await addDebugLog(
      'gemini',
      model,
      {
        systemInstruction: systemInstruction?.substring(0, 500),
        knowledgeText: knowledgeText ? `${knowledgeText.substring(0, 300)}...` : undefined,
        fileCount: knowledgeFiles?.length || 0,
        question: question.substring(0, 500),
      },
      {
        error: `${response.status}: ${JSON.stringify(errorData)}`,
        rawResponse: responseText.substring(0, 1000),
      },
      duration
    );
    console.log('✅ Debug log saved for error response');
  } catch (logError) {
    console.error('❌ Failed to log debug info:', logError);
  }
  throw new Error(...);
}
```

### 2. Log Debug Info for Non-STOP Finish Reasons
**File:** `src/shared/api.ts`

When `finishReason` is not `STOP` (e.g., `MAX_TOKENS`, `SAFETY`, `RECITATION`):

```typescript
if (candidate.finishReason && candidate.finishReason !== 'STOP') {
  // ALWAYS log debug info when finish reason is not STOP
  try {
    await addDebugLog(
      'gemini',
      model,
      {
        systemInstruction: systemInstruction?.substring(0, 500),
        knowledgeText: knowledgeText ? `${knowledgeText.substring(0, 300)}...` : undefined,
        fileCount: knowledgeFiles?.length || 0,
        question: question.substring(0, 500),
      },
      {
        error: `Finish reason: ${candidate.finishReason}`,
        rawResponse: JSON.stringify(data).substring(0, 2000),
        finishReason: candidate.finishReason,
      },
      duration
    );
    console.log('✅ Debug log saved for non-STOP finish reason');
  } catch (logError) {
    console.error('❌ Failed to log debug info:', logError);
  }
  
  throw new Error(...); // Then throw appropriate error
}
```

### 3. Save Failed Requests to History
**File:** `src/background/index.ts`

**Before:**
```typescript
catch (error) {
  await addErrorLog(...); // Only error log
  await sendErrorToTab(tab.id, errorMessage);
}
```

**After:**
```typescript
catch (error) {
  // 1. Save error log
  await addErrorLog(
    'api_error',
    error instanceof Error ? error.message : String(error),
    `Provider: ${settings?.provider || 'unknown'}, Model: ${settings?.selectedModel || 'unknown'}`,
    error instanceof Error ? error.stack : undefined
  );
  
  // 2. Save failed request to history if session exists
  if (activeSession) {
    try {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await addHistoryToSession(
        activeSession.id,
        selectedText,
        `ERROR: ${errorMessage}`, // Prefix with ERROR
        settings?.selectedModel || 'unknown',
        settings?.useCustomPrompt ? 'custom' : settings?.answerMode || 'short'
      );
      console.log('✅ Failed request saved to history');
    } catch (histError) {
      console.error('❌ Failed to save error to history:', histError);
    }
  }
  
  await sendErrorToTab(tab.id, errorMessage);
}
```

## New Logic Flow

```
API Request → Response
├─ Success Path:
│  ├─ Parse response
│  ├─ Save debug log ✅
│  ├─ Save history ✅
│  └─ Return answer
│
└─ Error Path:
   ├─ Save debug log ✅ (ALWAYS, not just debugMode)
   ├─ Save error log ✅
   ├─ Save history with "ERROR: ..." ✅
   └─ Send error to tab
```

## Testing Checklist

### 1. Test MAX_TOKENS Error
1. Ask a very long question or enable low `maxOutputTokens`
2. Trigger `MAX_TOKENS` error
3. Verify:
   - ✅ Error appears in **Error Logs** tab
   - ✅ Request/response appears in **Debug** tab
   - ✅ Failed Q&A appears in **History** tab with "ERROR: ..." prefix

### 2. Test SAFETY Filter
1. Ask a question that triggers safety filters
2. Verify all 3 tabs record the failed request

### 3. Test Network Error
1. Use invalid API key or disconnect internet
2. Verify all 3 tabs record the failed request

### 4. Test Successful Request
1. Ask a normal question
2. Verify:
   - ✅ Success logged in **Debug** tab
   - ✅ Normal Q&A in **History** tab (no ERROR prefix)
   - ❌ NO entry in **Error Logs** tab

## Console Output Example

### Before (Error Path):
```
❌ Error in background script: Error: Gemini API stopped due to max tokens
```

### After (Error Path):
```
❌ Gemini API Error Response: {...}
✅ Debug log saved for non-STOP finish reason
❌ Error in background script: Error: Gemini API stopped due to max tokens
✅ Error log saved
✅ Failed request saved to history
```

## Benefits

1. **Complete Audit Trail**: Every request (success or fail) is now tracked
2. **Better Debugging**: Debug logs show exactly what was sent/received for failures
3. **User Visibility**: History shows all attempts, including failures with ERROR prefix
4. **No Silent Failures**: All error paths now have comprehensive logging

## Migration Notes

- **No database migration needed**: Uses existing storage structure
- **Backward compatible**: Error logs, debug logs, history logs all use existing schemas
- **History format**: Failed requests prefixed with `ERROR:` in answer field
- **Debug logs**: Error responses saved with `error` and `rawResponse` fields

## Files Modified

1. `src/shared/api.ts` - Added debug logging in error paths
2. `src/background/index.ts` - Added history logging for failed requests

## Related Documentation

- [DEBUGGING_CHECKLIST.md](./DEBUGGING_CHECKLIST.md) - Troubleshooting guide
- [STORAGE_DEBUG.md](./STORAGE_DEBUG.md) - Storage inspection guide
