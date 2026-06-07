import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

let lastFallbackScore: number | null = null;
let lastReturnedScore: number | null = null;

function generateFallbackScore(): number {
  const rand = Math.random();
  let score: number;
  if (rand < 0.40) {
    score = Math.floor(Math.random() * 10) + 65; // 65-74
  } else if (rand < 0.75) { // 40% + 35% = 75%
    score = Math.floor(Math.random() * 10) + 75; // 75-84
  } else if (rand < 0.95) { // 75% + 20% = 95%
    score = Math.floor(Math.random() * 8) + 85; // 85-92
  } else {
    score = Math.floor(Math.random() * 4) + 93; // 93-96
  }

  if (lastFallbackScore !== null && score === lastFallbackScore) {
    const offset = Math.random() < 0.5 ? 1 : -1;
    score += offset;
    if (score < 65) score = 66;
    if (score > 96) score = 95;
  }
  lastFallbackScore = score;
  return score;
}

const BREED_DATA: Record<string, { traits: string[]; quote: string; imageUrl: string }> = {
  // Dogs
  "golden retriever": {
    traits: ["☀️ Radiantly friendly", "🍔 Unabashed food-motivated opportunist", "❤️ Loyal to a fault"],
    quote: "You think every stranger is just a best friend who hasn't given you a snack yet.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/bd/Golden_Retriever_Dukedestiny01_drvd.jpg"
  },
  "labrador retriever": {
    traits: ["⚡ High-energy companion", "🌊 Irresistibly drawn to water", "🎯 Enthusiastically determined"],
    quote: "Your enthusiasm levels are permanently set to 100%, especially if a tennis ball is involved.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/26/YellowLabradorLooking_new.jpg"
  },
  "german shepherd": {
    traits: ["🛡️ Devoted protector", "🧠 Strategic planner", "📋 Loves having a job to do"],
    quote: "You're not paranoid; you're just highly alert and keeping a detailed log of everyone's movements.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d0/German_Shepherd_-_DSC_0346_%2810096362833%29.jpg"
  },
  "french bulldog": {
    traits: ["🤡 Professional class clown", "😴 Snoring enthusiast", "🍕 Expert snack-beggar"],
    quote: "A massive personality trapped in a compact, slightly dramatic body that refuses to walk in the rain.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3b/French_bulldog2.jpg"
  },
  "poodle": {
    traits: ["🧠 Genius-level intellect", "✂️ High-maintenance standard", "✨ Naturally showy"],
    quote: "You're secretly running calculations to take over the household, but doing it with impeccable style.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f8/Full_attention_%288067543690%29.jpg"
  },
  "bulldog": {
    traits: ["😤 Stubbornly charming", "🛋️ Part of the furniture", "❤️ Fiercely affectionate"],
    quote: "You have very strong opinions about moving from the couch, mostly involving 'no'.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/bf/Bulldog_inglese.jpg"
  },
  "beagle": {
    traits: ["👃 Driven by scent", "🎵 Dramatic vocal range", "🤝 Universal friendly greeter"],
    quote: "Your nose makes all your life decisions for you, and your voice lets the entire neighborhood know.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6b/000_Beagle_Molly.jpg"
  },
  "rottweiler": {
    traits: ["🛡️ Unshakeable protector", "🧠 Discerning intellectual", "🧸 Secretly a lap dog"],
    quote: "You look like you're in charge, but you secretly just want to lean your entire body weight against the person you love.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/26/Rottweiler_standing_facing_left.jpg"
  },
  "siberian husky": {
    traits: ["🗣️ Extremely dramatic debater", "❄️ Cold-weather fanatic", "🏃 Escape artist"],
    quote: "You have a lot of feelings about everything, and you will express them at maximum volume.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a3/Black-Magic-Big-Boy.jpg"
  },
  "chihuahua": {
    traits: ["🌶️ Spicy and fierce", "👑 Tiny tyrant", "💕 Devoted to one human"],
    quote: "You operate on 99% attitude and 1% body mass, and you will fight a mailbox if it looks at you wrong.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Chihuahua1_bvdb.jpg"
  },
  "pomeranian": {
    traits: ["⭐ Fluffy attention magnet", "🗣️ High-pitched commentator", "🎉 Bundles of sass"],
    quote: "A cloud of pure confidence who believes the entire world is a stage set up for your benefit.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Pomeranian_orange_Darius.jpg"
  },
  "dachshund": {
    traits: ["📏 Uniquely long profile", "⛏️ Persistent badger hunter", "😤 Will not be ordered around"],
    quote: "Your body is long, but your list of demands and stubborn refusal to listen is even longer.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Dackel_3.jpg"
  },
  "border collie": {
    traits: ["🧠 Hyper-focused workaholic", "⚡ Unexhausted battery", "👀 The intense stare"],
    quote: "You have already solved three complex puzzles today and are currently herding the dust motes.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1a/24701-nature-natural-beauty-border-collie.jpg"
  },
  "shih tzu": {
    traits: ["👑 Pampered royalty", "😌 Completely unbothered", "🎀 Always camera-ready"],
    quote: "You don't do chores, you don't do tricks; you simply exist to be admired.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Shih-Tzu.jpg"
  },
  "corgi": {
    traits: ["🍞 Low-riding bread loaf", "📣 Opinionated supervisor", "🏃 Surprisingly speedy"],
    quote: "Splooting expert and self-appointed neighborhood watch captain, all on two-inch legs.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9e/Welsh_Corgi_Pembroke_Portrait.jpg"
  },
  "doberman": {
    traits: ["💎 Sleek security detail", "⚡ Sharp-witted observer", "🛡️ Deeply committed guardian"],
    quote: "You look like a high-end bodyguard but you are secretly afraid of the vacuum cleaner.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Dobermann_handling.jpg"
  },
  "dalmatian": {
    traits: ["🎨 Eye-catching spotted print", "🏃 High-mileage runner", "🤪 Distinctively goofy grin"],
    quote: "You stand out in every crowd, mostly because you have energy levels that defy physics.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/90/Flecky3.jpg"
  },
  "australian shepherd": {
    traits: ["🌈 Eye-catching kaleidoscope look", "🧠 Mind-reading puzzle solver", "⚡ Needs a task ASAP"],
    quote: "You are currently outsmarting your owners and organizing their closets by color.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Australian_Shepherd_600.jpg"
  },
  "samoyed": {
    traits: ["😊 Permanent smile", "☁️ Fluffy white cloud", "☀️ Pure optimism"],
    quote: "You are basically a talking marshmallow who believes everyone is a friend.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Samoyed_dog_Phoebe.jpg"
  },
  "boxer": {
    traits: ["🤪 Bounce-around goofball", "🥊 Expressive paw user", "❤️ Deeply affectionate partner"],
    quote: "You walk with a wiggle, jump with joy, and have zero concept of personal space.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Boxer_female.jpg"
  },
  "great dane": {
    traits: ["🏢 Couch-hogging giant", "😌 Surprisingly gentle soul", "👻 Easily startled by small things"],
    quote: "A horse-sized companion who genuinely believes they can fit on your lap.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c4/Great_Dane_002.jpg"
  },
  "maltese": {
    traits: ["✨ Silky white aristocrat", "💖 Sweet lap warmer", "👑 Loves luxury treatment"],
    quote: "A tiny silk handkerchief of a dog who demands premium pillows and constant adoration.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Maltese_600.jpg"
  },
  "weimaraner": {
    traits: ["🎨 Ghostly grey beauty", "❤️ Intense velcro attachment", "🧠 Clever problem creator"],
    quote: "You are a beautiful, shadowy figure who cannot handle being in a different room than your human.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8d/Weimaraner_wb.jpg"
  },
  "akita": {
    traits: ["🎌 Dignified noble spirit", "🛡️ Selective trust guardian", "😌 Quietly commanding presence"],
    quote: "You don't need to bark; one look from you is enough to establish absolute boundaries.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/43/Akita_Inu.jpeg"
  },
  "chow chow": {
    traits: ["🦁 Blue-tongued lion", "😏 Intensely private", "👑 Regal snobbery"],
    quote: "You view human commands as polite suggestions that you will review at a later date.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e4/ChowChow.jpg"
  },
  "irish setter": {
    traits: ["🍀 Mahogany beauty", "🎉 Carefree party animal", "❤️ Loving and flighty"],
    quote: "Bouncing through life with gorgeous red hair and not a single stressful thought in your head.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Irish_Setter.jpg/320px-Irish_Setter.jpg"
  },
  "cocker spaniel": {
    traits: ["🎵 Big-eyed gentle soul", "🌳 Enthusiastic flusher", "🤗 Loves family cuddles"],
    quote: "Your soulful eyes can guilt anyone into sharing their dinner, and you know it.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b9/CockerSpaniel_simon.jpg"
  },
  "vizsla": {
    traits: ["🏃 Athletic copper dynamo", "💖 Unconditional velcro clinger", "☀️ Warm helper"],
    quote: "Your favorite place in the world is physically attached to the person next to you.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Vizsla_show_dog.jpg"
  },
  "saint bernard": {
    traits: ["🏔️ Shaggy rescue helper", "💦 Drool champion", "❤️ Giant warm heart"],
    quote: "You bring comfort, safety, and a substantial amount of slobber to every interaction.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Saint-Bernard-Wikicommons.jpg"
  },
  "shiba inu": {
    traits: ["🦊 Scream-prone dramatist", "🧠 Stubborn independent", "✨ Pristine self-groomer"],
    quote: "You are part cat, part fox, and 100% convinced that you are the boss of this operation.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Taka_Shiba.jpg"
  },
  "basenji": {
    traits: ["🤫 Barkless yodeler", "🏃 Agile climber", "🧼 Cat-like cleaner"],
    quote: "You don't bark, you yodel, and you groom yourself like a cat because you have high standards.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Basenji_dog.jpg"
  },
  "saluki": {
    traits: ["👑 Feathered desert royalty", "🏃 Built for chasing", "😌 Aloof observer"],
    quote: "You look like a high-fashion model who finds the concept of catching a ball beneath you.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Saluki_Portrait.jpg"
  },
  "borzoi": {
    traits: ["🦒 Long-snooted aristocrat", "😌 Quietly dramatic", "🎨 Elegant model"],
    quote: "Let me do it for you — a majestic creature who is mostly snoot and dramatic poses.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Borzoi_standard.jpg"
  },
  "whippet": {
    traits: ["⚡ Couch potato speedster", "🤗 Gentle and polite", "🛋️ Shivering cuddle-seeker"],
    quote: "A paper-thin racer who can run 35mph but prefers to sleep under the covers for 20 hours a day.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Whippet_in_the_park.jpg"
  },
  "papillon": {
    traits: ["🦋 Wing-eared marvel", "🧠 Lightning-fast learner", "🎉 Lively performer"],
    quote: "A tiny butterfly-eared genius who learns tricks faster than you can teach them.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Papillon_600.jpg"
  },
  "schipperke": {
    traits: ["🖤 Curious little explorer", "🧐 Always on watch", "🔋 High-voltage engine"],
    quote: "A small black captain who must supervise every cabinet opening and verify all deliveries.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Schipperke_in_profile.jpg"
  },
  "xoloitzcuintli": {
    traits: ["🗿 Ancient mohawk style", "🛡️ Watchful protector", "😌 Calm warm companion"],
    quote: "A striking, hairless guardian who feels like a hot water bottle and acts like a wise ancient spirit.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Xoloitzcuintle_mexicano.jpg"
  },
  "azawakh": {
    traits: ["🌍 Slender desert runner", "🛡️ Intensely selective friend", "🏃 High-stance stride"],
    quote: "An incredibly rare, statuesque runner who only offers their affection to a select VIP list.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/da/Azawakh_Fawn.jpg"
  },
  "otterhound": {
    traits: ["💦 Shaggy swimming explorer", "👃 Scent-obsessed tracker", "🐻 Big friendly goofball"],
    quote: "A giant shaggy water-dog who treats every puddle like a five-star spa.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Otterhound_2.jpg"
  },
  "bergamasco": {
    traits: ["🧶 Felted coat protector", "🧠 Calm logical thinker", "🛡️ Patient helper"],
    quote: "Your hair naturally mats into protective mats, making you look like a walking rug with a heart of gold.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/82/Bergamasco_Shepherd_Dog.jpg"
  },
  "puli": {
    traits: ["🧶 Corded trampoline", "⚡ Boundless bouncing", "😜 Joyful jokester"],
    quote: "A bouncing mop of cords who loves to leap into the air and make everyone laugh.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/23/Puli_sitting.jpg"
  },
  "komondor": {
    traits: ["👑 Majestic corded giant", "🛡️ Serious security guard", "😌 Imposing stature"],
    quote: "You look like a giant mop, but you take your guarding duties very, very seriously.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/fb/Komondor_in_winter.jpg"
  },
  "norwegian lundehund": {
    traits: ["🧗 Six-toed cliff climber", "🧐 Bendy explorer", "🐾 Unique anatomy"],
    quote: "With six toes and a neck that bends backward, you are built for climbing cliffs and escaping trouble.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/75/Norsk_Lundehund.jpg"
  },
  "catalburun": {
    traits: ["👃 Split-nose detector", "🎯 Laser-focused worker", "🤝 Intensely loyal"],
    quote: "Your unique split nose gives you double the sniffing power to find things others miss.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Catalburun_puppy.jpg"
  },
  "peruvian inca orchid": {
    traits: ["✨ Statuesque mohawk look", "🤗 Warm sensitive friend", "😎 Chic minimalist style"],
    quote: "Elegantly hairless with a stylish mohawk, you are a rare, sensitive work of art.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Peruvian_Hairless_Dog_standing.jpg"
  },

  // Cats
  "siamese": {
    traits: ["🗣️ Constant loud talker", "🧠 Highly demanding brain", "👀 Needs to supervise you"],
    quote: "You have many loud opinions about everything, and you will share them at 3 AM.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/25/Siam_lilacpoint.jpg"
  },
  "persian": {
    traits: ["😌 Unbothered lounge expert", "👑 Fluffy luxury seeker", "🛋️ Premium nap-taker"],
    quote: "You move through life with a serene presence, expecting the servants to handle the details.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/15/White_Persian_Cat.jpg"
  },
  "maine coon": {
    traits: ["🦁 Gentle giant hunter", "🤗 Chirpy communicator", "🧠 Dog-like fetch player"],
    quote: "A massive fluffy companion who makes bird noises and likes playing in water.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Maine_coon_cat_mo_%281%29.jpg"
  },
  "bengal": {
    traits: ["🐆 Spotted jungle athlete", "⚡ High-voltage wildcat", "🌊 Water splash fan"],
    quote: "You are 50% house cat, 50% wild leopard, and 100% likely to climb your curtains.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Paintedcats_Red_Star_standing.jpg"
  },
  "ragdoll": {
    traits: ["😌 Floppy relaxation master", "🤗 Utterly trustful companion", "💕 Melts on contact"],
    quote: "You go completely limp when held, showing the world how to truly do nothing.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Ragdoll_from_Gatil_Ragbelas.jpg"
  },
  "british shorthair": {
    traits: ["🎩 Round-cheeked gentleman", "😌 Calm judge of character", "🧠 Quietly evaluating you"],
    quote: "You judge everyone from a distance with round eyes and thick, plush dignity.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Britishblue.jpg"
  },
  "british longhair": {
    traits: ["👑 Plush regal fluff", "😌 Calm palace ruler", "🎨 Majestic model"],
    quote: "You rule your fluffy domain in complete peace, expecting others to admire you silently.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d9/British_Longhair.jpg"
  },
  "scottish fold": {
    traits: ["🦉 Owl-like folder", "😊 Soft-spoken observer", "🤔 Thinks in poses"],
    quote: "Your folded ears and round eyes make you look like a wise little owl who knows your secrets.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5d/Scottish_Fold_Cat.jpg"
  },
  "sphynx": {
    traits: ["😎 Naked and proud", "🎭 Attention-seeking gymnast", "❤️ Warm hot-pocket feel"],
    quote: "You have no fur, zero shame, and a burning desire to sit on top of the warmest device in the house.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/af/Sphynx_cat_Quincy.jpg"
  },
  "abyssinian": {
    traits: ["🏃 High-speed investigator", "🔍 Wildly curious climber", "⚡ Unstoppable motor"],
    quote: "You view high shelves as personal challenges and open cupboards as mysteries to solve.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Gustav_chocolate.jpg"
  },
  "russian blue": {
    traits: ["💎 Emerald-eyed beauty", "🧠 Discerning intellectual", "😌 Highly selective socializer"],
    quote: "You are a sophisticated, quiet companion who only reveals your sweet side to the chosen few.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Russian_Blue_female.jpg"
  },
  "norwegian forest cat": {
    traits: ["🌲 Fluffy climber", "💪 Big-boned explorer", "🤗 Sweet family friend"],
    quote: "Built for cold forests, you scale the tallest cat trees with absolute ease.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Norskskogkatt_Evita_3.jpg"
  },
  "birman": {
    traits: ["🙏 White-gloved beauty", "💕 Gentle lap snuggler", "😌 Soft purr engine"],
    quote: "With your perfect white socks and gentle soul, you are the peacekeeper of the house.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Birman_cat.jpg"
  },
  "burmese": {
    traits: ["🤗 People-oriented shadow", "🎮 Playful acrobat", "❤️ High-volume purrer"],
    quote: "You are a heavy little brick of love who insists on being involved in every single conversation.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Birmankatze.jpg"
  },
  "exotic shorthair": {
    traits: ["🧸 Flat-faced sweetie", "😌 Super-chill roommate", "🤗 Hug-loving companion"],
    quote: "A plush Persian in a pajama suit who is too lazy to cause any trouble.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8d/Exotic_shorthair.jpg"
  },
  "tonkinese": {
    traits: ["🎭 Playful extrovert", "🎮 Game player", "💬 Chatty companion"],
    quote: "You combined the best of Siamese talkativeness and Burmese playfulness to create a 24/7 entertainment channel.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d2/Tonkinese_cat.jpg"
  },
  "devon rex": {
    traits: ["🧝 Giant-eared pixie", "😈 Mischievous monkey", "⚡ Warm suede coat"],
    quote: "You look like a little alien elf and spend your time riding on people's shoulders.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Devon_Rex_cat.jpg"
  },
  "turkish angora": {
    traits: ["💃 Silk-coated ballerina", "👑 Elegant acrobat", "🎨 Creative spirit"],
    quote: "You are a beautiful white cloud of energy who expects to be treated like the queen you are.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8d/Angora_cat.jpg"
  },
  "himalayan": {
    traits: ["😌 Serene point-colored", "👑 Fluffy royalty", "🛋️ Cushion connoisseur"],
    quote: "You look like a glamorous movie star and demand the absolute softest pillows.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/06/Himalayan_cat.jpg"
  },
  "chartreux": {
    traits: ["🤫 Quiet blue hunter", "🧠 Smarter than you think", "😊 Permanent smile look"],
    quote: "You have a silent meow, a sweet smile, and a very secret list of demands.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Chartreux_cat.jpg"
  },
  "bombay": {
    traits: ["🐆 Sleek black panther", "😎 Cool cuddler", "🌙 Shiny night hunter"],
    quote: "A mini panther who is shiny, sleek, and obsessed with finding the warmest spot on your lap.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Bombay_cat.jpg"
  },
  "siberian": {
    traits: ["❄️ Thick-coated jumper", "🤗 Hypoallergenic friend", "🧗 Great leap athlete"],
    quote: "You are a fluffy powerhouse from the cold who can jump onto the top of the fridge in one bound.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/d/df/Siberian_Cat_looking_up.jpg"
  },
  "turkish van": {
    traits: ["🏊 Water-loving swimmer", "⚡ High-energy athlete", "👀 Active player"],
    quote: "The 'swimming cat' who will gladly join you in the shower or splash in your water bowl.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Turkish_Van_Cat.jpg"
  },
  "sokoke": {
    traits: ["🐾 Ring-patterned tabby", "🏃 Lightning sprinter", "💬 Highly vocal"],
    quote: "A rare, long-legged runner from Kenya who talks to you in a sweet, soft voice.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Sokoke_cat.jpg"
  },
  "ocicat": {
    traits: ["🐆 Spotted house leopard", "🧠 Highly trainable intellect", "🎉 Outgoing nature"],
    quote: "You look wild and spotted, but you're actually a sweet, dog-like friend who knows how to fetch.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/29/Ocicat_-_chocolate_spotted.jpg"
  },
  "colorpoint shorthair": {
    traits: ["🗣️ Opinionated talker", "🤗 Warm shadow friend", "👀 Extremely active"],
    quote: "An elegant, talkative companion who has a comment for everything you do.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Colorpoint_Shorthair.jpg"
  },
  "selkirk rex": {
    traits: ["🧶 Bad-hair-day pride", "😌 Calm teddy bear", "🤗 Hugger"],
    quote: "A gorgeous curly-coated cat who looks like they just woke up from a wild party.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Selkirk_Rex_blue.jpg"
  },
  "laperm": {
    traits: ["🌀 Soft-waved explorer", "🧐 Extremely curious", "💕 Gentle lap warmer"],
    quote: "With your unique curly coat and sweet personality, you are a walking Perm of joy.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/74/LaPerm_cat_in_window.jpg"
  },
  "khao manee": {
    traits: ["💎 Odd-eyed treasure", "☀️ Pure white beauty", "🎉 Active player"],
    quote: "A rare white beauty from Thailand who brings good luck and a lot of lively energy.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/79/Khao_Manee_portrait.jpg"
  },
  "minskin": {
    traits: ["🐾 Hairless dwarf look", "🤗 Super friendly climber", "❤️ Warm snuggle buddy"],
    quote: "With short legs and hairless skin, you look like a little sci-fi character but act like a sweet puppy.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/7/78/Minskin_cat.jpg"
  },
  "peterbald": {
    traits: ["😎 Hairless dancer", "🗣️ Talkative companion", "💕 Social shadow"],
    quote: "A slender, elegant hairless cat who insists on being under the covers with you.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9a/Peterbald_cat.jpg"
  },
  "donskoy": {
    traits: ["👽 Wrinkly alien appearance", "🤗 Velvety warm touch", "❤️ Extremely loving"],
    quote: "A wrinkly, hairless sweetheart who has zero concept of personal boundaries.",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/87/Donskoy_cat_standing.jpg"
  },
  "ukrainian levkoy": {
    traits: ["👂 Dog-eared folder", "😌 Gentle sweet helper", "🧐 Patient watcher"],
    quote: "A fascinating combination of folded ears, hairless skin, and a deeply sweet soul.",
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
    const quizAnswersStr = formData.get('quizAnswers') as string | null;
    let quizAnswersText = "";
    if (quizAnswersStr) {
      try {
        const qa = JSON.parse(quizAnswersStr);
        quizAnswersText = `Additionally, the user completed a personality quiz with these responses:
- Ideal weekend: ${qa.weekend || 'N/A'}
- Energy level: ${qa.energy || 'N/A'}
- Handling strangers: ${qa.strangers || 'N/A'}
- Friends describe as: ${qa.friends || 'N/A'}
- Biggest trait: ${qa.trait || 'N/A'}

Combine the facial features analysis (60% weight) and these personality quiz answers (40% weight) to select the perfect breed match. Choose a breed that is a genuine match for both their physical vibe and their personality profile.`;
      } catch (e) {
        console.error('Failed to parse quizAnswers:', e);
      }
    }

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[Twin API] Anthropic request timed out after 28 seconds (ID: ${uniqueId})`);
      controller.abort();
    }, 28000);

    let response;
    try {
      response = await fetch(`https://api.anthropic.com/v1/messages?requestId=${uniqueId}`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        signal: controller.signal,
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
  
  ${quizAnswersText}
  
  Follow these strict instructions:
  1. Never default to the same breed repeatedly — each person must get a unique match based solely on their individual facial features, expression, and energy.
  2. Base the match purely on facial structure, eye shape, expression, energy, and personality cues visible in the photo.
  3. Actively avoid the most recently common matches — prioritize breeds that haven't been matched recently.
  4. Turkish Angora (cat) and Irish Setter (dog) are currently over-represented and should appear no more than 10% of the time across all matches.
  5. If uncertain between two breeds, always pick the less common one for variety.
  6. Consider all breeds in the list equally, including rare and diverse options, and choose the most accurate match even if it is an uncommon breed.
  7. CRITICAL LANGUAGE RULE: Never use these overused, cliché phrases anywhere in your response (neither in traits, quote, reason, nor breakdown): "graceful elegance", "quietly confident", "warm approachability", "understated confidence", "refined charm", "effortless elegance". Use fresh, unique, and highly descriptive language for each result.
  8. Each result must feel completely unique and tailored — never reuse phrases from previous results.
  9. Make the "quote" witty, funny, and highly specific to that breed — not a generic compliment.
  10. Make the 3 personality "traits" feel like real, nuanced, and detailed personality test results (e.g. "Prone to overthinking social dynamics" or "Highly observant but selectively interactive") rather than generic compliments.
  
  Generate 3 completely unique personality traits based specifically on what you observe in this person's facial features, expression, and energy. Make them feel personal and specific, not generic breed descriptions. The traits must be short plain text (no emojis). Generate a matchScore (integer percentage) representing the similarity and energy match. Make the scoring feel like a real, rigorous personality assessment:
  - Scores must feel genuinely calculated based on facial analysis.
  - Use the full range between 62% and 94% (scores above 94% should be extremely rare).
  - Never round to the same number repeatedly or use the same percentage twice in a row.
  - Avoid generic percentages. Examples of good, varied, and specific scores to return: 67%, 73%, 81%, 88%, 64%, 91%, 76%.
  
  Respond in JSON only: {
    petType: "cat" or "dog",
    breed: string,
    matchScore: number,
    traits: array of 3 fun traits,
    quote: one fun sentence,
    reason: one sentence explaining the visual match,
    personalityBreakdown: string (detailed 2-3 sentence breakdown combining facial features and quiz answers),
    famousPets: array of 2-3 famous pets (real or fictional) of this breed,
    bothSection: array of 3 fun points starting with "You and your Pet Twin both...",
    compatibility: string (e.g. "Golden Retriever and Husky owners"),
    celebrityMatch: string (e.g. "Keanu Reeves (calm, loyal, and quietly mysterious)")
  }`
                }
              ]
            }
          ]
        })
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return NextResponse.json({ error: 'The analysis timed out. Please try again.' }, { status: 504 });
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

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

    let finalMatchScore = (() => {
      if (result.matchScore && typeof result.matchScore === 'number') {
        return result.matchScore;
      }
      return generateFallbackScore();
    })();

    // Ensure no two consecutive responses have the exact same score
    if (lastReturnedScore !== null && finalMatchScore === lastReturnedScore) {
      const offset = Math.random() < 0.5 ? 1 : -1;
      finalMatchScore += offset;
      if (finalMatchScore < 62) finalMatchScore = 63;
      if (finalMatchScore > 96) finalMatchScore = 95;
    }
    lastReturnedScore = finalMatchScore;

    return NextResponse.json({
      success: true,
      breed: result.breed,
      petType: result.petType,
      matchScore: finalMatchScore,
      traits: cleanTraits.length >= 3 ? cleanTraits : ["Charming", "Friendly", "Warm"],
      quote: result.quote || "A perfect match for your one-of-a-kind personality!",
      reason: result.reason || '',
      unsplashImageUrl,
      personalityBreakdown: result.personalityBreakdown || "A beautiful combination of features and personality traits.",
      famousPets: result.famousPets || [],
      bothSection: result.bothSection || [],
      compatibility: result.compatibility || "other pet owners",
      celebrityMatch: result.celebrityMatch || "A well-known figure with a matching vibe"
    });

  } catch (error: any) {
    console.error('Twin API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process image' }, { status: 500 });
  }
}
