import { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabaseAuth } from './context/SupabaseAuthContext';
import { useProfileStore } from './stores/profileStore';
import { useChatStore } from './stores/chatStore';
import SplashScreen from './pages/SplashScreen';
import BottomNav from './components/BottomNav';
import { ToastProvider } from './components/ToastNotification';
import { MessageToastProvider } from './components/common/MessageToast';

const WelcomeScreen = lazy(() => import('./pages/WelcomeScreen'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const OnboardingFlow = lazy(() => import('./pages/OnboardingFlow'));
const HomeFeed = lazy(() => import('./pages/HomeFeed'));
const TopicHub = lazy(() => import('./pages/TopicHub'));
const PostCreation = lazy(() => import('./pages/PostCreation'));
const ChatSystem = lazy(() => import('./pages/ChatSystem'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const BusinessPage = lazy(() => import('./pages/BusinessPage'));
const MagazineDetailPage = lazy(() => import('./components/business/MagazineDetailPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const WorkflowPage = lazy(() => import('./pages/WorkflowPage'));
const StoreVerification = lazy(() => import('./pages/StoreVerification'));
const StoreCreated = lazy(() => import('./pages/StoreCreated'));
const Hero = lazy(() => import('./components/landing/Hero'));
const LoginCard = lazy(() => import('./components/auth/LoginCard'));
const RegisterCard = lazy(() => import('./components/auth/RegisterCard'));
const VerifyOtp = lazy(() => import('./components/auth/VerifyOtp'));
const TwoFactorVerify = lazy(() => import('./components/auth/TwoFactorVerify'));
const ForgotPassword = lazy(() => import('./components/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/auth/ResetPassword'));
const SessionSettings = lazy(() => import('./components/profile/SessionSettings'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const PostDetailPage = lazy(() => import('./pages/social/PostDetailPage'));
const BookmarksPage = lazy(() => import('./pages/social/BookmarksPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const SupplierDetailPage = lazy(() => import('./components/business/SupplierDetailPage'));
const ProductDetailPage = lazy(() => import('./components/business/ProductDetailPage'));
const TalentDetailPage = lazy(() => import('./components/business/TalentDetailPage'));
const MyListingsPage = lazy(() => import('./components/business/MyListingsPage'));

export default function App() {
  const { user, loading, signOut: authSignOut } = useSupabaseAuth()
  const { setProfile, setIsFollowing } = useProfileStore()
  const getTotalUnread = useChatStore((s) => s.getTotalUnread)
  const [currentPage, setCurrentPage] = useState('splash')
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [chatRecipient, setChatRecipient] = useState(null)
  const [sharedAssetData, setSharedAssetData] = useState(null)
  const [authParams, setAuthParams] = useState({})
  const [profileAuthor, setProfileAuthor] = useState(null)
  const [navParams, setNavParams] = useState({})
  const [navHidden, setNavHidden] = useState(false)
  const navTimerRef = useRef(null)

  const resetNavTimer = useCallback(() => {
    setNavHidden(false)
    clearTimeout(navTimerRef.current)
    navTimerRef.current = setTimeout(() => setNavHidden(true), 10000)
  }, [])

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
      setIsFollowing(false)
    } else {
      setProfileAuthor(null)
    }
    setNavParams(params)
    setCurrentPage(page)
  }

  const handleLogout = async () => {
    await authSignOut()
    navigate('welcome')
  }

  const mainPages = ['home', 'chat', 'explore', 'workflow', 'create', 'business', 'profile']

  const subPages = ['notifications', 'settings', 'post', 'bookmarks', 'explore', 'topic', 'myListings', 'supplierDetail', 'productDetail', 'talentDetail']

  const showBottomNav = mainPages.includes(currentPage) || subPages.includes(currentPage)

  useEffect(() => {
    if (!showBottomNav) return
    resetNavTimer()
    const handler = () => resetNavTimer()
    document.addEventListener('click', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      clearTimeout(navTimerRef.current)
      document.removeEventListener('click', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [showBottomNav, currentPage, resetNavTimer])

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
        return <TwoFactorVerify key="2fa" onNavigate={navigateAuth} params={{ userId: user?.id }} />
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
        return <ChatSystem key="chat" recipient={chatRecipient} navigate={navigate} user={user} navParams={navParams} />
      case 'profile':
        return <ProfilePage key={profileAuthor ? `profile-other-${profileAuthor.id || profileAuthor.handle}` : 'profile-self'} user={user} navigate={navigate} profileAuthor={profileAuthor} />
      case 'business':
        return <BusinessPage key="business" navigate={navigate} user={user} />
      case 'magazineDetail':
        return <MagazineDetailPage key="magazineDetail" ebook={navParams.ebook} navigate={navigate} user={user} />
      case 'supplierDetail':
        return <SupplierDetailPage key="supplierDetail" company={navParams.company} navigate={navigate} user={user} />
      case 'productDetail':
        return <ProductDetailPage key="productDetail" product={navParams.product} navigate={navigate} user={user} />
      case 'talentDetail':
        return <TalentDetailPage key="talentDetail" talentUser={navParams.talentUser} navigate={navigate} user={user} />
      case 'myListings':
        return <MyListingsPage key="myListings" navigate={navigate} user={user} />
      case 'notifications':
        return <NotificationsPage key="notifications" navigate={navigate} />
      case 'post':
        return <PostDetailPage key="post" postId={navParams.postId} navigate={navigate} />
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep, #020617)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#00D2FF', borderRadius: '50%' }} />
    </div>
  )

  const BOTTOM_NAV_HEIGHT = 72

  return (
    <ToastProvider navigate={navigate}>
    <MessageToastProvider>
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
          <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#00D2FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          }>
            {renderPage()}
          </Suspense>
        </motion.div>
      </AnimatePresence>
      {showBottomNav && (
        <BottomNav currentPage={currentPage} navigate={navigate} unreadCount={getTotalUnread()} hidden={navHidden} />
      )}
    </div>
    </MessageToastProvider>
    </ToastProvider>
  )
}
