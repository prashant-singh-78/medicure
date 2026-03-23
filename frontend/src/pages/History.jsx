import React, { useState, useEffect } from 'react';

export default function History({ addToast }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (res.ok) {
        setHistory(data);
      } else {
        addToast('Failed to load past data', 'error');
      }
    } catch {
      addToast('Error connecting to backend.', 'error');
    }
    setLoading(false);
  };

  const clearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all past data? This cannot be undone.')) return;
    
    try {
      const res = await fetch('/api/history/clear/', { method: 'DELETE' });
      if (res.ok) {
        setHistory([]);
        addToast('History cleared successfully', 'success');
      } else {
        addToast('Failed to clear history', 'error');
      }
    } catch {
      addToast('Error connecting to backend.', 'error');
    }
  };

  const getActivityIcon = (type) => {
    const icons = { disease: '🤒', report: '📄', medicine: '💊', voice: '🎤' };
    return icons[type] || '🔍';
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>📆 Past Data & History</h1>
          <p>Your previous interactions, analyses, and predictions are stored here.</p>
        </div>
        {history.length > 0 && (
          <button className="btn btn-outline" style={{ color: 'var(--accent-red)', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={clearHistory}>
            🗑️ Clear All
          </button>
        )}
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="card-title">Recent Activity</div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            <span className="spinner" style={{ width: '30px', height: '30px', margin: '0 auto 16px', borderWidth: '3px' }} />
            <p>Loading your past data...</p>
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📂</div>
            <p>No past data found. Start by running an analysis!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.map((item) => (
              <div key={item.id} style={{ 
                background: 'var(--bg-secondary)', 
                padding: '16px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)',
                display: 'flex', gap: '16px', alignItems: 'flex-start'
              }}>
                <div style={{ fontSize: '24px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                  {getActivityIcon(item.activity_type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>{item.title}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(item.created_at + "Z").toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {item.details}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
