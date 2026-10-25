import React, { useState, useEffect, useMemo, useCallback } from 'react';

const ACTIVITY_META = {
  disease: { icon: '🤒', label: 'Disease Prediction', color: 'var(--accent-red)' },
  skin: { icon: '🔬', label: 'Skin Analysis', color: 'var(--accent-cyan)' },
  report: { icon: '📄', label: 'Medical Report', color: 'var(--accent-purple)' },
  voice: { icon: '🎤', label: 'Voice Scan', color: 'var(--accent-yellow)' },
  emergency: { icon: '🆘', label: 'Emergency SOS', color: 'var(--accent-red)' },
  medicine: { icon: '💊', label: 'Medicine Check', color: 'var(--accent-green)' },
  default: { icon: '🩺', label: 'Health Event', color: 'var(--accent-cyan)' }
};

export default function History({ addToast, setActivePage }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401) {
        window.dispatchEvent(new CustomEvent('medicure:session-expired'));
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setHistory(data);
      } else {
        addToast('Failed to load past diagnostic records.', 'error');
      }
    } catch {
      addToast('Error connecting to medical history database.', 'error');
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    let ignore = false;
    const loadInitialHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }
        const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.status === 401) {
          window.dispatchEvent(new CustomEvent('medicure:session-expired'));
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (!ignore) {
          if (res.ok && Array.isArray(data)) {
            setHistory(data);
          } else {
            addToast('Failed to load past diagnostic records.', 'error');
          }
        }
      } catch {
        if (!ignore) addToast('Error connecting to medical history database.', 'error');
      }
      if (!ignore) setLoading(false);
    };

    loadInitialHistory();
    return () => { ignore = true; };
  }, [addToast]);

  const clearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your medical history records? This cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/history/clear/', { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });
      if (res.status === 401) {
        window.dispatchEvent(new CustomEvent('medicure:session-expired'));
        return;
      }
      if (res.ok) {
        setHistory([]);
        addToast('History records cleared successfully.', 'success');
      } else {
        addToast('Failed to clear history records.', 'error');
      }
    } catch {
      addToast('Error connecting to backend server.', 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Just now';
    try {
      // Ensure UTC representation if lacking timezone
      const formattedInput = dateStr.includes('T') ? (dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`) : dateStr;
      const d = new Date(formattedInput);
      if (isNaN(d.getTime())) {
        const fallback = new Date(dateStr);
        return isNaN(fallback.getTime()) ? dateStr : fallback.toLocaleString();
      }
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase();
    return history.filter(item => {
      const matchesType = activeFilter === 'all' || item.activity_type === activeFilter;
      if (!matchesType) return false;
      if (!q) return true;
      return (
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.details && item.details.toLowerCase().includes(q)) ||
        (item.activity_type && item.activity_type.toLowerCase().includes(q))
      );
    });
  }, [history, search, activeFilter]);

  const token = localStorage.getItem('token');

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img 
            src="/brand_logo.png" 
            alt="Medicure Brand Logo" 
            style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1.5px solid var(--accent-red)', boxShadow: '0 0 15px rgba(244, 63, 94, 0.35)', flexShrink: 0 }} 
          />
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>📆 Patient Diagnostic History & Activity</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13.5px' }}>
              Encrypted timeline of your symptom assessments, AI diagnostic scans, and clinical checkups.
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn btn-outline" 
              style={{ fontSize: '13px', padding: '8px 14px' }}
              onClick={fetchHistory}
            >
              🔄 Refresh
            </button>
            <button 
              className="btn btn-outline" 
              style={{ color: 'var(--accent-red)', borderColor: 'rgba(239, 68, 68, 0.35)', fontSize: '13px', padding: '8px 14px' }} 
              onClick={clearHistory}
            >
              🗑️ Clear History
            </button>
          </div>
        )}
      </div>

      {!token ? (
        <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px 24px', border: '1px solid var(--accent-cyan)' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Authentication Required</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
            Please log in or authenticate with the Demo Patient profile to view and track your diagnostic history securely.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.dispatchEvent(new CustomEvent('medicure:session-expired'))}
            style={{ padding: '10px 24px', fontSize: '14px' }}
          >
            Go to Login
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Controls: Search and Filter Pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            <div className="input-group" style={{ maxWidth: '480px', margin: 0 }}>
              <input 
                className="input-field" 
                placeholder="🔍 Search past checkups, symptoms, or findings..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '12px 18px', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginRight: '4px' }}>Filter:</span>
              {[
                { id: 'all', label: 'All Records' },
                { id: 'disease', label: '🤒 Disease Prediction' },
                { id: 'skin', label: '🔬 Skin' },
                { id: 'report', label: '📄 Report' },
                { id: 'voice', label: '🎤 Voice' },
                { id: 'emergency', label: '🆘 SOS' },
                { id: 'medicine', label: '💊 Medicine' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  style={{
                    background: activeFilter === f.id ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                    color: activeFilter === f.id ? '#0f172a' : 'var(--text-secondary)',
                    border: activeFilter === f.id ? '1px solid var(--accent-cyan)' : '1px solid var(--border)',
                    borderRadius: '20px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Timeline List */}
          <div className="card" style={{ padding: '24px', borderRadius: '16px', background: 'var(--card-bg, #131d33)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div className="card-title" style={{ margin: 0, fontSize: '18px' }}>
                📋 Diagnostic Timeline ({filteredHistory.length} events)
              </div>
            </div>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
                <span className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 16px', borderWidth: '3.5px' }} />
                <p>Retrieving authorized health records from secure database...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '52px', marginBottom: '14px' }}>🩺</div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '18px' }}>
                  {history.length === 0 ? 'No diagnostic records recorded yet' : 'No records match your filter'}
                </h3>
                <p style={{ fontSize: '13.5px', maxWidth: '420px', margin: '0 auto 20px' }}>
                  {history.length === 0 
                    ? 'Start by running an AI disease prediction, skin analysis, or voice acoustic checkup to populate your health history.' 
                    : 'Try clearing your search query or selecting "All Records" above.'}
                </p>
                {history.length === 0 ? (
                  <button 
                    className="btn btn-primary"
                    onClick={() => setActivePage ? setActivePage('disease') : window.location.reload()}
                    style={{ padding: '10px 22px', fontSize: '13.5px' }}
                  >
                    🚀 Start New Health Checkup
                  </button>
                ) : (
                  <button 
                    className="btn btn-outline"
                    onClick={() => { setSearch(''); setActiveFilter('all'); }}
                    style={{ padding: '8px 18px', fontSize: '13px' }}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {filteredHistory.map((item) => {
                  const meta = ACTIVITY_META[item.activity_type] || ACTIVITY_META.default;
                  return (
                    <div 
                      key={item.id} 
                      style={{ 
                        background: 'rgba(255,255,255,0.025)', 
                        padding: '18px', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', 
                        gap: '16px', 
                        alignItems: 'flex-start',
                        transition: 'transform 0.15s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    >
                      <div style={{ 
                        fontSize: '24px', 
                        background: 'rgba(255,255,255,0.06)', 
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {meta.icon}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              fontSize: '11px', 
                              fontWeight: '700', 
                              padding: '2px 8px', 
                              borderRadius: '6px', 
                              background: 'rgba(255,255,255,0.08)',
                              color: meta.color 
                            }}>
                              {meta.label}
                            </span>
                            <strong style={{ color: 'var(--text-primary)', fontSize: '15.5px' }}>{item.title}</strong>
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                            🕒 {formatDate(item.created_at)}
                          </span>
                        </div>

                        <div style={{ 
                          fontSize: '13px', 
                          color: 'var(--text-secondary)', 
                          lineHeight: '1.55', 
                          whiteSpace: 'pre-wrap',
                          background: 'rgba(0,0,0,0.2)',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          marginTop: '8px',
                          border: '1px solid rgba(255,255,255,0.03)'
                        }}>
                          {item.details}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
