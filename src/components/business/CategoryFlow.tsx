import { motion } from 'framer-motion'
import { Package, Truck, Factory, Cpu, Wrench, Building2, Leaf, Zap, Home } from 'lucide-react'

interface Category {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  count: number
}

interface CategoryFlowProps {
  categories: Category[]
  activeCategory: string | null
  onSelect: (categoryId: string | null) => void
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Raw Materials': <Package size={18} />,
  'Logistics & Storage': <Truck size={18} />,
  'Manufacturing': <Factory size={18} />,
  'Technology': <Cpu size={18} />,
  'Services': <Wrench size={18} />,
  'Buildings & Construction': <Building2 size={18} />,
  'Agriculture': <Leaf size={18} />,
  'Energy & Utilities': <Zap size={18} />,
  'Real Estate': <Home size={18} />,
}

const CATEGORY_COLORS: Record<string, string> = {
  'Raw Materials': '#2563eb',
  'Logistics & Storage': '#7c3aed',
  'Manufacturing': '#059669',
  'Technology': '#06b6d4',
  'Services': '#d97706',
  'Buildings & Construction': '#ea580c',
  'Agriculture': '#16a34a',
  'Energy & Utilities': '#eab308',
  'Real Estate': '#ec4899',
}

export default function CategoryFlow({ categories, activeCategory, onSelect }: CategoryFlowProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 0',
        scrollbarWidth: 'none',
      }}>
        {/* All button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 12, border: 'none',
            background: activeCategory === null ? 'rgba(37,99,235,0.2)' : '#111827',
            color: activeCategory === null ? '#2563eb' : '#9ca3af',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            transition: 'all 0.15s',
          }}
        >
          <Package size={16} />
          All Categories
        </motion.button>

        {categories.map((cat, i) => {
          const color = cat.color || CATEGORY_COLORS[cat.id] || '#2563eb'
          const isActive = activeCategory === cat.id
          return (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center' }}>
              {/* Connector line */}
              {i > 0 && (
                <div style={{
                  width: 20, height: 2, background: 'rgba(255,255,255,0.08)',
                  flexShrink: 0,
                }} />
              )}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelect(cat.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 12, border: 'none',
                  background: isActive ? `${color}20` : '#111827',
                  color: isActive ? color : '#9ca3af',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 8, background: `${color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color,
                }}>
                  {CATEGORY_ICONS[cat.id] || <Package size={16} />}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div>{cat.label}</div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>{cat.count} companies</div>
                </div>
              </motion.button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
