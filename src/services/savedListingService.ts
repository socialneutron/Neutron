import type { SavedListing, ListingType } from '../types/savedListing'

const STORAGE_KEY = 'neutron-saved-listings'

function getLocal(): SavedListing[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function setLocal(listings: SavedListing[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listings))
}

export const savedListingService = {
  getSavedByUser(userId: string): SavedListing[] {
    return getLocal().filter(s => s.user_id === userId)
  },

  getSavedByType(userId: string, type: ListingType): SavedListing[] {
    return getLocal().filter(s => s.user_id === userId && s.listing_type === type)
  },

  isSaved(userId: string, listingId: string, listingType: ListingType): boolean {
    return getLocal().some(s =>
      s.user_id === userId && s.listing_id === listingId && s.listing_type === listingType
    )
  },

  toggle(userId: string, listingId: string, listingType: ListingType): boolean {
    const listings = getLocal()
    const idx = listings.findIndex(s =>
      s.user_id === userId && s.listing_id === listingId && s.listing_type === listingType
    )
    if (idx !== -1) {
      listings.splice(idx, 1)
      setLocal(listings)
      return false
    } else {
      const newListing: SavedListing = {
        id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        user_id: userId,
        listing_id: listingId,
        listing_type: listingType,
        created_at: new Date().toISOString(),
      }
      listings.push(newListing)
      setLocal(listings)
      return true
    }
  },

  remove(userId: string, listingId: string, listingType: ListingType): void {
    const listings = getLocal().filter(s =>
      !(s.user_id === userId && s.listing_id === listingId && s.listing_type === listingType)
    )
    setLocal(listings)
  },

  getCount(userId: string): number {
    return getLocal().filter(s => s.user_id === userId).length
  },

  getCountByType(userId: string, type: ListingType): number {
    return getLocal().filter(s => s.user_id === userId && s.listing_type === type).length
  },
}
