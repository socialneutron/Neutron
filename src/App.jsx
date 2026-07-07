import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useAuth } from './context/AuthContext';
import SplashScreen from './pages/SplashScreen';
import WelcomeScreen from './pages/WelcomeScreen';
import AuthPage from './pages/AuthPage';
import OnboardingFlow from './pages/OnboardingFlow';
import HomeFeed from './pages/HomeFeed';
import TopicHub from './pages/TopicHub';
import PostCreation from './pages/PostCreation';
import ChatSystem from './pages/ChatSystem';
import ProfilePage from './pages/ProfilePage';
import BusinessPage from './pages/BusinessPage';
import SettingsPage from './pages/SettingsPage';
import WorkflowPage from './pages/WorkflowPage';
import BottomNav from './components/BottomNav';
import StoreVerification from './pages/StoreVerification';
import StoreCreated from './pages/StoreCreated';
import Hero from './components/landing/Hero';
import LoginCard from './components/auth/LoginCard';
import RegisterCard from './components/auth/RegisterCard';
import VerifyOtp from './components/auth/VerifyOtp';
import TwoFactorVerify from './components/auth/TwoFactorVerify';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import SessionSettings from './components/profile/SessionSettings';
import NotificationsPage from './pages/NotificationsPage';
import PostDetail from './pages/social/PostDetail';
import PostDiscussionPage from './pages/social/PostDiscussionPage';
import BookmarksPage from './pages/social/BookmarksPage';
import ExplorePage from './pages/ExplorePage';

export default function App() {
  const { user, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState('splash')
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [chatRecipient, setChatRecipient] = useState(null)
  const [sharedAssetData, setSharedAssetData] = useState(null)
  const [authParams, setAuthParams] = useState({})
  const [profileAuthor, setProfileAuthor] = useState(null)
  const [navParams, setNavParams] = useState({})
  const [fxEnabled, setFxEnabled] = useState(true)

  useEffect(() => {
    if (loading) return
    if (user) {
      setCurrentPage(prev => (['splash', 'welcome', 'login', 'signup'].includes(prev)) ? 'home' : prev)
    } else {
      setCurrentPage(prev => (!['splash', 'welcome', 'signup', 'login'].includes(prev)) ? 'welcome' : prev)
    }
  }, [user, loading])

  const navigate = (page, params = {}) => {
    if (params.topic) setSelectedTopic(params.topic)
    if (params.chat) setChatRecipient(params.chat)
    if (params.assetData) setSharedAssetData(params.assetData)
    if (params.author) {
      setProfileAuthor(params.author)
    } else if (page !== 'profile') {
      setProfileAuthor(null)
    }
    setNavParams(params)
    setCurrentPage(page)
  }

  const handleLogout = async () => {
    await signOut(auth)
    navigate('welcome')
  }

  const mainPages = ['home', 'chat', 'explore', 'workflow', 'create', 'business', 'profile']

  const subPages = ['notifications', 'settings', 'post', 'bookmarks', 'explore', 'topic']

  const navigateAuth = (page, params) => {
    if (params) setAuthParams(params)
    const pageMap = {
      'login': 'login', 'register': 'register', 'verify': 'verify', '2fa': '2fa',
      'forgot-password': 'forgot-password', 'reset-password': 'reset-password',
      'sessions': 'sessions', 'home': 'home', 'landing': 'landing',
    }
    navigate(pageMap[page] || page, params)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'splash':
        return <SplashScreen key="splash" onFinish={() => navigate('welcome')} />
      case 'welcome':
        return <WelcomeScreen key="welcome" onLogin={() => navigate('login')} onSignup={() => navigate('signup')} onExplore={() => navigate('home')} />
      case 'signup':
      case 'login':
        return <AuthPage key="auth" initialMode={currentPage} navigate={navigate} />
      case 'register':
        return <RegisterCard key="register" onNavigate={navigateAuth} />
      case 'verify':
        return <VerifyOtp key="verify" onNavigate={navigateAuth} params={{ email: authParams.email }} />
      case '2fa':
        return <TwoFactorVerify key="2fa" onNavigate={navigateAuth} params={{ userId: user?.uid }} />
      case 'forgot-password':
        return <ForgotPassword key="forgot-password" onNavigate={navigateAuth} />
      case 'reset-password':
        return <ResetPassword key="reset-password" onNavigate={navigateAuth} params={{ token: 'reset_token_placeholder' }} />
      case 'sessions':
        return <SessionSettings key="sessions" onNavigate={navigateAuth} />
      case 'landing':
        return <Hero key="landing" onNavigate={navigateAuth} />
      case 'onboarding':
        return <OnboardingFlow key="onboarding" onFinish={() => navigate('home')} navigate={navigate} />
      case 'home':
        return <HomeFeed key="home" navigate={navigate} user={user} sharedAssetData={sharedAssetData} onClearAssetData={() => setSharedAssetData(null)} />
      case 'topic':
        return <TopicHub key="topic" topic={selectedTopic} navigate={navigate} />
      case 'create':
        return <PostCreation key="create" navigate={navigate} />
      case 'chat':
        return <ChatSystem key="chat" recipient={chatRecipient} navigate={navigate} user={user} />
      case 'profile':
        return <ProfilePage key={`profile-${profileAuthor?.name || 'self'}`} user={user} navigate={navigate} profileAuthor={profileAuthor} />
      case 'business':
        return <BusinessPage key="business" navigate={navigate} user={user} />
      case 'notifications':
        return <NotificationsPage key="notifications" navigate={navigate} />
      case 'post':
        return <PostDiscussionPage key="post" postId={navParams.postId} navigate={navigate} />
      case 'bookmarks':
        return <BookmarksPage key="bookmarks" navigate={navigate} />
      case 'explore':
        return <ExplorePage key="explore" navigate={navigate} />
      case 'storeVerification':
        return <StoreVerification key="storeVerification" navigate={navigate} />
      case 'storeCreated':
        return <StoreCreated key="storeCreated" navigate={navigate} />
      case 'settings':
        return <SettingsPage key="settings" navigate={navigate} onLogout={handleLogout} />
      case 'workflow':
        return <WorkflowPage key="workflow" navigate={navigate} />
      default:
        return <HomeFeed key="default" navigate={navigate} user={user} sharedAssetData={sharedAssetData} onClearAssetData={() => setSharedAssetData(null)} />
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#05050A', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#00D2FF', borderRadius: '50%' }} />
    </div>
  )

  const showBottomNav = mainPages.includes(currentPage) || subPages.includes(currentPage)

  const BOTTOM_NAV_HEIGHT = 72

  return (
    <div className="app-container" style={{ background: 'var(--bg-color)', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage + JSON.stringify(navParams)}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
      {showBottomNav && (
        <BottomNav currentPage={currentPage} navigate={navigate} />
      )}
    </div>
  )
}
