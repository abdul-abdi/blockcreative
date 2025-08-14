import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import AudioSubmission from "@/models/AudioSubmission";

export async function POST(req: NextRequest){
  try {
    await connectToDatabase();

    // Support multipart/form-data for direct binary upload as well as JSON
    const contentType = req.headers.get('content-type') || '';
    let payload: any = {};

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      payload.title = String(form.get('title') || 'Untitled');
      payload.description = String(form.get('description') || '');
      payload.creatorAddress = String(form.get('creatorAddress') || '').toLowerCase() || undefined;
      payload.tags = (String(form.get('tags') || '').split(',').map(t => t.trim()).filter(Boolean)) || [];

      const file = form.get('audio') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'No audio file uploaded' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      payload.audioData = Buffer.from(arrayBuffer);
      payload.mimeType = file.type || 'audio/mpeg';
      // optional durationSeconds can be provided by client
      const durationStr = form.get('durationSeconds');
      if (durationStr) payload.durationSeconds = Number(durationStr);

      // Optional cover image upload
      const cover = form.get('coverImage') as File | null;
      if (cover) {
        const coverBuffer = Buffer.from(await cover.arrayBuffer());
        const base64 = coverBuffer.toString('base64');
        const mime = cover.type || 'image/png';
        payload.coverImage = `data:${mime};base64,${base64}`;
      }
    } else {
      // Fallback to JSON (e.g., if using external storage and providing audioUrl)
      const data = await req.json();
      payload = { ...data };
      if (!payload.audioUrl && !payload.audioData) {
        return NextResponse.json({ success: false, error: 'audioUrl or audioData is required' }, { status: 400 });
      }
      if (payload.creatorAddress) payload.creatorAddress = String(payload.creatorAddress).toLowerCase();
    }

    const result = await AudioSubmission.create({
      ...payload,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      id: result._id
    });
  } catch (error) {
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest){
  try{
    await connectToDatabase();
    const url = new URL(req.url);
    const creator = url.searchParams.get('creator');
    const id = url.searchParams.get('id');
    const q = url.searchParams.get('q');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
    const skip = Math.max(parseInt(url.searchParams.get('skip') || '0', 10), 0);

    // If requesting a specific item, either stream audio or return metadata based on `meta` flag
    if (id) {
      const doc: any = await AudioSubmission.findById(id).lean();
      if (!doc) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

      const wantMeta = ['1', 'true', 'yes'].includes((url.searchParams.get('meta') || '').toLowerCase());
      if (wantMeta) {
        // Return JSON metadata (exclude large binary data)
        const { audioData, ...rest } = doc as any;
        return NextResponse.json({ success: true, item: rest });
      }

      if ((doc as any).audioUrl) {
        // Redirect to external URL
        return NextResponse.redirect((doc as any).audioUrl);
      }
      if ((doc as any).audioData) {
        const buf: Buffer = (doc as any).audioData as Buffer;
        const body = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
        return new NextResponse(body, {
          status: 200,
          headers: {
            'Content-Type': (doc as any).mimeType || 'audio/mpeg',
            'Content-Length': String(body.byteLength),
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=31536000, immutable',
          }
        });
      }
      return NextResponse.json({ success: false, error: 'No audio found' }, { status: 404 });
    }

    const filter: any = {};
    if(creator){
      filter.creatorAddress = creator.toLowerCase();
    }
    if(q){
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [ new RegExp(q, 'i') ] } },
      ];
    }

    const [items, total] = await Promise.all([
      AudioSubmission.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AudioSubmission.countDocuments(filter),
    ]);

    return NextResponse.json({ success: true, total, items });
  }catch(error){
    let errorMessage = 'An unknown error occurred';
    if(error instanceof Error){
      errorMessage = error.message;
    }
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}