import { useState, useEffect } from 'react';
import { FaPalette, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

export interface BubblePreferences {
  position: 'bl' | 'br' | 'tl' | 'tr';
  bgColor: string;
  textColor: string;
  bgTransparent: boolean;
  duration: number; // milliseconds
}

const DEFAULT_PREFERENCES: BubblePreferences = {
  position: 'bl',
  bgColor: '#000000',
  textColor: '#ffffff',
  bgTransparent: false,
  duration: 3000,
};

const STORAGE_KEY = 'genovaai_bubble_preferences';

// Save preferences to chrome.storage.local
export async function saveBubblePreferences(prefs: BubblePreferences): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: prefs });
}

// Get preferences from chrome.storage.local
export async function getBubblePreferences(): Promise<BubblePreferences> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as BubblePreferences) || DEFAULT_PREFERENCES;
}

interface BubblePreferencesProps {
  onSave?: () => void;
}

export default function BubblePreferences({ onSave }: BubblePreferencesProps) {
  const [preferences, setPreferences] = useState<BubblePreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    const prefs = await getBubblePreferences();
    setPreferences(prefs);
    setLoading(false);
  }

  async function handleSave() {
    await saveBubblePreferences(preferences);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSave?.();
  }

  const positionLabels = {
    bl: 'Bottom Left',
    br: 'Bottom Right',
    tl: 'Top Left',
    tr: 'Top Right',
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading preferences...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <h2 style={{ marginBottom: '25px', fontSize: '20px', fontWeight: '600' }}>
          <FaPalette style={{ marginRight: '10px' }} />
          Bubble Appearance
        </h2>

        {/* Position */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '500' }}>
            <FaMapMarkerAlt style={{ marginRight: '8px', color: '#666' }} />
            Position on Screen
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {(Object.keys(positionLabels) as Array<keyof typeof positionLabels>).map((pos) => (
              <button
                key={pos}
                onClick={() => setPreferences({ ...preferences, position: pos })}
                style={{
                  padding: '12px',
                  background: preferences.position === pos ? '#4CAF50' : '#f5f5f5',
                  color: preferences.position === pos ? 'white' : '#333',
                  border: preferences.position === pos ? '2px solid #45a049' : '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: preferences.position === pos ? '600' : '500',
                  transition: 'all 0.2s',
                }}
              >
                {positionLabels[pos]}
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '500' }}>
            <FaPalette style={{ marginRight: '8px', color: '#666' }} />
            Colors
          </label>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>
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
                  }}
                />
                <input
                  type="text"
                  value={preferences.bgColor}
                  onChange={(e) => setPreferences({ ...preferences, bgColor: e.target.value })}
                  disabled={preferences.bgTransparent}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>
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
                <input
                  type="text"
                  value={preferences.textColor}
                  onChange={(e) => setPreferences({ ...preferences, textColor: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            </div>
          </div>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}>
            <input
              type="checkbox"
              checked={preferences.bgTransparent}
              onChange={(e) => setPreferences({ ...preferences, bgTransparent: e.target.checked })}
              style={{ cursor: 'pointer' }}
            />
            Transparent Background
          </label>
        </div>

        {/* Duration */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '500' }}>
            <FaClock style={{ marginRight: '8px', color: '#666' }} />
            Display Duration: {preferences.duration / 1000}s
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
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999', marginTop: '5px' }}>
            <span>1s</span>
            <span>10s</span>
          </div>
        </div>

        {/* Preview */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '500' }}>
            Preview
          </label>
          <div style={{ 
            padding: '40px',
            background: '#f5f5f5',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: preferences.position.includes('r') ? 'flex-end' : 'flex-start',
            alignItems: preferences.position.includes('t') ? 'flex-start' : 'flex-end',
          }}>
            <div style={{
              padding: '15px 20px',
              background: preferences.bgTransparent ? 'transparent' : preferences.bgColor,
              color: preferences.textColor,
              borderRadius: '12px',
              boxShadow: preferences.bgTransparent ? 'none' : '0 4px 12px rgba(0,0,0,0.2)',
              border: preferences.bgTransparent ? '2px dashed #ddd' : 'none',
              fontSize: '14px',
              maxWidth: '300px',
            }}>
              B - Sample answer text from GenovaAI
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          style={{
            width: '100%',
            padding: '15px',
            background: saved ? '#45a049' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}
        >
          {saved ? '✓ Saved!' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
