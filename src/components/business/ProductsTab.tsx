import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, ShoppingBag, Plus, Tag } from 'lucide-react'
import ProductCard from './ProductCard'
import RegisterProductModal from './RegisterProductModal'
import { useChatStore } from '../../stores/chatStore'
import type { Product } from '../../types/database'

const PRODUCT_CATEGORIES = ['All', 'Electronics', 'Furniture', 'Tools', 'Clothing', 'Home', 'Sports', 'Books']

interface ProductsTabProps {
  navigate: (page: string, params?: any) => void
  userId?: string
}

export default function ProductsTab({ navigate, userId }: ProductsTabProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [showRegister, setShowRegister] = useState(false)
  const { getOrCreateConversation } = useChatStore()

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data } = await supabase.from('products').select('*')
        if (data) setProducts(data as Product[])
      } catch {
        setProducts([])
      }
    }
    loadProducts()
  }, [])

  const filtered = products.filter(p => {
    const matchesSearch = !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const handleMessageSeller = (product: Product) => {
    getOrCreateConversation({
      id: product.seller_id,
      username: product.seller_name.toLowerCase().replace(/\s+/g, '_'),
      displayName: product.seller_name,
      avatar: product.seller_avatar,
      online: true,
      isVerified: false,
    })
    navigate('chat', {
      chat: {
        username: product.seller_name.toLowerCase().replace(/\s+/g, '_'),
        id: product.seller_id,
        avatar: product.seller_avatar,
        displayName: product.seller_name,
      }
    })
  }

  const handleRegisterProduct = (data: any) => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      ...data,
      seller_id: 'demo-user-id',
      seller_name: 'Pratham',
      seller_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setProducts(prev => [newProduct, ...prev])

    try {
      const { supabase } = require('../../lib/supabase')
      supabase.from('products').insert(newProduct)
    } catch {}
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px 11px 38px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.07)', background: '#0d1220',
    color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none',
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff' }}>Product Marketplace</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            Buy and sell physical products with the community
          </p>
        </div>
        <button
          onClick={() => setShowRegister(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
            borderRadius: 10, border: '1px solid #2563eb', background: 'rgba(37,99,235,0.12)',
            color: '#2563eb', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,99,235,0.12)'}
        >
          <Plus size={14} /> List Product
        </button>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {PRODUCT_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', whiteSpace: 'nowrap',
              background: activeCategory === cat ? 'rgba(37,99,235,0.2)' : '#111827',
              color: activeCategory === cat ? '#2563eb' : '#9ca3af',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} color="#6b7280" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Stats */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
          {filtered.length} products found
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onMessage={handleMessageSeller}
            navigate={navigate}
            userId={userId}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280' }}>
          <ShoppingBag size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>No products found</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search or list a new product</p>
        </div>
      )}

      {showRegister && (
        <RegisterProductModal
          onClose={() => setShowRegister(false)}
          onSubmit={handleRegisterProduct}
        />
      )}
    </div>
  )
}
