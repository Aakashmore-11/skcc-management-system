import { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, User, Lock, CheckCircle2, AlertCircle, Trash2, ShieldAlert, Key } from 'lucide-react';

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
  
  // OTP Verification State
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
      return setStatus({ type: 'error', msg: 'Please provide at least one change.' });
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/request-otp');
      setOtpInfo({ msg: res.data.msg, emailSent: res.data.emailSent });
      setShowOtpModal(true);
      setStatus({ type: 'success', msg: res.data.msg });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: err.response?.data?.msg || 'Failed to request OTP.' });
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
      setStatus({ type: 'success', msg: 'Credentials updated successfully!' });
      setFormData({ username: '', password: '', confirmPassword: '' });
      setShowOtpModal(false);
      setOtpCode('');
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: err.response?.data?.msg || 'Verification failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSystemReset = async () => {
    if (resetConfirm !== 'RESET ALL DATA') {
      alert('Step 1 Failed: Please type "RESET ALL DATA" exactly to confirm.');
      return;
    }

    if (masterPassword !== 'GJ05DT6333') {
      alert('Step 2 Failed: Incorrect Master Authorization Password.');
      return;
    }

    if (!window.confirm('FINAL WARNING: This is IRREVERSIBLE. All students, classes, fees, and event records will be PERMANENTLY DELETED. Are you absolutely sure?')) {
      return;
    }

    setIsResetting(true);
    try {
      await axios.delete('/api/system/reset');
      alert('System has been successfully reset. All operational data has been deleted.');
      setResetConfirm('');
      setMasterPassword('');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to reset system. Check server logs.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <div className="card-title text-[18px]">System Settings</div>
          <div className="card-subtitle">Manage administrative credentials and system maintenance.</div>
        </div>
      </div>

      {/* Security Section */}
      <div className="chart-card mb-8">
        <div className="card-title mb-6 flex items-center gap-2">
          <Lock size={18} color="var(--accent)" /> Admin Security
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {status.msg && (
            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${status.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
              {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {status.msg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="form-group mb-0">
              <label className="form-label flex items-center gap-2">
                <User size={14} /> New Username
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Keep current"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            <div className="form-group mb-0">
              <label className="form-label flex items-center gap-2">
                <Lock size={14} /> New Password
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="form-group mb-0 md:col-start-2">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="btn btn-primary w-full md:w-auto px-10"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Save Security Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="chart-card border border-red-500/20">
        <div className="card-title mb-4 flex items-center gap-2 text-red-500">
          <ShieldAlert size={18} /> Danger Zone (System Reset)
        </div>
        <p className="text-sm text-text3 mb-6 leading-relaxed">
          The following action is destructive and irreversible. You must complete two steps of verification to proceed.
        </p>

        <div className="space-y-4 bg-red-500/5 p-4 rounded-xl border border-red-500/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label text-red-400 text-xs uppercase tracking-wider font-bold mb-2">Step 1: Type Confirmation Phrase</label>
              <input
                type="text"
                className="form-control border-red-500/20 focus:border-red-500"
                placeholder="RESET ALL DATA"
                value={resetConfirm}
                onChange={e => setResetConfirm(e.target.value)}
              />
            </div>

            <div className="form-group mb-0">
              <label className="form-label text-red-400 text-xs uppercase tracking-wider font-bold mb-2 flex items-center gap-1">
                Step 2: Master Password
              </label>
              <input
                type="password"
                className="form-control border-red-500/20 focus:border-red-500"
                placeholder="Enter authorization key"
                value={masterPassword}
                onChange={e => setMasterPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={handleSystemReset}
            disabled={resetConfirm !== 'RESET ALL DATA' || masterPassword === '' || isResetting}
            className={`btn w-full flex items-center justify-center gap-2 h-[42px] transition-all duration-300 ${resetConfirm === 'RESET ALL DATA' && masterPassword === 'GJ05DT6333' ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20' : 'bg-red-500/10 text-red-500/40 cursor-not-allowed'}`}
          >
            <Trash2 size={16} />
            {isResetting ? 'Wiping Databases...' : 'Format All System Data'}
          </button>

          <div className="text-[10px] text-center text-red-500/50 mt-2 italic">
            This action will clear all Student, Fee, Class, and Event databases.
          </div>
        </div>
      </div>

      <div className="mt-8 opacity-60 text-center">
        <p className="text-xs text-text3">
          Last system backup: Not configured • Version 1.0.5
        </p>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="chart-card w-full max-w-[400px] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="card-title flex items-center gap-2">
                <ShieldAlert size={18} color="var(--accent)" /> Security Verification
              </div>
              <button onClick={() => setShowOtpModal(false)} className="text-text3 hover:text-text1">
                <AlertCircle size={20} />
              </button>
            </div>

            <p className="text-sm text-text3 mb-6 text-center">
              {otpInfo.msg}. Enter the code below to authorize the changes.
            </p>

            <form onSubmit={handleVerifyAndSave} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Enter 6-Digit Code</label>
                <input
                  type="text"
                  maxLength="6"
                  className="form-control text-center text-2xl font-mono tracking-[0.5em]"
                  placeholder="000000"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button type="submit" className="btn btn-primary w-full h-[46px]" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Save Changes'}
              </button>
              
              <button type="button" onClick={() => setShowOtpModal(false)} className="w-full text-xs text-text3 hover:text-text1 py-2">
                Cancel and return to form
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
