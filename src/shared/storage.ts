// Storage utilities for Chrome extension
import type { Settings, Session } from './types';
import { DEFAULT_SETTINGS } from './types';

const STORAGE_KEYS = {
  SETTINGS: 'genovaai_settings',
  SESSIONS: 'genovaai_sessions',
  ERROR_LOGS: 'genovaai_error_logs',
  DEBUG_LOGS: 'genovaai_debug_logs',
};

/**
 * Get settings from chrome.storage.sync
 * Ensures selectedModel matches current provider
 */
export async function getSettings(): Promise<Settings> {
  try {
    console.log('📥 Loading settings from chrome.storage.sync...');
    const result = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
    console.log('📦 Storage result:', result);
    
    if (result[STORAGE_KEYS.SETTINGS]) {
      const savedSettings = result[STORAGE_KEYS.SETTINGS] as Partial<Settings>;
      console.log('✅ Found saved settings:', savedSettings);
      
      const settings = { ...DEFAULT_SETTINGS, ...savedSettings };
      
      // Auto-fix selectedModel if it doesn't match provider
      if (settings.provider === 'gemini' && !settings.selectedModel.startsWith('gemini-')) {
        console.log('🔧 Auto-fixing Gemini model');
        settings.selectedModel = 'gemini-2.0-flash' as any;
      } else if (settings.provider === 'openrouter' && settings.selectedModel.startsWith('gemini-') && !settings.selectedModel.includes('/')) {
        console.log('🔧 Auto-fixing OpenRouter model');
        settings.selectedModel = 'google/gemini-2.0-flash' as any;
      }
      
      console.log('✨ Final settings:', settings);
      return settings;
    }
    
    console.log('⚠️ No saved settings found, using defaults');
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('❌ Error getting settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to chrome.storage.sync
 */
export async function saveSettings(settings: Settings): Promise<void> {
  try {
    console.log('💾 Saving settings to chrome.storage.sync...');
    console.log('📝 Settings to save:', JSON.stringify(settings, null, 2));
    
    // Ensure settings object is serializable
    const settingsToSave = JSON.parse(JSON.stringify(settings));
    
    await chrome.storage.sync.set({ [STORAGE_KEYS.SETTINGS]: settingsToSave });
    
    console.log('✅ Settings saved successfully');
    
    // Verify save by reading back
    const verify = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
    console.log('🔍 Verification read:', JSON.stringify(verify[STORAGE_KEYS.SETTINGS], null, 2));
    
    if (!verify[STORAGE_KEYS.SETTINGS]) {
      throw new Error('Settings verification failed - data not found after save');
    }
    
    // Double check API key was saved
    const verifiedSettings = verify[STORAGE_KEYS.SETTINGS] as Settings;
    if (settings.apiKey && !verifiedSettings.apiKey) {
      console.error('⚠️ API key was not saved! Retrying...');
      await chrome.storage.sync.set({ [STORAGE_KEYS.SETTINGS]: settingsToSave });
    }
  } catch (error) {
    console.error('❌ Error saving settings:', error);
    throw error;
  }
}

/**
 * Get all sessions from chrome.storage.sync
 */
export async function getSessions(): Promise<Session[]> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEYS.SESSIONS);
    const sessions = (result[STORAGE_KEYS.SESSIONS] as Session[]) || [];
    
    // Initialize history array for sessions that don't have it
    return sessions.map(s => ({
      ...s,
      history: s.history || [],
    }));
  } catch (error) {
    console.error('Error getting sessions:', error);
    return [];
  }
}

/**
 * Save sessions to chrome.storage.sync
 */
export async function saveSessions(sessions: Session[]): Promise<void> {
  try {
    await chrome.storage.sync.set({ [STORAGE_KEYS.SESSIONS]: sessions });
  } catch (error) {
    console.error('Error saving sessions:', error);
    throw error;
  }
}

/**
 * Get active session
 */
export async function getActiveSession(): Promise<Session | null> {
  try {
    const settings = await getSettings();
    if (!settings.activeSessionId) return null;
    
    const sessions = await getSessions();
    return sessions.find(s => s.id === settings.activeSessionId) || null;
  } catch (error) {
    console.error('Error getting active session:', error);
    return null;
  }
}

/**
 * Add a new session
 */
export async function addSession(session: Omit<Session, 'id' | 'dateModified'>): Promise<Session> {
  const sessions = await getSessions();
  const newSession: Session = {
    ...session,
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    dateModified: Date.now(),
  };
  
  await saveSessions([...sessions, newSession]);
  return newSession;
}

/**
 * Update an existing session
 */
export async function updateSession(sessionId: string, updates: Partial<Session>): Promise<void> {
  const sessions = await getSessions();
  const updatedSessions = sessions.map(s => 
    s.id === sessionId ? { ...s, ...updates, dateModified: Date.now() } : s
  );
  await saveSessions(updatedSessions);
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const sessions = await getSessions();
  const filteredSessions = sessions.filter(s => s.id !== sessionId);
  await saveSessions(filteredSessions);
  
  // If deleted session was active, clear it
  const settings = await getSettings();
  if (settings.activeSessionId === sessionId) {
    await saveSettings({ ...settings, activeSessionId: null });
  }
}

/**
 * Set active session
 */
export async function setActiveSession(sessionId: string | null): Promise<void> {
  const settings = await getSettings();
  await saveSettings({ ...settings, activeSessionId: sessionId });
}

/**
 * Add history item to a session
 */
export async function addHistoryToSession(
  sessionId: string,
  question: string,
  answer: string,
  model: string,
  answerMode: string
): Promise<void> {
  try {
    console.log('💾 Adding history to session:', sessionId);
    const sessions = await getSessions();
    const updatedSessions = sessions.map(s => {
      if (s.id === sessionId) {
        const historyItem = {
          id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          question,
          answer,
          model,
          answerMode: answerMode as any,
        };
        return {
          ...s,
          history: [...(s.history || []), historyItem],
          dateModified: Date.now(),
        };
      }
      return s;
    });
    await saveSessions(updatedSessions);
    console.log('✅ History added successfully');
  } catch (error) {
    console.error('❌ Failed to add history:', error);
    throw error;
  }
}

/**
 * Get error logs from chrome.storage.local
 */
export async function getErrorLogs(): Promise<any[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.ERROR_LOGS);
    return (result[STORAGE_KEYS.ERROR_LOGS] as any[]) || [];
  } catch (error) {
    console.error('Error getting error logs:', error);
    return [];
  }
}

/**
 * Save error logs to chrome.storage.local
 */
export async function saveErrorLogs(logs: any[]): Promise<void> {
  try {
    // Keep only last 100 errors
    const limitedLogs = logs.slice(-100);
    await chrome.storage.local.set({ [STORAGE_KEYS.ERROR_LOGS]: limitedLogs });
  } catch (error) {
    console.error('Error saving error logs:', error);
  }
}

/**
 * Add error log
 */
export async function addErrorLog(
  type: string,
  message: string,
  details?: string,
  stack?: string
): Promise<void> {
  try {
    console.log('💾 Saving error log...', { type, message });
    const logs = await getErrorLogs();
    const newLog = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      message,
      details,
      stack,
    };
    await saveErrorLogs([...logs, newLog]);
    console.log('✅ Error log saved');
  } catch (error) {
    console.error('❌ Failed to save error log:', error);
  }
}

/**
 * Clear error logs
 */
export async function clearErrorLogs(): Promise<void> {
  await saveErrorLogs([]);
}

/**
 * Get debug logs from chrome.storage.local
 */
export async function getDebugLogs(): Promise<any[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.DEBUG_LOGS);
    return (result[STORAGE_KEYS.DEBUG_LOGS] as any[]) || [];
  } catch (error) {
    console.error('Error getting debug logs:', error);
    return [];
  }
}

/**
 * Save debug logs to chrome.storage.local
 */
export async function saveDebugLogs(logs: any[]): Promise<void> {
  try {
    // Keep only last 50 debug logs
    const limitedLogs = logs.slice(-50);
    await chrome.storage.local.set({ [STORAGE_KEYS.DEBUG_LOGS]: limitedLogs });
  } catch (error) {
    console.error('Error saving debug logs:', error);
  }
}

/**
 * Add debug log
 */
export async function addDebugLog(
  provider: string,
  model: string,
  request: any,
  response: any,
  duration: number
): Promise<void> {
  try {
    console.log('💾 Saving debug log...', { provider, model, duration });
    const logs = await getDebugLogs();
    const newLog = {
      id: `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      provider,
      model,
      request,
      response,
      duration,
    };
    await saveDebugLogs([...logs, newLog]);
    console.log('✅ Debug log saved');
  } catch (error) {
    console.error('❌ Failed to save debug log:', error);
  }
}

/**
 * Clear debug logs
 */
export async function clearDebugLogs(): Promise<void> {
  await saveDebugLogs([]);
}
