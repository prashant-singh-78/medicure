import React, { useState, useEffect } from 'react';

export default function MedicineReminder({ addToast }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReminder, setNewReminder] = useState({
    medicine_name: '',
    dosage: '',
    time: '08:00',
    days: 'Daily'
  });

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/reminder/');
      const data = await res.json();
      if (res.ok) setReminders(data);
    } catch {
      addToast('Error loading reminders.', 'error');
    }
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newReminder.medicine_name) return;

    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/reminder/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReminder)
      });
      if (res.ok) {
        addToast('Reminder added successfully!', 'success');
        setNewReminder({ medicine_name: '', dosage: '', time: '08:00', days: 'Daily' });
        fetchReminders();
      }
    } catch {
      addToast('Failed to add reminder.', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/reminder/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReminders(reminders.filter(r => r.id !== id));
        addToast('Reminder removed.', 'info');
      }
    } catch {
      addToast('Error deleting reminder.', 'error');
    }
  };

  return (
    <div className="reminders-container">
      <div className="page-header">
        <h1>💊 Medicine Reminders</h1>
        <p>Stay on track with your health by setting up daily or custom medication alerts.</p>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        {/* Add Reminder Card */}
        <div className="card">
          <div className="card-title">➕ Add New Reminder</div>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="input-group">
              <label>Medicine Name</label>
              <input 
                type="text" 
                placeholder="e.g. Paracetamol" 
                value={newReminder.medicine_name}
                onChange={e => setNewReminder({...newReminder, medicine_name: e.target.value})}
                required
              />
            </div>
            <div className="input-group">
              <label>Dosage</label>
              <input 
                type="text" 
                placeholder="e.g. 500mg" 
                value={newReminder.dosage}
                onChange={e => setNewReminder({...newReminder, dosage: e.target.value})}
              />
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Time</label>
                <input 
                  type="time" 
                  value={newReminder.time}
                  onChange={e => setNewReminder({...newReminder, time: e.target.value})}
                  required
                />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Frequency</label>
                <select 
                  value={newReminder.days}
                  onChange={e => setNewReminder({...newReminder, days: e.target.value})}
                >
                  <option value="Daily">Daily</option>
                  <option value="Mon,Wed,Fri">Mon, Wed, Fri</option>
                  <option value="Weekend">Weekend Only</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Add Reminder</button>
          </form>
        </div>

        {/* Reminders List */}
        <div className="card">
          <div className="card-title">🕒 Your Schedule</div>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading reminders...</p>
          ) : reminders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>📅</div>
              <p>No reminders set. Add your first medicine to stay healthy!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reminders.map(r => (
                <div key={r.id} className="reminder-item" style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: 'var(--accent-green)', color: '#fff', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      💊
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{r.medicine_name} {r.dosage && `(${r.dosage})`}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>⏰ {r.time} | 🔁 {r.days}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(r.id)}
                    className="btn btn-outline" 
                    style={{ border: 'none', color: 'var(--accent-red)', background: 'rgba(239, 68, 68, 0.1)', padding: '8px' }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px', background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          💡 <strong>Pro Tip:</strong> Consistency is key! Aim to take your medication at the same time every day for maximum effectiveness.
        </p>
      </div>
    </div>
  );
}
