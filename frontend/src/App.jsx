import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import VoiceDetection from './pages/VoiceDetection';
import AboutApp from './pages/AboutApp';
import MedicineDetection from './pages/MedicineDetection';
import ReportAnalyzer from './pages/ReportAnalyzer';
import DiseasePrediction from './pages/DiseasePrediction';
import History from './pages/History';
import SkinAnalyzer from './pages/SkinAnalyzer';
import Doctors from './pages/Doctors';
import Ambulance from './pages/Ambulance';
import AboutDisease from './pages/AboutDisease';
import MedicineSuggestion from './pages/MedicineSuggestion';
import Meditation from './pages/Meditation';
import Login from './pages/Login';
import Register from './pages/Register';
import FriendChat from './pages/FriendChat';
import HealingMusic from './pages/HealingMusic';
import MedicineReminder from './pages/MedicineReminder';
import VisualChecker from './pages/VisualChecker';
import EmergencySOS from './pages/EmergencySOS';
import Ayurveda from './pages/Ayurveda';
import BMICalculator from './pages/BMICalculator';
import Toast from './components/Toast';

const navCategories = [
  {
    category: 'Core AI Tools',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'voice', label: 'Voice Analysis', icon: '🎤' },
      { id: 'visual-checker', label: 'AI Vision Checker', icon: '👁️' },
      { id: 'skin', label: 'Skin Problem Detector', icon: '🔍' },
      { id: 'disease', label: 'Disease Predictor', icon: '🩺' },
      { id: 'report', label: 'Report Analyzer', icon: '📄' },
      { id: 'verify-medicine', label: 'Medicine Check', icon: '💊' },
    ]
  },
  {
    category: 'Care & Emergency',
    items: [
      { id: 'sos', label: 'Emergency SOS', icon: '🆘' },
      { id: 'doctors', label: 'Find Doctors', icon: '👨‍⚕️' },
      { id: 'ambulance', label: 'Ambulance', icon: '🚑' },
    ]
  },
  {
    category: 'Wellness & Lifestyle',
    items: [
      { id: 'meditation', label: 'Meditation', icon: '🧘' },
      { id: 'healing-music', label: 'Healing Music', icon: '🎵' },
      { id: 'ayurveda', label: 'Ayurveda', icon: '🪴' },
      { id: 'bmi', label: 'BMI Calculator', icon: '⚖️' },
    ]
  },
  {
    category: 'Records & Assistant',
    items: [
      { id: 'reminders', label: 'Reminders', icon: '⏰' },
      { id: 'history', label: 'Past Data', icon: '📆' },
      { id: 'friend-chat', label: 'AI Friend Chat', icon: '💬' },
      { id: 'suggestion', label: 'Suggestions', icon: '💡' },
      { id: 'about-disease', label: 'About Disease', icon: '📚' },
      { id: 'about-app', label: 'About Platform', icon: 'ℹ️' },
    ]
  }
];

// Flatten for quick title lookup
const allNavItems = navCategories.flatMap(c => c.items);

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showStandaloneAbout, setShowStandaloneAbout] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [toasts, setToasts] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  React.useEffect(() => {
    document.body.className = theme === 'light' ? 'light-theme' : 'dark-theme';
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowStandaloneAbout(true);
    addToast('Logged out successfully.', 'info');
  };

  const activeItem = allNavItems.find(item => item.id === activePage) || { label: 'Dashboard', icon: '📊' };

  const renderPage = () => {
    if (activePage === 'dashboard') return <Dashboard setActivePage={setActivePage} />;
    if (activePage === 'about-app') return <AboutApp setActivePage={setActivePage} />;
    if (activePage === 'voice') return <VoiceDetection addToast={addToast} />;
    if (activePage === 'verify-medicine') return <MedicineDetection addToast={addToast} />;
    if (activePage === 'disease') return <DiseasePrediction addToast={addToast} />;
    if (activePage === 'skin') return <SkinAnalyzer addToast={addToast} />;
    if (activePage === 'report') return <ReportAnalyzer addToast={addToast} />;
    if (activePage === 'doctors') return <Doctors addToast={addToast} />;
    if (activePage === 'ambulance') return <Ambulance addToast={addToast} />;
    if (activePage === 'about-disease') return <AboutDisease addToast={addToast} />;
    if (activePage === 'suggestion') return <MedicineSuggestion addToast={addToast} />;
    if (activePage === 'meditation') return <Meditation addToast={addToast} />;
    if (activePage === 'history') return <History addToast={addToast} />;
    if (activePage === 'friend-chat') return <FriendChat addToast={addToast} />;
    if (activePage === 'healing-music') return <HealingMusic addToast={addToast} />;
    if (activePage === 'reminders') return <MedicineReminder addToast={addToast} />;
    if (activePage === 'visual-checker') return <VisualChecker addToast={addToast} />;
    if (activePage === 'sos') return <EmergencySOS addToast={addToast} />;
    if (activePage === 'ayurveda') return <Ayurveda addToast={addToast} />;
    if (activePage === 'bmi') return <BMICalculator addToast={addToast} />;
    return null;
  };

  if (!user) {
    return (
      <div className={`auth-wrapper ${theme === 'light' ? 'light-theme' : 'dark-theme'}`}>
        {authView === 'login' ? (
          <Login setAuth={setUser} addToast={addToast} switchToRegister={() => setAuthView('register')} />
        ) : (
          <Register addToast={addToast} switchToLogin={() => setAuthView('login')} />
        )}
        <Toast toasts={toasts} />
      </div>
    );
  }

  /* STANDALONE ABOUT LANDING PAGE (SEPARATE FROM SIDEBAR MAIN APP) */
  if (showStandaloneAbout) {
    return (
      <div className={`standalone-about-wrapper ${theme === 'light' ? 'light-theme' : 'dark-theme'}`}>
        <div className="standalone-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="logo-icon" style={{ fontSize: '26px' }}>🩺</div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '18px', color: 'var(--text-primary)' }}>Medicure Link</div>
              <div style={{ fontSize: '11.5px', color: 'var(--accent-blue)', fontWeight: '600' }}>AI Health Suite Portal</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button 
              className="theme-toggle-btn" 
              onClick={toggleTheme} 
              style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px' }}
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>

            <button 
              className="services-btn-pulse" 
              onClick={() => { setShowStandaloneAbout(false); setActivePage('dashboard'); }}
            >
              <span>⚡ Open Main App & Services</span>
              <span>➔</span>
            </button>

            <button 
              className="btn btn-outline" 
              onClick={handleLogout} 
              style={{ border: 'none', background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-red)', fontSize: '12px' }}
            >
              🚪 Log Out
            </button>
          </div>
        </div>

        <AboutApp 
          setActivePage={(page) => {
            setShowStandaloneAbout(false);
            setActivePage(page);
          }}
          onEnterMainApp={() => {
            setShowStandaloneAbout(false);
            setActivePage('dashboard');
          }}
          isStandalone={true}
        />
        <Toast toasts={toasts} />
      </div>
    );
  }

  return (
    <div className={`app-layout ${theme === 'light' ? 'light-theme' : 'dark-theme'}`}>
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-overlay active" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">🩺</div>
          <div className="logo-text">
            Medicure Link
            <span>AI Health Suite</span>
          </div>
          <button className="mobile-close-btn" onClick={() => setMobileMenuOpen(false)}>✕</button>
        </div>

        {navCategories.map((cat, idx) => (
          <React.Fragment key={idx}>
            <div className="nav-section-label">{cat.category}</div>
            {cat.items.map(item => (
              <div
                key={item.id}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => {
                  if (item.id === 'about-app') {
                    setShowStandaloneAbout(true);
                  } else {
                    setActivePage(item.id);
                  }
                  setMobileMenuOpen(false);
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </React.Fragment>
        ))}

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-card)', borderRadius: '12px', marginBottom: '10px', border: '1px solid var(--border)' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: 'white', flexShrink: 0 }}>
              {user.full_name?.[0] || 'U'}
            </div>
            <div style={{ textAlign: 'left', overflow: 'hidden' }}>
              <div style={{ fontWeight: '700', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12.5px', color: 'var(--text-primary)' }}>{user.full_name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>{user.email || 'User Account'}</div>
            </div>
          </div>
          <button className="btn btn-outline" style={{ border: 'none', background: 'rgba(244, 63, 94, 0.12)', color: 'var(--accent-red)', width: '100%', justifyContent: 'center', fontSize: '12px' }} onClick={handleLogout}>
            🚪 Log Out
          </button>
          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '10.5px', color: 'var(--text-muted)' }}>Medicure AI v2.0 • Pro Platform</div>
        </div>
      </aside>

      {/* Main Wrapper with Top Header */}
      <div className="main-wrapper">
        <header className="top-header">
          <div className="top-header-left">
            <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle Navigation">
              ☰
            </button>
            <span style={{ fontSize: '18px' }}>{activeItem.icon}</span>
            <span className="header-title-text" style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-primary)' }}>{activeItem.label}</span>
            <div className="status-indicator-pill hide-on-mobile" style={{ marginLeft: '12px' }}>
              <div className="pulse-dot"></div>
              <span>AI System Online</span>
            </div>
          </div>

          <div className="top-header-right">
            <button
              className="btn btn-outline emergency-sos-header-btn"
              style={{ padding: '6px 14px', fontSize: '12px', borderColor: 'rgba(244, 63, 94, 0.4)', color: 'var(--accent-red)', background: 'rgba(244, 63, 94, 0.08)' }}
              onClick={() => setActivePage('sos')}
            >
              🆘 Emergency SOS
            </button>
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
            >
              {theme === 'light' ? '🌙' : '☀️'}
              <span className="theme-toggle-label">{theme === 'light' ? ' Dark' : ' Light'}</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          {renderPage()}
        </main>
      </div>

      {/* Toast Notifications */}
      <Toast toasts={toasts} />
    </div>
  );
}
