// PDF extraction utility using pdfjs-dist
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source to bundled version
// This avoids CSP violations by using the bundled worker
if (typeof chrome !== 'undefined' && chrome.runtime) {
  // In extension context, use bundled worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.js');
} else {
  // Fallback for development
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    
    // Log error to storage
    try {
      const { addErrorLog } = await import('./storage');
      await addErrorLog(
        'pdf_csp',
        error instanceof Error ? error.message : 'PDF extraction failed',
        `File: ${file.name}, Size: ${file.size}`,
        error instanceof Error ? error.stack : undefined
      );
    } catch (logError) {
      console.error('Failed to log PDF error:', logError);
    }
    
    throw new Error('Gagal membaca file PDF');
  }
}

/**
 * Extract text from TXT file
 */
export async function extractTextFromTXT(file: File): Promise<string> {
  try {
    const text = await file.text();
    return text.trim();
  } catch (error) {
    console.error('Error reading TXT file:', error);
    throw new Error('Gagal membaca file TXT');
  }
}

/**
 * Extract text from file based on type
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return await extractTextFromPDF(file);
  } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    return await extractTextFromTXT(file);
  } else {
    throw new Error('Format file tidak didukung. Gunakan PDF atau TXT.');
  }
}
