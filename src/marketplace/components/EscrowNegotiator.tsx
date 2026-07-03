import React, { useState, useEffect } from "react";
import { Asset } from "../types";
import { DollarSign, Cpu, CheckCircle, ShieldCheck, RefreshCw, Key } from "lucide-react";

interface EscrowNegotiatorProps {
  initialAsset: Asset | null;
  allAssets: Asset[];
  userBalance: number;
  onDeductBalance: (amount: number) => void;
  onRegisterOwnership: (assetId: string) => void;
  ownedAssetIds: string[];
}

export default function EscrowNegotiator({ 
  initialAsset, 
  allAssets, 
  userBalance, 
  onDeductBalance, 
  onRegisterOwnership,
  ownedAssetIds
}: EscrowNegotiatorProps) {
  
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(initialAsset || allAssets[0] || null);
  const [offerPrice, setOfferPrice] = useState<string>("");
  const [errorStatus, setErrorStatus] = useState("");

  // Escrow State Machine
  const [escrowStatus, setEscrowStatus] = useState<"IDLE" | "LOCKED" | "VERIFYING" | "TRANSACTION_SUCCESS">("IDLE");
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [escrowCode, setEscrowCode] = useState("");

  // Sync selected asset if parent changes initialAsset
  useEffect(() => {
    const targetAsset = initialAsset || allAssets[0];
    if (targetAsset) {
      setSelectedAsset(targetAsset);
      setOfferPrice(targetAsset.currentValuation.toString());
      setEscrowStatus("IDLE");
    }
  }, [initialAsset, allAssets]);

  // Escrow secure execution
  const handleSecureEscrow = () => {
    if (!selectedAsset) return;
    const priceNum = offerPrice ? parseFloat(offerPrice) : selectedAsset.currentValuation;

    if (userBalance < priceNum) {
      setErrorStatus("Insufficient credits in your Neutron wallet to lock escrow.");
      return;
    }

    onDeductBalance(priceNum);
    setEscrowStatus("LOCKED");
    
    // Generate a secure hash
    const hex = Math.random().toString(16).substring(2, 10).toUpperCase();
    setEscrowCode(`NTRN-ESC-${hex}-${priceNum.toString().slice(0, 3)}`);
  };

  const handleVerifyOwnership = () => {
    setEscrowStatus("VERIFYING");
    setVerificationProgress(5);

    const interval = setInterval(() => {
      setVerificationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setEscrowStatus("TRANSACTION_SUCCESS");
          if (selectedAsset) {
            onRegisterOwnership(selectedAsset.id);
          }
          return 100;
        }
        return prev + 15;
      });
    }, 400);
  };

  const currentPrice = selectedAsset ? (offerPrice ? parseFloat(offerPrice) : selectedAsset.currentValuation) : 0;
  const isCurrentlyOwned = selectedAsset ? ownedAssetIds.includes(selectedAsset.id) : false;
  const ownedAssets = allAssets.filter(a => ownedAssetIds.includes(a.id));

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="mb-6 border-b border-slate-800/60 pb-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-display font-medium text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-400" /> Astral Trade Escrow Portal
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Securely acquire high-value startup assets on the decentralized ledger. Set your counter proposal, lock credits into escrow, and verify cryptographic asset deeds.
            </p>
          </div>
        </div>

        {/* Dynamic Buyer Portfolio & Wallet Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Account Balance Card */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-blue-500/15 flex items-center gap-4 shadow-md">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">Neutron Wallet Balance</span>
              <span className="text-xl font-mono font-bold text-white">${userBalance.toLocaleString()} <span className="text-xs text-slate-400 font-normal">CRD</span></span>
              <span className="text-[9px] text-slate-500 font-mono block mt-0.5">Liquid credits ready for swap</span>
            </div>
          </div>

          {/* Acquired Counts Card */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/15 flex items-center gap-4 shadow-md">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block font-semibold">Total Acquisitions</span>
              <span className="text-xl font-mono font-bold text-emerald-400">
                {ownedAssetIds.length} <span className="text-xs text-slate-400 font-normal">Sovereign {ownedAssetIds.length === 1 ? "Asset" : "Assets"}</span>
              </span>
              <span className="text-[9px] text-slate-500 font-mono block mt-0.5">Added to cryptographic ledger</span>
            </div>
          </div>
        </div>

        {/* List of Bought Assets with pictures, categories & prices */}
        <div className="mt-4">
          {ownedAssets.length > 0 ? (
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 text-left">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wide block mb-2 font-bold">Your Verified Acquisitions Ledger:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {ownedAssets.map((asset) => (
                  <div key={asset.id} className="bg-slate-950/90 border border-slate-800 p-2.5 rounded-lg flex items-center gap-3 hover:border-slate-700 transition-all">
                    <img 
                      src={asset.image} 
                      alt={asset.name} 
                      className="w-8 h-8 rounded object-cover border border-slate-800 shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-white text-xs font-semibold block truncate" title={asset.name}>{asset.name}</span>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mt-0.5">
                        <span className="truncate max-w-[70px] uppercase font-mono text-[9px] text-slate-400">{asset.category.split(" ")[0]}</span>
                        <span className="text-emerald-400 font-semibold font-mono">${asset.currentValuation.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/20 border border-dashed border-slate-800/80 rounded-xl p-3 text-center">
              <span className="text-[11px] text-slate-500 font-mono">No sovereign assets acquired on ledger yet. Choose an asset on the Explorer to begin instant counter proposal verification.</span>
            </div>
          )}
        </div>
      </div>

      {/* Target Ledger Escrow Engine Card */}
      <div className="max-w-xl mx-auto mt-6 bg-slate-950/40 p-5 rounded-2xl border border-slate-800 space-y-6 shadow-xl relative z-10 text-left">
        
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
          <span className="text-[10px] text-blue-400 font-mono uppercase font-semibold">Ledger Escrow System</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {selectedAsset && (
          <div className="p-4 bg-slate-950/65 rounded-xl border border-slate-800 space-y-3">
            <span className="text-[9px] text-blue-400 font-mono uppercase block">Target Ledger Asset</span>
            
            <div className="flex gap-3 items-center">
              <img 
                src={selectedAsset.image} 
                alt={selectedAsset.name} 
                className="w-12 h-12 rounded-lg object-cover border border-slate-800"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="text-white text-sm font-semibold block">{selectedAsset.name}</span>
                <span className="text-slate-500 text-[10px] block font-mono">Owner/Contract: {selectedAsset.ownerName}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2 pt-3 border-t border-slate-900/80 font-mono text-xs">
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">Listed Price</span>
                <span className="text-white block font-bold text-sm">${selectedAsset.currentValuation.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">Sector</span>
                <span className="text-blue-400 block uppercase font-bold text-[10px] truncate">{selectedAsset.category}</span>
              </div>
            </div>
          </div>
        )}

        {/* Custom counter-offer input */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 font-mono uppercase block">Your Counter Proposal ($ Credits)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-400 font-mono text-xs">
              $
            </div>
            <input
              type="number"
              placeholder="e.g. 290000"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              disabled={escrowStatus !== "IDLE" || isCurrentlyOwned}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg pl-6 py-2 outline-none font-mono focus:border-blue-500"
            />
          </div>
        </div>

        {/* Escrow processing state content */}
        <div className="pt-2">
          {isCurrentlyOwned ? (
            <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/35 text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <span className="text-xs text-white block font-bold">Ownership Transferred</span>
              <span className="text-[10px] text-emerald-400 font-mono block leading-relaxed">This asset index is now stored in your local grid keys.</span>
            </div>
          ) : escrowStatus === "IDLE" ? (
            <div className="space-y-3">
              <span className="text-[11px] text-slate-400 block leading-relaxed text-center">
                Locking funds secures the transaction. The owner can only access the credits once block verification is verified.
              </span>
              <button
                type="button"
                onClick={handleSecureEscrow}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold py-2.5 rounded-lg transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                🔒 Lock ${currentPrice.toLocaleString()} credits in Escrow
              </button>
            </div>
          ) : escrowStatus === "LOCKED" ? (
            <div className="space-y-3 text-center">
              <span className="text-xs text-emerald-400 font-bold block">🔒 FUNDS LOCKED SUCCESSFULLY</span>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-blue-500/30 font-mono text-[10px] text-white my-1 select-all" title="Click to copy signature token">
                Signature: {escrowCode}
              </div>
              <button
                onClick={handleVerifyOwnership}
                className="w-full font-mono text-xs bg-blue-600 text-white font-extrabold py-2.5 rounded-lg hover:bg-blue-500 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                Initiate Blockchain IP Registry Search
              </button>
            </div>
          ) : escrowStatus === "VERIFYING" ? (
            <div className="space-y-3 text-center">
              <span className="text-xs text-blue-400 font-mono block uppercase tracking-wider">Verifying Smart Contract Node</span>
              <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
                <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${verificationProgress}%` }} />
              </div>
              <span className="text-[10px] text-slate-500 font-mono block">Status: {verificationProgress}% Node confirmation...</span>
            </div>
          ) : (
            <div className="bg-blue-950/20 p-4 rounded-xl border border-blue-500/40 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-blue-400 mx-auto" />
              <span className="text-xs text-white block font-bold">Verification Confirmed</span>
              <span className="text-[10px] text-blue-400 font-mono block">License transferred to active wallet address</span>
            </div>
          )}

          {errorStatus && (
            <div className="mt-3 p-2 bg-red-950/40 border border-red-500/40 text-red-400 text-[11px] font-mono rounded-lg text-center">
              {errorStatus}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
