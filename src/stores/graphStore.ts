import { create } from 'zustand'

export interface GraphCard {
  id: string
  title: string
  change: string
  positive: boolean
  tags: string[]
  likes: number
  comments: number
  type: 'line' | 'bar' | 'area' | 'pie' | 'doughnut'
  colors: string[]
  dataPoints: number[]
  labels?: string[]
  creatorName: string
  creatorAvatar: string
  createdAt: Date
}

interface GraphState {
  graphs: GraphCard[]
  addGraph: (graph: Omit<GraphCard, 'id' | 'likes' | 'comments' | 'createdAt'>) => void
  removeGraph: (id: string) => void
  reset: () => void
}

const DEFAULT_GRAPHS: GraphCard[] = [
  { id: 'g2', title: 'Web3 Protocol Gas Index (N-Candle)', change: '+12.5%', positive: true, tags: ['#ETHEREUM', '#WEB3', '#EVM'], likes: 914, comments: 5, type: 'bar', colors: ['#ef4444', '#22c55e'], dataPoints: [40, 70, 30, 90, 50, 80, 60, 40, 70, 30, 85, 55], creatorName: 'Devin Vance', creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', createdAt: new Date(Date.now() - 3600000) },
  { id: 'g1', title: 'Solana (SOL) Market Cap & Volume Confluence', change: '+8.7%', positive: true, tags: ['#CRYPTO', '#FINANCE', '#WEB3'], likes: 512, comments: 4, type: 'line', colors: ['#00D2FF', '#a855f7'], dataPoints: [30, 25, 28, 15, 18, 10, 12, 8, 5], creatorName: 'Aria Takahashi', creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', createdAt: new Date(Date.now() - 7200000) },
  { id: 'g3', title: 'Deep Genomics Multi-Series RNA Fold Frequency', change: '+15.3%', positive: true, tags: ['#BIOTECH', '#GENETICS', '#AI'], likes: 318, comments: 1, type: 'area', colors: ['#22c55e', '#16a34a'], dataPoints: [30, 18, 20, 12, 15, 10, 8, 6, 5], creatorName: 'Lina Vance', creatorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80', createdAt: new Date(Date.now() - 10800000) },
]

export const useGraphStore = create<GraphState>((set) => ({
  graphs: DEFAULT_GRAPHS,

  addGraph: (graph) => set((s) => ({
    graphs: [
      {
        ...graph,
        id: `g_${Math.random().toString(36).substring(2, 9)}`,
        likes: 0,
        comments: 0,
        createdAt: new Date(),
      },
      ...s.graphs,
    ],
  })),

  removeGraph: (id) => set((s) => ({
    graphs: s.graphs.filter(g => g.id !== id),
  })),

  reset: () => set({ graphs: DEFAULT_GRAPHS }),
}))
