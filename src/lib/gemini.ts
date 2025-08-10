import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { ENV } from './env-config';

// Simple in-memory cache for AI results
// In production, consider Redis or another distributed cache
const analysisCache: {
  [scriptId: string]: {
    result: ScriptAnalysisResult,
    timestamp: number,
    expiresAt: number
  }
} = {};

// Default cache TTL (Time To Live) - 24 hours
const DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000;

// Maximum retry attempts for AI requests
const MAX_RETRY_ATTEMPTS = 3;

// Base delay for exponential backoff (in ms)
const BASE_RETRY_DELAY = 1000;

/**
 * Creates a Gemini Pro client for text generation
 * @returns Gemini Pro client or null if API key is missing
 */
export function createGeminiProClient() {
  const apiKey = ENV.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('Gemini API key is not defined. Please set the GEMINI_API_KEY environment variable.');
    return null;
  }
  
  try {
    // Initialize the API client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the Gemini model - updated to use a current model name
    const geminiPro = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    return geminiPro;
  } catch (error) {
    console.error('Failed to initialize Gemini client:', error);
    return null;
  }
}

/**
 * Generates content using Gemini Pro with retry logic
 * @param prompt The prompt to generate content from
 * @returns Generated content or error message
 */
export async function generateContent(
  prompt: string,
  retryAttempt = 0
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const gemini = createGeminiProClient();
    
    if (!gemini) {
      throw new Error('Failed to initialize Gemini client');
    }
    
    const result = await gemini.generateContent(prompt);
    const text = result.response.text();
    
    return {
      success: true,
      content: text
    };
  } catch (error) {
    console.error(`Content generation error (attempt ${retryAttempt + 1}):`, error);
    
    // Implement exponential backoff for retries
    if (retryAttempt < MAX_RETRY_ATTEMPTS) {
      const delay = BASE_RETRY_DELAY * Math.pow(2, retryAttempt);
      console.log(`Retrying in ${delay}ms...`);
      
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(generateContent(prompt, retryAttempt + 1));
        }, delay);
      });
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error generating content'
    };
  }
}

// API key from environment variables
const GEMINI_API_KEY = ENV.GEMINI_API_KEY;

// Initialize the Gemini API client - Only if API key is available
let genAI: GoogleGenerativeAI | null = null;

if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  } catch (error) {
    console.error('Failed to initialize Gemini client:', error);
  }
}

// Configure the Gemini model
const modelConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 8192,
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
};

/**
 * Analysis result structure
 */
export interface ScriptAnalysisResult {
  summary: string;
  structure: {
    score: number;
    feedback: string;
  };
  characters: {
    score: number;
    feedback: string;
    main_characters: string[];
  };
  dialogue: {
    score: number;
    feedback: string;
  };
  pacing: {
    score: number;
    feedback: string;
  };
  market_potential: {
    score: number;
    feedback: string;
    target_audience: string[];
    genres: string[];
  };
  overall_score: number;
}

/**
 * Check if a cached analysis exists and is valid
 * @param scriptId ID of the script
 * @param maxAgeSecs Maximum age in seconds for cache validity
 * @returns Cached analysis or null if not found or expired
 */
export function getCachedAnalysis(
  scriptId: string,
  maxAgeSecs = 86400 // 24 hours default
): ScriptAnalysisResult | null {
  const cached = analysisCache[scriptId];
  
  if (!cached) {
    return null;
  }
  
  const maxAgeMs = maxAgeSecs * 1000;
  const now = Date.now();
  
  // Check if cache has expired
  if (now > cached.expiresAt || now - cached.timestamp > maxAgeMs) {
    // Delete expired cache entry
    delete analysisCache[scriptId];
    return null;
  }
  
  return cached.result;
}

/**
 * Stores an analysis result in the cache
 * @param scriptId ID of the script
 * @param result Analysis result
 * @param ttlMs Time to live in milliseconds
 */
export function cacheAnalysisResult(
  scriptId: string,
  result: ScriptAnalysisResult,
  ttlMs = DEFAULT_CACHE_TTL
): void {
  const now = Date.now();
  
  analysisCache[scriptId] = {
    result,
    timestamp: now,
    expiresAt: now + ttlMs
  };
}

/**
 * Transcribes an audio buffer to text using Gemini 1.5 multimodal input
 */
export async function transcribeAudioToText(
  audioBuffer: Buffer,
  mimeType: string = 'audio/mpeg',
  options: { redactOnSafety?: boolean } = { redactOnSafety: true }
): Promise<{ success: boolean; text?: string; error?: string }> {
  const tryOnce = async (redact: boolean) => {
    const model = genAI?.getGenerativeModel({
      model: 'gemini-1.5-flash',
      ...modelConfig,
      // Use more permissive safety thresholds for transcription
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      ],
    } as any);
    if (!model) throw new Error('Failed to initialize Gemini model');

    const base64 = Buffer.from(audioBuffer).toString('base64');
    const instruction = redact
      ? 'Transcribe the following audio. If any content would be blocked by safety filters, replace only the unsafe words with [redacted] and continue. Return only the transcript.'
      : 'Transcribe the following audio verbatim. Return only the raw transcript text with no additional commentary.';

    const result = await model.generateContent([
      { text: instruction } as any,
      { inlineData: { mimeType, data: base64 } } as any,
    ] as any);

    const response = await result.response;
    return response.text();
  };

  try {
    const text = await tryOnce(false);
    return { success: true, text };
  } catch (e: any) {
    const msg = e?.message || String(e);
    // Retry with redaction if safety blocked
    if (options.redactOnSafety && /SAFETY|blocked/i.test(msg)) {
      try {
        const text = await tryOnce(true);
        return { success: true, text };
      } catch (e2: any) {
        return { success: false, error: e2?.message || 'Transcription failed after safety fallback' };
      }
    }
    return { success: false, error: msg };
  }
}

/**
 * Analyzes a script using Google's Gemini API with caching and retry logic
 * @param scriptContent The content of the script to analyze
 * @param options Additional options for analysis
 * @returns Script analysis result
 */
export async function analyzeScript(
  scriptContent: string,
  options: {
    scriptId?: string;
    requirements?: string[];
    useCache?: boolean;
    cacheTtlSecs?: number;
    retryAttempt?: number;
  } = {}
): Promise<ScriptAnalysisResult> {
  const {
    scriptId,
    requirements = [],
    useCache = true,
    cacheTtlSecs = 86400,
    retryAttempt = 0
  } = options;
  
  try {
    // Check cache if scriptId is provided and caching is enabled
    if (scriptId && useCache) {
      const cachedResult = getCachedAnalysis(scriptId, cacheTtlSecs);
      if (cachedResult) {
        console.log(`Using cached analysis for script ${scriptId}`);
        return cachedResult;
      }
    }
    
    // Initialize the model
    const model = genAI?.getGenerativeModel({ model: 'gemini-1.5-flash', ...modelConfig });
    
    if (!model) {
      throw new Error('Failed to initialize Gemini model');
    }
    
    // Create the prompt for script analysis
    const requirementsText = requirements.length > 0
      ? `\nAdditional requirements to consider:\n${requirements.map(r => `- ${r}`).join('\n')}`
      : '';
      
    const prompt = `
      You are an expert script analyst with experience in film and TV production.
      Please analyze the following script and provide detailed feedback in JSON format.
      
      ${requirementsText}
      
      Please format your analysis as a JSON object with the following structure:
      {
        "summary": "Brief summary of the script (100-150 words)",
        "structure": {
          "score": 0-100 (numerical score),
          "feedback": "Detailed feedback on structure (100-150 words)"
        },
        "characters": {
          "score": 0-100 (numerical score),
          "feedback": "Detailed feedback on characters (100-150 words)",
          "main_characters": ["Character 1", "Character 2", ...]
        },
        "dialogue": {
          "score": 0-100 (numerical score),
          "feedback": "Detailed feedback on dialogue (100-150 words)"
        },
        "pacing": {
          "score": 0-100 (numerical score),
          "feedback": "Detailed feedback on pacing (100-150 words)"
        },
        "market_potential": {
          "score": 0-100 (numerical score),
          "feedback": "Detailed feedback on market potential (100-150 words)",
          "target_audience": ["Audience 1", "Audience 2", ...],
          "genres": ["Genre 1", "Genre 2", ...]
        },
        "overall_score": 0-100 (numerical overall score)
      }
      
      THE SCRIPT:
      ${scriptContent}
    `;
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}') + 1;
    const jsonString = text.substring(startIndex, endIndex);
    
    const analysis = JSON.parse(jsonString) as ScriptAnalysisResult;
    
    // Cache the result if scriptId is provided
    if (scriptId) {
      cacheAnalysisResult(scriptId, analysis, cacheTtlSecs * 1000);
    }
    
    return analysis;
  } catch (error) {
    console.error(`Error analyzing script with Gemini (attempt ${retryAttempt + 1}):`, error);
    
    // Implement exponential backoff for retries
    if (retryAttempt < MAX_RETRY_ATTEMPTS) {
      const delay = BASE_RETRY_DELAY * Math.pow(2, retryAttempt);
      console.log(`Retrying script analysis in ${delay}ms...`);
      
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(analyzeScript(scriptContent, {
            ...options,
            retryAttempt: retryAttempt + 1
          }));
        }, delay);
      });
    }
    
    // Return a default error response
    return {
      summary: 'Failed to analyze script due to an error.',
      structure: { score: 0, feedback: 'Analysis failed.' },
      characters: { 
        score: 0, 
        feedback: 'Analysis failed.', 
        main_characters: []
      },
      dialogue: { score: 0, feedback: 'Analysis failed.' },
      pacing: { score: 0, feedback: 'Analysis failed.' },
      market_potential: {
        score: 0,
        feedback: 'Analysis failed.',
        target_audience: [],
        genres: []
      },
      overall_score: 0
    };
  }
}

/**
 * Synopsis generation result interface
 */
export interface SynopsisResult {
  title_suggestion?: string;
  logline: string;
  synopsis: string;
  target_audience?: string[];
  tone: string;
  themes: string[];
}

/**
 * Generates a synopsis for a script using Google's Gemini API
 * @param scriptContent The content of the script to generate synopsis for
 * @param options Additional options for generation
 * @returns Synopsis generation result
 */
export async function generateSynopsis(
  scriptContent: string,
  options: {
    scriptId?: string;
    useCache?: boolean;
    cacheTtlSecs?: number;
    retryAttempt?: number;
    existingTitle?: string;
  } = {}
): Promise<{ success: boolean; result?: SynopsisResult; error?: string }> {
  const {
    scriptId,
    useCache = true,
    cacheTtlSecs = 86400,
    retryAttempt = 0,
    existingTitle
  } = options;
  
  try {
    // For caching implementation later if needed
    // We'd create a synopsisCache similar to analysisCache
    
    // Initialize the model
    const model = genAI?.getGenerativeModel({ model: 'gemini-1.5-flash', ...modelConfig });
    
    if (!model) {
      throw new Error('Failed to initialize Gemini model');
    }
    
    // Create the prompt for synopsis generation - optimized for free Gemini API
    const titleContext = existingTitle 
      ? `The current title is "${existingTitle}". Only suggest a new title if you have a substantially better alternative.`
      : `Suggest an engaging title that captures the essence of the script.`;
    
    const prompt = `
      You are an expert script consultant specializing in creating marketable synopses for film and TV projects.
      
      Please create a synopsis package for the following script. Be concise and focus on the most compelling elements.
      ${titleContext}
      
      Respond in this JSON format:
      {
        "title_suggestion": "Suggested title, or empty if the current title works well",
        "logline": "A one-sentence summary that hooks the reader (25-35 words)",
        "synopsis": "A compelling 150-200 word summary highlighting the main plot, characters, and hooks",
        "tone": "The emotional tone/mood of the story (e.g., 'darkly comedic', 'suspenseful drama')",
        "themes": ["3-5 main themes explored in the script"]
      }
      
      Script Content:
      ${scriptContent.substring(0, 15000)}  // Limit content size for free API
    `;
    
    // Handle retries with exponential backoff (reusing the pattern from analyzeScript)
    const generateWithRetry = async (attempt: number): Promise<SynopsisResult> => {
      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Extract JSON from the response
        let synopsisData: SynopsisResult;
        
        try {
          // Try to extract JSON if it's embedded in other text
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : responseText;
          synopsisData = JSON.parse(jsonString);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          
          // Fallback: Try to extract components manually
          const loglineMatch = responseText.match(/logline[^:]*:(.*?)(?=synopsis:|$)/i);
          const synopsisMatch = responseText.match(/synopsis[^:]*:(.*?)(?=tone:|$)/i);
          const toneMatch = responseText.match(/tone[^:]*:(.*?)(?=themes:|$)/i);
          const themesMatch = responseText.match(/themes[^:]*:(.*?)(?=\}|$)/i);
          
          synopsisData = {
            logline: loglineMatch ? loglineMatch[1].trim() : 'No logline generated',
            synopsis: synopsisMatch ? synopsisMatch[1].trim() : 'No synopsis generated',
            tone: toneMatch ? toneMatch[1].trim() : 'Not specified',
            themes: themesMatch ? extractListItems(themesMatch[1]) : ['Theme extraction failed']
          };
        }
        
        return synopsisData;
      } catch (error) {
        console.error(`Synopsis generation error (attempt ${attempt + 1}):`, error);
        
        // Implement retry with exponential backoff
        if (attempt < MAX_RETRY_ATTEMPTS) {
          const delay = BASE_RETRY_DELAY * Math.pow(2, attempt);
          console.log(`Retrying synopsis generation in ${delay}ms...`);
          
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(generateWithRetry(attempt + 1));
            }, delay);
          });
        }
        
        throw error;
      }
    };
    
    const synopsisResult = await generateWithRetry(retryAttempt);
    
    return {
      success: true,
      result: synopsisResult
    };
  } catch (error) {
    console.error('Synopsis generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error generating synopsis'
    };
  }
}

// Helper function to extract list items (reusing from ai.ts)
function extractListItems(text: string): string[] {
  if (!text) return [];
  
  // Try to extract numbered or bulleted list items
  const listItemRegex = /(?:^|\n)(?:\d+[.)]|\*|\-|\•)\s*([^\n]+)/g;
  const matches = Array.from(text.matchAll(listItemRegex));
  
  if (matches.length > 0) {
    return matches.map(match => match[1].trim());
  }
  
  // If no list items found, split by commas or newlines
  return text
    .split(/,|\n/)
    .map(item => item.trim())
    .filter(item => item.length > 0);
}