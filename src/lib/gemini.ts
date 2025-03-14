import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

/**
 * Creates a Gemini Pro client for text generation
 * @returns Gemini Pro client or null if API key is missing
 */
export function createGeminiProClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('Gemini API key is not defined. Please set the GEMINI_API_KEY environment variable.');
    return null;
  }
  
  try {
    // Initialize the API client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the Gemini Pro model
    const geminiPro = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    return geminiPro;
  } catch (error) {
    console.error('Failed to initialize Gemini client:', error);
    return null;
  }
}

/**
 * Generates content using Gemini Pro
 * @param prompt The prompt to generate content from
 * @returns Generated content or error message
 */
export async function generateContent(prompt: string): Promise<{ success: boolean; content?: string; error?: string }> {
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
    console.error('Content generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error generating content'
    };
  }
}

// API key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

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
 * Analyzes a script using Google's Gemini API
 * @param scriptContent The content of the script to analyze
 * @param requirements Optional project requirements to consider
 * @returns Script analysis result
 */
export async function analyzeScript(
  scriptContent: string,
  requirements: string[] = []
): Promise<ScriptAnalysisResult> {
  try {
    // Initialize the model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro', ...modelConfig });
    
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
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing script with Gemini:', error);
    
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