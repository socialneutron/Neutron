import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Users, ShoppingBag, MessageSquare, Plus, Building2, Briefcase, Send, Tag, BookOpen, Bookmark } from "lucide-react"
import SupplierCard from "../components/business/SupplierCard"
import CategoryFlow from "../components/business/CategoryFlow"
import RegisterCompanyModal from "../components/business/RegisterCompanyModal"
import FindTalent from "../components/business/FindTalent"
import ProductsTab from "../components/business/ProductsTab"
import EbookStore from "../components/business/EbookStore"
import { useChatStore } from "../stores/chatStore"
import type { Company } from "../types/database"

// ─── Colour tokens ──────────────────────────────────────────────────
const C = {
  bg: "#0b0f1a",
  card: "#111827",
  accent: "#2563eb",
  accentHov: "#1d4ed8",
  green: "#22c55e",
  purple: "#7c3aed",
  cyan: "#06b6d4",
  text: "#f1f5f9",
  muted: "#6b7280",
  border: "rgba(255,255,255,0.07)",
}

type Tab = "suppliers" | "talent" | "products" | "ebooks"

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "suppliers", label: "Suppliers", icon: <ShoppingBag size={16} /> },
  { id: "talent", label: "Find Talent", icon: <Users size={16} /> },
  { id: "products", label: "Products", icon: <Tag size={16} /> },
  { id: "ebooks", label: "Magazines", icon: <BookOpen size={16} /> },
]

interface MarketplaceAppProps {
  navigate?: (page: string, params?: any) => void
  user?: any
}

export default function MarketplaceApp({ navigate, user }: MarketplaceAppProps) {
  const [activeTab, setActiveTab] = useState<Tab>("suppliers")
  const [companies, setCompanies] = useState<Company[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showRegister, setShowRegister] = useState(false)
  const { getOrCreateConversation } = useChatStore()

  // Load companies from mock DB
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const { supabase } = await import("../lib/supabase")
        const { data } = await supabase.from("companies").select("*")
        if (data) setCompanies(data as Company[])
      } catch {
        setCompanies([])
      }
    }
    loadCompanies()
  }, [])

  // Filter companies
  const filtered = companies.filter(c => {
    const matchesSearch = !searchQuery.trim() ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.commodities.some(cm => cm.item.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = !activeCategory || c.category === activeCategory
    return matchesSearch && matchesCategory
  })

  // Get categories with counts
  const categories = Object.entries(
    companies.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([cat, count]) => ({
    id: cat,
    label: cat,
    count,
    color: cat === "Raw Materials" ? "#2563eb" : cat === "Logistics & Storage" ? "#7c3aed" : cat === "Buildings & Construction" ? "#ea580c" : cat === "Agriculture" ? "#16a34a" : cat === "Energy & Utilities" ? "#eab308" : cat === "Real Estate" ? "#ec4899" : "#059669",
  }))

  // Handle messaging a company
  const handleMessageCompany = (company: Company) => {
    getOrCreateConversation({
      id: company.id,
      username: company.handle.replace("@", ""),
      displayName: company.name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=2563eb&color=fff&size=80`,
      online: true,
      isVerified: true,
    })
    if (navigate) {
      navigate("chat", { chat: { username: company.handle.replace("@", ""), id: company.id, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=2563eb&color=fff&size=150`, displayName: company.name } })
    }
  }

  // Handle new company registration
  const handleRegisterCompany = (data: any) => {
    const newCompany: Company = {
      id: `comp-${Date.now()}`,
      ...data,
      registered_by: user?.id || "demo-user-id",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setCompanies(prev => [newCompany, ...prev])

    // Save to mock DB
    try {
      const { supabase } = require("../lib/supabase")
      supabase.from("companies").insert(newCompany)
    } catch {}
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px 11px 38px", borderRadius: 10,
    border: `1px solid ${C.border}`, background: "#0d1220",
    color: "#fff", fontSize: 13, fontFamily: "inherit", outline: "none",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg }}>
      {/* Tab Bar */}
      <div style={{
        display: "flex", gap: 2, padding: "12px 24px 0",
        borderBottom: `1px solid ${C.border}`,
      }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 18px", borderRadius: "10px 10px 0 0", border: "none",
              background: activeTab === item.id ? C.card : "transparent",
              color: activeTab === item.id ? C.accent : C.muted,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              borderBottom: activeTab === item.id ? `2px solid ${C.accent}` : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            {item.icon} {item.label}
          </button>
        ))}
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => navigate?.('myListings')} style={{ background: 'rgba(37,99,235,0.12)', border: `1px solid rgba(37,99,235,0.3)`, borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, color: '#60a5fa', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto', marginBottom: 2 }}>
          <Bookmark size={14} /> My Listings
        </motion.button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "suppliers" && (
          <motion.div
            key="suppliers"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{ flex: 1, overflowY: "auto", padding: "24px 28px 100px" }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>B2B Supplier Directory</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>
                  Source materials, storage, and logistics from verified companies
                </p>
              </div>
              <button
                onClick={() => setShowRegister(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "9px 16px",
                  borderRadius: 10, border: `1px solid ${C.accent}`, background: "rgba(37,99,235,0.12)",
                  color: C.accent, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  transition: "all 0.15s", whiteSpace: "nowrap",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(37,99,235,0.25)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(37,99,235,0.12)"}
              >
                <Plus size={14} /> Register Company
              </button>
            </div>

            {/* Category Flow */}
            <CategoryFlow
              categories={categories}
              activeCategory={activeCategory}
              onSelect={setActiveCategory}
            />

            {/* Search */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <Search size={16} color={C.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  placeholder="Search materials, categories, or companies..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") setSearchQuery(searchInput) }}
                  style={inputStyle}
                />
              </div>
              <button
                onClick={() => setSearchQuery(searchInput)}
                style={{
                  padding: "11px 20px", borderRadius: 10, border: "none",
                  background: C.accent, color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  transition: "background 0.15s", whiteSpace: "nowrap",
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.accentHov}
                onMouseLeave={e => e.currentTarget.style.background = C.accent}
              >
                <Search size={14} /> Search
              </button>
            </div>

            {/* Results Header */}
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff" }}>
                {searchQuery.trim() ? `Results for "${searchQuery}"` : activeCategory ? `${activeCategory} Companies` : "All Verified Suppliers"}
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: C.muted }}>
                {filtered.length} companies found
              </p>
            </div>

            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {filtered.map(company => (
                <SupplierCard
                  key={company.id}
                  company={company}
                  onMessage={handleMessageCompany}
                  navigate={navigate}
                  userId={user?.id}
                />
              ))}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 24px", color: C.muted }}>
                <Building2 size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>No suppliers found</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search or category filter</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "talent" && (
          <motion.div
            key="talent"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{ flex: 1, display: "flex", flexDirection: "column" }}
          >
            <FindTalent navigate={navigate || (() => { })} userId={user?.id} />
          </motion.div>
        )}

        {activeTab === "products" && (
          <motion.div
            key="products"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{ flex: 1, display: "flex", flexDirection: "column" }}
          >
            <ProductsTab navigate={navigate || (() => { })} userId={user?.id} />
          </motion.div>
        )}

        {activeTab === "ebooks" && (
          <motion.div
            key="ebooks"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{ flex: 1, display: "flex", flexDirection: "column" }}
          >
            <EbookStore navigate={navigate || (() => {})} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Register Modal */}
      {showRegister && (
        <RegisterCompanyModal
          onClose={() => setShowRegister(false)}
          onSubmit={handleRegisterCompany}
        />
      )}
    </div>
  )
}
