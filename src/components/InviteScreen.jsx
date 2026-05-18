import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Users, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '../services/api';
import useStore from '../store/useStore';

export default function InviteScreen() {
  const { token } = useParams();
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const setActiveGroupId = useStore((state) => state.setActiveGroupId);

  const [inviteDetails, setInviteDetails] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const { data } = await api.get(`/groups/invite/${token}`);
        setInviteDetails(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load invite details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvite();
  }, [token]);

  const handleJoin = async () => {
    if (!user) {
      sessionStorage.setItem('pendingInvite', token);
      navigate('/');
      return;
    }

    setIsJoining(true);
    try {
      const { data } = await api.post(`/groups/join/${token}`);
      // data.group contains the joined group
      setActiveGroupId(data.group._id);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join group');
      setIsJoining(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center bg-deep p-4">
      {/* Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface via-deep to-deep" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel w-full max-w-md rounded-2xl p-8 z-10 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-surface border border-neon-teal/50 flex items-center justify-center shadow-[0_0_20px_rgba(0,245,212,0.2)] mx-auto mb-6">
          <MapPin className="text-neon-teal w-8 h-8 animate-pulse-slow" />
        </div>

        {isLoading ? (
          <p className="text-neon-teal animate-pulse">Scanning frequencies...</p>
        ) : error ? (
          <div className="flex flex-col items-center">
            <AlertTriangle className="text-neon-pink w-12 h-12 mb-4" />
            <h2 className="text-2xl font-display font-bold text-primary mb-2">Signal Lost</h2>
            <p className="text-muted text-sm mb-6">{error}</p>
            <button onClick={() => navigate('/')} className="neon-button-primary w-full">Return to Base</button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-display font-bold text-primary mb-2">Group Invitation</h2>
            <p className="text-muted text-sm mb-6">You've been invited to join coordinates for:</p>
            
            <div className="bg-surface/50 border border-glass rounded-xl p-4 w-full mb-6 flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-full border-2 border-neon-teal overflow-hidden flex-shrink-0">
                <img src={inviteDetails.creatorPhoto} alt={inviteDetails.createdBy} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-display font-bold text-primary truncate max-w-[200px]">{inviteDetails.groupName}</h3>
                <p className="text-xs text-muted">Invited by <span className="text-neon-teal">{inviteDetails.createdBy}</span></p>
              </div>
            </div>

            <button 
              onClick={handleJoin}
              disabled={isJoining}
              className="neon-button-primary w-full flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isJoining ? 'Establishing Connection...' : (user ? 'Accept Coordinates' : 'Login to Accept')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
