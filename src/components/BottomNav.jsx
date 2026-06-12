import { Home, MessageCircle, Plus, Briefcase, User, TrendingUp } from 'lucide-react'
import './BottomNav.css'

const NAV_ITEMS = [
  { id: 'home',          label: 'Home',      icon: Home },
  { id: 'chat',          label: 'Chat',      icon: MessageCircle },
  { id: 'graphs',        label: 'Graphs',    icon: TrendingUp },
  { id: 'create',        label: 'Create',    icon: Plus,  special: true },
  { id: 'business',      label: 'Business',  icon: Briefcase },
  { id: 'profile',       label: 'Profile',   icon: User },
]

export default function BottomNav({ currentPage, navigate }) {
  return (
    <nav className="bottom-nav" id="bottom-nav">
      {NAV_ITEMS.map(item => {
        const Icon = item.icon
        const isActive = currentPage === item.id

        if (item.special) {
          return (
            <button
              key={item.id}
              className="nav-create-btn"
              onClick={() => navigate(item.id)}
              id={`nav-${item.id}`}
            >
              <Icon size={22}/>
            </button>
          )
        }

        return (
          <button
            key={item.id}
            className={`nav-item-btn ${isActive ? 'nav-active' : ''}`}
            onClick={() => navigate(item.id)}
            id={`nav-${item.id}`}
          >
            <span className="nav-icon-wrap">
              <Icon size={22}/>
              {isActive && <span className="nav-active-dot"/>}
            </span>
            <span className="nav-label">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
