import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SavedListing, ListingType } from '../types/savedListing'
import { savedListingService } from '../services/savedListingService'

interface SavedListingsState {
  saved: SavedListing[]
  toggleSave: (userId: string, listingId: string, listingType: ListingType) => boolean
  removeSave: (userId: string, listingId: string, listingType: ListingType) => void
  isSaved: (userId: string, listingId: string, listingType: ListingType) => boolean
  getSavedByType: (userId: string, type: ListingType) => SavedListing[]
  getCount: (userId: string) => number
  getCountByType: (userId: string, type: ListingType) => number
}

export const useSavedListingsStore = create<SavedListingsState>()(
  persist(
    (set, get) => ({
      saved: [],

      toggleSave: (userId, listingId, listingType) => {
        const isNowSaved = savedListingService.toggle(userId, listingId, listingType)
        const updated = savedListingService.getSavedByUser(userId)
        set({ saved: updated })
        return isNowSaved
      },

      removeSave: (userId, listingId, listingType) => {
        savedListingService.remove(userId, listingId, listingType)
        const updated = savedListingService.getSavedByUser(userId)
        set({ saved: updated })
      },

      isSaved: (userId, listingId, listingType) => {
        return get().saved.some(s =>
          s.user_id === userId && s.listing_id === listingId && s.listing_type === listingType
        )
      },

      getSavedByType: (userId, type) => {
        return get().saved.filter(s => s.user_id === userId && s.listing_type === type)
      },

      getCount: (userId) => {
        return get().saved.filter(s => s.user_id === userId).length
      },

      getCountByType: (userId, type) => {
        return get().saved.filter(s => s.user_id === userId && s.listing_type === type).length
      },
    }),
    {
      name: 'neutron-saved-listings',
      partialize: (state) => ({ saved: state.saved }),
    }
  )
)
