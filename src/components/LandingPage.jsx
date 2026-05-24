import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowRight, Lock, Mail, User, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import useStore from '../store/useStore';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('signin');
  const [showResetModal, setShowResetModal] = useState(false);

  // Reset flows: 'method' → 'otp' (SMS) or 'new_password' (email link) → 'success'
  const [resetStep, setResetStep] = useState('method');
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetMethod, setResetMethod] = useState('');
  const [otpInput, setOtpInput] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const setUser = useStore((state) => state.setUser);

  // Form state
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+91 ');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ── Handle email reset link from URL ──────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('resetToken');
    if (urlToken) {
      // Remove the param from URL without page reload
      window.history.replaceState({}, document.title, window.location.pathname);
      setResetToken(urlToken);
      setResetMethod('email');
      setResetStep('new_password');
      setShowResetModal(true);
    }
  }, []);

  const checkHealth = async () => {
    try {
      await api.get('/health');
      return true;
    } catch {
      setError('Backend server is offline or initializing. Please wait a moment.');
      return false;
    }
  };

  const handleAuth = async () => {
    setError('');
    setIsLoading(true);

    const isHealthy = await checkHealth();
    if (!isHealthy) { setIsLoading(false); return; }

    try {
      if (activeTab === 'signin') {
        const { data } = await api.post('/auth/login', { identifier, password });
        setUser(data);
      } else {
        const { data } = await api.post('/auth/signup', { username, email, password, phoneNumber });
        setUser(data);
      }
    } catch (err) {
      const errCode = err.response?.data?.code;
      if (activeTab === 'signin' && errCode === 'USER_NOT_FOUND') {
        setActiveTab('signup');
        
        // Auto-fill the identifier into the correct signup field
        if (identifier.includes('@')) setEmail(identifier);
        else if (identifier.match(/^[\d\s\+\-]+$/)) setPhoneNumber(identifier);
        else setUsername(identifier);
        
        setError('Account not found. Please sign up first to continue!');
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || 'Authentication failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 1: Request reset via email or SMS ─────────────────────────────────
  const handleResetRequest = async (method) => {
    if (!resetIdentifier.trim()) {
      setError('Please enter your email or phone number first.');
      return;
    }
    setError('');
    setIsLoading(true);
    setResetMethod(method);
    try {
      const { data } = await api.post('/auth/forgot-password', { identifier: resetIdentifier.trim(), method });
      setSuccessMsg(data.message);
      if (method === 'sms') {
        setResetStep('otp');
      } else {
        // Email sent — tell user to check inbox
        setResetStep('email_sent');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset signal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2 (SMS): Verify OTP with server before allowing password change ────
  const handleVerifyOtp = async () => {
    if (otpInput.trim().length < 4) {
      setError('Please enter the full OTP code.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await api.post('/auth/verify-reset-token', { token: otpInput.trim() });
      setResetToken(otpInput.trim());
      setResetStep('new_password');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code. Request a new one.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 3: Submit new password ─────────────────────────────────────────────
  const handleResetPasswordSubmit = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const { data } = await api.put(`/auth/reset-password/${resetToken}`, { password: newPassword });
      setSuccessMsg(data.message);
      setResetStep('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The code may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const openResetModal = () => {
    setResetIdentifier(identifier || email || '');
    setResetStep('method');
    setError('');
    setSuccessMsg('');
    setOtpInput('');
    setNewPassword('');
    setConfirmPassword('');
    setResetToken('');
    setResetMethod('');
    setShowResetModal(true);
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetStep('method');
    setError('');
    setSuccessMsg('');
    setOtpInput('');
    setNewPassword('');
    setConfirmPassword('');
    setResetToken('');
    setResetMethod('');
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-y-auto bg-deep py-12 px-4">
      {/* Background */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface via-deep to-deep" />
        <div className="w-[200%] h-[200%] absolute top-[-50%] left-[-50%] border-[rgba(0,245,212,0.1)] border-[1px] bg-[linear-gradient(rgba(0,245,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,245,212,0.05)_1px,transparent_1px)] bg-[size:50px_50px] animate-[pulse_10s_ease-in-out_infinite]" />
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass-panel w-full max-w-md rounded-2xl p-8 z-10 relative flex flex-col"
      >
        <div className="flex flex-col items-center mb-8 shrink-0">
          <div className="w-16 h-16 rounded-full bg-surface border border-neon-teal/50 flex items-center justify-center shadow-[0_0_20px_rgba(0,245,212,0.2)] mb-4">
            <MapPin className="text-neon-teal w-8 h-8 animate-pulse-slow" />
          </div>
          <h1 className="text-3xl font-display font-bold text-primary tracking-tight">Amigos</h1>
          <p className="text-muted font-mono text-sm mt-2">Find your crew. Anywhere.</p>
        </div>

        {/* Tabs */}
        <div className="flex w-full mb-6 bg-deep/50 rounded-lg p-1 relative shrink-0">
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-surface rounded-md shadow transition-transform duration-300 ease-out
            ${activeTab === 'signup' ? 'translate-x-full' : 'translate-x-0'}`}
          />
          <button onClick={() => { setActiveTab('signin'); setError(''); }} className={`flex-1 py-2 text-sm font-medium z-10 transition-colors ${activeTab === 'signin' ? 'text-primary' : 'text-muted'}`}>Sign In</button>
          <button onClick={() => { setActiveTab('signup'); setError(''); }} className={`flex-1 py-2 text-sm font-medium z-10 transition-colors ${activeTab === 'signup' ? 'text-primary' : 'text-muted'}`}>Sign Up</button>
        </div>

        {error && !showResetModal && (
          <div className="mb-4 text-center text-xs font-mono text-neon-pink bg-neon-pink/10 py-3 px-2 rounded shrink-0 flex items-center gap-2 justify-center">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {/* Form Content */}
        <div className="flex-1 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex flex-col justify-center gap-4"
            >
              {activeTab === 'signin' && (
                <>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                    <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuth()} placeholder="Username, Email, or Phone" className="neon-input pl-10" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuth()} placeholder="Password" className="neon-input pl-10" />
                  </div>
                  <button onClick={openResetModal} className="text-xs text-muted hover:text-neon-amber text-right transition-colors w-full mt-1">
                    Forgot password?
                  </button>
                </>
              )}

              {activeTab === 'signup' && (
                <>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className="neon-input pl-10" />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="neon-input pl-10" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 6 chars)" className="neon-input pl-10" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                    <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+91 00000 00000" className="neon-input pl-10" />
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={handleAuth}
          disabled={isLoading}
          className="neon-button-primary w-full mt-8 flex items-center justify-center gap-2 group disabled:opacity-50 shrink-0"
        >
          {isLoading ? (
            <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</span>
          ) : (
            <>{activeTab === 'signin' ? 'Sign In' : 'Create Account'}<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
          )}
        </button>
      </motion.div>

      {/* ── Password Reset Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-deep/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel w-full max-w-sm rounded-xl p-6"
            >
              {/* Error inside modal */}
              {error && (
                <div className="mb-4 text-center text-xs font-mono text-neon-pink bg-neon-pink/10 py-2 px-3 rounded flex items-center gap-2 justify-center">
                  <AlertCircle className="w-3 h-3 shrink-0" />{error}
                </div>
              )}

              {/* ── STEP: method ───────────────────────────────────────────── */}
              {resetStep === 'method' && (
                <>
                  <h3 className="text-xl font-display font-bold text-primary mb-1">Reset Password</h3>
                  <p className="text-sm text-muted mb-5">Enter your registered email or phone number to receive reset instructions.</p>

                  <div className="relative mb-5">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                    <input
                      type="text"
                      value={resetIdentifier}
                      onChange={e => setResetIdentifier(e.target.value)}
                      placeholder="Email or Phone Number"
                      className="neon-input pl-10"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <button onClick={() => handleResetRequest('email')} disabled={isLoading} className="w-full text-left px-4 py-3 bg-surface hover:bg-surface/80 border border-glass rounded-md transition-colors flex items-center justify-between group disabled:opacity-50">
                      <span className="font-medium text-sm flex items-center gap-2"><Mail className="w-4 h-4 text-neon-teal" /> Send Reset Link</span>
                      {isLoading && resetMethod === 'email' ? <div className="w-4 h-4 border-2 border-neon-teal/30 border-t-neon-teal rounded-full animate-spin" /> : <ArrowRight className="w-4 h-4 text-muted group-hover:text-neon-teal" />}
                    </button>
                  </div>
                  <p className="mt-4 text-[10px] text-muted font-mono text-center">
                    💡 Running locally without SMTP/Twilio? Check the backend terminal for the OTP / reset link.
                  </p>
                </>
              )}

              {/* ── STEP: email_sent ───────────────────────────────────────── */}
              {resetStep === 'email_sent' && (
                <div className="flex flex-col items-center py-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-neon-teal/20 flex items-center justify-center mb-4 text-neon-teal">
                    <Mail className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-primary mb-2">Check Your Email 📧</h3>
                  <p className="text-sm text-muted mb-2">
                    A password reset link has been sent to your registered email. Click the link in the email to set a new password.
                  </p>
                  <p className="text-xs text-muted mb-1">Didn't get it? Check your spam folder.</p>
                  <p className="text-[10px] text-amber-400/80 font-mono mt-1 mb-5">
                    💡 Dev mode? The reset link is printed in your backend terminal.
                  </p>
                  <button onClick={() => { setResetStep('method'); setError(''); }} className="text-sm text-muted hover:text-neon-teal transition-colors mb-2">
                    ← Try a different method
                  </button>
                </div>
              )}


              {/* ── STEP: new_password ─────────────────────────────────────── */}
              {resetStep === 'new_password' && (
                <>
                  <h3 className="text-xl font-display font-bold text-primary mb-2">Set New Password</h3>
                  <p className="text-sm text-muted mb-5">Enter your new password. Must be at least 6 characters.</p>

                  <div className="relative mb-3">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="New Password"
                      className="neon-input pl-10"
                    />
                  </div>
                  <div className="relative mb-5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm New Password"
                      className="neon-input pl-10"
                      onKeyDown={e => e.key === 'Enter' && handleResetPasswordSubmit()}
                    />
                  </div>

                  <button
                    onClick={handleResetPasswordSubmit}
                    disabled={isLoading || !newPassword || !confirmPassword}
                    className="neon-button-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...</> : 'Update Password'}
                  </button>
                </>
              )}

              {/* ── STEP: success ──────────────────────────────────────────── */}
              {resetStep === 'success' && (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-neon-teal/20 flex items-center justify-center mb-4 text-neon-teal">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-primary mb-2">✅ Password Updated!</h3>
                  <p className="text-sm text-muted mb-6">
                    Your password has been reset successfully. You can now sign in with your new password.
                  </p>
                  <button
                    onClick={closeResetModal}
                    className="neon-button-primary w-full"
                  >
                    Sign In Now
                  </button>
                </div>
              )}

              {/* Cancel button (hide on success) */}
              {resetStep !== 'success' && (
                <button
                  onClick={closeResetModal}
                  className="mt-5 w-full py-2 text-sm text-muted hover:text-primary transition-colors"
                >
                  Cancel
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
