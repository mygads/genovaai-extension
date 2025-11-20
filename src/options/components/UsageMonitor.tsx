import { useEffect, useState } from 'react';
import {
  FaChartLine,
  FaExclamationTriangle,
  FaClock,
  FaCalendarDay,
  FaInfoCircle,
  FaCheckCircle,
} from 'react-icons/fa';
import { ApiTier, GeminiModel, Settings } from '../../shared/types';
import {
  RATE_LIMITS,
  getUsageData,
  getTierInfo,
  getPacificDate,
} from '../../shared/rateLimits';

interface UsageMonitorProps {
  settings: Settings;
  onTierChange: (tier: ApiTier) => void;
  onEnforceLimitChange: (enforce: boolean) => void;
}

export function UsageMonitor({
  settings,
  onTierChange,
  onEnforceLimitChange,
}: UsageMonitorProps) {
  const [usage, setUsage] = useState({
    requestsThisMinute: 0,
    tokensThisMinute: 0,
    requestsToday: 0,
    lastMinuteReset: Date.now(),
    lastDayReset: getPacificDate(),
    toolUsageToday: {
      googleSearch: 0,
      codeExecution: 0,
      urlContext: 0,
    },
  });

  const [refreshKey, setRefreshKey] = useState(0);

  // Get current model (must be GeminiModel for rate limiting)
  const currentModel = settings.provider === 'gemini' 
    ? (settings.selectedModel as GeminiModel)
    : 'gemini-2.5-flash'; // Default fallback

  const limits = RATE_LIMITS[settings.apiTier][currentModel];
  const tierInfo = getTierInfo(settings.apiTier);

  // Load usage data
  useEffect(() => {
    const loadUsage = async () => {
      const data = await getUsageData();
      setUsage(data);
    };
    loadUsage();

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      loadUsage();
      setRefreshKey((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshKey]);

  // Calculate percentages
  const rpmPercent = limits.rpm > 0 ? (usage.requestsThisMinute / limits.rpm) * 100 : 0;
  const tpmPercent = limits.tpm > 0 ? (usage.tokensThisMinute / limits.tpm) * 100 : 0;
  const rpdPercent =
    limits.rpd > 0 ? (usage.requestsToday / limits.rpd) * 100 : 0;

  // Warning thresholds
  const isRpmWarning = rpmPercent >= 80;
  const isTpmWarning = tpmPercent >= 80;
  const isRpdWarning = rpdPercent >= 80;
  const hasWarning = isRpmWarning || isTpmWarning || isRpdWarning;

  // Progress bar color based on percentage
  const getProgressColor = (percent: number) => {
    if (percent >= 90) return '#ef4444'; // red
    if (percent >= 80) return '#f59e0b'; // orange
    if (percent >= 60) return '#eab308'; // yellow
    return '#10b981'; // green
  };

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="settings-section">
      <div className="section-header">
        <FaChartLine />
        <h2>Usage Monitor</h2>
      </div>

      {/* Tier Selection */}
      <div className="form-group">
        <label>
          <FaInfoCircle style={{ marginRight: '8px' }} />
          API Tier
        </label>
        <select
          value={settings.apiTier}
          onChange={(e) => onTierChange(e.target.value as ApiTier)}
          className="tier-select"
        >
          <option value="unknown">Auto-detect (Unknown)</option>
          <option value="free">Free Tier</option>
          <option value="tier1">Tier 1 (Billing Account)</option>
          <option value="tier2">Tier 2 ($250+ spent)</option>
          <option value="tier3">Tier 3 ($1000+ spent)</option>
        </select>
        <p className="help-text">
          {tierInfo.description} - {tierInfo.qualification}
        </p>
      </div>

      {/* Enforce Rate Limit Toggle */}
      <div className="form-group">
        <label className="toggle-label">
          {settings.enforceRateLimit ? (
            <FaCheckCircle style={{ color: '#10b981' }} />
          ) : (
            <FaExclamationTriangle style={{ color: '#f59e0b' }} />
          )}
          Enforce Rate Limits
        </label>
        <button
          className="toggle-button"
          onClick={() => onEnforceLimitChange(!settings.enforceRateLimit)}
        >
          {settings.enforceRateLimit ? 'ON' : 'OFF'}
        </button>
        <p className="help-text">
          {settings.enforceRateLimit
            ? 'Extension will block requests that exceed limits'
            : 'Warning only - requests will not be blocked'}
        </p>
      </div>

      {/* Warning Banner */}
      {hasWarning && (
        <div className="warning-banner">
          <FaExclamationTriangle />
          <span>
            Approaching rate limit! You're at{' '}
            {Math.max(rpmPercent, tpmPercent, rpdPercent).toFixed(0)}% capacity.
          </span>
        </div>
      )}

      {/* Current Model Info */}
      <div className="model-info">
        <strong>Model:</strong> {currentModel}
        <br />
        <strong>Tier:</strong> {tierInfo.name}
      </div>

      {/* RPM - Requests Per Minute */}
      <div className="usage-metric">
        <div className="metric-header">
          <FaClock />
          <span>Requests Per Minute</span>
          <span className="metric-value">
            {usage.requestsThisMinute} / {formatNumber(limits.rpm)}
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(rpmPercent, 100)}%`,
              backgroundColor: getProgressColor(rpmPercent),
            }}
          />
        </div>
        <p className="metric-detail">{rpmPercent.toFixed(1)}% used</p>
      </div>

      {/* TPM - Tokens Per Minute */}
      <div className="usage-metric">
        <div className="metric-header">
          <FaClock />
          <span>Tokens Per Minute</span>
          <span className="metric-value">
            {formatNumber(usage.tokensThisMinute)} / {formatNumber(limits.tpm)}
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(tpmPercent, 100)}%`,
              backgroundColor: getProgressColor(tpmPercent),
            }}
          />
        </div>
        <p className="metric-detail">{tpmPercent.toFixed(1)}% used</p>
      </div>

      {/* RPD - Requests Per Day */}
      {limits.rpd > 0 && (
        <div className="usage-metric">
          <div className="metric-header">
            <FaCalendarDay />
            <span>Requests Today</span>
            <span className="metric-value">
              {usage.requestsToday} / {formatNumber(limits.rpd)}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(rpdPercent, 100)}%`,
                backgroundColor: getProgressColor(rpdPercent),
              }}
            />
          </div>
          <p className="metric-detail">
            {rpdPercent.toFixed(1)}% used - Resets at midnight PT
          </p>
        </div>
      )}

      {limits.rpd === 0 && (
        <div className="unlimited-notice">
          <FaCheckCircle style={{ color: '#10b981' }} />
          <span>Unlimited daily requests for your tier!</span>
        </div>
      )}

      {/* Tool Usage (if any tools were used) */}
      {(usage.toolUsageToday.googleSearch > 0 ||
        usage.toolUsageToday.codeExecution > 0 ||
        usage.toolUsageToday.urlContext > 0) && (
        <div className="tool-usage">
          <h3>Tools Used Today</h3>
          {usage.toolUsageToday.googleSearch > 0 && (
            <div className="tool-stat">
              Google Search: <strong>{usage.toolUsageToday.googleSearch}</strong>
            </div>
          )}
          {usage.toolUsageToday.codeExecution > 0 && (
            <div className="tool-stat">
              Code Execution: <strong>{usage.toolUsageToday.codeExecution}</strong>
            </div>
          )}
          {usage.toolUsageToday.urlContext > 0 && (
            <div className="tool-stat">
              URL Context: <strong>{usage.toolUsageToday.urlContext}</strong>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="info-box">
        <FaInfoCircle />
        <div>
          <strong>About Rate Limits:</strong>
          <ul>
            <li>Free tier has daily limits, paid tiers are unlimited</li>
            <li>All tiers have per-minute request and token limits</li>
            <li>Counters reset automatically every minute and at midnight PT</li>
            <li>
              Learn more:{' '}
              <a
                href="https://ai.google.dev/gemini-api/docs/quota-rate-limits"
                target="_blank"
                rel="noopener noreferrer"
              >
                Gemini API Docs
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
