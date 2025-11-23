import { FaPlus, FaCheck, FaTrash, FaEdit, FaTimes } from 'react-icons/fa';
import { getSessions, createSession, updateSession, deleteSession } from '../../shared/api';
import { setCurrentSessionId, getCurrentSessionId } from '../../shared/storage';
import { useState, useEffect } from 'react';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSession] = useState<string | null>(null);

  // Form state
  const [sessionName, setSessionName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.');
  const [answerMode, setAnswerMode] = useState('CONCISE');
  const [requestMode, setRequestMode] = useState('PREMIUM');
  const [provider, setProvider] = useState('GEMINI');
  const [model, setModel] = useState('gemini-2.0-flash-exp');

  useEffect(() => {
    loadSessions();
    loadCurrentSessionId();
  }, []);

  async function loadSessions() {
    setLoading(true);
    try {
      const result = await getSessions();
      console.log('[SessionsPage] Sessions result:', result);
      if (result.success) {
        // Extract sessions array from nested data
        const sessions = Array.isArray(result.data) ? result.data : (result.data?.sessions || []);
        setSessions(sessions);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('[SessionsPage] Load sessions error:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadCurrentSessionId() {
    const id = await getCurrentSessionId();
    setCurrentSession(id);
  }

  function resetForm() {
    setSessionName('');
    setSystemPrompt('You are a helpful AI assistant.');
    setAnswerMode('CONCISE');
    setRequestMode('PREMIUM');
    setProvider('GEMINI');
    setModel('gemini-2.0-flash-exp');
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(session: any) {
    setSessionName(session.sessionName);
    setSystemPrompt(session.systemPrompt || 'You are a helpful AI assistant.');
    setAnswerMode(session.answerMode);
    setRequestMode(session.requestMode);
    setProvider(session.provider);
    setModel(session.model);
    setEditingId(session.id);
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!sessionName.trim()) {
      alert('Session name is required');
      return;
    }

    setLoading(true);

    const data = {
      sessionName,
      systemPrompt,
      answerMode,
      requestMode,
      provider,
      model,
      isActive: false,
    };

    const result = editingId
      ? await updateSession(editingId, data)
      : await createSession(data);

    setLoading(false);

    if (result.success) {
      resetForm();
      loadSessions();
    } else {
      alert(result.message || 'Failed to save session');
    }
  }

  async function handleDelete(sessionId: string) {
    if (!confirm('Delete this session?')) return;

    const result = await deleteSession(sessionId);
    if (result.success) {
      loadSessions();
      if (currentSessionId === sessionId) {
        await setCurrentSessionId(null);
        setCurrentSession(null);
      }
    }
  }

  async function handleSetActive(sessionId: string) {
    await setCurrentSessionId(sessionId);
    setCurrentSession(sessionId);
  }

  const modelsByProvider: Record<string, string[]> = {
    GEMINI: ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    OPENAI: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    ANTHROPIC: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Sessions</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            background: showForm ? '#f44336' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {showForm ? <><FaTimes /> Cancel</> : <><FaPlus /> New Session</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px',
        }}>
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
            {editingId ? 'Edit Session' : 'Create New Session'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                Session Name *
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="My Session"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                System Prompt
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Answer Mode
                </label>
                <select
                  value={answerMode}
                  onChange={(e) => setAnswerMode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="CONCISE">Concise</option>
                  <option value="DETAILED">Detailed</option>
                  <option value="STEP_BY_STEP">Step by Step</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Request Mode
                </label>
                <select
                  value={requestMode}
                  onChange={(e) => setRequestMode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="PREMIUM">Premium (Use Credits)</option>
                  <option value="FREE_USER_KEY">Free (Your API Key)</option>
                  <option value="FREE_POOL">Free (Pool Key)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => {
                    setProvider(e.target.value);
                    setModel(modelsByProvider[e.target.value][0]);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="GEMINI">Google Gemini</option>
                  <option value="OPENAI">OpenAI</option>
                  <option value="ANTHROPIC">Anthropic</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  {modelsByProvider[provider].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: '12px',
                background: loading ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
              }}
            >
              {loading ? 'Saving...' : editingId ? 'Update Session' : 'Create Session'}
            </button>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        {loading && !showForm ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No sessions yet. Create your first session!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {sessions.map((session) => (
              <div key={session.id} style={{
                padding: '20px',
                background: session.id === currentSessionId ? '#e8f5e9' : '#f9f9f9',
                borderRadius: '8px',
                border: session.id === currentSessionId ? '2px solid #4CAF50' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {session.sessionName}
                      {session.id === currentSessionId && (
                        <span style={{
                          padding: '3px 10px',
                          background: '#4CAF50',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500',
                        }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                      {session.provider} • {session.model} • {session.answerMode}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      Mode: {session.requestMode.replace('_', ' ')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {session.id !== currentSessionId && (
                      <button
                        onClick={() => handleSetActive(session.id)}
                        style={{
                          padding: '8px 12px',
                          background: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <FaCheck />
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(session)}
                      style={{
                        padding: '8px 12px',
                        background: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(session.id)}
                      style={{
                        padding: '8px 12px',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                {session.systemPrompt && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: 'white',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#666',
                    maxHeight: '60px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {session.systemPrompt}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
