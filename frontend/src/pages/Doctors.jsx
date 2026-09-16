import React, { useState, useEffect } from 'react';

const defaultSpecialists = [
  {
    name: 'Dr. Rajesh Sharma',
    specialization: 'Senior Cardiologist & Heart Surgeon',
    experience: '16 Years',
    contact: '+91 98765 43210',
    location: 'Medicure Main Hospital, Delhi',
    rating: '4.9 ★',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
    available: 'Mon - Sat (9 AM - 4 PM)'
  },
  {
    name: 'Dr. Ananya Roy',
    specialization: 'Neurologist & Brain Specialist',
    experience: '12 Years',
    contact: '+91 98123 45678',
    location: 'Medicure Neuro Center, Mumbai',
    rating: '4.8 ★',
    image: 'https://images.unsplash.com/photo-1594824813566-88855ce78907?auto=format&fit=crop&w=400&q=80',
    available: 'Mon - Fri (10 AM - 5 PM)'
  },
  {
    name: 'Dr. Vikram Patel',
    specialization: 'Dermatologist & Cosmetologist',
    experience: '10 Years',
    contact: '+91 97654 32109',
    location: 'Medicure Skin & Laser Clinic, Bangalore',
    rating: '4.9 ★',
    image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
    available: 'Tue - Sun (11 AM - 6 PM)'
  },
  {
    name: 'Dr. Priya Mehta',
    specialization: 'General Physician & Critical Care',
    experience: '14 Years',
    contact: '+91 98989 12345',
    location: 'Medicure Emergency ER, Hyderabad',
    rating: '5.0 ★',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    available: '24/7 Virtual Consultation'
  }
];

export default function Doctors({ addToast }) {
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingModal, setBookingModal] = useState(null);
  const [formData, setFormData] = useState({ name: '', specialization: '', experience: '', contact: '', location: '' });

  const fetchDoctors = () => {
    fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/doctors/list')
      .then(res => res.json())
      .then(data => { 
        const combined = [...defaultSpecialists, ...data];
        setDoctors(combined); 
        setLoading(false); 
      })
      .catch(() => { 
        setDoctors(defaultSpecialists);
        setLoading(false); 
      });
  };

  useEffect(() => { fetchDoctors(); }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/doctors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        addToast('Doctor registered successfully!', 'success');
        setShowForm(false);
        setFormData({ name: '', specialization: '', experience: '', contact: '', location: '' });
        fetchDoctors();
      }
    } catch {
      addToast('Failed to register doctor.', 'error');
    }
  };

  const confirmAppointment = (docName) => {
    addToast(`Appointment request sent to ${docName}. Confirmation SMS sent!`, 'success');
    setBookingModal(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1>👨‍⚕️ Specialist Doctors & Virtual OPD</h1>
          <p>Book video or in-clinic consultations with certified medical specialists across departments.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✖ Close Form' : '➕ Register Practice'}
        </button>
      </div>

      {/* Guide Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(6, 182, 212, 0.05))', border: '1px solid var(--accent-blue)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '28px' }}>📖</div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--accent-cyan)', marginBottom: '4px' }}>Kya Use Hai & Kaise Use Karein (Doctors Directory Guide)</div>
            <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <strong>• Iska Use Kya Hai?</strong> Yeh portal hospital ke certified cardiologists, neurologists, dermatologists aur general physicians se online video consultation ya hospital appointment book karne ke liye hai.<br/>
              <strong>• Kaise Use Karein?</strong>
              <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
                <li>Doctor ki specialty, hospital unit, aur availability check karein.</li>
                <li><strong>"📅 Book OPD Appointment"</strong> button par click karein.</li>
                <li>Date aur Mode (HD Video Call ya In-Hospital Visit) select karke Confirm karein.</li>
                <li>Koi bhi doctor apni practice list karne ke liye top-right <strong>"➕ Register Practice"</strong> button use kar sakte hain.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ maxWidth: '640px', margin: '0 auto 30px', border: '1px solid var(--accent-blue)' }}>
          <div className="card-title">👨‍⚕️ Medical Specialist Registration</div>
          <form onSubmit={handleRegister} className="medicine-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Full Doctor Name (e.g. Dr. Ramesh Kumar)</label>
              <input className="input-field" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Dr. John Doe, MD" />
            </div>
            <div className="input-group">
              <label className="input-label">Specialization</label>
              <input className="input-field" required value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} placeholder="Cardiologist, Neurologist..." />
            </div>
            <div className="input-group">
              <label className="input-label">Experience (Years)</label>
              <input className="input-field" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} placeholder="10 Years" />
            </div>
            <div className="input-group">
              <label className="input-label">Contact / Helpline</label>
              <input className="input-field" required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} placeholder="+91 9876543210" />
            </div>
            <div className="input-group">
              <label className="input-label">Hospital / Location</label>
              <input className="input-field" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Medicure Hospital, City" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', justifyContent: 'center' }}>Save Registration</button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}><div className="spinner" /></div>
      ) : (
        <div className="medicine-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {doctors.map((doc, i) => (
            <div key={i} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <img 
                  src={doc.image || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80'} 
                  alt={doc.name} 
                  className="doctor-avatar-img"
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="card-title" style={{ marginBottom: '2px', fontSize: '17px' }}>{doc.name}</div>
                    <span style={{ fontSize: '12px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-yellow)', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>{doc.rating || '4.9 ★'}</span>
                  </div>
                  <div style={{ fontSize: '13.5px', color: 'var(--accent-cyan)', fontWeight: '700' }}>{doc.specialization}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>⏱️ {doc.experience || 'Experienced'}</div>
                </div>
              </div>

              <div className="detail-table" style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Hospital Unit</span>
                  <span>{doc.location || 'Medicure Medical Center'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Emergency Line</span>
                  <span style={{ color: 'var(--accent-green)', fontWeight: '700' }}>{doc.contact}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Availability</span>
                  <span style={{ fontSize: '12px', color: 'var(--accent-blue)', fontWeight: '600' }}>{doc.available || 'Mon - Sat'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, justifyContent: 'center', fontSize: '13px' }}
                  onClick={() => setBookingModal(doc)}
                >
                  📅 Book OPD Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {bookingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px' }}>
          <div className="card animate-fade-in" style={{ maxWidth: '480px', width: '100%', border: '1px solid var(--accent-blue)', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            <div className="card-title" style={{ justifyContent: 'space-between' }}>
              <span>📅 OPD Appointment Booking</span>
              <button onClick={() => setBookingModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>✖</button>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '12px', background: 'var(--bg-input)', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border)' }}>
              <img src={bookingModal.image || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80'} alt="" className="doctor-avatar-img" style={{ width: '48px', height: '48px' }} />
              <div>
                <div style={{ fontWeight: '800' }}>{bookingModal.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>{bookingModal.specialization}</div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Select Consultation Date</label>
              <input type="date" className="input-field" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>

            <div className="input-group">
              <label className="input-label">Consultation Mode</label>
              <select className="input-field">
                <option>📹 HD Video Consultation (Virtual)</option>
                <option>🏥 In-Hospital Clinic Visit</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setBookingModal(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => confirmAppointment(bookingModal.name)}>Confirm Booking</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
