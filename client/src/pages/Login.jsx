import { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      Cookies.set('token', res.data.token, { expires: 1 });
      navigate('/');
    } catch (err) {
      setError('Invalid authorization credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg relative overflow-hidden px-4">

      {/* Decorative Background */}
      <div className="absolute top-[10%] left-[15%] w-[300px] h-[300px] rounded-full z-0 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(79,124,255, 0.15) 0%, rgba(0, 0, 0, 0) 70%)' }}></div>
      <div className="absolute bottom-[10%] right-[15%] w-[400px] h-[400px] rounded-full z-0 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(34,212,143, 0.1) 0%, rgba(0, 0, 0, 0) 70%)' }}></div>

      <div className="w-full max-w-[400px] bg-card border border-border rounded-[14px] p-6 sm:p-8 relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="SKCC Logo" className="w-20 h-20 mx-auto mb-4 rounded-full bg-white object-contain" />
          <h2 className="text-[20px] font-semibold text-text1 mb-1">SKCC Management System</h2>
          <p className="text-[12.5px] text-text2">Sign in to administrative console</p>
        </div>

        {error && (
          <div className="bg-red/10 border border-red/20 text-red p-3 rounded-lg mb-5 text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-[12px] font-medium text-text3 mb-1.5 uppercase tracking-wide">Username</label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-lg text-text1 text-[13px] outline-none focus:border-accent transition-colors"
              placeholder="Enter admin username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-2">
            <label className="block text-[12px] font-medium text-text3 mb-1.5 uppercase tracking-wide">Password</label>
            <input
              type="password"
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-lg text-text1 text-[13px] outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent2 text-white py-3 rounded-lg text-[14px] font-medium transition-colors">
            <Lock size={16} /> Authenticate
          </button>
        </form>

        <p className="text-center mt-8 text-[11px] text-text3 leading-relaxed">
          © 2026 Shekhar Kumar Coaching Classes.<br />All rights reserved.
        </p>
      </div>
    </div>
  );
}
