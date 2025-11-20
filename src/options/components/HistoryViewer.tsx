import { useState, useEffect } from 'react';
import { FaHistory, FaClock, FaRobot } from 'react-icons/fa';
import { getSessions } from '../../shared/storage';
import type { Session, SessionHistoryItem } from '../../shared/types';

export default function HistoryViewer() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const loadedSessions = await getSessions();
      // Filter sessions that have history
      const sessionsWithHistory = loadedSessions.filter(s => s.history && s.history.length > 0);
      setSessions(sessionsWithHistory);
      
      // Auto-select first session with history
      if (sessionsWithHistory.length > 0 && !selectedSessionId) {
        setSelectedSessionId(sessionsWithHistory[0].id);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const history = selectedSession?.history || [];

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatModel = (model: string) => {
    // Shorten model names for display
    return model.replace('google/', '').replace('anthropic/', '').replace('openai/', '');
  };

  const toggleRequestExpand = (itemId: string) => {
    setExpandedRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const formatTokens = (tokens: number) => {
    return tokens.toLocaleString('id-ID');
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading history...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
        <FaHistory size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
        <p>Belum ada riwayat pertanyaan.</p>
        <p style={{ fontSize: '14px' }}>Riwayat akan tersimpan setiap kali Anda mengajukan pertanyaan.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '20px', minHeight: '400px' }}>
      {/* Session List */}
      <div style={{ 
        width: '250px', 
        borderRight: '1px solid #e0e0e0',
        paddingRight: '20px',
      }}>
        <h3 style={{ fontSize: '14px', marginBottom: '15px', color: '#666' }}>
          Sessions ({sessions.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => setSelectedSessionId(session.id)}
              style={{
                padding: '12px',
                textAlign: 'left',
                border: selectedSessionId === session.id ? '2px solid #4CAF50' : '1px solid #ddd',
                borderRadius: '8px',
                background: selectedSessionId === session.id ? '#f0f9f0' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                {session.name}
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                {session.history?.length || 0} pertanyaan
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* History Items */}
      <div style={{ flex: 1 }}>
        {selectedSession && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '5px' }}>
                {selectedSession.name}
              </h3>
              <p style={{ fontSize: '14px', color: '#888' }}>
                {history.length} pertanyaan tersimpan
              </p>
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '15px',
              maxHeight: '600px',
              overflowY: 'auto',
              paddingRight: '10px',
            }}>
              {history.slice().reverse().map((item: SessionHistoryItem) => {
                const isExpanded = expandedRequests.has(item.id);
                const hasRequestContext = !!item.requestContext;
                
                return (
                <div
                  key={item.id}
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '15px',
                    background: 'white',
                  }}
                >
                  {/* Metadata */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '15px', 
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: '#888',
                    borderBottom: '1px solid #f0f0f0',
                    paddingBottom: '8px',
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FaClock size={12} />
                      {formatDate(item.timestamp)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FaRobot size={12} />
                      {formatModel(item.model)}
                    </span>
                    <span style={{ 
                      padding: '2px 8px',
                      background: '#e3f2fd',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                    }}>
                      {item.answerMode}
                    </span>
                  </div>

                  {/* Question */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      color: '#2196F3',
                      marginBottom: '5px',
                    }}>
                      PERTANYAAN:
                    </div>
                    <div style={{ 
                      fontSize: '14px',
                      lineHeight: '1.5',
                      color: '#333',
                    }}>
                      {item.question}
                    </div>
                  </div>

                  {/* Answer */}
                  <div style={{ marginBottom: hasRequestContext ? '10px' : '0' }}>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      color: item.answer.startsWith('ERROR:') ? '#dc2626' : '#4CAF50',
                      marginBottom: '5px',
                    }}>
                      JAWABAN:
                    </div>
                    <div style={{ 
                      fontSize: '14px',
                      lineHeight: '1.5',
                      color: '#333',
                      background: item.answer.startsWith('ERROR:') ? '#fee' : '#f5f5f5',
                      padding: '10px',
                      borderRadius: '6px',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {item.answer}
                    </div>
                  </div>

                  {/* Request to LLM (Debug Info) */}
                  {hasRequestContext && (
                    <div style={{ marginTop: '10px' }}>
                      <button
                        onClick={() => toggleRequestExpand(item.id)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: '#f0f0f0',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#555',
                        }}
                      >
                        <span>🔍 Show Request to LLM (Debug)</span>
                        <span>{isExpanded ? '▼' : '▶'}</span>
                      </button>

                      {isExpanded && item.requestContext && (
                        <div style={{
                          marginTop: '10px',
                          padding: '12px',
                          background: '#fafafa',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: '13px',
                        }}>
                          {/* Summary Stats */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '10px',
                            marginBottom: '15px',
                            padding: '10px',
                            background: 'white',
                            borderRadius: '4px',
                          }}>
                            <div>
                              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Total Chars</div>
                              <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                                {item.requestContext.totalChars.toLocaleString('id-ID')}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Est. Tokens</div>
                              <div style={{ fontSize: '16px', fontWeight: '600', color: '#2196F3' }}>
                                {formatTokens(item.requestContext.estimatedTokens)}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Files</div>
                              <div style={{ fontSize: '16px', fontWeight: '600', color: '#4CAF50' }}>
                                {item.requestContext.fileCount}
                              </div>
                            </div>
                          </div>

                          {/* System Instruction */}
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ 
                              fontSize: '12px', 
                              fontWeight: '600', 
                              color: '#9C27B0',
                              marginBottom: '6px' 
                            }}>
                              System Instruction: {item.requestContext.systemInstruction}
                            </div>
                          </div>

                          {/* Knowledge Length */}
                          {item.requestContext.knowledgeLength > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ 
                                fontSize: '12px', 
                                fontWeight: '600', 
                                color: '#FF9800',
                                marginBottom: '6px' 
                              }}>
                                Knowledge Base: {item.requestContext.knowledgeLength.toLocaleString('id-ID')} chars
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: '#666',
                                padding: '8px',
                                background: '#fff3cd',
                                borderRadius: '4px',
                              }}>
                                💡 Knowledge content is stored in the session, not in history to save space.
                              </div>
                            </div>
                          )}

                          {/* Question (repeated for context) */}
                          <div>
                            <div style={{ 
                              fontSize: '12px', 
                              fontWeight: '600', 
                              color: '#2196F3',
                              marginBottom: '6px' 
                            }}>
                              Question: ({item.question.length} chars)
                            </div>
                            <div style={{ 
                              fontSize: '12px',
                              lineHeight: '1.6',
                              color: '#555',
                              background: 'white',
                              padding: '10px',
                              borderRadius: '4px',
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'monospace',
                            }}>
                              {item.question}
                            </div>
                          </div>

                          {/* Warning if tokens too high */}
                          {item.requestContext.estimatedTokens > 5000 && (
                            <div style={{
                              marginTop: '12px',
                              padding: '10px',
                              background: '#fff3cd',
                              border: '1px solid #ffc107',
                              borderRadius: '4px',
                              fontSize: '12px',
                              color: '#856404',
                            }}>
                              ⚠️ <strong>Warning:</strong> Request size is {formatTokens(item.requestContext.estimatedTokens)} tokens.
                              This may cause MAX_TOKENS errors. Consider reducing knowledge base or question length.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )})}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
