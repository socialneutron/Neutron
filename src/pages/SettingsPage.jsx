import { useState } from 'react'
import { ArrowLeft, Moon, Sun, Lock, Bell, Shield, UserX, ChevronRight, Eye, Zap, Globe, Palette, HelpCircle, LogOut } from 'lucide-react'
import './SettingsPage.css'

const SETTINGS_SECTIONS = [
  {
    title: 'Appearance',
    icon: Palette,
    items: [
      { id: 'dark-mode', label: 'Dark Mode', icon: Moon, type: 'toggle', defaultVal: true },
      { id: 'theme-color', label: 'Accent Color', icon: Palette, type: 'color', value: 'Blue/Purple' },
      { id: 'text-size', label: 'Text Size', icon: Eye, type: 'select', value: 'Medium' },
    ]
  },
  {
    title: 'Notifications',
    icon: Bell,
    items: [
      { id: 'notif-mentions', label: 'Mentions & Replies', icon: Bell, type: 'toggle', defaultVal: true },
      { id: 'notif-likes', label: 'Likes & Reactions', icon: Bell, type: 'toggle', defaultVal: true },
      { id: 'notif-follows', label: 'New Followers', icon: Bell, type: 'toggle', defaultVal: false },
      { id: 'notif-breaking', label: 'Breaking News Alerts', icon: Zap, type: 'toggle', defaultVal: true },
    ]
  },
  {
    title: 'Privacy',
    icon: Eye,
    items: [
      { id: 'private-account', label: 'Private Account', icon: Lock, type: 'toggle', defaultVal: false },
      { id: 'read-receipts', label: 'Read Receipts', icon: Eye, type: 'toggle', defaultVal: true },
      { id: 'online-status', label: 'Show Online Status', icon: Globe, type: 'toggle', defaultVal: true },
      { id: 'ai-personalize', label: 'AI Personalization', icon: Zap, type: 'toggle', defaultVal: true },
    ]
  },
  {
    title: 'Account Security',
    icon: Shield,
    items: [
      { id: 'change-password', label: 'Change Password', icon: Lock, type: 'link' },
      { id: 'two-factor', label: 'Two-Factor Authentication', icon: Shield, type: 'toggle', defaultVal: false, badge: 'Recommended' },
      { id: 'active-sessions', label: 'Active Sessions', icon: Globe, type: 'link', value: '2 devices' },
      { id: 'blocked-users', label: 'Blocked Users', icon: UserX, type: 'link', value: '0' },
    ]
  },
  {
    title: 'Support',
    icon: HelpCircle,
    items: [
      { id: 'help-center', label: 'Help Center', icon: HelpCircle, type: 'link' },
      { id: 'report-bug', label: 'Report a Bug', icon: Shield, type: 'link' },
      { id: 'about', label: 'About Neutron', icon: Zap, type: 'link', value: 'v1.0.0' },
    ]
  },
]

export default function SettingsPage({ navigate }) {
  const [toggles, setToggles] = useState(() => {
    const init = {}
    SETTINGS_SECTIONS.forEach(section => {
      section.items.forEach(item => {
        if (item.type === 'toggle') init[item.id] = item.defaultVal
      })
    })
    return init
  })

  const flipToggle = (id) => setToggles(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <button className="icon-btn" onClick={() => navigate('profile')} id="settings-back-btn">
          <ArrowLeft size={20}/>
        </button>
        <h2 className="settings-title">Settings</h2>
      </div>

      {/* Profile Card */}
      <div className="settings-profile-card">
        <div className="settings-avatar">N</div>
        <div className="settings-profile-info">
          <p className="settings-name">neutron_user</p>
          <p className="settings-email">user@neutron.app</p>
        </div>
        <div className="settings-rep-badge">
          <span>🔷</span>
          <span>4.9 Rep</span>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="settings-content">
        {SETTINGS_SECTIONS.map(section => {
          const SectionIcon = section.icon
          return (
            <div key={section.title} className="settings-section">
              <div className="settings-section-title">
                <SectionIcon size={13} color="var(--accent-blue)"/>
                <span>{section.title}</span>
              </div>
              <div className="settings-group">
                {section.items.map((item, i) => {
                  const ItemIcon = item.icon
                  return (
                    <div
                      key={item.id}
                      className="settings-row"
                      style={{ borderBottom: i < section.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                      id={`setting-${item.id}`}
                    >
                      <div className="settings-row-left">
                        <div className="settings-row-icon">
                          <ItemIcon size={15}/>
                        </div>
                        <div className="settings-row-text">
                          <span className="settings-row-label">{item.label}</span>
                          {item.badge && (
                            <span className="settings-badge">{item.badge}</span>
                          )}
                        </div>
                      </div>
                      <div className="settings-row-right">
                        {item.value && item.type !== 'toggle' && (
                          <span className="settings-row-value">{item.value}</span>
                        )}
                        {item.type === 'toggle' ? (
                          <button
                            className={`toggle-switch ${toggles[item.id] ? 'toggle-on' : ''}`}
                            onClick={() => flipToggle(item.id)}
                          >
                            <span className="toggle-thumb"/>
                          </button>
                        ) : (
                          <ChevronRight size={16} color="var(--text-secondary)"/>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Danger Zone */}
        <div className="danger-zone">
          <button className="danger-btn" id="logout-btn" onClick={() => navigate('welcome')}>
            <LogOut size={16}/>
            Sign Out
          </button>
          <button className="delete-account-btn" id="delete-account-btn">
            Delete Account
          </button>
        </div>

        <p className="settings-footer">
          Neutron v1.0.0 · Made with ⚡ for the future
        </p>
      </div>
    </div>
  )
}
