import { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaTrash, FaClock, FaSync } from 'react-icons/fa';
import { getErrorLogs, clearErrorLogs } from '../../shared/storage';
import type { ErrorLogItem } from '../../shared/types';

export default function ErrorLogViewer() {
  const [errorLogs, setErrorLogs] = useState<ErrorLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadErrorLogs();
  }, []);

  const loadErrorLogs = async () => {
    setLoading(true);
    try {
      const logs = await getErrorLogs();
      setErrorLogs(logs.reverse()); // Show newest first
    } catch (error) {
      console.error('Error loading error logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (confirm('Hapus semua log error?')) {
      await clearErrorLogs();
      setErrorLogs([]);
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

  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case 'pdf_csp': return '#FF9800';
      case 'api_error': return '#F44336';
      case 'upload_error': return '#E91E63';
      case 'general': return '#9E9E9E';
      default: return '#757575';
    }
  };

  const getErrorTypeLabel = (type: string) => {
    switch (type) {
      case 'pdf_csp': return 'PDF CSP Error';
      case 'api_error': return 'API Error';
      case 'upload_error': return 'Upload Error';
      case 'general': return 'General Error';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading error logs...</p>
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
            Error Logs
          </h3>
          <p style={{ fontSize: '14px', color: '#888' }}>
            {errorLogs.length} error{errorLogs.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadErrorLogs}
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
          {errorLogs.length > 0 && (
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

      {/* Error List */}
      {errorLogs.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#888',
          background: '#f5f5f5',
          borderRadius: '8px',
        }}>
          <FaExclamationTriangle size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
          <p>No errors logged.</p>
          <p style={{ fontSize: '14px' }}>Errors will appear here when they occur.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          maxHeight: '600px',
          overflowY: 'auto',
          paddingRight: '10px',
        }}>
          {errorLogs.map((log: ErrorLogItem) => (
            <div
              key={log.id}
              style={{
                border: '1px solid #e0e0e0',
                borderLeft: `4px solid ${getErrorTypeColor(log.type)}`,
                borderRadius: '8px',
                padding: '15px',
                background: 'white',
              }}
            >
              {/* Error Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '10px',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'inline-block',
                    padding: '4px 10px',
                    background: getErrorTypeColor(log.type),
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '8px',
                  }}>
                    {getErrorTypeLabel(log.type)}
                  </div>
                  <div style={{ 
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333',
                    marginBottom: '5px',
                  }}>
                    {log.message}
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

              {/* Details */}
              {log.details && (
                <div style={{ 
                  marginTop: '10px',
                  padding: '10px',
                  background: '#f5f5f5',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}>
                  {log.details}
                </div>
              )}

              {/* Stack Trace (Expandable) */}
              {log.stack && (
                <div style={{ marginTop: '10px' }}>
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
                    }}
                  >
                    {expandedId === log.id ? '▼' : '▶'} Stack Trace
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
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}>
                      {log.stack}
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
