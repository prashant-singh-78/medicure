import React, { useState } from 'react';

const ayurvedaData = [
  {
    id: 1,
    name: 'Tulsi (Holy Basil)',
    hindiName: 'तुलसी',
    botanical: 'Ocimum sanctum',
    image: '/herbs/tulsi.png',
    dosha: 'Balances Vata & Kapha',
    activeCompound: 'Eugenol, Ursolic acid, Rosmarinic acid',
    category: 'Immunity & Respiration',
    description: 'Revered in Ayurveda as the "Queen of Herbs" and "Elixir of Life", Tulsi boosts cell-mediated antibody production and respiratory health.',
    benefits: ['Boosts cell-mediated immunity', 'Reduces physical & mental stress markers', 'Clears respiratory congestion and bronchial spasms', 'Supports healthy digestive fire (Agni)'],
    usage: 'Consume 2-3 fresh leaves daily or brew as herbal Kadha infusion with black pepper and ginger.'
  },
  {
    id: 2,
    name: 'Neem (Indian Lilac)',
    hindiName: 'नीम',
    botanical: 'Azadirachta indica',
    image: '/herbs/neem.png',
    dosha: 'Pacifies Pitta & Kapha',
    activeCompound: 'Azadirachtin, Nimbin, Nimbidol',
    category: 'Detox & Skin Care',
    description: 'A powerful blood purifier, cooling bitter tonic, and antimicrobial botanical used for dermatological healing and metabolic detox.',
    benefits: ['Clears acne, eczema, and psoriasis lesions', 'Purifies blood and eliminates cellular toxins', 'Supports oral hygiene and gum integrity', 'Strengthens epidermal anti-fungal barrier'],
    usage: 'Apply organic neem leaf paste topically or take 10-15ml diluted cold-pressed extract.'
  },
  {
    id: 3,
    name: 'Ashwagandha (Indian Ginseng)',
    hindiName: 'अश्वगंधा',
    botanical: 'Withania somnifera',
    image: '/herbs/ashwagandha.png',
    dosha: 'Balances Vata & Kapha',
    activeCompound: 'Withanolides, Withaferin A, Alkaloids',
    category: 'Stress & Stamina',
    description: 'A premier Rasayana adaptogen that modulates cortisol, calms the central nervous system, and enhances physical endurance.',
    benefits: ['Lowers serum cortisol stress markers by up to 30%', 'Enhances restorative deep REM sleep architecture', 'Boosts neuro-cognitive focus and memory retention', 'Increases muscular stamina and vital force (Ojas)'],
    usage: 'Mix 1/2 tsp root powder in warm milk or water with a dash of nutmeg before bedtime.'
  },
  {
    id: 4,
    name: 'Turmeric (Haldi)',
    hindiName: 'हल्दी',
    botanical: 'Curcuma longa',
    image: '/herbs/haldi.png',
    dosha: 'Tridoshic (Balances Vata, Pitta, Kapha)',
    activeCompound: 'Curcuminoids, Curcumin, Turmerone',
    category: 'Anti-Inflammatory',
    description: 'The Golden Ayurvedic Root enriched with bio-active Curcumin for systemic inflammation management, joint comfort, and tissue repair.',
    benefits: ['Modulates inflammatory cytokines (TNF-alpha, IL-6)', 'Relieves arthritic joint stiffness and discomfort', 'Promotes radiant, blemish-free skin complexion', 'Protects cellular membranes from oxidative damage'],
    usage: 'Simmer 1 tsp turmeric powder in warm milk with black pepper (piperine boosts absorption by 2000%).'
  },
  {
    id: 5,
    name: 'Amla (Indian Gooseberry)',
    hindiName: 'आंवला',
    botanical: 'Phyllanthus emblica',
    image: '/herbs/amla.png',
    dosha: 'Tridoshic (Calms all 3 Doshas)',
    activeCompound: 'Ascorbic acid (Vitamin C), Tannins, Gallic acid',
    category: 'Vitamin C & Vitality',
    description: 'Nature’s most concentrated source of bio-stable Vitamin C, celebrated for cellular longevity, hair pigmentation, and metabolic vitality.',
    benefits: ['Promotes collagen synthesis and hair follicle density', 'Strengthens ocular vision and reduces eye fatigue', 'Optimizes digestive absorption and liver enzymes', 'Rejuvenates tissues as a master antioxidant Rasayana'],
    usage: 'Drink 20ml fresh cold-pressed juice every morning on an empty stomach with warm water.'
  },
  {
    id: 6,
    name: 'Giloy (Guduchi)',
    hindiName: 'गिलोय',
    botanical: 'Tinospora cordifolia',
    image: '/herbs/giloy.png',
    dosha: 'Balances all three Doshas',
    activeCompound: 'Cordifolioside A, Tinosporide, Berberine',
    category: 'Fever & Platelet Care',
    description: 'Renowned as "Amrita" (Immortal Nectar), Giloy regulates immune response during recurrent viral fevers and preserves healthy platelets.',
    benefits: ['Alleviates chronic and recurrent pyrexia/fevers', 'Supports healthy thrombocyte (platelet) counts', 'Purges metabolic endotoxins (Ama) from joints', 'Assists glycemic regulation and insulin sensitivity'],
    usage: 'Boil 1-inch fresh Giloy stem in water to prepare medicinal Kadha, consume twice daily.'
  },
  {
    id: 7,
    name: 'Aloe Vera (Ghritkumari)',
    hindiName: 'घृतकुमारी',
    botanical: 'Aloe barbadensis Miller',
    image: '/herbs/aloe.png',
    dosha: 'Pacifies Pitta & Vata',
    activeCompound: 'Acemannan, Aloin, Polysaccharides',
    category: 'Skin Cooling & Gut Care',
    description: 'A deeply soothing botanical gel rich in vitamins A, C, E, and B12, ideal for cooling internal acidity and dermal hydration.',
    benefits: ['Deeply hydrates dermis and accelerates burn regeneration', 'Neutralizes gastric hyperacidity and reflux discomfort', 'Promotes healthy intestinal motility and mucosal barrier', 'Restores epidermal pH balance and elasticity'],
    usage: 'Apply pure inner fillet gel topically, or consume 30ml organic pulp juice before breakfast.'
  },
  {
    id: 8,
    name: 'Brahmi (Water Hyssop)',
    hindiName: 'ब्राह्मी',
    botanical: 'Bacopa monnieri',
    image: '/herbs/brahmi.png',
    dosha: 'Calms Vata & Pitta',
    activeCompound: 'Bacosides A and B, Hersaponin',
    category: 'Brain & Memory Nootropic',
    description: 'The master Medhya Rasayana botanical that enhances synaptic plasticity, neurotransmitter synthesis, and mental clarity.',
    benefits: ['Sharpens cognitive recall, memory encoding, and retention', 'Calms neural hyperactivity, stress, and anxiety states', 'Promotes sustained executive focus and mental stamina', 'Protects brain tissue against neuro-oxidative stress'],
    usage: 'Take 1/2 tsp leaf powder with ghee or warm water, or brew as a soothing evening herbal infusion.'
  }
];

export default function Ayurveda() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHerb, setSelectedHerb] = useState(null);

  const filteredHerbs = ayurvedaData.filter(herb => 
    herb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    herb.hindiName.includes(searchTerm) ||
    herb.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    herb.botanical.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImageError = (e, herb) => {
    // Attempt fallback from backend static route if frontend relative failed
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    if (!e.currentTarget.src.startsWith(apiBase)) {
      e.currentTarget.src = `${apiBase}${herb.image}`;
    } else {
      // If backend also fails, hide image and show botanical badge
      e.currentTarget.style.display = 'none';
      if (e.currentTarget.nextElementSibling) {
        e.currentTarget.nextElementSibling.style.display = 'flex';
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <img 
          src="/brand_logo.png" 
          alt="Medicure Brand Logo" 
          style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1.5px solid var(--accent-red)', boxShadow: '0 0 15px rgba(244, 63, 94, 0.35)', flexShrink: 0 }} 
        />
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>🪴 Hospital Holistic Ayurveda & Botanical Science</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            Discover evidence-based Ayurvedic pharmacology, active phytochemicals, Dosha energetics, and holistic therapeutic guidelines.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '26px', maxWidth: '640px' }}>
        <input 
          type="text" 
          placeholder="🔍 Search botanical herbs by name, category, or Hindi name (e.g. Tulsi, Neem, Immunity)..." 
          className="input-field"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '14px 20px',
            fontSize: '14px'
          }}
        />
      </div>

      <div className="dept-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredHerbs.map(herb => (
          <div 
            key={herb.id} 
            className="dept-card"
            onClick={() => setSelectedHerb(herb)}
            style={{ 
              cursor: 'pointer',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '18px',
              background: 'var(--card-bg, #131d33)',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              {/* Herb Image with Fallback */}
              <div style={{ height: '180px', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px', border: '1px solid var(--border)', background: 'linear-gradient(135deg, #064e3b, #0f172a)', position: 'relative' }}>
                <img 
                  src={herb.image} 
                  alt={herb.name} 
                  onError={(e) => handleImageError(e, herb)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div 
                  style={{ 
                    display: 'none', 
                    position: 'absolute', 
                    inset: 0, 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    flexDirection: 'column',
                    background: 'linear-gradient(135deg, #065f46, #064e3b)',
                    color: '#fff',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '42px' }}>🌿</span>
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>{herb.name}</span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-green)', padding: '4px 10px', borderRadius: '20px', fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    {herb.category}
                  </span>
                  <span style={{ color: 'var(--accent-yellow)', fontSize: '14px', fontWeight: '700' }}>{herb.hindiName}</span>
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>{herb.name}</h3>
                <div style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--accent-cyan)', marginBottom: '10px' }}>{herb.botanical}</div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {herb.description}
                </p>
              </div>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                ☯️ {herb.dosha}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: '700' }}>
                View Science ➔
              </span>
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
            background: 'rgba(0,0,0,0.85)',
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
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '0',
              border: '1px solid var(--accent-green)',
              borderRadius: '16px'
            }}
          >
            <div style={{ position: 'relative', height: '240px', background: 'linear-gradient(135deg, #064e3b, #0f172a)' }}>
              <img 
                src={selectedHerb.image} 
                alt={selectedHerb.name} 
                onError={(e) => handleImageError(e, selectedHerb)}
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
                  background: 'rgba(0,0,0,0.65)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >✕</button>
            </div>
            <div style={{ padding: '26px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>{selectedHerb.name}</h2>
                  <div style={{ fontSize: '13.5px', color: 'var(--accent-yellow)', fontWeight: '700' }}>{selectedHerb.hindiName} • <span style={{ color: 'var(--accent-cyan)', fontStyle: 'italic' }}>{selectedHerb.botanical}</span></div>
                </div>
                <span className="status-badge genuine">{selectedHerb.category}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', margin: '14px 0', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                  <strong>Energetics:</strong> {selectedHerb.dosha}
                </span>
                <span style={{ fontSize: '12px', background: 'rgba(56, 189, 248, 0.1)', padding: '4px 10px', borderRadius: '6px', color: 'var(--accent-cyan)' }}>
                  <strong>Phytochemicals:</strong> {selectedHerb.activeCompound}
                </span>
              </div>

              <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6' }}>{selectedHerb.description}</p>
              
              <h4 style={{ color: 'var(--accent-green)', marginBottom: '10px', fontSize: '15px' }}>⭐ Clinical Pharmacological Benefits:</h4>
              <ul style={{ paddingLeft: '20px', marginBottom: '20px', lineHeight: '1.7', fontSize: '13.5px', color: 'var(--text-primary)' }}>
                {selectedHerb.benefits.map((b, i) => <li key={i}>{b}</li>)}
              </ul>

              <div style={{ background: 'var(--bg-input, #0d1527)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h4 style={{ marginTop: 0, color: 'var(--accent-cyan)', fontSize: '14px', marginBottom: '6px' }}>🥣 Clinical Preparation & Dosage Guidelines:</h4>
                <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{selectedHerb.usage}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
