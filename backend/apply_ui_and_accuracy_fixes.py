"""
Script to apply UI branding, accessibility, and accuracy calibration fixes.
"""

import os

FRONTEND_PAGES = r"D:\prash projects\fy project\smart-health-assistant\frontend\src\pages"

def fix_skin_analyzer():
    path = os.path.join(FRONTEND_PAGES, "SkinAnalyzer.jsx")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Calibrate conditions list
    old_conditions = """const skinConditions = [
  { name: 'Acne & Inflammatory Papules', confidence: '94.2%', severity: 'Mild', img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=300&q=80' },
  { name: 'Eczema & Atopic Dermatitis', confidence: '91.8%', severity: 'Moderate', img: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80' },
  { name: 'Psoriasis & Plaque Lesions', confidence: '89.5%', severity: 'Requires Care', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80' }
];"""

    new_conditions = """const skinConditions = [
  { name: 'Healthy Surface Tissue', confidence: '86.7% Recall', severity: 'Baseline Healthy', img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=300&q=80' },
  { name: 'Mild Inflammatory Acne', confidence: '73.1% Recall', severity: 'Mild Papules', img: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80' },
  { name: 'Severe Cystic / Nodular Acne', confidence: '69.3% Recall', severity: 'Specialist Care', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80' },
  { name: 'Rosacea & Facial Erythema', confidence: '76.2% Recall', severity: 'Erythema Pattern', img: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=300&q=80' }
];"""

    content = content.replace(old_conditions, new_conditions)
    content = content.replace(
        "Our multi-layered ResNet computer vision models screen for over 25 common dermatological conditions:",
        "Our MobileNetV2 computer vision model (v2.0) is trained to screen for 4 surface dermatological classes with 76.3% balanced academic test accuracy:"
    )
    content = content.replace("Accuracy: {cond.confidence}", "Evaluation: {cond.confidence}")
    content = content.replace("<div className=\"card-title\">🔬 Covered AI Dermatology Models</div>", "<div className=\"card-title\">🔬 Covered Dermatology Vision Classes</div>")

    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print("Fixed SkinAnalyzer.jsx")

def fix_bmi_calculator():
    path = os.path.join(FRONTEND_PAGES, "BMICalculator.jsx")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    old_header = """            <div className="page-header">
                <h1>⚖️ Hospital BMI & Body Composition Meter</h1>
                <p>Calculate your Body Mass Index (BMI) and evaluate your body weight classification.</p>
            </div>"""

    new_header = """            <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <img src="/brand_logo.png" alt="Medicure Brand Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1.5px solid var(--accent-red)', boxShadow: '0 0 15px rgba(244, 63, 94, 0.35)', flexShrink: 0 }} />
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>Hospital BMI & Body Composition Meter</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13.5px' }}>Calculate your Body Mass Index (BMI) and evaluate your body weight classification.</p>
                </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--accent-yellow)', background: 'rgba(245, 158, 11, 0.08)', padding: '12px 18px', marginBottom: '20px' }}>
                <span style={{ color: 'var(--accent-yellow)', fontWeight: '700' }}>⚠️ Clinical Advisory:</span> BMI is a standard WHO screening index. It does not measure body fat percentage or muscle distribution.
            </div>"""

    content = content.replace(old_header, new_header)

    # Add htmlFor and id
    content = content.replace('<label className="input-label">Body Weight (kg)</label>', '<label className="input-label" htmlFor="bmi-weight-input">Body Weight (kg)</label>')
    content = content.replace('placeholder="e.g. 70"\n                                value={weight}', 'id="bmi-weight-input"\n                                placeholder="e.g. 70"\n                                value={weight}')
    
    content = content.replace('<label className="input-label">Height (cm)</label>', '<label className="input-label" htmlFor="bmi-height-input">Height (cm)</label>')
    content = content.replace('placeholder="e.g. 175"\n                                value={height}', 'id="bmi-height-input"\n                                placeholder="e.g. 175"\n                                value={height}')

    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print("Fixed BMICalculator.jsx")

def fix_medicine_suggestion():
    path = os.path.join(FRONTEND_PAGES, "MedicineSuggestion.jsx")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    old_header = """      <div className="page-header">
        <h1>🚀 Medicine Suggestion AI</h1>
        <p>Get medicine recommendations based on your symptoms or disease names using our massive Indian medicine dataset.</p>
      </div>"""

    new_header = """      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <img src="/brand_logo.png" alt="Medicure Brand Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1.5px solid var(--accent-red)', boxShadow: '0 0 15px rgba(244, 63, 94, 0.35)', flexShrink: 0 }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>Medicine Suggestion Engine</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13.5px' }}>Explore medicine recommendations based on symptoms or disease indication from our verified pharmaceutical catalog.</p>
        </div>
      </div>

      <div className="card" style={{ borderLeft: '4px solid var(--accent-yellow)', background: 'rgba(245, 158, 11, 0.08)', padding: '12px 18px', marginBottom: '20px' }}>
        <span style={{ color: 'var(--accent-yellow)', fontWeight: '700' }}>⚠️ Pharmacy Advisory:</span> Suggestions are for educational and clinical inquiry purposes only. Prescription medications require qualified physician authorization.
      </div>"""

    content = content.replace(old_header, new_header)

    content = content.replace(
        '<label className="input-label">How are you feeling? (Symptoms / Disease)</label>',
        '<label className="input-label" htmlFor="med-symptom-input">How are you feeling? (Symptoms / Disease)</label>'
    )
    content = content.replace(
        'placeholder="e.g. Fever, Cough, Diabetes, Hypertension..."',
        'id="med-symptom-input" placeholder="e.g. Fever, Cough, Diabetes, Hypertension..."'
    )

    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print("Fixed MedicineSuggestion.jsx")

def fix_healing_music():
    path = os.path.join(FRONTEND_PAGES, "HealingMusic.jsx")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    old_header = """      <div className="page-header">
        <h1>🎵 Healing Music</h1>
        <p>Listen to a curated collection of soothing music to help reduce stress and improve your mental well-being.</p>
      </div>"""

    new_header = """      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <img src="/brand_logo.png" alt="Medicure Brand Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1.5px solid var(--accent-red)', boxShadow: '0 0 15px rgba(244, 63, 94, 0.35)', flexShrink: 0 }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>Acoustic Healing & Mindfulness Music</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13.5px' }}>Listen to curated restorative acoustic frequencies to reduce physiological stress markers and promote mental well-being.</p>
        </div>
      </div>"""

    content = content.replace(old_header, new_header)

    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print("Fixed HealingMusic.jsx")

def fix_friend_chat():
    path = os.path.join(FRONTEND_PAGES, "FriendChat.jsx")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Add brand logo in FriendChat header
    old_header = """      {/* Header */}
      <div className="page-header" style={{ paddingBottom: '16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', boxShadow: '0 0 20px rgba(168,85,247,0.4)',
            flexShrink: 0
          }}>💬</div>
          <div>
            <h1 style={{ margin: 0 }}>Friend Chat</h1>
            <p style={{ margin: 0, marginTop: '2px', color: 'var(--text-muted)', fontSize: '14px' }}>
              Medi • Your caring AI companion • Always here for you 💜
            </p>
          </div>
        </div>
      </div>"""

    # Check if utf-8 decoded has something similar
    if "Friend Chat" in content and "Medi" in content:
        # replace the header block
        target_sub = '<div>\n            <h1 style={{ margin: 0 }}>Friend Chat</h1>'
        if target_sub in content:
            replacement_sub = """<img src="/brand_logo.png" alt="Medicure Brand Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1.5px solid var(--accent-red)', boxShadow: '0 0 15px rgba(244, 63, 94, 0.35)', flexShrink: 0 }} />
          <div>
            <h1 style={{ margin: 0 }}>Friend Chat</h1>"""
            content = content.replace(target_sub, replacement_sub)

    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print("Fixed FriendChat.jsx")

if __name__ == "__main__":
    fix_skin_analyzer()
    fix_bmi_calculator()
    fix_medicine_suggestion()
    fix_healing_music()
    fix_friend_chat()
    print("All UI and accuracy fixes applied successfully!")
