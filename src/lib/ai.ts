import { createGeminiProClient } from './gemini';

// Interface for AI analysis results
export interface AIScriptAnalysis {
  overall: number;          // Overall score (0-100)
  creativity: number;       // Creativity score (0-100)
  structure: number;        // Structure score (0-100)
  character_development: number; // Character development score (0-100)
  marketability: number;    // Marketability score (0-100)
  analysis: string;         // Detailed analysis text
  strengths: string[];      // List of script strengths
  weaknesses: string[];     // List of script improvement areas
  keywords: string[];       // Keywords/tags for the script
}

/**
 * Analyze a script using Gemini AI
 * @param scriptContent The content of the script to analyze
 * @param projectRequirements Optional project requirements to consider
 * @returns Analysis results or error
 */
export async function analyzeScript(
  scriptContent: string,
  projectRequirements?: string[]
): Promise<{ success: boolean; result?: AIScriptAnalysis; error?: string }> {
  try {
    const gemini = createGeminiProClient();
    
    if (!gemini) {
      throw new Error('Failed to initialize Gemini client');
    }
    
    // Prepare script analysis prompt
    let prompt = `Analyze the following script as a professional script reviewer. Provide a comprehensive analysis including:
    
1. Overall quality score (0-100)
2. Creativity score (0-100)
3. Structure score (0-100)
4. Character development score (0-100)
5. Marketability score (0-100)
6. A detailed analysis of the script's strengths and weaknesses (300-500 words)
7. A list of the script's main strengths (3-5 points)
8. A list of areas that could be improved (3-5 points)
9. Keywords or tags that describe the script (5-8 keywords)

Script Content:
${scriptContent.substring(0, 15000)}`;  // Limit content size

    // Add project requirements if provided
    if (projectRequirements && projectRequirements.length > 0) {
      prompt += `\n\nAlso evaluate how well this script meets the following project requirements:
${projectRequirements.join('\n')}`;
    }
    
    try {
      // Get response from Gemini
      const response = await gemini.generateContent(prompt);
      const textResponse = response.response.text();
      
      // Extract the analysis components
      // This is a simple implementation and might need refinement
      const overallMatch = textResponse.match(/Overall quality score.*?(\d+)/i);
      const creativityMatch = textResponse.match(/Creativity score.*?(\d+)/i);
      const structureMatch = textResponse.match(/Structure score.*?(\d+)/i);
      const characterMatch = textResponse.match(/Character development score.*?(\d+)/i);
      const marketabilityMatch = textResponse.match(/Marketability score.*?(\d+)/i);
      
      // Find the detailed analysis section (typically between scores and strengths)
      const analysisMatch = textResponse.match(/(?:detailed analysis|analysis):(.*?)(?:strengths:|main strengths:|list of.*?strengths:|keywords:|tags:)/is);
      
      // Find strengths (look for a list format)
      const strengthsText = textResponse.match(/(?:strengths:|main strengths:|list of.*?strengths:)(.*?)(?:weaknesses:|areas.*?improved:|list of.*?weaknesses:|keywords:|tags:)/is);
      const strengths = strengthsText ? strengthsText[1].split(/\r?\n/)
        .map(line => line.replace(/^[•*\-]\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 5) : [];
      
      // Find weaknesses/areas to improve
      const weaknessesText = textResponse.match(/(?:weaknesses:|areas.*?improved:|list of.*?weaknesses:|improve:|improvement:)(.*?)(?:keywords:|tags:|$)/is);
      const weaknesses = weaknessesText ? weaknessesText[1].split(/\r?\n/)
        .map(line => line.replace(/^[•*\-]\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 5) : [];
      
      // Find keywords/tags
      const keywordsText = textResponse.match(/(?:keywords:|tags:)(.*?)(?:$)/is);
      const keywords = keywordsText ? keywordsText[1].split(/[,\r\n]/)
        .map(keyword => keyword.replace(/^[•*\-]\s*/, '').trim())
        .filter(keyword => keyword.length > 0)
        .slice(0, 8) : [];
      
      // Construct the analysis result
      const analysisResult: AIScriptAnalysis = {
        overall: overallMatch ? parseInt(overallMatch[1], 10) : 75,
        creativity: creativityMatch ? parseInt(creativityMatch[1], 10) : 70,
        structure: structureMatch ? parseInt(structureMatch[1], 10) : 70,
        character_development: characterMatch ? parseInt(characterMatch[1], 10) : 70,
        marketability: marketabilityMatch ? parseInt(marketabilityMatch[1], 10) : 70,
        analysis: analysisMatch ? analysisMatch[1].trim() : "Analysis failed to extract from the AI response",
        strengths,
        weaknesses,
        keywords
      };
      
      // Apply limits to ensure values are within range 
      // Fix TypeScript errors with proper type handling
      if (analysisResult.overall) analysisResult.overall = Math.min(100, Math.max(0, analysisResult.overall));
      if (analysisResult.creativity) analysisResult.creativity = Math.min(100, Math.max(0, analysisResult.creativity));
      if (analysisResult.structure) analysisResult.structure = Math.min(100, Math.max(0, analysisResult.structure));
      if (analysisResult.character_development) analysisResult.character_development = Math.min(100, Math.max(0, analysisResult.character_development));
      if (analysisResult.marketability) analysisResult.marketability = Math.min(100, Math.max(0, analysisResult.marketability));
      
      return { success: true, result: analysisResult };
    } catch (error) {
      console.error('Error from Gemini API:', error);
      throw error;
    }
  } catch (error) {
    console.error('Script analysis error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in script analysis'
    };
  }
}

/**
 * Helper function to extract list items from text
 */
function extractListItems(text: string): string[] {
  if (!text) return [];
  
  // Try to extract numbered or bulleted list items
  const listItemRegex = /(?:^|\n)(?:\d+[.)]|\*|\-|\•)\s*([^\n]+)/g;
  const matches = Array.from(text.matchAll(listItemRegex));
  
  if (matches.length > 0) {
    return matches.map(match => match[1].trim());
  }
  
  // If no list items found, split by newlines and clean up
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.match(/^(strengths|weaknesses|keywords|tags):/i));
} 