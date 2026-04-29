import { Product } from './types';

export const seedProducts: Product[] = [
  // DOG FOODS - BUDGET
  {
    id: 'd1', product_name: 'Pedigree Complete Nutrition Adult', brand: 'Pedigree', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Ground whole grain corn, meat and bone meal, corn gluten meal, animal fat.', protein_pct: 21, fat_pct: 10, fiber_pct: 4,
    health_tags: [], pros: 'Affordable, widely available.', cons: 'Contains corn and meat by-products.',
    price_monthly_low: 15, price_monthly_high: 25, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#', petco: '#', petsmart: '#' },
    available_at: ['Walmart', 'Target', 'Petco'], recall_history: false
  },
  {
    id: 'd2', product_name: 'Purina Dog Chow Complete Adult', brand: 'Purina', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Whole grain corn, meat and bone meal, corn gluten meal, beef fat.', protein_pct: 21, fat_pct: 10, fiber_pct: 4.5,
    health_tags: [], pros: 'Very affordable.', cons: 'Corn is the first ingredient.',
    price_monthly_low: 15, price_monthly_high: 25, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#' },
    available_at: ['Walmart', 'Target'], recall_history: true
  },
  {
    id: 'd3', product_name: 'Iams ProActive Health Minichunks', brand: 'Iams', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Chicken, ground whole grain corn, ground whole grain sorghum, chicken by-product meal.', protein_pct: 25, fat_pct: 14, fiber_pct: 4,
    health_tags: ['sensitive_stomach'], pros: 'Real chicken is first ingredient.', cons: 'Contains corn.',
    price_monthly_low: 25, price_monthly_high: 35, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#' },
    available_at: ['Target', 'Petco', 'PetSmart'], recall_history: false
  },
  {
    id: 'd4', product_name: 'Kibbles \'n Bits Original', brand: 'Kibbles \'n Bits', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Corn, soybean meal, beef and bone meal, ground wheat.', protein_pct: 19, fat_pct: 8, fiber_pct: 4,
    health_tags: [], pros: 'Tasty for picky eaters.', cons: 'Low protein, high grain content.',
    price_monthly_low: 15, price_monthly_high: 20, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#' },
    available_at: ['Walmart', 'Target'], recall_history: false
  },
  
  // DOG FOODS - MID RANGE
  {
    id: 'd5', product_name: 'Purina Pro Plan Sensitive Skin & Stomach', brand: 'Purina Pro Plan', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Salmon, barley, rice, oatmeal, canola meal.', protein_pct: 26, fat_pct: 16, fiber_pct: 4,
    health_tags: ['sensitive_stomach', 'allergies'], pros: 'Excellent for sensitive stomachs. Contains probiotics.', cons: 'Contains some grains (though easily digestible).',
    price_monthly_low: 40, price_monthly_high: 60, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#', petco: '#', petsmart: '#' },
    available_at: ['Petco', 'PetSmart', 'Chewy'], recall_history: false
  },
  {
    id: 'd6', product_name: 'Hill\'s Science Diet Adult', brand: 'Hill\'s Science Diet', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Chicken, cracked pearled barley, whole grain wheat, whole grain corn.', protein_pct: 20, fat_pct: 13, fiber_pct: 4,
    health_tags: [], pros: 'Vet recommended, consistent quality.', cons: 'Contains corn and wheat.',
    price_monthly_low: 45, price_monthly_high: 65, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#', petsmart: '#' },
    available_at: ['Petco', 'PetSmart', 'Target'], recall_history: false
  },
  {
    id: 'd7', product_name: 'Taste of the Wild High Prairie', brand: 'Taste of the Wild', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Water buffalo, lamb meal, chicken meal, sweet potatoes.', protein_pct: 32, fat_pct: 18, fiber_pct: 4,
    health_tags: ['allergies', 'picky_eater'], pros: 'High protein, grain-free.', cons: 'Produced in facilities that process grains.',
    price_monthly_low: 50, price_monthly_high: 70, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#' },
    available_at: ['Petco', 'PetSmart', 'Local Pet Stores'], recall_history: false
  },
  {
    id: 'd8', product_name: 'Blue Buffalo Life Protection Formula', brand: 'Blue Buffalo', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Deboned chicken, chicken meal, brown rice, barley, oatmeal.', protein_pct: 24, fat_pct: 14, fiber_pct: 5,
    health_tags: ['sensitive_stomach'], pros: 'Good quality grains, no corn/wheat/soy.', cons: 'Some dogs dislike the "LifeSource Bits".',
    price_monthly_low: 45, price_monthly_high: 65, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#', petco: '#' },
    available_at: ['Petco', 'PetSmart', 'Target'], recall_history: false
  },
  {
    id: 'd9', product_name: 'Wellness Complete Health Adult', brand: 'Wellness', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Deboned chicken, chicken meal, oatmeal, barley, brown rice.', protein_pct: 24, fat_pct: 12, fiber_pct: 4,
    health_tags: ['sensitive_stomach'], pros: 'High quality ingredients, no meat by-products.', cons: 'Pricey for a mid-range food.',
    price_monthly_low: 50, price_monthly_high: 70, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#', petsmart: '#' },
    available_at: ['Petco', 'PetSmart'], recall_history: false
  },
  {
    id: 'd10', product_name: 'Merrick Classic Healthy Grains', brand: 'Merrick', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Deboned beef, pork meal, brown rice, barley, oatmeal.', protein_pct: 26, fat_pct: 15, fiber_pct: 3.5,
    health_tags: ['picky_eater'], pros: 'High quality meat first ingredient, easily digestible grains.', cons: 'Can be too rich for some dogs.',
    price_monthly_low: 55, price_monthly_high: 75, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#' },
    available_at: ['Petco', 'PetSmart', 'Local Pet Stores'], recall_history: false
  },

  // DOG FOODS - PREMIUM
  {
    id: 'd11', product_name: 'Orijen Original', brand: 'Orijen', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Chicken, turkey, flounder, whole mackerel, chicken liver.', protein_pct: 38, fat_pct: 18, fiber_pct: 4,
    health_tags: ['picky_eater'], pros: 'Extremely high protein, fresh meat.', cons: 'Very expensive, can be too rich for some.',
    price_monthly_low: 80, price_monthly_high: 110, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#', petco: '#' },
    available_at: ['Petco', 'Local Pet Stores'], recall_history: false
  },
  {
    id: 'd12', product_name: 'Acana Singles Limited Ingredient Diet', brand: 'Acana', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Lamb, lamb meal, lamb liver, sweet potato, whole chickpeas.', protein_pct: 31, fat_pct: 15, fiber_pct: 5,
    health_tags: ['allergies', 'sensitive_stomach'], pros: 'Limited ingredients, great for allergies.', cons: 'Expensive.',
    price_monthly_low: 70, price_monthly_high: 100, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#' },
    available_at: ['Petco', 'Local Pet Stores'], recall_history: false
  },
  {
    id: 'd13', product_name: 'Instinct Raw Boost', brand: 'Instinct', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Chicken, chicken meal, peas, chicken fat, tapioca.', protein_pct: 37, fat_pct: 20.5, fiber_pct: 4,
    health_tags: ['picky_eater', 'weight_control'], pros: 'Includes freeze-dried raw pieces.', cons: 'High fat content.',
    price_monthly_low: 75, price_monthly_high: 105, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#', petsmart: '#' },
    available_at: ['Petco', 'PetSmart', 'Local Pet Stores'], recall_history: false
  },
  
  // DOG FOODS - SPECIALTIES (Puppy, Senior, Weight)
  {
    id: 'd14', product_name: 'Hill\'s Science Diet Puppy', brand: 'Hill\'s Science Diet', pet_type: 'dog', life_stage: 'puppy',
    ingredients: 'Chicken meal, whole grain wheat, cracked pearled barley.', protein_pct: 25, fat_pct: 15, fiber_pct: 3,
    health_tags: [], pros: 'Great for developing puppies.', cons: 'Contains wheat.',
    price_monthly_low: 45, price_monthly_high: 60, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#' },
    available_at: ['Petco', 'PetSmart'], recall_history: false
  },
  {
    id: 'd15', product_name: 'Purina Pro Plan Puppy Large Breed', brand: 'Purina Pro Plan', pet_type: 'dog', life_stage: 'puppy',
    ingredients: 'Chicken, rice, corn gluten meal, whole grain corn.', protein_pct: 28, fat_pct: 13, fiber_pct: 4.75,
    health_tags: ['joint'], pros: 'Tailored for large breed growth.', cons: 'Contains corn.',
    price_monthly_low: 50, price_monthly_high: 70, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#', petsmart: '#' },
    available_at: ['Petco', 'PetSmart'], recall_history: false
  },
  {
    id: 'd16', product_name: 'Blue Buffalo Life Protection Senior', brand: 'Blue Buffalo', pet_type: 'dog', life_stage: 'senior',
    ingredients: 'Deboned chicken, brown rice, barley, oatmeal.', protein_pct: 18, fat_pct: 10, fiber_pct: 7,
    health_tags: ['joint', 'weight_control'], pros: 'Contains glucosamine and chondroitin for joints.', cons: 'Lower protein.',
    price_monthly_low: 45, price_monthly_high: 65, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#', petco: '#' },
    available_at: ['Petco', 'PetSmart'], recall_history: false
  },
  {
    id: 'd17', product_name: 'Hill\'s Prescription Diet j/d Joint Care', brand: 'Hill\'s Prescription Diet', pet_type: 'dog', life_stage: 'senior',
    ingredients: 'Whole grain wheat, whole grain corn, flaxseed, chicken meal.', protein_pct: 17, fat_pct: 13, fiber_pct: 10,
    health_tags: ['joint'], pros: 'Clinically proven to improve mobility.', cons: 'Requires a vet prescription. High grain content.',
    price_monthly_low: 80, price_monthly_high: 110, image_url: '/images/placeholder.svg',
    buy_links: { chewy: '#' },
    available_at: ['Vet Clinics', 'Chewy'], recall_history: false
  },
  {
    id: 'd18', product_name: 'Purina Pro Plan Weight Management', brand: 'Purina Pro Plan', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Chicken, rice, poultry by-product meal, corn gluten meal.', protein_pct: 27, fat_pct: 9, fiber_pct: 5.5,
    health_tags: ['weight_control'], pros: 'Low fat, helps with weight loss.', cons: 'Contains by-products.',
    price_monthly_low: 45, price_monthly_high: 65, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#' },
    available_at: ['Petco', 'PetSmart'], recall_history: false
  },
  {
    id: 'd19', product_name: 'Royal Canin Veterinary Diet Gastrointestinal', brand: 'Royal Canin', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Brewers rice, chicken by-product meal, chicken fat, brown rice.', protein_pct: 23, fat_pct: 18, fiber_pct: 3.3,
    health_tags: ['sensitive_stomach'], pros: 'Highly digestible for severe GI issues.', cons: 'Expensive, requires prescription.',
    price_monthly_low: 80, price_monthly_high: 120, image_url: '/images/placeholder.svg',
    buy_links: { chewy: '#' },
    available_at: ['Vet Clinics', 'Chewy'], recall_history: false
  },
  {
    id: 'd20', product_name: 'Zesty Paws Calming Bites (Supplement)', brand: 'Zesty Paws', pet_type: 'dog', life_stage: 'adult',
    ingredients: 'Hemp seed powder, chamomile, valerian root, L-theanine.', protein_pct: 15, fat_pct: 10, fiber_pct: 5,
    health_tags: ['anxiety'], pros: 'Helps with anxiety and stress.', cons: 'Supplement, not a complete meal.',
    price_monthly_low: 30, price_monthly_high: 40, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#' },
    available_at: ['Petco', 'Target'], recall_history: false
  },

  // CAT FOODS - BUDGET
  {
    id: 'c1', product_name: 'Meow Mix Original Choice', brand: 'Meow Mix', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Whole ground corn, soybean meal, chicken by-product meal, corn gluten meal.', protein_pct: 30, fat_pct: 11, fiber_pct: 4,
    health_tags: ['picky_eater'], pros: 'Cats love the taste, very cheap.', cons: 'Low quality ingredients, high carbs.',
    price_monthly_low: 10, price_monthly_high: 20, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#' },

    available_at: ['Walmart', 'Target', 'Grocery Stores'], recall_history: false
  },
  {
    id: 'c2', product_name: 'Purina Cat Chow Complete', brand: 'Purina', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Chicken by-product meal, ground yellow corn, corn gluten meal, whole grain wheat.', protein_pct: 32, fat_pct: 12, fiber_pct: 3,
    health_tags: [], pros: 'Affordable, easy to find.', cons: 'Heavy on corn and wheat.',
    price_monthly_low: 15, price_monthly_high: 25, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#' },
    available_at: ['Walmart', 'Target'], recall_history: false
  },
  {
    id: 'c3', product_name: 'Friskies Surfin\' & Turfin\'', brand: 'Friskies', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Ground yellow corn, chicken by-product meal, soybean meal, corn gluten meal.', protein_pct: 30, fat_pct: 11, fiber_pct: 3,
    health_tags: [], pros: 'Budget friendly.', cons: 'Artificial colors, low quality protein.',
    price_monthly_low: 12, price_monthly_high: 22, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#' },
    available_at: ['Walmart', 'Grocery Stores'], recall_history: false
  },
  {
    id: 'c4', product_name: 'Iams ProActive Health Healthy Adult', brand: 'Iams', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Chicken, chicken by-product meal, corn grits, corn gluten meal.', protein_pct: 32, fat_pct: 15, fiber_pct: 3,
    health_tags: ['weight_control'], pros: 'Chicken is the first ingredient.', cons: 'Contains corn grits.',
    price_monthly_low: 20, price_monthly_high: 30, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#' },
    available_at: ['Target', 'Petco', 'PetSmart'], recall_history: false
  },

  // CAT FOODS - MID RANGE
  {
    id: 'c5', product_name: 'Purina Pro Plan Sensitive Skin & Stomach', brand: 'Purina Pro Plan', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Turkey, chicken meal, pea protein, rice, dried egg product.', protein_pct: 40, fat_pct: 17, fiber_pct: 4,
    health_tags: ['sensitive_stomach', 'allergies'], pros: 'High protein, great for digestion.', cons: 'Price has increased recently.',
    price_monthly_low: 35, price_monthly_high: 50, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#', petsmart: '#' },
    available_at: ['Petco', 'PetSmart', 'Chewy'], recall_history: false
  },
  {
    id: 'c6', product_name: 'Hill\'s Science Diet Adult Indoor', brand: 'Hill\'s Science Diet', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Chicken, whole grain wheat, corn gluten meal, powdered cellulose.', protein_pct: 31, fat_pct: 13, fiber_pct: 9,
    health_tags: ['weight_control'], pros: 'Helps with hairballs and weight.', cons: 'High carbohydrate content.',
    price_monthly_low: 40, price_monthly_high: 55, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#', petco: '#' },
    available_at: ['Petco', 'PetSmart'], recall_history: false
  },
  {
    id: 'c7', product_name: 'Blue Buffalo Wilderness', brand: 'Blue Buffalo', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Deboned chicken, chicken meal, turkey meal, pea protein.', protein_pct: 40, fat_pct: 18, fiber_pct: 4,
    health_tags: ['picky_eater'], pros: 'High protein, grain-free.', cons: 'Some cats dislike the LifeSource Bits.',
    price_monthly_low: 40, price_monthly_high: 60, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#' },
    available_at: ['Petco', 'PetSmart', 'Target'], recall_history: false
  },
  {
    id: 'c8', product_name: 'Wellness CORE Grain-Free', brand: 'Wellness', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Deboned turkey, deboned chicken, turkey meal, chicken meal, peas.', protein_pct: 45, fat_pct: 18, fiber_pct: 3,
    health_tags: ['picky_eater'], pros: 'Very high meat protein.', cons: 'Contains peas (some cats are sensitive).',
    price_monthly_low: 45, price_monthly_high: 65, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#', petsmart: '#' },
    available_at: ['Petco', 'PetSmart'], recall_history: false
  },
  {
    id: 'c9', product_name: 'Taste of the Wild Rocky Mountain', brand: 'Taste of the Wild', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Chicken meal, peas, sweet potatoes, chicken fat, pea protein.', protein_pct: 42, fat_pct: 18, fiber_pct: 3,
    health_tags: ['allergies'], pros: 'Roasted venison and smoked salmon flavors.', cons: 'High plant protein (peas).',
    price_monthly_low: 35, price_monthly_high: 50, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#' },
    available_at: ['Petco', 'Local Pet Stores'], recall_history: false
  },
  {
    id: 'c10', product_name: 'Merrick Purrfect Bistro', brand: 'Merrick', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Deboned chicken, chicken meal, turkey meal, dried potatoes.', protein_pct: 38, fat_pct: 17, fiber_pct: 3.5,
    health_tags: ['sensitive_stomach'], pros: 'Grain-free, highly digestible.', cons: 'Slightly higher carb content than some premium.',
    price_monthly_low: 40, price_monthly_high: 55, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#' },
    available_at: ['Petco', 'PetSmart'], recall_history: false
  },

  // CAT FOODS - PREMIUM
  {
    id: 'c11', product_name: 'Orijen Guardian 8', brand: 'Orijen', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Fresh chicken, fresh turkey, raw whole salmon, whole herring.', protein_pct: 40, fat_pct: 18, fiber_pct: 4,
    health_tags: ['joint', 'picky_eater'], pros: 'Incredible fresh meat content.', cons: 'Very expensive.',
    price_monthly_low: 65, price_monthly_high: 90, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#', petco: '#' },
    available_at: ['Petco', 'Local Pet Stores'], recall_history: false
  },
  {
    id: 'c12', product_name: 'Instinct Ultimate Protein', brand: 'Instinct', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Chicken, tapioca, chicken fat, ground flaxseed.', protein_pct: 47, fat_pct: 17, fiber_pct: 3,
    health_tags: ['weight_control'], pros: '95% of protein from real meat.', cons: 'High price point.',
    price_monthly_low: 60, price_monthly_high: 85, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#' },
    available_at: ['Petco', 'PetSmart'], recall_history: false
  },
  {
    id: 'c13', product_name: 'Ziwi Peak Air-Dried', brand: 'Ziwi Peak', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Beef, beef heart, beef kidney, beef tripe, beef liver.', protein_pct: 38, fat_pct: 30, fiber_pct: 2,
    health_tags: ['sensitive_stomach', 'allergies', 'picky_eater'], pros: 'Closest to a raw diet in convenient form.', cons: 'Extremely expensive.',
    price_monthly_low: 120, price_monthly_high: 180, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#' },
    available_at: ['Boutique Pet Stores', 'Chewy'], recall_history: false
  },

  // CAT FOODS - SPECIALTIES (Kitten, Senior, Health)
  {
    id: 'c14', product_name: 'Royal Canin Kitten', brand: 'Royal Canin', pet_type: 'cat', life_stage: 'kitten',
    ingredients: 'Chicken by-product meal, brown rice, brewers rice, chicken fat.', protein_pct: 34, fat_pct: 19, fiber_pct: 3.3,
    health_tags: [], pros: 'Specifically formulated for optimal kitten growth.', cons: 'Contains by-products and rice.',
    price_monthly_low: 45, price_monthly_high: 60, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#', petsmart: '#' },
    available_at: ['Petco', 'PetSmart'], recall_history: false
  },
  {
    id: 'c15', product_name: 'Hill\'s Science Diet Kitten', brand: 'Hill\'s Science Diet', pet_type: 'cat', life_stage: 'kitten',
    ingredients: 'Chicken, brown rice, wheat gluten, chicken fat, egg product.', protein_pct: 33, fat_pct: 19, fiber_pct: 3.5,
    health_tags: [], pros: 'DHA from fish oil for brain development.', cons: 'Contains wheat gluten.',
    price_monthly_low: 40, price_monthly_high: 55, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#' },
    available_at: ['Petco', 'PetSmart'], recall_history: false
  },
  {
    id: 'c16', product_name: 'Purina Pro Plan Senior 7+', brand: 'Purina Pro Plan', pet_type: 'cat', life_stage: 'senior',
    ingredients: 'Chicken, poultry by-product meal, corn gluten meal, brewers rice.', protein_pct: 38, fat_pct: 14, fiber_pct: 4,
    health_tags: ['kidney', 'joint'], pros: 'Formulated to extend healthy life, supports kidneys.', cons: 'Contains corn.',
    price_monthly_low: 40, price_monthly_high: 55, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#', petco: '#' },
    available_at: ['Petco', 'PetSmart'], recall_history: false
  },
  {
    id: 'c17', product_name: 'Hill\'s Prescription Diet k/d Kidney Care', brand: 'Hill\'s Prescription Diet', pet_type: 'cat', life_stage: 'senior',
    ingredients: 'Brown rice, corn gluten meal, chicken, pork fat.', protein_pct: 26, fat_pct: 20, fiber_pct: 3,
    health_tags: ['kidney'], pros: 'Life-saving for cats with kidney disease.', cons: 'Requires prescription. Low protein (by design).',
    price_monthly_low: 70, price_monthly_high: 95, image_url: '/images/placeholder.svg',
    buy_links: { chewy: '#' },
    available_at: ['Vet Clinics', 'Chewy'], recall_history: false
  },
  {
    id: 'c18', product_name: 'Royal Canin Veterinary Diet Urinary SO', brand: 'Royal Canin', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Chicken by-product meal, brewers rice, corn gluten meal.', protein_pct: 32.5, fat_pct: 13, fiber_pct: 4,
    health_tags: ['kidney', 'sensitive_stomach'], pros: 'Prevents urinary crystals.', cons: 'Requires prescription.',
    price_monthly_low: 75, price_monthly_high: 100, image_url: '/images/placeholder.svg',
    buy_links: { chewy: '#' },
    available_at: ['Vet Clinics', 'Chewy'], recall_history: false
  },
  {
    id: 'c19', product_name: 'Hill\'s Prescription Diet c/d Multicare Stress', brand: 'Hill\'s Prescription Diet', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Chicken, whole grain corn, corn gluten meal, whole grain wheat.', protein_pct: 30, fat_pct: 14, fiber_pct: 3,
    health_tags: ['kidney', 'anxiety'], pros: 'Helps urinary health AND contains calming ingredients.', cons: 'Requires prescription.',
    price_monthly_low: 80, price_monthly_high: 110, image_url: '/images/placeholder.svg',
    buy_links: { chewy: '#' },
    available_at: ['Vet Clinics', 'Chewy'], recall_history: false
  },
  {
    id: 'c20', product_name: 'Purina Pro Plan Calming Care Supplement', brand: 'Purina Pro Plan', pet_type: 'cat', life_stage: 'adult',
    ingredients: 'Bifidobacterium longum (probiotic), maltodextrin.', protein_pct: 40, fat_pct: 5, fiber_pct: 1,
    health_tags: ['anxiety', 'sensitive_stomach'], pros: 'Clinically proven probiotic to reduce anxiety.', cons: 'Supplement only, not food.',
    price_monthly_low: 45, price_monthly_high: 55, image_url: '/images/placeholder.svg',
    buy_links: { amazon: '#', chewy: '#' },
    available_at: ['Petco', 'Chewy', 'Vet Clinics'], recall_history: false
  }
];
