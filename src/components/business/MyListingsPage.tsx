import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Bookmark, Building2, Users, Tag, BookOpen, Edit3, Trash2, Star, Eye, MapPin, Package, DollarSign } from 'lucide-react'
import SupplierCard from './SupplierCard'
import ProductCard from './ProductCard'
import EditListingModal from './EditListingModal'
import ConfirmDialog from './ConfirmDialog'
import { useSavedListingsStore } from '../../stores/savedListingsStore'
import type { Company, Product, Ebook } from '../../types/database'
import type { TalentUser } from './FindTalent'

const C = {
  bg: '#05050A',
  card: '#111827',
  accent: '#2563eb',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  text: '#f1f5f9',
  muted: '#6b7280',
  border: 'rgba(255,255,255,0.07)',
}

const CATEGORY_COLORS: Record<string, string> = {
  'Raw Materials': '#2563eb', 'Logistics & Storage': '#7c3aed', 'Manufacturing': '#059669',
  'Services': '#d97706', 'Technology': '#06b6d4', Electronics: '#2563eb',
  Furniture: '#7c3aed', Tools: '#ea580c', Clothing: '#ec4899',
  'Self-Help': '#22c55e', Business: '#2563eb', Productivity: '#7c3aed',
  Finance: '#f59e0b', Fiction: '#ec4899', News: '#ef4444', Lifestyle: '#f97316',
  Science: '#10b981', Entertainment: '#e879f9', 'Scientific Papers': '#6366f1',
}

type Section = 'published' | 'saved'
type CategoryTab = 'suppliers' | 'talent' | 'products' | 'magazines'

const CATEGORY_TABS: { id: CategoryTab; label: string; icon: React.ReactNode }[] = [
  { id: 'suppliers', label: 'Suppliers', icon: <Building2 size={14} /> },
  { id: 'talent', label: 'Talent', icon: <Users size={14} /> },
  { id: 'products', label: 'Products', icon: <Tag size={14} /> },
  { id: 'magazines', label: 'Magazines', icon: <BookOpen size={14} /> },
]

interface Props {
  navigate: (page: string, params?: any) => void
  user: any
  profileMode?: boolean
  profileUserId?: string
}

export default function MyListingsPage({ navigate, user, profileMode, profileUserId }: Props) {
  const [section, setSection] = useState<Section>('published')
  const [activeTab, setActiveTab] = useState<CategoryTab>('suppliers')
  const { saved, getSavedByType } = useSavedListingsStore()

  const [publishedCompanies, setPublishedCompanies] = useState<Company[]>([])
  const [publishedProducts, setPublishedProducts] = useState<Product[]>([])
  const [publishedEbooks, setPublishedEbooks] = useState<Ebook[]>([])
  const [publishedTalent, setPublishedTalent] = useState<TalentUser[]>([])

  const [savedCompanies, setSavedCompanies] = useState<Company[]>([])
  const [savedProducts, setSavedProducts] = useState<Product[]>([])
  const [savedEbooks, setSavedEbooks] = useState<Ebook[]>([])
  const [savedTalent, setSavedTalent] = useState<TalentUser[]>([])

  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState<{ open: boolean; type: 'company' | 'product' | 'ebook'; data: any }>({ open: false, type: 'company', data: null })
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const viewUserId = profileUserId || user?.id
  const isOwn = !profileMode || (user?.id === viewUserId)

  useEffect(() => {
    if (!viewUserId) return
    setLoading(true)

    const loadAll = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')

        const [compRes, prodRes, ebookRes, userRes] = await Promise.all([
          supabase.from('companies').select('*').eq('registered_by', viewUserId),
          supabase.from('products').select('*').eq('seller_id', viewUserId),
          supabase.from('ebooks').select('*').eq('published_by', viewUserId),
          supabase.from('users').select('*').eq('id', viewUserId).single(),
        ])

        setPublishedCompanies((compRes.data || []) as Company[])
        setPublishedProducts((prodRes.data || []) as Product[])
        setPublishedEbooks((ebookRes.data || []) as Ebook[])
        if (userRes.data) {
          setPublishedTalent([{
            ...userRes.data,
            id: userRes.data.id,
            username: userRes.data.username || '',
            display_name: userRes.data.display_name || '',
            avatar_url: userRes.data.avatar_url || '',
            bio: userRes.data.bio || '',
            location: userRes.data.location || '',
            interests: userRes.data.interests || [],
            posts_count: userRes.data.posts_count || 0,
            followers_count: userRes.data.followers_count || 0,
            following_count: userRes.data.following_count || 0,
            created_at: userRes.data.created_at || '',
          }] as TalentUser[])
        }

        if (isOwn) {
          const savedCompanyIds = getSavedByType(viewUserId, 'company').map(s => s.listing_id)
          const savedProductIds = getSavedByType(viewUserId, 'product').map(s => s.listing_id)
          const savedEbookIds = getSavedByType(viewUserId, 'ebook').map(s => s.listing_id)
          const savedTalentIds = getSavedByType(viewUserId, 'talent').map(s => s.listing_id)

          const [savedCompRes, savedProdRes, savedEbookRes] = await Promise.all([
            savedCompanyIds.length ? supabase.from('companies').select('*').in('id', savedCompanyIds) : Promise.resolve({ data: [] }),
            savedProductIds.length ? supabase.from('products').select('*').in('id', savedProductIds) : Promise.resolve({ data: [] }),
            savedEbookIds.length ? supabase.from('ebooks').select('*').in('id', savedEbookIds) : Promise.resolve({ data: [] }),
          ])

          setSavedCompanies((savedCompRes.data || []) as Company[])
          setSavedProducts((savedProdRes.data || []) as Product[])
          setSavedEbooks((savedEbookRes.data || []) as Ebook[])

          if (savedTalentIds.length) {
            const savedUsersRes = await supabase.from('users').select('*').in('id', savedTalentIds)
            setSavedTalent((savedUsersRes.data || []).map(u => ({
              ...u, id: u.id, username: u.username || '', display_name: u.display_name || '',
              avatar_url: u.avatar_url || '', bio: u.bio || '', location: u.location || '',
              interests: u.interests || [], posts_count: u.posts_count || 0,
              followers_count: u.followers_count || 0, following_count: u.following_count || 0,
              created_at: u.created_at || '',
            })) as TalentUser[])
          } else {
            setSavedTalent([])
          }
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }

    loadAll()
  }, [viewUserId, section, saved])

  const getCount = (tab: CategoryTab) => {
    if (section === 'published') {
      switch (tab) {
        case 'suppliers': return publishedCompanies.length
        case 'talent': return publishedTalent.length
        case 'products': return publishedProducts.length
        case 'magazines': return publishedEbooks.length
      }
    } else {
      switch (tab) {
        case 'suppliers': return savedCompanies.length
        case 'talent': return savedTalent.length
        case 'products': return savedProducts.length
        case 'magazines': return savedEbooks.length
      }
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      const table = deleteTarget.type === 'company' ? 'companies' : deleteTarget.type === 'product' ? 'products' : 'ebooks'
      await supabase.from(table).delete().eq('id', deleteTarget.id)
      if (deleteTarget.type === 'company') setPublishedCompanies(prev => prev.filter(c => c.id !== deleteTarget.id))
      else if (deleteTarget.type === 'product') setPublishedProducts(prev => prev.filter(p => p.id !== deleteTarget.id))
      else setPublishedEbooks(prev => prev.filter(e => e.id !== deleteTarget.id))
    } catch {} finally {
      setDeleteLoading(false)
      setDeleteTarget(null)
    }
  }

  const renderEmpty = (tab: CategoryTab, isPublished: boolean) => {
    const icons: Record<CategoryTab, React.ReactNode> = {
      suppliers: <Building2 size={40} />, talent: <Users size={40} />,
      products: <Tag size={40} />, magazines: <BookOpen size={40} />,
    }
    const labels: Record<CategoryTab, string> = {
      suppliers: 'suppliers', talent: 'talent profiles',
      products: 'products', magazines: 'magazines',
    }
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: C.muted }}>
        <div style={{ opacity: 0.15, marginBottom: 12 }}>{icons[tab]}</div>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>
          {isPublished ? 'Nothing published yet' : `No saved ${labels[tab]} yet`}
        </p>
        <p style={{ fontSize: 12, margin: 0 }}>
          {isPublished ? `Your published ${labels[tab]} will show up here` : 'Browse and save items to see them here'}
        </p>
      </div>
    )
  }

  const ownerBtnStyle = (color: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
    borderRadius: 8, border: `1px solid ${color}30`, background: `${color}12`,
    color, fontSize: 11, fontWeight: 600, cursor: 'pointer',
  })

  const renderPublishedCompanyCard = (c: Company) => (
    <motion.div key={c.id} whileHover={{ y: -2 }} style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
      overflow: 'hidden', cursor: 'pointer',
    }} onClick={() => navigate('supplierDetail', { company: c })}>
      {(c.images || [])[0] && (
        <div style={{ height: 120, background: `url(${(c.images || [])[0]}) center/cover` }} />
      )}
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: CATEGORY_COLORS[c.category] || C.muted,
            background: `${CATEGORY_COLORS[c.category] || C.muted}15`, padding: '3px 8px', borderRadius: 6,
          }}>{c.category || 'General'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: C.amber }}>
            <Star size={10} fill={C.amber} /> {(c.rating || 0).toFixed(1)}
          </span>
        </div>
        <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: C.text }}>{c.name}</h4>
        <p style={{ margin: '0 0 4px', fontSize: 11, color: C.muted, display: 'flex', alignItems: 'center', gap: 3 }}>
          <MapPin size={10} /> {c.location || 'N/A'}
        </p>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#9ca3af', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {c.description || 'No description added'}
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={(e) => { e.stopPropagation(); setEditModal({ open: true, type: 'company', data: c }) }} style={ownerBtnStyle(C.accent)}>
            <Edit3 size={12} /> Edit
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'company', id: c.id }) }} style={ownerBtnStyle(C.red)}>
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    </motion.div>
  )

  const renderPublishedProductCard = (p: Product) => (
    <motion.div key={p.id} whileHover={{ y: -2 }} style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
      overflow: 'hidden', cursor: 'pointer',
    }} onClick={() => navigate('productDetail', { product: p })}>
      {(p.images || [])[0] && (
        <div style={{ height: 120, background: `url(${(p.images || [])[0]}) center/cover` }} />
      )}
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: CATEGORY_COLORS[p.category] || C.muted,
            background: `${CATEGORY_COLORS[p.category] || C.muted}15`, padding: '3px 8px', borderRadius: 6,
          }}>{p.category}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#22c55e',
            background: 'rgba(34,197,94,0.12)', padding: '3px 8px', borderRadius: 6, textTransform: 'capitalize',
          }}>{p.condition}</span>
        </div>
        <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: C.text }}>{p.name}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 6px', fontSize: 12 }}>
          <span style={{ fontWeight: 800, color: C.green }}>${(p.price || 0).toLocaleString()}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: C.muted }}><Package size={10} /> {p.stock || 0} in stock</span>
        </div>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: '#9ca3af', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {p.description || 'No description added'}
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={(e) => { e.stopPropagation(); setEditModal({ open: true, type: 'product', data: p }) }} style={ownerBtnStyle(C.accent)}>
            <Edit3 size={12} /> Edit
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'product', id: p.id }) }} style={ownerBtnStyle(C.red)}>
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    </motion.div>
  )

  const renderPublishedTalentCard = (t: TalentUser) => (
    <motion.div key={t.id} whileHover={{ y: -2 }} style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: 18, cursor: 'pointer',
    }} onClick={() => navigate('talentDetail', { talentUser: t })}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: t.avatar_url ? `url(${t.avatar_url}) center/cover` : 'linear-gradient(135deg, #7c3aed, #06b6d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 700, color: '#fff',
        }}>
          {!t.avatar_url && (t.display_name?.[0]?.toUpperCase() || '?')}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t.display_name}</div>
          <div style={{ fontSize: 12, color: C.muted }}>@{t.username}</div>
          {t.talent_title && <div style={{ fontSize: 11, color: C.accent, fontWeight: 600 }}>{t.talent_title}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: C.muted, marginBottom: 10 }}>
        <span><strong style={{ color: C.text }}>{t.posts_count || 0}</strong> posts</span>
        <span><strong style={{ color: C.text }}>{t.followers_count || 0}</strong> followers</span>
        {t.location && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><MapPin size={10} /> {t.location}</span>}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={(e) => { e.stopPropagation(); navigate('profile', { author: { id: t.id, name: t.display_name, handle: `@${t.username}`, avatar: t.avatar_url } }) }} style={ownerBtnStyle(C.accent)}>
          <Eye size={12} /> View Profile
        </button>
      </div>
    </motion.div>
  )

  const renderPublishedMagazineCard = (e: Ebook) => (
    <motion.div key={e.id} whileHover={{ y: -2 }} style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
      overflow: 'hidden', cursor: 'pointer',
    }} onClick={() => navigate('magazineDetail', { ebook: e })}>
      {e.cover_url && (
        <div style={{ height: 160, background: `url(${e.cover_url}) center/cover` }} />
      )}
      <div style={{ padding: 14 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: CATEGORY_COLORS[e.category] || C.muted,
          background: `${CATEGORY_COLORS[e.category] || C.muted}15`, padding: '3px 8px', borderRadius: 6,
        }}>{e.category}</span>
        <h4 style={{ margin: '6px 0 2px', fontSize: 14, fontWeight: 700, color: C.text }}>{e.title}</h4>
        <p style={{ margin: '0 0 6px', fontSize: 12, color: C.muted }}>by {e.author}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: C.muted, marginBottom: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Star size={10} fill={C.amber} color={C.amber} /> {(e.rating || 0).toFixed(1)}</span>
          <span>{e.pages || 0} pages</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={(e) => { e.stopPropagation(); setEditModal({ open: true, type: 'ebook', data: e }) }} style={ownerBtnStyle(C.accent)}>
            <Edit3 size={12} /> Edit
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'ebook', id: e.id }) }} style={ownerBtnStyle(C.red)}>
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    </motion.div>
  )

  const renderPublished = () => {
    switch (activeTab) {
      case 'suppliers':
        return publishedCompanies.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {publishedCompanies.map(c => renderPublishedCompanyCard(c))}
          </div>
        ) : renderEmpty('suppliers', true)
      case 'products':
        return publishedProducts.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {publishedProducts.map(p => renderPublishedProductCard(p))}
          </div>
        ) : renderEmpty('products', true)
      case 'talent':
        return publishedTalent.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {publishedTalent.map(t => renderPublishedTalentCard(t))}
          </div>
        ) : renderEmpty('talent', true)
      case 'magazines':
        return publishedEbooks.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {publishedEbooks.map(e => renderPublishedMagazineCard(e))}
          </div>
        ) : renderEmpty('magazines', true)
    }
  }

  const renderSaved = () => {
    switch (activeTab) {
      case 'suppliers':
        return savedCompanies.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {savedCompanies.map(c => (
              <SupplierCard key={c.id} company={c} onMessage={() => {}} navigate={navigate} userId={user?.id} />
            ))}
          </div>
        ) : renderEmpty('suppliers', false)
      case 'products':
        return savedProducts.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {savedProducts.map(p => (
              <ProductCard key={p.id} product={p} onMessage={() => {}} navigate={navigate} userId={user?.id} />
            ))}
          </div>
        ) : renderEmpty('products', false)
      case 'talent':
        return savedTalent.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {savedTalent.map(t => (
              <motion.div key={t.id} whileHover={{ y: -2 }} onClick={() => navigate('talentDetail', { talentUser: t })} style={{
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: t.avatar_url ? `url(${t.avatar_url}) center/cover` : 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, color: '#fff',
                  }}>
                    {!t.avatar_url && t.display_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t.display_name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>@{t.username}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : renderEmpty('talent', false)
      case 'magazines':
        return savedEbooks.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
            {savedEbooks.map(e => (
              <motion.div key={e.id} whileHover={{ y: -2 }} onClick={() => navigate('magazineDetail', { ebook: e })} style={{
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
              }}>
                {e.cover_url && <img src={e.cover_url} alt={e.title} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }} />}
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{e.author}</div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : renderEmpty('magazines', false)
    }
  }

  return (
    <div style={{ minHeight: profileMode ? 'auto' : '100vh', background: profileMode ? 'transparent' : C.bg }}>
      {!profileMode && (
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(5,5,10,0.9)', backdropFilter: 'blur(12px)', padding: '10px 18px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('business')} style={{
              background: 'rgba(7,17,36,0.7)', border: `1px solid rgba(37,99,235,0.1)`,
              borderRadius: 10, width: 36, height: 36, display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted,
            }}>
              <ArrowLeft size={18} />
            </motion.button>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '1px', fontFamily: 'Michroma, sans-serif', flex: 1 }}>My Listings</span>
            <Bookmark size={18} color={C.accent} />
          </div>
        </div>
      )}

      <div style={{ maxWidth: profileMode ? '100%' : 900, margin: '0 auto', padding: profileMode ? '0' : '20px 18px' }}>
        {isOwn && (
          <div style={{ display: 'flex', background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 4, marginBottom: 20 }}>
            {(['published', 'saved'] as Section[]).map(s => (
              <button key={s} onClick={() => setSection(s)} style={{
                flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none',
                background: section === s ? C.accent : 'transparent',
                color: section === s ? '#fff' : C.muted,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {s === 'published' ? 'Published by Me' : 'Saved'}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {CATEGORY_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              borderRadius: 8, border: `1px solid ${activeTab === tab.id ? C.accent : C.border}`,
              background: activeTab === tab.id ? 'rgba(37,99,235,0.12)' : 'transparent',
              color: activeTab === tab.id ? C.accent : C.muted,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {tab.icon}
              {tab.label}
              {getCount(tab.id) > 0 && (
                <span style={{
                  fontSize: 10, background: activeTab === tab.id ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.06)',
                  padding: '1px 6px', borderRadius: 4, fontWeight: 700,
                }}>{getCount(tab.id)}</span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={`${section}-${activeTab}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: C.muted }}>
                <p style={{ fontSize: 13 }}>Loading...</p>
              </div>
            ) : (section === 'published' || !isOwn) ? renderPublished() : renderSaved()}
          </motion.div>
        </AnimatePresence>
      </div>

      <EditListingModal
        open={editModal.open}
        type={editModal.type}
        data={editModal.data}
        onClose={() => setEditModal({ open: false, type: 'company', data: null })}
        onSaved={() => {
          if (editModal.type === 'company') setPublishedCompanies(prev => prev.map(c => c.id === editModal.data?.id ? { ...c, ...editModal.data } : c))
          else if (editModal.type === 'product') setPublishedProducts(prev => prev.map(p => p.id === editModal.data?.id ? { ...p, ...editModal.data } : p))
          else setPublishedEbooks(prev => prev.map(e => e.id === editModal.data?.id ? { ...e, ...editModal.data } : e))
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Listing"
        message="Are you sure you want to delete this listing? This can't be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
