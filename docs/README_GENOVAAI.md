# GenovaAI – Smart Quiz Assistant

A powerful Chrome extension built with CRXJS, Vite, TypeScript, and React that helps you answer quiz questions using AI (Gemini or OpenRouter API).

## Features

- 🎯 **Context Menu Integration**: Right-click on selected text to get AI-powered answers
- 🤖 **Multiple LLM Providers**: Support for Gemini API and OpenRouter API
- 📚 **Session Management**: Create and manage study material sessions
- 🎨 **Customizable Bubble UI**: Configure position, colors, and appearance
- ⚡ **Answer Modes**:
  - `option`: Returns only letter (A/B/C/D/E)
  - `short`: Brief answer
  - `full`: Detailed explanation
- 💾 **Local Storage**: All settings stored locally using Chrome Storage API

## Project Structure

```
genovaai-extension/
├── src/
│   ├── background/
│   │   └── index.ts           # Background service worker
│   ├── content/
│   │   ├── index.ts           # Content script
│   │   └── bubble.css         # Bubble UI styles
│   ├── options/
│   │   ├── index.html         # Options page HTML
│   │   ├── index.tsx          # Options entry point
│   │   ├── App.tsx            # Main options component
│   │   ├── styles.css         # Options page styles
│   │   └── components/
│   │       ├── ProviderSettings.tsx
│   │       ├── AnswerModeSettings.tsx
│   │       ├── BubbleSettings.tsx
│   │       └── SessionManager.tsx
│   └── shared/
│       ├── types.ts           # TypeScript types
│       ├── storage.ts         # Chrome storage utilities
│       └── api.ts             # LLM API handlers
├── manifest.config.ts         # Extension manifest
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies

```

## Installation & Development

### Prerequisites

- Node.js 18+ and npm
- Chrome browser

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Load extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `dist` folder from your project

### Build for Production

```bash
npm run build
```

The built extension will be in the `dist` folder.

## Usage

### 1. Configure Settings

1. Click the extension icon or right-click and select "Options"
2. Configure your settings:
   - **LLM Provider**: Choose between Gemini or OpenRouter
   - **API Key**: Enter your API key
   - **Answer Mode**: Select option/short/full
   - **Bubble Appearance**: Customize position and colors

### 2. Create Study Sessions

1. Go to the Session Management section in Options
2. Click "Add New Session"
3. Enter session name and paste/upload your study material
4. Click "Set Active" to use that session

### 3. Use the Extension

1. Select text on any webpage (e.g., a quiz question)
2. Right-click and select "GenovaAI"
3. The AI will analyze the question with your study material
4. Answer appears in a bubble at your configured position

## API Keys

### Gemini API
Get your free API key from: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

### OpenRouter API
Get your API key from: [https://openrouter.ai/keys](https://openrouter.ai/keys)

## Configuration

### Answer Modes

- **option**: Returns only one letter (A/B/C/D/E) - perfect for multiple choice
- **short**: Brief, concise answer
- **full**: Detailed explanation with context

### Bubble Customization

- Position: top-left, top-right, bottom-left, bottom-right
- Background color: Any hex color
- Text color: Any hex color
- Auto-hide after 3 seconds
- Click to dismiss

### Session Management

- Create multiple study sessions
- Each session stores material (text or .txt file)
- Set one session as active at a time
- Active session material is included in AI prompts

## Technical Details

### Technologies

- **CRXJS**: Chrome Extension development with Vite
- **Vite**: Fast build tool and dev server
- **React 19**: UI framework
- **TypeScript**: Type-safe development
- **Chrome Extension Manifest V3**: Latest extension standard

### Permissions

- `contextMenus`: Add right-click menu
- `storage`: Store settings and sessions
- `activeTab`: Access current tab
- `scripting`: Inject content scripts
- Host permissions for API endpoints

### Storage

All data is stored locally using `chrome.storage.sync`:
- Settings (provider, API key, modes, appearance)
- Study sessions (name, material, metadata)
- Active session ID

## Development Tips

### Hot Reload

The dev server supports hot reload for most changes. For manifest or background script changes, you may need to reload the extension:

1. Go to `chrome://extensions/`
2. Click the reload icon on your extension

### Debugging

- **Background Script**: Inspect via "Service Worker" link in `chrome://extensions/`
- **Content Script**: Use browser DevTools on the webpage
- **Options Page**: Right-click on options page → Inspect

### Adding Features

1. Update types in `src/shared/types.ts`
2. Add storage helpers in `src/shared/storage.ts`
3. Implement in background/content/options as needed
4. Test thoroughly in dev mode

## Troubleshooting

### Extension doesn't load
- Check console for errors in `chrome://extensions/`
- Ensure `dist` folder exists after running `npm run dev`
- Try removing and re-adding the extension

### API errors
- Verify your API key is correct
- Check internet connection
- Ensure API provider is selected correctly
- Check browser console for detailed error messages

### Bubble not showing
- Ensure content script is loaded (check DevTools → Sources)
- Verify you selected text before right-clicking
- Check bubble position settings

## License

MIT License - feel free to use and modify!

## Author

Built with ❤️ for students who need a smart quiz assistant.

---

**Note**: This extension is for educational purposes. Always verify AI-generated answers and use responsibly during assessments.
