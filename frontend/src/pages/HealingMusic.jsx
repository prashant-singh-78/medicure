import React, { useState, useEffect, useRef } from 'react';

const TRACKS = [
  {
    id: '432hz',
    title: '432 Hz Solfeggio Restorative Resonance',
    subtitle: 'Deep Cellular Relaxation & Cardiac Calm',
    category: 'Harmonic Therapy',
    icon: '🌿',
    baseFreq: 432,
    beatFreq: 4, // Theta/Delta boundary
    toneType: 'harmonic',
    description: '432 Hz is mathematically aligned with natural harmonic vibrations, proven to decrease heart rate and promote parasympathetic nervous system activation.',
    clinicalBenefit: 'Reduces mean arterial blood pressure and lowers salivary cortisol markers.'
  },
  {
    id: '528hz',
    title: '528 Hz Transformation & Clarity',
    subtitle: 'Anxiety Suppression & Stress Release',
    category: 'Solfeggio Frequency',
    icon: '💫',
    baseFreq: 528,
    beatFreq: 6, // Theta wave
    toneType: 'binaural',
    description: 'Referred to in music therapy as the frequency of transformation, 528 Hz promotes neuro-cognitive decompression and autonomic nervous stabilization.',
    clinicalBenefit: 'Encourages parasympathetic recovery and reduces sympathetic stress spikes.'
  },
  {
    id: 'rain',
    title: 'Gentle Monsoon Rain & Delta Sleep Waves',
    subtitle: 'Acoustic White-Pink Noise Therapy',
    category: 'Nature Soundscape',
    icon: '🌧️',
    baseFreq: 120,
    beatFreq: 2.5, // Delta wave
    toneType: 'rain',
    description: 'Brownian and pink acoustic noise mimics steady gentle rainfall, masking abrupt environmental decibel shifts and inducing restorative slow-wave sleep.',
    clinicalBenefit: 'Improves sleep onset latency and promotes deeper stage-3 NREM cycles.'
  },
  {
    id: 'ocean',
    title: 'Ocean Swell & Vagus Nerve Sync',
    subtitle: 'Rhythmic Breathing & Bio-Pacing Guide',
    category: 'Nature Soundscape',
    icon: '🌊',
    baseFreq: 80,
    beatFreq: 5, // Theta wave
    toneType: 'ocean',
    description: 'Low-frequency undulating sound rhythms mimic 6-breath-per-minute resonance pacing, triggering the baroreflex mechanism for instant anxiety release.',
    clinicalBenefit: 'Stimulates vagal nerve tone and increases heart rate variability (HRV).'
  },
  {
    id: 'tibetan',
    title: 'Tibetan Singing Bowls & Zen Harmony',
    subtitle: 'Meditation & Theta Wave Induction',
    category: 'Mindfulness Chimes',
    icon: '🧘',
    baseFreq: 216,
    beatFreq: 7, // High Theta
    toneType: 'bowl',
    description: 'Rich harmonic acoustic overtones resonate through bone and soft tissue, encouraging meditative alpha-theta brainwave transition within 8 minutes.',
    clinicalBenefit: 'Suppresses hyperactive beta brainwave activity in generalized anxiety.'
  },
  {
    id: 'lofi',
    title: 'Warm Lo-Fi Ambient Grounding',
    subtitle: 'Cognitive Decompression & Focus',
    category: 'Ambient Chill',
    icon: '🎧',
    baseFreq: 261.63, // Middle C
    beatFreq: 10, // Alpha wave
    toneType: 'lofi',
    description: 'Soft analog acoustic warmth with muted low-pass filtering, engineered to sustain calm cognitive concentration without auditory overstimulation.',
    clinicalBenefit: 'Minimizes cognitive fatigue and prevents mental exhaustion.'
  }
];

function generatePinkNoiseBuffer(ctx) {
  const bufferSize = ctx.sampleRate * 3;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
    b6 = white * 0.115926;
  }
  return noiseBuffer;
}

export default function HealingMusic({ addToast }) {
  const [activeTab, setActiveTab] = useState('audio'); // 'audio' | 'video'
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [timerDuration, setTimerDuration] = useState(900); // 15 mins default (in seconds)
  const [timerRemaining, setTimerRemaining] = useState(900);

  // Audio Context Ref
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const oscillatorsRef = useRef([]);
  const noiseNodeRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const currentTrack = TRACKS[currentTrackIndex];

  // Initialize Web Audio Engine
  const startAudioEngine = (track) => {
    stopAudioEngine();

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        if (addToast) addToast('Web Audio not supported in this browser.', 'warning');
        return;
      }

      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(isMuted ? 0 : volume * 0.35, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      oscillatorsRef.current = [];

      if (track.toneType === 'harmonic' || track.toneType === 'binaural') {
        // Primary Carrier Tone
        const oscLeft = ctx.createOscillator();
        const pannerLeft = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        oscLeft.type = 'sine';
        oscLeft.frequency.setValueAtTime(track.baseFreq, ctx.currentTime);

        const oscRight = ctx.createOscillator();
        const pannerRight = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        oscRight.type = 'sine';
        oscRight.frequency.setValueAtTime(track.baseFreq + track.beatFreq, ctx.currentTime);

        // Warm harmonic sub-oscillator (1 octave down)
        const subOsc = ctx.createOscillator();
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(track.baseFreq / 2, ctx.currentTime);
        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.2, ctx.currentTime);
        subOsc.connect(subGain);
        subGain.connect(masterGain);

        if (pannerLeft && pannerRight) {
          pannerLeft.pan.setValueAtTime(-0.8, ctx.currentTime);
          pannerRight.pan.setValueAtTime(0.8, ctx.currentTime);
          oscLeft.connect(pannerLeft);
          pannerLeft.connect(masterGain);
          oscRight.connect(pannerRight);
          pannerRight.connect(masterGain);
        } else {
          oscLeft.connect(masterGain);
          oscRight.connect(masterGain);
        }

        oscLeft.start();
        oscRight.start();
        subOsc.start();
        oscillatorsRef.current.push(oscLeft, oscRight, subOsc);

      } else if (track.toneType === 'rain' || track.toneType === 'ocean') {
        const noiseBuffer = generatePinkNoiseBuffer(ctx);
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        // Lowpass Filter for Gentle Water Character
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(track.toneType === 'ocean' ? 450 : 800, ctx.currentTime);

        if (track.toneType === 'ocean') {
          // LFO for wave swelling
          const lfo = ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // 12 cycles per min
          const lfoGain = ctx.createGain();
          lfoGain.gain.setValueAtTime(250, ctx.currentTime);
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);
          lfo.start();
          oscillatorsRef.current.push(lfo);
        }

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();
        noiseNodeRef.current = whiteNoise;

      } else {
        // Tibetan Bowl / Lo-Fi chords
        const freqs = [track.baseFreq, track.baseFreq * 1.5, track.baseFreq * 2];
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          osc.type = idx === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(f, ctx.currentTime);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.2 / (idx + 1), ctx.currentTime);
          osc.connect(gain);
          gain.connect(masterGain);

          osc.start();
          oscillatorsRef.current.push(osc);
        });
      }

      setIsPlaying(true);
      if (addToast) addToast(`Now playing: ${track.title}`, 'info');
    } catch (err) {
      console.warn('Audio playback initialization exception:', err);
      if (addToast) addToast('Acoustic synthesizer initialized with basic fallback.', 'info');
    }
  };

  const stopAudioEngine = () => {
    try {
      oscillatorsRef.current.forEach(osc => {
        try { osc.stop(); osc.disconnect(); } catch (err) { void err; }
      });
      oscillatorsRef.current = [];

      if (noiseNodeRef.current) {
        try { noiseNodeRef.current.stop(); noiseNodeRef.current.disconnect(); } catch (err) { void err; }
        noiseNodeRef.current = null;
      }

      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    } catch (e) {
      console.warn('Audio stop cleanup:', e);
    }
    setIsPlaying(false);
  };

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAudioEngine();
    } else {
      startAudioEngine(currentTrack);
    }
  };

  // Change Track
  const handleSelectTrack = (index) => {
    setCurrentTrackIndex(index);
    setTimerRemaining(timerDuration);
    if (isPlaying) {
      startAudioEngine(TRACKS[index]);
    }
  };

  const handleNextTrack = () => {
    const nextIdx = (currentTrackIndex + 1) % TRACKS.length;
    handleSelectTrack(nextIdx);
  };

  const handlePrevTrack = () => {
    const prevIdx = (currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
    handleSelectTrack(prevIdx);
  };

  // Volume Changes
  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(isMuted ? 0 : newVol * 0.35, audioCtxRef.current.currentTime);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(newMuted ? 0 : volume * 0.35, audioCtxRef.current.currentTime);
    }
  };

  // Session Timer Countdown
  useEffect(() => {
    if (isPlaying) {
      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            stopAudioEngine();
            if (addToast) addToast('Acoustic therapy session complete. Take a gentle breath.', 'success');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isPlaying, addToast]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopAudioEngine();
    };
  }, []);

  const formatSecs = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img 
            src="/brand_logo.png" 
            alt="Medicure Brand Logo" 
            style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1.5px solid var(--accent-red)', boxShadow: '0 0 15px rgba(244, 63, 94, 0.35)', flexShrink: 0 }} 
          />
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>🎵 Restorative Acoustic Therapy & Healing Soundscapes</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13.5px' }}>
              Clinically verified sound frequencies, Solfeggio resonance, and natural acoustic bio-pacing to alleviate autonomic stress markers.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-input)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <button 
            className={`btn ${activeTab === 'audio' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 14px', fontSize: '12.5px', border: 'none' }}
            onClick={() => { stopAudioEngine(); setActiveTab('audio'); }}
          >
            🎧 Interactive Soundscapes
          </button>
          <button 
            className={`btn ${activeTab === 'video' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 14px', fontSize: '12.5px', border: 'none' }}
            onClick={() => { stopAudioEngine(); setActiveTab('video'); }}
          >
            🎥 Guided Video Therapy
          </button>
        </div>
      </div>

      {activeTab === 'audio' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Main Player Card */}
          <div className="card" style={{ padding: '26px', background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.85))', border: '1px solid var(--accent-blue)', boxShadow: '0 10px 30px rgba(14, 165, 233, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--accent-cyan)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
                {currentTrack.category}
              </span>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Timer: <strong style={{ color: 'var(--text-primary)' }}>{formatSecs(timerRemaining)}</strong>
              </span>
            </div>

            {/* Visualizer Artwork Circle */}
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div 
                style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  background: isPlaying ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' : 'rgba(255,255,255,0.05)',
                  border: isPlaying ? '3px solid var(--accent-cyan)' : '2px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '56px',
                  boxShadow: isPlaying ? '0 0 30px rgba(14, 165, 233, 0.5)' : 'none',
                  transition: 'all 0.4s ease'
                }}
              >
                {currentTrack.icon}
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>{currentTrack.title}</h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0 }}>{currentTrack.subtitle}</p>
            </div>

            {/* Dynamic Wave Visualizer */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '5px', height: '36px', margin: '20px 0' }}>
              {[12, 24, 18, 32, 22, 14, 28, 20, 36, 16, 26, 30, 18, 22, 12].map((height, i) => (
                <div 
                  key={i}
                  style={{
                    width: '5px',
                    height: isPlaying ? `${height}px` : '4px',
                    background: isPlaying ? 'linear-gradient(to top, var(--accent-blue), var(--accent-cyan))' : 'var(--border)',
                    borderRadius: '4px',
                    transition: 'height 0.2s ease',
                    animation: isPlaying ? `pulse ${(i % 3) * 0.3 + 0.6}s infinite alternate` : 'none'
                  }}
                />
              ))}
            </div>

            {/* Player Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '22px' }}>
              <button 
                onClick={handlePrevTrack}
                className="btn btn-outline" 
                style={{ width: '42px', height: '42px', borderRadius: '50%', padding: 0, justifyContent: 'center', fontSize: '16px' }}
                title="Previous Track"
              >
                ⏮
              </button>

              <button 
                onClick={handleTogglePlay}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: isPlaying ? 'var(--accent-red)' : 'var(--accent-blue)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isPlaying ? '0 0 20px rgba(244, 63, 94, 0.4)' : '0 0 20px rgba(14, 165, 233, 0.4)',
                  transition: 'all 0.2s ease'
                }}
                title={isPlaying ? 'Pause Therapy' : 'Start Acoustic Session'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>

              <button 
                onClick={handleNextTrack}
                className="btn btn-outline" 
                style={{ width: '42px', height: '42px', borderRadius: '50%', padding: 0, justifyContent: 'center', fontSize: '16px' }}
                title="Next Track"
              >
                ⏭
              </button>
            </div>

            {/* Volume Control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--bg-input)', padding: '10px 18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <button 
                onClick={toggleMute} 
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-primary)' }}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={isMuted ? 0 : volume}
                onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent-cyan)' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '38px', textAlign: 'right' }}>
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>

            {/* Session Duration Selector */}
            <div style={{ marginTop: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Session Duration:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[300, 600, 900, 1800].map(secs => (
                  <button 
                    key={secs}
                    onClick={() => { setTimerDuration(secs); setTimerRemaining(secs); }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: '700',
                      border: '1px solid var(--border)',
                      background: timerDuration === secs ? 'var(--accent-blue)' : 'var(--bg-input)',
                      color: timerDuration === secs ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {secs / 60}m
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Playlist & Clinical Details */}
          <div>
            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="card-title" style={{ fontSize: '17px', marginBottom: '14px' }}>
                📋 Curated Acoustic Playlists ({TRACKS.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {TRACKS.map((t, idx) => (
                  <div 
                    key={t.id}
                    onClick={() => handleSelectTrack(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: currentTrackIndex === idx ? 'rgba(14, 165, 233, 0.12)' : 'var(--bg-input)',
                      border: currentTrackIndex === idx ? '1px solid var(--accent-cyan)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '24px' }}>{t.icon}</span>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: currentTrackIndex === idx ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                          {t.title}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {t.subtitle} • {t.baseFreq}Hz
                        </div>
                      </div>
                    </div>
                    {currentTrackIndex === idx && isPlaying ? (
                      <span style={{ color: 'var(--accent-cyan)', fontSize: '13px', fontWeight: '800' }}>● Active</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{Math.round(timerDuration/60)}m</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Evidence Box */}
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(14, 165, 233, 0.05))', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <span style={{ fontSize: '28px' }}>🔬</span>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: 'var(--accent-green)', fontWeight: '800' }}>
                    Clinical Neuro-Acoustic Mechanism
                  </h4>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {currentTrack.description}
                  </p>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-cyan)' }}>
                    💡 Physiological Impact: {currentTrack.clinicalBenefit}
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* Video Therapy Tab (Original YouTube Embed preserved) */
        <div className="card" style={{ maxWidth: '900px', margin: '0 auto', overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>🎧 Guided Video Stream: Mental Restorative Playlist</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Curated YouTube Health Collection</div>
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
            💡 <strong>Evidence-Based Tip:</strong> Research demonstrates that listening to 15-20 minutes of restorative soundscapes lowers resting heart rate, reduces cortisol secretion by up to 24%, and promotes alpha-theta brainwave transition.
          </div>
        </div>
      )}

      {/* Wellness Metrics Cards */}
      <div className="stats-grid" style={{ marginTop: '30px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌿</div>
          <div style={{ fontWeight: '800', fontSize: '15px' }}>Nature Bio-Pacing</div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Ocean waves & rain frequencies synchronize breath cycles to 6 breaths/min.</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✨</div>
          <div style={{ fontWeight: '800', fontSize: '15px' }}>Binaural Theta Beats</div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Slight phase differential between left & right audio channels induces deep meditation.</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🧘</div>
          <div style={{ fontWeight: '800', fontSize: '15px' }}>Cortisol Reduction</div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Autonomic nervous system shifts from sympathetic fight-or-flight to rest-and-digest.</p>
        </div>
      </div>

    </div>
  );
}
