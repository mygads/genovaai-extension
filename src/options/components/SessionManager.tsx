import { useState } from 'react';
import type { Session, KnowledgeFile } from '../../shared/types';
import { saveSessions, getSettings } from '../../shared/storage';
import { extractTextFromFile } from '../../shared/pdfHelper';
import { uploadPDFFile } from '../../shared/fileApi';
import { FaPlus, FaTrash, FaCheckCircle, FaCircle, FaUpload, FaFile, FaTimes } from 'react-icons/fa';

interface SessionManagerProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSessionsUpdate: (sessions: Session[]) => void;
  onActiveSessionChange: (sessionId: string | null) => void;
}

function SessionManager({ sessions, activeSessionId, onSessionsUpdate, onActiveSessionChange }: SessionManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [knowledgeText, setKnowledgeText] = useState('');
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleAddSession = async () => {
    if (!sessionName.trim()) {
      alert('Please enter a session name');
      return;
    }

    const newSession: Session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: sessionName.trim(),
      knowledgeText: knowledgeText.trim(),
      knowledgeFiles: knowledgeFiles,
      dateModified: Date.now(),
    };

    const updatedSessions = [...sessions, newSession];
    await saveSessions(updatedSessions);
    onSessionsUpdate(updatedSessions);

    // Reset form
    setSessionName('');
    setKnowledgeText('');
    setKnowledgeFiles([]);
    setIsAdding(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileType = file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'txt';
      
      let newFile: KnowledgeFile;
      
      if (fileType === 'pdf') {
        // For PDF: Try to upload to Gemini File API for native understanding
        try {
          const settings = await getSettings();
          
          // Only upload to File API if using Gemini provider
          if (settings.provider === 'gemini' && settings.apiKey && settings.apiKey.trim()) {
            // Read file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            
            // Upload to Gemini File API
            const uploadResult = await uploadPDFFile(
              settings.apiKey,
              arrayBuffer,
              file.name
            );
            
            // Extract text as fallback for OpenRouter
            const extractedText = await extractTextFromFile(file);
            
            newFile = {
              name: file.name,
              type: 'pdf',
              content: extractedText, // Fallback text for OpenRouter
              fileUri: uploadResult.uri,
              mimeType: uploadResult.mimeType,
            };
            
            console.log(`PDF uploaded to Gemini File API: ${uploadResult.uri}`);
          } else {
            // Fallback: extract text only
            const content = await extractTextFromFile(file);
            newFile = {
              name: file.name,
              type: 'pdf',
              content: content,
            };
          }
        } catch (uploadError) {
          console.warn('Failed to upload to Gemini File API, falling back to text extraction:', uploadError);
          // Fallback to text extraction
          const content = await extractTextFromFile(file);
          newFile = {
            name: file.name,
            type: 'pdf',
            content: content,
          };
        }
      } else {
        // For TXT: just extract text
        const content = await extractTextFromFile(file);
        newFile = {
          name: file.name,
          type: 'txt',
          content: content,
        };
      }

      setKnowledgeFiles([...knowledgeFiles, newFile]);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to read file');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setKnowledgeFiles(knowledgeFiles.filter((_, i) => i !== index));
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Delete this session?')) return;

    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    await saveSessions(updatedSessions);
    onSessionsUpdate(updatedSessions);

    if (activeSessionId === sessionId) {
      onActiveSessionChange(null);
    }
  };

  const handleSetActive = (sessionId: string | null) => {
    onActiveSessionChange(sessionId);
  };

  return (
    <div className="session-manager">
      {!isAdding ? (
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
          <FaPlus /> Add New Session
        </button>
      ) : (
        <div className="session-form">
          <div className="form-group">
            <label className="form-label">Session Name</label>
            <input
              type="text"
              className="form-input"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g., Biology Chapter 5"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Knowledge Text (Optional)</label>
            <textarea
              className="form-textarea"
              value={knowledgeText}
              onChange={(e) => setKnowledgeText(e.target.value)}
              placeholder="Paste study material here..."
              rows={5}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Upload Files (PDF/TXT)</label>
            <label htmlFor="file-upload" className="file-upload-btn">
              <FaUpload /> {isUploading ? 'Uploading...' : 'Choose File'}
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={isUploading}
            />
            {knowledgeFiles.length > 0 && (
              <div className="uploaded-files">
                {knowledgeFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <FaFile className="file-icon" />
                    <span>{file.name}</span>
                    <button
                      className="btn-remove-file"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button className="btn btn-success" onClick={handleAddSession}>
              Save Session
            </button>
            <button className="btn btn-secondary" onClick={() => setIsAdding(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="empty-state">
          <p>No sessions yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="session-list">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`session-card ${session.id === activeSessionId ? 'active' : ''}`}
            >
              <div className="session-header">
                <div className="session-title">
                  {session.id === activeSessionId ? <FaCheckCircle className="active-icon" /> : <FaCircle className="inactive-icon" />}
                  <span>{session.name}</span>
                </div>
                <div className="session-actions">
                  {session.id === activeSessionId ? (
                    <button className="btn btn-sm btn-secondary" onClick={() => handleSetActive(null)}>
                      Deactivate
                    </button>
                  ) : (
                    <button className="btn btn-sm btn-primary" onClick={() => handleSetActive(session.id)}>
                      Activate
                    </button>
                  )}
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteSession(session.id)}>
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="session-content">
                {session.knowledgeText && (
                  <div className="knowledge-text">
                    {session.knowledgeText.substring(0, 200)}
                    {session.knowledgeText.length > 200 && '...'}
                  </div>
                )}
                {session.knowledgeFiles.length > 0 && (
                  <div className="session-files">
                    {session.knowledgeFiles.map((file, index) => (
                      <span key={index} className="file-badge">
                        <FaFile /> {file.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="session-meta">
                Last modified: {new Date(session.dateModified).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SessionManager;
