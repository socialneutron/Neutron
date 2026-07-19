import { supabase } from '../lib/supabase'
import type { Ebook, UserEbook, EbookHighlight } from '../types/database'

const STORAGE_KEY = 'neutron-user-ebooks'

function getLocalUserEbooks(): UserEbook[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function setLocalUserEbooks(ebooks: UserEbook[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ebooks))
}

export const ebookService = {
  async getEbooks(category?: string): Promise<Ebook[]> {
    let query = supabase.from('ebooks').select('*')
    if (category && category !== 'All') {
      query = query.eq('category', category)
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching ebooks:', error)
      return []
    }
    return data || []
  },

  async getEbookById(id: string): Promise<Ebook | null> {
    const { data, error } = await supabase.from('ebooks').select('*').eq('id', id).single()
    if (error) {
      console.error('Error fetching ebook:', error)
      return null
    }
    return data
  },

  async searchEbooks(query: string): Promise<Ebook[]> {
    const { data, error } = await supabase
      .from('ebooks')
      .select('*')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error searching ebooks:', error)
      return []
    }
    return data || []
  },

  async purchaseEbook(userId: string, ebookId: string): Promise<UserEbook | null> {
    // Check if already purchased
    const existing = await this.getUserEbook(userId, ebookId)
    if (existing) return existing

    // Get ebook details
    const ebook = await this.getEbookById(ebookId)
    if (!ebook) return null

    // Save to localStorage
    const userEbooks = getLocalUserEbooks()
    const newUserEbook: UserEbook = {
      id: `user-ebook-${Date.now()}`,
      user_id: userId,
      ebook_id: ebookId,
      progress: 0,
      highlights: [],
      last_read_at: new Date().toISOString(),
      purchased_at: new Date().toISOString(),
      ebook,
    }
    userEbooks.push(newUserEbook)
    setLocalUserEbooks(userEbooks)

    // Also try to save to Supabase (non-blocking)
    supabase.from('user_ebooks').insert({
      user_id: userId,
      ebook_id: ebookId,
      progress: 0,
      highlights: [],
      last_read_at: new Date().toISOString(),
      purchased_at: new Date().toISOString(),
    }).then(({ error }) => {
      if (error) console.error('Error saving to Supabase:', error)
    })

    return newUserEbook
  },

  async getUserEbooks(userId: string): Promise<UserEbook[]> {
    // Get from localStorage
    const localEbooks = getLocalUserEbooks().filter(e => e.user_id === userId)

    // Also try to get from Supabase and merge
    const { data: remoteEbooks } = await supabase
      .from('user_ebooks')
      .select('*, ebook:ebooks(*)')
      .eq('user_id', userId)

    if (remoteEbooks && remoteEbooks.length > 0) {
      // Merge remote ebooks that aren't in local
      const localIds = new Set(localEbooks.map(e => e.ebook_id))
      for (const remote of remoteEbooks) {
        if (!localIds.has(remote.ebook_id)) {
          localEbooks.push(remote as UserEbook)
        }
      }
      setLocalUserEbooks(localEbooks)
    }

    return localEbooks
  },

  async getUserEbook(userId: string, ebookId: string): Promise<UserEbook | null> {
    const userEbooks = getLocalUserEbooks()
    return userEbooks.find(e => e.user_id === userId && e.ebook_id === ebookId) || null
  },

  async updateProgress(userId: string, ebookId: string, progress: number): Promise<void> {
    const userEbooks = getLocalUserEbooks()
    const index = userEbooks.findIndex(e => e.user_id === userId && e.ebook_id === ebookId)
    if (index !== -1) {
      userEbooks[index].progress = progress
      userEbooks[index].last_read_at = new Date().toISOString()
      setLocalUserEbooks(userEbooks)
    }
  },

  async addHighlight(userId: string, ebookId: string, highlight: Omit<EbookHighlight, 'id' | 'created_at'>): Promise<void> {
    const userEbooks = getLocalUserEbooks()
    const index = userEbooks.findIndex(e => e.user_id === userId && e.ebook_id === ebookId)
    if (index !== -1) {
      const newHighlight: EbookHighlight = {
        ...highlight,
        id: `highlight-${Date.now()}`,
        created_at: new Date().toISOString(),
      }
      userEbooks[index].highlights.push(newHighlight)
      setLocalUserEbooks(userEbooks)
    }
  },

  async removeHighlight(userId: string, ebookId: string, highlightId: string): Promise<void> {
    const userEbooks = getLocalUserEbooks()
    const index = userEbooks.findIndex(e => e.user_id === userId && e.ebook_id === ebookId)
    if (index !== -1) {
      userEbooks[index].highlights = userEbooks[index].highlights.filter(h => h.id !== highlightId)
      setLocalUserEbooks(userEbooks)
    }
  },

  // Mock magazines for demo (since we don't have a real Supabase table yet)
  getMockEbooks(): Ebook[] {
    return [
      {
        id: 'mag-1',
        title: 'Wired',
        author: 'Condé Nast',
        description: 'The latest in technology, science, and culture',
        cover_url: 'https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=300&h=400&fit=crop',
        price: 0,
        category: 'Technology',
        pages: 120,
        file_url: '',
        sample_url: '',
        rating: 4.8,
        sales_count: 15420,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      },
      {
        id: 'mag-2',
        title: 'Harvard Business Review',
        author: 'Harvard Business Publishing',
        description: 'Management tips, strategy, and innovation insights',
        cover_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=400&fit=crop',
        price: 0,
        category: 'Business',
        pages: 96,
        file_url: '',
        sample_url: '',
        rating: 4.6,
        sales_count: 12350,
        created_at: '2024-02-20T00:00:00Z',
        updated_at: '2024-02-20T00:00:00Z',
      },
      {
        id: 'mag-3',
        title: 'National Geographic',
        author: 'National Geographic Society',
        description: 'Science, nature, and exploration stories from around the world',
        cover_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=400&fit=crop',
        price: 0,
        category: 'Science',
        pages: 112,
        file_url: '',
        sample_url: '',
        rating: 4.7,
        sales_count: 9870,
        created_at: '2024-03-10T00:00:00Z',
        updated_at: '2024-03-10T00:00:00Z',
      },
      {
        id: 'mag-4',
        title: 'Forbes',
        author: 'Forbes Media',
        description: 'Business, investing, technology, entrepreneurship, leadership',
        cover_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=400&fit=crop',
        price: 0,
        category: 'Business',
        pages: 88,
        file_url: '',
        sample_url: '',
        rating: 4.5,
        sales_count: 8540,
        created_at: '2024-04-05T00:00:00Z',
        updated_at: '2024-04-05T00:00:00Z',
      },
      {
        id: 'mag-5',
        title: 'Time',
        author: 'Time Inc.',
        description: 'Breaking news, analysis, and in-depth reporting',
        cover_url: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=300&h=400&fit=crop',
        price: 0,
        category: 'News',
        pages: 80,
        file_url: '',
        sample_url: '',
        rating: 4.9,
        sales_count: 18920,
        created_at: '2024-05-12T00:00:00Z',
        updated_at: '2024-05-12T00:00:00Z',
      },
      {
        id: 'mag-6',
        title: 'Vogue',
        author: 'Condé Nast',
        description: 'Fashion, beauty, culture, and lifestyle',
        cover_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=400&fit=crop',
        price: 0,
        category: 'Lifestyle',
        pages: 140,
        file_url: '',
        sample_url: '',
        rating: 4.4,
        sales_count: 11230,
        created_at: '2024-06-18T00:00:00Z',
        updated_at: '2024-06-18T00:00:00Z',
      },
    ]
  }
}