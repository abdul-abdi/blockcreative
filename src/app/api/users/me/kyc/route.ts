//Configure the backend for the KYCimport { NextRequest } from 'next/server';
import { NextRequest } from "next/server";
export async function GET(request: NextRequest) {
    // your code here
    return new Response('OK');
}