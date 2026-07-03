import { Graph, CreatorProfile, SystemNotification } from '../types';

export const CURRENT_USER: CreatorProfile = {
  id: 'user_u1',
  name: 'Epic Legend',
  handle: '@epiclegend',
  email: 'epiclegend766@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  bio: 'Lead Architect & Crypto Quant Analyst. Exploring visual dimensions of decentralized data sets.',
  followers: 1248,
  following: 582,
  totalViews: 45290,
  totalLikes: 8960
};

export const MOCK_PROFILES: CreatorProfile[] = [
  {
    id: 'creator_c1',
    name: 'Aria Takahashi',
    handle: '@aria_t',
    email: 'aria@neutron.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    bio: 'Data Visualization Specialist | Creative Technologist. Turning raw streams into digital glass.',
    followers: 8940,
    following: 412,
    totalViews: 98120,
    totalLikes: 24700
  },
  {
    id: 'creator_c2',
    name: 'Devin Vance',
    handle: '@vance_quant',
    email: 'vance@neutron.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    bio: 'Financial markets algorithm engineer. Backtesting everything with neon aesthetic overlays.',
    followers: 4520,
    following: 928,
    totalViews: 51200,
    totalLikes: 14200
  },
  {
    id: 'creator_c3',
    name: 'Lina Vance',
    handle: '@lina_data',
    email: 'lina@neutron.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
    bio: 'Biostatistician & AI Ethicist. Mapping evolutionary genomics in visual frequency.',
    followers: 6720,
    following: 341,
    totalViews: 71900,
    totalLikes: 19800
  }
];

export const MOCK_GRAPHS: Graph[] = [
  {
    id: 'g1',
    title: 'Solana (SOL) Market Cap & Volume Confluence',
    creatorId: 'creator_c2',
    creatorName: 'Devin Vance',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    creatorHandle: '@vance_quant',
    uploadDate: '2026-06-12',
    views: 8450,
    likes: 512,
    isLikedByUser: false,
    commentsCount: 3,
    comments: [
      {
        id: 'c1_1',
        graphId: 'g1',
        creatorName: 'Aria Takahashi',
        creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        text: 'This multi-series confluence shows beautiful correlation. What smoothing ratio did you use on the moving averages?',
        createdAt: '2026-06-12T14:30:00Z',
        likes: 24,
        replies: [
          {
            id: 'c1_r1',
            creatorName: 'Devin Vance',
            creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
            text: 'I implemented a standard 14-period exponential smoothing here. It filter out the noise nicely while protecting fast-term reaction.',
            createdAt: '2026-06-12T15:02:00Z',
            likes: 12
          }
        ]
      },
      {
        id: 'c1_2',
        graphId: 'g1',
        creatorName: 'Lina Vance',
        creatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
        text: 'Volume clusters around the support bounds are super clear here.',
        createdAt: '2026-06-13T08:12:00Z',
        likes: 14,
        replies: []
      }
    ],
    tags: ['Crypto', 'Finance', 'Web3', 'Solana'],
    category: 'Finance',
    description: 'Confluence overlay displaying daily SOL market caps paired against relative trade volume metrics across decentralized liquidity exchanges.',
    type: 'multi',
    independentKey: 'month',
    data: [
      { month: 'Jan', MarketCap: 120, Volume: 5.2, PriceCheck: 84 },
      { month: 'Feb', MarketCap: 145, Volume: 8.4, PriceCheck: 102 },
      { month: 'Mar', MarketCap: 198, Volume: 14.1, PriceCheck: 139 },
      { month: 'Apr', MarketCap: 172, Volume: 11.2, PriceCheck: 121 },
      { month: 'May', MarketCap: 240, Volume: 19.8, PriceCheck: 168 },
      { month: 'Jun', MarketCap: 310, Volume: 25.4, PriceCheck: 218 }
    ],
    seriesList: [
      { key: 'MarketCap', name: 'MCap ($B)', color: '#00BFFF' },
      { key: 'Volume', name: 'Volume ($B)', color: '#FF00FF' }
    ],
    themeColor: '#00BFFF',
    gridVisible: true,
    dotVisible: true,
    showValues: false,
    isAreaGradient: true,
    isPrivate: false,
    aiAnalysis: {
      summary: "This visualization highlights robust expansion in Solana market capitalization overlaid against spot volume metrics during the first half. A healthy bullish correlation is observable.",
      trend: "We observe an aggressive upward slope in both parameters. Market capitalization surge from $120B to $310B (+158%) is heavily supported by escalating volume spikes, indicative of true institutional accumulation rather than transient speculative bubbles.",
      predictions: "Extrapolating current moving metrics, we forecast Q3 metrics: MCAPs extending towards $345B, volume consolidating at $22.4B, with a potential short-term pullback preceding another breakout.",
      insights: [
        "A volumetric delta gap occurred in April, creating a strong market floor structure.",
        "Consolidation phases in April was brief, driven by solid high-velocity decentralized liquidations.",
        "The Cap-to-Volume efficiency multiplier peaked in June, signaling strong momentum."
      ],
      confidence: "92%",
      analyzedAt: "2026-06-13T10:00:00Z"
    }
  },
  {
    id: 'g2',
    title: 'Deep Genomics Multi-Series RNA Fold Frequency',
    creatorId: 'creator_c3',
    creatorName: 'Lina Vance',
    creatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
    creatorHandle: '@lina_data',
    uploadDate: '2026-06-11',
    views: 4120,
    likes: 318,
    isLikedByUser: false,
    commentsCount: 1,
    comments: [],
    tags: ['Biotech', 'Genetics', 'AI', 'Medicine'],
    category: 'Science',
    description: 'Deep sequenced CRISPR binding fold frequency mapping structural state changes over time.',
    type: 'area',
    independentKey: 'sequence',
    data: [
      { sequence: 'S1', HelixA: 4000, HelixB: 2400 },
      { sequence: 'S2', HelixA: 3000, HelixB: 1398 },
      { sequence: 'S3', HelixA: 2000, HelixB: 9800 },
      { sequence: 'S4', HelixA: 2780, HelixB: 3908 },
      { sequence: 'S5', HelixA: 1890, HelixB: 4800 },
      { sequence: 'S6', HelixA: 2390, HelixB: 3800 },
      { sequence: 'S7', HelixA: 3490, HelixB: 4300 }
    ],
    seriesList: [
      { key: 'HelixA', name: 'Alpha Helix Fold Freq', color: '#00BFFF' },
      { key: 'HelixB', name: 'Beta Sheet Fold Freq', color: '#00FF00' }
    ],
    themeColor: '#00FF00',
    gridVisible: true,
    dotVisible: false,
    showValues: false,
    isAreaGradient: true,
    isPrivate: false,
    aiAnalysis: {
      summary: "Genomic sequence profiling of helix conformations shows extreme divergence at sequence junction S3.",
      trend: "Beta conformations spike radically at Sequence Node 3 while alpha conformations compress. This suggests structural transitions commonly found during targeted endonucleolytic activity.",
      predictions: "Subsequent sequences S8 and S9 are projected to return to standard equilibrium levels of ~2500 and ~3100 as cellular repairs complete.",
      insights: [
        "S3 represents an extreme anomaly with Beta folds surging 10x relative to baseline helix averages.",
        "Alpha configurations remain largely in complementary opposition to major Beta peaks.",
        "These genomic benchmarks confirm success in CRISPR spatial alignment models."
      ],
      confidence: "95%",
      analyzedAt: "2026-06-11T12:00:00Z"
    }
  },
  {
    id: 'g3',
    title: 'Web3 Protocol Gas Index (N-Candle)',
    creatorId: 'creator_c1',
    creatorName: 'Aria Takahashi',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    creatorHandle: '@aria_t',
    uploadDate: '2026-06-13',
    views: 12050,
    likes: 914,
    isLikedByUser: false,
    commentsCount: 5,
    comments: [],
    tags: ['Ethereum', 'Web3', 'EVM', 'Gas'],
    category: 'Crypto',
    description: 'High-frequency EVM gas index volatility representation. Classic candlestick visualization capturing minimum, maximum, open, and close metrics of gas spikes during DeFi trades.',
    type: 'candlestick',
    independentKey: 'time',
    data: [
      { time: '08:00', open: 42, high: 58, low: 35, close: 52 },
      { time: '10:00', open: 52, high: 95, low: 48, close: 88 },
      { time: '12:00', open: 88, high: 120, low: 72, close: 76 },
      { time: '14:00', open: 76, high: 82, low: 50, close: 55 },
      { time: '16:00', open: 55, high: 71, low: 44, close: 68 },
      { time: '18:00', open: 68, high: 140, low: 62, close: 110 },
      { time: '20:00', open: 110, high: 115, low: 90, close: 94 }
    ],
    seriesList: [
      { key: 'close', name: 'Gas Spot price', color: '#00BFFF' }
    ],
    themeColor: '#FFD700',
    gridVisible: true,
    dotVisible: true,
    showValues: false,
    isAreaGradient: false,
    isPrivate: false,
    aiAnalysis: {
      summary: "High volatile EVM gas index metrics showing aggressive trading action with substantial wick deviations.",
      trend: "Volatile spikes are concentrated in core trading intervals at 10:00 and 18:00. These correspond to automated smart contract liquidations and peak NFT launch congestions.",
      predictions: "Based on liquidity distribution, gas is expected to slide downwards to an equilibrium band of 45-60 gwei during off-peak asian session intervals.",
      insights: [
        "The 18:00 candle represents an incredibly wide shadow wick, showing a flash-spike up to 140 gwei that retraced within the hour.",
        "Bullish close at 10:00 was followed by sustained higher gas levels, proving persistent network congestion.",
        "Open-to-Close ranges peaked at 18:00, signaling extreme trading competition."
      ],
      confidence: "90%",
      analyzedAt: "2026-06-13T20:30:00Z"
    }
  }
];

export const MOCK_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'n1',
    type: 'comment',
    title: 'Aria commented on your graph',
    description: '"Excellent structure! Could you export this dataset as CSV?"',
    timestamp: '2 hours ago',
    read: false
  },
  {
    id: 'n2',
    type: 'like',
    title: 'Devin liked your Area chart',
    description: 'Quantum Wave Theory graph successfully registered in Devin\'s dashboard.',
    timestamp: '5 hours ago',
    read: false
  },
  {
    id: 'n3',
    type: 'follow',
    title: 'Lina Vance followed you',
    description: 'Lina Vance joined your global telemetry stream.',
    timestamp: '1 day ago',
    read: true
  }
];
