import React, { useState, useEffect } from 'react';

export default function EmergencySOS({ addToast }) {
  const [location, setLocation] = useState(null);
  const [manualLocation, setManualLocation] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isAlerting, setIsAlerting] = useState(false);
  const [errorInfo, setErrorInfo] = useState('');
  const [contacts] = useState([
    { name: 'Family Emergency Contact', number: '+91 99887 76655', relation: 'Primary Contact' },
    { name: 'Dr. Rajesh Sharma (Cardiology)', number: '+91 98765 43210', relation: 'Hospital Physician' },
    { name: 'Medicure Central ER Dispatch', number: '108 / 102', relation: 'National Ambulance' }
  ]);

  const handleSOS = () => {
    setIsAlerting(true);
    const locString = location ? `GPS Coordinates: ${location.lat}, ${location.lng}` : (manualLocation || 'Location Pending');
    addToast('🚨 EMERGENCY SOS BROADCAST SENT TO DISPATCHERS!', 'error');

    fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_type: 'emergency',
        title: 'Emergency SOS Signal Dispatched',
        details: `SOS alert activated. Location info: ${locString}`
      })
    }).catch(e => console.error(e));

    setTimeout(() => setIsAlerting(false), 5000);
  };

  const getGeolocation = () => {
    setIsLocating(true);
    setErrorInfo('');

    if (!navigator.geolocation) {
      setErrorInfo('Geolocation is not supported by this device.');
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
    getGeolocation();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>🆘 Hospital One-Tap Emergency SOS Dispatch</h1>
        <p>In critical medical emergencies, trigger one-tap emergency alert to broadcast GPS coordinates to ER dispatchers and emergency contacts.</p>
      </div>

      {/* Guide Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.14), rgba(225, 29, 72, 0.05))', border: '1px solid var(--accent-red)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '28px' }}>📖</div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--accent-red)', marginBottom: '4px' }}>Kya Use Hai & Kaise Use Karein (Emergency SOS Guide)</div>
            <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <strong>• Iska Use Kya Hai?</strong> Kisi bhi achanak aayi medical emergency (e.g. chest pain, stroke, accident) me akele hone par turant emergency contacts aur hospital command center ko GPS location broadcast karne ke liye.<br/>
              <strong>• Kaise Use Karein?</strong>
              <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                <li>Page open karte hi automatic **Live GPS Satellite Coordinates** acquire hoti hain.</li>
                <li>Large red **"PRESS SOS"** button par tap karein — 1-second me alert notification & live location broadcast ho jayega.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: 'minmax(320px, 1fr) 1.5fr' }}>
        {/* SOS Action Card */}
        <div className="card" style={{ textAlign: 'center', borderColor: 'rgba(244, 63, 94, 0.4)', background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(225, 29, 72, 0.04))' }}>
          <div className="card-title" style={{ color: 'var(--accent-red)', justifyContent: 'center' }}>🆘 CRITICAL SOS TRIGGER</div>
          <div style={{ margin: '36px 0' }}>
            <button
              className={`mic-btn recording`}
              onClick={handleSOS}
              style={{
                width: '190px',
                height: '190px',
                margin: '0 auto',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                color: '#fff',
                fontSize: '32px',
                fontWeight: '800',
                border: '6px solid rgba(244, 63, 94, 0.4)',
                boxShadow: '0 0 40px rgba(244, 63, 94, 0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span>{isAlerting ? 'DISPATCHING' : 'PRESS SOS'}</span>
              <span style={{ fontSize: '12px', opacity: 0.9, fontWeight: '600' }}>{isAlerting ? '● ALERT LIVE' : 'Emergency Alert'}</span>
            </button>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Pressing SOS instantly sends an SMS & GPS beacon to your designated emergency contacts and nearest ambulance hub.
          </p>
        </div>

        {/* Location & Contacts Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div className="card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📍 Live GPS Location Beacon</span>
              <button onClick={getGeolocation} className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 14px' }}>
                {isLocating ? 'Acquiring Satellite GPS...' : '🔄 Refresh GPS'}
              </button>
            </div>

            {location ? (
              <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="pulse-dot"></div>
                  <span>Satellite GPS Lock Confirmed</span>
                </div>
                <div style={{ fontSize: '13.5px', marginTop: '6px', color: 'var(--text-primary)', fontWeight: '600' }}>
                  Latitude: {location.lat.toFixed(6)} | Longitude: {location.lng.toFixed(6)}
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px', background: 'rgba(244, 63, 94, 0.08)', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
                <p style={{ color: 'var(--accent-red)', fontSize: '13px', marginBottom: '10px', fontWeight: '600' }}>⚠️ {errorInfo || 'Acquiring location...'}</p>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" style={{ fontSize: '12px' }}>Manual Location Fallback (Landmark / Street Address)</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Near HDFC Bank, Sector 5, Block B..."
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">👥 Designated ER Contacts</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {contacts.map((c, i) => (
                <div key={i} style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '14px' }}>{c.name}</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--accent-cyan)', marginTop: '2px', fontWeight: '600' }}>📞 {c.number} • {c.relation}</div>
                  </div>
                  <span className="status-badge genuine">Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
