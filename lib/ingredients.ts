export type IngredientCategory = 'dangerous' | 'questionable' | 'good' | 'neutral';

export interface IngredientInfo {
  name: string;
  category: IngredientCategory;
  reason: string;
  effects: string;
}

export const ingredientDatabase: IngredientInfo[] = [
  // 🔴 DANGEROUS
  {
    name: 'Xylitol',
    category: 'dangerous',
    reason: 'Artificial sweetener extremely toxic to dogs',
    effects: 'Causes rapid insulin release, leading to liver failure and dangerous blood sugar drops.'
  },
  {
    name: 'BHA',
    category: 'dangerous',
    reason: 'Synthetic chemical preservative (Butylated Hydroxyanisole)',
    effects: 'Classified as a potential carcinogen by the WHO and California.'
  },
  {
    name: 'Butylated Hydroxyanisole',
    category: 'dangerous',
    reason: 'Synthetic chemical preservative (BHA)',
    effects: 'Potential carcinogen and known endocrine disruptor.'
  },
  {
    name: 'BHT',
    category: 'dangerous',
    reason: 'Synthetic chemical preservative (Butylated Hydroxytoluene)',
    effects: 'Linked to organ system toxicity and potential cancer risk.'
  },
  {
    name: 'Butylated Hydroxytoluene',
    category: 'dangerous',
    reason: 'Synthetic chemical preservative (BHT)',
    effects: 'Potential carcinogen; banned in some countries.'
  },
  {
    name: 'Ethoxyquin',
    category: 'dangerous',
    reason: 'Chemical preservative banned in human food in the EU',
    effects: 'Linked to liver damage and kidney issues.'
  },
  {
    name: 'Propylene Glycol',
    category: 'dangerous',
    reason: 'Chemical used to maintain moisture',
    effects: 'Causes Heinz body anemia in cats by damaging red blood cells.'
  },
  {
    name: 'Onion Powder',
    category: 'dangerous',
    reason: 'Highly concentrated toxic plant compound',
    effects: 'Destroys red blood cells, causing severe anemia.'
  },
  {
    name: 'Garlic Powder',
    category: 'dangerous',
    reason: 'Toxic in concentrated amounts',
    effects: 'Damages red blood cells and can cause oxidative damage.'
  },
  {
    name: 'Sodium Nitrite',
    category: 'dangerous',
    reason: 'Preservative for color and stability',
    effects: 'Linked to the formation of cancer-causing nitrosamines.'
  },
  {
    name: 'Red 40',
    category: 'dangerous',
    reason: 'Artificial food dye',
    effects: 'Linked to hyperactivity and potential carcinogenicity.'
  },
  {
    name: 'Yellow 5',
    category: 'dangerous',
    reason: 'Artificial food dye',
    effects: 'May cause allergic reactions and linked to behavioral issues.'
  },
  {
    name: 'Yellow 6',
    category: 'dangerous',
    reason: 'Artificial food dye',
    effects: 'Linked to adrenal tumors and hyperactivity.'
  },
  {
    name: 'Blue 2',
    category: 'dangerous',
    reason: 'Artificial food dye',
    effects: 'Linked to brain tumors in animal studies.'
  },
  {
    name: 'Carrageenan',
    category: 'dangerous',
    reason: 'Thickener derived from seaweed',
    effects: 'Linked to intestinal inflammation and cancer in studies.'
  },
  {
    name: 'Menadione',
    category: 'dangerous',
    reason: 'Synthetic Vitamin K3',
    effects: 'Banned from human use due to liver damage and red blood cell breakdown.'
  },
  {
    name: 'Vitamin K3',
    category: 'dangerous',
    reason: 'Synthetic vitamin (Menadione)',
    effects: 'Linked to liver toxicity and immune system issues.'
  },

  // 🟡 QUESTIONABLE
  {
    name: 'Corn Syrup',
    category: 'questionable',
    reason: 'Unnecessary sugar filler',
    effects: 'Causes weight gain, obesity, and increases diabetes risk.'
  },
  {
    name: 'Meat By-Products',
    category: 'questionable',
    reason: 'Vague, low-quality animal parts',
    effects: 'Often includes parts not fit for human consumption; unknown quality.'
  },
  {
    name: 'Animal Digest',
    category: 'questionable',
    reason: 'Rendered chemical "soup" of animal parts',
    effects: 'Unknown animal sources; may contain contaminants.'
  },
  {
    name: 'Brewers Rice',
    category: 'questionable',
    reason: 'Low-nutrition rice fragments',
    effects: 'Nutritionally empty filler leftover from beer brewing.'
  },
  {
    name: 'Corn Gluten Meal',
    category: 'questionable',
    reason: 'Cheap plant-based protein filler',
    effects: 'Low bioavailability; often used to artificially boost protein count.'
  },
  {
    name: 'Soy Protein',
    category: 'questionable',
    reason: 'Common allergen and often GMO',
    effects: 'Can cause digestive distress and allergic reactions in sensitive pets.'
  },
  {
    name: 'Artificial Flavors',
    category: 'questionable',
    reason: 'Vague chemical compounds',
    effects: 'Unknown composition; can hide low-quality ingredients.'
  },
  {
    name: 'MSG',
    category: 'questionable',
    reason: 'Flavor enhancer (Monosodium Glutamate)',
    effects: 'Can cause behavioral issues and allergic reactions.'
  },
  {
    name: 'Monosodium Glutamate',
    category: 'questionable',
    reason: 'Flavor enhancer',
    effects: 'Potential neurotoxin; hides poor quality ingredients.'
  },
  {
    name: 'Cellulose',
    category: 'questionable',
    reason: 'Inexpensive fiber source (often wood pulp)',
    effects: 'Low-quality filler that provides zero nutrition.'
  },
  {
    name: 'Rendered Fat',
    category: 'questionable',
    reason: 'Vague source of animal fat',
    effects: 'May contain contaminants from 4-D animals (Dead, Dying, Diseased, Disabled).'
  },
  {
    name: 'Calcium Propionate',
    category: 'questionable',
    reason: 'Mold inhibitor',
    effects: 'Linked to behavioral issues and sleep disturbances.'
  },

  // 🟢 GOOD
  {
    name: 'Chicken',
    category: 'good',
    reason: 'High-quality named protein',
    effects: 'Excellent source of essential amino acids for muscle health.'
  },
  {
    name: 'Beef',
    category: 'good',
    reason: 'High-quality named protein',
    effects: 'Rich in iron and B-vitamins.'
  },
  {
    name: 'Salmon',
    category: 'good',
    reason: 'High-quality named protein',
    effects: 'Rich in omega-3 fatty acids for skin and coat.'
  },
  {
    name: 'Turkey',
    category: 'good',
    reason: 'High-quality named protein',
    effects: 'Lean protein source, good for weight management.'
  },
  {
    name: 'Sweet Potato',
    category: 'good',
    reason: 'Complex, healthy carbohydrate',
    effects: 'High in fiber and vitamins A, B6, and C.'
  },
  {
    name: 'Blueberries',
    category: 'good',
    reason: 'Antioxidant powerhouse',
    effects: 'Supports brain health and immune system.'
  },
  {
    name: 'Flaxseed',
    category: 'good',
    reason: 'Omega-3 fatty acid source',
    effects: 'Promotes heart health and shiny coat.'
  },
  {
    name: 'Probiotics',
    category: 'good',
    reason: 'Beneficial gut bacteria',
    effects: 'Supports digestive health and nutrient absorption.'
  },
  {
    name: 'Lactobacillus',
    category: 'good',
    reason: 'Targeted probiotic strain',
    effects: 'Improves gut flora balance.'
  },
  {
    name: 'Glucosamine',
    category: 'good',
    reason: 'Joint health supplement',
    effects: 'Helps maintain cartilage and mobility.'
  },
  {
    name: 'Chondroitin',
    category: 'good',
    reason: 'Joint health supplement',
    effects: 'Supports joint lubrication and health.'
  },
  {
    name: 'Pumpkin',
    category: 'good',
    reason: 'Fiber and digestive aid',
    effects: 'Helps regulate digestion and stool quality.'
  },
  {
    name: 'Salmon Oil',
    category: 'good',
    reason: 'Concentrated Omega-3s',
    effects: 'Anti-inflammatory properties, supports brain development.'
  },
  {
    name: 'Vitamin E',
    category: 'good',
    reason: 'Natural antioxidant and preservative',
    effects: 'Protects cells from damage and preserves food naturally.'
  },
  {
    name: 'Tocopherols',
    category: 'good',
    reason: 'Natural preservative (Vitamin E source)',
    effects: 'Safest way to preserve pet food without chemicals.'
  },
  {
    name: 'Cranberries',
    category: 'good',
    reason: 'Urinary tract support',
    effects: 'Prevents bacteria from adhering to the bladder wall.'
  }
];
