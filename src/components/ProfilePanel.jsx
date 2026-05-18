import { useState, useRef } from 'react';
import { Camera, Edit2, LogOut, Check, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import api from '../services/api';

export default function ProfilePanel({ onLogout, profile, onProfileUpdate }) {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  
  const [username, setUsername] = useState(user?.username || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef(null);

  const handleSave = async () => {
    if (!username.trim()) return;
    try {
      const { data } = await api.put('/users/profile', { username: username.trim() });
      setUser({ ...user, username: data.username });
      setIsEditing(false);
      setIsSaved(true);
      if (onProfileUpdate) onProfileUpdate();
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handlePhotoClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Compress and convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const maxSize = 200; // max width/height
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/webp', 0.8);
        
        try {
          const { data } = await api.put('/users/profile', { profilePhoto: dataUrl });
          setUser({ ...user, profilePhoto: data.profilePhoto });
          if (onProfileUpdate) onProfileUpdate();
        } catch (err) {
          console.error('Failed to upload photo:', err);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full items-center py-4">
      {/* Avatar Section */}
      <div className="relative mb-6 group cursor-pointer" onClick={handlePhotoClick}>
        <div className="w-28 h-28 rounded-full border-4 border-surface shadow-[0_0_30px_rgba(0,245,212,0.3)] overflow-hidden bg-deep relative z-10 transition-transform duration-300 group-hover:scale-105">
          <img src={user?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Me'}`} alt="Profile" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-[-4px] rounded-full bg-gradient-to-tr from-neon-teal to-deep opacity-50 blur-md z-0 animate-pulse-slow" />
        <div className="absolute inset-0 bg-deep/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <Camera className="w-7 h-7 text-white" />
        </div>
      </div>
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* Username Section */}
      <div className="w-full max-w-xs mb-6">
        <div className="flex justify-between items-end mb-1">
          <label className="text-xs font-mono text-muted uppercase tracking-widest">Callsign</label>
          {isEditing && (
            <span className={`text-[10px] font-mono ${username.length > 20 ? 'text-neon-pink' : 'text-muted'}`}>
              {username.length}/20
            </span>
          )}
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={!isEditing}
            className={`w-full bg-deep/50 border-b-2 px-3 py-2 text-lg font-display text-primary transition-colors outline-none
              ${isEditing ? 'border-neon-teal' : 'border-muted'}
              ${!isEditing && 'opacity-80 cursor-default'}`}
          />
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-neon-teal transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleSave}
              disabled={username.length === 0 || username.length > 20}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 bg-neon-teal text-deep rounded-md hover:bg-neon-teal/80 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {isSaved && (
          <motion.div 
            initial={{ opacity: 1, scale: 0.9 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.5 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-neon-teal/20 rounded-lg pointer-events-none"
          />
        )}
      </div>

      {/* User Info */}
      <div className="w-full max-w-xs space-y-3 mb-8">
        <div className="flex items-center gap-3 text-sm">
          <Mail className="w-4 h-4 text-muted flex-shrink-0" />
          <span className="text-primary truncate">{user?.email || 'No email'}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Phone className="w-4 h-4 text-muted flex-shrink-0" />
          <span className="text-primary truncate">{user?.phoneNumber || 'No phone'}</span>
        </div>
      </div>

      <div className="w-full mt-auto flex flex-col gap-3">
        <button onClick={onLogout} className="neon-button-danger w-full flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
