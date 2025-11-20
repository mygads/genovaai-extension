// Storage utilities for Chrome extension
import type { Settings, Session } from './types';
import { DEFAULT_SETTINGS } from './types';

const STORAGE_KEYS = {
  SETTINGS: 'genovaai_settings',
  SESSIONS: 'genovaai_sessions',
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
    console.log('📝 Settings to save:', settings);
    
    await chrome.storage.sync.set({ [STORAGE_KEYS.SETTINGS]: settings });
    
    console.log('✅ Settings saved successfully');
    
    // Verify save by reading back
    const verify = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
    console.log('🔍 Verification read:', verify[STORAGE_KEYS.SETTINGS]);
    
    if (!verify[STORAGE_KEYS.SETTINGS]) {
      throw new Error('Settings verification failed - data not found after save');
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
    return (result[STORAGE_KEYS.SESSIONS] as Session[]) || [];
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
