export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'candlestick' | 'multi' | 'mixed';

export interface DataPoint {
  [key: string]: string | number;
}

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
  type?: 'line' | 'bar' | 'area'; // For mixed charts
}

export interface GraphComment {
  id: string;
  graphId: string;
  creatorName: string;
  creatorAvatar: string;
  text: string;
  createdAt: string;
  likes: number;
  replies: GraphCommentReply[];
}

export interface GraphCommentReply {
  id: string;
  creatorName: string;
  creatorAvatar: string;
  text: string;
  createdAt: string;
  likes: number;
}

export interface AIAnalysis {
  summary: string;
  trend: string;
  predictions: string;
  insights: string[];
  confidence: string;
  analyzedAt: string;
}

export interface Graph {
  id: string;
  title: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  creatorHandle: string;
  uploadDate: string;
  views: number;
  likes: number;
  isLikedByUser?: boolean;
  commentsCount: number;
  comments: GraphComment[];
  tags: string[];
  category: string;
  description: string;
  
  // Chart Design & Spec
  type: ChartType;
  data: DataPoint[];
  seriesList: ChartSeries[]; // Multi-series config
  independentKey: string; // usually first column or 'label'
  
  // Customizations
  themeColor: string; // Hex or alias (e.g. #00BFFF)
  gridVisible: boolean;
  dotVisible: boolean;
  showValues: boolean;
  isAreaGradient: boolean;
  
  // Privacy & Organization
  isPrivate: boolean;
  password?: string;
  folderId?: string | null;
  passwordProtected?: boolean;
  sharedWith?: string[]; // Tagged usernames or emails with edit permissions
  
  // AI Insights Cache
  aiAnalysis?: AIAnalysis;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface CreatorProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  email?: string; // Contact email for sharing graphs
  bio: string;
  followers: number;
  following: number;
  totalViews: number;
  totalLikes: number;
  isFollowing?: boolean;
}

export interface SystemNotification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'system';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}
