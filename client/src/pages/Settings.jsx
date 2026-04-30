import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  ShieldAlert, 
  Key,
  ShieldCheck,
  Info,
  ChevronRight
} from 'lucide-react';

export default function Settings() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);
  const [resetConfirm, setResetConfirm] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpInfo, setOtpInfo] = useState({ msg: '', emailSent: false });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setFormData(prev => ({ ...prev, username: res.data.username || '' }));
    } catch (err) {
      console.error('Failed to fetch admin info');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', msg: '' });

    if (formData.password && formData.password !== formData.confirmPassword) {
      return setStatus({ type: 'error', msg: 'Passwords do not match!' });
    }

    if (!formData.username && !formData.password) {
      return setStatus({ type: 'error', msg: 'Provide at least one change.' });
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/request-otp');
      setOtpInfo({ msg: res.data.msg, emailSent: res.data.emailSent });
      setShowOtpModal(true);
      setStatus({ type: 'success', msg: res.data.msg });
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.msg || 'OTP request failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updateData = { otp: otpCode };
      if (formData.username) updateData.username = formData.username;
      if (formData.password) updateData.password = formData.password;

      await axios.put('/api/auth/update', updateData);
      setStatus({ type: 'success', msg: 'Credentials updated!' });
      setFormData({ username: '', password: '', confirmPassword: '' });
      setShowOtpModal(false);
      setOtpCode('');
      fetchAdminData();
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.msg || 'Verification failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSystemReset = async () => {
    if (resetConfirm !== 'RESET ALL DATA' || masterPassword !== 'GJ05DT6333') {
      alert('Verification failed.');
      return;
    }

    if (!window.confirm('IRREVERSIBLE: Are you absolutely sure?')) return;

    setIsResetting(true);
    try {
      await axios.delete('/api/system/reset');
      alert('System reset successful.');
      window.location.reload();
    } catch (err) {
      alert('Reset failed.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Compact Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text1">System Settings</h1>
          <p className="text-[12px] text-text3">Administrative controls & security</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-surface/50 rounded-lg border border-border">
          <div className="w-1.5 h-1.5 rounded-full bg-green" />
          <span className="text-[10px] font-bold text-text3 uppercase tracking-wider">v1.2.0 Stable</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card/30 border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text3 uppercase tracking-wider">Auth Level</p>
                <p className="text-sm font-bold text-text1">SuperUser Access</p>
              </div>
            </div>
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex justify-between text-[12px]">
                <span className="text-text3">Username:</span>
                <span className="text-text2 font-medium">@{formData.username || 'admin'}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-text3">2FA Status:</span>
                <span className="text-green font-medium">Email OTP Active</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4">
            <p className="text-[11px] text-text3 leading-relaxed italic">
              Credential updates require administrative authorization via OTP.
            </p>
          </div>
        </div>

        {/* Right: Forms */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-card/40 border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-text1 mb-5 flex items-center gap-2">
              <Key size={14} className="text-accent" /> Security Credentials
            </h2>

            {status.msg && (
              <div className={`mb-5 p-3 rounded-xl flex items-center gap-2 text-[12px] ${
                status.type === 'success' ? 'bg-green/5 text-green border border-green/10' : 'bg-red/5 text-red border border-red/10'
              }`}>
                {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {status.msg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text3 uppercase ml-1">Admin Username</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-surface/40 border border-border rounded-xl text-text1 text-[13px] outline-none focus:border-accent/50 transition-all"
                  placeholder="Keep current"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-text3 uppercase ml-1">New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 bg-surface/40 border border-border rounded-xl text-text1 text-[13px] outline-none focus:border-accent/50 transition-all"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-text3 uppercase ml-1">Confirm</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 bg-surface/40 border border-border rounded-xl text-text1 text-[13px] outline-none focus:border-accent/50 transition-all"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-[13px] font-bold transition-all shadow-lg shadow-accent/10 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Save Credentials'}
                {!loading && <ChevronRight size={14} />}
              </button>
            </form>
          </div>

          {/* Minimal Danger Zone */}
          <div className="bg-card/40 border border-red-500/20 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-red mb-3 flex items-center gap-2">
              <ShieldAlert size={14} /> Danger Zone
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-red-500/5 border border-red-500/10 rounded-lg text-text1 text-[12px] outline-none focus:border-red-500/40"
                  placeholder="RESET ALL DATA"
                  value={resetConfirm}
                  onChange={e => setResetConfirm(e.target.value)}
                />
                <input
                  type="password"
                  className="w-full px-3 py-2 bg-red-500/5 border border-red-500/10 rounded-lg text-text1 text-[12px] outline-none focus:border-red-500/40"
                  placeholder="Master Password"
                  value={masterPassword}
                  onChange={e => setMasterPassword(e.target.value)}
                />
              </div>
              <button
                onClick={handleSystemReset}
                disabled={resetConfirm !== 'RESET ALL DATA' || masterPassword === '' || isResetting}
                className="w-full py-2.5 bg-red/10 hover:bg-red text-red hover:text-white rounded-xl text-[12px] font-bold transition-all disabled:opacity-30 border border-red/20"
              >
                {isResetting ? 'Wiping...' : 'Authorize System Format'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Modal - Minimal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border border-border w-full max-w-[360px] rounded-2xl p-8 shadow-2xl">
            <div className="text-center">
              <h2 className="text-lg font-bold text-text1">Verification</h2>
              <p className="text-[12px] text-text3 mt-1 px-4">{otpInfo.msg || 'Enter OTP to continue.'}</p>

              <form onSubmit={handleVerifyAndSave} className="mt-6 space-y-6">
                <input
                  type="text"
                  maxLength="6"
                  className="w-full bg-surface border border-border rounded-xl py-4 text-center text-2xl font-mono tracking-[0.4em] text-accent outline-none"
                  placeholder="000000"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  required
                />
                <div className="flex flex-col gap-3">
                  <button type="submit" className="w-full py-3 bg-accent text-white rounded-xl font-bold text-sm" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify & Save'}
                  </button>
                  <button type="button" onClick={() => setShowOtpModal(false)} className="text-xs text-text3 font-medium">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
