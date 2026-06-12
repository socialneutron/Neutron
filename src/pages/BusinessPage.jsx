import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, Store, TrendingUp, Search, Plus, Filter, ArrowRight, DollarSign, Package, ArrowLeft } from 'lucide-react'
import './BusinessPage.css'

const MOCK_LISTINGS = [
  { id: 1, title: 'Web3 Consulting Session', seller: '@cypher_punk', price: '0.5 ETH', type: 'Service', tags: ['Blockchain', 'Strategy'], trending: true },
  { id: 2, title: 'AI Automation Agent v2', seller: '@neural_net', price: '$499', type: 'Software', tags: ['AI', 'Productivity'], trending: true },
  { id: 3, title: 'Rare Neural Collectible', seller: '@art_bot', price: '1.2 SOL', type: 'Asset', tags: ['NFT', 'Art'], trending: false },
  { id: 4, title: 'Quantum Computing Rig', seller: '@q_bits', price: '$12,500', type: 'Hardware', tags: ['Tech', 'Enterprise'], trending: false },
  { id: 5, title: 'Zero-Day Exploit Bundle', seller: '@sec_ops', price: 'Offer', type: 'Data', tags: ['Security', 'Exclusive'], trending: true },
]

export default function BusinessPage({ navigate }) {
  const [activeTab, setActiveTab] = useState('marketplace')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="business-page">
      {/* Header section with tabs */}
      <header className="business-header">
        <div className="header-title">
          <button className="back-btn" onClick={() => navigate('home')} id="business-back-btn" style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginRight: '4px',
            transition: 'all 0.2s',
            flexShrink: 0
          }}>
            <ArrowLeft size={18} />
          </button>
          <Briefcase size={24} className="accent-icon" />
          <h1>Neutron Exchange</h1>
        </div>
        
        <div className="tab-switcher">
          <button 
            className={`tab-btn ${activeTab === 'marketplace' ? 'active' : ''}`}
            onClick={() => setActiveTab('marketplace')}
          >
            <TrendingUp size={16} />
            Marketplace
          </button>
          <button 
            className={`tab-btn ${activeTab === 'mystore' ? 'active' : ''}`}
            onClick={() => setActiveTab('mystore')}
          >
            <Store size={16} />
            My Store
          </button>
        </div>
      </header>

      <div className="business-content">
        <AnimatePresence mode="wait">
          {activeTab === 'marketplace' ? (
            <motion.div 
              key="marketplace"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="marketplace-view"
            >
              <div className="search-bar-wrap">
                <Search size={18} className="search-icon" />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Search assets, services, and hardware..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="filter-btn"><Filter size={18}/></button>
              </div>

              <div className="listings-grid">
                {MOCK_LISTINGS.map(listing => (
                  <div key={listing.id} className="listing-card">
                    {listing.trending && <div className="trending-badge">Trending</div>}
                    <div className="listing-type">{listing.type}</div>
                    <h3 className="listing-title">{listing.title}</h3>
                    <p className="listing-seller">{listing.seller}</p>
                    
                    <div className="listing-tags">
                      {listing.tags.map(tag => (
                        <span key={tag} className="listing-tag">{tag}</span>
                      ))}
                    </div>
                    
                    <div className="listing-footer">
                      <span className="listing-price">{listing.price}</span>
                      <button className="trade-btn">
                        Trade <ArrowRight size={14}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="mystore"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mystore-view"
            >
              <div className="empty-store-state">
                <div className="empty-store-icon">
                  <Store size={48} />
                </div>
                <h2>You don't have a store yet</h2>
                <p>Open a storefront to start trading digital assets, software, and services directly on the Neutron network.</p>
                
                <div className="store-features">
                  <div className="feature-item">
                    <DollarSign size={20} className="feature-icon text-green" />
                    <span>0% Platform Fees</span>
                  </div>
                  <div className="feature-item">
                    <Package size={20} className="feature-icon text-blue" />
                    <span>Unlimited Listings</span>
                  </div>
                </div>

                <button className="open-store-btn" onClick={() => navigate('storeVerification')} id="open-store-btn">
                  <Plus size={18} />
                  Open Store
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
