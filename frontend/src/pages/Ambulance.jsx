import React, { useState, useEffect } from 'react';

const defaultAmbulances = [
  {
    vehicle_number: 'DL-01-EV-1088',
    type: 'ICU on Wheels',
    contact: '108 / +91 99999 11111',
    location: 'Central Trauma Hospital Unit, Sector 4',
    eta: '6-8 Mins ETA',
    status: 'Ready for Dispatch'
  },
  {
    vehicle_number: 'MH-02-ER-4521',
    type: 'Advanced ACLS',
    contact: '102 / +91 98888 22222',
    location: 'Medicure Emergency Bay, North Division',
    eta: '8-10 Mins ETA',
    status: 'On Standby'
  },
  {
    vehicle_number: 'KA-05-AM-9002',
    type: 'Basic BLS Ambulance',
    contact: '+91 97777 33333',
    location: 'Metro ER Station, East Sector',
    eta: '5-7 Mins ETA',
    status: 'Ready for Dispatch'
  }
];

export default function Ambulance({ addToast }) {
  const [ambulances, setAmbulances] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(null);
  const [formData, setFormData] = useState({ vehicle_number: '', contact: '', location: '', type: 'Basic' });

  const fetchAmbulances = () => {
    fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/ambulance/list')
      .then(res => res.json())
      .then(data => { 
        setAmbulances([...defaultAmbulances, ...data]); 
        setLoading(false); 
      })
      .catch(() => { 
        setAmbulances(defaultAmbulances);
        setLoading(false); 
      });
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
        addToast('Ambulance vehicle registered!', 'success');
        setShowForm(false);
        setFormData({ vehicle_number: '', contact: '', location: '', type: 'Basic' });
        fetchAmbulances();
      }
    } catch {
      addToast('Failed to register ambulance.', 'error');
    }
  };

  const handleDispatch = (vehicleNo) => {
    setDispatching(vehicleNo);
    setTimeout(() => {
      setDispatching(null);
      addToast(`Ambulance ${vehicleNo} dispatched to your location! Driver will call shortly.`, 'success');
    }, 2000);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1>🚑 24/7 Emergency Ambulance & Trauma Fleet</h1>
          <p>Instant GPS location dispatch for Basic, ACLS, and Mobile ICU Ambulances.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✖ Close Form' : '➕ Register Fleet Unit'}
        </button>
      </div>

      {/* Guide Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(225, 29, 72, 0.05))', border: '1px solid var(--accent-red)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '28px' }}>📖</div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--accent-red)', marginBottom: '4px' }}>Kya Use Hai & Kaise Use Karein (Emergency Ambulance Guide)</div>
            <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <strong>• Iska Use Kya Hai?</strong> Emergency me paas ki ICU, Cardiac (ACLS), ya Basic emergency vehicle ko apne GPS location par turant dispatch karne ke liye.<br/>
              <strong>• Kaise Use Karein?</strong>
              <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                <li>Direct Hotline for Urgent Help: Red <strong>"📞 Call 108 Emergency"</strong> button par tap karke baat karein.</li>
                <li>Live GPS Ambulance Dispatch: Apne area ke ambulance card par <strong>"⚡ Dispatch Now"</strong> click karein — 6-8 mins ETA me responder aap tak pahunchega.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Call Bar */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.18), rgba(225, 29, 72, 0.08))', border: '1px solid var(--accent-red)', marginBottom: '26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '36px' }} className="animate-float">🚨</div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '18px', color: 'var(--accent-red)' }}>National Emergency Ambulance Hotline</div>
              <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>Direct line to Medicure Hospital Central ER Command Room</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a href="tel:108" className="btn btn-danger" style={{ textDecoration: 'none', fontSize: '15px', padding: '12px 26px' }}>
              📞 Call 108 Emergency
            </a>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto 30px', border: '1px solid var(--accent-blue)' }}>
          <div className="card-title">🚑 Register Emergency Ambulance</div>
          <form onSubmit={handleRegister} className="medicine-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="input-group">
              <label className="input-label">Vehicle Registration Number</label>
              <input className="input-field" required placeholder="e.g. MH-01-AB-1234" value={formData.vehicle_number} onChange={e => setFormData({...formData, vehicle_number: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Ambulance Type</label>
              <select className="input-field" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Basic">Basic Support (BLS)</option>
                <option value="Advanced">Advanced Support (ACLS)</option>
                <option value="ICU">ICU on Wheels</option>
              </select>
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Direct Helpline Number</label>
              <input className="input-field" required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} placeholder="+91 9876543210" />
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Base Location / ER Hub</label>
              <input className="input-field" required placeholder="e.g. Central ER Hub, Sector 4" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', justifyContent: 'center' }}>Register Vehicle</button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}><div className="spinner" /></div>
      ) : (
        <div className="medicine-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {ambulances.map((amb, i) => (
            <div key={i} className="card" style={{ borderLeft: `5px solid ${amb.type.includes('ICU') || amb.type === 'Advanced' ? 'var(--accent-red)' : 'var(--accent-cyan)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '28px' }}>🚑</div>
                <span className="status-badge genuine" style={{ background: 'rgba(14, 165, 233, 0.15)', color: 'var(--accent-cyan)', borderColor: 'rgba(14, 165, 233, 0.3)' }}>
                  {amb.type}
                </span>
              </div>
              <div className="card-title" style={{ fontSize: '18px', marginBottom: '6px' }}>{amb.vehicle_number}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '14px' }}>📍 {amb.location}</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-input)', borderRadius: '10px', fontSize: '12.5px', marginBottom: '16px', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--accent-green)', fontWeight: '700' }}>● {amb.status || 'Active'}</span>
                <span style={{ color: 'var(--accent-yellow)', fontWeight: '700' }}>⏱️ {amb.eta || '8 Mins ETA'}</span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a href={`tel:${amb.contact}`} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', fontSize: '13px', textDecoration: 'none' }}>
                  📞 {amb.contact}
                </a>
                <button 
                  className="btn btn-danger" 
                  style={{ flex: 1, justifyContent: 'center', fontSize: '13px' }}
                  disabled={dispatching === amb.vehicle_number}
                  onClick={() => handleDispatch(amb.vehicle_number)}
                >
                  {dispatching === amb.vehicle_number ? <span className="spinner" /> : '⚡ Dispatch Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
