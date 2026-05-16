import { Product } from './types';

// Safety net of real, verified US pet food products.
// Used ONLY if Open Pet Food Facts API is completely unreachable.
// Each product MUST have food_type set so the wet/dry filter works.
export const seedProducts: Product[] = [

  // ── DRY DOG FOOD ────────────────────────────────────────────────────────────
  {
    id: 'fallback_d1', product_name: 'Purina Pro Plan Adult Shredded Blend Chicken & Rice Dry Dog Food',
    brand: 'Purina Pro Plan', pet_type: 'dog', life_stage: 'adult', food_type: 'dry',
    ingredients: 'Chicken, Rice, Whole Grain Wheat, Poultry By-Product Meal, Soybean Meal, Beef Fat, Corn Gluten Meal, Whole Grain Corn',
    protein_pct: 26, fat_pct: 16, fiber_pct: 3,
    health_tags: ['sensitive_stomach'], pros: 'High quality protein, contains probiotics.', cons: 'Contains some corn and wheat.',
    price_monthly_low: 45, price_monthly_high: 65, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Purina+Pro+Plan+Adult+Shredded+Blend+Chicken+dog+food&tag=lumobites-20' },
    available_at: ['Amazon', 'Chewy', 'Petco'], recall_history: false
  },
  {
    id: 'fallback_d2', product_name: "Hill's Science Diet Adult Sensitive Stomach & Skin Chicken Dry Dog Food",
    brand: "Hill's Science Diet", pet_type: 'dog', life_stage: 'adult', food_type: 'dry',
    ingredients: 'Chicken, Brewers Rice, Chicken Meal, Yellow Peas, Cracked Pearled Barley, Whole Grain Sorghum, Egg Product, Chicken Fat',
    protein_pct: 20, fat_pct: 13, fiber_pct: 4,
    health_tags: ['sensitive_stomach', 'allergies'], pros: 'Highly digestible, supports skin health.', cons: 'Pricey for the protein content.',
    price_monthly_low: 50, price_monthly_high: 70, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Hills+Science+Diet+Adult+Sensitive+Stomach+dog+food&tag=lumobites-20' },
    available_at: ['Amazon', 'Chewy', 'PetSmart'], recall_history: false
  },
  {
    id: 'fallback_d3', product_name: 'Orijen Original Grain-Free Dry Dog Food',
    brand: 'Orijen', pet_type: 'dog', life_stage: 'adult', food_type: 'dry',
    ingredients: 'Chicken, Turkey, Flounder, Whole Mackerel, Chicken Liver, Turkey Giblets, Chicken Heart, Whole Herring',
    protein_pct: 38, fat_pct: 18, fiber_pct: 4,
    health_tags: ['picky_eater'], pros: 'Extremely high protein, fresh meat, grain-free.', cons: 'Very expensive, can be too rich for some dogs.',
    price_monthly_low: 80, price_monthly_high: 110, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Orijen+Original+Grain-Free+dog+food&tag=lumobites-20' },
    available_at: ['Amazon', 'Petco', 'Local Pet Stores'], recall_history: false
  },
  {
    id: 'fallback_d4', product_name: 'Taste of the Wild High Prairie Grain-Free Dry Dog Food',
    brand: 'Taste of the Wild', pet_type: 'dog', life_stage: 'adult', food_type: 'dry',
    ingredients: 'Water Buffalo, Lamb Meal, Chicken Meal, Sweet Potatoes, Peas, Potatoes, Chicken Fat, Egg Product, Roasted Bison',
    protein_pct: 32, fat_pct: 18, fiber_pct: 4,
    health_tags: ['allergies'], pros: 'Novel proteins, grain-free, affordable premium.', cons: 'High legume content.',
    price_monthly_low: 50, price_monthly_high: 70, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Taste+of+the+Wild+High+Prairie+dog+food&tag=lumobites-20' },
    available_at: ['Amazon', 'Chewy', 'Tractor Supply'], recall_history: false
  },
  {
    id: 'fallback_d5', product_name: 'Pedigree Adult Complete Nutrition Roasted Chicken Dry Dog Food',
    brand: 'Pedigree', pet_type: 'dog', life_stage: 'adult', food_type: 'dry',
    ingredients: 'Ground Whole Grain Corn, Meat And Bone Meal, Corn Gluten Meal, Animal Fat, Soybean Meal, Chicken By-Product Meal',
    protein_pct: 21, fat_pct: 10, fiber_pct: 4,
    health_tags: [], pros: 'Very affordable and widely available.', cons: 'Corn is the first ingredient, lower quality proteins.',
    price_monthly_low: 15, price_monthly_high: 25, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Pedigree+Adult+Complete+Nutrition+dog+food&tag=lumobites-20' },
    available_at: ['Amazon', 'Walmart', 'Target'], recall_history: false
  },
  {
    id: 'fallback_d6', product_name: 'Blue Buffalo Life Protection Formula Adult Chicken & Brown Rice Dry Dog Food',
    brand: 'Blue Buffalo', pet_type: 'dog', life_stage: 'adult', food_type: 'dry',
    ingredients: 'Deboned Chicken, Chicken Meal, Brown Rice, Barley, Oatmeal, Pea Starch, Flaxseed, Chicken Fat',
    protein_pct: 24, fat_pct: 14, fiber_pct: 5,
    health_tags: ['joint'], pros: 'No corn, wheat, or soy. Contains LifeSource bits.', cons: 'Some dogs dislike the LifeSource bits.',
    price_monthly_low: 45, price_monthly_high: 65, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Blue+Buffalo+Life+Protection+Formula+Adult+Chicken+dog+food&tag=lumobites-20' },
    available_at: ['Amazon', 'Chewy', 'Petco'], recall_history: false
  },

  // ── WET DOG FOOD ─────────────────────────────────────────────────────────────
  {
    id: 'fallback_dw1', product_name: 'Purina Pro Plan Adult Classic Chicken & Rice Entree Wet Dog Food',
    brand: 'Purina Pro Plan', pet_type: 'dog', life_stage: 'adult', food_type: 'wet',
    ingredients: 'Chicken, Chicken Broth, Liver, Rice, Meat By-Products, Minerals, Vitamins',
    protein_pct: 9, fat_pct: 5, fiber_pct: 0.5,
    health_tags: ['sensitive_stomach', 'picky_eater'], pros: 'High moisture content, very palatable, easy to digest.', cons: 'Contains meat by-products.',
    price_monthly_low: 55, price_monthly_high: 80, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Purina+Pro+Plan+Adult+Classic+Chicken+Rice+canned+dog+food&tag=lumobites-20' },
    available_at: ['Amazon', 'Chewy', 'Petco'], recall_history: false
  },
  {
    id: 'fallback_dw2', product_name: 'Merrick Grain-Free Wet Dog Food Real Chicken Stew',
    brand: 'Merrick', pet_type: 'dog', life_stage: 'adult', food_type: 'wet',
    ingredients: 'Deboned Chicken, Chicken Broth, Potatoes, Peas, Carrots, Flaxseed Oil, Vitamins and Minerals',
    protein_pct: 10, fat_pct: 4, fiber_pct: 1,
    health_tags: ['allergies', 'picky_eater'], pros: 'Real deboned chicken, grain-free, high moisture.', cons: 'Pricier than average wet food.',
    price_monthly_low: 70, price_monthly_high: 100, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Merrick+Grain-Free+canned+dog+food&tag=lumobites-20' },
    available_at: ['Amazon', 'Chewy', 'Petco'], recall_history: false
  },
  {
    id: 'fallback_dw3', product_name: "Hill's Science Diet Adult Beef & Barley Entree Canned Dog Food",
    brand: "Hill's Science Diet", pet_type: 'dog', life_stage: 'adult', food_type: 'wet',
    ingredients: 'Beef, Beef Broth, Pork Liver, Barley, Carrots, Chicken, Chicken Liver, Egg Product',
    protein_pct: 8, fat_pct: 4.5, fiber_pct: 1,
    health_tags: ['sensitive_stomach'], pros: 'Vet recommended, balanced nutrition, easy to digest.', cons: 'Moderate protein content.',
    price_monthly_low: 50, price_monthly_high: 75, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Hills+Science+Diet+Adult+Beef+Barley+canned+dog+food&tag=lumobites-20' },
    available_at: ['Amazon', 'Chewy', 'PetSmart'], recall_history: false
  },
  {
    id: 'fallback_dw4', product_name: 'Wellness CORE Hearty Cuts Chicken & Turkey Wet Dog Food',
    brand: 'Wellness', pet_type: 'dog', life_stage: 'adult', food_type: 'wet',
    ingredients: 'Chicken, Turkey, Chicken Broth, Chicken Liver, Peas, Carrots, Flaxseed, Blueberries, Vitamins',
    protein_pct: 10, fat_pct: 4, fiber_pct: 1,
    health_tags: ['allergies', 'weight_control'], pros: 'Grain-free, high moisture, no artificial additives.', cons: 'Higher price point.',
    price_monthly_low: 65, price_monthly_high: 90, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Wellness+CORE+Hearty+Cuts+wet+dog+food&tag=lumobites-20' },
    available_at: ['Amazon', 'Chewy', 'Petco'], recall_history: false
  },
  {
    id: 'fallback_dw5', product_name: 'Blue Buffalo Homestyle Recipe Adult Chicken Dinner Canned Dog Food',
    brand: 'Blue Buffalo', pet_type: 'dog', life_stage: 'adult', food_type: 'wet',
    ingredients: 'Chicken, Chicken Broth, Chicken Liver, Whole Barley, Whole Brown Rice, Flaxseed, Carrots, Sweet Potatoes',
    protein_pct: 9, fat_pct: 5, fiber_pct: 1,
    health_tags: ['joint', 'sensitive_stomach'], pros: 'Real chicken, no corn/wheat/soy, contains omega-3.', cons: 'Contains grains.',
    price_monthly_low: 50, price_monthly_high: 75, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Blue+Buffalo+Homestyle+Recipe+Adult+Chicken+canned+dog+food&tag=lumobites-20' },
    available_at: ['Amazon', 'Chewy', 'PetSmart'], recall_history: false
  },
  {
    id: 'fallback_dw6', product_name: 'Royal Canin Adult Loaf in Sauce Wet Dog Food',
    brand: 'Royal Canin', pet_type: 'dog', life_stage: 'adult', food_type: 'wet',
    ingredients: 'Chicken, Pork By-Products, Chicken Broth, Pork, Rice, Chicken Liver, Egg, Salmon',
    protein_pct: 8.5, fat_pct: 5, fiber_pct: 1.5,
    health_tags: ['sensitive_stomach', 'picky_eater'], pros: 'Very palatable, easy to digest, high moisture.', cons: 'Contains pork by-products.',
    price_monthly_low: 55, price_monthly_high: 80, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Royal+Canin+Adult+Loaf+Sauce+wet+dog+food&tag=lumobites-20' },
    available_at: ['Amazon', 'Chewy', 'Petco'], recall_history: false
  },

  // ── DRY CAT FOOD ─────────────────────────────────────────────────────────────
  {
    id: 'fallback_c1', product_name: 'Purina ONE Indoor Advantage Adult Dry Cat Food',
    brand: 'Purina ONE', pet_type: 'cat', life_stage: 'adult', food_type: 'dry',
    ingredients: 'Turkey, Chicken By-Product Meal, Rice, Corn Gluten Meal, Soybean Meal, Whole Grain Corn, Soy Protein Isolate',
    protein_pct: 38, fat_pct: 8.5, fiber_pct: 4.3,
    health_tags: ['weight_control'], pros: 'High protein, affordable, helps with hairballs.', cons: 'Contains corn and soy.',
    price_monthly_low: 20, price_monthly_high: 35, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Purina+ONE+Indoor+Advantage+cat+food&tag=lumobites-20' },
    available_at: ['Amazon', 'Walmart', 'Target'], recall_history: false
  },
  {
    id: 'fallback_c2', product_name: "Hill's Science Diet Adult Indoor Chicken Recipe Dry Cat Food",
    brand: "Hill's Science Diet", pet_type: 'cat', life_stage: 'adult', food_type: 'dry',
    ingredients: 'Chicken, Whole Grain Wheat, Corn Gluten Meal, Powdered Cellulose, Chicken Fat, Wheat Gluten, Chicken Meal',
    protein_pct: 31, fat_pct: 13, fiber_pct: 6,
    health_tags: ['weight_control'], pros: 'Vet recommended, good for indoor cats.', cons: 'High carbohydrate content.',
    price_monthly_low: 35, price_monthly_high: 50, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Hills+Science+Diet+Adult+Indoor+Chicken+cat+food&tag=lumobites-20' },
    available_at: ['Amazon', 'PetSmart', 'Chewy'], recall_history: false
  },
  {
    id: 'fallback_c3', product_name: 'Orijen Guardian 8 Grain-Free Dry Cat Food',
    brand: 'Orijen', pet_type: 'cat', life_stage: 'adult', food_type: 'dry',
    ingredients: 'Chicken, Salmon, Turkey, Whole Herring, Whole Mackerel, Chicken Liver, Turkey Giblets',
    protein_pct: 40, fat_pct: 18, fiber_pct: 4,
    health_tags: ['picky_eater'], pros: 'Premium ingredients, incredibly high protein.', cons: 'Expensive.',
    price_monthly_low: 55, price_monthly_high: 80, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Orijen+Guardian+8+Grain-Free+cat+food&tag=lumobites-20' },
    available_at: ['Amazon', 'Petco', 'Chewy'], recall_history: false
  },
  {
    id: 'fallback_c4', product_name: 'Wellness CORE Grain-Free Indoor Chicken & Turkey Recipe Dry Cat Food',
    brand: 'Wellness', pet_type: 'cat', life_stage: 'adult', food_type: 'dry',
    ingredients: 'Deboned Chicken, Chicken Meal, Turkey Meal, Peas, Potatoes, Tomato Pomace, Chicken Fat',
    protein_pct: 38, fat_pct: 12, fiber_pct: 5,
    health_tags: ['weight_control'], pros: 'Grain-free, high protein, lower fat for indoor cats.', cons: 'Pricier than average.',
    price_monthly_low: 40, price_monthly_high: 60, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Wellness+CORE+Grain-Free+Indoor+cat+food&tag=lumobites-20' },
    available_at: ['Amazon', 'PetSmart', 'Chewy'], recall_history: false
  },

  // ── WET CAT FOOD ─────────────────────────────────────────────────────────────
  {
    id: 'fallback_cw1', product_name: 'Fancy Feast Classic Pate Poultry & Beef Variety Pack Canned Cat Food',
    brand: 'Fancy Feast', pet_type: 'cat', life_stage: 'adult', food_type: 'wet',
    ingredients: 'Chicken, Poultry Broth, Liver, Meat By-Products, Fish, Artificial And Natural Flavors',
    protein_pct: 10, fat_pct: 5, fiber_pct: 1.5,
    health_tags: ['picky_eater'], pros: 'Very palatable, high moisture, affordable wet food.', cons: 'Contains meat by-products.',
    price_monthly_low: 25, price_monthly_high: 40, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Fancy+Feast+Classic+Pate+Poultry+Beef+canned+cat+food&tag=lumobites-20' },
    available_at: ['Amazon', 'Walmart', 'Target'], recall_history: false
  },
  {
    id: 'fallback_cw2', product_name: 'Tiki Cat Luau Shredded Chicken in Chicken Broth Wet Cat Food',
    brand: 'Tiki Cat', pet_type: 'cat', life_stage: 'adult', food_type: 'wet',
    ingredients: 'Chicken, Chicken Broth, Sunflower Seed Oil, Tricalcium Phosphate, Tuna, Salmon',
    protein_pct: 14, fat_pct: 2, fiber_pct: 0.5,
    health_tags: ['picky_eater', 'sensitive_stomach'], pros: 'Real shredded meat, high moisture, very low carbs.', cons: 'Expensive to feed as sole diet.',
    price_monthly_low: 60, price_monthly_high: 90, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Tiki+Cat+Luau+Shredded+Chicken+wet+cat+food&tag=lumobites-20' },
    available_at: ['Amazon', 'Petco', 'Chewy'], recall_history: false
  },
  {
    id: 'fallback_cw3', product_name: 'Wellness CORE Grain-Free Pate Chicken & Turkey Canned Cat Food',
    brand: 'Wellness', pet_type: 'cat', life_stage: 'adult', food_type: 'wet',
    ingredients: 'Chicken, Turkey, Chicken Broth, Chicken Liver, Ground Flaxseed, Cranberries, Blueberries, Carrots',
    protein_pct: 12, fat_pct: 5, fiber_pct: 1,
    health_tags: ['allergies', 'sensitive_stomach'], pros: 'Grain-free, high moisture, no artificial additives.', cons: 'Higher price point.',
    price_monthly_low: 55, price_monthly_high: 80, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Wellness+CORE+Grain-Free+Pate+Chicken+Turkey+wet+cat+food&tag=lumobites-20' },
    available_at: ['Amazon', 'Chewy', 'Petco'], recall_history: false
  },
  {
    id: 'fallback_cw4', product_name: 'Purina Pro Plan Adult Salmon & Tuna Entree in Sauce Wet Cat Food',
    brand: 'Purina Pro Plan', pet_type: 'cat', life_stage: 'adult', food_type: 'wet',
    ingredients: 'Salmon, Tuna, Water, Whitefish, Chicken Liver, Soy Protein Isolate, Fish Broth, Vitamins and Minerals',
    protein_pct: 11, fat_pct: 4, fiber_pct: 0.5,
    health_tags: ['picky_eater', 'weight_control'], pros: 'High protein, palatable, supports urinary health.', cons: 'Contains soy protein.',
    price_monthly_low: 45, price_monthly_high: 70, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Purina+Pro+Plan+Adult+Salmon+Tuna+wet+cat+food&tag=lumobites-20' },
    available_at: ['Amazon', 'Chewy', 'Petco'], recall_history: false
  },
  {
    id: 'fallback_cw5', product_name: 'Weruva Cats in the Kitchen Chicken Frick A Zee Pouch Wet Cat Food',
    brand: 'Weruva', pet_type: 'cat', life_stage: 'adult', food_type: 'wet',
    ingredients: 'Chicken Breast, Water Sufficient for Processing, Sunflower Seed Oil, Calcium Carbonate, Guar Gum',
    protein_pct: 13, fat_pct: 2, fiber_pct: 0.5,
    health_tags: ['allergies', 'picky_eater', 'sensitive_stomach'], pros: 'Minimal ingredients, human-grade chicken, very low carb.', cons: 'Low fat may not suit all cats.',
    price_monthly_low: 60, price_monthly_high: 90, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Weruva+Cats+in+the+Kitchen+wet+cat+food&tag=lumobites-20' },
    available_at: ['Amazon', 'Petco', 'Chewy'], recall_history: false
  },
  {
    id: 'fallback_cw6', product_name: "Hill's Science Diet Adult Urinary Hairball Control Chicken Canned Cat Food",
    brand: "Hill's Science Diet", pet_type: 'cat', life_stage: 'adult', food_type: 'wet',
    ingredients: 'Water, Chicken, Pork By-Products, Pork Liver, Chicken Liver, Pea Protein, Powdered Cellulose',
    protein_pct: 9, fat_pct: 4, fiber_pct: 2,
    health_tags: ['weight_control', 'sensitive_stomach'], pros: 'Vet recommended, supports urinary health, high moisture.', cons: 'Contains pork by-products.',
    price_monthly_low: 40, price_monthly_high: 60, image_url: '/images/placeholder.svg',
    buy_links: { amazon: 'https://www.amazon.com/s?k=Hills+Science+Diet+Adult+Urinary+Hairball+wet+cat+food&tag=lumobites-20' },
    available_at: ['Amazon', 'PetSmart', 'Chewy'], recall_history: false
  },
];
