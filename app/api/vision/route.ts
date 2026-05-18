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

    const topCatBreeds = ['persian', 'maine coon', 'siamese', 'ragdoll', 'bengal', 'british shorthair', 'british longhair', 'abyssinian', 'sphynx', 'scottish fold', 'american shorthair', 'burmese', 'russian blue', 'norwegian forest cat', 'birman'];
    const topDogBreeds = ['labrador retriever', 'golden retriever', 'french bulldog', 'german shepherd', 'bulldog', 'poodle', 'beagle', 'rottweiler', 'yorkshire terrier', 'dachshund', 'siberian husky', 'doberman', 'shih tzu', 'chihuahua', 'border collie'];

    const similarBreedsMap: Record<string, string[]> = {
      'munchkin': ['persian', 'british shorthair'],
      'exotic shorthair': ['persian', 'british shorthair'],
      'himalayan': ['persian', 'siamese'],
      'alaskan malamute': ['siberian husky'],
      'belgian malinois': ['german shepherd'],
      'pit bull': ['bulldog', 'staffordshire terrier']
    };

    let detectedBreeds: { name: string; score: number; source: string }[] = [];

    const addBreed = (name: string | undefined, score: number, source: string) => {
      if (!name) return;
      const lower = name.toLowerCase();
      if (!isGeneric(lower) && lower.length > 3) {
        if (!detectedBreeds.find(b => b.name.toLowerCase() === lower)) {
          detectedBreeds.push({ name, score, source });
        }
      }
    };

    webEntities.forEach((e: any) => addBreed(e.description, e.score || 0.5, 'webEntity'));
    bestGuessLabels.forEach((b: any) => addBreed(b.label, 0.4, 'bestGuess'));
    labels.forEach((l: any) => addBreed(l.description, l.score || 0.3, 'label'));

    const priorityList = petType === 'cat' ? topCatBreeds : topDogBreeds;

    // Evaluate similarities
    const boostedBreeds: typeof detectedBreeds = [];
    detectedBreeds.forEach(b => {
      const lower = b.name.toLowerCase();
      if (similarBreedsMap[lower]) {
        similarBreedsMap[lower].forEach(sim => {
          if (priorityList.includes(sim) && !detectedBreeds.find(db => db.name.toLowerCase() === sim)) {
            boostedBreeds.push({ name: sim, score: b.score * 0.9, source: 'similarity' });
          }
        });
      }
    });
    detectedBreeds = [...detectedBreeds, ...boostedBreeds];

    // Sort
    detectedBreeds.sort((a, b) => {
      const aLower = a.name.toLowerCase();
      const bLower = b.name.toLowerCase();
      const aIsPriority = priorityList.includes(aLower);
      const bIsPriority = priorityList.includes(bLower);

      if (aIsPriority && !bIsPriority) return -1;
      if (!aIsPriority && bIsPriority) return 1;
      return b.score - a.score;
    });

    let breed = '';
    let breed2 = '';
    let confidence = 'Low';

    if (detectedBreeds.length > 0) {
      const top = detectedBreeds[0];
      breed = top.name.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      
      if (top.score > 0.8) confidence = 'High';
      else if (top.score >= 0.5) confidence = 'Medium';
      else confidence = 'Low';

      if (detectedBreeds.length > 1) {
        const runnerUp = detectedBreeds[1];
        const topLower = top.name.toLowerCase();
        const runnerUpLower = runnerUp.name.toLowerCase();
        const bothPriority = priorityList.includes(topLower) && priorityList.includes(runnerUpLower);
        const similarScore = (top.score - runnerUp.score) < 0.2;
        const areVerySimilar = (topLower === 'british longhair' && runnerUpLower === 'persian') || 
                               (topLower === 'persian' && runnerUpLower === 'british longhair');

        if (bothPriority || similarScore || areVerySimilar) {
          breed2 = runnerUp.name.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
      }
    }

    if (!breed) {
      breed = 'Mixed breed';
      confidence = 'Low';
    }

    return NextResponse.json({
      success: true,
      breed,
      breed2: breed2 || undefined,
      petType,
      confidence,
      breedDescription: ''
    });

  } catch (error: any) {
    console.error('Vision API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process image' }, { status: 500 });
  }
}
