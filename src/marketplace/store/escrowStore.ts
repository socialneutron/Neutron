import { create } from "zustand";
import { Asset } from "../types";

export type EscrowStep =
  | "First Bid Accepted"
  | "Secure Transaction"
  | "Transaction Details"
  | "Asset Exchange"
  | "Completed";

export type BidStatus =
  | "PENDING_SELLER_APPROVAL"
  | "ACCEPTED"
  | "REJECTED"
  | "IN_ESCROW"
  | "COMPLETED";

export interface Bid {
  id: string;
  asset: Asset;
  bidder: string;
  bidderAvatar: string;
  bidAmount: number;
  memo: string;
  status: BidStatus;
  createdAt: string;
  currentStep: number;
}

export interface SellerNotification {
  id: string;
  bidId: string;
  read: boolean;
}

export interface ActiveTransaction {
  id: string;
  asset: Asset;
  bidId: string;
  currentStep: number;
  status: "ACTIVE" | "COMPLETED" | "FAILED";
  startedAt: string;
}

export interface CompletedTrade {
  id: string;
  assetName: string;
  assetImage: string;
  category: string;
  finalPrice: number;
  completedAt: string;
  escrowId: string;
}

function genId(prefix: string): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let id = `${prefix}-`;
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export const ESCROW_STEPS: EscrowStep[] = [
  "First Bid Accepted",
  "Secure Transaction",
  "Transaction Details",
  "Asset Exchange",
  "Completed",
];

export const STEP_DESCRIPTIONS: Record<EscrowStep, string> = {
  "First Bid Accepted": "Your bid has been received and accepted by the seller.",
  "Secure Transaction": "Locking protocol credits and verifying funding hashes.",
  "Transaction Details": "Validating legal contracts and metadata signatures.",
  "Asset Exchange": "Distributing title deeds and decryption key handshake.",
  "Completed": "Final settlement confirmed. Asset transferred to your ledger.",
};

export const STEP_STATUS_LABELS: Record<number, string> = {
  0: "Bid Submitted",
  1: "Securing Credits",
  2: "Validating Contracts",
  3: "Exchanging Asset",
  4: "Transfer Complete",
};

interface EscrowStore {
  // ── Buyer state ──
  bids: Bid[];
  activeBid: Bid | null;
  walletBalance: number;
  escrowBalance: number;

  // ── Seller state ──
  sellerNotifications: SellerNotification[];
  incomingBids: Bid[];

  // ── Shared state ──
  activeTransaction: ActiveTransaction | null;
  completedTrades: CompletedTrade[];
  ownedAssets: Asset[];

  // ── Buyer actions ──
  submitBid: (asset: Asset, bidder: string, bidderAvatar: string, amount: number, memo: string) => void;
  advanceEscrowStep: () => void;
  completeEscrow: () => void;
  cancelEscrow: () => void;

  // ── Seller actions ──
  acceptBid: (bidId: string) => void;
  rejectBid: (bidId: string) => void;
  markNotificationRead: (notifId: string) => void;

  // ── Shared actions ──
  addOwnedAsset: (asset: Asset) => void;
  resetBid: () => void;
}

export const useEscrowStore = create<EscrowStore>((set, get) => ({
  // ── Initial buyer state ──
  bids: [],
  activeBid: null,
  walletBalance: 15229.943,
  escrowBalance: 0,

  // ── Initial seller state ──
  sellerNotifications: [],
  incomingBids: [],

  // ── Initial shared state ──
  activeTransaction: null,
  completedTrades: [
    {
      id: "ct-1",
      assetName: "Astro-DNS Quantum Gateway",
      assetImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&fit=crop&q=80",
      category: "Digital Assets",
      finalPrice: 185000,
      completedAt: "2026-06-20T14:32:00",
      escrowId: "NEU-ESC-3K8M2P",
    },
    {
      id: "ct-2",
      assetName: "Stellar Echo Synth Pack",
      assetImage: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&fit=crop&q=80",
      category: "Creative Assets",
      finalPrice: 45000,
      completedAt: "2026-06-18T09:15:00",
      escrowId: "NEU-ESC-7R4T1W",
    },
  ],
  ownedAssets: [],

  // ── Buyer: submit bid ──
  submitBid: (asset, bidder, bidderAvatar, amount, memo) => {
    const bidId = genId("BID");
    const newBid: Bid = {
      id: bidId,
      asset,
      bidder,
      bidderAvatar,
      bidAmount: amount,
      memo,
      status: "PENDING_SELLER_APPROVAL",
      createdAt: new Date().toISOString(),
      currentStep: 0,
    };

    set(state => ({
      bids: [newBid, ...state.bids],
      activeBid: newBid,
      incomingBids: [newBid, ...state.incomingBids],
      sellerNotifications: [
        { id: `notif-${Date.now()}`, bidId, read: false },
        ...state.sellerNotifications,
      ],
    }));
  },

  // ── Buyer: advance escrow step ──
  advanceEscrowStep: () => {
    const { activeBid } = get();
    if (!activeBid || activeBid.status !== "IN_ESCROW") return;

    const nextStep = activeBid.currentStep + 1;
    if (nextStep >= ESCROW_STEPS.length) {
      get().completeEscrow();
      return;
    }

    set(state => {
      const updatedBid = { ...state.activeBid!, currentStep: nextStep };
      return {
        activeBid: updatedBid,
        bids: state.bids.map(b => b.id === updatedBid.id ? updatedBid : b),
        incomingBids: state.incomingBids.map(b => b.id === updatedBid.id ? updatedBid : b),
        activeTransaction: state.activeTransaction
          ? { ...state.activeTransaction, currentStep: nextStep }
          : null,
      };
    });
  },

  // ── Buyer: complete escrow ──
  completeEscrow: () => {
    const { activeBid, activeTransaction, completedTrades, ownedAssets, escrowBalance } = get();
    if (!activeBid || !activeTransaction) return;

    const completed: CompletedTrade = {
      id: `ct-${Date.now()}`,
      assetName: activeBid.asset.name,
      assetImage: activeBid.asset.image,
      category: activeBid.asset.category,
      finalPrice: activeBid.bidAmount,
      completedAt: new Date().toISOString(),
      escrowId: activeTransaction.id,
    };

    const finalStep = ESCROW_STEPS.length - 1;
    const completedBid = { ...activeBid, status: "COMPLETED" as BidStatus, currentStep: finalStep };

    set({
      activeBid: completedBid,
      bids: get().bids.map(b => b.id === completedBid.id ? completedBid : b),
      incomingBids: get().incomingBids.map(b => b.id === completedBid.id ? completedBid : b),
      activeTransaction: { ...activeTransaction, currentStep: finalStep, status: "COMPLETED" },
      completedTrades: [completed, ...completedTrades],
      ownedAssets: [...ownedAssets, activeBid.asset],
      escrowBalance: 0,
    });
  },

  // ── Buyer: cancel escrow ──
  cancelEscrow: () => {
    const { activeBid, walletBalance, escrowBalance } = get();
    if (activeBid) {
      const cancelledBid = { ...activeBid, status: "REJECTED" as BidStatus };
      set(state => ({
        activeBid: null,
        activeTransaction: null,
        escrowBalance: 0,
        walletBalance: walletBalance + escrowBalance,
        bids: state.bids.map(b => b.id === cancelledBid.id ? cancelledBid : b),
        incomingBids: state.incomingBids.map(b => b.id === cancelledBid.id ? cancelledBid : b),
      }));
    } else {
      set({ activeBid: null, activeTransaction: null, escrowBalance: 0 });
    }
  },

  // ── Seller: accept bid ──
  acceptBid: (bidId) => {
    const { incomingBids, walletBalance, bids: buyerBids, activeBid: currentActiveBid } = get();
    const bid = incomingBids.find(b => b.id === bidId);
    if (!bid) return;

    const acceptedBid: Bid = { ...bid, status: "IN_ESCROW", currentStep: 0 };
    const transaction: ActiveTransaction = {
      id: genId("NEU-ESC"),
      asset: bid.asset,
      bidId: bid.id,
      currentStep: 0,
      status: "ACTIVE",
      startedAt: new Date().toISOString(),
    };

    // Check if the current user is also the buyer (demo: same user scenario)
    const isAlsoBuyer = currentActiveBid?.id === bidId;

    set(state => ({
      incomingBids: state.incomingBids.map(b => b.id === bidId ? acceptedBid : b),
      bids: state.bids.map(b => b.id === bidId ? acceptedBid : b),
      activeBid: acceptedBid,
      activeTransaction: transaction,
      sellerNotifications: state.sellerNotifications.filter(n => n.bidId !== bidId),
      // Seller receives the bid amount, buyer locks funds into escrow
      walletBalance: isAlsoBuyer ? walletBalance : walletBalance + bid.bidAmount,
      escrowBalance: isAlsoBuyer ? bid.bidAmount : state.escrowBalance,
    }));
  },

  // ── Seller: reject bid ──
  rejectBid: (bidId) => {
    const rejectedBid = get().incomingBids.find(b => b.id === bidId);
    if (!rejectedBid) return;

    const updated: Bid = { ...rejectedBid, status: "REJECTED" };

    set(state => ({
      incomingBids: state.incomingBids.map(b => b.id === bidId ? updated : b),
      bids: state.bids.map(b => b.id === bidId ? updated : b),
      sellerNotifications: state.sellerNotifications.filter(n => n.bidId !== bidId),
      activeBid: state.activeBid?.id === bidId ? null : state.activeBid,
    }));
  },

  // ── Seller: mark notification read ──
  markNotificationRead: (notifId) => {
    set(state => ({
      sellerNotifications: state.sellerNotifications.map(n =>
        n.id === notifId ? { ...n, read: true } : n
      ),
    }));
  },

  // ── Shared ──
  addOwnedAsset: (asset) => set(state => ({ ownedAssets: [...state.ownedAssets, asset] })),

  resetBid: () => set({ activeBid: null, activeTransaction: null, escrowBalance: 0 }),
}));
