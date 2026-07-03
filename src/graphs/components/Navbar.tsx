import React, { useState } from 'react';
import { useAnimations } from '../context/AnimationContext';
import { Network, FolderHeart, Award, Bell, Check, Sparkles, User, LogOut, Sun, Moon, ArrowLeft } from 'lucide-react';
import { MOCK_NOTIFICATIONS } from '../data/mockData';
import { CreatorProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import NeutronLogo from './NeutronLogo';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openNotifications: boolean;
  setOpenNotifications: (open: boolean) => void;
  currentUser: CreatorProfile;
  allProfiles: CreatorProfile[];
  onSwitchUser: (user: CreatorProfile) => void;
  navigate?: (page: string) => void;
}

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  openNotifications, 
  setOpenNotifications,
  currentUser,
  allProfiles,
  onSwitchUser,
  navigate
}: NavbarProps) {
  const { animationsEnabled, toggleAnimations } = useAnimations();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const navItems = [
    { id: 'feed', name: 'Global Feed', icon: Network },
    { id: 'studio', name: 'Creator Studio', icon: FolderHeart },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-black/90 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {navigate && (
            <button
              onClick={() => navigate('home')}
              className="p-1 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 transition mr-2 cursor-pointer flex items-center justify-center"
              title="Back to Feed"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div id="nav-logo" className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('feed')}>
          <div className="relative flex items-center justify-center w-10 h-10 transition-all duration-300">
            <NeutronLogo className="w-9 h-9 group-hover:scale-105" glow={true} />
          </div>
          <div>
            <span className="font-sans font-black text-sm tracking-[0.15em] text-white lowercase">
              neutron<span className="text-[#00BFFF] font-semibold text-glow font-sans">.graphs</span>
            </span>
          </div>
        </div>
      </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1" aria-label="Primary Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-btn-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-4 py-2 rounded-lg flex items-center space-x-2 text-xs font-mono uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
                  isActive ? 'text-[#00BFFF]' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {isActive && animationsEnabled && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute inset-0 bg-white/[0.03] border border-white/10 rounded-lg -z-10 shadow-[inner_0_0_12px_rgba(255,255,255,0.02)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                {!animationsEnabled && isActive && (
                  <div className="absolute inset-0 bg-white/[0.03] border border-white/10 rounded-lg -z-10" />
                )}
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00BFFF]' : 'text-neutral-500'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Dashboard Settings */}
        <div className="flex items-center space-x-4">
          
          {/* ANIMATIONS GLOWING SLIDER CONTROLLER */}
          <div className="flex items-center space-x-2.5 bg-white/[0.01] border border-white/5 py-1 px-2.5 rounded-lg" title="Animations Switcher">
            <span className="hidden lg:inline text-[9px] font-mono text-neutral-500 tracking-widest">
              FX: {animationsEnabled ? 'ON' : 'OFF'}
            </span>
            <button
              id="animations-toggle-switch"
              onClick={toggleAnimations}
              className={`relative w-10 h-5 rounded-full p-0.5 transition-all duration-300 ${
                animationsEnabled 
                  ? 'bg-neutral-900 border border-[#00BFFF]/60 shadow-[0_0_10px_rgba(0,191,255,0.2)]' 
                  : 'bg-neutral-850 border border-neutral-700'
              } flex items-center cursor-pointer`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                  animationsEnabled 
                    ? 'bg-[#00BFFF] translate-x-5 shadow-[0_0_8px_#00BFFF]' 
                    : 'bg-neutral-500 translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="h-5 w-[1px] bg-white/5"></div>

          {/* Notifications Bell Tray */}
          <div className="relative">
            <button
              id="bell-indicator-btn"
              onClick={() => {
                setOpenNotifications(!openNotifications);
                setUserMenuOpen(false);
              }}
              className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.02] border border-transparent hover:border-white/5 relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_#ec4899]" />
              )}
            </button>

            {/* Notifications Drops */}
            <AnimatePresence>
              {openNotifications && (
                <div
                  id="notifications-dropdown"
                  className="absolute right-0 mt-2 w-80 bg-neutral-950/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden z-50 text-left"
                >
                  <div className="p-3.5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00BFFF] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Telemetry Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button 
                         onClick={markAllRead} 
                        className="text-[9px] font-mono hover:text-[#00BFFF] text-neutral-500 uppercase transition-all"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-neutral-500 text-xs">No active notification signals.</div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-3.5 text-xs transition-colors duration-200 hover:bg-white/[0.02] ${
                            notif.read ? 'text-neutral-400' : 'text-neutral-100 bg-white/[0.01]'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold">{notif.title}</span>
                            <span className="text-[9px] font-mono text-neutral-500 whitespace-nowrap">{notif.timestamp}</span>
                          </div>
                          <p className="text-neutral-400 line-clamp-2">{notif.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* User Account Switcher Menu */}
          <div className="relative">
            <button
              id="user-account-menu-btn"
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setOpenNotifications(false);
              }}
              className="flex items-center space-x-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-white/5 bg-white/[0.01] hover:border-[#00BFFF]/30 hover:bg-white/[0.03] transition-all cursor-pointer relative font-sans"
              title="Switch active session"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-5.5 h-5.5 rounded-md object-cover border border-white/10"
                referrerPolicy="no-referrer"
              />
              <div className="hidden lg:block text-left font-sans">
                <span className="text-[10px] font-bold text-neutral-200 block leading-none">{currentUser.name}</span>
                <span className="text-[8px] font-mono text-[#00BFFF] block leading-none mt-0.5">{currentUser.handle}</span>
              </div>
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <div
                  id="user-menu-dropdown"
                  className="absolute right-0 mt-2 w-64 bg-neutral-950/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden z-50 text-left p-3.5 space-y-3"
                >
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[8.5px] font-mono text-neutral-500 uppercase block font-semibold">Active Session Identity</span>
                    <div className="flex items-center space-x-2.5 mt-1">
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-lg object-cover" />
                      <div>
                        <span className="text-xs font-bold text-white block">{currentUser.name}</span>
                        <span className="text-[9px] font-mono text-[#00BFFF]">{currentUser.handle}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[8.5px] font-mono text-neutral-500 uppercase block font-semibold">Switch Account Session</span>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {allProfiles.map((p) => {
                        const isActive = p.id === currentUser.id;
                        return (
                          <button
                            key={p.id}
                            id={`switch-user-${p.id}`}
                            onClick={() => {
                              onSwitchUser(p);
                              setUserMenuOpen(false);
                            }}
                            className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer ${
                              isActive 
                                ? 'bg-[#00BFFF]/10 border border-[#00BFFF]/20 text-[#00BFFF]' 
                                : 'hover:bg-white/[0.02] border border-transparent text-neutral-400 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <img src={p.avatar} alt={p.name} className="w-5 h-5 rounded-md object-cover" />
                              <div className="leading-tight">
                                <span className={`font-bold block ${isActive ? 'text-[#00BFFF]' : 'text-neutral-200'}`}>{p.name}</span>
                                <span className="text-[8.5px] font-mono opacity-80">{p.handle}</span>
                              </div>
                            </div>
                            {isActive && <Check className="w-3.5 h-3.5 text-[#00BFFF]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex justify-around border-t border-neutral-900 bg-neutral-950/90 py-2.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center space-y-1 text-[10px] font-medium transition-colors cursor-pointer ${
                isActive ? 'text-[#00BFFF]' : 'text-neutral-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
