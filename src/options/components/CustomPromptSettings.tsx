import { useState } from 'react';
import type { AnswerMode } from '../../shared/types';
import { FaInfoCircle, FaToggleOn, FaToggleOff } from 'react-icons/fa';

interface CustomPromptSettingsProps {
  useCustomPrompt: boolean;
  userPrompt: string;
  answerMode: AnswerMode;
  onChange: (useCustomPrompt: boolean, userPrompt: string, answerMode: AnswerMode) => void;
}

function CustomPromptSettings({ useCustomPrompt, userPrompt, answerMode, onChange }: CustomPromptSettingsProps) {
  const [localUseCustom, setLocalUseCustom] = useState(useCustomPrompt);
  const [localPrompt, setLocalPrompt] = useState(userPrompt);
  const [localMode, setLocalMode] = useState(answerMode);

  const handleToggleCustom = () => {
    const newValue = !localUseCustom;
    setLocalUseCustom(newValue);
    onChange(newValue, localPrompt, localMode);
  };

  const handlePromptChange = (newPrompt: string) => {
    setLocalPrompt(newPrompt);
    onChange(localUseCustom, newPrompt, localMode);
  };

  const handleModeChange = (newMode: AnswerMode) => {
    setLocalMode(newMode);
    onChange(localUseCustom, localPrompt, newMode);
  };

  return (
    <div className="settings-section">
      <div className="form-group">
        <div className="toggle-container">
          <button
            className={`toggle-button ${localUseCustom ? 'active' : ''}`}
            onClick={handleToggleCustom}
          >
            {localUseCustom ? <FaToggleOn /> : <FaToggleOff />}
            <span>Use Custom Prompt</span>
          </button>
        </div>
        {localUseCustom && (
          <div className="info-message">
            <FaInfoCircle />
            <span>When enabled, default prompt and answer mode are ignored</span>
          </div>
        )}
      </div>

      {localUseCustom ? (
        <div className="form-group">
          <label className="form-label">Your Custom Prompt</label>
          <textarea
            className="form-textarea"
            value={localPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="Example:&#10;&#10;# Role&#10;You are a helpful tutor explaining concepts to beginners.&#10;&#10;# Style&#10;- Use simple language&#10;- Include examples&#10;- Be encouraging&#10;&#10;# Task&#10;Answer the question based on provided knowledge."
            rows={8}
          />
          <div className="form-hint">
            💡 <strong>Tip:</strong> Use structured format (Markdown/XML tags) for better results. 
            Include role definition, constraints, and output format. 
            <a href="https://ai.google.dev/gemini-api/docs/prompting-intro" target="_blank" rel="noopener noreferrer" style={{marginLeft: '4px'}}>
              Learn prompt engineering →
            </a>
          </div>
        </div>
      ) : (
        <div className="form-group">
          <label className="form-label">Answer Mode</label>
          <select
            className="form-select"
            value={localMode}
            onChange={(e) => handleModeChange(e.target.value as AnswerMode)}
          >
            <option value="option">Option (A/B/C/D/E only)</option>
            <option value="short">Short (1-2 sentences)</option>
            <option value="full">Full (Complete answer)</option>
          </select>
          <div className="form-hint">
            {localMode === 'option' && '✓ AI will respond with only one letter'}
            {localMode === 'short' && '✓ AI will give a brief answer (1-2 sentences)'}
            {localMode === 'full' && '✓ AI will provide a detailed explanation'}
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomPromptSettings;
