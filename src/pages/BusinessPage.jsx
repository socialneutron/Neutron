import React from 'react'
import MarketplaceApp from '../marketplace/App'
import '../marketplace/index.css'

export default function BusinessPage({ navigate, user, initialTab }) {
  return <MarketplaceApp navigate={navigate} user={user} initialTab={initialTab} />
}
