# 🔧 Quick Fix: Settings Not Persisting

**Issue:** Settings hilang setelah refresh halaman options

## ✅ Langkah Debug & Fix:

### 1️⃣ Rebuild Extension dengan Logging Baru

```bash
npm run build
```

### 2️⃣ Reload Extension di Chrome

1. Buka `chrome://extensions/`
2. Cari **GenovaAI**
3. Klik tombol **🔄 Reload**

### 3️⃣ Buka Options Page dengan Console

1. Klik icon **GenovaAI** di toolbar
2. **ATAU** klik kanan icon → **Options**
3. Di halaman options, tekan **F12** untuk buka DevTools
4. Pilih tab **Console**

### 4️⃣ Test Save Settings

**Masukkan API key dan setting lainnya**, lalu perhatikan log:

**✅ LOG YANG BENAR (Settings Saved Successfully):**

```
🔄 App.tsx: Loading data...
📥 Loading settings from chrome.storage.sync...
📦 Storage result: { genovaai_settings: {...} }
✅ Found saved settings: { provider: 'gemini', apiKey: 'AIza...', ... }
✨ Final settings: {...}
✅ App.tsx: Data loaded: { settings: {...}, sessionsCount: 0 }

(User mengubah settings...)

💾 App.tsx: Saving settings... {provider: 'gemini', apiKey: 'AIza...', ...}
💾 Saving settings to chrome.storage.sync...
📝 Settings to save: {provider: 'gemini', apiKey: 'AIza...', ...}
✅ Settings saved successfully
🔍 Verification read: {provider: 'gemini', apiKey: 'AIza...', ...}
✅ App.tsx: Settings saved successfully
```

**❌ LOG YANG ERROR (Settings NOT Saved):**

```
❌ Error saving settings: Error: QUOTA_BYTES_PER_ITEM quota exceeded
```

**ATAU**

```
❌ Error saving settings: Error: chrome.storage.sync is undefined
```

### 5️⃣ Refresh Page & Cek Apakah Settings Load

1. **Refresh** halaman options (F5)
2. Perhatikan log di console:

```
🔄 App.tsx: Loading data...
📥 Loading settings from chrome.storage.sync...
📦 Storage result: { genovaai_settings: {...} }
✅ Found saved settings: { provider: 'gemini', apiKey: 'AIza...', ... }
```

**Jika API key dan settings lainnya muncul kembali → ✅ FIXED!**

**Jika masih kosong → ⚠️ Ada masalah storage**

---

## 🐛 Possible Issues & Solutions

### Issue 1: QUOTA_BYTES_PER_ITEM exceeded

**Error:**
```
❌ Error saving settings: Error: QUOTA_BYTES_PER_ITEM quota exceeded
```

**Penyebab:**
- `chrome.storage.sync` memiliki limit **8 KB per item**
- Jika `userPrompt` terlalu panjang (> 8000 karakter), akan gagal

**Solusi:**
1. Gunakan prompt yang lebih pendek
2. **ATAU** pindah ke `chrome.storage.local` (unlimited)

**Fix di code** (jika perlu):

Edit `src/shared/storage.ts`:

```typescript
// Ganti semua chrome.storage.sync dengan chrome.storage.local
await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
```

### Issue 2: chrome.storage is undefined

**Error:**
```
❌ Error saving settings: Cannot read property 'sync' of undefined
```

**Penyebab:**
- Extension tidak punya permission `storage`
- Manifest tidak ter-load dengan benar

**Solusi:**

1. Cek `manifest.json` di **dist/** folder:

```json
{
  "permissions": [
    "storage",
    "contextMenus",
    "activeTab"
  ]
}
```

2. Jika `storage` tidak ada, rebuild:

```bash
npm run build
```

3. Reload extension di `chrome://extensions/`

### Issue 3: Settings load tapi tidak save

**Symptoms:**
- Log menunjukkan "Settings saved successfully"
- Tapi setelah refresh, settings hilang

**Debug:**

Di console options page, cek storage secara manual:

```javascript
// Check apakah data benar-benar tersimpan
chrome.storage.sync.get('genovaai_settings', (result) => {
  console.log('Manual check:', result);
});

// Cek semua storage
chrome.storage.sync.get(null, (result) => {
  console.log('All storage:', result);
});
```

**Jika hasilnya kosong:**

- Storage API tidak berfungsi
- Mungkin Chrome bug
- **Solusi:** Gunakan `chrome.storage.local` instead

### Issue 4: Settings save tapi load default

**Symptoms:**
- Save berhasil
- Verification read menunjukkan data
- Tapi setelah refresh, load DEFAULT_SETTINGS

**Penyebab:**
- Storage key berbeda saat save vs load
- React state tidak update

**Debug:**

Cek key yang digunakan:

```typescript
const STORAGE_KEYS = {
  SETTINGS: 'genovaai_settings',  // Pastikan sama di semua tempat
  SESSIONS: 'genovaai_sessions',
};
```

**Cek di console:**

```javascript
chrome.storage.sync.get('genovaai_settings', (result) => {
  console.log('Saved with key "genovaai_settings":', result);
});
```

---

## 🔍 Manual Storage Inspection

### View All Stored Data

**Di Options page console:**

```javascript
// View settings
chrome.storage.sync.get('genovaai_settings', (result) => {
  console.log('Settings:', result.genovaai_settings);
});

// View sessions
chrome.storage.sync.get('genovaai_sessions', (result) => {
  console.log('Sessions:', result.genovaai_sessions);
});

// View ALL storage
chrome.storage.sync.get(null, (all) => {
  console.log('All sync storage:', all);
});

// Check storage usage
chrome.storage.sync.getBytesInUse(null, (bytes) => {
  console.log('Storage used:', bytes, 'bytes');
  console.log('Storage used:', (bytes / 1024).toFixed(2), 'KB');
});
```

### Manually Save Test Data

```javascript
// Test save
chrome.storage.sync.set({
  'genovaai_settings': {
    provider: 'gemini',
    apiKey: 'TEST_KEY',
    selectedModel: 'gemini-2.0-flash'
  }
}, () => {
  console.log('Test data saved');
  
  // Verify
  chrome.storage.sync.get('genovaai_settings', (result) => {
    console.log('Verification:', result);
  });
});
```

### Clear All Storage (Reset)

**⚠️ WARNING: This will delete ALL settings and sessions!**

```javascript
chrome.storage.sync.clear(() => {
  console.log('All storage cleared');
});

chrome.storage.local.clear(() => {
  console.log('Local storage cleared');
});
```

---

## 🚀 Alternative: Switch to chrome.storage.local

Jika `chrome.storage.sync` bermasalah, gunakan `chrome.storage.local`:

### Advantages:
- ✅ **Unlimited quota** (limited only by disk space)
- ✅ Faster read/write
- ✅ No sync issues

### Disadvantages:
- ❌ Data tidak sync antar devices
- ❌ Data hilang jika extension di-uninstall

### How to Switch:

**Edit `src/shared/storage.ts`:**

```typescript
// Find & Replace:
chrome.storage.sync → chrome.storage.local

// Example:
export async function getSettings(): Promise<Settings> {
  try {
    console.log('📥 Loading settings from chrome.storage.local...');
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    // ... rest of code
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    console.log('💾 Saving settings to chrome.storage.local...');
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
    // ... rest of code
  }
}
```

**Setelah edit:**

```bash
npm run build
# Reload extension di chrome://extensions/
```

---

## ✅ Expected Behavior (After Fix)

### Save Flow:
1. User mengubah setting (e.g., input API key)
2. `handleSettingsChange()` triggered
3. Console log: `💾 App.tsx: Saving settings...`
4. Console log: `✅ Settings saved successfully`
5. UI shows: **"✓ Saved"** badge di kanan atas (2 detik)

### Load Flow (After Refresh):
1. Page refresh (F5)
2. Console log: `🔄 App.tsx: Loading data...`
3. Console log: `✅ Found saved settings: {...}`
4. UI shows: API key field terisi, model selected, dll

---

## 📞 If Still Not Working

### Collect Debug Info:

1. **Copy all console logs** dari options page
2. **Check manifest.json** di dist/ folder
3. **Check Chrome version**: `chrome://version/`
4. **Test with simple save**:

```javascript
// Di options page console
chrome.storage.sync.set({ test: 'hello' }, () => {
  console.log('Test saved');
  chrome.storage.sync.get('test', (r) => {
    console.log('Test read:', r.test);
  });
});
```

Jika test sederhana ini tidak berhasil → Chrome storage API bermasalah (restart Chrome atau reinstall extension).

---

**Last Updated:** November 20, 2025  
**Version:** 1.4.0
