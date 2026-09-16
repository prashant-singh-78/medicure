import React, { useState } from 'react';

export default function AboutApp({ setActivePage, onEnterMainApp, isStandalone }) {
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterCategory, setFilterCategory] = useState('all');

  const handleOpenMainApp = () => {
    if (onEnterMainApp) {
      onEnterMainApp();
    } else if (setActivePage) {
      setActivePage('dashboard');
    }
  };

  const servicesList = [
    {
      id: 'voice',
      name: 'Voice Analysis',
      category: 'ai',
      categoryLabel: 'Core AI Tools',
      icon: '🎤',
      desc: 'Detects vocal biomarkers (Jitter, Shimmer, HNR) for early Parkinson\'s disease assessment.',
      badge: 'ML Ensemble'
    },
    {
      id: 'skin',
      name: 'Skin Problem Detector',
      category: 'ai',
      categoryLabel: 'Core AI Tools',
      icon: '🔍',
      desc: 'MobileNetV2 CNN Deep Learning model analyzing skin images for Acne, Rosacea, and conditions.',
      badge: 'TensorFlow CNN'
    },
    {
      id: 'disease',
      name: 'Disease Predictor',
      category: 'ai',
      categoryLabel: 'Core AI Tools',
      icon: '🩺',
      desc: 'TF-IDF + Calibrated Random Forest engine evaluating natural language symptoms.',
      badge: 'NLP AI'
    },
    {
      id: 'report',
      name: 'Report Analyzer',
      category: 'ai',
      categoryLabel: 'Core AI Tools',
      icon: '📄',
      desc: 'OCR & Generative AI engine parsing medical lab reports into simple key points.',
      badge: 'OCR & GenAI'
    },
    {
      id: 'verify-medicine',
      name: 'Medicine Check',
      category: 'ai',
      categoryLabel: 'Core AI Tools',
      icon: '💊',
      desc: 'Verifies medicine batch numbers, expiry, and authenticates genuine vs counterfiet medicines.',
      badge: 'Safety DB'
    },
    {
      id: 'visual-checker',
      name: 'AI Vision Checker',
      category: 'ai',
      categoryLabel: 'Core AI Tools',
      icon: '👁️',
      desc: 'Instant visual inspection tool for physical health symptoms and prescription labels.',
      badge: 'Computer Vision'
    },
    {
      id: 'sos',
      name: 'Emergency SOS',
      category: 'care',
      categoryLabel: 'Care & Emergency',
      icon: '🆘',
      desc: 'One-click emergency alert sending live GPS location coordinates to trusted contacts.',
      badge: 'Instant Alert'
    },
    {
      id: 'ambulance',
      name: 'Ambulance Service',
      category: 'care',
      categoryLabel: 'Care & Emergency',
      icon: '🚑',
      desc: 'Real-time directory for booking nearby emergency ambulances and contacting drivers.',
      badge: '24/7 Booking'
    },
    {
      id: 'doctors',
      name: 'Find Doctors',
      category: 'care',
      categoryLabel: 'Care & Emergency',
      icon: '👨‍⚕️',
      desc: 'Find specialized doctors nearby, check experience, and consult healthcare professionals.',
      badge: 'Directory'
    },
    {
      id: 'meditation',
      name: 'Meditation & Mind',
      category: 'wellness',
      categoryLabel: 'Wellness & Lifestyle',
      icon: '🧘',
      desc: 'Guided breathing exercises, meditation timers, and stress-reduction tools.',
      badge: 'Mental Care'
    },
    {
      id: 'healing-music',
      name: 'Healing Soundwaves',
      category: 'wellness',
      categoryLabel: 'Wellness & Lifestyle',
      icon: '🎵',
      desc: 'Curated bio-acoustic soundwave music designed to lower stress and improve sleep.',
      badge: 'Audio Therapy'
    },
    {
      id: 'ayurveda',
      name: 'Ayurveda Remedies',
      category: 'wellness',
      categoryLabel: 'Wellness & Lifestyle',
      icon: '🪴',
      desc: 'Holistic Ayurvedic traditional remedies and herbal health guidelines for natural wellness.',
      badge: 'Holistic Care'
    },
    {
      id: 'bmi',
      name: 'BMI Calculator',
      category: 'wellness',
      categoryLabel: 'Wellness & Lifestyle',
      icon: '⚖️',
      desc: 'Interactive Body Mass Index calculator with customized health targets and dietary tips.',
      badge: 'Fitness'
    },
    {
      id: 'reminders',
      name: 'Pill Reminders',
      category: 'records',
      categoryLabel: 'Records & Assistant',
      icon: '⏰',
      desc: 'Set daily medicine schedules with custom alarm notifications and dose tracking.',
      badge: 'Notification'
    },
    {
      id: 'history',
      name: 'Past Health Records',
      category: 'records',
      categoryLabel: 'Records & Assistant',
      icon: '📆',
      desc: 'Centralized medical history vault storing past predictions, reports, and AI checks.',
      badge: 'Vault'
    },
    {
      id: 'friend-chat',
      name: 'AI Friend Chat',
      category: 'records',
      categoryLabel: 'Records & Assistant',
      icon: '💬',
      desc: 'Empathetic conversational AI companion for mental support and health guidance.',
      badge: 'AI Assistant'
    },
    {
      id: 'about-disease',
      name: 'About Disease Directory',
      category: 'records',
      categoryLabel: 'Records & Assistant',
      icon: '📚',
      desc: 'Comprehensive medical knowledge base explaining conditions, causes, and prevention.',
      badge: 'Knowledge'
    }
  ];

  const filteredServices = filterCategory === 'all'
    ? servicesList
    : servicesList.filter(s => s.category === filterCategory);

  const handleLaunchService = (serviceId) => {
    setShowServicesModal(false);
    if (setActivePage) {
      setActivePage(serviceId);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '50px' }}>
      
      {/* ===== HERO BANNER SECTION ===== */}
      <div className="about-hero-card">
        <div className="about-hero-orb" />
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(14, 165, 233, 0.3)', fontSize: '13px', fontWeight: '700', marginBottom: '14px' }}>
              <span>✨ NEXT-GEN AI HEALTH PLATFORM</span>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', lineHeight: '1.2', marginBottom: '14px', background: 'linear-gradient(135deg, #f8fafc 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Smart Healthcare Assistant (Medicure Link)
            </h1>
            <p style={{ fontSize: '15.5px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '22px', maxWidth: '650px' }}>
              An intelligent, multi-modal medical suite powered by Machine Learning, Computer Vision, and Generative AI. 
              Designed to make early disease detection, medicine verification, and emergency care accessible to everyone 24/7.
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
              {/* PRIMARY SERVICES BUTTON TO OPEN MAIN DASHBOARD PAGE */}
              <button 
                className="services-btn-pulse" 
                onClick={handleOpenMainApp}
              >
                <span>⚡ Open Main Page & Services</span>
                <span style={{ fontSize: '18px' }}>➔</span>
              </button>

              <button 
                className="btn btn-outline" 
                onClick={() => setShowServicesModal(true)}
                style={{ padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '600' }}
              >
                🔍 Browse All Tools Gallery
              </button>
            </div>
          </div>

          {/* MEDICAL SVG VECTOR GRAPHIC */}
          <div style={{ flex: '0 0 240px', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '200px', height: '200px', borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(6, 182, 212, 0.1))',
              border: '1.5px solid rgba(56, 189, 248, 0.3)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--glow-blue)', backdropFilter: 'blur(10px)',
              position: 'relative', overflow: 'hidden'
            }}>
              <svg width="84" height="84" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M2 12h20"/>
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 7a5 5 0 0 1 5 5"/>
              </svg>
              <div style={{ marginTop: '12px', fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>Medicure AI v2.0</div>
              <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: '600' }}>Active Medical Suite</div>
            </div>
          </div>
        </div>

        {/* METRICS BADGES ROW */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-blue)' }}>15+ Smart Tools</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Multi-Modal AI Suite</div>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-green)' }}>95%+ Accuracy</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cross-Validated Models</div>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-red)' }}>24/7 SOS Care</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Real-Time GPS Alert</div>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-purple)' }}>100% Private</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Secure Session Storage</div>
          </div>
        </div>
      </div>

      {/* ===== NAVIGATION TABS ===== */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button 
          className={`tab-pill-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          🌐 Executive Overview
        </button>
        <button 
          className={`tab-pill-btn ${activeTab === 'keypoints' ? 'active' : ''}`}
          onClick={() => setActiveTab('keypoints')}
        >
          📌 Detailed Key Points
        </button>
        <button 
          className={`tab-pill-btn ${activeTab === 'tech' ? 'active' : ''}`}
          onClick={() => setActiveTab('tech')}
        >
          🧬 AI Architecture & ML
        </button>
        <button 
          className={`tab-pill-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          🛡️ Privacy & Security
        </button>
      </div>

      {/* ===== TAB CONTENT 1: EXECUTIVE OVERVIEW ===== */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h3 style={{ fontSize: '20px', color: 'var(--accent-blue)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎯 Our Mission</span>
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '15px' }}>
              Healthcare delay and misdiagnosis remain critical challenges worldwide. Medicure Link bridges this gap by offering instant, accurate, AI-driven diagnostic assistance at your fingertips. By analyzing speech patterns, skin images, clinical symptom descriptions, and medical documents, Medicure acts as your personalized 24/7 medical copilot.
            </p>
          </div>

          {/* VISUAL CARDS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div className="card rgb-card">
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🧠</div>
              <h4 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-primary)' }}>Multi-Modal AI Core</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Combines 3 specialized Machine Learning engines: Speech acoustic modeling, TensorFlow MobileNetV2 vision, and Calibrated Random Forest NLP.
              </p>
            </div>

            <div className="card rgb-card">
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚨</div>
              <h4 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-primary)' }}>Emergency Response</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Integrated GPS emergency SOS trigger, real-time ambulance locator, and local doctor directory for immediate critical care.
              </p>
            </div>

            <div className="card rgb-card">
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌿</div>
              <h4 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-primary)' }}>Holistic Wellness</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Combines modern Western medical diagnostics with traditional Ayurvedic natural remedies, guided meditation, and soundwave music therapy.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB CONTENT 2: DETAILED KEY POINTS ===== */}
      {activeTab === 'keypoints' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
            <h3 style={{ fontSize: '19px', marginBottom: '14px', color: 'var(--accent-blue)' }}>
              🔑 Key Features & Platform Capabilities
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                <div className="keypoint-pill" style={{ marginBottom: '8px' }}>✓ VOICE BIOMARKER DIAGNOSIS</div>
                <h5 style={{ fontSize: '16px', marginBottom: '6px', color: 'var(--text-primary)' }}>Parkinson's Early Detection</h5>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Extracts 22 pitch variation biomarkers (Jitter %, Shimmer dB, Noise-to-Harmonic ratio) from audio recordings to screen for neurodegenerative voice tremors.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                <div className="keypoint-pill" style={{ marginBottom: '8px' }}>✓ COMPUTER VISION SCANNER</div>
                <h5 style={{ fontSize: '16px', marginBottom: '6px', color: 'var(--text-primary)' }}>Skin Condition Classification</h5>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  MobileNetV2 deep neural net classifies user skin photos into Healthy, Acne Mild, Acne Severe, and Rosacea with softmax probability breakdown.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                <div className="keypoint-pill" style={{ marginBottom: '8px' }}>✓ FAKE MEDICINE CHECK</div>
                <h5 style={{ fontSize: '16px', marginBottom: '6px', color: 'var(--text-primary)' }}>Pharmaceutical Authentication</h5>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Verifies medicine batch numbers, manufacturing dates, and active ingredients against trusted medical database records.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                <div className="keypoint-pill" style={{ marginBottom: '8px' }}>✓ NLP SYMPTOM PREDICTOR</div>
                <h5 style={{ fontSize: '16px', marginBottom: '6px', color: 'var(--text-primary)' }}>Natural Language Disease Predictor</h5>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Processes free-text symptom phrases, calculates confidence probabilities, and recommends specialized lab tests and doctors.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                <div className="keypoint-pill" style={{ marginBottom: '8px' }}>✓ EMERGENCY BROADCAST</div>
                <h5 style={{ fontSize: '16px', marginBottom: '6px', color: 'var(--text-primary)' }}>Instant SOS Live Location</h5>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Sends emergency SMS alerts containing live Google Maps location coordinates to saved family and doctor contacts.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                <div className="keypoint-pill" style={{ marginBottom: '8px' }}>✓ OCR & LAB ANALYSIS</div>
                <h5 style={{ fontSize: '16px', marginBottom: '6px', color: 'var(--text-primary)' }}>Medical Report Summarizer</h5>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Reads PDF/Image lab reports, highlights out-of-range blood parameters, and translates complex medical jargon into plain English.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ===== TAB CONTENT 3: AI ARCHITECTURE ===== */}
      {activeTab === 'tech' && (
        <div className="card">
          <h3 style={{ fontSize: '20px', color: 'var(--accent-cyan)', marginBottom: '16px' }}>
            🧬 Machine Learning & Technical Architecture
          </h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
            Medicure Link uses a microservices-inspired FastAPI backend serving containerized Machine Learning pipelines:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border)' }}>
              <h4 style={{ color: 'var(--accent-blue)', marginBottom: '8px' }}>Python FastAPI Backend</h4>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                High-performance asynchronous API server handling auth, ML inference endpoints, SQLite user history, and CORS configuration.
              </p>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border)' }}>
              <h4 style={{ color: 'var(--accent-green)', marginBottom: '8px' }}>Scikit-Learn Ensemble</h4>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                `VotingClassifier` combining Random Forest (200 trees) + Gradient Boosting (150 trees) for Parkinson's speech detection.
              </p>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '18px', borderRadius: '14px', border: '1px solid var(--border)' }}>
              <h4 style={{ color: 'var(--accent-purple)', marginBottom: '8px' }}>TensorFlow MobileNetV2</h4>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Deep Neural Network pre-trained on ImageNet with customized dense layers for multi-class dermatological vision scanning.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB CONTENT 4: SECURITY ===== */}
      {activeTab === 'security' && (
        <div className="card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <h3 style={{ fontSize: '20px', color: 'var(--accent-green)', marginBottom: '14px' }}>
            🛡️ Privacy & Patient Data Safety
          </h3>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '14.5px', paddingLeft: '20px' }}>
            <li><strong>Encrypted Transport:</strong> All API requests between frontend and backend are transmitted securely.</li>
            <li><strong>Zero Data Selling:</strong> Patient symptoms, vocal recordings, and skin photos are strictly used for live inference and never shared with third parties.</li>
            <li><strong>Local User Storage:</strong> User authentication tokens and local preferences are safely stored in browser localStorage.</li>
            <li><strong>Emergency Transparency:</strong> GPS coordinates are only accessed when the user explicitly clicks the Emergency SOS trigger button.</li>
          </ul>
        </div>
      )}

      {/* ===== INTERACTIVE SERVICES MODAL (OPENED BY THE SERVICES BUTTON) ===== */}
      {showServicesModal && (
        <div className="services-modal-backdrop" onClick={() => setShowServicesModal(false)}>
          <div className="services-modal-content" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="services-modal-header">
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>⚡ Medicure AI Services Gallery</span>
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Click any service below to immediately launch it!
                </p>
              </div>
              <button 
                onClick={() => setShowServicesModal(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-primary)', width: '36px', height: '36px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* Category Filter Bar */}
            <div style={{ padding: '14px 28px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(15, 23, 42, 0.4)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
              <button 
                className={`tab-pill-btn ${filterCategory === 'all' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: '12.5px' }}
                onClick={() => setFilterCategory('all')}
              >
                All Services ({servicesList.length})
              </button>
              <button 
                className={`tab-pill-btn ${filterCategory === 'ai' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: '12.5px' }}
                onClick={() => setFilterCategory('ai')}
              >
                🧠 Core AI Tools
              </button>
              <button 
                className={`tab-pill-btn ${filterCategory === 'care' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: '12.5px' }}
                onClick={() => setFilterCategory('care')}
              >
                🚑 Care & Emergency
              </button>
              <button 
                className={`tab-pill-btn ${filterCategory === 'wellness' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: '12.5px' }}
                onClick={() => setFilterCategory('wellness')}
              >
                🧘 Wellness
              </button>
              <button 
                className={`tab-pill-btn ${filterCategory === 'records' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: '12.5px' }}
                onClick={() => setFilterCategory('records')}
              >
                📂 Records & Assistant
              </button>
            </div>

            {/* Modal Body - Grid of Services */}
            <div className="services-modal-body">
              <div className="services-grid">
                {filteredServices.map(service => (
                  <div key={service.id} className="service-card-item">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '28px' }}>{service.icon}</span>
                        <span className="keypoint-pill" style={{ fontSize: '11px', padding: '3px 8px' }}>{service.badge}</span>
                      </div>
                      <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>{service.name}</h4>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>{service.desc}</p>
                    </div>

                    <button 
                      className="btn btn-primary"
                      onClick={() => handleLaunchService(service.id)}
                      style={{ width: '100%', justifyContent: 'center', fontSize: '13px', padding: '8px 14px', borderRadius: '10px' }}
                    >
                      🚀 Launch Tool
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
