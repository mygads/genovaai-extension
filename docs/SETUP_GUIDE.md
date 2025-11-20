# GenovaAI Extension - Quick Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development
```bash
npm run dev
```

### 3. Load in Chrome
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `dist` folder from this project

## ⚙️ Initial Configuration

### Step 1: Open Options Page
- Click the extension icon in Chrome toolbar
- Or right-click anywhere and select "Options"

### Step 2: Configure API
1. Choose your LLM Provider:
   - **Gemini API** (Free): Get key from https://makersuite.google.com/app/apikey
   - **OpenRouter API**: Get key from https://openrouter.ai/keys

2. Enter your API Key

### Step 3: Set Answer Mode
- **option**: Only returns A/B/C/D/E (best for multiple choice)
- **short**: Brief answer
- **full**: Detailed explanation

### Step 4: Create a Study Session (Optional)
1. Click "Add New Session"
2. Give it a name (e.g., "Biology Chapter 5")
3. Paste your study material or upload a .txt file
4. Click "Save Session"
5. Click "Set Active" to use this session

## 📖 How to Use

1. **Highlight text** on any webpage (e.g., a quiz question with options)
2. **Right-click** on the selected text
3. **Select "GenovaAI"** from the context menu
4. **Wait** for the AI to process (usually 1-3 seconds)
5. **See the answer** in a bubble overlay

## 🎨 Customize Bubble

In Options page > Bubble Appearance:
- Choose position (top-left, bottom-right, etc.)
- Pick background color
- Pick text color
- See live preview

## 🔧 Troubleshooting

### Extension not working?
1. Check `chrome://extensions/` for errors
2. Reload the extension (click refresh icon)
3. Check browser console (F12) for errors

### No answer showing?
1. Make sure you entered a valid API key
2. Check your internet connection
3. Verify you selected text before right-clicking
4. Check console for API errors

### Bubble in wrong position?
- Go to Options > Bubble Appearance
- Change position setting

## 📝 Tips

- **Create sessions for different subjects** to get more accurate answers
- **Use "option" mode** for quick multiple choice tests
- **Use "full" mode** when you want explanations
- **Click the bubble** to dismiss it early
- **The bubble auto-hides** after 3 seconds

## 🔄 Updating the Extension

After making code changes:
1. Save your files
2. Go to `chrome://extensions/`
3. Click the reload icon on GenovaAI extension
4. Test your changes

## 📦 Building for Production

```bash
npm run build
```

The production-ready extension will be in the `dist` folder.

---

**Happy learning with GenovaAI!** 🎓✨
