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

    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input)}&components=country:US&key=${apiKey}`);
    const data = await res.json();

    if (data.results) {
      const options = data.results.map((r: any) => {
        let city = '';
        let state = '';
        
        for (const comp of (r.address_components || [])) {
          if (comp.types.includes('locality')) {
            city = comp.long_name;
          } else if (!city && comp.types.includes('sublocality')) {
            city = comp.long_name;
          } else if (!city && comp.types.includes('neighborhood')) {
            city = comp.long_name;
          }
          if (comp.types.includes('administrative_area_level_1')) {
            state = comp.short_name;
          }
        }
        
        let formatted = r.formatted_address;
        if (city && state) {
          formatted = `${city}, ${state}`;
        }
        
        return { formatted_address: formatted };
      });

      // Remove duplicates just in case
      const uniqueOptions = Array.from(new Set(options.map((o: any) => o.formatted_address)))
        .map(address => ({ formatted_address: address }));
      return NextResponse.json({ options: uniqueOptions });
    }

    return NextResponse.json({ options: [] });
  } catch (err: any) {
    console.error('[City Board Autocomplete Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
