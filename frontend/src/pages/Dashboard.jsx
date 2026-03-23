import React from 'react';

const stats = [
  { icon: '🎤', label: 'Voice Scans Today', value: '12', color: 'blue' },
  { icon: '💊', label: 'Medicines Verified', value: '47', color: 'green' },
  { icon: '⚠️', label: 'Fake Detected', value: '3', color: 'yellow' },
  { icon: '🧠', label: 'Model Accuracy', value: '94%', color: 'purple' },
];

const recentActivity = [
  { color: '#10b981', title: 'Medicine Verified — Paracetamol 500mg', time: '2 min ago', dot: 'genuine' },
  { color: '#ef4444', title: 'Fake Medicine Detected — Brand X', time: '15 min ago', dot: 'fake' },
  { color: '#3b82f6', title: 'Voice Analysis — Parkinson\'s Risk: Low', time: '1 hr ago', dot: 'voice' },
  { color: '#10b981', title: 'Medicine Verified — Amoxicillin 250mg', time: '2 hr ago', dot: 'genuine' },
  { color: '#f59e0b', title: 'Voice Analysis — Risk: Medium', time: '3 hr ago', dot: 'medium' },
];

const colorMap = {
  genuine: '#10b981',
  fake: '#ef4444',
  voice: '#3b82f6',
  medium: '#f59e0b',
};

export default function Dashboard({ setActivePage }) {
  const [note, setNote] = React.useState(() => localStorage.getItem('user_note') || '');

  React.useEffect(() => {
    localStorage.setItem('user_note', note);
  }, [note]);

  return (
    <div>
      <div className="page-header">
        <h1>🏠 Dashboard</h1>
        <p>Welcome to Smart Healthcare Assistant — AI-powered health analysis at your fingertips.</p>
      </div>

      {/* Emergency SOS Banner */}
      <div className="card" style={{ 
        background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)', 
        border: '1px solid rgba(239, 68, 68, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 25px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '24px' }}>🆘</div>
          <div>
            <div style={{ fontWeight: 'bold', color: 'var(--accent-red)' }}>Emergency SOS</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Instantly alert your contacts with your location.</div>
          </div>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ background: 'var(--accent-red)', border: 'none', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
          onClick={() => setActivePage('sos')}
        >
          Activate SOS
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map(s => (
          <div className="stat-card" key={s.label}>
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div className="stat-info">
              <div className="value">{s.value}</div>
              <div className="label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="dash-grid">
        {/* Quick Actions */}
        <div className="card">
          <div className="card-title">⚡ Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setActivePage('voice')}>
              🎤 Start Voice Analysis
            </button>
            <button className="btn btn-outline" style={{ border: 'none', background: 'rgba(255,255,255,0.05)', width: '100%', justifyContent: 'center' }} onClick={() => setActivePage('verify-medicine')}>
              💊 Verify Medicine
            </button>
            <button className="btn btn-outline" style={{ border: 'none', background: 'rgba(255,255,255,0.05)', width: '100%', justifyContent: 'center' }} onClick={() => setActivePage('reminders')}>
              ⏰ Set Reminder
            </button>
            <button className="btn btn-outline" style={{ border: 'none', background: 'rgba(255,255,255,0.05)', width: '100%', justifyContent: 'center' }} onClick={() => setActivePage('visual-checker')}>
              📸 AI Vision Check
            </button>
            <button className="btn btn-outline" style={{ border: 'none', background: 'rgba(255,255,255,0.05)', width: '100%', justifyContent: 'center' }} onClick={() => addToast('QR Scanner coming soon!', 'info')}>
              🔍 Scan QR Code
            </button>
          </div>
        </div>

        {/* Healing Music Feature */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(236,72,153,0.08))', border: '1px solid rgba(168,85,247,0.2)' }}>
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🎧 Healing Music</span>
            <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => setActivePage('healing-music')}>Play Now</button>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Relax your mind with our curated healing playlist. Proven to reduce stress and anxiety.
          </p>
          <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎵</div>
            <div>
              <div style={{ fontWeight: 'bold' }}>Mental Healing & Focus</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>YouTube Music Playlist</div>
            </div>
          </div>
        </div>

        {/* Note Pad */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(20,184,166,0.05))', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span>📝 Daily Note Pad</span>
            <button 
              className="btn btn-outline" 
              style={{ padding: '2px 8px', fontSize: '10px', height: 'auto', background: 'rgba(239, 68, 68, 0.05)', color: 'var(--accent-red)', border: 'none' }}
              onClick={() => setNote('')}
            >
              Clear
            </button>
          </div>
          <textarea
            style={{
              width: '100%',
              minHeight: '130px',
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '12px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              lineHeight: '1.6'
            }}
            placeholder="Note down your routine or any health observations here... (autosaves)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-title">🕐 Recent Activity</div>
          <ul className="activity-list">
            {recentActivity.map((item, i) => (
              <li className="activity-item" key={i}>
                <div className="activity-dot" style={{ background: colorMap[item.dot] || '#475569' }} />
                <div className="activity-info">
                  <strong>{item.title}</strong>
                  <span className="activity-time">{item.time}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Info banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(6,182,212,0.08))', borderColor: 'rgba(59,130,246,0.25)' }}>
        <div className="card-title">📋 About This Platform</div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          Smart Healthcare Assistant combines <strong style={{ color: 'var(--accent-cyan)' }}>Voice-Based Disease Detection</strong> (using ML models trained on vocal biomarkers)
          with a <strong style={{ color: 'var(--accent-cyan)' }}>Fake Medicine Verification</strong> system (QR code database lookup + image OCR analysis).
          This platform is designed for educational and research purposes.
        </p>
      </div>
    </div>
  );
}
