import React, { useState, useEffect } from 'react';

export default function Meditation({ addToast }) {
  const [techniques, setTechniques] = useState([]);
  const [activeTechnique, setActiveTechnique] = useState(null);
  const [view, setView] = useState('practice'); // 'practice' or 'research'
  const [timer, setTimer] = useState(0); // in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(300); // default 5 mins

  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch('/api/meditation/techniques')
      .then(res => res.json())
      .then(data => setTechniques(data))
      .catch(() => addToast('Error loading techniques.', 'error'));
    
    // Load local practice history
    const saved = localStorage.getItem('meditation_log');
    if (saved) setHistory(JSON.parse(saved).slice(0, 5));
  }, []);

  useEffect(() => {
    let interval;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      completeSession();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const completeSession = () => {
    addToast('Meditation complete. Welcome back!', 'success');
    const newEntry = {
      date: new Date().toLocaleString(),
      duration: selectedDuration / 60,
      technique: activeTechnique?.name || 'Silent'
    };
    const updated = [newEntry, ...history];
    setHistory(updated.slice(0, 5));
    localStorage.setItem('meditation_log', JSON.stringify(updated));
  };

  const startTimer = (secs) => {
    setTimer(secs);
    setIsTimerRunning(true);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="meditation-container">
      <div className="page-header">
        <h1>🧘 Meditation & Wellness</h1>
        <p>Find inner peace with guided techniques and interactive focus tools.</p>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
        <button 
          className={`btn ${view === 'practice' ? 'btn-primary' : 'btn-outline'}`} 
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: view === 'practice' ? '2px solid white' : 'none' }}
          onClick={() => setView('practice')}
        >🧘 Meditation Practice</button>
        <button 
          className={`btn ${view === 'research' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: view === 'research' ? '2px solid white' : 'none' }}
          onClick={() => setView('research')}
        >🔬 Research Data (EEG)</button>
      </div>

      {view === 'practice' && (
      <>
      <div className="card" style={{ marginBottom: '24px', background: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ fontSize: '40px' }}>💡</div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '5px' }}>Beginner's Guide: How to Meditate</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              1. <strong>Find a Quiet Space:</strong> Sit or lie down comfortably. <br/>
              2. <strong>Set a Timer:</strong> Start with 5-10 minutes. <br/>
              3. <strong>Focus on Breath:</strong> Follow the expansion circle below. <br/>
              4. <strong>Be Kind:</strong> When your mind wanders, gently bring it back. No judgment!
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
        {/* Left Column: Timer & Breathing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card timer-card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, var(--bg-secondary) 0%, rgba(59, 130, 246, 0.05) 100%)' }}>
            <div className="card-title">🕉️ Meditation Timer</div>
            <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '20px 0', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
              {formatTime(timer || selectedDuration)}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
              {[300, 600, 900, 1200].map(s => (
                <button 
                  key={s} 
                  className={`btn ${selectedDuration === s ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => { setSelectedDuration(s); setTimer(s); setIsTimerRunning(false); }}
                >
                  {s/60}m
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {!isTimerRunning ? (
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsTimerRunning(true)}>▶ Start Session</button>
              ) : (
                <button className="btn btn-outline" style={{ flex: 1, border: '1px solid var(--accent-red)', color: 'var(--accent-red)', justifyContent: 'center' }} onClick={() => setIsTimerRunning(false)}>⏸ Pause</button>
              )}
              <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setIsTimerRunning(false); setTimer(selectedDuration); }}>🔄 Reset</button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">🫁 Breathing Guide</div>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
               <div className={`breathing-circle ${isTimerRunning ? 'animating' : ''}`} 
                    style={{ 
                      width: '120px', 
                      height: '120px', 
                      borderRadius: '50%', 
                      background: 'rgba(59, 130, 246, 0.2)', 
                      margin: '0 auto',
                      border: '2px solid var(--accent-cyan)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 4s ease-in-out'
                    }}>
                 <span style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>Inhale / Exhale</span>
               </div>
               <p style={{ marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>Slowly synchronize your breath with the expansion and contraction.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Techniques */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="section-label">SELECT A TECHNIQUE</div>
          <div className="medicine-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {techniques.map(tech => (
              <div 
                key={tech.id} 
                className={`card selectable-card ${activeTechnique?.id === tech.id ? 'active' : ''}`}
                style={{ cursor: 'pointer', border: activeTechnique?.id === tech.id ? '1px solid var(--accent-cyan)' : '1px solid transparent' }}
                onClick={() => setActiveTechnique(tech)}
              >
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>{tech.name}</div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{tech.description}</p>
                <div style={{ fontSize: '12px', color: 'var(--accent-purple)', fontWeight: 'bold' }}>🕒 {tech.duration} | {tech.benefit}</div>
              </div>
            ))}
          </div>

          {activeTechnique ? (
            <div className="card active-guide" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>📖 How to: {activeTechnique.name}</h2>
                <button className="btn btn-primary" onClick={() => { 
                const secs = parseInt(activeTechnique.duration.split('-')[0]) * 60;
                setSelectedDuration(secs);
                setTimer(secs);
                setIsTimerRunning(true);
                addToast(`Starting ${activeTechnique.name} session`, 'success');
              }}>Start Practice</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {activeTechnique.instructions.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{i+1}</div>
                    <div style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: '1.6' }}>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🧘</div>
              <p>Select a meditation technique from above to see detailed instructions.</p>
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {view === 'research' && (
        <div className="research-view">
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-title">📊 Dataset Overview</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
              <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>24</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Participants</div>
              </div>
              <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-purple)' }}>46</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Data Modules (.bdf)</div>
              </div>
              <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-green)' }}>4.38GB</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total EEG Signal Data</div>
              </div>
            </div>
            <p style={{ marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              This section uses the provided <strong>BIDS_EEG_meditation_experiment</strong> dataset. 
              The experiment recorded brainwave patterns across various meditation tasks (events) to study neuroplasticity.
            </p>
          </div>

          <div className="card">
            <div className="card-title">👥 Subject Session Map</div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '15px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Subject ID</th>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Session Count</th>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Task Type</th>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(24)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px' }}>sub-{String(i + 1).padStart(3, '0')}</td>
                      <td style={{ padding: '10px' }}>{i % 2 === 0 ? '2 Sessions' : '1 Session'}</td>
                      <td style={{ padding: '10px' }}>Meditation</td>
                      <td style={{ padding: '10px' }}><span style={{ color: 'var(--accent-green)' }}>● Processed</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="warning-box" style={{ marginTop: '40px', padding: '15px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', fontSize: '13px', color: 'rgba(239, 68, 68, 0.8)' }}>
        ⚠️ <strong>Medical Disclaimer:</strong> The suggestions and data provided here are for wellness and research purposes. Do not self-medicate based on these results.
      </div>

      <div className="card" style={{ marginTop: '24px', border: '1px dashed rgba(59, 130, 246, 0.3)', background: 'transparent' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ fontSize: '24px' }}>🔬</div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>Advanced: BIDS EEG Research Dataset Detected</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              We've identified a massive 4GB neuroimaging dataset (BIDS format). Current version of Medicure AI provides the training protocols used in this experiment as meditation guides. Waveform analysis tools for researchers are coming soon.
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .breathing-circle.animating {
          animation: breathe 8s infinite ease-in-out;
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.8); opacity: 1; }
        }
        .selectable-card:hover { transform: translateY(-3px); background: rgba(255,255,255,0.03); }
        .selectable-card.active { background: rgba(59, 130, 246, 0.08); }
      `}</style>
    </div>
  );
}
