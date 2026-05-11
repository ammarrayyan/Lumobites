import { Product } from './types';

// Minimal safety net of 12 real, verified US pet food products.
// This is ONLY used if the Open Pet Food Facts API is completely unreachable.
export const seedProducts: Product[] = [
  // DOG FOOD
  {
    id: 'fallback_d1', product_name: 'Purina Pro Plan Adult Shredded Blend Chicken & Rice Formula Dry Dog Food', brand: 'Purina Pro Plan', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Chicken, Rice, Whole Grain Wheat, Poultry By-Product Meal, Soybean Meal, Beef Fat Preserved with Mixed-Tocopherols, Corn Gluten Meal, Whole Grain Corn', protein_pct: 26, fat_pct: 16, fiber_pct: 3,
    health_tags: ['sensitive_stomach'], pros: 'High quality protein, contains probiotics.', cons: 'Contains some corn and wheat.',
    price_monthly_low: 45, price_monthly_high: 65, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Purina+Pro+Plan+Adult+Shredded+Blend+Chicken' },
    available_at: ['Amazon', 'Chewy', 'Petco'], recall_history: false
  },
  {
    id: 'fallback_d2', product_name: 'Hill\'s Science Diet Adult Sensitive Stomach & Skin Chicken Recipe Dry Dog Food', brand: 'Hill\'s Science Diet', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Chicken, Brewers Rice, Chicken Meal, Yellow Peas, Cracked Pearled Barley, Whole Grain Sorghum, Egg Product, Chicken Fat', protein_pct: 20, fat_pct: 13, fiber_pct: 4,
    health_tags: ['sensitive_stomach', 'allergies'], pros: 'Highly digestible, supports skin health.', cons: 'Pricey for the protein content.',
    price_monthly_low: 50, price_monthly_high: 70, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Hills+Science+Diet+Adult+Sensitive+Stomach+Skin' },
    available_at: ['Amazon', 'Chewy', 'PetSmart'], recall_history: false
  },
  {
    id: 'fallback_d3', product_name: 'Orijen Original Grain-Free Dry Dog Food', brand: 'Orijen', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Chicken, Turkey, Flounder, Whole Mackerel, Chicken Liver, Turkey Giblets, Chicken Heart, Whole Herring', protein_pct: 38, fat_pct: 18, fiber_pct: 4,
    health_tags: ['picky_eater'], pros: 'Extremely high protein, fresh meat, grain-free.', cons: 'Very expensive, can be too rich for some dogs.',
    price_monthly_low: 80, price_monthly_high: 110, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Orijen+Original+Grain-Free+Dry+Dog+Food' },
    available_at: ['Amazon', 'Petco', 'Local Pet Stores'], recall_history: false
  },
  {
    id: 'fallback_d4', product_name: 'Taste of the Wild High Prairie Grain-Free Dry Dog Food', brand: 'Taste of the Wild', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Water Buffalo, Lamb Meal, Chicken Meal, Sweet Potatoes, Peas, Potatoes, Chicken Fat, Egg Product, Roasted Bison', protein_pct: 32, fat_pct: 18, fiber_pct: 4,
    health_tags: ['allergies'], pros: 'Novel proteins, grain-free, affordable premium.', cons: 'High legume content.',
    price_monthly_low: 50, price_monthly_high: 70, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Taste+of+the+Wild+High+Prairie' },
    available_at: ['Amazon', 'Chewy', 'Tractor Supply'], recall_history: false
  },
  {
    id: 'fallback_d5', product_name: 'Pedigree Adult Complete Nutrition Roasted Chicken, Rice & Vegetable Flavor Dry Dog Food', brand: 'Pedigree', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Ground Whole Grain Corn, Meat And Bone Meal, Corn Gluten Meal, Animal Fat, Soybean Meal, Chicken By-Product Meal', protein_pct: 21, fat_pct: 10, fiber_pct: 4,
    health_tags: [], pros: 'Very affordable and widely available.', cons: 'Corn is the first ingredient, lower quality proteins.',
    price_monthly_low: 15, price_monthly_high: 25, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Pedigree+Adult+Complete+Nutrition' },
    available_at: ['Amazon', 'Walmart', 'Target'], recall_history: false
  },
  {
    id: 'fallback_d6', product_name: 'Blue Buffalo Life Protection Formula Adult Chicken & Brown Rice Recipe Dry Dog Food', brand: 'Blue Buffalo', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Deboned Chicken, Chicken Meal, Brown Rice, Barley, Oatmeal, Pea Starch, Flaxseed, Chicken Fat', protein_pct: 24, fat_pct: 14, fiber_pct: 5,
    health_tags: ['joint'], pros: 'No corn, wheat, or soy. Contains LifeSource bits.', cons: 'Some dogs dislike the LifeSource bits.',
    price_monthly_low: 45, price_monthly_high: 65, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Blue+Buffalo+Life+Protection+Formula+Adult+Chicken' },
    available_at: ['Amazon', 'Chewy', 'Petco'], recall_history: false
  },

  // CAT FOOD
  {
    id: 'fallback_c1', product_name: 'Purina ONE Indoor Advantage Adult Dry Cat Food', brand: 'Purina ONE', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Turkey, Chicken By-Product Meal, Rice, Corn Gluten Meal, Soybean Meal, Whole Grain Corn, Soy Protein Isolate', protein_pct: 38, fat_pct: 8.5, fiber_pct: 4.3,
    health_tags: ['weight_control'], pros: 'High protein, affordable, helps with hairballs.', cons: 'Contains corn and soy.',
    price_monthly_low: 20, price_monthly_high: 35, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Purina+ONE+Indoor+Advantage+Adult+Dry+Cat+Food' },
    available_at: ['Amazon', 'Walmart', 'Target'], recall_history: false
  },
  {
    id: 'fallback_c2', product_name: 'Hill\'s Science Diet Adult Indoor Chicken Recipe Dry Cat Food', brand: 'Hill\'s Science Diet', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Chicken, Whole Grain Wheat, Corn Gluten Meal, Powdered Cellulose, Chicken Fat, Wheat Gluten, Chicken Meal', protein_pct: 31, fat_pct: 13, fiber_pct: 6,
    health_tags: ['weight_control'], pros: 'Vet recommended, good for indoor cats.', cons: 'High carbohydrate content.',
    price_monthly_low: 35, price_monthly_high: 50, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Hills+Science+Diet+Adult+Indoor+Chicken+Cat' },
    available_at: ['Amazon', 'PetSmart', 'Chewy'], recall_history: false
  },
  {
    id: 'fallback_c3', product_name: 'Fancy Feast Classic Pate Poultry & Beef Collection Variety Pack Canned Cat Food', brand: 'Fancy Feast', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Chicken, Poultry Broth, Liver, Meat By-Products, Fish, Artificial And Natural Flavors', protein_pct: 10, fat_pct: 5, fiber_pct: 1.5,
    health_tags: ['picky_eater'], pros: 'Very palatable, high moisture, affordable wet food.', cons: 'Contains meat by-products.',
    price_monthly_low: 25, price_monthly_high: 40, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Fancy+Feast+Classic+Pate+Poultry+Beef' },
    available_at: ['Amazon', 'Walmart', 'Target'], recall_history: false
  },
  {
    id: 'fallback_c4', product_name: 'Orijen Guardian 8 Grain-Free Dry Cat Food', brand: 'Orijen', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Chicken, Salmon, Turkey, Whole Herring, Whole Mackerel, Chicken Liver, Turkey Giblets', protein_pct: 40, fat_pct: 18, fiber_pct: 4,
    health_tags: ['picky_eater'], pros: 'Premium ingredients, incredibly high protein.', cons: 'Expensive.',
    price_monthly_low: 55, price_monthly_high: 80, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Orijen+Guardian+8+Grain-Free+Dry+Cat+Food' },
    available_at: ['Amazon', 'Petco', 'Chewy'], recall_history: false
  },
  {
    id: 'fallback_c5', product_name: 'Wellness CORE Grain-Free Indoor Chicken & Turkey Recipe Dry Cat Food', brand: 'Wellness', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Deboned Chicken, Chicken Meal, Turkey Meal, Peas, Potatoes, Tomato Pomace, Chicken Fat', protein_pct: 38, fat_pct: 12, fiber_pct: 5,
    health_tags: ['weight_control'], pros: 'Grain-free, high protein, lower fat for indoor cats.', cons: 'Pricier than average.',
    price_monthly_low: 40, price_monthly_high: 60, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Wellness+CORE+Grain-Free+Indoor+Cat' },
    available_at: ['Amazon', 'PetSmart', 'Chewy'], recall_history: false
  },
  {
    id: 'fallback_c6', product_name: 'Tiki Cat Luau Wet Cat Food Variety Pack', brand: 'Tiki Cat', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Chicken, Chicken Broth, Sunflower Seed Oil, Tricalcium Phosphate, Tuna, Salmon', protein_pct: 14, fat_pct: 2, fiber_pct: 0.5,
    health_tags: ['picky_eater', 'sensitive_stomach'], pros: 'Real shredded meat, high moisture, very low carbs.', cons: 'Expensive to feed as sole diet.',
    price_monthly_low: 60, price_monthly_high: 90, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Tiki+Cat+Luau+Wet+Cat+Food+Variety+Pack' },
    available_at: ['Amazon', 'Petco', 'Chewy'], recall_history: false
  }
];
