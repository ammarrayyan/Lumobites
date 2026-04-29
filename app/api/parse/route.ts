import { NextResponse } from 'next/server';
import { parsePetInfo } from '@/lib/parser';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    
    const parsed = parsePetInfo(text);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json({ error: 'Failed to parse text' }, { status: 500 });
  }
}
