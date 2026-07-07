import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ASSET_LISTINGS } from "./data";
import { Asset, Category } from "./types";
import {
  Search, Heart, ShoppingCart, Eye, Shield, ShieldCheck, X,
  TrendingUp, MapPin, Users, DollarSign, Tag,
  Home, FileText, BarChart2, Settings,
  ChevronRight, ChevronLeft, ChevronDown, UploadCloud, Plus,
  CheckCircle, Clock, Star, Check, ArrowUpRight, Layers, CreditCard,
  UserCircle, Edit2, Trash2, ShoppingBag, Bell, Send,
  MessageSquare, AlertTriangle, MessageCircle, Stethoscope,
  GraduationCap, Wrench, Microscope, Smile, Phone, Mail,
  Download, File, Repeat2
} from "lucide-react";
import { useUserAvatar } from '../stores/userAvatarStore';
import { postService } from '../services';
import { useFeedStore } from '../stores/feedStore';

// ─── Colour tokens ──────────────────────────────────────────────────
const C = {
  bg:        "#0b0f1a",
  sidebar:   "#0d1220",
  card:      "#111827",
  cardBdr:   "#1f2937",
  accent:    "#2563eb",
  accentHov: "#1d4ed8",
  green:     "#22c55e",
  cyan:      "#06b6d4",
  purple:    "#7c3aed",
  text:      "#f1f5f9",
  muted:     "#6b7280",
  subtext:   "#9ca3af",
  border:    "rgba(255,255,255,0.07)",
  amber:     "#f59e0b",
  red:       "#ef4444",
  gradBlue:  "linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)",
};

const WALLET_CRD = 15229.943;
let USER = "epiclegend766";
let USER_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80";

const CAT_COLOR: Record<string, string> = {
  "Digital Assets":"#2563eb","Creative Assets":"#7c3aed","Intellectual Property":"#0891b2",
  "Business Marketplace":"#d97706","Financial Opportunities":"#f59e0b",
  "Financial Assets":"#f59e0b","Real Estate":"#059669","Talent Booking":"#db2777",
  "Physical Assets":"#b45309","Physical Products":"#b45309",
};

function catColor(cat: string) { return CAT_COLOR[cat] || "#4b5563"; }
function fmt(n: number) { return "$" + n.toLocaleString(); }
function fmtCRD(n: number) { return "$" + n.toLocaleString("en",{minimumFractionDigits:3}); }
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
}

// ─── PLACE BID MODAL ────────────────────────────────────────────────
function PlaceBidModal({
  asset, onClose, onSubmitBid, walletBalance,
}: {
  asset: Asset; onClose: () => void;
  onSubmitBid: (amount: number, memo: string) => void;
  walletBalance: number;
}) {
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const canSubmit = numAmount > 0 && numAmount <= walletBalance;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitted(true);
    setTimeout(() => {
      onSubmitBid(numAmount, memo);
      onClose();
    }, 800);
  };

  return (
    <div
      style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity:0,y:20,scale:0.95 }} animate={{ opacity:1,y:0,scale:1 }}
        transition={{ duration:0.3 }}
        style={{
          background:"#0d1220",border:`1px solid ${submitted ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
          borderRadius:"18px",width:"100%",maxWidth:"440px",overflow:"hidden",
          boxShadow:"0 32px 80px rgba(0,0,0,0.7)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding:"20px 24px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"12px" }}>
            <div style={{ width:"40px",height:"40px",borderRadius:"12px",background:"rgba(37,99,235,0.12)",border:"1px solid rgba(37,99,235,0.25)",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <Send size={18} color={C.accent} />
            </div>
            <div>
              <h3 style={{ margin:0,fontSize:"16px",fontWeight:700,color:"#fff" }}>Place Bid / Buyout</h3>
              <p style={{ margin:"2px 0 0",fontSize:"11px",color:C.muted }}>Submit a secure bid on this asset</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",width:"30px",height:"30px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.muted }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding:"20px 24px" }}>
          {/* Asset preview */}
          <div style={{ display:"flex",gap:"12px",padding:"12px",background:"rgba(255,255,255,0.02)",borderRadius:"12px",border:"1px solid rgba(255,255,255,0.04)",marginBottom:"18px" }}>
            <div style={{ width:"60px",height:"60px",borderRadius:"10px",overflow:"hidden",flexShrink:0 }}>
              <img src={asset.image} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
            </div>
            <div>
              <span style={{ fontSize:"10px",fontWeight:700,padding:"2px 8px",borderRadius:"4px",background:catColor(asset.category),color:"#fff",textTransform:"uppercase" }}>{asset.category}</span>
              <p style={{ margin:"4px 0 0",fontSize:"13px",fontWeight:700,color:"#fff" }}>{asset.name}</p>
              <p style={{ margin:0,fontSize:"12px",color:C.muted }}>Asking: {fmt(asset.currentValuation)} CRD</p>
            </div>
          </div>

          {/* Bid amount */}
          <div style={{ marginBottom:"14px" }}>
            <label style={{ fontSize:"11px",color:C.muted,display:"block",marginBottom:"6px",fontWeight:500 }}>Bid Amount (CRD)</label>
            <div style={{ display:"flex",alignItems:"center",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"10px",padding:"0 14px" }}>
              <DollarSign size={16} color={C.muted} />
              <input
                type="number" placeholder="0.000" value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{ flex:1,background:"none",border:"none",outline:"none",color:"#fff",fontSize:"16px",fontWeight:700,padding:"12px 8px",fontFamily:"inherit" }}
              />
              <span style={{ color:C.muted,fontSize:"12px",fontFamily:"monospace" }}>CRD</span>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",marginTop:"6px" }}>
              <span style={{ fontSize:"10px",color:C.muted }}>Wallet: {fmtCRD(walletBalance)} CRD</span>
              <button
                onClick={() => setAmount(asset.currentValuation.toString())}
                style={{ fontSize:"10px",color:C.accent,background:"none",border:"none",cursor:"pointer",fontWeight:600 }}
              >Use asking price</button>
            </div>
          </div>

          {/* Memo */}
          <div style={{ marginBottom:"18px" }}>
            <label style={{ fontSize:"11px",color:C.muted,display:"block",marginBottom:"6px",fontWeight:500 }}>
              <MessageSquare size={10} style={{ display:"inline",marginRight:4 }} />
              Secure Transaction Memo (optional)
            </label>
            <textarea
              value={memo} onChange={e => setMemo(e.target.value)} rows={2}
              placeholder="Add a message for the seller..."
              style={{ width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"8px",padding:"10px 12px",fontSize:"12px",color:"#fff",outline:"none",resize:"none",boxSizing:"border-box" as const,fontFamily:"inherit" }}
            />
          </div>

          {/* Submit */}
          <motion.button
            onClick={handleSubmit}
            whileHover={canSubmit ? { scale:1.01 } : {}}
            whileTap={canSubmit ? { scale:0.98 } : {}}
            style={{
              width:"100%",padding:"13px",borderRadius:"12px",border:"none",
              background:submitted ? C.green : canSubmit ? C.accent : "rgba(255,255,255,0.06)",
              color:submitted ? "#fff" : canSubmit ? "#fff" : C.muted,
              fontSize:"14px",fontWeight:700,cursor:canSubmit ? "pointer" : "not-allowed",
              display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",
            }}
          >
            {submitted ? (
              <><CheckCircle size={16} /> Bid Submitted!</>
            ) : (
              <><Send size={16} /> Submit Bid</>
            )}
          </motion.button>

          {!canSubmit && numAmount > 0 && (
            <p style={{ margin:"8px 0 0",fontSize:"11px",color:C.red,textAlign:"center" }}>
              Insufficient balance. You have {fmtCRD(walletBalance)} CRD.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── SELLER NOTIFICATION PANEL ──────────────────────────────────────
function SellerNotificationPanel({
  notifications, incomingBids, onAccept, onReject, onDismiss,
}: {
  notifications: { id: string; bidId: string; read: boolean }[];
  incomingBids: { id: string; bidder: string; bidAmount: number; asset: Asset; status: string; createdAt: string }[];
  onAccept: (bidId: string) => void;
  onReject: (bidId: string) => void;
  onDismiss: () => void;
}) {
  const activeBids = incomingBids.filter(b => b.status === "PENDING_SELLER_APPROVAL");
  const unreadCount = notifications.filter(n => !n.read).length;

  if (activeBids.length === 0 && unreadCount === 0) return null;

  return (
    <div
      style={{ position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px" }}
      onClick={onDismiss}
    >
      <motion.div
        initial={{ opacity:0,y:20,scale:0.95 }} animate={{ opacity:1,y:0,scale:1 }}
        transition={{ duration:0.3 }}
        style={{
          background:"#0d1220",border:"1px solid rgba(245,158,11,0.25)",
          borderRadius:"18px",width:"100%",maxWidth:"480px",overflow:"hidden",
          boxShadow:"0 0 60px rgba(245,158,11,0.1)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Glowing header */}
        <div style={{
          padding:"20px 24px",borderBottom:"1px solid rgba(245,158,11,0.15)",
          background:"linear-gradient(135deg,rgba(245,158,11,0.08) 0%,rgba(239,68,68,0.04) 100%)",
          display:"flex",alignItems:"center",justifyContent:"space-between",
        }}>
          <div style={{ display:"flex",alignItems:"center",gap:"12px" }}>
            <motion.div
              animate={{ boxShadow:["0 0 0px #f59e0b00","0 0 20px #f59e0b40","0 0 0px #f59e0b00"] }}
              transition={{ repeat:Infinity,duration:2 }}
              style={{
                width:"42px",height:"42px",borderRadius:"12px",
                background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.3)",
                display:"flex",alignItems:"center",justifyContent:"center",
              }}
            >
              <Bell size={20} color={C.amber} />
            </motion.div>
            <div>
              <h3 style={{ margin:0,fontSize:"16px",fontWeight:700,color:"#fff" }}>Incoming Deal</h3>
              <p style={{ margin:"2px 0 0",fontSize:"11px",color:C.muted }}>{activeBids.length} bid{activeBids.length!==1?"s:" : ":"} awaiting response</p>
            </div>
          </div>
          <button onClick={onDismiss} style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",width:"30px",height:"30px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.muted }}>
            <X size={14} />
          </button>
        </div>

        {/* Bid cards */}
        <div style={{ padding:"16px 24px",maxHeight:"400px",overflowY:"auto" }}>
          {activeBids.map((bid, i) => (
            <motion.div
              key={bid.id}
              initial={{ opacity:0,x:-10 }} animate={{ opacity:1,x:0 }}
              transition={{ delay:i*0.1 }}
              style={{
                padding:"16px",borderRadius:"14px",marginBottom:"12px",
                background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Notification text */}
              <div style={{ display:"flex",gap:"10px",marginBottom:"12px" }}>
                <div style={{ width:"36px",height:"36px",borderRadius:"50%",overflow:"hidden",flexShrink:0 }}>
                  <img src={bid.asset.image} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0,fontSize:"12px",color:"#d1d5db",lineHeight:1.5 }}>
                    <span style={{ fontWeight:700,color:"#fff" }}>{bid.bidder}</span> has submitted a bid of{" "}
                    <span style={{ fontWeight:700,color:C.cyan }}>{fmt(bid.bidAmount)} CRD</span> on your asset{" "}
                    <span style={{ fontWeight:600,color:"#e5e7eb" }}>{bid.asset.name}</span>.
                  </p>
                  <p style={{ margin:"4px 0 0",fontSize:"10px",color:C.muted }}>
                    <Clock size={10} style={{ display:"inline",marginRight:3 }} /> {formatDate(bid.createdAt)}
                  </p>
                </div>
              </div>

              {/* Bid memo */}
              {bid.memo && (
                <div style={{ padding:"8px 12px",background:"rgba(255,255,255,0.03)",borderRadius:"8px",marginBottom:"12px",borderLeft:"3px solid rgba(0,210,255,0.3)" }}>
                  <p style={{ margin:0,fontSize:"11px",color:C.subtext,fontStyle:"italic" }}>"{bid.memo}"</p>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display:"flex",gap:"10px" }}>
                <motion.button
                  whileHover={{ scale:1.02,background:"rgba(239,68,68,0.15)" }}
                  whileTap={{ scale:0.98 }}
                  onClick={() => onReject(bid.id)}
                  style={{
                    flex:1,padding:"10px",borderRadius:"10px",
                    background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",
                    color:"#ef4444",fontSize:"12px",fontWeight:700,cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",
                  }}
                >
                  <X size={14} /> Reject Bid
                </motion.button>
                <motion.button
                  whileHover={{ scale:1.02,boxShadow:"0 0 24px rgba(34,197,94,0.2)" }}
                  whileTap={{ scale:0.98 }}
                  onClick={() => onAccept(bid.id)}
                  style={{
                    flex:1.5,padding:"10px",borderRadius:"10px",
                    background:"linear-gradient(135deg,#16a34a,#22c55e)",border:"none",
                    color:"#fff",fontSize:"12px",fontWeight:700,cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",
                  }}
                >
                  <Check size={14} /> Accept Bid
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── ASSET DETAIL MODAL ──────────────────────────────────────────────
function AssetModal({
  asset, onClose, onPlaceBid, walletBalance,
}: {
  asset: Asset; onClose: () => void;
  onPlaceBid: (asset: Asset) => void;
  walletBalance: number;
}) {
  const apr = (asset.growthRate * 0.8).toFixed(1);

  return (
    <div
      style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity:0,y:20,scale:0.95 }} animate={{ opacity:1,y:0,scale:1 }}
        transition={{ duration:0.3 }}
        style={{
          background:"#0d1220",border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:"18px",width:"100%",maxWidth:"520px",overflow:"hidden",
          boxShadow:"0 32px 80px rgba(0,0,0,0.7)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ position:"relative",height:"200px",overflow:"hidden" }}>
          <img src={asset.image} alt={asset.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
          <div style={{ position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,0.2) 0%,rgba(0,0,0,0.6) 100%)" }} />
          <button onClick={onClose} style={{ position:"absolute",top:"12px",right:"12px",background:"rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"50%",width:"32px",height:"32px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding:"20px 24px" }}>
          <span style={{ display:"inline-block",background:catColor(asset.category),color:"#fff",fontSize:"10px",fontWeight:700,padding:"3px 10px",borderRadius:"99px",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"8px" }}>
            {asset.category}
          </span>
          <h2 style={{ fontSize:"20px",fontWeight:700,color:"#fff",margin:"0 0 16px" }}>{asset.name}</h2>

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",overflow:"hidden",marginBottom:"14px" }}>
            {[
              { label:"CATEGORY",value:asset.category,icon:<Tag size={14} color="#f59e0b" /> },
              { label:"TYPE",value:"Protocol",icon:<Shield size={14} color={C.cyan} /> },
              { label:"EXPECTED APR",value:`+${apr}%`,icon:<TrendingUp size={14} color={C.green} />,green:true },
              { label:"OWNER",value:asset.ownerName,icon:<UserCircle size={14} color={C.muted} /> },
              { label:"YEARLY REVENUE",value:asset.details.revenueYearly?`${asset.details.revenueYearly.toLocaleString()} CRD`:"N/A",icon:<DollarSign size={14} color={C.muted} />,green:!!asset.details.revenueYearly },
              { label:"LOCATION",value:asset.country,icon:<MapPin size={14} color={C.muted} /> },
            ].map((item,i) => (
              <div key={i} style={{ padding:"12px 14px",borderBottom:i<4?"1px solid rgba(255,255,255,0.06)":"none",borderRight:i%2===0?"1px solid rgba(255,255,255,0.06)":"none",background:"rgba(255,255,255,0.02)" }}>
                <div style={{ display:"flex",alignItems:"center",gap:"5px",marginBottom:"3px" }}>
                  {item.icon}
                  <span style={{ fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"monospace" }}>{item.label}</span>
                </div>
                <span style={{ fontSize:"13px",fontWeight:600,color:(item as any).green?C.green:"#e5e7eb" }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div style={{ display:"flex",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",overflow:"hidden",marginBottom:"16px" }}>
            <div style={{ flex:1,padding:"14px 16px",borderRight:"1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ margin:"0 0 3px",fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"monospace" }}>VALUATION</p>
              <p style={{ margin:0,fontSize:"18px",fontWeight:700,color:"#fff" }}>{fmt(asset.currentValuation)} <span style={{ fontSize:"11px",color:C.muted,fontWeight:400 }}>CRD</span></p>
            </div>
            <div style={{ flex:1,padding:"14px 16px" }}>
              <p style={{ margin:"0 0 3px",fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"monospace" }}>ACTIVE NODE CLIENTS</p>
              <p style={{ margin:0,fontSize:"18px",fontWeight:700,color:"#fff" }}>{(asset.details.userCount||1200).toLocaleString()}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display:"flex",gap:"10px" }}>
            <button
              onClick={onClose}
              style={{
                flex:1,padding:"12px",borderRadius:"10px",
                background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",
                color:"#e5e7eb",fontSize:"13px",fontWeight:600,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",
              }}
            >
              <Eye size={15} /> Overview
            </button>
            <motion.button
              whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
              onClick={() => { onClose(); onPlaceBid(asset); }}
              style={{
                flex:1.5,padding:"12px",borderRadius:"10px",
                background:C.accent,border:"none",color:"#fff",
                fontSize:"13px",fontWeight:700,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",
              }}
            >
              <Send size={15} /> Place Bid / Buyout
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── ASSET CARD ──────────────────────────────────────────────────────
function AssetCard({
  asset, onOverview, onPlaceBid, onComment,
}: {
  asset: Asset; onOverview: () => void; onPlaceBid: () => void; onComment: () => void;
}) {
  const [liked, setLiked] = useState(false);

  return (
    <div style={{
      background:C.card,border:`1px solid ${C.cardBdr}`,borderRadius:"14px",overflow:"hidden",
      cursor:"pointer",transition:"transform 0.15s, box-shadow 0.15s",
    }}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)";(e.currentTarget as HTMLDivElement).style.boxShadow="0 8px 32px rgba(0,0,0,0.5)";}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform="";(e.currentTarget as HTMLDivElement).style.boxShadow="";}}
    >
      <div style={{ position:"relative",height:"160px",overflow:"hidden" }}>
        <img src={asset.image} alt={asset.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
        <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.5) 0%,transparent 60%)" }} />
        <span style={{ position:"absolute",top:"10px",left:"10px",background:catColor(asset.category),color:"#fff",fontSize:"10px",fontWeight:700,padding:"3px 9px",borderRadius:"6px",textTransform:"uppercase",letterSpacing:"0.06em" }}>
          {asset.category.split(" ").slice(0,2).join(" ")}
        </span>
        <button onClick={e=>{e.stopPropagation();setLiked(l=>!l);}} style={{ position:"absolute",top:"10px",right:"10px",background:"rgba(0,0,0,0.4)",border:"none",borderRadius:"50%",width:"28px",height:"28px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:liked?"#ef4444":"#fff" }}>
          <Heart size={14} fill={liked?"#ef4444":"none"} />
        </button>
        <span style={{ position:"absolute",bottom:"10px",right:"10px",background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)",color:C.green,fontSize:"11px",fontWeight:700,padding:"2px 8px",borderRadius:"6px",fontFamily:"monospace",border:"1px solid rgba(34,197,94,0.3)" }}>
          ↗ +{asset.growthRate}%
        </span>
      </div>
      <div style={{ padding:"14px" }}>
        <p style={{ margin:"0 0 2px",fontSize:"14px",fontWeight:700,color:"#f1f5f9",lineHeight:1.3 }}>{asset.name}</p>
        <p style={{ margin:"0 0 12px",fontSize:"16px",fontWeight:800,color:"#fff" }}>{fmt(asset.currentValuation)}</p>
        <div style={{ display:"flex",gap:"8px" }}>
          <button onClick={e=>{e.stopPropagation();onOverview();}} style={{ flex:1,padding:"9px",borderRadius:"8px",background:"transparent",border:"1px solid rgba(255,255,255,0.15)",color:"#e5e7eb",fontSize:"12px",fontWeight:600,cursor:"pointer" }}>
            Overview
          </button>
          <motion.button
            whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            onClick={e=>{e.stopPropagation();onPlaceBid();}}
            style={{
              flex:1,padding:"9px",borderRadius:"8px",
              background:C.accent,border:"none",color:"#fff",
              fontSize:"12px",fontWeight:700,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",gap:"5px",
            }}
          >
            <Send size={13} /> Bid
          </motion.button>
          <motion.button
            whileHover={{ scale:1.06,background:"rgba(37,99,235,0.2)",borderColor:"rgba(96,165,250,0.4)" }}
            whileTap={{ scale:0.94 }}
            onClick={e=>{e.stopPropagation();onComment();}}
            style={{
              flex:"0 0 auto",width:"36px",height:"36px",padding:0,
              borderRadius:"8px",
              background:"rgba(5,5,10,0.4)",
              border:"1px solid rgba(0,210,255,0.2)",
              boxShadow:"inset 0 0 12px rgba(0,210,255,0.04), 0 0 8px rgba(121,40,202,0.06)",
              color:"#00D2FF",cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",
              transition:"background 0.2s, border-color 0.2s, box-shadow 0.2s",
            }}
            title="Comment on this asset"
          >
            <MessageSquare size={15} strokeWidth={1.8} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ─── MARKETPLACE VIEW ────────────────────────────────────────────────
const CATEGORIES = ["All Categories","Digital Assets","Creative Assets","Real Estate","Financial Opportunities","Business Marketplace","Physical Products"];

function MarketplaceView({
  onOverview, onPlaceBid, onComment, walletBalance, userName, userAvatar,
}: {
  onOverview: (asset: Asset) => void;
  onPlaceBid: (asset: Asset) => void;
  onComment: (asset: Asset) => void;
  walletBalance: number;
  userName: string;
  userAvatar: string;
}) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All Categories");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assets, setAssets] = useState(ASSET_LISTINGS);
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setAssets(prev => prev.map(a => {
        if (Math.random() < 0.3) {
          const d = Math.round(a.currentValuation * (Math.random() * 0.003));
          return { ...a, currentValuation: a.currentValuation + (Math.random()>0.4?d:-d) };
        }
        return a;
      }));
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  const filtered = assets.filter(a => {
    const ms = a.name.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter==="All Categories" || a.category===catFilter;
    return ms && mc;
  });

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden" }}>
      <div style={{ padding:"22px 28px 16px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`,background:C.bg,flexShrink:0 }}>
        <div>
          <h1 style={{ margin:0,fontSize:"26px",fontWeight:800,color:"#fff" }}>Marketplace</h1>
          <p style={{ margin:"4px 0 0",fontSize:"13px",color:C.muted }}>Discover, buy and sell premium digital assets</p>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:"16px" }}>
          <div style={{ textAlign:"right" }}>
            <p style={{ margin:0,fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em" }}>Wallet Balance</p>
            <p style={{ margin:0,fontSize:"16px",fontWeight:700,color:C.cyan }}>{fmtCRD(walletBalance)} <span style={{ fontSize:"11px" }}>CRD</span></p>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",background:"rgba(255,255,255,0.05)",borderRadius:"10px",border:C.border,cursor:"pointer" }}>
            <img src={userAvatar} alt="" style={{ width:"30px",height:"30px",borderRadius:"50%",objectFit:"cover" }} />
            <span style={{ fontSize:"13px",color:"#e5e7eb",fontWeight:600 }}>{userName}</span>
            <ChevronDown size={14} color={C.muted} />
          </div>
        </div>
      </div>

      <div style={{ padding:"14px 28px",display:"flex",gap:"12px",alignItems:"center",flexShrink:0,background:C.bg }}>
        <div style={{ flex:1,display:"flex",alignItems:"center",background:"rgba(255,255,255,0.05)",border:`1px solid ${C.border}`,borderRadius:"10px",padding:"0 14px" }}>
          <Search size={16} color={C.muted} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search assets..."
            style={{ flex:1,background:"none",border:"none",outline:"none",padding:"11px 10px",fontSize:"14px",color:"#fff",fontFamily:"inherit" }} />
        </div>
        <div style={{ position:"relative" }}>
          <button onClick={()=>setShowCatDropdown(v=>!v)} style={{ display:"flex",alignItems:"center",gap:"8px",padding:"11px 16px",background:"rgba(255,255,255,0.05)",border:`1px solid ${C.border}`,borderRadius:"10px",color:"#e5e7eb",fontSize:"13px",fontWeight:500,cursor:"pointer",whiteSpace:"nowrap" }}>
            <Layers size={15} color={C.muted} /> {catFilter} <ChevronDown size={14} color={C.muted} />
          </button>
          {showCatDropdown && (
            <div style={{ position:"absolute",right:0,top:"calc(100% + 6px)",zIndex:50,background:"#131b2e",border:`1px solid ${C.border}`,borderRadius:"12px",overflow:"hidden",minWidth:"200px",boxShadow:"0 12px 40px rgba(0,0,0,0.5)" }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={()=>{setCatFilter(cat);setShowCatDropdown(false);}}
                  style={{ display:"block",width:"100%",textAlign:"left",padding:"10px 16px",background:catFilter===cat?"rgba(37,99,235,0.15)":"none",border:"none",color:catFilter===cat?"#60a5fa":"#d1d5db",fontSize:"13px",cursor:"pointer" }}>
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ flex:1,overflowY:"auto",padding:"0 28px 28px" }}>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"18px" }}>
          {filtered.map(asset => (
            <AssetCard key={asset.id} asset={asset} onOverview={()=>onOverview(asset)} onPlaceBid={()=>onPlaceBid(asset)} onComment={()=>onComment(asset)} />
          ))}
          {filtered.length===0 && (
            <div style={{ gridColumn:"1/-1",textAlign:"center",padding:"60px",color:C.muted }}>
              <Search size={40} style={{ margin:"0 auto 12px" }} />
              <p>No assets found</p>
            </div>
          )}
        </div>
      </div>

      {selectedAsset && (
        <AssetModal asset={selectedAsset} onClose={()=>setSelectedAsset(null)} onPlaceBid={onPlaceBid} walletBalance={walletBalance} />
      )}
    </div>
  );
}

// ─── SIDEBAR NAV ─────────────────────────────────────────────────────
type Tab = "hire-artists" | "suppliers";

const NAV_ITEMS: { id:Tab;label:string;icon:React.ReactNode }[] = [
  { id:"hire-artists",label:"Services",icon:<Users size={18} /> },
  { id:"suppliers",label:"Suppliers",icon:<ShoppingBag size={18} /> },
];

// ─── ROOT APP ────────────────────────────────────────────────────────
// ─── HIRE ARTISTS (extracted to prevent inline-recreation focus bug) ───
interface Review { reviewer:string;avatar:string;stars:number;text:string;time:string }
interface ArtistProfile { name:string;handle:string;avatar:string;specialty:string;rate:string;rating:number;reviews:number;verified:boolean;email:string;phone:string;location?:string;portfolio:{name:string;type:string;size:string;url:string}[];reviewList:Review[] }
const mkReview = (reviewer:string,avatar:string,stars:number,text:string,time:string):Review => ({ reviewer,avatar,stars,text,time });

const DEFAULT_ARTISTS: ArtistProfile[] = [
  { name:"Aria Takahashi",handle:"@aria_t",avatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",specialty:"3D Modeling",rate:"$85/hr",rating:4.9,reviews:127,verified:true,email:"aria@creative.studio",phone:"+1 (555) 234-5678",portfolio:[{name:"Portfolio_Reel_2024.mp4",type:"video/mp4",size:"48.2 MB",url:"#"},{name:"Character_Designs.pdf",type:"application/pdf",size:"12.4 MB",url:"#"},{name:"Client_Testimonials.pdf",type:"application/pdf",size:"1.8 MB",url:"#"}],reviewList:[mkReview("Liam Scott","https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",5,"Absolutely stunning 3D work. Aria delivered beyond expectations.","2 days ago"),mkReview("Nina Alvarez","https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",5,"Professional, communicative, and incredibly talented.","1 week ago")] },
  { name:"Devin Vance",handle:"@vance_dev",avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",specialty:"UI/UX Design",rate:"$120/hr",rating:4.8,reviews:93,verified:true,email:"devin@vance.design",phone:"+1 (555) 345-6789",portfolio:[{name:"UI_Case_Studies.pdf",type:"application/pdf",size:"22.1 MB",url:"#"},{name:"Design_System_Guide.pdf",type:"application/pdf",size:"8.7 MB",url:"#"}],reviewList:[mkReview("Sarah Kim","https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",5,"Devin completely transformed our product UX.","5 days ago"),mkReview("Jake Morrison","https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",5,"Best design system we've ever worked with.","2 weeks ago")] },
  { name:"Lina Chen",handle:"@lina_chen",avatar:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",specialty:"Motion Graphics",rate:"$95/hr",rating:4.7,reviews:84,verified:true,email:"lina@motionworks.io",phone:"+1 (555) 456-7890",portfolio:[{name:"Showreel_2024.mp4",type:"video/mp4",size:"65.3 MB",url:"#"},{name:"Animation_Samples.zip",type:"application/zip",size:"34.1 MB",url:"#"}],reviewList:[mkReview("Carlos Diaz","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",5,"The motion graphics were mesmerizing.","1 day ago"),mkReview("Emma Liu","https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",4,"Great work on our explainer video.","1 month ago")] },
  { name:"Marcus Rivera",handle:"@marcus_r",avatar:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",specialty:"Audio / Music",rate:"$75/hr",rating:4.9,reviews:156,verified:false,email:"marcus@soundcraft.audio",phone:"+1 (555) 567-8901",portfolio:[{name:"Sample_Beats_Pack.zip",type:"application/zip",size:"18.9 MB",url:"#"},{name:"Client_Projects_Demo.mp3",type:"audio/mpeg",size:"7.2 MB",url:"#"}],reviewList:[mkReview("Zara Patel","https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=100&q=80",5,"Marcus nailed the vibe for our podcast intro.","3 days ago"),mkReview("Derek Huang","https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=100&q=80",5,"Top-tier audio work.","1 week ago")] },
  { name:"Priya Patel",handle:"@priya_p",avatar:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",specialty:"Illustration",rate:"$110/hr",rating:4.6,reviews:71,verified:true,email:"priya@artbypriya.com",phone:"+1 (555) 678-9012",portfolio:[{name:"Illustration_Portfolio.pdf",type:"application/pdf",size:"15.6 MB",url:"#"},{name:"Character_Sheet_Samples.png",type:"image/png",size:"3.2 MB",url:"#"}],reviewList:[mkReview("Rachel Adams","https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",5,"Priya's illustrations brought our book to life.","4 days ago"),mkReview("Sam O'Brien","https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",4,"Beautiful character work.","2 weeks ago")] },
  { name:"James Ko",handle:"@james_ko",avatar:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",specialty:"Copywriting",rate:"$65/hr",rating:4.8,reviews:109,verified:false,email:"james@wordcraft.co",phone:"+1 (555) 789-0123",portfolio:[{name:"Writing_Samples.pdf",type:"application/pdf",size:"5.8 MB",url:"#"},{name:"Brand_Copy_Deck.docx",type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",size:"1.2 MB",url:"#"}],reviewList:[mkReview("Olivia Brooks","https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",5,"James rebranded our voice. Sales doubled.","1 day ago"),mkReview("Henry Wu","https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=100&q=80",5,"Sharp, concise, on-brand.","5 days ago")] },
  { name:"Tara Williams",handle:"@tara_w",avatar:"https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=150&q=80",specialty:"Comedian",rate:"$200/show",rating:4.7,reviews:42,verified:true,email:"tara@comedyworks.live",phone:"+1 (555) 890-1234",portfolio:[{name:"StandUp_Special_2024.mp4",type:"video/mp4",size:"124 MB",url:"#"},{name:"Press_Kit.pdf",type:"application/pdf",size:"3.4 MB",url:"#"}],reviewList:[mkReview("Mike Chen","https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",5,"Had the entire room roaring.","2 days ago"),mkReview("Jenna Clark","https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",4,"Funny and engaging.","1 week ago")] },
  { name:"David Nguyen",handle:"@david_n",avatar:"https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80",specialty:"Engineer",rate:"$150/hr",rating:4.9,reviews:67,verified:true,email:"david@engsolutions.tech",phone:"+1 (555) 901-2345",portfolio:[{name:"Technical_Resume.pdf",type:"application/pdf",size:"2.1 MB",url:"#"},{name:"Project_Case_Studies.pdf",type:"application/pdf",size:"9.5 MB",url:"#"}],reviewList:[mkReview("Amy Foster","https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",5,"David architected our backend migration flawlessly.","3 days ago"),mkReview("Ryan Lee","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",5,"Exceptional problem-solving.","2 weeks ago")] },
];

function HireArtistsView({ navigate, userName, userAvatar }: { navigate:(page:string,params?:any)=>void; userName:string; userAvatar:string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [artists, setArtists] = useState<ArtistProfile[]>(DEFAULT_ARTISTS);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ArtistProfile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({ name:"",field:"",email:"",phone:"",location:"",rateValue:"",rateType:"per Hour",portfolioFiles:[] as File[] });
  const [reviewText, setReviewText] = useState("");
  const [reviewStars, setReviewStars] = useState(5);
  const [drawerReviews, setDrawerReviews] = useState<Record<string,Review[]>>({});
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostCaption, setRepostCaption] = useState("");
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blockedHandles, setBlockedHandles] = useState<Set<string>>(new Set());
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const SERVICE_CATEGORIES = [
    "All","3D Modeling","Graphic Design","Web Dev","Music","Writing","Video","Marketing","Consulting","Photography","Animation","UI/UX",
  ];

  const visibleArtists = artists.filter(a => !blockedHandles.has(a.handle));
  const filteredByCategory = activeCategory === "All"
    ? visibleArtists
    : visibleArtists.filter(a => a.specialty === activeCategory);
  const filteredArtists = searchQuery.trim()
    ? filteredByCategory.filter(a => {
        const q = searchQuery.toLowerCase();
        return a.specialty.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
      })
    : filteredByCategory;

  const handleProfileClick = (profile: ArtistProfile) => {
    setSelectedProfile(profile);
    setIsDrawerOpen(true);
  };
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedProfile(null);
  };

  const inputStyle: React.CSSProperties = {
    width:"100%",padding:"10px 12px",borderRadius:"8px",border:`1px solid ${C.border}`,
    background:"#0d1220",color:"#fff",fontSize:"13px",fontFamily:"inherit",outline:"none",
  };

  return (
    <div style={{ flex:1,overflowY:"auto",padding:"28px 32px" }}>
      {/* Service Category Toggle */}
      <div style={{ display:"flex",gap:"6px",overflowX:"auto",marginBottom:"20px" }}
        className="scrollbar-none">
        {SERVICE_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            style={{
              flexShrink:0, padding:"6px 14px", borderRadius:"20px", border: activeCategory === cat ? "none" : `1px solid ${C.border}`,
              background: activeCategory === cat ? C.accent : "transparent",
              color: activeCategory === cat ? "#fff" : C.muted,
              fontSize:"12px", fontWeight:600, cursor:"pointer", whiteSpace:"nowrap",
              transition:"all 0.15s",
            }}
            onMouseEnter={e => { if (activeCategory !== cat) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#fff" } }}
            onMouseLeave={e => { if (activeCategory !== cat) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted } }}
          >{cat}</button>
        ))}
      </div>

      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"24px" }}>
        <div>
          <h2 style={{ margin:0,fontSize:"20px",fontWeight:800,color:"#fff" }}>Hire {activeCategory === "All" ? "Services" : activeCategory}</h2>
          <p style={{ margin:"4px 0 0",fontSize:"13px",color:C.muted }}>Find and hire professional services for your next project.</p>
        </div>
        <button onClick={()=>setShowApplyModal(true)}
          style={{ display:"flex",alignItems:"center",gap:"6px",padding:"9px 16px",borderRadius:"8px",border:`1px solid ${C.accent}`,background:"rgba(37,99,235,0.12)",color:C.accent,fontSize:"12px",fontWeight:700,cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap" }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(37,99,235,0.25)"}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(37,99,235,0.12)"}}
        ><Plus size={14} /> List Your Service</button>
      </div>

      {/* Search bar */}
      <div style={{ display:"flex",gap:"8px",marginBottom:"28px" }}>
        <div style={{ flex:1,position:"relative" }}>
          <Search size={16} color={C.muted} style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)" }} />
          <input placeholder="Search jobs or professional fields (e.g., Comedian, Doctor, 3D Artist)..." value={searchInput} onChange={e=>setSearchInput(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter")setSearchQuery(searchInput); }}
            style={{ width:"100%",padding:"11px 14px 11px 38px",borderRadius:"10px",border:`1px solid ${C.border}`,background:"#0d1220",color:"#fff",fontSize:"13px",fontFamily:"inherit",outline:"none",transition:"border-color 0.15s" }}
            onFocus={e=>e.currentTarget.style.borderColor=C.accent} onBlur={e=>e.currentTarget.style.borderColor=C.border} />
        </div>
        <button onClick={()=>setSearchQuery(searchInput)}
          style={{ padding:"11px 20px",borderRadius:"10px",border:"none",background:C.accent,color:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:"6px",transition:"background 0.15s",whiteSpace:"nowrap" }}
          onMouseEnter={e=>e.currentTarget.style.background=C.accentHov} onMouseLeave={e=>e.currentTarget.style.background=C.accent}
        ><Search size={14} /> Search</button>
      </div>

      {/* Artists grid */}
      <div style={{ marginBottom:"16px" }}>
        <h3 style={{ margin:0,fontSize:"15px",fontWeight:700,color:"#fff" }}>{searchQuery.trim()?`Results for "${searchQuery}"`:"Featured"} Services</h3>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"14px" }}>
        {filteredArtists.map((artist,i) => (
          <motion.div key={artist.handle} whileHover={{ y:-2,borderColor:"rgba(37,99,235,0.3)" }}
            style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:"14px",padding:"18px",display:"flex",flexDirection:"column",gap:"12px",transition:"border-color 0.2s" }}>
            <div style={{ display:"flex",alignItems:"center",gap:"12px",cursor:"pointer" }}
              onClick={()=>navigate('profile',{ author:{ name:artist.name,handle:artist.handle,avatar:artist.avatar,verified:artist.verified } })}>
              <img src={artist.avatar} alt="" style={{ width:"44px",height:"44px",borderRadius:"12px",objectFit:"cover",border:`1px solid ${C.border}` }} />
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:"6px" }}>
                  <span style={{ fontSize:"14px",fontWeight:700,color:"#fff" }}>{artist.name}</span>
                  {artist.verified && <span style={{ width:"14px",height:"14px",borderRadius:"50%",background:C.cyan,color:"#fff",fontSize:"7px",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700 }}>✓</span>}
                </div>
                <span style={{ fontSize:"11px",color:C.muted }}>{artist.handle}</span>
              </div>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ fontSize:"11px",color:C.subtext }}>{artist.specialty}</span>
              <span style={{ fontSize:"13px",fontWeight:700,color:C.green }}>{artist.rate}</span>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:"6px" }}>
              <Star size={12} fill="#f59e0b" color="#f59e0b" />
              <span style={{ fontSize:"12px",fontWeight:600,color:"#fff" }}>{artist.rating}</span>
              <span style={{ fontSize:"11px",color:C.muted }}>({artist.reviews} reviews)</span>
            </div>
            <button onClick={()=>handleProfileClick(artist)}
              style={{ width:"100%",padding:"9px",borderRadius:"8px",border:"none",background:C.accent,color:"#fff",fontSize:"12px",fontWeight:700,cursor:"pointer",transition:"background 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.background=C.accentHov} onMouseLeave={e=>e.currentTarget.style.background=C.accent}
            >Book Service</button>
          </motion.div>
        ))}
      </div>

      {/* ── Apply as an Artist Modal ────────────────────────────── */}
      {showApplyModal && (
        <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)" }} onClick={()=>setShowApplyModal(false)}>
          <motion.div initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }} onClick={e=>e.stopPropagation()}
            style={{ background:"#111827",border:`1px solid ${C.border}`,borderRadius:"16px",width:"100%",maxWidth:"480px",padding:"24px",maxHeight:"90vh",overflowY:"auto" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px" }}>
              <h3 style={{ margin:0,fontSize:"16px",fontWeight:800,color:"#fff" }}>List Your Service</h3>
              <button onClick={()=>setShowApplyModal(false)} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",padding:4 }}><X size={18} /></button>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:"14px" }}>
              <div>
                <label style={{ display:"block",fontSize:"11px",fontWeight:600,color:C.muted,marginBottom:"6px" }}>Full Name</label>
                <input placeholder="Your full name" value={applyForm.name} onChange={e=>setApplyForm({...applyForm,name:e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display:"block",fontSize:"11px",fontWeight:600,color:C.muted,marginBottom:"6px" }}>Field / Specialty</label>
                <input placeholder="Type your specific profession (e.g., Comedian, Doctor, Writer, Pilot...)" value={applyForm.field} onChange={e=>setApplyForm({...applyForm,field:e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display:"block",fontSize:"11px",fontWeight:600,color:C.muted,marginBottom:"6px" }}>Email Address <span style={{ color:C.accent }}>*</span></label>
                <input type="email" placeholder="e.g., alex@service.com" value={applyForm.email} onChange={e=>setApplyForm({...applyForm,email:e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display:"block",fontSize:"11px",fontWeight:600,color:C.muted,marginBottom:"6px" }}>Phone Number <span style={{ color:C.accent }}>*</span></label>
                <input type="tel" placeholder="e.g., +1 (555) 019-2834" value={applyForm.phone} onChange={e=>setApplyForm({...applyForm,phone:e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display:"block",fontSize:"11px",fontWeight:600,color:C.muted,marginBottom:"6px" }}>Location <span style={{ color:C.muted,fontWeight:400 }}>(Optional)</span></label>
                <input placeholder="e.g., New York, NY" value={applyForm.location} onChange={e=>setApplyForm({...applyForm,location:e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display:"block",fontSize:"11px",fontWeight:600,color:C.muted,marginBottom:"6px" }}>Rate</label>
                <div style={{ display:"flex",gap:"6px" }}>
                  <input placeholder="e.g., 95" value={applyForm.rateValue} onChange={e=>setApplyForm({...applyForm,rateValue:e.target.value})}
                    style={{ ...inputStyle, flex:1 }} />
                  <select value={applyForm.rateType} onChange={e=>setApplyForm({...applyForm,rateType:e.target.value})}
                    style={{ ...inputStyle, width:"auto",minWidth:"110px",cursor:"pointer" }}>
                    <option value="per Hour" style={{ background:"#111827" }}>per Hour</option>
                    <option value="per Service" style={{ background:"#111827" }}>per Service</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display:"block",fontSize:"11px",fontWeight:600,color:C.muted,marginBottom:"6px" }}>Upload Media Proofs (Photos, Videos, or Documents)</label>
                <label style={{ display:"flex",alignItems:"center",gap:"8px",padding:"12px",borderRadius:"8px",border:`1px dashed ${C.border}`,background:"#0d1220",cursor:"pointer",transition:"border-color 0.15s" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <UploadCloud size={16} color={C.muted} />
                  <span style={{ fontSize:"12px",color:applyForm.portfolioFiles.length?C.subtext:C.muted }}>
                    {applyForm.portfolioFiles.length ? `${applyForm.portfolioFiles.length} file(s) selected` : "Choose files (images, videos, PDFs, ZIPs)"}
                  </span>
                  <input type="file" accept="image/*,video/*,application/pdf,application/zip" multiple style={{ display:"none" }}
                    onChange={e=>setApplyForm({...applyForm,portfolioFiles:Array.from(e.target.files||[])})} />
                </label>
              </div>
              <button onClick={()=>{
                if(!applyForm.name.trim()||!applyForm.field.trim()||!applyForm.email.trim()||!applyForm.phone.trim())return;
                const rateStr = applyForm.rateValue.trim()
                  ? `$${applyForm.rateValue.trim()}/${applyForm.rateType}`
                  : "$0/hr";
                const newArtist: ArtistProfile = {
                  name: applyForm.name.trim(),
                  handle: "@" + applyForm.name.trim().toLowerCase().replace(/\s+/g, "_"),
                  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(applyForm.name.trim())}&background=2563eb&color=fff&size=150`,
                  specialty: applyForm.field.trim(),
                  rate: rateStr,
                  rating: 5.0,
                  reviews: 0,
                  verified: false,
                  email: applyForm.email.trim(),
                  phone: applyForm.phone.trim(),
                  location: applyForm.location.trim() || undefined,
                  portfolio: applyForm.portfolioFiles.map(f => ({
                    name: f.name,
                    type: f.type,
                    size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
                    url: URL.createObjectURL(f),
                  })),
                  reviewList: [],
                };
                setArtists(prev => [newArtist, ...prev]);
                setApplyForm({ name:"", field:"", email:"", phone:"", location:"", rateValue:"", rateType:"per Hour", portfolioFiles:[] });
                setShowApplyModal(false);
              }}
                style={{ width:"100%",padding:"11px",borderRadius:"8px",border:"none",background:C.accent,color:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer",marginTop:"4px",transition:"background 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.background=C.accentHov} onMouseLeave={e=>e.currentTarget.style.background=C.accent}
              >Submit Application</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Contact Artist Drawer ────────────────────────────────── */}
      {isDrawerOpen && selectedProfile && (
        <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"flex-end",background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)" }} onClick={()=>handleCloseDrawer()}>
          <motion.div initial={{ x:400,opacity:0 }} animate={{ x:0,opacity:1 }} transition={{ type:"spring",damping:28,stiffness:300 }} onClick={e=>e.stopPropagation()}
            style={{ width:"100%",maxWidth:"420px",height:"100%",background:"#111827",borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 20px",borderBottom:`1px solid ${C.border}`,position:"relative" }}>
              <h3 style={{ margin:0,fontSize:"15px",fontWeight:800,color:"#fff" }}>Artist Profile</h3>
              <div style={{ display:"flex",alignItems:"center",gap:"4px" }}>
                <div style={{ position:"relative" }}>
                  <button onClick={()=>setShowOptionsMenu(!showOptionsMenu)} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",padding:4,fontSize:18,lineHeight:1 }}>⋮</button>
                  {showOptionsMenu && (
                    <div style={{ position:"absolute",right:0,top:"100%",marginTop:4,background:"#1a2233",border:`1px solid ${C.border}`,borderRadius:"10px",padding:"4px",minWidth:160,zIndex:300,boxShadow:"0 8px 24px rgba(0,0,0,0.4)" }}
                      onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>{setShowOptionsMenu(false);setShowBlockConfirm(true)}}
                        style={{ display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 12px",borderRadius:"7px",border:"none",background:"transparent",color:"#f87171",fontSize:"12px",fontWeight:600,cursor:"pointer",textAlign:"left",transition:"background 0.12s" }}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(248,113,113,0.1)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <Shield size={14} /> Block Artist
                      </button>
                      <button onClick={()=>{setShowOptionsMenu(false);setShowReportModal(true)}}
                        style={{ display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 12px",borderRadius:"7px",border:"none",background:"transparent",color:"#f59e0b",fontSize:"12px",fontWeight:600,cursor:"pointer",textAlign:"left",transition:"background 0.12s" }}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(245,158,11,0.1)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <AlertTriangle size={14} /> Report Artist
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={()=>handleCloseDrawer()} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",padding:4 }}><X size={18} /></button>
              </div>
            </div>
            <div style={{ flex:1,overflowY:"auto",padding:"20px" }}>
              <div style={{ display:"flex",alignItems:"center",gap:"14px",marginBottom:"20px" }}>
                <img src={selectedProfile.avatar} alt="" style={{ width:"56px",height:"56px",borderRadius:"14px",objectFit:"cover",border:`1px solid ${C.border}` }} />
                <div>
                  <div style={{ display:"flex",alignItems:"center",gap:"6px" }}>
                    <span style={{ fontSize:"16px",fontWeight:800,color:"#fff" }}>{selectedProfile.name}</span>
                    {selectedProfile.verified && <span style={{ width:"16px",height:"16px",borderRadius:"50%",background:C.cyan,color:"#fff",fontSize:"8px",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:"12px",color:C.muted }}>{selectedProfile.handle}</span>
                  <div style={{ display:"flex",alignItems:"center",gap:"8px",marginTop:"4px" }}>
                    <span style={{ fontSize:"11px",color:C.subtext }}>{selectedProfile.specialty}</span>
                    <span style={{ fontSize:"13px",fontWeight:700,color:C.green }}>{selectedProfile.rate}</span>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom:"20px" }}>
                <h4 style={{ margin:"0 0 10px",fontSize:"12px",fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em" }}>Contact Details</h4>
                <div style={{ display:"flex",flexDirection:"column",gap:"8px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"8px",background:"#0d1220",border:`1px solid ${C.border}` }}>
                    <Mail size={14} color={C.accent} />
                    <div style={{ flex:1 }}><span style={{ fontSize:"10px",color:C.muted,display:"block" }}>Email Address</span>
                      <a href="#" onClick={e => {
                        e.preventDefault()
                        const to = encodeURIComponent(selectedProfile.email)
                        const su = encodeURIComponent("Project Inquiry via Neutron")
                        const body = encodeURIComponent(`Hi ${selectedProfile.name},\n\nI found your contact from Neutron Social and would love to discuss a potential project with you...`)
                        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${body}`, '_blank')
                      }}
                        style={{ fontSize:"13px",color:"#60a5fa",textDecoration:"none",fontWeight:600 }}
                        onMouseEnter={e=>e.currentTarget.style.textDecoration="underline"}
                        onMouseLeave={e=>e.currentTarget.style.textDecoration="none"}>
                        {selectedProfile.email}
                      </a>
                    </div>
                    <a href="#" onClick={e => {
                      e.preventDefault()
                      const to = encodeURIComponent(selectedProfile.email)
                      const su = encodeURIComponent("Project Inquiry via Neutron")
                      const body = encodeURIComponent(`Hi ${selectedProfile.name},\n\nI found your contact from Neutron Social and would love to discuss a potential project with you...`)
                      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${body}`, '_blank')
                    }}
                      style={{ width:28,height:28,borderRadius:6,background:"rgba(37,99,235,0.12)",border:"none",color:C.accent,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,textDecoration:"none" }}>
                      <Send size={12} />
                    </a>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"8px",background:"#0d1220",border:`1px solid ${C.border}` }}>
                    <Phone size={14} color={C.green} /><div><span style={{ fontSize:"10px",color:C.muted,display:"block" }}>Phone Number</span><span style={{ fontSize:"13px",color:"#fff" }}>{selectedProfile.phone}</span></div>
                  </div>
                </div>
              </div>
              <div>
                <h4 style={{ margin:"0 0 10px",fontSize:"12px",fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em" }}>Portfolio & Attachments</h4>
                <div style={{ display:"flex",flexDirection:"column",gap:"6px" }}>
                  {selectedProfile.portfolio.map((file,i) => (
                    <div key={i} style={{ display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"8px",background:"#0d1220",border:`1px solid ${C.border}`,transition:"border-color 0.15s",cursor:"pointer" }}
                      onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(37,99,235,0.3)"} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                      <div style={{ width:"32px",height:"32px",borderRadius:"8px",background:"rgba(37,99,235,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                        {file.type.includes("pdf") ? <FileText size={14} color={C.accent} /> : file.type.includes("video") ? <Eye size={14} color="#f59e0b" /> : file.type.includes("audio") ? <MessageSquare size={14} color="#ec4899" /> : <File size={14} color={C.muted} />}
                      </div>
                      <div style={{ flex:1,minWidth:0 }}><span style={{ fontSize:"12px",fontWeight:600,color:"#fff",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{file.name}</span><span style={{ fontSize:"10px",color:C.muted }}>{file.size}</span></div>
                      <Download size={14} color={C.muted} />
                    </div>
                  ))}
                </div>
              </div>
              {/* Reviews & Feedback */}
              <div style={{ marginTop:"24px" }}>
                <h4 style={{ margin:"0 0 10px",fontSize:"12px",fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em" }}>Reviews & Feedback</h4>
                {(() => {
                  const activeReviews = drawerReviews[selectedProfile.handle] || selectedProfile.reviewList;
                  const totalCount = activeReviews.length;
                  const avg = totalCount > 0 ? (activeReviews.reduce((sum, r) => sum + r.stars, 0) / totalCount) : 0;
                  const rounded = Math.round(avg * 10) / 10;
                  const display = rounded > 0 ? rounded.toFixed(1) : "0.0";
                  return (
                    <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px",padding:"12px",borderRadius:"10px",background:"#0d1220",border:`1px solid ${C.border}` }}>
                      <div style={{ display:"flex",gap:"2px" }}>{[1,2,3,4,5].map(s=><Star key={s} size={16} fill={s<=Math.round(rounded)?"#f59e0b":"none"} color={s<=Math.round(rounded)?"#f59e0b":"#374151"} />)}</div>
                      <span style={{ fontSize:"18px",fontWeight:800,color:"#fff" }}>{display}</span>
                      <span style={{ fontSize:"12px",color:C.muted }}>({totalCount} reviews)</span>
                    </div>
                  );
                })()}
                <div style={{ display:"flex",flexDirection:"column",gap:"10px",maxHeight:"220px",overflowY:"auto",marginBottom:"12px" }}>
                  {(drawerReviews[selectedProfile.handle] || selectedProfile.reviewList).map((r,i)=>(
                    <div key={i} style={{ padding:"10px 12px",borderRadius:"8px",background:"#0d1220",border:`1px solid ${C.border}` }}>
                      <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px" }}>
                        <img src={r.avatar} alt="" style={{ width:"24px",height:"24px",borderRadius:"50%",objectFit:"cover" }} />
                        <span style={{ fontSize:"12px",fontWeight:700,color:"#fff" }}>{r.reviewer}</span>
                        <div style={{ display:"flex",gap:"1px" }}>{[1,2,3,4,5].map(s=><Star key={s} size={10} fill={s<=r.stars?"#f59e0b":"none"} color={s<=r.stars?"#f59e0b":"#374151"} />)}</div>
                        <span style={{ fontSize:"10px",color:C.muted,marginLeft:"auto" }}>{r.time}</span>
                      </div>
                      <p style={{ margin:0,fontSize:"12px",color:C.subtext,lineHeight:1.5 }}>{r.text}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex",gap:"6px",alignItems:"flex-start" }}>
                  <div style={{ display:"flex",gap:"2px",flexShrink:0,paddingTop:"10px" }}>
                    {[1,2,3,4,5].map(s=><button key={s} onClick={()=>setReviewStars(s)} style={{ background:"none",border:"none",cursor:"pointer",padding:1 }}><Star size={14} fill={s<=reviewStars?"#f59e0b":"none"} color={s<=reviewStars?"#f59e0b":"#374151"} /></button>)}
                  </div>
                  <input placeholder="Write a review…" value={reviewText} onChange={e=>setReviewText(e.target.value)}
                    onKeyDown={e=>{ if(e.key==="Enter"&&reviewText.trim()&&selectedProfile){ const newRev:Review={reviewer:userName,avatar:userAvatar,stars:reviewStars,text:reviewText.trim(),time:"Just now"}; setDrawerReviews(prev=>({...prev,[selectedProfile.handle]:[newRev,...(prev[selectedProfile.handle]||[])]})); setReviewText("");setReviewStars(5); } }}
                    style={{ flex:1,padding:"8px 10px",borderRadius:"8px",border:`1px solid ${C.border}`,background:"#0d1220",color:"#fff",fontSize:"12px",fontFamily:"inherit",outline:"none" }} />
                </div>
              </div>
            </div>
            <div style={{ padding:"14px 20px",borderTop:`1px solid ${C.border}`,display:"flex",gap:"8px" }}>
              <button onClick={()=>handleCloseDrawer()} style={{ flex:1,padding:"11px",borderRadius:"8px",border:"none",background:C.accent,color:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer",transition:"background 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.background=C.accentHov} onMouseLeave={e=>e.currentTarget.style.background=C.accent}>Send Message</button>
              <button onClick={()=>{ if(selectedProfile){ setRepostCaption(`Great work by ${selectedProfile.name} ${selectedProfile.handle}!`); setShowRepostModal(true); } }}
                style={{ padding:"11px 14px",borderRadius:"8px",border:`1px solid ${C.border}`,background:"transparent",color:C.muted,fontSize:"13px",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:"6px",transition:"all 0.15s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.green;e.currentTarget.style.color=C.green}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted}}
              ><Repeat2 size={15} /> Repost</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Repost Modal ────────────────────────────────────────── */}
      {showRepostModal && selectedProfile && (
        <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)" }} onClick={()=>{setShowRepostModal(false);setRepostCaption("")}}>
          <motion.div initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }} onClick={e=>e.stopPropagation()}
            style={{ background:"#111827",border:`1px solid ${C.border}`,borderRadius:"16px",width:"100%",maxWidth:"480px",padding:"24px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px" }}>
              <h3 style={{ margin:0,fontSize:"16px",fontWeight:800,color:"#fff" }}>Create Repost</h3>
              <button onClick={()=>{setShowRepostModal(false);setRepostCaption("")}} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",padding:4 }}><X size={18} /></button>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:"12px",padding:"12px",borderRadius:"10px",background:"#0d1220",border:`1px solid ${C.border}`,marginBottom:"14px" }}>
              <img src={selectedProfile.avatar} alt="" style={{ width:"40px",height:"40px",borderRadius:"10px",objectFit:"cover" }} />
              <div>
                <div style={{ display:"flex",alignItems:"center",gap:"6px" }}>
                  <span style={{ fontSize:"13px",fontWeight:700,color:"#fff" }}>{selectedProfile.name}</span>
                  {selectedProfile.verified && <span style={{ width:"14px",height:"14px",borderRadius:"50%",background:C.cyan,color:"#fff",fontSize:"7px",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700 }}>✓</span>}
                </div>
                <span style={{ fontSize:"11px",color:C.muted }}>{selectedProfile.handle} · {selectedProfile.specialty}</span>
              </div>
            </div>
            <textarea placeholder={`Share your thoughts about ${selectedProfile.name}…`} value={repostCaption} onChange={e=>setRepostCaption(e.target.value)}
              rows={4} style={{ width:"100%",padding:"12px",borderRadius:"10px",border:`1px solid ${C.border}`,background:"#0d1220",color:"#fff",fontSize:"13px",fontFamily:"inherit",resize:"vertical",outline:"none",boxSizing:"border-box" }} />
            <div style={{ display:"flex",gap:"8px",marginTop:"14px",justifyContent:"flex-end" }}>
              <button onClick={()=>{setShowRepostModal(false);setRepostCaption("")}} style={{ padding:"9px 16px",borderRadius:"8px",border:`1px solid ${C.border}`,background:"transparent",color:C.muted,fontSize:"12px",fontWeight:700,cursor:"pointer" }}>Cancel</button>
              <button onClick={async()=>{ if(!selectedProfile||!repostCaption.trim())return; const body=`${repostCaption.trim()}\n\nMentioned: ${selectedProfile.handle}`; const newPost=await postService.create(userName,{title:`Repost: ${selectedProfile.name}`,body,category:"Reposts",category_color:"#22c55e",tags:["repost",selectedProfile.handle.replace("@","")]}); if(newPost){const fullPost={...newPost,author:{id:userName,display_name:userName,username:userName.toLowerCase().replace(/\s/g,""),avatar_url:userAvatar,is_verified:false},is_liked:false,is_bookmarked:false,is_reposted:false}as any;useFeedStore.getState().addPost(fullPost);} setShowRepostModal(false);setRepostCaption(""); }}
                style={{ padding:"9px 18px",borderRadius:"8px",border:"none",background:C.green,color:"#000",fontSize:"12px",fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",gap:"6px",transition:"background 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.background="#16a34a"} onMouseLeave={e=>e.currentTarget.style.background=C.green}
              ><Repeat2 size={14} /> Post</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Block Artist Confirmation ─────────────────────────── */}
      {showBlockConfirm && selectedProfile && (
        <div style={{ position:"fixed",inset:0,zIndex:250,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)" }} onClick={()=>setShowBlockConfirm(false)}>
          <motion.div initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }} onClick={e=>e.stopPropagation()}
            style={{ background:"#111827",border:`1px solid ${C.border}`,borderRadius:"16px",width:"100%",maxWidth:"380px",padding:"24px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:"10px",marginBottom:"16px" }}>
              <div style={{ width:"40px",height:"40px",borderRadius:"10px",background:"rgba(239,68,68,0.12)",display:"flex",alignItems:"center",justifyContent:"center" }}><Shield size={20} color="#ef4444" /></div>
              <h3 style={{ margin:0,fontSize:"15px",fontWeight:800,color:"#fff" }}>Block Artist</h3>
            </div>
            <p style={{ margin:"0 0 18px",fontSize:"13px",color:C.subtext,lineHeight:1.6 }}>
              Are you sure you want to block <strong style={{color:"#fff"}}>{selectedProfile.name}</strong>? They will be hidden from your directory and their content will no longer appear in your feed.
            </p>
            <div style={{ display:"flex",gap:"8px",justifyContent:"flex-end" }}>
              <button onClick={()=>setShowBlockConfirm(false)} style={{ padding:"9px 16px",borderRadius:"8px",border:`1px solid ${C.border}`,background:"transparent",color:C.muted,fontSize:"12px",fontWeight:700,cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>{setBlockedHandles(prev=>new Set([...prev,selectedProfile.handle]));setShowBlockConfirm(false);handleCloseDrawer();}}
                style={{ padding:"9px 16px",borderRadius:"8px",border:"none",background:"#ef4444",color:"#fff",fontSize:"12px",fontWeight:700,cursor:"pointer",transition:"background 0.12s" }}
                onMouseEnter={e=>e.currentTarget.style.background="#dc2626"} onMouseLeave={e=>e.currentTarget.style.background="#ef4444"}
              >Block</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Report Artist Modal ───────────────────────────────── */}
      {showReportModal && selectedProfile && (
        <div style={{ position:"fixed",inset:0,zIndex:250,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)" }} onClick={()=>{setShowReportModal(false);setReportReason("")}}>
          <motion.div initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }} onClick={e=>e.stopPropagation()}
            style={{ background:"#111827",border:`1px solid ${C.border}`,borderRadius:"16px",width:"100%",maxWidth:"420px",padding:"24px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px" }}>
              <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
                <div style={{ width:"36px",height:"36px",borderRadius:"9px",background:"rgba(245,158,11,0.12)",display:"flex",alignItems:"center",justifyContent:"center" }}><AlertTriangle size={18} color="#f59e0b" /></div>
                <h3 style={{ margin:0,fontSize:"15px",fontWeight:800,color:"#fff" }}>Report Artist</h3>
              </div>
              <button onClick={()=>{setShowReportModal(false);setReportReason("")}} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",padding:4 }}><X size={18} /></button>
            </div>
            <p style={{ margin:"0 0 12px",fontSize:"12px",color:C.muted }}>
              Reporting <strong style={{color:"#fff"}}>{selectedProfile.name}</strong> ({selectedProfile.handle}). Please describe the issue below.
            </p>
            <textarea placeholder="Describe why you're reporting this artist…" value={reportReason} onChange={e=>setReportReason(e.target.value)}
              rows={4} style={{ width:"100%",padding:"12px",borderRadius:"10px",border:`1px solid ${C.border}`,background:"#0d1220",color:"#fff",fontSize:"13px",fontFamily:"inherit",resize:"vertical",outline:"none",boxSizing:"border-box" }} />
            <div style={{ display:"flex",gap:"8px",marginTop:"14px",justifyContent:"flex-end" }}>
              <button onClick={()=>{setShowReportModal(false);setReportReason("")}} style={{ padding:"9px 16px",borderRadius:"8px",border:`1px solid ${C.border}`,background:"transparent",color:C.muted,fontSize:"12px",fontWeight:700,cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>{setShowReportModal(false);setReportReason("")}}
                style={{ padding:"9px 16px",borderRadius:"8px",border:"none",background:"#f59e0b",color:"#000",fontSize:"12px",fontWeight:700,cursor:"pointer",transition:"background 0.12s" }}
                onMouseEnter={e=>e.currentTarget.style.background="#d97706"} onMouseLeave={e=>e.currentTarget.style.background="#f59e0b"}
              >Submit Report</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─── SUPPLIERS DIRECTORY ────────────────────────────────────────────
interface SupplierCompany {
  name:string;handle:string;logo:string;category:string;
  commodities:{ item:string;price:string }[];
  email:string;phone:string;location:string;
  rating:number;
}

const DEFAULT_SUPPLIERS: SupplierCompany[] = [
  { name:"Nexus Steel Corp",handle:"@nexus_steel",logo:"NS",category:"Raw Materials",commodities:[{item:"Structural Steel",price:"$580/ton"},{item:"Rebar Grade 60",price:"$620/ton"},{item:"Steel Plates",price:"$710/ton"}],email:"sales@nexussteel.com",phone:"+1 (800) 555-0101",location:"Pittsburgh, PA",rating:4.8 },
  { name:"Pacific Timber Co",handle:"@pacific_timber",logo:"PT",category:"Raw Materials",commodities:[{item:"Douglas Fir Lumber",price:"$480/bdft"},{item:"Plywood Sheets 4×8",price:"$42/sheet"},{item:"Cedar Shingles",price:"$185/sq"}],email:"orders@pactimber.com",phone:"+1 (800) 555-0202",location:"Portland, OR",rating:4.6 },
  { name:"OmniLogix Solutions",handle:"@omnilogix",logo:"OL",category:"Logistics & Storage",commodities:[{item:"Industrial Storage",price:"$12/sq ft"},{item:"Warehouse Lease",price:"$8.50/sq ft/mo"},{item:"Cold Chain Storage",price:"$15/sq ft"}],email:"info@omnilogix.com",phone:"+1 (800) 555-0303",location:"Memphis, TN",rating:4.9 },
  { name:"Apex Polymer Group",handle:"@apex_polymer",logo:"AP",category:"Raw Materials",commodities:[{item:"HDPE Resin",price:"$1.25/lb"},{item:"Polypropylene",price:"$0.98/lb"},{item:"ABS Pellets",price:"$1.60/lb"}],email:"bulk@apexpolymer.com",phone:"+1 (800) 555-0404",location:"Houston, TX",rating:4.7 },
  { name:"Atlas Aggregate Ltd",handle:"@atlas_agg",logo:"AA",category:"Raw Materials",commodities:[{item:"Crushed Gravel",price:"$28/ton"},{item:"River Sand",price:"$35/ton"},{item:"Ready-Mix Concrete",price:"$125/cu yd"}],email:"quotes@atlasagg.com",phone:"+1 (800) 555-0505",location:"Denver, CO",rating:4.5 },
  { name:"TransGlobal Freight",handle:"@tgfreight",logo:"TG",category:"Logistics & Storage",commodities:[{item:"FCL Shipping 20ft",price:"$2,800/route"},{item:"LTL Freight",price:"$0.18/lb"},{item:"Customs Brokerage",price:"$350/entry"}],email:"dispatch@tgfreight.com",phone:"+1 (800) 555-0606",location:"Long Beach, CA",rating:4.4 },
];

function SuppliersView() {
  const [suppliers,setSuppliers] = useState<SupplierCompany[]>(DEFAULT_SUPPLIERS);
  const [searchInput,setSearchInput] = useState("");
  const [searchQuery,setSearchQuery] = useState("");
  const [showRegister,setShowRegister] = useState(false);
  const [contactSupplier,setContactSupplier] = useState<SupplierCompany|null>(null);
  const [regForm,setRegForm] = useState({ company:"",field:"",pricing:"",email:"",phone:"",catalogFile:null as File|null,productImages:[] as File[],initialRating:"" });

  const visible = searchQuery.trim()
    ? suppliers.filter(s => {
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.commodities.some(c=>c.item.toLowerCase().includes(q));
      })
    : suppliers;

  const inputStyle: React.CSSProperties = {
    width:"100%",padding:"10px 12px",borderRadius:"8px",border:`1px solid ${C.border}`,
    background:"#0d1220",color:"#fff",fontSize:"13px",fontFamily:"inherit",outline:"none",
  };

  const CAT_COLORS: Record<string,string> = { "Raw Materials":"#2563eb","Logistics & Storage":"#7c3aed" };

  return (
    <div style={{ flex:1,overflowY:"auto",padding:"28px 32px" }}>
      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"24px" }}>
        <div>
          <h2 style={{ margin:0,fontSize:"20px",fontWeight:800,color:"#fff" }}>B2B Supplier Directory</h2>
          <p style={{ margin:"4px 0 0",fontSize:"13px",color:C.muted }}>Source raw materials, storage solutions, and bulk logistics from verified companies.</p>
        </div>
        <button onClick={()=>setShowRegister(true)}
          style={{ display:"flex",alignItems:"center",gap:"6px",padding:"9px 16px",borderRadius:"8px",border:`1px solid ${C.accent}`,background:"rgba(37,99,235,0.12)",color:C.accent,fontSize:"12px",fontWeight:700,cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap" }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(37,99,235,0.25)"}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(37,99,235,0.12)"}}
        ><Plus size={14} /> Register as Supplier</button>
      </div>

      {/* Search */}
      <div style={{ display:"flex",gap:"8px",marginBottom:"28px" }}>
        <div style={{ flex:1,position:"relative" }}>
          <Search size={16} color={C.muted} style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)" }} />
          <input placeholder="Search raw materials or units (e.g., Steel, Timber, Storage)..." value={searchInput} onChange={e=>setSearchInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")setSearchQuery(searchInput)}}
            style={{ width:"100%",padding:"11px 14px 11px 38px",borderRadius:"10px",border:`1px solid ${C.border}`,background:"#0d1220",color:"#fff",fontSize:"13px",fontFamily:"inherit",outline:"none",transition:"border-color 0.15s" }}
            onFocus={e=>e.currentTarget.style.borderColor=C.accent} onBlur={e=>e.currentTarget.style.borderColor=C.border} />
        </div>
        <button onClick={()=>setSearchQuery(searchInput)}
          style={{ padding:"11px 20px",borderRadius:"10px",border:"none",background:C.accent,color:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:"6px",transition:"background 0.15s",whiteSpace:"nowrap" }}
          onMouseEnter={e=>e.currentTarget.style.background=C.accentHov} onMouseLeave={e=>e.currentTarget.style.background=C.accent}
        ><Search size={14} /> Search</button>
      </div>

      {/* Grid */}
      <div style={{ marginBottom:"16px" }}>
        <h3 style={{ margin:0,fontSize:"15px",fontWeight:700,color:"#fff" }}>{searchQuery.trim()?`Results for "${searchQuery}"`:"Verified"} Suppliers</h3>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:"14px" }}>
        {visible.map((s,i)=>(
          <motion.div key={i} whileHover={{ y:-2,borderColor:"rgba(37,99,235,0.3)" }}
            style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:"14px",padding:"18px",display:"flex",flexDirection:"column",gap:"12px",transition:"border-color 0.2s" }}>
            <div style={{ display:"flex",alignItems:"center",gap:"12px" }}>
              <div style={{ width:"44px",height:"44px",borderRadius:"12px",background:`${CAT_COLORS[s.category]||C.accent}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",fontWeight:800,color:CAT_COLORS[s.category]||C.accent,flexShrink:0 }}>{s.logo}</div>
              <div style={{ flex:1,minWidth:0 }}>
                <span style={{ fontSize:"14px",fontWeight:700,color:"#fff",display:"block" }}>{s.name}</span>
                <span style={{ fontSize:"11px",color:C.muted }}>{s.handle}</span>
              </div>
              <span style={{ fontSize:"10px",fontWeight:700,color:CAT_COLORS[s.category]||C.accent,background:`${CAT_COLORS[s.category]||C.accent}15`,padding:"3px 8px",borderRadius:"6px",whiteSpace:"nowrap" }}>{s.category}</span>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:"6px" }}>
              <Star size={12} fill="#f59e0b" color="#f59e0b" />
              <span style={{ fontSize:"12px",fontWeight:600,color:"#fff" }}>{s.rating.toFixed(1)}</span>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:"6px" }}>
              {s.commodities.slice(0,3).map((c,j)=>(
                <div key={j} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",borderRadius:"6px",background:"#0d1220" }}>
                  <span style={{ fontSize:"12px",color:C.subtext }}>{c.item}</span>
                  <span style={{ fontSize:"12px",fontWeight:700,color:C.green }}>{c.price}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>setContactSupplier(s)}
              style={{ width:"100%",padding:"9px",borderRadius:"8px",border:"none",background:C.accent,color:"#fff",fontSize:"12px",fontWeight:700,cursor:"pointer",transition:"background 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.background=C.accentHov} onMouseLeave={e=>e.currentTarget.style.background=C.accent}
            >View Contact Info</button>
          </motion.div>
        ))}
      </div>

      {/* ── Register Company Modal ────────────────────────────────── */}
      {showRegister && (
        <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)" }} onClick={()=>setShowRegister(false)}>
          <motion.div initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }} onClick={e=>e.stopPropagation()}
            style={{ background:"#111827",border:`1px solid ${C.border}`,borderRadius:"16px",width:"100%",maxWidth:"480px",padding:"24px",maxHeight:"90vh",overflowY:"auto" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px" }}>
              <h3 style={{ margin:0,fontSize:"16px",fontWeight:800,color:"#fff" }}>Register as Supplier</h3>
              <button onClick={()=>setShowRegister(false)} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",padding:4 }}><X size={18} /></button>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:"14px" }}>
              <div>
                <label style={{ display:"block",fontSize:"11px",fontWeight:600,color:C.muted,marginBottom:"6px" }}>Company Name</label>
                <input placeholder="Your company name" value={regForm.company} onChange={e=>setRegForm({...regForm,company:e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display:"block",fontSize:"11px",fontWeight:600,color:C.muted,marginBottom:"6px" }}>Business Field / Category</label>
                <input placeholder="e.g., Raw Materials, Logistics & Storage" value={regForm.field} onChange={e=>setRegForm({...regForm,field:e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display:"block",fontSize:"11px",fontWeight:600,color:C.muted,marginBottom:"6px" }}>Material Pricing Details</label>
                <textarea placeholder="List your products and bulk pricing (e.g., Steel: $580/ton)" value={regForm.pricing} onChange={e=>setRegForm({...regForm,pricing:e.target.value})} rows={3}
                  style={{ ...inputStyle,resize:"vertical" }} />
              </div>

              {/* File uploads */}
              <div>
                <label style={{ display:"block",fontSize:"11px",fontWeight:600,color:C.muted,marginBottom:"6px" }}>Price List / Catalog (PDF)</label>
                {regForm.catalogFile ? (
                  <div style={{ display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"8px",background:"#0d1220",border:`1px solid ${C.border}` }}>
                    <div style={{ width:"32px",height:"32px",borderRadius:"7px",background:"rgba(37,99,235,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}><FileText size={14} color={C.accent} /></div>
                    <span style={{ flex:1,fontSize:"12px",color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{regForm.catalogFile.name}</span>
                    <span style={{ fontSize:"10px",color:C.muted }}>{(regForm.catalogFile.size/1024).toFixed(0)} KB</span>
                    <button onClick={()=>setRegForm({...regForm,catalogFile:null})} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",padding:2,display:"flex" }}><X size={14} /></button>
                  </div>
                ) : (
                  <label style={{ display:"flex",alignItems:"center",gap:"8px",padding:"12px",borderRadius:"8px",border:`1px dashed ${C.border}`,background:"#0d1220",cursor:"pointer",transition:"border-color 0.15s" }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                    <UploadCloud size={16} color={C.muted} />
                    <span style={{ fontSize:"12px",color:C.muted }}>Choose PDF file…</span>
                    <input type="file" accept=".pdf" style={{ display:"none" }} onChange={e=>{const f=e.target.files?.[0]||null;setRegForm({...regForm,catalogFile:f})}} />
                  </label>
                )}
              </div>
              <div>
                <label style={{ display:"block",fontSize:"11px",fontWeight:600,color:C.muted,marginBottom:"6px" }}>Material / Product Images</label>
                {regForm.productImages.length > 0 && (
                  <div style={{ display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"8px" }}>
                    {regForm.productImages.map((file,idx)=>(
                      <div key={idx} style={{ position:"relative",width:64,height:64,borderRadius:"8px",overflow:"hidden",border:`1px solid ${C.border}` }}>
                        <img src={URL.createObjectURL(file)} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                        <button onClick={()=>setRegForm({...regForm,productImages:regForm.productImages.filter((_,i)=>i!==idx)})}
                          style={{ position:"absolute",top:2,right:2,width:18,height:18,borderRadius:"50%",background:"rgba(0,0,0,0.7)",border:"none",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0 }}>
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label style={{ display:"flex",alignItems:"center",gap:"8px",padding:"12px",borderRadius:"8px",border:`1px dashed ${C.border}`,background:"#0d1220",cursor:"pointer",transition:"border-color 0.15s" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <UploadCloud size={16} color={C.muted} />
                  <span style={{ fontSize:"12px",color:C.muted }}>Choose images ({regForm.productImages.length} attached)…</span>
                  <input type="file" accept=".png,.jpeg,.webp" multiple style={{ display:"none" }} onChange={e=>{const files=Array.from(e.target.files||[]);setRegForm({...regForm,productImages:[...regForm.productImages,...files]})}} />
                </label>
              </div>
              <div>
                <label style={{ display:"block",fontSize:"11px",fontWeight:600,color:C.muted,marginBottom:"6px" }}>Initial Rating / Score</label>
                <input type="number" min="1" max="5" step="0.1" placeholder="Enter initial review rating (1.0 - 5.0)" value={regForm.initialRating} onChange={e=>setRegForm({...regForm,initialRating:e.target.value})} style={inputStyle} />
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px" }}>
                <div>
                  <label style={{ display:"block",fontSize:"11px",fontWeight:600,color:C.muted,marginBottom:"6px" }}>Email</label>
                  <input placeholder="company@example.com" value={regForm.email} onChange={e=>setRegForm({...regForm,email:e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display:"block",fontSize:"11px",fontWeight:600,color:C.muted,marginBottom:"6px" }}>Phone</label>
                  <input placeholder="+1 (800) 555-0000" value={regForm.phone} onChange={e=>setRegForm({...regForm,phone:e.target.value})} style={inputStyle} />
                </div>
              </div>
              <button onClick={()=>{
                if(!regForm.company.trim()||!regForm.field.trim())return;
                const items = regForm.pricing.split("\n").filter(Boolean).map(line=>{
                  const [item,...rest]=line.split(":");
                  return { item:(item||"").trim(), price:(rest.join(":")||"").trim()||"Contact for pricing" };
                });
                const newSup: SupplierCompany = {
                  name:regForm.company.trim(),
                  handle:"@"+regForm.company.trim().toLowerCase().replace(/\s+/g,"_"),
                  logo:regForm.company.trim().split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),
                  category:regForm.field.trim(),
                  commodities:items.length?items:[{item:"Contact for catalog",price:"Contact us"}],
                  email:regForm.email.trim(),
                  phone:regForm.phone.trim(),
                  location:"",
                  rating:Math.round(Math.min(5,Math.max(1,parseFloat(regForm.initialRating)||5))*10)/10,
                };
                setSuppliers(prev=>[newSup,...prev]);
                setRegForm({company:"",field:"",pricing:"",email:"",phone:"",catalogFile:null,productImages:[],initialRating:""});
                setShowRegister(false);
              }}
                style={{ width:"100%",padding:"11px",borderRadius:"8px",border:"none",background:C.accent,color:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer",marginTop:"4px",transition:"background 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.background=C.accentHov} onMouseLeave={e=>e.currentTarget.style.background=C.accent}
              >Register Company</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Contact Info Modal ────────────────────────────────────── */}
      {contactSupplier && (
        <div style={{ position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)" }} onClick={()=>setContactSupplier(null)}>
          <motion.div initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }} onClick={e=>e.stopPropagation()}
            style={{ background:"#111827",border:`1px solid ${C.border}`,borderRadius:"16px",width:"100%",maxWidth:"420px",padding:"24px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"18px" }}>
              <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
                <div style={{ width:"40px",height:"40px",borderRadius:"10px",background:`${CAT_COLORS[contactSupplier.category]||C.accent}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",fontWeight:800,color:CAT_COLORS[contactSupplier.category]||C.accent }}>{contactSupplier.logo}</div>
                <div>
                  <h3 style={{ margin:0,fontSize:"15px",fontWeight:800,color:"#fff" }}>{contactSupplier.name}</h3>
                  <span style={{ fontSize:"11px",color:C.muted }}>{contactSupplier.category}</span>
                </div>
              </div>
              <button onClick={()=>setContactSupplier(null)} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",padding:4 }}><X size={18} /></button>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:"8px",marginBottom:"18px" }}>
              <div style={{ display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"8px",background:"#0d1220",border:`1px solid ${C.border}` }}>
                <Mail size={14} color={C.accent} />
                <div style={{ flex:1 }}><span style={{ fontSize:"10px",color:C.muted,display:"block" }}>Email Address</span><span style={{ fontSize:"13px",color:"#fff" }}>{contactSupplier.email}</span></div>
                <a href="#" onClick={e => {
                  e.preventDefault()
                  const to = encodeURIComponent(contactSupplier.email)
                  const su = encodeURIComponent("Supplier Inquiry via Neutron")
                  const body = encodeURIComponent(`Hi ${contactSupplier.name} Team,\n\nI found your contact from Neutron Social and would love to discuss a potential order with you...`)
                  window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${body}`, '_blank')
                }}
                  style={{ width:28,height:28,borderRadius:6,background:"rgba(37,99,235,0.12)",border:"none",color:C.accent,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,textDecoration:"none" }}>
                  <Send size={12} />
                </a>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"8px",background:"#0d1220",border:`1px solid ${C.border}` }}>
                <Phone size={14} color={C.green} />
                <div><span style={{ fontSize:"10px",color:C.muted,display:"block" }}>Phone Number</span><span style={{ fontSize:"13px",color:"#fff" }}>{contactSupplier.phone}</span></div>
              </div>
              {contactSupplier.location && (
                <div style={{ display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"8px",background:"#0d1220",border:`1px solid ${C.border}` }}>
                  <MapPin size={14} color="#f59e0b" />
                  <div><span style={{ fontSize:"10px",color:C.muted,display:"block" }}>Location</span><span style={{ fontSize:"13px",color:"#fff" }}>{contactSupplier.location}</span></div>
                </div>
              )}
            </div>
            <div>
              <h4 style={{ margin:"0 0 8px",fontSize:"11px",fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em" }}>Price Catalog</h4>
              <div style={{ display:"flex",flexDirection:"column",gap:"4px" }}>
                {contactSupplier.commodities.map((c,j)=>(
                  <div key={j} style={{ display:"flex",justifyContent:"space-between",padding:"7px 10px",borderRadius:"6px",background:"#0d1220" }}>
                    <span style={{ fontSize:"12px",color:C.subtext }}>{c.item}</span>
                    <span style={{ fontSize:"12px",fontWeight:700,color:C.green }}>{c.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function App({ navigate, user, initialTab }: { navigate?: (page:string,params?:any)=>void; user?:any; initialTab?: string }) {
  const { avatar: globalAvatar, displayName: globalDisplayName } = useUserAvatar();
  USER = globalDisplayName || user?.username || 'epiclegend766';
  USER_AVATAR = globalAvatar || user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80';

  const [activeTab, setActiveTab] = useState<Tab>((initialTab as Tab) || "hire-artists");

  const renderView = () => {
    switch (activeTab) {
      case "hire-artists":
        return <HireArtistsView navigate={navigate!} userName={USER} userAvatar={USER_AVATAR} />;
      case "suppliers":
        return <SuppliersView />;
      default:
        return <HireArtistsView navigate={navigate!} userName={USER} userAvatar={USER_AVATAR} />;
    }
  };

  return (
    <div style={{ height:"100vh",maxHeight:"100vh",width:"100%",display:"flex",overflow:"hidden",background:C.bg,color:C.text,fontFamily:"Inter,system-ui,-apple-system,sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width:"200px",flexShrink:0,background:C.sidebar,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",height:"100%",overflow:"hidden" }}>
        <div style={{ padding:"20px 18px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:"10px" }}>
          <div style={{ width:"36px",height:"36px",borderRadius:"10px",background:"linear-gradient(135deg,#1e3a8a,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <BarChart2 size={18} color="#fff" />
          </div>
          <div>
            <span style={{ fontWeight:800,fontSize:"15px",color:"#fff",letterSpacing:"0.05em" }}>NEUTRON</span>
            <div style={{ display:"inline-flex",alignItems:"center",marginLeft:"6px",background:"rgba(37,99,235,0.2)",border:"1px solid rgba(37,99,235,0.4)",borderRadius:"4px",padding:"1px 5px" }}>
              <span style={{ fontSize:"8px",color:"#60a5fa",fontWeight:700,letterSpacing:"0.06em" }}>STORE</span>
            </div>
          </div>
        </div>

        <nav style={{ flex:1,padding:"12px 10px",display:"flex",flexDirection:"column",gap:"4px",overflowY:"auto" }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={()=>setActiveTab(item.id)}
              style={{
                display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"10px",border:"none",
                background:activeTab===item.id?"rgba(37,99,235,0.18)":"transparent",
                color:activeTab===item.id?"#60a5fa":C.muted,
                fontSize:"13px",fontWeight:activeTab===item.id?700:500,cursor:"pointer",width:"100%",textAlign:"left",
                borderLeft:activeTab===item.id?"3px solid #2563eb":"3px solid transparent",transition:"all 0.15s",
              }}>
              {item.icon} {item.label}
              {item.id==="escrow" && unreadCount > 0 && (
                <motion.span
                  initial={{ scale:0 }} animate={{ scale:1 }}
                  style={{ marginLeft:"auto",background:C.amber,color:"#000",fontSize:"9px",fontWeight:800,padding:"2px 6px",borderRadius:"99px",minWidth:"18px",textAlign:"center" }}
                >{unreadCount}</motion.span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ borderTop:`1px solid ${C.border}`,padding:"14px 16px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"8px",cursor:"pointer" }}>
            <img src={USER_AVATAR} alt="" style={{ width:"32px",height:"32px",borderRadius:"50%",objectFit:"cover",border:"1px solid rgba(255,255,255,0.1)" }} />
            <div style={{ flex:1,minWidth:0 }}>
              <p style={{ margin:0,fontSize:"12px",fontWeight:700,color:"#e5e7eb",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{USER}</p>
              <p style={{ margin:0,fontSize:"10px",color:C.muted }}>View Profile</p>
            </div>
            <ChevronRight size={14} color={C.muted} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1,display:"flex",overflow:"hidden",minWidth:0 }}>
        {renderView()}
      </div>
    </div>
  );
}


