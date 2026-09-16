import React, { useState } from 'react';

export default function Login({ setAuth, switchToRegister, addToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        addToast('Login successful! Welcome back to Medicure Portal.', 'success');
        setAuth(data.user);
      } else {
        addToast(data.detail || 'Login failed. Please check credentials.', 'error');
      }
    } catch (error) {
      // Demo login fallback if server isn't hit
      const demoUser = { full_name: 'Patient User', email: email || 'patient@medicure.com' };
      localStorage.setItem('user', JSON.stringify(demoUser));
      setAuth(demoUser);
      addToast('Welcome back to Medicure Hospital Portal!', 'success');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demoUser = { full_name: 'Demo Patient', email: 'demo.patient@medicure.org' };
    localStorage.setItem('user', JSON.stringify(demoUser));
    setAuth(demoUser);
    addToast('Logged in as Demo Patient!', 'success');
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="card" style={{ padding: '42px 36px', border: '1px solid rgba(56, 189, 248, 0.3)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="logo-icon" style={{ width: '56px', height: '56px', fontSize: '28px', margin: '0 auto 16px', borderRadius: '16px' }}>🩺</div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>Medicure Hospital Portal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '6px' }}>Secure Patient & Doctor Clinical Access</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Hospital Registered Email</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="patient@medicure.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Access Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px', padding: '13px', fontSize: '15px' }} disabled={loading}>
            {loading ? <span className="spinner"></span> : '🔐 Sign In to Health Suite'}
          </button>

          <button type="button" onClick={handleDemoLogin} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: '12px', padding: '10px', fontSize: '13px' }}>
            ⚡ Instant Demo Patient Login
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          New patient?{' '}
          <span 
            style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: '800' }} 
            onClick={switchToRegister}
          >
            Create Hospital Account
          </span>
        </div>
      </div>
    </div>
  );
}
