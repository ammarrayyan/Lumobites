import { NextResponse } from 'next/server';

const BREED_DATA: Record<string, { traits: string[]; quote: string; imageUrl: string }> = {
  // Dogs
  "golden retriever": {
    traits: ["😊 Warm and approachable", "🎉 Life of the party", "❤️ Loyal to the core"],
    quote: "Everyone's best friend — you light up every room you enter!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/bd/Golden_Retriever_Dukedestiny01_drvd.jpg"
  },
  "labrador retriever": {
    traits: ["🤗 Incredibly friendly", "💪 Always energetic", "🎯 Determined and focused"],
    quote: "Enthusiastic, loving, and always ready for an adventure!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/26/YellowLabradorLooking_new.jpg"
  },
  "german shepherd": {
    traits: ["💪 Natural leader", "🧠 Incredibly smart", "🛡️ Protective of loved ones"],
    quote: "A natural protector — loyal, brave, and always alert!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d0/German_Shepherd_-_DSC_0346_%2810096362833%29.jpg"
  },
  "french bulldog": {
    traits: ["😄 Hilarious and fun", "🤗 Total people person", "😴 Expert napper"],
    quote: "Small in size but huge in personality — you make everyone laugh!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3b/French_bulldog2.jpg"
  },
  "poodle": {
    traits: ["✨ Elegantly charming", "🎨 Creative soul", "👑 Always put together"],
    quote: "Sophisticated and brilliant — you make everything look effortless!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f8/Full_attention_%288067543690%29.jpg"
  },
  "bulldog": {
    traits: ["😤 Stubborn but loveable", "🛋️ Expert relaxer", "❤️ Deeply loyal"],
    quote: "Tough on the outside, total softie on the inside!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/bf/Bulldog_inglese.jpg"
  },
  "beagle": {
    traits: ["🔍 Incredibly curious", "🎵 Very vocal", "🤝 Friendly with everyone"],
    quote: "Always following your nose to the next great adventure!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6b/000_Beagle_Molly.jpg"
  },
  "rottweiler": {
    traits: ["💪 Powerfully confident", "🧠 Highly intelligent", "🛡️ Fiercely loyal"],
    quote: "Commanding respect wherever you go — a true natural leader!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/26/Rottweiler_standing_facing_left.jpg"
  },
  "siberian husky": {
    traits: ["🌨️ Free spirit", "👀 Striking and memorable", "🗣️ Very expressive"],
    quote: "Wild at heart — you were born to explore and stand out!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a3/Black-Magic-Big-Boy.jpg"
  },
  "chihuahua": {
    traits: ["👑 Big personality in small package", "😤 Feisty and fearless", "❤️ Deeply devoted"],
    quote: "Don't let the size fool you — you have the heart of a lion!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Chihuahua1_bvdb.jpg"
  },
  "pomeranian": {
    traits: ["⭐ Total star quality", "🎉 Always the center of attention", "😊 Infectiously happy"],
    quote: "Fluffy, fabulous, and absolutely impossible to ignore!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Pomeranian_orange_Darius.jpg"
  },
  "dachshund": {
    traits: ["🎯 Incredibly determined", "😄 Great sense of humor", "🤗 Loving and devoted"],
    quote: "Long on personality and even longer on stubbornness — in the best way!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Dackel_3.jpg"
  },
  "border collie": {
    traits: ["🧠 Genius level smart", "⚡ Incredibly energetic", "🎯 Laser focused"],
    quote: "The overachiever of the group — you make everyone else look lazy!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1a/24701-nature-natural-beauty-border-collie.jpg"
  },
  "shih tzu": {
    traits: ["👑 Born royalty", "😌 Calm and collected", "🤗 Loves being pampered"],
    quote: "You carry yourself like royalty because you basically are!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Shih-Tzu.jpg"
  },
  "corgi": {
    traits: ["😄 Perpetually cheerful", "🏃 Surprisingly athletic", "👑 Royal connections"],
    quote: "Cheerful, charming, and fit for royalty — just like the Queen's favorites!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9e/Welsh_Corgi_Pembroke_Portrait.jpg"
  },
  "doberman": {
    traits: ["💎 Sleek and sophisticated", "⚡ Lightning fast thinker", "🛡️ Natural protector"],
    quote: "Elegant, powerful, and always ten steps ahead of everyone else!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Dobermann_handling.jpg"
  },
  "dalmatian": {
    traits: ["🎨 Unique and distinctive", "⚡ High energy", "🎉 Always the life of the party"],
    quote: "One of a kind — there is literally nobody else like you!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/90/Flecky3.jpg"
  },
  "australian shepherd": {
    traits: ["🌈 Uniquely stunning", "🧠 Brilliant problem solver", "⚡ Boundless energy"],
    quote: "Stunning, smart, and always herding everyone in the right direction!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Australian_Shepherd_600.jpg"
  },
  "samoyed": {
    traits: ["😊 Permanent smile", "☀️ Radiates positivity", "🤗 Warms everyone's heart"],
    quote: "Your smile is literally contagious — you make the world brighter!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Samoyed_dog_Phoebe.jpg"
  },
  "boxer": {
    traits: ["🥊 Playfully fierce", "😄 Hilarious and goofy", "❤️ Heart of gold"],
    quote: "Tough exterior, total goofball inside — you keep everyone entertained!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Boxer_female.jpg"
  },
  "great dane": {
    traits: ["👑 Gentle giant", "😌 Surprisingly calm", "🤗 Loves cuddles despite the size"],
    quote: "Majestic and imposing but secretly just wants a cuddle!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c4/Great_Dane_002.jpg"
  },
  "maltese": {
    traits: ["👼 Angelic appearance", "💕 Incredibly affectionate", "✨ Always elegant"],
    quote: "Delicate, charming, and absolutely impossible not to love!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Maltese_600.jpg"
  },
  "weimaraner": {
    traits: ["🎨 Artistically inclined", "👁️ Soulful and deep", "🏃 Athletic and graceful"],
    quote: "Hauntingly beautiful and deeply soulful — an artist at heart!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8d/Weimaraner_wb.jpg"
  },
  "akita": {
    traits: ["🎌 Noble and dignified", "🛡️ Fiercely loyal", "😌 Quietly powerful"],
    quote: "You don't need to say much — your presence alone commands respect!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/43/Akita_Inu.jpeg"
  },
  "chow chow": {
    traits: ["👑 Regal and proud", "😏 Selective with trust", "🦁 Lion hearted"],
    quote: "You don't need everyone's approval — only a chosen few earn yours!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e4/ChowChow.jpg"
  },
  "irish setter": {
    traits: ["🍀 Charming and warm", "🎉 Naturally magnetic", "❤️ Enthusiastically loving"],
    quote: "Effortlessly charming — people are just drawn to your warm energy!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Irish_Setter.jpg"
  },
  "cocker spaniel": {
    traits: ["🎵 Sensitive and artistic", "👁️ Big beautiful soul", "🤗 Gentle and loving"],
    quote: "Deep feeling, gentle soul — you experience life more beautifully than most!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b9/CockerSpaniel_simon.jpg"
  },
  "vizsla": {
    traits: ["🏃 Athletic and graceful", "❤️ Velcro personality", "☀️ Golden warm energy"],
    quote: "Active, affectionate, and absolutely glued to the people you love!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Vizsla_show_dog.jpg"
  },
  "saint bernard": {
    traits: ["🏔️ Gentle mountain giant", "🤗 Naturally nurturing", "❤️ Biggest heart in the room"],
    quote: "You were born to take care of others — a natural hero!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Saint-Bernard-Wikicommons.jpg"
  },

  // Cats
  "siamese": {
    traits: ["🗣️ Very vocal and expressive", "😏 Mysterious and smart", "👀 Always watching"],
    quote: "Elegant, opinionated, and absolutely impossible to ignore!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/25/Siam_lilacpoint.jpg"
  },
  "persian": {
    traits: ["😌 Calm and graceful", "👑 Royally elegant", "🛋️ Expert relaxer"],
    quote: "You move through life with effortless grace and quiet confidence!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/15/White_Persian_Cat.jpg"
  },
  "maine coon": {
    traits: ["🦁 Majestic and mighty", "🤗 Surprisingly gentle", "🧠 Dog-like loyalty"],
    quote: "The gentle giant — impressive on the outside, sweetheart on the inside!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Maine_coon_cat_mo_%281%29.jpg"
  },
  "bengal": {
    traits: ["🐆 Wild at heart", "⚡ Incredibly energetic", "👀 Intensely focused"],
    quote: "You have an untamed spirit that no one can contain!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Paintedcats_Red_Star_standing.jpg"
  },
  "ragdoll": {
    traits: ["😌 Goes with the flow", "🤗 Incredibly laid back", "💕 Melts in your arms"],
    quote: "The most chill person in any room — nothing phases you!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Ragdoll_from_Gatil_Ragbelas.jpg"
  },
  "british shorthair": {
    traits: ["🎩 Dignified and proper", "😌 Calm and collected", "🧠 Quietly observant"],
    quote: "You observe everything, say little, and always know exactly what's going on!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Britishblue.jpg"
  },
  "british longhair": {
    traits: ["👑 Quietly regal", "😌 Serene and peaceful", "🎨 Effortlessly beautiful"],
    quote: "Serene, beautiful, and quietly ruling everything around you!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d9/British_Longhair.jpg"
  },
  "scottish fold": {
    traits: ["🦉 Wise beyond years", "😊 Quietly cheerful", "🤔 Deep thinker"],
    quote: "You see the world differently from everyone else — and you're usually right!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5d/Scottish_Fold_Cat.jpg"
  },
  "sphynx": {
    traits: ["😎 Fearlessly unique", "🎭 Total drama queen", "❤️ Surprisingly warm"],
    quote: "You walk into a room and everyone stops — you were born to stand out!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/af/Sphynx_cat_Quincy.jpg"
  },
  "abyssinian": {
    traits: ["🏃 Always in motion", "🔍 Wildly curious", "⚡ Boundless energy"],
    quote: "You never stop moving, exploring, and discovering new things!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Gustav_chocolate.jpg"
  },
  "russian blue": {
    traits: ["💎 Reserved and elegant", "🧠 Deeply intelligent", "😌 Quietly mysterious"],
    quote: "You don't reveal yourself to just anyone — you are selectively wonderful!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Russian_Blue_female.jpg"
  },
  "norwegian forest cat": {
    traits: ["🌲 Nature lover", "💪 Quietly strong", "🤗 Warm and welcoming"],
    quote: "Strong, independent, and completely at home in any environment!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Norskskogkatt_Evita_3.jpg"
  },
  "birman": {
    traits: ["🙏 Gentle and sacred", "💕 Deeply loving", "😌 Peacefully serene"],
    quote: "You bring calm and peace to every situation — a true healer!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Birman_cat.jpg"
  },
  "burmese": {
    traits: ["🤗 People obsessed", "😄 Playfully mischievous", "❤️ Unconditionally loving"],
    quote: "You absolutely need people around you — and honestly they need you more!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Birmankatze.jpg"
  },
  "exotic shorthair": {
    traits: ["🧸 Living teddy bear", "😌 Ultra calm", "🤗 Loves being held"],
    quote: "Soft, squishy, and absolutely irresistible — a real life teddy bear!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8d/Exotic_shorthair.jpg"
  },
  "tonkinese": {
    traits: ["🎭 Social butterfly", "🎮 Playfully fun", "💬 Great conversationalist"],
    quote: "The social butterfly — you thrive when surrounded by energy and fun!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d2/Tonkinese_cat.jpg"
  },
  "devon rex": {
    traits: ["🧝 Elfin and magical", "😈 Mischievously playful", "⚡ Unpredictably fun"],
    quote: "Magical, mischievous, and absolutely one of a kind!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Devon_Rex_cat.jpg"
  },
  "turkish angora": {
    traits: ["💃 Gracefully athletic", "👑 Naturally aristocratic", "🎨 Artistic soul"],
    quote: "Grace and beauty come naturally to you — you make everything look like art!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8d/Angora_cat.jpg"
  },
  "himalayan": {
    traits: ["😌 Perfectly serene", "👑 Quietly majestic", "🛋️ Comfort expert"],
    quote: "You have mastered the art of living beautifully and comfortably!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/06/Himalayan_cat.jpg"
  },
  "chartreux": {
    traits: ["🤫 Strong silent type", "🧠 Deeply wise", "😊 Quietly joyful"],
    quote: "You don't need to say much — your wisdom speaks for itself!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Chartreux_cat.jpg"
  },
  "bombay": {
    traits: ["🐆 Mini panther energy", "😎 Effortlessly cool", "🌙 Mysterious and magnetic"],
    quote: "Dark, mysterious, and magnetically attractive — a true night creature!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Bombay_cat.jpg"
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
        `https://upload.wikimedia.org/wikipedia/commons/1/15/White_Persian_Cat.jpg` : // Cat generic fallback (Persian)
        `https://upload.wikimedia.org/wikipedia/commons/b/bd/Golden_Retriever_Dukedestiny01_drvd.jpg` // Dog generic fallback (Golden)
    };

    // Use our beautiful, 100% reliable hardcoded breed image URL
    const unsplashImageUrl = matchedData.imageUrl;

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
