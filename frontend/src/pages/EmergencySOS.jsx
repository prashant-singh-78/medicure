import React, { useState, useEffect } from 'react';

export default function EmergencySOS({ addToast }) {
  const [location, setLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isAlerting, setIsAlerting] = useState(false);
  const [contacts, setContacts] = useState([
    { name: 'Home / Family', number: '9988776655' },
    { name: 'Dr. Rajesh', number: '9876543210' }
  ]);

  const handleSOS = () => {
    setIsAlerting(true);
    addToast('🚨 EMERGENCY ALERT SENT! (Simulation)', 'error');
    
    // Log SOS to history
    fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_type: 'emergency',
        title: 'Emergency SOS Triggered',
        details: `SOS alert activated at ${new Date().toLocaleTimeString()}. ${location ? `Location: ${location.lat}, ${location.lng}` : 'Location unknown.'}`
      })
    });

    setTimeout(() => setIsAlerting(false), 5000);
  };

  const getGeolocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      addToast('Geolocation is not supported by your browser.', 'error');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
        addToast('Location updated successfully.', 'success');
      },
      () => {
        addToast('Could not fetch location. Please allow permissions.', 'error');
        setIsLocating(false);
      }
    );
  };

  useEffect(() => {
    getGeolocation();
  }, []);

  return (
    <div className="sos-container">
      <div className="page-header">
        <h1>🚨 One-Tap Emergency SOS</h1>
        <p>In case of a medical emergency, use this page to alert your contacts and share your location instantly.</p>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: 'minmax(350px, 1fr) 2fr' }}>
        {/* SOS Action Card */}
        <div className="card" style={{ textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.02)' }}>
          <div className="card-title" style={{ color: 'var(--accent-red)' }}>🆘 EMERGENCY BUTTON</div>
          <div style={{ margin: '40px 0' }}>
            <button 
              className={`sos-button ${isAlerting ? 'active' : ''}`}
              onClick={handleSOS}
              style={{
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                color: '#fff',
                fontSize: '28px',
                fontWeight: 'bold',
                border: '8px solid rgba(239, 68, 68, 0.2)',
                boxShadow: '0 0 30px rgba(239, 68, 68, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              {isAlerting ? 'ALERTING...' : 'SOS'}
            </button>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Pressing SOS will simulate sending an alert with your location to your contacts.</p>
        </div>

        {/* Location & Contacts Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>📍 Your Current Location</span>
              <button onClick={getGeolocation} className="btn btn-outline" style={{ fontSize: '11px', padding: '4px 10px' }}>
                {isLocating ? 'Locating...' : 'Refresh'}
              </button>
            </div>
            {location ? (
              <div style={{ padding: '15px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.1)' }}>
                 <div style={{ fontSize: '15px', fontWeight: 'bold' }}>Latitude: {location.lat.toFixed(6)}</div>
                 <div style={{ fontSize: '15px', fontWeight: 'bold' }}>Longitude: {location.lng.toFixed(6)}</div>
                 <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Approximate location coordinates fetched from GPS/WiFi.</p>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Location permission required.</p>
            )}
          </div>

          <div className="card">
            <div className="card-title">👥 Emergency Contacts</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {contacts.map((c, i) => (
                <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{c.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>📞 {c.number}</div>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>Active ✅</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .sos-button:hover { transform: scale(1.05); filter: brightness(1.1); }
        .sos-button:active { transform: scale(0.95); }
        .sos-button.active { animation: pulse-sos 1s infinite; }
        @keyframes pulse-sos {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 30px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}
