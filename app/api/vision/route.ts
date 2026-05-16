import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File | null;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Vision API key not configured' }, { status: 500 });
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
              { type: 'LABEL_DETECTION', maxResults: 15 },
              { type: 'WEB_DETECTION', maxResults: 15 }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Google Vision API Error:', data);
      return NextResponse.json({ error: 'Failed to analyze image' }, { status: response.status });
    }

    const labels = data.responses[0]?.labelAnnotations || [];
    const webEntities = data.responses[0]?.webDetection?.webEntities || [];

    // Combine descriptions for easier searching
    const allLabels: string[] = [
      ...labels.map((l: any) => l.description?.toLowerCase()),
      ...webEntities.map((e: any) => e.description?.toLowerCase())
    ].filter(Boolean);

    let petType = '';
    let breed = '';

    // Detect Pet Type
    if (allLabels.some(l => l.includes('cat') || l.includes('feline') || l.includes('kitten'))) {
      petType = 'cat';
    } else if (allLabels.some(l => l.includes('dog') || l.includes('canine') || l.includes('puppy'))) {
      petType = 'dog';
    }

    // Common non-breed labels to ignore
    const ignoreLabels = [
      'dog', 'cat', 'puppy', 'kitten', 'snout', 'whiskers', 'carnivore', 'companion dog', 
      'sporting group', 'working group', 'toy dog', 'pet', 'animal', 'fawn', 'fur', 'paw', 
      'tail', 'canidae', 'felidae', 'mammal', 'vertebrate', 'terrier', 'dog breed'
    ];

    // Try to find a breed by looking for specific breed keywords
    for (const label of allLabels) {
      if (
        (label.includes('retriever') || 
         label.includes('shepherd') || 
         label.includes('terrier') || 
         label.includes('spaniel') || 
         label.includes('hound') ||
         label.includes('shorthair') ||
         label.includes('longhair') ||
         label.includes('bulldog') ||
         label.includes('poodle') ||
         label.includes('collie') ||
         label.includes('corgi') ||
         label.includes('husky') ||
         label.includes('siamese') ||
         label.includes('persian') ||
         label.includes('bengal') ||
         label.includes('ragdoll') ||
         label.includes('maine coon') ||
         label.includes('shiba') ||
         label.includes('dachshund') ||
         label.includes('pug') ||
         label.includes('chihuahua') ||
         label.includes('boxer') ||
         label.includes('mastiff') ||
         label.includes('beagle') ||
         label.includes('mix') ||
         label.includes('breed')) && 
         !ignoreLabels.includes(label)
      ) {
        breed = label;
        break;
      }
    }

    // If no breed found by keyword, just take the most specific animal label that isn't generic
    if (!breed) {
      for (const label of allLabels) {
        if (!ignoreLabels.includes(label) && label.split(' ').length <= 3 && label.length > 3) {
          // Additional check to avoid weird labels
          if (!label.includes('photography') && !label.includes('grass')) {
            breed = label;
            break;
          }
        }
      }
    }

    if (!breed) {
      breed = 'Mixed breed';
    }

    // Capitalize breed (e.g. "golden retriever" -> "Golden Retriever")
    breed = breed.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return NextResponse.json({
      success: true,
      breed,
      petType: petType || 'dog', // fallback to dog if completely uncertain
    });

  } catch (error) {
    console.error('Vision API Error:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
