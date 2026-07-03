import { Asset, Talent, AuditLog } from "./types";

export const COUNTRIES = [
  "Global Orbit", "United States", "Switzerland", "Singapore", "Japan", "Germany", "United Kingdom", "Canada", "Australia", "Lunar Zone 1", "Mars Terminal A"
];

const USER_AVATAR_PLACEHOLDER = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80";

export const ASSET_LISTINGS: Asset[] = [
  {
    id: "asset-1",
    name: "Astro-DNS Quantum Gateway",
    category: "Digital Assets",
    snippet: "Next-gen secure orbital routing protocol supporting multi-layered encryption.",
    description: "Secures high-frequency data streams against interference. Features plug-and-play SDK and active billing subscribers across 4 continents. Fully operational SaaS architecture.",
    currentValuation: 185345,
    growthRate: 24.6,
    trendingScore: 94,
    country: "Switzerland",
    ownerName: "epiclegend766",
    ownerAvatar: USER_AVATAR_PLACEHOLDER,
    verified: true,
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&fit=crop&q=80",
    details: {
      revenueYearly: 42000,
      userCount: 1560,
      licensingTerms: "Full Domain & IP Codebase Transfer"
    }
  },
  {
    id: "asset-2",
    name: "Helix Orbit Tech",
    category: "Digital Assets",
    snippet: "Fully decentralized Kubernetes orchestrator for low-latency Edge orbital server arrays.",
    description: "Nebula Core delivers low-overhead platform scheduling for edge-based spacecraft and ground stations. Built with Rust and optimized for intermittent satellite connection links.",
    currentValuation: 72500,
    growthRate: 18.3,
    trendingScore: 88,
    country: "Singapore",
    ownerName: "epiclegend766",
    ownerAvatar: USER_AVATAR_PLACEHOLDER,
    verified: true,
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&fit=crop&q=80",
    details: {
      revenueYearly: 28000,
      userCount: 3200,
      licensingTerms: "Exclusive Commercial SaaS Acquisition"
    }
  },
  {
    id: "asset-3",
    name: "Stellar Echo Synth Pack",
    category: "Creative Assets",
    snippet: "Lossless futuristic audio synthesizers and custom ambient noise files for AAA game producers.",
    description: "A highly acclaimed atmospheric synthesizer catalog featuring recorded cosmic pulsars and deep space radar conversions. Leveraged by leading modern film and game makers.",
    currentValuation: 45000,
    growthRate: 12.4,
    trendingScore: 76,
    country: "Germany",
    ownerName: "epiclegend766",
    ownerAvatar: USER_AVATAR_PLACEHOLDER,
    verified: false,
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&fit=crop&q=80",
    details: {
      licensingTerms: "Worldwide Royalty-Free Synchronization Rights",
      patentId: "SP-409A-VOL"
    }
  },
  {
    id: "asset-4",
    name: "Vintage Vinyl Collection",
    category: "Physical Assets",
    snippet: "Premium curated selection of rare analog records spanning 5 decades of iconic music.",
    description: "A hand-curated collection of 320+ original vinyl pressings spanning jazz, rock, soul, and electronic genres. Includes authenticated first pressings and limited editions.",
    currentValuation: 28900,
    growthRate: 31.8,
    trendingScore: 97,
    country: "United Kingdom",
    ownerName: "epiclegend766",
    ownerAvatar: USER_AVATAR_PLACEHOLDER,
    verified: true,
    isPhysicalProduct: true,
    image: "https://images.unsplash.com/photo-1491166617655-0723a0572f35?w=600&fit=crop&q=80",
    details: {
      licensingTerms: "Physical Collectible — Full Transfer of Ownership"
    }
  },
  {
    id: "asset-5",
    name: "DeFi Yield Strategy Vault",
    category: "Financial Opportunities",
    snippet: "Government-backed yielding bonds with quarterly revenue distributions from DeFi protocols.",
    description: "Secured mining trust bonds pegged directly to heavy cargo shipments from orbital refineries. Yields computed on actual tonnage deliveries, providing a hedge against hyperinflation.",
    currentValuation: 112000,
    growthRate: 8.9,
    trendingScore: 82,
    country: "Lunar Zone 1",
    ownerName: "epiclegend766",
    ownerAvatar: USER_AVATAR_PLACEHOLDER,
    verified: true,
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&fit=crop&q=80",
    details: {
      yieldYearly: 10.4,
      licensingTerms: "Fully Sovereign backed trust structure"
    }
  },
  {
    id: "asset-6",
    name: "Skyline Commercial Tower",
    category: "Real Estate",
    snippet: "Commercial office tower and automated drone fulfillment hub situated near Geneva Space Port.",
    description: "Premium double-tier structural workspace designed for high-throughput heavy logistics and automated supply lines. Features self-sustaining solar panels and custom oxygen recirculation systems.",
    currentValuation: 2450000,
    growthRate: 15.5,
    trendingScore: 91,
    country: "Switzerland",
    ownerName: "epiclegend766",
    ownerAvatar: USER_AVATAR_PLACEHOLDER,
    verified: true,
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&fit=crop&q=80",
    details: {
      builtYear: 2024,
      sizeSqFt: 45000,
      yieldYearly: 7.9
    }
  },
  {
    id: "asset-7",
    name: "Orion Biotech Seed Lab",
    category: "Business Marketplace",
    snippet: "High-potential biological startup research company with active clinical trials on lunar wheat hybrids.",
    description: "Acquire standard operations of Orion Bio, including 4 laboratory spaces, deep learning genome pipelines, and two pending aerospace patents.",
    currentValuation: 850000,
    growthRate: 29.4,
    trendingScore: 95,
    country: "Canada",
    ownerName: "epiclegend766",
    ownerAvatar: USER_AVATAR_PLACEHOLDER,
    verified: true,
    image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600&fit=crop&q=80",
    details: {
      revenueYearly: 125000,
      userCount: 240,
      licensingTerms: "Total Ownership Transfer with 2 active researchers"
    }
  },
  {
    id: "asset-8",
    name: "Ion Engine Stabilization Patent",
    category: "Intellectual Property",
    snippet: "Registered international patent on high-efficiency magnetic plasma confinement grids.",
    description: "Sustained thermonuclear confinement technology allowing ion engines to run at 12% higher propellant velocity. Valid and active patent registry until 2045 with recurring licensing streams.",
    currentValuation: 1450000,
    growthRate: 11.2,
    trendingScore: 80,
    country: "United States",
    ownerName: "epiclegend766",
    ownerAvatar: USER_AVATAR_PLACEHOLDER,
    verified: true,
    image: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&fit=crop&q=80",
    details: {
      patentId: "US-PAT-9080A1",
      licensingTerms: "Exclusive Licensing/Master Assignee Transfer"
    }
  },
  {
    id: "asset-9",
    name: "Apex Aero-Drone Logistics Ltd",
    category: "Business Marketplace",
    snippet: "Fully registered and operating heavy rotor drone delivery franchise across the Australian Outback.",
    description: "Existing company with a fleet of 32 medium-haul cargo drones and automated charging docks. Immediate revenue streams from miners, medical outposts, and pastoralists.",
    currentValuation: 420000,
    growthRate: 14.8,
    trendingScore: 84,
    country: "Australia",
    ownerName: "epiclegend766",
    ownerAvatar: USER_AVATAR_PLACEHOLDER,
    verified: true,
    image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&fit=crop&q=80",
    details: {
      revenueYearly: 168000,
      userCount: 850,
      licensingTerms: "Franchise operator license included"
    }
  }
];


export const TALENTS_DATA: Talent[] = [
  {
    id: "talent-1",
    name: "Luna Vane",
    role: "Ambient Electronic Vocalist",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&fit=crop&q=85",
    category: "Talent Booking",
    rating: 4.95,
    reviewsCount: 42,
    tags: ["Singer", "Immersive Sounds", "Cozy Wave"],
    bio: "Pioneering the next era of stellar-ambient synthesis. Known for haunting vocals on the soundtracks of 'Martian Horizon' and 'Echo Space'.",
    dayRate: 1200,
    audioPreview: "Floating In Vacuum (Pre-Production Demo)",
    countries: ["Switzerland", "Global Orbit", "United States"],
    portfolioImages: ["https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&fit=crop&q=80"],
    availability: ["2026-06-20", "2026-06-21", "2026-07-01"]
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "log-1",
    action: "USER_AUTHENTICATION_MFA",
    timestamp: "2026-06-15T08:12:11",
    category: "SECURITY",
    details: "MFA signature confirmed. Session established via quantum enclave.",
    ipAddress: "192.168.100.41 (Subnet-B)"
  },
  {
    id: "log-2",
    action: "OWNERSHIP_VERIFICATION",
    timestamp: "2026-06-15T08:35:42",
    category: "SECURITY",
    details: "Valuation license US-PAT-9080A1 verified via blockchain consensus node.",
    ipAddress: "204.14.88.9"
  },
  {
    id: "log-3",
    action: "ESCROW_LEDGER_STANDBY",
    timestamp: "2026-06-15T09:01:00",
    category: "TRANSACTION",
    details: "Escrow smart contract pool loaded. Waiting for transaction events.",
    ipAddress: "127.0.0.1 (Local Core API)"
  }
];
