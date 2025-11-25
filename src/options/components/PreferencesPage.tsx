import { useState, useEffect } from 'react';
import { FaPalette, FaSave } from 'react-icons/fa';

interface BubblePreferences {
  position: 'bl' | 'br' | 'tl' | 'tr';
  bgColor: string;
  textColor: string;
  bgTransparent: boolean;
  duration: number; // in milliseconds
}

const DEFAULT_PREFERENCES: BubblePreferences = {
  position: 'bl',
  bgColor: '#000000',
  textColor: '#ffffff',
  bgTransparent: false,
  duration: 3000,
};

const STORAGE_KEY = 'genovaai_bubble_preferences';

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState<BubblePreferences>(DEFAULT_PREFERENCES);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      if (result[STORAGE_KEY]) {
        setPreferences(result[STORAGE_KEY] as BubblePreferences);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }

  async function savePreferences() {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: preferences });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences');
    }
  }

  const positions = [
    { value: 'tl' as const, label: 'Top Left', icon: '↖️' },
    { value: 'tr' as const, label: 'Top Right', icon: '↗️' },
    { value: 'bl' as const, label: 'Bottom Left', icon: '↙️' },
    { value: 'br' as const, label: 'Bottom Right', icon: '↘️' },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
          <FaPalette style={{ fontSize: '32px', color: '#2196F3' }} />
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '600', margin: 0 }}>
              Bubble Preferences
            </h1>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              Customize how answer bubbles appear on web pages
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Settings Panel */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '25px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            Appearance Settings
          </h2>

          {/* Position Selector */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '500' }}>
              Position
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {positions.map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => setPreferences({ ...preferences, position: pos.value })}
                  style={{
                    padding: '12px',
                    border: preferences.position === pos.value ? '2px solid #2196F3' : '2px solid #e0e0e0',
                    background: preferences.position === pos.value ? '#e3f2fd' : 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{pos.icon}</span>
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Background Color
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={preferences.bgColor}
                  onChange={(e) => setPreferences({ ...preferences, bgColor: e.target.value })}
                  disabled={preferences.bgTransparent}
                  style={{
                    width: '60px',
                    height: '40px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: preferences.bgTransparent ? 'not-allowed' : 'pointer',
                    opacity: preferences.bgTransparent ? 0.5 : 1,
                  }}
                />
                <span style={{ fontSize: '13px', color: '#666', fontFamily: 'monospace' }}>
                  {preferences.bgColor}
                </span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Text Color
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={preferences.textColor}
                  onChange={(e) => setPreferences({ ...preferences, textColor: e.target.value })}
                  style={{
                    width: '60px',
                    height: '40px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: '13px', color: '#666', fontFamily: 'monospace' }}>
                  {preferences.textColor}
                </span>
              </div>
            </div>
          </div>

          {/* Transparent Background */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              padding: '12px',
              background: '#f9f9f9',
              borderRadius: '8px',
            }}>
              <input
                type="checkbox"
                checked={preferences.bgTransparent}
                onChange={(e) => setPreferences({ ...preferences, bgTransparent: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>Transparent Background</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Remove background color (text only)
                </div>
              </div>
            </label>
          </div>

          {/* Duration Slider */}
          <div>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '500' }}>
              Display Duration: {(preferences.duration / 1000).toFixed(1)}s
            </label>
            <input
              type="range"
              min="1000"
              max="10000"
              step="500"
              value={preferences.duration}
              onChange={(e) => setPreferences({ ...preferences, duration: parseInt(e.target.value) })}
              style={{
                width: '100%',
                cursor: 'pointer',
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#999',
              marginTop: '5px',
            }}>
              <span>1s (Fast)</span>
              <span>10s (Slow)</span>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={savePreferences}
            style={{
              marginTop: '25px',
              width: '100%',
              padding: '12px',
              background: saved ? '#4CAF50' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <FaSave />
            {saved ? '✓ Saved!' : 'Save Preferences'}
          </button>
        </div>

        {/* Live Preview */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '25px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
            Live Preview
          </h2>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
            This is how your bubble will appear on web pages
          </p>

          {/* Preview Container */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '300px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            {/* Sample bubble */}
            <div
              style={{
                position: 'absolute',
                maxWidth: '300px',
                padding: '12px 18px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: preferences.bgTransparent ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.3)',
                backdropFilter: preferences.bgTransparent ? 'none' : 'blur(10px)',
                border: preferences.bgTransparent ? 'none' : 'none',
                color: preferences.textColor,
                backgroundColor: preferences.bgTransparent ? 'transparent' : preferences.bgColor,
                ...(preferences.position === 'tl' && { top: '15px', left: '15px' }),
                ...(preferences.position === 'tr' && { top: '15px', right: '15px' }),
                ...(preferences.position === 'bl' && { bottom: '15px', left: '15px' }),
                ...(preferences.position === 'br' && { bottom: '15px', right: '15px' }),
              }}
            >
              The answer is B
            </div>
          </div>

          {/* Info */}
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: '#fff3e0',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#f57c00',
            border: '1px solid #ffe0b2',
          }}>
            <p style={{ marginBottom: '8px' }}>
              <strong>💡 How it works:</strong>
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Select text on any webpage</li>
              <li>Right-click → "Ask Genova AI"</li>
              <li>Answer appears in configured position</li>
              <li>Auto-hides after set duration</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#f9f9f9',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#666',
      }}>
        <p style={{ marginBottom: '8px' }}>
          <strong>ℹ️ About Bubble Preferences:</strong>
        </p>
        <p>
          These settings are stored locally on your device and only affect how answer bubbles appear on web pages. 
          They do not sync across devices and do not affect AI behavior (sessions, prompts, models, etc.).
        </p>
      </div>
    </div>
  );
}
