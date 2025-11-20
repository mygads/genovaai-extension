import { useState, useEffect } from 'react';
import type { Settings, Session, ApiTier } from '../shared/types';
import { getSettings, saveSettings, getSessions } from '../shared/storage';
import { DEFAULT_SETTINGS } from '../shared/types';
import { FaCog, FaRobot, FaComments, FaPalette, FaBook } from 'react-icons/fa';
import ProviderSettings from './components/ProviderSettings';
import CustomPromptSettings from './components/CustomPromptSettings';
import BubbleSettings from './components/BubbleSettings';
import SessionManager from './components/SessionManager';
import { UsageMonitor } from './components/UsageMonitor';
import HistoryViewer from './components/HistoryViewer';
import ErrorLogViewer from './components/ErrorLogViewer';
import DebugViewer from './components/DebugViewer';
import './styles.css';

type TabType = 'settings' | 'history' | 'errors' | 'debug';

function App() {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('settings');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('🔄 App.tsx: Loading data...');
    try {
      const loadedSettings = await getSettings();
      const loadedSessions = await getSessions();
      
      console.log('✅ App.tsx: Data loaded:', {
        settings: loadedSettings,
        sessionsCount: loadedSessions.length
      });
      
      setSettingsState(loadedSettings);
      setSessions(loadedSessions);
    } catch (error) {
      console.error('❌ App.tsx: Error loading data:', error);
    }
  };

  const handleSettingsChange = async (updates: Partial<Settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettingsState(newSettings);
    await saveSettingsToStorage(newSettings);
  };

  const saveSettingsToStorage = async (newSettings: Settings) => {
    console.log('💾 App.tsx: Saving settings...', newSettings);
    try {
      await saveSettings(newSettings);
      console.log('✅ App.tsx: Settings saved successfully');
      setSaveMessage('✓ Saved');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (error) {
      console.error('❌ App.tsx: Error saving settings:', error);
      setSaveMessage('✗ Failed to save');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleSessionsUpdate = (updatedSessions: Session[]) => {
    setSessions(updatedSessions);
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <FaCog className="logo-icon" />
            <h1>GenovaAI Settings</h1>
          </div>
          <div className="subtitle">Smart Quiz Assistant Configuration</div>
        </div>
        {saveMessage && (
          <div className={`save-badge ${saveMessage.includes('✓') ? 'success' : 'error'}`}>
            {saveMessage}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '5px',
        borderBottom: '2px solid #e0e0e0',
        padding: '0 30px',
        background: 'white',
      }}>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '15px 25px',
            border: 'none',
            borderBottom: activeTab === 'settings' ? '3px solid #4CAF50' : '3px solid transparent',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activeTab === 'settings' ? '600' : '500',
            color: activeTab === 'settings' ? '#4CAF50' : '#666',
            transition: 'all 0.2s',
          }}
        >
          <FaCog style={{ marginRight: '8px' }} />
          Settings
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '15px 25px',
            border: 'none',
            borderBottom: activeTab === 'history' ? '3px solid #2196F3' : '3px solid transparent',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activeTab === 'history' ? '600' : '500',
            color: activeTab === 'history' ? '#2196F3' : '#666',
            transition: 'all 0.2s',
          }}
        >
          <FaBook style={{ marginRight: '8px' }} />
          History
        </button>
        <button
          onClick={() => setActiveTab('errors')}
          style={{
            padding: '15px 25px',
            border: 'none',
            borderBottom: activeTab === 'errors' ? '3px solid #F44336' : '3px solid transparent',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activeTab === 'errors' ? '600' : '500',
            color: activeTab === 'errors' ? '#F44336' : '#666',
            transition: 'all 0.2s',
          }}
        >
          <FaPalette style={{ marginRight: '8px' }} />
          Error Logs
        </button>
        <button
          onClick={() => setActiveTab('debug')}
          style={{
            padding: '15px 25px',
            border: 'none',
            borderBottom: activeTab === 'debug' ? '3px solid #FF9800' : '3px solid transparent',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activeTab === 'debug' ? '600' : '500',
            color: activeTab === 'debug' ? '#FF9800' : '#666',
            transition: 'all 0.2s',
          }}
        >
          <FaCog style={{ marginRight: '8px' }} />
          Debug
        </button>
      </div>

      <div className="app-content">
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="settings-grid">
            <section className="settings-card">
              <div className="card-header">
                <FaRobot className="card-icon" />
                <h2>LLM Provider</h2>
              </div>
              <ProviderSettings
                provider={settings.provider}
                apiKey={settings.apiKey}
                selectedModel={settings.selectedModel}
                onChange={(provider: any, apiKey: string, selectedModel: any) => 
                  handleSettingsChange({ provider, apiKey, selectedModel })
                }
              />
            </section>

            <section className="settings-card">
              <div className="card-header">
                <FaComments className="card-icon" />
                <h2>Prompt Configuration</h2>
              </div>
              <CustomPromptSettings
                useCustomPrompt={settings.useCustomPrompt}
                userPrompt={settings.userPrompt}
                answerMode={settings.answerMode}
                onChange={(useCustomPrompt: boolean, userPrompt: string, answerMode: any) => 
                  handleSettingsChange({ useCustomPrompt, userPrompt, answerMode })
                }
              />
            </section>

            <section className="settings-card">
              <div className="card-header">
                <FaPalette className="card-icon" />
                <h2>Bubble Appearance</h2>
              </div>
              <BubbleSettings
                bubbleAppearance={settings.bubbleAppearance}
                onChange={(bubbleAppearance: any) => handleSettingsChange({ bubbleAppearance })}
              />
            </section>

            <section className="settings-card full-width">
              <div className="card-header">
                <FaBook className="card-icon" />
                <h2>Knowledge Sessions</h2>
              </div>
              <SessionManager
                sessions={sessions}
                activeSessionId={settings.activeSessionId}
                onSessionsUpdate={handleSessionsUpdate}
                onActiveSessionChange={(sessionId: string | null) => 
                  handleSettingsChange({ activeSessionId: sessionId })
                }
              />
            </section>

            {/* Usage Monitor - Only show for Gemini provider */}
            {settings.provider === 'gemini' && (
              <section className="settings-card full-width">
                <UsageMonitor
                  settings={settings}
                  onTierChange={(tier: ApiTier) => handleSettingsChange({ apiTier: tier })}
                  onEnforceLimitChange={(enforce: boolean) => 
                    handleSettingsChange({ enforceRateLimit: enforce })
                  }
                />
              </section>
            )}
            
            {/* Debug Mode Toggle */}
            <section className="settings-card full-width">
              <div className="card-header">
                <FaCog className="card-icon" />
                <h2>Debug Mode</h2>
              </div>
              <div style={{ padding: '15px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={settings.debugMode}
                    onChange={(e) => handleSettingsChange({ debugMode: e.target.checked })}
                    style={{ 
                      width: '20px', 
                      height: '20px',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ fontSize: '15px' }}>
                    Enable debug logging (records all API requests/responses)
                  </span>
                </label>
                <p style={{ 
                  marginTop: '10px', 
                  fontSize: '13px', 
                  color: '#666',
                  marginLeft: '30px',
                }}>
                  When enabled, all LLM API requests and responses will be logged for debugging.
                  View logs in the Debug tab. Last 50 requests are kept.
                </p>
              </div>
            </section>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="settings-card full-width">
            <HistoryViewer />
          </div>
        )}

        {/* Error Logs Tab */}
        {activeTab === 'errors' && (
          <div className="settings-card full-width">
            <ErrorLogViewer />
          </div>
        )}
        
        {/* Debug Tab */}
        {activeTab === 'debug' && (
          <div className="settings-card full-width">
            <DebugViewer />
          </div>
        )}
      </div>

      <footer className="app-footer">
        <p>GenovaAI v1.4.0 – Smart Quiz Assistant with Rate Limiting</p>
        <p className="footer-hint">All settings are saved automatically</p>
      </footer>
    </div>
  );
}

export default App;
