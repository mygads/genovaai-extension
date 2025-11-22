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
    switch (fileType.toUpperCase()) {
      case 'PDF':
        return <FaFilePdf className="text-red-500" />;
      case 'DOCX':
        return <FaFileWord className="text-blue-500" />;
      case 'TXT':
        return <FaFileAlt className="text-gray-500" />;
      default:
        return <FaFile className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <FaUpload className="mx-auto text-4xl text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2">
          Drag & drop a file here, or click to browse
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Supported: PDF, TXT, DOCX (Max 10MB)
        </p>
        <input
          type="file"
          id="file-input"
          className="hidden"
          accept=".pdf,.txt,.docx"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={uploading}
        />
        <label
          htmlFor="file-input"
          className={`inline-block px-6 py-2 rounded-lg cursor-pointer transition-colors ${
            uploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {uploading ? (
            <>
              <FaSpinner className="inline animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <FaUpload className="inline mr-2" />
              Choose File
            </>
          )}
        </label>
      </div>

      {/* Upload Progress */}
      {uploading && uploadProgress > 0 && (
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Uploading...</span>
            <span className="text-sm font-medium">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <FaCheck className="text-green-500 mr-3" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <FaTimes className="text-red-500 mr-3" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* File List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Uploaded Files {sessionId && '(This Session)'}
          </h3>
          <p className="text-sm text-gray-500">
            {files.length} file{files.length !== 1 && 's'}
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <FaSpinner className="inline text-3xl text-gray-400 animate-spin" />
            <p className="text-gray-500 mt-2">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No files uploaded yet
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {files.map((file) => (
              <div
                key={file.id}
                className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div className="text-2xl mr-3 flex-shrink-0">
                    {getFileIcon(file.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {file.fileName}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{file.fileType.toUpperCase()}</span>
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>{formatDate(file.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(file.id, file.fileName)}
                  className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete file"
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
