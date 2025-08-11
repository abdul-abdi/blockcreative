import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudioToText } from '@/lib/gemini';
import { analyzeScript as analyzeScriptLegacy } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data with an audio file' }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get('audio') as File | null;
    const projectId = form.get('projectId')?.toString();
    const title = form.get('title')?.toString();
    const genre = form.get('genre')?.toString();
    const synopsis = form.get('synopsis')?.toString();
    const targetAudience = form.get('targetAudience')?.toString();

    if (!file) {
      return NextResponse.json({ error: 'No audio file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'audio/mpeg';

    // 1) Transcribe audio
    const transcription = await transcribeAudioToText(buffer, mimeType);
    if (!transcription.success || !transcription.text) {
      return NextResponse.json({ error: 'Transcription failed', details: transcription.error }, { status: 502 });
    }

    // 2) Analyze transcript using existing analyzer
    const analysisPromptContext: string[] = [];
    if (projectId) analysisPromptContext.push(`Project ID: ${projectId}`);
    if (title) analysisPromptContext.push(`Title: ${title}`);
    if (genre) analysisPromptContext.push(`Genre: ${genre}`);
    if (synopsis) analysisPromptContext.push(`Description: ${synopsis}`);
    if (targetAudience) analysisPromptContext.push(`Target Audience: ${targetAudience}`);

    const analysis = await analyzeScriptLegacy(transcription.text, analysisPromptContext);
    if (!analysis.success || !analysis.result) {
      return NextResponse.json({ error: 'Analysis failed', details: analysis.error }, { status: 502 });
    }

    return NextResponse.json({ success: true, transcript: transcription.text, result: analysis.result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


