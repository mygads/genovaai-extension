// Background service worker for GenovaAI Extension (Backend Integration)
import { isAuthenticated, getCurrentSessionId } from '../shared/storage';
import { askQuestion, refreshAccessToken } from '../shared/api';
import type { GenovaMessage } from '../shared/types';

const CONTEXT_MENU_ID = 'genovaai-analyze';

// Initialize context menu when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: 'GenovaAI',
      contexts: ['selection'],
    });
    console.log('✅ Context menu created');
  } catch (error) {
    console.error('❌ Failed to create context menu:', error);
  }

  // Set up token refresh alarm (every 5 minutes to keep tokens fresh)
  chrome.alarms.create('refreshToken', { periodInMinutes: 5 });
  
  // Set up session check alarm (every 2 minutes for faster detection)
  chrome.alarms.create('checkSession', { periodInMinutes: 2 });
  
  console.log('GenovaAI Extension (Backend) installed');
});

// Handle token refresh alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'refreshToken') {
    const isAuth = await isAuthenticated();
    if (isAuth) {
      console.log('🔄 Auto-refreshing access token (scheduled check)...');
      const success = await refreshAccessToken();
      if (success) {
        console.log('✅ Token refreshed successfully');
      } else {
        console.error('❌ Token refresh failed - session may be invalid');
        // Show notification to user
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'public/logo.png',
          title: 'GenovaAI Session Issue',
          message: 'Could not refresh your session. Please login again in extension settings.',
          priority: 2,
        });
      }
    } else {
      console.log('⏭️ Skipping token refresh - not authenticated');
    }
  }
  
  if (alarm.name === 'checkSession') {
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      console.warn('⚠️ Session expired or invalid. User needs to login again.');
      // Show notification to user
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'public/logo.png',
        title: 'GenovaAI Session Expired',
        message: 'Your session has expired. Please login again in extension settings.',
        priority: 2,
      });
    } else {
      console.log('✅ Session is still valid');
    }
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'CHECK_AUTH') {
    isAuthenticated().then((isAuth) => {
      sendResponse({ authenticated: isAuth });
    });
    return true; // Keep channel open for async response
  }
  
  if (request.type === 'GET_SESSION_ID') {
    getCurrentSessionId().then((sessionId) => {
      sendResponse({ sessionId });
    });
    return true;
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !tab?.id) {
    return;
  }

  const selectedText = info.selectionText;
  if (!selectedText || selectedText.trim() === '') {
    sendErrorToTab(tab.id, 'No text selected');
    return;
  }

  try {
    console.log('🔍 Checking authentication...');
    
    // Check authentication
    const isAuth = await isAuthenticated();
    console.log('🔐 isAuthenticated result:', isAuth);
    
    if (!isAuth) {
      console.error('❌ Not authenticated!');
      sendErrorToTab(tab.id, 'Your session has expired. Please login again in Settings.');
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'public/logo.png',
        title: 'Login Required',
        message: 'Please login in GenovaAI extension settings to continue.',
        priority: 2,
      });
      return;
    }

    console.log('🚀 Processing question with GenovaAI (Backend)...');
    console.log('📝 Question:', selectedText.substring(0, 100) + '...');

    // Show loading indicator
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'GENOVA_LOADING',
      } as GenovaMessage);
      console.log('✨ Loading indicator sent');
    } catch (loadingError) {
      console.warn('⚠️ Could not send loading indicator:', loadingError);
    }

    // Call backend API (backend will auto-select active session)
    console.log('📡 Calling askQuestion API...');
    const result = await askQuestion(null, selectedText);
    console.log('📦 API result:', { success: result.success, error: result.error, hasData: !!result.data });

    if (!result.success) {
      console.error('❌ API call failed:', result.error);
      throw new Error(result.error || 'Failed to get answer');
    }

    const answer = result.data?.answer || 'No answer received';

    console.log('✅ Answer received from backend');
    console.log('📊 History ID:', result.data?.historyId);
    console.log('📝 Answer preview:', answer.substring(0, 100) + '...');

    // Send result to content script
    const message: GenovaMessage = {
      type: 'GENOVA_RESULT',
      answer,
    };

    try {
      await chrome.tabs.sendMessage(tab.id, message);
      console.log('✅ Message sent to tab successfully');
    } catch (sendError) {
      console.error('Failed to send message to tab:', sendError);
      console.warn('Content script may not be available on this page');
    }
  } catch (error) {
    console.error('❌ Error in background script:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
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

console.log('GenovaAI Background Service Worker (Backend) loaded');
