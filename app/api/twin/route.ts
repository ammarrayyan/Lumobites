import { NextResponse } from 'next/server';

const BREED_DATA: Record<string, { traits: string[]; quote: string; imageUrl: string }> = {
  // Dogs
  "golden retriever": {
    traits: ["😊 Warm and approachable", "🎉 Life of the party", "❤️ Loyal to the core"],
    quote: "Everyone's best friend — you light up every room you enter!",
    imageUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=600"
  },
  "labrador retriever": {
    traits: ["🤗 Incredibly friendly", "💪 Always energetic", "🎯 Determined and focused"],
    quote: "Enthusiastic, loving, and always ready for an adventure!",
    imageUrl: "https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&q=80&w=600"
  },
  "german shepherd": {
    traits: ["💪 Natural leader", "🧠 Incredibly smart", "🛡️ Protective of loved ones"],
    quote: "A natural protector — loyal, brave, and always alert!",
    imageUrl: "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&q=80&w=600"
  },
  "french bulldog": {
    traits: ["😄 Hilarious and fun", "🤗 Total people person", "😴 Expert napper"],
    quote: "Small in size but huge in personality — you make everyone laugh!",
    imageUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=600"
  },
  "poodle": {
    traits: ["✨ Elegantly charming", "🎨 Creative soul", "👑 Always put together"],
    quote: "Sophisticated and brilliant — you make everything look effortless!",
    imageUrl: "https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?auto=format&fit=crop&q=80&w=600"
  },
  "bulldog": {
    traits: ["😤 Stubborn but loveable", "🛋️ Expert relaxer", "❤️ Deeply loyal"],
    quote: "Tough on the outside, total softie on the inside!",
    imageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=600"
  },
  "beagle": {
    traits: ["🔍 Incredibly curious", "🎵 Very vocal", "🤝 Friendly with everyone"],
    quote: "Always following your nose to the next great adventure!",
    imageUrl: "https://images.unsplash.com/photo-1505628346881-b72b27e84530?auto=format&fit=crop&q=80&w=600"
  },
  "rottweiler": {
    traits: ["💪 Powerfully confident", "🧠 Highly intelligent", "🛡️ Fiercely loyal"],
    quote: "Commanding respect wherever you go — a true natural leader!",
    imageUrl: "https://images.unsplash.com/photo-1567752881298-894bb81f9379?auto=format&fit=crop&q=80&w=600"
  },
  "siberian husky": {
    traits: ["🌨️ Free spirited", "👀 Striking and memorable", "🗣️ Very expressive"],
    quote: "Wild at heart — you were born to explore and stand out!",
    imageUrl: "https://images.unsplash.com/photo-1531804055935-76f44d7c3621?auto=format&fit=crop&q=80&w=600"
  },
  "chihuahua": {
    traits: ["👑 Big personality in small package", "😤 Feisty and fearless", "❤️ Deeply devoted"],
    quote: "Don't let the size fool you — you have the heart of a lion!",
    imageUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600"
  },
  "pomeranian": {
    traits: ["⭐ Total star quality", "🎉 Always the center of attention", "😊 Infectiously happy"],
    quote: "Fluffy, fabulous, and absolutely impossible to ignore!",
    imageUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=600"
  },
  "dachshund": {
    traits: ["🎯 Incredibly determined", "😄 Great sense of humor", "🤗 Loving and devoted"],
    quote: "Long on personality and even longer on stubbornness — in the best way!",
    imageUrl: "https://images.unsplash.com/photo-1612536057832-2ff7ead58194?auto=format&fit=crop&q=80&w=600"
  },
  "border collie": {
    traits: ["🧠 Genius level smart", "⚡ Incredibly energetic", "🎯 Laser focused"],
    quote: "The overachiever of the group — you make everyone else look lazy!",
    imageUrl: "https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?auto=format&fit=crop&q=80&w=600"
  },
  "shih tzu": {
    traits: ["👑 Born royalty", "😌 Calm and collected", "🤗 Loves being pampered"],
    quote: "You carry yourself like royalty because you basically are!",
    imageUrl: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=600"
  },
  "corgi": {
    traits: ["😄 Perpetually cheerful", "🏃 Surprisingly athletic", "👑 Royal connections"],
    quote: "Cheerful, charming, and fit for royalty — just like the Queen's favorites!",
    imageUrl: "https://images.unsplash.com/photo-1583511655826-05700d52f4d9?auto=format&fit=crop&q=80&w=600"
  },
  "doberman": {
    traits: ["💎 Sleek and sophisticated", "⚡ Lightning fast thinker", "🛡️ Natural protector"],
    quote: "Elegant, powerful, and always ten steps ahead of everyone else!",
    imageUrl: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&q=80&w=600"
  },
  "dalmatian": {
    traits: ["🎨 Unique and distinctive", "⚡ High energy", "🎉 Always the life of the party"],
    quote: "One of a kind — there is literally nobody else like you!",
    imageUrl: "https://images.unsplash.com/photo-1502673530728-f79b4cbd313c?auto=format&fit=crop&q=80&w=600"
  },
  "australian shepherd": {
    traits: ["🌈 Uniquely stunning", "🧠 Brilliant problem solver", "⚡ Boundless energy"],
    quote: "Stunning, smart, and always herding everyone in the right direction!",
    imageUrl: "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?auto=format&fit=crop&q=80&w=600"
  },
  "samoyed": {
    traits: ["😊 Permanent smile", "☀️ Radiates positivity", "🤗 Warms everyone's heart"],
    quote: "Your smile is literally contagious — you make the world brighter!",
    imageUrl: "https://images.unsplash.com/photo-1529429617329-84d1e0c08006?auto=format&fit=crop&q=80&w=600"
  },
  "boxer": {
    traits: ["🥊 Playfully fierce", "😄 Hilarious and goofy", "❤️ Heart of gold"],
    quote: "Tough exterior, total goofball inside — you keep everyone entertained!",
    imageUrl: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&q=80&w=600"
  },
  "great dane": {
    traits: ["👑 Gentle giant", "😌 Surprisingly calm", "🤗 Loves cuddles despite the size"],
    quote: "Majestic and imposing but secretly just wants a cuddle!",
    imageUrl: "https://images.unsplash.com/photo-1585672841961-c1676f254e42?auto=format&fit=crop&q=80&w=600"
  },
  "maltese": {
    traits: ["👼 Angelic appearance", "💕 Incredibly affectionate", "✨ Always elegant"],
    quote: "Delicate, charming, and absolutely impossible not to love!",
    imageUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=600"
  },
  "weimaraner": {
    traits: ["🎨 Artistically inclined", "👁️ Soulful and deep", "🏃 Athletic and graceful"],
    quote: "Hauntingly beautiful and deeply soulful — an artist at heart!",
    imageUrl: "https://images.unsplash.com/photo-1525253086316-d0c936c814f8?auto=format&fit=crop&q=80&w=600"
  },
  "akita": {
    traits: ["🎌 Noble and dignified", "🛡️ Fiercely loyal", "😌 Quietly powerful"],
    quote: "You don't need to say much — your presence alone commands respect!",
    imageUrl: "https://images.unsplash.com/photo-1590419690008-9058856800cf?auto=format&fit=crop&q=80&w=600"
  },
  "chow chow": {
    traits: ["👑 Regal and proud", "😏 Selective with trust", "🦁 Lion hearted"],
    quote: "You don't need everyone's approval — only a chosen few earn yours!",
    imageUrl: "https://images.unsplash.com/photo-1596701062351-df5f8af0d385?auto=format&fit=crop&q=80&w=600"
  },
  "irish setter": {
    traits: ["🍀 Charming and warm", "🎉 Naturally magnetic", "❤️ Enthusiastically loving"],
    quote: "Effortlessly charming — people are just drawn to your warm energy!",
    imageUrl: "https://images.unsplash.com/photo-1615887023516-9b6bcd559e87?auto=format&fit=crop&q=80&w=600"
  },
  "cocker spaniel": {
    traits: ["🎵 Sensitive and artistic", "👁️ Big beautiful soul", "🤗 Gentle and loving"],
    quote: "Deep feeling, gentle soul — you experience life more beautifully than most!",
    imageUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=600"
  },
  "vizsla": {
    traits: ["🏃 Athletic and graceful", "❤️ Velcro personality", "☀️ Golden warm energy"],
    quote: "Active, affectionate, and absolutely glued to the people you love!",
    imageUrl: "https://images.unsplash.com/photo-1605568427561-40dd23c2ace9?auto=format&fit=crop&q=80&w=600"
  },
  "saint bernard": {
    traits: ["🏔️ Gentle mountain giant", "🤗 Naturally nurturing", "❤️ Biggest heart in the room"],
    quote: "You were born to take care of others — a natural hero!",
    imageUrl: "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&q=80&w=600"
  },

  // Cats
  "siamese": {
    traits: ["🗣️ Very vocal and expressive", "😏 Mysterious and smart", "👀 Always watching"],
    quote: "Elegant, opinionated, and absolutely impossible to ignore!",
    imageUrl: "https://images.unsplash.com/photo-1513360309081-36f5e878fc9e?auto=format&fit=crop&q=80&w=600"
  },
  "persian": {
    traits: ["😌 Calm and graceful", "👑 Royally elegant", "🛋️ Expert relaxer"],
    quote: "You move through life with effortless grace and quiet confidence!",
    imageUrl: "https://images.unsplash.com/photo-1614888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600"
  },
  "maine coon": {
    traits: ["🦁 Majestic and mighty", "🤗 Surprisingly gentle", "🧠 Dog-like loyalty"],
    quote: "The gentle giant — impressive on the outside, sweetheart on the inside!",
    imageUrl: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=600"
  },
  "bengal": {
    traits: ["🐆 Wild at heart", "⚡ Incredibly energetic", "👀 Intensely focused"],
    quote: "You have an untamed spirit that no one can contain!",
    imageUrl: "https://images.unsplash.com/photo-1574158622643-69d34d72650a?auto=format&fit=crop&q=80&w=600"
  },
  "ragdoll": {
    traits: ["😌 Goes with the flow", "🤗 Incredibly laid back", "💕 Melts in your arms"],
    quote: "The most chill person in any room — nothing phases you!",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600"
  },
  "british shorthair": {
    traits: ["🎩 Dignified and proper", "😌 Calm and collected", "🧠 Quietly observant"],
    quote: "You observe everything, say little, and always know exactly what's going on!",
    imageUrl: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=600"
  },
  "british longhair": {
    traits: ["👑 Quietly regal", "😌 Serene and peaceful", "🎨 Effortlessly beautiful"],
    quote: "Serene, beautiful, and quietly ruling everything around you!",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600"
  },
  "scottish fold": {
    traits: ["🦉 Wise beyond years", "😊 Quietly cheerful", "🤔 Deep thinker"],
    quote: "You see the world differently from everyone else — and you're usually right!",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600"
  },
  "sphynx": {
    traits: ["😎 Fearlessly unique", "🎭 Total drama queen", "❤️ Surprisingly warm"],
    quote: "You walk into a room and everyone stops — you were born to stand out!",
    imageUrl: "https://images.unsplash.com/photo-1526336028075-c35840971e97?auto=format&fit=crop&q=80&w=600"
  },
  "abyssinian": {
    traits: ["🏃 Always in motion", "🔍 Wildly curious", "⚡ Boundless energy"],
    quote: "You never stop moving, exploring, and discovering new things!",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600"
  },
  "russian blue": {
    traits: ["💎 Reserved and elegant", "🧠 Deeply intelligent", "😌 Quietly mysterious"],
    quote: "You don't reveal yourself to just anyone — you are selectively wonderful!",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600"
  },
  "norwegian forest cat": {
    traits: ["🌲 Nature lover", "💪 Quietly strong", "🤗 Warm and welcoming"],
    quote: "Strong, independent, and completely at home in any environment!",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600"
  },
  "birman": {
    traits: ["🙏 Gentle and sacred", "💕 Deeply loving", "😌 Peacefully serene"],
    quote: "You bring calm and peace to every situation — a true healer!",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600"
  },
  "burmese": {
    traits: ["🤗 People obsessed", "😄 Playfully mischievous", "❤️ Unconditionally loving"],
    quote: "You absolutely need people around you — and honestly they need you more!",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600"
  },
  "exotic shorthair": {
    traits: ["🧸 Living teddy bear", "😌 Ultra calm", "🤗 Loves being held"],
    quote: "Soft, squishy, and absolutely irresistible — a real life teddy bear!",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600"
  },
  "tonkinese": {
    traits: ["🎭 Social butterfly", "🎮 Playfully fun", "💬 Great conversationalist"],
    quote: "The social butterfly — you thrive when surrounded by energy and fun!",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600"
  },
  "devon rex": {
    traits: ["🧝 Elfin and magical", "😈 Mischievously playful", "⚡ Unpredictably fun"],
    quote: "Magical, mischievous, and absolutely one of a kind!",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600"
  },
  "turkish angora": {
    traits: ["💃 Gracefully athletic", "👑 Naturally aristocratic", "🎨 Artistic soul"],
    quote: "Grace and beauty come naturally to you — you make everything look like art!",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600"
  },
  "himalayan": {
    traits: ["😌 Perfectly serene", "👑 Quietly majestic", "🛋️ Comfort expert"],
    quote: "You have mastered the art of living beautifully and comfortably!",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600"
  },
  "chartreux": {
    traits: ["🤫 Strong silent type", "🧠 Deeply wise", "😊 Quietly joyful"],
    quote: "You don't need to say much — your wisdom speaks for itself!",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600"
  },
  "bombay": {
    traits: ["🐆 Mini panther energy", "😎 Effortlessly cool", "🌙 Mysterious and magnetic"],
    quote: "Dark, mysterious, and magnetically attractive — a true night creature!",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600"
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

    // Retrieve custom pre-defined traits/quotes/images to match requirements exactly
    const breedKey = result.breed.toLowerCase();
    const matchedData = BREED_DATA[breedKey] || {
      traits: result.traits || ["✨ Unique", "😊 Fun", "❤️ Friendly"],
      quote: result.quote || "A perfect match for your one-of-a-kind personality!",
      imageUrl: result.petType === 'cat' ? 
        `https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600` :
        `https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600`
    };

    // Use our beautiful, hand-curated fallback as the default primary image
    let unsplashImageUrl = matchedData.imageUrl;

    // Use live Unsplash API ONLY if access key is present and we want to refresh
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
