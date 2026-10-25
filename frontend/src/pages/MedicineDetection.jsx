import React, { useState, useRef } from 'react';

const recentScans = [
  { name: 'Paracetamol 500mg', code: 'MED-2024-001', status: 'genuine', time: '2 min ago' },
  { name: 'Brand X — Counterfeit Warning', code: 'FAKE-9999', status: 'fake', time: '15 min ago' },
  { name: 'Amoxicillin 250mg Capsule', code: 'MED-2024-002', status: 'genuine', time: '1 hr ago' },
];

export default function MedicineDetection({ addToast }) {
  const [tab, setTab] = useState('qr');
  const [qrCode, setQrCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragover, setDragover] = useState(false);
  const fileInputRef = useRef();

  const [regForm, setRegForm] = useState({ code: '', name: '', manufacturer: '', batch: '', expiry: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const verifyQR = async () => {
    if (!qrCode.trim()) { addToast('Please enter a medicine code!', 'error'); return; }
    setLoading(true); setResult(null); setError(null);
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + `/api/medicine/verify?code=${encodeURIComponent(qrCode)}`);
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setError(null);
      } else {
        const errorMsg = data.detail || 'Medicine verification failed.';
        setError(errorMsg);
        addToast(errorMsg, 'error');
      }
    } catch {
      const errorMsg = 'Unable to connect to medicine verification service. Please verify backend is running and retry.';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    }
    setLoading(false);
  };

  const analyzeImage = async () => {
    if (!imageFile) { addToast('Please upload an image first!', 'error'); return; }
    setLoading(true); setResult(null); setError(null);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/medicine/analyze-image', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setError(null);
      } else {
        const errorMsg = data.detail || 'Medicine packaging analysis failed.';
        setError(errorMsg);
        addToast(errorMsg, 'error');
      }
    } catch {
      const errorMsg = 'Unable to connect to packaging analysis service. Please verify backend is running and retry.';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    }
    setLoading(false);
  };

  const searchExpanded = async () => {
    if (searchQuery.length < 2) { addToast('Enter at least 2 characters.', 'info'); return; }
    setLoading(true); setSearchResults([]); setError(null);
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + `/api/medicine/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data);
        setError(null);
        if (data.length === 0) {
          addToast('No medicines found matching that name.', 'info');
        }
      } else {
        const errorMsg = data.detail || 'Medicine search failed.';
        setError(errorMsg);
        addToast(errorMsg, 'error');
      }
    } catch {
      const errorMsg = 'Unable to connect to medicine database service. Please verify backend is running.';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    }
    setLoading(false);
  };

  const suggestBySymptom = async (symptoms) => {
    if (!symptoms || symptoms.length < 2) { addToast('Enter at least 2 characters.', 'info'); return; }
    setLoading(true); setSearchResults([]); setError(null);
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + `/api/medicine/suggest?symptoms=${encodeURIComponent(symptoms)}`);
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data);
        setError(null);
        if (data.length === 0) {
          addToast('No medicine suggestions found for those symptoms.', 'info');
        }
      } else {
        const errorMsg = data.detail || 'Medicine suggestion failed.';
        setError(errorMsg);
        addToast(errorMsg, 'error');
      }
    } catch {
      const errorMsg = 'Unable to connect to medicine suggestion service. Please verify backend is running.';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    }
    setLoading(false);
  };

  const registerMedicine = async () => {
    if (!regForm.code || !regForm.name || !regForm.manufacturer) {
      addToast('Code, Name, and Manufacturer are required!', 'error');
      return;
    }
    setLoading(true); setError(null);
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/medicine/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
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
      addToast('Unable to connect to medicine registry service. Registration failed.', 'error');
    }
    setLoading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragover(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); setError(null); }
  };

  const statusBadge = (status) => {
    const map = { genuine: '✅ Genuine', fake: '❌ COUNTERFEIT FAKE', unknown: '❓ Unknown', suspicious: '⚠️ Suspicious' };
    return <span className={`status-badge ${status}`}>{map[status] || '❓ Unknown'}</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <img src="/brand_logo.png" alt="Medicure Brand Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1.5px solid var(--accent-red)', boxShadow: '0 0 15px rgba(244, 63, 94, 0.35)', flexShrink: 0 }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>Computer Vision Medicine Verification & DB</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13.5px' }}>Verify pharmaceutical authenticity via OCR packaging inspection, QR code verification, or query national medicine databases.</p>
        </div>
      </div>

      <div className="card" style={{ borderLeft: '4px solid var(--accent-yellow)', background: 'rgba(245, 158, 11, 0.08)', padding: '12px 18px', marginBottom: '20px' }}>
        <span style={{ color: 'var(--accent-yellow)', fontWeight: '700' }}>⚠️ Pharmacy Notice:</span> Verify physical tamper-evident seal and hologram before ingestion. Suspicious scan count triggers fraud review.
      </div>

      {/* Guide Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(6, 182, 212, 0.05))', border: '1px solid var(--accent-blue)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '28px' }}>📖</div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--accent-cyan)', marginBottom: '4px' }}>Kya Use Hai & Kaise Use Karein (Medicine Verification Guide)</div>
            <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <strong>• Iska Use Kya Hai?</strong> Yeh module market me bikne wali dawaiyo (medicines) ki nakli/asli (fake/genuine) hone ki jaanch karta hai aur 300MB+ Indian pharmaceutical dataset se salt compositions, side-effects, aur prices search karta hai.<br/>
              <strong>• Kaise Use Karein?</strong>
              <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                <li><strong>QR Code Lookup:</strong> Medicine strip par diya gaya Code/Batch ID dalein (e.g. <code>MED-2024-001</code>) aur Verify par click karein.</li>
                <li><strong>AI OCR Scan:</strong> Medicine box ya strip ki photo upload karein — AI optical text extract karke expiry & mfg Jaanch karega.</li>
                <li><strong>Drug Dataset:</strong> Kisi bhi medicine brand (Dolo, Pan-D) ka salt composition aur side effects check karein.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="medicine-grid">
        {/* Left Panel - Input */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
            {[
              { id: 'qr', label: '🔍 QR Code Lookup' }, 
              { id: 'image', label: '📷 AI OCR Scan' },
              { id: 'search', label: '🔎 Drug Dataset' },
              { id: 'register', label: '➕ Register Batch' }
            ].map(t => (
              <button key={t.id} className={`btn ${tab === t.id ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setTab(t.id); setResult(null); setError(null); }}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'qr' && (
            <div className="card">
              <div className="card-title">🔍 Verify by Batch Code</div>
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
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Test Codes: <code style={{ color: 'var(--accent-cyan)' }}>MED-2024-001</code>, <code style={{ color: 'var(--accent-red)' }}>FAKE-9999</code>
              </div>
              <button className="btn btn-primary" onClick={verifyQR} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <><span className="spinner" /> Verifying Batch DB...</> : '✅ Verify Medicine Authenticity'}
              </button>
            </div>
          )}

          {tab === 'search' && (
            <div className="card">
              <div className="card-title">🔎 Search 300MB+ Indian Medicine Dataset</div>
              <div className="input-group">
                <label className="input-label">Search by Medicine Brand / Salt Name</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    className="input-field"
                    placeholder="e.g. Paracetamol, Dolo 650, Pan-D..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchExpanded()}
                  />
                  <button className="btn btn-primary" onClick={searchExpanded} disabled={loading}>Search</button>
                </div>
              </div>
              
              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '18px 0' }} />

              <div className="input-group">
                <label className="input-label">✨ Find Prescriptions by Symptom</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    className="input-field"
                    placeholder="e.g. High Fever, Severe Headache, Infection..."
                    id="symptom-input"
                  />
                  <button className="btn btn-primary" onClick={() => {
                    const val = document.getElementById('symptom-input').value;
                    if (val) { setSearchQuery(val); setTimeout(() => suggestBySymptom(val), 0); }
                  }} disabled={loading}>Suggest</button>
                </div>
              </div>
            </div>
          )}

          {tab === 'image' && (
            <div className="card">
              <div className="card-title">📷 AI Packaging OCR Scanner</div>
              <div
                className={`upload-zone ${dragover ? 'dragover' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragover(true); }}
                onDragLeave={() => setDragover(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
              >
                {imagePreview
                  ? <img src={imagePreview} alt="preview" style={{ maxHeight: '170px', borderRadius: '10px', objectFit: 'contain' }} />
                  : (<>
                    <div className="upload-icon">📦</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600' }}>Drop medicine box / strip photo here</div>
                    <div className="upload-hint">Extracts Mfg date, batch number, license & expiry</div>
                  </>)}
              </div>
              <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
              <button className="btn btn-primary" onClick={analyzeImage} disabled={loading || !imageFile} style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
                {loading ? <><span className="spinner" /> Running OCR Optical Inspection...</> : '🧠 Analyze Packaging Authenticity'}
              </button>
            </div>
          )}

          {tab === 'register' && (
            <div className="card">
              <div className="card-title">➕ Register Legitimate Pharmaceutical Stock</div>
              <div className="input-group">
                <label className="input-label">Unique QR / Batch Code</label>
                <input className="input-field" value={regForm.code} onChange={e => setRegForm({...regForm, code: e.target.value})} placeholder="e.g. MED-2026-909" />
              </div>
              <div className="input-group">
                <label className="input-label">Brand & Drug Name</label>
                <input className="input-field" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} placeholder="e.g. Dolo 650mg" />
              </div>
              <div className="input-group">
                <label className="input-label">Licensed Manufacturer</label>
                <input className="input-field" value={regForm.manufacturer} onChange={e => setRegForm({...regForm, manufacturer: e.target.value})} placeholder="e.g. Micro Labs Ltd" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Batch No.</label>
                  <input className="input-field" value={regForm.batch} onChange={e => setRegForm({...regForm, batch: e.target.value})} placeholder="B-9910" />
                </div>
                <div className="input-group">
                  <label className="input-label">Expiry Date</label>
                  <input className="input-field" value={regForm.expiry} onChange={e => setRegForm({...regForm, expiry: e.target.value})} placeholder="2027-12" />
                </div>
              </div>
              <button className="btn btn-primary" onClick={registerMedicine} disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                {loading ? <><span className="spinner" /> Saving...</> : '💾 Save to Verified Database'}
              </button>
            </div>
          )}

          {/* Recent Scans */}
          {tab !== 'register' && (
            <div className="card" style={{ marginTop: '18px' }}>
              <div className="card-title">🕐 Recent Scan Audit Log</div>
              <table className="scans-table">
                <thead>
                  <tr><th>Medicine</th><th>Code</th><th>Status</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {recentScans.map((s, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: '600' }}>{s.name}</td>
                      <td><code style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>{s.code}</code></td>
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
        <div className="result-box" style={{ height: 'fit-content', maxHeight: tab === 'search' ? '650px' : 'none', overflowY: 'auto' }}>
          {error && (
            <div style={{
              padding: '16px 20px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--accent-red, #ef4444)',
              borderRadius: '14px',
              textAlign: 'left',
              marginBottom: '16px'
            }} className="animate-fade-in">
              <div style={{ color: '#ef4444', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚠️ Service Error
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>{error}</p>
            </div>
          )}

          {tab === 'register' ? (
             <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
               <div style={{ fontSize: '48px', marginBottom: '14px' }}>🗄️</div>
               <p style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '700' }}>Register Authenticated Medical Stock</p>
               <p style={{ fontSize: '13px', marginTop: '10px', color: 'var(--text-secondary)' }}>Add verified batches to the Medicure database to prevent counterfeit medicine distribution.</p>
             </div>
          ) : tab === 'search' ? (
            <>
              <div className="result-header">📦 Search Results ({searchResults.length})</div>
              {searchResults.length === 0 && !loading && !error && (
                <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '50px', marginBottom: '14px' }}>🔎</div>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Search drug compositions, side effects, and pricing from our database.</p>
                </div>
              )}
              {searchResults.map((m, i) => (
                <div key={i} className="card" style={{ marginBottom: '14px', border: '1px solid var(--border)' }}>
                  <div className="card-title" style={{ fontSize: '17px', color: 'var(--accent-cyan)' }}>{m.product_name}</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '10px' }}>🧪 {m.salt_composition}</div>
                  
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: '1.5' }}>
                    <strong>Side Effects:</strong> {m.side_effects}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.5' }}>
                    <strong>Drug Interactions:</strong> {m.drug_interactions}
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '14px', fontWeight: '800', color: 'var(--accent-green)' }}>
                    Est. Market Price: {m.product_price}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="result-header">🔎 Diagnostic Scan Result</div>
              {!result && !loading && !error && (
                <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '50px', marginBottom: '14px' }}>💊</div>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Enter a batch code or upload package photo to view verification report.</p>
                </div>
              )}
              {result && !loading && (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    {statusBadge(result.status)}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: result.status === 'fake' || result.status === 'suspicious' ? 'var(--accent-red)' : 'var(--text-primary)', marginBottom: '20px' }}>
                    {result.name}
                  </div>
                  <table className="detail-table">
                    <tbody>
                      <tr><td>Manufacturer</td><td>{result.manufacturer}</td></tr>
                      <tr><td>Batch Number</td><td>{result.batch}</td></tr>
                      <tr><td>Expiry Date</td><td>{result.expiry}</td></tr>
                      {result.scans !== undefined && <tr><td>Scans Recorded</td><td>{result.scans}</td></tr>}
                      {result.confidence && <tr><td>OCR AI Confidence</td><td>{result.confidence}%</td></tr>}
                    </tbody>
                  </table>

                  {(result.status === 'fake' || result.status === 'suspicious') && (
                    <div style={{ marginTop: '18px', padding: '14px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.35)', borderRadius: '12px', fontSize: '13.5px', color: 'var(--accent-red)', lineHeight: '1.6' }}>
                      ⚠️ <strong>COUNTERFEIT WARNING:</strong> This batch code or packaging has failed safety authentication. Do not consume this drug.
                    </div>
                  )}
                  {result.status === 'genuine' && (
                    <div style={{ marginTop: '18px', padding: '14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '12px', fontSize: '13.5px', color: 'var(--accent-green)', lineHeight: '1.6' }}>
                      ✅ Verified authentic pharmaceutical batch from licensed distributor.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          {loading && (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 18px', borderWidth: '3px' }} />
              <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{tab === 'qr' ? 'Checking national medicine registry...' : 'Running optical character recognition (OCR)...'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
