import React, { useState, useEffect } from 'react';
import { AnimationProvider } from './context/AnimationContext';
import Navbar from './components/Navbar';
import SocialFeed from './components/SocialFeed';
import GraphCreator from './components/GraphCreator';
import GraphViewer from './components/GraphViewer';
import CreatorStudio from './components/CreatorStudio';
import Leaderboard from './components/Leaderboard';
import CreatorProfileView from './components/CreatorProfileView';
import { Graph, Folder, CreatorProfile, GraphComment, GraphCommentReply } from './types';
import { MOCK_GRAPHS, MOCK_PROFILES } from './data/mockData';
import { useUserAvatar } from '../stores/userAvatarStore';

// Safe LocalStorage loaders
function loadLocalStorage<T>(key: string, backup: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : backup;
  } catch (err) {
    console.error("Failed loading storage for key:", key, err);
    return backup;
  }
}

function AppContent({ navigate, defaultProfile }: { navigate?: (page: string) => void; defaultProfile: CreatorProfile }) {
  const [activeTab, setActiveTab] = useState<string>('feed');
  const [openNotifications, setOpenNotifications] = useState(false);

  const [currentUser, setCurrentUser] = useState<CreatorProfile>(() => 
    loadLocalStorage<CreatorProfile>('neutron_current_user', defaultProfile)
  );

  useEffect(() => {
    localStorage.setItem('neutron_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // States with persistent caches
  const [publicGraphs, setPublicGraphs] = useState<Graph[]>(() => 
    loadLocalStorage<Graph[]>('neutron_public_graphs', MOCK_GRAPHS)
  );
  
  const [myGraphs, setMyGraphs] = useState<Graph[]>(() => {
    // Standard initialization: user starts with their own local worksheets
    const cached = loadLocalStorage<Graph[]>('neutron_my_graphs', []);
    if (cached.length === 0) {
      // Seed initial private copy representing standard starting data
      const cloneSeeds = MOCK_GRAPHS.map(g => ({
        ...g,
        id: `my_${g.id}`,
        creatorId: defaultProfile.id,
        creatorName: defaultProfile.name,
        creatorAvatar: defaultProfile.avatar,
        creatorHandle: defaultProfile.handle,
        isPrivate: true,
        passwordProtected: false
      }));
      return cloneSeeds;
    }
    return cached;
  });

  const [profiles, setProfiles] = useState<CreatorProfile[]>(() => 
    loadLocalStorage<CreatorProfile[]>('neutron_creator_profiles', MOCK_PROFILES)
  );

  const [folders, setFolders] = useState<Folder[]>(() => 
    loadLocalStorage<Folder[]>('neutron_folders', [
      { id: 'fold_1', name: 'Web3 Analytics', color: '#00BFFF', createdAt: new Date().toISOString() },
      { id: 'fold_2', name: 'Biotech Sequences', color: '#00FF00', createdAt: new Date().toISOString() },
      { id: 'fold_3', name: 'Hedge Metrics', color: '#FFD700', createdAt: new Date().toISOString() }
    ])
  );

  // Focus Modal target
  const [selectedViewerGraph, setSelectedViewerGraph] = useState<Graph | null>(null);
  const [viewingCreatorId, setViewingCreatorId] = useState<string | null>(null);

  // Editor states
  const [isEditingInStudio, setIsEditingInStudio] = useState(false);
  const [editingStudioTarget, setEditingStudioTarget] = useState<Graph | null>(null);

  // Sync state mutations cleanly onto localStorage
  useEffect(() => {
    localStorage.setItem('neutron_public_graphs', JSON.stringify(publicGraphs));
  }, [publicGraphs]);

  useEffect(() => {
    localStorage.setItem('neutron_my_graphs', JSON.stringify(myGraphs));
  }, [myGraphs]);

  useEffect(() => {
    localStorage.setItem('neutron_creator_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('neutron_folders', JSON.stringify(folders));
  }, [folders]);

  // Synchronize viewer modal elements instantly if parent attributes change
  useEffect(() => {
    if (selectedViewerGraph) {
      const liveMatch = publicGraphs.find(g => g.id === selectedViewerGraph.id) 
        || myGraphs.find(g => g.id === selectedViewerGraph.id);
      if (liveMatch) {
        setSelectedViewerGraph(liveMatch);
      }
    }
  }, [publicGraphs, myGraphs]);

  // Social Core Mappings
  const handleLikeGraph = (graphId: string) => {
    const mutator = (list: Graph[]): Graph[] => 
      list.map(g => {
        if (g.id === graphId) {
          const activeLike = !g.isLikedByUser;
          return {
            ...g,
            likes: activeLike ? g.likes + 1 : Math.max(0, g.likes - 1),
            isLikedByUser: activeLike
          };
        }
        return g;
      });

    setPublicGraphs(prev => mutator(prev));
    setMyGraphs(prev => mutator(prev));
  };

  const handleFollowCreator = (creatorId: string) => {
    setProfiles(prev => 
      prev.map(p => {
        if (p.id === creatorId) {
          const follow = !p.isFollowing;
          return {
            ...p,
            followers: follow ? p.followers + 1 : Math.max(0, p.followers - 1),
            isFollowing: follow
          };
        }
        return p;
      })
    );
  };

  const handleAddComment = (graphId: string, comment: GraphComment) => {
    const mutator = (list: Graph[]): Graph[] =>
      list.map(g => {
        if (g.id === graphId) {
          return {
            ...g,
            commentsCount: g.commentsCount + 1,
            comments: [...g.comments, comment]
          };
        }
        return g;
      });

    setPublicGraphs(prev => mutator(prev));
    setMyGraphs(prev => mutator(prev));
  };

  const handleAddReply = (graphId: string, commentId: string, replyText: string) => {
    const freshReply: GraphCommentReply = {
      id: `rep_${Date.now()}`,
      creatorName: currentUser.name,
      creatorAvatar: currentUser.avatar,
      text: replyText,
      createdAt: new Date().toISOString(),
      likes: 0
    };

    const mutator = (list: Graph[]): Graph[] =>
      list.map(g => {
        if (g.id === graphId) {
          return {
            ...g,
            comments: g.comments.map(c => {
              if (c.id === commentId) {
                return {
                  ...c,
                  replies: [...(c.replies || []), freshReply]
                };
              }
              return c;
            })
          };
        }
        return g;
      });

    setPublicGraphs(prev => mutator(prev));
    setMyGraphs(prev => mutator(prev));
  };

  // Publisher Engine
  const handleSaveGraphOutput = (
    fields: Omit<Graph, 'id' | 'creatorId' | 'creatorName' | 'creatorAvatar' | 'creatorHandle' | 'uploadDate' | 'views' | 'likes' | 'commentsCount' | 'comments'> & { id?: string }
  ) => {
    const isNew = !fields.id;
    const targetId = fields.id || `g_usr_${Date.now()}`;
    const existingGraph = [...publicGraphs, ...myGraphs].find(g => g.id === targetId);

    const completeGraph: Graph = {
      id: targetId,
      title: fields.title,
      description: fields.description,
      category: fields.category,
      tags: fields.tags,
      isPrivate: fields.isPrivate,
      password: fields.password,
      passwordProtected: fields.passwordProtected,
      folderId: fields.folderId,
      type: fields.type,
      data: fields.data,
      seriesList: fields.seriesList,
      independentKey: fields.independentKey,
      themeColor: fields.themeColor,
      gridVisible: fields.gridVisible,
      dotVisible: fields.dotVisible,
      showValues: fields.showValues,
      isAreaGradient: fields.isAreaGradient,
      aiAnalysis: fields.aiAnalysis,
      sharedWith: existingGraph?.sharedWith || [],
      
      // Auto filled constants
      creatorId: existingGraph?.creatorId || currentUser.id,
      creatorName: existingGraph?.creatorName || currentUser.name,
      creatorAvatar: existingGraph?.creatorAvatar || currentUser.avatar,
      creatorHandle: existingGraph?.creatorHandle || currentUser.handle,
      uploadDate: existingGraph?.uploadDate || new Date().toISOString().split('T')[0],
      views: isNew ? 1 : (existingGraph?.views || 1),
      likes: isNew ? 0 : (existingGraph?.likes || 0),
      commentsCount: isNew ? 0 : (existingGraph?.commentsCount || 0),
      comments: isNew ? [] : (existingGraph?.comments || [])
    };

    // Update User workspace copy
    setMyGraphs(prev => {
      if (isNew) return [completeGraph, ...prev];
      const index = prev.findIndex(x => x.id === targetId);
      if (index >= 0) {
        return prev.map(x => x.id === targetId ? completeGraph : x);
      }
      return [completeGraph, ...prev];
    });

    // Handle Public Stream Registry
    if (!completeGraph.isPrivate) {
      setPublicGraphs(prev => {
        const index = prev.findIndex(x => x.id === targetId);
        if (index >= 0) {
          return prev.map(x => x.id === targetId ? completeGraph : x);
        }
        return [completeGraph, ...prev];
      });
    } else {
      // Evict from public streams directory if updated to private lock
      setPublicGraphs(prev => prev.filter(x => x.id !== targetId));
    }

    setIsEditingInStudio(false);
    setEditingStudioTarget(null);
    setActiveTab('studio');
  };

  const handleDeleteGraph = (graphId: string) => {
    const confirmation = window.confirm("Erase telemetry worksheet? This action cannot be reversed.");
    if (!confirmation) return;

    setMyGraphs(prev => prev.filter(g => g.id !== graphId));
    setPublicGraphs(prev => prev.filter(g => g.id !== graphId));
    
    if (selectedViewerGraph?.id === graphId) {
      setSelectedViewerGraph(null);
    }
  };

  const handleAddFolder = (folder: Folder) => {
    setFolders(prev => [...prev, folder]);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#00BFFF]/30 flex flex-col justify-between">
      
      {/* GLOWING HEADER */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsEditingInStudio(false);
          setEditingStudioTarget(null);
          setViewingCreatorId(null);
        }}
        openNotifications={openNotifications}
        setOpenNotifications={setOpenNotifications}
        currentUser={currentUser}
        allProfiles={[defaultProfile, ...profiles]}
        onSwitchUser={setCurrentUser}
        navigate={navigate}
      />

      {/* PRIMARY CONSOLE CANVAS */}
      <main id="primary-console-canvas" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" onClick={() => setOpenNotifications(false)}>
        
        {viewingCreatorId ? (
          <CreatorProfileView 
            creator={profiles.find(p => p.id === viewingCreatorId) || (viewingCreatorId === currentUser.id ? currentUser : profiles[0])}
            graphs={[...publicGraphs, ...myGraphs]}
            onBack={() => setViewingCreatorId(null)}
            onFollow={handleFollowCreator}
            onGraphSelect={(g) => setSelectedViewerGraph(g)}
          />
        ) : (
          <>
            {/* Dynamic Route/Tab switcher panel */}
            {activeTab === 'feed' && (
              <SocialFeed 
                publicGraphs={publicGraphs} 
                profiles={profiles}
                onGraphSelect={(g) => setSelectedViewerGraph(g)}
                onLikeGraph={handleLikeGraph}
                onFollowCreator={handleFollowCreator}
                onSelectCreator={setViewingCreatorId}
              />
            )}

            {activeTab === 'studio' && (
              isEditingInStudio ? (
                <GraphCreator 
                  folders={folders}
                  onSaveGraph={handleSaveGraphOutput}
                  editingGraph={editingStudioTarget}
                  onCancel={() => {
                    setIsEditingInStudio(false);
                    setEditingStudioTarget(null);
                  }}
                />
              ) : (
                <CreatorStudio 
                  myGraphs={myGraphs.filter(g => g.creatorId === currentUser.id)}
                  sharedWithMeGraphs={[...publicGraphs, ...myGraphs].filter(g => {
                    if (!g.sharedWith || g.sharedWith.length === 0) return false;
                    if (g.creatorId === currentUser.id) return false;
                    const handleText = currentUser.handle.toLowerCase();
                    const emailText = (currentUser.email || '').toLowerCase();
                    return g.sharedWith.some(shared => {
                      const s = shared.toLowerCase();
                      return s === handleText || (emailText && s === emailText);
                    });
                  })}
                  folders={folders}
                  currentProfile={currentUser}
                  allProfiles={[defaultProfile, ...profiles]}
                  onCreateNewGraph={() => {
                    setEditingStudioTarget(null);
                    setIsEditingInStudio(true);
                  }}
                  onEditGraph={(g) => {
                    setEditingStudioTarget(g);
                    setIsEditingInStudio(true);
                  }}
                  onDeleteGraph={handleDeleteGraph}
                  onAddFolder={handleAddFolder}
                  onUpdateGraphSharing={(graphId, sharedWith) => {
                    const updater = (list: Graph[]): Graph[] =>
                      list.map(g => g.id === graphId ? { ...g, sharedWith } : g);
                    setMyGraphs(prev => updater(prev));
                    setPublicGraphs(prev => updater(prev));
                  }}
                />
              )
            )}

            {activeTab === 'leaderboard' && (
              <Leaderboard 
                profiles={profiles}
                onFollowCreator={handleFollowCreator}
              />
            )}
          </>
        )}

      </main>

      {/* FULLSCREEN IMMERSIVE TARGET VIEWER DIALOG */}
      {selectedViewerGraph && (
        <GraphViewer 
          graph={selectedViewerGraph}
          currentProfile={defaultProfile}
          onClose={() => setSelectedViewerGraph(null)}
          onLikeGraph={handleLikeGraph}
          onAddComment={handleAddComment}
          onAddReply={handleAddReply}
          onSelectCreator={(creatorId) => {
            setViewingCreatorId(creatorId);
            setSelectedViewerGraph(null);
          }}
        />
      )}

      {/* FOOTER METADATA CODES */}
      <footer className="border-t border-white/5 bg-neutral-950/20 py-8 text-center text-[10px] font-mono text-neutral-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>NEUTRON GRAPHS © 2026</span>
          <span className="text-[#00BFFF]/30 uppercase tracking-widest">SECURE DATA TRANSFER MATRIX ACTIVE</span>
        </div>
      </footer>

    </div>
  );
}

export default function App({ navigate, user }: { navigate?: (page: string) => void; user?: any }) {
  const { avatar: globalAvatar, displayName: globalDisplayName, bio: globalBio } = useUserAvatar();
  const defaultProfile: CreatorProfile = user ? {
    id: user.uid || 'user_u1',
    name: globalDisplayName || user.username || 'Pratham',
    handle: user.handle || '@Pratham',
    avatar: globalAvatar || user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    email: user.email || 'pratham@neutron.app',
    bio: globalBio || user.bio || 'Exploring visual dimensions of decentralized data sets.',
    followers: user.stats?.followers || 1248,
    following: user.stats?.following || 582,
    totalViews: 45290,
    totalLikes: 8960,
  } : {
    id: 'user_u1',
    name: 'Epic Legend',
    handle: '@epiclegend',
    email: 'epiclegend766@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    bio: 'Lead Architect & Crypto Quant Analyst. Exploring visual dimensions of decentralized data sets.',
    followers: 1248,
    following: 582,
    totalViews: 45290,
    totalLikes: 8960,
  };
  return (
    <AnimationProvider>
      <AppContent navigate={navigate} defaultProfile={defaultProfile} />
    </AnimationProvider>
  );
}
