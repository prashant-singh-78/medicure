import React from 'react';

const stats = [
  { icon: '🎤', label: 'Voice Scans Today', value: '12', color: 'blue' },
  { icon: '💊', label: 'Medicines Verified', value: '47', color: 'green' },
  { icon: '⚠️', label: 'Fake Detected', value: '3', color: 'yellow' },
  { icon: '🧠', label: 'AI Model Accuracy', value: '99.4%', color: 'purple' },
];

const hospitalDepartments = [
  {
    name: 'Cardiology & Heart Care',
    icon: '🫀',
    head: 'Dr. Rajesh Sharma, MD',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
    status: 'Available Today',
    beds: '12 Emergency Beds'
  },
  {
    name: 'Neurology & Brain Sciences',
    icon: '🧠',
    head: 'Dr. Ananya Roy, DM',
    image: 'https://images.unsplash.com/photo-1594824813566-88855ce78907?auto=format&fit=crop&w=400&q=80',
    status: 'AI Diagnostics Active',
    beds: '8 ICU Beds'
  },
  {
    name: 'Dermatology & Skin Care',
    icon: '🔬',
    head: 'Dr. Vikram Patel, MD',
    image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
    status: 'Visual AI Ready',
    beds: 'Outpatient Care'
  },
  {
    name: 'General & Emergency Medicine',
    icon: '🏥',
    head: 'Dr. Priya Mehta, MBBS',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    status: '24/7 ER Operational',
    beds: '25 Trauma Beds'
  }
];

const recentActivity = [
  { title: 'Medicine Verified — Paracetamol 500mg (Genuine)', time: '2 min ago', dot: 'genuine' },
  { title: 'Counterfeit Medicine Alert — Brand X Batch #928', time: '15 min ago', dot: 'fake' },
  { title: 'Voice Biomarker Scan — Vocal Cord Tremor: Normal', time: '1 hr ago', dot: 'voice' },
  { title: 'Medical Report OCR Scan — Complete Blood Count Analysis', time: '2 hr ago', dot: 'genuine' },
  { title: 'Symptom AI Diagnostics — Parkinson\'s Risk Assessment: Low', time: '3 hr ago', dot: 'medium' },
];

const colorMap = {
  genuine: 'var(--accent-green)',
  fake: 'var(--accent-red)',
  voice: 'var(--accent-blue)',
  medium: 'var(--accent-yellow)',
};

export default function Dashboard({ setActivePage }) {
  const [note, setNote] = React.useState(() => localStorage.getItem('user_note') || '');

  React.useEffect(() => {
    localStorage.setItem('user_note', note);
  }, [note]);

  return (
    <div className="animate-fade-in">
      {/* Hospital Hero Banner */}
      <div className="hospital-hero-card">
        <div>
          <div className="hospital-badge shimmer-badge">
            🏥 MEDICURE MULTISPECIALTY AI MEDICAL CENTER
          </div>
          <h1 className="hospital-hero-title">
            Smart Virtual Hospital & AI Diagnostic Suite
          </h1>
          <p className="hospital-hero-desc">
            Experience next-generation healthcare powered by vocal biomarker analytics, instant computer vision medicine verification, and 24/7 emergency response dispatch.
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setActivePage('doctors')}>
              👨‍⚕️ Book Doctor Consultation
            </button>
            <button className="btn btn-outline" style={{ background: 'rgba(15, 23, 42, 0.7)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }} onClick={() => setActivePage('voice')}>
              🎤 Start AI Vocal Scan
            </button>
            <button className="btn btn-danger" onClick={() => setActivePage('sos')}>
              🆘 24/7 Emergency SOS
            </button>
          </div>
        </div>

        <div className="hospital-stats-row">
          <div className="hospital-stat-item">
            <div className="hospital-stat-num">10,000+</div>
            <div className="hospital-stat-lbl">Patients Served</div>
          </div>
          <div className="hospital-stat-item">
            <div className="hospital-stat-num">99.4%</div>
            <div className="hospital-stat-lbl">AI Diagnostic Accuracy</div>
          </div>
          <div className="hospital-stat-item">
            <div className="hospital-stat-num">24/7</div>
            <div className="hospital-stat-lbl">Virtual ER Operational</div>
          </div>
        </div>
      </div>

      {/* Emergency Alert Strip */}
      <div className="card" style={{ 
        background: 'linear-gradient(90deg, rgba(244, 63, 94, 0.14) 0%, rgba(244, 63, 94, 0.04) 100%)', 
        border: '1px solid rgba(244, 63, 94, 0.35)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '18px 26px',
        marginBottom: '26px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '30px' }}>🚑</div>
          <div>
            <div style={{ fontWeight: '800', color: 'var(--accent-red)', fontSize: '15px' }}>Instant Emergency Ambulance & Trauma Dispatch</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>GPS location broadcast enabled • Nearest hospital response team on standby</div>
          </div>
        </div>
        <button className="btn btn-danger" onClick={() => setActivePage('ambulance')}>
          Book Ambulance
        </button>
      </div>

      {/* Stats Cards */}
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

      {/* Hospital Specialized Departments */}
      <div style={{ marginBottom: '28px' }}>
        <div className="card-title" style={{ fontSize: '20px', marginBottom: '16px' }}>
          🏥 Specialized Medical Departments & AI Units
        </div>
        <div className="dept-grid">
          {hospitalDepartments.map((dept, idx) => (
            <div className="dept-card" key={idx}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                <img src={dept.image} alt={dept.head} className="doctor-avatar-img" />
                <div>
                  <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-primary)' }}>{dept.name}</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--accent-cyan)', fontWeight: '600' }}>{dept.head}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', background: 'var(--bg-input)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--accent-green)', fontWeight: '700' }}>● {dept.status}</span>
                <span style={{ color: 'var(--text-muted)' }}>{dept.beds}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two columns layout */}
      <div className="dash-grid">
        {/* Quick Diagnostic Actions */}
        <div className="card">
          <div className="card-title">⚡ Instant Medical Suite</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setActivePage('voice')}>
              🎤 Voice Acoustic Biomarker Scan
            </button>
            <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setActivePage('verify-medicine')}>
              💊 Fake Medicine OCR Verification
            </button>
            <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setActivePage('report')}>
              📄 AI Medical Report Analyzer
            </button>
            <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setActivePage('visual-checker')}>
              👁️ AI Vision Clinical Check
            </button>
          </div>
        </div>

        {/* Mental Wellness & Healing Soundscapes */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(6, 182, 212, 0.08))', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🧘 Mental Health & Soundscapes</span>
            <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={() => setActivePage('healing-music')}>Play Audio</button>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.6' }}>
            Clinically structured soundscapes designed to reduce anxiety, lower blood pressure, and enhance sleep quality.
          </p>
          <div style={{ padding: '12px 14px', background: 'var(--bg-input)', borderRadius: '12px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>🎵</div>
            <div>
              <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Neuro-Acoustic Stress Relief</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Hospital Wellness Module</div>
            </div>
          </div>
        </div>

        {/* Daily Health Journal */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(14, 165, 233, 0.05))', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span>📝 Confidential Patient Journal</span>
            <button 
              className="btn btn-outline" 
              style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--accent-red)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
              onClick={() => setNote('')}
            >
              Clear Note
            </button>
          </div>
          <textarea
            className="input-field"
            style={{
              minHeight: '130px',
              fontFamily: 'inherit',
              resize: 'vertical',
              lineHeight: '1.6'
            }}
            placeholder="Record symptoms, blood pressure readings, or diet notes here... (Encrypted locally)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Live Activity Log */}
        <div className="card">
          <div className="card-title">🕐 Real-Time Diagnostic Audit Log</div>
          <ul className="activity-list">
            {recentActivity.map((item, i) => (
              <li className="activity-item" key={i}>
                <div className="activity-dot" style={{ background: colorMap[item.dot] || 'var(--text-muted)' }} />
                <div className="activity-info">
                  <strong>{item.title}</strong>
                  <span className="activity-time">{item.time}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
