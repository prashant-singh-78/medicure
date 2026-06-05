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

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'about-app', label: 'About Platform', icon: 'ℹ️' },
  { id: 'meditation', label: 'Meditation', icon: '🧘' },
  { id: 'voice', label: 'Voice Analysis', icon: '🎤' },
  { id: 'verify-medicine', label: 'Medicine Check', icon: '💊' },
  { id: 'disease', label: 'Disease Predictor', icon: '🤒' },
  { id: 'skin', label: 'Skin Problem Detector', icon: '📸' },
  { id: 'report', label: 'Report Analyzer', icon: '📄' },
  { id: 'doctors', label: 'Find Doctors', icon: '👨‍⚕️' },
  { id: 'ambulance', label: 'Ambulance', icon: '🚑' },
  { id: 'about-disease', label: 'About Disease', icon: '📚' },
  { id: 'suggestion', label: 'Suggestion', icon: '🚀' },
  { id: 'healing-music', label: 'Healing Music', icon: '🎵' },
  { id: 'reminders', label: 'Reminders', icon: '⏰' },
  { id: 'visual-checker', label: 'AI Vision Checker', icon: '📸' },
  { id: 'sos', label: 'Emergency SOS', icon: '🆘' },
  { id: 'ayurveda', label: 'Ayurveda', icon: '🪴' },
  { id: 'bmi', label: 'BMI Calculator', icon: '⚖️' },
  { id: 'history', label: 'Past Data', icon: '📆' },
  { id: 'friend-chat', label: 'Friend Chat', icon: '💬' },
];

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activePage, setActivePage] = useState('dashboard');
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [toasts, setToasts] = useState([]);
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
    addToast('Logged out successfully.', 'info');
  };

  const renderPage = () => {
    if (activePage === 'dashboard') return <Dashboard setActivePage={setActivePage} />;
    if (activePage === 'about-app') return <AboutApp />;
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


  return (
    <div className={`app-layout ${theme === 'light' ? 'light-theme' : 'dark-theme'}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🏥</div>
          <div className="logo-text">
            Medicure
            <span>AI-Powered Assistant</span>
          </div>
        </div>

        <div className="nav-section-label">Navigation</div>
        {navItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}

        <div className="sidebar-footer" style={{ borderTop: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className="btn btn-outline"
            style={{ width: '100%', justifyContent: 'center', fontSize: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            onClick={toggleTheme}
          >
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'white' }}>
              {user.full_name?.[0] || 'U'}
            </div>
            <div style={{ textAlign: 'left', overflow: 'hidden' }}>
              <div style={{ fontWeight: 'bold', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{user.email}</div>
            </div>
          </div>
          <button className="btn btn-outline" style={{ border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', width: '100%', justifyContent: 'center', fontSize: '12px' }} onClick={handleLogout}>
            🚪 Logout
          </button>
          <div style={{ marginTop: '8px' }}>Medicure AI v2.0 © 2026</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {renderPage()}
      </main>

      {/* Toast Notifications */}
      <Toast toasts={toasts} />
    </div>
  );
}
