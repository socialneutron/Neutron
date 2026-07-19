import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const isRealSupabase = supabaseUrl && supabaseAnonKey
  && supabaseUrl.includes('.supabase.co')
  && !supabaseUrl.includes('your-project')
  && !supabaseAnonKey.includes('your-anon-key')

let realClient: SupabaseClient | null = null

if (isRealSupabase) {
  realClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
    realtime: { params: { eventsPerSecond: 10 } },
  })
}

// ── In-memory database for mock mode ──────────────────────
const tables: Record<string, any[]> = {
  // Core content
  posts: [
    {
      id: 'post-1', post_code: 1, author_id: 'user-1',
      title: 'AI safety alignment: New breakthrough in reward modeling',
      body: 'Just read a fascinating paper from DeepMind on scalable oversight. They demonstrated that constitutional AI can reduce reward hacking by 87% in long-horizon tasks. This is huge for deploying LLMs in high-stakes environments.\n\nKey takeaways:\n• Iterative feedback loops dramatically improve alignment\n• Sparse rewards still a challenge\n• Human-in-the-loop remains essential for edge cases',
      category: 'AI', category_color: '#00D2FF',
      tags: ['AI', 'Safety', 'DeepMind', 'Research'],
      image_url: '', images: [], likes_count: 142, comments_count: 28, reposts_count: 53, bookmarks_count: 67,
      visibility: 'public',
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'post-2', post_code: 2, author_id: 'user-2',
      title: 'Fed rate decision: What the markets are missing',
      body: 'Everyone is focused on the rate cut timing, but the real story is the balance sheet runoff. QT is draining liquidity at $95B/month and the reverse repo facility is nearly empty. This is a liquidity regime change that most retail investors are sleeping on.\n\nHistorical parallels suggest we could see a major volatility event within 60-90 days.',
      category: 'Financial Opportunities', category_color: '#34D399',
      tags: ['Markets', 'Fed', 'Liquidity', 'Macro'],
      image_url: '', images: [], likes_count: 89, comments_count: 34, reposts_count: 41, bookmarks_count: 55,
      visibility: 'public',
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'post-3', post_code: 3, author_id: 'user-4',
      title: 'CRISPR breakthrough: First in-vivo gene editing for sickle cell shows 100% success in trial',
      body: 'Phase 2 results are in: all 12 patients show complete remission at 18-month follow-up. This is the first time in-vivo CRISPR editing has achieved 100% efficacy in a human trial.\n\nThe implications extend far beyond sickle cell — this platform could be adapted for dozens of genetic disorders.\n\nFull paper linked below.',
      category: 'Science', category_color: '#a855f7',
      tags: ['CRISPR', 'GeneEditing', 'Biotech', 'Breakthrough'],
      image_url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80',
      images: ['https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80'],
      likes_count: 256, comments_count: 67, reposts_count: 134, bookmarks_count: 189,
      visibility: 'public',
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'post-4', post_code: 4, author_id: 'user-5',
      title: 'Artemis III: NASA announces new lunar landing sites near the south pole',
      body: 'NASA has identified 13 candidate landing regions near the lunar south pole for Artemis III. These regions were chosen for their scientific value and proximity to permanently shadowed areas that may contain water ice.\n\nThis mission will be humanity\'s first return to the Moon in over 50 years, and the first ever to explore the polar regions.',
      category: 'Space', category_color: '#f59e0b',
      tags: ['NASA', 'Artemis', 'Moon', 'Space'],
      image_url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?auto=format&fit=crop&w=600&q=80',
      ],
      likes_count: 198, comments_count: 45, reposts_count: 78, bookmarks_count: 92,
      visibility: 'public',
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 14400000).toISOString(),
      updated_at: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      id: 'post-5', post_code: 5, author_id: 'user-6',
      title: 'DeFi derivatives are about to eat traditional finance',
      body: 'The total value locked in decentralized derivatives protocols just hit an all-time high of $45B. With the introduction of real-world asset (RWA) collateral and institutional-grade oracles, DeFi is now capable of competing with CME and ICE on execution quality.\n\nKey protocols to watch:\n• Synthetix V3 with atomic swaps\n• dYdX Chain with 20ms latency\n• GMX with zero price impact on major pairs',
      category: 'Digital Assets', category_color: '#00D2FF',
      tags: ['DeFi', 'Derivatives', 'Crypto', 'RWAs'],
      image_url: '', images: [], likes_count: 167, comments_count: 52, reposts_count: 89, bookmarks_count: 73,
      visibility: 'public',
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 28800000).toISOString(),
      updated_at: new Date(Date.now() - 28800000).toISOString(),
    },
    {
      id: 'post-6', post_code: 6, author_id: 'demo-user-id',
      title: 'Building a real-time social feed with optimistic updates',
      body: 'In this post, I break down the architecture of Neutron\'s feed system — optimistic UI, rollback on failure, and real-time Supabase Realtime subscriptions. The key insight: treat your local state as the source of truth and sync with the server asynchronously.\n\nStack: React + Zustand + Supabase + Framer Motion\n\nFull architecture diagram attached.',
      category: 'Technology', category_color: '#7928CA',
      tags: ['React', 'Architecture', 'Supabase', 'UI'],
      image_url: '', images: [], likes_count: 73, comments_count: 21, reposts_count: 34, bookmarks_count: 41,
      visibility: 'public',
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 43200000).toISOString(),
      updated_at: new Date(Date.now() - 43200000).toISOString(),
    },
    {
      id: 'post-7', post_code: 7, author_id: 'user-3',
      title: 'NVIDIA Blackwell GPU demand is 3x supply — what this means for AI infra',
      body: 'Enterprise lead times for NVIDIA\'s Blackwell B200 are now stretching to 52+ weeks. Hyperscalers are placing $10B+ orders. The bottleneck isn\'t just fabrication — it\'s CoWoS advanced packaging capacity.\n\nMy estimate: AI infrastructure spending hits $500B by 2027. The winners will be those who secure supply chains now.',
      category: 'Technology', category_color: '#00D2FF',
      tags: ['NVIDIA', 'AI', 'Hardware', 'Infrastructure'],
      image_url: '', images: [], likes_count: 211, comments_count: 83, reposts_count: 145, bookmarks_count: 112,
      visibility: 'public',
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'post-8', post_code: 8, author_id: 'user-1',
      title: 'The hidden cost of RAG: Why context windows aren\'t a silver bullet',
      body: 'Everyone is excited about 200K+ token context windows, but retrieval-augmented generation still has fundamental issues:\n\n1. Lost-in-the-middle effect degrades accuracy with large contexts\n2. Embedding quality varies wildly across domains\n3. Caching strategies are complex at scale\n\nThe solution? Hybrid approaches combining structured knowledge graphs with vector search.',
      category: 'AI', category_color: '#a855f7',
      tags: ['RAG', 'LLMs', 'AI', 'Engineering'],
      image_url: '', images: [], likes_count: 134, comments_count: 41, reposts_count: 62, bookmarks_count: 78,
      visibility: 'public',
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: 'post-9', post_code: 9, author_id: 'user-7',
      title: 'Moon token to 100x — trust me bro',
      body: 'This is the next big thing. Don\'t miss out. Join our Discord for alpha calls.',
      category: 'Digital Assets', category_color: '#f59e0b',
      tags: ['Crypto', 'Memes', 'Alpha'],
      image_url: '', images: [], likes_count: 5, comments_count: 1, reposts_count: 0, bookmarks_count: 0,
      visibility: 'public',
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'post-10', post_code: 10, author_id: 'user-4',
      title: 'My photography setup for capturing the Milky Way',
      body: 'After 3 years of astrophotography, here\'s my current kit. Works perfectly for long-exposure night sky shots.',
      category: 'Creative Assets', category_color: '#7928CA',
      tags: ['Photography', 'Astrophotography', 'Gear'],
      image_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80',
      ],
      likes_count: 87, comments_count: 12, reposts_count: 19, bookmarks_count: 34,
      visibility: 'public',
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 5400000).toISOString(),
      updated_at: new Date(Date.now() - 5400000).toISOString(),
    },
    {
      id: 'post-11', post_code: 11, author_id: 'user-5',
      title: 'SpaceX Starship Flight 7 mission highlights',
      body: 'Incredible footage from the latest Starship test flight. Full booster catch and orbital insertion achieved.',
      category: 'Space', category_color: '#f59e0b',
      tags: ['SpaceX', 'Starship', 'Rocket'],
      image_url: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1457364559154-aa2644600ebb?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=600&q=80',
      ],
      likes_count: 312, comments_count: 67, reposts_count: 145, bookmarks_count: 89,
      visibility: 'public',
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 10800000).toISOString(),
      updated_at: new Date(Date.now() - 10800000).toISOString(),
    },
    {
      id: 'post-12', post_code: 12, author_id: 'user-3',
      title: 'Our team retreat in Kyoto — cultural immersion and strategy sessions',
      body: 'Just got back from the most productive team retreat yet. Nothing beats face-to-face brainstorming in a beautiful setting.',
      category: 'General', category_color: '#4b5563',
      tags: ['Team', 'Kyoto', 'Travel'],
      image_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=600&q=80',
      ],
      likes_count: 156, comments_count: 23, reposts_count: 11, bookmarks_count: 45,
      visibility: 'public',
      is_repost: false, repost_of: null,
      created_at: new Date(Date.now() - 21600000).toISOString(),
      updated_at: new Date(Date.now() - 21600000).toISOString(),
    },
  ],
  media: [
    { id: 'media-1', owner_id: 'demo-user-id', storage_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', file_type: 'image/jpeg', width: 1200, height: 800, duration: null, size: 245000, created_at: new Date().toISOString() },
    { id: 'media-2', owner_id: 'user-3', storage_url: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=600&q=80', file_type: 'image/jpeg', width: 1200, height: 800, duration: null, size: 312000, created_at: new Date().toISOString() },
    { id: 'media-3', owner_id: 'user-5', storage_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80', file_type: 'image/jpeg', width: 1200, height: 800, duration: null, size: 189000, created_at: new Date().toISOString() },
  ],
  stories: [],
  story_views: [],
  highlights: [],

  // Social graph
  follows: [],
  likes: [],
  comments: [],
  bookmarks: [],
  reposts: [],

  // Messaging
  conversations: [],
  messages: [],

  // Notifications
  notifications: [],

  // Auth & security
  sessions: [
    { id: 'session-1', user_id: 'demo-user-id', token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock', device: 'Chrome/Windows', ip: '192.168.1.1', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString() },
  ],

  // Workflows
  workflows: [],

  // Companies/Suppliers
  companies: [
    {
      id: 'comp-1', name: 'Nexus Steel Corp', handle: '@nexus_steel', logo: 'NS',
      description: 'Leading supplier of structural steel and metal products for construction and industrial projects.',
      category: 'Raw Materials',
      images: [
        'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=600&h=400&fit=crop',
      ],
      commodities: [
        { item: 'Structural Steel', price: '$580/ton', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=200&h=200&fit=crop' },
        { item: 'Rebar Grade 60', price: '$620/ton', image: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=200&h=200&fit=crop' },
        { item: 'Steel Plates', price: '$710/ton', image: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=200&h=200&fit=crop' },
      ],
      email: 'sales@nexussteel.com', phone: '+1 (800) 555-0101', location: 'Pittsburgh, PA',
      website: 'https://nexussteel.com', rating: 4.8, registered_by: 'user-1',
      created_at: '2024-01-15T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'comp-2', name: 'Pacific Timber Co', handle: '@pacific_timber', logo: 'PT',
      description: 'Sustainably sourced lumber and wood products for construction and furniture manufacturing.',
      category: 'Raw Materials',
      images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1520333789090-1afc82db536a?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&h=400&fit=crop',
      ],
      commodities: [
        { item: 'Douglas Fir Lumber', price: '$480/bdft', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop' },
        { item: 'Plywood Sheets 4×8', price: '$42/sheet', image: 'https://images.unsplash.com/photo-1520333789090-1afc82db536a?w=200&h=200&fit=crop' },
        { item: 'Cedar Shingles', price: '$185/sq', image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=200&h=200&fit=crop' },
      ],
      email: 'orders@pactimber.com', phone: '+1 (800) 555-0202', location: 'Portland, OR',
      website: 'https://pactimber.com', rating: 4.6, registered_by: 'user-2',
      created_at: '2024-02-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'comp-3', name: 'OmniLogix Solutions', handle: '@omnilogix', logo: 'OL',
      description: 'End-to-end logistics, warehousing, and cold chain storage solutions for global supply chains.',
      category: 'Logistics & Storage',
      images: [
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=600&h=400&fit=crop',
      ],
      commodities: [
        { item: 'Industrial Storage', price: '$12/sq ft', image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=200&fit=crop' },
        { item: 'Warehouse Lease', price: '$8.50/sq ft/mo', image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=200&h=200&fit=crop' },
        { item: 'Cold Chain Storage', price: '$15/sq ft', image: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=200&h=200&fit=crop' },
      ],
      email: 'info@omnilogix.com', phone: '+1 (800) 555-0303', location: 'Memphis, TN',
      website: 'https://omnilogix.com', rating: 4.9, registered_by: 'user-3',
      created_at: '2024-01-20T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'comp-4', name: 'Apex Polymer Group', handle: '@apex_polymer', logo: 'AP',
      description: 'Premium plastic resins and polymer compounds for manufacturing and packaging.',
      category: 'Raw Materials',
      images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&h=400&fit=crop',
      ],
      commodities: [
        { item: 'HDPE Resin', price: '$1.25/lb', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop' },
        { item: 'Polypropylene', price: '$0.98/lb', image: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=200&h=200&fit=crop' },
        { item: 'ABS Pellets', price: '$1.60/lb', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=200&h=200&fit=crop' },
      ],
      email: 'bulk@apexpolymer.com', phone: '+1 (800) 555-0404', location: 'Houston, TX',
      website: 'https://apexpolymer.com', rating: 4.7, registered_by: 'user-4',
      created_at: '2024-03-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'comp-5', name: 'Atlas Aggregate Ltd', handle: '@atlas_agg', logo: 'AA',
      description: 'Construction aggregates, concrete, and building materials for infrastructure projects.',
      category: 'Raw Materials',
      images: [
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&h=400&fit=crop',
      ],
      commodities: [
        { item: 'Crushed Gravel', price: '$28/ton', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&h=200&fit=crop' },
        { item: 'River Sand', price: '$35/ton', image: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=200&h=200&fit=crop' },
        { item: 'Ready-Mix Concrete', price: '$125/cu yd', image: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=200&h=200&fit=crop' },
      ],
      email: 'quotes@atlasagg.com', phone: '+1 (800) 555-0505', location: 'Denver, CO',
      website: 'https://atlasagg.com', rating: 4.5, registered_by: 'user-5',
      created_at: '2024-02-15T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'comp-6', name: 'TransGlobal Freight', handle: '@tgfreight', logo: 'TG',
      description: 'International shipping, customs brokerage, and freight forwarding services worldwide.',
      category: 'Logistics & Storage',
      images: [
        'https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop',
      ],
      commodities: [
        { item: 'FCL Shipping 20ft', price: '$2,800/route', image: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=200&h=200&fit=crop' },
        { item: 'LTL Freight', price: '$0.18/lb', image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=200&h=200&fit=crop' },
        { item: 'Customs Brokerage', price: '$350/entry', image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=200&fit=crop' },
      ],
      email: 'dispatch@tgfreight.com', phone: '+1 (800) 555-0606', location: 'Long Beach, CA',
      website: 'https://tgfreight.com', rating: 4.4, registered_by: 'user-6',
      created_at: '2024-03-10T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'comp-7', name: 'Apex Construction Group', handle: '@apex_construction', logo: 'AC',
      description: 'General contracting, commercial builds, and infrastructure development.',
      category: 'Buildings & Construction',
      images: [
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1590274853856-f22d5ee3d228?w=600&h=400&fit=crop',
      ],
      commodities: [
        { item: 'Commercial Build-Out', price: '$150/sq ft', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&h=200&fit=crop' },
        { item: 'Concrete Foundations', price: '$85/cu yd', image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=200&h=200&fit=crop' },
        { item: 'Steel Framing', price: '$12/sq ft', image: 'https://images.unsplash.com/photo-1590274853856-f22d5ee3d228?w=200&h=200&fit=crop' },
      ],
      email: 'info@apexconstruction.com', phone: '+1 (800) 555-0707', location: 'Dallas, TX',
      website: 'https://apexconstruction.com', rating: 4.7, registered_by: 'user-1',
      created_at: '2024-04-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'comp-8', name: 'GreenHarvest Farms', handle: '@greenharvest', logo: 'GH',
      description: 'Organic produce, grains, and agricultural products sourced from sustainable farms.',
      category: 'Agriculture',
      images: [
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&h=400&fit=crop',
      ],
      commodities: [
        { item: 'Organic Wheat', price: '$12/bushel', image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=200&h=200&fit=crop' },
        { item: 'Fresh Produce Box', price: '$45/box', image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=200&h=200&fit=crop' },
        { item: 'Bulk Corn', price: '$6.50/bushel', image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=200&h=200&fit=crop' },
      ],
      email: 'sales@greenharvest.com', phone: '+1 (800) 555-0808', location: 'Sacramento, CA',
      website: 'https://greenharvest.com', rating: 4.8, registered_by: 'user-2',
      created_at: '2024-04-10T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'comp-9', name: 'SolarEdge Energy', handle: '@solaredge', logo: 'SE',
      description: 'Solar panels, battery storage, and renewable energy solutions for businesses.',
      category: 'Energy & Utilities',
      images: [
        'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&h=400&fit=crop',
      ],
      commodities: [
        { item: 'Solar Panel 400W', price: '$280/panel', image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200&h=200&fit=crop' },
        { item: 'Battery Storage 10kWh', price: '$8,500/unit', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop' },
        { item: 'Installation Service', price: '$3.50/watt', image: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=200&h=200&fit=crop' },
      ],
      email: 'commercial@solaredge.com', phone: '+1 (800) 555-0909', location: 'Phoenix, AZ',
      website: 'https://solaredge.com', rating: 4.6, registered_by: 'user-3',
      created_at: '2024-04-15T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'comp-10', name: 'Metro Realty Group', handle: '@metrorealty', logo: 'MR',
      description: 'Commercial and residential real estate brokerage, property management, and investment advisory.',
      category: 'Real Estate',
      images: [
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1582407947092-a5f9c8380be7?w=600&h=400&fit=crop',
      ],
      commodities: [
        { item: 'Office Space Lease', price: '$35/sq ft/yr', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&h=200&fit=crop' },
        { item: 'Property Management', price: '8% of rent', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=200&fit=crop' },
        { item: 'Investment Advisory', price: '$500/consultation', image: 'https://images.unsplash.com/photo-1582407947092-a5f9c8380be7?w=200&h=200&fit=crop' },
      ],
      email: 'deals@metrorealty.com', phone: '+1 (800) 555-1010', location: 'Chicago, IL',
      website: 'https://metrorealty.com', rating: 4.5, registered_by: 'user-4',
      created_at: '2024-05-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
  ],

  // Products (physical product marketplace)
  products: [
    {
      id: 'prod-1', name: 'MacBook Pro 16" M3 Max', description: 'Like-new condition, includes AppleCare+ until 2027. 36GB RAM, 1TB SSD.',
      price: 2800, category: 'Electronics', condition: 'used', images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&h=400&fit=crop',
      ],
      seller_id: 'demo-user-id', seller_name: 'Pratham', seller_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
      stock: 1, location: 'Global', created_at: '2026-07-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-2', name: 'Standing Desk - Electric Adjustable', description: '60x30 inches, dual motor, programmable presets. Barely used.',
      price: 450, category: 'Furniture', condition: 'used', images: [
        'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&h=400&fit=crop',
      ],
      seller_id: 'user-1', seller_name: 'Dr. Elena Vance', seller_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
      stock: 1, location: 'SF', created_at: '2026-06-28T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-3', name: 'Sony WH-1000XM5 Headphones', description: 'Noise cancelling, mint condition with original box and accessories.',
      price: 280, category: 'Electronics', condition: 'used', images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=400&fit=crop',
      ],
      seller_id: 'user-2', seller_name: 'Mark S.', seller_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
      stock: 2, location: 'NYC', created_at: '2026-06-25T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-4', name: 'Industrial Tool Set - 200 Pieces', description: 'Professional grade mechanic tools, chrome vanadium steel. New in box.',
      price: 189, category: 'Tools', condition: 'new', images: [
        'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1530124566582-a45a7c7cefca?w=600&h=400&fit=crop',
      ],
      seller_id: 'user-3', seller_name: 'TechObserver', seller_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80',
      stock: 5, location: 'London', created_at: '2026-06-20T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-5', name: 'Ergonomic Office Chair', description: 'Herman Miller Aeron, fully loaded with lumbar support. Excellent condition.',
      price: 650, category: 'Furniture', condition: 'used', images: [
        'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1589364219664-aec8f0e64e37?w=600&h=400&fit=crop',
      ],
      seller_id: 'user-4', seller_name: 'Dr. James Okoye', seller_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80',
      stock: 1, location: 'Lagos', created_at: '2026-06-18T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-6', name: '3D Printer - Bambu Lab X1C', description: 'Multi-color printing, enclosed chamber. Includes 4 rolls of filament.',
      price: 1200, category: 'Electronics', condition: 'new', images: [
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1563520239932-09b42010a5e1?w=600&h=400&fit=crop',
      ],
      seller_id: 'user-5', seller_name: 'Priya Sharma', seller_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
      stock: 1, location: 'Mumbai', created_at: '2026-06-15T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-7', name: 'Canon EOS R5 Camera Body', description: 'Low shutter count, includes extra battery and 64GB CFexpress card.',
      price: 3200, category: 'Electronics', condition: 'used', images: [
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=400&fit=crop',
      ],
      seller_id: 'user-6', seller_name: 'Aria Takahashi', seller_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80',
      stock: 1, location: 'Tokyo', created_at: '2026-06-10T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-8', name: 'Raw Denim Jeans - Slim Fit', description: 'Japanese selvedge denim, 14oz, unwashed. Size 32x32.',
      price: 120, category: 'Clothing', condition: 'new', images: [
        'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=400&fit=crop',
      ],
      seller_id: 'user-7', seller_name: 'CryptoAnon', seller_avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80',
      stock: 3, location: 'Unknown', created_at: '2026-06-05T00:00:00Z', updated_at: new Date().toISOString(),
    },
  ],

  // Personalization
  user_interests: [
    { id: 'int-1', user_id: 'demo-user-id', category: 'Technology', score: 0.9 },
    { id: 'int-2', user_id: 'demo-user-id', category: 'Cryptocurrency', score: 0.85 },
    { id: 'int-3', user_id: 'demo-user-id', category: 'AI', score: 0.8 },
    { id: 'int-4', user_id: 'demo-user-id', category: 'Design', score: 0.6 },
    { id: 'int-5', user_id: 'user-1', category: 'AI', score: 0.95 },
    { id: 'int-6', user_id: 'user-1', category: 'Research', score: 0.9 },
    { id: 'int-7', user_id: 'user-2', category: 'Finance', score: 0.9 },
    { id: 'int-8', user_id: 'user-2', category: 'Markets', score: 0.85 },
    { id: 'int-9', user_id: 'user-5', category: 'Space', score: 0.95 },
    { id: 'int-10', user_id: 'user-5', category: 'Science', score: 0.85 },
    { id: 'int-11', user_id: 'user-6', category: 'DeFi', score: 0.9 },
    { id: 'int-12', user_id: 'user-6', category: 'Web3', score: 0.85 },
  ],

  // Analytics
  analytics_events: [],

  // Users
  users: [
    {
      id: 'demo-user-id',
      username: 'pratham',
      display_name: 'Pratham',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      banner_url: '',
      bio: 'Building high-performance dark-themed decentralized applications and state architectures.',
      website: '',
      location: 'Global',
      is_verified: false,
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      password_hash: '$2b$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Gz0YdK0aK9v8Rc5s7F2q3S',
      two_factor_enabled: false, two_factor_hash: null, two_factor_expires_at: null, two_factor_attempts: 0,
      auth_provider: 'email',
      last_login: new Date().toISOString(),
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'user-1', username: 'elena_vance', display_name: 'Dr. Elena Vance', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      banner_url: '', bio: 'AI safety researcher', website: '', location: 'SF', is_verified: false,
      followers_count: 0, following_count: 0, posts_count: 45, password_hash: '$2b$12$KJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Gz0YdK0aK9v8Rc5s7F2q3S',
      two_factor_enabled: false, two_factor_hash: null, two_factor_expires_at: null, two_factor_attempts: 0, auth_provider: 'email',
      last_login: '2026-07-04T10:00:00Z', status: 'active', created_at: '2024-01-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'user-2', username: 'mark_s', display_name: 'Mark S.', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      banner_url: '', bio: 'Macro investor', website: '', location: 'NYC', is_verified: false,
      followers_count: 0, following_count: 0, posts_count: 67, password_hash: '$2b$12$MJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Gz0YdK0aK9v8Rc5s7F2q3S',
      two_factor_enabled: false, two_factor_hash: null, two_factor_expires_at: null, two_factor_attempts: 0, auth_provider: 'email',
      last_login: '2026-07-03T15:30:00Z', status: 'active', created_at: '2024-01-15T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'user-3', username: 'tech_observer', display_name: 'TechObserver', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
      banner_url: '', bio: 'Tech analyst', website: '', location: 'London', is_verified: false,
      followers_count: 0, following_count: 0, posts_count: 23, password_hash: '$2b$12$NJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Gz0YdK0aK9v8Rc5s7F2q3S',
      two_factor_enabled: false, two_factor_hash: null, two_factor_expires_at: null, two_factor_attempts: 0, auth_provider: 'email',
      last_login: '2026-07-02T09:00:00Z', status: 'active', created_at: '2024-02-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'user-4', username: 'james_okoye', display_name: 'Dr. James Okoye', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      banner_url: '', bio: 'Geneticist | CRISPR researcher', website: '', location: 'Lagos', is_verified: false,
      followers_count: 0, following_count: 0, posts_count: 89, password_hash: '$2b$12$OJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Gz0YdK0aK9v8Rc5s7F2q3S',
      two_factor_enabled: false, two_factor_hash: null, two_factor_expires_at: null, two_factor_attempts: 0, auth_provider: 'email',
      last_login: '2026-07-04T08:00:00Z', status: 'active', created_at: '2023-11-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'user-5', username: 'priya_sharma', display_name: 'Priya Sharma', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      banner_url: '', bio: 'Space exploration journalist', website: '', location: 'Mumbai', is_verified: false,
      followers_count: 0, following_count: 0, posts_count: 112, password_hash: '$2b$12$PJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Gz0YdK0aK9v8Rc5s7F2q3S',
      two_factor_enabled: false, two_factor_hash: null, two_factor_expires_at: null, two_factor_attempts: 0, auth_provider: 'email',
      last_login: '2026-07-04T06:00:00Z', status: 'active', created_at: '2023-09-15T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'user-6', username: 'aria_t', display_name: 'Aria Takahashi', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      banner_url: '', bio: 'DeFi strategist', website: '', location: 'Tokyo', is_verified: false,
      followers_count: 0, following_count: 0, posts_count: 56, password_hash: '$2b$12$QJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Gz0YdK0aK9v8Rc5s7F2q3S',
      two_factor_enabled: false, two_factor_hash: null, two_factor_expires_at: null, two_factor_attempts: 0, auth_provider: 'email',
      last_login: '2026-07-04T12:00:00Z', status: 'active', created_at: '2024-03-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
      id: 'user-7', username: 'crypto_anon', display_name: 'CryptoAnon', avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
      banner_url: '', bio: 'Crypto enthusiast', website: '', location: 'Unknown', is_verified: false,
      followers_count: 0, following_count: 0, posts_count: 3, password_hash: '$2b$12$RJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5Gz0YdK0aK9v8Rc5s7F2q3S',
      two_factor_enabled: false, two_factor_hash: null, two_factor_expires_at: null, two_factor_attempts: 0, auth_provider: 'email',
      last_login: '2026-07-01T00:00:00Z', status: 'active', created_at: '2025-06-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
  ],

  // ── Business Tracker ──────────────────────────────────────
  business_trackers: [
    {
      id: 'tracker-1',
      user_id: 'user-1',
      name: 'My Sales Tracker',
      metrics: [
        { id: 'm1', name: 'Sales', color: '#00D2FF', target: 50, unit: 'items', icon: 'TrendingUp' },
        { id: 'm2', name: 'Revenue', color: '#7928CA', target: 5000, unit: '$', icon: 'DollarSign' },
        { id: 'm3', name: 'Orders', color: '#34D399', target: 30, unit: 'count', icon: 'ShoppingCart' },
        { id: 'm4', name: 'Customers', color: '#F59E0B', target: 100, unit: 'count', icon: 'Users' },
      ],
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],

  business_entries: (() => {
    const entries: any[] = []
    const metrics = [
      { id: 'm1', target: 50 },
      { id: 'm2', target: 5000 },
      { id: 'm3', target: 30 },
      { id: 'm4', target: 100 },
    ]
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const dateStr = d.toISOString().slice(0, 10)
      const dayNum = d.getDay()
      const values: Record<string, number> = {}
      for (const m of metrics) {
        const rand = Math.random()
        if (m.id === 'm1') values[m.id] = Math.floor(20 + rand * 40)
        else if (m.id === 'm2') values[m.id] = Math.floor(2000 + rand * 4000)
        else if (m.id === 'm3') values[m.id] = Math.floor(10 + rand * 25)
        else values[m.id] = Math.floor(40 + rand * 80)
      }
      entries.push({
        id: `entry-${dateStr}`,
        tracker_id: 'tracker-1',
        user_id: 'user-1',
        date: dateStr,
        values,
        notes: i === 0 ? 'Good start today. Revenue is on track.' : '',
        created_at: d.toISOString(),
        updated_at: d.toISOString(),
      })
    }
    return entries
  })(),
}

// ── localStorage persistence for mock mode ─────────────
const LS_PREFIX = 'neutron_'
const PERSIST_TABLES = ['users', 'sessions', 'posts', 'comments', 'likes', 'follows', 'reposts', 'bookmarks', 'notifications', 'conversations', 'messages', 'workflows', 'companies', 'products', 'user_interests', 'media', 'business_trackers', 'business_entries']
let saveTimeout: ReturnType<typeof setTimeout> | null = null

function saveTables() {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    try {
      for (const t of PERSIST_TABLES) {
        if (tables[t]) localStorage.setItem(`${LS_PREFIX}${t}`, JSON.stringify(tables[t]))
      }
    } catch {}
  }, 200)
}

function hydrateTables() {
  try {
    for (const t of PERSIST_TABLES) {
      const raw = localStorage.getItem(`${LS_PREFIX}${t}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) tables[t] = parsed
      }
    }
  } catch {}
}

hydrateTables()

type Query = {
  table: string
  selectCols: string[]
  joins: { field: string; refTable: string; refKey: string; localKey: string }[]
  filters: { col: string; op: string; value: any }[]
  orders: { col: string; dir: 'asc' | 'desc' }[]
  rangeFrom: number
  rangeTo: number
  limitCount: number
  insertData: any | null
  deleteMode: boolean
  updateData: any | null
  upsertData: any | null
  orClause: string | null
  countConfig: { count: 'exact'; head: boolean } | null
}

function createQuery(table: string): Query {
  return {
    table,
    selectCols: ['*'],
    joins: [],
    filters: [],
    orders: [],
    rangeFrom: 0,
    rangeTo: 0,
    limitCount: 0,
    insertData: null,
    deleteMode: false,
    updateData: null,
    upsertData: null,
    orClause: null,
    countConfig: null,
  }
}

function resolveJoins(rows: any[], joins: Query['joins']): any[] {
  if (!joins.length) return rows
  return rows.map(row => {
    const result = { ...row }
    for (const j of joins) {
      const refValue = row[j.localKey]
      if (refValue == null) {
        result[j.field] = null
        continue
      }
      const refTable = tables[j.refTable]
      if (!refTable) { result[j.field] = null; continue }
      const refRow = refTable.find(r => r.id === refValue)
      result[j.field] = refRow || null
    }
    return result
  })
}

function applyFilters(rows: any[], filters: Query['filters']): any[] {
  return rows.filter(row => {
    for (const f of filters) {
      const val = row[f.col]
      switch (f.op) {
        case 'eq': if (val !== f.value) return false; break
        case 'neq': if (val === f.value) return false; break
        case 'in': if (!(f.value as any[])?.includes(val)) return false; break
        case 'is': if (val !== f.value && !(val == null && f.value == null)) return false; break
        case 'ilike': if (!String(val).toLowerCase().includes(String(f.value).toLowerCase().replace(/%/g, ''))) return false; break
      }
    }
    return true
  })
}

function applyOrders(rows: any[], orders: Query['orders']): any[] {
  if (!orders.length) return rows
  return [...rows].sort((a, b) => {
    for (const o of orders) {
      const va = a[o.col], vb = b[o.col]
      if (va == null && vb == null) continue
      if (va == null) return 1
      if (vb == null) return -1
      let cmp = 0
      if (typeof va === 'string' && typeof vb === 'string') cmp = va.localeCompare(vb)
      else if (va < vb) cmp = -1
      else if (va > vb) cmp = 1
      if (cmp !== 0) return o.dir === 'desc' ? -cmp : cmp
    }
    return 0
  })
}

function resolveSelect(columns: string[], row: any): any {
  if (columns.length === 1 && columns[0] === '*') return row
  const result: any = {}
  for (const col of columns) {
    if (col.includes(':')) {
      const [alias, expr] = col.split(':')
      if (expr) result[alias] = row[alias]
    } else {
      result[col] = row[col]
    }
  }
  return result
}

function parseJoinSelect(col: string): { field: string; refTable: string; refKey: string; localKey: string } | null {
  // Match: field:table(*) or field:table!constraint(*) or field:table.field(*) etc.
  const m = col.match(/^(\w+):(\w+)(?:\.(\w+))?(?:!(\w+))?(?:\([^)]*\))?$/)
  if (!m) return null
  const [, field, refTable, refField, constraint] = m
  // Derive local key from constraint name (e.g. posts_author_id_fkey → author_id)
  let localKey = `${field}_id`
  if (constraint) {
    const parts = constraint.split('_')
    if (parts.length >= 3 && parts[parts.length - 1] === 'fkey') {
      localKey = parts.slice(1, -1).join('_')
    }
  }
  return { field, refTable, refKey: refField || constraint || field, localKey }
}

function createMockClient(): SupabaseClient {
  let tableName = ''
  let query: Query | null = null

  const getOrCreateQuery = () => {
    if (!query) query = createQuery(tableName)
    return query
  }

  function executeQuery(resolve: ((v: any) => void) | null): any {
    const q = query || createQuery(tableName)
    let rows = tables[q.table] ? [...tables[q.table]] : []

    if (q.countConfig) {
      rows = applyFilters(rows, q.filters)
      if (q.orClause) {
        const conditions = q.orClause.split(',')
        rows = rows.filter(row => conditions.some(cond => {
          const m = cond.match(/^(\w+)\.(\w+)\.(.+)$/)
          if (!m) return false
          const val = row[m[1]]
          const target = m[3].replace(/%/g, '').toLowerCase()
          switch (m[2]) {
            case 'ilike': return String(val || '').toLowerCase().includes(target)
            case 'eq': return String(val) === target
            default: return false
          }
        }))
      }
      const result = { data: null, error: null, count: rows.length, status: 200, statusText: 'OK' }
      if (resolve) resolve(result)
      return result
    }

    if (q.deleteMode) {
      const beforeCount = rows.length
      const toDelete = applyFilters(rows, q.filters)
      tables[q.table] = tables[q.table]?.filter(r => !toDelete.includes(r)) || []
      const result = { data: null, error: null, count: beforeCount - toDelete.length, status: 200, statusText: 'OK' }
      if (resolve) resolve(result)
      saveTables()
      return result
    }

    if (q.insertData) {
      const newRow = { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...q.insertData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      if (!tables[q.table]) tables[q.table] = []
      tables[q.table].push(newRow)
      const joined = resolveJoins([newRow], q.joins)
      const projected = joined.map(r => resolveSelect(q.selectCols, r))
      const result = { data: projected, error: null, count: 1, status: 201, statusText: 'Created' }
      if (resolve) resolve(result)
      saveTables()
      return result
    }

    if (q.updateData) {
      const updated = applyFilters(rows, q.filters)
      for (const r of updated) Object.assign(r, q.updateData, { updated_at: new Date().toISOString() })
      const result = { data: updated, error: null, count: updated.length, status: 200, statusText: 'OK' }
      if (resolve) resolve(result)
      saveTables()
      return result
    }

    if (q.upsertData) {
      const existing = applyFilters(rows, q.filters)
      if (existing.length) {
        for (const r of existing) Object.assign(r, q.upsertData, { updated_at: new Date().toISOString() })
        const result = { data: existing, error: null, count: existing.length, status: 200, statusText: 'OK' }
        if (resolve) resolve(result)
        saveTables()
        return result
      }
      const newRow = { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...q.upsertData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      if (!tables[q.table]) tables[q.table] = []
      tables[q.table].push(newRow)
      const result = { data: [newRow], error: null, count: 1, status: 201, statusText: 'Created' }
      if (resolve) resolve(result)
      saveTables()
      return result
    }

    rows = applyFilters(rows, q.filters)
    if (q.orClause) {
      const conditions = q.orClause.split(',')
      rows = rows.filter(row => {
        return conditions.some(cond => {
          const m = cond.match(/^(\w+)\.(\w+)\.(.+)$/)
          if (!m) return false
          const [, col, op, rawVal] = m
          const val = row[col]
          const target = rawVal.replace(/%/g, '').toLowerCase()
          switch (op) {
            case 'ilike': return String(val || '').toLowerCase().includes(target)
            case 'eq': return String(val) === target
            default: return false
          }
        })
      })
    }
    rows = applyOrders(rows, q.orders)
    if (q.rangeTo > 0) rows = rows.slice(q.rangeFrom, q.rangeTo + 1)
    else if (q.limitCount > 0) rows = rows.slice(0, q.limitCount)
    const joined = resolveJoins(rows, q.joins)
    const projected = joined.map(r => resolveSelect(q.selectCols, r))
    const result = { data: projected, error: null, count: projected.length, status: 200, statusText: 'OK' }
    if (resolve) resolve(result)
    return result
  }

  const chainable: any = new Proxy({}, {
    get(_, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: any) => void) => executeQuery(resolve)
      }
      if (prop === 'single') {
        return () => {
          const result = executeQuery(null)
          if (result.error || !result.data || result.data.length === 0) {
            return Promise.resolve({ data: null, error: { message: 'No rows found' }, count: 0, status: 406 })
          }
          return Promise.resolve({ data: result.data[0], error: null, count: 1, status: 200, statusText: 'OK' })
        }
      }
      if (prop === 'maybeSingle') {
        return () => {
          const result = executeQuery(null)
          if (!result.data || result.data.length === 0) {
            return Promise.resolve({ data: null, error: null, count: 0, status: 200, statusText: 'OK' })
          }
          return Promise.resolve({ data: result.data[0], error: null, count: 1, status: 200, statusText: 'OK' })
        }
      }

      if (prop === 'select') {
        return function(this: any, ...args: any[]) {
          const cols = args[0] || '*'
          const opts = args[1] || {}
          const q = getOrCreateQuery()
          if (opts.count) q.countConfig = opts
          if (cols.includes('*,')) {
            const parts = (cols as string).split(/\*,\s*/)
            q.selectCols = ['*']
            for (let i = 1; i < parts.length; i++) {
              const parsed = parseJoinSelect(parts[i])
              if (parsed) q.joins.push({ field: parsed.field, refTable: parsed.refTable, refKey: parsed.refKey, localKey: parsed.localKey })
            }
          } else if (cols.includes('!')) {
            const parsed = parseJoinSelect(cols as string)
            if (parsed) {
              if (!q.selectCols.includes('*')) q.selectCols = ['*']
              q.joins.push({ field: parsed.field, refTable: parsed.refTable, refKey: parsed.refKey, localKey: parsed.localKey })
            } else {
              q.selectCols = (cols as string).split(',').map(s => s.trim())
            }
          } else {
            q.selectCols = (cols as string).split(',').map(s => s.trim())
          }
          return chainable
        }
      }
      if (prop === 'insert') return (data: any) => { getOrCreateQuery().insertData = data; return chainable }
      if (prop === 'update') return (data: any) => { getOrCreateQuery().updateData = data; return chainable }
      if (prop === 'delete') return () => { getOrCreateQuery().deleteMode = true; return chainable }
      if (prop === 'upsert') return (data: any) => { getOrCreateQuery().upsertData = data; return chainable }
      if (prop === 'eq') return (col: string, val: any) => { getOrCreateQuery().filters.push({ col, op: 'eq', value: val }); return chainable }
      if (prop === 'neq') return (col: string, val: any) => { getOrCreateQuery().filters.push({ col, op: 'neq', value: val }); return chainable }
      if (prop === 'in') return (col: string, vals: any[]) => { getOrCreateQuery().filters.push({ col, op: 'in', value: vals }); return chainable }
      if (prop === 'is') return (col: string, val: any) => { getOrCreateQuery().filters.push({ col, op: 'is', value: val }); return chainable }
      if (prop === 'or') return (clause: string) => { getOrCreateQuery().orClause = clause; return chainable }
      if (prop === 'order') return (col: string, opts?: { ascending?: boolean }) => { getOrCreateQuery().orders.push({ col, dir: opts?.ascending !== false ? 'asc' : 'desc' }); return chainable }
      if (prop === 'range') return (from: number, to: number) => { const q = getOrCreateQuery(); q.rangeFrom = from; q.rangeTo = to; return chainable }
      if (prop === 'limit') return (n: number) => { getOrCreateQuery().limitCount = n; return chainable }
      return chainable
    },
  })

  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ data: {}, error: { message: 'No Supabase configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env' } }),
      signUp: () => Promise.resolve({ data: {}, error: { data: { message: 'No Supabase configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env' } } }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: (table: string) => { tableName = table; query = null; return chainable },
    channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }), subscribe: () => ({ unsubscribe: () => {} }) }),
    rpc: async (_fn: string, _params: any) => {
      if (_fn === 'increment_count' || _fn === 'decrement_count') {
        const { table_name, column_name, row_id } = _params || {}
        if (table_name && column_name && row_id && tables[table_name]) {
          const target = tables[table_name].find(r => r.id === row_id)
          if (target) {
            const delta = _fn === 'increment_count' ? 1 : -1
            target[column_name] = (target[column_name] || 0) + delta
            saveTables()
          }
        }
      }
      return { data: null, error: null }
    },
    removeChannel: () => Promise.resolve({ error: null }),
  } as any
}

export const supabase: SupabaseClient = realClient || createMockClient()
export const isSupabaseConfigured = !!realClient

export default supabase
