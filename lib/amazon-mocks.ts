import { AmazonProduct } from './amazon';

export const MOCK_AMAZON_PRODUCTS: Record<string, AmazonProduct[]> = {
  'dog food': [
    {
      asin: 'B003M5TG28',
      title: 'Royal Canin Size Health Nutrition Small Adult Dry Dog Food',
      url: 'https://www.amazon.com/dp/B003M5TG28?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/71Xm3Q8H8fL._AC_SL1500_.jpg',
      price: '$46.99',
      priceRaw: 4699,
      rating: 4.8,
      reviewCount: 15234,
      isPrime: true
    },
    {
      asin: 'B009B87TKG',
      title: "Hill's Science Diet Adult Sensitive Stomach & Skin, Chicken Recipe Dry Dog Food",
      url: 'https://www.amazon.com/dp/B009B87TKG?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/81xU+c8V+fL._AC_SL1500_.jpg',
      price: '$74.99',
      priceRaw: 7499,
      rating: 4.7,
      reviewCount: 22105,
      isPrime: true
    },
    {
      asin: 'B000G002WM',
      title: 'Blue Buffalo Life Protection Formula Adult Chicken & Brown Rice Recipe Dry Dog Food',
      url: 'https://www.amazon.com/dp/B000G002WM?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/81+20F1GbdL._AC_SL1500_.jpg',
      price: '$60.98',
      priceRaw: 6098,
      rating: 4.6,
      reviewCount: 38450,
      isPrime: true
    },
    {
      asin: 'B001VIWHYK',
      title: 'Purina Pro Plan High Protein Dog Food With Probiotics for Dogs, Shredded Blend Chicken & Rice Formula',
      url: 'https://www.amazon.com/dp/B001VIWHYK?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/81PjX3r6LcL._AC_SL1500_.jpg',
      price: '$52.48',
      priceRaw: 5248,
      rating: 4.7,
      reviewCount: 29800,
      isPrime: true
    }
  ],
  'cat food': [
    {
      asin: 'B000WFKPA2',
      title: 'Royal Canin Feline Health Nutrition Indoor Adult Dry Cat Food',
      url: 'https://www.amazon.com/dp/B000WFKPA2?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/71pE1fM8sPL._AC_SL1500_.jpg',
      price: '$41.99',
      priceRaw: 4199,
      rating: 4.8,
      reviewCount: 14200,
      isPrime: true
    },
    {
      asin: 'B000084F66',
      title: 'Purina Fancy Feast Poultry & Beef Feast Collection Wet Cat Food Variety Pack',
      url: 'https://www.amazon.com/dp/B000084F66?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/81L9YvN+q6L._AC_SL1500_.jpg',
      price: '$21.50',
      priceRaw: 2150,
      rating: 4.8,
      reviewCount: 52100,
      isPrime: true
    },
    {
      asin: 'B000B229V2',
      title: 'Blue Buffalo Indoor Health Natural Adult Dry Cat Food, Chicken & Brown Rice',
      url: 'https://www.amazon.com/dp/B000B229V2?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/81Zf9g+O+cL._AC_SL1500_.jpg',
      price: '$38.98',
      priceRaw: 3898,
      rating: 4.7,
      reviewCount: 18950,
      isPrime: true
    },
    {
      asin: 'B002CJITSU',
      title: "Purina Friskies Wet Cat Food Variety Pack, Surfin' & Turfin' Prime Filets",
      url: 'https://www.amazon.com/dp/B002CJITSU?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/81mD0Xw8DPL._AC_SL1500_.jpg',
      price: '$26.48',
      priceRaw: 2648,
      rating: 4.6,
      reviewCount: 35600,
      isPrime: true
    }
  ],
  'dog toys': [
    {
      asin: 'B0002AR0I8',
      title: 'KONG - Classic Dog Toy - Durable Natural Rubber - Fun to Chew, Chase and Fetch',
      url: 'https://www.amazon.com/dp/B0002AR0I8?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/71F7X2kRkOL._AC_SL1500_.jpg',
      price: '$13.99',
      priceRaw: 1399,
      rating: 4.5,
      reviewCount: 85200,
      isPrime: true
    },
    {
      asin: 'B000F4AVPA',
      title: 'Chuckit! Ultra Ball Dog Toy, Medium (2.5 Inch) - 2 Pack',
      url: 'https://www.amazon.com/dp/B000F4AVPA?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/71r9W2b8+kL._AC_SL1500_.jpg',
      price: '$6.89',
      priceRaw: 689,
      rating: 4.8,
      reviewCount: 125400,
      isPrime: true
    },
    {
      asin: 'B000084E6V',
      title: 'Nylabone Power Chew Textured Dog Chew Ring Toy',
      url: 'https://www.amazon.com/dp/B000084E6V?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/71Bf8OQY4cL._AC_SL1500_.jpg',
      price: '$8.49',
      priceRaw: 849,
      rating: 4.4,
      reviewCount: 22100,
      isPrime: true
    },
    {
      asin: 'B00P0YQYYW',
      title: 'ZippyPaws - Skinny Peltz No Stuffing Squeaky Plush Dog Toy',
      url: 'https://www.amazon.com/dp/B00P0YQYYW?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/71P4qB0t1yL._AC_SL1500_.jpg',
      price: '$14.99',
      priceRaw: 1499,
      rating: 4.6,
      reviewCount: 45800,
      isPrime: true
    }
  ],
  'cat toys': [
    {
      asin: 'B000F9JJJE',
      title: 'GoCat Da Bird Pull Apart Rod and Bird Action Cat Toy',
      url: 'https://www.amazon.com/dp/B000F9JJJE?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/51wXw07rPQL._AC_SL1200_.jpg',
      price: '$9.95',
      priceRaw: 995,
      rating: 4.6,
      reviewCount: 14500,
      isPrime: true
    },
    {
      asin: 'B0002AR18C',
      title: 'KONG - Kickeroo Cuddler - Interactive Cat Toy with Premium Catnip',
      url: 'https://www.amazon.com/dp/B0002AR18C?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/71k+fD1sC4L._AC_SL1500_.jpg',
      price: '$6.99',
      priceRaw: 699,
      rating: 4.5,
      reviewCount: 24300,
      isPrime: true
    },
    {
      asin: 'B0011UQ2SE',
      title: 'SmartyKat Skitter Critters Catnip Cat Toys',
      url: 'https://www.amazon.com/dp/B0011UQ2SE?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/81xU+c8V+fL._AC_SL1500_.jpg',
      price: '$3.99',
      priceRaw: 399,
      rating: 4.5,
      reviewCount: 48900,
      isPrime: true
    },
    {
      asin: 'B00OTJJY3W',
      title: 'Petstages Tower of Tracks Cat Toy - 3 Levels of Interactive Play',
      url: 'https://www.amazon.com/dp/B00OTJJY3W?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/81O10vJ1EHL._AC_SL1500_.jpg',
      price: '$10.99',
      priceRaw: 1099,
      rating: 4.7,
      reviewCount: 52400,
      isPrime: true
    }
  ],
  'cat litter': [
    {
      asin: 'B0014B1UDS',
      title: 'Fresh Step Advanced Clumping Cat Litter, Multi-Cat Extra Unscented',
      url: 'https://www.amazon.com/dp/B0014B1UDS?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/81Q6n+C7g4L._AC_SL1500_.jpg',
      price: '$24.49',
      priceRaw: 2449,
      rating: 4.6,
      reviewCount: 31200,
      isPrime: true
    },
    {
      asin: 'B000084E6Y',
      title: 'Arm & Hammer Clump & Seal Platinum Cat Litter',
      url: 'https://www.amazon.com/dp/B000084E6Y?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/81gC+uM6wGL._AC_SL1500_.jpg',
      price: '$32.99',
      priceRaw: 3299,
      rating: 4.7,
      reviewCount: 41500,
      isPrime: true
    },
    {
      asin: 'B001BOPN2C',
      title: "World's Best Cat Litter, Multiple Cat Unscented, 28 lb",
      url: 'https://www.amazon.com/dp/B001BOPN2C?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/81a+qY6P4xL._AC_SL1500_.jpg',
      price: '$34.99',
      priceRaw: 3499,
      rating: 4.5,
      reviewCount: 22800,
      isPrime: true
    },
    {
      asin: 'B01M3W0UYZ',
      title: 'Purina Tidy Cats Lightweight Clumping Cat Litter, Multi Cat',
      url: 'https://www.amazon.com/dp/B01M3W0UYZ?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/81PjX3r6LcL._AC_SL1500_.jpg',
      price: '$21.48',
      priceRaw: 2148,
      rating: 4.7,
      reviewCount: 37900,
      isPrime: true
    }
  ],
  'dog supplements': [
    {
      asin: 'B01CVOA20E',
      title: 'Zesty Paws Allergy Immune Supplement for Dogs',
      url: 'https://www.amazon.com/dp/B01CVOA20E?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/71x+YV6N1rL._AC_SL1500_.jpg',
      price: '$29.97',
      priceRaw: 2997,
      rating: 4.5,
      reviewCount: 54200,
      isPrime: true
    },
    {
      asin: 'B00028ZLTU',
      title: 'NaturVet - Quiet Moments Calming Aid Dog Supplement',
      url: 'https://www.amazon.com/dp/B00028ZLTU?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/81PjX3r6LcL._AC_SL1500_.jpg',
      price: '$14.99',
      priceRaw: 1499,
      rating: 4.2,
      reviewCount: 31400,
      isPrime: true
    },
    {
      asin: 'B003M5TG28',
      title: 'Nutramax Cosequin Maximum Strength Joint Health Supplement for Dogs',
      url: 'https://www.amazon.com/dp/B003M5TG28?tag=lumobites-20',
      image: 'https://m.media-amazon.com/images/I/81FjE1eA4bL._AC_SL1500_.jpg',
      price: '$39.99',
      priceRaw: 3999,
      rating: 4.7,
      reviewCount: 62800,
      isPrime: true
    }
  ]
};

export function getMockProducts(keyword: string, limit: number = 4): AmazonProduct[] {
  const normalizedKeyword = keyword.toLowerCase();
  
  // Find the closest matching category
  let matchedCategory = 'dog food'; // default
  
  if (normalizedKeyword.includes('cat') && normalizedKeyword.includes('food')) {
    matchedCategory = 'cat food';
  } else if (normalizedKeyword.includes('cat') && normalizedKeyword.includes('toy')) {
    matchedCategory = 'cat toys';
  } else if (normalizedKeyword.includes('cat') && normalizedKeyword.includes('litter')) {
    matchedCategory = 'cat litter';
  } else if (normalizedKeyword.includes('dog') && normalizedKeyword.includes('toy')) {
    matchedCategory = 'dog toys';
  } else if (normalizedKeyword.includes('dog') && (normalizedKeyword.includes('supplement') || normalizedKeyword.includes('health'))) {
    matchedCategory = 'dog supplements';
  } else if (normalizedKeyword.includes('dog') && normalizedKeyword.includes('food')) {
    matchedCategory = 'dog food';
  } else {
    // Basic fallback matching across keys
    for (const category of Object.keys(MOCK_AMAZON_PRODUCTS)) {
      if (normalizedKeyword.includes(category) || category.includes(normalizedKeyword.split(' ')[0])) {
        matchedCategory = category;
        break;
      }
    }
  }

  const products = MOCK_AMAZON_PRODUCTS[matchedCategory] || MOCK_AMAZON_PRODUCTS['dog food'];
  return products.slice(0, limit);
}
