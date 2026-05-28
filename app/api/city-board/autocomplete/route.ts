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
      // We want to return the full address for the dropdown, but also a clean city name for the DB
      const options = data.results.map((r: any) => {
        let city = '';
        let state = '';
        
        for (const comp of (r.address_components || [])) {
          if (comp.types.includes('locality')) {
            city = comp.long_name;
          } else if (!city && comp.types.includes('sublocality')) {
            city = comp.long_name;
          } else if (!city && comp.types.includes('administrative_area_level_3')) {
            city = comp.long_name;
          }
          if (comp.types.includes('administrative_area_level_1')) {
            state = comp.short_name;
          }
        }
        
        const clean_city = (city && state) ? `${city}, ${state}` : (city || r.formatted_address);
        
        return { 
          formatted_address: r.formatted_address,
          clean_city: clean_city
        };
      });

      // Filter out invalid ones, and remove duplicates by formatted_address
      const validOptions = options.filter(o => o.formatted_address && o.clean_city);
      const uniqueOptionsMap = new Map();
      validOptions.forEach((o: any) => {
        if (!uniqueOptionsMap.has(o.formatted_address)) {
          uniqueOptionsMap.set(o.formatted_address, o);
        }
      });
        
      return NextResponse.json({ options: Array.from(uniqueOptionsMap.values()) });
    }

    return NextResponse.json({ options: [] });
  } catch (err: any) {
    console.error('[City Board Autocomplete Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
