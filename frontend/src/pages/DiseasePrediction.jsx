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
          headers: { 'Content-Type': 'application/json' },
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
      <div className="page-header">
        <h1>🩺 Disease Predictor</h1>
        <p>Enter your symptoms separated by commas, and our Machine Learning model will predict the most likely disease and recommend required tests.</p>
      </div>

      <div className="medicine-grid">
        {/* Left Panel - Input */}
        <div>
          <div className="card">
            <div className="card-title">🤒 Enter Symptoms</div>
            <div className="input-group">
              <label className="input-label">Describe your symptoms (e.g. Fever, Vomiting, Headache)</label>
              <textarea 
                className="input-field" 
                rows="4"
                placeholder="Type your symptoms here..."
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
              {loading ? <><span className="spinner" /> Analyzing...</> : '🔍 Predict Disease'}
            </button>
          </div>
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '10px', fontSize: '13px', color: 'var(--accent-cyan)' }}>
            💡 <strong>Note:</strong> This prediction is based on a Machine Learning model trained on clinical symptom datasets. It is not professional medical advice.
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="result-box" style={{ height: 'fit-content' }}>
          <div className="result-header">📊 Prediction Results</div>
          
          {!result && !loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🩺</div>
              <p style={{ fontSize: '13px' }}>Enter symptoms to generate a prediction.</p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 16px', borderWidth: '3px' }} />
              <p>Running Machine Learning Model...</p>
            </div>
          )}

          {result && !loading && (
            <div>
              <div style={{ textAlign: 'center', padding: '20px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Predicted Disease</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-red)' }}>{result.disease}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  AI Confidence: <strong>{result.confidence}%</strong>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
                  <div style={{ width: `${result.confidence}%`, height: '100%', background: 'var(--accent-red)' }}></div>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Recommended Tests:</strong>
                <ul style={{ paddingLeft: '20px', fontSize: '14px', color: 'var(--text-primary)' }}>
                  {result.recommendations?.tests?.map((test, i) => (
                    <li key={i}>{test}</li>
                  ))}
                </ul>
              </div>

              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Consultant Needed:</strong>
                <div style={{ display: 'inline-block', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-cyan)', padding: '6px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: '600' }}>
                  👨‍⚕️ {result.recommendations?.consultant || 'General Physician'}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
