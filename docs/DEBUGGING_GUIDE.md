# 🐛 GenovaAI Debugging Guide

**Version**: 1.4.0  
**Last Updated**: November 20, 2025

Panduan lengkap untuk debugging Chrome Extension GenovaAI, melihat log, dan mengatasi masalah umum.

---

## 📋 Table of Contents

1. [Cara Melihat Log](#-cara-melihat-log)
2. [Error "Invalid Response from Gemini"](#-error-invalid-response-from-gemini)
3. [Common Errors & Solutions](#-common-errors--solutions)
4. [Testing Checklist](#-testing-checklist)
5. [Advanced Debugging](#-advanced-debugging)

---

## 🔍 Cara Melihat Log

### 1. Background Service Worker Log

**Background script** menangani semua API calls, rate limiting, dan logic utama.

**Cara membuka Console:**

1. Buka Chrome browser
2. Navigate ke `chrome://extensions/`
3. Pastikan **"Developer mode"** ON (toggle di kanan atas)
4. Cari extension **"GenovaAI"**
5. Klik link **"service worker"** atau **"Inspect views: service worker"** (warna biru)
6. DevTools akan terbuka → Lihat tab **Console**

**Log yang akan terlihat:**

```
🚀 Gemini API Request: {
  url: "https://generativelanguage.googleapis.com/v1beta/models/...",
  model: "gemini-2.0-flash-exp",
  hasSystemInstruction: true,
  partsCount: 2,
  requestBody: {...}
}

📡 Gemini API Response Status: 200 OK

📦 Gemini API Raw Response: {"candidates":[{"content":{"parts":[{"text":"..."}]...

✅ Gemini API Parsed Response: {
  "candidates": [
    {
      "content": {
        "parts": [
          { "text": "Paris" }
        ]
      }
    }
  ]
}

✨ Gemini API Answer: Paris
```

**Jika ada error:**

```
❌ Gemini API Error Response: {"error":{"code":400,"message":"Invalid API key"}}

❌ Error in background script: Error: Gemini API error: 400 - {...}
```

### 2. Content Script Log

**Content script** menangani bubble display dan UI di webpage.

**Cara membuka Console:**

1. Buka website tempat Anda test extension (misal: Wikipedia, Google, dll)
2. Tekan **F12** atau **Ctrl+Shift+I** (Windows) / **Cmd+Option+I** (Mac)
3. DevTools akan terbuka → Lihat tab **Console**

**Log yang akan terlihat:**

```
GenovaAI Content Script loaded
```

**Jika menerima message dari background:**

```
Message received: {type: "GENOVA_RESULT", answer: "Paris", bubbleAppearance: {...}}
```

### 3. Options Page Log

**Options page** adalah halaman settings extension.

**Cara membuka Console:**

1. Klik icon extension di toolbar
2. Atau klik kanan icon → **"Options"**
3. Di halaman options, tekan **F12**
4. DevTools akan terbuka → Lihat tab **Console**

**Log yang akan terlihat:**

```
Settings loaded: {provider: "gemini", apiKey: "AIza...", ...}
Usage Monitor refreshing...
Usage data: {requestsThisMinute: 5, tokensThisMinute: 12000, ...}
```

---

## ❌ Error "Invalid Response from Gemini"

### Penyebab Umum:

1. **API Key Invalid atau Expired**
2. **Rate Limit Exceeded** (Free tier: 15 RPM)
3. **Model Name Salah**
4. **API Response Format Berubah**
5. **Network Error atau Timeout**

### Langkah Debugging:

#### Step 1: Cek Background Service Worker Console

```
chrome://extensions/ → Klik "service worker"
```

**Lihat output berikut:**

```
🚀 Gemini API Request: {
  url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIza...",
  model: "gemini-2.0-flash-exp",
  ...
}
```

**Cek:**
- ✅ URL benar?
- ✅ Model name benar? (harus salah satu: `gemini-2.0-flash-exp`, `gemini-1.5-pro`, `gemini-1.5-flash`)
- ✅ API key ada di URL?

#### Step 2: Cek Response Status

```
📡 Gemini API Response Status: 200 OK
```

**Jika Status BUKAN 200:**

| Status Code | Arti | Solusi |
|-------------|------|--------|
| **400** | Bad Request | Cek request body format, model name salah |
| **401** | Unauthorized | API key salah/expired → Generate API key baru di [Google AI Studio](https://aistudio.google.com/apikey) |
| **403** | Forbidden | API key tidak memiliki akses ke model ini |
| **429** | Too Many Requests | Rate limit exceeded → Tunggu 1 menit atau upgrade tier |
| **500** | Server Error | Gemini API down → Coba lagi nanti |

#### Step 3: Cek Raw Response

```
📦 Gemini API Raw Response: {"candidates":[{"content":{"parts":[{"text":"..."}]...
```

**Jika response kosong atau tidak valid:**

```
❌ Failed to parse Gemini response: SyntaxError: Unexpected token...
```

**Solusi:**
- Cek koneksi internet
- Coba request lagi
- Restart extension

#### Step 4: Cek Parsed Response Structure

**Expected structure:**

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          { "text": "Jawaban di sini" }
        ],
        "role": "model"
      },
      "finishReason": "STOP"
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 123,
    "candidatesTokenCount": 45,
    "totalTokenCount": 168
  }
}
```

**Jika response tidak punya `candidates`:**

```
❌ Missing candidates in response: {...}
```

**Possible reasons:**
1. **Safety filters triggered** → Question/answer dianggap unsafe
2. **Empty response** → Model tidak bisa generate answer
3. **API format changed** → Update extension

**Check safety filters:**

```json
{
  "candidates": [
    {
      "finishReason": "SAFETY",
      "safetyRatings": [
        {
          "category": "HARM_CATEGORY_HARASSMENT",
          "probability": "HIGH"
        }
      ]
    }
  ]
}
```

**Solution:** Ubah pertanyaan atau prompt.

---

## 🛠️ Common Errors & Solutions

### 1. "API key belum diatur di Settings"

**Error Message:**
```
❌ API key belum diatur di Settings.
```

**Penyebab:** API key kosong di settings.

**Solusi:**
1. Klik icon extension → **Options**
2. Pilih **Provider** (Gemini atau OpenRouter)
3. Masukkan **API Key**
4. Klik **Save Settings**

**Cara mendapatkan API key:**
- **Gemini**: [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- **OpenRouter**: [https://openrouter.ai/keys](https://openrouter.ai/keys)

---

### 2. "Rate limit exceeded"

**Error Message:**
```
❌ Rate limit exceeded: Tier 'free' allows 15 requests per minute, currently at 15
```

**Penyebab:** Sudah mencapai batas rate limit (Free tier: 10-15 RPM).

**Solusi:**

**Option A: Tunggu Reset**
- RPM reset setiap 60 detik
- RPD reset setiap midnight Pacific Time

**Option B: Disable Enforcement**
1. Buka **Options** → **Usage Monitor**
2. Toggle **Enforce Rate Limiting** → **OFF**
3. Extension akan tetap track usage tapi tidak block request

**Option C: Upgrade Tier**
1. Upgrade ke Tier 1/2/3 di [Google AI Studio](https://aistudio.google.com/)
2. Di **Options** → **Usage Monitor**
3. Pilih tier yang sesuai dari dropdown

---

### 3. "Invalid API key"

**Error Message:**
```
❌ Gemini API error: 401 - {"error":{"code":401,"message":"API key not valid"}}
```

**Penyebab:** API key salah atau expired.

**Solusi:**
1. Generate API key baru: [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Copy API key (format: `AIzaSy...`)
3. Paste di **Options** → **Provider Settings** → **API Key**
4. Klik **Save Settings**
5. Test lagi

---

### 4. "Tidak ada teks yang dipilih"

**Error Message:**
```
❌ Tidak ada teks yang dipilih
```

**Penyebab:** Context menu diklik tanpa select text.

**Solusi:**
1. **Highlight/select** text di webpage terlebih dahulu
2. **Right-click** pada text yang diselect
3. Klik **"GenovaAI"** di context menu

**Catatan:** Context menu hanya muncul jika ada text yang diselect.

---

### 5. Bubble tidak muncul

**Symptoms:** Text diselect, context menu diklik, tapi bubble tidak muncul.

**Debugging Steps:**

**A. Cek Background Console:**

```
chrome://extensions/ → "service worker"
```

Lihat apakah ada error:
```
❌ Error in background script: ...
```

**B. Cek Content Console:**

```
F12 di webpage → Console tab
```

Lihat apakah message received:
```
Message received: {type: "GENOVA_RESULT", answer: "..."}
```

**C. Cek CSS Styling:**

Bubble mungkin tersembunyi di balik elemen lain.

**Inspect element** di webpage:
```html
<div id="genovaai-bubble-container" style="z-index: 2147483647">
  #shadow-root (open)
    <style>...</style>
    <div class="genovaai-bubble show position-bl">Answer here</div>
</div>
```

**D. Cek Shadow DOM:**

Bubble menggunakan Shadow DOM untuk isolasi CSS.

Di DevTools:
1. Elements tab
2. Cari `<div id="genovaai-bubble-container">`
3. Expand `#shadow-root`
4. Cek apakah bubble ada

**Common Issues:**

| Issue | Solution |
|-------|----------|
| Z-index terlalu rendah | Sudah 2147483647 (max) |
| CSS conflict | Shadow DOM mencegah ini |
| Pointer events disabled | Auto-enabled saat bubble show |
| Animation tidak trigger | Check `show` class applied |

---

### 6. "Failed to upload PDF"

**Error Message:**
```
❌ Failed to upload PDF: ...
```

**Penyebab:**

1. **File terlalu besar** (> 50 MB)
2. **File bukan PDF** atau corrupt
3. **API key tidak valid** (untuk Gemini File API)
4. **Network error**

**Solusi:**

**A. Cek file size:**
```javascript
console.log(file.size / 1024 / 1024, 'MB'); // Should be < 50 MB
```

**B. Cek file type:**
```javascript
console.log(file.type); // Should be "application/pdf"
```

**C. Test dengan PDF kecil:**
- Coba upload PDF < 5 MB terlebih dahulu
- Jika berhasil, file besar yang bermasalah

**D. Fallback ke text extraction:**
- Jika Gemini File API gagal, extension otomatis fallback ke text extraction
- Text extraction bekerja offline, tanpa API key

---

### 7. Model tidak ditemukan

**Error Message:**
```
❌ Gemini API error: 404 - {"error":{"code":404,"message":"Model not found"}}
```

**Penyebab:** Model name salah atau model tidak tersedia di region Anda.

**Solusi:**

**A. Cek model name di options:**

Valid Gemini models:
- `gemini-2.0-flash-exp` ✅
- `gemini-1.5-pro` ✅
- `gemini-1.5-flash` ✅

**B. Test dengan model lain:**
1. Buka **Options** → **Provider Settings**
2. Ubah **Model** ke `gemini-2.0-flash-exp`
3. Save dan test lagi

**C. Cek availability:**

Beberapa model hanya available di region tertentu. Check [Gemini API docs](https://ai.google.dev/models/gemini).

---

## ✅ Testing Checklist

### Pre-Testing Setup

- [ ] Extension loaded di `chrome://extensions/`
- [ ] "Developer mode" enabled
- [ ] API key valid di Options
- [ ] Model selected di Options
- [ ] Background service worker console terbuka
- [ ] Webpage console terbuka (F12)

### Basic Functionality Test

- [ ] Select text di webpage
- [ ] Right-click → "GenovaAI" muncul di context menu
- [ ] Klik "GenovaAI"
- [ ] Background console menunjukkan:
  ```
  🚀 Gemini API Request: {...}
  📡 Gemini API Response Status: 200 OK
  ✅ Gemini API Parsed Response: {...}
  ✨ Gemini API Answer: ...
  ```
- [ ] Bubble muncul di webpage dengan jawaban
- [ ] Bubble auto-hide setelah 3 detik
- [ ] Atau bubble close saat di-click

### Rate Limiting Test (Gemini only)

- [ ] Buka Options → Usage Monitor
- [ ] Pastikan tier = "Free"
- [ ] Enforcement = ON
- [ ] Make 5 requests quickly
- [ ] Check progress bars increase (RPM: 5/15)
- [ ] Make 11 more requests (total 16)
- [ ] 16th request should be blocked:
  ```
  ❌ Rate limit exceeded: ...
  ```
- [ ] Wait 60 seconds
- [ ] RPM counter resets to 0
- [ ] New request succeeds

### PDF Test (Gemini with API key)

- [ ] Upload small PDF (< 5 MB) di SessionManager
- [ ] Check background console:
  ```
  Uploading to Gemini File API...
  File uploaded: gs://...
  ```
- [ ] Session created dengan fileUri
- [ ] Ask question tentang PDF content
- [ ] Answer references PDF (native understanding)

### PDF Test (OpenRouter or no API key)

- [ ] Upload PDF di SessionManager
- [ ] Check background console:
  ```
  Falling back to text extraction...
  PDF processed, text length: 12345
  ```
- [ ] Session created dengan extractedText
- [ ] Ask question tentang PDF content
- [ ] Answer references text (fallback)

---

## 🔬 Advanced Debugging

### Enable Verbose Logging

**Background script sudah include detailed logs:**

- 🚀 = API Request
- 📡 = Response Status
- 📦 = Raw Response
- ✅ = Parsed Response
- ✨ = Final Answer
- ❌ = Error

**Additional manual logging:**

```javascript
// In background console
chrome.storage.sync.get(null, (data) => {
  console.log('All settings:', data);
});

chrome.storage.local.get(null, (data) => {
  console.log('All usage data:', data);
});
```

### Network Inspection

**Monitor API calls:**

1. Background service worker console
2. Tab **Network**
3. Filter: `generativelanguage.googleapis.com` (Gemini) atau `openrouter.ai` (OpenRouter)
4. Click request → **Headers** / **Response**

**Check request headers:**
```
Content-Type: application/json
```

**Check request body:**
```json
{
  "contents": [...],
  "generationConfig": {...},
  "systemInstruction": {...}
}
```

**Check response:**
```json
{
  "candidates": [...]
}
```

### Storage Inspection

**View chrome.storage.sync:**

```
chrome://extensions/ → Background service worker console
```

```javascript
chrome.storage.sync.get(null, (data) => {
  console.table(data);
});
```

**View chrome.storage.local:**

```javascript
chrome.storage.local.get(null, (data) => {
  console.table(data);
});
```

**Clear all storage (reset extension):**

```javascript
chrome.storage.sync.clear();
chrome.storage.local.clear();
console.log('Storage cleared');
```

### Manifest Inspection

```
chrome://extensions/ → GenovaAI → Details → "Inspect manifest"
```

**Check:**
- `manifest_version: 3` ✅
- `permissions: ["storage", "contextMenus", "activeTab"]` ✅
- `host_permissions: ["<all_urls>"]` ✅
- `background.service_worker` ✅
- `content_scripts` ✅

### Force Reload Extension

**After making code changes:**

1. `npm run build`
2. `chrome://extensions/`
3. Find GenovaAI
4. Click **🔄 Reload** button

**Or use keyboard shortcut:**

`Ctrl+R` di `chrome://extensions/` page

### Test in Incognito Mode

**Check if extension works in incognito:**

1. `chrome://extensions/`
2. GenovaAI → **Details**
3. Enable **"Allow in incognito"**
4. Open incognito window
5. Test extension

**Common issue:** Extension may need separate API key setup in incognito (storage isolated).

---

## 📊 Log Examples

### Successful Request

```
🚀 Gemini API Request: {
  url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIza...",
  model: "gemini-2.0-flash-exp",
  hasSystemInstruction: true,
  partsCount: 2,
  requestBody: {
    "contents": [
      {
        "parts": [
          { "text": "Question:\nWhat is the capital of France?" }
        ]
      }
    ],
    "generationConfig": {
      "temperature": 0.3,
      "maxOutputTokens": 500
    },
    "systemInstruction": {
      "parts": [{ "text": "# Role\nYou are GenovaAI..." }]
    }
  }
}

📡 Gemini API Response Status: 200 OK

📦 Gemini API Raw Response: {"candidates":[{"content":{"parts":[{"text":"Paris"}],"role":"model"},"finishReason":"STOP","index":0}],"usageMetadata":{"promptTokenCount":150,"candidatesTokenCount":2,"totalTokenCount":152}}

✅ Gemini API Parsed Response: {
  "candidates": [
    {
      "content": {
        "parts": [
          { "text": "Paris" }
        ],
        "role": "model"
      },
      "finishReason": "STOP"
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 150,
    "candidatesTokenCount": 2,
    "totalTokenCount": 152
  }
}

✨ Gemini API Answer: Paris
Answer received: Paris
```

### Failed Request (Invalid API Key)

```
🚀 Gemini API Request: {...}

📡 Gemini API Response Status: 401 Unauthorized

❌ Gemini API Error Response: {
  "error": {
    "code": 401,
    "message": "API key not valid. Please pass a valid API key.",
    "status": "UNAUTHENTICATED"
  }
}

❌ Error in background script: Error: Gemini API error: 401 - {"error":{"code":401,"message":"API key not valid. Please pass a valid API key.","status":"UNAUTHENTICATED"}}
Error details: {
  name: "Error",
  message: "Gemini API error: 401 - {...}",
  stack: "Error: Gemini API error: 401...\n    at callGeminiAPI..."
}
```

### Failed Request (Rate Limit)

```
Processing question with GenovaAI...
Provider: gemini
Model: gemini-2.0-flash-exp
Tier: free
Rate Limiting: Enabled

Rate limit check: {
  allowed: false,
  reason: "Rate limit exceeded: Tier 'free' allows 15 requests per minute, currently at 15. Please wait or upgrade your tier.",
  current: { rpm: 15, tpm: 45000, rpd: 87 },
  limits: { rpm: 15, tpm: 30000000, rpd: 1500 }
}

(No API call made - request blocked)
```

---

## 🆘 Still Having Issues?

### 1. Check Extension Version

```
chrome://extensions/ → GenovaAI → Version: 1.4.0
```

### 2. Restart Extension

```
chrome://extensions/ → GenovaAI → 🔄 Reload
```

### 3. Restart Chrome

Sometimes Chrome cache can cause issues. Fully restart browser.

### 4. Re-install Extension

```
chrome://extensions/ → GenovaAI → Remove
npm run build
Load unpacked from dist/
```

### 5. Check Official Docs

- **Gemini API**: [https://ai.google.dev/tutorials/rest_quickstart](https://ai.google.dev/tutorials/rest_quickstart)
- **OpenRouter**: [https://openrouter.ai/docs](https://openrouter.ai/docs)

### 6. Report Bug

Jika masih error setelah semua langkah di atas:

1. Copy **semua log** dari background console
2. Copy **error message** lengkap
3. Screenshot settings page
4. Buat issue di GitHub (atau lapor ke developer)

Include:
- Chrome version: `chrome://version/`
- Extension version: `1.4.0`
- OS: Windows/Mac/Linux
- Steps to reproduce
- Full error logs

---

**Happy Debugging!** 🐛🔧

*Last Updated: November 20, 2025 | GenovaAI v1.4.0*
