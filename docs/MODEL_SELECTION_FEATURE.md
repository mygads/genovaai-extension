# Model Selection Feature - GenovaAI Extension

## ✅ Fitur Telah Ditambahkan

Extension sekarang mendukung pemilihan model AI yang dinamis untuk kedua provider (Gemini API dan OpenRouter).

## 📋 Perubahan yang Dilakukan

### 1. **Type Definitions** (`src/shared/types.ts`)
- ✅ Menambahkan `GeminiModel` type: `'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.0-flash'`
- ✅ Menambahkan `OpenRouterModel` type dengan model dari:
  - Google Gemini (2.5 Flash, 2.5 Pro, 2.0 Flash)
  - Anthropic Claude 3.5 Sonnet
  - OpenAI GPT-4o & GPT-4o Mini
- ✅ Update `Settings` interface dengan property `selectedModel`
- ✅ Update `DEFAULT_SETTINGS` dengan default `'gemini-2.5-flash'`

### 2. **Storage Utilities** (`src/shared/storage.ts`)
- ✅ Update `getSettings()` untuk auto-fix model mismatch
- ✅ Auto-switch ke model default jika provider berubah tapi model tidak sesuai
- ✅ Gemini provider → model harus dimulai dengan `'gemini-'`
- ✅ OpenRouter provider → model harus berformat `'provider/model'`

### 3. **API Handler** (`src/shared/api.ts`)
- ✅ Update `LLMRequestParams` interface dengan property `model`
- ✅ Update `callGeminiAPI()` untuk accept dynamic model parameter
- ✅ Update `callOpenRouterAPI()` untuk accept dynamic model parameter
- ✅ Model digunakan langsung di API endpoint/request body

### 4. **Background Worker** (`src/background/index.ts`)
- ✅ Pass `settings.selectedModel` ke `callLLM()`
- ✅ Log model yang digunakan ke console untuk debugging

### 5. **Options Page UI** (`src/options/components/ProviderSettings.tsx`)
- ✅ Tambahkan dropdown "Select Model" dengan icon FaRobot
- ✅ Model options berubah otomatis saat ganti provider
- ✅ Setiap model tampilkan label & deskripsi singkat
- ✅ Auto-switch ke default model saat provider berubah
- ✅ Gemini API → default: `gemini-2.5-flash`
- ✅ OpenRouter → default: `google/gemini-2.5-flash`

### 6. **Parent Component Update** (`src/options/App.tsx`)
- ✅ Pass `selectedModel` prop ke ProviderSettings
- ✅ Handle model changes di onChange callback
- ✅ Save model ke chrome.storage.sync

## 🎨 UI Components

### Model Dropdown - Gemini API
```
┌─────────────────────────────────────────────────┐
│ 🤖 Select Model                                 │
├─────────────────────────────────────────────────┤
│ ▼ Gemini 2.5 Flash • Fastest, best for quick... │
│   Gemini 2.5 Pro • Most capable for complex...  │
│   Gemini 3.0 Flash • Previous generation, fast  │
└─────────────────────────────────────────────────┘
```

### Model Dropdown - OpenRouter
```
┌─────────────────────────────────────────────────┐
│ 🤖 Select Model                                 │
├─────────────────────────────────────────────────┤
│ ▼ Gemini 2.5 Flash • Google's fastest model    │
│   Gemini 2.5 Pro • Google's most capable       │
│   Gemini 3.0 Flash • Previous generation       │
│   Claude 3.5 Sonnet • Anthropic's best model   │
│   GPT-4o • OpenAI's multimodal flagship        │
│   GPT-4o Mini • Faster, more affordable        │
└─────────────────────────────────────────────────┘
```

## 📊 Model Information

### Gemini API Models
| Model | Deskripsi | Use Case |
|-------|-----------|----------|
| **gemini-2.5-flash** | Fastest, best for quick tasks | Default, real-time responses |
| **gemini-2.5-pro** | Most capable for complex reasoning | Advanced analysis, coding |
| **gemini-2.0-flash** | Previous generation, fast | Legacy compatibility |

### OpenRouter Models
| Model | Provider | Deskripsi |
|-------|----------|-----------|
| **google/gemini-2.5-flash** | Google | Default, fastest Gemini |
| **google/gemini-2.5-pro** | Google | Most capable Gemini |
| **google/gemini-2.0-flash** | Google | Previous generation |
| **anthropic/claude-3.5-sonnet** | Anthropic | Best Claude model |
| **openai/gpt-4o** | OpenAI | Multimodal flagship |
| **openai/gpt-4o-mini** | OpenAI | Faster, affordable |

## 🔧 Technical Details

### API Compatibility

#### Gemini API (Direct)
- Menggunakan official Gemini REST API
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- Model format: `gemini-2.5-flash`, `gemini-2.5-pro`, dll
- Authentication: API key di query parameter

#### OpenRouter API (OpenAI Compatible)
- Menggunakan OpenAI compatibility layer
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Model format: `provider/model` (e.g., `google/gemini-2.5-flash`)
- Authentication: Bearer token di header
- Supports multiple providers: Google, Anthropic, OpenAI

### Auto-Correction Logic
```typescript
// Storage.ts - Auto-fix model saat provider berubah
if (settings.provider === 'gemini' && !settings.selectedModel.startsWith('gemini-')) {
  settings.selectedModel = 'gemini-2.5-flash';
} else if (settings.provider === 'openrouter' && settings.selectedModel.startsWith('gemini-') && !settings.selectedModel.includes('/')) {
  settings.selectedModel = 'google/gemini-2.5-flash';
}
```

### Model Switching Behavior
1. User pilih provider "Gemini API"
   - Dropdown otomatis show Gemini models only
   - Auto-select `gemini-2.5-flash` jika model sebelumnya dari OpenRouter
   
2. User pilih provider "OpenRouter"
   - Dropdown show semua available models (Gemini, Claude, GPT)
   - Auto-select `google/gemini-2.5-flash` jika model sebelumnya pure Gemini

## 🧪 Testing Checklist

- [ ] Build extension: `npm run build`
- [ ] Load extension di Chrome
- [ ] Buka Options page
- [ ] Test pilih Gemini API:
  - [ ] Dropdown tampil 3 Gemini models
  - [ ] Pilih setiap model, pastikan saved
- [ ] Test pilih OpenRouter:
  - [ ] Dropdown tampil 6 models total
  - [ ] Pilih Gemini models (google/*)
  - [ ] Pilih Claude model
  - [ ] Pilih GPT models
- [ ] Test context menu:
  - [ ] Select text, klik context menu
  - [ ] Pastikan model yang dipilih digunakan (check console log)
  - [ ] Test dengan Gemini API
  - [ ] Test dengan OpenRouter
- [ ] Test auto-correction:
  - [ ] Switch dari Gemini ke OpenRouter → model berubah otomatis
  - [ ] Switch dari OpenRouter ke Gemini → model berubah otomatis

## 📝 Console Logs

Saat menggunakan extension, background worker akan log:
```
Processing question with GenovaAI...
Provider: gemini
Model: gemini-2.5-flash    ← NEW LOG
Custom Prompt: false
Answer Mode: short
Active Session: My Quiz Session
```

## 🎯 User Experience

### Before (Fixed Model)
- User stuck dengan `gemini-pro` atau `google/gemini-2.0-flash-exp:free`
- Tidak bisa pilih model yang lebih cepat/powerful
- OpenRouter hanya support 1 model

### After (Dynamic Model Selection)
- User bisa pilih model sesuai kebutuhan:
  - **Quick answers**: Gemini 2.5 Flash
  - **Complex reasoning**: Gemini 2.5 Pro / Claude 3.5
  - **Coding tasks**: GPT-4o / Gemini 2.5 Pro
- Setiap model ada deskripsi jelas
- Auto-switch saat ganti provider (seamless)

## 🔗 References

- [Gemini API Models](https://ai.google.dev/models)
- [OpenRouter Models](https://openrouter.ai/models)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [OpenAI Compatibility](https://ai.google.dev/gemini-api/docs/openai)

## ⚠️ Notes

1. **Model Availability**: Beberapa model di OpenRouter mungkin berbayar atau memiliki rate limits
2. **Performance**: Model Pro lebih lambat tapi lebih akurat daripada Flash
3. **Cost**: User bertanggung jawab atas biaya API sesuai provider yang dipilih
4. **Temperature**: Tetap di 0.3 untuk consistency (sesuai spesifikasi awal)
5. **Max Tokens**: Tetap 500 tokens untuk answer (short & quick responses)

---

**Status**: ✅ Complete & Ready for Testing
**Date**: November 20, 2025
**Version**: 1.1.0 (Model Selection Feature)
