# GenovaAI Debugging Checklist

## 🐛 Common Issues & Solutions

### 1. API Key Hilang Setelah Reload
**Symptom:** API key kosong setiap kali reload extension options

**Check:**
1. Buka DevTools di options page
2. Lihat console logs:
   ```
   📥 Loading settings from chrome.storage.sync...
   📦 Storage result: { ... }
   ```
3. Cek apakah API key ada di result

**Solution:**
- Extension sudah punya auto-retry save mechanism
- Check Chrome storage quota: `chrome.storage.sync.QUOTA_BYTES`
- Clear sync storage jika penuh: Options > Settings > Clear All

### 2. Tidak Ada Response Setelah Error
**Symptom:** Setelah error MAX_TOKENS/SAFETY, next request tidak ada response

**Check Console Logs:**
```
✅ Message sent to tab successfully
or
⚠️ Content script may not be available on this page
```

**Why It Happens:**
- Content script tidak bisa di-inject ke page khusus:
  - `chrome://` pages
  - `chrome-extension://` pages
  - Chrome Web Store pages
  - PDF viewer (built-in)

**Solution:**
- Test di normal webpage (Google, Wikipedia, dll)
- Reload page sebelum test
- Extension harus aktif di page tersebut

### 3. History Tidak Tersimpan
**Symptom:** Q&A tidak muncul di History tab

**Check Console (Background Service Worker):**
```
💾 Adding history to session: session_xxx
✅ History added successfully
```

**Possible Causes:**
1. Tidak ada active session
2. Storage error
3. Session ID tidak match

**Debug Steps:**
```javascript
// Check active session
chrome.storage.sync.get('genovaai_settings', (r) => {
  console.log('Active Session ID:', r.genovaai_settings?.activeSessionId);
});

// Check sessions
chrome.storage.sync.get('genovaai_sessions', (r) => {
  console.log('Sessions:', r.genovaai_sessions);
});
```

### 4. Debug Logs Tidak Muncul
**Symptom:** Debug tab kosong meskipun debug mode enabled

**Check:**
1. Debug Mode di Settings: ✅ Enabled
2. Console logs:
   ```
   💾 Saving debug log... { provider, model, duration }
   ✅ Debug log saved
   ```

**Common Issues:**
- Debug mode baru aktif SETELAH save settings
- Logs lama tidak muncul (hanya request setelah debug mode enabled)
- Check storage:
  ```javascript
  chrome.storage.local.get('genovaai_debug_logs', (r) => {
    console.log('Debug Logs:', r.genovaai_debug_logs);
  });
  ```

### 5. RPM/Usage Count Tidak Akurat
**Symptom:** Request counter tidak sesuai jumlah actual request

**How Usage Tracking Works:**
```
1. Check rate limit BEFORE request
2. Call LLM API
3. Get answer
4. Update usage counter IMMEDIATELY
5. Save history
6. Send to content script
```

**Check Logs:**
```
Processing question with GenovaAI...
[API call happens]
Answer received: ...
✅ Usage updated: 1234 tokens
```

**Why Counter Might Be Wrong:**
- Multiple requests cepat berurutan (race condition)
- Error sebelum updateUsage() dipanggil
- Browser tab closed sebelum save complete

### 6. Error Logs Tidak Muncul
**Symptom:** Error terjadi tapi tidak tercatat di Error Logs tab

**Check Console:**
```
💾 Saving error log... { type, message }
✅ Error log saved
```

**Types of Errors Logged:**
- `api_error` - LLM API errors
- `pdf_csp` - PDF worker CSP violations
- `upload_error` - File upload errors
- `general` - Other errors

**Manual Check:**
```javascript
chrome.storage.local.get('genovaai_error_logs', (r) => {
  console.log('Error Logs:', r.genovaai_error_logs);
});
```

## 🔍 Debugging Tools

### Open Background Service Worker Console
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Find "GenovaAI"
4. Click "service worker" link
5. Console opens with all background logs

### Check Storage Data
```javascript
// Settings (sync)
chrome.storage.sync.get('genovaai_settings', console.log);

// Sessions (sync)
chrome.storage.sync.get('genovaai_sessions', console.log);

// Error Logs (local)
chrome.storage.local.get('genovaai_error_logs', console.log);

// Debug Logs (local)
chrome.storage.local.get('genovaai_debug_logs', console.log);

// Clear all (if needed)
chrome.storage.sync.clear();
chrome.storage.local.clear();
```

### Enable Verbose Logging
All important operations already log to console:
- 📥 Loading data
- 💾 Saving data
- ✅ Success messages
- ❌ Error messages
- 🔧 Auto-fixes
- ⚠️ Warnings

### Test Rate Limiting
```javascript
// Check current usage
chrome.storage.local.get('genovaai_usage', console.log);

// Reset usage (for testing)
chrome.storage.local.set({
  genovaai_usage: {
    requestsThisMinute: 0,
    tokensThisMinute: 0,
    requestsToday: 0,
    lastMinuteReset: Date.now(),
    lastDayReset: new Date().toISOString().split('T')[0]
  }
});
```

## 📊 Expected Console Output

### Successful Request Flow:
```
📥 Loading settings from chrome.storage.sync...
✅ Found saved settings
Processing question with GenovaAI...
Provider: gemini
Model: gemini-2.5-flash
Debug Mode: Enabled
🚀 Gemini API Request: { ... }
📡 Gemini API Response Status: 200 OK
📦 Gemini API Raw Response: ...
✅ Gemini API Parsed Response: { ... }
✨ Gemini API Answer: B
💾 Saving debug log...
✅ Debug log saved
Answer received: B
✅ Usage updated: 1234 tokens
💾 Adding history to session: session_xxx
✅ History added successfully
✅ Message sent to tab successfully
```

### Error Flow:
```
📥 Loading settings from chrome.storage.sync...
Processing question with GenovaAI...
🚀 Gemini API Request: { ... }
📡 Gemini API Response Status: 200 OK
⚠️ Unusual finish reason: MAX_TOKENS
❌ Error in background script: Error: Gemini API stopped due to max tokens...
💾 Saving error log...
✅ Error log saved
✅ Error message sent to tab
```

## 🧪 Testing Checklist

### Before Release:
- [ ] API key persists after reload (test 3x)
- [ ] Error recovery works (trigger error, then success)
- [ ] History saves correctly (check History tab)
- [ ] Debug logs appear when enabled
- [ ] Error logs capture all errors
- [ ] Usage counter accurate (compare with API dashboard)
- [ ] Transparent bubble works
- [ ] All 4 tabs load correctly
- [ ] Settings save/load properly
- [ ] Sessions can be created/edited/deleted
- [ ] File upload works (PDF & TXT)
- [ ] Rate limiting triggers correctly
- [ ] Context menu appears on text selection

### Test on Different Pages:
- [ ] Normal webpage (Wikipedia, Google)
- [ ] HTTPS page
- [ ] Page with iframes
- [ ] Page with heavy JavaScript
- [ ] Long-running page (check memory leaks)

## 🚨 Emergency Debugging

### Extension Completely Broken:
1. Remove extension
2. Clear all storage manually:
   ```javascript
   chrome.storage.sync.clear();
   chrome.storage.local.clear();
   ```
3. Reload extension
4. Reconfigure from scratch

### Strange Behavior:
1. Check browser console for errors
2. Check background service worker console
3. Verify Chrome version (requires Chrome 88+)
4. Test in Incognito mode
5. Disable other extensions
6. Check Chrome storage quota

### Performance Issues:
1. Check debug logs (disable if too many)
2. Clear old history (keep last 50 items)
3. Clear error logs
4. Check storage size:
   ```javascript
   chrome.storage.sync.getBytesInUse(console.log);
   chrome.storage.local.getBytesInUse(console.log);
   ```

## 📞 Support Info

**Extension Version:** 1.4.1

**Required Permissions:**
- `contextMenus` - Right-click menu
- `storage` - Save settings
- `activeTab` - Access current page
- `scripting` - Inject content script

**API Endpoints:**
- Gemini: `https://generativelanguage.googleapis.com/v1beta/...`
- OpenRouter: `https://openrouter.ai/api/v1/...`

**Storage Limits:**
- `chrome.storage.sync`: 100 KB total, 8 KB per item
- `chrome.storage.local`: 5 MB total (10 MB with unlimitedStorage)

---

**Last Updated:** November 20, 2025
**Status:** ✅ Production Ready
