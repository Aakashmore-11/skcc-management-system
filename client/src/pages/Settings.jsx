import { useState } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, User, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Settings() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', msg: '' });

    if (formData.password && formData.password !== formData.confirmPassword) {
      return setStatus({ type: 'error', msg: 'Passwords do not match!' });
    }

    setLoading(true);
    try {
      const updateData = {};
      if (formData.username) updateData.username = formData.username;
      if (formData.password) updateData.password = formData.password;

      if (Object.keys(updateData).length === 0) {
        setLoading(false);
        return setStatus({ type: 'error', msg: 'Please provide at least one change.' });
      }

      await axios.put('/api/auth/update', updateData);
      setStatus({ type: 'success', msg: 'Credentials updated successfully!' });
      setFormData({ username: '', password: '', confirmPassword: '' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: err.response?.data?.msg || 'Failed to update credentials.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <div className="card-title text-[18px]">Security Settings</div>
          <div className="card-subtitle">Manage your administrative login credentials.</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="card-title mb-6 flex items-center gap-2">
          <SettingsIcon size={18} color="var(--accent)" /> Admin Account Details
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
                placeholder="Leave blank to keep current" 
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
              <label className="form-label">Confirm New Password</label>
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

      <div className="mt-8 chart-card opacity-60">
        <div className="card-title text-sm mb-2">Notice</div>
        <p className="text-xs text-text3 leading-relaxed">
          Changing your credentials will take effect immediately. Please ensure you remember your new password as there is no automated password recovery system currently configured. If you lose access, manual database intervention will be required.
        </p>
      </div>
    </div>
  );
}
