import React, { useState, useEffect, useCallback } from 'react';
import { FaUpload, FaTrash, FaFile, FaFilePdf, FaFileWord, FaFileAlt, FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';
import { uploadFile, getKnowledgeFiles, deleteKnowledgeFile } from '../../shared/api';

interface KnowledgeFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  sessionId: string | null;
}

interface Props {
  sessionId?: string; // If provided, upload directly to this session
}

export default function KnowledgeManager({ sessionId }: Props) {
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, [sessionId]);

  const loadFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getKnowledgeFiles(sessionId);
      if (response.success && response.data) {
        setFiles(response.data.files);
      } else {
        setError(response.error || 'Failed to load files');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const file = selectedFiles[0];

    // Validate file type
    const allowedTypes = ['.pdf', '.txt', '.docx'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(ext)) {
      setError('File type not allowed. Allowed: PDF, TXT, DOCX');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size exceeds 10MB limit');
      return;
    }

    // Upload file
    setUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await uploadFile(file, sessionId);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        setSuccess(`File "${file.name}" uploaded successfully!`);
        setTimeout(() => {
          setSuccess('');
          setUploadProgress(0);
        }, 3000);
        loadFiles(); // Reload file list
      } else {
        setError(response.error || 'Upload failed');
        setUploadProgress(0);
      }
    } catch (err) {
      setError('Network error');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Delete file "${fileName}"?`)) return;

    try {
      const response = await deleteKnowledgeFile(fileId);
      if (response.success) {
        setSuccess('File deleted successfully');
        setTimeout(() => setSuccess(''), 2000);
        loadFiles();
      } else {
        setError(response.error || 'Failed to delete file');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [sessionId]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFileIcon = (fileType: string) => {
    const iconStyle = { fontSize: '24px' };
    switch (fileType.toUpperCase()) {
      case 'PDF':
        return <FaFilePdf style={{ ...iconStyle, color: '#f44336' }} />;
      case 'DOCX':
        return <FaFileWord style={{ ...iconStyle, color: '#2196F3' }} />;
      case 'TXT':
        return <FaFileAlt style={{ ...iconStyle, color: '#666' }} />;
      default:
        return <FaFile style={{ ...iconStyle, color: '#999' }} />;
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Upload Area */}
      <div
        style={{
          border: `2px dashed ${dragOver ? '#2196F3' : '#ddd'}`,
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          background: dragOver ? '#e3f2fd' : 'white',
          transition: 'all 0.2s',
          marginBottom: '20px',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <FaUpload style={{ fontSize: '48px', color: '#999', marginBottom: '16px' }} />
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '8px', fontWeight: '500' }}>
          Drag & drop a file here, or click to browse
        </p>
        <p style={{ fontSize: '13px', color: '#999', marginBottom: '20px' }}>
          Supported: PDF, TXT, DOCX (Max 10MB)
        </p>
        <input
          type="file"
          id="file-input"
          style={{ display: 'none' }}
          accept=".pdf,.txt,.docx"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={uploading}
        />
        <label
          htmlFor="file-input"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            background: uploading ? '#e0e0e0' : '#2196F3',
            color: 'white',
            fontWeight: '500',
            fontSize: '14px',
          }}
        >
          {uploading ? (
            <>
              <FaSpinner style={{ display: 'inline', marginRight: '8px', animation: 'spin 1s linear infinite' }} />
              Uploading...
            </>
          ) : (
            <>
              <FaUpload style={{ display: 'inline', marginRight: '8px' }} />
              Choose File
            </>
          )}
        </label>
      </div>

      {/* Upload Progress */}
      {uploading && uploadProgress > 0 && (
        <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>Uploading...</span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{uploadProgress}%</span>
          </div>
          <div style={{ width: '100%', background: '#ddd', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
            <div
              style={{
                background: '#2196F3',
                height: '8px',
                borderRadius: '4px',
                transition: 'width 0.3s',
                width: `${uploadProgress}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div style={{
          background: '#e8f5e9',
          border: '1px solid #c8e6c9',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <FaCheck style={{ color: '#4CAF50', marginRight: '12px', flexShrink: 0 }} />
          <span style={{ color: '#2e7d32' }}>{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#ffebee',
          border: '1px solid #ffcdd2',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <FaTimes style={{ color: '#f44336', marginRight: '12px', flexShrink: 0 }} />
          <span style={{ color: '#c62828' }}>{error}</span>
        </div>
      )}

      {/* File List */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
            Uploaded Files {sessionId && '(This Session)'}
          </h3>
          <p style={{ fontSize: '13px', color: '#666' }}>
            {files.length} file{files.length !== 1 && 's'}
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <FaSpinner style={{ fontSize: '32px', color: '#999', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#666', marginTop: '12px' }}>Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            No files uploaded yet
          </div>
        ) : (
          <div>
            {files.map((file) => (
              <div
                key={file.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div style={{ marginRight: '12px', flexShrink: 0 }}>
                    {getFileIcon(file.fileType)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: '500', color: '#333', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.fileName}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#666' }}>
                      <span>{file.fileType.toUpperCase()}</span>
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>{formatDate(file.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(file.id, file.fileName)}
                  style={{
                    marginLeft: '16px',
                    padding: '8px',
                    color: '#f44336',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  title="Delete file"
                  onMouseEnter={(e) => e.currentTarget.style.background = '#ffebee'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
