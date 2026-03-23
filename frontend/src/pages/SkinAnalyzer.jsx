import React, { useState, useRef } from 'react';

export default function SkinAnalyzer({ addToast }) {
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        addToast('Please upload a valid image file.', 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setImageBase64(reader.result);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imageBase64) {
      addToast('Please capture or upload an image first.', 'warning');
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      const res = await fetch('/api/skin/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: imageBase64 })
      });

      const data = await res.json();
      
      if (res.ok) {
        setResult(data);
        addToast('Skin analysis complete!', 'success');
        
        // Log to history
        fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity_type: 'disease',
            title: `Skin Scan: ${data.problem}`,
            details: `Confidence: ${data.confidence}%\nHealth Score: ${data.health_percentage}%\nRecommendation: ${data.recommendation}`
          })
        }).catch(e => console.error('History logged failed'));
        
      } else {
        addToast(data.detail || 'Failed to analyze skin.', 'error');
      }
    } catch (err) {
      addToast('Error connecting to the server.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>📸 Skin Problem Detector</h1>
        <p>Take a selfie or upload a clear photo of your face to detect common skin conditions and get a health score.</p>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        
        <div 
          style={{
            border: '2px dashed var(--border-color)',
            borderRadius: '12px',
            padding: imagePreview ? '10px' : '40px',
            marginBottom: '20px',
            background: 'var(--bg-secondary)',
            cursor: 'pointer',
            transition: 'border-color 0.3s ease',
            position: 'relative',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => fileInputRef.current.click()}
        >
          <input 
            type="file" 
            accept="image/*" 
            capture="user"
            ref={fileInputRef} 
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />

          {imagePreview ? (
            <img src={imagePreview} alt="Face Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
          ) : (
            <>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
              <h3>Tap to open Camera / Gallery</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>
                Ensure good lighting and a clear view of the targeted skin area.
              </p>
            </>
          )}
        </div>

        {imagePreview && !analyzing && !result && (
          <button className="btn btn-primary" onClick={handleAnalyze} style={{ width: '100%', fontSize: '16px', padding: '12px' }}>
            🔬 Analyze Skin
          </button>
        )}

        {analyzing && (
          <div style={{ padding: '20px' }}>
            <span className="spinner" style={{ width: '30px', height: '30px', margin: '0 auto 16px', borderWidth: '3px' }} />
            <p>Our deep learning models are examining your skin features...</p>
          </div>
        )}

        {result && (
          <div style={{
            marginTop: '24px',
            padding: '20px',
            background: 'rgba(56, 189, 248, 0.05)',
            border: '1px solid var(--primary-color)',
            borderRadius: '12px',
            textAlign: 'left'
          }}>
            <h3 style={{ color: 'var(--primary-color)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📊 Analysis Results
            </h3>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Detected Condition:</span>
                <strong style={{ color: '#fff', fontSize: '16px' }}>{result.problem}</strong>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>AI Confidence:</span>
                <strong style={{ color: '#fff' }}>{result.confidence}%</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Skin Health Score:</span>
                <strong style={{ 
                  color: result.health_percentage >= 80 ? '#4ade80' : result.health_percentage >= 50 ? '#facc15' : '#f87171',
                  fontSize: '18px' 
                }}>
                  {result.health_percentage}/100
                </strong>
              </div>

              <div style={{ marginTop: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Recommendation:</span>
                <div style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: '6px', fontSize: '14px', lineHeight: '1.5' }}>
                  {result.recommendation}
                </div>
              </div>
            </div>

            <button className="btn btn-outline" style={{ width: '100%', marginTop: '20px' }} onClick={() => {
              setImagePreview(null);
              setImageBase64(null);
              setResult(null);
            }}>
              Scan Another Area
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
