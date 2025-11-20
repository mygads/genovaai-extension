// Background service worker for GenovaAI Extension
import { getSettings, getActiveSession, addHistoryToSession, addErrorLog } from '../shared/storage';
import { callLLM, buildSystemInstruction } from '../shared/api';
import type { GenovaMessage, GeminiModel } from '../shared/types';
import {
  getUsageData,
  resetUsageIfNeeded,
  checkRateLimit,
  updateUsage,
  estimateTokens,
} from '../shared/rateLimits';

const CONTEXT_MENU_ID = 'genovaai-analyze';

// Initialize context menu when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'GenovaAI',
    contexts: ['selection'],
  });
  
  console.log('GenovaAI Extension installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id) {
    return;
  }

  const selectedText = info.selectionText;
  if (!selectedText || selectedText.trim() === '') {
    sendErrorToTab(tab.id, 'Tidak ada teks yang dipilih');
    return;
  }

  // Get settings and active session
  let settings;
  let activeSession;
  
  try {
    settings = await getSettings();
    activeSession = await getActiveSession();
  } catch (error) {
    console.error('Failed to get settings:', error);
    sendErrorToTab(tab.id, 'Gagal memuat pengaturan');
    return;
  }

  try {
    // Validate API key
    if (!settings.apiKey || settings.apiKey.trim() === '') {
      sendErrorToTab(tab.id, 'API key belum diatur di Settings.');
      return;
    }

    // Rate limiting check (only for Gemini provider)
    if (settings.provider === 'gemini' && settings.enforceRateLimit) {
      const usage = await resetUsageIfNeeded(await getUsageData());
      
      // Estimate tokens for this request
      const knowledgeText = activeSession?.knowledgeText || '';
      const estimatedTokens = estimateTokens(
        buildSystemInstruction(settings.useCustomPrompt, settings.userPrompt, settings.answerMode) +
        knowledgeText +
        selectedText
      );

      // Check rate limit
      const rateCheck = checkRateLimit(
        settings.apiTier,
        settings.selectedModel as GeminiModel,
        usage,
        estimatedTokens
      );

      if (!rateCheck.allowed) {
        sendErrorToTab(tab.id, rateCheck.reason || 'Rate limit exceeded');
        return;
      }
    }

    // Build knowledge from active session
    let knowledgeText = '';
    if (activeSession) {
      knowledgeText = activeSession.knowledgeText || '';
    }

    // Build system instruction based on custom prompt setting
    const systemInstruction = buildSystemInstruction(
      settings.useCustomPrompt,
      settings.userPrompt,
      settings.answerMode
    );

    console.log('Processing question with GenovaAI...');
    console.log('Provider:', settings.provider);
    console.log('Model:', settings.selectedModel);
    console.log('Tier:', settings.apiTier);
    console.log('Rate Limiting:', settings.enforceRateLimit ? 'Enabled' : 'Disabled');
    console.log('Custom Prompt:', settings.useCustomPrompt);
    console.log('Answer Mode:', settings.useCustomPrompt ? 'N/A (custom)' : settings.answerMode);
    console.log('Active Session:', activeSession?.name || 'None');
    console.log('Knowledge Files:', activeSession?.knowledgeFiles?.length || 0);
    console.log('Debug Mode:', settings.debugMode ? 'Enabled' : 'Disabled');

    // Show loading indicator
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'GENOVA_LOADING',
        bubbleAppearance: settings.bubbleAppearance,
      } as GenovaMessage);
      console.log('✨ Loading indicator sent');
    } catch (loadingError) {
      console.warn('⚠️ Could not send loading indicator:', loadingError);
    }

    // Call LLM API with multimodal support
    const answer = await callLLM({
      provider: settings.provider,
      apiKey: settings.apiKey,
      model: settings.selectedModel,
      systemInstruction,
      knowledgeText,
      knowledgeFiles: activeSession?.knowledgeFiles,
      question: selectedText,
      debugMode: settings.debugMode,
    });

    console.log('Answer received:', answer);

    // Update usage tracking (only for Gemini)
    if (settings.provider === 'gemini') {
      // Estimate actual tokens (answer + prompt)
      const actualTokens = estimateTokens(systemInstruction + knowledgeText + selectedText + answer);
      
      // Note: In a real implementation, you would get actual token count from API response
      // For now, we use estimation
      await updateUsage(actualTokens);
      console.log('✅ Usage updated:', actualTokens, 'tokens');
    }

    // Calculate request context for debugging (minimal to avoid quota)
    const fullRequest = systemInstruction + knowledgeText + selectedText;
    const requestContext = {
      systemInstruction: `[${systemInstruction.length} chars]`, // Only length, not content
      knowledgeLength: knowledgeText.length, // Only length
      fileCount: activeSession?.knowledgeFiles?.length || 0,
      totalChars: fullRequest.length,
      estimatedTokens: estimateTokens(fullRequest),
    };
    
    console.log('📊 Request Context:', requestContext);

    // Save to history if session exists
    if (activeSession) {
      try {
        console.log('📝 Saving history to session:', activeSession.name);
        await addHistoryToSession(
          activeSession.id,
          selectedText,
          answer,
          settings.selectedModel,
          settings.useCustomPrompt ? 'custom' : settings.answerMode,
          requestContext
        );
        console.log('✅ History saved successfully');
      } catch (histError) {
        console.error('❌ Failed to save history:', histError);
        console.error('   Error details:', {
          name: histError instanceof Error ? histError.name : 'Unknown',
          message: histError instanceof Error ? histError.message : String(histError),
          stack: histError instanceof Error ? histError.stack : 'No stack',
        });
      }
    } else {
      console.warn('⚠️ No active session - history not saved.');
      console.warn('   Please create and activate a session in Settings → Sessions tab');
    }

    // Send result to content script
    const message: GenovaMessage = {
      type: 'GENOVA_RESULT',
      answer,
      bubbleAppearance: settings.bubbleAppearance,
    };

    try {
      await chrome.tabs.sendMessage(tab.id, message);
      console.log('✅ Message sent to tab successfully');
    } catch (sendError) {
      console.error('Failed to send message to tab:', sendError);
      // Content script might not be injected, try to communicate anyway
      console.warn('Content script may not be available on this page');
    }
  } catch (error) {
    console.error('❌ Error in background script:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    // Log error to storage
    try {
      await addErrorLog(
        'api_error',
        error instanceof Error ? error.message : String(error),
        `Provider: ${settings?.provider || 'unknown'}, Model: ${settings?.selectedModel || 'unknown'}`,
        error instanceof Error ? error.stack : undefined
      );
      console.log('✅ Error log saved');
    } catch (logError) {
      console.error('❌ Failed to log error:', logError);
    }
    
    // Save failed request to history if session exists
    if (activeSession) {
      try {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Rebuild system instruction for error case
        const errorSystemInstruction = buildSystemInstruction(
          settings?.useCustomPrompt || false,
          settings?.userPrompt || '',
          settings?.answerMode || 'short'
        );
        
        // Calculate request context (minimal to avoid quota)
        const fullRequest = errorSystemInstruction + (activeSession.knowledgeText || '') + selectedText;
        const requestContext = {
          systemInstruction: `[${errorSystemInstruction.length} chars]`,
          knowledgeLength: (activeSession.knowledgeText || '').length,
          fileCount: activeSession.knowledgeFiles?.length || 0,
          totalChars: fullRequest.length,
          estimatedTokens: estimateTokens(fullRequest),
        };
        
        console.log('📝 Saving error to history...');
        await addHistoryToSession(
          activeSession.id,
          selectedText,
          `ERROR: ${errorMessage}`,
          settings?.selectedModel || 'unknown',
          settings?.useCustomPrompt ? 'custom' : settings?.answerMode || 'short',
          requestContext
        );
        console.log('✅ Failed request saved to history');
      } catch (histError) {
        console.error('❌ Failed to save error to history:', histError);
      }
    } else {
      console.warn('⚠️ No active session - error not saved to history');
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan';
    await sendErrorToTab(tab.id, errorMessage);
  }
});

/**
 * Send error message to tab
 */
async function sendErrorToTab(tabId: number, error: string): Promise<void> {
  const message: GenovaMessage = {
    type: 'GENOVA_ERROR',
    error,
  };
  
  try {
    await chrome.tabs.sendMessage(tabId, message);
    console.log('✅ Error message sent to tab');
  } catch (sendError) {
    console.error('Failed to send error message to tab:', sendError);
    console.warn('Content script may not be available on this page');
  }
}

// Handle extension icon click - open options page
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

console.log('GenovaAI Background Service Worker loaded');
