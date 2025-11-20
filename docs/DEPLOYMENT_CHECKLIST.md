# 🚀 GenovaAI Extension - Deployment Checklist

## Pre-Launch Checklist

### 1. Development Setup ✅
- [x] All files created
- [x] Dependencies configured
- [x] TypeScript properly typed
- [x] Manifest V3 configured

### 2. Before First Run

#### Required Steps:
- [ ] Run `npm install` to install dependencies
- [ ] Run `npm run dev` to start development server
- [ ] Verify `dist/` folder is created

#### Chrome Extension Loading:
- [ ] Open Chrome browser
- [ ] Navigate to `chrome://extensions/`
- [ ] Enable "Developer mode" (toggle in top-right corner)
- [ ] Click "Load unpacked" button
- [ ] Select the `dist` folder from your project

### 3. Initial Configuration

#### Get API Keys:
- [ ] Choose your LLM provider:
  - [ ] **Gemini API** (Free tier available)
    - Visit: https://makersuite.google.com/app/apikey
    - Create/Copy API key
  - [ ] **OpenRouter API**
    - Visit: https://openrouter.ai/keys
    - Create account and get API key

#### Extension Setup:
- [ ] Click extension icon in Chrome toolbar (or right-click → Options)
- [ ] Select LLM provider (Gemini or OpenRouter)
- [ ] Paste API key
- [ ] Select answer mode (start with "short")
- [ ] Verify bubble appearance settings

### 4. Test Basic Functionality

#### Context Menu Test:
- [ ] Go to any webpage
- [ ] Select some text
- [ ] Right-click on selected text
- [ ] Verify "GenovaAI" appears in context menu
- [ ] Click "GenovaAI"
- [ ] Wait for response (should show bubble)

#### Bubble Display Test:
- [ ] Verify bubble appears with answer
- [ ] Check bubble position matches settings
- [ ] Verify bubble colors match settings
- [ ] Wait 3 seconds - bubble should auto-hide
- [ ] Try clicking bubble to dismiss early

### 5. Test Session Management

#### Create Session:
- [ ] Open options page
- [ ] Click "Add New Session"
- [ ] Enter session name (e.g., "Test Subject")
- [ ] Paste some study material or upload .txt file
- [ ] Click "Save Session"
- [ ] Verify session appears in list

#### Use Session:
- [ ] Click "Set Active" on your session
- [ ] Verify checkmark appears
- [ ] Test with selected text
- [ ] Verify AI uses session material in answer

### 6. Test All Answer Modes

- [ ] **Option Mode**:
  - Select question with multiple choice
  - Right-click → GenovaAI
  - Should return single letter (A/B/C/D/E)

- [ ] **Short Mode**:
  - Select any question
  - Right-click → GenovaAI
  - Should return brief answer

- [ ] **Full Mode**:
  - Select any question
  - Right-click → GenovaAI
  - Should return detailed explanation

### 7. Test Customization

- [ ] Change bubble position (try all 4 corners)
- [ ] Change background color
- [ ] Change text color
- [ ] Verify preview updates live
- [ ] Test on actual webpage

### 8. Error Handling Tests

- [ ] Try without API key (should show error)
- [ ] Try with invalid API key (should show error)
- [ ] Try without internet connection (should show error)
- [ ] Verify error messages appear in bubble

### 9. Browser Console Check

- [ ] Open DevTools (F12)
- [ ] Check Console for errors
- [ ] No errors should appear during normal use
- [ ] Verify logs appear in background service worker

### 10. Final Verification

- [ ] Extension icon appears in toolbar
- [ ] Options page opens correctly
- [ ] All UI elements render properly
- [ ] Settings save and persist
- [ ] Sessions save and persist
- [ ] API calls work consistently
- [ ] Bubble animations smooth
- [ ] No TypeScript errors
- [ ] No browser console errors

## 🐛 Troubleshooting Guide

### Extension Won't Load
1. Check if `dist` folder exists
2. Reload extension at `chrome://extensions/`
3. Check console for errors
4. Try `npm run dev` again

### API Not Working
1. Verify API key is correct
2. Check internet connection
3. Verify provider is selected correctly
4. Check browser console for detailed error
5. Try different LLM provider

### Bubble Not Showing
1. Verify content script loaded (DevTools → Sources)
2. Check bubble position settings
3. Verify you selected text before right-clicking
4. Check for JavaScript errors in console

### Settings Not Saving
1. Check Chrome storage permissions
2. Verify no console errors
3. Try closing and reopening options page

### Build Errors
1. Run `npm install` again
2. Clear node_modules: `rm -rf node_modules && npm install`
3. Check Node.js version (should be 18+)
4. Verify all files exist in `src/` folder

## 📋 Daily Development Workflow

1. **Start**: `npm run dev`
2. **Code**: Make your changes
3. **Reload**: Click reload icon in `chrome://extensions/` (for background changes)
4. **Test**: Verify functionality works
5. **Debug**: Check console for errors
6. **Iterate**: Repeat as needed

## 🎯 Quick Test Scenarios

### Scenario 1: Multiple Choice Question
```
Text to select: "What is 2+2? A) 3 B) 4 C) 5 D) 6"
Expected (option mode): "B"
Expected (short mode): "4" or "B) 4"
Expected (full mode): "The answer is B) 4..."
```

### Scenario 2: With Study Material
1. Create session with material: "Python is a programming language"
2. Set as active
3. Select: "What is Python?"
4. Expected: Answer should reference it being a programming language

### Scenario 3: Error Handling
1. Remove API key
2. Try to use extension
3. Expected: Error bubble appears with helpful message

## ✅ Ready for Production

When all items are checked:
- [ ] Run `npm run build`
- [ ] Test the production build
- [ ] Extension is ready for use!

---

**Next Steps**: 
1. Run `npm install`
2. Run `npm run dev`
3. Load extension in Chrome
4. Configure API key
5. Start testing!

Good luck! 🎉
