import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image');

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Simulate API delay for realism
    await new Promise(resolve => setTimeout(resolve, 1500));

    // MOCK RESPONSE
    return NextResponse.json({
      success: true,
      breed: 'Golden Retriever',
      confidence: 0.98,
      petType: 'dog' // usually Cloud Vision gives labels like "Dog", "Golden Retriever"
    });
  } catch (error) {
    console.error('Vision API Error:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
