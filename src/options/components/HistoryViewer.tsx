import { useState, useEffect } from 'react';
import { FaHistory, FaClock, FaRobot } from 'react-icons/fa';
import { getSessions } from '../../shared/storage';
import type { Session, SessionHistoryItem } from '../../shared/types';

export default function HistoryViewer() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
              {history.slice().reverse().map((item: SessionHistoryItem) => (
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
                  <div>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      color: '#4CAF50',
                      marginBottom: '5px',
                    }}>
                      JAWABAN:
                    </div>
                    <div style={{ 
                      fontSize: '14px',
                      lineHeight: '1.5',
                      color: '#333',
                      background: '#f5f5f5',
                      padding: '10px',
                      borderRadius: '6px',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {item.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
