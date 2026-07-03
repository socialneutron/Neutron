export type Category = 
  | "Digital Assets"
  | "Creative Assets"
  | "Intellectual Property"
  | "Business Marketplace"
  | "Financial Opportunities"
  | "Real Estate"
  | "Talent Booking"
  | "Company Assets"
  | "Copyrights & IP"
  | "App Shares"
  | "Bonds & Yields"
  | "Physical Products"
  | "Other / Etc";

export interface AssetBid {
  id: string;
  bidder: string;
  bidAmount: number;
  timestamp: string;
}

export interface Asset {
  id: string;
  name: string;
  category: Category;
  snippet: string;
  description: string;
  currentValuation: number; // in USD or buy price
  growthRate: number; // percentage, e.g. 14.8
  trendingScore: number; // 1-100
  country: string;
  ownerName: string;
  ownerAvatar: string;
  verified: boolean;
  image: string; // thumbnail / photo
  externalLink?: string; // optional documentation or asset link
  isPhysicalProduct?: boolean;
  physicalProductPhotos?: string[]; // uploaded photos array
  isPublishedToFeed?: boolean; // toggle to post to home feed
  bids?: AssetBid[]; // bid updates
  buyEnabled?: boolean;
  details: {
    revenueYearly?: number;
    userCount?: number;
    licensingTerms?: string;
    patentId?: string;
    yieldYearly?: number; // for bonds/real estate
    builtYear?: number;
    sizeSqFt?: number;
  };
}

export interface Talent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  category: "Talent Booking";
  rating: number;
  reviewsCount: number;
  tags: string[];
  bio: string;
  dayRate: number; // in USD
  audioPreview?: string; // name of track or short description
  countries: string[];
  portfolioImages: string[];
  availability: string[]; // dates that are booked
}

export interface ChatMessage {
  id: string;
  role: "user" | "model" | "system";
  content: string;
  timestamp: string;
  status?: string;
}

export interface EscrowTransaction {
  id: string;
  assetId: string;
  assetName: string;
  buyerEmail: string;
  sellerName: string;
  price: number;
  status: "INITIATED" | "FUNDS_LOCKED" | "VERIFYING_OWNERSHIP" | "COMPLETED" | "REFUNDED";
  progressPercent: number;
  timestamp: string;
  escrowWallet: string;
}

export interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  category: "SECURITY" | "TRANSACTION" | "ACCESS" | "AI_VALUATION";
  details: string;
  ipAddress: string;
}
