import React from "react";
import { Asset } from "../types";
import { TrendingUp, ShieldCheck, MapPin, Eye, DollarSign, Share2, Bookmark } from "lucide-react";

interface AssetCardProps {
  key?: string;
  asset: Asset;
  onQuickView: (asset: Asset) => void;
  onNegotiate: (asset: Asset) => void;
  onSaveToggle: (assetId: string) => void;
  isSaved: boolean;
}

export default function AssetCard({ asset, onQuickView, onNegotiate, onSaveToggle, isSaved }: AssetCardProps) {
  // Format price beautifully
  const formatValuation = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden flex flex-col group relative hover:border-blue-500/40 transition-all duration-300">
      
      {/* Corner Glow Overlay on hover */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full pointer-events-none group-hover:from-blue-500/15 transition-all duration-500" />

      {/* Asset Banner Image */}
      <div className="relative h-44 overflow-hidden bg-slate-950 border-b border-slate-850/80">
        <img 
          src={asset.image} 
          alt={asset.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 filter opacity-75 group-hover:opacity-95 grayscale-[20%] group-hover:grayscale-0"
          referrerPolicy="no-referrer"
        />
        
        {/* Category Pill Tag */}
        <div className="absolute top-3 left-3 bg-slate-900/95 backdrop-blur-md text-blue-400 text-[10px] font-mono tracking-wider px-2.5 py-1 rounded-md border border-blue-500/30 font-semibold uppercase">
          {asset.category}
        </div>

        {/* Saved/Bookmark Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onSaveToggle(asset.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-lg backdrop-blur-md border transition-all duration-300 ${
            isSaved 
              ? "bg-blue-600 text-white border-blue-500" 
              : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:border-blue-500/50"
          }`}
          title={isSaved ? "Saved to Quantum Grid" : "Bookmark Opportunity"}
        >
          <Bookmark className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} />
        </button>

        {/* Growth Rate Indicator Float */}
        <div className="absolute bottom-3 right-3 bg-emerald-950/90 backdrop-blur-sm px-2.5 py-0.5 rounded-md border border-emerald-500/40 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          <span className="text-emerald-400 font-mono text-xs font-semibold">+{asset.growthRate}%</span>
        </div>
      </div>

      {/* Card Content body */}
      <div className="p-5 flex-1 flex flex-col justify-between relative z-10">
        <div>
          {/* Owner details line (Merchant Account) */}
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-1.5 bg-slate-950/40 border border-slate-800/80 rounded-full px-2 py-0.5" title="Sovereign Merchant Account">
              <img 
                src={asset.ownerAvatar} 
                alt={asset.ownerName}
                className="w-4 h-4 rounded-full object-cover border border-slate-750"
                referrerPolicy="no-referrer"
              />
              <span className="text-slate-400 text-[10px] font-mono tracking-wider truncate max-w-[110px]">{asset.ownerName}</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-slate-400 text-xs bg-slate-950/30 border border-slate-900 px-2 py-0.5 rounded-lg">
              <MapPin className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] font-mono uppercase text-slate-400">{asset.country}</span>
            </div>
          </div>

          {/* Heading */}
          <div className="flex items-start justify-between gap-1 mb-1.5">
            <h4 className="text-lg font-display font-medium text-white group-hover:text-blue-400 transition-colors duration-300 tracking-tight">
              {asset.name}
            </h4>
            {asset.verified && (
              <span className="mt-1" title="Consensus Verified">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 line-clamp-2 h-8 leading-relaxed mb-4 border-l-2 border-blue-600/30 pl-2 text-left italic">
            "{asset.snippet}"
          </p>
        </div>

        <div>
          {/* Pricing area */}
          <div className="border-t border-slate-800 pt-3.5 mt-2 flex items-end justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-widest">Valuation</span>
              <span className="text-xl font-display font-bold text-white tracking-tight flex items-center">
                <span className="text-[14px] text-blue-400 mr-0.5 font-normal">$</span>
                {formatValuation(asset.currentValuation)}
              </span>
            </div>

            {/* Trending Score gauge */}
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-widest">Trending Index</span>
              <span className="text-xs font-mono font-bold text-blue-400">
                {asset.trendingScore} <span className="text-slate-600">/ 100</span>
              </span>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button 
              onClick={() => onQuickView(asset)}
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-mono rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-blue-500/60 hover:bg-slate-850 transition-all duration-300 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              Overview
            </button>
            <button
              onClick={() => onNegotiate(asset)}
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-mono rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 hover:text-white hover:shadow-[0_0_12px_rgba(37,99,235,0.2)] transition-all duration-300 cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Acquire / Bid
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
