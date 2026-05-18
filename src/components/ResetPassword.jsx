import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter a new password');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await api.put(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen flex items-center justify-center overflow-hidden bg-deep">
      {/* Background Element */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface via-deep to-deep" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-[90%] max-w-sm rounded-2xl p-8 z-10 relative overflow-hidden"
      >
        {!success ? (
          <>
            <h2 className="text-2xl font-display font-bold text-primary mb-2">New Coordinates</h2>
            <p className="text-sm text-muted mb-6">Enter your new secure password.</p>
            
            {error && (
              <div className="mb-4 text-center text-xs font-mono text-neon-pink bg-neon-pink/10 py-2 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                <input 
                  type="password" 
                  value={password} 
                  onChange={e=>setPassword(e.target.value)} 
                  placeholder="New Password" 
                  className="neon-input pl-10" 
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="neon-button-primary w-full mt-4 flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update Password'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="w-16 h-16 rounded-full bg-neon-teal/20 flex items-center justify-center mb-4 text-neon-teal">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-display font-bold text-primary mb-2">Password Updated</h3>
            <p className="text-sm text-muted mb-6">Your coordinates have been reset successfully.</p>
            <button onClick={() => navigate('/')} className="neon-button-primary w-full">
              Return to Login
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
