import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import AudioSubmission from "@/models/AudioSubmission";

export async function POST(req: NextRequest){
    try {
        
        await connectToDatabase();
        const data = await req.json();
        const result = await AudioSubmission.create({
            ...data,
            createdAt: new Date(),
        })

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