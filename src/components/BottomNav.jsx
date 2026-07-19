import { Home, MessageCircle, Plus, Briefcase, User, Share2, Compass } from 'lucide-react'
import './BottomNav.css'

const LEFT_ITEMS = [
  { id: 'home',    label: 'Home',    icon: Home },
  { id: 'chat',    label: 'Chat',    icon: MessageCircle },
  { id: 'explore', label: 'Explore', icon: Compass },
]

const RIGHT_ITEMS = [
  { id: 'workflow', label: 'Workflow', icon: Share2 },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'profile',  label: 'Profile',  icon: User },
]

const CREATE_ITEM = { id: 'create', label: '', icon: Plus, special: true }

function NavItem({ item, isActive, navigate, badge }) {
  const Icon = item.icon
  return (
    <button
      className={`nav-item-btn ${isActive ? 'nav-active' : ''}`}
      onClick={() => navigate(item.id)}
      id={`nav-${item.id}`}
    >
      <span className="nav-icon-wrap">
        <Icon size={22}/>
        {isActive && <span className="nav-active-dot"/>}
        {badge > 0 && <span className="nav-badge">{badge > 99 ? '99+' : badge}</span>}
      </span>
      <span className="nav-label">{item.label}</span>
    </button>
  )
}

export default function BottomNav({ currentPage, navigate, unreadCount = 0, hidden = false }) {
  return (
    <nav className={`bottom-nav${hidden ? ' nav-hidden' : ''}`} id="bottom-nav">
      <div className="nav-group nav-group-left">
        {LEFT_ITEMS.map(item => (
          <NavItem key={item.id} item={item} isActive={currentPage === item.id} navigate={navigate} badge={item.id === 'chat' ? unreadCount : 0} />
        ))}
      </div>

      <button
        className="nav-create-btn"
        onClick={() => navigate(CREATE_ITEM.id)}
        id={`nav-${CREATE_ITEM.id}`}
      >
        <Plus size={24}/>
      </button>

      <div className="nav-group nav-group-right">
        {RIGHT_ITEMS.map(item => (
          <NavItem key={item.id} item={item} isActive={currentPage === item.id} navigate={navigate} />
        ))}
      </div>
    </nav>
  )
}
