import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Asset } from "../types";
import {
  ShieldCheck, CheckCircle, Layers, CreditCard, ArrowLeft,
  ChevronRight, FileText, Check, DollarSign,
  Zap, Lock, Clock, Package, Key, ArrowUpRight, Eye,
  AlertTriangle, X, Send
} from "lucide-react";
import {
  useEscrowStore, ESCROW_STEPS, STEP_DESCRIPTIONS, STEP_STATUS_LABELS,
  type ActiveTransaction, type CompletedTrade, type Bid,
} from "../store/escrowStore";

const C = {
  bg:        "#05050A",
  card:      "#090914",
  cardBdr:   "rgba(255,255,255,0.06)",
  accent:    "#00D2FF",
  green:     "#34D399",
  cyan:      "#00D2FF",
  purple:    "#7928CA",
  text:      "#f1f5f9",
  muted:     "#6b7280",
  border:    "rgba(255,255,255,0.06)",
  amber:     "#f59e0b",
  red:       "#ef4444",
};

function fmtCRD(n: number) { return "$" + n.toLocaleString("en",{minimumFractionDigits:3}); }
function fmt(n: number) { return "$" + n.toLocaleString(); }
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
}
function catColor(cat: string): string {
  const m: Record<string,string> = {
    "Digital Assets":"#00D2FF","Creative Assets":"#7928CA","Intellectual Property":"#0891b2",
    "Business Marketplace":"#d97706","Financial Opportunities":"#f59e0b","Real Estate":"#059669",
    "Physical Products":"#b45309",
  };
  return m[cat] || "#4b5563";
}

const STEP_ICONS = [
  <DollarSign size={14} />, <Lock size={14} />, <FileText size={14} />,
  <Key size={14} />, <CheckCircle size={14} />,
];

// ─── PENDING BANNER (pulsing amber for waiting seller) ───────────────
function PendingSellerBanner({ bid }: { bid: Bid }) {
  return (
    <motion.div
      initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.5 }}
      style={{
        background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.2)",
        borderRadius:"18px",padding:"28px",marginBottom:"24px",
        boxShadow:"0 0 40px rgba(245,158,11,0.06)",
      }}
    >
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:"14px" }}>
          <motion.div
            animate={{ boxShadow:["0 0 0px #f59e0b00","0 0 24px #f59e0b50","0 0 0px #f59e0b00"] }}
            transition={{ repeat:Infinity,duration:2 }}
            style={{
              width:"48px",height:"48px",borderRadius:"14px",
              background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.3)",
              display:"flex",alignItems:"center",justifyContent:"center",
            }}
          >
            <Clock size={24} color={C.amber} />
          </motion.div>
          <div>
            <h2 style={{ margin:0,fontSize:"20px",fontWeight:800,color:"#fff" }}>Bid Submitted</h2>
            <p style={{ margin:"2px 0 0",fontSize:"12px",color:C.muted }}>
              Escrow ID: <span style={{ fontFamily:"monospace",color:C.amber }}>{bid.id}</span>
            </p>
          </div>
        </div>
        <motion.div
          animate={{ opacity:[0.6,1,0.6] }}
          transition={{ repeat:Infinity,duration:2,ease:"easeInOut" }}
          style={{
            padding:"6px 14px",borderRadius:"99px",
            background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.25)",
            display:"flex",alignItems:"center",gap:"6px",
          }}
        >
          <span style={{ width:"7px",height:"7px",borderRadius:"50%",background:C.amber,boxShadow:"0 0 8px #f59e0b" }} />
          <span style={{ fontSize:"12px",fontWeight:600,color:C.amber }}>Waiting for Seller response...</span>
        </motion.div>
      </div>

      {/* Bid details */}
      <div style={{
        display:"flex",gap:"20px",padding:"18px",background:"rgba(255,255,255,0.02)",
        borderRadius:"14px",border:"1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{ width:"120px",height:"90px",borderRadius:"12px",overflow:"hidden",flexShrink:0,border:"1px solid rgba(255,255,255,0.06)" }}>
          <img src={bid.asset.image} alt={bid.asset.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px" }}>
            <span style={{ fontSize:"10px",fontWeight:700,padding:"3px 10px",borderRadius:"5px",background:catColor(bid.asset.category),color:"#fff",textTransform:"uppercase",letterSpacing:"0.04em" }}>{bid.asset.category}</span>
          </div>
          <h3 style={{ margin:"4px 0 4px",fontSize:"16px",fontWeight:700,color:"#fff" }}>{bid.asset.name}</h3>
          <div style={{ display:"flex",alignItems:"center",gap:"16px",marginTop:"8px" }}>
            <div>
              <p style={{ margin:0,fontSize:"9px",color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em" }}>Your Bid</p>
              <p style={{ margin:"2px 0 0",fontSize:"20px",fontWeight:800,color:C.amber }}>{fmt(bid.bidAmount)} <span style={{ fontSize:"11px",fontWeight:600 }}>CRD</span></p>
            </div>
            <div>
              <p style={{ margin:0,fontSize:"9px",color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em" }}>Asset Valuation</p>
              <p style={{ margin:"2px 0 0",fontSize:"14px",fontWeight:700,color:"#e5e7eb" }}>{fmt(bid.asset.currentValuation)} CRD</p>
            </div>
          </div>
        </div>
      </div>

      {bid.memo && (
        <div style={{ marginTop:"14px",padding:"12px 16px",background:"rgba(255,255,255,0.02)",borderRadius:"10px",borderLeft:"3px solid rgba(245,158,11,0.4)" }}>
          <p style={{ margin:0,fontSize:"11px",color:C.muted }}><Send size={10} style={{ display:"inline",marginRight:4 }} /> Memo: <span style={{ color:"#d1d5db",fontStyle:"italic" }}>"{bid.memo}"</span></p>
        </div>
      )}

      <p style={{ margin:"16px 0 0",fontSize:"12px",color:C.muted,textAlign:"center" }}>
        The seller will receive a notification. You'll be notified when they respond.
      </p>
    </motion.div>
  );
}

// ─── ACTIVE CONTRACT TRACKER ─────────────────────────────────────────
function ActiveContractTracker({
  transaction, userName, userAvatar, walletBalance,
}: {
  transaction: ActiveTransaction; userName: string; userAvatar: string; walletBalance: number;
}) {
  const { currentStep, asset } = transaction;
  const isComplete = currentStep >= ESCROW_STEPS.length - 1;
  const progressPercent = (currentStep / (ESCROW_STEPS.length - 1)) * 100;
  const statusLabel = STEP_STATUS_LABELS[currentStep] || "Processing";
  const statusColor = isComplete ? C.green : currentStep >= 3 ? C.purple : C.cyan;

  return (
    <motion.div
      initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.5,ease:"easeOut" }}
      style={{
        background:"rgba(9,9,20,0.8)",backdropFilter:"blur(24px)",
        border:`1px solid ${C.cardBdr}`,borderRadius:"18px",
        padding:"28px",marginBottom:"24px",boxShadow:"0 0 40px rgba(0,210,255,0.04)",
      }}
    >
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"24px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:"14px" }}>
          <div style={{ width:"48px",height:"48px",borderRadius:"14px",background:"rgba(0,210,255,0.08)",border:"1px solid rgba(0,210,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <ShieldCheck size={24} color={C.cyan} />
          </div>
          <div>
            <h2 style={{ margin:0,fontSize:"20px",fontWeight:800,color:"#fff" }}>Active Contract</h2>
            <p style={{ margin:"2px 0 0",fontSize:"12px",color:C.muted }}>
              Escrow ID: <span style={{ fontFamily:"monospace",color:C.cyan }}>{transaction.id}</span>
            </p>
          </div>
        </div>
        <motion.div
          animate={{ opacity:[0.6,1,0.6] }}
          transition={{ repeat:Infinity,duration:2,ease:"easeInOut" }}
          style={{
            padding:"6px 14px",borderRadius:"99px",
            background:`${statusColor}15`,border:`1px solid ${statusColor}30`,
            display:"flex",alignItems:"center",gap:"6px",
          }}
        >
          <span style={{ width:"7px",height:"7px",borderRadius:"50%",background:statusColor,boxShadow:`0 0 8px ${statusColor}` }} />
          <span style={{ fontSize:"12px",fontWeight:600,color:statusColor }}>{statusLabel}</span>
        </motion.div>
      </div>

      <div style={{ display:"flex",gap:"20px",marginBottom:"28px",padding:"18px",background:"rgba(255,255,255,0.02)",borderRadius:"14px",border:"1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ width:"120px",height:"90px",borderRadius:"12px",overflow:"hidden",flexShrink:0,border:"1px solid rgba(255,255,255,0.06)" }}>
          <img src={asset.image} alt={asset.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px" }}>
            <span style={{ fontSize:"10px",fontWeight:700,padding:"3px 10px",borderRadius:"5px",background:catColor(asset.category),color:"#fff",textTransform:"uppercase",letterSpacing:"0.04em" }}>{asset.category}</span>
          </div>
          <h3 style={{ margin:"4px 0 4px",fontSize:"16px",fontWeight:700,color:"#fff" }}>{asset.name}</h3>
          <p style={{ margin:"0 0 8px",fontSize:"12px",color:C.muted,lineHeight:1.4 }}>{asset.snippet}</p>
          <div style={{ display:"flex",alignItems:"center",gap:"12px" }}>
            <span style={{ fontSize:"18px",fontWeight:800,color:C.cyan }}>{fmt(asset.currentValuation)}</span>
            <span style={{ fontSize:"11px",color:C.muted }}>Valuation</span>
          </div>
        </div>
        <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",justifyContent:"space-between" }}>
          <div style={{ textAlign:"right" }}>
            <p style={{ margin:0,fontSize:"9px",color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em" }}>Wallet Balance</p>
            <p style={{ margin:"2px 0 0",fontSize:"14px",fontWeight:700,color:C.cyan }}>{fmtCRD(walletBalance)} CRD</p>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:"6px" }}>
            <img src={userAvatar} alt="" style={{ width:"22px",height:"22px",borderRadius:"50%",objectFit:"cover" }} />
            <span style={{ fontSize:"11px",color:"#d1d5db",fontWeight:600 }}>{userName}</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom:"6px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:"6px" }}>
          <span style={{ fontSize:"11px",color:C.muted }}>Progress</span>
          <span style={{ fontSize:"11px",color:statusColor,fontWeight:600 }}>{Math.round(progressPercent)}%</span>
        </div>
        <div style={{ height:"4px",background:"rgba(255,255,255,0.06)",borderRadius:"99px",overflow:"hidden" }}>
          <motion.div initial={{ width:0 }} animate={{ width:`${progressPercent}%` }} transition={{ duration:0.8,ease:"easeOut" }}
            style={{ height:"100%",borderRadius:"99px",background:`linear-gradient(90deg,${C.cyan},${C.purple})`,boxShadow:`0 0 12px ${C.cyan}40` }} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── 5-STEP STEPPER ──────────────────────────────────────────────────
function EscrowStepper({
  currentStep, onAdvance, onComplete, bidStatus,
}: {
  currentStep: number; onAdvance: () => void; onComplete: () => void; bidStatus: string;
}) {
  const isComplete = currentStep >= ESCROW_STEPS.length - 1;

  const handleAdvance = () => {
    if (currentStep === ESCROW_STEPS.length - 2) onComplete();
    else onAdvance();
  };

  return (
    <motion.div
      initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.5,delay:0.1 }}
      style={{ background:C.card,border:`1px solid ${C.cardBdr}`,borderRadius:"18px",padding:"28px",marginBottom:"24px" }}
    >
      <h3 style={{ margin:"0 0 24px",fontSize:"16px",fontWeight:700,color:"#fff",display:"flex",alignItems:"center",gap:"8px" }}>
        <Layers size={16} color={C.cyan} /> Transaction Progress
      </h3>

      <div style={{ display:"flex",alignItems:"flex-start",padding:"0 8px",marginBottom:"20px" }}>
        {ESCROW_STEPS.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          return (
            <React.Fragment key={step}>
              <motion.div
                initial={{ opacity:0,scale:0.8 }} animate={{ opacity:1,scale:1 }}
                transition={{ delay:i*0.1,duration:0.3 }}
                style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:"10px",minWidth:"80px" }}
              >
                <motion.div
                  animate={isCurrent ? { boxShadow:[`0 0 0px ${C.cyan}00`,`0 0 16px ${C.cyan}40`,`0 0 0px ${C.cyan}00`] } : {}}
                  transition={isCurrent ? { repeat:Infinity,duration:2 } : {}}
                  style={{
                    width:"36px",height:"36px",borderRadius:"50%",
                    background:isCompleted ? C.cyan : isCurrent ? `${C.purple}20` : "rgba(255,255,255,0.04)",
                    border:isCompleted ? "none" : isCurrent ? `2px solid ${C.purple}` : "2px solid rgba(255,255,255,0.08)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    color:isCompleted ? "#000" : isCurrent ? C.purple : C.muted,
                    transition:"all 0.3s",
                  }}
                >
                  {isCompleted ? <Check size={16} strokeWidth={3} /> : STEP_ICONS[i]}
                </motion.div>
                <span style={{ fontSize:"10px",fontWeight:isCurrent?700:500,textAlign:"center",color:isCompleted?C.cyan:isCurrent?"#fff":C.muted,lineHeight:1.3,maxWidth:"80px" }}>{step}</span>
              </motion.div>
              {i < ESCROW_STEPS.length - 1 && (
                <div style={{ flex:1,display:"flex",alignItems:"center",paddingTop:"14px" }}>
                  <div style={{ width:"100%",height:"2px",borderRadius:"99px",background:i<currentStep?C.cyan:"rgba(255,255,255,0.06)",transition:"background 0.5s",boxShadow:i<currentStep?`0 0 8px ${C.cyan}30`:"none" }} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }}
          transition={{ duration:0.25 }}
          style={{
            padding:"14px 18px",borderRadius:"12px",
            background:isComplete ? "rgba(52,211,153,0.06)" : "rgba(0,210,255,0.04)",
            border:`1px solid ${isComplete ? "rgba(52,211,153,0.15)" : "rgba(0,210,255,0.1)"}`,
            marginBottom:"16px",
          }}
        >
          <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px" }}>
            <span style={{ fontSize:"12px",fontWeight:700,color:isComplete?C.green:C.cyan }}>
              Step {currentStep+1}: {ESCROW_STEPS[currentStep]}
            </span>
          </div>
          <p style={{ margin:0,fontSize:"12px",color:C.muted,lineHeight:1.5 }}>
            {STEP_DESCRIPTIONS[ESCROW_STEPS[currentStep]]}
          </p>
        </motion.div>
      </AnimatePresence>

      {!isComplete && (
        <motion.button
          onClick={handleAdvance}
          whileHover={{ scale:1.01,boxShadow:`0 0 24px ${C.cyan}25` }}
          whileTap={{ scale:0.98 }}
          style={{
            width:"100%",padding:"12px",borderRadius:"12px",border:"none",
            background:currentStep===ESCROW_STEPS.length-2
              ? `linear-gradient(135deg,${C.green},${C.cyan})`
              : `linear-gradient(135deg,${C.purple},${C.cyan})`,
            color:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",
          }}
        >
          {currentStep===ESCROW_STEPS.length-2 ? (
            <><CheckCircle size={15} /> Complete Transfer</>
          ) : (
            <><Zap size={15} /> Advance to {ESCROW_STEPS[currentStep+1]} →</>
          )}
        </motion.button>
      )}
    </motion.div>
  );
}

// ─── COMPLETED TRADES TABLE ──────────────────────────────────────────
function CompletedTradesSection({ trades }: { trades: CompletedTrade[] }) {
  return (
    <motion.div
      initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.5,delay:0.2 }}
      style={{ background:C.card,border:`1px solid ${C.cardBdr}`,borderRadius:"18px",padding:"22px",flex:1 }}
    >
      <h3 style={{ margin:"0 0 16px",fontSize:"15px",fontWeight:700,color:"#fff",display:"flex",alignItems:"center",gap:"8px" }}>
        <Clock size={15} color={C.cyan} /> Completed Tradings
      </h3>
      {trades.length===0 ? (
        <div style={{ padding:"30px",textAlign:"center",color:C.muted }}><p style={{ margin:0,fontSize:"13px" }}>No completed trades yet.</p></div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:"8px" }}>
          {trades.map((trade,i) => (
            <motion.div
              key={trade.id} initial={{ opacity:0,x:-10 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.3+i*0.08 }}
              style={{ display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"12px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)" }}
            >
              <div style={{ width:"40px",height:"40px",borderRadius:"8px",overflow:"hidden",flexShrink:0,border:"1px solid rgba(255,255,255,0.06)" }}>
                <img src={trade.assetImage} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <p style={{ margin:0,fontSize:"12px",fontWeight:600,color:"#e5e7eb",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{trade.assetName}</p>
                <div style={{ display:"flex",alignItems:"center",gap:"8px",marginTop:"2px" }}>
                  <span style={{ fontSize:"10px",color:C.muted,fontFamily:"monospace" }}>{trade.escrowId}</span>
                  <span style={{ fontSize:"10px",color:C.muted }}>•</span>
                  <span style={{ fontSize:"10px",color:C.muted }}>{formatDate(trade.completedAt)}</span>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ margin:0,fontSize:"13px",fontWeight:700,color:C.cyan }}>{fmt(trade.finalPrice)}</p>
                <div style={{ display:"flex",alignItems:"center",gap:"4px",justifyContent:"flex-end",marginTop:"2px" }}>
                  <CheckCircle size={11} color={C.green} />
                  <span style={{ fontSize:"10px",fontWeight:600,color:C.green }}>Settled</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── MY ASSETS GRID ──────────────────────────────────────────────────
function MyAssetsSection({ assets }: { assets: Asset[] }) {
  return (
    <motion.div
      initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.5,delay:0.3 }}
      style={{ background:C.card,border:`1px solid ${C.cardBdr}`,borderRadius:"18px",padding:"22px",flex:1 }}
    >
      <h3 style={{ margin:"0 0 16px",fontSize:"15px",fontWeight:700,color:"#fff",display:"flex",alignItems:"center",gap:"8px" }}>
        <Package size={15} color={C.purple} /> My Assets
      </h3>
      {assets.length===0 ? (
        <div style={{ padding:"30px",textAlign:"center",color:C.muted }}><p style={{ margin:0,fontSize:"13px" }}>No assets acquired yet.</p></div>
      ) : (
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px" }}>
          {assets.map((asset,i) => (
            <motion.div
              key={asset.id} initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }} transition={{ delay:0.4+i*0.08 }}
              whileHover={{ y:-2,boxShadow:"0 8px 24px rgba(0,0,0,0.3)" }}
              style={{ borderRadius:"12px",overflow:"hidden",border:"1px solid rgba(255,255,255,0.04)",cursor:"pointer" }}
            >
              <div style={{ position:"relative",height:"70px" }}>
                <img src={asset.image} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 60%)" }} />
                <span style={{ position:"absolute",top:"5px",left:"5px",fontSize:"8px",fontWeight:700,padding:"2px 6px",borderRadius:"4px",background:catColor(asset.category),color:"#fff",textTransform:"uppercase" }}>{asset.category.split(" ")[0]}</span>
              </div>
              <div style={{ padding:"8px 10px" }}>
                <p style={{ margin:0,fontSize:"11px",fontWeight:600,color:"#e5e7eb",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{asset.name}</p>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:"4px" }}>
                  <span style={{ fontSize:"12px",fontWeight:700,color:C.cyan }}>{fmt(asset.currentValuation)}</span>
                  <span style={{ fontSize:"9px",fontWeight:600,color:C.green,display:"flex",alignItems:"center",gap:"3px" }}>
                    <span style={{ width:"5px",height:"5px",borderRadius:"50%",background:C.green }} /> Deployed
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── OWNERSHIP BANNER ────────────────────────────────────────────────
function OwnershipBanner({ asset }: { asset: Asset }) {
  return (
    <motion.div
      initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.5,delay:0.15 }}
      style={{
        background:C.card,border:"1px solid rgba(52,211,153,0.2)",borderRadius:"18px",
        padding:"20px 24px",marginBottom:"24px",display:"flex",alignItems:"center",justifyContent:"space-between",
        boxShadow:"0 0 30px rgba(52,211,153,0.06)",
      }}
    >
      <div style={{ display:"flex",alignItems:"center",gap:"14px" }}>
        <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:"spring",stiffness:200,damping:15,delay:0.3 }}
          style={{ width:"42px",height:"42px",borderRadius:"50%",background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.25)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <CheckCircle size={22} color={C.green} />
        </motion.div>
        <div>
          <p style={{ margin:0,fontSize:"15px",fontWeight:700,color:"#fff" }}>Ownership Transferred</p>
          <p style={{ margin:"2px 0 0",fontSize:"12px",color:C.muted }}>
            <span style={{ fontWeight:600,color:"#e5e7eb" }}>{asset.name}</span> is now stored in your{" "}
            <span style={{ color:C.cyan,cursor:"pointer" }}>local grid keys</span>.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────
function EmptyEscrowState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <motion.div
      initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }} transition={{ duration:0.4 }}
      style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 40px" }}
    >
      <div style={{ width:"72px",height:"72px",borderRadius:"20px",background:"rgba(0,210,255,0.06)",border:"1px solid rgba(0,210,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"20px" }}>
        <Lock size={32} color={C.cyan} style={{ opacity:0.4 }} />
      </div>
      <h3 style={{ margin:"0 0 8px",fontSize:"20px",fontWeight:700,color:"#fff" }}>No Active Escrow</h3>
      <p style={{ margin:"0 0 28px",fontSize:"14px",textAlign:"center",maxWidth:"340px",lineHeight:1.6,color:C.muted }}>
        Purchase an asset from the marketplace to start an escrow transaction and track it here.
      </p>
      <motion.button
        onClick={onBrowse} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
        style={{ padding:"12px 28px",borderRadius:"12px",border:"none",background:`linear-gradient(135deg,${C.purple},${C.cyan})`,color:"#fff",fontSize:"14px",fontWeight:700,cursor:"pointer",boxShadow:`0 4px 20px ${C.cyan}20` }}
      >Browse Marketplace</motion.button>
    </motion.div>
  );
}

// ─── REJECTED NOTICE ─────────────────────────────────────────────────
function RejectedNotice({ bid, onBrowse }: { bid: Bid; onBrowse: () => void }) {
  return (
    <motion.div
      initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }} transition={{ duration:0.4 }}
      style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 40px" }}
    >
      <div style={{ width:"72px",height:"72px",borderRadius:"20px",background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.12)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"20px" }}>
        <X size={32} color={C.red} style={{ opacity:0.6 }} />
      </div>
      <h3 style={{ margin:"0 0 8px",fontSize:"20px",fontWeight:700,color:"#fff" }}>Bid Rejected</h3>
      <p style={{ margin:"0 0 8px",fontSize:"14px",textAlign:"center,maxWidth:340px",lineHeight:1.6,color:C.muted }}>
        Your bid of <span style={{ fontWeight:700,color:C.amber }}>{fmt(bid.bidAmount)} CRD</span> on{" "}
        <span style={{ fontWeight:600,color:"#e5e7eb" }}>{bid.asset.name}</span> was declined by the seller.
      </p>
      <motion.button
        onClick={onBrowse} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
        style={{ padding:"12px 28px",borderRadius:"12px",border:"none",background:C.accent,color:"#fff",fontSize:"14px",fontWeight:700,cursor:"pointer" }}
      >Browse More Assets</motion.button>
    </motion.div>
  );
}

// ─── MAIN ESCROW PORTAL ──────────────────────────────────────────────
interface EscrowPortalProps {
  userName: string;
  userAvatar: string;
  walletBalance: number;
  onBackToMarketplace: () => void;
}

export default function EscrowPortal({
  userName, userAvatar, walletBalance, onBackToMarketplace,
}: EscrowPortalProps) {
  const {
    activeBid, activeTransaction, completedTrades, ownedAssets,
    advanceEscrowStep, completeEscrow, cancelEscrow,
  } = useEscrowStore();

  const header = (
    <div style={{ padding:"22px 28px 16px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",borderBottom:`1px solid ${C.border}` }}>
      <div style={{ display:"flex",alignItems:"center",gap:"8px" }}>
        <button onClick={onBackToMarketplace} style={{ background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,borderRadius:"10px",padding:"8px 12px",cursor:"pointer",color:C.muted,display:"flex",alignItems:"center",gap:"4px",fontSize:"12px",fontWeight:600 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <h1 style={{ margin:0,fontSize:"22px",fontWeight:800,color:"#fff" }}>Escrow</h1>
          <p style={{ margin:"2px 0 0",fontSize:"12px",color:C.muted }}>
            Secure transfers on the decentralized ledger. Lock credits, set counter proposals, and verify asset deeds.
          </p>
        </div>
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:"16px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:"8px",padding:"8px 14px",background:"rgba(0,210,255,0.06)",border:"1px solid rgba(0,210,255,0.12)",borderRadius:"10px" }}>
          <CreditCard size={15} color={C.cyan} />
          <span style={{ fontSize:"14px",fontWeight:700,color:C.cyan }}>{fmtCRD(walletBalance)} CRD</span>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",background:"rgba(255,255,255,0.04)",borderRadius:"10px",border:`1px solid ${C.border}` }}>
          <img src={userAvatar} alt="" style={{ width:"30px",height:"30px",borderRadius:"50%",objectFit:"cover" }} />
          <span style={{ fontSize:"13px",color:"#e5e7eb",fontWeight:600 }}>{userName}</span>
        </div>
      </div>
    </div>
  );

  // ── No active bid at all ──
  if (!activeBid) {
    return (
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        {header}
        <EmptyEscrowState onBrowse={onBackToMarketplace} />
      </div>
    );
  }

  // ── Bid was rejected ──
  if (activeBid.status === "REJECTED") {
    return (
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        {header}
        <RejectedNotice bid={activeBid} onBrowse={onBackToMarketplace} />
      </div>
    );
  }

  // ── Bid pending seller approval ──
  if (activeBid.status === "PENDING_SELLER_APPROVAL") {
    return (
      <div style={{ flex:1,overflowY:"auto",padding:0 }}>
        {header}
        <div style={{ padding:"24px 28px" }}>
          <PendingSellerBanner bid={activeBid} />
          <CompletedTradesSection trades={completedTrades} />
        </div>
      </div>
    );
  }

  // ── Bid accepted, in escrow ──
  return (
    <div style={{ flex:1,overflowY:"auto",padding:0 }}>
      {header}
      <div style={{ padding:"24px 28px" }}>
        {activeTransaction && (
          <ActiveContractTracker
            transaction={activeTransaction}
            userName={userName} userAvatar={userAvatar} walletBalance={walletBalance}
          />
        )}

        {activeTransaction && (
          <EscrowStepper
            currentStep={activeTransaction.currentStep}
            onAdvance={advanceEscrowStep}
            onComplete={completeEscrow}
            bidStatus={activeBid.status}
          />
        )}

        {activeBid.status === "COMPLETED" && activeTransaction && (
          <OwnershipBanner asset={activeBid.asset} />
        )}

        <div style={{ display:"flex",gap:"16px" }}>
          <CompletedTradesSection trades={completedTrades} />
          <MyAssetsSection assets={ownedAssets} />
        </div>
      </div>
    </div>
  );
}
