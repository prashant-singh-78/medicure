import React, { useState, useEffect } from 'react';

export default function AboutDisease({ addToast }) {
  const [diseases, setDiseases] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState(null); // { diseaseName: string, meds: [] }
  const [suggestLoading, setSuggestLoading] = useState(false);

  const fetchSuggestions = async (disease) => {
    setSuggestLoading(true);
    setSuggestions(null);
    try {
      // Try searching by disease name first, if few results, try symptoms
      const res = await fetch(`/api/medicine/suggest?symptoms=${encodeURIComponent(disease.name)}`);
      const data = await res.json();
      setSuggestions({ diseaseName: disease.name, meds: data });
    } catch {
      addToast('Error fetching suggestions.', 'error');
    }
    setSuggestLoading(false);
  };

  useEffect(() => {
    fetch('/api/disease-info/list')
      .then(res => res.json())
      .then(data => {
        setDiseases(data);
        setLoading(false);
      })
      .catch(() => {
        addToast('Error loading disease data.', 'error');
        setLoading(false);
      });
  }, []);

  const filtered = diseases.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.symptoms.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1>📚 About Diseases</h1>
        <p>Explore symptoms, recommended tests, and specialists for various health conditions.</p>
      </div>

      <div className="input-group" style={{ maxWidth: '400px', marginBottom: '24px' }}>
        <input 
          className="input-field" 
          placeholder="Search disease or symptom..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }} />
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading health database...</p>
        </div>
      ) : (
        <div className="medicine-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {filtered.map((d, i) => (
            <div key={i} className="card disease-card" style={{ transition: 'transform 0.2s' }}>
              <div className="card-title" style={{ color: 'var(--accent-cyan)', fontSize: '18px' }}>{d.name}</div>
              
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px' }}>SYMPTOMS</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{d.symptoms}</div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px' }}>RECOMMENDED TESTS</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{d.tests}</div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>👨‍⚕️ Consultant:</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--accent-purple)' }}>{d.consultant}</span>
                </div>
                <button 
                  className="btn btn-outline" 
                   style={{ fontSize: '12px', padding: '6px 12px' }}
                   onClick={() => fetchSuggestions(d)}
                   disabled={suggestLoading}
                >
                  🚀 Suggest Meds
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggestion Modal/Panel */}
      {suggestions && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setSuggestions(null)}>
          <div className="modal-content card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div className="card-title" style={{ marginBottom: 0 }}>💊 Suggested Medicines for {suggestions.diseaseName}</div>
              <button className="btn" onClick={() => setSuggestions(null)} style={{ padding: '4px 8px' }}>✖</button>
            </div>
            
            <div className="medicine-grid" style={{ gridTemplateColumns: '1fr' }}>
              {suggestions.meds.length > 0 ? suggestions.meds.map((m, i) => (
                <div key={i} className="card" style={{ border: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{m.product_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.salt_composition}</div>
                  <div style={{ fontSize: '13px', marginTop: '8px', color: 'var(--text-secondary)' }}>{m.medicine_desc?.substring(0, 100)}...</div>
                  <div style={{ marginTop: '8px', color: 'var(--accent-green)', fontWeight: 'bold' }}>{m.product_price}</div>
                </div>
              )) : (
                <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No direct suggestions found. Please consult a doctor.</p>
              )}
            </div>
            
            <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
              ⚠️ These are AI-suggested medicines based on historical data. **Always** consult a doctor before starting any medication.
            </p>
          </div>
        </div>
      )}

      {suggestLoading && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001 }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }} />
        </div>
      )}
    </div>
  );
}
