import React from 'react';

export default function AboutApp() {
  const features = [
    {
      title: '🎤 Voice Analysis',
      desc: 'Detect early signs of diseases like Parkinson\'s using an advanced Machine Learning model (Random Forest + Gradient Boosting). It analyzes vocal biomarkers such as Jitter, Shimmer, and HNR from your audio recordings.',
      color: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.3)'
    },
    {
      title: '💊 Medicine Verification',
      desc: 'Verify if your medicine is genuine or fake. It checks medicine batch numbers, expiry dates, and manufacturer details against a secure database to ensure your safety.',
      color: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.3)'
    },
    {
      title: '🤒 Disease Predictor',
      desc: 'Input your symptoms and get an AI-powered prediction of potential diseases. Our custom ML model provides confidence scores and recommends necessary medical tests.',
      color: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.3)'
    },
    {
      title: '📸 Skin Problem Detector',
      desc: 'Upload an image of your skin condition, and our deep learning model (TensorFlow CNN) will analyze it to detect issues like Acne, Melanoma, or other common skin diseases.',
      color: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)'
    },
    {
      title: '📄 Report Analyzer',
      desc: 'Upload your medical reports (PDF or Images). The system uses Optical Character Recognition (OCR) and Generative AI to summarize the report into simple, understandable language.',
      color: 'rgba(139, 92, 246, 0.1)',
      border: 'rgba(139, 92, 246, 0.3)'
    },
    {
      title: '🆘 Emergency SOS',
      desc: 'Instantly send your live location to your emergency contacts with a single click during critical situations. Stay safe and connected.',
      color: 'rgba(220, 38, 38, 0.1)',
      border: 'rgba(220, 38, 38, 0.3)'
    },
    {
      title: '🚑 Ambulance Services',
      desc: 'Find and book nearby available ambulances in real-time. Connect with drivers quickly during medical emergencies to save precious time.',
      color: 'rgba(234, 88, 12, 0.1)',
      border: 'rgba(234, 88, 12, 0.3)'
    },
    {
      title: '👨‍⚕️ Find Doctors',
      desc: 'Browse a directory of specialized doctors in your area. View their experience, contact details, and current availability to schedule consultations.',
      color: 'rgba(14, 165, 233, 0.1)',
      border: 'rgba(14, 165, 233, 0.3)'
    },
    {
      title: '🧘 Meditation',
      desc: 'Take care of your mental health with our curated meditation timers and guided breathing exercises to relax your mind and improve focus.',
      color: 'rgba(20, 184, 166, 0.1)',
      border: 'rgba(20, 184, 166, 0.3)'
    },
    {
      title: '🎵 Healing Music',
      desc: 'A dedicated YouTube Music integrated healing playlist. Proven to reduce stress, lower blood pressure, and help you fall asleep faster.',
      color: 'rgba(217, 70, 239, 0.1)',
      border: 'rgba(217, 70, 239, 0.3)'
    },
    {
      title: '🪴 Ayurveda & BMI',
      desc: 'Calculate your Body Mass Index (BMI) and explore traditional Ayurvedic remedies and natural health tips for a holistic approach to wellness.',
      color: 'rgba(132, 204, 22, 0.1)',
      border: 'rgba(132, 204, 22, 0.3)'
    }
  ];

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div className="page-header">
        <h1>ℹ️ About Our Platform</h1>
        <p>A comprehensive overview of all the AI-powered health features available in Medicure.</p>
      </div>

      <div className="card" style={{ marginBottom: '30px', background: 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(230,57,70,0.05))', borderColor: 'rgba(212,175,55,0.3)' }}>
        <h3 style={{ marginBottom: '15px', color: 'var(--accent-blue)', fontSize: '20px' }}>Our Mission</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '15px' }}>
          Smart Healthcare Assistant (Medicure) is designed to make healthcare accessible, intelligent, and secure. 
          By combining cutting-edge Machine Learning, Deep Learning, and Generative AI, we aim to provide you with a personal medical assistant that helps you verify medicines, analyze symptoms, understand medical reports, and maintain mental wellness.
        </p>
      </div>

      <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)', fontSize: '22px' }}>Detailed Features</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {features.map((feat, index) => (
          <div key={index} className="card" style={{ background: feat.color, borderColor: feat.border, margin: 0, transition: 'transform 0.3s ease' }} 
               onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
               onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <h3 style={{ fontSize: '18px', marginBottom: '12px', color: 'var(--text-primary)' }}>{feat.title}</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
