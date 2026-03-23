import React from 'react';

export default function HealingMusic() {
  return (
    <div className="healing-music-container">
      <div className="page-header">
        <h1>🎵 Healing Music</h1>
        <p>Listen to a curated collection of soothing music to help reduce stress and improve your mental well-being.</p>
      </div>

      <div className="card" style={{ maxWidth: '900px', margin: '0 auto', overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>🎧 Now Playing: Mental Healing Playlist</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Powered by YouTube Music</div>
        </div>
        
        <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0 }}>
          <iframe
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 0,
            }}
            src="https://www.youtube.com/embed/videoseries?list=PLNKiFgyFkgLNscbCXTf-4wLcVdmAUKmLL"
            title="Healing Music Playlist"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        
        <div style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.05)', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          💡 <strong>Tip:</strong> Research shows that listening to calming music can lower cortisol levels, decrease heart rate, and provide a healthy distraction from daily stressors. Take 15 minutes today to just listen and breathe.
        </div>
      </div>

      <div className="stats-grid" style={{ marginTop: '30px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '30px', marginBottom: '10px' }}>🌿</div>
          <div style={{ fontWeight: 'bold' }}>Nature Sounds</div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gentle rain, ocean waves, and forest ambience for deep focus.</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '30px', marginBottom: '10px' }}>🧘</div>
          <div style={{ fontWeight: 'bold' }}>Lo-Fi Beats</div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Chilled rhythms to help you relax after a long day.</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '30px', marginBottom: '10px' }}>✨</div>
          <div style={{ fontWeight: 'bold' }}>Binaural Beats</div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Specific frequencies designed to aid meditation and sleep.</p>
        </div>
      </div>
    </div>
  );
}
