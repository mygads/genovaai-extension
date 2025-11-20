import { useState } from 'react';
import type { LLMProvider, GeminiModel, OpenRouterModel } from '../../shared/types';
import { FaKey, FaCheckCircle, FaExclamationCircle, FaRobot } from 'react-icons/fa';

interface ProviderSettingsProps {
  provider: LLMProvider;
  apiKey: string;
  selectedModel: GeminiModel | OpenRouterModel;
  onChange: (provider: LLMProvider, apiKey: string, selectedModel: GeminiModel | OpenRouterModel) => void;
}

const GEMINI_MODELS: { value: GeminiModel; label: string; description: string }[] = [
  { 
    value: 'gemini-2.5-flash', 
    label: 'Gemini 2.5 Flash', 
    description: 'Fastest, best for quick tasks' 
  },
  { 
    value: 'gemini-2.5-pro', 
    label: 'Gemini 2.5 Pro', 
    description: 'Most capable for complex reasoning' 
  },
  { 
    value: 'gemini-2.0-flash', 
    label: 'Gemini 2.0 Flash', 
    description: 'Previous generation, fast' 
  },
];

const OPENROUTER_MODELS: { value: OpenRouterModel; label: string; description: string }[] = [
  { 
    value: 'google/gemini-2.5-flash', 
    label: 'Gemini 2.5 Flash', 
    description: 'Google\'s fastest model' 
  },
  { 
    value: 'google/gemini-2.5-pro', 
    label: 'Gemini 2.5 Pro', 
    description: 'Google\'s most capable' 
  },
  { 
    value: 'google/gemini-2.0-flash', 
    label: 'Gemini 2.0 Flash', 
    description: 'Previous generation' 
  },
  { 
    value: 'anthropic/claude-3.5-sonnet', 
    label: 'Claude 3.5 Sonnet', 
    description: 'Anthropic\'s best model' 
  },
  { 
    value: 'openai/gpt-4o', 
    label: 'GPT-4o', 
    description: 'OpenAI\'s multimodal flagship' 
  },
  { 
    value: 'openai/gpt-4o-mini', 
    label: 'GPT-4o Mini', 
    description: 'Faster, more affordable' 
  },
];

function ProviderSettings({ provider, apiKey, selectedModel, onChange }: ProviderSettingsProps) {
  const [localProvider, setLocalProvider] = useState(provider);
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localModel, setLocalModel] = useState(selectedModel);
  const [showKey, setShowKey] = useState(false);

  const handleProviderChange = (newProvider: LLMProvider) => {
    setLocalProvider(newProvider);
    // Auto-switch model to appropriate default
    const newModel = newProvider === 'gemini' 
      ? 'gemini-2.5-flash' as GeminiModel
      : 'google/gemini-2.5-flash' as OpenRouterModel;
    setLocalModel(newModel);
    onChange(newProvider, localApiKey, newModel);
  };

  const handleApiKeyChange = (newApiKey: string) => {
    setLocalApiKey(newApiKey);
    onChange(localProvider, newApiKey, localModel);
  };

  const handleModelChange = (newModel: string) => {
    setLocalModel(newModel as GeminiModel | OpenRouterModel);
    onChange(localProvider, localApiKey, newModel as GeminiModel | OpenRouterModel);
  };

  const hasApiKey = localApiKey && localApiKey.trim() !== '';
  
  const availableModels = localProvider === 'gemini' ? GEMINI_MODELS : OPENROUTER_MODELS;
  const currentModelInfo = availableModels.find(m => m.value === localModel);

  return (
    <div className="settings-section">
      <div className="form-group">
        <label className="form-label">Select Provider</label>
        <div className="radio-group">
          <label className={`radio-card ${localProvider === 'gemini' ? 'active' : ''}`}>
            <input
              type="radio"
              name="provider"
              value="gemini"
              checked={localProvider === 'gemini'}
              onChange={() => handleProviderChange('gemini')}
            />
            <div className="radio-content">
              <div className="radio-title">Gemini API</div>
              <div className="radio-hint">Free tier available</div>
            </div>
          </label>
          <label className={`radio-card ${localProvider === 'openrouter' ? 'active' : ''}`}>
            <input
              type="radio"
              name="provider"
              value="openrouter"
              checked={localProvider === 'openrouter'}
              onChange={() => handleProviderChange('openrouter')}
            />
            <div className="radio-content">
              <div className="radio-title">OpenRouter</div>
              <div className="radio-hint">Multiple models</div>
            </div>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          <FaRobot className="label-icon" />
          Select Model
        </label>
        <select 
          className="form-select" 
          value={localModel}
          onChange={(e) => handleModelChange(e.target.value)}
        >
          {availableModels.map((model) => (
            <option key={model.value} value={model.value}>
              {model.label} • {model.description}
            </option>
          ))}
        </select>
        {currentModelInfo && (
          <div className="form-hint">
            {currentModelInfo.description}
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">
          <FaKey className="label-icon" />
          API Key
          {hasApiKey ? (
            <FaCheckCircle className="status-icon success" />
          ) : (
            <FaExclamationCircle className="status-icon warning" />
          )}
        </label>
        <div className="input-group">
          <input
            type={showKey ? 'text' : 'password'}
            className="form-input"
            value={localApiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder={
              localProvider === 'gemini'
                ? 'Enter your Gemini API key'
                : 'Enter your OpenRouter API key'
            }
          />
          <button
            className="btn-toggle-visibility"
            onClick={() => setShowKey(!showKey)}
            type="button"
          >
            {showKey ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        <div className="form-hint">
          {localProvider === 'gemini' ? (
            <>Get your API key from: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">makersuite.google.com</a></>
          ) : (
            <>Get your API key from: <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">openrouter.ai/keys</a></>
          )}
        </div>
        {!hasApiKey && (
          <div className="warning-message">
            <FaExclamationCircle />
            <span>API key is required to use GenovaAI</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProviderSettings;
