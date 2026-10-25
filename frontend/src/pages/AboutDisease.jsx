import React, { useState, useEffect, useMemo } from 'react';

const CATEGORY_ICONS = {
  'Respiratory': '🫁',
  'Cardiovascular': '🫀',
  'Infectious': '🦠',
  'Gastrointestinal': '🥣',
  'Dermatological': '🔬',
  'Endocrine': '🩸',
  'Neurological': '🧠',
  'Musculoskeletal': '🦴',
  'Urological': '💧',
  'General': '🩺'
};

export default function AboutDisease({ addToast }) {
  const [diseases, setDiseases] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState(null); // { diseaseName: string, meds: [] }
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);

  const fetchSuggestions = async (disease) => {
    setSuggestLoading(true);
    setSuggestions(null);
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + `/api/medicine/suggest?symptoms=${encodeURIComponent(disease.name)}`);
      const data = await res.json();
      setSuggestions({ diseaseName: disease.name, meds: data });
    } catch {
      addToast('Error fetching suggestions.', 'error');
    }
    setSuggestLoading(false);
  };

  useEffect(() => {
    fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/disease-info/list')
      .then(res => res.json())
      .then(data => {
        setDiseases(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        addToast('Error loading disease catalog.', 'error');
        setLoading(false);
      });
  }, [addToast]);

  const categories = useMemo(() => {
    const cats = new Set(['All']);
    diseases.forEach(d => {
      if (d.category) cats.add(d.category);
    });
    return Array.from(cats);
  }, [diseases]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return diseases.filter(d => {
      const matchesCategory = selectedCategory === 'All' || d.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.symptoms && d.symptoms.toLowerCase().includes(q)) ||
        (d.description && d.description.toLowerCase().includes(q)) ||
        (d.prevention && d.prevention.toLowerCase().includes(q)) ||
        (d.category && d.category.toLowerCase().includes(q)) ||
        (d.consultant && d.consultant.toLowerCase().includes(q))
      );
    });
  }, [diseases, search, selectedCategory]);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <img 
          src="/brand_logo.png" 
          alt="Medicure Brand Logo" 
          style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1.5px solid var(--accent-red)', boxShadow: '0 0 15px rgba(244, 63, 94, 0.35)', flexShrink: 0 }} 
        />
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>📚 Clinical Disease Encyclopedia</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            Comprehensive medical guide covering 45+ clinical conditions, symptoms, preventive measures, diagnostic tests, and specialist consultations.
          </p>
        </div>
      </div>

      {/* Search and Category Filter Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
        <div className="input-group" style={{ maxWidth: '560px', margin: 0 }}>
          <input 
            className="input-field" 
            placeholder="🔍 Search by disease, symptom, prevention, or doctor (e.g. Malaria, Fever, Pulmonologist)..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '14px 18px', fontSize: '14px' }}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginRight: '4px' }}>Category:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? 'linear-gradient(135deg, var(--accent-cyan), #0284c7)' : 'rgba(255,255,255,0.05)',
                color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
                border: selectedCategory === cat ? '1px solid var(--accent-cyan)' : '1px solid var(--border)',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{CATEGORY_ICONS[cat] || '🩺'}</span>
              <span>{cat}</span>
              {cat === 'All' && <span style={{ opacity: 0.7, fontSize: '11px' }}>({diseases.length})</span>}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px', margin: '0 auto' }} />
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading verified medical database ({diseases.length} records)...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No matching health condition found</h3>
          <p style={{ fontSize: '14px' }}>Try searching for a different symptom or select "All" categories.</p>
          <button 
            className="btn btn-outline" 
            style={{ marginTop: '16px' }}
            onClick={() => { setSearch(''); setSelectedCategory('All'); }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="medicine-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {filtered.map((d, i) => {
            const icon = CATEGORY_ICONS[d.category] || '🩺';
            const isExpanded = expandedCard === i;

            return (
              <div 
                key={d.id || i} 
                className="card disease-card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '20px',
                  background: 'var(--card-bg, #131d33)',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
                }}
              >
                <div>
                  {/* Card Header: Category & Image/Icon Banner */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ 
                      fontSize: '11.5px', 
                      background: 'rgba(56, 189, 248, 0.12)', 
                      color: 'var(--accent-cyan)', 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontWeight: '700', 
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span>{icon}</span> {d.category || 'General Health'}
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600' }}>
                      ID #{d.id || i + 1}
                    </span>
                  </div>

                  {/* Disease Visual Representation */}
                  <div 
                    style={{ 
                      height: '110px', 
                      borderRadius: '10px', 
                      overflow: 'hidden', 
                      marginBottom: '14px', 
                      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    {d.image && !d.image.startsWith('/diseases/') ? (
                      <img 
                        src={d.image} 
                        alt={d.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      style={{ 
                        display: (!d.image || d.image.startsWith('/diseases/')) ? 'flex' : 'none',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '12px',
                        textAlign: 'center'
                      }}
                    >
                      <span style={{ fontSize: '32px' }}>{icon}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.5px' }}>
                        CLINICAL PATHOLOGY
                      </span>
                    </div>
                  </div>

                  {/* Disease Title */}
                  <div className="card-title" style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>
                    {d.name}
                  </div>

                  {/* Disease Description */}
                  {d.description && (
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ 
                        fontSize: '13px', 
                        color: 'var(--text-secondary)', 
                        lineHeight: '1.55', 
                        margin: 0,
                        display: isExpanded ? 'block' : '-webkit-box',
                        WebkitLineClamp: isExpanded ? 'none' : 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {d.description}
                      </p>
                      {d.description.length > 140 && (
                        <button 
                          onClick={() => setExpandedCard(isExpanded ? null : i)}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: 'var(--accent-cyan)', 
                            fontSize: '11.5px', 
                            padding: '4px 0 0', 
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          {isExpanded ? 'Show less ▲' : 'Read more ▼'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Symptoms Section */}
                  <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-yellow)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🩺 Primary Symptoms
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: '1.45' }}>
                      {d.symptoms}
                    </div>
                  </div>

                  {/* Prevention Section */}
                  {d.prevention && (
                    <div style={{ marginTop: '10px', background: 'rgba(16, 185, 129, 0.05)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-green)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        🛡️ Prevention & Lifestyle
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                        {d.prevention}
                      </div>
                    </div>
                  )}

                  {/* Diagnostic Tests */}
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🧪 Recommended Diagnostics
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {d.tests}
                    </div>
                  </div>
                </div>

                {/* Footer: Consultant Doctor and Suggest Meds Button */}
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px' }}>👨‍⚕️</span>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Specialist</div>
                      <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--accent-purple)' }}>{d.consultant}</div>
                    </div>
                  </div>
                  <button 
                    className="btn btn-outline" 
                    style={{ fontSize: '11.5px', padding: '6px 12px', borderRadius: '8px' }}
                    onClick={() => fetchSuggestions(d)}
                    disabled={suggestLoading}
                  >
                    💊 Suggest Meds
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Suggestion Modal */}
      {suggestions && (
        <div 
          className="modal-overlay" 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} 
          onClick={() => setSuggestions(null)}
        >
          <div 
            className="modal-content card" 
            style={{ maxWidth: '620px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--accent-cyan)' }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div className="card-title" style={{ marginBottom: 0, fontSize: '18px' }}>
                💊 AI Pharmaceutical Suggestions for {suggestions.diseaseName}
              </div>
              <button className="btn" onClick={() => setSuggestions(null)} style={{ padding: '4px 10px', fontSize: '14px' }}>✕</button>
            </div>
            
            <div className="medicine-grid" style={{ gridTemplateColumns: '1fr', gap: '10px' }}>
              {suggestions.meds && suggestions.meds.length > 0 ? suggestions.meds.map((m, idx) => (
                <div key={idx} className="card" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--accent-cyan)', fontSize: '15px' }}>{m.product_name}</div>
                    <div style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '13.5px' }}>{m.product_price}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{m.salt_composition}</div>
                  {m.medicine_desc && (
                    <div style={{ fontSize: '12.5px', marginTop: '8px', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                      {m.medicine_desc.substring(0, 140)}...
                    </div>
                  )}
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
                  <p>No direct pharmaceutical match found in current formulary. Please consult a registered specialist.</p>
                </div>
              )}
            </div>
            
            <p style={{ marginTop: '18px', fontSize: '11.5px', color: 'var(--accent-yellow)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', lineHeight: '1.5' }}>
              ⚠️ <strong>Clinical Notice:</strong> These automated suggestions are based on historical formulary records. Prescription medications must only be taken under the supervision of a licensed physician.
            </p>
          </div>
        </div>
      )}

      {suggestLoading && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001, background: 'rgba(0,0,0,0.85)', padding: '24px', borderRadius: '16px', border: '1px solid var(--accent-cyan)', textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 12px' }} />
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}>Consulting Medicine Formulary...</p>
        </div>
      )}
    </div>
  );
}
