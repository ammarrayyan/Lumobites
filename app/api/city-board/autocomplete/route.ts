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

    // Removed &components=country:US to support global search
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(input)}&key=${apiKey}`);
    const data = await res.json();

    if (data.results) {
      // 1. Only accept real cities
      // 3. Validate it is actually a city (locality or administrative_area_level_2)
      const validResults = data.results.filter((r: any) => {
        return r.types.includes('locality') || 
               r.types.includes('administrative_area_level_2') ||
               r.types.includes('sublocality') ||
               r.types.includes('administrative_area_level_3');
      });

      const options = validResults.map((r: any) => {
        let city = '';
        let state = '';
        let country = '';
        
        for (const comp of (r.address_components || [])) {
          if (comp.types.includes('locality')) {
            city = comp.long_name;
          } else if (!city && comp.types.includes('administrative_area_level_2')) {
            city = comp.long_name;
          } else if (!city && comp.types.includes('sublocality')) {
            city = comp.long_name;
          } else if (!city && comp.types.includes('administrative_area_level_3')) {
            city = comp.long_name;
          }
          
          if (comp.types.includes('administrative_area_level_1')) {
            state = comp.short_name;
          }
          
          if (comp.types.includes('country')) {
            if (comp.short_name === 'US') country = 'USA';
            else if (comp.short_name === 'GB') country = 'UK';
            else if (comp.short_name === 'AE') country = 'UAE';
            else country = comp.long_name;
          }
        }
        
        // 2. Consistent format for all cities
        const parts = [];
        if (city) parts.push(city);
        if (state) parts.push(state);
        if (country) parts.push(country);
        
        const clean_city = parts.join(', ');
        
        return { 
          formatted_address: clean_city, // Never show zip codes
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
