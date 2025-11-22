import { FaHistory, FaSearch, FaTimes } from 'react-icons/fa';
import { getHistory, getSessions } from '../../shared/api';
import { useState, useEffect } from 'react';

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedHistory, setSelectedHistory] = useState<any | null>(null);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadSessions();
    loadHistory();
  }, []);

  async function loadSessions() {
    const result = await getSessions();
    if (result.success) {
      setSessions(result.data || []);
    }
  }

  async function loadHistory() {
    setLoading(true);
    const result = await getHistory(selectedSessionId || undefined, limit, offset);
    setLoading(false);

    if (result.success) {
      const data = result.data || [];
      setHistory(data);
      setHasMore(data.length === limit);
    }
  }

  function handleSessionFilter(sessionId: string) {
    setSelectedSessionId(sessionId);
    setOffset(0);
    setTimeout(loadHistory, 0);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getSessionName(sessionId: string) {
    const session = sessions.find((s) => s.id === sessionId);
    return session?.sessionName || 'Unknown Session';
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <FaSearch style={{ color: '#666' }} />
          <select
            value={selectedSessionId}
            onChange={(e) => handleSessionFilter(e.target.value)}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            <option value="">All Sessions</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.sessionName}
              </option>
            ))}
          </select>
          {selectedSessionId && (
            <button
              onClick={() => handleSessionFilter('')}
              style={{
                padding: '10px 15px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <FaTimes />
              Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px' }}>
        {/* History List */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxHeight: '70vh',
          overflowY: 'auto',
        }}>
          <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaHistory />
            History
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              Loading...
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No history found
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedHistory(item)}
                    style={{
                      padding: '15px',
                      background: selectedHistory?.id === item.id ? '#e3f2fd' : '#f9f9f9',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: selectedHistory?.id === item.id ? '2px solid #2196F3' : 'none',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#333' }}>
                      {item.question.substring(0, 60)}...
                    </div>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>
                      {getSessionName(item.sessionId)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '10px',
                        padding: '3px 8px',
                        background: '#2196F3',
                        color: 'white',
                        borderRadius: '10px',
                      }}>
                        {item.model}
                      </span>
                      <span style={{ fontSize: '11px', color: '#999' }}>
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '15px',
                paddingTop: '15px',
                borderTop: '1px solid #eee',
              }}>
                <button
                  onClick={() => {
                    if (offset > 0) {
                      setOffset(offset - limit);
                      setTimeout(loadHistory, 0);
                    }
                  }}
                  disabled={offset === 0}
                  style={{
                    padding: '6px 12px',
                    background: offset === 0 ? '#e0e0e0' : '#4CAF50',
                    color: offset === 0 ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: offset === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Prev
                </button>
                <button
                  onClick={() => {
                    if (hasMore) {
                      setOffset(offset + limit);
                      setTimeout(loadHistory, 0);
                    }
                  }}
                  disabled={!hasMore}
                  style={{
                    padding: '6px 12px',
                    background: !hasMore ? '#e0e0e0' : '#4CAF50',
                    color: !hasMore ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: !hasMore ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>

        {/* Detail Panel */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxHeight: '70vh',
          overflowY: 'auto',
        }}>
          {selectedHistory ? (
            <>
              <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Chat Detail</h3>
                  <button
                    onClick={() => setSelectedHistory(null)}
                    style={{
                      padding: '6px 12px',
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    <FaTimes />
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {formatDate(selectedHistory.createdAt)}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                  Question
                </div>
                <div style={{
                  padding: '15px',
                  background: '#f0f7ff',
                  borderRadius: '8px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                }}>
                  {selectedHistory.question}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
                  Answer
                </div>
                <div style={{
                  padding: '15px',
                  background: '#f9f9f9',
                  borderRadius: '8px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                }}>
                  {selectedHistory.answer}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px',
                padding: '15px',
                background: '#f9f9f9',
                borderRadius: '8px',
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Session</div>
                  <div style={{ fontSize: '13px', fontWeight: '500' }}>
                    {getSessionName(selectedHistory.sessionId)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Model</div>
                  <div style={{ fontSize: '13px', fontWeight: '500' }}>
                    {selectedHistory.model}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Provider</div>
                  <div style={{ fontSize: '13px', fontWeight: '500' }}>
                    {selectedHistory.provider}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Answer Mode</div>
                  <div style={{ fontSize: '13px', fontWeight: '500' }}>
                    {selectedHistory.answerMode}
                  </div>
                </div>
                {selectedHistory.responseTime && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Response Time</div>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>
                      {selectedHistory.responseTime}ms
                    </div>
                  </div>
                )}
                {selectedHistory.tokenUsage && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Token Usage</div>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>
                      {selectedHistory.tokenUsage}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#999',
              fontSize: '14px',
            }}>
              Select a history item to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
