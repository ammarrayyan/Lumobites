import { NextResponse } from 'next/server';

const BREED_DATA: Record<string, { traits: string[]; quote: string }> = {
  // Dogs
  "golden retriever": {
    traits: ["😊 Warm and approachable", "🎉 Life of the party", "❤️ Loyal to the core"],
    quote: "Everyone's best friend — you light up every room you enter!"
  },
  "labrador retriever": {
    traits: ["🤗 Incredibly friendly", "💪 Always energetic", "🎯 Determined and focused"],
    quote: "Enthusiastic, loving, and always ready for an adventure!"
  },
  "german shepherd": {
    traits: ["💪 Natural leader", "🧠 Incredibly smart", "🛡️ Protective of loved ones"],
    quote: "A natural protector — loyal, brave, and always alert!"
  },
  "french bulldog": {
    traits: ["😄 Hilarious and fun", "🤗 Total people person", "😴 Expert napper"],
    quote: "Small in size but huge in personality — you make everyone laugh!"
  },
  "poodle": {
    traits: ["✨ Elegantly charming", "🎨 Creative soul", "👑 Always put together"],
    quote: "Sophisticated and brilliant — you make everything look effortless!"
  },
  "bulldog": {
    traits: ["😤 Stubborn but loveable", "🛋️ Expert relaxer", "❤️ Deeply loyal"],
    quote: "Tough on the outside, total softie on the inside!"
  },
  "beagle": {
    traits: ["🔍 Incredibly curious", "🎵 Very vocal", "🤝 Friendly with everyone"],
    quote: "Always following your nose to the next great adventure!"
  },
  "rottweiler": {
    traits: ["💪 Powerfully confident", "🧠 Highly intelligent", "🛡️ Fiercely loyal"],
    quote: "Commanding respect wherever you go — a true natural leader!"
  },
  "siberian husky": {
    traits: ["🌨️ Free spirited", "👀 Striking and memorable", "🗣️ Very expressive"],
    quote: "Wild at heart — you were born to explore and stand out!"
  },
  "chihuahua": {
    traits: ["👑 Big personality in small package", "😤 Feisty and fearless", "❤️ Deeply devoted"],
    quote: "Don't let the size fool you — you have the heart of a lion!"
  },
  "pomeranian": {
    traits: ["⭐ Total star quality", "🎉 Always the center of attention", "😊 Infectiously happy"],
    quote: "Fluffy, fabulous, and absolutely impossible to ignore!"
  },
  "dachshund": {
    traits: ["🎯 Incredibly determined", "😄 Great sense of humor", "🤗 Loving and devoted"],
    quote: "Long on personality and even longer on stubbornness — in the best way!"
  },
  "border collie": {
    traits: ["🧠 Genius level smart", "⚡ Incredibly energetic", "🎯 Laser focused"],
    quote: "The overachiever of the group — you make everyone else look lazy!"
  },
  "shih tzu": {
    traits: ["👑 Born royalty", "😌 Calm and collected", "🤗 Loves being pampered"],
    quote: "You carry yourself like royalty because you basically are!"
  },
  "corgi": {
    traits: ["😄 Perpetually cheerful", "🏃 Surprisingly athletic", "👑 Royal connections"],
    quote: "Cheerful, charming, and fit for royalty — just like the Queen's favorites!"
  },
  "doberman": {
    traits: ["💎 Sleek and sophisticated", "⚡ Lightning fast thinker", "🛡️ Natural protector"],
    quote: "Elegant, powerful, and always ten steps ahead of everyone else!"
  },
  "dalmatian": {
    traits: ["🎨 Unique and distinctive", "⚡ High energy", "🎉 Always the life of the party"],
    quote: "One of a kind — there is literally nobody else like you!"
  },
  "australian shepherd": {
    traits: ["🌈 Uniquely stunning", "🧠 Brilliant problem solver", "⚡ Boundless energy"],
    quote: "Stunning, smart, and always herding everyone in the right direction!"
  },
  "samoyed": {
    traits: ["😊 Permanent smile", "☀️ Radiates positivity", "🤗 Warms everyone's heart"],
    quote: "Your smile is literally contagious — you make the world brighter!"
  },
  "boxer": {
    traits: ["🥊 Playfully fierce", "😄 Hilarious and goofy", "❤️ Heart of gold"],
    quote: "Tough exterior, total goofball inside — you keep everyone entertained!"
  },
  "great dane": {
    traits: ["👑 Gentle giant", "😌 Surprisingly calm", "🤗 Loves cuddles despite the size"],
    quote: "Majestic and imposing but secretly just wants a cuddle!"
  },
  "maltese": {
    traits: ["👼 Angelic appearance", "💕 Incredibly affectionate", "✨ Always elegant"],
    quote: "Delicate, charming, and absolutely impossible not to love!"
  },
  "weimaraner": {
    traits: ["🎨 Artistically inclined", "👁️ Soulful and deep", "🏃 Athletic and graceful"],
    quote: "Hauntingly beautiful and deeply soulful — an artist at heart!"
  },
  "akita": {
    traits: ["🎌 Noble and dignified", "🛡️ Fiercely loyal", "😌 Quietly powerful"],
    quote: "You don't need to say much — your presence alone commands respect!"
  },
  "chow chow": {
    traits: ["👑 Regal and proud", "😏 Selective with trust", "🦁 Lion hearted"],
    quote: "You don't need everyone's approval — only a chosen few earn yours!"
  },
  "irish setter": {
    traits: ["🍀 Charming and warm", "🎉 Naturally magnetic", "❤️ Enthusiastically loving"],
    quote: "Effortlessly charming — people are just drawn to your warm energy!"
  },
  "cocker spaniel": {
    traits: ["🎵 Sensitive and artistic", "👁️ Big beautiful soul", "🤗 Gentle and loving"],
    quote: "Deep feeling, gentle soul — you experience life more beautifully than most!"
  },
  "vizsla": {
    traits: ["🏃 Athletic and graceful", "❤️ Velcro personality", "☀️ Golden warm energy"],
    quote: "Active, affectionate, and absolutely glued to the people you love!"
  },
  "saint bernard": {
    traits: ["🏔️ Gentle mountain giant", "🤗 Naturally nurturing", "❤️ Biggest heart in the room"],
    quote: "You were born to take care of others — a natural hero!"
  },

  // Cats
  "siamese": {
    traits: ["🗣️ Very vocal and expressive", "😏 Mysterious and smart", "👀 Always watching"],
    quote: "Elegant, opinionated, and absolutely impossible to ignore!"
  },
  "persian": {
    traits: ["😌 Calm and graceful", "👑 Royally elegant", "🛋️ Expert relaxer"],
    quote: "You move through life with effortless grace and quiet confidence!"
  },
  "maine coon": {
    traits: ["🦁 Majestic and mighty", "🤗 Surprisingly gentle", "🧠 Dog-like loyalty"],
    quote: "The gentle giant — impressive on the outside, sweetheart on the inside!"
  },
  "bengal": {
    traits: ["🐆 Wild at heart", "⚡ Incredibly energetic", "👀 Intensely focused"],
    quote: "You have an untamed spirit that no one can contain!"
  },
  "ragdoll": {
    traits: ["😌 Goes with the flow", "🤗 Incredibly laid back", "💕 Melts in your arms"],
    quote: "The most chill person in any room — nothing phases you!"
  },
  "british shorthair": {
    traits: ["🎩 Dignified and proper", "😌 Calm and collected", "🧠 Quietly observant"],
    quote: "You observe everything, say little, and always know exactly what's going on!"
  },
  "british longhair": {
    traits: ["👑 Quietly regal", "😌 Serene and peaceful", "🎨 Effortlessly beautiful"],
    quote: "Serene, beautiful, and quietly ruling everything around you!"
  },
  "scottish fold": {
    traits: ["🦉 Wise beyond years", "😊 Quietly cheerful", "🤔 Deep thinker"],
    quote: "You see the world differently from everyone else — and you're usually right!"
  },
  "sphynx": {
    traits: ["😎 Fearlessly unique", "🎭 Total drama queen", "❤️ Surprisingly warm"],
    quote: "You walk into a room and everyone stops — you were born to stand out!"
  },
  "abyssinian": {
    traits: ["🏃 Always in motion", "🔍 Wildly curious", "⚡ Boundless energy"],
    quote: "You never stop moving, exploring, and discovering new things!"
  },
  "russian blue": {
    traits: ["💎 Reserved and elegant", "🧠 Deeply intelligent", "😌 Quietly mysterious"],
    quote: "You don't reveal yourself to just anyone — you are selectively wonderful!"
  },
  "norwegian forest cat": {
    traits: ["🌲 Nature lover", "💪 Quietly strong", "🤗 Warm and welcoming"],
    quote: "Strong, independent, and completely at home in any environment!"
  },
  "birman": {
    traits: ["🙏 Gentle and sacred", "💕 Deeply loving", "😌 Peacefully serene"],
    quote: "You bring calm and peace to every situation — a true healer!"
  },
  "burmese": {
    traits: ["🤗 People obsessed", "😄 Playfully mischievous", "❤️ Unconditionally loving"],
    quote: "You absolutely need people around you — and honestly they need you more!"
  },
  "exotic shorthair": {
    traits: ["🧸 Living teddy bear", "😌 Ultra calm", "🤗 Loves being held"],
    quote: "Soft, squishy, and absolutely irresistible — a real life teddy bear!"
  },
  "tonkinese": {
    traits: ["🎭 Social butterfly", "🎮 Playfully fun", "💬 Great conversationalist"],
    quote: "The social butterfly — you thrive when surrounded by energy and fun!"
  },
  "devon rex": {
    traits: ["🧝 Elfin and magical", "😈 Mischievously playful", "⚡ Unpredictably fun"],
    quote: "Magical, mischievous, and absolutely one of a kind!"
  },
  "turkish angora": {
    traits: ["💃 Gracefully athletic", "👑 Naturally aristocratic", "🎨 Artistic soul"],
    quote: "Grace and beauty come naturally to you — you make everything look like art!"
  },
  "himalayan": {
    traits: ["😌 Perfectly serene", "👑 Quietly majestic", "🛋️ Comfort expert"],
    quote: "You have mastered the art of living beautifully and comfortably!"
  },
  "chartreux": {
    traits: ["🤫 Strong silent type", "🧠 Deeply wise", "😊 Quietly joyful"],
    quote: "You don't need to say much — your wisdom speaks for itself!"
  },
  "bombay": {
    traits: ["🐆 Mini panther energy", "😎 Effortlessly cool", "🌙 Mysterious and magnetic"],
    quote: "Dark, mysterious, and magnetically attractive — a true night creature!"
  }
};

const DOG_BREEDS = Object.keys(BREED_DATA).slice(0, 29).map(b => b.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
const CAT_BREEDS = Object.keys(BREED_DATA).slice(29).map(b => b.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
const ALL_BREEDS = [...DOG_BREEDS, ...CAT_BREEDS];

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File | null;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key not configured properly.' }, { status: 500 });
    }

    // Convert file to base64
    const buffer = Buffer.from(await image.arrayBuffer());
    const base64Image = buffer.toString('base64');
    const mediaType = image.type || 'image/jpeg';

    // Call Anthropic Messages API directly for Selfie to Pet matching
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Image
                }
              },
              {
                type: 'text',
                text: `Look at this person's photo. Which dog or cat breed do they most resemble in terms of facial features, expression, and energy? Consider face shape, eye size, expression, and overall vibe. Pick ONE breed from this list: [${ALL_BREEDS.join(', ')}]. Respond in JSON only: {petType: "cat" or "dog", breed: string, matchScore: number between 85 and 99, traits: array of 3 fun traits, quote: one fun sentence, reason: one sentence explaining the visual match}`
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Claude API Error:', data);
      return NextResponse.json({ error: data.error?.message || 'Failed to analyze image' }, { status: response.status });
    }

    const textContent = data.content?.find((c: any) => c.type === 'text')?.text || '';
    
    // Parse the JSON safely
    const cleanText = textContent.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleanText);

    // Retrieve custom pre-defined traits/quotes to match requirements exactly
    const breedKey = result.breed.toLowerCase();
    const matchedData = BREED_DATA[breedKey] || {
      traits: result.traits || ["✨ Unique", "😊 Fun", "❤️ Friendly"],
      quote: result.quote || "A perfect match for your one-of-a-kind personality!"
    };

    // Use Unsplash API if key is present
    let unsplashImageUrl = `https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400`; // Fallback Corgi
    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
    
    if (unsplashAccessKey) {
      try {
        const query = `${result.breed} ${result.petType} portrait`;
        const unsplashRes = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${unsplashAccessKey}&per_page=1`
        );
        if (unsplashRes.ok) {
          const unsplashData = await unsplashRes.json();
          if (unsplashData.results && unsplashData.results.length > 0) {
            unsplashImageUrl = unsplashData.results[0].urls.regular;
          }
        }
      } catch (err) {
        console.error('Unsplash API Error:', err);
      }
    } else {
      // Free Fallback Portrait APIs if no key
      if (result.petType === 'cat') {
        unsplashImageUrl = `https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400`;
      } else {
        unsplashImageUrl = `https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400`;
      }
    }

    return NextResponse.json({
      success: true,
      breed: result.breed,
      petType: result.petType,
      matchScore: result.matchScore || Math.floor(Math.random() * 15) + 85,
      traits: matchedData.traits,
      quote: matchedData.quote,
      reason: result.reason || '',
      unsplashImageUrl
    });

  } catch (error: any) {
    console.error('Twin API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process image' }, { status: 500 });
  }
}
