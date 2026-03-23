import React, { useState, useRef } from 'react';

const DISEASE_OPTIONS = [
  { value: 'parkinsons', label: "Parkinson's Disease" },
  { value: 'respiratory', label: 'Respiratory Infection' },
  { value: 'covid', label: 'COVID-19 (Cough Analysis)' },
];

export default function VoiceDetection({ addToast }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [disease, setDisease] = useState('parkinsons');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRef.current.ondataavailable = e => chunksRef.current.push(e.data);
      mediaRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
      };
      mediaRef.current.start();
      setIsRecording(true);
      setSeconds(0);
      setResult(null);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
      addToast('Recording started!', 'info');
    } catch (e) {
      addToast('Microphone access denied. Please allow microphone.', 'error');
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    mediaRef.current?.stream?.getTracks().forEach(t => t.stop());
    setIsRecording(false);
    clearInterval(timerRef.current);
    addToast('Recording saved! Click Analyze to get results.', 'success');
  };

  const analyzeVoice = async () => {
    if (!audioBlob) {
      addToast('Please record audio first!', 'error');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('disease', disease);
      const res = await fetch('/api/voice/analyze', {
        method: 'POST', body: formData,
      });
      const data = await res.json();
      setResult(data);
      addToast('Analysis complete!', 'success');
    } catch {
      // Demo fallback when backend not running
      const demo = {
        disease: disease,
        prediction: Math.random() > 0.5 ? 'Positive Risk Detected' : 'No Risk Detected',
        confidence: (Math.random() * 40 + 55).toFixed(1),
        features: { mdvp_fo: (150 + Math.random() * 50).toFixed(2), jitter: (0.003 + Math.random() * 0.005).toFixed(4), shimmer: (0.02 + Math.random() * 0.03).toFixed(4), hnr: (20 + Math.random() * 8).toFixed(2) },
        note: 'Demo mode — backend not connected.'
      };
      setResult(demo);
      addToast('Demo result shown (backend not connected).', 'info');
    }
    setLoading(false);
  };

  const confidenceClass = result
    ? parseFloat(result.confidence) >= 75 ? 'high' : parseFloat(result.confidence) >= 55 ? 'medium' : 'low'
    : '';

  const isPositive = result?.prediction?.toLowerCase().includes('positive');

  return (
    <div>
      <div className="page-header">
        <h1>🎤 Voice Disease Detection</h1>
        <p>Record your voice and let our AI model analyze vocal biomarkers for early disease signals.</p>
      </div>

      <div className="voice-container">
        {/* Recorder */}
        <div className="recorder-card">
          <div className="card-title" style={{ alignSelf: 'flex-start' }}>🎙️ Voice Recorder</div>

          {/* Disease Selector */}
          <div className="input-group" style={{ width: '100%' }}>
            <label className="input-label">Select Disease to Detect</label>
            <select className="input-field" value={disease} onChange={e => setDisease(e.target.value)}>
              {DISEASE_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          {/* mic button */}
          <div
            className={`mic-btn ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            {isRecording ? '⏹️' : '🎤'}
          </div>

          <div className={`rec-status ${isRecording ? 'active' : ''}`}>
            {isRecording ? `● Recording... ${seconds}s` : audioBlob ? '✓ Audio ready for analysis' : 'Click mic to start recording'}
          </div>

          {/* Wave bars */}
          <div className={`wave-bars ${isRecording ? 'active' : 'idle'}`}>
            {[...Array(7)].map((_, i) => <div className="wave-bar" key={i} />)}
          </div>

          {/* Audio playback */}
          {audioURL && (
            <div style={{ width: '100%' }}>
              <div className="input-label" style={{ marginBottom: '8px' }}>🔊 Playback</div>
              <audio src={audioURL} controls style={{ width: '100%', borderRadius: '8px' }} />
            </div>
          )}

          {/* Analyze Button */}
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
            onClick={analyzeVoice}
            disabled={loading || !audioBlob}
          >
            {loading ? <><span className="spinner" /> Analyzing...</> : '🧠 Analyze Voice'}
          </button>
        </div>

        {/* Result */}
        <div className="result-box">
          <div className="result-header">📊 Analysis Result</div>
          {!result && !loading && (
            <div className="prediction-result">
              <div className="result-label neutral">Results will appear here after analysis.</div>
              <div style={{ marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                <p>🔬 <strong>How it works:</strong></p>
                <ul style={{ paddingLeft: '16px', marginTop: '8px' }}>
                  <li>Record at least 5-10 seconds of sustained speech</li>
                  <li>Our model extracts MFCC, jitter, shimmer, and HNR features</li>
                  <li>A trained ML classifier predicts disease likelihood</li>
                  <li>Confidence % indicates model certainty</li>
                </ul>
              </div>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 16px', borderWidth: '3px' }} />
              <p>Extracting vocal features...</p>
            </div>
          )}

          {result && !loading && (
            <div className="prediction-result">
              <div style={{ display: 'flex', align: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span className={`status-badge ${isPositive ? 'fake' : 'genuine'}`}>
                  {isPositive ? '⚠️ Positive' : '✅ Negative'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {result.disease?.replace('_', ' ')} Analysis
                </span>
              </div>

              <div className={`result-label ${isPositive ? 'positive' : 'negative'}`}>
                {result.prediction}
              </div>

              <div className="confidence-bar-container">
                <div className="confidence-label">
                  <span>Confidence</span>
                  <span>{result.confidence}%</span>
                </div>
                <div className="confidence-bar">
                  <div className={`confidence-fill ${confidenceClass}`} style={{ width: `${result.confidence}%` }} />
                </div>
              </div>

              {result.features && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '600' }}>EXTRACTED FEATURES</div>
                  <table className="detail-table">
                    <tbody>
                      <tr><td>MDVP:Fo (Hz)</td><td>{result.features.mdvp_fo}</td></tr>
                      <tr><td>Jitter</td><td>{result.features.jitter}</td></tr>
                      <tr><td>Shimmer</td><td>{result.features.shimmer}</td></tr>
                      <tr><td>HNR</td><td>{result.features.hnr}</td></tr>
                    </tbody>
                  </table>
                </div>
              )}

              {result.note && (
                <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', fontSize: '12px', color: 'var(--accent-yellow)' }}>
                  ⚠️ {result.note}
                </div>
              )}

              <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(59,130,246,0.07)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                ℹ️ This is an AI-based screening tool and does not replace professional medical diagnosis.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
