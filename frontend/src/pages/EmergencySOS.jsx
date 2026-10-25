import React, { useState, useEffect } from 'react';

export default function EmergencySOS({ addToast }) {
  const [location, setLocation] = useState(null);
  const [manualLocation, setManualLocation] = useState('');
  const [isLocating, setIsLocating] = useState(() => typeof navigator !== 'undefined' && !!navigator.geolocation);
  const [isAlerting, setIsAlerting] = useState(false);
  const [errorInfo, setErrorInfo] = useState(() => (typeof navigator !== 'undefined' && !navigator.geolocation) ? 'Geolocation is not supported by this browser.' : '');
  const [contacts] = useState([
    { name: 'National Emergency Ambulance', number: '108', relation: 'Official Emergency Hotline (Free 24/7)' },
    { name: 'National Emergency Services', number: '112', relation: 'All-in-One Police / Fire / Medical' },
    { name: 'Mental Health Crisis Helpline (KIRAN)', number: '1800-599-0019', relation: '24/7 Psychological Support' },
    { name: 'Medicure Hospital ER Trauma Desk', number: '+91 98765 43210', relation: 'Local ER Command Desk' }
  ]);

  const handleSOS = () => {
    setIsAlerting(true);
    const locString = location 
      ? `Latitude: ${location.lat.toFixed(6)}, Longitude: ${location.lng.toFixed(6)}` 
      : (manualLocation || 'Location Not Specified');
    
    // Copy coordinates to clipboard for immediate emergency responder reference
    if (navigator.clipboard && location) {
      navigator.clipboard.writeText(`EMERGENCY MEDICAL LOCATION: ${locString}`).catch(() => {});
    }

    addToast('🚨 EMERGENCY PROTOCOL ACTIVE: Please call official hotlines (108 / 112) immediately.', 'error');

    const token = localStorage.getItem('token');
    if (token) {
      fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/history', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          activity_type: 'emergency',
          title: 'Emergency Assistance Hub Accessed',
          details: `Emergency protocol triggered. Location beacon: ${locString}\nNotice: Patient referred to official 108/112 emergency telephone lines.`
        })
      }).catch(e => console.error(e));
    }

    setTimeout(() => setIsAlerting(false), 4000);
  };

  const getGeolocation = () => {
    setIsLocating(true);
    setErrorInfo('');

    if (!navigator.geolocation) {
      setErrorInfo('Geolocation is not supported by this browser.');
      addToast('Geolocation not supported.', 'error');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
        addToast('Live GPS Location Acquired.', 'success');
      },
      (err) => {
        let msg = 'Could not fetch GPS location.';
        if (err.code === 1) msg = 'Location permission denied by browser settings.';
        setErrorInfo(msg);
        addToast(msg, 'error');
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      (err) => {
        let msg = 'Could not fetch GPS location.';
        if (err.code === 1) msg = 'Location permission denied by browser settings.';
        setErrorInfo(msg);
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <img src="/brand_logo.png" alt="Medicure Brand Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1.5px solid var(--accent-red)', boxShadow: '0 0 15px rgba(244, 63, 94, 0.35)', flexShrink: 0 }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>Emergency Medical Assistance Hub</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13.5px' }}>Immediate access to official national emergency hotlines, live GPS coordinates, and urgent care protocols.</p>
        </div>
      </div>

      <div className="card" style={{ borderLeft: '4px solid var(--accent-yellow)', background: 'rgba(245, 158, 11, 0.08)', padding: '12px 18px', marginBottom: '20px' }}>
        <span style={{ color: 'var(--accent-yellow)', fontWeight: '700' }}>📍 GPS Advisory:</span> Ensure device location services are enabled for accurate emergency services coordination.
      </div>

      {/* Mandatory Safety Notice Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.16), rgba(185, 28, 28, 0.08))', border: '2px solid var(--accent-red)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '32px' }}>⚠️</div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--accent-red)', marginBottom: '6px' }}>
              CRITICAL LIFE SAFETY NOTICE: NO AUTOMATED CELLULAR DISPATCH
            </div>
            <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
              This web portal <strong>does NOT dispatch automated ambulances or contact emergency dispatchers over satellite</strong>. 
              If you or someone near you is experiencing severe chest pain, shortness of breath, loss of consciousness, stroke symptoms, or severe trauma, 
              <strong> DIAL OFFICIAL EMERGENCY SERVICES DIRECTLY</strong> using the buttons below. Do not delay emergency medical care.
            </div>
          </div>
        </div>
      </div>

      {/* Direct Dial Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <a href="tel:108" className="btn btn-danger" style={{ padding: '16px', fontSize: '16px', justifyContent: 'center', textDecoration: 'none', fontWeight: '800', borderRadius: '12px' }}>
          🚑 Call National Ambulance (108)
        </a>
        <a href="tel:112" className="btn btn-danger" style={{ padding: '16px', fontSize: '16px', justifyContent: 'center', textDecoration: 'none', fontWeight: '800', borderRadius: '12px', background: '#dc2626' }}>
          🚨 Call All-Emergency (112)
        </a>
        <a href="tel:18005990019" className="btn btn-outline" style={{ padding: '16px', fontSize: '14px', justifyContent: 'center', textDecoration: 'none', fontWeight: '700', borderRadius: '12px' }}>
          🧠 Mental Health Crisis (KIRAN)
        </a>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: 'minmax(320px, 1fr) 1.5fr' }}>
        {/* SOS Action Card */}
        <div className="card" style={{ textAlign: 'center', borderColor: 'rgba(244, 63, 94, 0.4)', background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(225, 29, 72, 0.04))' }}>
          <div className="card-title" style={{ color: 'var(--accent-red)', justifyContent: 'center' }}>🆘 ACTIVATE EMERGENCY PROTOCOL</div>
          <div style={{ margin: '30px 0' }}>
            <button
              className="mic-btn recording"
              onClick={handleSOS}
              style={{
                width: '180px',
                height: '180px',
                margin: '0 auto',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                color: '#fff',
                fontSize: '26px',
                fontWeight: '800',
                border: '6px solid rgba(244, 63, 94, 0.4)',
                boxShadow: '0 0 35px rgba(244, 63, 94, 0.5)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span>{isAlerting ? 'ACTIVE' : 'ACTIVATE'}</span>
              <span style={{ fontSize: '11px', opacity: 0.95, fontWeight: '600' }}>Copy GPS & Dial</span>
            </button>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Tapping this button logs the emergency interaction and copies your live GPS coordinates to the clipboard so you can read them to the dispatcher on the phone.
          </p>
        </div>

        {/* Location & Contacts Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📍 Live GPS Location Reference</span>
              <button onClick={getGeolocation} className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 14px' }}>
                {isLocating ? 'Acquiring GPS...' : '🔄 Refresh GPS'}
              </button>
            </div>

            {location ? (
              <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="pulse-dot"></div>
                  <span>GPS Lock Acquired (Give Coordinates to Dispatcher)</span>
                </div>
                <div style={{ fontSize: '14px', marginTop: '8px', color: 'var(--text-primary)', fontWeight: '700', fontFamily: 'monospace' }}>
                  Latitude: {location.lat.toFixed(6)} | Longitude: {location.lng.toFixed(6)}
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px', background: 'rgba(244, 63, 94, 0.08)', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
                <p style={{ color: 'var(--accent-red)', fontSize: '13px', marginBottom: '10px', fontWeight: '600' }}>⚠️ {errorInfo || 'Acquiring location...'}</p>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" style={{ fontSize: '12px' }}>Manual Location Reference (Landmark / Street Address)</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Near City Hospital Gate 3, Sector 5..."
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">👥 Direct Emergency Contacts</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {contacts.map((c, i) => (
                <div key={i} style={{ padding: '12px 16px', background: 'var(--bg-input)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '14px' }}>{c.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{c.relation}</div>
                  </div>
                  <a href={`tel:${c.number.replace(/[^0-9+]/g, '')}`} className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px', textDecoration: 'none' }}>
                    📞 Call {c.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
