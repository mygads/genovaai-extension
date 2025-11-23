// API client for GenovaAI backend integration
import { getAuthData, saveAuthData, clearAuthData, type AuthData } from './storage';

const API_BASE = 'http://localhost:8090';

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const authData = await getAuthData();
    if (!authData?.refreshToken) {
      console.error('❌ No refresh token available');
      return false;
    }

    console.log('🔄 Refreshing access token...');
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: authData.refreshToken,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      console.error('❌ Token refresh failed:', data.error);
      // If refresh token is invalid, clear auth data
      if (response.status === 401) {
        await clearAuthData();
      }
      return false;
    }

    // Update auth data with new access token and correct expiry
    const expiresInMs = (data.data.expiresIn || 604800) * 1000; // Convert seconds to ms (default 7 days)
    const newAuthData: AuthData = {
      ...authData,
      accessToken: data.data.accessToken,
      expiresAt: Date.now() + expiresInMs, // Token expires in 7 days
    };

    await saveAuthData(newAuthData);
    console.log('✅ Access token refreshed, expires in', data.data.expiresIn, 'seconds');
    return true;
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    return false;
  }
}

/**
 * Get valid access token (auto-refresh if needed)
 */
export async function getAccessToken(): Promise<string | null> {
  const authData = await getAuthData();
  if (!authData) {
    console.warn('⚠️ No auth data available');
    return null;
  }

  // Check if token is expired or about to expire (2 min buffer for safety)
  const bufferMs = 2 * 60 * 1000; // 2 minutes
  const timeUntilExpiry = authData.expiresAt - Date.now();
  
  if (timeUntilExpiry <= bufferMs) {
    console.log('🔄 Token expired or expiring soon, refreshing...');
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      console.error('❌ Failed to refresh token');
      return null;
    }
    
    const newAuthData = await getAuthData();
    return newAuthData?.accessToken || null;
  }

  console.log(`✅ Token valid for ${Math.floor(timeUntilExpiry / 1000)}s more`);
  return authData.accessToken;
}

/**
 * Make authenticated API request
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });

  // If 401, try to refresh token once
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = await getAccessToken();
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
        },
      });
    }
  }

  return response;
}

// ==================== AUTH APIs ====================

export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (result.success) {
      // Save auth data with correct expiry (7 days from server)
      const expiresInMs = (result.data.expiresIn || 604800) * 1000; // Convert seconds to ms (default 7 days)
      const authData: AuthData = {
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        user: result.data.user,
        expiresAt: Date.now() + expiresInMs,
      };
      await saveAuthData(authData);
    }

    return result;
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, message: 'Network error' };
  }
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (result.success) {
      // Save auth data with correct expiry (7 days from server)
      const expiresInMs = (result.data.expiresIn || 604800) * 1000; // Convert seconds to ms (default 7 days)
      const authData: AuthData = {
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        user: result.data.user,
        expiresAt: Date.now() + expiresInMs,
      };
      await saveAuthData(authData);
    }

    return result;
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Network error' };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetchWithAuth(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    await clearAuthData();
  }
}

// ==================== PROFILE & BALANCE APIs ====================

export async function getProfile(): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await fetchWithAuth(`${API_BASE}/api/customer/genovaai/profile`);
    return await response.json();
  } catch (error) {
    console.error('Get profile error:', error);
    return { success: false, message: 'Network error' };
  }
}

export async function getBalance(): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await fetchWithAuth(`${API_BASE}/api/customer/genovaai/balance`);
    return await response.json();
  } catch (error) {
    console.error('Get balance error:', error);
    return { success: false, message: 'Network error' };
  }
}

export async function getTransactions(limit = 50, offset = 0): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await fetchWithAuth(`${API_BASE}/api/customer/genovaai/transactions?limit=${limit}&offset=${offset}`);
    return await response.json();
  } catch (error) {
    console.error('Get transactions error:', error);
    return { success: false, message: 'Network error' };
  }
}

// ==================== API KEYS APIs ====================

export async function getApiKeys(): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await fetchWithAuth(`${API_BASE}/api/customer/genovaai/apikeys`);
    return await response.json();
  } catch (error) {
    console.error('Get API keys error:', error);
    return { success: false, message: 'Network error' };
  }
}

export async function addApiKey(apiKey: string, keyName?: string): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await fetchWithAuth(`${API_BASE}/api/customer/genovaai/apikeys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey, keyName }),
    });
    return await response.json();
  } catch (error) {
    console.error('Add API key error:', error);
    return { success: false, message: 'Network error' };
  }
}

export async function deleteApiKey(keyId: string): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await fetchWithAuth(`${API_BASE}/api/customer/genovaai/apikeys/${keyId}`, {
      method: 'DELETE',
    });
    return await response.json();
  } catch (error) {
    console.error('Delete API key error:', error);
    return { success: false, message: 'Network error' };
  }
}

// ==================== SESSION APIs ====================

export async function getSessions(limit = 20, offset = 0): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await fetchWithAuth(`${API_BASE}/api/customer/genovaai/sessions?limit=${limit}&offset=${offset}`);
    return await response.json();
  } catch (error) {
    console.error('Get sessions error:', error);
    return { success: false, message: 'Network error' };
  }
}

export async function getSession(sessionId: string): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await fetchWithAuth(`${API_BASE}/api/customer/genovaai/sessions/${sessionId}`);
    return await response.json();
  } catch (error) {
    console.error('Get session error:', error);
    return { success: false, message: 'Network error' };
  }
}

export async function createSession(config: {
  sessionName: string;
  systemPrompt?: string;
  knowledgeContext?: string;
  knowledgeFileIds?: string[];
  answerMode?: string;
  requestMode?: string;
  provider?: string;
  model?: string;
}): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await fetchWithAuth(`${API_BASE}/api/customer/genovaai/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    return await response.json();
  } catch (error) {
    console.error('Create session error:', error);
    return { success: false, message: 'Network error' };
  }
}

export async function updateSession(sessionId: string, updates: {
  sessionName?: string;
  systemPrompt?: string;
  knowledgeContext?: string;
  knowledgeFileIds?: string[];
  answerMode?: string;
  requestMode?: string;
  provider?: string;
  model?: string;
  isActive?: boolean;
  useCustomPrompt?: boolean;
  customSystemPrompt?: string;
}): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await fetchWithAuth(`${API_BASE}/api/customer/genovaai/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return await response.json();
  } catch (error) {
    console.error('Update session error:', error);
    return { success: false, message: 'Network error' };
  }
}

export async function deleteSession(sessionId: string): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await fetchWithAuth(`${API_BASE}/api/customer/genovaai/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    return await response.json();
  } catch (error) {
    console.error('Delete session error:', error);
    return { success: false, message: 'Network error' };
  }
}

// ==================== LLM GATEWAY API ====================

export async function askQuestion(sessionId: string, question: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetchWithAuth(`${API_BASE}/api/gateway/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        question,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Ask question error:', error);
    return { success: false, error: 'Network error' };
  }
}

// ==================== HISTORY APIs ====================

export async function getHistory(sessionId?: string, limit = 50, offset = 0): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    let url = `${API_BASE}/api/customer/genovaai/history?limit=${limit}&offset=${offset}`;
    if (sessionId) {
      url += `&sessionId=${sessionId}`;
    }
    const response = await fetchWithAuth(url);
    return await response.json();
  } catch (error) {
    console.error('Get history error:', error);
    return { success: false, message: 'Network error' };
  }
}

// ==================== KNOWLEDGE MANAGEMENT APIs ====================

export async function uploadFile(file: File, sessionId?: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }

    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE}/api/customer/genovaai/knowledge/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.error('Upload file error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function getKnowledgeFiles(sessionId?: string, limit = 50, offset = 0): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    let url = `${API_BASE}/api/customer/genovaai/knowledge?limit=${limit}&offset=${offset}`;
    if (sessionId) {
      url += `&sessionId=${sessionId}`;
    }
    const response = await fetchWithAuth(url);
    return await response.json();
  } catch (error) {
    console.error('Get knowledge files error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function getKnowledgeFile(fileId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetchWithAuth(`${API_BASE}/api/customer/genovaai/knowledge/${fileId}`);
    return await response.json();
  } catch (error) {
    console.error('Get knowledge file error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function deleteKnowledgeFile(fileId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetchWithAuth(`${API_BASE}/api/customer/genovaai/knowledge/${fileId}`, {
      method: 'DELETE',
    });
    return await response.json();
  } catch (error) {
    console.error('Delete knowledge file error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function linkFileToSession(fileId: string, sessionId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetchWithAuth(`${API_BASE}/api/customer/genovaai/knowledge/${fileId}/link`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });
    return await response.json();
  } catch (error) {
    console.error('Link file to session error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function unlinkFileFromSession(fileId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetchWithAuth(`${API_BASE}/api/customer/genovaai/knowledge/${fileId}/link`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId: null }),
    });
    return await response.json();
  } catch (error) {
    console.error('Unlink file from session error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function downloadKnowledgeFile(fileId: string): Promise<Blob | null> {
  try {
    const token = await getAccessToken();
    if (!token) return null;

    const response = await fetch(`${API_BASE}/api/customer/genovaai/knowledge/${fileId}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;
    return await response.blob();
  } catch (error) {
    console.error('Download file error:', error);
    return null;
  }
}
