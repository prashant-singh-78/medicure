import React, { useState, useEffect } from 'react';

export default function Ambulance({ addToast }) {
  const [ambulances, setAmbulances] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ vehicle_number: '', contact: '', location: '', type: 'Basic' });

  const fetchAmbulances = () => {
    fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/ambulance/list')
      .then(res => res.json())
      .then(data => { setAmbulances(data); setLoading(false); })
      .catch(() => { addToast('Error loading ambulances.', 'error'); setLoading(false); });
  };

  useEffect(() => { fetchAmbulances(); }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/ambulance/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        addToast('Ambulance registered successfully!', 'success');
        setShowForm(false);
        setFormData({ vehicle_number: '', contact: '', location: '', type: 'Basic' });
        fetchAmbulances();
      }
    } catch {
      addToast('Failed to register ambulance.', 'error');
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>🚑 Emergency Ambulance Service</h1>
          <p>Quick access to ambulance services or register your emergency vehicle.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✖ Close Form' : '➕ Register Ambulance'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto 30px' }}>
          <div className="card-title">🚑 Ambulance Registration</div>
          <form onSubmit={handleRegister} className="medicine-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="input-group">
              <label className="input-label">Vehicle Number</label>
              <input className="input-field" required placeholder="e.g. MH-01-AB-1234" value={formData.vehicle_number} onChange={e => setFormData({...formData, vehicle_number: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Ambulance Type</label>
              <select className="input-field" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Basic">Basic (BLS)</option>
                <option value="Advanced">Advanced (ACLS)</option>
                <option value="ICU">ICU on Wheels</option>
              </select>
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Service Contact Number</label>
              <input className="input-field" required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Area / Location</label>
              <input className="input-field" required placeholder="e.g. Andheri East, Mumbai" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', justifyContent: 'center' }}>Register Vehicle</button>
          </form>
        </div>
      )}

      {loading ? (
          <div style={{ textAlign: 'center', padding: '100px' }}><div className="spinner" /></div>
      ) : (
        <div className="medicine-grid">
          {ambulances.map((amb, i) => (
            <div key={i} className="card" style={{ borderLeft: `4px solid ${amb.type === 'Advanced' ? 'var(--accent-red)' : 'var(--accent-cyan)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <div style={{ fontSize: '24px' }}>🚑</div>
                <span className={`status-badge ${amb.type.toLowerCase()}`} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>{amb.type} Support</span>
              </div>
              <div className="card-title" style={{ fontSize: '18px', marginBottom: '10px' }}>{amb.vehicle_number}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '15px' }}>📍 {amb.location}</div>
              
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{amb.contact}</span>
                <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Call Now</button>
              </div>
            </div>
          ))}
          {ambulances.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No ambulances registered in your area yet.</p>}
        </div>
      )}
    </div>
  );
}
