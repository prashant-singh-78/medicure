import React, { useState } from 'react';

export default function DiseasePrediction({ addToast }) {
  const [loading, setLoading] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState(null);

  const predictDisease = async () => {
    if (!symptoms.trim()) { 
      addToast('Please enter some symptoms first!', 'error'); 
      return; 
    }
    setLoading(true); 
    setResult(null);
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/disease/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms })
      });
      const data = await res.json();
      
      if (res.ok) {
        setResult(data);
        addToast('Prediction complete!', 'success');
        
        fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/history', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            activity_type: 'disease',
            title: `Disease Predicted: ${data.disease}`,
            details: `Symptoms: ${symptoms}\nConfidence: ${data.confidence}%`
          })
        }).catch(e => console.error(e));
        
      } else {
        addToast(data.detail || 'Prediction failed.', 'error');
      }
    } catch {
      addToast('Error connecting to backend.', 'error');
    }
    setLoading(false);
  };

  const commonSymptoms = ["Fever", "Cough", "Headache", "Vomiting", "Fatigue", "Chest pain"];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <img src="/brand_logo.png" alt="Medicure Brand Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1.5px solid var(--accent-red)', boxShadow: '0 0 15px rgba(244, 63, 94, 0.35)', flexShrink: 0 }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>Disease Symptom Matcher</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13.5px' }}>Enter active clinical symptoms to perform calibrated statistical matching against our 45-condition reference medical catalog.</p>
        </div>
      </div>

      <div className="card" style={{ borderLeft: '4px solid var(--accent-yellow)', background: 'rgba(245, 158, 11, 0.08)', padding: '12px 18px', marginBottom: '20px' }}>
        <span style={{ color: 'var(--accent-yellow)', fontWeight: '700' }}>⚠️ Clinical Advisory:</span> AI symptom predictions are probabilistic screening estimates. Always verify with a licensed healthcare practitioner.
      </div>

      <div className="medicine-grid">
        {/* Left Panel - Input */}
        <div>
          <div className="card">
            <div className="card-title">🤒 Enter Symptoms</div>
            <div className="input-group">
              <label className="input-label">Describe your active symptoms (e.g. Fever, Vomiting, Headache)</label>
              <textarea 
                className="input-field" 
                rows="4"
                placeholder="Type your positive symptoms here (e.g. fever, headache, cough)..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ marginTop: '10px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Common symptoms:</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {commonSymptoms.map(sym => (
                  <span 
                    key={sym} 
                    onClick={() => setSymptoms(prev => prev ? prev + ', ' + sym : sym)}
                    style={{ 
                      fontSize: '12px', padding: '4px 8px', background: 'var(--bg-secondary)', 
                      borderRadius: '12px', cursor: 'pointer', border: '1px solid var(--border-color)' 
                    }}
                  >
                    + {sym}
                  </span>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" onClick={predictDisease} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? <><span className="spinner" /> Matching Symptoms...</> : '🔍 Match Symptoms'}
            </button>
          </div>
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '10px', fontSize: '12.5px', color: 'var(--accent-cyan)', lineHeight: '1.5' }}>
            💡 <strong>Catalog Scope & Limitations:</strong> Matches against a 45-condition reference database. Statistical token matching cannot parse negative statements (e.g., "no fever") or replace a qualified doctor's differential diagnosis.
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="result-box" style={{ height: 'fit-content' }}>
          <div className="result-header">📊 Symptom Match Results</div>
          
          {!result && !loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🩺</div>
              <p style={{ fontSize: '13px' }}>Enter symptoms to generate a reference match.</p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 16px', borderWidth: '3px' }} />
              <p>Analyzing symptom pattern against medical catalog...</p>
            </div>
          )}

          {result && !loading && (
            <div>
              <div style={{ textAlign: 'center', padding: '20px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Matched Medical Condition</div>
                <div style={{ fontSize: '26px', fontWeight: 'bold', color: result.status === 'success' ? 'var(--accent-red)' : 'var(--text-secondary)' }}>{result.disease}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Match Confidence: <strong>{result.confidence}%</strong>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, result.confidence)}%`, height: '100%', background: 'var(--accent-red)' }}></div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Recommended Next Steps & Tests:</strong>
                <ul style={{ paddingLeft: '20px', fontSize: '14px', color: 'var(--text-primary)' }}>
                  {result.recommendations?.tests?.map((test, i) => (
                    <li key={i}>{test}</li>
                  ))}
                </ul>
              </div>

              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Specialist Consultant:</strong>
                <div style={{ display: 'inline-block', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-cyan)', padding: '6px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: '600' }}>
                  👨‍⚕️ {result.recommendations?.consultant || 'General Physician'}
                </div>
              </div>

              {result.disclaimer && (
                <div style={{ marginTop: '16px', padding: '10px 12px', background: 'rgba(234, 179, 8, 0.08)', borderRadius: '8px', fontSize: '11.5px', color: 'var(--text-secondary)', border: '1px solid rgba(234, 179, 8, 0.2)', lineHeight: '1.4' }}>
                  ℹ️ {result.disclaimer}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
