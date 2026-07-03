import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Asset } from "../types";
import { ASSET_LISTINGS } from "../data";
import {
  FileText, Plus, Settings, ChevronRight, ChevronDown,
  Eye, Edit2, Search, Layers, Zap, CheckCircle,
  Upload, Lock, DollarSign, Tag, MapPin, Users, ShieldCheck,
  Check, ArrowUpRight, BarChart2, Package, Trash2, Home,
  Compass, ShoppingCart, Heart, Star, Clock, TrendingUp,
  X, Globe, Phone, Mail, User, Building2, Hash, Percent,
  MapPinned, FileUp, FileCheck, Award, Image
} from "lucide-react";

const C = {
  bg:        "#05050A",
  sidebar:   "#090914",
  card:      "#090914",
  cardBdr:   "rgba(255,255,255,0.06)",
  accent:    "#00D2FF",
  accentHov: "#00b8e0",
  green:     "#34D399",
  cyan:      "#00D2FF",
  purple:    "#7928CA",
  text:      "#f1f5f9",
  muted:     "#6b7280",
  subtext:   "#9ca3af",
  border:    "rgba(255,255,255,0.06)",
  red:       "#ef4444",
  gradBlue:  "linear-gradient(135deg,#1e3a8a 0%,#00D2FF 100%)",
  gradPurple:"linear-gradient(135deg,#7928CA 0%,#00D2FF 100%)",
};

const LISTING_TABS = ["Asset Data", "Contact Info", "Pricing", "Address", "Documents"];
const CATEGORIES = ["Digital Assets", "Creative Assets", "Real Estate", "Financial Opportunities", "Business Marketplace"];
const ASSET_TYPES = ["Protocol", "SaaS", "Patent", "Bond", "Property", "Business"];
const SUB_CATEGORIES = ["Network / Infrastructure", "Audio / Music", "Architecture", "Yield Bond", "Commercial", "Biotech"];

function catColor(cat: string): string {
  const m: Record<string, string> = {
    "Digital Assets":"#00D2FF","Creative Assets":"#7928CA",
    "Intellectual Property":"#0891b2","Business Marketplace":"#d97706",
    "Financial Opportunities":"#f59e0b","Real Estate":"#059669",
    "Talent Booking":"#db2777","Physical Products":"#b45309",
  };
  return m[cat] || "#4b5563";
}

function fmt(n: number) { return "$" + n.toLocaleString(); }

interface DocItem { n: number; img: string; title: string; id: number; }
interface ContactInfo { owner: string; email: string; phone: string; website: string; }
interface PricingInfo { valuation: string; royalties: string; minBid: string; reservePrice: string; }
interface AddressInfo { street: string; city: string; state: string; country: string; zip: string; }
interface DocumentInfo { hash: string; deedRef: string; notes: string; }

const inputS: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px",
  padding: "9px 12px", fontSize: "13px", color: "#fff",
  outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit",
};
const selectS: React.CSSProperties = {
  ...inputS, background: "#0a0a18",
  appearance: "none" as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: "30px",
};
const labelS: React.CSSProperties = {
  fontSize: "11px", color: C.muted, display: "block", marginBottom: "5px", fontWeight: 500,
};

// ─── MODULE A: Documents Carousel (full width, hover overlays) ───────
function DocumentsCarousel({
  docs, onRemove, onSetPrimary, primaryId, selectingThumbnail, onSelectThumbnail,
}: {
  docs: DocItem[];
  onRemove: (id: number) => void;
  onSetPrimary: (id: number) => void;
  primaryId: number;
  selectingThumbnail: boolean;
  onSelectThumbnail: (id: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [hoveredDoc, setHoveredDoc] = useState<number | null>(null);

  const handleUpload = () => {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "application/pdf";
    inp.onchange = () => { setUploading(true); setTimeout(() => setUploading(false), 1500); };
    inp.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{
        background: C.card, border: `1px solid ${C.cardBdr}`,
        borderRadius: "14px", padding: "18px 20px", marginBottom: "20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FileText size={16} color={C.cyan} />
          <span style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>Company & Asset Documents</span>
          <span style={{
            padding: "2px 10px", background: "rgba(0,210,255,0.12)",
            border: "1px solid rgba(0,210,255,0.25)", borderRadius: "99px",
            fontSize: "11px", color: C.cyan, fontWeight: 600,
          }}>{docs.length} Files</span>
        </div>
        <button style={{
          display: "flex", alignItems: "center", gap: "5px",
          padding: "7px 14px", background: "rgba(255,255,255,0.04)",
          border: `1px solid ${C.border}`, borderRadius: "8px",
          color: "#d1d5db", fontSize: "12px", cursor: "pointer",
        }}>
          <Settings size={13} /> Manage Docs
        </button>
      </div>

      <div style={{ position: "relative" }}>
        <div
          ref={scrollRef}
          style={{ display: "flex", alignItems: "center", gap: "10px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none" }}
        >
          <motion.div
            whileHover={{ scale: 1.03, borderColor: C.cyan }} whileTap={{ scale: 0.97 }}
            onClick={handleUpload}
            style={{
              flexShrink: 0, width: "80px", height: "100px",
              background: "rgba(255,255,255,0.02)", border: `2px dashed ${C.border}`,
              borderRadius: "10px", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", cursor: "pointer", gap: "4px",
            }}
          >
            {uploading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Upload size={18} color={C.cyan} />
              </motion.div>
            ) : <Plus size={20} color={C.muted} />}
            <span style={{ fontSize: "10px", color: C.muted, textAlign: "center" }}>
              {uploading ? "Uploading..." : "Add PDF Upload"}
            </span>
          </motion.div>

          {docs.map((doc) => (
            <motion.div
              key={doc.id}
              whileHover={{ scale: 1.04, y: -2 }}
              onMouseEnter={() => setHoveredDoc(doc.id)}
              onMouseLeave={() => setHoveredDoc(null)}
              transition={{ duration: 0.15 }}
              onClick={selectingThumbnail ? () => onSelectThumbnail(doc.id) : undefined}
              style={{
                flexShrink: 0, width: "80px", height: "100px",
                borderRadius: "10px", overflow: "hidden",
                border: doc.id === primaryId ? `2px solid ${C.cyan}` : selectingThumbnail ? "2px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.08)",
                position: "relative", cursor: selectingThumbnail ? "pointer" : "pointer",
                outline: selectingThumbnail && doc.id === primaryId ? `2px solid ${C.cyan}` : "none",
                outlineOffset: "2px",
              }}
            >
              <img src={doc.img} alt={doc.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }} />
              <span style={{ position: "absolute", bottom: "4px", right: "4px", fontSize: "11px", fontWeight: 700, color: "#fff" }}>
                {doc.n}
              </span>

              {/* Thumbnail selection indicator */}
              {selectingThumbnail && (
                <div style={{
                  position: "absolute", top: "4px", left: "4px",
                  width: "20px", height: "20px", borderRadius: "50%",
                  background: doc.id === primaryId ? C.cyan : "rgba(0,0,0,0.5)",
                  border: doc.id === primaryId ? "none" : "2px solid rgba(255,255,255,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {doc.id === primaryId && <Check size={12} color="#000" strokeWidth={3} />}
                </div>
              )}

              {/* Hover overlay */}
              <AnimatePresence>
                {hoveredDoc === doc.id && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)",
                      backdropFilter: "blur(4px)", display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: "6px",
                    }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      onClick={(e) => { e.stopPropagation(); onSetPrimary(doc.id); }}
                      style={{
                        width: "26px", height: "26px", borderRadius: "6px", border: "none",
                        background: doc.id === primaryId ? C.cyan : "rgba(255,255,255,0.15)",
                        color: doc.id === primaryId ? "#000" : "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      }}
                      title="Set as primary thumbnail"
                    >
                      <Star size={12} fill={doc.id === primaryId ? "#000" : "none"} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      onClick={(e) => { e.stopPropagation(); onRemove(doc.id); }}
                      style={{
                        width: "26px", height: "26px", borderRadius: "6px", border: "none",
                        background: "rgba(239,68,68,0.3)", color: "#ef4444",
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      }}
                      title="Remove document"
                    >
                      <Trash2 size={12} />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {docs.length > 0 && (
            <div
              onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
              style={{
                flexShrink: 0, width: "32px", height: "32px", borderRadius: "50%",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}
            >
              <ChevronRight size={16} color={C.muted} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── MODULE B: Asset Preview & Summary ──────────────────────────────
function AssetPreview({
  assetName, description, category, assetType, valuation, userName,
  previewAsset, contactInfo, pricingInfo, addressInfo, onEditAsset, previewImage,
  selectingThumbnail,
}: {
  assetName: string; description: string; category: string; assetType: string;
  valuation: string; userName: string; previewAsset: Asset;
  contactInfo: ContactInfo; pricingInfo: PricingInfo; addressInfo: AddressInfo;
  onEditAsset: () => void; previewImage: string;
  selectingThumbnail: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      style={{ background: C.card, border: `1px solid ${C.cardBdr}`, borderRadius: "14px", padding: "20px" }}
    >
      <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 700, color: "#fff" }}>Asset Preview & Summary</h3>

      {selectingThumbnail && (
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "8px 12px", marginBottom: "12px",
          background: "rgba(0,210,255,0.08)", border: "1px solid rgba(0,210,255,0.2)",
          borderRadius: "8px",
        }}>
          <Image size={14} color={C.cyan} />
          <span style={{ fontSize: "12px", color: C.cyan, fontWeight: 600 }}>Select Thumbnail Mode</span>
          <span style={{ fontSize: "11px", color: C.muted }}>— Click a document card above to set as thumbnail</span>
        </div>
      )}

      <div style={{ display: "flex", gap: "14px", marginBottom: "14px" }}>
        <div style={{
          width: "110px", height: "110px", borderRadius: "10px", overflow: "hidden",
          flexShrink: 0, border: `1px solid ${C.cardBdr}`,
        }}>
          <img src={previewImage || previewAsset.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            display: "inline-block", fontSize: "10px", fontWeight: 700,
            padding: "3px 10px", borderRadius: "5px",
            background: catColor(category), color: "#fff",
            marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em",
          }}>{category}</span>
          <p style={{ margin: "0 0 3px", fontSize: "14px", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{assetName}</p>
          <p style={{ margin: "0 0 10px", fontSize: "11px", color: C.muted, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {description.slice(0, 80)}...
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
            {[
              { icon: <Tag size={10} color={C.muted} />, l: "Category", v: category },
              { icon: <ShieldCheck size={10} color={C.muted} />, l: "Type", v: assetType },
              { icon: <MapPin size={10} color={C.muted} />, l: "Location", v: addressInfo.city ? `${addressInfo.city}, ${addressInfo.country}` : previewAsset.country },
              { icon: <DollarSign size={10} color={C.muted} />, l: "Valuation", v: `$${valuation}` },
              { icon: <Users size={10} color={C.muted} />, l: "Owner", v: contactInfo.owner || userName },
              { icon: <Mail size={10} color={C.muted} />, l: "Contact", v: contactInfo.email || "N/A" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                {item.icon}
                <span style={{ fontSize: "10px", color: C.muted }}>{item.l}</span>
                <span style={{ fontSize: "10px", color: "#d1d5db", fontWeight: 600 }}>{item.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <motion.button
          whileHover={{ scale: 1.02, borderColor: C.cyan }} whileTap={{ scale: 0.98 }}
          style={{
            flex: 1, padding: "9px", borderRadius: "8px",
            background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
            color: "#e5e7eb", fontSize: "12px", fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
          }}
        >
          <Eye size={13} /> Preview Full Details
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02, background: selectingThumbnail ? "rgba(0,210,255,0.15)" : "rgba(0,210,255,0.1)", borderColor: C.cyan }}
          whileTap={{ scale: 0.98 }}
          onClick={onEditAsset}
          style={{
            flex: 1, padding: "9px", borderRadius: "8px",
            background: selectingThumbnail ? "rgba(0,210,255,0.12)" : "rgba(0,210,255,0.06)",
            border: selectingThumbnail ? "1px solid rgba(0,210,255,0.35)" : "1px solid rgba(0,210,255,0.2)",
            color: C.cyan, fontSize: "12px", fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
          }}
        >
          <Edit2 size={13} /> {selectingThumbnail ? "Done Selecting" : "Edit Asset"}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── MODULE C: Listing Form (all 5 tabs functional) ─────────────────
function ListingForm({
  listingTab, setListingTab,
  assetName, setAssetName, category, setCategory, assetType, setAssetType,
  subCat, setSubCat, description, setDescription,
  valuation, setValuation, royalties, setRoyalties,
  contactInfo, setContactInfo,
  pricingInfo, setPricingInfo,
  addressInfo, setAddressInfo,
  documentInfo, setDocumentInfo,
  published, onPublish,
}: {
  listingTab: string; setListingTab: (t: string) => void;
  assetName: string; setAssetName: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  assetType: string; setAssetType: (v: string) => void;
  subCat: string; setSubCat: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  valuation: string; setValuation: (v: string) => void;
  royalties: string; setRoyalties: (v: string) => void;
  contactInfo: ContactInfo; setContactInfo: React.Dispatch<React.SetStateAction<ContactInfo>>;
  pricingInfo: PricingInfo; setPricingInfo: React.Dispatch<React.SetStateAction<PricingInfo>>;
  addressInfo: AddressInfo; setAddressInfo: React.Dispatch<React.SetStateAction<AddressInfo>>;
  documentInfo: DocumentInfo; setDocumentInfo: React.Dispatch<React.SetStateAction<DocumentInfo>>;
  published: boolean; onPublish: () => void;
  selectingThumbnail: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      style={{ background: C.card, border: `1px solid ${C.cardBdr}`, borderRadius: "14px", padding: "20px" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#fff" }}>Listing Details</h3>
        <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: 500 }}>All fields required</span>
      </div>

      <div style={{
        display: "flex", gap: "0", background: "rgba(255,255,255,0.03)",
        borderRadius: "8px", padding: "3px", marginBottom: "16px",
      }}>
        {LISTING_TABS.map(tab => (
          <motion.button
            key={tab} onClick={() => setListingTab(tab)}
            whileHover={{ backgroundColor: listingTab === tab ? undefined : "rgba(255,255,255,0.06)" }}
            style={{
              flex: 1, padding: "7px 8px", borderRadius: "6px", border: "none",
              background: listingTab === tab ? C.accent : "transparent",
              color: listingTab === tab ? "#000" : C.muted,
              fontSize: "11px", fontWeight: 600, cursor: "pointer",
              whiteSpace: "nowrap", minWidth: "60px",
            }}
          >{tab}</motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Asset Data ── */}
        {listingTab === "Asset Data" && (
          <motion.div key="asset-data" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelS}>Asset Name</label>
                <input value={assetName} onChange={e => setAssetName(e.target.value)} style={inputS} />
              </div>
              <div>
                <label style={labelS}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={selectS}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelS}>Asset Type</label>
                <select value={assetType} onChange={e => setAssetType(e.target.value)} style={selectS}>
                  {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelS}>Sub Category</label>
                <select value={subCat} onChange={e => setSubCat(e.target.value)} style={selectS}>
                  {SUB_CATEGORIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={labelS}>Description <span style={{ color: C.muted }}>({description.length}/500)</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value.slice(0, 500))}
                rows={3} style={{ ...inputS, resize: "none" }} />
            </div>
            <motion.button
              onClick={onPublish} whileHover={{ scale: 1.01, boxShadow: "0 0 24px rgba(121,40,202,0.3)" }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: "100%", padding: "13px", borderRadius: "10px", border: "none",
                background: published ? C.green : C.gradPurple,
                color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: published ? "none" : "0 4px 20px rgba(121,40,202,0.25)",
              }}
            >
              {published ? <><CheckCircle size={16} /> Published!</> : <><Zap size={16} /> Publish Listing</>}
            </motion.button>
          </motion.div>
        )}

        {/* ── Contact Info ── */}
        {listingTab === "Contact Info" && (
          <motion.div key="contact-info" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelS}><User size={10} style={{ display: "inline", marginRight: 4 }} /> Owner / Company</label>
                <input value={contactInfo.owner} onChange={e => setContactInfo(p => ({...p, owner: e.target.value}))}
                  style={inputS} placeholder="e.g. Epic Innovations Ltd" />
              </div>
              <div>
                <label style={labelS}><Mail size={10} style={{ display: "inline", marginRight: 4 }} /> Email Address</label>
                <input value={contactInfo.email} onChange={e => setContactInfo(p => ({...p, email: e.target.value}))}
                  style={inputS} placeholder="owner@company.com" />
              </div>
              <div>
                <label style={labelS}><Phone size={10} style={{ display: "inline", marginRight: 4 }} /> Phone Number</label>
                <input value={contactInfo.phone} onChange={e => setContactInfo(p => ({...p, phone: e.target.value}))}
                  style={inputS} placeholder="+1 (555) 000-0000" />
              </div>
              <div>
                <label style={labelS}><Globe size={10} style={{ display: "inline", marginRight: 4 }} /> Website</label>
                <input value={contactInfo.website} onChange={e => setContactInfo(p => ({...p, website: e.target.value}))}
                  style={inputS} placeholder="https://company.com" />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Pricing ── */}
        {listingTab === "Pricing" && (
          <motion.div key="pricing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelS}><DollarSign size={10} style={{ display: "inline", marginRight: 4 }} /> Valuation (CRD)</label>
                <input value={valuation} onChange={e => setValuation(e.target.value)} style={inputS} placeholder="185,000" />
              </div>
              <div>
                <label style={labelS}><Percent size={10} style={{ display: "inline", marginRight: 4 }} /> Royalties (%)</label>
                <input value={royalties} onChange={e => setRoyalties(e.target.value)} style={inputS} placeholder="5.0" />
              </div>
              <div>
                <label style={labelS}><Tag size={10} style={{ display: "inline", marginRight: 4 }} /> Minimum Bid</label>
                <input value={pricingInfo.minBid} onChange={e => setPricingInfo(p => ({...p, minBid: e.target.value}))}
                  style={inputS} placeholder="10,000" />
              </div>
              <div>
                <label style={labelS}><Lock size={10} style={{ display: "inline", marginRight: 4 }} /> Reserve Price</label>
                <input value={pricingInfo.reservePrice} onChange={e => setPricingInfo(p => ({...p, reservePrice: e.target.value}))}
                  style={inputS} placeholder="150,000" />
              </div>
            </div>
            <div style={{
              padding: "12px 16px", background: "rgba(0,210,255,0.06)", border: "1px solid rgba(0,210,255,0.15)",
              borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px",
            }}>
              <BarChart2 size={16} color={C.cyan} />
              <div>
                <p style={{ margin: 0, fontSize: "12px", color: C.cyan, fontWeight: 600 }}>Market Insight</p>
                <p style={{ margin: 0, fontSize: "11px", color: C.muted }}>Similar {assetType} assets average $145,000 — $210,000 CRD</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Address ── */}
        {listingTab === "Address" && (
          <motion.div key="address" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div>
              <label style={labelS}><Building2 size={10} style={{ display: "inline", marginRight: 4 }} /> Street Address</label>
              <input value={addressInfo.street} onChange={e => setAddressInfo(p => ({...p, street: e.target.value}))}
                style={inputS} placeholder="123 Innovation Drive" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelS}><MapPinned size={10} style={{ display: "inline", marginRight: 4 }} /> City</label>
                <input value={addressInfo.city} onChange={e => setAddressInfo(p => ({...p, city: e.target.value}))}
                  style={inputS} placeholder="San Francisco" />
              </div>
              <div>
                <label style={labelS}><Home size={10} style={{ display: "inline", marginRight: 4 }} /> State / Region</label>
                <input value={addressInfo.state} onChange={e => setAddressInfo(p => ({...p, state: e.target.value}))}
                  style={inputS} placeholder="California" />
              </div>
              <div>
                <label style={labelS}><Globe size={10} style={{ display: "inline", marginRight: 4 }} /> Country</label>
                <input value={addressInfo.country} onChange={e => setAddressInfo(p => ({...p, country: e.target.value}))}
                  style={inputS} placeholder="United States" />
              </div>
              <div>
                <label style={labelS}><Hash size={10} style={{ display: "inline", marginRight: 4 }} /> Zip / Postal Code</label>
                <input value={addressInfo.zip} onChange={e => setAddressInfo(p => ({...p, zip: e.target.value}))}
                  style={inputS} placeholder="94102" />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Documents ── */}
        {listingTab === "Documents" && (
          <motion.div key="documents" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div>
              <label style={labelS}><FileUp size={10} style={{ display: "inline", marginRight: 4 }} /> Document Hash (IPFS)</label>
              <input value={documentInfo.hash} onChange={e => setDocumentInfo(p => ({...p, hash: e.target.value}))}
                style={inputS} placeholder="QmXoypiz..." />
            </div>
            <div>
              <label style={labelS}><FileCheck size={10} style={{ display: "inline", marginRight: 4 }} /> Deed / Title Reference</label>
              <input value={documentInfo.deedRef} onChange={e => setDocumentInfo(p => ({...p, deedRef: e.target.value}))}
                style={inputS} placeholder="DEED-2026-0042" />
            </div>
            <div>
              <label style={labelS}>Additional Notes</label>
              <textarea value={documentInfo.notes} onChange={e => setDocumentInfo(p => ({...p, notes: e.target.value}))}
                rows={3} style={{ ...inputS, resize: "none" }} placeholder="Any additional document context..." />
            </div>
            <div style={{
              padding: "12px 16px", background: "rgba(121,40,202,0.06)", border: "1px solid rgba(121,40,202,0.15)",
              borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px",
            }}>
              <Award size={16} color={C.purple} />
              <div>
                <p style={{ margin: 0, fontSize: "12px", color: C.purple, fontWeight: 600 }}>Verification Status</p>
                <p style={{ margin: 0, fontSize: "11px", color: C.muted }}>Documents are verified on-chain for transparency and audit trails.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── MODULE D: My Assets Carousel ───────────────────────────────────
function MyAssetsCarousel({
  assets, onSelectAsset, selectedAssetId,
}: {
  assets: Asset[];
  onSelectAsset: (asset: Asset) => void;
  selectedAssetId: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      style={{ background: C.card, border: `1px solid ${C.cardBdr}`, borderRadius: "14px", padding: "18px 20px" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#fff" }}>My Assets (You can list)</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            display: "flex", alignItems: "center",
            background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
            borderRadius: "8px", padding: "0 10px",
          }}>
            <Search size={14} color={C.muted} />
            <input placeholder="Search assets..."
              style={{ background: "none", border: "none", outline: "none", padding: "7px 8px", fontSize: "12px", color: "#fff", fontFamily: "inherit", width: "120px" }} />
          </div>
          <button style={{
            padding: "7px 14px", background: "rgba(255,255,255,0.04)",
            border: `1px solid ${C.border}`, borderRadius: "8px",
            color: "#d1d5db", fontSize: "12px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "5px",
          }}>
            <Layers size={13} /> All Types
          </button>
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <div ref={scrollRef}
          style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none" }}
        >
          {assets.map((asset, i) => {
            const isListed = i < 4;
            const isSelected = asset.id === selectedAssetId;
            return (
              <motion.div
                key={asset.id} whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
                transition={{ duration: 0.15 }} onClick={() => onSelectAsset(asset)}
                style={{
                  flexShrink: 0, width: "180px",
                  background: isSelected ? "rgba(0,210,255,0.06)" : "rgba(255,255,255,0.02)",
                  border: isSelected ? "1px solid rgba(0,210,255,0.3)" : `1px solid ${C.border}`,
                  borderRadius: "12px", overflow: "hidden", cursor: "pointer",
                }}
              >
                <div style={{ position: "relative", height: "90px" }}>
                  <img src={asset.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)" }} />
                  <span style={{
                    position: "absolute", top: "6px", left: "6px",
                    background: catColor(asset.category), color: "#fff",
                    fontSize: "9px", fontWeight: 700, padding: "2px 6px",
                    borderRadius: "4px", textTransform: "uppercase",
                  }}>{asset.category.split(" ")[0]}</span>
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <p style={{ margin: "0 0 1px", fontSize: "12px", fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {asset.name}
                  </p>
                  <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 800, color: "#fff" }}>{fmt(asset.currentValuation)}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "10px", color: isListed ? C.green : "#f59e0b", fontWeight: 600, display: "flex", alignItems: "center", gap: "3px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isListed ? C.green : "#f59e0b" }} />
                      {isListed ? "Listed" : "Draft"}
                    </span>
                    <button onClick={e => e.stopPropagation()} style={{
                      padding: "4px 10px", background: C.accent, border: "none",
                      borderRadius: "5px", color: "#000", fontSize: "10px",
                      fontWeight: 700, cursor: "pointer",
                    }}>List for Sale</button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div
          onClick={() => scrollRef.current?.scrollBy({ left: 220, behavior: "smooth" })}
          style={{
            position: "absolute", top: "50%", right: "-4px", transform: "translateY(-50%)",
            width: "32px", height: "32px", borderRadius: "50%",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", zIndex: 10,
          }}
        ><ChevronRight size={16} color={C.muted} /></div>
      </div>
    </motion.div>
  );
}

// ─── MAIN DASHBOARD ─────────────────────────────────────────────────
export default function SellAssetDashboard({
  userName = "epiclegend766",
  userAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop&q=80",
  navigate,
}: {
  userName?: string; userAvatar?: string;
  navigate?: (page: string, params?: any) => void;
}) {
  const [listingTab, setListingTab] = useState("Asset Data");
  const [assetName, setAssetName] = useState("Astro-DNS Quantum Gateway");
  const [category, setCategory] = useState("Digital Assets");
  const [assetType, setAssetType] = useState("Protocol");
  const [subCat, setSubCat] = useState("Network / Infrastructure");
  const [description, setDescription] = useState("Next-gen secure orbital routing protocol supporting multi-layered encrypted data streams across 4 continents.");
  const [valuation, setValuation] = useState("185,000");
  const [royalties, setRoyalties] = useState("5.0");
  const [published, setPublished] = useState(false);

  const [contactInfo, setContactInfo] = useState<ContactInfo>({ owner: "Epic Innovations Ltd", email: "ops@epicinnovations.com", phone: "+1 (415) 555-0192", website: "https://epicinnovations.com" });
  const [pricingInfo, setPricingInfo] = useState<PricingInfo>({ valuation: "185,000", royalties: "5.0", minBid: "25,000", reservePrice: "160,000" });
  const [addressInfo, setAddressInfo] = useState<AddressInfo>({ street: "420 Mission St, Floor 27", city: "San Francisco", state: "California", country: "United States", zip: "94105" });
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo>({ hash: "QmXoypizjG3rjC98M99YmRG25tiK7p1", deedRef: "DEED-2026-0042", notes: "Includes patent filings for quantum routing algorithm v3.2" });

  const previewAsset = ASSET_LISTINGS[1];
  const [previewImage, setPreviewImage] = useState(previewAsset.image);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(previewAsset.id);

  const [docs, setDocs] = useState<DocItem[]>([
    { id: 1, n: 1, img: ASSET_LISTINGS[0].image, title: "Company Profile" },
    { id: 2, n: 2, img: ASSET_LISTINGS[1].image, title: "Investor Relations" },
    { id: 3, n: 3, img: ASSET_LISTINGS[2].image, title: "Financial Overview" },
    { id: 4, n: 4, img: ASSET_LISTINGS[3].image, title: "Business Overview" },
    { id: 5, n: 5, img: ASSET_LISTINGS[4].image, title: "Legal Documents" },
    { id: 6, n: 6, img: ASSET_LISTINGS[5].image, title: "Marketing Strategies" },
    { id: 7, n: 7, img: ASSET_LISTINGS[6].image, title: "Valuation Report" },
  ]);
  const [primaryDocId, setPrimaryDocId] = useState<number>(1);
  const [selectingThumbnail, setSelectingThumbnail] = useState(false);

  const handlePublish = useCallback(() => {
    setPublished(true);
    setTimeout(() => {
      setPublished(false);
      if (navigate) navigate('marketplace');
    }, 1500);
  }, [navigate]);

  const handleSelectAsset = useCallback((asset: Asset) => {
    setSelectedAssetId(asset.id);
    setAssetName(asset.name);
    setCategory(asset.category);
    setAssetType("Protocol");
    setValuation(asset.currentValuation.toLocaleString());
    setDescription(asset.description || asset.snippet);
    setPreviewImage(asset.image);
  }, []);

  const handleRemoveDoc = useCallback((id: number) => {
    setDocs(prev => {
      const next = prev.filter(d => d.id !== id).map((d, i) => ({ ...d, n: i + 1 }));
      if (primaryDocId === id && next.length > 0) setPrimaryDocId(next[0].id);
      return next;
    });
  }, [primaryDocId]);

  const handleSetPrimary = useCallback((id: number) => {
    setPrimaryDocId(id);
    const doc = docs.find(d => d.id === id);
    if (doc) setPreviewImage(doc.img);
  }, [docs]);

  const handleSelectThumbnail = useCallback((id: number) => {
    setPrimaryDocId(id);
    const doc = docs.find(d => d.id === id);
    if (doc) setPreviewImage(doc.img);
  }, [docs]);

  const handleEditAsset = useCallback(() => {
    setSelectingThumbnail(prev => !prev);
  }, []);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
      <div style={{
        padding: "22px 28px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "#fff" }}>Sell Asset</h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: C.muted }}>
            List your digital assets for the marketplace. Fast, secure and decentralized.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "6px 10px", background: "rgba(255,255,255,0.04)",
            borderRadius: "10px", border: `1px solid ${C.border}`, cursor: "pointer",
          }}>
            <img src={userAvatar} alt="" style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover" }} />
            <span style={{ fontSize: "13px", color: "#e5e7eb", fontWeight: 600 }}>{userName}</span>
            <ChevronDown size={14} color={C.muted} />
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 28px" }}>
        <DocumentsCarousel docs={docs} onRemove={handleRemoveDoc} onSetPrimary={handleSetPrimary} primaryId={primaryDocId} selectingThumbnail={selectingThumbnail} onSelectThumbnail={handleSelectThumbnail} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "20px", marginBottom: "24px" }}>
          <AssetPreview
            assetName={assetName} description={description} category={category}
            assetType={assetType} valuation={valuation} userName={userName}
            previewAsset={previewAsset} contactInfo={contactInfo} pricingInfo={pricingInfo}
            addressInfo={addressInfo} onEditAsset={handleEditAsset} previewImage={previewImage}
            selectingThumbnail={selectingThumbnail}
          />
          <ListingForm
            listingTab={listingTab} setListingTab={setListingTab}
            assetName={assetName} setAssetName={setAssetName}
            category={category} setCategory={setCategory}
            assetType={assetType} setAssetType={setAssetType}
            subCat={subCat} setSubCat={setSubCat}
            description={description} setDescription={setDescription}
            valuation={valuation} setValuation={setValuation}
            royalties={royalties} setRoyalties={setRoyalties}
            contactInfo={contactInfo} setContactInfo={setContactInfo}
            pricingInfo={pricingInfo} setPricingInfo={setPricingInfo}
            addressInfo={addressInfo} setAddressInfo={setAddressInfo}
            documentInfo={documentInfo} setDocumentInfo={setDocumentInfo}
            published={published} onPublish={handlePublish}
            selectingThumbnail={selectingThumbnail}
          />
        </div>

        <MyAssetsCarousel assets={ASSET_LISTINGS} onSelectAsset={handleSelectAsset} selectedAssetId={selectedAssetId} />
      </div>
    </div>
  );
}
