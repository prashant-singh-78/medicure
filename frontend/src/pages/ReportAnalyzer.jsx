import React, { useState, useRef } from 'react';

export default function ReportAnalyzer({ addToast }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragover, setDragover] = useState(false);
  const fileInputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault(); setDragover(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setResult(null);
    } else {
      addToast('Please upload a valid image file', 'error');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) { 
      setImageFile(file); 
      setImagePreview(URL.createObjectURL(file)); 
      setResult(null);
    }
  };

  const analyzeReport = async () => {
    if (!imageFile) { addToast('Please upload a medical report image first!', 'error'); return; }
    setLoading(true); setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      const res = await fetch('/api/report/analyze', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (res.ok) {
        setResult(data.analysis);
        addToast('Report analyzed successfully!', 'success');
        
        fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity_type: 'report',
            title: `Medical Report Analyzed`,
            details: `Successfully extracted and analyzed report using AI.\nResult preview: ${data.analysis.substring(0, 100)}...`
          })
        }).catch(e => console.error(e));
        
      } else {
        addToast(data.detail || 'Failed to analyze report.', 'error');
      }
    } catch {
      addToast('Error connecting to backend.', 'error');
    }
    setLoading(false);
  };

  // Helper to format basic markdown-like text from Gemini
  const formatText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('###')) {
        return <h3 key={i} style={{ color: 'var(--accent-cyan)', marginTop: '16px', marginBottom: '8px', fontSize: '18px' }}>{line.replace('###', '').trim()}</h3>;
      }
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formattedLine = formattedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
      return (
        <React.Fragment key={i}>
          <span dangerouslySetInnerHTML={{ __html: formattedLine }} style={{ display: 'block', marginBottom: '4px' }} />
        </React.Fragment>
      );
    });
  };

  return (
    <div>
      <div className="page-header">
        <h1>📄 Medical Report Analyzer</h1>
        <p>Upload a photo of your medical report (like a blood test or prescription) and AI will analyze it to explain the results and highlight anomalies.</p>
      </div>

      <div className="medicine-grid">
        {/* Left Panel - Input */}
        <div>
          <div className="card">
            <div className="card-title">📷 Upload Report</div>
            <div
              className={`upload-zone ${dragover ? 'dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragover(true); }}
              onDragLeave={() => setDragover(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              {imagePreview
                ? <img src={imagePreview} alt="preview" style={{ maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} />
                : (<>
                  <div className="upload-icon">📄</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Drag & drop or click to upload your report</div>
                  <div className="upload-hint">Supports JPG, PNG, WebP</div>
                </>)}
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
            <button className="btn btn-primary" onClick={analyzeReport} disabled={loading || !imageFile} style={{ width: '100%', justifyContent: 'center', marginTop: '14px' }}>
              {loading ? <><span className="spinner" /> Analyzing Report...</> : '🧠 Analyze Report'}
            </button>
          </div>
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '10px', fontSize: '13px', color: 'var(--accent-cyan)' }}>
            💡 <strong>Tip:</strong> Ensure the image is clear and text is readable for the best analysis results. Remember that this analysis is AI-generated and not a substitute for professional medical advice.
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="result-box" style={{ height: 'fit-content' }}>
          <div className="result-header">📊 Analysis Results</div>
          
          {!result && !loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🩺</div>
              <p style={{ fontSize: '13px' }}>Upload a report to see the AI analysis here.</p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 16px', borderWidth: '3px' }} />
              <p>Reading text and analyzing medical data...</p>
            </div>
          )}

          {result && !loading && (
            <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)', textAlign: 'left', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              {formatText(result)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
