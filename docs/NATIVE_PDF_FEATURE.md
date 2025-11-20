# Native PDF Understanding Feature - GenovaAI Extension

## ✅ Fitur Telah Ditambahkan (v1.2.0)

Extension sekarang mendukung **Native PDF Understanding** menggunakan Gemini File API, memungkinkan model untuk memahami PDF secara visual (bukan hanya ekstraksi teks).

## 🎯 Keunggulan Native PDF Understanding

### Before (Text Extraction Only):
- ❌ Hanya baca teks, tidak bisa lihat layout
- ❌ Diagram, grafik, tabel hilang konteksnya
- ❌ Formatting & struktur dokumen tidak terbaca
- ❌ Gambar dalam PDF diabaikan

### After (Native Visual Understanding):
- ✅ **Memahami layout & struktur** dokumen
- ✅ **Melihat diagram, grafik, tabel** dalam konteks visual
- ✅ **Memproses hingga 1000 halaman** per PDF
- ✅ **Menganalisis gambar** dalam dokumen
- ✅ **Mempertahankan formatting** dan hierarki visual

## 📋 Perubahan yang Dilakukan

### 1. **Type Definitions** (`src/shared/types.ts`)
```typescript
export interface KnowledgeFile {
  name: string;
  type: 'pdf' | 'txt';
  content: string;       // Fallback text untuk OpenRouter
  fileUri?: string;      // Gemini File API URI (native PDF)
  mimeType?: string;     // application/pdf
}
```

### 2. **File API Helper** (`src/shared/fileApi.ts`) - NEW FILE
✅ Fungsi upload PDF ke Gemini File API:
- `uploadFileToGemini()` - Upload file dengan multipart/related
- `waitForFileProcessing()` - Polling status until ACTIVE
- `getFileInfo()` - Get file metadata
- `deleteFile()` - Delete file dari API
- `uploadPDFFile()` - All-in-one helper (upload + wait)

**Key Features**:
- Multipart form data upload
- Status polling setiap 2 detik (max 30 attempts = 60 detik)
- Error handling untuk FAILED state
- Files stored for 48 hours (auto-delete by Gemini)

### 3. **API Handler** (`src/shared/api.ts`)
✅ Update untuk multimodal support:

**New Interface**:
```typescript
export interface LLMRequestParams {
  provider: LLMProvider;
  apiKey: string;
  model: GeminiModel | OpenRouterModel;
  systemInstruction?: string;    // Separated from content
  knowledgeText?: string;        // Plain text knowledge
  knowledgeFiles?: KnowledgeFile[]; // PDF/TXT files
  question: string;              // User question
}
```

**Gemini API - Multimodal Contents**:
```typescript
const parts: any[] = [];

// 1. Text knowledge
if (knowledgeText) {
  parts.push({ text: `Knowledge Base:\n${knowledgeText}` });
}

// 2. PDF files (native visual understanding)
for (const file of knowledgeFiles) {
  if (file.type === 'pdf' && file.fileUri) {
    parts.push({
      fileData: {
        fileUri: file.fileUri,   // Gemini File API URI
        mimeType: file.mimeType  // application/pdf
      }
    });
  }
}

// 3. Question
parts.push({ text: `Question:\n${question}` });

// Send to Gemini
const requestBody = {
  contents: [{ parts }],
  systemInstruction: { parts: [{ text: systemInstruction }] },
  generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
};
```

**OpenRouter - Text Fallback**:
- Tidak support File API
- Menggunakan `file.content` (extracted text) sebagai fallback
- Combined dalam single user message

### 4. **SessionManager** (`src/options/components/SessionManager.tsx`)
✅ Smart PDF upload logic:

```typescript
const handleFileUpload = async (file) => {
  if (file.type === 'pdf') {
    // Try native upload for Gemini
    if (settings.provider === 'gemini' && settings.apiKey) {
      try {
        // 1. Upload to Gemini File API
        const { uri, mimeType } = await uploadPDFFile(
          settings.apiKey,
          arrayBuffer,
          fileName
        );
        
        // 2. Extract text as fallback
        const extractedText = await extractTextFromFile(file);
        
        // 3. Store both
        return {
          name: fileName,
          type: 'pdf',
          content: extractedText,  // For OpenRouter
          fileUri: uri,            // For Gemini native
          mimeType: mimeType
        };
      } catch (error) {
        // Fallback to text-only
      }
    }
  }
};
```

**Upload Flow**:
1. User pilih PDF file
2. Check: Gemini provider + API key ada?
   - YES → Upload ke File API + extract text (dual mode)
   - NO → Extract text only (fallback)
3. Simpan ke chrome.storage.sync
4. File uploaded otomatis dihapus setelah 48 jam

### 5. **Background Worker** (`src/background/index.ts`)
✅ Simplified prompt building:

**Old Way (Combined Prompt)**:
```typescript
const finalPrompt = buildPrompt(
  useCustomPrompt, userPrompt, answerMode, 
  knowledge, question
);
```

**New Way (Separated Components)**:
```typescript
const systemInstruction = buildSystemInstruction(
  useCustomPrompt, userPrompt, answerMode
);

await callLLM({
  systemInstruction,      // System context
  knowledgeText,          // Plain text knowledge
  knowledgeFiles,         // PDF with File API URI
  question                // User question
});
```

## 🎨 User Experience

### Options Page - File Upload
```
┌─────────────────────────────────────────────┐
│ 📤 Upload PDF or TXT File                   │
├─────────────────────────────────────────────┤
│ [Choose File] No file chosen                │
│                                             │
│ Uploaded Files:                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 📄 lecture-notes.pdf            [✕]    │ │
│ │    ↳ Native PDF (Gemini File API)      │ │
│ │    ↳ Fallback text (OpenRouter ready)  │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ 📄 summary.txt                  [✕]    │ │
│ │    ↳ Text content                      │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Console Logs (Background Worker)
```
File uploaded: files/abc123xyz
File ready: https://generativelanguage.googleapis.com/v1beta/files/abc123xyz
Processing question with GenovaAI...
Provider: gemini
Model: gemini-2.5-flash
Knowledge Files: 2
  - lecture-notes.pdf (Native PDF via File API)
  - summary.txt (Text content)
Answer received: ...
```

## 🔧 Technical Details

### Gemini File API Specifications

**Upload Endpoint**:
```
POST https://generativelanguage.googleapis.com/upload/v1beta/files?key={API_KEY}
Content-Type: multipart/related; boundary=----WebKitFormBoundary...
```

**Multipart Body**:
```
------WebKitFormBoundary...
Content-Type: application/json; charset=UTF-8

{
  "file": {
    "displayName": "lecture-notes.pdf",
    "mimeType": "application/pdf"
  }
}
------WebKitFormBoundary...
Content-Type: application/pdf
Content-Transfer-Encoding: base64

<base64-encoded-pdf-data>
------WebKitFormBoundary...--
```

**Upload Response**:
```json
{
  "file": {
    "name": "files/abc123xyz",
    "uri": "https://generativelanguage.googleapis.com/v1beta/files/abc123xyz",
    "mimeType": "application/pdf",
    "sizeBytes": "1234567",
    "state": "PROCESSING",
    "createTime": "2025-11-20T10:00:00Z",
    "expirationTime": "2025-11-22T10:00:00Z"
  }
}
```

**File States**:
- `PROCESSING` - Still being processed (wait 2s, poll again)
- `ACTIVE` - Ready to use in API calls
- `FAILED` - Processing failed (throw error)

**Get File Info**:
```
GET https://generativelanguage.googleapis.com/v1beta/files/{name}?key={API_KEY}
```

### generateContent with File URI

**Request Body**:
```json
{
  "contents": [{
    "parts": [
      { "text": "Knowledge Base:\nThis is text knowledge" },
      {
        "fileData": {
          "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/abc123xyz",
          "mimeType": "application/pdf"
        }
      },
      { "text": "Question:\nWhat is the main topic?" }
    ]
  }],
  "systemInstruction": {
    "parts": [{ "text": "You are GenovaAI..." }]
  },
  "generationConfig": {
    "temperature": 0.3,
    "maxOutputTokens": 500
  }
}
```

### PDF Processing Details

**Supported**:
- PDF files up to **50 MB**
- Up to **1000 pages** per document
- Native visual understanding (layout, diagrams, tables)
- Text extraction included automatically

**Limitations**:
- Files expire after **48 hours**
- Processing time: ~2-10 seconds per file
- Max 30 polling attempts (60 seconds timeout)
- Only works with Gemini provider

**Token Counting** (Gemini 3+):
- PDF pages counted in **IMAGE** modality
- Native text in PDF not charged (extracted automatically)
- ~258 tokens per page

## 🔀 Fallback Strategy

Extension implements intelligent fallback:

```
┌─────────────────────────────────────────────┐
│ PDF Upload Attempt                          │
└─────────────────────────────────────────────┘
         │
         ├─ Provider = Gemini & API Key ✓
         │         │
         │         ├─ Upload to File API
         │         │      │
         │         │      ├─ SUCCESS → fileUri + content
         │         │      └─ FAIL → Extract text only
         │         │
         └─ Provider = OpenRouter OR No API Key
                   │
                   └─ Extract text only (no File API)
```

**Why Dual Mode?**
1. **Gemini**: Use native PDF understanding for better accuracy
2. **OpenRouter**: Use extracted text (no File API support)
3. **No API Key**: Still allow file upload (extract text for later)

## 📊 Performance Comparison

| Feature | Text Extraction Only | Native PDF Understanding |
|---------|---------------------|-------------------------|
| **Diagram/Chart** | ❌ Lost | ✅ Understood visually |
| **Table Layout** | ⚠️ Flat text | ✅ Structure preserved |
| **Images** | ❌ Ignored | ✅ Analyzed |
| **Formatting** | ❌ Lost | ✅ Understood |
| **Multi-column** | ⚠️ Mixed up | ✅ Correct order |
| **Processing Time** | ~1s | ~5-10s (upload + process) |
| **Max Pages** | Unlimited | 1000 pages |
| **File Size** | Unlimited | 50 MB |
| **Provider** | All | Gemini only |

## 🧪 Testing Checklist

- [ ] Upload PDF dengan Gemini provider
  - [ ] File < 10 MB (fast processing)
  - [ ] File > 10 MB (slower processing)
  - [ ] Verify File API URI stored
  - [ ] Verify fallback text extracted
- [ ] Upload PDF tanpa API key
  - [ ] Should extract text only
  - [ ] No File API upload attempt
- [ ] Upload PDF dengan OpenRouter provider
  - [ ] Should extract text only (no File API)
- [ ] Test context menu dengan PDF session active
  - [ ] Gemini: Uses File API URI
  - [ ] OpenRouter: Uses extracted text
- [ ] Test dengan PDF containing:
  - [ ] Diagrams/charts
  - [ ] Tables with complex layout
  - [ ] Images dengan captions
  - [ ] Multi-column layout
- [ ] Test error scenarios:
  - [ ] File API upload fails → fallback to text
  - [ ] Processing timeout → fallback to text
  - [ ] Invalid API key → extract text only

## 📝 Usage Example

### Scenario: Quiz tentang Diagram dalam PDF

**PDF Content**:
```
+----------------+
| Photosynthesis |
+----------------+
   ↓
Sunlight + CO2 + H2O
   ↓
Glucose + O2
```

**Selected Text**: "What are the products of photosynthesis?"

**Extension Behavior**:

1. **With Native PDF (Gemini)**:
   - Model sees the diagram visually
   - Understands arrows & layout
   - Answer: "Glucose and O2" ✅

2. **Without Native PDF (Text Only)**:
   - Model sees: "Photosynthesis Sunlight CO2 H2O Glucose O2"
   - No arrow information
   - Answer: "Unclear from text" ❌

## ⚠️ Important Notes

1. **File Expiration**: Files auto-delete after 48 hours
   - No persistence across days
   - Need to re-upload if session reused after 2 days
   
2. **API Key Required**: File API upload requires valid Gemini API key
   - Set API key BEFORE uploading PDF
   - Extension checks key before upload attempt

3. **Provider Switching**: 
   - Gemini → Native PDF understanding
   - OpenRouter → Falls back to extracted text
   - Both work, Gemini gives better results

4. **Storage Efficiency**:
   - File URI: ~100 bytes (just the URI string)
   - Extracted text: Can be MBs (full text content)
   - Both stored for maximum compatibility

5. **Cost Implications**:
   - File API upload: Free
   - File storage: Free (48 hours)
   - Token usage: ~258 tokens/page for visual understanding
   - Check [Gemini API Pricing](https://ai.google.dev/pricing)

## 🔗 References

- [Gemini API - Document Understanding](https://ai.google.dev/gemini-api/docs/document-processing)
- [File API Documentation](https://ai.google.dev/gemini-api/docs/prompting-with-media#upload-file)
- [Multimodal Prompting Guide](https://ai.google.dev/gemini-api/docs/file-prompting-strategies)
- [Token Counting](https://ai.google.dev/gemini-api/docs/tokens)

---

**Status**: ✅ Complete & Ready for Testing  
**Date**: November 20, 2025  
**Version**: 1.2.0 (Native PDF Understanding)  
**Breaking Changes**: None (backward compatible with text extraction)
