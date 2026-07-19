export type ListingType = 'company' | 'product' | 'ebook' | 'talent'

export interface SavedListing {
  id: string
  user_id: string
  listing_id: string
  listing_type: ListingType
  created_at: string
}

export interface TalentProfile {
  user_id: string
  professional_title: string
  bio: string
  category: string
  hourly_rate: number
  skills: string[]
  portfolio_url: string
  availability: 'available' | 'busy' | 'unavailable'
  created_at: string
  updated_at: string
}
