import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, MapPin, Copy, Check, Search, Edit2, LogOut, MessageSquare, Mail, RefreshCw } from 'lucide-react';
import useStore from '../store/useStore';
import api from '../services/api';

export default function GroupPanel({ friends, activeGroup, onRefreshGroups, onLeaveGroup }) {
  const user = useStore((state) => state.user);
  const activeGroupId = useStore((state) => state.activeGroupId);
  const distances = useStore((state) => state.distances);
  
  const [inviteData, setInviteData] = useState(null); // { link, code }
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  const isAdmin = activeGroup?.admin?._id === user?._id || activeGroup?.admin === user?._id;

  const handleInvite = async () => {
    if (!activeGroupId) return;
    setError('');
    try {
      const { data } = await api.post(`/groups/${activeGroupId}/invite`);
      setInviteData({ link: data.inviteLink, code: data.uniqueCode });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate invite');
    }
  };

  const handleRegenerateCode = async () => {
    if (!activeGroupId || !isAdmin) return;
    try {
      const { data } = await api.put(`/groups/${activeGroupId}/code`);
      setInviteData(prev => prev ? { ...prev, code: data.uniqueCode } : null);
      onRefreshGroups?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to regenerate code');
    }
  };

  const handleRename = async () => {
    if (!newName.trim()) return;
    try {
      await api.put(`/groups/${activeGroupId}/rename`, { groupName: newName.trim() });
      setIsRenaming(false);
      setNewName('');
      onRefreshGroups?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to rename');
    }
  };

  // Format distance for display
  const formatDistance = (km) => {
    if (km == null) return null;
    if (km < 1) return `${(km * 1000).toFixed(0)}m`;
    if (km < 10) return `${km.toFixed(1)}km`;
    return `${Math.round(km)}km`;
  };

  // Filter friends by search
  const filteredFriends = friends.filter(f => 
    f.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const item = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const getInviteMessage = () => {
    if (!inviteData) return '';
    return `${user?.username || 'Your friend'} wants to make you a friend and invite you to his friend group. Please click the link below to join. After signing in, enter this unique code to enter his friend room: ${inviteData.code}\n\nLink: ${inviteData.link}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getInviteMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeGroupId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <MapPin className="w-12 h-12 text-muted mb-4" />
        <h3 className="text-lg font-display font-bold text-primary mb-2">No Group Selected</h3>
        <p className="text-sm text-muted mb-6">Create or join a group to start tracking friends.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Group Header */}
      <div className="flex justify-between items-center mb-4">
        {isRenaming ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="New name..."
              className="neon-input text-sm flex-1"
              maxLength={30}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleRename()}
            />
            <button onClick={handleRename} className="p-1.5 bg-neon-teal text-deep rounded">
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <h2 className="text-xl font-display font-bold text-primary flex items-center gap-2">
            Members <span className="bg-deep text-neon-teal text-xs px-2 py-0.5 rounded-full">{friends.length + 1}</span>
            {isAdmin && (
              <button onClick={() => { setIsRenaming(true); setNewName(activeGroup?.groupName || ''); }} className="p-1 text-muted hover:text-neon-teal transition-colors">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </h2>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search members..."
          className="w-full bg-deep/50 border border-glass rounded-lg pl-9 pr-4 py-2 text-sm text-primary outline-none focus:border-neon-teal/50 transition-colors"
        />
      </div>

      {error && (
        <div className="mb-3 text-xs text-neon-pink bg-neon-pink/10 py-2 px-3 rounded">{error}</div>
      )}

      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar">
        {/* You */}
        <motion.div variants={item} className="p-3 bg-deep/40 border border-glass rounded-xl flex items-center gap-4 hover:border-l-2 hover:border-l-neon-teal transition-all duration-200">
          <div className="relative">
            <div className="w-11 h-11 rounded-full border-2 border-neon-teal overflow-hidden">
              <img src={user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Me'}`} alt="Me" className="w-full h-full bg-surface" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-display font-bold text-sm text-primary">You</h4>
            <p className="text-xs text-muted truncate">📍 Current Location</p>
          </div>
        </motion.div>

        {/* Friends */}
        {filteredFriends.map((friend) => {
          const dist = distances[friend._id];
          const distLabel = formatDistance(dist);
          
          return (
            <motion.div 
              key={friend._id}
              variants={item} 
              className="p-3 bg-deep/40 border border-glass rounded-xl flex items-center gap-3 hover:border-l-2 hover:border-l-neon-teal transition-all duration-200 cursor-pointer"
            >
              <div className="relative">
                <div className={`w-11 h-11 rounded-full border-2 overflow-hidden ${friend.isOnline ? 'border-neon-teal' : 'border-muted grayscale opacity-70'}`}>
                  <img src={friend.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} alt={friend.username} className="w-full h-full bg-surface object-cover" />
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface ${friend.isOnline ? 'bg-neon-teal' : 'bg-muted'}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-display font-bold text-sm text-primary truncate pr-2">{friend.username}</h4>
                  <span className="text-[10px] font-mono text-muted whitespace-nowrap">
                    {friend.lastSeen ? new Date(friend.lastSeen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                  </span>
                </div>
                <p className="text-xs text-muted truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 flex-shrink-0" /> {friend.currentLocation?.address || 'Location unknown'}
                </p>
              </div>

              {/* Distance Badge */}
              {distLabel && (
                <div className="flex-shrink-0 bg-deep border border-neon-teal/30 rounded-lg px-2 py-1">
                  <span className="text-neon-teal text-xs font-mono font-bold">{distLabel}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Bottom Actions */}
      <div className="pt-4 pb-2 mt-auto flex flex-col gap-2">
        {inviteData ? (
          <div className="flex flex-col gap-2 p-3 bg-deep/50 border border-glass rounded-xl">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Group Code</span>
              {isAdmin && (
                <button onClick={handleRegenerateCode} className="text-[10px] text-neon-teal flex items-center gap-1 hover:text-white transition-colors">
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </button>
              )}
            </div>
            <div className="font-mono text-lg text-neon-teal tracking-widest mb-3">{inviteData.code}</div>
            
            <p className="text-[10px] text-muted mb-2 leading-relaxed line-clamp-3">
              "{user?.username} wants to make you a friend and invite you to his friend group..."
            </p>

            <div className="grid grid-cols-2 gap-2">
              <a 
                href={`https://wa.me/?text=${encodeURIComponent(getInviteMessage())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-lg flex items-center justify-center gap-2 font-medium text-[11px] transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
              </a>
              <a
                href={`sms:?body=${encodeURIComponent(getInviteMessage())}`}
                className="w-full py-2 bg-primary text-deep rounded-lg flex items-center justify-center gap-2 font-medium text-[11px] hover:bg-white transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" /> SMS
              </a>
              <a
                href={`mailto:?subject=Join my Amigos group&body=${encodeURIComponent(getInviteMessage())}`}
                className="w-full py-2 bg-surface border border-glass text-primary rounded-lg flex items-center justify-center gap-2 font-medium text-[11px] hover:border-neon-teal/50 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" /> Email
              </a>
              <button onClick={handleCopy} className={`w-full py-2 border rounded-lg flex items-center justify-center gap-2 font-medium text-[11px] transition-colors ${copied ? 'border-neon-teal text-neon-teal bg-neon-teal/10' : 'border-glass text-muted hover:text-primary hover:border-primary/50'}`}>
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={handleInvite} className="w-full py-3 border border-dashed border-muted rounded-xl flex items-center justify-center gap-2 text-muted hover:text-neon-teal hover:border-neon-teal hover:bg-neon-teal/5 transition-all duration-300">
            <UserPlus className="w-4 h-4" />
            <span className="font-medium text-sm">Invite Friends</span>
          </button>
        )}

        <button onClick={onLeaveGroup} className="w-full py-2 mt-1 text-xs text-muted hover:text-neon-pink transition-colors flex items-center justify-center gap-2">
          <LogOut className="w-3.5 h-3.5" /> Leave Group
        </button>
      </div>
    </div>
  );
}
