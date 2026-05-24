import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Users, User, MapPin as MapPinIcon, ChevronDown, Plus, Search, Hash, Menu, X } from 'lucide-react';
import GroupPanel from './GroupPanel';
import ProfilePanel from './ProfilePanel';
import MapView from './MapView';
import useStore from '../store/useStore';
import useProximityAlert from '../hooks/useProximityAlert';
import api from '../services/api';

export default function Dashboard() {
  const user = useStore((state) => state.user);
  const activeGroupId = useStore((state) => state.activeGroupId);
  const setActiveGroup = useStore((state) => state.setActiveGroup);
  const friendsLocations = useStore((state) => state.friendsLocations);
  const setFriendsLocations = useStore((state) => state.setFriendsLocations);
  const logout = useStore((state) => state.logout);
  
  const [groups, setGroups] = useState([]);
  const [sidebarView, setSidebarView] = useState('groups'); // groups | group-detail | profile
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [profile, setProfile] = useState(null);
  
  const { alert: proximityAlert, dismiss: dismissProximity } = useProximityAlert();
  
  // Fetch profile
  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/users/me');
      setProfile(data);
    } catch (err) {}
  };

  // Fetch groups
  const fetchGroups = async () => {
    try {
      const { data } = await api.get('/groups');
      setGroups(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch groups', err);
      return [];
    }
  };

  useEffect(() => {
    const init = async () => {
      const pendingInvite = sessionStorage.getItem('pendingInvite');
      
      if (pendingInvite) {
        try {
          const { data } = await api.post(`/groups/join/${pendingInvite}`);
          sessionStorage.removeItem('pendingInvite');
          setActiveGroup(data.group._id);
        } catch (err) {
          sessionStorage.removeItem('pendingInvite');
        }
      }

      const data = await fetchGroups();
      if (data.length > 0 && !activeGroupId && !pendingInvite) {
        setActiveGroup(data[0]._id);
      }
      fetchProfile();
    };
    init();
  }, []);

  // Fetch members for active group
  useEffect(() => {
    if (!activeGroupId) { setFriendsLocations([]); return; }
    
    const fetch = async () => {
      try {
        const { data } = await api.get(`/users/group/${activeGroupId}/locations`);
        setFriendsLocations(data);
      } catch (err) {}
    };
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, [activeGroupId]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const { data } = await api.post('/groups', { groupName: newGroupName.trim() });
      setGroups(prev => [...prev, data]);
      setActiveGroup(data._id);
      setNewGroupName('');
      setShowCreateGroup(false);
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    setJoinError('');
    setJoinSuccess('');
    try {
      const { data } = await api.post('/groups/join-code', { code: joinCode.trim() });
      setJoinSuccess(data.message);
      setJoinCode('');
      const refreshed = await fetchGroups();
      if (data.group) setActiveGroup(data.group._id);
      fetchProfile();
      setTimeout(() => setJoinSuccess(''), 3000);
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Failed to join');
      setTimeout(() => setJoinError(''), 3000);
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      await api.post(`/groups/${groupId}/leave`);
      setGroups(prev => prev.filter(g => g._id !== groupId));
      if (activeGroupId === groupId) {
        const remaining = groups.filter(g => g._id !== groupId);
        setActiveGroup(remaining.length > 0 ? remaining[0]._id : null);
      }
      setSidebarView('groups');
      fetchProfile();
    } catch (err) {}
  };

  const handleLogout = () => { logout(); };

  const activeGroupData = groups.find(g => g._id === activeGroupId);
  const filteredGroups = groups.filter(g => g.groupName.toLowerCase().includes(groupSearch.toLowerCase()));

  // Profile completion ring
  const completionPercent = profile?.completionPercent || 0;

  // Left sidebar content
  const renderSidebar = () => (
    <div className="flex flex-col h-full">
      {/* Profile Header */}
      <div className="p-4 border-b border-glass">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSidebarView('profile')}>
          <div className="relative">
            <div className="w-11 h-11 rounded-full border-2 border-neon-teal overflow-hidden">
              <img src={user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} alt="" className="w-full h-full object-cover bg-surface" />
            </div>
            {/* Completion ring */}
            <svg className="absolute -inset-1 w-[52px] h-[52px]" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="23" fill="none" stroke="rgba(107,122,153,0.2)" strokeWidth="2.5" />
              <circle cx="26" cy="26" r="23" fill="none" stroke="#00F5D4" strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray={`${completionPercent * 1.445} 200`}
                transform="rotate(-90 26 26)"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-sm text-primary truncate">{user?.username}</h3>
            <p className="text-[10px] font-mono text-neon-teal">{completionPercent}% complete</p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {sidebarView === 'groups' && (
          <motion.div key="groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col overflow-hidden">
            {/* Groups Header */}
            <div className="p-4 pb-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-sm text-primary">
                  My Groups <span className="text-neon-teal text-xs ml-1">{groups.length}</span>
                </h2>
                <button onClick={() => setShowCreateGroup(true)} className="w-7 h-7 rounded-lg bg-neon-teal/10 border border-neon-teal/30 flex items-center justify-center text-neon-teal hover:bg-neon-teal/20 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted w-3.5 h-3.5" />
                <input type="text" value={groupSearch} onChange={e => setGroupSearch(e.target.value)} placeholder="Search groups..." className="w-full bg-deep/50 border border-glass rounded-lg pl-8 pr-3 py-2 text-xs text-primary outline-none focus:border-neon-teal/50 transition-colors" />
              </div>

              {/* Join by Code */}
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted w-3.5 h-3.5" />
                  <input
                    type="text" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="AMG-XXXXXX"
                    className="w-full bg-deep/50 border border-glass rounded-lg pl-8 pr-3 py-2 text-xs text-primary outline-none focus:border-neon-teal/50 transition-colors font-mono tracking-wider"
                    maxLength={10}
                    onKeyDown={e => e.key === 'Enter' && handleJoinByCode()}
                  />
                </div>
                <button onClick={handleJoinByCode} disabled={!joinCode.trim()} className="px-3 py-2 bg-neon-teal/10 border border-neon-teal/30 rounded-lg text-neon-teal text-xs font-bold hover:bg-neon-teal/20 transition-colors disabled:opacity-40">
                  Join
                </button>
              </div>
              {joinError && <p className="text-[10px] text-neon-pink mb-1">{joinError}</p>}
              {joinSuccess && <p className="text-[10px] text-neon-teal mb-1">{joinSuccess}</p>}
            </div>

            {/* Group List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
              {filteredGroups.length === 0 ? (
                <div className="text-center py-8">
                  <MapPinIcon className="w-8 h-8 text-muted mx-auto mb-2" />
                  <p className="text-xs text-muted">{groupSearch ? 'No matching groups' : 'No groups yet'}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {filteredGroups.map(g => (
                    <button
                      key={g._id}
                      onClick={() => { setActiveGroup(g._id); setSidebarView('group-detail'); setShowMobileSidebar(false); }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all duration-200
                        ${g._id === activeGroupId 
                          ? 'bg-neon-teal/10 border border-neon-teal/30 text-neon-teal' 
                          : 'bg-deep/30 border border-transparent text-primary hover:bg-deep/50 hover:border-glass'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{g.groupName}</h4>
                        <p className="text-[10px] text-muted">{g.members?.length || 0} members</p>
                      </div>
                      {g.uniqueCode && (
                        <span className="text-[9px] font-mono text-muted bg-deep/50 px-1.5 py-0.5 rounded">{g.uniqueCode}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {sidebarView === 'group-detail' && (
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto">
            <div className="p-3">
              <button onClick={() => setSidebarView('groups')} className="text-xs text-muted hover:text-primary mb-3 flex items-center gap-1">
                ← All Groups
              </button>
            </div>
            <div className="px-3 pb-4">
              <GroupPanel
                friends={friendsLocations.filter(f => f._id !== user?._id)}
                activeGroup={activeGroupData}
                onRefreshGroups={fetchGroups}
                onLeaveGroup={() => handleLeaveGroup(activeGroupId)}
              />
            </div>
          </motion.div>
        )}

        {sidebarView === 'profile' && (
          <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto">
            <div className="p-3">
              <button onClick={() => setSidebarView('groups')} className="text-xs text-muted hover:text-primary mb-3 flex items-center gap-1">
                ← Back
              </button>
            </div>
            <div className="px-3 pb-4">
              <ProfilePanel onLogout={handleLogout} profile={profile} onProfileUpdate={fetchProfile} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="relative w-full h-full flex overflow-hidden">
      
      {/* Proximity Alert */}
      <AnimatePresence>
        {proximityAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] glass-panel rounded-2xl px-6 py-4 flex items-center gap-4 shadow-[0_0_40px_rgba(0,245,212,0.3)] border-neon-teal/50 cursor-pointer"
            onClick={dismissProximity}
          >
            <div className="w-12 h-12 rounded-full border-2 border-neon-teal overflow-hidden">
              <img src={proximityAlert.friendPhoto || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-primary font-display font-bold text-sm">Say hi to {proximityAlert.friendName}! 👋</p>
              <p className="text-neon-teal text-xs font-mono">{(proximityAlert.distanceKm * 1000).toFixed(0)}m away</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-deep/80 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setShowCreateGroup(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="glass-panel rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-display font-bold text-primary mb-4">Create New Group</h3>
              <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Group name..." className="neon-input mb-4" maxLength={30} autoFocus onKeyDown={e => e.key === 'Enter' && handleCreateGroup()} />
              <button onClick={handleCreateGroup} disabled={!newGroupName.trim()} className="neon-button-primary w-full disabled:opacity-50">Create Group</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop LEFT Sidebar */}
      <div className="hidden md:flex w-72 flex-col bg-surface/90 backdrop-blur-xl border-r border-glass shadow-2xl z-30">
        {renderSidebar()}
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative bg-deep">
        {/* Mobile hamburger */}
        <button onClick={() => setShowMobileSidebar(true)} className="md:hidden absolute top-4 left-4 z-20 w-10 h-10 rounded-lg glass-panel flex items-center justify-center text-muted hover:text-neon-teal transition-colors">
          <Menu className="w-5 h-5" />
        </button>

        {/* Active group badge */}
        <div className="absolute top-4 right-4 z-20 glass-panel px-3 py-1.5 rounded-full flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${activeGroupId ? 'bg-neon-teal' : 'bg-muted'}`} />
          <span className="font-display font-bold text-xs truncate max-w-[120px]">
            {activeGroupData ? activeGroupData.groupName : 'No Group'}
          </span>
        </div>

        <MapView friends={friendsLocations.filter(f => f._id !== user?._id)} />
      </div>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {showMobileSidebar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="md:hidden fixed inset-0 bg-deep/60 backdrop-blur-sm z-[1040]" onClick={() => setShowMobileSidebar(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="md:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-surface/95 backdrop-blur-xl border-r border-glass z-[1050] shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-glass">
                <h2 className="font-display font-bold text-primary text-sm">Amigos</h2>
                <button onClick={() => setShowMobileSidebar(false)} className="w-8 h-8 rounded-lg bg-deep/50 flex items-center justify-center text-muted hover:text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {renderSidebar()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
