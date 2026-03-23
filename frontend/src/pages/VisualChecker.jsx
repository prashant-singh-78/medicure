import React, { useState } from 'react';

export default function VisualChecker({ addToast }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setAnalysis(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/visual-check/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setAnalysis(data.analysis);
        addToast('Analysis complete!', 'success');
      } else {
        addToast(data.detail || 'Analysis failed.', 'error');
      }
    } catch {
      addToast('Error connecting to AI service.', 'error');
    }
    setLoading(false);
  };

  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('###')) return <h3 key={i} style={{ color: 'var(--accent-cyan)', marginTop: '15px' }}>{line.replace('###', '').trim()}</h3>;
      if (line.startsWith('- **')) {
        const [label, content] = line.replace('- **', '').split('**:');
        return <p key={i} style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--accent-purple)' }}>{label}:</strong>{content}</p>;
      }
      if (line.startsWith('*Disclaimer:')) return <p key={i} style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>{line.replace('*', '').replace('*', '')}</p>;
      return <p key={i} style={{ marginBottom: '5px' }}>{line}</p>;
    });
  };

  return (
    <div className="visual-checker-container">
      <div className="page-header">
        <h1>📸 AI Visual Checker</h1>
        <p>Upload a clear photo of a skin rash, eye redness, or dental concern for an instant AI-powered preliminary analysis.</p>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 2fr' }}>
        {/* Upload Card */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="card-title">📤 Upload Image</div>
          <div 
            className="upload-box" 
            style={{ 
              border: '2px dashed var(--border-color)', 
              borderRadius: '12px', 
              padding: '30px', 
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.02)',
              marginBottom: '20px'
            }}
            onClick={() => document.getElementById('visual-upload').click()}
          >
            {preview ? (
              <img src={preview} alt="Preview" style={{ width: '100%', borderRadius: '8px', maxHeight: '250px', objectFit: 'contain' }} />
            ) : (
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📷</div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Click or Drag & Drop Photo</p>
              </div>
            )}
            <input type="file" id="visual-upload" hidden onChange={handleFileChange} accept="image/*" />
          </div>
          
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={!selectedFile || loading}
            onClick={handleAnalyze}
          >
            {loading ? <><span className="spinner" style={{ width: '16px', height: '16px', borderTopColor: 'white' }} /> Analyzing...</> : 'Analyze Symptom'}
          </button>
        </div>

        {/* Analysis Card */}
        <div className="card">
          <div className="card-title">🧬 AI Preliminary Insight</div>
          {analysis ? (
            <div className="analysis-result" style={{ lineHeight: '1.6', fontSize: '14px' }}>
              {formatText(analysis)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🤖</div>
              <p>Upload an image and click analyze to receive AI-powered insights about the visible symptom.</p>
            </div>
          )}
        </div>
      </div>

      <div className="warning-box" style={{ marginTop: '24px', padding: '15px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', fontSize: '13px', color: 'rgba(239, 68, 68, 0.8)' }}>
        ⚠️ <strong>Important Note:</strong> This tool is for educational guidance only. It cannot replace a professional medical consultation. If you feel severe pain or see rapidly worsening symptoms, please visit a clinic immediately.
      </div>
    </div>
  );
}
