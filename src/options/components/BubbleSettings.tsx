import { useState } from 'react';
import type { BubbleAppearance, BubblePosition } from '../../shared/types';

interface BubbleSettingsProps {
  bubbleAppearance: BubbleAppearance;
  onChange: (bubbleAppearance: BubbleAppearance) => void;
}

function BubbleSettings({ bubbleAppearance, onChange }: BubbleSettingsProps) {
  const [localAppearance, setLocalAppearance] = useState(bubbleAppearance);

  const handleChange = (updates: Partial<BubbleAppearance>) => {
    const newAppearance = { ...localAppearance, ...updates };
    setLocalAppearance(newAppearance);
    onChange(newAppearance);
  };

  const positionLabels = {
    bl: 'Bottom Left',
    br: 'Bottom Right',
    tl: 'Top Left',
    tr: 'Top Right',
  };

  return (
    <div className="settings-section">
      <div className="form-group">
        <label className="form-label">Position</label>
        <div className="position-grid">
          {(Object.keys(positionLabels) as BubblePosition[]).map((pos) => (
            <button
              key={pos}
              className={`position-btn ${localAppearance.position === pos ? 'active' : ''}`}
              onClick={() => handleChange({ position: pos })}
            >
              {positionLabels[pos]}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Colors</label>
        <div className="color-grid">
          <div className="color-picker-wrapper">
            <label>Background</label>
            <div className="color-input-group">
              <input
                type="color"
                className="color-input"
                value={localAppearance.bgColor}
                onChange={(e) => handleChange({ bgColor: e.target.value })}
                disabled={localAppearance.bgTransparent}
              />
              <input
                type="text"
                className="color-text"
                value={localAppearance.bgColor}
                onChange={(e) => handleChange({ bgColor: e.target.value })}
                disabled={localAppearance.bgTransparent}
              />
            </div>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginTop: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={localAppearance.bgTransparent}
                onChange={(e) => handleChange({ bgTransparent: e.target.checked })}
                style={{ cursor: 'pointer' }}
              />
              Transparent
            </label>
          </div>
          <div className="color-picker-wrapper">
            <label>Text</label>
            <div className="color-input-group">
              <input
                type="color"
                className="color-input"
                value={localAppearance.textColor}
                onChange={(e) => handleChange({ textColor: e.target.value })}
              />
              <input
                type="text"
                className="color-text"
                value={localAppearance.textColor}
                onChange={(e) => handleChange({ textColor: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bubble-preview-container">
        <label className="form-label">Preview</label>
        <div
          className="bubble-preview"
          style={{
            backgroundColor: localAppearance.bgTransparent ? 'transparent' : localAppearance.bgColor,
            color: localAppearance.textColor,
            border: localAppearance.bgTransparent ? '2px solid #ddd' : 'none',
          }}
        >
          B - Sample answer text
        </div>
      </div>
    </div>
  );
}

export default BubbleSettings;
