import React, { useState } from 'react';

const ayurvedaData = [
  {
    id: 1,
    name: 'Tulsi (Holy Basil)',
    hindiName: 'तुलसी',
    image: '/herbs/tulsi.png',
    category: 'Immunity & Respiration',
    description: 'Revered in Ayurveda as the "Queen of Herbs", Tulsi boosts antibody production and respiratory health.',
    benefits: ['Boosts cell-mediated immunity', 'Reduces physical & mental stress', 'Fights respiratory congestion', 'Improves digestion'],
    usage: 'Consume 2-3 fresh leaves daily or brew as herbal Kadha infusion.'
  },
  {
    id: 2,
    name: 'Neem (Azadirachta Indica)',
    hindiName: 'नीम',
    image: '/herbs/neem.png',
    category: 'Detox & Skin Care',
    description: 'A powerful blood purifier and antimicrobial botanical used for dermatological healing.',
    benefits: ['Clears acne & eczema lesions', 'Purifies blood impurities', 'Supports oral hygiene', 'Anti-fungal skin barrier'],
    usage: 'Apply organic neem paste or take diluted cold-pressed extract.'
  },
  {
    id: 3,
    name: 'Ashwagandha (Withania Somnifera)',
    hindiName: 'अश्वगंधा',
    image: '/herbs/ashwagandha.png',
    category: 'Stress & Stamina',
    description: 'A potent adaptogen that lowers cortisol, calms the nervous system, and enhances muscle endurance.',
    benefits: ['Lowers cortisol stress markers', 'Enhances deep REM sleep', 'Boosts neuro-cognitive clarity', 'Increases muscle strength'],
    usage: 'Mix 1/2 tsp root powder in warm milk or water before bedtime.'
  },
  {
    id: 4,
    name: 'Turmeric (Haldi)',
    hindiName: 'हल्दी',
    image: '/herbs/haldi.png',
    category: 'Anti-Inflammatory',
    description: 'The Golden Spice enriched with Curcumin for joint health, wound healing, and cellular immunity.',
    benefits: ['Heals tissue inflammation', 'Reduces arthritic joint stiffness', 'Enhances radiant skin complexion', 'Fights oxidative damage'],
    usage: 'Simmer with warm milk & black pepper (Golden Milk).'
  },
  {
    id: 5,
    name: 'Amla (Indian Gooseberry)',
    hindiName: 'आंवला',
    image: '/herbs/amla.png',
    category: 'Vitamin C & Vitality',
    description: 'One of nature\'s highest concentrations of bioavailable Vitamin C for hair, collagen, and digestion.',
    benefits: ['Promotes collagen & hair density', 'Strengthens ocular vision', 'Improves gut absorption', 'Rejuvenates liver cells'],
    usage: 'Drink 20ml fresh juice every morning on an empty stomach.'
  },
  {
    id: 6,
    name: 'Giloy (Guduchi)',
    hindiName: 'गिलोय',
    image: '/herbs/giloy.png',
    category: 'Fever & Platelet Care',
    description: 'Known as "Amrita" (Immortal Nectar), Giloy manages chronic fevers and maintains healthy blood platelets.',
    benefits: ['Fights recurrent viral fevers', 'Stabilizes platelet count', 'Purges metabolic toxins', 'Supports glycemic control'],
    usage: 'Boil Giloy stem in water to prepare medicinal Kadha.'
  },
  {
    id: 7,
    name: 'Aloe Vera',
    hindiName: 'घृतकुमारी',
    image: '/herbs/aloe.png',
    category: 'Skin Cooling & Gut Care',
    description: 'Cooling botanical gel rich in vitamins A, C, E, and B12 for tissue hydration and digestive soothing.',
    benefits: ['Hydrates dermis tissue', 'Soothes acid reflux & stomach lining', 'Accelerates burn healing', 'Balances skin pH'],
    usage: 'Apply pure inner gel topically or drink 30ml aloe pulp juice.'
  },
  {
    id: 8,
    name: 'Brahmi (Bacopa Monnieri)',
    hindiName: 'ब्राह्मी',
    image: '/herbs/brahmi.png',
    category: 'Brain & Memory Nootropic',
    description: 'A premier brain tonic that strengthens synaptic connections and improves memory retention.',
    benefits: ['Sharpens cognitive recall', 'Calms neural hyperactivity', 'Supports focus & concentration', 'Reduces mental fatigue'],
    usage: 'Take as herbal tea or standardized Medhya tonic.'
  }
];

export default function Ayurveda({ addToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHerb, setSelectedHerb] = useState(null);

  const filteredHerbs = ayurvedaData.filter(herb => 
    herb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    herb.hindiName.includes(searchTerm) ||
    herb.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>🪴 Hospital Holistic Ayurveda & Botanical Science</h1>
        <p>Discover evidence-based Ayurvedic remedies, bioactive phytochemicals, and natural therapeutic guidelines.</p>
      </div>

      <div style={{ marginBottom: '26px' }}>
        <input 
          type="text" 
          placeholder="🔍 Search botanical herbs by name, category, or Hindi name (e.g. Tulsi, Immunity)..." 
          className="input-field"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '16px 22px',
            fontSize: '15px'
          }}
        />
      </div>

      <div className="dept-grid">
        {filteredHerbs.map(herb => (
          <div 
            key={herb.id} 
            className="dept-card"
            onClick={() => setSelectedHerb(herb)}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ height: '180px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', border: '1px solid var(--border)' }}>
              <img 
                src={herb.image} 
                alt={herb.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-green)', padding: '4px 10px', borderRadius: '20px', fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  {herb.category}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '700' }}>{herb.hindiName}</span>
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>{herb.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {herb.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Herb Detail Modal */}
      {selectedHerb && (
        <div 
          onClick={() => setSelectedHerb(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)',
            padding: '20px'
          }}
        >
          <div 
            className="card animate-fade-in"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '0',
              border: '1px solid var(--accent-green)'
            }}
          >
            <div style={{ position: 'relative', height: '240px' }}>
              <img 
                src={selectedHerb.image} 
                alt={selectedHerb.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button 
                onClick={() => setSelectedHerb(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>{selectedHerb.name} ({selectedHerb.hindiName})</h2>
                <span className="status-badge genuine">{selectedHerb.category}</span>
              </div>
              <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6' }}>{selectedHerb.description}</p>
              
              <h4 style={{ color: 'var(--accent-green)', marginBottom: '10px', fontSize: '15px' }}>⭐ Clinical Benefits:</h4>
              <ul style={{ paddingLeft: '20px', marginBottom: '20px', lineHeight: '1.7', fontSize: '13.5px', color: 'var(--text-primary)' }}>
                {selectedHerb.benefits.map((b, i) => <li key={i}>{b}</li>)}
              </ul>

              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h4 style={{ marginTop: 0, color: 'var(--accent-cyan)', fontSize: '14px', marginBottom: '6px' }}>🥣 Clinical Preparation & Usage:</h4>
                <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{selectedHerb.usage}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
