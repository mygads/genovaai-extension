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
import './styles.css';

function App() {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [saveMessage, setSaveMessage] = useState('');

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

      <div className="app-content">
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
        </div>
      </div>

      <footer className="app-footer">
        <p>GenovaAI v1.4.0 – Smart Quiz Assistant with Rate Limiting</p>
        <p className="footer-hint">All settings are saved automatically</p>
      </footer>
    </div>
  );
}

export default App;
