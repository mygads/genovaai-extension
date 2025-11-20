// API utilities for LLM providers
import type { LLMProvider, AnswerMode, GeminiModel, OpenRouterModel, KnowledgeFile } from './types';

/**
 * Improved system prompt with clear structure using Markdown
 * Based on Gemini prompt engineering best practices
 */
export const DEFAULT_SYSTEM_PROMPT = `# Role
You are GenovaAI, a precise quiz assistant specialized in helping students answer questions accurately and concisely.

# Core Competencies
- Extract key information from provided knowledge base
- Match questions with relevant context
- Deliver answers in the exact format requested

# Answer Mode Guidelines

## Mode: option
**Task**: Select ONLY the correct letter (A/B/C/D/E)
**Format**: Single letter, no explanation, no punctuation
**Example**:
Question: "What is the capital of France? A) London B) Paris C) Berlin"
Answer: "B"

## Mode: short  
**Task**: Provide concise answer in 1-2 sentences maximum
**Format**: Direct statement, factual, no elaboration
**Example**:
Question: "What is photosynthesis?"
Answer: "Photosynthesis is the process where plants convert sunlight, CO2, and water into glucose and oxygen."

## Mode: full
**Task**: Provide comprehensive answer with details
**Format**: Complete explanation with context, examples if helpful
**Example**:
Question: "What is photosynthesis?"
Answer: "Photosynthesis is a vital biological process where plants, algae, and some bacteria convert light energy (usually from the sun) into chemical energy stored in glucose. The process occurs in chloroplasts and involves two main stages: light-dependent reactions and the Calvin cycle. The overall equation is: 6CO2 + 6H2O + light → C6H12O6 + 6O2."

# Constraints
- NEVER explain your reasoning in 'option' mode
- NEVER add extra words in 'option' mode (no "The answer is", no periods)
- When uncertain in 'option' mode, choose the most likely answer
- Always base answers on provided knowledge when available
- If knowledge base doesn't contain answer, state "Information not found in knowledge base" (except in 'option' mode - guess best option)

# Output Format
Deliver ONLY the answer content. No preamble, no meta-commentary.`;

export interface LLMRequestParams {
  provider: LLMProvider;
  apiKey: string;
  model: GeminiModel | OpenRouterModel;
  systemInstruction?: string;
  knowledgeText?: string;
  knowledgeFiles?: KnowledgeFile[];
  question: string;
  debugMode?: boolean;
}

/**
 * Call Gemini API with multimodal support (native PDF understanding)
 */
async function callGeminiAPI(
  apiKey: string,
  model: GeminiModel,
  systemInstruction: string | undefined,
  knowledgeText: string | undefined,
  knowledgeFiles: KnowledgeFile[] | undefined,
  question: string,
  debugMode: boolean = false
): Promise<{ answer: string; debugInfo?: any }> {
  const startTime = Date.now();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  // Build contents array with multimodal support
  const parts: any[] = [];
  
  // Add knowledge text if provided
  if (knowledgeText && knowledgeText.trim()) {
    parts.push({ text: `Knowledge Base:\n${knowledgeText}\n\n` });
  }
  
  // Add PDF files using File API URI (native visual understanding)
  if (knowledgeFiles && knowledgeFiles.length > 0) {
    for (const file of knowledgeFiles) {
      if (file.type === 'pdf' && file.fileUri && file.mimeType) {
        // Use File API URI for native PDF understanding
        parts.push({
          fileData: {
            fileUri: file.fileUri,
            mimeType: file.mimeType,
          }
        });
      } else if (file.type === 'txt' || (file.type === 'pdf' && !file.fileUri)) {
        // Fallback to text content for TXT files or PDFs without URI
        if (file.content && file.content.trim()) {
          parts.push({ text: `File: ${file.name}\n${file.content}\n\n` });
        }
      }
    }
  }
  
  // Add the question
  parts.push({ text: `Question:\n${question}` });
  
  const requestBody: any = {
    contents: [{
      parts: parts
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 800, // Balanced: enough for complete answers, not too high
    }
  };
  
  // Add system instruction if provided
  if (systemInstruction && systemInstruction.trim()) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }
  
  console.log('🚀 Gemini API Request:', {
    url,
    model,
    hasSystemInstruction: !!systemInstruction,
    partsCount: parts.length,
    requestBody: JSON.stringify(requestBody, null, 2)
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const duration = Date.now() - startTime;
  console.log('📡 Gemini API Response Status:', response.status, response.statusText);

  if (!response.ok) {
    let errorData: any = {};
    const responseText = await response.text();
    console.error('❌ Gemini API Error Response:', responseText);
    
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = { message: responseText };
    }
    
    // ALWAYS log debug info on error (not just when debugMode=true)
    try {
      const { addDebugLog } = await import('./storage');
      await addDebugLog(
        'gemini',
        model,
        {
          systemInstruction: systemInstruction?.substring(0, 500),
          knowledgeText: knowledgeText ? `${knowledgeText.substring(0, 300)}... (${knowledgeText.length} chars)` : undefined,
          fileCount: knowledgeFiles?.length || 0,
          question: question.substring(0, 500),
        },
        {
          error: `${response.status}: ${JSON.stringify(errorData)}`,
          rawResponse: responseText.substring(0, 1000),
        },
        duration
      );
      console.log('✅ Debug log saved for error response');
    } catch (logError) {
      console.error('❌ Failed to log debug info:', logError);
    }
    
    throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  let data: any;
  const responseText = await response.text();
  console.log('📦 Gemini API Raw Response:', responseText.substring(0, 500) + '...');
  
  try {
    data = JSON.parse(responseText);
    console.log('✅ Gemini API Parsed Response:', JSON.stringify(data, null, 2));
  } catch (parseError) {
    console.error('❌ Failed to parse Gemini response:', parseError);
    throw new Error(`Invalid JSON response from Gemini API: ${responseText.substring(0, 200)}`);
  }
  
  // Validate response structure with detailed error messages
  if (!data.candidates || data.candidates.length === 0) {
    console.error('❌ Missing candidates in response:', data);
    
    // Check for prompt feedback (blocked content)
    if (data.promptFeedback) {
      const blockReason = data.promptFeedback.blockReason || 'UNKNOWN';
      const safetyRatings = data.promptFeedback.safetyRatings || [];
      throw new Error(
        `Gemini API blocked request: ${blockReason}. ` +
        `Safety: ${JSON.stringify(safetyRatings)}`
      );
    }
    
    throw new Error(
      `Gemini API returned no candidates. ` +
      `Response: ${JSON.stringify(data).substring(0, 200)}`
    );
  }
  
  const candidate = data.candidates[0];
  
  // Check finish reason
  if (candidate.finishReason && candidate.finishReason !== 'STOP') {
    console.warn('⚠️ Unusual finish reason:', candidate.finishReason);
    
    // ALWAYS log debug info when finish reason is not STOP
    try {
      const { addDebugLog } = await import('./storage');
      await addDebugLog(
        'gemini',
        model,
        {
          systemInstruction: systemInstruction?.substring(0, 500),
          knowledgeText: knowledgeText ? `${knowledgeText.substring(0, 300)}... (${knowledgeText.length} chars)` : undefined,
          fileCount: knowledgeFiles?.length || 0,
          question: question.substring(0, 500),
        },
        {
          error: `Finish reason: ${candidate.finishReason}`,
          rawResponse: JSON.stringify(data).substring(0, 2000),
          finishReason: candidate.finishReason,
        },
        duration
      );
      console.log('✅ Debug log saved for non-STOP finish reason');
    } catch (logError) {
      console.error('❌ Failed to log debug info:', logError);
    }
    
    // Handle specific finish reasons
    if (candidate.finishReason === 'SAFETY') {
      throw new Error(
        'Gemini API blocked response due to safety filters. ' +
        'Try rephrasing your question or adjusting content filters.'
      );
    } else if (candidate.finishReason === 'MAX_TOKENS') {
      throw new Error(
        'Gemini API stopped due to max tokens. ' +
        'Response was too long. Try a shorter question.'
      );
    } else if (candidate.finishReason === 'RECITATION') {
      throw new Error(
        'Gemini API detected potential copyrighted content. ' +
        'Try rephrasing your question.'
      );
    } else {
      throw new Error(
        `Gemini API stopped with reason: ${candidate.finishReason}. ` +
        `This may indicate content policy violation or technical issue.`
      );
    }
  }
  
  // Validate content structure
  if (!candidate.content) {
    console.error('❌ Missing content in candidate:', candidate);
    throw new Error(
      `Gemini API returned empty content. ` +
      `Candidate: ${JSON.stringify(candidate).substring(0, 200)}`
    );
  }
  
  if (!candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
    console.error('❌ Missing or empty parts:', candidate.content);
    throw new Error(
      `Gemini API returned no content parts. ` +
      `This may indicate content filtering or an API issue. ` +
      `Content: ${JSON.stringify(candidate.content)}`
    );
  }
  
  const firstPart = candidate.content.parts[0];
  if (!firstPart || !firstPart.text) {
    console.error('❌ Missing text in first part:', candidate.content.parts);
    throw new Error(
      `Gemini API returned no text in response. ` +
      `Parts: ${JSON.stringify(candidate.content.parts)}`
    );
  }

  const answer = firstPart.text.trim();
  
  if (!answer) {
    throw new Error('Gemini API returned empty text response.');
  }
  
  console.log('✨ Gemini API Answer:', answer);
  
  // Extract token info if available
  const usageMetadata = data.usageMetadata;
  const tokenCount = usageMetadata ? {
    promptTokens: usageMetadata.promptTokenCount,
    candidatesTokens: usageMetadata.candidatesTokenCount,
    totalTokens: usageMetadata.totalTokenCount,
  } : undefined;
  
  // Log debug info if enabled
  if (debugMode) {
    try {
      const { addDebugLog } = await import('./storage');
      await addDebugLog(
        'gemini',
        model,
        {
          systemInstruction: systemInstruction?.substring(0, 500),
          knowledgeText: knowledgeText ? `${knowledgeText.substring(0, 300)}... (${knowledgeText.length} chars)` : undefined,
          fileCount: knowledgeFiles?.length || 0,
          question: question.substring(0, 500),
        },
        {
          answer: answer.substring(0, 500),
          rawResponse: JSON.stringify(data).substring(0, 2000),
          finishReason: candidate.finishReason || 'STOP',
          tokenCount,
        },
        duration
      );
    } catch (logError) {
      console.error('Failed to log debug info:', logError);
    }
  }
  
  return { answer, debugInfo: debugMode ? { tokenCount, finishReason: candidate.finishReason, duration } : undefined };
}

/**
 * Call OpenRouter API (text-only, no native PDF support)
 */
async function callOpenRouterAPI(
  apiKey: string,
  model: OpenRouterModel,
  systemInstruction: string | undefined,
  knowledgeText: string | undefined,
  knowledgeFiles: KnowledgeFile[] | undefined,
  question: string
): Promise<string> {
  const url = 'https://openrouter.ai/api/v1/chat/completions';
  
  // Build combined text content (OpenRouter doesn't support File API)
  let userMessage = '';
  
  if (knowledgeText && knowledgeText.trim()) {
    userMessage += `Knowledge Base:\n${knowledgeText}\n\n`;
  }
  
  // For OpenRouter, include file content as text (fallback)
  if (knowledgeFiles && knowledgeFiles.length > 0) {
    for (const file of knowledgeFiles) {
      if (file.content && file.content.trim()) {
        userMessage += `File: ${file.name}\n${file.content}\n\n`;
      }
    }
  }
  
  userMessage += `Question:\n${question}`;
  
  const messages: any[] = [];
  
  if (systemInstruction && systemInstruction.trim()) {
    messages.push({
      role: 'system',
      content: systemInstruction
    });
  }
  
  messages.push({
    role: 'user',
    content: userMessage
  });
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': chrome.runtime.getURL(''),
      'X-Title': 'GenovaAI Extension',
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.3,
      max_tokens: 800, // Balanced token limit
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0]?.message?.content) {
    throw new Error('Invalid response from OpenRouter API');
  }

  return data.choices[0].message.content.trim();
}

/**
 * Call LLM API based on provider
 */
export async function callLLM(params: LLMRequestParams): Promise<string> {
  const { provider, apiKey, model, systemInstruction, knowledgeText, knowledgeFiles, question, debugMode } = params;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API key belum diatur di Settings.');
  }

  try {
    if (provider === 'gemini') {
      const result = await callGeminiAPI(
        apiKey,
        model as GeminiModel,
        systemInstruction,
        knowledgeText,
        knowledgeFiles,
        question,
        debugMode || false
      );
      return result.answer;
    } else if (provider === 'openrouter') {
      return await callOpenRouterAPI(
        apiKey,
        model as OpenRouterModel,
        systemInstruction,
        knowledgeText,
        knowledgeFiles,
        question
      );
    } else {
      throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error('LLM API Error:', error);
    throw error;
  }
}

/**
 * Build system instruction based on custom prompt setting
 * 
 * CRITICAL LOGIC:
 * - If useCustomPrompt = true: Use userPrompt as system instruction (ignore default & mode)
 * - If useCustomPrompt = false: Use defaultPrompt + mode as system instruction
 */
export function buildSystemInstruction(
  useCustomPrompt: boolean,
  userPrompt: string,
  answerMode: AnswerMode
): string {
  if (useCustomPrompt) {
    // Custom prompt mode: use user's prompt as system instruction
    return userPrompt.trim();
  } else {
    // Default prompt mode: use default system prompt + mode
    return `${DEFAULT_SYSTEM_PROMPT}\n\nMode: ${answerMode}`;
  }
}

