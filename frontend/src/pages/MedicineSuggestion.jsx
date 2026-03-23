import React, { useState } from 'react';

export default function MedicineSuggestion({ addToast }) {
  const [symptoms, setSymptoms] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSuggest = async (e) => {
    e.preventDefault();
    if (symptoms.length < 2) {
      addToast('Please enter at least 2 characters.', 'info');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/medicine/suggest?symptoms=${encodeURIComponent(symptoms)}`);
      const data = await res.json();
      setResults(data);
      if (data.length === 0) {
        addToast('No direct matches found. Try different keywords.', 'info');
      }
    } catch {
      addToast('Error fetching suggestions.', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="suggestion-page">
      <div className="page-header">
        <h1>🚀 Medicine Suggestion AI</h1>
        <p>Get medicine recommendations based on your symptoms or disease names using our massive Indian medicine dataset.</p>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto 40px' }}>
        <form onSubmit={handleSuggest} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="input-label">How are you feeling? (Symptoms / Disease)</label>
            <input 
              className="input-field" 
              placeholder="e.g. Fever, Cough, Diabetes, Hypertension..." 
              value={symptoms}
              onChange={e => setSymptoms(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '45px', padding: '0 30px' }} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Get Suggestions'}
          </button>
        </form>
        <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Common searches: <span style={{ color: 'var(--accent-cyan)', cursor: 'pointer' }} onClick={() => setSymptoms('Headache')}>Headache</span>, 
          <span style={{ color: 'var(--accent-cyan)', cursor: 'pointer', marginLeft: '8px' }} onClick={() => setSymptoms('Infection')}>Infection</span>, 
          <span style={{ color: 'var(--accent-cyan)', cursor: 'pointer', marginLeft: '8px' }} onClick={() => setSymptoms('Acidity')}>Acidity</span>
        </div>
      </div>

      {results.length > 0 && (
        <div className="medicine-grid">
          {results.map((m, i) => (
            <div key={i} className="card medicine-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span className="status-badge genuine" style={{ fontSize: '10px' }}>{m.sub_category}</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-green)' }}>{m.product_price}</span>
                </div>
                <div className="card-title" style={{ fontSize: '17px', color: 'var(--accent-cyan)', marginBottom: '8px' }}>{m.product_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', fontStyle: 'italic' }}>{m.salt_composition}</div>
                
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  <strong>Description:</strong> {m.medicine_desc?.substring(0, 180)}...
                </div>
              </div>
              
              <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '10px' }}>
                <button className="btn btn-outline" style={{ flex: 1, fontSize: '12px' }}>View Details</button>
                <button className="btn btn-primary" style={{ flex: 1, fontSize: '12px' }}>Buy Now</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && symptoms && (
         <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '50px', marginBottom: '20px' }}>🔍</div>
            <p>No medicines found for "{symptoms}". Try searching with broader symptoms.</p>
         </div>
      )}

      <div className="warning-box" style={{ marginTop: '40px', padding: '15px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', fontSize: '13px', color: 'rgba(239, 68, 68, 0.8)' }}>
        ⚠️ <strong>Medical Disclaimer:</strong> The suggestions provided here are based on automated data analysis. Medications should only be taken under the supervision of a qualified healthcare professional. Do not self-medicate based on these results.
      </div>
    </div>
  );
}
