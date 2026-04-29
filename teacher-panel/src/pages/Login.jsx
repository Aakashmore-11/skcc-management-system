import { useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { Lock, User, GraduationCap, ArrowRight } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await axios.post('/api/teachers/login', { username, password });
      Cookies.set('teacher_token', res.data.token, { expires: 1, path: '/' });
      localStorage.setItem('teacher_name', res.data.name);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg relative overflow-hidden px-4 font-['DM_Sans']">

      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] pointer-events-none animate-pulse"
        style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }}></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-10 blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--teal) 0%, transparent 70%)' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5 blur-[150px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--accent2) 0%, transparent 70%)' }}></div>

      {/* Login Card */}
      <div className="w-full max-w-[420px] relative z-10">
        <div className="bg-card/40 backdrop-blur-2xl border border-white/10 rounded-[24px] sm:rounded-[28px] p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">

          {/* Logo & Header */}
          <div className="text-center mb-8 sm:mb-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg shadow-accent/20 mb-5 sm:mb-6 group transition-transform hover:scale-105 duration-300 overflow-hidden">
              <img src="/logo.png" alt="SKCC Logo" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-text1 tracking-tight mb-2">Teacher Portal</h2>
            <p className="text-[12px] sm:text-[13px] text-text3 font-medium uppercase tracking-[2px]">Faculty Access Center</p>
          </div>

          {error && (
            <div className="bg-red/10 border border-red/20 text-red px-4 py-3 rounded-xl mb-6 text-[13px] flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-text3 uppercase tracking-widest ml-1">Teacher Username</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text3 group-focus-within:text-accent transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-3.5 bg-surface/50 border border-border rounded-xl text-text1 text-[14px] outline-none focus:border-accent/50 focus:bg-surface transition-all placeholder:text-text3/50"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-text3 uppercase tracking-widest ml-1">Secure Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text3 group-focus-within:text-accent transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  className="w-full pl-12 pr-4 py-3.5 bg-surface/50 border border-border rounded-xl text-text1 text-[14px] outline-none focus:border-accent/50 focus:bg-surface transition-all placeholder:text-text3/50"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-accent to-teal hover:opacity-90 text-white py-4 rounded-xl text-[15px] font-bold transition-all shadow-lg shadow-accent/25 mt-8 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5">
            <p className="text-center text-[11px] text-text3 font-medium uppercase tracking-wider leading-relaxed">
              © 2026 Shekhar Kumar Coaching Classes<br />
              <span className="opacity-50">Teacher Attendance System</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
