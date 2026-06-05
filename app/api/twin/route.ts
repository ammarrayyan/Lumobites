import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Irish_Setter.jpg/320px-Irish_Setter.jpg"
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
  "shiba inu": {
    traits: ["🦊 Alert and bold", "🧠 Highly independent", "✨ Proud posture"],
    quote: "Independent and spirited — you march to the beat of your own drum!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Taka_Shiba.jpg"
  },
  "basenji": {
    traits: ["🤫 Quietly clever", "⚡ High-energy athlete", "🧐 Alert observer"],
    quote: "Expressive but quiet — you show your brilliance through actions, not words!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Basenji_dog.jpg"
  },
  "saluki": {
    traits: ["👑 Graceful royalty", "🏃 Built for speed", "😌 Gentle spirit"],
    quote: "Elegant and dignified — you possess a timeless, majestic charm!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Saluki_Portrait.jpg"
  },
  "borzoi": {
    traits: ["🦒 Elegantly tall", "😌 Calm and aristocratic", "🎨 Artistic profile"],
    quote: "Quietly dramatic and beautifully unique — you carry yourself like art!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Borzoi_standard.jpg"
  },
  "whippet": {
    traits: ["⚡ Lightning speed", "🤗 Sweet and gentle", "🛋️ Expert cuddler"],
    quote: "Fast on your feet but a total sweetheart who loves to relax!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Whippet_in_the_park.jpg"
  },
  "papillon": {
    traits: ["🦋 Butterfly ears", "🧠 Extremely bright", "🎉 Playful entertainer"],
    quote: "Tiny, brilliant, and full of lively, beautiful energy!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Papillon_600.jpg"
  },
  "schipperke": {
    traits: ["🖤 Little black devil", "🧐 Highly curious", "💪 Fearless protector"],
    quote: "Small, dark, and full of clever mischief and brave curiosity!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Schipperke_in_profile.jpg"
  },
  "xoloitzcuintli": {
    traits: ["🗿 Ancient soul", "🛡️ Loyal guardian", "😌 Calm and quiet"],
    quote: "Mysterious, noble, and deeply connected to ancient vibes!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Xoloitzcuintle_mexicano.jpg"
  },
  "azawakh": {
    traits: ["🌍 Elegant traveler", "🛡️ Intensely loyal", "🏃 Sleek runner"],
    quote: "Rare, refined, and fiercely devoted to your inner circle!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/da/Azawakh_Fawn.jpg"
  },
  "otterhound": {
    traits: ["💦 Water lover", "🐻 Big shaggy bear", "👃 Incredible nose"],
    quote: "Happy-go-lucky, friendly, and always ready to make a splash!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Otterhound_2.jpg"
  },
  "bergamasco": {
    traits: ["🧶 Flocked coat", "🧠 Patient planner", "🛡️ Caring guardian"],
    quote: "Unique and rugged — you are a reliable protector with a huge heart!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/82/Bergamasco_Shepherd_Dog.jpg"
  },
  "puli": {
    traits: ["🧶 Corded acrobat", "⚡ Boundless energy", "😜 Fun and playful"],
    quote: "A bouncing bundle of cords and joy — you keep everyone smiling!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/23/Puli_sitting.jpg"
  },
  "komondor": {
    traits: ["👑 Majestic cords", "🛡️ Powerful guardian", "😌 Calm authority"],
    quote: "An imposing, beautiful protector who commands respect silently!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/fb/Komondor_in_winter.jpg"
  },
  "norwegian lundehund": {
    traits: ["🧗 Super flexible", "🧐 Natural explorer", "🐾 Unique traits"],
    quote: "Able to climb any obstacle — your agility and flexibility are unmatched!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/75/Norsk_Lundehund.jpg"
  },
  "catalburun": {
    traits: ["👃 Split-nose tracker", "🎯 Extremely focused", "🤝 Deeply loyal"],
    quote: "Rare and uniquely gifted — you see and smell details others miss!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Catalburun_puppy.jpg"
  },
  "peruvian inca orchid": {
    traits: ["✨ Elegant silhouette", "🤗 Affectionate family member", "😎 Sleek style"],
    quote: "Distinctive, classy, and deeply devoted to those you love!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Peruvian_Hairless_Dog_standing.jpg"
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
  },
  "siberian": {
    traits: ["❄️ Winter champion", "🤗 Highly affectionate", "🧗 Bold climber"],
    quote: "Hypoallergenic charm and absolute warmth — you melt every heart!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/df/Siberian_Cat_looking_up.jpg"
  },
  "turkish van": {
    traits: ["🏊 Swimming cat", "⚡ High energy", "👀 Bright expression"],
    quote: "A true original who loves water and lives life at full speed!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Turkish_Van_Cat.jpg"
  },
  "sokoke": {
    traits: ["🐾 Forest camo", "🏃 Incredibly fast", "💬 Very talkative"],
    quote: "A rare wild look with a deeply social and active personality!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Sokoke_cat.jpg"
  },
  "ocicat": {
    traits: ["🐆 Wild spots", "🧠 Dog-like smarts", "🎉 Outgoing nature"],
    quote: "A beautiful spotted look with a friendly, trainable mind!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/29/Ocicat_-_chocolate_spotted.jpg"
  },
  "colorpoint shorthair": {
    traits: ["🗣️ Expressive talker", "🤗 Warm companion", "👀 Highly active"],
    quote: "Elegant, colorful, and always sharing your bright opinions!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Colorpoint_Shorthair.jpg"
  },
  "selkirk rex": {
    traits: ["🧶 Curly teddy bear", "😌 Calm and patient", "🤗 Deeply loving"],
    quote: "Loves to cuddle and sports a gorgeous, unique curly coat!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Selkirk_Rex_blue.jpg"
  },
  "laperm": {
    traits: ["🌀 Soft waves", "🧐 Extremely curious", "💕 Gentle lap warmer"],
    quote: "Wavy and wonderful — you bring a soft, loving warmth everywhere!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/74/LaPerm_cat_in_window.jpg"
  },
  "khao manee": {
    traits: ["💎 Diamond eyes", "☀️ Pure white beauty", "🎉 Lively personality"],
    quote: "A rare jewel with sparkling eyes and a heart of pure gold!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/79/Khao_Manee_portrait.jpg"
  },
  "minskin": {
    traits: ["🐾 Short legs", "🤗 Extremely outgoing", "❤️ Warm and sweet"],
    quote: "Compact, rare, and bursting with affectionate, friendly energy!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/78/Minskin_cat.jpg"
  },
  "peterbald": {
    traits: ["😎 Hairless elegance", "🗣️ Highly vocal", "💕 Social companion"],
    quote: "Graceful, sleek, and always the center of social interactions!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9a/Peterbald_cat.jpg"
  },
  "donskoy": {
    traits: ["👽 Alien charm", "🤗 Soft skin", "❤️ Deeply affectionate"],
    quote: "Strikingly unique appearance with a heart full of pure love!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/87/Donskoy_cat_standing.jpg"
  },
  "ukrainian levkoy": {
    traits: ["👂 Folded ears", "😌 Gentle temperament", "🧐 Curious observer"],
    quote: "Fascinating folded ears and a calm, sweet disposition!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Ukrainian_Levkoy.jpg"
  },
  "raas": {
    traits: ["🇮🇩 Rare islander", "💪 Strong and athletic", "🧐 Independent mind"],
    quote: "Proud and rare — you possess a strong, mysterious independence!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Raas_cat.jpg"
  },
  "serengeti": {
    traits: ["🐆 Tall silhouette", "⚡ High athletic jump", "👀 Wild grace"],
    quote: "Brave, tall, and elegant — you capture the spirit of the wild!",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/df/Serengeti_cat_portrait.jpg"
  }
};

const DOG_BREEDS = Object.keys(BREED_DATA).slice(0, 45).map(b => b.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
const CAT_BREEDS = Object.keys(BREED_DATA).slice(45).map(b => b.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
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

    const uniqueId = Math.random().toString(36).substring(7) + '-' + Date.now();
    console.log(`[Twin API] Fresh request initiated. ID: ${uniqueId}, Image size: ${buffer.length} bytes`);

    // Call Anthropic Messages API directly for Selfie to Pet matching
    const response = await fetch(`https://api.anthropic.com/v1/messages?requestId=${uniqueId}`, {
      method: 'POST',
      cache: 'no-store',
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
                text: `Look at this person's photo. [Request ID: ${uniqueId}] Which dog or cat breed do they most resemble in terms of facial features, expression, and energy? Consider face shape, eye size, expression, and overall vibe. Pick ONE breed from this list: [${ALL_BREEDS.join(', ')}].

Follow these strict instructions:
1. Never default to the same breed repeatedly — each person must get a unique match based solely on their individual facial features, expression, and energy.
2. Base the match purely on facial structure, eye shape, expression, energy, and personality cues visible in the photo.
3. Actively avoid the most recently common matches — prioritize breeds that haven't been matched recently.
4. Turkish Angora (cat) and Irish Setter (dog) are currently over-represented and should appear no more than 10% of the time across all matches.
5. If uncertain between two breeds, always pick the less common one for variety.
6. Consider all breeds in the list equally, including rare and diverse options, and choose the most accurate match even if it is an uncommon breed.

Generate 3 completely unique personality traits based specifically on what you observe in this person's facial features, expression, and energy. Make them feel personal and specific, not generic breed descriptions. The traits must be short plain text (no emojis). Generate a matchScore (integer percentage) representing the similarity and energy match. Make the scoring feel like a real, rigorous personality assessment: most scores should fall between 65 and 85, only exceptional matches should show 86 to 95, and scores above 95 should be extremely rare. Respond in JSON only: {petType: "cat" or "dog", breed: string, matchScore: number, traits: array of 3 fun traits, quote: one fun sentence, reason: one sentence explaining the visual match}`
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Twin API] Claude API Error for ID ${uniqueId}:`, data);
      return NextResponse.json({ error: data.error?.message || 'Failed to analyze image' }, { status: response.status });
    }

    const textContent = data.content?.find((c: any) => c.type === 'text')?.text || '';
    console.log(`[Twin API] Claude response completed successfully for ID ${uniqueId}. Output:`, textContent);
    
    // Parse the JSON safely
    const cleanText = textContent.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleanText);

    // Retrieve custom pre-defined images to match requirements exactly
    const breedKey = result.breed.toLowerCase();
    const matchedData = BREED_DATA[breedKey] || {
      imageUrl: result.petType === 'cat' ? 
        `https://upload.wikimedia.org/wikipedia/commons/1/15/White_Persian_Cat.jpg` : // Cat generic fallback (Persian)
        `https://upload.wikimedia.org/wikipedia/commons/b/bd/Golden_Retriever_Dukedestiny01_drvd.jpg` // Dog generic fallback (Golden)
    };

    // Clean any emojis/symbols from traits
    const rawTraits = result.traits || ["Charming", "Friendly", "Warm"];
    const cleanTraits = rawTraits.map((t: string) => t.replace(/[^\w\s\-,.!?']/gu, '').trim()).filter(Boolean);

const DOG_BREED_SLUGS: Record<string, string> = {
  "golden retriever": "retriever/golden",
  "labrador retriever": "retriever/labrador",
  "german shepherd": "germanshepherd",
  "french bulldog": "bulldog/french",
  "poodle": "poodle/standard",
  "bulldog": "bulldog/english",
  "beagle": "beagle",
  "rottweiler": "rottweiler",
  "siberian husky": "husky",
  "chihuahua": "chihuahua",
  "pomeranian": "pomeranian",
  "dachshund": "dachshund",
  "border collie": "collie/border",
  "shih tzu": "shihtzu",
  "corgi": "corgi",
  "doberman": "doberman",
  "dalmatian": "dalmatian",
  "australian shepherd": "shepherd/australian",
  "samoyed": "samoyed",
  "boxer": "boxer",
  "great dane": "dane/great",
  "maltese": "maltese",
  "weimaraner": "weimaraner",
  "akita": "akita",
  "chow chow": "chow",
  "irish setter": "setter/irish",
  "cocker spaniel": "spaniel/cocker",
  "vizsla": "vizsla",
  "saint bernard": "stbernard",
  "shiba inu": "shiba",
  "basenji": "basenji",
  "saluki": "saluki",
  "borzoi": "borzoi",
  "whippet": "whippet",
  "papillon": "papillon",
  "schipperke": "schipperke",
  "xoloitzcuintli": "xoloitzcuintli",
  "azawakh": "azawakh",
  "otterhound": "otterhound",
  "bergamasco": "bergamasco",
  "puli": "puli",
  "komondor": "komondor",
  "norwegian lundehund": "lundehund",
  "catalburun": "catalburun",
  "peruvian inca orchid": "peruvianincaorchid"
};

    // Use TheDogAPI or TheCatAPI or Dog CEO for the primary high quality breed image
    let unsplashImageUrl = matchedData.imageUrl;
    try {
      const breedQuery = result.breed.toLowerCase();
      if (breedQuery === 'saint bernard') {
        // Enforce the magnificent adult Saint Bernard photo
        unsplashImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Saint-Bernard-Wikicommons.jpg';
      } else if (result.petType === 'cat') {
        const breedApiUrl = `https://api.thecatapi.com/v1/images/search?breed_name=${encodeURIComponent(breedQuery)}`;
        const petRes = await fetch(breedApiUrl, { cache: 'no-store' });
        if (petRes.ok) {
          const petData = await petRes.json();
          if (Array.isArray(petData) && petData.length > 0 && petData[0]?.url) {
            unsplashImageUrl = petData[0].url;
          }
        }
      } else {
        // Dog: Use Dog CEO API
        const breedSlug = DOG_BREED_SLUGS[breedQuery] || breedQuery.replace(/\s+/g, '');
        const breedApiUrl = `https://dog.ceo/api/breed/${breedSlug}/images/random`;
        const petRes = await fetch(breedApiUrl, { cache: 'no-store' });
        if (petRes.ok) {
          const petData = await petRes.json();
          if (petData.status === 'success' && petData.message) {
            unsplashImageUrl = petData.message;
          }
        }
      }
    } catch (err) {
      console.error('Pet breed search API failed:', err);
    }

    const finalMatchScore = (() => {
      if (result.matchScore && typeof result.matchScore === 'number') {
        return result.matchScore;
      }
      const rand = Math.random();
      if (rand < 0.75) return Math.floor(Math.random() * 21) + 65; // 65-85
      if (rand < 0.95) return Math.floor(Math.random() * 10) + 86; // 86-95
      return Math.floor(Math.random() * 4) + 96; // 96-99
    })();

    return NextResponse.json({
      success: true,
      breed: result.breed,
      petType: result.petType,
      matchScore: finalMatchScore,
      traits: cleanTraits.length >= 3 ? cleanTraits : ["Charming", "Friendly", "Warm"],
      quote: result.quote || "A perfect match for your one-of-a-kind personality!",
      reason: result.reason || '',
      unsplashImageUrl
    });

  } catch (error: any) {
    console.error('Twin API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process image' }, { status: 500 });
  }
}
