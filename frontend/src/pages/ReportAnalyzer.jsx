import React, { useState, useRef } from 'react';

export default function ReportAnalyzer({ addToast }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragover, setDragover] = useState(false);
  const fileInputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault(); setDragover(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      addToast('Direct PDF upload is not supported. Please convert the report page to JPG, PNG, or WEBP image.', 'error');
      return;
    }
    if (file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    } else {
      addToast('Please upload a valid image file (JPG, PNG, WEBP)', 'error');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      addToast('Direct PDF upload is not supported. Please convert the report page to JPG, PNG, or WEBP image.', 'error');
      return;
    }
    if (file.type.startsWith('image/')) { 
      setImageFile(file); 
      setImagePreview(URL.createObjectURL(file)); 
      setResult(null);
      setError(null);
    } else {
      addToast('Please select a valid image file (JPG, PNG, WEBP)', 'error');
    }
  };

  const analyzeReport = async () => {
    if (!imageFile) { addToast('Please upload a medical report image first!', 'error'); return; }
    setLoading(true); setResult(null); setError(null);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/report/analyze', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (res.ok) {
        setResult(data.analysis);
        setError(null);
        addToast('Report analyzed successfully!', 'success');

        const token = localStorage.getItem('token');
        if (token) {
          const summarySnippet = typeof data.analysis === 'string' ? data.analysis.substring(0, 150) + '...' : 'Report analyzed successfully';
          fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/history', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              activity_type: 'report',
              title: `Medical Report: ${imageFile?.name || 'Pathology Scan'}`,
              details: summarySnippet
            })
          }).catch(e => console.error(e));
        }
      } else {
        const errorMsg = data.detail || 'Failed to analyze report.';
        setError(errorMsg);
        addToast(errorMsg, 'error');
      }
    } catch {
      const errorMsg = 'Unable to connect to pathology report analysis service. Please check backend status and retry.';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('###')) {
        return <h3 key={i} style={{ color: 'var(--accent-cyan)', marginTop: '16px', marginBottom: '8px', fontSize: '17px', fontWeight: '800' }}>{line.replace('###', '').trim()}</h3>;
      }
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formattedLine = formattedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
      return (
        <React.Fragment key={i}>
          <span dangerouslySetInnerHTML={{ __html: formattedLine }} style={{ display: 'block', marginBottom: '6px' }} />
        </React.Fragment>
      );
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <img src="/brand_logo.png" alt="Medicure Brand Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1.5px solid var(--accent-red)', boxShadow: '0 0 15px rgba(244, 63, 94, 0.35)', flexShrink: 0 }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>Hospital AI Pathology & Report Analyzer</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13.5px' }}>Upload CBC blood test, lipid panel, MRI, or prescription images for instant AI optical character recognition & pathology breakdown.</p>
        </div>
      </div>

      <div className="card" style={{ borderLeft: '4px solid var(--accent-yellow)', background: 'rgba(245, 158, 11, 0.08)', padding: '12px 18px', marginBottom: '20px' }}>
        <span style={{ color: 'var(--accent-yellow)', fontWeight: '700' }}>⚠️ Pathology Guidance:</span> Upload clear JPG, PNG, or WEBP image scans of official laboratory reports for OCR extraction.
      </div>

      {/* Hospital Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(6, 182, 212, 0.05))', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80" alt="Lab Scanner" style={{ width: '100px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--accent-blue)' }} />
        <div>
          <div style={{ fontWeight: '800', fontSize: '17px', color: 'var(--text-primary)' }}>Medicure Clinical Pathology Assistant</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Multimodal AI assistant to help explain complex medical terminology and reference ranges from clear laboratory report images.</div>
        </div>
      </div>

      <div className="medicine-grid">
        {/* Left Panel */}
        <div>
          <div className="card">
            <div className="card-title">📷 Upload Pathology Scan</div>
            <div
              className={`upload-zone ${dragover ? 'dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragover(true); }}
              onDragLeave={() => setDragover(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              {imagePreview
                ? <img src={imagePreview} alt="preview" style={{ maxHeight: '220px', borderRadius: '10px', objectFit: 'contain' }} />
                : (<>
                  <div className="upload-icon">📄</div>
                  <div style={{ fontSize: '14.5px', color: 'var(--text-primary)', fontWeight: '700' }}>Drop blood report or prescription image</div>
                  <div className="upload-hint">Supports JPG, PNG, WEBP (Image scans only)</div>
                </>)}
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
            <button className="btn btn-primary" onClick={analyzeReport} disabled={loading || !imageFile} style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
              {loading ? <><span className="spinner" /> Parsing Clinical Metrics...</> : '🧠 Extract & Explain Report'}
            </button>
          </div>

          <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(14, 165, 233, 0.08)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            💡 <strong>Pathology Tip:</strong> Keep lighting even and ensure patient reference values are visible for highest OCR confidence.
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="result-box" style={{ height: 'fit-content' }}>
          <div className="result-header">📊 AI Clinical Diagnosis Summary</div>
          
          {error && (
            <div style={{
              padding: '16px 20px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--accent-red, #ef4444)',
              borderRadius: '14px',
              marginBottom: '16px'
            }} className="animate-fade-in">
              <div style={{ color: '#ef4444', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚠️ Report Analysis Error
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 12px 0' }}>{error}</p>
              <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={analyzeReport}>
                🔄 Retry Report Analysis
              </button>
            </div>
          )}

          {!result && !loading && !error && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '52px', marginBottom: '14px' }}>🩺</div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Upload a report image to generate automated diagnostic breakdown.</p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ width: '42px', height: '42px', margin: '0 auto 18px', borderWidth: '3px' }} />
              <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Scanning optical text & reference ranges...</p>
            </div>
          )}

          {result && !loading && (
            <div style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-primary)', textAlign: 'left', background: 'var(--bg-input)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              {formatText(result)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
