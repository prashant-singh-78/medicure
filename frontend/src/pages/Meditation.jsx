import React, { useState, useEffect } from 'react';

export default function Meditation({ addToast }) {
  const [techniques, setTechniques] = useState([]);
  const [activeTechnique, setActiveTechnique] = useState(null);
  const [view, setView] = useState('practice');
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(300);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/meditation/techniques')
      .then(res => res.json())
      .then(data => setTechniques(data))
      .catch(() => {
        setTechniques([
          { id: 1, name: 'Anapanasati (Mindful Breathing)', description: 'Focusing gently on the entry & exit of breath at nostrils to quiet brainwaves.', duration: '5-15 mins', benefit: 'Lowers Alpha/Theta ratio', instructions: ['Sit comfortably with spine erect.', 'Focus attention on natural airflow.', 'Acknowledge thoughts without judgment and return to breath.'] },
          { id: 2, name: 'Body Scan Mindfulness', description: 'Systematic neural relaxation scanning from crown of head to toes.', duration: '10-20 mins', benefit: 'Reduces somatic stress', instructions: ['Lie down on back with arms resting.', 'Direct awareness to toes, ankles, calves.', 'Progressively release muscle tension up to the head.'] },
          { id: 3, name: 'Metta (Loving-Kindness)', description: 'Cultivating positive emotional states and reducing amygdala reactivity.', duration: '10 mins', benefit: 'Enhances vagal nerve tone', instructions: ['Begin with compassion towards self.', 'Extend feelings of wellness to loved ones.', 'Radiate peace to all living beings.'] }
        ]);
      });
    
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

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>🧘 Hospital Clinical Neuro-Mindfulness Suite</h1>
        <p>Evidence-based meditation protocols, bio-feedback breathing guides, and EEG brainwave research data.</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button 
          className={`btn ${view === 'practice' ? 'btn-primary' : 'btn-outline'}`} 
          onClick={() => setView('practice')}
        >🧘 Mindfulness Practice</button>
        <button 
          className={`btn ${view === 'research' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setView('research')}
        >🔬 Neuro-EEG Research Data</button>
      </div>

      {view === 'practice' && (
      <>
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(14, 165, 233, 0.05))', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ fontSize: '36px' }}>💡</div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px' }}>Neuro-Physiological Benefits of Daily Practice</div>
            <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Synchronized 4-7-8 breathing activates the parasympathetic nervous system via the vagus nerve, reducing blood pressure and suppressing elevated cortisol production within 5 minutes.
            </div>
          </div>
        </div>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
        {/* Left Column: Timer & Breathing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card timer-card" style={{ textAlign: 'center' }}>
            <div className="card-title" style={{ justifyContent: 'center' }}>🕉️ Session Timer</div>
            <div style={{ fontSize: '50px', fontWeight: '800', margin: '16px 0', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
              {formatTime(timer || selectedDuration)}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              {[300, 600, 900, 1200].map(s => (
                <button 
                  key={s} 
                  className={`btn ${selectedDuration === s ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '6px 14px', fontSize: '12.5px' }}
                  onClick={() => { setSelectedDuration(s); setTimer(s); setIsTimerRunning(false); }}
                >
                  {s/60}m
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {!isTimerRunning ? (
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsTimerRunning(true)}>▶ Start Session</button>
              ) : (
                <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsTimerRunning(false)}>⏸ Pause</button>
              )}
              <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setIsTimerRunning(false); setTimer(selectedDuration); }}>🔄 Reset</button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">🫁 Bio-Feedback Pacing Guide</div>
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
               <div className={`breathing-circle ${isTimerRunning ? 'animating' : ''}`} 
                    style={{ 
                      width: '130px', 
                      height: '130px', 
                      borderRadius: '50%', 
                      background: 'rgba(14, 165, 233, 0.15)', 
                      margin: '0 auto',
                      border: '3px solid var(--accent-cyan)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--glow-cyan)'
                    }}>
                 <span style={{ fontSize: '13px', color: 'var(--accent-cyan)', fontWeight: '700' }}>Inhale / Exhale</span>
               </div>
               <p style={{ marginTop: '20px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>Slowly synchronize your breath with the visual contraction ring.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Techniques */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="nav-section-label" style={{ padding: 0 }}>SELECT CLINICAL TECHNIQUE</div>
          <div className="medicine-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {techniques.map(tech => (
              <div 
                key={tech.id} 
                className="card"
                style={{ cursor: 'pointer', border: activeTechnique?.id === tech.id ? '1px solid var(--accent-cyan)' : '1px solid var(--border)' }}
                onClick={() => setActiveTechnique(tech)}
              >
                <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>{tech.name}</div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.5' }}>{tech.description}</p>
                <div style={{ fontSize: '12px', color: 'var(--accent-purple)', fontWeight: '700' }}>⏱️ {tech.duration} | {tech.benefit}</div>
              </div>
            ))}
          </div>

          {activeTechnique ? (
            <div className="card animate-fade-in" style={{ padding: '26px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>📖 Instructions: {activeTechnique.name}</h2>
                <button className="btn btn-primary" onClick={() => { 
                const secs = parseInt(activeTechnique.duration.split('-')[0]) * 60 || 300;
                setSelectedDuration(secs);
                setTimer(secs);
                setIsTimerRunning(true);
                addToast(`Starting ${activeTechnique.name} session`, 'success');
              }}>Start Practice</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {activeTechnique.instructions?.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '13px', fontWeight: '800', color: '#fff' }}>{i+1}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6' }}>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧘</div>
              <p style={{ fontSize: '14px' }}>Select a meditation technique to view detailed step-by-step guidance.</p>
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {view === 'research' && (
        <div className="animate-fade-in">
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-title">📊 Neuro-EEG BIDS Dataset Map</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
              <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--accent-cyan)' }}>24</div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>Clinical Subjects</div>
              </div>
              <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--accent-purple)' }}>46</div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>EEG Brain Channels (.bdf)</div>
              </div>
              <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--accent-green)' }}>4.38GB</div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: '600' }}>High-Frequency Signal Data</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .breathing-circle.animating {
          animation: breathe 8s infinite ease-in-out;
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.7); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
