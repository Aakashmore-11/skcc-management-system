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
      const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
      Cookies.set('token', res.data.token, { expires: 1 });
      navigate('/');
    } catch (err) {
      setError('Invalid authorization credentials. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Decorative Background */}
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(79,124,255, 0.15) 0%, rgba(0, 0, 0, 0) 70%)', borderRadius: '50%', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(34,212,143, 0.1) 0%, rgba(0, 0, 0, 0) 70%)', borderRadius: '50%', zIndex: 0 }}></div>

      <div className="chart-card" style={{ width: '100%', maxWidth: '400px', padding: '32px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="logo-dot" style={{ width: 48, height: 48, margin: '0 auto 16px', fontSize: 20 }}>
            S
          </div>
          <h2 className="card-title" style={{ fontSize: '20px', marginBottom: '4px' }}>SchoolPay Portal</h2>
          <p className="card-subtitle">Sign in to administrative console</p>
        </div>
        
        {error && (
          <div style={{ background: 'rgba(240,75,75,0.1)', border: '1px solid rgba(240,75,75,0.2)', padding: '12px', borderRadius: '8px', color: 'var(--red)', marginBottom: '20px', fontSize: '13px' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Enter admin username"
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="••••••••"
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '14px' }}>
            <Lock size={14} /> Authenticate
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '11px', color: 'var(--text3)' }}>
          © 2026 Shekhar Kumar Coaching Classes.<br />All rights reserved.
        </p>
      </div>
    </div>
  );
}
