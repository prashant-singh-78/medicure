import React, { useState } from 'react';

export default function Register({ switchToLogin, addToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });

      const data = await response.json();

      if (response.ok) {
        addToast('Account created! Please login now.', 'success');
        switchToLogin();
      } else {
        addToast(data.detail || 'Registration failed.', 'error');
      }
    } catch (error) {
      addToast('Error connecting to server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ width: '420px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🧬</div>
          <h2 style={{ margin: 0, fontSize: '24px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>Join Medicure AI Healthcare</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Your Full Name" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px', padding: '12px' }} disabled={loading}>
            {loading ? <span className="spinner"></span> : '✨ Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <span 
            style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: 'bold' }} 
            onClick={switchToLogin}
          >
            Login
          </span>
        </div>
      </div>
    </div>
  );
}
