import React, { useState } from 'react';

const ayurvedaData = [
  {
    id: 1,
    name: 'Tulsi (Holy Basil)',
    hindiName: 'तुलसी',
    image: '/herbs/tulsi.png',
    category: 'Immunity',
    description: 'Known as the "Queen of Herbs", Tulsi is revered in Ayurveda for its life-prolonging properties.',
    benefits: ['Boosts immunity', 'Reduces stress', 'Fights respiratory infections', 'Improves digestion'],
    usage: 'Consume 2-3 leaves daily on an empty stomach or brew as tea.'
  },
  {
    id: 2,
    name: 'Neem',
    hindiName: 'नीम',
    image: '/herbs/neem.png',
    category: 'Detox',
    description: 'A powerful blood purifier and antimicrobial herb used for centuries in skin care.',
    benefits: ['Treats acne and skin issues', 'Purifies blood', 'Supports oral health', 'Anti-fungal properties'],
    usage: 'Apply neem paste to skin or consume neem juice in small quantities.'
  },
  {
    id: 3,
    name: 'Ashwagandha',
    hindiName: 'अश्वगंधा',
    image: '/herbs/ashwagandha.png',
    category: 'Strength',
    description: 'An adaptogen that helps the body manage stress and improves physical strength.',
    benefits: ['Reduces anxiety', 'Improves sleep quality', 'Boosts brain function', 'Increases stamina'],
    usage: 'Mix 1/2 teaspoon of powder in warm milk or water before bedtime.'
  },
  {
    id: 4,
    name: 'Turmeric (Haldi)',
    hindiName: 'हल्दी',
    image: '/herbs/haldi.png',
    category: 'Healing',
    description: 'The "Golden Spice" known for its potent anti-inflammatory and antioxidant effects.',
    benefits: ['Heals wounds faster', 'Reduces joint pain', 'Improves skin glow', 'Fights inflammation'],
    usage: 'Add to curries or mix with warm milk (Golden Milk).'
  },
  {
    id: 5,
    name: 'Amla (Indian Gooseberry)',
    hindiName: 'आंवला',
    image: '/herbs/amla.png',
    category: 'Vitamin C',
    description: 'One of the richest sources of Vitamin C, essential for hair, skin, and eyes.',
    benefits: ['Slows aging', 'Improves hair growth', 'Enhances eyesight', 'Strengthens liver'],
    usage: 'Eat fresh fruit or consume juice/powder daily.'
  },
  {
    id: 6,
    name: 'Giloy',
    hindiName: 'गिलोय',
    image: '/herbs/giloy.png',
    category: 'Fever & Immunity',
    description: 'Also known as "Amrita", it is excellent for treating chronic fevers and boosting platelets.',
    benefits: ['Treats chronic fever', 'Improves digestion', 'Reduces asthma symptoms', 'Anti-diabetic effects'],
    usage: 'Boil the stem in water to make a decoction (Kadha).'
  },
  {
    id: 7,
    name: 'Aloe Vera',
    hindiName: 'घृतकुमारी',
    image: '/herbs/aloe.png',
    category: 'Skin & Digestion',
    description: 'A versatile plant used for cooling the body and healing skin burns.',
    benefits: ['Moisturizes skin', 'Helps with constipation', 'Heals sun burns', 'Reduces dental plaque'],
    usage: 'Apply fresh gel to skin or drink 20ml juice in the morning.'
  },
  {
    id: 8,
    name: 'Brahmi',
    hindiName: 'ब्राह्मी',
    image: '/herbs/brahmi.png',
    category: 'Brain Health',
    description: 'A dedicated brain tonic that enhances memory and cognitive ability.',
    benefits: ['Sharpens memory', 'Reduces ADHD symptoms', 'Lowers blood pressure', 'Reduces inflammation'],
    usage: 'Consume as a brain tonic or in supplement form.'
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
    <div className="ayurveda-container">
      <div className="page-header">
        <h1>🪴 Ancient Ayurveda Dictionary</h1>
        <p>Explore the healing power of traditional Indian herbs and natural remedies.</p>
      </div>

      <div className="search-section" style={{ marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="Search herbs by name, category, or Hindi name..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '15px 25px',
            borderRadius: '15px',
            border: '2px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: '16px',
            outline: 'none',
            transition: 'all 0.3s'
          }}
        />
      </div>

      <div className="herb-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '25px'
      }}>
        {filteredHerbs.map(herb => (
          <div 
            key={herb.id} 
            className="herb-card"
            onClick={() => setSelectedHerb(herb)}
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '20px',
              overflow: 'hidden',
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.3s',
              transform: 'translateY(0)'
            }}
          >
            <div style={{ height: '200px', overflow: 'hidden' }}>
              <img 
                src={herb.image} 
                alt={herb.name} 
                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=' + herb.name; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', background: 'var(--accent-green)', padding: '4px 10px', borderRadius: '20px', color: '#000', fontWeight: 'bold' }}>
                  {herb.category}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{herb.hindiName}</span>
              </div>
              <h3 style={{ margin: '15px 0 10px 0', fontSize: '20px' }}>{herb.name}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {herb.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal - Could be a detailed view if we had more screen space */}
      {selectedHerb && (
        <div 
          className="modal-overlay"
          onClick={() => setSelectedHerb(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
          }}
        >
          <div 
            className="modal-content card"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '800px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '0',
              borderRadius: '30px'
            }}
          >
            <div style={{ position: 'relative' }}>
              <img 
                src={selectedHerb.image} 
                alt={selectedHerb.name} 
                onError={(e) => { e.target.src = 'https://via.placeholder.com/800x400?text=' + selectedHerb.name; }}
                style={{ width: '100%', height: '300px', objectFit: 'cover' }}
              />
              <button 
                onClick={() => setSelectedHerb(null)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >✕</button>
            </div>
            <div style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h2 style={{ margin: 0 }}>{selectedHerb.name} ({selectedHerb.hindiName})</h2>
                <span className="badge" style={{ background: 'var(--accent-green)', color: '#000' }}>{selectedHerb.category}</span>
              </div>
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '25px' }}>{selectedHerb.description}</p>
              
              <h4 style={{ color: 'var(--accent-green)', marginBottom: '10px' }}>⭐ Key Benefits:</h4>
              <ul style={{ paddingLeft: '20px', marginBottom: '25px', lineHigh: '1.6' }}>
                {selectedHerb.benefits.map((b, i) => <li key={i}>{b}</li>)}
              </ul>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ marginTop: 0, color: 'var(--accent-cyan)' }}>🥣 How to Use:</h4>
                <p style={{ margin: 0, fontSize: '15px' }}>{selectedHerb.usage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .herb-card:hover {
          transform: translateY(-8px) !important;
          background: rgba(255,255,255,0.08) !important;
          border-color: var(--accent-green) !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .search-input:focus {
          border-color: var(--accent-green) !important;
          background: rgba(255,255,255,0.08) !important;
          box-shadow: 0 0 20px rgba(74, 222, 128, 0.1);
        }
      `}</style>
    </div>
  );
}
