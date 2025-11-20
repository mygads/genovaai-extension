import { useState, useEffect } from 'react';
import { FaBug, FaTrash, FaClock, FaRobot, FaSync, FaCode } from 'react-icons/fa';
import { getDebugLogs, clearDebugLogs } from '../../shared/storage';
import type { DebugLogItem } from '../../shared/types';

export default function DebugViewer() {
  const [debugLogs, setDebugLogs] = useState<DebugLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadDebugLogs();
  }, []);

  const loadDebugLogs = async () => {
    setLoading(true);
    try {
      const logs = await getDebugLogs();
      setDebugLogs(logs.reverse()); // Show newest first
    } catch (error) {
      console.error('Error loading debug logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (confirm('Hapus semua debug logs?')) {
      await clearDebugLogs();
      setDebugLogs([]);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading debug logs...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '5px' }}>
            Debug Logs
          </h3>
          <p style={{ fontSize: '14px', color: '#888' }}>
            {debugLogs.length} request{debugLogs.length !== 1 ? 's' : ''} logged (last 50)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadDebugLogs}
            style={{
              padding: '8px 16px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
            }}
          >
            <FaSync size={14} />
            Refresh
          </button>
          {debugLogs.length > 0 && (
            <button
              onClick={handleClear}
              style={{
                padding: '8px 16px',
                background: '#F44336',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
              }}
            >
              <FaTrash size={14} />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Debug List */}
      {debugLogs.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#888',
          background: '#f5f5f5',
          borderRadius: '8px',
        }}>
          <FaBug size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
          <p>No debug logs recorded.</p>
          <p style={{ fontSize: '14px' }}>Enable Debug Mode in settings to log API requests/responses.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '15px',
          maxHeight: '700px',
          overflowY: 'auto',
          paddingRight: '10px',
        }}>
          {debugLogs.map((log: DebugLogItem) => (
            <div
              key={log.id}
              style={{
                border: '1px solid #e0e0e0',
                borderLeft: `4px solid ${log.response.error ? '#F44336' : '#4CAF50'}`,
                borderRadius: '8px',
                padding: '15px',
                background: 'white',
              }}
            >
              {/* Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '15px',
                paddingBottom: '10px',
                borderBottom: '1px solid #f0f0f0',
              }}>
                <div>
                  <div style={{ 
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}>
                    <span style={{ 
                      padding: '4px 10px',
                      background: '#2196F3',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}>
                      <FaRobot size={12} />
                      {log.provider} / {log.model}
                    </span>
                    <span style={{ 
                      padding: '4px 10px',
                      background: log.response.error ? '#ffebee' : '#e8f5e9',
                      color: log.response.error ? '#c62828' : '#2e7d32',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      {log.response.error ? 'ERROR' : 'SUCCESS'}
                    </span>
                    <span style={{ 
                      padding: '4px 10px',
                      background: '#f5f5f5',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                    }}>
                      {formatDuration(log.duration)}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '12px',
                    color: '#888',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}>
                    <FaClock size={12} />
                    {formatDate(log.timestamp)}
                  </div>
                </div>
              </div>

              {/* Request Info */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#2196F3',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}>
                  📤 REQUEST
                </div>
                <div style={{ 
                  background: '#f5f5f5',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Question:</strong>
                    <div style={{ 
                      marginTop: '4px',
                      padding: '8px',
                      background: 'white',
                      borderRadius: '4px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {log.request.question}
                    </div>
                  </div>
                  
                  {log.request.systemInstruction && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>System Instruction:</strong>
                      <div style={{ 
                        marginTop: '4px',
                        padding: '8px',
                        background: 'white',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#666',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '100px',
                        overflowY: 'auto',
                      }}>
                        {log.request.systemInstruction}
                      </div>
                    </div>
                  )}
                  
                  {log.request.knowledgeText && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Knowledge:</strong>
                      <div style={{ 
                        marginTop: '4px',
                        padding: '8px',
                        background: 'white',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#666',
                      }}>
                        {log.request.knowledgeText}
                      </div>
                    </div>
                  )}
                  
                  {log.request.fileCount > 0 && (
                    <div>
                      <strong>Files:</strong> {log.request.fileCount} file(s)
                    </div>
                  )}
                  
                  {log.request.estimatedTokens && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                      <strong>Estimated Tokens:</strong> {log.request.estimatedTokens}
                    </div>
                  )}
                </div>
              </div>

              {/* Response Info */}
              <div>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: log.response.error ? '#F44336' : '#4CAF50',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}>
                  {log.response.error ? '❌' : '✅'} RESPONSE
                </div>
                <div style={{ 
                  background: log.response.error ? '#ffebee' : '#e8f5e9',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                }}>
                  {log.response.error ? (
                    <div>
                      <strong>Error:</strong>
                      <div style={{ 
                        marginTop: '4px',
                        padding: '8px',
                        background: 'white',
                        borderRadius: '4px',
                        color: '#c62828',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {log.response.error}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Answer:</strong>
                        <div style={{ 
                          marginTop: '4px',
                          padding: '8px',
                          background: 'white',
                          borderRadius: '4px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}>
                          {log.response.answer}
                        </div>
                      </div>
                      
                      {log.response.finishReason && (
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Finish Reason:</strong> {log.response.finishReason}
                        </div>
                      )}
                      
                      {log.response.tokenCount && typeof log.response.tokenCount === 'object' && (
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <strong>Tokens:</strong> 
                          {' '}Prompt: {(log.response.tokenCount as any).promptTokens}
                          {' '}| Response: {(log.response.tokenCount as any).candidatesTokens}
                          {' '}| Total: {(log.response.tokenCount as any).totalTokens}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Raw Response (Expandable) */}
              {log.response.rawResponse && (
                <div style={{ marginTop: '15px' }}>
                  <button
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    style={{
                      padding: '6px 12px',
                      background: '#f0f0f0',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <FaCode size={12} />
                    {expandedId === log.id ? '▼' : '▶'} Raw API Response
                  </button>
                  {expandedId === log.id && (
                    <div style={{ 
                      marginTop: '8px',
                      padding: '10px',
                      background: '#f5f5f5',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      maxHeight: '300px',
                      overflowY: 'auto',
                    }}>
                      {log.response.rawResponse}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
