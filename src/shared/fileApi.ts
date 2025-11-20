// Gemini File API utilities for native PDF understanding

export interface UploadedFile {
  name: string;
  uri: string;
  mimeType: string;
  sizeBytes: string;
  state: 'PROCESSING' | 'ACTIVE' | 'FAILED';
  createTime: string;
  updateTime: string;
  expirationTime: string;
}

/**
 * Upload file to Gemini File API
 * Supports PDF files for native visual understanding
 * Uses resumable upload protocol as per Gemini API docs
 */
export async function uploadFileToGemini(
  apiKey: string,
  fileData: ArrayBuffer,
  fileName: string,
  mimeType: string
): Promise<UploadedFile> {
  // Step 1: Initiate resumable upload and get upload URL
  const initUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
  
  const metadata = {
    file: {
      displayName: fileName,
    }
  };
  
  const initResponse = await fetch(initUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(fileData.byteLength),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!initResponse.ok) {
    const errorData = await initResponse.text();
    
    // Log error to storage
    try {
      const { addErrorLog } = await import('./storage');
      await addErrorLog(
        'upload_error',
        `File upload init failed: ${initResponse.status}`,
        errorData,
        undefined
      );
    } catch (logError) {
      console.error('Failed to log upload error:', logError);
    }
    
    throw new Error(`File upload init error: ${initResponse.status} - ${errorData}`);
  }
  
  // Get upload URL from response header
  const uploadUrl = initResponse.headers.get('X-Goog-Upload-URL');
  if (!uploadUrl) {
    throw new Error('No upload URL returned from Gemini API');
  }
  
  // Step 2: Upload the actual file data
  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(fileData.byteLength),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: fileData,
  });

  if (!uploadResponse.ok) {
    const errorData = await uploadResponse.text();
    
    // Log error to storage
    try {
      const { addErrorLog } = await import('./storage');
      await addErrorLog(
        'upload_error',
        `File upload failed: ${uploadResponse.status}`,
        errorData,
        undefined
      );
    } catch (logError) {
      console.error('Failed to log upload error:', logError);
    }
    
    throw new Error(`File upload error: ${uploadResponse.status} - ${errorData}`);
  }

  const result = await uploadResponse.json() as { file: UploadedFile };
  return result.file;
}

/**
 * Poll file status until it's ACTIVE or FAILED
 */
export async function waitForFileProcessing(
  apiKey: string,
  fileName: string,
  maxAttempts: number = 30
): Promise<UploadedFile> {
  for (let i = 0; i < maxAttempts; i++) {
    const fileInfo = await getFileInfo(apiKey, fileName);
    
    if (fileInfo.state === 'ACTIVE') {
      return fileInfo;
    }
    
    if (fileInfo.state === 'FAILED') {
      throw new Error('File processing failed');
    }
    
    // Wait 2 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('File processing timeout');
}

/**
 * Get file information from Gemini File API
 */
export async function getFileInfo(apiKey: string, fileName: string): Promise<UploadedFile> {
  const url = `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Get file error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  return await response.json() as UploadedFile;
}

/**
 * Delete file from Gemini File API
 */
export async function deleteFile(apiKey: string, fileName: string): Promise<void> {
  const url = `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Delete file error: ${response.status} - ${JSON.stringify(errorData)}`);
  }
}

/**
 * List all uploaded files
 */
export async function listFiles(apiKey: string): Promise<UploadedFile[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/files?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`List files error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json() as { files: UploadedFile[] };
  return data.files || [];
}

/**
 * Upload PDF file and wait for processing
 * All-in-one helper function
 */
export async function uploadPDFFile(
  apiKey: string,
  fileData: ArrayBuffer,
  fileName: string
): Promise<{ uri: string; mimeType: string }> {
  // Upload file
  const uploadedFile = await uploadFileToGemini(
    apiKey,
    fileData,
    fileName,
    'application/pdf'
  );
  
  console.log(`File uploaded: ${uploadedFile.name}, waiting for processing...`);
  
  // Wait for processing
  const processedFile = await waitForFileProcessing(apiKey, uploadedFile.name);
  
  console.log(`File ready: ${processedFile.uri}`);
  
  return {
    uri: processedFile.uri,
    mimeType: processedFile.mimeType,
  };
}
