import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
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
import GraphPage from './pages/GraphPage';
import BottomNav from './components/BottomNav';
import StoreVerification from './pages/StoreVerification';

export default function App() {
  const [currentPage, setCurrentPage] = useState('splash')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [chatRecipient, setChatRecipient] = useState(null)


  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Listen to real-time updates from Firestore for this user
        unsubscribeSnapshot = onSnapshot(doc(db, 'users', firebaseUser.uid), (userDoc) => {
          const userData = userDoc.exists() ? userDoc.data() : { 
            username: firebaseUser.displayName || 'neutron_user', 
            email: firebaseUser.email,
            uid: firebaseUser.uid
          }
          setUser({ ...userData, uid: firebaseUser.uid })
          
          setCurrentPage(prev => (['splash', 'welcome', 'login', 'signup'].includes(prev)) ? 'home' : prev)
          setLoading(false)
        }, (error) => {
          console.error("Firestore users snapshot error (expected if database is not created in Firebase console):", error)
          setUser({ 
            username: firebaseUser.displayName || 'neutron_user', 
            email: firebaseUser.email,
            uid: firebaseUser.uid,
            reputation: 4.5
          })
          setCurrentPage(prev => (['splash', 'welcome', 'login', 'signup'].includes(prev)) ? 'home' : prev)
          setLoading(false)
        })
      } else {
        setUser(null)
        setCurrentPage(prev => (!['splash', 'welcome', 'signup', 'login'].includes(prev)) ? 'welcome' : prev)
        setLoading(false)
        if (unsubscribeSnapshot) unsubscribeSnapshot()
      }
    })

    return () => {
      unsubscribe()
      if (unsubscribeSnapshot) unsubscribeSnapshot()
    }
  }, [])

  const navigate = (page, params = {}) => {
    if (params.topic) setSelectedTopic(params.topic)
    if (params.chat) setChatRecipient(params.chat)
    setCurrentPage(page)
  }

  const handleLogout = async () => {
    await signOut(auth)
    navigate('welcome')
  }

  const mainPages = ['home', 'chat', 'graphs', 'create', 'business', 'profile']

  const renderPage = () => {
    switch (currentPage) {
      case 'splash':
        return <SplashScreen key="splash" onFinish={() => navigate('welcome')} />
      case 'welcome':
        return <WelcomeScreen key="welcome" onLogin={() => navigate('login')} onSignup={() => navigate('signup')} />
      case 'signup':
      case 'login':
        return <AuthPage key="auth" initialMode={currentPage} navigate={navigate} />
      case 'onboarding':
        return <OnboardingFlow key="onboarding" onFinish={() => navigate('home')} />
      case 'home':
        return <HomeFeed key="home" navigate={navigate} user={user} />
      case 'topic':
        return <TopicHub key="topic" topic={selectedTopic} navigate={navigate} />
      case 'create':
        return <PostCreation key="create" navigate={navigate} />
      case 'chat':
        return <ChatSystem key="chat" recipient={chatRecipient} navigate={navigate} />
      case 'profile':
        return <ProfilePage key="profile" user={user} navigate={navigate} />
      case 'business':
        return <BusinessPage key="business" navigate={navigate} />
      case 'storeVerification':
        return <StoreVerification key="storeVerification" navigate={navigate} />

      case 'settings':
        return <SettingsPage key="settings" navigate={navigate} onLogout={handleLogout} />
      case 'graphs':
        return <GraphPage key="graphs" navigate={navigate} />
      default:
        return <HomeFeed key="default" navigate={navigate} user={user} />
    }
  }

  if (loading) return null // Or a loading spinner

  return (
    <div className="app-container" style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{ width: '100%', height: '100%' }}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
      {mainPages.includes(currentPage) && (
        <BottomNav currentPage={currentPage} navigate={navigate} />
      )}
    </div>
  )
}
