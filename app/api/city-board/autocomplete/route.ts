import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const input = searchParams.get('input');

    if (!input) {
      return NextResponse.json({ options: [] });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ options: [] });
    }

    const res = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&components=country:us&key=${apiKey}`);
    const data = await res.json();

    if (data.predictions) {
      const options = data.predictions.map((p: any) => ({
        formatted_address: p.description
      }));
      return NextResponse.json({ options });
    }

    return NextResponse.json({ options: [] });
  } catch (err: any) {
    console.error('[City Board Autocomplete Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
