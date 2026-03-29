import React, { useState, useEffect } from 'react';

export default function Doctors({ addToast }) {
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', specialization: '', experience: '', contact: '', location: '' });

  const fetchDoctors = () => {
    fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/doctors/list')
      .then(res => res.json())
      .then(data => { setDoctors(data); setLoading(false); })
      .catch(() => { addToast('Error loading doctors.', 'error'); setLoading(false); });
  };

  useEffect(() => { fetchDoctors(); }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/doctors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        addToast('Doctor registered successfully!', 'success');
        setShowForm(false);
        setFormData({ name: '', specialization: '', experience: '', contact: '', location: '' });
        fetchDoctors();
      }
    } catch {
      addToast('Failed to register doctor.', 'error');
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>👨‍⚕️ Find & Register Doctors</h1>
          <p>Connect with medical specialists or register your practice on our platform.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✖ Close Form' : '➕ Register Doctor'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto 30px' }}>
          <div className="card-title">👨‍⚕️ Doctor Registration</div>
          <form onSubmit={handleRegister} className="medicine-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Full Name</label>
              <input className="input-field" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Specialization</label>
              <input className="input-field" required value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Exp (e.g. 10 years)</label>
              <input className="input-field" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Contact Number</label>
              <input className="input-field" required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">City/Location</label>
              <input className="input-field" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', justifyContent: 'center' }}>Save Registration</button>
          </form>
        </div>
      )}

      {loading ? (
          <div style={{ textAlign: 'center', padding: '100px' }}><div className="spinner" /></div>
      ) : (
        <div className="medicine-grid">
          {doctors.map((doc, i) => (
            <div key={i} className="card">
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ width: '60px', height: '60px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>👨‍⚕️</div>
                <div style={{ flex: 1 }}>
                  <div className="card-title" style={{ marginBottom: '4px' }}>{doc.name}</div>
                  <div style={{ fontSize: '14px', color: 'var(--accent-cyan)', fontWeight: '600' }}>{doc.specialization}</div>
                </div>
              </div>
              <div className="detail-table" style={{ marginTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Experience</span>
                  <span>{doc.experience || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Contact</span>
                  <span style={{ color: 'var(--accent-green)' }}>{doc.contact}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Location</span>
                  <span>{doc.location || 'N/A'}</span>
                </div>
              </div>
              <button className="btn btn-outline" style={{ width: '100%', marginTop: '15px', justifyContent: 'center' }}>Book Appointment</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
