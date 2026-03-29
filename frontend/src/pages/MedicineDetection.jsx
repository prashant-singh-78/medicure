import React, { useState, useRef } from 'react';

const MOCK_DB = {
  'MED-2024-001': { name: 'Paracetamol 500mg', manufacturer: 'Sun Pharma', batch: 'B2024-01', expiry: '2026-06', status: 'genuine', scans: 3 },
  'MED-2024-002': { name: 'Amoxicillin 250mg', manufacturer: 'Cipla Ltd.', batch: 'B2024-07', expiry: '2025-12', status: 'genuine', scans: 1 },
  'FAKE-9999': { name: 'Aspirin 75mg', manufacturer: 'Unknown', batch: 'FAKE-001', expiry: 'N/A', status: 'fake', scans: 5 },
};

const recentScans = [
  { name: 'Paracetamol 500mg', code: 'MED-2024-001', status: 'genuine', time: '2 min ago' },
  { name: 'Brand X — Suspicious', code: 'FAKE-9999', status: 'fake', time: '15 min ago' },
  { name: 'Amoxicillin 250mg', code: 'MED-2024-002', status: 'genuine', time: '1 hr ago' },
];

export default function MedicineDetection({ addToast }) {
  const [tab, setTab] = useState('qr'); // 'qr', 'image', or 'register'
  const [qrCode, setQrCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragover, setDragover] = useState(false);
  const fileInputRef = useRef();

  // Register Form State
  const [regForm, setRegForm] = useState({ code: '', name: '', manufacturer: '', batch: '', expiry: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const verifyQR = async () => {
    if (!qrCode.trim()) { addToast('Please enter a medicine code!', 'error'); return; }
    setLoading(true); setResult(null);
    try {
      const res = await fetch(`/api/medicine/verify?code=${encodeURIComponent(qrCode)}`);
      const data = await res.json();
      setResult(data);
    } catch {
      addToast('Error connecting to backend.', 'error');
    }
    setLoading(false);
  };

  const analyzeImage = async () => {
    if (!imageFile) { addToast('Please upload an image first!', 'error'); return; }
    setLoading(true); setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/medicine/analyze-image', { method: 'POST', body: formData });
      const data = await res.json();
      setResult(data);
    } catch {
      addToast('Error connecting to backend.', 'error');
    }
    setLoading(false);
  };

  const searchExpanded = async () => {
    if (searchQuery.length < 2) { addToast('Enter at least 2 characters.', 'info'); return; }
    setLoading(true); setSearchResults([]);
    try {
      const res = await fetch(`/api/medicine/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch {
      addToast('Error searching dataset.', 'error');
    }
    setLoading(false);
  };

  const suggestBySymptom = async (symptoms) => {
    if (!symptoms || symptoms.length < 2) { addToast('Enter at least 2 characters.', 'info'); return; }
    setLoading(true); setSearchResults([]);
    try {
      const res = await fetch(`/api/medicine/suggest?symptoms=${encodeURIComponent(symptoms)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch {
      addToast('Error fetching suggestions.', 'error');
    }
    setLoading(false);
  };

  const registerMedicine = async () => {
    if (!regForm.code || !regForm.name || !regForm.manufacturer) {
      addToast('Code, Name, and Manufacturer are required!', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/medicine/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Medicine registered successfully!', 'success');
        setRegForm({ code: '', name: '', manufacturer: '', batch: '', expiry: '' });
      } else {
        addToast(data.detail || 'Failed to register medicine.', 'error');
      }
    } catch {
      addToast('Error connecting to backend.', 'error');
    }
    setLoading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragover(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const statusBadge = (status) => {
    const map = { genuine: '✅ Genuine', fake: '❌ FAKE', unknown: '❓ Unknown', suspicious: '⚠️ Suspicious' };
    return <span className={`status-badge ${status}`}>{map[status] || '❓ Unknown'}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1>💊 Medicine Check & DB</h1>
        <p>Verify medicines using QR lookup, AI imaging, or register new authentic stock.</p>
      </div>

      <div className="medicine-grid">
        {/* Left Panel - Input */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {[
              { id: 'qr', label: '🔍 QR Lookup' }, 
              { id: 'image', label: '📷 AI Analysis' },
              { id: 'search', label: '🔎 Search Dataset' },
              { id: 'register', label: '➕ Register New' }
            ].map(t => (
              <button key={t.id} className={`btn ${tab === t.id ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setTab(t.id); setResult(null); }}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'qr' && (
            <div className="card">
              <div className="card-title">🔍 Verify by Code</div>
              <div className="input-group">
                <label className="input-label">Medicine QR Code / Batch ID</label>
                <input
                  className="input-field"
                  placeholder="e.g. MED-2024-001 or FAKE-9999"
                  value={qrCode}
                  onChange={e => setQrCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && verifyQR()}
                />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Try demo codes: <code style={{ color: 'var(--accent-cyan)' }}>MED-2024-001</code>, <code style={{ color: 'var(--accent-red)' }}>FAKE-9999</code>
              </div>
              <button className="btn btn-primary" onClick={verifyQR} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <><span className="spinner" /> Verifying...</> : '✅ Verify Medicine'}
              </button>
            </div>
          )}

          {tab === 'search' && (
            <div className="card">
              <div className="input-group">
                <label className="input-label">Search by Medicine Name</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    className="input-field"
                    placeholder="e.g. Paracetamol, Dolo, etc."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchExpanded()}
                  />
                  <button className="btn btn-primary" onClick={searchExpanded} disabled={loading}>🔍 Search</button>
                </div>
              </div>
              
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '15px 0' }} />

              <div className="input-group">
                <label className="input-label">✨ Suggest by Symptoms / Disease</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    className="input-field"
                    placeholder="e.g. Fever, Headache, Infection..."
                    id="symptom-input"
                  />
                  <button className="btn btn-primary" onClick={() => {
                    const val = document.getElementById('symptom-input').value;
                    if (val) { setSearchQuery(val); setTimeout(() => suggestBySymptom(val), 0); }
                  }} disabled={loading}>🚀 Suggest</button>
                </div>
              </div>
            </div>
          )}
          {tab === 'image' && (
            <div className="card">
              <div className="card-title">📷 AI Image Analysis</div>
              <div
                className={`upload-zone ${dragover ? 'dragover' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragover(true); }}
                onDragLeave={() => setDragover(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
              >
                {imagePreview
                  ? <img src={imagePreview} alt="preview" style={{ maxHeight: '160px', borderRadius: '8px', objectFit: 'contain' }} />
                  : (<>
                    <div className="upload-icon">📦</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Drag & drop or click to upload</div>
                    <div className="upload-hint">Supports JPG, PNG, WebP</div>
                  </>)}
              </div>
              <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
              <button className="btn btn-primary" onClick={analyzeImage} disabled={loading || !imageFile} style={{ width: '100%', justifyContent: 'center', marginTop: '14px' }}>
                {loading ? <><span className="spinner" /> Analyzing Image...</> : '🧠 Analyze Packaging'}
              </button>
            </div>
          )}

          {tab === 'register' && (
            <div className="card">
              <div className="card-title">➕ Register authentic medicine</div>
              <div className="input-group">
                <label className="input-label">Medicine Code (Unique)</label>
                <input className="input-field" value={regForm.code} onChange={e => setRegForm({...regForm, code: e.target.value})} placeholder="e.g. MED-2024-008" />
              </div>
              <div className="input-group">
                <label className="input-label">Medicine Name</label>
                <input className="input-field" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} placeholder="e.g. Dolo 650" />
              </div>
              <div className="input-group">
                <label className="input-label">Manufacturer</label>
                <input className="input-field" value={regForm.manufacturer} onChange={e => setRegForm({...regForm, manufacturer: e.target.value})} placeholder="e.g. Micro Labs" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label className="input-label">Batch</label>
                  <input className="input-field" value={regForm.batch} onChange={e => setRegForm({...regForm, batch: e.target.value})} placeholder="e.g. B-102" />
                </div>
                <div className="input-group">
                  <label className="input-label">Expiry</label>
                  <input className="input-field" value={regForm.expiry} onChange={e => setRegForm({...regForm, expiry: e.target.value})} placeholder="e.g. 2026-10" />
                </div>
              </div>
              <button className="btn btn-primary" onClick={registerMedicine} disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                {loading ? <><span className="spinner" /> Registering...</> : '💾 Save to Database'}
              </button>
            </div>
          )}

          {/* Recent Scans (only show on verify tabs) */}
          {tab !== 'register' && (
            <div className="card" style={{ marginTop: '16px' }}>
              <div className="card-title">🕐 Recent Scans</div>
              <table className="scans-table">
                <thead>
                  <tr><th>Medicine</th><th>Code</th><th>Status</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {recentScans.map((s, i) => (
                    <tr key={i}>
                      <td>{s.name}</td>
                      <td><code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.code}</code></td>
                      <td>{statusBadge(s.status)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{s.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Panel - Results */}
        <div className="result-box" style={{ height: 'fit-content', maxHeight: tab === 'search' ? '600px' : 'none', overflowY: 'auto' }}>
          {tab === 'register' ? (
             <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
               <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗄️</div>
               <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Add new legitimate medicines to the system.</p>
               <p style={{ fontSize: '13px', marginTop: '10px' }}>Once registered, users can verify this medicine using its unique Code or Batch ID.</p>
             </div>
          ) : tab === 'search' ? (
            <>
              <div className="result-header">📦 Search Results ({searchResults.length})</div>
              {searchResults.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔎</div>
                  <p style={{ fontSize: '13px' }}>Find details from our 300MB+ Indian Medicine dataset.</p>
                </div>
              )}
              {searchResults.map((m, i) => (
                <div key={i} className="card" style={{ marginBottom: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="card-title" style={{ fontSize: '16px', color: 'var(--accent-cyan)' }}>{m.product_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>🧂 {m.salt_composition}</div>
                  
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px' }}>
                    <strong>Side Effects:</strong> {m.side_effects?.substring(0, 150)}...
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    <strong>Interactions:</strong> {m.drug_interactions?.substring(0, 100)}...
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                    Price: {m.product_price}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="result-header">🔎 Verification Result</div>
              {!result && !loading && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>💊</div>
                  <p style={{ fontSize: '13px' }}>Enter a medicine code or upload an image to get verification results.</p>
                </div>
              )}
              {result && !loading && (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    {statusBadge(result.status)}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: result.status === 'fake' || result.status === 'suspicious' ? 'var(--accent-red)' : result.status === 'genuine' ? 'var(--accent-green)' : 'var(--text-secondary)', marginBottom: '20px' }}>
                    {result.name}
                  </div>
                  <table className="detail-table">
                    <tbody>
                      <tr><td>Manufacturer</td><td>{result.manufacturer}</td></tr>
                      <tr><td>Batch Number</td><td>{result.batch}</td></tr>
                      <tr><td>Expiry Date</td><td>{result.expiry}</td></tr>
                      {result.scans !== undefined && <tr><td>Times Scanned</td><td>{result.scans}</td></tr>}
                      {result.confidence && <tr><td>AI Confidence</td><td>{result.confidence}%</td></tr>}
                      {result.registered && result.registered !== 'N/A' && <tr><td>Registered On</td><td>{result.registered}</td></tr>}
                    </tbody>
                  </table>

                  {(result.status === 'fake' || result.status === 'suspicious') && (
                    <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', fontSize: '13px', color: 'var(--accent-red)' }}>
                      ⚠️ <strong>WARNING:</strong> This medicine appears suspicious, counterfeit, or has been scanned way too many times. Do NOT consume it. Please report to the nearest pharmacy.
                    </div>
                  )}
                  {result.status === 'genuine' && (
                    <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', fontSize: '13px', color: 'var(--accent-green)' }}>
                      ✅ This medicine is verified as authentic in our database.
                    </div>
                  )}
                  {result.status === 'unknown' && (
                    <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Cannot find this medicine in our system. Ensure the code is correct.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 16px', borderWidth: '3px' }} />
              <p>{tab === 'qr' ? 'Checking database...' : tab === 'register' ? 'Registering medicine in DB...' : 'Running OCR & image analysis...'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
