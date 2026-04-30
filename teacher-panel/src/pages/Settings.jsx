import { useState } from 'react';
import axios from '../api/axios';
import { 
  Lock, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Shield, 
  Key, 
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

export default function Settings() {
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  const teacherName = localStorage.getItem('teacher_name') || 'Teacher';
  const permissions = JSON.parse(localStorage.getItem('teacher_permissions') || '{}');

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const toggleVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleLogout = () => {
    Cookies.remove('teacher_token');
    localStorage.clear();
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (passwords.newPassword !== passwords.confirmPassword) {
      return setMsg({ type: 'error', text: 'New passwords do not match!' });
    }

    if (passwords.newPassword.length < 6) {
      return setMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
    }

    setLoading(true);
    try {
      await axios.put('/api/teachers/me/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setMsg({ type: 'success', text: 'Security credentials updated!' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.msg || 'Update failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10 animate-in fade-in duration-500">
      {/* Header - More Minimal */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-semibold text-text1">Settings</h1>
          <p className="text-[12px] text-text3">Manage your account and security</p>
        </div>
        <button onClick={handleLogout} className="text-[12px] font-medium text-red hover:underline flex items-center gap-1.5">
          <LogOut size={13} /> Sign Out
        </button>
      </div>

      {/* Profile Summary - Compact */}
      <div className="bg-card/30 border border-border rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
          {teacherName.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-text1">{teacherName}</h2>
          <div className="flex gap-2 mt-1">
            <span className="text-[10px] text-text3 font-medium bg-surface px-2 py-0.5 rounded border border-border">Teacher</span>
            {permissions.canAccessReports && (
              <span className="text-[10px] text-green font-medium bg-green/5 px-2 py-0.5 rounded border border-green/10">Reports Access</span>
            )}
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-[10px] text-text3 uppercase tracking-wider font-bold">Status</p>
          <p className="text-[11px] text-green font-medium">Verified Account</p>
        </div>
      </div>

      {/* Security Form - Tighter Design */}
      <div className="bg-card/40 border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Key size={15} className="text-accent" />
          <h2 className="text-sm font-bold text-text1">Change Password</h2>
        </div>

        {msg.text && (
          <div className={`mb-5 p-3 rounded-xl flex items-center gap-2 text-[12px] ${
            msg.type === 'success' ? 'bg-green/5 text-green border border-green/10' : 'bg-red/5 text-red border border-red/10'
          }`}>
            {msg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-text3 uppercase ml-1">Current Password</label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                name="currentPassword"
                className="w-full px-4 py-2.5 bg-surface/40 border border-border rounded-xl text-text1 text-[13px] outline-none focus:border-accent/50 transition-all"
                value={passwords.currentPassword}
                onChange={handleChange}
                required
              />
              <button type="button" onClick={() => toggleVisibility('current')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text3 hover:text-text1">
                {showPasswords.current ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text3 uppercase ml-1">New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  name="newPassword"
                  className="w-full px-4 py-2.5 bg-surface/40 border border-border rounded-xl text-text1 text-[13px] outline-none focus:border-accent/50 transition-all"
                  value={passwords.newPassword}
                  onChange={handleChange}
                  required
                />
                <button type="button" onClick={() => toggleVisibility('new')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text3 hover:text-text1">
                  {showPasswords.new ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text3 uppercase ml-1">Confirm New</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirmPassword"
                  className="w-full px-4 py-2.5 bg-surface/40 border border-border rounded-xl text-text1 text-[13px] outline-none focus:border-accent/50 transition-all"
                  value={passwords.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button type="button" onClick={() => toggleVisibility('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text3 hover:text-text1">
                  {showPasswords.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tighter Session Footer */}
      <div className="px-2 flex items-center justify-between text-[11px] text-text3">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green" />
          <span>Active Session • Browser</span>
        </div>
        <span>Security Verified</span>
      </div>
    </div>
  );
}
