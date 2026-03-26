export type Shop =
  | 'Client Internet'
  | 'Noyon'
  | 'Compiègne'
  | 'Clermont'
  | 'Nogent-sur-Oise'
  | 'Breteuil'
  | 'Beauvais'
  | 'Ferrières-en-Bray'

export interface ShopData {
  id: string
  name: string
  address: string | null
  phone: string | null
  hours: string | null
}

export type Feeling = 'difficile' | 'neutre' | 'bien' | 'excellent'

export type TobaccoType = 'industrielle' | 'roulée' | 'cigare' | 'cigarillo' | 'cannabis' | 'mixte'

export interface Profile {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  quit_date: string | null
  cigarettes_per_day: number
  pack_price: number
  tobacco_type: TobaccoType | null
  preferred_shop: Shop | null
  fagerstrom_score: number | null
  reward_name: string | null
  reward_amount: number | null
  kit_price: number | null
  smoker_profile: string | null
  recommended_nicotine_mg: number | null
  age_range: string | null
  craving_count: number
  created_at: string
}

export interface DailyMessage {
  id: string
  day_number: number
  message: string
}

export interface Badge {
  id: string
  day_threshold: number
  title: string
  description: string
  icon: string
}

export interface ContentArticle {
  id: string
  title: string
  summary: string
  body: string
  category: string
  created_at: string
}

export interface NicotineCheckIn {
  id: string
  user_id: string
  date: string
  nicotine_mg: number
  eliquid_name: string
  feeling: Feeling
  notes: string
  created_at: string
}

export interface VaperStory {
  id: string
  user_id: string
  author_name: string
  shop: Shop
  story_text: string
  is_published: boolean
  created_at: string
}

export interface AdminNote {
  id: string
  user_id: string
  note: string
  created_by: string
  created_at: string
}
