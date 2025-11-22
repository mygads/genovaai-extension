// Storage utilities for Chrome extension - Backend-integrated version
// Only stores minimal data: auth tokens and current sessionId

const STORAGE_KEYS = {
  AUTH_DATA: 'genovaai_auth',
  CURRENT_SESSION_ID: 'genovaai_current_session',
};

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    credits: number;
    balance: string;
    subscriptionStatus: string | null;
    subscriptionExpiry: Date | null;
  };
  expiresAt: number;
}

/**
 * Save auth data to chrome.storage.local
 */
export async function saveAuthData(authData: AuthData): Promise<void> {
  try {
    console.log('💾 Saving auth data to chrome.storage.local...');
    await chrome.storage.local.set({ [STORAGE_KEYS.AUTH_DATA]: authData });
    console.log('✅ Auth data saved successfully');
  } catch (error) {
    console.error('❌ Error saving auth data:', error);
    throw error;
  }
}

/**
 * Get auth data from chrome.storage.local
 */
export async function getAuthData(): Promise<AuthData | null> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.AUTH_DATA);
    return (result[STORAGE_KEYS.AUTH_DATA] as AuthData) || null;
  } catch (error) {
    console.error('❌ Error getting auth data:', error);
    return null;
  }
}

/**
 * Clear auth data (logout)
 */
export async function clearAuthData(): Promise<void> {
  try {
    console.log('🗑️ Clearing auth data...');
    await chrome.storage.local.remove(STORAGE_KEYS.AUTH_DATA);
    console.log('✅ Auth data cleared');
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
    throw error;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const authData = await getAuthData();
  if (!authData) return false;
  
  // Check if token is expired
  if (Date.now() >= authData.expiresAt) {
    return false;
  }
  
  return true;
}

/**
 * Save current session ID
 */
export async function setCurrentSessionId(sessionId: string | null): Promise<void> {
  try {
    console.log('💾 Saving current session ID:', sessionId);
    if (sessionId === null) {
      await chrome.storage.local.remove(STORAGE_KEYS.CURRENT_SESSION_ID);
      console.log('✅ Session ID cleared');
    } else {
      await chrome.storage.local.set({ [STORAGE_KEYS.CURRENT_SESSION_ID]: sessionId });
      console.log('✅ Session ID saved');
    }
  } catch (error) {
    console.error('❌ Error saving session ID:', error);
    throw error;
  }
}

/**
 * Get current session ID
 */
export async function getCurrentSessionId(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CURRENT_SESSION_ID);
    return (result[STORAGE_KEYS.CURRENT_SESSION_ID] as string) || null;
  } catch (error) {
    console.error('❌ Error getting session ID:', error);
    return null;
  }
}

/**
 * Clear current session ID
 */
export async function clearCurrentSessionId(): Promise<void> {
  try {
    await chrome.storage.local.remove(STORAGE_KEYS.CURRENT_SESSION_ID);
  } catch (error) {
    console.error('❌ Error clearing session ID:', error);
  }
}

/**
 * Get storage usage info
 */
export async function getStorageInfo(): Promise<{ bytesInUse: number; quota: number }> {
  try {
    const bytesInUse = await chrome.storage.local.getBytesInUse();
    return {
      bytesInUse,
      quota: chrome.storage.local.QUOTA_BYTES || 10485760, // 10MB default
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return { bytesInUse: 0, quota: 0 };
  }
}
