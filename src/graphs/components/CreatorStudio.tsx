import React, { useState } from 'react';
import { useAnimations } from '../context/AnimationContext';
import { Graph, Folder, CreatorProfile } from '../types';
import { 
  Plus, Lock, Globe, Edit3, Trash2, Shield, Sparkles,
  Users, UserPlus, X, Check, Mail, Key, UserCheck, Search, ShieldCheck
} from 'lucide-react';
import NeutronLogo from './NeutronLogo';

interface CreatorStudioProps {
  myGraphs: Graph[];
  sharedWithMeGraphs?: Graph[]; 
  folders: Folder[];
  currentProfile: CreatorProfile;
  allProfiles: CreatorProfile[]; 
  onEditGraph: (graph: Graph) => void;
  onDeleteGraph: (graphId: string) => void;
  onAddFolder: (folder: Folder) => void;
  onCreateNewGraph: () => void;
  onUpdateGraphSharing: (graphId: string, sharedWith: string[]) => void;
}

export default function CreatorStudio({ 
  myGraphs, 
  sharedWithMeGraphs = [],
  folders, 
  currentProfile, 
  allProfiles,
  onEditGraph, 
  onDeleteGraph, 
  onAddFolder,
  onCreateNewGraph,
  onUpdateGraphSharing
}: CreatorStudioProps) {
  const { animationsEnabled } = useAnimations();

  // Selected Graph for sharing controls modal
  const [sharingGraph, setSharingGraph] = useState<Graph | null>(null);
  const [collabInput, setCollabInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Local copy of sharing list during modal interaction
  const [localSharedWith, setLocalSharedWith] = useState<string[]>([]);

  const openSharingModal = (graph: Graph) => {
    setSharingGraph(graph);
    setLocalSharedWith(graph.sharedWith || []);
    setCollabInput('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleAddCollaborator = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;

    // Check if duplicate
    if (localSharedWith.some(x => x.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('Identifier already tagged for this workbook.');
      return;
    }

    // Self prevention
    const myHandle = currentProfile.handle.toLowerCase();
    const myEmail = (currentProfile.email || '').toLowerCase();
    if (trimmed.toLowerCase() === myHandle || (myEmail && trimmed.toLowerCase() === myEmail)) {
      setErrorMsg('You cannot share a graph with yourself (you already have master edit rights).');
      return;
    }

    setLocalSharedWith(prev => [...prev, trimmed]);
    setCollabInput('');
    setErrorMsg('');
    setSuccessMsg('Collaborator added! Click Save Permissions to apply.');
  };

  const handleRemoveCollaborator = (target: string) => {
    setLocalSharedWith(prev => prev.filter(x => x !== target));
    setErrorMsg('');
    setSuccessMsg('Collaborator deleted. Click Save Permissions to apply.');
  };

  const handleSaveSharing = () => {
    if (!sharingGraph) return;
    onUpdateGraphSharing(sharingGraph.id, localSharedWith);
    setSuccessMsg('Permissions successfully updated and synchronized onto secure ledger!');
    setTimeout(() => {
      setSharingGraph(null);
    }, 1200);
  };

  // Filter possible collaborators from profiles (excluding ourselves)
  const suggestions = allProfiles.filter(p => {
    const isMe = p.id === currentProfile.id;
    if (isMe) return false;
    
    // Check if already in the shared list
    const inSharedList = localSharedWith.some(s => 
      s.toLowerCase() === p.handle.toLowerCase() || 
      (p.email && s.toLowerCase() === p.email.toLowerCase())
    );
    if (inSharedList) return false;

    const searchTerm = collabInput.toLowerCase();
    if (!searchTerm) return true; // Show all suggestion chips when empty

    return (
      p.name.toLowerCase().includes(searchTerm) ||
      p.handle.toLowerCase().includes(searchTerm) ||
      (p.email && p.email.toLowerCase().includes(searchTerm))
    );
  });

  return (
    <div className="space-y-8 text-left">
      
      {/* Visual Workspace Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900/65 to-neutral-950/80 border border-white/5 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00BFFF]/5 blur-3xl rounded-full translate-x-12 -translate-y-12 pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10 w-full sm:w-auto">
          <div className="p-3 bg-neutral-950/50 border border-white/5 rounded-2xl flex items-center justify-center shrink-0 shadow-lg select-none">
            <NeutronLogo className="w-14 h-14" glow={true} />
          </div>
          <div className="space-y-2.5 max-w-lg text-left">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#00BFFF]/10 border border-[#00BFFF]/20 text-[10px] font-mono tracking-widest text-[#00BFFF] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00BFFF] animate-pulse"></span>
              <span>SECURE STUDIO workspace active</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              My Creative Data Cabin
            </h1>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              Design private and public databases, arrange worksheets, and tag trusted collaborators. Grant edit privileges seamlessly to any handle or gmail.
            </p>
          </div>
        </div>
      </div>

      {/* User's private graphs grid list */}
      <div className="space-y-5">
        <div className="flex justify-between items-center text-left">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00BFFF] flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-blue-400" />
            SECURED SHEETS CATALOG ({myGraphs.length})
          </span>
          <button
            id="studio-create-shortcut-btn"
            onClick={onCreateNewGraph}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-[#00BFFF] text-neutral-950 hover:bg-[#00BFFF]/90 rounded-xl text-xs font-bold uppercase text-glow cursor-pointer"
          >
            <Plus className="w-4 h-4" /> <span>Create New Graph</span>
          </button>
        </div>

        {/* Catalog grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myGraphs.length === 0 ? (
            <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-2xl bg-neutral-900/5">
              <p className="text-neutral-500 text-xs font-mono mb-2 uppercase tracking-widest">No private workbooks registered</p>
              <p className="text-neutral-600 text-xs font-sans">Initialize telemetry graphs by pressing &quot;Create New Graph&quot; above.</p>
            </div>
          ) : (
            myGraphs.map(graph => (
              <div
                key={graph.id}
                id={`private-graph-row-${graph.id}`}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all flex flex-col justify-between hover:border-[#00BFFF]/20 hover:bg-white/[0.03]"
              >
                <div className="space-y-3.5">
                  {/* Scope header indicators */}
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono tracking-wider text-neutral-500 uppercase">
                      {graph.category} // {graph.type}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {graph.isPrivate ? (
                        <div className="flex items-center space-x-1 text-pink-400 text-[8.5px] font-mono uppercase bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-lg font-bold">
                          <Lock className="w-2.5 h-2.5" /> <span>Private Lock</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-[#00BFFF] text-[8.5px] font-mono uppercase bg-[#00BFFF]/10 border border-[#00BFFF]/20 px-2 py-0.5 rounded-lg font-bold">
                          <Globe className="w-2.5 h-2.5" /> <span>Public</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & metrics preview block */}
                  <div className="text-left space-y-2">
                    <h3 className="text-sm font-extrabold text-white tracking-wide truncate group-hover:text-[#00BFFF] transition-colors">
                      {graph.title}
                    </h3>
                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed min-h-[32px]">
                      {graph.description}
                    </p>
                  </div>

                  {/* Shared users display row */}
                  {graph.sharedWith && graph.sharedWith.length > 0 && (
                    <div className="space-y-1 border-t border-white/[0.03] pt-2">
                      <div className="text-[8.5px] font-mono text-neutral-500 uppercase flex items-center gap-1.5 font-bold">
                        <UserCheck className="w-3 h-3 text-[#00BFFF]" /> Shared Collaborators:
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        {graph.sharedWith.map((user, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center px-1.5 py-0.5 bg-[#00BFFF]/10 border border-[#00BFFF]/15 text-[#00BFFF] rounded text-[8.5px] font-mono transition-all"
                          >
                            <span>{user}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Core stats metrics */}
                  <div className="p-3 bg-neutral-950/90 rounded-xl border border-white/5 flex justify-between text-center">
                    <div>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase block font-semibold">Samples</span>
                      <span className="text-xs font-mono font-bold text-neutral-200 block mt-0.5">{graph.data.length} pts</span>
                    </div>
                    <div className="border-l border-white/5" />
                    <div>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase block font-semibold">Subseries</span>
                      <span className="text-xs font-mono font-bold text-neutral-200 block mt-0.5">{graph.seriesList.length} cols</span>
                    </div>
                    <div className="border-l border-white/5" />
                    <div>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase block font-semibold">AI Cached</span>
                      <span className={`text-[10px] font-mono font-bold uppercase block mt-0.5 ${graph.aiAnalysis ? 'text-[#00BFFF]' : 'text-neutral-500'}`}>
                        {graph.aiAnalysis ? 'Ready' : 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operations tools foot row */}
                <div className="pt-3.5 border-t border-white/5 mt-4 flex justify-between items-center flex-wrap gap-2">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase">
                    Added: {graph.uploadDate}
                  </span>

                  <div className="flex space-x-1.5">
                    {/* Access Manager Trigger Button */}
                    <button
                      id={`share-btn-${graph.id}`}
                      onClick={() => openSharingModal(graph)}
                      className="p-1 px-2.5 rounded-lg bg-[#00BFFF]/10 border border-[#00BFFF]/25 text-[#00BFFF] hover:bg-[#00BFFF]/20 transition-all text-xs flex items-center space-x-1 cursor-pointer font-bold"
                      title="Tag people to grant shared edit access"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> <span className="text-[10px] font-mono">ACCESS</span>
                    </button>
                    <button
                      id={`edit-graph-${graph.id}`}
                      onClick={() => onEditGraph(graph)}
                      className="p-1 px-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/[0.12] hover:bg-white/[0.04] text-neutral-300 hover:text-white transition-all text-xs flex items-center space-x-1 cursor-pointer"
                      title="Open editor studio for corrections"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> <span className="text-[10px] font-mono">EDIT</span>
                    </button>
                    <button
                      id={`delete-graph-${graph.id}`}
                      onClick={() => onDeleteGraph(graph.id)}
                      className="p-1 rounded-lg border border-transparent hover:border-pink-900/30 hover:bg-pink-500/5 text-neutral-500 hover:text-pink-500 transition-all cursor-pointer"
                      title="Erase telemetry worksheet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Shared With Me Workspace Section */}
      <div className="space-y-5 pt-4 border-t border-white/5">
        <div className="text-left">
          <span className="text-[10px] font-mono font-black uppercase tracking-widest text-purple-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            SHARED WITH ME / COLLABORATION WORKSPACES ({sharedWithMeGraphs.length})
          </span>
          <p className="text-xs text-neutral-400 font-sans mt-1">
            Graphs created by other scientists where your username or email has been assigned edit permissions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sharedWithMeGraphs.length === 0 ? (
            <div className="col-span-full py-16 text-center border border-dashed border-white/5 rounded-2xl bg-neutral-900/5">
              <p className="text-neutral-500 text-xs font-mono mb-2 uppercase tracking-widest">No shared workspaces detected</p>
              <p className="text-neutral-600 text-xs font-sans">
                When other users tag your handle (<span className="text-[#00BFFF] font-mono">{currentProfile.handle}</span>) or gmail, the interactive workbook will pop up here with real-time EDIT rights.
              </p>
            </div>
          ) : (
            sharedWithMeGraphs.map(graph => (
              <div
                key={graph.id}
                id={`shared-graph-row-${graph.id}`}
                className="group relative overflow-hidden rounded-2xl border border-purple-900/10 bg-purple-950/[0.02] p-5 transition-all flex flex-col justify-between hover:border-purple-500/30 hover:bg-purple-950/[0.05]"
              >
                <div className="space-y-3.5 text-left">
                  {/* Scope header indicators */}
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono tracking-wider text-purple-400 uppercase">
                      Shared by {graph.creatorName} ({graph.creatorHandle})
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <div className="flex items-center space-x-1 text-purple-300 text-[8.5px] font-mono uppercase bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 rounded-lg font-bold">
                        <ShieldCheck className="w-2.5 h-2.5" /> <span>Edit Rights</span>
                      </div>
                    </div>
                  </div>

                  {/* Title & metrics preview block */}
                  <div className="text-left space-y-2">
                    <h3 className="text-sm font-extrabold text-white tracking-wide truncate group-hover:text-purple-450 transition-colors">
                      {graph.title}
                    </h3>
                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed min-h-[32px]">
                      {graph.description}
                    </p>
                  </div>

                  {/* Creator badge */}
                  <div className="flex items-center space-x-2.5 bg-neutral-950 p-2 rounded-xl border border-white/5">
                    <img
                      src={graph.creatorAvatar}
                      alt={graph.creatorName}
                      className="w-7 h-7 rounded-md border border-white/5 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-neutral-200 block leading-tight">{graph.creatorName}</span>
                      <span className="text-[9px] font-mono text-purple-450 leading-none">{graph.creatorHandle}</span>
                    </div>
                  </div>

                  {/* Core stats metrics */}
                  <div className="p-3 bg-neutral-950/90 rounded-xl border border-white/5 flex justify-between text-center">
                    <div>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase block font-semibold">Samples</span>
                      <span className="text-xs font-mono font-bold text-neutral-200 block mt-0.5">{graph.data.length} pts</span>
                    </div>
                    <div className="border-l border-white/5" />
                    <div>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase block font-semibold">Subseries</span>
                      <span className="text-xs font-mono font-bold text-neutral-200 block mt-0.5">{graph.seriesList.length} cols</span>
                    </div>
                    <div className="border-l border-white/5" />
                    <div>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase block font-semibold">Security</span>
                      <span className="text-[9px] font-mono font-bold uppercase block mt-0.5 text-purple-400">Collaborator</span>
                    </div>
                  </div>
                </div>

                {/* Operations tools foot row */}
                <div className="pt-3.5 border-t border-white/5 mt-4 flex justify-between items-center">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase">
                    Author: {graph.uploadDate}
                  </span>

                  <div className="flex space-x-2">
                    <button
                      id={`edit-shared-graph-${graph.id}`}
                      onClick={() => onEditGraph(graph)}
                      className="p-1 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/25 hover:border-purple-500/50 hover:bg-purple-500/20 text-purple-200 hover:text-white transition-all text-xs flex items-center space-x-1 cursor-pointer font-bold"
                      title="Edit this workbook shared with you"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-purple-450" /> <span className="text-[10px] font-mono">EDIT WORKBOOK</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FULL SHIELD COLLABORATOR GATE/MODAL */}
      {sharingGraph && (
        <div 
          className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 text-left" 
          onClick={() => setSharingGraph(null)}
        >
          <div 
            className="w-full max-w-lg bg-neutral-900/95 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-fadeIn relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-[#00BFFF]" />
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-sans leading-none">
                    Collaborator Access Gate
                  </h3>
                  <p className="text-[10px] font-mono text-neutral-400 mt-1 leading-none">
                    Workbook ID: {sharingGraph.id}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSharingGraph(null)}
                className="p-1.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.05] text-neutral-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Information banner */}
            <div className="p-3.5 bg-neutral-950 rounded-xl border border-white/5 space-y-1">
              <span className="text-[9px] font-mono text-neutral-500 uppercase block font-semibold">Active target</span>
              <p className="text-xs font-bold text-white leading-tight">{sharingGraph.title}</p>
              <p className="text-[10px] text-neutral-400 leading-normal line-clamp-1">{sharingGraph.description}</p>
            </div>

            {/* Form Input tagging */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider font-semibold">
                Tag trusted collaborator (Gmail or Handler name)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    value={collabInput}
                    onChange={(e) => {
                      setCollabInput(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="e.g. aria@neutron.com or @aria_t"
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-white/5 rounded-xl text-xs font-mono placeholder:text-neutral-600 focus:outline-none focus:border-[#00BFFF]/50"
                  />
                </div>
                <button
                  onClick={() => handleAddCollaborator(collabInput)}
                  className="px-4 bg-[#00BFFF] hover:bg-[#00BFFF]/90 text-neutral-950 font-mono text-xs font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" /> <span>Add</span>
                </button>
              </div>

              {/* Suggestions Grid */}
              {collabInput && suggestions.length > 0 && (
                <div className="bg-neutral-950/90 border border-white/5 rounded-xl p-2.5 space-y-1.5 max-h-40 overflow-y-auto">
                  <div className="text-[8.5px] font-mono text-neutral-500 uppercase">SUGGESTED PROFILE HITS:</div>
                  <div className="space-y-1">
                    {suggestions.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          // Prioritize handle, fallback to email
                          handleAddCollaborator(p.handle);
                        }}
                        className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <img src={p.avatar} alt={p.name} className="w-5 h-5 rounded-md object-cover" />
                          <div className="text-left leading-tight">
                            <span className="font-bold text-white block">{p.name}</span>
                            <span className="text-[9px] font-mono text-[#00BFFF]">{p.handle}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-neutral-500 hover:text-white px-2 py-0.5 rounded border border-white/5 bg-white/[0.01]">
                          Tag handle
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Default suggest chips when input is empty */}
              {!collabInput && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[8.5px] font-mono text-neutral-500 uppercase block font-semibold">QUICK TEAM LIST:</span>
                  <div className="flex flex-wrap gap-2">
                    {allProfiles.filter(p => p.id !== currentProfile.id).map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleAddCollaborator(p.handle)}
                        className="px-2.5 py-1 rounded-lg border border-white/5 bg-white/[0.02] hover:border-[#00BFFF]/20 hover:bg-[#00BFFF]/5 text-xs text-neutral-300 hover:text-white transition-all text-left flex items-center space-x-1.5 cursor-pointer font-sans"
                      >
                        <img src={p.avatar} alt={p.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                        <span className="font-semibold text-[10px]">{p.name}</span>
                        <span className="text-[8px] font-mono text-[#00BFFF]">{p.handle}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Current Access Lists */}
            <div className="space-y-2 border-t border-white/5 pt-4">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider font-semibold block">
                Access Authorization List ({localSharedWith.length})
              </span>
              
              {localSharedWith.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-white/5 rounded-xl bg-neutral-950/20">
                  <p className="text-[10px] font-mono text-neutral-500 uppercase">Master account lock active</p>
                  <p className="text-[11px] text-neutral-600 font-sans mt-0.5">Only you can edit this telemetry Workbook.</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {localSharedWith.map((userOrMail) => {
                    const matchedProfile = allProfiles.find(p => 
                      p.handle.toLowerCase() === userOrMail.toLowerCase() || 
                      (p.email && p.email.toLowerCase() === userOrMail.toLowerCase())
                    );
                    return (
                      <div 
                        key={userOrMail} 
                        className="flex items-center justify-between p-2.5 bg-neutral-950 border border-white/5 rounded-xl text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          {matchedProfile ? (
                            <img src={matchedProfile.avatar} alt={matchedProfile.name} className="w-5 h-5 rounded-md object-cover" />
                          ) : (
                            <div className="w-5 h-5 rounded-md bg-neutral-900 border border-white/5 flex items-center justify-center font-mono text-[9px] text-[#00BFFF]">
                              @
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-white block">{matchedProfile ? matchedProfile.name : userOrMail}</span>
                            <span className="text-[9.5px] font-mono text-neutral-500">{matchedProfile ? matchedProfile.handle : 'External Email Grant'}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveCollaborator(userOrMail)}
                          className="p-1 text-neutral-500 hover:text-pink-500 hover:bg-pink-500/5 border border-transparent hover:border-pink-500/15 rounded-lg cursor-pointer"
                          title="Revoke access"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Message prompts */}
            {errorMsg && (
              <div className="p-3 bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs rounded-xl font-mono leading-tight">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-mono leading-tight">
                {successMsg}
              </div>
            )}

            {/* Action controls */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSharingGraph(null)}
                className="flex-1 py-2.5 bg-white/[0.01] hover:bg-white/[0.05] border border-white/10 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer text-center"
              >
                Close Gateway
              </button>
              <button
                onClick={handleSaveSharing}
                className="flex-1 py-2.5 bg-[#00BFFF] hover:bg-[#00BFFF]/90 text-neutral-950 text-xs font-mono font-extrabold uppercase rounded-xl transition-all text-glow shadow-[0_0_15px_rgba(0,191,255,0.2)] cursor-pointer text-center"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
