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
 */
export async function uploadFileToGemini(
  apiKey: string,
  fileData: ArrayBuffer,
  fileName: string,
  mimeType: string
): Promise<UploadedFile> {
  // Convert ArrayBuffer to base64
  const base64Data = arrayBufferToBase64(fileData);
  
  // Upload file using multipart form data
  const url = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
  
  const metadata = {
    file: {
      displayName: fileName,
      mimeType: mimeType,
    }
  };
  
  // Create multipart request body
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const bodyParts: string[] = [];
  
  // Add metadata part
  bodyParts.push(
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n`
  );
  
  // Add file data part
  bodyParts.push(
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n` +
    `Content-Transfer-Encoding: base64\r\n\r\n` +
    `${base64Data}\r\n` +
    `--${boundary}--\r\n`
  );
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: bodyParts.join(''),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`File upload error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const uploadedFile = await response.json() as { file: UploadedFile };
  return uploadedFile.file;
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
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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
