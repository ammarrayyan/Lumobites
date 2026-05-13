export type PetType = 'cat' | 'dog';
export type LifeStage = 'kitten' | 'puppy' | 'adult' | 'senior';
export type ActivityLevel = 'low' | 'medium' | 'high';
export type FoodType = 'dry' | 'wet' | 'treats' | 'both';
export type HealthTag =
  | 'anxiety'
  | 'sensitive_stomach'
  | 'allergies'
  | 'weight_control'
  | 'picky_eater'
  | 'kidney'
  | 'joint';

export interface PetProfile {
  id?: string;
  session_id: string;
  pet_name: string;
  pet_type: PetType;
  age_years: number;
  weight_lbs?: number;
  breed?: string;
  health_issues: HealthTag[];
  activity_level: ActivityLevel;
  budget_monthly_max: number;
  avoid_ingredients?: string;
  food_type?: FoodType;
  brand?: string;
  created_at?: string;
}

export interface BuyLinks {
  amazon?: string;
  chewy?: string;
  petco?: string;
  petsmart?: string;
}

export interface Product {
  id: string;
  product_name: string;
  brand: string;
  pet_type: PetType;
  life_stage: LifeStage;
  ingredients: string;
  protein_pct: number;
  fat_pct: number;
  fiber_pct: number;
  health_tags: HealthTag[];
  pros: string;
  cons: string;
  price_monthly_low: number;
  price_monthly_high: number;
  image_url: string;
  buy_links: BuyLinks;
  available_at: string[];
  recall_history: boolean;
  categories?: string;
  created_at?: string;
}

export interface ScoredProduct extends Product {
  score: number;
  match_pct: number;
  why_recommended: string;
  budget_relaxed?: boolean;
}

export interface ParsedPetInfo {
  pet_name?: string;
  pet_type?: PetType;
  age_years?: number;
  weight_lbs?: number;
  breed?: string;
  health_issues?: HealthTag[];
  activity_level?: ActivityLevel;
  budget_monthly_max?: number;
  avoid_ingredients?: string;
  food_type?: FoodType;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationState {
  messages: ChatMessage[];
  parsedInfo: ParsedPetInfo;
  phase: 'chatting' | 'complete';
  missingFields: string[];
}
