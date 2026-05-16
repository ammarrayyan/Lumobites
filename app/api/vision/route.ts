import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File | null;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_VISION_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey.startsWith('eyJ')) {
      return NextResponse.json({ error: 'Google Vision API key not configured properly.' }, { status: 500 });
    }

    // Convert file to base64
    const buffer = Buffer.from(await image.arrayBuffer());
    const base64Image = buffer.toString('base64');

    // Call Google Cloud Vision API
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 20 },
              { type: 'WEB_DETECTION', maxResults: 20 },
              { type: 'OBJECT_LOCALIZATION' }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Google Vision API Error:', data);
      return NextResponse.json({ error: data.error?.message || 'Failed to analyze image' }, { status: response.status });
    }

    const res = data.responses[0];
    if (!res) {
      return NextResponse.json({ error: 'Unexpected response from Google Vision API' }, { status: 500 });
    }

    const labels = res.labelAnnotations || [];
    const webEntities = res.webDetection?.webEntities || [];
    const bestGuessLabels = res.webDetection?.bestGuessLabels || [];
    const objects = res.localizedObjectAnnotations || [];

    // Combine all descriptions for pet type detection
    const allText = [
      ...labels.map((l: any) => l.description?.toLowerCase()),
      ...webEntities.map((e: any) => e.description?.toLowerCase()),
      ...bestGuessLabels.map((b: any) => b.label?.toLowerCase()),
      ...objects.map((o: any) => o.name?.toLowerCase())
    ].filter(Boolean);

    let petType = 'none';

    // Detect Pet Type First
    if (allText.some(t => t.includes('cat') || t.includes('feline') || t.includes('kitten'))) {
      petType = 'cat';
    } else if (allText.some(t => t.includes('dog') || t.includes('canine') || t.includes('puppy'))) {
      petType = 'dog';
    }

    if (petType === 'none') {
      return NextResponse.json({
        success: true,
        breed: 'Unknown Breed',
        petType: 'none',
        confidence: 'Low'
      });
    }

    // Common non-breed generic labels to ignore
    const ignoreWords = [
      'animal', 'mammal', 'vertebrate', 'fur', 'snout', 'whiskers', 'nose', 'eye', 
      'dog', 'cat', 'pet', 'puppy', 'kitten', 'carnivore', 'companion dog', 
      'sporting group', 'working group', 'toy dog', 'canidae', 'felidae', 'tail', 'paw', 
      'grass', 'photography', 'dog breed', 'fawn', 'non-sporting group'
    ];

    const isGeneric = (str: string) => {
      const lower = str.toLowerCase();
      if (ignoreWords.includes(lower)) return true;
      return false;
    };

    let breed = '';
    let confidence = 'Low';

    // 1. webDetection.webEntities (Highest priority, most accurate for specific breeds)
    for (const entity of webEntities) {
      if (entity.description) {
        const desc = entity.description.toLowerCase();
        if (!isGeneric(desc) && desc.length > 3) {
          breed = entity.description;
          if (entity.score > 0.8) {
            confidence = 'High';
          } else if (entity.score >= 0.5) {
            confidence = 'Medium';
          } else {
            confidence = 'Low';
          }
          break;
        }
      }
    }

    // 2. webDetection.bestGuessLabels
    if (!breed) {
      for (const guess of bestGuessLabels) {
        if (guess.label) {
          const desc = guess.label.toLowerCase();
          if (!isGeneric(desc) && desc.length > 3) {
            breed = guess.label;
            confidence = 'Medium';
            break;
          }
        }
      }
    }

    // 3. labelAnnotations (Fallback)
    if (!breed) {
      for (const label of labels) {
        if (label.description) {
          const desc = label.description.toLowerCase();
          if (!isGeneric(desc) && desc.length > 3) {
            breed = label.description;
            confidence = 'Low';
            break;
          }
        }
      }
    }

    if (!breed) {
      breed = 'Mixed breed';
      confidence = 'Low';
    }

    // Capitalize breed (e.g. "golden retriever" -> "Golden Retriever")
    breed = breed.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return NextResponse.json({
      success: true,
      breed,
      petType,
      confidence,
      breedDescription: '' // Google Cloud Vision doesn't provide dynamic facts
    });

  } catch (error: any) {
    console.error('Vision API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process image' }, { status: 500 });
  }
}
